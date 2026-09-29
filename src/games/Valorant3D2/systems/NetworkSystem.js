// src/games/Valorant3D2/systems/NetworkSystem.js
import { io } from 'socket.io-client'

export class NetworkSystem {
  constructor() {
    const host = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost'
    this.serverUrl = `http://${host}:3001`
    this.socket = null
    this.connected = false
    this.currentRoom = null
    this.myPlayer = null
    this.ping = 0
    this.listeners = new Map()

    // Seamless Local Cross-Tab / Peer Fallback via BroadcastChannel
    this.useBroadcastFallback = false
    this.bc = null
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.bc = new BroadcastChannel('VALORANT3D_LOCAL_MESH')
        this.setupBroadcastChannel()
      } catch (e) {
        console.warn('BroadcastChannel not available:', e)
      }
    }
  }

  connect() {
    if (this.socket && this.socket.connected) return

    try {
      this.socket = io(this.serverUrl, {
        reconnectionAttempts: 3,
        timeout: 2500,
        transports: ['websocket', 'polling']
      })

      this.socket.on('connect', () => {
        this.connected = true
        this.useBroadcastFallback = false
        this.emitInternal('connect', this.socket.id)
      })

      this.socket.on('connect_error', () => {
        // Automatically switch to local broadcast fallback so 2 tabs can play immediately
        if (!this.connected) {
          this.connected = true
          this.useBroadcastFallback = true
          console.info('Using local peer broadcast channel for multiplayer.')
        }
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

      // Ping check
      setInterval(() => {
        if (this.connected && !this.useBroadcastFallback && this.socket) {
          const start = Date.now()
          this.socket.volatile.emit('ping_check', () => {
            this.ping = Date.now() - start
          })
        } else if (this.connected && this.useBroadcastFallback) {
          this.ping = Math.floor(Math.random() * 4) + 1
        }
      }, 2500)
    } catch (err) {
      this.connected = true
      this.useBroadcastFallback = true
    }
  }

  setupBroadcastChannel() {
    if (!this.bc) return
    this.bc.onmessage = (e) => {
      const msg = e.data
      if (!msg || !msg.type) return

      if (msg.type === 'BC_CREATE_ROOM' && this.useBroadcastFallback) {
        // If someone else created a room, store in local rooms list
        this.emitInternal('rooms_list', [msg.room])
      } else if (msg.type === 'BC_JOIN_ROOM' && this.currentRoom && this.currentRoom.id === msg.roomId) {
        // Host adds new player to room
        if (this.myPlayer && this.myPlayer.isHost) {
          const exists = this.currentRoom.players.some(p => p.id === msg.player.id)
          if (!exists) {
            this.currentRoom.players.push(msg.player)
            this.broadcast('BC_ROOM_UPDATED', { room: this.currentRoom })
            this.emitInternal('room_updated', this.currentRoom)
          }
        }
      } else if (msg.type === 'BC_ROOM_UPDATED' && this.currentRoom && this.currentRoom.id === msg.room.id) {
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

  broadcast(type, payload) {
    if (this.bc) {
      this.bc.postMessage({ type, ...payload })
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

  createRoom(roomName, playerName, team = 'attackers') {
    if (this.socket && this.socket.connected && !this.useBroadcastFallback) {
      this.socket.emit('create_room', { roomName, playerName, team })
    } else {
      // Local broadcast fallback
      const roomId = this.generateCode()
      const hostPlayer = {
        id: `local_host_${Date.now()}`,
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
      this.broadcast('BC_CREATE_ROOM', { room })
      this.emitInternal('room_joined', { room, player: hostPlayer })
    }
  }

  joinRoom(roomId, playerName, team = 'defenders') {
    const cleanId = (roomId || '').trim().toUpperCase()
    if (this.socket && this.socket.connected && !this.useBroadcastFallback) {
      this.socket.emit('join_room', { roomId: cleanId, playerName, team })
    } else {
      // Local broadcast join
      const joinPlayer = {
        id: `local_peer_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
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

      const room = {
        id: cleanId,
        name: `Sala ${cleanId}`,
        status: 'lobby',
        hostId: 'local_host',
        players: [joinPlayer]
      }

      this.currentRoom = room
      this.myPlayer = joinPlayer
      this.broadcast('BC_JOIN_ROOM', { roomId: cleanId, player: joinPlayer })
      this.emitInternal('room_joined', { room, player: joinPlayer })
    }
  }

  switchTeam(roomId, targetTeam) {
    if (this.socket && this.socket.connected && !this.useBroadcastFallback) {
      this.socket.emit('switch_team', { roomId, targetTeam })
    } else if (this.currentRoom && this.myPlayer) {
      this.myPlayer.team = targetTeam
      const p = this.currentRoom.players.find(x => x.id === this.myPlayer.id)
      if (p) p.team = targetTeam
      this.broadcast('BC_ROOM_UPDATED', { room: this.currentRoom })
      this.emitInternal('room_updated', this.currentRoom)
    }
  }

  selectAgent(roomId, agentId) {
    if (this.socket && this.socket.connected && !this.useBroadcastFallback) {
      this.socket.emit('select_agent', { roomId, agentId })
    } else if (this.currentRoom && this.myPlayer) {
      this.myPlayer.agentId = agentId
      const p = this.currentRoom.players.find(x => x.id === this.myPlayer.id)
      if (p) p.agentId = agentId
      this.broadcast('BC_ROOM_UPDATED', { room: this.currentRoom })
      this.emitInternal('room_updated', this.currentRoom)
    }
  }

  lockAgent(roomId) {
    if (this.socket && this.socket.connected && !this.useBroadcastFallback) {
      this.socket.emit('lock_agent', { roomId })
    } else if (this.currentRoom && this.myPlayer) {
      this.myPlayer.isLocked = true
      this.myPlayer.isReady = true
      const p = this.currentRoom.players.find(x => x.id === this.myPlayer.id)
      if (p) {
        p.isLocked = true
        p.isReady = true
      }
      this.broadcast('BC_ROOM_UPDATED', { room: this.currentRoom })
      this.emitInternal('room_updated', this.currentRoom)
    }
  }

  startMatch(roomId) {
    if (this.socket && this.socket.connected && !this.useBroadcastFallback) {
      this.socket.emit('start_match', { roomId })
    } else if (this.currentRoom) {
      this.currentRoom.status = 'in_game'
      this.broadcast('BC_START_MATCH', { roomId })
      this.emitInternal('match_started', this.currentRoom)
    }
  }

  syncPlayer(roomId, data) {
    if (this.socket && this.connected && !this.useBroadcastFallback) {
      this.socket.volatile.emit('player_sync', { roomId, data })
    } else if (this.bc && this.currentRoom) {
      this.broadcast('BC_PLAYER_SYNC', { roomId, data: { id: this.myPlayer?.id || data.id, ...data } })
    }
  }

  sendGameEvent(roomId, event) {
    const fullEvent = { senderId: this.myPlayer?.id || 'local', ...event }
    if (this.socket && this.connected && !this.useBroadcastFallback) {
      this.socket.emit('game_event', { roomId, event: fullEvent })
    } else if (this.bc && this.currentRoom) {
      this.broadcast('BC_GAME_EVENT', { roomId, event: fullEvent })
    }
  }

  sendHit(roomId, targetId, damage, weapon, headshot, killerName) {
    const data = {
      targetId,
      damage,
      shooterId: this.myPlayer?.id || 'local',
      weapon,
      headshot,
      killerName: killerName || 'Operador'
    }
    if (this.socket && this.connected && !this.useBroadcastFallback) {
      this.socket.emit('player_hit', { roomId, ...data })
    } else if (this.bc && this.currentRoom) {
      this.broadcast('BC_PLAYER_HIT', { roomId, data })
    }
  }

  sendChat(roomId, text, teamOnly = false) {
    const chatPayload = {
      id: Date.now() + Math.random(),
      senderName: this.myPlayer?.name || 'Operador',
      team: this.myPlayer?.team || 'attackers',
      text,
      teamOnly,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (this.socket && this.connected && !this.useBroadcastFallback) {
      this.socket.emit('send_chat', { roomId, text, teamOnly })
    } else if (this.bc && this.currentRoom) {
      this.broadcast('BC_CHAT', { roomId, chat: chatPayload })
      this.emitInternal('chat_received', chatPayload)
    }
  }

  leaveRoom() {
    if (this.socket && !this.useBroadcastFallback) {
      this.socket.emit('leave_room')
    }
    this.currentRoom = null
    this.myPlayer = null
  }
}
