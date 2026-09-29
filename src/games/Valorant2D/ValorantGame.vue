<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { io } from 'socket.io-client'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { AGENTS, WEAPONS, MAP_DATA } from './shared/gameData.js'

// --- SOUND ENGINE (Web Audio API - DOOM & Tactical Edition) ---
let audioCtx = null

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (AudioContext) audioCtx = new AudioContext()
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume()
}

function playSound(type) {
  try {
    initAudio()
    if (!audioCtx) return
    const now = audioCtx.currentTime

    if (type === 'vandal' || type === 'guardian' || type === 'sheriff' || type === 'headhunter') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.14)
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.14)
    } else if (type === 'phantom' || type === 'ghost' || type === 'spectre' || type === 'frenzy') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(380, now)
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08)
      gain.gain.setValueAtTime(0.28, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.08)
    } else if (type === 'operator' || type === 'tour_de_force') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(140, now)
      osc.frequency.exponentialRampToValueAtTime(15, now + 0.45)
      gain.gain.setValueAtTime(0.65, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.45)
    } else if (type === 'headshot') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, now)
      osc.frequency.setValueAtTime(1800, now + 0.04)
      gain.gain.setValueAtTime(0.5, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.22)
    } else if (type === 'spike_plant') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.3)
      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.3)
    } else if (type === 'spike_beep') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(950, now)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.07)
    } else if (type === 'spike_defused') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523, now)
      osc.frequency.setValueAtTime(659, now + 0.1)
      osc.frequency.setValueAtTime(784, now + 0.2)
      osc.frequency.setValueAtTime(1046, now + 0.3)
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.5)
    } else if (type === 'ult_sound') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(180, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.45)
      gain.gain.setValueAtTime(0.55, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.6)
    } else if (type === 'ability') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.2)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.2)
    } else if (type === 'flash') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(1300, now)
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.3)
      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.3)
    } else if (type === 'hurt') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(120, now)
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.18)
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.18)
    } else if (type === 'dash') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.25)
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.25)
    } else if (type === 'heal') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.linearRampToValueAtTime(880, now + 0.35)
      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.35)
    } else if (type === 'knife_throw') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1200, now)
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.12)
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.12)
    } else if (type === 'explosion') {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(160, now)
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.6)
      gain.gain.setValueAtTime(0.7, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6)
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.start(now); osc.stop(now + 0.6)
    }
  } catch (e) {
    console.error(e)
  }
}

// --- STATE MANAGEMENT ---
const appState = ref('mode_select') // 'mode_select' | 'agent_select' | 'mp_lobby_browser' | 'mp_room_lobby' | 'playing'
const gameMode = ref('practice') // 'practice' | 'multiplayer'

// Socket.io Connection
let socket = null
const isSocketConnected = ref(false)
const playerName = ref(localStorage.getItem('val2d_player_name') || 'DoomAgent_' + Math.floor(100 + Math.random() * 900))
const roomsList = ref([])
const currentRoom = ref(null)
const myMultiplayerPlayer = ref(null)
const newRoomName = ref('')
const directRoomCode = ref('')
const mpErrorMessage = ref('')
const chatMessages = ref([])
const chatInputText = ref('')
const isTeamChatOnly = ref(false)
const remotePlayers = reactive({})

function savePlayerName() {
  localStorage.setItem('val2d_player_name', playerName.value)
}

function initMultiplayerSocket() {
  if (socket) return
  const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : `${window.location.protocol}//${window.location.hostname}:3001`
  socket = io(socketUrl, { transports: ['websocket', 'polling'] })

  socket.on('connect', () => { isSocketConnected.value = true })
  socket.on('disconnect', () => { isSocketConnected.value = false })
  socket.on('rooms_list', (rooms) => { roomsList.value = rooms })

  socket.on('room_joined', ({ room, player }) => {
    currentRoom.value = room
    myMultiplayerPlayer.value = player
    selectedAgent.value = player.agentId || 'jett'
    selectedSide.value = player.team
    appState.value = 'mp_room_lobby'
    mpErrorMessage.value = ''
  })

  socket.on('room_updated', (room) => {
    currentRoom.value = room
    if (socket) {
      const me = room.players.find(p => p.id === socket.id)
      if (me) {
        myMultiplayerPlayer.value = me
        selectedAgent.value = me.agentId
        selectedSide.value = me.team
      }
    }
  })

  socket.on('match_started', (room) => {
    currentRoom.value = room
    startMultiplayerMatch()
  })

  socket.on('player_moved', (data) => {
    remotePlayers[data.id] = {
      ...(remotePlayers[data.id] || {}),
      ...data,
      lastUpdate: Date.now()
    }
  })

  socket.on('game_event_broadcast', (event) => {
    handleRemoteGameEvent(event)
  })

  socket.on('chat_received', (msg) => {
    chatMessages.value.push(msg)
    if (chatMessages.value.length > 30) chatMessages.value.shift()
  })

  socket.on('error_message', (err) => {
    mpErrorMessage.value = err
    setTimeout(() => { mpErrorMessage.value = '' }, 4000)
  })
}

function selectMode(mode) {
  gameMode.value = mode
  if (mode === 'practice') {
    appState.value = 'agent_select'
  } else {
    initMultiplayerSocket()
    appState.value = 'mp_lobby_browser'
  }
}

function createRoom() {
  if (!socket) return
  savePlayerName()
  socket.emit('create_room', {
    roomName: newRoomName.value || `Sala de ${playerName.value}`,
    playerName: playerName.value,
    team: selectedSide.value
  })
  newRoomName.value = ''
}

function joinRoom(roomId) {
  if (!socket) return
  savePlayerName()
  socket.emit('join_room', {
    roomId,
    playerName: playerName.value,
    team: selectedSide.value
  })
}

function joinByCode() {
  if (!directRoomCode.value) return
  joinRoom(directRoomCode.value.toUpperCase().trim())
  directRoomCode.value = ''
}

function switchTeam(team) {
  if (!socket || !currentRoom.value) return
  selectedSide.value = team
  socket.emit('switch_team', { roomId: currentRoom.value.id, targetTeam: team })
}

function selectAgentMp(agentKey) {
  selectedAgent.value = agentKey
  if (socket && currentRoom.value) {
    socket.emit('select_agent', { roomId: currentRoom.value.id, agentId: agentKey })
  }
}

function lockAgentMp() {
  if (socket && currentRoom.value) {
    socket.emit('lock_agent', { roomId: currentRoom.value.id })
  }
}

function startMatchAsHost() {
  if (!socket || !currentRoom.value) return
  socket.emit('start_match', { roomId: currentRoom.value.id })
}

function leaveRoom() {
  if (socket) socket.emit('leave_room')
  currentRoom.value = null
  myMultiplayerPlayer.value = null
  appState.value = 'mp_lobby_browser'
}

function sendChatMessage() {
  if (!chatInputText.value.trim() || !socket || !currentRoom.value) return
  socket.emit('send_chat', {
    roomId: currentRoom.value.id,
    text: chatInputText.value.trim(),
    teamOnly: isTeamChatOnly.value
  })
  chatInputText.value = ''
}

function handleRemoteGameEvent(event) {
  if (event.type === 'shoot') {
    playSound(event.weaponSound || 'vandal')
  } else if (event.type === 'spike_plant') {
    spike.planted = true
    spike.x = event.x
    spike.y = event.y
    spike.timer = 45
    spike.site = event.site
    playSound('spike_plant')
  } else if (event.type === 'spike_defused') {
    spike.defused = true
    playSound('spike_defused')
  }
}

// --- 2.5D RAYCASTER MAP & ENGINE CONSTANTS ---
const CELL_SIZE = 64
const MAP_COLS = 34
const MAP_ROWS = 18

// 0: empty, 1: boundary wall, 4: orange walls/pillar/dividers, 5: Site A plant zone, 6: Site B plant zone
const WORLD_GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,5,5,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,5,5,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,4,4,4,0,5,5,5,5,5,5,0,4,4,4,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,4,4,4,0,0,0,0,0,4,4,4,4,0,0,0,0,0,4,4,4,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,4,4,4,0,0,0,0,0,4,4,4,4,0,0,0,0,0,4,4,4,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,4,4,4,0,6,6,6,6,6,6,0,4,4,4,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
]

// --- ASSET MANAGEMENT ---
const customSprites = reactive({})
let spritesheetImg = null

onMounted(() => {
  spritesheetImg = new Image()
  spritesheetImg.src = '/assets/agents_spritesheet.png'

  const neonImg = new Image(); neonImg.src = '/assets/agent_neon.png'; neonImg.onload = () => { customSprites.neon = neonImg }
  const gekkoImg = new Image(); gekkoImg.src = '/assets/agent_gekko.png'; gekkoImg.onload = () => { customSprites.gekko = gekkoImg }
  const chamberImg = new Image(); chamberImg.src = '/assets/agent_chamber.png'; chamberImg.onload = () => { customSprites.chamber = chamberImg }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mouseup', handleMouseUp)

  initAudio()
  initThreeScene()
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (roundTimerInterval) clearInterval(roundTimerInterval)
  if (socket) socket.disconnect()
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mousedown', handleMouseDown)
  window.removeEventListener('mouseup', handleMouseUp)
})

// --- GAME LOGIC & DOOM 2.5D / THREE.JS 3D CONTROLLER ---
const canvasRef = ref(null)
const threeCanvasRef = ref(null)
let ctx = null
let animFrameId = null
let roundTimerInterval = null

// Three.js 3D WebGL GLB Map Renderer
let threeRenderer = null
let threeScene = null
let threeCamera = null
let map3DModel = null
let mapColliders = []
const downRaycaster = new THREE.Raycaster()
const downVec = new THREE.Vector3(0, -1, 0)
const hitRaycaster = new THREE.Raycaster()
const isMap3DLoaded = ref(false)

function initThreeScene() {
  if (!threeCanvasRef.value) return
  if (threeRenderer) return

  threeScene = new THREE.Scene()
  threeScene.background = new THREE.Color(0x0c1017)
  threeScene.fog = new THREE.FogExp2(0x0c1017, 0.0006)

  threeCamera = new THREE.PerspectiveCamera(70, 960 / 500, 0.1, 4000)

  threeRenderer = new THREE.WebGLRenderer({
    canvas: threeCanvasRef.value,
    antialias: true,
    powerPreference: 'high-performance'
  })
  threeRenderer.setSize(960, 500)
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  threeRenderer.toneMapping = THREE.ACESFilmicToneMapping
  threeRenderer.toneMappingExposure = 1.25
  threeRenderer.shadowMap.enabled = true
  threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Cyber tactical Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.0)
  threeScene.add(ambientLight)

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666677, 1.2)
  threeScene.add(hemiLight)

  const dirLight = new THREE.DirectionalLight(0xffeedd, 2.8)
  dirLight.position.set(600, 1200, 500)
  dirLight.castShadow = true
  threeScene.add(dirLight)

  const centerLight = new THREE.PointLight(0xffffff, 4.0, 1600)
  centerLight.position.set(17 * CELL_SIZE, 280, 9 * CELL_SIZE)
  threeScene.add(centerLight)

  // Point lights at Site A and Site B
  const siteALight = new THREE.PointLight(0x00e5ff, 6.0, 900)
  siteALight.position.set(17 * CELL_SIZE, 75, 3.5 * CELL_SIZE)
  threeScene.add(siteALight)

  const siteBLight = new THREE.PointLight(0xffaa00, 6.0, 900)
  siteBLight.position.set(17 * CELL_SIZE, 75, 14.5 * CELL_SIZE)
  threeScene.add(siteBLight)

  // Plant Site A Ground Hologram Ring (Green/Cyan)
  const siteAGeom = new THREE.RingGeometry(20, 160, 32)
  const siteAMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
  const siteAMesh = new THREE.Mesh(siteAGeom, siteAMat)
  siteAMesh.rotation.x = -Math.PI / 2
  siteAMesh.position.set(17 * CELL_SIZE, 2, 3.5 * CELL_SIZE)
  threeScene.add(siteAMesh)

  // Plant Site B Ground Hologram Ring (Green/Amber)
  const siteBGeom = new THREE.RingGeometry(20, 160, 32)
  const siteBMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
  const siteBMesh = new THREE.Mesh(siteBGeom, siteBMat)
  siteBMesh.rotation.x = -Math.PI / 2
  siteBMesh.position.set(17 * CELL_SIZE, 2, 14.5 * CELL_SIZE)
  threeScene.add(siteBMesh)

  // Load 3D Arena GLB Map
  const gltfLoader = new GLTFLoader()
  gltfLoader.load(
    '/models/mapa.glb',
    (gltf) => {
      mapColliders = []
      map3DModel = gltf.scene
      map3DModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          if (child.material) {
            child.material.side = THREE.DoubleSide
            child.material.roughness = 0.5
            child.material.metalness = 0.1
          }
          mapColliders.push(child)
        }
      })

      // Scale and fit map to match arena dimensions
      const bbox = new THREE.Box3().setFromObject(map3DModel)
      const size = bbox.getSize(new THREE.Vector3())
      const targetSizeX = MAP_COLS * CELL_SIZE
      const targetSizeZ = MAP_ROWS * CELL_SIZE
      const scale = Math.max(targetSizeX / (size.x || 1), targetSizeZ / (size.z || 1)) * 1.15
      map3DModel.scale.set(scale, scale, scale)

      const scaledBbox = new THREE.Box3().setFromObject(map3DModel)
      const center = scaledBbox.getCenter(new THREE.Vector3())
      map3DModel.position.x = (targetSizeX / 2) - center.x
      map3DModel.position.z = (targetSizeZ / 2) - center.z
      // Align interior walkable floor directly to Y = 0
      map3DModel.position.y = -(scaledBbox.min.y + 1.05 * scale)

      threeScene.add(map3DModel)
      isMap3DLoaded.value = true
    },
    undefined,
    (err) => {
      console.warn('GLB map error:', err)
    }
  )
}

