// src/games/Valorant3D2/systems/NetworkSystem.js
import mqtt from 'mqtt'

// High-speed public cloud WebSocket MQTT brokers with automatic fallback
const MQTT_BROKERS = [
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://broker.emqx.io:8084/mqtt'
]

export class NetworkSystem {
  constructor() {
    this.client = null
    this.currentBrokerIndex = 0
    this.connected = false
    this.isHost = false
    this.currentRoom = null
    this.myPlayer = null
    this.listeners = new Map()
    this.knownPublicRooms = new Map()
    this.heartbeatInterval = null
    this.joinRetryInterval = null
    this.discoveryInterval = null
    this.connectionStatus = 'DISCONNECTED' // 'CONNECTING', 'CONNECTED', 'ERROR'
    this.subscribedTopics = new Set()

    // Local mesh via BroadcastChannel
    this.bc = null
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.bc = new BroadcastChannel('VALORANT3D_LOCAL_MESH')
        this.setupBroadcastChannel()
      } catch (e) {
        console.warn('BroadcastChannel notice:', e)
      }
    }

    this.connect()
  }

  connect() {
    if (this.client && (this.client.connected || this.client.reconnecting)) return

    const brokerUrl = MQTT_BROKERS[this.currentBrokerIndex % MQTT_BROKERS.length]
    this.connectionStatus = 'CONNECTING'
    this.emitInternal('network_status', 'CONNECTING')

    const clientId = `v3d_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2500,
        keepalive: 30
      })

      this.client.on('connect', () => {
        console.log(`✅ [Cloud Realtime] Conectado exitosamente al broker MQTT (${brokerUrl}) con ID: ${clientId}`)
        this.connected = true
        this.connectionStatus = 'CONNECTED'
        this.emitInternal('network_status', 'CONNECTED')

        // Subscribe to global lobby discovery
        this.subscribeTopic('valo3d/global/lobby')

        // Ask for active rooms
        this.publishMessage('valo3d/global/get_rooms', { type: 'GET_ROOMS' })

        // Resubscribe to current room topic if exists
        if (this.currentRoom && this.currentRoom.id) {
          this.subscribeRoomTopics(this.currentRoom.id)
        }
      })

      this.client.on('message', (topic, message) => {
        try {
          const payload = JSON.parse(message.toString())
          this.handleIncomingMqttMessage(topic, payload)
        } catch (err) {
          // ignore malformed payloads
        }
      })

      this.client.on('error', (err) => {
        console.warn('[Cloud Realtime] Aviso de conexión:', err?.message || err)
        this.connectionStatus = 'CONNECTING'
        this.emitInternal('network_status', 'CONNECTING')
      })

      this.client.on('offline', () => {
        this.connected = false
        this.connectionStatus = 'CONNECTING'
        this.emitInternal('network_status', 'CONNECTING')
      })

      this.client.on('close', () => {
        this.connected = false
      })
    } catch (e) {
      console.warn('[Cloud Realtime] Error al inicializar MQTT:', e)
    }

    // Start discovery cleanup ticker (removes expired rooms)
    if (!this.discoveryInterval) {
      this.discoveryInterval = setInterval(() => {
        const now = Date.now()
        let changed = false
        for (const [id, r] of this.knownPublicRooms.entries()) {
          if (r.lastSeen && (now - r.lastSeen > 8000)) {
            this.knownPublicRooms.delete(id)
            changed = true
          }
        }
        if (changed) {
          this.emitInternal('rooms_list', Array.from(this.knownPublicRooms.values()))
        }
      }, 3000)
    }
  }

  subscribeTopic(topic) {
    if (!this.client || !this.connected) return
    this.subscribedTopics.add(topic)
    try {
      this.client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) console.warn('Subscribe notice:', topic, err)
      })
    } catch (e) {}
  }

  unsubscribeTopic(topic) {
    if (!this.client) return
    this.subscribedTopics.delete(topic)
    try {
      this.client.unsubscribe(topic)
    } catch (e) {}
  }

  publishMessage(topic, data) {
    // 1. MQTT Cloud Publish
    if (this.client && this.connected) {
      try {
        this.client.publish(topic, JSON.stringify(data), { qos: 0 })
      } catch (e) {}
    }
    // 2. BroadcastChannel Local Mesh
    if (this.bc) {
      try {
        this.bc.postMessage({ topic, data })
      } catch (e) {}
    }
  }

  setupBroadcastChannel() {
    if (!this.bc) return
    this.bc.onmessage = (e) => {
      const msg = e.data
      if (!msg || !msg.topic || !msg.data) return
      this.handleIncomingMqttMessage(msg.topic, msg.data)
    }
  }

  subscribeRoomTopics(roomId) {
    const clean = (roomId || '').trim().toUpperCase()
    this.subscribeTopic(`valo3d/room/${clean}/#`)
  }

  handleIncomingMqttMessage(topic, payload) {
    if (!payload || !payload.type) return

    // --- GLOBAL LOBBY DISCOVERY ---
    if (topic === 'valo3d/global/get_rooms') {
      if (this.isHost && this.currentRoom && this.currentRoom.status === 'lobby') {
        this.publishMessage('valo3d/global/lobby', {
          type: 'ANNOUNCE_ROOM',
          room: this.currentRoom,
          lastSeen: Date.now()
        })
      }
      return
    }

    if (topic === 'valo3d/global/lobby' && payload.type === 'ANNOUNCE_ROOM') {
      if (payload.room && payload.room.id) {
        this.knownPublicRooms.set(payload.room.id, {
          ...payload.room,
          lastSeen: Date.now(),
          playerCount: payload.room.players?.length || 1
        })
        this.emitInternal('rooms_list', Array.from(this.knownPublicRooms.values()))
      }
      return
    }

    // Filter messages for my current room
    if (!this.currentRoom || !this.currentRoom.id) return
    const myRoomCode = this.currentRoom.id.toUpperCase()
    const msgRoomCode = (payload.roomId || '').toUpperCase()

    if (msgRoomCode && msgRoomCode !== myRoomCode) return

    // --- HOST HANDLING INCOMING CLIENT REQUESTS ---
    if (this.isHost) {
      if (payload.type === 'JOIN_REQ') {
        if (payload.player) {
          const existsIdx = this.currentRoom.players.findIndex(p => p.id === payload.player.id)
          if (existsIdx === -1) {
            this.currentRoom.players.push(payload.player)
          } else {
            this.currentRoom.players[existsIdx] = payload.player
          }
          this.broadcastRoomUpdate()
        }
      } else if (payload.type === 'SWITCH_TEAM') {
        const p = this.currentRoom.players.find(x => x.id === payload.playerId)
        if (p) {
          p.team = payload.targetTeam
          this.broadcastRoomUpdate()
        }
      } else if (payload.type === 'SELECT_AGENT') {
        const p = this.currentRoom.players.find(x => x.id === payload.playerId)
        if (p) {
          p.agentId = payload.agentId
          this.broadcastRoomUpdate()
        }
      } else if (payload.type === 'LOCK_AGENT') {
        const p = this.currentRoom.players.find(x => x.id === payload.playerId)
        if (p) {
          p.isLocked = true
          p.isReady = true
          this.broadcastRoomUpdate()
        }
      } else if (payload.type === 'PLAYER_LEFT') {
        this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== payload.playerId)
        this.broadcastRoomUpdate()
        this.emitInternal('player_left', { id: payload.playerId, name: payload.playerName, isHost: payload.isHost })
      }
    }

    // --- ALL PLAYERS (HOST & CLIENTS) HANDLING BROADCASTS ---
    if (payload.type === 'ROOM_UPDATE') {
      this.currentRoom = payload.room
      if (this.joinRetryInterval) clearInterval(this.joinRetryInterval)
      this.emitInternal('room_updated', payload.room)
    } else if (payload.type === 'KICK_PLAYER') {
      if (this.myPlayer && payload.targetPlayerId === this.myPlayer.id) {
        this.leaveRoom(false)
        this.emitInternal('kicked_from_room', { reason: 'Has sido expulsado de la sala por el anfitrión.' })
      } else {
        this.emitInternal('player_kicked', { id: payload.targetPlayerId })
      }
    } else if (payload.type === 'PLAYER_LEFT' && !this.isHost) {
      this.emitInternal('player_left', { id: payload.playerId, name: payload.playerName, isHost: payload.isHost })
    } else if (payload.type === 'START_MATCH') {
      this.currentRoom = payload.room || this.currentRoom
      this.currentRoom.status = 'in_game'
      this.emitInternal('match_started', this.currentRoom)
    } else if (payload.type === 'MATCH_FINISHED') {
      if (this.currentRoom) this.currentRoom.status = 'lobby'
      this.emitInternal('match_finished', payload.data)
    } else if (payload.type === 'PLAYER_SYNC') {
      if (this.myPlayer && payload.data.id !== this.myPlayer.id) {
        this.emitInternal('player_moved', payload.data)
      }
    } else if (payload.type === 'GAME_EVENT') {
      if (this.myPlayer && payload.event.senderId !== this.myPlayer.id) {
        this.emitInternal('game_event', payload.event)
      }
    } else if (payload.type === 'PLAYER_HIT') {
      this.emitInternal('player_took_damage', payload.data)
    } else if (payload.type === 'ROUND_SYNC') {
      this.emitInternal('round_sync', payload.data)
    } else if (payload.type === 'CHAT') {
      this.emitInternal('chat_received', payload.chat)
    }
  }

  broadcastRoomUpdate() {
    if (!this.currentRoom) return
    this.publishMessage(`valo3d/room/${this.currentRoom.id}/events`, {
      type: 'ROOM_UPDATE',
      roomId: this.currentRoom.id,
      room: this.currentRoom
    })
    this.emitInternal('room_updated', this.currentRoom)
  }

  on(event, cb) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(cb)
  }

  off(event, cb) {
    if (this.listeners.has(event)) {
      const list = this.listeners.get(event).filter(fn => fn !== cb)
      this.listeners.set(event, list)
    }
  }

  emitInternal(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try { cb(data) } catch (err) { console.error('Listener error:', err) }
      }
    }
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // --- HOST: CREATE ROOM ---
  createRoom(roomName, playerName, team = 'attackers', customConfig = null) {
    this.connect()
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
    if (this.joinRetryInterval) clearInterval(this.joinRetryInterval)

    const roomId = this.generateCode()
    this.isHost = true

    const hostPlayer = {
      id: `host_${Date.now()}`,
      name: playerName || 'Operador 1',
      team: team || 'attackers',
      agentId: 'jett',
      isLocked: false,
      isReady: true,
      isHost: true,
      pos: { x: team === 'attackers' ? -26.0 : 26.0, y: 1.7, z: 0 },
      health: 100,
      armor: 50,
      weapon: 'ak74u'
    }

    const defaultCustomConfig = {
      gameType: '1V1_DUEL',
      enableBots: false,
      enemyBotCount: 0,
      allyBotCount: 0,
      maxRounds: 5,
      startingCredits: 5000,
      infiniteAmmo: false,
      infiniteAbilities: false,
      buyPhaseDuration: 15,
      mapId: 'kasbah_temple'
    }

    const room = {
      id: roomId,
      name: roomName || `Sala ${roomId}`,
      status: 'lobby',
      hostId: hostPlayer.id,
      players: [hostPlayer],
      customConfig: customConfig ? { ...defaultCustomConfig, ...customConfig } : defaultCustomConfig
    }

    this.currentRoom = room
    this.myPlayer = hostPlayer

    // Subscribe to room topic
    this.subscribeRoomTopics(roomId)

    // Periodic lobby announcement & heartbeat (every 1.5s)
    this.heartbeatInterval = setInterval(() => {
      if (this.isHost && this.currentRoom && this.currentRoom.status === 'lobby') {
        this.publishMessage('valo3d/global/lobby', {
          type: 'ANNOUNCE_ROOM',
          room: this.currentRoom,
          lastSeen: Date.now()
        })
        this.broadcastRoomUpdate()
      }
    }, 1500)

    this.emitInternal('room_joined', { room, player: hostPlayer })
    return room
  }

  // --- CLIENT: JOIN ROOM ---
  joinRoom(roomId, playerName, team = 'defenders') {
    this.connect()
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
    if (this.joinRetryInterval) clearInterval(this.joinRetryInterval)

    const cleanCode = (roomId || '').trim().toUpperCase()
    this.isHost = false

    const joinPlayer = {
      id: `peer_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: playerName || 'Operador 2',
      team: team || 'defenders',
      agentId: 'reyna',
      isLocked: false,
      isReady: false,
      isHost: false,
      pos: { x: team === 'attackers' ? -26.0 : 26.0, y: 1.7, z: 5.0 },
      health: 100,
      armor: 50,
      weapon: 'ak74u'
    }

    const placeholderRoom = {
      id: cleanCode,
      name: `Sala ${cleanCode}`,
      status: 'lobby',
      hostId: 'host',
      players: [joinPlayer],
      customConfig: {
        gameType: '1V1_DUEL',
        enableBots: false,
        enemyBotCount: 0,
        allyBotCount: 0,
        maxRounds: 5,
        startingCredits: 5000,
        infiniteAmmo: false,
        infiniteAbilities: false,
        buyPhaseDuration: 15,
        mapId: 'kasbah_temple'
      }
    }

    this.currentRoom = placeholderRoom
    this.myPlayer = joinPlayer

    // Subscribe to room topic
    this.subscribeRoomTopics(cleanCode)

    const sendJoinRequest = () => {
      this.publishMessage(`valo3d/room/${cleanCode}/actions`, {
        type: 'JOIN_REQ',
        roomId: cleanCode,
        player: joinPlayer
      })
    }

    // Send join request immediately
    sendJoinRequest()

    // Retry sending join request every 800ms until room sync confirmed
    this.joinRetryInterval = setInterval(() => {
      if (!this.isHost && this.currentRoom && this.currentRoom.players.length <= 1) {
        sendJoinRequest()
      }
    }, 800)

    this.emitInternal('room_joined', { room: placeholderRoom, player: joinPlayer })
  }

  switchTeam(roomId, targetTeam) {
    if (this.myPlayer) this.myPlayer.team = targetTeam
    if (this.isHost && this.currentRoom) {
      const p = this.currentRoom.players.find(x => x.id === this.myPlayer.id)
      if (p) p.team = targetTeam
      this.broadcastRoomUpdate()
    } else {
      this.publishMessage(`valo3d/room/${roomId}/actions`, {
        type: 'SWITCH_TEAM',
        roomId,
        playerId: this.myPlayer?.id,
        targetTeam
      })
    }
  }

  selectAgent(roomId, agentId) {
    if (this.myPlayer) this.myPlayer.agentId = agentId
    if (this.isHost && this.currentRoom) {
      const p = this.currentRoom.players.find(x => x.id === this.myPlayer.id)
      if (p) p.agentId = agentId
      this.broadcastRoomUpdate()
    } else {
      this.publishMessage(`valo3d/room/${roomId}/actions`, {
        type: 'SELECT_AGENT',
        roomId,
        playerId: this.myPlayer?.id,
        agentId
      })
    }
  }

  lockAgent(roomId) {
    if (this.myPlayer) {
      this.myPlayer.isLocked = true
      this.myPlayer.isReady = true
    }
    if (this.isHost && this.currentRoom) {
      const p = this.currentRoom.players.find(x => x.id === this.myPlayer.id)
      if (p) {
        p.isLocked = true
        p.isReady = true
      }
      this.broadcastRoomUpdate()
    } else {
      this.publishMessage(`valo3d/room/${roomId}/actions`, {
        type: 'LOCK_AGENT',
        roomId,
        playerId: this.myPlayer?.id
      })
    }
  }

  updateRoomConfig(roomId, newConfig) {
    if (this.isHost && this.currentRoom) {
      this.currentRoom.customConfig = { ...(this.currentRoom.customConfig || {}), ...newConfig }
      this.broadcastRoomUpdate()
    }
  }

  startMatch(roomId) {
    if (this.isHost && this.currentRoom) {
      this.currentRoom.status = 'in_game'
      this.publishMessage(`valo3d/room/${roomId}/events`, {
        type: 'START_MATCH',
        roomId,
        room: this.currentRoom
      })
      this.emitInternal('match_started', this.currentRoom)
    }
  }

  endMatch(roomId, matchData) {
    if (this.isHost && this.currentRoom) {
      this.currentRoom.status = 'lobby'
      this.publishMessage(`valo3d/room/${roomId}/events`, {
        type: 'MATCH_FINISHED',
        roomId,
        data: matchData
      })
      this.broadcastRoomUpdate()
      this.emitInternal('match_finished', matchData)
    }
  }

  syncPlayer(roomId, data) {
    this.publishMessage(`valo3d/room/${roomId}/sync`, {
      type: 'PLAYER_SYNC',
      roomId,
      data: { id: this.myPlayer?.id || 'local', ...data }
    })
  }

  sendGameEvent(roomId, event) {
    this.publishMessage(`valo3d/room/${roomId}/events`, {
      type: 'GAME_EVENT',
      roomId,
      event: { senderId: this.myPlayer?.id || 'local', ...event }
    })
  }

  sendHit(roomId, targetId, damage, weapon, headshot, killerName) {
    this.publishMessage(`valo3d/room/${roomId}/hits`, {
      type: 'PLAYER_HIT',
      roomId,
      data: {
        targetId,
        damage,
        shooterId: this.myPlayer?.id || 'local',
        weapon,
        headshot,
        killerName: killerName || 'Operador'
      }
    })
  }

  broadcastRoundSync(roomId, roundData) {
    this.publishMessage(`valo3d/room/${roomId}/rounds`, {
      type: 'ROUND_SYNC',
      roomId,
      data: roundData
    })
  }

  sendChat(roomId, text, teamOnly = false) {
    const chat = {
      id: Date.now() + Math.random(),
      senderName: this.myPlayer?.name || 'Operador',
      team: this.myPlayer?.team || 'attackers',
      text,
      teamOnly,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    this.publishMessage(`valo3d/room/${roomId}/chat`, {
      type: 'CHAT',
      roomId,
      chat
    })
    this.emitInternal('chat_received', chat)
  }

  kickPlayer(roomId, targetPlayerId) {
    if (!this.isHost || !this.currentRoom) return
    const cleanRoom = (roomId || this.currentRoom.id).trim().toUpperCase()
    this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== targetPlayerId)
    this.publishMessage(`valo3d/room/${cleanRoom}/actions`, {
      type: 'KICK_PLAYER',
      roomId: cleanRoom,
      targetPlayerId
    })
    this.broadcastRoomUpdate()
  }

  leaveRoom(notify = true) {
    if (notify && this.currentRoom && this.myPlayer) {
      const cleanRoom = this.currentRoom.id.trim().toUpperCase()
      this.publishMessage(`valo3d/room/${cleanRoom}/actions`, {
        type: 'PLAYER_LEFT',
        roomId: cleanRoom,
        playerId: this.myPlayer.id,
        playerName: this.myPlayer.name,
        isHost: this.isHost
      })
    }
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
    if (this.joinRetryInterval) clearInterval(this.joinRetryInterval)
    if (this.currentRoom && this.currentRoom.id) {
      this.unsubscribeTopic(`valo3d/room/${this.currentRoom.id}/#`)
    }
    this.currentRoom = null
    this.isHost = false
  }
}
