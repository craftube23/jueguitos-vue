// server/server.js
import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = process.env.PORT || 3001
const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Active game rooms
const rooms = new Map()

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function getPublicRooms() {
  const list = []
  for (const [id, room] of rooms.entries()) {
    list.push({
      id,
      name: room.name,
      status: room.status,
      playerCount: room.players.length,
      maxPlayers: 10,
      hostName: room.players.find(p => p.isHost)?.name || 'Anónimo'
    })
  }
  return list
}

io.on('connection', (socket) => {
  console.log(`[Socket] Conectado: ${socket.id}`)

  // Enviar lista de salas al conectar
  socket.emit('rooms_list', getPublicRooms())

  // Crear sala
  socket.on('create_room', ({ roomName, playerName, team }) => {
    const roomId = generateRoomCode()
    const playerTeam = team === 'defenders' ? 'defenders' : 'attackers'
    
    const hostPlayer = {
      id: socket.id,
      name: playerName || 'Jugador 1',
      team: playerTeam,
      agentId: 'jett',
      isLocked: false,
      isReady: true,
      isHost: true,
      x: playerTeam === 'attackers' ? 140 : 1660,
      y: 600,
      hp: 100,
      shield: 50,
      weapon: 'vandal',
      state: 'Normal'
    }

    const newRoom = {
      id: roomId,
      name: roomName || `Sala de ${hostPlayer.name}`,
      status: 'lobby', // 'lobby' | 'in_game'
      hostId: socket.id,
      players: [hostPlayer],
      matchState: {
        round: 1,
        scoreAtk: 0,
        scoreDef: 0,
        phase: 'buy', // 'buy' | 'action' | 'ended'
        phaseTimer: 30,
        spike: { planted: false, site: null, timer: 45, planter: null }
      }
    }

    rooms.set(roomId, newRoom)
    socket.join(roomId)
    socket.roomId = roomId

    socket.emit('room_joined', { room: newRoom, player: hostPlayer })
    io.emit('rooms_list', getPublicRooms())
    console.log(`[Room] Creada sala ${roomId} por ${hostPlayer.name}`)
  })

  // Unirse a sala
  socket.on('join_room', ({ roomId, playerName, team }) => {
    const room = rooms.get(roomId)
    if (!room) {
      return socket.emit('error_message', 'La sala no existe o ha expirado.')
    }

    if (room.players.length >= 10) {
      return socket.emit('error_message', 'La sala está completa (máximo 10 jugadores).')
    }

    // Determinar equipo con espacio (máx 5 por equipo)
    const atkCount = room.players.filter(p => p.team === 'attackers').length
    const defCount = room.players.filter(p => p.team === 'defenders').length
    let assignedTeam = team || (atkCount <= defCount ? 'attackers' : 'defenders')
    if (assignedTeam === 'attackers' && atkCount >= 5) assignedTeam = 'defenders'
    if (assignedTeam === 'defenders' && defCount >= 5) assignedTeam = 'attackers'

    const player = {
      id: socket.id,
      name: playerName || `Agente ${room.players.length + 1}`,
      team: assignedTeam,
      agentId: 'phoenix',
      isLocked: false,
      isReady: false,
      isHost: false,
      x: assignedTeam === 'attackers' ? 140 : 1660,
      y: 600 + (room.players.length * 30),
      hp: 100,
      shield: 50,
      weapon: 'vandal',
      state: 'Normal'
    }

    room.players.push(player)
    socket.join(roomId)
    socket.roomId = roomId

    socket.emit('room_joined', { room, player })
    io.to(roomId).emit('room_updated', room)
    io.emit('rooms_list', getPublicRooms())
  })

  // Cambiar de equipo (Atacantes / Defensores)
  socket.on('switch_team', ({ roomId, targetTeam }) => {
    const room = rooms.get(roomId)
    if (!room) return

    const teamCount = room.players.filter(p => p.team === targetTeam).length
    if (teamCount >= 5) {
      return socket.emit('error_message', 'Ese equipo ya tiene el límite de 5 jugadores.')
    }

    const player = room.players.find(p => p.id === socket.id)
    if (player) {
      player.team = targetTeam
      player.x = targetTeam === 'attackers' ? 140 : 1660
      io.to(roomId).emit('room_updated', room)
    }
  })

  // Seleccionar y bloquear agente
  socket.on('select_agent', ({ roomId, agentId }) => {
    const room = rooms.get(roomId)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (player && !player.isLocked) {
      player.agentId = agentId
      io.to(roomId).emit('room_updated', room)
    }
  })

  socket.on('lock_agent', ({ roomId }) => {
    const room = rooms.get(roomId)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (player) {
      player.isLocked = true
      player.isReady = true
      io.to(roomId).emit('room_updated', room)
    }
  })

  // Iniciar partida
  socket.on('start_match', ({ roomId }) => {
    const room = rooms.get(roomId)
    if (!room) return
    if (room.hostId !== socket.id) {
      return socket.emit('error_message', 'Solo el anfitrión puede iniciar la partida.')
    }

    room.status = 'in_game'
    room.matchState.phase = 'buy'
    room.matchState.phaseTimer = 15

    // Posicionar jugadores en sus bases
    let atkIdx = 0
    let defIdx = 0
    room.players.forEach(p => {
      p.hp = 100
      p.shield = 50
      p.state = 'Normal'
      if (p.team === 'attackers') {
        p.x = 120
        p.y = 500 + (atkIdx++ * 50)
      } else {
        p.x = 1680
        p.y = 500 + (defIdx++ * 50)
      }
    })

    io.to(roomId).emit('match_started', room)
    io.emit('rooms_list', getPublicRooms())
    console.log(`[Match] Partida iniciada en sala ${roomId}`)
  })

  // Sincronización en tiempo real durante la partida
  socket.on('player_sync', ({ roomId, data }) => {
    // Retransmitir posición y estado a los demás jugadores de la sala
    socket.to(roomId).emit('player_moved', {
      id: socket.id,
      ...data
    })
  })

  // Evento de disparo / habilidad / combate
  socket.on('game_event', ({ roomId, event }) => {
    socket.to(roomId).emit('game_event_broadcast', {
      senderId: socket.id,
      ...event
    })
  })

  // Mensajes del chat
  socket.on('send_chat', ({ roomId, text, teamOnly }) => {
    const room = rooms.get(roomId)
    if (!room) return
    const sender = room.players.find(p => p.id === socket.id)
    if (!sender) return

    const messagePayload = {
      id: Date.now() + Math.random(),
      senderName: sender.name,
      team: sender.team,
      text,
      teamOnly,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    if (teamOnly) {
      // Enviar solo al mismo equipo
      room.players.filter(p => p.team === sender.team).forEach(p => {
        io.to(p.id).emit('chat_received', messagePayload)
      })
    } else {
      io.to(roomId).emit('chat_received', messagePayload)
    }
  })

  // Salir de la sala
  socket.on('leave_room', () => {
    handlePlayerLeave(socket)
  })

  socket.on('disconnect', () => {
    handlePlayerLeave(socket)
    console.log(`[Socket] Desconectado: ${socket.id}`)
  })

  function handlePlayerLeave(s) {
    const roomId = s.roomId
    if (!roomId) return
    const room = rooms.get(roomId)
    if (!room) return

    room.players = room.players.filter(p => p.id !== s.id)
    s.leave(roomId)
    s.roomId = null

    if (room.players.length === 0) {
      rooms.delete(roomId)
      console.log(`[Room] Sala ${roomId} eliminada por estar vacía`)
    } else {
      // Si el anfitrión se fue, transferir anfitrión al siguiente
      if (room.hostId === s.id) {
        room.hostId = room.players[0].id
        room.players[0].isHost = true
      }
      io.to(roomId).emit('room_updated', room)
    }
    io.emit('rooms_list', getPublicRooms())
  }
})

httpServer.listen(PORT, () => {
  console.log(`🎮 Servidor Multijugador Valorant 2D corriendo en http://localhost:${PORT}`)
})