const selectedAgent = ref('jett')
const selectedSide = ref('attackers') // 'attackers' | 'defenders'
const isBuyMenuOpen = ref(false)
const isPauseMenuOpen = ref(false)
const isSpectating = ref(false)
const spectatorIndex = ref(0)

watch(isBuyMenuOpen, (isOpen) => {
  if (isOpen && document.pointerLockElement) {
    document.exitPointerLock()
  }
})

watch(isPauseMenuOpen, (isOpen) => {
  if (isOpen && document.pointerLockElement) {
    document.exitPointerLock()
  }
})

function togglePauseMenu() {
  if (isBuyMenuOpen.value) {
    isBuyMenuOpen.value = false
    return
  }
  isPauseMenuOpen.value = !isPauseMenuOpen.value
}

function changeAgentInGame() {
  isPauseMenuOpen.value = false
  isBuyMenuOpen.value = false
  if (document.pointerLockElement) document.exitPointerLock()
  if (roundTimerInterval) clearInterval(roundTimerInterval)
  appState.value = 'agent_select'
}

function exitToMainMenu() {
  isPauseMenuOpen.value = false
  isBuyMenuOpen.value = false
  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
  if (roundTimerInterval) clearInterval(roundTimerInterval)
  if (animFrameId) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
  if (gameMode.value === 'multiplayer' && socket && currentRoom.value) {
    socket.emit('leave_room', { roomId: currentRoom.value.id })
    currentRoom.value = null
  }
  appState.value = 'mode_select'
}

// Match State
const matchState = reactive({
  round: 1,
  scoreAlly: 0,
  scoreEnemy: 0,
  roundTimeLeft: 100,
  isBuyPhase: true,
  buyPhaseTime: 15,
  roundEnded: false,
  winner: null,
  roundBannerText: '',
  roundBannerSub: ''
})

// Killfeed
const killfeed = ref([])

function addKillFeed(killer, victim, weapon, headshot = false, isAlly = true) {
  const item = {
    id: Date.now() + Math.random(),
    killer,
    victim,
    weapon,
    headshot,
    isAlly,
    time: Date.now()
  }
  killfeed.value.unshift(item)
  if (killfeed.value.length > 4) killfeed.value.pop()
  setTimeout(() => {
    const idx = killfeed.value.findIndex(k => k.id === item.id)
    if (idx !== -1) killfeed.value.splice(idx, 1)
  }, 3800)
}

// DOOM First-Person Player State
const player = reactive({
  x: 3.5 * CELL_SIZE,
  y: 5.5 * CELL_SIZE,
  currentFloorY: 0,
  angle: 0, // In radians
  pitch: 0, // Look up/down offset (pitch in radians)
  speed: 3.6,
  rotSpeed: 0.045,
  hp: 100,
  maxHp: 100,
  shield: 50,
  maxShield: 50,
  credits: 800,
  weapon: 'classic',
  ammo: 12,
  isReloading: false,
  reloadTimer: 0,
  isShooting: false,
  muzzleFlashTimer: 0,
  recoilOffset: 0,
  walkCycle: 0,
  isWalking: false,
  lastShotTime: 0,
  state: 'Normal',
  isDead: false,
  team: 'attackers',

  // Visual post-processing & effects
  flashTimer: 0,
  dashEffectTimer: 0,
  healEffectTimer: 0,

  // Abilities
  ultPoints: 0,
  maxUltPoints: 6,
  bladeStormKnives: 0,
  isEmpress: false,
  empressTimer: 0,
  isHighGear: false,
  isDismissed: false,
  suppressedDuration: 0,

  abilities: {
    C: { charges: 1, maxCharges: 2, ready: true },
    Q: { charges: 2, maxCharges: 2, ready: true },
    E: { charges: 1, maxCharges: 1, ready: true },
    X: { ready: false }
  },

  actionProgress: 0,
  isPlanting: false,
  isDefusing: false
})

const currentWeapon = computed(() => {
  return WEAPONS.find(w => w.id === player.weapon) || WEAPONS[0]
})

// Spike State
const spike = reactive({
  planted: false,
  defused: false,
  x: 13.5 * CELL_SIZE,
  y: 3.5 * CELL_SIZE,
  timer: 45,
  site: null
})

// Entities in 3D Space
const bots = reactive([])
const soulOrbs = reactive([])
const smokeZones = reactive([])
const hitParticles = reactive([])
const bulletTracers = reactive([])

// Keys
const keys = reactive({
  w: false, a: false, s: false, d: false,
  arrowLeft: false, arrowRight: false,
  shift: false, space: false, 4: false, b: false
})

let isMouseDown = false
let isPointerLocked = false

const aliveAlliesList = computed(() => {
  if (gameMode.value === 'practice') {
    return bots.filter(b => b.team === player.team && !b.isDead)
  } else if (currentRoom.value) {
    const list = []
    currentRoom.value.players.filter(p => p.team === player.team && p.id !== socket?.id).forEach(p => {
      const rp = remotePlayers[p.id]
      if (!rp?.isDead && (rp?.hp ?? 100) > 0) {
        list.push({
          id: p.id,
          name: p.name,
          agentKey: p.agentId,
          hp: rp?.hp ?? 100,
          maxHp: 100,
          shield: rp?.shield ?? 50,
          x: rp?.x ?? p.x,
          y: rp?.y ?? p.y,
          floorY: rp?.floorY ?? 0,
          angle: rp?.angle ?? 0,
          pitch: rp?.pitch ?? 0,
          weapon: rp?.weapon || 'vandal'
        })
      }
    })
    return list
  }
  return []
})

const currentSpectatedAlly = computed(() => {
  const list = aliveAlliesList.value
  if (list.length === 0) return null
  const idx = Math.min(Math.max(0, spectatorIndex.value), list.length - 1)
  return list[idx]
})

function nextSpectateTarget() {
  const allies = aliveAlliesList.value
  if (allies.length === 0) return
  spectatorIndex.value = (spectatorIndex.value + 1) % allies.length
}

function prevSpectateTarget() {
  const allies = aliveAlliesList.value
  if (allies.length === 0) return
  spectatorIndex.value = (spectatorIndex.value - 1 + allies.length) % allies.length
}

const aliveAllies = computed(() => {
  const list = []
  if (!player.isDead) {
    list.push({ name: 'TÚ (' + (AGENTS[selectedAgent.value]?.name || 'AGENTE') + ')', isPlayer: true, hp: player.hp, x: player.x, y: player.y })
  }
  if (gameMode.value === 'practice') {
    bots.filter(b => b.team === player.team && !b.isDead).forEach(b => {
      list.push({ name: b.name + ' (' + (AGENTS[b.agentKey]?.name || '') + ')', bot: b, hp: b.hp, x: b.x, y: b.y })
    })
  } else if (currentRoom.value) {
    currentRoom.value.players.filter(p => p.id !== socket?.id && p.team === player.team).forEach(p => {
      const rp = remotePlayers[p.id]
      if (!rp?.isDead && (rp?.hp ?? 100) > 0) {
        list.push({ name: p.name + ' (' + (AGENTS[p.agentId]?.name || '') + ')', hp: rp?.hp ?? 100, x: rp?.x ?? p.x, y: rp?.y ?? p.y })
      }
    })
  }
  return list
})

const aliveEnemies = computed(() => {
  if (gameMode.value === 'practice') {
    return bots.filter(b => b.team !== player.team && !b.isDead)
  } else if (currentRoom.value) {
    const list = []
    currentRoom.value.players.filter(p => p.team !== player.team).forEach(p => {
      const rp = remotePlayers[p.id]
      if (!rp?.isDead && (rp?.hp ?? 100) > 0) {
        list.push({ name: p.name + ' (' + (AGENTS[p.agentId]?.name || '') + ')', hp: rp?.hp ?? 100, x: rp?.x ?? p.x, y: rp?.y ?? p.y })
      }
    })
    return list
  }
  return []
})

// --- START MATCH ---
function startPracticeMatch() {
  appState.value = 'playing'
  initAudio()
  initMatch(true)
}

function startMultiplayerMatch() {
  appState.value = 'playing'
  initAudio()
  initMatch(false)
}

function initMatch(spawnPracticeBots = true) {
  matchState.round = 1
  matchState.scoreAlly = 0
  matchState.scoreEnemy = 0
  startRound(spawnPracticeBots)

  if (!animFrameId) {
    animFrameId = requestAnimationFrame(gameLoop)
  }
}

function startRound(spawnPracticeBots = true) {
  matchState.isBuyPhase = true
  matchState.buyPhaseTime = 15
  isBuyMenuOpen.value = true
  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
  matchState.roundTimeLeft = 100
  matchState.roundEnded = false
  matchState.winner = null
  matchState.roundBannerText = ''
  isSpectating.value = false

  spike.planted = false
  spike.defused = false
  spike.timer = 45
  spike.site = null

  player.isDead = false
  player.hp = 100
  player.shield = 50
  player.ammo = currentWeapon.value.magSize || 25
  player.isReloading = false
  player.flashTimer = 0
  player.dashEffectTimer = 0
  player.healEffectTimer = 0
  player.bladeStormKnives = 0
  player.isEmpress = false
  player.isDismissed = false
  player.actionProgress = 0
  player.isPlanting = false
  player.isDefusing = false
  player.team = selectedSide.value
  player.currentFloorY = 0
  player.pitch = 0
  isSpectating.value = false
  spectatorIndex.value = 0

  if (player.team === 'attackers') {
    player.x = 4.0 * CELL_SIZE
    player.y = 5.5 * CELL_SIZE
    player.angle = 0
  } else {
    player.x = 30.0 * CELL_SIZE
    player.y = 5.5 * CELL_SIZE
    player.angle = Math.PI
  }

  smokeZones.length = 0
  soulOrbs.length = 0
  hitParticles.length = 0

  bots.length = 0
  if (spawnPracticeBots) {
    spawnPracticeBotTeam()
  }

  if (roundTimerInterval) clearInterval(roundTimerInterval)
  roundTimerInterval = setInterval(updateTimer, 1000)
}

function spawnPracticeBotTeam() {
  const agentKeys = Object.keys(AGENTS)
  const targetSite = Math.random() > 0.5 ? 'A' : 'B'

  const allyOffsets = [
    { x: 3.5, y: 4.2 },
    { x: 3.5, y: 6.8 },
    { x: 3.5, y: 11.2 },
    { x: 3.5, y: 13.5 }
  ]

  // 4 Allies
  for (let i = 0; i < 4; i++) {
    const k = agentKeys[(i + 2) % agentKeys.length]
    const pos = allyOffsets[i]
    bots.push({
      id: 'ally_' + i,
      name: 'Bot_Aliado_' + (i + 1),
      team: player.team,
      agentKey: k,
      x: player.team === 'attackers' ? (pos.x * CELL_SIZE) : ((34 - pos.x) * CELL_SIZE),
      y: pos.y * CELL_SIZE,
      angle: player.team === 'attackers' ? 0 : Math.PI,
      radius: 20,
      speed: 2.3,
      hp: 100,
      maxHp: 100,
      shield: 50,
      weapon: i === 0 ? 'vandal' : (i === 1 ? 'phantom' : (i === 2 ? 'spectre' : 'guardian')),
      isDead: false,
      hasSpike: player.team === 'attackers' && i === 0,
      strategy: player.team === 'attackers' ? (targetSite === 'A' ? 'attack_A' : 'attack_B') : (i < 2 ? 'defend_A' : (i === 2 ? 'defend_Mid' : 'defend_B')),
      state: 'patrol', // 'patrol' | 'combat' | 'planting' | 'defusing' | 'cover'
      target: null,
      lastKnownPos: null,
      shootCooldown: 0,
      burstCount: 0,
      strafeDir: i % 2 === 0 ? 1 : -1,
      strafeTimer: 0,
      abilityTimer: 180 + Math.random() * 120,
      actionProgress: 0
    })
  }

  const enemyOffsets = [
    { x: 3.5, y: 4.2 },
    { x: 3.5, y: 6.8 },
    { x: 2.5, y: 9.0 },
    { x: 3.5, y: 11.2 },
    { x: 3.5, y: 13.5 }
  ]

  // 5 Enemies
  const enemyTeam = player.team === 'attackers' ? 'defenders' : 'attackers'
  for (let i = 0; i < 5; i++) {
    const k = agentKeys[(i + 6) % agentKeys.length]
    const pos = enemyOffsets[i]
    bots.push({
      id: 'enemy_' + i,
      name: 'Rival_' + (i + 1),
      team: enemyTeam,
      agentKey: k,
      x: enemyTeam === 'attackers' ? (pos.x * CELL_SIZE) : ((34 - pos.x) * CELL_SIZE),
      y: pos.y * CELL_SIZE,
      angle: enemyTeam === 'attackers' ? 0 : Math.PI,
      radius: 20,
      speed: 2.2,
      hp: 100,
      maxHp: 100,
      shield: 50,
      weapon: i === 0 ? 'operator' : (i === 1 ? 'vandal' : (i === 2 ? 'phantom' : 'sheriff')),
      isDead: false,
      hasSpike: enemyTeam === 'attackers' && i === 0,
      strategy: enemyTeam === 'attackers' ? (targetSite === 'A' ? 'attack_A' : 'attack_B') : (i < 2 ? 'defend_A' : (i === 2 ? 'defend_Mid' : 'defend_B')),
      state: 'patrol',
      target: null,
      lastKnownPos: null,
      shootCooldown: 0,
      burstCount: 0,
      strafeDir: i % 2 === 0 ? 1 : -1,
      strafeTimer: 0,
      abilityTimer: 150 + Math.random() * 120,
      actionProgress: 0
    })
  }
}

function updateTimer() {
  if (matchState.roundEnded) return

  if (matchState.isBuyPhase) {
    matchState.buyPhaseTime--
    if (matchState.buyPhaseTime <= 0) {
      matchState.isBuyPhase = false
      isBuyMenuOpen.value = false
    }
  } else {
    if (spike.planted) {
      spike.timer--
      playSound('spike_beep')
      if (spike.timer <= 0) {
        endRound('attackers', 'DETONACIÓN DE SPIKE')
      }
    } else {
      matchState.roundTimeLeft--
      if (matchState.roundTimeLeft <= 0) {
        endRound('defenders', 'TIEMPO AGOTADO')
      }
    }
  }

  checkEliminations()
}

