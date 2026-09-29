// src/games/Valorant3D2/systems/NetworkSystem.js
import { Peer } from 'peerjs'

export class NetworkSystem {
  constructor() {
    this.peer = null
    this.connections = [] // For host: list of DataConnections
    this.hostConn = null   // For client: DataConnection to host
    this.connected = false
    this.isHost = false
    this.currentRoom = null
    this.myPlayer = null
    this.ping = 0
    this.listeners = new Map()

    // BroadcastChannel local fallback
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
    // PeerJS initializes on room creation or join
    this.connected = true
  }

  setupBroadcastChannel() {
    if (!this.bc) return
    this.bc.onmessage = (e) => {
      const msg = e.data
      if (!msg || !msg.type) return

      if (msg.type === 'BC_ROOM_UPDATED' && this.currentRoom && this.currentRoom.id === msg.room.id) {
        this.currentRoom = msg.room
        this.emitInternal('room_updated', msg.room)
      } else if (msg.type === 'BC_START_MATCH' && this.currentRoom && this.currentRoom.id === msg.roomId) {
        this.currentRoom.status = 'in_game'
        this.emitInternal('match_started', this.currentRoom)
      } else if (msg.type === 'BC_PLAYER_SYNC' && this.currentRoom && this.currentRoom.id === msg.roomId) {
        if (this.myPlayer && msg.data.id !== this.myPlayer.id) {
          this.emitInternal('player_moved', msg.data)
        }
      } else if (msg.type === 'BC_GAME_EVENT' && this.currentRoom && this.currentRoom.id === msg.roomId) {
        if (this.myPlayer && msg.event.senderId !== this.myPlayer.id) {
          this.emitInternal('game_event', msg.event)
        }
      } else if (msg.type === 'BC_PLAYER_HIT' && this.currentRoom && this.currentRoom.id === msg.roomId) {
        this.emitInternal('player_took_damage', msg.data)
      } else if (msg.type === 'BC_CHAT' && this.currentRoom && this.currentRoom.id === msg.roomId) {
        this.emitInternal('chat_received', msg.chat)
      }
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
        cb(data)
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
  createRoom(roomName, playerName, team = 'attackers') {
    if (this.peer) {
      try { this.peer.destroy() } catch (e) {}
    }

    const roomId = this.generateCode()
    const peerRoomId = `v3d_${roomId.toLowerCase()}`

    this.isHost = true
    this.connections = []

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
      weapon: 'vandal'
    }

    const room = {
      id: roomId,
      name: roomName || `Sala ${roomId}`,
      status: 'lobby',
      hostId: hostPlayer.id,
      players: [hostPlayer]
    }

    this.currentRoom = room
    this.myPlayer = hostPlayer

    try {
      this.peer = new Peer(peerRoomId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      })

      this.peer.on('open', (id) => {
        this.connected = true
        this.emitInternal('room_joined', { room, player: hostPlayer })
      })

      this.peer.on('connection', (conn) => {
        this.connections.push(conn)

        conn.on('data', (data) => {
          this.handleHostReceivedData(conn, data)
        })

        conn.on('close', () => {
          this.connections = this.connections.filter(c => c !== conn)
          if (conn.playerId && this.currentRoom) {
            this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== conn.playerId)
            this.broadcastToAll({ type: 'ROOM_UPDATE', room: this.currentRoom })
            this.emitInternal('room_updated', this.currentRoom)
          }
        })
      })

      this.peer.on('error', (err) => {
        console.warn('PeerJS Host notice:', err)
        // If error, still allow local broadcast
        this.emitInternal('room_joined', { room, player: hostPlayer })
      })
    } catch (e) {
      console.warn('Peer fallback error:', e)
      this.emitInternal('room_joined', { room, player: hostPlayer })
    }
  }

  handleHostReceivedData(conn, msg) {
    if (!msg || !msg.type) return

    if (msg.type === 'JOIN_REQ') {
      conn.playerId = msg.player.id
      const exists = this.currentRoom.players.find(p => p.id === msg.player.id)
      if (!exists) {
        this.currentRoom.players.push(msg.player)
      }
      // Send full room state to all clients
      this.broadcastToAll({ type: 'ROOM_UPDATE', room: this.currentRoom })
      this.emitInternal('room_updated', this.currentRoom)
    } else if (msg.type === 'SWITCH_TEAM') {
      const p = this.currentRoom.players.find(x => x.id === msg.playerId)
      if (p) {
        p.team = msg.targetTeam
        this.broadcastToAll({ type: 'ROOM_UPDATE', room: this.currentRoom })
        this.emitInternal('room_updated', this.currentRoom)
      }
    } else if (msg.type === 'SELECT_AGENT') {
      const p = this.currentRoom.players.find(x => x.id === msg.playerId)
      if (p) {
        p.agentId = msg.agentId
        this.broadcastToAll({ type: 'ROOM_UPDATE', room: this.currentRoom })
        this.emitInternal('room_updated', this.currentRoom)
      }
    } else if (msg.type === 'LOCK_AGENT') {
      const p = this.currentRoom.players.find(x => x.id === msg.playerId)
      if (p) {
        p.isLocked = true
        p.isReady = true
        this.broadcastToAll({ type: 'ROOM_UPDATE', room: this.currentRoom })
        this.emitInternal('room_updated', this.currentRoom)
      }
    } else if (msg.type === 'PLAYER_SYNC') {
      // Broadcast to other peers and fire locally
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
        c.send(data)
      }
    })
    // Local BroadcastChannel sync
    if (this.bc) {
      if (data.type === 'ROOM_UPDATE') this.bc.postMessage({ type: 'BC_ROOM_UPDATED', room: data.room })
      else if (data.type === 'START_MATCH') this.bc.postMessage({ type: 'BC_START_MATCH', roomId: this.currentRoom?.id })
      else if (data.type === 'PLAYER_SYNC') this.bc.postMessage({ type: 'BC_PLAYER_SYNC', roomId: this.currentRoom?.id, data: data.data })
      else if (data.type === 'GAME_EVENT') this.bc.postMessage({ type: 'BC_GAME_EVENT', roomId: this.currentRoom?.id, event: data.event })
      else if (data.type === 'PLAYER_HIT') this.bc.postMessage({ type: 'BC_PLAYER_HIT', roomId: this.currentRoom?.id, data: data.data })
      else if (data.type === 'CHAT') this.bc.postMessage({ type: 'BC_CHAT', roomId: this.currentRoom?.id, chat: data.chat })
    }
  }

  // --- CLIENT: JOIN ROOM ---
  joinRoom(roomId, playerName, team = 'defenders') {
    if (this.peer) {
      try { this.peer.destroy() } catch (e) {}
    }

    const cleanCode = (roomId || '').trim().toUpperCase()
    const peerTargetId = `v3d_${cleanCode.toLowerCase()}`

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
      weapon: 'vandal'
    }

    const placeholderRoom = {
      id: cleanCode,
      name: `Sala ${cleanCode}`,
      status: 'lobby',
      hostId: 'host',
      players: [joinPlayer]
    }

    this.currentRoom = placeholderRoom
    this.myPlayer = joinPlayer

    try {
      this.peer = new Peer({
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      })

      this.peer.on('open', () => {
        this.hostConn = this.peer.connect(peerTargetId, { reliable: true })

        this.hostConn.on('open', () => {
          this.connected = true
          this.hostConn.send({
            type: 'JOIN_REQ',
            player: joinPlayer
          })
          this.emitInternal('room_joined', { room: this.currentRoom, player: joinPlayer })
        })

        this.hostConn.on('data', (data) => {
          this.handleClientReceivedData(data)
        })

        this.hostConn.on('error', (err) => {
          console.warn('Connection to host error:', err)
          this.emitInternal('room_joined', { room: this.currentRoom, player: joinPlayer })
        })
      })

      this.peer.on('error', (err) => {
        console.warn('Peer client error:', err)
        this.emitInternal('room_joined', { room: this.currentRoom, player: joinPlayer })
      })
    } catch (e) {
      console.warn('Peer connect error:', e)
      this.emitInternal('room_joined', { room: this.currentRoom, player: joinPlayer })
    }
  }

  handleClientReceivedData(msg) {
    if (!msg || !msg.type) return

    if (msg.type === 'ROOM_UPDATE') {
      this.currentRoom = msg.room
      this.emitInternal('room_updated', msg.room)
    } else if (msg.type === 'START_MATCH') {
      this.currentRoom = msg.room || this.currentRoom
      this.currentRoom.status = 'in_game'
      this.emitInternal('match_started', this.currentRoom)
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
      this.broadcastToAll({ type: 'ROOM_UPDATE', room: this.currentRoom })
      this.emitInternal('room_updated', this.currentRoom)
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'SWITCH_TEAM', playerId: this.myPlayer.id, targetTeam })
    }
  }

  selectAgent(roomId, agentId) {
    if (this.myPlayer) this.myPlayer.agentId = agentId
    if (this.isHost) {
      const p = this.currentRoom.players.find(x => x.id === this.myPlayer.id)
      if (p) p.agentId = agentId
      this.broadcastToAll({ type: 'ROOM_UPDATE', room: this.currentRoom })
      this.emitInternal('room_updated', this.currentRoom)
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'SELECT_AGENT', playerId: this.myPlayer.id, agentId })
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
      this.broadcastToAll({ type: 'ROOM_UPDATE', room: this.currentRoom })
      this.emitInternal('room_updated', this.currentRoom)
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'LOCK_AGENT', playerId: this.myPlayer.id })
    }
  }

  startMatch(roomId) {
    if (this.isHost && this.currentRoom) {
      this.currentRoom.status = 'in_game'
      this.broadcastToAll({ type: 'START_MATCH', room: this.currentRoom })
      this.emitInternal('match_started', this.currentRoom)
    }
  }

  syncPlayer(roomId, data) {
    const payload = { type: 'PLAYER_SYNC', data: { id: this.myPlayer?.id || 'local', ...data } }
    if (this.isHost) {
      this.broadcastToAll(payload)
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send(payload)
    }
  }

  sendGameEvent(roomId, event) {
    const payload = { type: 'GAME_EVENT', event: { senderId: this.myPlayer?.id || 'local', ...event } }
    if (this.isHost) {
      this.broadcastToAll(payload)
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send(payload)
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
      this.hostConn.send(payload)
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
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send(payload)
    }
  }

  leaveRoom() {
    if (this.hostConn) {
      try { this.hostConn.close() } catch (e) {}
      this.hostConn = null
    }
    if (this.peer) {
      try { this.peer.destroy() } catch (e) {}
      this.peer = null
    }
    this.connections = []
    this.currentRoom = null
    this.myPlayer = null
  }
}
