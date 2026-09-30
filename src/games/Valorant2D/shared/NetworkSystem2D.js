// src/games/Valorant2D/shared/NetworkSystem2D.js
import { Peer } from 'peerjs'

export class NetworkSystem2D {
  constructor() {
    this.peer = null
    this.connections = [] // Host: list of client DataConnections
    this.hostConn = null   // Client: DataConnection to host
    this.connected = false
    this.isHost = false
    this.currentRoom = null
    this.myPlayer = null
    this.listeners = new Map()

    // BroadcastChannel for cross-tab instant sync
    this.bc = null
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.bc = new BroadcastChannel('VALORANT2D_LOCAL_MESH')
        this.setupBroadcastChannel()
      } catch (e) {
        console.warn('BroadcastChannel notice:', e)
      }
    }
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
          this.emitInternal('game_event_broadcast', msg.event)
        }
      } else if (msg.type === 'BC_CHAT' && this.currentRoom && this.currentRoom.id === msg.roomId) {
        this.emitInternal('chat_received', msg.chat)
      } else if (msg.type === 'BC_ANNOUNCE_ROOM') {
        this.emitInternal('room_announced', msg.room)
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

  // --- CREATE ROOM (HOST) ---
  createRoom(roomName, playerName, team = 'attackers') {
    if (this.peer) {
      try { this.peer.destroy() } catch (e) {}
    }

    const roomId = this.generateCode()
    const peerRoomId = `val2d_${roomId.toLowerCase()}`

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
      x: team === 'attackers' ? 256 : 1920,
      y: 350,
      hp: 100,
      shield: 50,
      weapon: 'vandal',
      state: 'Normal'
    }

    const room = {
      id: roomId,
      name: roomName || `Sala de ${hostPlayer.name}`,
      status: 'lobby',
      hostId: hostPlayer.id,
      players: [hostPlayer],
      matchState: {
        round: 1,
        scoreAlly: 0,
        scoreEnemy: 0
      }
    }

    this.currentRoom = room
    this.myPlayer = hostPlayer

    try {
      this.peer = new Peer(peerRoomId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      })

      this.peer.on('open', (id) => {
        this.connected = true
        this.emitInternal('connect', null)
        this.emitInternal('room_joined', { room, player: hostPlayer })
        this.broadcastRoomList()
      })

      this.peer.on('connection', (conn) => {
        this.handleHostIncomingConnection(conn)
      })

      this.peer.on('error', (err) => {
        console.warn('PeerJS Host notice:', err)
        // Even with network stun delay, host is locally active
        this.connected = true
        this.emitInternal('room_joined', { room, player: hostPlayer })
      })
    } catch (e) {
      console.warn('Peer fallback:', e)
      this.connected = true
      this.emitInternal('room_joined', { room, player: hostPlayer })
    }

    if (this.bc) {
      this.bc.postMessage({ type: 'BC_ANNOUNCE_ROOM', room })
    }

    return room
  }

  handleHostIncomingConnection(conn) {
    conn.on('open', () => {
      this.connections.push(conn)
    })

    conn.on('data', (data) => {
      this.handleHostReceivedData(conn, data)
    })

    conn.on('close', () => {
      this.connections = this.connections.filter(c => c !== conn)
      if (conn.playerId && this.currentRoom) {
        this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== conn.playerId)
        this.broadcastToPeers('ROOM_UPDATED', this.currentRoom)
        this.emitInternal('room_updated', this.currentRoom)
      }
    })
  }

  handleHostReceivedData(conn, data) {
    if (!data || !data.type) return

    if (data.type === 'JOIN_ROOM') {
      if (this.currentRoom.players.length >= 10) {
        conn.send({ type: 'ERROR', message: 'La sala está llena (máximo 10 jugadores).' })
        return
      }

      const atkCount = this.currentRoom.players.filter(p => p.team === 'attackers').length
      const defCount = this.currentRoom.players.filter(p => p.team === 'defenders').length
      let assignedTeam = data.team || (atkCount <= defCount ? 'attackers' : 'defenders')

      const newPlayer = {
        id: data.playerId || `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: data.playerName || `Agente ${this.currentRoom.players.length + 1}`,
        team: assignedTeam,
        agentId: data.agentId || 'phoenix',
        isLocked: false,
        isReady: false,
        isHost: false,
        x: assignedTeam === 'attackers' ? 256 : 1920,
        y: 350 + (this.currentRoom.players.length * 30),
        hp: 100,
        shield: 50,
        weapon: 'vandal',
        state: 'Normal'
      }

      conn.playerId = newPlayer.id
      this.currentRoom.players.push(newPlayer)

      conn.send({ type: 'ROOM_JOINED', room: this.currentRoom, player: newPlayer })
      this.broadcastToPeers('ROOM_UPDATED', this.currentRoom)
      this.emitInternal('room_updated', this.currentRoom)

      if (this.bc) {
        this.bc.postMessage({ type: 'BC_ROOM_UPDATED', room: this.currentRoom })
      }
    } else if (data.type === 'SWITCH_TEAM') {
      const p = this.currentRoom.players.find(pl => pl.id === data.playerId)
      if (p) {
        p.team = data.targetTeam
        this.broadcastToPeers('ROOM_UPDATED', this.currentRoom)
        this.emitInternal('room_updated', this.currentRoom)
      }
    } else if (data.type === 'SELECT_AGENT') {
      const p = this.currentRoom.players.find(pl => pl.id === data.playerId)
      if (p && !p.isLocked) {
        p.agentId = data.agentId
        this.broadcastToPeers('ROOM_UPDATED', this.currentRoom)
        this.emitInternal('room_updated', this.currentRoom)
      }
    } else if (data.type === 'LOCK_AGENT') {
      const p = this.currentRoom.players.find(pl => pl.id === data.playerId)
      if (p) {
        p.isLocked = true
        p.isReady = true
        this.broadcastToPeers('ROOM_UPDATED', this.currentRoom)
        this.emitInternal('room_updated', this.currentRoom)
      }
    } else if (data.type === 'PLAYER_SYNC') {
      // Forward to other peers
      this.connections.forEach(c => {
        if (c !== conn && c.open) {
          c.send({ type: 'PLAYER_SYNC', data: data.data })
        }
      })
      this.emitInternal('player_moved', data.data)
      if (this.bc) {
        this.bc.postMessage({ type: 'BC_PLAYER_SYNC', roomId: this.currentRoom.id, data: data.data })
      }
    } else if (data.type === 'GAME_EVENT') {
      this.connections.forEach(c => {
        if (c !== conn && c.open) {
          c.send({ type: 'GAME_EVENT', event: data.event })
        }
      })
      this.emitInternal('game_event_broadcast', data.event)
      if (this.bc) {
        this.bc.postMessage({ type: 'BC_GAME_EVENT', roomId: this.currentRoom.id, event: data.event })
      }
    } else if (data.type === 'CHAT') {
      this.broadcastToPeers('CHAT', data.chat)
      this.emitInternal('chat_received', data.chat)
      if (this.bc) {
        this.bc.postMessage({ type: 'BC_CHAT', roomId: this.currentRoom.id, chat: data.chat })
      }
    }
  }

  // --- JOIN ROOM (CLIENT) ---
  joinRoom(roomId, playerName, team = 'defenders') {
    const cleanCode = roomId.toUpperCase().trim()
    if (!cleanCode) return

    if (this.peer) {
      try { this.peer.destroy() } catch (e) {}
    }

    this.isHost = false
    const peerTargetId = `val2d_${cleanCode.toLowerCase()}`

    const myGuestPlayer = {
      id: `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: playerName || 'Operador',
      team: team || 'defenders',
      agentId: 'phoenix',
      isLocked: false,
      isReady: false,
      isHost: false
    }
    this.myPlayer = myGuestPlayer

    try {
      this.peer = new Peer({
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      })

      this.peer.on('open', () => {
        this.connected = true
        this.emitInternal('connect', null)

        this.hostConn = this.peer.connect(peerTargetId, { reliable: true })

        this.hostConn.on('open', () => {
          this.hostConn.send({
            type: 'JOIN_ROOM',
            roomId: cleanCode,
            playerId: myGuestPlayer.id,
            playerName: myGuestPlayer.name,
            team: myGuestPlayer.team,
            agentId: myGuestPlayer.agentId
          })
        })

        this.hostConn.on('data', (data) => {
          this.handleClientReceivedData(data)
        })

        this.hostConn.on('error', (err) => {
          console.warn('Host connection notice:', err)
          this.emitInternal('error_message', 'No se pudo conectar con el anfitrión de la sala.')
        })
      })

      this.peer.on('error', (err) => {
        console.warn('Peer client error:', err)
        this.emitInternal('error_message', 'Código de sala no encontrado o anfitrión desconectado.')
      })
    } catch (e) {
      console.warn('Peer connect fallback:', e)
    }
  }

  handleClientReceivedData(data) {
    if (!data || !data.type) return

    if (data.type === 'ROOM_JOINED') {
      this.currentRoom = data.room
      this.myPlayer = data.player
      this.emitInternal('room_joined', { room: data.room, player: data.player })
    } else if (data.type === 'ROOM_UPDATED') {
      this.currentRoom = data.room
      const me = data.room.players.find(p => p.id === this.myPlayer.id)
      if (me) this.myPlayer = me
      this.emitInternal('room_updated', data.room)
    } else if (data.type === 'START_MATCH') {
      this.currentRoom = data.room
      this.emitInternal('match_started', data.room)
    } else if (data.type === 'PLAYER_SYNC') {
      this.emitInternal('player_moved', data.data)
    } else if (data.type === 'GAME_EVENT') {
      this.emitInternal('game_event_broadcast', data.event)
    } else if (data.type === 'CHAT') {
      this.emitInternal('chat_received', data.chat)
    } else if (data.type === 'ERROR') {
      this.emitInternal('error_message', data.message)
    }
  }

  broadcastToPeers(type, payload) {
    if (!this.isHost) return
    this.connections.forEach(c => {
      if (c.open) {
        c.send({ type, [type === 'CHAT' ? 'chat' : (type === 'ROOM_UPDATED' || type === 'START_MATCH' ? 'room' : 'data')]: payload })
      }
    })
  }

  switchTeam(targetTeam) {
    if (!this.currentRoom || !this.myPlayer) return
    if (this.isHost) {
      const p = this.currentRoom.players.find(pl => pl.id === this.myPlayer.id)
      if (p) {
        p.team = targetTeam
        this.myPlayer.team = targetTeam
        this.broadcastToPeers('ROOM_UPDATED', this.currentRoom)
        this.emitInternal('room_updated', this.currentRoom)
      }
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'SWITCH_TEAM', playerId: this.myPlayer.id, targetTeam })
    }
  }

  selectAgent(agentId) {
    if (!this.currentRoom || !this.myPlayer) return
    this.myPlayer.agentId = agentId
    if (this.isHost) {
      const p = this.currentRoom.players.find(pl => pl.id === this.myPlayer.id)
      if (p) {
        p.agentId = agentId
        this.broadcastToPeers('ROOM_UPDATED', this.currentRoom)
        this.emitInternal('room_updated', this.currentRoom)
      }
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'SELECT_AGENT', playerId: this.myPlayer.id, agentId })
    }
  }

  lockAgent() {
    if (!this.currentRoom || !this.myPlayer) return
    this.myPlayer.isLocked = true
    this.myPlayer.isReady = true
    if (this.isHost) {
      const p = this.currentRoom.players.find(pl => pl.id === this.myPlayer.id)
      if (p) {
        p.isLocked = true
        p.isReady = true
        this.broadcastToPeers('ROOM_UPDATED', this.currentRoom)
        this.emitInternal('room_updated', this.currentRoom)
      }
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'LOCK_AGENT', playerId: this.myPlayer.id })
    }
  }

  startMatch() {
    if (!this.isHost || !this.currentRoom) return
    this.currentRoom.status = 'in_game'
    this.broadcastToPeers('START_MATCH', this.currentRoom)
    this.emitInternal('match_started', this.currentRoom)

    if (this.bc) {
      this.bc.postMessage({ type: 'BC_START_MATCH', roomId: this.currentRoom.id })
    }
  }

  sendPlayerSync(data) {
    if (!this.currentRoom || !this.myPlayer) return
    const syncData = { id: this.myPlayer.id, ...data }

    if (this.isHost) {
      this.connections.forEach(c => {
        if (c.open) c.send({ type: 'PLAYER_SYNC', data: syncData })
      })
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'PLAYER_SYNC', data: syncData })
    }

    if (this.bc) {
      this.bc.postMessage({ type: 'BC_PLAYER_SYNC', roomId: this.currentRoom.id, data: syncData })
    }
  }

  sendGameEvent(event) {
    if (!this.currentRoom || !this.myPlayer) return
    const eventData = { senderId: this.myPlayer.id, ...event }

    if (this.isHost) {
      this.connections.forEach(c => {
        if (c.open) c.send({ type: 'GAME_EVENT', event: eventData })
      })
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'GAME_EVENT', event: eventData })
    }

    if (this.bc) {
      this.bc.postMessage({ type: 'BC_GAME_EVENT', roomId: this.currentRoom.id, event: eventData })
    }
  }

  sendChat(text, teamOnly = false) {
    if (!this.currentRoom || !this.myPlayer || !text.trim()) return
    const chatMsg = {
      id: Date.now() + Math.random(),
      senderName: this.myPlayer.name,
      team: this.myPlayer.team,
      text: text.trim(),
      teamOnly,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    if (this.isHost) {
      this.broadcastToPeers('CHAT', chatMsg)
      this.emitInternal('chat_received', chatMsg)
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'CHAT', chat: chatMsg })
    }

    if (this.bc) {
      this.bc.postMessage({ type: 'BC_CHAT', roomId: this.currentRoom.id, chat: chatMsg })
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
    this.isHost = false
  }

  broadcastRoomList() {
    if (this.currentRoom) {
      const roomSummary = {
        id: this.currentRoom.id,
        name: this.currentRoom.name,
        playerCount: this.currentRoom.players.length,
        maxPlayers: 10,
        hostName: this.myPlayer?.name || 'Host'
      }
      this.emitInternal('rooms_list', [roomSummary])
      if (this.bc) {
        this.bc.postMessage({ type: 'BC_ANNOUNCE_ROOM', room: this.currentRoom })
      }
    }
  }
}