function checkEliminations() {
  if (matchState.roundEnded || matchState.isBuyPhase) return

  if (gameMode.value === 'practice') {
    const alliesAlive = (player.isDead ? 0 : 1) + bots.filter(b => b.team === player.team && !b.isDead).length
    const enemiesAlive = bots.filter(b => b.team !== player.team && !b.isDead).length

    if (enemiesAlive === 0) {
      if (!spike.planted) endRound(player.team, 'ENEMIGOS ELIMINADOS')
    } else if (alliesAlive === 0) {
      if (!spike.planted) endRound(player.team === 'attackers' ? 'defenders' : 'attackers', 'EQUIPO ELIMINADO')
    }
  } else if (currentRoom.value) {
    const mpEnemies = currentRoom.value.players.filter(p => p.team !== player.team)
    const mpAllies = currentRoom.value.players.filter(p => p.team === player.team)

    // Only check eliminations if there are actual players on both teams
    if (mpEnemies.length > 0) {
      const aliveEnemiesList = mpEnemies.filter(p => {
        const rp = remotePlayers[p.id]
        return !rp?.isDead && (rp?.hp ?? 100) > 0
      })

      const aliveAlliesList = mpAllies.filter(p => {
        if (p.id === socket?.id) return !player.isDead
        const rp = remotePlayers[p.id]
        return !rp?.isDead && (rp?.hp ?? 100) > 0
      })

      if (aliveEnemiesList.length === 0 && !spike.planted) {
        endRound(player.team, 'ENEMIGOS ELIMINADOS')
      } else if (aliveAlliesList.length === 0 && !spike.planted) {
        endRound(player.team === 'attackers' ? 'defenders' : 'attackers', 'EQUIPO ELIMINADO')
      }
    }
  }
}

function endRound(winnerTeam, reason) {
  if (matchState.roundEnded) return
  matchState.roundEnded = true
  matchState.winner = winnerTeam

  const isVictory = winnerTeam === player.team
  if (isVictory) {
    matchState.scoreAlly++
    matchState.roundBannerText = '¡RONDA GANADA!'
  } else {
    matchState.scoreEnemy++
    matchState.roundBannerText = 'RONDA PERDIDA'
  }
  matchState.roundBannerSub = reason

  setTimeout(() => {
    matchState.round++
    startRound(gameMode.value === 'practice')
  }, 4000)
}

// --- FPS INPUT HANDLING ---
function handleKeyDown(e) {
  const k = e.key.toLowerCase()

  if (k === 'escape') {
    if (isBuyMenuOpen.value) {
      isBuyMenuOpen.value = false
    } else if (isPauseMenuOpen.value) {
      isPauseMenuOpen.value = false
    } else if (appState.value === 'playing') {
      isPauseMenuOpen.value = true
    } else if (appState.value === 'agent_select' || appState.value === 'mp_lobby_browser') {
      appState.value = 'mode_select'
    } else if (appState.value === 'mp_room_lobby') {
      leaveRoom()
    }
    return
  }

  // Spectator navigation when dead
  if (player.isDead) {
    if (k === 'a' || k === 'arrowleft') prevSpectateTarget()
    if (k === 'd' || k === 'arrowright' || k === ' ') nextSpectateTarget()
    return
  }

  if (k === 'w') keys.w = true
  if (k === 's') keys.s = true
  if (k === 'a') keys.a = true
  if (k === 'd') keys.d = true
  if (k === 'arrowleft') keys.arrowLeft = true
  if (k === 'arrowright') keys.arrowRight = true
  if (k === 'shift') keys.shift = true
  if (k === ' ') keys.space = true
  if (k === '4') keys['4'] = true
  if (k === 'b') {
    isBuyMenuOpen.value = !isBuyMenuOpen.value
    if (isBuyMenuOpen.value && document.pointerLockElement) {
      document.exitPointerLock()
    }
  }
  if (k === 'p') {
    if (appState.value === 'playing') togglePauseMenu()
  }
  if (k === 'r') reloadWeapon()

  // Abilities [C, Q, E, X]
  if (k === 'c') triggerAbility('C')
  if (k === 'q') triggerAbility('Q')
  if (k === 'e') triggerAbility('E')
  if (k === 'x') triggerSuper()
}

function handleKeyUp(e) {
  const k = e.key.toLowerCase()
  if (k === 'w') keys.w = false
  if (k === 's') keys.s = false
  if (k === 'a') keys.a = false
  if (k === 'd') keys.d = false
  if (k === 'arrowleft') keys.arrowLeft = false
  if (k === 'arrowright') keys.arrowRight = false
  if (k === 'shift') keys.shift = false
  if (k === ' ') keys.space = false
  if (k === '4') keys['4'] = false
}

function handleMouseMove(e) {
  if (player.isDead) return // Cannot look around while dead
  if (isBuyMenuOpen.value || isPauseMenuOpen.value) return // Allow free cursor navigation in menus
  if (document.pointerLockElement === canvasRef.value || (canvasRef.value && isMouseDown)) {
    player.angle += e.movementX * 0.0032
    player.pitch = Math.max(-0.75, Math.min(0.75, (player.pitch || 0) - e.movementY * 0.0032))
  }
}

function handleMouseDown(e) {
  if (isBuyMenuOpen.value || isPauseMenuOpen.value) return // Allow clicking menu options without shooting
  if (player.isDead) {
    if (e.button === 0) nextSpectateTarget()
    else if (e.button === 2) prevSpectateTarget()
    return
  }
  if (e.button === 0) {
    isMouseDown = true
    if (document.pointerLockElement !== canvasRef.value && canvasRef.value && appState.value === 'playing') {
      canvasRef.value.requestPointerLock()
    }
    shootWeapon()
  }
}

function handleMouseUp(e) {
  if (e.button === 0) isMouseDown = false
}

function skipBuyPhase() {
  matchState.isBuyPhase = false
  matchState.buyPhaseTime = 0
  isBuyMenuOpen.value = false
}

function safeDash(dist = 220, angle = player.angle) {
  const steps = 14
  const stepDist = dist / steps
  const dx = Math.cos(angle) * stepDist
  const dy = Math.sin(angle) * stepDist
  for (let s = 0; s < steps; s++) {
    if (!checkCollision(player.x + dx, player.y, 18)) {
      player.x += dx
    }
    if (!checkCollision(player.x, player.y + dy, 18)) {
      player.y += dy
    }
  }
}

function shootWeapon() {
  if (player.isDead || player.isReloading || matchState.isBuyPhase) return

  // Jett Blade Storm Kunai
  if (player.bladeStormKnives > 0) {
    player.bladeStormKnives--
    playSound('knife_throw')
    player.muzzleFlashTimer = 3
    player.recoilOffset = 10

    // Add glowing golden knife tracer
    bulletTracers.push({
      startX: SCREEN_WIDTH / 2,
      startY: SCREEN_HEIGHT - 60,
      endX: SCREEN_WIDTH / 2,
      endY: SCREEN_HEIGHT / 2,
      color: '#ffd700',
      width: 4.5,
      alpha: 1.0,
      life: 9,
      maxLife: 9
    })

    let closestHit = null
    let minDistance = 1600
    for (const bot of bots) {
      if (bot.isDead || bot.team === player.team) continue
      const dx = bot.x - player.x
      const dy = bot.y - player.y
      const dist = Math.hypot(dx, dy)
      let angleToBot = Math.atan2(dy, dx) - player.angle
      while (angleToBot < -Math.PI) angleToBot += Math.PI * 2
      while (angleToBot > Math.PI) angleToBot -= Math.PI * 2
      if (Math.abs(angleToBot) < 0.22 && dist < minDistance) {
        minDistance = dist
        closestHit = bot
      }
    }

    if (closestHit) {
      playSound('headshot')
      closestHit.hp = 0
      closestHit.isDead = true
      addKillFeed('Tú (Blade Storm)', closestHit.name, 'Kunai Dorado', true, true)
      player.bladeStormKnives = 5 // Reset knives on kill!
      player.credits += 200
      hitParticles.push({ x: closestHit.x, y: closestHit.y, timer: 15 })
    }
    return
  }

  if (player.ammo <= 0) {
    reloadWeapon()
    return
  }
  const now = Date.now()
  const wep = currentWeapon.value
  const fireRate = player.isEmpress ? (wep.fireRate || 140) * 0.65 : (wep.fireRate || 140)
  if (now - player.lastShotTime < fireRate) return

  player.lastShotTime = now
  player.ammo--
  player.muzzleFlashTimer = 4
  player.recoilOffset = 16
  playSound(wep.sound || 'vandal')

  // 3D Wall Hitscan Raycasting
  const rayOrigin = new THREE.Vector3(player.x, 36 + (player.currentFloorY || 0), player.y)
  const rayDir = new THREE.Vector3(
    Math.cos(player.angle) * Math.cos(player.pitch || 0),
    Math.sin(player.pitch || 0),
    Math.sin(player.angle) * Math.cos(player.pitch || 0)
  ).normalize()

  hitRaycaster.set(rayOrigin, rayDir)
  hitRaycaster.far = 1800
  const wallHits = (mapColliders && mapColliders.length > 0) ? hitRaycaster.intersectObjects(mapColliders, true) : []
  const maxHitDist = wallHits.length > 0 ? wallHits[0].distance : 1800

  // Add 3D / 2D glowing bullet tracer to crosshair
  const spreadX = (Math.random() - 0.5) * (wep.spread || 12)
  const spreadY = (Math.random() - 0.5) * (wep.spread || 12)
  bulletTracers.push({
    startX: SCREEN_WIDTH / 2 + 100,
    startY: SCREEN_HEIGHT - 40,
    endX: SCREEN_WIDTH / 2 + spreadX,
    endY: SCREEN_HEIGHT / 2 + spreadY,
    color: selectedSide.value === 'attackers' ? '#ffaa00' : '#00e5ff',
    width: wep.id === 'operator' ? 4.5 : (wep.id === 'vandal' ? 3.0 : 2.0),
    alpha: 1.0,
    life: wep.id === 'operator' ? 10 : 7,
    maxLife: wep.id === 'operator' ? 10 : 7
  })

  // Hitscan raycast forward in FPS view
  let closestHit = null
  let minDistance = 1400

  for (const bot of bots) {
    if (bot.isDead || bot.team === player.team) continue

    const dx = bot.x - player.x
    const dy = bot.y - player.y
    const dist = Math.hypot(dx, dy)
    let angleToBot = Math.atan2(dy, dx) - player.angle
    while (angleToBot < -Math.PI) angleToBot += Math.PI * 2
    while (angleToBot > Math.PI) angleToBot -= Math.PI * 2

    // Crosshair hit tolerance in radians (target must NOT be behind a wall)
    if (Math.abs(angleToBot) < 0.18 && dist < maxHitDist && dist < minDistance) {
      if (hasLineOfSight(player.x, player.y, bot.x, bot.y)) {
        minDistance = dist
        closestHit = bot
      }
    }
  }

  // Also check multiplayer remote opponents
  if (gameMode.value === 'multiplayer') {
    for (const [id, rP] of Object.entries(remotePlayers)) {
      if (rP.isDead || rP.team === player.team || (rP.hp ?? 100) <= 0) continue
      const dx = (rP.x ?? 0) - player.x
      const dy = (rP.y ?? 0) - player.y
      const dist = Math.hypot(dx, dy)
      let angleToRemote = Math.atan2(dy, dx) - player.angle
      while (angleToRemote < -Math.PI) angleToRemote += Math.PI * 2
      while (angleToRemote > Math.PI) angleToRemote -= Math.PI * 2
      if (Math.abs(angleToRemote) < 0.18 && dist < maxHitDist && dist < minDistance) {
        if (hasLineOfSight(player.x, player.y, rP.x ?? 0, rP.y ?? 0)) {
          minDistance = dist
          closestHit = { ...rP, id, isRemote: true }
        }
      }
    }
  }

  if (closestHit) {
    playSound('headshot')
    const damageDealt = (wep.damage || 35) * 1.5

    if (closestHit.isRemote) {
      closestHit.hp = Math.max(0, (closestHit.hp ?? 100) - damageDealt)
      hitParticles.push({ x: closestHit.x ?? 0, y: closestHit.y ?? 0, timer: 12 })
      if (socket && currentRoom.value) {
        socket.emit('game_event', {
          roomId: currentRoom.value.id,
          event: {
            type: 'damage_player',
            targetId: closestHit.id,
            damage: damageDealt,
            killerName: playerName.value,
            weapon: wep.name
          }
        })
      }
      if (closestHit.hp <= 0) {
        closestHit.isDead = true
        addKillFeed('Tú', closestHit.name || 'Rival', wep.name, true, true)
        player.credits += 200
        player.ultPoints = Math.min(player.maxUltPoints, player.ultPoints + 1)
      }
    } else {
      closestHit.hp -= damageDealt
      hitParticles.push({ x: closestHit.x, y: closestHit.y, timer: 12 })

      if (closestHit.hp <= 0) {
        closestHit.isDead = true
        closestHit.hp = 0
        addKillFeed('Tú', closestHit.name, wep.name, true, true)
        player.credits += 200
        player.ultPoints = Math.min(player.maxUltPoints, player.ultPoints + 1)
        if (player.isEmpress) player.hp = Math.min(player.maxHp, player.hp + 50)
        soulOrbs.push({ x: closestHit.x, y: closestHit.y, timer: 25 })
      }
    }
  } else if (wallHits.length > 0) {
    // Bullet hit 3D wall! Spawn wall spark
    hitParticles.push({ x: wallHits[0].point.x, y: wallHits[0].point.z, timer: 8 })
  }

  if (gameMode.value === 'multiplayer' && socket && currentRoom.value) {
    socket.emit('game_event', {
      roomId: currentRoom.value.id,
      event: { type: 'shoot', weaponSound: wep.sound, x: player.x, y: player.y, angle: player.angle }
    })
  }
}

