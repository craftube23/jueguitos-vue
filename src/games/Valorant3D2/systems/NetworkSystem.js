// src/games/Valorant3D2/systems/NetworkSystem.js
import { Peer } from 'peerjs'

export class NetworkSystem {
  constructor() {
    this.peer = null
    this.connections = [] // Host: list of client DataConnections
    this.hostConn = null   // Client: DataConnection to host
    this.connected = false
    this.isHost = false
    this.currentRoom = null
    this.myPlayer = null
    this.listeners = new Map()
    this.knownPublicRooms = new Map()
    this.heartbeatInterval = null
    this.joinRetryInterval = null
    this.connectRetryTimer = null
    this.connectionStatus = 'DISCONNECTED' // 'CONNECTING', 'CONNECTED', 'ERROR'

    // High-reliability STUN + Free OpenRelay TURN configuration (Bypasses home firewalls / NAT worldwide)
    this.peerIceConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    }

    // BroadcastChannel local cross-tab mesh
    this.bc = null
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.bc = new BroadcastChannel('VALORANT3D_LOCAL_MESH')
        this.setupBroadcastChannel()
      } catch (e) {
        console.warn('BroadcastChannel error:', e)
      }
    }
  }

  connect() {
    this.connected = true
  }

  setupBroadcastChannel() {
    if (!this.bc) return
    this.bc.onmessage = (e) => {
      const msg = e.data
      if (!msg || !msg.type) return

      // --- DISCOVERY & ANNOUNCEMENTS ---
      if (msg.type === 'BC_GET_ROOMS') {
        if (this.isHost && this.currentRoom && this.currentRoom.status === 'lobby') {
          this.bc.postMessage({ type: 'BC_ANNOUNCE_ROOM', room: this.cloneRoom() })
        }
      } else if (msg.type === 'BC_ANNOUNCE_ROOM') {
        if (msg.room && msg.room.id) {
          this.knownPublicRooms.set(msg.room.id, msg.room)
          this.emitInternal('rooms_list', Array.from(this.knownPublicRooms.values()))
        }
      }

      // --- JOINING ROOM VIA BROADCAST CHANNEL ---
      else if (msg.type === 'BC_JOIN_REQ') {
        if (this.isHost && this.currentRoom && (this.currentRoom.id.toUpperCase() === (msg.roomId || '').toUpperCase())) {
          this.addOrUpdatePlayerInHost(msg.player)
          const roomClone = this.cloneRoom()
          this.bc.postMessage({ type: 'BC_ROOM_UPDATED', room: roomClone })
          this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
          this.emitInternal('room_updated', roomClone)
        }
      }

      // --- LOBBY ACTIONS ---
      else if (msg.type === 'BC_SWITCH_TEAM' && this.isHost && this.currentRoom && (this.currentRoom.id.toUpperCase() === (msg.roomId || '').toUpperCase())) {
        const p = this.currentRoom.players.find(x => x.id === msg.playerId)
        if (p) {
          p.team = msg.targetTeam
          const roomClone = this.cloneRoom()
          this.bc.postMessage({ type: 'BC_ROOM_UPDATED', room: roomClone })
          this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
          this.emitInternal('room_updated', roomClone)
        }
      } else if (msg.type === 'BC_SELECT_AGENT' && this.isHost && this.currentRoom && (this.currentRoom.id.toUpperCase() === (msg.roomId || '').toUpperCase())) {
        const p = this.currentRoom.players.find(x => x.id === msg.playerId)
        if (p) {
          p.agentId = msg.agentId
          const roomClone = this.cloneRoom()
          this.bc.postMessage({ type: 'BC_ROOM_UPDATED', room: roomClone })
          this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
          this.emitInternal('room_updated', roomClone)
        }
      } else if (msg.type === 'BC_LOCK_AGENT' && this.isHost && this.currentRoom && (this.currentRoom.id.toUpperCase() === (msg.roomId || '').toUpperCase())) {
        const p = this.currentRoom.players.find(x => x.id === msg.playerId)
        if (p) {
          p.isLocked = true
          p.isReady = true
          const roomClone = this.cloneRoom()
          this.bc.postMessage({ type: 'BC_ROOM_UPDATED', room: roomClone })
          this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
          this.emitInternal('room_updated', roomClone)
        }
      } else if (msg.type === 'BC_ROOM_UPDATED' && this.currentRoom && (this.currentRoom.id.toUpperCase() === (msg.room.id || '').toUpperCase())) {
        this.handleClientRoomUpdate(msg.room)
      } else if (msg.type === 'BC_START_MATCH' && this.currentRoom && (this.currentRoom.id.toUpperCase() === (msg.roomId || '').toUpperCase())) {
        this.currentRoom = msg.room || this.currentRoom
        this.currentRoom.status = 'in_game'
        this.emitInternal('match_started', this.cloneRoom())
      }

      // --- IN-GAME REAL-TIME SYNC ---
      else if (msg.type === 'BC_PLAYER_SYNC' && this.currentRoom && (this.currentRoom.id.toUpperCase() === (msg.roomId || '').toUpperCase())) {
        if (this.myPlayer && msg.data.id !== this.myPlayer.id) {
          this.emitInternal('player_moved', msg.data)
        }
      } else if (msg.type === 'BC_GAME_EVENT' && this.currentRoom && (this.currentRoom.id.toUpperCase() === (msg.roomId || '').toUpperCase())) {
        if (this.myPlayer && msg.event.senderId !== this.myPlayer.id) {
          this.emitInternal('game_event', msg.event)
        }
      } else if (msg.type === 'BC_PLAYER_HIT' && this.currentRoom && (this.currentRoom.id.toUpperCase() === (msg.roomId || '').toUpperCase())) {
        this.emitInternal('player_took_damage', msg.data)
      } else if (msg.type === 'BC_CHAT' && this.currentRoom && (this.currentRoom.id.toUpperCase() === (msg.roomId || '').toUpperCase())) {
        this.emitInternal('chat_received', msg.chat)
      }
    }

    // Ask active hosts for available rooms
    this.bc.postMessage({ type: 'BC_GET_ROOMS' })
  }

  cloneRoom() {
    if (!this.currentRoom) return null
    return JSON.parse(JSON.stringify(this.currentRoom))
  }

  addOrUpdatePlayerInHost(newPlayer) {
    if (!this.currentRoom || !newPlayer) return
    let finalName = newPlayer.name || 'Operador'
    const nameClash = this.currentRoom.players.some(p => p.id !== newPlayer.id && p.name.toLowerCase() === finalName.toLowerCase())
    if (nameClash) {
      finalName = `${finalName} 2`
    }
    newPlayer.name = finalName

    const existingIdx = this.currentRoom.players.findIndex(p => p.id === newPlayer.id)
    if (existingIdx === -1) {
      this.currentRoom.players.push(newPlayer)
    } else {
      this.currentRoom.players[existingIdx] = { ...this.currentRoom.players[existingIdx], ...newPlayer }
    }
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
    if (this.peer) {
      try { this.peer.destroy() } catch (e) {}
    }
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
    if (this.joinRetryInterval) clearInterval(this.joinRetryInterval)
    if (this.connectRetryTimer) clearInterval(this.connectRetryTimer)

    const roomId = this.generateCode()
    const peerRoomId = `v3d_${roomId.toLowerCase()}`

    this.isHost = true
    this.connections = []
    this.connectionStatus = 'CONNECTING'

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
    this.connected = true

    // Continuous Room Announcement and Sync Heartbeat (every 1s)
    this.heartbeatInterval = setInterval(() => {
      if (this.isHost && this.currentRoom && this.currentRoom.status === 'lobby') {
        const roomClone = this.cloneRoom()
        if (this.bc) {
          this.bc.postMessage({ type: 'BC_ANNOUNCE_ROOM', room: roomClone })
          this.bc.postMessage({ type: 'BC_ROOM_UPDATED', room: roomClone })
        }
        this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
      }
    }, 1000)

    try {
      this.peer = new Peer(peerRoomId, {
        config: this.peerIceConfig
      })

      this.peer.on('open', (id) => {
        console.log('✅ PeerJS Host Ready with ID:', id)
        this.connected = true
        this.connectionStatus = 'CONNECTED'
        this.emitInternal('network_status', 'CONNECTED')
        this.emitInternal('room_joined', { room: this.cloneRoom(), player: hostPlayer })
      })

      this.peer.on('connection', (conn) => {
        console.log('✅ PeerJS Host received incoming connection from peer:', conn.peer)
        const setupConn = () => {
          if (!this.connections.includes(conn)) {
            this.connections.push(conn)
          }
          // Send instant full room state to newly connected client
          try {
            conn.send({ type: 'ROOM_UPDATE', room: this.cloneRoom() })
          } catch (e) {}
        }

        if (conn.open) setupConn()
        else conn.on('open', setupConn)

        conn.on('data', (data) => {
          if (!this.connections.includes(conn)) this.connections.push(conn)
          this.handleHostReceivedData(conn, data)
        })

        conn.on('close', () => {
          this.connections = this.connections.filter(c => c !== conn)
          if (conn.playerId && this.currentRoom) {
            this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== conn.playerId)
            const roomClone = this.cloneRoom()
            this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
            this.emitInternal('room_updated', roomClone)
          }
        })

        conn.on('error', (err) => {
          console.warn('Host connection peer notice:', err)
        })
      })

      this.peer.on('error', (err) => {
        console.warn('PeerJS Host Error:', err)
        this.emitInternal('room_joined', { room: this.cloneRoom(), player: hostPlayer })
      })
    } catch (e) {
      console.warn('Peer fallback error:', e)
    }

    this.emitInternal('room_joined', { room: this.cloneRoom(), player: hostPlayer })
    return room
  }

  handleHostReceivedData(conn, msg) {
    if (!msg || !msg.type) return

    if (msg.type === 'JOIN_REQ' || msg.type === 'CLIENT_HEARTBEAT') {
      if (msg.player) {
        conn.playerId = msg.player.id
        this.addOrUpdatePlayerInHost(msg.player)
      }

      const roomClone = this.cloneRoom()
      // Reply directly to client
      try {
        conn.send({ type: 'ROOM_UPDATE', room: roomClone })
      } catch (e) {}

      // Broadcast updated room state to all peers and cross-tab
      this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
      this.emitInternal('room_updated', roomClone)
    } else if (msg.type === 'SWITCH_TEAM') {
      const p = this.currentRoom.players.find(x => x.id === msg.playerId)
      if (p) {
        p.team = msg.targetTeam
        const roomClone = this.cloneRoom()
        this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
        this.emitInternal('room_updated', roomClone)
      }
    } else if (msg.type === 'SELECT_AGENT') {
      const p = this.currentRoom.players.find(x => x.id === msg.playerId)
      if (p) {
        p.agentId = msg.agentId
        const roomClone = this.cloneRoom()
        this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
        this.emitInternal('room_updated', roomClone)
      }
    } else if (msg.type === 'LOCK_AGENT') {
      const p = this.currentRoom.players.find(x => x.id === msg.playerId)
      if (p) {
        p.isLocked = true
        p.isReady = true
        const roomClone = this.cloneRoom()
        this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
        this.emitInternal('room_updated', roomClone)
      }
    } else if (msg.type === 'PLAYER_SYNC') {
      this.broadcastToAll(msg, conn)
      this.emitInternal('player_moved', msg.data)
    } else if (msg.type === 'GAME_EVENT') {
      this.broadcastToAll(msg, conn)
      this.emitInternal('game_event', msg.event)
    } else if (msg.type === 'PLAYER_HIT') {
      this.broadcastToAll(msg)
      this.emitInternal('player_took_damage', msg.data)
    } else if (msg.type === 'CHAT') {
      this.broadcastToAll(msg)
      this.emitInternal('chat_received', msg.chat)
    }
  }

  broadcastToAll(data, excludeConn = null) {
    this.connections.forEach(c => {
      if (c !== excludeConn && c.open) {
        try { c.send(data) } catch (e) {}
      }
    })
    // Local BroadcastChannel sync
    if (this.bc && this.currentRoom) {
      if (data.type === 'ROOM_UPDATE') this.bc.postMessage({ type: 'BC_ROOM_UPDATED', room: data.room })
      else if (data.type === 'START_MATCH') this.bc.postMessage({ type: 'BC_START_MATCH', roomId: this.currentRoom.id, room: data.room })
      else if (data.type === 'PLAYER_SYNC') this.bc.postMessage({ type: 'BC_PLAYER_SYNC', roomId: this.currentRoom.id, data: data.data })
      else if (data.type === 'GAME_EVENT') this.bc.postMessage({ type: 'BC_GAME_EVENT', roomId: this.currentRoom.id, event: data.event })
      else if (data.type === 'PLAYER_HIT') this.bc.postMessage({ type: 'BC_PLAYER_HIT', roomId: this.currentRoom.id, data: data.data })
      else if (data.type === 'CHAT') this.bc.postMessage({ type: 'BC_CHAT', roomId: this.currentRoom.id, chat: data.chat })
    }
  }

  // --- CLIENT: JOIN ROOM ---
  joinRoom(roomId, playerName, team = 'defenders') {
    if (this.peer) {
      try { this.peer.destroy() } catch (e) {}
    }
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
    if (this.joinRetryInterval) clearInterval(this.joinRetryInterval)
    if (this.connectRetryTimer) clearInterval(this.connectRetryTimer)

    const cleanCode = (roomId || '').trim().toUpperCase()
    const peerTargetId = `v3d_${cleanCode.toLowerCase()}`

    this.isHost = false
    this.connectionStatus = 'CONNECTING'

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
    this.connected = true

    this.sendJoinRequest = () => {
      // 1. Cross-tab BroadcastChannel
      if (this.bc) {
        this.bc.postMessage({
          type: 'BC_JOIN_REQ',
          roomId: cleanCode,
          player: this.myPlayer
        })
      }
      // 2. PeerJS DataConnection
      if (this.hostConn && this.hostConn.open) {
        try {
          this.hostConn.send({
            type: 'JOIN_REQ',
            player: this.myPlayer,
            roomId: cleanCode
          })
        } catch (e) {}
      }
    }

    // Continuous handshake & heartbeat retry loop (every 700ms)
    this.joinRetryInterval = setInterval(() => {
      if (!this.isHost && this.currentRoom && this.currentRoom.status === 'lobby') {
        this.sendJoinRequest()
      }
    }, 700)

    const attemptConnectToHost = () => {
      if (!this.peer || this.peer.destroyed || (this.hostConn && this.hostConn.open)) return

      if (this.hostConn) {
        try { this.hostConn.close() } catch (e) {}
      }

      console.log('Connecting to Host peer:', peerTargetId)
      try {
        this.hostConn = this.peer.connect(peerTargetId, {
          reliable: true
        })

        if (this.hostConn) {
          this.hostConn.on('open', () => {
            console.log('✅ PeerJS Client DataConnection OPENED with Host:', peerTargetId)
            this.connected = true
            this.connectionStatus = 'CONNECTED'
            this.emitInternal('network_status', 'CONNECTED')
            this.sendJoinRequest()
          })

          this.hostConn.on('data', (data) => {
            this.handleClientReceivedData(data)
          })

          this.hostConn.on('error', (err) => {
            console.warn('hostConn error (auto-reconnecting):', err)
          })

          this.hostConn.on('close', () => {
            this.connectionStatus = 'CONNECTING'
            this.emitInternal('network_status', 'CONNECTING')
          })
        }
      } catch (err) {
        console.warn('connect attempt error:', err)
      }
    }

    // PeerJS Network Connection Request
    try {
      this.peer = new Peer({
        config: this.peerIceConfig
      })

      this.peer.on('open', (id) => {
        console.log('✅ PeerJS Client ready with ID:', id)
        attemptConnectToHost()

        // Active connection keeper / auto-retry loop every 1.5s until connected
        this.connectRetryTimer = setInterval(() => {
          if (!this.connected || !this.hostConn || !this.hostConn.open) {
            attemptConnectToHost()
          }
        }, 1500)
      })

      this.peer.on('error', (err) => {
        console.warn('Peer client notice (will retry):', err)
        setTimeout(attemptConnectToHost, 800)
      })
    } catch (e) {
      console.warn('Peer connect error:', e)
    }

    // Enter lobby UI immediately
    this.emitInternal('room_joined', { room: this.cloneRoom(), player: joinPlayer })
  }

  handleClientRoomUpdate(incomingRoom) {
    if (!incomingRoom || !incomingRoom.players) return
    const cloned = JSON.parse(JSON.stringify(incomingRoom))

    // Ensure myPlayer is present in client-side room rendering
    const hasMe = cloned.players.some(p => p.id === this.myPlayer?.id)
    if (!hasMe && this.myPlayer) {
      // Re-trigger join request immediately
      if (this.sendJoinRequest) this.sendJoinRequest()
      cloned.players.push(this.myPlayer)
    } else if (hasMe && this.myPlayer) {
      const serverMe = cloned.players.find(p => p.id === this.myPlayer.id)
      if (serverMe) {
        this.myPlayer.name = serverMe.name
        this.myPlayer.team = serverMe.team
      }
    }

    this.currentRoom = cloned
    this.connectionStatus = 'CONNECTED'
    this.emitInternal('network_status', 'CONNECTED')
    this.emitInternal('room_updated', cloned)
  }

  handleClientReceivedData(msg) {
    if (!msg || !msg.type) return

    if (msg.type === 'ROOM_UPDATE' || msg.type === 'ROOM_JOINED') {
      this.handleClientRoomUpdate(msg.room)
    } else if (msg.type === 'START_MATCH') {
      this.currentRoom = msg.room || this.currentRoom
      this.currentRoom.status = 'in_game'
      this.emitInternal('match_started', this.cloneRoom())
    } else if (msg.type === 'PLAYER_SYNC') {
      if (this.myPlayer && msg.data.id !== this.myPlayer.id) {
        this.emitInternal('player_moved', msg.data)
      }
    } else if (msg.type === 'GAME_EVENT') {
      if (this.myPlayer && msg.event.senderId !== this.myPlayer.id) {
        this.emitInternal('game_event', msg.event)
      }
    } else if (msg.type === 'PLAYER_HIT') {
      this.emitInternal('player_took_damage', msg.data)
    } else if (msg.type === 'CHAT') {
      this.emitInternal('chat_received', msg.chat)
    }
  }

  switchTeam(roomId, targetTeam) {
    if (this.myPlayer) this.myPlayer.team = targetTeam
    if (this.isHost) {
      const p = this.currentRoom.players.find(x => x.id === this.myPlayer.id)
      if (p) p.team = targetTeam
      const roomClone = this.cloneRoom()
      this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
      this.emitInternal('room_updated', roomClone)
    } else {
      if (this.hostConn && this.hostConn.open) {
        try { this.hostConn.send({ type: 'SWITCH_TEAM', playerId: this.myPlayer.id, targetTeam }) } catch (e) {}
      }
      if (this.bc) {
        this.bc.postMessage({ type: 'BC_SWITCH_TEAM', roomId, playerId: this.myPlayer.id, targetTeam })
      }
    }
  }

  selectAgent(roomId, agentId) {
    if (this.myPlayer) this.myPlayer.agentId = agentId
    if (this.isHost) {
      const p = this.currentRoom.players.find(x => x.id === this.myPlayer.id)
      if (p) p.agentId = agentId
      const roomClone = this.cloneRoom()
      this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
      this.emitInternal('room_updated', roomClone)
    } else {
      if (this.hostConn && this.hostConn.open) {
        try { this.hostConn.send({ type: 'SELECT_AGENT', playerId: this.myPlayer.id, agentId }) } catch (e) {}
      }
      if (this.bc) {
        this.bc.postMessage({ type: 'BC_SELECT_AGENT', roomId, playerId: this.myPlayer.id, agentId })
      }
    }
  }

  lockAgent(roomId) {
    if (this.myPlayer) {
      this.myPlayer.isLocked = true
      this.myPlayer.isReady = true
    }
    if (this.isHost) {
      const p = this.currentRoom.players.find(x => x.id === this.myPlayer.id)
      if (p) {
        p.isLocked = true
        p.isReady = true
      }
      const roomClone = this.cloneRoom()
      this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
      this.emitInternal('room_updated', roomClone)
    } else {
      if (this.hostConn && this.hostConn.open) {
        try { this.hostConn.send({ type: 'LOCK_AGENT', playerId: this.myPlayer.id }) } catch (e) {}
      }
      if (this.bc) {
        this.bc.postMessage({ type: 'BC_LOCK_AGENT', roomId, playerId: this.myPlayer.id })
      }
    }
  }

  updateRoomConfig(roomId, newConfig) {
    if (this.isHost && this.currentRoom) {
      this.currentRoom.customConfig = { ...(this.currentRoom.customConfig || {}), ...newConfig }
      const roomClone = this.cloneRoom()
      this.broadcastToAll({ type: 'ROOM_UPDATE', room: roomClone })
      this.emitInternal('room_updated', roomClone)
    }
  }

  startMatch(roomId) {
    if (this.isHost && this.currentRoom) {
      this.currentRoom.status = 'in_game'
      const roomClone = this.cloneRoom()
      this.broadcastToAll({ type: 'START_MATCH', room: roomClone })
      this.emitInternal('match_started', roomClone)
    }
  }

  syncPlayer(roomId, data) {
    const payload = { type: 'PLAYER_SYNC', data: { id: this.myPlayer?.id || 'local', ...data } }
    if (this.isHost) {
      this.broadcastToAll(payload)
    } else if (this.hostConn && this.hostConn.open) {
      try { this.hostConn.send(payload) } catch (e) {}
    }
    if (this.bc && !this.isHost) {
      this.bc.postMessage({ type: 'BC_PLAYER_SYNC', roomId, data: payload.data })
    }
  }

  sendGameEvent(roomId, event) {
    const payload = { type: 'GAME_EVENT', event: { senderId: this.myPlayer?.id || 'local', ...event } }
    if (this.isHost) {
      this.broadcastToAll(payload)
    } else if (this.hostConn && this.hostConn.open) {
      try { this.hostConn.send(payload) } catch (e) {}
    }
    if (this.bc && !this.isHost) {
      this.bc.postMessage({ type: 'BC_GAME_EVENT', roomId, event: payload.event })
    }
  }

  sendHit(roomId, targetId, damage, weapon, headshot, killerName) {
    const payload = {
      type: 'PLAYER_HIT',
      data: {
        targetId,
        damage,
        shooterId: this.myPlayer?.id || 'local',
        weapon,
        headshot,
        killerName: killerName || 'Operador'
      }
    }
    if (this.isHost) {
      this.broadcastToAll(payload)
    } else if (this.hostConn && this.hostConn.open) {
      try { this.hostConn.send(payload) } catch (e) {}
    }
    if (this.bc && !this.isHost) {
      this.bc.postMessage({ type: 'BC_PLAYER_HIT', roomId, data: payload.data })
    }
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
    const payload = { type: 'CHAT', chat }
    if (this.isHost) {
      this.broadcastToAll(payload)
      this.emitInternal('chat_received', chat)
    } else {
      if (this.hostConn && this.hostConn.open) {
        try { this.hostConn.send(payload) } catch (e) {}
      }
      if (this.bc) {
        this.bc.postMessage({ type: 'BC_CHAT', roomId, chat })
      }
      this.emitInternal('chat_received', chat)
    }
  }

  leaveRoom() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
    if (this.joinRetryInterval) clearInterval(this.joinRetryInterval)
    if (this.connectRetryTimer) clearInterval(this.connectRetryTimer)
    if (this.peer) {
      try { this.peer.destroy() } catch (e) {}
    }
    this.currentRoom = null
    this.isHost = false
    this.connections = []
    this.hostConn = null
  }
}
