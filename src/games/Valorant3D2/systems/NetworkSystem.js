// src/games/Valorant3D2/systems/NetworkSystem.js
import { io } from 'socket.io-client'

export class NetworkSystem {
  constructor(serverUrl = 'http://localhost:3001') {
    this.serverUrl = serverUrl
    this.socket = null
    this.connected = false
    this.currentRoom = null
    this.myPlayer = null
    this.ping = 0
    this.listeners = new Map()
  }

  connect() {
    if (this.socket && this.socket.connected) return

    this.socket = io(this.serverUrl, {
      reconnectionAttempts: 5,
      timeout: 4000
    })

    this.socket.on('connect', () => {
      this.connected = true
      this.emitInternal('connect', this.socket.id)
    })

    this.socket.on('disconnect', () => {
      this.connected = false
      this.emitInternal('disconnect')
    })

    this.socket.on('rooms_list', (rooms) => {
      this.emitInternal('rooms_list', rooms)
    })

    this.socket.on('room_joined', (data) => {
      this.currentRoom = data.room
      this.myPlayer = data.player
      this.emitInternal('room_joined', data)
    })

    this.socket.on('room_updated', (room) => {
      this.currentRoom = room
      this.emitInternal('room_updated', room)
    })

    this.socket.on('match_started', (room) => {
      this.currentRoom = room
      this.emitInternal('match_started', room)
    })

    this.socket.on('player_moved', (data) => {
      this.emitInternal('player_moved', data)
    })

    this.socket.on('game_event_broadcast', (event) => {
      this.emitInternal('game_event', event)
    })

    this.socket.on('player_took_damage', (data) => {
      this.emitInternal('player_took_damage', data)
    })

    this.socket.on('chat_received', (msg) => {
      this.emitInternal('chat_received', msg)
    })

    this.socket.on('error_message', (err) => {
      this.emitInternal('error_message', err)
    })

    // Ping loop
    setInterval(() => {
      if (this.connected) {
        const start = Date.now()
        this.socket.volatile.emit('ping_check', () => {
          this.ping = Date.now() - start
        })
      }
    }, 2500)
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

  createRoom(roomName, playerName, team) {
    if (this.socket) {
      this.socket.emit('create_room', { roomName, playerName, team })
    }
  }

  joinRoom(roomId, playerName, team) {
    if (this.socket) {
      this.socket.emit('join_room', { roomId, playerName, team })
    }
  }

  switchTeam(roomId, targetTeam) {
    if (this.socket) {
      this.socket.emit('switch_team', { roomId, targetTeam })
    }
  }

  selectAgent(roomId, agentId) {
    if (this.socket) {
      this.socket.emit('select_agent', { roomId, agentId })
    }
  }

  lockAgent(roomId) {
    if (this.socket) {
      this.socket.emit('lock_agent', { roomId })
    }
  }

  startMatch(roomId) {
    if (this.socket) {
      this.socket.emit('start_match', { roomId })
    }
  }

  syncPlayer(roomId, data) {
    if (this.socket && this.connected) {
      this.socket.volatile.emit('player_sync', { roomId, data })
    }
  }

  sendGameEvent(roomId, event) {
    if (this.socket && this.connected) {
      this.socket.emit('game_event', { roomId, event })
    }
  }

  sendHit(roomId, targetId, damage, weapon, headshot, killerName) {
    if (this.socket && this.connected) {
      this.socket.emit('player_hit', { roomId, targetId, damage, weapon, headshot, killerName })
    }
  }

  sendChat(roomId, text, teamOnly = false) {
    if (this.socket && this.connected) {
      this.socket.emit('send_chat', { roomId, text, teamOnly })
    }
  }

  leaveRoom() {
    if (this.socket) {
      this.socket.emit('leave_room')
      this.currentRoom = null
      this.myPlayer = null
    }
  }
}