function reloadWeapon() {
  if (player.isReloading || player.ammo >= currentWeapon.value.magSize) return
  player.isReloading = true
  setTimeout(() => {
    player.ammo = currentWeapon.value.magSize || 25
    player.isReloading = false
  }, 1400)
}

function triggerAbility(slot) {
  if (player.isDead || player.suppressedDuration > 0 || matchState.isBuyPhase) return
  playSound('ability')

  const agent = selectedAgent.value

  if (slot === 'E') {
    // Primary Signature (Dash / Teleport / Scan / Heal)
    if (agent === 'jett' || agent === 'neon') {
      player.dashEffectTimer = 16
      playSound('dash')
      safeDash(240, player.angle)
    } else if (agent === 'reyna') {
      player.isDismissed = true
      playSound('ability')
      setTimeout(() => { player.isDismissed = false }, 2500)
    } else if (agent === 'sage') {
      player.healEffectTimer = 35
      playSound('heal')
      player.hp = Math.min(player.maxHp, player.hp + 60)
    } else if (agent === 'omen' || agent === 'chamber') {
      player.dashEffectTimer = 10
      playSound('dash')
      safeDash(260, player.angle)
    } else {
      // General pulse / scan
      bots.forEach(b => {
        if (b.team !== player.team && Math.hypot(b.x - player.x, b.y - player.y) < 700) {
          b.hp -= 30
        }
      })
    }
  } else if (slot === 'Q') {
    // Flash / Concussion
    playSound('flash')
    player.flashTimer = 10
    bots.forEach(b => {
      if (b.team !== player.team && Math.hypot(b.x - player.x, b.y - player.y) < 700) {
        b.state = 'Blinded'
        setTimeout(() => { b.state = 'Normal' }, 3000)
      }
    })
  } else if (slot === 'C') {
    // Smoke / Molly / Field
    const isMolly = ['phoenix', 'brimstone', 'viper', 'killjoy'].includes(agent)
    smokeZones.push({
      x: player.x + Math.cos(player.angle) * 160,
      y: player.y + Math.sin(player.angle) * 160,
      radius: 90,
      timer: 8.0,
      type: isMolly ? 'molly' : 'smoke'
    })
  }
}

function triggerSuper() {
  if (player.isDead || player.ultPoints < player.maxUltPoints || player.suppressedDuration > 0 || matchState.isBuyPhase) return
  player.ultPoints = 0
  playSound('ult_sound')

  if (selectedAgent.value === 'jett') {
    player.bladeStormKnives = 5
  } else if (selectedAgent.value === 'reyna') {
    player.isEmpress = true
    player.hp = 100
    player.shield = 50
    setTimeout(() => { player.isEmpress = false }, 18000)
  } else {
    // High Impact Area Super / Bombardment
    playSound('explosion')
    player.dashEffectTimer = 10
    const targetX = player.x + Math.cos(player.angle) * 250
    const targetY = player.y + Math.sin(player.angle) * 250

    smokeZones.push({
      x: targetX,
      y: targetY,
      radius: 120,
      timer: 5.0,
      type: 'molly'
    })

    bots.forEach(b => {
      if (b.team !== player.team && Math.hypot(b.x - targetX, b.y - targetY) < 450) {
        b.hp -= 90
        if (b.hp <= 0) {
          b.isDead = true
          addKillFeed('Tú (SÚPER)', b.name, 'Definitiva', true, true)
        }
      }
    })
  }
}

function buyItem(item) {
  if (player.credits < item.price) return
  player.credits -= item.price
  if (item.isShield) {
    player.shield = Math.min(player.maxShield, player.shield + item.shield)
  } else {
    player.weapon = item.id
    player.ammo = item.magSize || 25
  }
  playSound('ability')
}

// --- FPS GAMELOOP & UPDATE ---
function gameLoop() {
  updateFPS()
  renderDOOMScene()
  animFrameId = requestAnimationFrame(gameLoop)
}

function updateFPS() {
  if (appState.value !== 'playing') return

  if (player.recoilOffset > 0) player.recoilOffset -= 1.2
  if (player.muzzleFlashTimer > 0) player.muzzleFlashTimer--
  if (player.flashTimer > 0) player.flashTimer--
  if (player.dashEffectTimer > 0) player.dashEffectTimer--
  if (player.healEffectTimer > 0) player.healEffectTimer--

  // Update bullet tracers
  for (let i = bulletTracers.length - 1; i >= 0; i--) {
    const t = bulletTracers[i]
    t.life -= 1
    t.alpha = t.life / t.maxLife
    if (t.life <= 0) {
      bulletTracers.splice(i, 1)
    }
  }

  // Detect floor / stair elevation at player position
  if (isMap3DLoaded.value && mapColliders.length > 0) {
    downRaycaster.set(new THREE.Vector3(player.x, 300, player.y), downVec)
    const floorHits = downRaycaster.intersectObjects(mapColliders, true)
    if (floorHits.length > 0) {
      for (const hit of floorHits) {
        if (hit.point.y >= -15 && hit.point.y <= 240) {
          player.currentFloorY += (hit.point.y - (player.currentFloorY || 0)) * 0.35
          break
        }
      }
    }
  }

  // Check death state & trigger spectator
  if (player.hp <= 0 && !player.isDead) {
    player.isDead = true
    player.hp = 0
    isSpectating.value = true
    spectatorIndex.value = 0
  }

  // Update Smoke / Molly zones
  for (let i = smokeZones.length - 1; i >= 0; i--) {
    const sm = smokeZones[i]
    sm.timer -= 0.016
    if (sm.type === 'molly') {
      bots.forEach(b => {
        if (!b.isDead && Math.hypot(b.x - sm.x, b.y - sm.y) < sm.radius) {
          b.hp -= 0.4
          if (b.hp <= 0) {
            b.isDead = true
            b.hp = 0
            addKillFeed('Habilidad', b.name, 'Zona Fuego', false, true)
          }
        }
      })
    }
    if (sm.timer <= 0) {
      smokeZones.splice(i, 1)
    }
  }

  // Freeze player if in buy phase or dead
  if (matchState.isBuyPhase || player.isDead) {
    player.isWalking = false
    if (player.isDead && aliveAlliesList.value.length === 0) {
      isSpectating.value = false
    }
  } else {
    // Keyboard turning
    if (keys.arrowLeft) player.angle -= player.rotSpeed
    if (keys.arrowRight) player.angle += player.rotSpeed

    // Continuous shooting if mouse is held down
    if (isMouseDown) {
      shootWeapon()
    }

    // Movement
    let moveX = 0; let moveY = 0
    const forwardX = Math.cos(player.angle)
    const forwardY = Math.sin(player.angle)
    const rightX = -Math.sin(player.angle)
    const rightY = Math.cos(player.angle)

    if (keys.w) { moveX += forwardX; moveY += forwardY }
    if (keys.s) { moveX -= forwardX; moveY -= forwardY }
    if (keys.a) { moveX -= rightX; moveY -= rightY }
    if (keys.d) { moveX += rightX; moveY += rightY }

    if (moveX !== 0 || moveY !== 0) {
      player.isWalking = true
      player.walkCycle += 0.18
      const curSpeed = player.speed * (keys.shift ? 0.5 : 1)
      const mag = Math.hypot(moveX, moveY)
      const stepX = (moveX / mag) * curSpeed
      const stepY = (moveY / mag) * curSpeed

      // Smooth axis-separated sliding collision
      if (!checkCollision(player.x + stepX, player.y, 16)) {
        player.x += stepX
      }
      if (!checkCollision(player.x, player.y + stepY, 16)) {
        player.y += stepY
      }
    } else {
      player.isWalking = false
    }

    // Spike actions
    handleSpikeActionsFPS()

    // Multiplayer sync
    if (gameMode.value === 'multiplayer' && socket && currentRoom.value) {
      socket.emit('player_sync', {
        roomId: currentRoom.value.id,
        data: {
          x: player.x,
          y: player.y,
          angle: player.angle,
          hp: player.hp,
          shield: player.shield,
          weapon: player.weapon,
          agentId: selectedAgent.value,
          team: player.team,
          name: playerName.value,
          isDead: player.isDead
        }
      })
    }
  }

  // Update Bots AI
  if (gameMode.value === 'practice' && !matchState.isBuyPhase) {
    updateBotsFPS()
  }
}

function isSolidTile(col, row) {
  if (row <= 0 || row >= MAP_ROWS - 1 || col <= 0 || col >= MAP_COLS - 1) return true
  const tile = (WORLD_GRID[row] && WORLD_GRID[row][col]) ?? 1
  return tile === 1 || tile === 4
}

function checkCollision(x, y, radius = 16) {
  const angles = [0, 0.785, 1.57, 2.356, 3.141, 3.926, 4.712, 5.497]
  for (let i = 0; i < 8; i++) {
    const px = x + Math.cos(angles[i]) * radius
    const py = y + Math.sin(angles[i]) * radius
    const col = Math.floor(px / CELL_SIZE)
    const row = Math.floor(py / CELL_SIZE)
    if (isSolidTile(col, row)) return true
  }
  return false
}

function handleSpikeActionsFPS() {
  const currentCellX = Math.floor(player.x / CELL_SIZE)
  const currentCellY = Math.floor(player.y / CELL_SIZE)
  const cellType = (WORLD_GRID[currentCellY] && WORLD_GRID[currentCellY][currentCellX]) || 0

  const inSite = cellType === 5 || cellType === 6

  if (keys['4']) {
    if (player.team === 'attackers' && !spike.planted && inSite) {
      player.isPlanting = true
      player.actionProgress += 0.022
      if (player.actionProgress >= 1) {
        spike.planted = true
        spike.x = player.x
        spike.y = player.y
        spike.site = cellType === 5 ? 'A' : 'B'
        spike.timer = 45
        player.isPlanting = false
        player.actionProgress = 0
        playSound('spike_plant')
      }
    } else if (player.team === 'defenders' && spike.planted && Math.hypot(player.x - spike.x, player.y - spike.y) < 90) {
      player.isDefusing = true
      player.actionProgress += 0.016
      if (player.actionProgress >= 1) {
        spike.defused = true
        player.isDefusing = false
        player.actionProgress = 0
        playSound('spike_defused')
        endRound('defenders', 'SPIKE DESACTIVADA')
      }
    }
  } else {
    player.isPlanting = false
    player.isDefusing = false
    player.actionProgress = 0
  }
}

function hasLineOfSight(x1, y1, x2, y2) {
  const dist = Math.hypot(x2 - x1, y2 - y1)
  if (dist < 10) return true
  const steps = Math.ceil(dist / 14)
  const dx = (x2 - x1) / steps
  const dy = (y2 - y1) / steps

  for (let i = 1; i < steps; i++) {
    const cx = Math.floor((x1 + dx * i) / CELL_SIZE)
    const cy = Math.floor((y1 + dy * i) / CELL_SIZE)
    if (isSolidTile(cx, cy)) {
      return false
    }
  }
  return true
}

function updateBotsFPS() {
  const siteAPos = { x: 17.0 * CELL_SIZE, y: 3.5 * CELL_SIZE }
  const siteBPos = { x: 17.0 * CELL_SIZE, y: 14.5 * CELL_SIZE }
  const midPos = { x: 17.0 * CELL_SIZE, y: 9.0 * CELL_SIZE }

  for (const bot of bots) {
    if (bot.isDead) continue

    // 1. Scan for Potential Targets (Player & Opposing Bots)
    let bestTarget = null
    let minTargetDist = 800

    // Can target player?
    if (bot.team !== player.team && !player.isDead) {
      const pDist = Math.hypot(player.x - bot.x, player.y - bot.y)
      if (pDist < minTargetDist && hasLineOfSight(bot.x, bot.y, player.x, player.y)) {
        minTargetDist = pDist
        bestTarget = { isPlayer: true, x: player.x, y: player.y, name: playerName.value, entity: player }
      }
    }

    // Can target other bots?
    for (const otherBot of bots) {
      if (otherBot.isDead || otherBot.team === bot.team) continue
      const bDist = Math.hypot(otherBot.x - bot.x, otherBot.y - bot.y)
      if (bDist < minTargetDist && hasLineOfSight(bot.x, bot.y, otherBot.x, otherBot.y)) {
        minTargetDist = bDist
        bestTarget = { isPlayer: false, x: otherBot.x, y: otherBot.y, name: otherBot.name, entity: otherBot }
      }
    }

    // 2. Combat State & Gunplay
    if (bestTarget) {
      bot.state = 'combat'
      bot.target = bestTarget
      bot.lastKnownPos = { x: bestTarget.x, y: bestTarget.y }

      // Aim towards target with smooth angle turn
      const targetAngle = Math.atan2(bestTarget.y - bot.y, bestTarget.x - bot.x)
      let angleDiff = targetAngle - bot.angle
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      bot.angle += angleDiff * 0.15

      // Combat Strafe Movement
      bot.strafeTimer = (bot.strafeTimer || 0) + 1
      if (bot.strafeTimer > 45) {
        bot.strafeTimer = 0
        bot.strafeDir *= -1
      }
      const strafeX = -Math.sin(bot.angle) * bot.strafeDir * 1.6
      const strafeY = Math.cos(bot.angle) * bot.strafeDir * 1.6
      if (!checkCollision(bot.x + strafeX, bot.y, 16)) bot.x += strafeX
      if (!checkCollision(bot.x, bot.y + strafeY, 16)) bot.y += strafeY

      // Burst Fire with Recoil & Spread
      bot.shootCooldown = (bot.shootCooldown || 0) + 1
      if (bot.shootCooldown >= 32) {
        bot.shootCooldown = 0
        const wep = WEAPONS.find(w => w.id === bot.weapon) || WEAPONS[12]
        playSound(wep.sound || 'vandal')

        // Accuracy calculation
        const hitChance = Math.max(0.35, 1 - (minTargetDist / 900))
        if (Math.random() < hitChance) {
          const isHeadshot = Math.random() < 0.22
          const damage = (wep.damage || 30) * (isHeadshot ? 2.5 : 1.0)

          if (bestTarget.isPlayer) {
            player.hp -= damage
            playSound('hurt')
            if (player.hp <= 0) {
              player.isDead = true
              player.hp = 0
              addKillFeed(bot.name, 'Tú', wep.name, isHeadshot, false)
              isSpectating.value = true
            }
          } else {
            bestTarget.entity.hp -= damage
            if (bestTarget.entity.hp <= 0) {
              bestTarget.entity.isDead = true
              bestTarget.entity.hp = 0
              addKillFeed(bot.name, bestTarget.name, wep.name, isHeadshot, bot.team === player.team)
              soulOrbs.push({ x: bestTarget.x, y: bestTarget.y, timer: 25 })
            }
          }
        }
      }

      // Tactical Abilities in Combat
      bot.abilityTimer = (bot.abilityTimer || 200) - 1
      if (bot.abilityTimer <= 0) {
        bot.abilityTimer = 240 + Math.random() * 180
        if (bot.agentKey === 'sage' && bot.hp < 60) {
          bot.hp = Math.min(bot.maxHp, bot.hp + 45)
          playSound('ability')
        } else if (bot.agentKey === 'jett' || bot.agentKey === 'neon') {
          const dashX = Math.cos(bot.angle + Math.PI / 2 * bot.strafeDir) * 120
          const dashY = Math.sin(bot.angle + Math.PI / 2 * bot.strafeDir) * 120
          if (!checkCollision(bot.x + dashX, bot.y, 16)) bot.x += dashX
          if (!checkCollision(bot.x, bot.y + dashY, 16)) bot.y += dashY
          playSound('ability')
        }
      }

      continue // Skip navigation while engaged in active combat
    }

    // 3. Navigation & Strategic Objectives (When not in direct line of sight)
    let destPos = siteAPos

    if (spike.planted) {
      destPos = { x: spike.x, y: spike.y }

      if (bot.team === 'defenders') {
        const distToSpike = Math.hypot(spike.x - bot.x, spike.y - bot.y)
        if (distToSpike < 65 && !spike.defused) {
          bot.state = 'defusing'
          bot.actionProgress = (bot.actionProgress || 0) + 0.012
          if (bot.actionProgress >= 1) {
            spike.defused = true
            bot.actionProgress = 0
            playSound('spike_defused')
            endRound('defenders', 'SPIKE DESACTIVADA')
          }
          continue
        }
      } else {
        const distToSpike = Math.hypot(spike.x - bot.x, spike.y - bot.y)
        if (distToSpike < 200) {
          bot.angle += 0.02
          continue
        }
      }
    } else {
      if (bot.team === 'attackers') {
        destPos = bot.strategy === 'attack_A' ? siteAPos : siteBPos

        const distToDest = Math.hypot(destPos.x - bot.x, destPos.y - bot.y)
        if (bot.hasSpike && distToDest < 80) {
          bot.state = 'planting'
          bot.actionProgress = (bot.actionProgress || 0) + 0.016
          if (bot.actionProgress >= 1) {
            spike.planted = true
            spike.x = bot.x
            spike.y = bot.y
            spike.site = bot.strategy === 'attack_A' ? 'A' : 'B'
            spike.timer = 45
            bot.actionProgress = 0
            bot.hasSpike = false
            playSound('spike_plant')
          }
          continue
        }
      } else {
        if (bot.strategy === 'defend_A') destPos = siteAPos
        else if (bot.strategy === 'defend_B') destPos = siteBPos
        else destPos = midPos

        const distToGuard = Math.hypot(destPos.x - bot.x, destPos.y - bot.y)
        if (distToGuard < 140) {
          bot.angle += 0.015
          continue
        }
      }
    }

    // Move toward objective waypoint with sliding collision
    const navDx = destPos.x - bot.x
    const navDy = destPos.y - bot.y
    const navDist = Math.hypot(navDx, navDy)

    if (navDist > 40) {
      const targetMoveAngle = Math.atan2(navDy, navDx)
      bot.angle = targetMoveAngle
      const bStepX = (navDx / navDist) * bot.speed
      const bStepY = (navDy / navDist) * bot.speed
      if (!checkCollision(bot.x + bStepX, bot.y, 16)) bot.x += bStepX
      if (!checkCollision(bot.x, bot.y + bStepY, 16)) bot.y += bStepY
    }
  }
}

// --- 2.5D DOOM RAYCASTING ENGINE RENDERER ---
const SCREEN_WIDTH = 960
const SCREEN_HEIGHT = 500
const NUM_RAYS = 320 // Retro DOOM slice density
const FOV = Math.PI / 3 // 60 degrees

function renderDOOMScene() {
  if (!canvasRef.value) return
  ctx = canvasRef.value.getContext('2d')

  const isSpectatingDead = player.isDead && currentSpectatedAlly.value
  const observer = isSpectatingDead ? currentSpectatedAlly.value : player

  // 1. Render 3D WebGL GLB Arena with Three.js (Follows spectated teammate if dead)
  if (threeRenderer && threeScene && threeCamera) {
    const camX = observer.x
    const camZ = observer.y
    const eyeY = 36 + (observer.floorY || observer.currentFloorY || 0)
    const pitch = observer.pitch || 0
    const yaw = observer.angle || 0

    threeCamera.position.set(camX, eyeY, camZ)
    threeCamera.lookAt(
      camX + Math.cos(yaw) * Math.cos(pitch) * 200,
      eyeY + Math.sin(pitch) * 200,
      camZ + Math.sin(yaw) * Math.cos(pitch) * 200
    )
    threeRenderer.render(threeScene, threeCamera)
  }

  // 2. Clear 2D HUD Canvas Layer
  ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

  if (!isMap3DLoaded.value) {
    ctx.fillStyle = 'rgba(12, 16, 23, 0.88)'
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    ctx.fillStyle = '#00e5ff'
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('CARGANDO MAPA TÁCTICO 3D...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2)
  }

  // 3. Render 3D Billboard Characters & Spike on 2D Overlay
  if (threeCamera) {
    const renderList = []

    // Collect bots
    for (const bot of bots) {
      if (!bot.isDead && !(isSpectatingDead && bot.id === observer.id)) {
        renderList.push({
          id: bot.id,
          x: bot.x,
          y: bot.y,
          floorY: bot.floorY || 0,
          name: bot.name,
          agentKey: bot.agentKey,
          isAlly: bot.team === player.team,
          hp: bot.hp,
          maxHp: bot.maxHp || 100,
          shield: bot.shield || 0,
          state: bot.state,
          type: 'bot'
        })
      }
    }

    // Collect remote multiplayer players
    if (gameMode.value === 'multiplayer') {
      for (const [id, rP] of Object.entries(remotePlayers)) {
        if (!rP.isDead && (rP.hp ?? 100) > 0 && !(isSpectatingDead && id === observer.id)) {
          renderList.push({
            id: id,
            x: rP.x ?? 0,
            y: rP.y ?? 0,
            floorY: rP.floorY || 0,
            name: rP.name || 'Rival',
            agentKey: rP.agentId || 'jett',
            isAlly: rP.team === player.team,
            hp: rP.hp ?? 100,
            maxHp: 100,
            shield: rP.shield ?? 0,
            state: 'combat',
            type: 'bot'
          })
        }
      }
    }

    // Collect Spike
    if (spike.planted) {
      renderList.push({
        x: spike.x,
        y: spike.y,
        floorY: spike.floorY || 0,
        type: 'spike'
      })
    }

    // Sort by distance from active observer
    renderList.forEach(item => {
      item.dist = Math.hypot(item.x - observer.x, item.y - observer.y)
    })
    renderList.sort((a, b) => b.dist - a.dist)

    const projVec = new THREE.Vector3()

    for (const item of renderList) {
      if (item.dist < 8) continue // Too close to camera

      // Calculate 3D center point
      const entElevation = item.floorY + (item.type === 'spike' ? 10 : 32)

      // Occlusion culling: do not render characters/spike behind walls
      if (!hasLineOfSight(observer.x, observer.y, item.x, item.y)) {
        continue
      }

      projVec.set(item.x, entElevation, item.y)
      projVec.project(threeCamera)

      // Only draw if in front of camera frustum
      if (projVec.z > -1.0 && projVec.z < 1.0) {
        const screenX = (projVec.x * 0.5 + 0.5) * SCREEN_WIDTH
        const screenY = (-projVec.y * 0.5 + 0.5) * SCREEN_HEIGHT

        // Screen size inversely proportional to distance
        const baseSize = item.type === 'spike' ? 56 : 96
        const spriteSize = Math.max(20, Math.min(280, (baseSize / item.dist) * 450))

        if (item.type === 'bot') {
          const feetVec = new THREE.Vector3(item.x, item.floorY + 2, item.y).project(threeCamera)
          const feetX = (feetVec.x * 0.5 + 0.5) * SCREEN_WIDTH
          const feetY = (-feetVec.y * 0.5 + 0.5) * SCREEN_HEIGHT

          // 1. Team Glow Ring at feet
          ctx.save()
          ctx.beginPath()
          ctx.ellipse(feetX, feetY, spriteSize * 0.4, spriteSize * 0.16, 0, 0, Math.PI * 2)
          ctx.fillStyle = item.isAlly ? 'rgba(0, 229, 255, 0.35)' : 'rgba(255, 70, 85, 0.35)'
          ctx.fill()
          ctx.strokeStyle = item.isAlly ? '#00e5ff' : '#ff4655'
          ctx.lineWidth = Math.max(1.5, spriteSize * 0.035)
          ctx.stroke()
          ctx.restore()

          // 2. 2D Billboard Agent Sprite
          const ag = AGENTS[item.agentKey]
          const customImg = customSprites[item.agentKey]

          if (customImg && customImg.complete && customImg.naturalWidth > 0) {
            ctx.drawImage(
              customImg,
              screenX - spriteSize / 2,
              screenY - spriteSize / 2,
              spriteSize,
              spriteSize
            )
          } else if (spritesheetImg && spritesheetImg.complete && spritesheetImg.naturalWidth > 0 && ag) {
            const frameW = spritesheetImg.naturalWidth / 4
            const frameH = spritesheetImg.naturalHeight / 4
            const sx = (ag.col || 0) * frameW
            const sy = (ag.row || 0) * frameH

            ctx.imageSmoothingEnabled = false
            ctx.drawImage(
              spritesheetImg,
              sx, sy, frameW, frameH,
              screenX - spriteSize / 2,
              screenY - spriteSize / 2,
              spriteSize,
              spriteSize
            )
          } else {
            // Fallback Billboard Chibi Circle
            ctx.beginPath()
            ctx.arc(screenX, screenY, spriteSize * 0.35, 0, Math.PI * 2)
            ctx.fillStyle = ag?.color || (item.isAlly ? '#00e5ff' : '#ff4655')
            ctx.fill()
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.stroke()
          }

          // 3. Overhead Tactical Health & Shield Bar
          const barWidth = Math.max(36, spriteSize * 0.7)
          const barHeight = Math.max(4, spriteSize * 0.09)
          const barY = screenY - spriteSize * 0.55 - 12

          ctx.fillStyle = 'rgba(10, 14, 20, 0.85)'
          ctx.fillRect(screenX - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2)

          const hpWidth = Math.max(0, (item.hp / item.maxHp) * barWidth)
          ctx.fillStyle = item.isAlly ? '#00e5ff' : '#ff4655'
          ctx.fillRect(screenX - barWidth / 2, barY, hpWidth, barHeight)

          // 4. Overhead Name & Status Tag
          ctx.fillStyle = '#ffffff'
          ctx.font = `bold ${Math.max(10, Math.min(14, spriteSize * 0.18))}px "Plus Jakarta Sans", sans-serif`
          ctx.textAlign = 'center'
          ctx.shadowColor = 'rgba(0,0,0,0.8)'
          ctx.shadowBlur = 4

          let statusTag = item.name
          if (item.state === 'planting') statusTag += ' 💣 [PLANTANDO]'
          if (item.state === 'defusing') statusTag += ' 🛡️ [DESACTIVANDO]'
          if (item.state === 'Blinded') statusTag += ' 🎯 [CEGADO]'

          ctx.fillText(statusTag, screenX, barY - 4)
          ctx.shadowBlur = 0
        } else if (item.type === 'spike') {
          // Planted Spike 3D Marker
          ctx.save()
          const pulse = Math.sin(Date.now() * 0.008) * 0.2 + 1.0
          ctx.beginPath()
          ctx.arc(screenX, screenY, spriteSize * 0.3 * pulse, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 23, 68, 0.4)'
          ctx.fill()

          ctx.beginPath()
          ctx.arc(screenX, screenY, spriteSize * 0.18, 0, Math.PI * 2)
          ctx.fillStyle = '#ff1744'
          ctx.fill()
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()

          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(`SPIKE: ${spike.timer}s`, screenX, screenY - spriteSize * 0.35)
          ctx.restore()
        }
      }
    }
  }

  // 4. Render Laser Bullet Tracers & Hit Particles
  renderTracersAndEffects()

  // 5. Render First-Person Animated Weapon
  renderFirstPersonWeapon()

  // 6. Crosshair
  renderTacticalCrosshair()

  // 7. Tactical Radar Minimap (Top-Right)
  renderMinimapRadar()
}

function renderTracersAndEffects() {
  // Laser Bullet Tracers
  for (const t of bulletTracers) {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(t.startX, t.startY)
    ctx.lineTo(t.endX, t.endY)
    ctx.strokeStyle = t.color
    ctx.lineWidth = t.width
    ctx.globalAlpha = Math.max(0, t.alpha)
    ctx.shadowColor = t.color
    ctx.shadowBlur = 10
    ctx.stroke()
    ctx.restore()
  }

  // Hit Spark Particles
  for (let i = hitParticles.length - 1; i >= 0; i--) {
    const hp = hitParticles[i]
    hp.timer--
    if (hp.timer <= 0) {
      hitParticles.splice(i, 1)
      continue
    }
    if (threeCamera) {
      const pVec = new THREE.Vector3(hp.x, 32, hp.y).project(threeCamera)
      if (pVec.z > -1 && pVec.z < 1) {
        const sx = (pVec.x * 0.5 + 0.5) * SCREEN_WIDTH
        const sy = (-pVec.y * 0.5 + 0.5) * SCREEN_HEIGHT
        ctx.save()
        ctx.fillStyle = '#ffd700'
        ctx.shadowColor = '#ff4655'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(sx + (Math.random() - 0.5) * 16, sy + (Math.random() - 0.5) * 16, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
  }
}

function renderTacticalCrosshair() {
  const cx = SCREEN_WIDTH / 2
  const cy = SCREEN_HEIGHT / 2
  const spread = player.recoilOffset * 0.6 + (player.isWalking ? 4 : 0)

  ctx.save()
  ctx.strokeStyle = '#00ffff'
  ctx.lineWidth = 2
  ctx.shadowColor = '#00e5ff'
  ctx.shadowBlur = 4

  ctx.beginPath()
  ctx.moveTo(cx - 10 - spread, cy)
  ctx.lineTo(cx - 3 - spread, cy)
  ctx.moveTo(cx + 3 + spread, cy)
  ctx.lineTo(cx + 10 + spread, cy)
  ctx.moveTo(cx, cy - 10 - spread)
  ctx.lineTo(cx, cy - 3 - spread)
  ctx.moveTo(cx, cy + 3 + spread)
  ctx.lineTo(cx, cy + 10 + spread)
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(cx, cy, 1.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function renderFirstPersonWeapon() {
  const isSpectatingDead = player.isDead && currentSpectatedAlly.value
  const bobX = (player.isWalking && !player.isDead) ? Math.sin(player.walkCycle) * 12 : 0
  const bobY = (player.isWalking && !player.isDead) ? Math.abs(Math.cos(player.walkCycle)) * 10 : 0
  const gunCenterX = SCREEN_WIDTH / 2 + 110 + bobX
  const gunCenterY = SCREEN_HEIGHT - 30 + bobY + (player.isDead ? 0 : player.recoilOffset)

  // Gun Body (Tactical Rifle style)
  ctx.fillStyle = '#1c2430'
  ctx.fillRect(gunCenterX - 36, gunCenterY - 130, 72, 140)

  // Gun Barrel & Accents
  ctx.fillStyle = '#11161f'
  ctx.fillRect(gunCenterX - 18, gunCenterY - 190, 36, 70)

  // Neon Energy Line
  ctx.fillStyle = selectedSide.value === 'attackers' ? '#ff4655' : '#00e5ff'
  ctx.fillRect(gunCenterX - 4, gunCenterY - 170, 8, 90)

  // Hand Grip
  ctx.fillStyle = '#3a4454'
  ctx.beginPath()
  ctx.arc(gunCenterX + 45, gunCenterY - 30, 24, 0, Math.PI * 2)
  ctx.fill()

  // Muzzle Flash
  if (!player.isDead && player.muzzleFlashTimer > 0) {
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(gunCenterX, gunCenterY - 200, 32 + Math.random() * 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(gunCenterX, gunCenterY - 200, 16, 0, Math.PI * 2)
    ctx.fill()
  }
}

function renderMinimapRadar() {
  const radarSize = 130
  const radarX = SCREEN_WIDTH - radarSize - 14
  const radarY = 14

  ctx.save()
  ctx.fillStyle = 'rgba(10, 14, 20, 0.88)'
  ctx.fillRect(radarX, radarY, radarSize, radarSize)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(radarX, radarY, radarSize, radarSize)

  const scale = radarSize / (MAP_COLS * CELL_SIZE)

  // Draw Plant Sites A and B on Radar (Green Zones)
  ctx.fillStyle = 'rgba(0, 255, 136, 0.35)'
  ctx.fillRect(radarX + 14 * CELL_SIZE * scale, radarY + 2 * CELL_SIZE * scale, 6 * CELL_SIZE * scale, 4 * CELL_SIZE * scale)
  ctx.fillRect(radarX + 14 * CELL_SIZE * scale, radarY + 13 * CELL_SIZE * scale, 6 * CELL_SIZE * scale, 4 * CELL_SIZE * scale)

  ctx.fillStyle = '#00ff88'
  ctx.font = 'bold 8px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('SITE A', radarX + 17 * CELL_SIZE * scale, radarY + 4 * CELL_SIZE * scale)
  ctx.fillText('SITE B', radarX + 17 * CELL_SIZE * scale, radarY + 15 * CELL_SIZE * scale)

  // Draw Central Orange Pillar
  ctx.fillStyle = '#ff8800'
  ctx.fillRect(radarX + 15 * CELL_SIZE * scale, radarY + 8 * CELL_SIZE * scale, 4 * CELL_SIZE * scale, 2 * CELL_SIZE * scale)

  const isSpectatingDead = player.isDead && currentSpectatedAlly.value
  const observer = isSpectatingDead ? currentSpectatedAlly.value : player

  // Draw Observer on Radar
  const pRx = radarX + observer.x * scale
  const pRy = radarY + observer.y * scale

  ctx.fillStyle = isSpectatingDead ? '#ffd700' : '#00ffff'
  ctx.beginPath()
  ctx.arc(pRx, pRy, isSpectatingDead ? 5.5 : 4.5, 0, Math.PI * 2)
  ctx.fill()
  if (isSpectatingDead) {
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  // FOV Cone on Radar
  ctx.strokeStyle = isSpectatingDead ? 'rgba(255, 215, 0, 0.6)' : 'rgba(0, 229, 255, 0.5)'
  ctx.beginPath()
  ctx.moveTo(pRx, pRy)
  ctx.lineTo(pRx + Math.cos(observer.angle - FOV / 2) * 26, pRy + Math.sin(observer.angle - FOV / 2) * 26)
  ctx.moveTo(pRx, pRy)
  ctx.lineTo(pRx + Math.cos(observer.angle + FOV / 2) * 26, pRy + Math.sin(observer.angle + FOV / 2) * 26)
  ctx.stroke()

  // Draw Bots on Radar
  for (const bot of bots) {
    if (bot.isDead || (isSpectatingDead && bot.id === observer.id)) continue
    ctx.fillStyle = bot.team === player.team ? '#00e5ff' : '#ff4655'
    ctx.beginPath()
    ctx.arc(radarX + bot.x * scale, radarY + bot.y * scale, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }

  if (gameMode.value === 'multiplayer') {
    for (const [id, rP] of Object.entries(remotePlayers)) {
      if (!rP.isDead && (rP.hp ?? 100) > 0 && !(isSpectatingDead && id === observer.id)) {
        ctx.fillStyle = rP.team === player.team ? '#00e5ff' : '#ff4655'
        ctx.beginPath()
        ctx.arc(radarX + (rP.x ?? 0) * scale, radarY + (rP.y ?? 0) * scale, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // Draw Planted Spike on Radar
  if (spike.planted) {
    ctx.fillStyle = '#ff1744'
    ctx.beginPath()
    ctx.arc(radarX + spike.x * scale, radarY + spike.y * scale, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}
</script>

<template>
  <div class="doom-valorant-container">
    <!-- MODE SELECTOR MODAL -->
    <div v-if="appState === 'mode_select'" class="modal-overlay">
      <div class="modal-content mode-select-modal">
        <span class="modal-badge">VALORANT DOOM 2.5D · FIRST PERSON TACTICAL</span>
        <h2>ELIGE TU MODO DE JUEGO</h2>
        <p class="subtitle">Disfruta de la experiencia táctica en primera persona con estética retro DOOM.</p>

        <div class="mode-cards-grid">
          <div class="mode-card" @click="selectMode('practice')">
            <div class="mode-icon">🤖</div>
            <h3>MODO PRÁCTICA (BOTS)</h3>
            <p>Juega offline con bots en primera persona, 19 agentes, arsenal y habilidades completas.</p>
            <button class="btn-select-mode">ENTRENAR OFFLINE</button>
          </div>

          <div class="mode-card featured" @click="selectMode('multiplayer')">
            <div class="mode-icon">🌐</div>
            <span class="badge-online">ONLINE 5v5</span>
            <h3>MULTIJUGADOR ONLINE</h3>
            <p>Salas 5v5 en tiempo real. Atacantes vs Defensores, chat de equipo y combate FPS sincronizado.</p>
            <button class="btn-select-mode primary">CREAR / UNIRSE A SALA</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MULTIPLAYER LOBBY BROWSER -->
    <div v-if="appState === 'mp_lobby_browser'" class="modal-overlay">
      <div class="modal-content mp-browser-modal">
        <div class="browser-header">
          <div>
            <span class="modal-badge">SALAS MULTIJUGADOR FPS 5v5</span>
            <h2>LOBBY DE PARTIDAS EN LÍNEA</h2>
          </div>
          <button class="btn-back-mode" @click="appState = 'mode_select'">← CAMBIAR MODO</button>
        </div>

        <div class="player-config-bar">
          <div class="input-group">
            <label>NOMBRE DEL AGENTE:</label>
            <input v-model="playerName" @change="savePlayerName" placeholder="Tu nombre..." maxlength="16" />
          </div>
          <div class="input-group">
            <label>CÓDIGO DE SALA:</label>
            <div class="code-join-box">
              <input v-model="directRoomCode" placeholder="CÓDIGO (ej. ABCD12)" maxlength="6" />
              <button class="btn-join-code" @click="joinByCode">UNIRSE</button>
            </div>
          </div>
        </div>

        <div class="create-room-box">
          <input v-model="newRoomName" placeholder="Nombre de tu sala (opcional)..." />
          <button class="btn-create-room" @click="createRoom">➕ CREAR NUEVA SALA 5v5</button>
        </div>

        <div v-if="mpErrorMessage" class="mp-error-banner">{{ mpErrorMessage }}</div>

        <div class="rooms-list-container">
          <div class="section-title">SALAS DISPONIBLES:</div>
          <div v-if="roomsList.length === 0" class="no-rooms-msg">
            No hay salas activas. ¡Crea la primera y pásale el código a tus amigos!
          </div>
          <div v-else class="rooms-grid">
            <div v-for="rm in roomsList" :key="rm.id" class="room-row-card">
              <div class="room-info">
                <span class="room-title">{{ rm.name }}</span>
                <span class="room-host">Host: {{ rm.hostName }} | Código: <b>{{ rm.id }}</b></span>
              </div>
              <div class="room-meta">
                <span class="room-players-badge">{{ rm.playerCount }} / {{ rm.maxPlayers }}</span>
                <button class="btn-join-room" @click="joinRoom(rm.id)">ENTRAR</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MULTIPLAYER 5v5 PRE-MATCH ROOM LOBBY -->
    <div v-if="appState === 'mp_room_lobby' && currentRoom" class="modal-overlay">
      <div class="modal-content room-lobby-modal">
        <div class="room-lobby-header">
          <div>
            <span class="modal-badge">SALA TÁCTICA 5v5 · CÓDIGO: {{ currentRoom.id }}</span>
            <h2>{{ currentRoom.name }}</h2>
          </div>
          <button class="btn-leave-room" @click="leaveRoom">SALIR DE LA SALA</button>
        </div>

        <div class="teams-split-5v5">
          <div class="team-column attackers">
            <div class="team-header">
              <span class="team-title">⚔️ ATACANTES ({{ currentRoom.players.filter(p => p.team === 'attackers').length }}/5)</span>
              <button v-if="myMultiplayerPlayer?.team !== 'attackers'" class="btn-switch-team" @click="switchTeam('attackers')">CAMBIAR</button>
            </div>
            <div class="player-slots-list">
              <div v-for="p in currentRoom.players.filter(p => p.team === 'attackers')" :key="p.id" class="player-slot-card" :class="{ isMe: p.id === myMultiplayerPlayer?.id }">
                <span class="agent-tag">{{ AGENTS[p.agentId]?.name || 'JETT' }}</span>
                <span class="p-name">{{ p.name }} <b v-if="p.isHost">(HOST)</b></span>
              </div>
            </div>
          </div>

          <div class="team-column defenders">
            <div class="team-header">
              <span class="team-title">🛡️ DEFENSORES ({{ currentRoom.players.filter(p => p.team === 'defenders').length }}/5)</span>
              <button v-if="myMultiplayerPlayer?.team !== 'defenders'" class="btn-switch-team" @click="switchTeam('defenders')">CAMBIAR</button>
            </div>
            <div class="player-slots-list">
              <div v-for="p in currentRoom.players.filter(p => p.team === 'defenders')" :key="p.id" class="player-slot-card" :class="{ isMe: p.id === myMultiplayerPlayer?.id }">
                <span class="agent-tag">{{ AGENTS[p.agentId]?.name || 'PHOENIX' }}</span>
                <span class="p-name">{{ p.name }} <b v-if="p.isHost">(HOST)</b></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 19 AGENT SELECTOR IN LOBBY -->
        <div class="section-title">ELIGE TU AGENTE (19 DISPONIBLES):</div>
        <div class="agent-grid-19">
          <div
            v-for="(ag, key) in AGENTS"
            :key="key"
            class="agent-card-chibi"
            :class="{ selected: selectedAgent === key }"
            @click="selectAgentMp(key)"
          >
            <div
              class="chibi-avatar-frame"
              :style="ag.customImg ? {
                backgroundImage: `url(${ag.customImg})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              } : {
                backgroundImage: 'url(/assets/agents_spritesheet.png)',
                backgroundSize: '400% 400%',
                backgroundPosition: `${(ag.col || 0) * 33.333333}% ${(ag.row || 0) * 33.333333}%`,
                imageRendering: 'pixelated'
              }"
            ></div>
            <span class="agent-name">{{ ag.name }}</span>
            <span class="agent-role" :style="{ color: ag.color }">{{ ag.role }}</span>
          </div>
        </div>

        <div class="lobby-bottom-bar">
          <div class="lobby-chat-box">
            <div class="chat-messages-container">
              <div v-for="m in chatMessages" :key="m.id" class="chat-msg-row">
                <span class="msg-sender" :class="m.team">[{{ m.senderName }}]:</span>
                <span class="msg-text">{{ m.text }}</span>
              </div>
            </div>
            <div class="chat-input-row">
              <input v-model="chatInputText" @keyup.enter="sendChatMessage" placeholder="Mensaje de equipo..." />
              <button class="btn-send-chat" @click="sendChatMessage">ENVIAR</button>
            </div>
          </div>

          <div class="lobby-actions">
            <button v-if="!myMultiplayerPlayer?.isLocked" class="btn-lock-agent" @click="lockAgentMp">🔒 BLOQUEAR</button>
            <button v-if="myMultiplayerPlayer?.isHost" class="btn-start-match-host" @click="startMatchAsHost">🚀 INICIAR 5v5</button>
          </div>
        </div>
      </div>
    </div>

    <!-- AGENT SELECTOR (PRACTICE MODE) -->
    <div v-if="appState === 'agent_select'" class="modal-overlay">
      <div class="modal-content">
        <div class="browser-header">
          <button class="btn-back-mode" @click="appState = 'mode_select'">← CAMBIAR MODO</button>
          <span class="modal-badge">VALORANT DOOM · MODO PRÁCTICA</span>
          <div style="width: 100px;"></div>
        </div>
        <h2>SELECCIONA TU AGENTE & BANDO</h2>
        <p class="subtitle">19 agentes con perspectiva en primera persona, físicas de disparo y habilidades tácticas.</p>

        <div class="side-selector">
          <button class="side-btn" :class="{ active: selectedSide === 'attackers' }" @click="selectedSide = 'attackers'">
            ⚔️ ATACANTES (Plantar Spike)
          </button>
          <button class="side-btn" :class="{ active: selectedSide === 'defenders' }" @click="selectedSide = 'defenders'">
            🛡️ DEFENSORES (Desactivar Spike)
          </button>
        </div>

        <div class="section-title">AGENTES DISPONIBLES (19):</div>
        <div class="agent-grid-19">
          <div
            v-for="(ag, key) in AGENTS"
            :key="key"
            class="agent-card-chibi"
            :class="{ selected: selectedAgent === key }"
            @click="selectedAgent = key"
          >
            <div
              class="chibi-avatar-frame"
              :style="ag.customImg ? {
                backgroundImage: `url(${ag.customImg})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              } : {
                backgroundImage: 'url(/assets/agents_spritesheet.png)',
                backgroundSize: '400% 400%',
                backgroundPosition: `${(ag.col || 0) * 33.333333}% ${(ag.row || 0) * 33.333333}%`,
                imageRendering: 'pixelated'
              }"
            ></div>
            <span class="agent-name">{{ ag.name }}</span>
            <span class="agent-role" :style="{ color: ag.color }">{{ ag.role }}</span>
          </div>
        </div>

        <button class="btn-play-match" @click="startPracticeMatch">
          ENTRAR AL COMBATE DOOM FPS
        </button>
      </div>
    </div>

    <!-- TOP HEADER -->
    <header class="match-header-official" v-show="appState === 'playing'">
      <div class="roster-side allies">
        <span class="team-badge-text ally">ALIADOS ({{ aliveAllies.length }})</span>
      </div>

      <div class="center-match-box">
        <div class="hex-score ally-score">{{ matchState.scoreAlly }}</div>
        <div class="timer-display-box">
          <div v-if="matchState.isBuyPhase" class="buy-phase-wrap">
            <span class="buy-phase-text">COMPRA ({{ matchState.buyPhaseTime }}s)</span>
            <button class="btn-open-shop" @click="isBuyMenuOpen = true" title="Abrir Tienda">🛒 TIENDA (B)</button>
            <button class="btn-skip-buy" @click="skipBuyPhase">⚡ COMBATIR YA</button>
          </div>
          <span v-else-if="spike.planted" class="spike-timer-active">⚠️ SPIKE {{ spike.timer }}s</span>
          <span v-else class="round-timer-text">{{ matchState.roundTimeLeft }}s</span>
        </div>
        <div class="hex-score enemy-score">{{ matchState.scoreEnemy }}</div>
      </div>

      <div class="roster-side enemies-and-menu">
        <span class="team-badge-text enemy">RIVALES ({{ aliveEnemies.length }})</span>
        <button class="btn-pause-menu" @click="togglePauseMenu" title="Menú / Salir de la partida">⚙️ MENÚ (ESC)</button>
      </div>
    </header>

    <!-- 3D FIRST PERSON CANVAS VIEWPORT -->
    <main class="fps-canvas-wrapper" v-show="appState === 'playing'">
      <canvas ref="threeCanvasRef" width="960" height="500" class="three-canvas-layer"></canvas>
      <canvas ref="canvasRef" width="960" height="500" class="hud-canvas-layer"></canvas>

      <!-- SPECTATOR HUD BANNER (CAMERA DE COMPAÑEROS) -->
      <div v-if="player.isDead && currentSpectatedAlly" class="spectator-hud-overlay">
        <div class="spectator-card">
          <div class="spectator-badge-row">
            <span class="spectator-tag">👁️ MODO ESPECTADOR</span>
            <span class="spectator-index-tag">ALIADO {{ spectatorIndex + 1 }} DE {{ aliveAlliesList.length }}</span>
          </div>
          <div class="spectator-player-row">
            <span class="spectated-target-name">{{ currentSpectatedAlly.name }}</span>
            <span class="spectated-agent-pill" :style="{ borderColor: AGENTS[currentSpectatedAlly.agentKey]?.color || '#00e5ff', color: AGENTS[currentSpectatedAlly.agentKey]?.color || '#00e5ff' }">
              {{ AGENTS[currentSpectatedAlly.agentKey]?.name || 'AGENTE' }}
            </span>
          </div>
          <div class="spectator-controls-help">
            <button class="btn-spectate-nav" @click.stop="prevSpectateTarget">◀ [A / CLIC DER]</button>
            <span class="spectator-hint-text">Cambiar Cámara</span>
            <button class="btn-spectate-nav" @click.stop="nextSpectateTarget">[D / ESPACIO / CLIC IZQ] ▶</button>
          </div>
        </div>
      </div>

      <!-- KILLFEED -->
      <div class="killfeed-container">
        <div v-for="kf in killfeed" :key="kf.id" class="kill-badge" :class="{ 'ally-kill': kf.isAlly }">
          <span class="k-name killer">{{ kf.killer }}</span>
          <span class="k-wep">{{ kf.weapon }}</span>
          <span class="k-name victim">{{ kf.victim }}</span>
          <span v-if="kf.headshot" class="k-hs">🎯</span>
        </div>
      </div>

      <!-- PLANT / DEFUSE PROGRESS -->
      <div v-if="player.isPlanting || player.isDefusing" class="action-progress-bar" :class="{ plant: player.isPlanting, defuse: player.isDefusing }">
        <div class="bar-fill" :style="{ width: `${player.actionProgress * 100}%` }"></div>
        <span class="bar-text">{{ player.isPlanting ? 'PLANTANDO SPIKE...' : 'DESACTIVANDO SPIKE...' }}</span>
      </div>

      <!-- ROUND WIN BANNER -->
      <div v-if="matchState.roundBannerText" class="round-banner" :class="{ defenders: matchState.winner === 'defenders' }">
        <h1>{{ matchState.roundBannerText }}</h1>
        <p>{{ matchState.roundBannerSub }}</p>
      </div>
    </main>

    <!-- OFFICIAL BUY MENU MODAL -->
    <div v-if="isBuyMenuOpen" class="modal-overlay">
      <div class="modal-content buy-modal-full">
        <span class="modal-badge">TIENDA FPS · CRÉDITOS: ${{ player.credits }}</span>
        <h2>ARSENAL TÁCTICO</h2>

        <div class="official-buy-grid">
          <div v-for="cat in ['Sidearms', 'SMGs', 'Shotguns', 'Rifles', 'Snipers']" :key="cat" class="buy-category-col">
            <span class="col-title">{{ cat.toUpperCase() }}</span>
            <div
              v-for="w in WEAPONS.filter(item => item.category === cat)"
              :key="w.id"
              class="arsenal-card"
              :class="{ active: player.weapon === w.id, disabled: player.credits < w.price }"
              @click="buyItem(w)"
            >
              <div class="card-head">
                <span class="w-name">{{ w.name }}</span>
                <span class="w-price">${{ w.price }}</span>
              </div>
            </div>
          </div>
        </div>

        <button class="btn-close-buy" @click="isBuyMenuOpen = false">CERRAR TIENDA (B)</button>
      </div>
    </div>

    <!-- PAUSE / IN-GAME MENU MODAL -->
    <div v-if="isPauseMenuOpen" class="modal-overlay">
      <div class="modal-content pause-modal-box">
        <span class="modal-badge">PARTIDA EN CURSO · MENÚ TÁCTICO</span>
        <h2>PAUSA / OPCIONES</h2>
        <p class="subtitle">Modo: {{ gameMode === 'practice' ? 'Práctica Offline' : 'Multijugador 5v5' }} · Ronda {{ matchState.round }}</p>

        <div class="pause-menu-actions">
          <button class="btn-pause-opt resume" @click="isPauseMenuOpen = false">
            ▶ REANUDAR PARTIDA (ESC)
          </button>
          <button v-if="gameMode === 'practice'" class="btn-pause-opt agent" @click="changeAgentInGame">
            🔄 CAMBIAR AGENTE / BANDO
          </button>
          <button class="btn-pause-opt exit" @click="exitToMainMenu">
            🚪 SALIR AL MENÚ PRINCIPAL (CAMBIAR MODO)
          </button>
        </div>
      </div>
    </div>

    <!-- RETRO DOOM HUD STATUS BAR -->
    <footer class="doom-hud-bar" v-show="appState === 'playing'">
      <!-- HP BLOCK -->
      <div class="doom-block">
        <div class="doom-stat-label">{{ player.isDead && currentSpectatedAlly ? 'SALUD (ALIADO)' : 'SALUD' }}</div>
        <div class="doom-stat-val text-cyan">
          {{ player.isDead && currentSpectatedAlly ? Math.max(0, Math.ceil(currentSpectatedAlly.hp)) : Math.max(0, Math.ceil(player.hp)) }}%
        </div>
      </div>

      <!-- SHIELD BLOCK -->
      <div class="doom-block">
        <div class="doom-stat-label">{{ player.isDead && currentSpectatedAlly ? 'ESCUDO (ALIADO)' : 'ESCUDO' }}</div>
        <div class="doom-stat-val text-gold">
          {{ player.isDead && currentSpectatedAlly ? Math.ceil(currentSpectatedAlly.shield || 0) : Math.ceil(player.shield) }}
        </div>
      </div>

      <!-- AGENT DOOM FACE IN CENTER -->
      <div class="doom-face-block">
        <div class="doom-face-frame">
          <div
            class="doom-face-avatar"
            :style="{ backgroundColor: player.isDead && currentSpectatedAlly ? (AGENTS[currentSpectatedAlly.agentKey]?.color || '#00ffff') : (AGENTS[selectedAgent]?.color || '#00ffff') }"
          >
            <span class="doom-face-icon">{{ player.isDead ? '👁️' : (player.hp <= 30 ? '😵' : (player.ultPoints >= player.maxUltPoints ? '👑' : '😎')) }}</span>
          </div>
        </div>
        <span class="doom-agent-name">
          {{ player.isDead && currentSpectatedAlly ? currentSpectatedAlly.name : AGENTS[selectedAgent]?.name }}
        </span>
      </div>

      <!-- AMMO BLOCK -->
      <div class="doom-block">
        <div class="doom-stat-label">
          {{ player.isDead && currentSpectatedAlly ? (currentSpectatedAlly.weapon || 'vandal').toUpperCase() : currentWeapon.name.toUpperCase() }}
        </div>
        <div class="doom-stat-val text-red">
          {{ player.isDead ? 'EN VIVO' : (player.isReloading ? 'RECARGA' : `${player.ammo} / ${currentWeapon.magSize}`) }}
        </div>
      </div>

      <!-- ABILITIES BLOCK -->
      <div class="doom-block abilities-doom">
        <div class="doom-stat-label">{{ player.isDead ? 'CÁMARA DE ALIADOS' : 'HABILIDADES (CLIC O TECLA)' }}</div>
        <div v-if="player.isDead" class="spectator-hud-pills">
          <button class="btn-spectate-pill" @click="prevSpectateTarget">◀ ANT</button>
          <span class="spectate-pill-text">{{ spectatorIndex + 1 }}/{{ aliveAlliesList.length }}</span>
          <button class="btn-spectate-pill" @click="nextSpectateTarget">SIG ▶</button>
        </div>
        <div v-else class="doom-ability-pills">
          <span class="ab-badge clickable" @click="triggerAbility('C')">C</span>
          <span class="ab-badge clickable" @click="triggerAbility('Q')">Q</span>
          <span class="ab-badge clickable" @click="triggerAbility('E')">E</span>
          <span class="ab-badge ult clickable" :class="{ ready: player.ultPoints >= player.maxUltPoints }" @click="triggerSuper">X</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.doom-valorant-container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 12px;
}

/* MODALS */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 14, 20, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  cursor: default !important;
}

.modal-content {
  background: #151c26;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 22px;
  max-width: 880px;
  width: 98%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.75);
  cursor: default !important;
}

.modal-badge {
  display: inline-block;
  background: rgba(255, 70, 85, 0.15);
  color: #ff4655;
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.modal-content h2 { font-size: 1.5rem; margin-bottom: 4px; }
.subtitle { color: #8c9ba5; font-size: 0.85rem; margin-bottom: 16px; }

/* 19 AGENT GRID (PIXEL-PERFECT CHIBI SPRITES) */
.section-title {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 800;
  color: #8c9ba5;
  margin: 10px 0 6px 0;
}

.agent-grid-19 {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 16px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.agent-card-chibi {
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 6px 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.agent-card-chibi:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.agent-card-chibi.selected {
  border-color: #00e5ff;
  background: rgba(0, 229, 255, 0.12);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.35);
}

.chibi-avatar-frame {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background-color: #101721;
  image-rendering: pixelated;
}

.agent-name {
  font-size: 0.72rem;
  font-weight: 800;
  margin-top: 2px;
}

.agent-role {
  font-size: 0.58rem;
  font-weight: 700;
}

/* MODE CARDS */
.mode-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.mode-card {
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.mode-card:hover {
  transform: translateY(-4px);
  border-color: #00e5ff;
}

.mode-card.featured {
  border-color: #ff4655;
  background: rgba(255, 70, 85, 0.06);
}

.mode-icon { font-size: 2.5rem; }
.badge-online { background: #ff4655; color: #fff; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 10px; }
.btn-select-mode { width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.1); color: #fff; border: none; border-radius: 6px; font-weight: 800; cursor: pointer; }
.btn-select-mode.primary { background: #ff4655; }

/* FPS CANVAS VIEWPORT */
.fps-canvas-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 960 / 500;
  max-height: 70vh;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
  cursor: crosshair;
}

.three-canvas-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.hud-canvas-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

/* RETRO DOOM HUD BAR */
.doom-hud-bar {
  display: grid;
  grid-template-columns: 140px 140px 180px 160px 1fr;
  gap: 8px;
  background: linear-gradient(180deg, #2a3442 0%, #151b24 100%);
  border: 2px solid #3d4a5d;
  border-radius: 10px;
  padding: 8px 12px;
  align-items: center;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.6);
}

.doom-block {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 6px;
  text-align: center;
}

.doom-stat-label { font-size: 0.65rem; font-weight: 800; color: #8c9ba5; letter-spacing: 1px; }
.doom-stat-val { font-size: 1.35rem; font-weight: 900; font-family: monospace; }
.text-cyan { color: #00e5ff; }
.text-gold { color: #ffd700; }
.text-red { color: #ff4655; }

.doom-face-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.doom-face-frame {
  width: 48px;
  height: 48px;
  border: 2px solid #52637a;
  border-radius: 6px;
  background: #0b0e13;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doom-face-avatar {
  width: 38px;
  height: 38px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doom-face-icon { font-size: 1.3rem; }
.doom-agent-name { font-size: 0.7rem; font-weight: 800; color: #00e5ff; margin-top: 2px; }

.doom-ability-pills {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 4px;
}

.ab-badge {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 800;
}

.ab-badge.ult { background: #ffd700; color: #000; cursor: pointer; }
.ab-badge.ult.ready { animation: pulseUlt 0.8s infinite alternate; }

@keyframes pulseUlt {
  from { filter: drop-shadow(0 0 2px #ffd700); }
  to { filter: drop-shadow(0 0 8px #ffd700); }
}

/* TOP MATCH HEADER */
.match-header-official {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #141b24;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.team-badge-text { font-size: 0.85rem; font-weight: 800; }
.team-badge-text.ally { color: #00e5ff; }
.team-badge-text.enemy { color: #ff4655; }

.center-match-box { display: flex; align-items: center; gap: 14px; }
.hex-score { font-size: 1.4rem; font-weight: 900; padding: 2px 10px; background: rgba(255, 255, 255, 0.08); border-radius: 6px; }
.hex-score.ally-score { color: #00e5ff; }
.hex-score.enemy-score { color: #ff4655; }
.round-timer-text { font-size: 1.2rem; font-weight: 800; }
.spike-timer-active { color: #ff4655; font-size: 1.2rem; font-weight: 800; }
.buy-phase-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.buy-phase-text { color: #ffd700; font-size: 0.95rem; font-weight: 800; }

.btn-open-shop {
  background: #00e5ff;
  color: #000;
  border: none;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s;
}

.btn-open-shop:hover {
  transform: scale(1.05);
}

.btn-skip-buy {
  background: #ff4655;
  color: #fff;
  border: none;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  animation: pulseSkip 0.8s infinite alternate;
}

@keyframes pulseSkip {
  from { transform: scale(0.96); }
  to { transform: scale(1.04); }
}

.enemies-and-menu {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-pause-menu {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-pause-menu:hover {
  background: rgba(255, 70, 85, 0.25);
  border-color: #ff4655;
}

/* PAUSE MODAL */
.pause-modal-box {
  max-width: 480px;
}

.pause-menu-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.btn-pause-opt {
  width: 100%;
  padding: 14px;
  border-radius: 8px;
  border: none;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-pause-opt.resume {
  background: #00e5ff;
  color: #000;
}

.btn-pause-opt.resume:hover {
  background: #26ecff;
  transform: translateY(-2px);
}

.btn-pause-opt.agent {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-pause-opt.agent:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.btn-pause-opt.exit {
  background: #ff4655;
  color: #fff;
}

.btn-pause-opt.exit:hover {
  background: #ff2a3c;
  transform: translateY(-2px);
}

.ab-badge.clickable {
  cursor: pointer;
  transition: all 0.15s;
}

.ab-badge.clickable:hover {
  background: rgba(0, 229, 255, 0.3);
  transform: translateY(-2px);
}

/* SIDE SELECTOR */
.side-selector { display: flex; gap: 10px; margin-bottom: 12px; }
.side-btn { flex: 1; padding: 10px; border-radius: 8px; border: 2px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.04); color: #fff; font-weight: 700; cursor: pointer; }
.side-btn.active { border-color: #ff4655; background: rgba(255, 70, 85, 0.15); }
.btn-play-match { width: 100%; padding: 12px; background: #ff4655; color: #fff; font-size: 1rem; font-weight: 800; border: none; border-radius: 8px; cursor: pointer; }

/* KILLFEED */
.killfeed-container { position: absolute; top: 10px; right: 10px; display: flex; flex-direction: column; gap: 4px; pointer-events: none; z-index: 20; }
.kill-badge { display: flex; align-items: center; gap: 6px; background: rgba(15, 25, 35, 0.85); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; border-left: 3px solid #ff4655; }
.kill-badge.ally-kill { border-left-color: #00e5ff; }
.k-name.killer { color: #00e5ff; }
.k-name.victim { color: #ff4655; }
.k-wep { background: rgba(255, 255, 255, 0.1); padding: 1px 4px; border-radius: 3px; font-size: 0.65rem; }

/* ACTION PROGRESS & BANNER */
.action-progress-bar { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); width: 300px; height: 26px; background: rgba(15, 25, 35, 0.9); border: 2px solid #fff; border-radius: 13px; overflow: hidden; display: flex; align-items: center; justify-content: center; z-index: 10; }
.bar-fill { position: absolute; left: 0; top: 0; bottom: 0; transition: width 0.05s linear; }
.action-progress-bar.plant .bar-fill { background: #ff4655; }
.action-progress-bar.defuse .bar-fill { background: #00d2ff; }
.bar-text { position: relative; font-size: 0.8rem; font-weight: 800; z-index: 2; }
.round-banner { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); padding: 18px 36px; background: rgba(15, 25, 35, 0.95); border-radius: 12px; text-align: center; border-top: 4px solid #ff4655; z-index: 50; }
.round-banner.defenders { border-top-color: #00d2ff; }

/* BUY MENU */
.buy-modal-full { max-width: 900px; }
.official-buy-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 14px; }
.buy-category-col { display: flex; flex-direction: column; gap: 6px; }
.col-title { font-size: 0.7rem; font-weight: 800; color: #00e5ff; margin-bottom: 2px; }
.arsenal-card { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 6px 8px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; min-height: 48px; }
.arsenal-card:hover { background: rgba(255, 255, 255, 0.08); }
.arsenal-card.active { border-color: #00e5ff; background: rgba(0, 229, 255, 0.12); }
.arsenal-card.disabled { opacity: 0.35; pointer-events: none; }
.card-head { display: flex; justify-content: space-between; align-items: center; }
.w-name { font-size: 0.75rem; font-weight: 800; }
.w-price { font-size: 0.7rem; color: #ffd700; font-weight: 800; }
.btn-close-buy { width: 100%; padding: 12px; background: #00d2ff; color: #0f1923; font-weight: 800; border: none; border-radius: 8px; cursor: pointer; }

/* LOBBY / MULTIPLAYER STYLES */
.browser-header, .room-lobby-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; text-align: left; }
.btn-back-mode, .btn-leave-room { background: rgba(255, 255, 255, 0.1); color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 700; cursor: pointer; }
.player-config-bar { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px; text-align: left; }
.input-group label { font-size: 0.75rem; color: #8c9ba5; font-weight: 800; display: block; margin-bottom: 4px; }
.input-group input, .create-room-box input { width: 100%; padding: 8px 10px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 6px; color: #fff; font-weight: 700; outline: none; }
.code-join-box { display: flex; gap: 6px; }
.btn-join-code { padding: 0 14px; background: #00e5ff; color: #000; font-weight: 800; border: none; border-radius: 6px; cursor: pointer; }
.create-room-box { display: flex; gap: 10px; margin-bottom: 14px; }
.btn-create-room { white-space: nowrap; padding: 8px 16px; background: #ff4655; color: #fff; font-weight: 800; border: none; border-radius: 6px; cursor: pointer; }
.mp-error-banner { background: rgba(255, 70, 85, 0.2); border: 1px solid #ff4655; color: #ff4655; padding: 6px; border-radius: 6px; margin-bottom: 10px; font-size: 0.8rem; font-weight: 700; }
.rooms-list-container { text-align: left; }
.rooms-grid { display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto; }
.room-row-card { display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); padding: 8px 12px; border-radius: 6px; }
.room-title { font-weight: 800; display: block; font-size: 0.9rem; }
.room-host { color: #8c9ba5; font-size: 0.7rem; }
.room-players-badge { background: rgba(0, 229, 255, 0.15); color: #00e5ff; font-weight: 800; padding: 2px 8px; border-radius: 4px; margin-right: 8px; font-size: 0.75rem; }
.btn-join-room { background: #00e5ff; color: #000; border: none; padding: 4px 12px; font-weight: 800; border-radius: 4px; cursor: pointer; }
.teams-split-5v5 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px; }
.team-column { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px; text-align: left; }
.team-column.attackers { border-top: 3px solid #ff4655; }
.team-column.defenders { border-top: 3px solid #00e5ff; }
.team-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.team-title { font-weight: 800; font-size: 0.8rem; }
.btn-switch-team { background: rgba(255, 255, 255, 0.1); color: #fff; border: none; padding: 3px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; cursor: pointer; }
.player-slots-list { display: flex; flex-direction: column; gap: 4px; }
.player-slot-card { display: flex; align-items: center; gap: 8px; background: rgba(0, 0, 0, 0.3); padding: 4px 8px; border-radius: 4px; }
.player-slot-card.isMe { border: 1px solid #ffd700; }
.agent-tag { background: rgba(255, 255, 255, 0.1); padding: 1px 5px; border-radius: 3px; font-size: 0.65rem; font-weight: 800; }
.p-name { font-size: 0.8rem; font-weight: 700; }
.lobby-bottom-bar { display: grid; grid-template-columns: 1fr 200px; gap: 10px; margin-top: 10px; }
.lobby-chat-box { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 6px; text-align: left; }
.chat-messages-container { height: 80px; overflow-y: auto; font-size: 0.75rem; display: flex; flex-direction: column; gap: 2px; }
.msg-sender.attackers { color: #ff4655; font-weight: 800; }
.msg-sender.defenders { color: #00e5ff; font-weight: 800; }
.msg-text { margin-left: 4px; color: #fff; }
.chat-input-row { display: flex; gap: 4px; margin-top: 4px; }
.chat-input-row input { flex: 1; padding: 4px 8px; background: rgba(255, 255, 255, 0.08); border: none; border-radius: 4px; color: #fff; font-size: 0.75rem; outline: none; }
.btn-send-chat { background: #ff4655; color: #fff; border: none; padding: 0 10px; border-radius: 4px; font-weight: 800; font-size: 0.7rem; cursor: pointer; }
.lobby-actions { display: flex; flex-direction: column; gap: 6px; justify-content: center; }
.btn-lock-agent { padding: 10px; background: #00e5ff; color: #000; font-weight: 800; border: none; border-radius: 6px; cursor: pointer; }
.btn-start-match-host { padding: 10px; background: #ff4655; color: #fff; font-weight: 800; border: none; border-radius: 6px; cursor: pointer; }

/* SPECTATOR HUD STYLES */
.spectator-hud-overlay {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  pointer-events: auto;
}

.spectator-card {
  background: rgba(15, 23, 35, 0.92);
  border: 2px solid #ffd700;
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.6);
  border-radius: 10px;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 320px;
}

.spectator-badge-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 800;
}

.spectator-tag {
  color: #ffd700;
  letter-spacing: 1px;
}

.spectator-index-tag {
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
  color: #8c9ba5;
}

.spectator-player-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 0;
}

.spectated-target-name {
  font-size: 1.15rem;
  font-weight: 900;
  color: #ffffff;
}

.spectated-agent-pill {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid;
  background: rgba(0, 0, 0, 0.4);
}

.spectator-controls-help {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.btn-spectate-nav {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-spectate-nav:hover {
  background: #ffd700;
  color: #000;
  border-color: #ffd700;
}

.spectator-hint-text {
  font-size: 0.65rem;
  color: #8c9ba5;
  font-weight: 700;
}

.spectator-hud-pills {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-spectate-pill {
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid #ffd700;
  color: #ffd700;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-spectate-pill:hover {
  background: #ffd700;
  color: #000;
}

.spectate-pill-text {
  font-size: 0.75rem;
  font-weight: 800;
  color: #ffffff;
}
</style>
