<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import { AGENTS } from './data/agents.js'
import { WEAPONS, SHIELDS, WEAPON_CATEGORIES } from './data/weapons.js'
import { soundManager } from './systems/SoundSystem.js'
import { DamageSystem, PLAYER_STATES } from './systems/DamageSystem.js'
import { PlayerController3D } from './systems/PlayerController3D.js'
import { WeaponSystem3D } from './systems/WeaponSystem3D.js'
import { AbilitySystem3D } from './systems/AbilitySystem3D.js'
import { BotAI3D } from './systems/BotAI3D.js'
import { NetworkSystem } from './systems/NetworkSystem.js'
import { buildTacticalArena } from './systems/MapBuilder3D.js'

// --- MAPS DATA (3D) ---
const MAPS_3D = [
  {
    id: 'kasbah_temple',
    name: 'TEMPLO CIBERNÉTICO KASBAH',
    theme: 'desert_oasis',
    desc: 'Oasis desértico futurista con arcos de arenisca dorada, santuario celestial y bóveda de obeliscos de radianita.',
    icon: '🏜️'
  },
  {
    id: 'sector_radian',
    name: 'SECTOR RADIAN-9',
    theme: 'cyber_tech',
    desc: 'Complejo nocturno de alta tecnología con reactor de fusión, pasarelas elevadas y patio industrial.',
    icon: '⚡'
  },
  {
    id: 'glacier_cryo',
    name: 'ESTACIÓN GLACIAR: CRYODOCK-7',
    theme: 'glacier_cryo',
    desc: 'Estación de investigación criogénica ártica con losas de hielo azul, puente de titanio suspendido, reactor subcero y niebla helada.',
    icon: '❄️'
  }
]
const selectedMapId = ref('kasbah_temple')

// --- GAME STATE ---
const gameMode = ref('MENU') // 'MENU', 'AGENT_SELECT', 'IN_GAME', 'MULTIPLAYER_LOBBY', 'PRACTICE'
const isOnline = ref(false)
const showBuyMenu = ref(false)
const showScoreboard = ref(false)
const showSettings = ref(false)
const activeTab = ref('play')
const isPointerLocked = ref(false)
const isThirdPerson = ref(false)
const economyToast = ref('')
let economyToastTimer = null

function showEconomyNotification(msg) {
  economyToast.value = msg
  if (economyToastTimer) clearTimeout(economyToastTimer)
  economyToastTimer = setTimeout(() => {
    economyToast.value = ''
  }, 2500)
}

function toggleBuyMenu() {
  if (match.phase !== 'BUY_PHASE' && gameMode.value !== 'PRACTICE') {
    match.announcement = '🔒 LA TIENDA SOLO ESTÁ DISPONIBLE EN FASE DE COMPRA'
    soundManager.play('deny')
    return
  }
  showBuyMenu.value = !showBuyMenu.value
  if (showBuyMenu.value) {
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
  } else {
    setTimeout(requestPointerLock, 60)
  }
}

function closeBuyMenu() {
  showBuyMenu.value = false
  setTimeout(requestPointerLock, 60)
}

watch(showBuyMenu, (isOpen) => {
  if (isOpen) {
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
  }
})

// Practice Range Cheats
const infiniteAmmo = ref(false)
const infiniteAbilities = ref(false)
const godMode = ref(false)

// Settings
const settings = reactive({
  volume: 0.6,
  crosshairColor: '#00ffcc',
  mouseSensitivity: 0.0022,
  fov: 75
})

// Custom 1v1 & Match Settings (1v1.LOL Style)
const customSettings = reactive({
  gameType: '1V1_DUEL', // '1V1_DUEL', 'CUSTOM_MATCH', 'CLASSIC_5V5'
  enableBots: true,
  enemyBotCount: 1, // 0 to 5 (0 = 1v1 PvP puro sin bots)
  allyBotCount: 0,  // 0 to 4
  maxRounds: 5,     // First to 5
  roundDuration: 90,
  startingCredits: 5000,
  infiniteAmmo: false
})

// Match Stats & Phases
const match = reactive({
  round: 1,
  maxRounds: 5,
  scoreAtk: 0,
  scoreDef: 0,
  phase: 'BUY_PHASE', // 'BUY_PHASE', 'ROUND_ACTIVE', 'ROUND_ENDED'
  timer: 15,
  winner: null,
  announcement: ''
})

// 3D Player State
const player = reactive({
  id: 'player_local',
  name: 'Operador 1',
  team: 'attackers', // 'attackers' or 'defenders'
  agentId: 'jett',
  pos: { x: -22, y: 1.7, z: 0 },
  vel: { x: 0, y: 0, z: 0 },
  yaw: Math.PI / 2,
  pitch: 0,
  radius: 0.6,
  height: 1.7,
  crouching: false,
  onGround: true,
  health: 100,
  maxHealth: 100,
  armor: 50,
  maxArmor: 50,
  credits: 5000,
  primaryWeapon: 'ak74u',
  primaryAmmo: 25,
  primaryReserveAmmo: 75,
  meleeWeapon: 'knife',
  currentSlot: 'primary',
  weapon: 'ak74u',
  ammo: 25,
  reserveAmmo: 75,
  isReloading: false,
  reloadTimer: 0,
  shootCooldown: 0,
  alive: true,
  state: PLAYER_STATES.NORMAL,
  isSlowed: false,
  isStimmed: false,
  blindAlpha: 0,
  ultPoints: 0,
  requiredUltPoints: 7,
  kills: 0,
  deaths: 0,
  assists: 0
})

function equipPrimaryWeapon() {
  player.currentSlot = 'primary'
  player.weapon = player.primaryWeapon || 'ak74u'
  const wep = WEAPONS[player.weapon] || WEAPONS.ak74u
  player.ammo = player.primaryAmmo !== undefined ? player.primaryAmmo : wep.magazineSize
  player.reserveAmmo = player.primaryReserveAmmo !== undefined ? player.primaryReserveAmmo : wep.reserveAmmo
  player.isReloading = false
  player.reloadTimer = 0
  if (weaponSystem) {
    weaponSystem.setWeapon(player.weapon)
  }
  soundManager.play('buy')
}

function equipMeleeWeapon() {
  if (player.currentSlot === 'primary') {
    player.primaryAmmo = player.ammo
    player.primaryReserveAmmo = player.reserveAmmo
  }
  player.currentSlot = 'melee'
  player.weapon = 'knife'
  player.ammo = 1
  player.reserveAmmo = 0
  player.isReloading = false
  player.reloadTimer = 0
  if (weaponSystem) {
    weaponSystem.setWeapon('knife')
  }
  soundManager.play('slash')
}

function toggleWeaponSlot() {
  if (player.currentSlot === 'primary') {
    equipMeleeWeapon()
  } else {
    equipPrimaryWeapon()
  }
}

function inspectCurrentWeapon() {
  if (weaponSystem) {
    weaponSystem.inspectWeapon()
    showEconomyNotification('🔍 INSPECCIONANDO ARMA')
  }
}

function onWheel(e) {
  if (!isPointerLocked.value || !player.alive) return
  if (e.deltaY < 0) {
    equipPrimaryWeapon()
  } else if (e.deltaY > 0) {
    equipMeleeWeapon()
  }
}

// Hitmarker & Crosshair
const hitmarkerActive = ref(false)
const hitmarkerHeadshot = ref(false)
const crosshairSpread = ref(0)
const isAiming = computed(() => mouse.rightDown && isPointerLocked.value && !player.isReloading && player.alive)

// Spectator Mode
const isSpectating = ref(false)
const spectateIndex = ref(0)
const currentSpectatedPlayer = computed(() => {
  if (player.alive) return null
  let candidates = players.value.filter(p => p.team === player.team && p.alive && p.id !== player.id)
  if (candidates.length === 0) {
    candidates = players.value.filter(p => p.alive && p.id !== player.id)
  }
  if (candidates.length === 0) return null
  const idx = Math.min(spectateIndex.value, candidates.length - 1)
  return candidates[idx >= 0 ? idx : 0]
})

// Entities & Killfeed
const players = ref([])
const killfeed = ref([])
const chatMessages = ref([])
const chatInput = ref('')

// 3D Map Sites & Tactical Layout: "SECTOR RADIAN-9" (2 Floors)
let MAP_3D = reactive({
  bounds: { minX: -32, maxX: 32, minZ: -32, maxZ: 32 },
  spawnAtk: { x: -26.0, y: 1.7, z: 0 },
  spawnDef: { x: 26.0, y: 1.7, z: 0 },
  spawnAtkSlots: [
    { x: -26.0, y: 1.7, z: -10 },
    { x: -26.0, y: 1.7, z: -5 },
    { x: -26.0, y: 1.7, z: 0 },
    { x: -26.0, y: 1.7, z: 5 },
    { x: -26.0, y: 1.7, z: 10 }
  ],
  spawnDefSlots: [
    { x: 26.0, y: 1.7, z: -10 },
    { x: 26.0, y: 1.7, z: -5 },
    { x: 26.0, y: 1.7, z: 0 },
    { x: 26.0, y: 1.7, z: 5 },
    { x: 26.0, y: 1.7, z: 10 }
  ],
  siteA: { x: 0, y: 0, z: -16, width: 14, depth: 10, radius: 8.0, name: 'SITE A (REACTOR)' },
  siteB: { x: 0, y: 0, z: 16, width: 14, depth: 10, radius: 8.0, name: 'SITE B (VAULT)' },
  skybridge: { x: 0, y: 3.8, z: 0, width: 5, depth: 16 },
  walls: []
})

// Three.js Core
const threeCanvasRef = ref(null)
const radarCanvasRef = ref(null)
let scene = null
let camera = null
let renderer = null
let animFrameId = null
let lastTime = 0
let ambientDust = null
let currentSkyDome = null

// Modular Systems
let playerController = null
let weaponSystem = null
let abilitySystem = null
let botAI = null
let networkSystem = null
let characterModelTemplate = null

const playerMeshes = new Map()

// Input Tracking
const keys = reactive({})
const mouse = reactive({ isDown: false, rightDown: false })

// Multiplayer Room & Lobby State
const roomCode = ref('')
const joinCodeInput = ref('')
const roomPlayerList = ref([])
const isHost = ref(false)
const availableRooms = ref([])
const networkStatus = ref('CONNECTING')
const lobbyChatInput = ref('')
const lobbyChatMessages = ref([])
const inGameChatOpen = ref(false)
const inGameChatInput = ref('')

// --- INITIALIZATION ---
onMounted(() => {
  nextTick(() => {
    initThreeJS()
    setupEventListeners()
    networkSystem = new NetworkSystem()
    setupNetworkListeners()
    resetRound(true)
    lastTime = performance.now()
    animFrameId = requestAnimationFrame(gameLoop)

    // Check URL query parameters for direct room join
    try {
      const params = new URLSearchParams(window.location.search)
      const urlRoom = params.get('v3droom') || params.get('room')
      if (urlRoom) {
        joinCodeInput.value = urlRoom
        activeTab.value = 'multiplayer'
        showEconomyNotification(`🔑 Código cargado desde enlace: ${urlRoom.slice(0, 8)}...`)
      }
    } catch (e) {}
  })
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (renderer) renderer.dispose()
  if (networkSystem) networkSystem.leaveRoom()
  removeEventListeners()
})

function initThreeJS() {
  const container = threeCanvasRef.value
  if (!container) return

  const width = container.clientWidth || window.innerWidth
  const height = container.clientHeight || (window.innerHeight * 0.88)

  // 1. Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b132b)
  scene.fog = new THREE.Fog(0x0b132b, 45, 160)

  // 2. Camera
  camera = new THREE.PerspectiveCamera(settings.fov, width / height, 0.05, 1000)
  camera.position.set(player.pos.x, player.pos.y, player.pos.z)

  // 3. Lighting (Rich Tactical Illumination)
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
  scene.add(ambientLight)

  const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 1.2)
  hemiLight.position.set(0, 50, 0)
  scene.add(hemiLight)

  const dirLight = new THREE.DirectionalLight(0xffedd5, 1.9)
  dirLight.position.set(30, 50, 20)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.width = 2048
  dirLight.shadow.mapSize.height = 2048
  dirLight.shadow.camera.near = 1.0
  dirLight.shadow.camera.far = 150
  dirLight.shadow.camera.left = -38
  dirLight.shadow.camera.right = 38
  dirLight.shadow.camera.top = 38
  dirLight.shadow.camera.bottom = -38
  dirLight.shadow.bias = -0.0004
  dirLight.shadow.normalBias = 0.04
  scene.add(dirLight)

  // 4. Build Atmosphere & Tactical Arena 3D
  buildAtmosphere()
  rebuildMap3D(selectedMapId.value)

  // 5. Initialize Systems
  playerController = new PlayerController3D(camera, scene, container)
  playerController.setMeshColliders(MAP_3D.meshColliders)
  playerController.setColliders(MAP_3D.wallsAABB)
  weaponSystem = new WeaponSystem3D(scene, camera)
  weaponSystem.setMeshColliders(MAP_3D.meshColliders)
  abilitySystem = new AbilitySystem3D(scene, camera)
  abilitySystem.setPlayerController(playerController)
  abilitySystem.setMeshColliders(MAP_3D.meshColliders)
  botAI = new BotAI3D(scene)
  botAI.setMeshColliders(MAP_3D.meshColliders)
  botAI.setColliders(MAP_3D.wallsAABB)

  // Load 3D Military Character Model (eddy_militar_1.glb)
  const charLoader = new GLTFLoader()
  charLoader.load(
    '/models/personajes/eddy_militar_1.glb',
    (gltf) => {
      characterModelTemplate = gltf.scene
      characterModelTemplate.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true
          c.receiveShadow = true
          c.frustumCulled = false
        }
      })
      // Clear placeholder meshes so new military models are spawned
      playerMeshes.forEach((mesh) => {
        scene.remove(mesh)
      })
      playerMeshes.clear()
    },
    undefined,
    (err) => console.warn('Could not load character model eddy_militar_1.glb:', err)
  )

  // 6. Renderer (AAA Cinematic Tone Mapping & Color Pipeline)
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  container.innerHTML = ''
  container.appendChild(renderer.domElement)

  window.addEventListener('resize', onWindowResize)
}

function rebuildMap3D(mapId) {
  if (!scene) return
  selectedMapId.value = mapId
  const arenaData = buildTacticalArena(scene, mapId)
  Object.assign(MAP_3D, arenaData)
  buildAtmosphere()

  if (playerController) {
    playerController.setMeshColliders(arenaData.meshColliders)
    playerController.setColliders(arenaData.wallsAABB)
  }
  if (weaponSystem) {
    weaponSystem.setMeshColliders(arenaData.meshColliders)
  }
  if (abilitySystem) {
    abilitySystem.setMeshColliders(arenaData.meshColliders)
  }
  if (botAI) {
    botAI.setMeshColliders(arenaData.meshColliders)
    botAI.setColliders(arenaData.wallsAABB)
  }
}

function selectLobbyMap(mapId) {
  selectedMapId.value = mapId
  updateCustomLobbySetting('mapId', mapId)
  rebuildMap3D(mapId)
}

function buildAtmosphere() {
  if (!scene) return
  if (currentSkyDome) {
    scene.remove(currentSkyDome)
  }
  if (ambientDust) {
    scene.remove(ambientDust)
  }

  const isKasbah = (selectedMapId.value === 'kasbah_temple')
  const isGlacier = (selectedMapId.value === 'glacier_cryo')

  // Atmospheric Sky Dome with Tactical Gradient
  const skyCanvas = document.createElement('canvas')
  skyCanvas.width = 512
  skyCanvas.height = 512
  const skyCtx = skyCanvas.getContext('2d')
  const grad = skyCtx.createLinearGradient(0, 0, 0, 512)

  if (isKasbah) {
    // Warm Sunset Desert Sky
    grad.addColorStop(0, '#1e1b4b')    // Deep indigo zenith
    grad.addColorStop(0.4, '#581c87')  // Royal purple twilight
    grad.addColorStop(0.75, '#c2410c') // Sunset amber
    grad.addColorStop(1.0, '#fbbf24')  // Warm golden horizon
  } else if (isGlacier) {
    // Sub-zero Arctic Aurora Sky
    grad.addColorStop(0, '#020617')    // Sub-zero deep arctic zenith
    grad.addColorStop(0.35, '#082f49') // Aurora navy
    grad.addColorStop(0.7, '#0369a1')  // Glacial cyan glow
    grad.addColorStop(1.0, '#7dd3fc')  // Frosted horizon accent
  } else {
    // Cyber Twilight Sky
    grad.addColorStop(0, '#040814')    // Deep zenith
    grad.addColorStop(0.5, '#0b192e')  // Mid twilight
    grad.addColorStop(0.85, '#1e3a5f') // Horizon glow
    grad.addColorStop(1.0, '#38bdf8')  // Horizon accent line
  }

  skyCtx.fillStyle = grad
  skyCtx.fillRect(0, 0, 512, 512)

  const skyTex = new THREE.CanvasTexture(skyCanvas)
  const skyGeo = new THREE.SphereGeometry(250, 32, 16)
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })
  currentSkyDome = new THREE.Mesh(skyGeo, skyMat)
  scene.add(currentSkyDome)

  // Floating Radianite Dust / Arctic Snow Particles
  const dustCount = isGlacier ? 160 : 120
  const dustGeo = new THREE.BufferGeometry()
  const dustPositions = new Float32Array(dustCount * 3)
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 60
    dustPositions[i * 3 + 1] = Math.random() * 8 + 0.5
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 60
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
  const dustMat = new THREE.PointsMaterial({
    color: isKasbah ? 0xfbbf24 : (isGlacier ? 0xbae6fd : 0x38bdf8),
    size: isGlacier ? 0.18 : 0.14,
    transparent: true,
    opacity: isGlacier ? 0.85 : 0.65,
    blending: THREE.AdditiveBlending
  })
  ambientDust = new THREE.Points(dustGeo, dustMat)
  scene.add(ambientDust)
}

function onWindowResize() {
  const container = threeCanvasRef.value
  if (!container || !renderer || !camera) return
  const width = container.clientWidth
  const height = container.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// --- MAIN LOOP ---
function gameLoop(now) {
  const dt = Math.min(0.08, (now - lastTime) / 1000)
  lastTime = now

  if (gameMode.value === 'IN_GAME' || gameMode.value === 'PRACTICE') {
    updateGame3D(dt)
    renderRadar()
  } else if (gameMode.value === 'MENU' && camera) {
    camera.rotation.y += 0.002
  }

  // Floating Radianite Motes Animation
  if (ambientDust && ambientDust.geometry && ambientDust.geometry.attributes.position) {
    const posAttr = ambientDust.geometry.attributes.position
    const count = posAttr.count
    for (let i = 0; i < count; i++) {
      let y = posAttr.getY(i) + Math.sin(now * 0.0015 + i) * 0.003
      if (y > 9) y = 0.5
      if (y < 0.5) y = 9
      posAttr.setY(i, y)
    }
    posAttr.needsUpdate = true
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }

  animFrameId = requestAnimationFrame(gameLoop)
}

function updateGame3D(dt) {
  if (match.phase === 'BUY_PHASE') {
    if (playerController) playerController.freezeMovement = true
    if (MAP_3D.setBarriersActive) MAP_3D.setBarriersActive(true)
    if (!isOnline.value || isHost.value) {
      match.timer -= dt
      if (match.timer <= 0) {
        match.phase = 'ROUND_ACTIVE'
        match.timer = 90
        match.announcement = '¡DUELO INICIADO! ¡BARRERAS DESACTIVADAS!'
        soundManager.play('ult_activate')
        if (playerController) playerController.freezeMovement = false
        if (MAP_3D.setBarriersActive) MAP_3D.setBarriersActive(false)
        if (showBuyMenu.value) {
          showBuyMenu.value = false
          setTimeout(requestPointerLock, 60)
        }
        if (isOnline.value && isHost.value && networkSystem) {
          networkSystem.broadcastRoundSync(roomCode.value, {
            phase: 'ROUND_ACTIVE',
            timer: 90,
            announcement: '¡DUELO INICIADO! ¡BARRERAS DESACTIVADAS!',
            scoreAtk: match.scoreAtk,
            scoreDef: match.scoreDef,
            round: match.round
          })
        }
      }
    }
  } else if (match.phase === 'ROUND_ACTIVE') {
    if (playerController) playerController.freezeMovement = false
    if (MAP_3D.setBarriersActive) MAP_3D.setBarriersActive(false)
    if (!isOnline.value || isHost.value) {
      match.timer -= dt
      if (match.timer <= 0) {
        const redAlive = players.value.filter(p => p.team === 'attackers' && p.alive).length
        const blueAlive = players.value.filter(p => p.team === 'defenders' && p.alive).length
        if (redAlive > blueAlive) {
          endRound('attackers', '¡Tiempo agotado! Equipo Rojo gana por mayor número de supervivientes.')
        } else if (blueAlive > redAlive) {
          endRound('defenders', '¡Tiempo agotado! Equipo Azul gana por mayor número de supervivientes.')
        } else {
          endRound('defenders', '¡Tiempo agotado! Duelo empatado.')
        }
      }
    }
  } else if (match.phase === 'ROUND_ENDED') {
    if (playerController) playerController.freezeMovement = true
    if (!isOnline.value || isHost.value) {
      match.timer -= dt
      if (match.timer <= 0) {
        match.round++
        if (match.scoreAtk >= match.maxRounds || match.scoreDef >= match.maxRounds) {
          match.announcement = match.scoreAtk > match.scoreDef ? '🏆 ¡VICTORIA FINAL DEL EQUIPO ROJO!' : '🏆 ¡VICTORIA FINAL DEL EQUIPO AZUL!'
          gameMode.value = 'MENU'
        } else {
          resetRound(false)
          if (isOnline.value && isHost.value && networkSystem) {
            networkSystem.broadcastRoundSync(roomCode.value, {
              phase: 'BUY_PHASE',
              timer: 15,
              announcement: 'FASE DE COMPRA - SELECCIONA TU ARSENAL [B]',
              scoreAtk: match.scoreAtk,
              scoreDef: match.scoreDef,
              round: match.round
            })
          }
        }
      }
    }
  }

  // --- SPECTATOR MODE WHEN DEAD ---
  if (!player.alive) {
    if (weaponSystem && weaponSystem.gunGroup) {
      weaponSystem.gunGroup.visible = false
    }
    isSpectating.value = true

    // Find alive teammates first, or any alive player
    let candidates = players.value.filter(p => p.team === player.team && p.alive && p.id !== player.id)
    if (candidates.length === 0) {
      candidates = players.value.filter(p => p.alive && p.id !== player.id)
    }

    if (candidates.length > 0) {
      const idx = Math.min(spectateIndex.value, candidates.length - 1)
      const target = candidates[idx >= 0 ? idx : 0]
      if (target && target.pos && camera) {
        const yaw = target.yaw !== undefined ? target.yaw : 0
        const camDist = 3.0
        const camHeight = 1.6
        const targetCamX = target.pos.x - Math.sin(yaw) * camDist
        const targetCamZ = target.pos.z - Math.cos(yaw) * camDist
        const targetCamY = (target.pos.y || 1.7) + camHeight

        camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), dt * 7.0)
        camera.lookAt(target.pos.x, (target.pos.y || 1.7) + 0.5, target.pos.z)
      }
    }

    // Update Abilities
    abilitySystem.update(dt, player, players.value)

    // Update Bots AI & 3D Meshes while spectating
    players.value.forEach(bot => {
      if (bot.id !== player.id && !bot.isRemotePlayer) {
        botAI.updateBot(bot, dt, player, match.phase, MAP_3D, (shooter, target) => {
          weaponSystem.spawnTracer(new THREE.Vector3(shooter.pos.x, shooter.pos.y, shooter.pos.z), new THREE.Vector3(target.pos.x, target.pos.y, target.pos.z))
          if (target.id === player.id) return
          const res = DamageSystem.applyDamage(target, 25, false, false, 'bullet')
          if (res.killed) {
            handlePlayerKilled3D(target, shooter.id, 'Vandal', false)
          }
        }, players.value)
      }
    })
    updatePlayer3DMeshes()
    return
  }

  // Update Player Controller
  playerController.isLocked = isPointerLocked.value
  playerController.update(dt, keys, player.isSlowed, player.isStimmed, isThirdPerson.value)
  player.pos.x = playerController.position.x
  player.pos.y = playerController.position.y
  player.pos.z = playerController.position.z
  player.yaw = playerController.yaw
  player.pitch = playerController.pitch
  player.crouching = playerController.isCrouching
  player.onGround = playerController.onGround

  // Blind recovery
  if (player.blindAlpha > 0) {
    player.blindAlpha = Math.max(0, player.blindAlpha - 0.7 * dt)
  }

  // Update Weapon & Shooting
  const wep = WEAPONS[player.weapon] || WEAPONS.ak74u
  if (player.shootCooldown > 0) player.shootCooldown -= dt
  crosshairSpread.value = Math.max(0, crosshairSpread.value - 6.0 * dt)

  if (player.isReloading) {
    player.reloadTimer -= dt
    if (player.reloadTimer <= 0) {
      player.isReloading = false
      const needed = wep.magazineSize - player.ammo
      const toLoad = Math.min(needed, player.reserveAmmo)
      player.ammo += toLoad
      player.reserveAmmo -= toLoad
    }
  }

  const isSniper = wep.category === WEAPON_CATEGORIES.SNIPERS
  const reloadProgress = player.isReloading ? (1.0 - player.reloadTimer / (wep.reloadTime || 2.2)) : 0
  weaponSystem.update(dt, player.isReloading, reloadProgress, isAiming.value, settings.fov, isSniper)
  if (isThirdPerson.value && weaponSystem && weaponSystem.gunGroup) {
    weaponSystem.gunGroup.visible = false
  }

  // Dynamically scale mouse sensitivity with camera zoom
  if (camera && playerController) {
    playerController.mouseSensitivity = settings.mouseSensitivity * (camera.fov / settings.fov)
  }

  if (mouse.isDown && isPointerLocked.value && player.shootCooldown <= 0 && !player.isReloading && match.phase !== 'BUY_PHASE') {
    triggerFire()
  }

  // Update Abilities
  abilitySystem.update(dt, player, players.value)

  // Update Bots AI (Hunter Team Deathmatch mode)
  if (!isOnline.value || isHost.value) {
    players.value.forEach(bot => {
      if (bot.id !== player.id && !bot.isRemotePlayer && !bot.isDummy) {
        botAI.updateBot(bot, dt, player, match.phase, MAP_3D, (shooter, target) => {
          weaponSystem.spawnTracer(new THREE.Vector3(shooter.pos.x, shooter.pos.y, shooter.pos.z), new THREE.Vector3(target.pos.x, target.pos.y, target.pos.z))
          if (!godMode.value) {
            const res = DamageSystem.applyDamage(target, 25, false, false, 'bullet')
            if (res.killed) {
              handlePlayerKilled3D(target, shooter.id, 'Vandal', false)
            }
          }
        }, players.value)
      }
    })
  }

  // Update 3D Meshes
  updatePlayer3DMeshes()

  // Online Sync
  if (isOnline.value && networkSystem && networkSystem.connected) {
    networkSystem.syncPlayer(roomCode.value, {
      x: player.pos.x,
      y: player.pos.y,
      z: player.pos.z,
      yaw: player.yaw,
      pitch: player.pitch,
      health: player.health,
      armor: player.armor,
      weapon: player.weapon,
      alive: player.alive,
      team: player.team,
      agentId: player.agentId,
      name: player.name,
      crouching: player.crouching,
      onGround: player.onGround
    })
  }
}

function updatePlayer3DMeshes() {
  // Clean up obsolete/disconnected player meshes from 3D scene
  const activeIds = new Set(players.value.map(p => p.id))
  for (const [id, m] of playerMeshes.entries()) {
    if (!activeIds.has(id)) {
      scene.remove(m)
      playerMeshes.delete(id)
    }
  }

  players.value.forEach(p => {
    const isLocal = (p.id === player.id)
    if (isLocal && !isThirdPerson.value) {
      const localMesh = playerMeshes.get(p.id)
      if (localMesh) localMesh.visible = false
      return
    }

    let mesh = playerMeshes.get(p.id)
    if (!mesh) {
      mesh = new THREE.Group()

      const isAtk = p.team === 'attackers'
      const baseTeamColor = isAtk ? 0xef4444 : 0x00f3ff

      // Agent specific neon accent palette
      const agentColors = {
        jett: 0x38bdf8,
        phoenix: 0xf97316,
        reyna: 0xa855f7,
        sova: 0x2563eb,
        chamber: 0xeab308,
        omen: 0x6366f1,
        sage: 0x10b981,
        brimstone: 0xe11d48,
        killjoy: 0xfacc15
      }
      const agentColor = agentColors[p.agentId?.toLowerCase()] || baseTeamColor

      if (characterModelTemplate) {
        // Clone Real 3D Military Soldier Model
        const charClone = SkeletonUtils.clone(characterModelTemplate)
        charClone.scale.set(0.01, 0.01, 0.01)
        charClone.rotation.y = Math.PI

        const bones = {}
        const baseRot = {}
        charClone.traverse((c) => {
          if (c.isBone) {
            bones[c.name] = c
            baseRot[c.name] = { x: c.rotation.x, y: c.rotation.y, z: c.rotation.z }
          }
          if (c.isMesh) {
            c.castShadow = true
            c.receiveShadow = true
            c.frustumCulled = false
            if (c.material) {
              c.material = c.material.clone()
              if (c.name === 'Object_19' || c.material.name === 'sNAKEsuit') {
                if (c.material.color) {
                  c.material.color.lerp(new THREE.Color(baseTeamColor), 0.2)
                }
              }
            }
          }
        })

        // Tactical 3D Rifle Prop attached to Right Hand
        if (bones['CC_Base_R_Hand_013']) {
          const rifleGroup = new THREE.Group()
          const gunMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.75 })
          const gunTrimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.25, metalness: 0.9 })

          // Rifle Receiver / Body
          const gunBodyGeo = new THREE.BoxGeometry(4.2, 8.5, 42)
          const gunBody = new THREE.Mesh(gunBodyGeo, gunMat)
          gunBody.position.set(0, 2, 8)
          rifleGroup.add(gunBody)

          // Long Tactical Barrel & Flash Hider
          const barrelGeo = new THREE.CylinderGeometry(1.2, 1.2, 28, 8)
          barrelGeo.rotateX(Math.PI / 2)
          const barrel = new THREE.Mesh(barrelGeo, gunTrimMat)
          barrel.position.set(0, 3.2, 38)
          rifleGroup.add(barrel)

          // Curved Magazine
          const magGeo = new THREE.BoxGeometry(3.0, 14, 8)
          magGeo.rotateX(-0.25)
          const mag = new THREE.Mesh(magGeo, gunTrimMat)
          mag.position.set(0, -6.5, 12)
          rifleGroup.add(mag)

          // Red Dot Sight Optic
          const opticGeo = new THREE.BoxGeometry(3.2, 4.5, 9)
          const optic = new THREE.Mesh(opticGeo, gunMat)
          optic.position.set(0, 8.5, 6)
          rifleGroup.add(optic)

          // Tactical Stock
          const stockGeo = new THREE.BoxGeometry(3.6, 7.5, 16)
          const stock = new THREE.Mesh(stockGeo, gunMat)
          stock.position.set(0, 1.5, -16)
          rifleGroup.add(stock)

          rifleGroup.rotation.set(-Math.PI / 2, 0, Math.PI / 2)
          bones['CC_Base_R_Hand_013'].add(rifleGroup)
        }

        mesh.userData.bones = bones
        mesh.userData.baseRot = baseRot
        mesh.userData.walkTimer = 0
        mesh.userData.lastX = p.pos.x
        mesh.userData.lastZ = p.pos.z
        mesh.userData.moveSpeed = 0
        mesh.add(charClone)

        // Tactical Team Identification Disc / Halo Ring at feet
        const beaconGeo = new THREE.RingGeometry(0.25, 0.35, 24)
        beaconGeo.rotateX(-Math.PI / 2)
        const beaconMat = new THREE.MeshBasicMaterial({ color: baseTeamColor, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
        const beacon = new THREE.Mesh(beaconGeo, beaconMat)
        beacon.position.set(0, 0.04, 0)
        mesh.add(beacon)

        // Chest Agent Beacon Core
        const coreGeo = new THREE.SphereGeometry(0.045, 8, 8)
        const coreMat = new THREE.MeshBasicMaterial({ color: agentColor })
        const core = new THREE.Mesh(coreGeo, coreMat)
        core.position.set(0, 1.32, -0.14)
        mesh.add(core)
      } else {
        // Fallback procedural tactical soldier
        const armorMat = new THREE.MeshStandardMaterial({
          color: isAtk ? 0x18181b : 0x0f172a,
          roughness: 0.45,
          metalness: 0.4
        })
        const teamGlowMat = new THREE.MeshBasicMaterial({ color: baseTeamColor })
        const agentGlowMat = new THREE.MeshBasicMaterial({ color: agentColor })

        const legGeo = new THREE.CylinderGeometry(0.085, 0.065, 0.75, 8)
        const leftLeg = new THREE.Mesh(legGeo, armorMat)
        leftLeg.position.set(-0.16, 0.38, 0)
        leftLeg.castShadow = true
        mesh.add(leftLeg)

        const rightLeg = new THREE.Mesh(legGeo, armorMat)
        rightLeg.position.set(0.16, 0.38, 0)
        rightLeg.castShadow = true
        mesh.add(rightLeg)

        const torsoGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.72, 8)
        const torso = new THREE.Mesh(torsoGeo, armorMat)
        torso.position.set(0, 1.1, 0)
        torso.castShadow = true
        mesh.add(torso)

        const helmetGeo = new THREE.SphereGeometry(0.18, 16, 16)
        helmetGeo.scale(1, 1.12, 1.1)
        const helmet = new THREE.Mesh(helmetGeo, armorMat)
        helmet.position.set(0, 1.62, 0)
        helmet.castShadow = true
        mesh.add(helmet)
      }

      // Floating Nameplate & Health HUD Sprite above Head
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 70
      const ctx = canvas.getContext('2d')
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
      ctx.roundRect(4, 4, 248, 62, 8)
      ctx.fill()
      ctx.strokeStyle = isAtk ? '#ef4444' : '#00f3ff'
      ctx.lineWidth = 4
      ctx.stroke()

      ctx.fillStyle = isAtk ? '#ef4444' : '#38bdf8'
      ctx.font = 'bold 24px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const label = `${p.name || 'Operador'}`
      ctx.fillText(label, 128, 28)

      // Mini Health Bar inside Nameplate
      ctx.fillStyle = '#334155'
      ctx.fillRect(24, 48, 208, 8)
      ctx.fillStyle = isAtk ? '#ef4444' : '#10b981'
      ctx.fillRect(24, 48, 208, 8)

      const nameTex = new THREE.CanvasTexture(canvas)
      const nameMat = new THREE.SpriteMaterial({ map: nameTex, transparent: true })
      const nameSprite = new THREE.Sprite(nameMat)
      nameSprite.scale.set(1.8, 0.5, 1.0)
      nameSprite.position.set(0, 2.22, 0)
      mesh.add(nameSprite)
      mesh.userData.nameSprite = nameSprite

      scene.add(mesh)
      playerMeshes.set(p.id, mesh)
    }

    mesh.visible = p.alive && (!isLocal || isThirdPerson.value)

    // Only show floating nameplate above teammates (allies), NEVER above enemies
    const isAlly = (p.team === player.team)
    if (mesh.userData.nameSprite) {
      mesh.userData.nameSprite.visible = isAlly && !isLocal
    }

    // Calculate real dynamic ground/airborne feet Y position
    const currentEyeH = isLocal ? (playerController ? playerController.currentEyeHeight : (p.crouching ? 1.1 : 1.7)) : (p.crouching ? 1.1 : 1.7)
    const rawFeetY = (p.pos.y !== undefined ? p.pos.y : 1.7) - currentEyeH
    const feetY = Math.max(0, rawFeetY)
    
    mesh.position.set(p.pos.x, feetY, p.pos.z)
    if (p.yaw !== undefined) {
      mesh.rotation.y = p.yaw
    }

    // Procedural Articulation Animation for Rigged Military Soldiers
    const bones = mesh.userData.bones
    const baseRot = mesh.userData.baseRot
    if (bones && baseRot && p.alive) {
      const lastX = mesh.userData.lastX !== undefined ? mesh.userData.lastX : p.pos.x
      const lastZ = mesh.userData.lastZ !== undefined ? mesh.userData.lastZ : p.pos.z
      const moveDist = Math.hypot(p.pos.x - lastX, p.pos.z - lastZ)
      const instantSpeed = Math.min(8.0, moveDist / 0.016)
      mesh.userData.lastX = p.pos.x
      mesh.userData.lastZ = p.pos.z
      mesh.userData.moveSpeed = THREE.MathUtils.lerp(mesh.userData.moveSpeed || 0, instantSpeed, 0.22)

      // Smooth Crouch Transition Progress (0: standing, 1: fully crouched)
      const targetCrouch = p.crouching ? 1.0 : 0.0
      mesh.userData.crouchProgress = THREE.MathUtils.lerp(mesh.userData.crouchProgress || 0, targetCrouch, 0.25)
      const crouchProg = mesh.userData.crouchProgress

      // Airborne Jump Detection Progress (0: on ground, 1: airborne leap)
      const inAir = (isLocal ? !playerController?.onGround : !p.onGround) && (rawFeetY > 0.08)
      mesh.userData.jumpProgress = THREE.MathUtils.lerp(mesh.userData.jumpProgress || 0, inAir ? 1.0 : 0.0, 0.25)
      const jumpProg = mesh.userData.jumpProgress

      const isMoving = mesh.userData.moveSpeed > 0.15
      if (isMoving) {
        mesh.userData.walkTimer = (mesh.userData.walkTimer || 0) + mesh.userData.moveSpeed * 0.16
      } else {
        mesh.userData.walkTimer = (mesh.userData.walkTimer || 0) * 0.86
      }

      const walkTimer = mesh.userData.walkTimer || 0
      const walkWeight = Math.min(1.0, mesh.userData.moveSpeed / 2.5) * (1.0 - jumpProg * 0.7) * (1.0 - crouchProg * 0.4)
      const walkSwing = Math.sin(walkTimer) * 0.58 * walkWeight
      const idleTime = performance.now() * 0.0022
      const breath = Math.sin(idleTime) * 0.02

      // 1. Legs Locomotion Cycle, Crouch Knee Bends & Airborne Jump Tucking
      const rThighOffset = walkSwing + crouchProg * 0.85 + jumpProg * 0.42
      const lThighOffset = -walkSwing + crouchProg * 0.85 + jumpProg * 0.35
      const rCalfOffset = (Math.max(0, -Math.sin(walkTimer)) * 0.78 * walkWeight) - crouchProg * 1.25 - jumpProg * 0.55
      const lCalfOffset = (Math.max(0, Math.sin(walkTimer)) * 0.78 * walkWeight) - crouchProg * 1.25 - jumpProg * 0.45

      if (bones['CC_Base_R_Thigh_097'] && baseRot['CC_Base_R_Thigh_097']) {
        bones['CC_Base_R_Thigh_097'].rotation.x = baseRot['CC_Base_R_Thigh_097'].x + rThighOffset
      }
      if (bones['CC_Base_L_Thigh_0117'] && baseRot['CC_Base_L_Thigh_0117']) {
        bones['CC_Base_L_Thigh_0117'].rotation.x = baseRot['CC_Base_L_Thigh_0117'].x + lThighOffset
      }
      if (bones['CC_Base_R_Calf_0100'] && baseRot['CC_Base_R_Calf_0100']) {
        bones['CC_Base_R_Calf_0100'].rotation.x = baseRot['CC_Base_R_Calf_0100'].x + rCalfOffset
      }
      if (bones['CC_Base_L_Calf_0120'] && baseRot['CC_Base_L_Calf_0120']) {
        bones['CC_Base_L_Calf_0120'].rotation.x = baseRot['CC_Base_L_Calf_0120'].x + lCalfOffset
      }
      if (bones['CC_Base_R_Foot_0104'] && baseRot['CC_Base_R_Foot_0104']) {
        bones['CC_Base_R_Foot_0104'].rotation.x = baseRot['CC_Base_R_Foot_0104'].x + walkSwing * 0.35 + crouchProg * 0.38
      }
      if (bones['CC_Base_L_Foot_0124'] && baseRot['CC_Base_L_Foot_0124']) {
        bones['CC_Base_L_Foot_0124'].rotation.x = baseRot['CC_Base_L_Foot_0124'].x - walkSwing * 0.35 + crouchProg * 0.38
      }

      // 2. Arms Tactical Combat Hold & Stance (Hands holding rifle)
      if (bones['CC_Base_R_Upperarm_06'] && baseRot['CC_Base_R_Upperarm_06']) {
        bones['CC_Base_R_Upperarm_06'].rotation.x = baseRot['CC_Base_R_Upperarm_06'].x + 0.85 + breath - crouchProg * 0.12
        bones['CC_Base_R_Upperarm_06'].rotation.y = baseRot['CC_Base_R_Upperarm_06'].y - 0.45
        bones['CC_Base_R_Upperarm_06'].rotation.z = baseRot['CC_Base_R_Upperarm_06'].z - 0.35
      }
      if (bones['CC_Base_R_Forearm_09'] && baseRot['CC_Base_R_Forearm_09']) {
        bones['CC_Base_R_Forearm_09'].rotation.x = baseRot['CC_Base_R_Forearm_09'].x + 1.15
      }
      if (bones['CC_Base_L_Upperarm_035'] && baseRot['CC_Base_L_Upperarm_035']) {
        bones['CC_Base_L_Upperarm_035'].rotation.x = baseRot['CC_Base_L_Upperarm_035'].x + 0.95 + breath - crouchProg * 0.12
        bones['CC_Base_L_Upperarm_035'].rotation.y = baseRot['CC_Base_L_Upperarm_035'].y + 0.55
        bones['CC_Base_L_Upperarm_035'].rotation.z = baseRot['CC_Base_L_Upperarm_035'].z + 0.35
      }
      if (bones['CC_Base_L_Forearm_038'] && baseRot['CC_Base_L_Forearm_038']) {
        bones['CC_Base_L_Forearm_038'].rotation.x = baseRot['CC_Base_L_Forearm_038'].x + 1.35
      }

      // 3. Torso & Head Pitch Aiming (looking up/down with player/bot view and crouch forward lean)
      const aimPitch = p.pitch || 0
      if (bones['CC_Base_Spine01_03'] && baseRot['CC_Base_Spine01_03']) {
        bones['CC_Base_Spine01_03'].rotation.x = baseRot['CC_Base_Spine01_03'].x - aimPitch * 0.35 + breath * 0.5 + crouchProg * 0.28
      }
      if (bones['CC_Base_Head_075'] && baseRot['CC_Base_Head_075']) {
        bones['CC_Base_Head_075'].rotation.x = baseRot['CC_Base_Head_075'].x - aimPitch * 0.45
      }
    }
  })
}

function renderRadar() {
  const canvas = radarCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(0, 0, w, h)

  const scale = 2.2
  const cx = w / 2
  const cy = h / 2

  // 1. Draw Map Obstacles / Walls
  ctx.fillStyle = 'rgba(71, 85, 105, 0.75)'
  const wallsList = MAP_3D.wallsAABB || MAP_3D.walls || []
  wallsList.forEach(wall => {
    const rx = cx + (wall.x - wall.w / 2) * scale
    const ry = cy + (wall.z - wall.d / 2) * scale
    const rw = wall.w * scale
    const rh = wall.d * scale
    ctx.fillRect(rx, ry, rw, rh)
  })

  // 2. Draw 2nd Floor Elevated Catwalks & Skybridge (Cyan overlay)
  ctx.fillStyle = 'rgba(0, 243, 255, 0.18)'
  ctx.strokeStyle = '#00f3ff'
  ctx.lineWidth = 1.5

  // Skybridge (Mid)
  const sb = MAP_3D.skybridge || { x: 0, z: 0, width: 5, depth: 16 }
  const sbRx = cx + (sb.x - sb.width / 2) * scale
  const sbRy = cy + (sb.z - sb.depth / 2) * scale
  ctx.fillRect(sbRx, sbRy, sb.width * scale, sb.depth * scale)
  ctx.strokeRect(sbRx, sbRy, sb.width * scale, sb.depth * scale)

  // Heaven A & B Balconies
  ctx.fillRect(cx + 6 * scale, cy - 19 * scale, 12 * scale, 6 * scale)
  ctx.strokeRect(cx + 6 * scale, cy - 19 * scale, 12 * scale, 6 * scale)
  ctx.fillRect(cx + 6 * scale, cy + 13 * scale, 12 * scale, 6 * scale)
  ctx.strokeRect(cx + 6 * scale, cy + 13 * scale, 12 * scale, 6 * scale)

  // 3. Draw Green Plant Zones (Site A Top, Site B Bottom)
  const drawPlantZone = (site, label) => {
    if (!site) return
    const rx = cx + (site.x - site.width / 2) * scale
    const ry = cy + (site.z - site.depth / 2) * scale
    const rw = site.width * scale
    const rh = site.depth * scale
    ctx.fillStyle = 'rgba(34, 197, 94, 0.35)'
    ctx.fillRect(rx, ry, rw, rh)
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2
    ctx.strokeRect(rx, ry, rw, rh)
    ctx.fillStyle = '#22c55e'
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText(label, cx + site.x * scale - 14, cy + site.z * scale + 3)
  }
  drawPlantZone(MAP_3D.siteA, 'SITE A')
  drawPlantZone(MAP_3D.siteB, 'SITE B')

  // 3. Draw 5 Red Spawns (Left) & 5 Blue Spawns (Right)
  MAP_3D.spawnAtkSlots.forEach(slot => {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'
    ctx.beginPath()
    ctx.arc(cx + slot.x * scale, cy + slot.z * scale, 3.5, 0, Math.PI * 2)
    ctx.fill()
  })

  MAP_3D.spawnDefSlots.forEach(slot => {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'
    ctx.beginPath()
    ctx.arc(cx + slot.x * scale, cy + slot.z * scale, 3.5, 0, Math.PI * 2)
    ctx.fill()
  })

  // 4. Draw Spike if Dropped or Planted
  // 4. Draw Live Players (Red vs Blue)
  players.value.forEach(p => {
    if (!p.alive) return
    const isMe = p.id === player.id
    ctx.fillStyle = isMe ? '#ffffff' : (p.team === 'attackers' ? '#ef4444' : '#3b82f6')
    ctx.beginPath()
    ctx.arc(cx + p.pos.x * scale, cy + p.pos.z * scale, isMe ? 5 : 4, 0, Math.PI * 2)
    ctx.fill()

    // Player Direction Cone
    if (isMe) {
      const dirX = Math.sin(p.yaw) * 9
      const dirZ = Math.cos(p.yaw) * 9
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx + p.pos.x * scale, cy + p.pos.z * scale)
      ctx.lineTo(cx + p.pos.x * scale + dirX, cy + p.pos.z * scale + dirZ)
      ctx.stroke()
    }
  })
}

function getPlayerSpawnSlot(targetPlayer) {
  if (!targetPlayer) return { x: 0, y: 1.7, z: 0 }
  const team = targetPlayer.team || 'attackers'
  const isAtk = team === 'attackers'
  const slots = isAtk ? MAP_3D.spawnAtkSlots : MAP_3D.spawnDefSlots

  const pool = (roomPlayerList.value && roomPlayerList.value.length > 0)
    ? roomPlayerList.value
    : players.value

  const sameTeamHumans = pool
    .filter(p => p.team === team && !p.id?.startsWith('ally_') && !p.id?.startsWith('enemy_') && !p.id?.startsWith('dummy_') && !p.id?.startsWith('online_bot_'))
    .sort((a, b) => (a.id || '').localeCompare(b.id || ''))

  let idx = sameTeamHumans.findIndex(p => p.id === targetPlayer.id)

  if (idx === -1) {
    let hash = 0
    const str = targetPlayer.id || targetPlayer.name || '0'
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff
    idx = Math.abs(hash) % slots.length
  } else {
    idx = idx % slots.length
  }

  return slots[idx] || slots[0]
}

function resetRound(fullReset = false) {
  if (fullReset) {
    match.scoreAtk = 0
    match.scoreDef = 0
    match.round = 1
    player.credits = customSettings.startingCredits || 5000
    player.kills = 0
    player.deaths = 0
    players.value.forEach(p => {
      p.credits = customSettings.startingCredits || 5000
      p.kills = 0
      p.deaths = 0
    })
  }

  match.phase = 'BUY_PHASE'
  match.timer = 15
  match.winner = null
  match.announcement = 'FASE DE COMPRA - SELECCIONA TU ARSENAL [B]'

  player.alive = true
  player.health = 100
  player.armor = 50
  player.ammo = 25
  player.reserveAmmo = 75
  isSpectating.value = false
  spectateIndex.value = 0

  if (weaponSystem && weaponSystem.gunGroup) {
    weaponSystem.gunGroup.visible = true
    if (player.weapon) {
      weaponSystem.setWeapon(player.weapon)
    }
  }

  const mySpawn = getPlayerSpawnSlot(player)
  player.pos.x = mySpawn.x
  player.pos.y = mySpawn.y
  player.pos.z = mySpawn.z

  if (playerController) {
    playerController.position.set(mySpawn.x, mySpawn.y, mySpawn.z)
    playerController.velocity.set(0, 0, 0)
    playerController.yaw = player.team === 'attackers' ? Math.PI / 2 : -Math.PI / 2
    playerController.pitch = 0
  }

  setup3DBots()
  soundManager.play('buy')
}

function setup3DBots() {
  const previousPlayers = [...players.value]
  const remotePlayers = previousPlayers.filter(p => p.isRemotePlayer && p.id !== player.id)
  players.value = [player]
  const botAgents = ['sova', 'phoenix', 'reyna', 'sage', 'chamber', 'omen']

  if (gameMode.value === 'PRACTICE') {
    for (let i = 0; i < 4; i++) {
      players.value.push({
        id: `dummy_${i}`,
        name: `Dummy ${i + 1}`,
        team: player.team === 'attackers' ? 'defenders' : 'attackers',
        agentId: botAgents[i % botAgents.length],
        pos: { x: (i % 2 === 0 ? -4 : 4), y: 1.7, z: -14 + Math.floor(i / 2) * 4 },
        initialZ: -14 + Math.floor(i / 2) * 4,
        radius: 0.6,
        health: 100,
        armor: 50,
        alive: true,
        isDummy: true,
        strafing: i % 2 === 1,
        credits: 5000,
        kills: 0,
        deaths: 0
      })
    }
    return
  }

  // If online multiplayer: preserve and reset existing remote players with unique individual slots
  if (isOnline.value) {
    if (remotePlayers.length > 0) {
      remotePlayers.forEach(rp => {
        rp.alive = true
        rp.health = 100
        rp.armor = 50
        const slot = getPlayerSpawnSlot(rp)
        rp.pos.x = slot.x
        rp.pos.y = slot.y
        rp.pos.z = slot.z
        rp.yaw = rp.team === 'attackers' ? Math.PI / 2 : -Math.PI / 2
        players.value.push(rp)
      })
    } else if (roomPlayerList.value && roomPlayerList.value.length > 0) {
      roomPlayerList.value.forEach(p => {
        if (p.id !== player.id) {
          const slot = getPlayerSpawnSlot(p)
          players.value.push({
            id: p.id,
            name: p.name || 'Operador',
            team: p.team || (player.team === 'attackers' ? 'defenders' : 'attackers'),
            agentId: p.agentId || 'jett',
            pos: { x: slot.x, y: slot.y, z: slot.z },
            yaw: p.team === 'attackers' ? Math.PI / 2 : -Math.PI / 2,
            pitch: 0,
            radius: 0.6,
            health: 100,
            armor: 50,
            alive: true,
            weapon: p.weapon || 'ak74u',
            isRemotePlayer: true
          })
        }
      })
    }

    if (!customSettings.enableBots || customSettings.enemyBotCount === 0) {
      return
    }
  }

  // If bots are disabled in custom match
  if (!customSettings.enableBots) {
    return
  }

  const mySlots = player.team === 'attackers' ? MAP_3D.spawnAtkSlots : MAP_3D.spawnDefSlots
  const enemySlots = player.team === 'attackers' ? MAP_3D.spawnDefSlots : MAP_3D.spawnAtkSlots

  // Spawn Allies without overlapping human players (offset from humans)
  const numAllies = Math.max(0, Math.min(customSettings.allyBotCount, 4))
  const humanAlliesCount = players.value.filter(p => p.team === player.team && !p.id.startsWith('ally_')).length

  for (let i = 0; i < numAllies; i++) {
    const slotIdx = (humanAlliesCount + i) % mySlots.length
    const slot = mySlots[slotIdx]
    const existing = previousPlayers.find(p => p.id === `ally_${i}`)
    players.value.push({
      id: `ally_${i}`,
      name: `Aliado ${i + 1}`,
      team: player.team,
      agentId: botAgents[i % botAgents.length],
      pos: { x: slot.x, y: slot.y, z: slot.z },
      yaw: player.team === 'attackers' ? Math.PI / 2 : -Math.PI / 2,
      radius: 0.6,
      health: 100,
      armor: existing?.armor || 50,
      alive: true,
      weapon: existing?.weapon || 'ak74u',
      credits: existing?.credits !== undefined ? existing.credits : (customSettings.startingCredits || 5000),
      kills: existing?.kills || 0,
      deaths: existing?.deaths || 0
    })
  }

  // Spawn Enemies without overlapping human enemies (offset from humans)
  const numEnemies = Math.max(0, Math.min(customSettings.enemyBotCount, 5))
  const enemyTeam = player.team === 'attackers' ? 'defenders' : 'attackers'
  const humanEnemiesCount = players.value.filter(p => p.team === enemyTeam && !p.id.startsWith('enemy_') && !p.id.startsWith('online_bot_')).length

  for (let i = 0; i < numEnemies; i++) {
    const slotIdx = (humanEnemiesCount + i) % enemySlots.length
    const slot = enemySlots[slotIdx]
    const existing = previousPlayers.find(p => p.id === `enemy_${i}`)
    players.value.push({
      id: `enemy_${i}`,
      name: numEnemies === 1 ? 'Rival 1v1' : `Rival ${i + 1}`,
      team: enemyTeam,
      agentId: botAgents[(i + 2) % botAgents.length],
      pos: { x: slot.x, y: slot.y, z: slot.z },
      yaw: enemyTeam === 'attackers' ? Math.PI / 2 : -Math.PI / 2,
      radius: 0.6,
      health: 100,
      armor: existing?.armor || 50,
      alive: true,
      weapon: existing?.weapon || 'ak74u',
      credits: existing?.credits !== undefined ? existing.credits : (customSettings.startingCredits || 5000),
      kills: existing?.kills || 0,
      deaths: existing?.deaths || 0
    })
  }
}

function endRound(winningTeam, message) {
  match.phase = 'ROUND_ENDED'
  match.timer = 5.0
  match.winner = winningTeam
  match.announcement = message
  if (winningTeam === 'attackers') match.scoreAtk++
  else match.scoreDef++

  // Economy Bonus for Round Result
  const won = player.team === winningTeam
  const roundBonus = won ? 3000 : 1900
  player.credits = Math.min(9000, (player.credits || 0) + roundBonus)
  showEconomyNotification(won ? '+ $3000 🏆 RONDA GANADA' : '+ $1900 🛡️ BONIFICACIÓN DE DERROTA')

  // Award bots
  players.value.forEach(p => {
    if (p.id !== player.id) {
      const b = (p.team === winningTeam) ? 3000 : 1900
      p.credits = Math.min(9000, (p.credits || 0) + b)
    }
  })

  soundManager.play('round_won')

  if (isOnline.value && isHost.value && networkSystem) {
    networkSystem.broadcastRoundSync(roomCode.value, {
      phase: 'ROUND_ENDED',
      timer: 5.0,
      winner: winningTeam,
      announcement: message,
      scoreAtk: match.scoreAtk,
      scoreDef: match.scoreDef,
      round: match.round
    })
  }
}

function handlePlayerKilled3D(victim, killerId, weaponName, isHeadshot) {
  victim.alive = false
  victim.health = 0
  victim.deaths++
  const killer = players.value.find(p => p.id === killerId)
  if (killer) {
    killer.kills++
    const killBonus = isHeadshot ? 400 : 300
    killer.credits = Math.min(9000, (killer.credits || 0) + killBonus)
    if (killer.id === player.id) {
      player.credits = killer.credits
      showEconomyNotification(`+ $${killBonus} ${isHeadshot ? '💥 HEADSHOT' : '🎯 ELIMINACIÓN'}`)
    }
  }

  if (victim.id === player.id) {
    isSpectating.value = true
    spectateIndex.value = 0
    mouse.isDown = false
    mouse.rightDown = false
    if (weaponSystem && weaponSystem.gunGroup) {
      weaponSystem.gunGroup.visible = false
    }
  }

  killfeed.value.unshift({
    id: Date.now() + Math.random(),
    killerName: killer ? killer.name : 'Ambiente',
    killerTeam: killer ? killer.team : 'neutral',
    victimName: victim.name,
    victimTeam: victim.team,
    weaponName,
    isHeadshot
  })
  if (killfeed.value.length > 5) killfeed.value.pop()

  // Check team elimination condition
  const atkAlive = players.value.filter(p => p.team === 'attackers' && p.alive).length
  const defAlive = players.value.filter(p => p.team === 'defenders' && p.alive).length

  if (atkAlive === 0 && match.phase === 'ROUND_ACTIVE') {
    endRound('defenders', '¡Equipo Rojo eliminado! ¡Victoria de ronda para el Equipo Azul!')
  } else if (defAlive === 0 && match.phase === 'ROUND_ACTIVE') {
    endRound('attackers', '¡Equipo Azul eliminado! ¡Victoria de ronda para el Equipo Rojo!')
  }
}


function cycleSpectateTarget(dir = 1) {
  let candidates = players.value.filter(p => p.team === player.team && p.alive && p.id !== player.id)
  if (candidates.length === 0) {
    candidates = players.value.filter(p => p.alive && p.id !== player.id)
  }
  if (candidates.length === 0) return
  spectateIndex.value = (spectateIndex.value + dir + candidates.length) % candidates.length
}

function reloadWeapon3D(p) {
  const wep = WEAPONS[p.weapon] || WEAPONS.ak74u
  if (wep.isMelee || p.weapon === 'knife') return
  if (p.isReloading || p.ammo >= wep.magazineSize || p.reserveAmmo <= 0) return
  p.isReloading = true
  p.reloadTimer = wep.reloadTime || 2.2
  soundManager.play('buy')
}

// --- INPUT LISTENERS ---
function setupEventListeners() {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('wheel', onWheel, { passive: false })
  document.addEventListener('pointerlockchange', onPointerLockChange)
}

function removeEventListeners() {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('wheel', onWheel)
  document.removeEventListener('pointerlockchange', onPointerLockChange)
}

function requestPointerLock() {
  const container = threeCanvasRef.value
  if (container && (gameMode.value === 'IN_GAME' || gameMode.value === 'PRACTICE')) {
    container.requestPointerLock()
  }
}

function onPointerLockChange() {
  isPointerLocked.value = document.pointerLockElement === threeCanvasRef.value
}

function onMouseMove(e) {
  if (!isPointerLocked.value || !playerController) return
  playerController.onMouseMove(e.movementX, e.movementY)
  if (weaponSystem && typeof weaponSystem.onCameraMove === 'function') {
    weaponSystem.onCameraMove(e.movementX, e.movementY)
  }
}

function triggerFire() {
  const wep = WEAPONS[player.weapon] || WEAPONS.ak74u
  if (!wep.isMelee && player.ammo <= 0) {
    reloadWeapon3D(player)
    return
  }
  player.shootCooldown = 1.0 / (wep.fireRate || 1.8)
  crosshairSpread.value = wep.isMelee ? 0.2 : 1.0
  if (infiniteAmmo.value && !wep.isMelee) player.ammo = wep.magazineSize

  weaponSystem.fire(player, wep, players.value, (target, isHeadshot, dmg, killed) => {
    hitmarkerActive.value = true
    hitmarkerHeadshot.value = isHeadshot
    setTimeout(() => { hitmarkerActive.value = false }, 120)
    if (killed) handlePlayerKilled3D(target, player.id, wep.name, isHeadshot)
    if (isOnline.value) networkSystem.sendHit(roomCode.value, target.id, dmg, wep.name, isHeadshot, player.name)
  }, isAiming.value)

  if (isOnline.value && networkSystem && networkSystem.connected && camera) {
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation)
    const origin = new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z)
    const end = origin.clone().add(dir.multiplyScalar(wep.range || 80))
    networkSystem.sendGameEvent(roomCode.value, {
      type: 'shoot',
      sound: wep.sound || 'vandal',
      start: { x: origin.x, y: origin.y, z: origin.z },
      end: { x: end.x, y: end.y, z: end.z }
    })
  }
}

function onMouseDown(e) {
  if (!player.alive) {
    if (e.button === 0) cycleSpectateTarget(1)
    if (e.button === 2) cycleSpectateTarget(-1)
    return
  }

  if (e.button === 0) {
    mouse.isDown = true
    if (isPointerLocked.value && player.shootCooldown <= 0 && !player.isReloading && match.phase !== 'BUY_PHASE') {
      triggerFire()
    }
  }
  if (e.button === 2) mouse.rightDown = true
}

function onMouseUp(e) {
  if (e.button === 0) mouse.isDown = false
  if (e.button === 2) mouse.rightDown = false
}

function onKeyDown(e) {
  keys[e.code] = true
  if (e.code === 'Tab') { e.preventDefault(); showScoreboard.value = true }

  if (e.code === 'Escape') {
    if (showBuyMenu.value) {
      e.preventDefault()
      closeBuyMenu()
      return
    }
  }

  if (e.code === 'KeyB') {
    if (match.phase === 'BUY_PHASE' || gameMode.value === 'PRACTICE' || match.phase === 'ROUND_ACTIVE') {
      e.preventDefault()
      toggleBuyMenu()
      return
    }
  }

  if (!player.alive) {
    if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'Space') cycleSpectateTarget(1)
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') cycleSpectateTarget(-1)
    return
  }

  // Weapon Inventory Switching (1: Gun, 2/3: Knife Melee)
  if (e.code === 'Digit1') {
    equipPrimaryWeapon()
    return
  }
  if (e.code === 'Digit2' || e.code === 'Digit3') {
    equipMeleeWeapon()
    return
  }
  if (e.code === 'KeyY' || e.code === 'KeyI') {
    inspectCurrentWeapon()
    return
  }

  if (e.code === 'KeyR') reloadWeapon3D(player)
  if (e.code === 'KeyV') isThirdPerson.value = !isThirdPerson.value
  if (e.code === 'KeyC') castAbility('C')
  if (e.code === 'KeyQ') castAbility('Q')
  if (e.code === 'KeyE') castAbility('E')
  if (e.code === 'KeyX') castAbility('X')
}

function castAbility(slot) {
  if (!player.alive || match.phase === 'BUY_PHASE') return
  if (slot === 'X' && (player.ultPoints < player.requiredUltPoints && !infiniteAbilities.value)) return

  abilitySystem.cast(player, slot, players.value, (msg) => match.announcement = msg)
  if (slot === 'X' && !infiniteAbilities.value) player.ultPoints = 0

  if (isOnline.value && networkSystem && networkSystem.connected && camera) {
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation)
    networkSystem.sendGameEvent(roomCode.value, {
      type: 'ability_cast',
      key: slot,
      agentId: player.agentId,
      pos: { x: player.pos.x, y: player.pos.y, z: player.pos.z },
      dir: { x: dir.x, y: dir.y, z: dir.z },
      team: player.team,
      casterId: player.id
    })
  }
}

function onKeyUp(e) {
  keys[e.code] = false
  if (e.code === 'Tab') showScoreboard.value = false
}

function setupNetworkListeners() {
  networkSystem.on('network_status', (status) => {
    networkStatus.value = status
  })

  networkSystem.on('rooms_list', (rooms) => {
    availableRooms.value = rooms || []
  })

  networkSystem.on('room_joined', ({ room, player: p }) => {
    roomCode.value = room.id
    isHost.value = p.isHost
    roomPlayerList.value = [...(room.players || [])]
    if (room.customConfig) {
      Object.assign(customSettings, room.customConfig)
      match.maxRounds = room.customConfig.maxRounds || 5
      infiniteAmmo.value = !!room.customConfig.infiniteAmmo
      infiniteAbilities.value = !!room.customConfig.infiniteAbilities
      if (room.customConfig.mapId && room.customConfig.mapId !== selectedMapId.value) {
        selectedMapId.value = room.customConfig.mapId
        rebuildMap3D(room.customConfig.mapId)
      }
    }
    player.id = p.id
    player.team = p.team
    if (p.name) player.name = p.name
    gameMode.value = 'MULTIPLAYER_LOBBY'
  })

  networkSystem.on('room_updated', (room) => {
    roomPlayerList.value = [...(room.players || [])]
    if (room.customConfig) {
      Object.assign(customSettings, room.customConfig)
      match.maxRounds = room.customConfig.maxRounds || 5
      infiniteAmmo.value = !!room.customConfig.infiniteAmmo
      infiniteAbilities.value = !!room.customConfig.infiniteAbilities
      if (room.customConfig.mapId && room.customConfig.mapId !== selectedMapId.value) {
        selectedMapId.value = room.customConfig.mapId
        rebuildMap3D(room.customConfig.mapId)
      }
    }
    const me = room.players?.find(p => p.id === player.id)
    if (me) {
      player.team = me.team
      player.name = me.name
      isHost.value = !!me.isHost
    }
  })

  networkSystem.on('match_started', (room) => {
    isOnline.value = true
    gameMode.value = 'IN_GAME'
    if (room.customConfig) {
      Object.assign(customSettings, room.customConfig)
      match.maxRounds = room.customConfig.maxRounds || 5
      infiniteAmmo.value = !!room.customConfig.infiniteAmmo
      infiniteAbilities.value = !!room.customConfig.infiniteAbilities
      if (room.customConfig.mapId && room.customConfig.mapId !== selectedMapId.value) {
        rebuildMap3D(room.customConfig.mapId)
      }
    }
    setupOnlinePlayers(room)
    resetRound(true)
    setTimeout(requestPointerLock, 100)
  })

  networkSystem.on('player_moved', (data) => {
    if (!isOnline.value || data.id === player.id) return
    let target = players.value.find(p => p.id === data.id)
    const roomPlayerData = roomPlayerList.value?.find(p => p.id === data.id)
    const resolvedTeam = data.team || roomPlayerData?.team || (player.team === 'attackers' ? 'defenders' : 'attackers')

    if (!target) {
      target = {
        id: data.id,
        name: data.name || roomPlayerData?.name || 'Operador',
        team: resolvedTeam,
        agentId: data.agentId || roomPlayerData?.agentId || 'jett',
        pos: { x: data.x || 0, y: data.y || 1.7, z: data.z || 0 },
        yaw: data.yaw || 0,
        pitch: data.pitch || 0,
        radius: 0.6,
        health: data.health !== undefined ? data.health : 100,
        armor: data.armor !== undefined ? data.armor : 50,
        alive: data.alive !== false,
        weapon: data.weapon || 'ak74u',
        crouching: !!data.crouching,
        onGround: data.onGround !== false,
        isRemotePlayer: true
      }
      players.value.push(target)
    } else {
      target.pos.x = data.x
      target.pos.y = data.y
      target.pos.z = data.z
      target.yaw = data.yaw
      target.pitch = data.pitch
      target.health = data.health !== undefined ? data.health : target.health
      target.armor = data.armor !== undefined ? data.armor : target.armor
      target.weapon = data.weapon || target.weapon
      if (data.team) target.team = data.team
      if (data.name) target.name = data.name
      if (data.agentId) target.agentId = data.agentId
      if (data.crouching !== undefined) target.crouching = data.crouching
      if (data.onGround !== undefined) target.onGround = data.onGround
      if (data.alive !== undefined) target.alive = data.alive
    }
  })

  networkSystem.on('player_took_damage', ({ targetId, damage, shooterId, weapon, headshot, killerName }) => {
    if (targetId === player.id) {
      if (!godMode.value) {
        const res = DamageSystem.applyDamage(player, damage, headshot, false, 'bullet')
        soundManager.play(headshot ? 'headshot' : 'hit')
        if (res.killed) {
          handlePlayerKilled3D(player, shooterId, weapon, headshot)
          if (isOnline.value) {
            networkSystem.syncPlayer(roomCode.value, {
              alive: false,
              health: 0,
              armor: 0,
              x: player.pos.x,
              y: player.pos.y,
              z: player.pos.z
            })
          }
        }
      }
    } else {
      const target = players.value.find(p => p.id === targetId)
      if (target) {
        const res = DamageSystem.applyDamage(target, damage, headshot, false, 'bullet')
        soundManager.play(headshot ? 'headshot' : 'hit')
        if (res.killed) {
          handlePlayerKilled3D(target, shooterId, weapon, headshot)
        }
      }
    }
  })

  networkSystem.on('game_event', (event) => {
    if (!event) return
    if (event.type === 'shoot' && event.start && event.end) {
      weaponSystem.spawnTracer(
        new THREE.Vector3(event.start.x, event.start.y, event.start.z),
        new THREE.Vector3(event.end.x, event.end.y, event.end.z)
      )
      soundManager.play(event.sound || 'vandal')
    } else if (event.type === 'ability_cast') {
      const dummyCaster = {
        id: event.casterId,
        agentId: event.agentId,
        team: event.team,
        pos: event.pos,
        maxHealth: 100
      }
      abilitySystem.castRemote(dummyCaster, event.key, event.pos, event.dir, players.value)
    }
  })

  networkSystem.on('round_sync', (data) => {
    if (!data) return
    if (data.scoreAtk !== undefined) match.scoreAtk = data.scoreAtk
    if (data.scoreDef !== undefined) match.scoreDef = data.scoreDef
    if (data.round !== undefined) match.round = data.round
    if (data.winner !== undefined) match.winner = data.winner
    if (data.announcement) match.announcement = data.announcement
    if (data.timer !== undefined) match.timer = data.timer

    if (data.phase && data.phase !== match.phase) {
      match.phase = data.phase
      if (data.phase === 'BUY_PHASE') {
        resetRound(false)
      } else if (data.phase === 'ROUND_ACTIVE') {
        if (playerController) playerController.freezeMovement = false
        if (MAP_3D.setBarriersActive) MAP_3D.setBarriersActive(false)
        if (showBuyMenu.value) {
          showBuyMenu.value = false
          setTimeout(requestPointerLock, 60)
        }
      } else if (data.phase === 'ROUND_ENDED') {
        if (playerController) playerController.freezeMovement = true
      }
    }
  })

  networkSystem.on('chat_received', (msg) => {
    lobbyChatMessages.value.push(msg)
    chatMessages.value.push(msg)
  })
}

function updateCustomLobbySetting(key, val) {
  customSettings[key] = val
  if (key === 'maxRounds') match.maxRounds = val
  if (key === 'infiniteAmmo') infiniteAmmo.value = !!val
  if (key === 'infiniteAbilities') infiniteAbilities.value = !!val
  if (isHost.value && networkSystem) {
    networkSystem.updateRoomConfig(roomCode.value, { [key]: val })
  }
}

function createMultiplayerRoom(customConfigOverrides = null) {
  networkSystem.connect()
  const cfg = customConfigOverrides || {
    gameType: customSettings.gameType || 'CUSTOM_MATCH',
    enableBots: customSettings.enableBots,
    enemyBotCount: customSettings.enemyBotCount,
    allyBotCount: customSettings.allyBotCount,
    maxRounds: customSettings.maxRounds,
    startingCredits: customSettings.startingCredits,
    infiniteAmmo: infiniteAmmo.value,
    infiniteAbilities: infiniteAbilities.value,
    buyPhaseDuration: 15
  }
  networkSystem.createRoom(`Sala 3D de ${player.name}`, player.name, player.team, cfg)
}

function joinMultiplayerRoom(code) {
  const targetCode = (code || joinCodeInput.value || '').trim()
  if (!targetCode) return
  networkSystem.connect()
  networkSystem.joinRoom(targetCode, player.name, player.team)
}

function switchLobbyTeam(team) {
  player.team = team
  networkSystem.switchTeam(roomCode.value, team)
}

function selectLobbyAgent(agentId) {
  player.agentId = agentId
  networkSystem.selectAgent(roomCode.value, agentId)
}

function lockLobbyAgent() {
  networkSystem.lockAgent(roomCode.value)
}

function startLobbyMatch() {
  networkSystem.startMatch(roomCode.value)
}

function sendLobbyChat() {
  if (!lobbyChatInput.value.trim()) return
  networkSystem.sendChat(roomCode.value, lobbyChatInput.value.trim())
  lobbyChatInput.value = ''
}

function leaveLobby() {
  networkSystem.leaveRoom()
  isOnline.value = false
  gameMode.value = 'MENU'
}

function copyRoomCode() {
  if (navigator.clipboard && roomCode.value) {
    navigator.clipboard.writeText(roomCode.value)
    showEconomyNotification('📋 ¡CÓDIGO DE SALA COPIADO!')
  }
}

function copyRoomLink() {
  if (roomCode.value) {
    const url = `${window.location.origin}${window.location.pathname}?v3droom=${encodeURIComponent(roomCode.value)}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
    }
    showEconomyNotification('🔗 ¡ENLACE DIRECTO COPIADO!')
  }
}

function setupOnlinePlayers(room) {
  const roomPlayers = (room && room.players) ? room.players : (roomPlayerList.value || [])
  const cfg = room?.customConfig || customSettings

  players.value = []

  const myRoomData = roomPlayers.find(p => p.id === player.id) || { team: player.team, name: player.name }
  player.team = myRoomData.team || player.team
  player.credits = cfg.startingCredits || 5000

  const mySpawn = getPlayerSpawnSlot(player)
  player.pos.x = mySpawn.x
  player.pos.y = mySpawn.y
  player.pos.z = mySpawn.z

  if (playerController) {
    playerController.position.set(mySpawn.x, mySpawn.y, mySpawn.z)
    playerController.velocity.set(0, 0, 0)
    playerController.yaw = player.team === 'attackers' ? Math.PI / 2 : -Math.PI / 2
    playerController.pitch = 0
  }

  players.value.push(player)

  roomPlayers.forEach(p => {
    if (p.id !== player.id) {
      const isAtk = p.team === 'attackers'
      const slot = getPlayerSpawnSlot(p)

      players.value.push({
        id: p.id,
        name: p.name || 'Operador',
        team: p.team || 'defenders',
        agentId: p.agentId || 'jett',
        pos: { x: slot.x, y: slot.y, z: slot.z },
        yaw: isAtk ? Math.PI / 2 : -Math.PI / 2,
        pitch: 0,
        radius: 0.6,
        health: 100,
        armor: 50,
        alive: true,
        weapon: p.weapon || 'vandal',
        credits: cfg.startingCredits || 5000,
        kills: 0,
        deaths: 0,
        isRemotePlayer: true
      })
    }
  })

  // Spawn bots if enabled in online custom match
  if (cfg.enableBots) {
    const botAgents = ['sova', 'phoenix', 'reyna', 'sage', 'chamber', 'omen']
    const enemyTeam = player.team === 'attackers' ? 'defenders' : 'attackers'
    const enemySlots = player.team === 'attackers' ? MAP_3D.spawnDefSlots : MAP_3D.spawnAtkSlots

    const humanEnemies = players.value.filter(p => p.team === enemyTeam).length
    const botsToAdd = Math.max(0, (cfg.enemyBotCount || 1) - humanEnemies)

    for (let i = 0; i < botsToAdd; i++) {
      const slot = enemySlots[(i + humanEnemies) % enemySlots.length]
      players.value.push({
        id: `online_bot_${i}`,
        name: `Rival ${i + 1} (Bot)`,
        team: enemyTeam,
        agentId: botAgents[i % botAgents.length],
        pos: { x: slot.x, y: slot.y, z: slot.z },
        radius: 0.6,
        health: 100,
        armor: 50,
        alive: true,
        weapon: 'ak74u',
        credits: cfg.startingCredits || 5000,
        kills: 0,
        deaths: 0
      })
    }
  }
}

function start1v1Duel() {
  customSettings.gameType = '1V1_DUEL'
  customSettings.enableBots = true
  customSettings.enemyBotCount = 1
  customSettings.allyBotCount = 0
  customSettings.maxRounds = 5
  match.maxRounds = 5
  player.credits = 5000
  gameMode.value = 'IN_GAME'
  resetRound(true)
  setTimeout(requestPointerLock, 100)
}

function startCustomMatch() {
  customSettings.gameType = 'CUSTOM_MATCH'
  match.maxRounds = customSettings.maxRounds
  player.credits = customSettings.startingCredits
  gameMode.value = 'IN_GAME'
  resetRound(true)
  setTimeout(requestPointerLock, 100)
}

function startStandardGame() {
  customSettings.gameType = 'CLASSIC_5V5'
  customSettings.enableBots = true
  customSettings.enemyBotCount = 5
  customSettings.allyBotCount = 4
  match.maxRounds = 13
  gameMode.value = 'IN_GAME'
  resetRound(true)
  setTimeout(requestPointerLock, 100)
}

function startPracticeMode() {
  gameMode.value = 'PRACTICE'
  resetRound(true)
  setTimeout(requestPointerLock, 100)
}

function lockAgent(agentId) {
  player.agentId = agentId
  gameMode.value = 'IN_GAME'
  resetRound(true)
  setTimeout(requestPointerLock, 100)
}

function buyItem(item) {
  if (player.credits < item.cost) return
  player.credits -= item.cost
  soundManager.play('buy')
  if (item.category === 'melee' || item.isMelee) {
    player.meleeWeapon = item.id
    if (player.currentSlot === 'melee') {
      equipMeleeWeapon()
    }
  } else if (item.magazineSize) {
    player.primaryWeapon = item.id
    player.primaryAmmo = item.magazineSize
    player.primaryReserveAmmo = item.reserveAmmo
    equipPrimaryWeapon()
  } else if (item.amount) {
    player.armor = item.amount
  }
}
</script>

<template>
  <div class="valorant-container">
    <!-- 3D Three.js Layer (ALWAYS ACTIVE) -->
    <div ref="threeCanvasRef" class="three-canvas-wrap" @click="requestPointerLock"></div>

    <!-- Cinematic Vignette Overlay -->
    <div class="vignette-overlay"></div>

    <!-- MAIN MENU OVERLAY -->
    <div v-if="gameMode === 'MENU'" class="menu-overlay">
      <div class="menu-header">
        <div class="logo-badge">⚔️ ARENA 1v1 // SHOOTER 3D</div>
        <h1 class="game-title">1v1.LOL 3D BATTLE ARENA</h1>
        <p class="game-subtitle">Duelos 1v1 Rápidos, Combates en Altura con Escaleras y Multijugador Online en Tiempo Real</p>
      </div>

      <div class="menu-nav-tabs">
        <button class="menu-tab" :class="{ active: activeTab === 'play' }" @click="activeTab = 'play'">⚔️ DUELO 1v1</button>
        <button class="menu-tab" :class="{ active: activeTab === 'custom' }" @click="activeTab = 'custom'">🛠️ PERSONALIZADA</button>
        <button class="menu-tab" :class="{ active: activeTab === 'training' }" @click="activeTab = 'training'">🎯 PRÁCTICA</button>
        <button class="menu-tab" :class="{ active: activeTab === 'multiplayer' }" @click="activeTab = 'multiplayer'">🌐 MULTIJUGADOR 1v1</button>
        <button class="menu-tab" :class="{ active: activeTab === 'weapons' }" @click="activeTab = 'weapons'">🔫 ARMAS</button>
        <button class="menu-tab" :class="{ active: activeTab === 'abilities' }" @click="activeTab = 'abilities'">⚡ HABILIDADES</button>
      </div>

      <!-- PLAY / 1V1 TAB -->
      <div v-if="activeTab === 'play'" class="tab-content">
        <div class="modes-grid-duels">
          <!-- 1v1 Duel Mode Card -->
          <div class="mode-card featured-1v1" @click="start1v1Duel">
            <div class="mode-badge-top">🔥 MODO 1v1 INMEDIATO</div>
            <div class="mode-icon">⚡</div>
            <h3>DUELO 1v1 RÁPIDO (1v1.LOL STYLE)</h3>
            <p>Enfréntate directamente en combate individual 1 contra 1. Sin esperas ni bloqueos, solo tú y tu rival. ¡El primero a 5 rondas gana!</p>
            <button class="btn-primary-glow">⚔️ ENTRAR AL DUELO 1v1</button>
          </div>

          <!-- Custom Match Shortcut Card -->
          <div class="mode-card" @click="activeTab = 'custom'">
            <div class="mode-icon">🛠️</div>
            <h3>PARTIDA PERSONALIZADA</h3>
            <p>Elige si quieres bots o no, selecciona cuántos rivales meter (0 a 5 bots) y las rondas a jugar.</p>
            <button class="btn-secondary">CONFIGURAR BOTS Y REGLAS</button>
          </div>

          <!-- 5v5 Tactical Mode Card -->
          <div class="mode-card" @click="startStandardGame">
            <div class="mode-icon">💣</div>
            <h3>PARTIDA EN EQUIPO 5v5</h3>
            <p>Enfrentamiento táctico con plantado y desactivación de Spike en Haven 3D.</p>
            <button class="btn-secondary">JUGAR 5v5</button>
          </div>
        </div>
      </div>

      <!-- CUSTOM MATCH TAB -->
      <div v-if="activeTab === 'custom'" class="tab-content custom-panel-tab">
        <div class="custom-setup-box">
          <div class="custom-box-header">
            <h3>⚙️ CONFIGURACIÓN DE PARTIDA PERSONALIZADA (1v1 / FFA)</h3>
            <p>Decide si entran bots, cuántos rivales meter y las reglas de la arena.</p>
          </div>

          <div class="custom-options-grid">
            <!-- Tactical 3D Map Selector -->
            <div class="custom-opt-item" style="grid-column: 1 / -1;">
              <label class="opt-label">🗺️ SELECCIONAR MAPA TÁCTICO 3D:</label>
              <div class="opt-btn-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px;">
                <button 
                  v-for="m in MAPS_3D" 
                  :key="'cust_map_' + m.id" 
                  class="btn-opt" 
                  :class="{ active: selectedMapId === m.id }" 
                  @click="rebuildMap3D(m.id)"
                  style="padding: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800;"
                >
                  <span>{{ m.icon }}</span>
                  <span>{{ m.name }}</span>
                </button>
              </div>
            </div>

            <!-- Toggle Bots -->
            <div class="custom-opt-item">
              <label class="opt-label">🤖 ¿INCLUIR BOTS EN LA PARTIDA?</label>
              <div class="opt-btn-group">
                <button 
                  class="btn-opt" 
                  :class="{ active: customSettings.enableBots }" 
                  @click="customSettings.enableBots = true; if(customSettings.enemyBotCount === 0) customSettings.enemyBotCount = 1"
                >🟢 SÍ, METER BOTS</button>
                <button 
                  class="btn-opt" 
                  :class="{ active: !customSettings.enableBots }" 
                  @click="customSettings.enableBots = false; customSettings.enemyBotCount = 0; customSettings.allyBotCount = 0"
                >🔴 NO, SIN BOTS (SOLO TÚ / 1v1 PVP)</button>
              </div>
            </div>

            <!-- Enemy Bots Count -->
            <div v-if="customSettings.enableBots" class="custom-opt-item">
              <label class="opt-label">🎯 CANTIDAD DE BOTS ENEMIGOS / RIVALES:</label>
              <div class="bot-count-selector">
                <button 
                  v-for="count in [0, 1, 2, 3, 4, 5]" 
                  :key="'enemy_' + count" 
                  class="btn-count" 
                  :class="{ active: customSettings.enemyBotCount === count }"
                  @click="customSettings.enemyBotCount = count"
                >
                  {{ count === 0 ? '0 (Sin Rivales)' : (count === 1 ? '1 (Duelo 1v1)' : `${count} Rivales`) }}
                </button>
              </div>
            </div>

            <!-- Ally Bots Count -->
            <div v-if="customSettings.enableBots" class="custom-opt-item">
              <label class="opt-label">👥 CANTIDAD DE BOTS ALIADOS EN TU EQUIPO:</label>
              <div class="bot-count-selector">
                <button 
                  v-for="count in [0, 1, 2, 3, 4]" 
                  :key="'ally_' + count" 
                  class="btn-count" 
                  :class="{ active: customSettings.allyBotCount === count }"
                  @click="customSettings.allyBotCount = count"
                >
                  {{ count === 0 ? '0 (Solo Tú - Duelo)' : `${count} Aliados` }}
                </button>
              </div>
            </div>

            <!-- Rounds to Win -->
            <div class="custom-opt-item">
              <label class="opt-label">🏆 RONDAS PARA GANAR LA PARTIDA:</label>
              <div class="opt-btn-group">
                <button 
                  v-for="r in [3, 5, 7, 13]" 
                  :key="'rounds_' + r" 
                  class="btn-opt" 
                  :class="{ active: customSettings.maxRounds === r }" 
                  @click="customSettings.maxRounds = r"
                >{{ r }} RONDAS</button>
              </div>
            </div>

            <!-- Starting Credits -->
            <div class="custom-opt-item">
              <label class="opt-label">💰 CRÉDITOS INICIALES PARA ARMAS:</label>
              <div class="opt-btn-group">
                <button 
                  v-for="c in [800, 2900, 5000, 9999]" 
                  :key="'cred_' + c" 
                  class="btn-opt" 
                  :class="{ active: customSettings.startingCredits === c }" 
                  @click="customSettings.startingCredits = c"
                >${{ c }}</button>
              </div>
            </div>
          </div>

          <div class="custom-launch-bar">
            <button class="btn-start-custom" @click="startCustomMatch">
              🚀 INICIAR PARTIDA PERSONALIZADA ({{ customSettings.enemyBotCount === 1 ? '1v1 DUEL' : customSettings.enemyBotCount + ' RIVALES' }})
            </button>
          </div>
        </div>
      </div>

      <!-- TRAINING TAB -->
      <div v-if="activeTab === 'training'" class="tab-content">
        <div class="mode-card" @click="startPracticeMode">
          <div class="mode-icon">🎯</div>
          <h3>CAMPO DE TIRO 3D (RANGE)</h3>
          <p>Prueba la puntería en primera persona 3D con retroceso, bots y habilidades.</p>
          <button class="btn-primary">ENTRAR AL CAMPO</button>
        </div>
      </div>

      <!-- TACTICAL ABILITIES TAB (1V1.LOL KIT) -->
      <div v-if="activeTab === 'abilities'" class="tab-content agents-grid">
        <div class="agent-card">
          <div class="agent-card-header" style="border-color: #64748b;">
            <span class="agent-avatar">☁️</span>
            <div>
              <h4>Nube de Humo Táctica</h4>
              <span class="agent-role">Tecla [C] · Cobertura y Despiste</span>
            </div>
          </div>
          <p class="agent-desc">Lanza una granada táctica que genera una densa nube esférica de humo de 8 metros de diámetro, bloqueando completamente la línea de visión del rival durante 8 segundos.</p>
        </div>

        <div class="agent-card">
          <div class="agent-card-header" style="border-color: #00f3ff;">
            <span class="agent-avatar">🪜</span>
            <div>
              <h4>Construir Rampa 1v1</h4>
              <span class="agent-role">Tecla [Q] · Construcción / High Ground</span>
            </div>
          </div>
          <p class="agent-desc">Construye instantáneamente una rampa/escalera de combate sólida y transitable frente a ti. ¡Sube por ella para ganar la altura y disparar desde arriba como en 1v1.LOL!</p>
        </div>

        <div class="agent-card">
          <div class="agent-card-header" style="border-color: #38bdf8;">
            <span class="agent-avatar">⚡</span>
            <div>
              <h4>Gancho de Agarre / Impulso</h4>
              <span class="agent-role">Tecla [E] · Movilidad y Enganche</span>
            </div>
          </div>
          <p class="agent-desc">Dispara un cable de energía a toda velocidad que se aferra a muros y plataformas para impulsarte velozmente hacia ellos (o te da un impulso aéreo si apuntas al cielo).</p>
        </div>

        <div class="agent-card">
          <div class="agent-card-header" style="border-color: #f59e0b;">
            <span class="agent-avatar">🚀</span>
            <div>
              <h4>Plataforma de Salto + Súper Escudo</h4>
              <span class="agent-role">Tecla [X] · Lanzador +50 Armadura</span>
            </div>
          </div>
          <p class="agent-desc">Despliega una plataforma cinética bajo tus pies que te catapulta por los aires para hacer jugadas aéreas, y te restaura instantáneamente +50 puntos de escudo táctico.</p>
        </div>
      </div>

      <!-- WEAPONS TAB -->
      <div v-if="activeTab === 'weapons'" class="tab-content weapons-grid">
        <div v-for="wep in Object.values(WEAPONS)" :key="wep.id" class="weapon-card">
          <div class="weapon-header">
            <span class="wep-icon">{{ wep.icon }}</span>
            <div>
              <h4>{{ wep.name }}</h4>
              <span class="wep-cost">${{ wep.cost }}</span>
            </div>
          </div>
          <div class="weapon-stats">
            <div>Headshot: <strong class="text-head">{{ wep.damage.head }}</strong></div>
            <div>Cuerpo: <strong class="text-body">{{ wep.damage.body }}</strong></div>
            <div>Cadencia: <strong>{{ wep.fireRate }}/s</strong></div>
          </div>
        </div>
      </div>

      <!-- MULTIPLAYER TAB -->
      <div v-if="activeTab === 'multiplayer'" class="tab-content mp-panel">
        <div class="mp-setup-card">
          <div class="mp-profile-row">
            <div class="input-group">
              <label>NOMBRE DEL OPERADOR:</label>
              <input v-model="player.name" type="text" class="mp-input" placeholder="Tu Nombre..." />
            </div>
            <div class="team-toggle-group">
              <label>EQUIPO PREFERIDO:</label>
              <div class="team-btns">
                <button 
                  class="btn-team" 
                  :class="{ active: player.team === 'attackers' }" 
                  @click="player.team = 'attackers'"
                >🔴 ATACANTES</button>
                <button 
                  class="btn-team" 
                  :class="{ active: player.team === 'defenders' }" 
                  @click="player.team = 'defenders'"
                >🔵 DEFENSORES</button>
              </div>
            </div>
          </div>

          <div class="mp-actions-grid">
            <div class="mp-action-box create-box">
              <div class="box-icon">⚡</div>
              <h3>CREAR SALA 3D</h3>
              <p>Crea tu propia arena táctica multijugador e invita a tus amigos con el código de sala.</p>
              <button class="btn-primary" @click="createMultiplayerRoom">CREAR NUEVA SALA</button>
            </div>

            <div class="mp-action-box join-box">
              <div class="box-icon">🔑</div>
              <h3>UNIRSE A SALA</h3>
              <p>Ingresa el código de 6 caracteres de una sala existente para entrar a la partida.</p>
              <div class="join-input-row">
                <input v-model="joinCodeInput" type="text" class="mp-input code-input" placeholder="PEGA EL CÓDIGO DE SALA AQUÍ..." maxlength="64" />
                <button class="btn-join" @click="joinMultiplayerRoom(joinCodeInput)">UNIRSE</button>
              </div>
            </div>
          </div>

          <!-- PUBLIC ROOMS LIST -->
          <div class="public-rooms-section">
            <h4>📡 SALAS ACTIVAS EN LA RED</h4>
            <div v-if="availableRooms.length === 0" class="no-rooms-msg">
              No hay salas públicas detectadas. ¡Crea una sala o abre otra pestaña para jugar en red local!
            </div>
            <div v-else class="rooms-list-grid">
              <div v-for="r in availableRooms" :key="r.id" class="room-item-card">
                <div class="room-info">
                  <span class="room-code-tag">{{ r.id }}</span>
                  <span class="room-name">{{ r.name }}</span>
                  <span class="room-count">{{ r.playerCount || 1 }}/10 Jugadores</span>
                </div>
                <button class="btn-join-sm" @click="joinMultiplayerRoom(r.id)">ENTRAR</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MULTIPLAYER LOBBY OVERLAY -->
    <div v-else-if="gameMode === 'MULTIPLAYER_LOBBY'" class="mp-lobby-overlay">
      <div class="lobby-header">
        <div class="lobby-title-wrap">
          <span class="lobby-tag">LOBBY MULTIJUGADOR 3D</span>
          <h2>{{ (MAPS_3D.find(m => m.id === selectedMapId)?.name || 'MAPA TÁCTICO 3D').toUpperCase() }} // PRE-PARTIDA</h2>
        </div>
        <div class="lobby-header-right" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <div class="net-badge" :style="{ color: networkStatus === 'CONNECTED' ? '#4ade80' : '#facc15' }" style="font-size: 0.75rem; padding: 6px 12px; border-radius: 6px; font-weight: 800; display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);">
            <span>{{ networkStatus === 'CONNECTED' ? '🟢' : '🟡' }}</span>
            <span>{{ networkStatus === 'CONNECTED' ? 'EN LÍNEA (CLOUD REALTIME)' : 'CONECTANDO...' }}</span>
          </div>
          <div class="lobby-code-box" style="display: flex; align-items: center; gap: 8px;">
            <span class="code-label">SALA:</span>
            <span class="code-val" style="font-size: 0.85rem; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ roomCode }}</span>
            <button class="btn-copy-sm" @click="copyRoomCode" title="Copiar código de sala" style="background: #3b82f6; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: 700; cursor: pointer;">📋 Código</button>
            <button class="btn-copy-sm" @click="copyRoomLink" title="Copiar enlace para entrar directo" style="background: #10b981; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: 700; cursor: pointer;">🔗 Enlace</button>
          </div>
        </div>
      </div>

      <div class="lobby-teams-grid">
        <!-- ATTACKERS COLUMN -->
        <div class="team-lobby-col atk-col">
          <div class="team-col-header text-atk">
            <h3>🔴 ATACANTES ({{ roomPlayerList.filter(p => p.team === 'attackers').length }}/5)</h3>
            <button 
              v-if="player.team !== 'attackers'" 
              class="btn-switch-team" 
              @click="switchLobbyTeam('attackers')"
            >Cambiar a Atacantes</button>
          </div>
          <div class="team-players-list">
            <div 
              v-for="p in roomPlayerList.filter(x => x.team === 'attackers')" 
              :key="p.id" 
              class="player-lobby-badge"
              :class="{ 'is-me': p.id === player.id }"
            >
              <span class="agent-ico">{{ AGENTS[p.agentId]?.avatar || '⚔️' }}</span>
              <div class="p-details">
                <span class="p-name">{{ p.name }} <strong v-if="p.isHost" class="host-crown">👑 HOST</strong></span>
                <span class="p-agent-name">{{ AGENTS[p.agentId]?.name || 'Jett' }}</span>
              </div>
              <span class="ready-dot" :class="{ locked: p.isLocked }">{{ p.isLocked ? 'LISTO' : 'ELIGE' }}</span>
            </div>
          </div>
        </div>

        <!-- DEFENSORES COLUMN -->
        <div class="team-lobby-col def-col">
          <div class="team-col-header text-def">
            <h3>🔵 DEFENSORES ({{ roomPlayerList.filter(p => p.team === 'defenders').length }}/5)</h3>
            <button 
              v-if="player.team !== 'defenders'" 
              class="btn-switch-team" 
              @click="switchLobbyTeam('defenders')"
            >Cambiar a Defensores</button>
          </div>
          <div class="team-players-list">
            <div 
              v-for="p in roomPlayerList.filter(x => x.team === 'defenders')" 
              :key="p.id" 
              class="player-lobby-badge"
              :class="{ 'is-me': p.id === player.id }"
            >
              <span class="agent-ico">{{ AGENTS[p.agentId]?.avatar || '🛡️' }}</span>
              <div class="p-details">
                <span class="p-name">{{ p.name }} <strong v-if="p.isHost" class="host-crown">👑 HOST</strong></span>
                <span class="p-agent-name">{{ AGENTS[p.agentId]?.name || 'Reyna' }}</span>
              </div>
              <span class="ready-dot" :class="{ locked: p.isLocked }">{{ p.isLocked ? 'LISTO' : 'ELIGE' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ONLINE CUSTOM MATCH SETTINGS CARD IN LOBBY -->
      <div class="lobby-custom-config-card">
        <div class="lobby-config-header">
          <div class="config-badge">
            <span class="icon">🛠️</span>
            <span>{{ isHost ? 'AJUSTES DE LA PARTIDA PERSONALIZADA (TÚ ERES EL ANFITRIÓN)' : 'REGLAS DE LA PARTIDA (CONFIGURADAS POR EL ANFITRIÓN)' }}</span>
          </div>
          <span v-if="!isHost" class="guest-notice">🔒 Solo el anfitrión puede modificar las reglas</span>
        </div>

        <div class="lobby-config-grid">
          <!-- Selector de Mapa Táctico 3D -->
          <div class="lobby-config-item" style="grid-column: 1 / -1;">
            <span class="cfg-title">🗺️ MAPA TÁCTICO 3D SELECCIONADO:</span>
            <div class="cfg-buttons" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
              <button 
                v-for="m in MAPS_3D" 
                :key="'mp_map_' + m.id"
                class="btn-cfg-opt"
                :class="{ active: selectedMapId === m.id, 'is-guest': !isHost }"
                :disabled="!isHost"
                @click="selectLobbyMap(m.id)"
                style="padding: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800;"
              >
                <span>{{ m.icon }}</span>
                <span>{{ m.name }}</span>
              </button>
            </div>
          </div>

          <!-- Rondas para Ganar -->
          <div class="lobby-config-item">
            <span class="cfg-title">🏆 RONDAS PARA GANAR:</span>
            <div class="cfg-buttons">
              <button 
                v-for="r in [3, 5, 7, 13]" 
                :key="'mp_r_' + r"
                class="btn-cfg-opt"
                :class="{ active: customSettings.maxRounds === r, 'is-guest': !isHost }"
                :disabled="!isHost"
                @click="updateCustomLobbySetting('maxRounds', r)"
              >{{ r }} Rondas</button>
            </div>
          </div>

          <!-- Créditos Iniciales -->
          <div class="lobby-config-item">
            <span class="cfg-title">💰 CRÉDITOS INICIALES:</span>
            <div class="cfg-buttons">
              <button 
                v-for="c in [800, 2900, 5000, 9999]" 
                :key="'mp_c_' + c"
                class="btn-cfg-opt"
                :class="{ active: customSettings.startingCredits === c, 'is-guest': !isHost }"
                :disabled="!isHost"
                @click="updateCustomLobbySetting('startingCredits', c)"
              >{{ c === 9999 ? '$9999 (Ilimitado)' : '$' + c }}</button>
            </div>
          </div>

          <!-- Rellenar con Bots -->
          <div class="lobby-config-item">
            <span class="cfg-title">🤖 BOTS DE RELLENO:</span>
            <div class="cfg-buttons">
              <button 
                class="btn-cfg-opt"
                :class="{ active: !customSettings.enableBots, 'is-guest': !isHost }"
                :disabled="!isHost"
                @click="updateCustomLobbySetting('enableBots', false); updateCustomLobbySetting('enemyBotCount', 0); updateCustomLobbySetting('allyBotCount', 0)"
              >🔴 Sin Bots (PVP Puro)</button>
              <button 
                class="btn-cfg-opt"
                :class="{ active: customSettings.enableBots, 'is-guest': !isHost }"
                :disabled="!isHost"
                @click="updateCustomLobbySetting('enableBots', true); if(customSettings.enemyBotCount === 0) updateCustomLobbySetting('enemyBotCount', 1)"
              >🟢 Con Bots de Relleno</button>
            </div>
          </div>

          <!-- Munición Infinita -->
          <div class="lobby-config-item">
            <span class="cfg-title">♾️ MUNICIÓN INFINITA:</span>
            <div class="cfg-buttons">
              <button 
                class="btn-cfg-opt"
                :class="{ active: !infiniteAmmo, 'is-guest': !isHost }"
                :disabled="!isHost"
                @click="updateCustomLobbySetting('infiniteAmmo', false)"
              >Normal</button>
              <button 
                class="btn-cfg-opt"
                :class="{ active: infiniteAmmo, 'is-guest': !isHost }"
                :disabled="!isHost"
                @click="updateCustomLobbySetting('infiniteAmmo', true)"
              >Infinita 🔥</button>
            </div>
          </div>

          <!-- Habilidades Infinitas -->
          <div class="lobby-config-item">
            <span class="cfg-title">⚡ HABILIDADES INFINITAS:</span>
            <div class="cfg-buttons">
              <button 
                class="btn-cfg-opt"
                :class="{ active: !infiniteAbilities, 'is-guest': !isHost }"
                :disabled="!isHost"
                @click="updateCustomLobbySetting('infiniteAbilities', false)"
              >Normal</button>
              <button 
                class="btn-cfg-opt"
                :class="{ active: infiniteAbilities, 'is-guest': !isHost }"
                :disabled="!isHost"
                @click="updateCustomLobbySetting('infiniteAbilities', true)"
              >Infinitas ⚡</button>
            </div>
          </div>
        </div>
      </div>

      <!-- LOBBY CHAT & CONTROLS -->
      <div class="lobby-footer">
        <div class="lobby-chat-area">
          <div class="chat-logs">
            <div v-for="m in lobbyChatMessages" :key="m.id" class="chat-log-msg">
              <strong :class="m.team === 'attackers' ? 'text-atk' : 'text-def'">{{ m.senderName }}:</strong> {{ m.text }}
            </div>
          </div>
          <div class="chat-input-row">
            <input 
              v-model="lobbyChatInput" 
              type="text" 
              class="lobby-chat-input" 
              placeholder="Mensaje de chat..." 
              @keyup.enter="sendLobbyChat" 
            />
            <button class="btn-chat-send" @click="sendLobbyChat">ENVIAR</button>
          </div>
        </div>

        <div class="lobby-action-btns">
          <button class="btn-secondary" @click="leaveLobby">SALIR DE LA SALA</button>
          <button class="btn-lockin-sm" @click="lockLobbyAgent">⚔️ LISTO PARA EL DUELO</button>
          <button 
            v-if="isHost" 
            class="btn-start-match" 
            @click="startLobbyMatch"
          >🎮 INICIAR PARTIDA 3D</button>
          <div v-else class="waiting-host-msg">⏳ Esperando a que el anfitrión inicie la partida...</div>
        </div>
      </div>
    </div>

    <!-- 3D IN-GAME HUD LAYER -->
    <div v-else class="hud-layer">
      <!-- Pointer Lock Prompt -->
      <div v-if="!isPointerLocked && player.alive" class="pointer-lock-prompt" @click="requestPointerLock">
        🖱️ HAZ CLIC AQUÍ PARA BLOQUEAR EL RATÓN Y APUNTAR EN 3D (FPS)
      </div>

      <!-- 3D Crosshair (Hides during ADS or when dead) -->
      <div v-if="player.alive && !isAiming" class="crosshair-wrap">
        <div class="crosshair-dot" :style="{ backgroundColor: settings.crosshairColor }"></div>
        <div class="crosshair-bar bar-top" :style="{ backgroundColor: settings.crosshairColor, transform: `translateY(-${5 + crosshairSpread * 14}px)` }"></div>
        <div class="crosshair-bar bar-bottom" :style="{ backgroundColor: settings.crosshairColor, transform: `translateY(${5 + crosshairSpread * 14}px)` }"></div>
        <div class="crosshair-bar bar-left" :style="{ backgroundColor: settings.crosshairColor, transform: `translateX(-${5 + crosshairSpread * 14}px)` }"></div>
        <div class="crosshair-bar bar-right" :style="{ backgroundColor: settings.crosshairColor, transform: `translateX(${5 + crosshairSpread * 14}px)` }"></div>
        <div v-if="hitmarkerActive" class="hitmarker" :class="{ headshot: hitmarkerHeadshot }">✕</div>
      </div>

      <!-- Tactical Sniper Scope Fullscreen Overlay (For Operator / Marshal) -->
      <div v-if="player.alive && isAiming && (WEAPONS[player.weapon]?.category === WEAPON_CATEGORIES.SNIPERS)" class="sniper-scope-overlay">
        <div class="scope-reticle">
          <div class="scope-cross-h"></div>
          <div class="scope-cross-v"></div>
          <div class="scope-center-dot"></div>
          <div class="scope-range-ring"></div>
        </div>
        <div v-if="hitmarkerActive" class="hitmarker scope-hit" :class="{ headshot: hitmarkerHeadshot }">✕</div>
      </div>

      <!-- Tactical ADS Optic Focus Vignette & Precision Reflex Reticle (For Rifles, SMGs, Pistols) -->
      <div v-if="player.alive && isAiming && (WEAPONS[player.weapon]?.category !== WEAPON_CATEGORIES.SNIPERS)" class="ads-focus-overlay"></div>
      <div v-if="player.alive && isAiming && (WEAPONS[player.weapon]?.category !== WEAPON_CATEGORIES.SNIPERS)" class="ads-reflex-reticle">
        <div class="reflex-glow-ring"></div>
        <div class="reflex-center-dot" :style="{ backgroundColor: settings.crosshairColor || '#00f3ff' }"></div>
        <div class="reflex-side-notch notch-left"></div>
        <div class="reflex-side-notch notch-right"></div>
        <div class="reflex-bottom-post"></div>
        <div v-if="hitmarkerActive" class="hitmarker" :class="{ headshot: hitmarkerHeadshot }">✕</div>
      </div>

      <!-- Tactical Minimap Radar -->
      <div class="radar-container">
        <canvas ref="radarCanvasRef" width="140" height="140" class="radar-canvas"></canvas>
      </div>

      <!-- TOP SCOREBOARD (EQUIPO ROJO VS EQUIPO AZUL) -->
      <div class="hud-top">
        <div class="team-badge-hud atk-badge">🔴 ROJO</div>
        <div class="team-score score-atk">{{ match.scoreAtk }}</div>
        <div class="timer-box">
          <div class="timer-val">{{ Math.ceil(match.timer) }}s</div>
          <div class="round-label">RONDA {{ match.round }} / {{ match.maxRounds }} · {{ match.phase === 'BUY_PHASE' ? 'COMPRA' : 'DUELO A MUERTE' }}</div>
        </div>
        <div class="team-score score-def">{{ match.scoreDef }}</div>
        <div class="team-badge-hud def-badge">🔵 AZUL</div>
      </div>

      <!-- ANNOUNCEMENT BANNER -->
      <div v-if="match.announcement" class="announcement-banner">
        {{ match.announcement }}
      </div>

      <!-- KILLFEED -->
      <div class="killfeed-wrap">
        <div v-for="item in killfeed" :key="item.id" class="killfeed-item">
          <span :class="item.killerTeam === 'attackers' ? 'text-atk' : 'text-def'">{{ item.killerName }}</span>
          <span class="killfeed-wep">{{ item.weaponName }} {{ item.isHeadshot ? '💥' : '🔫' }}</span>
          <span :class="item.victimTeam === 'attackers' ? 'text-atk' : 'text-def'">{{ item.victimName }}</span>
        </div>
      </div>

      <!-- SPECTATOR MODE HUD OVERLAY (WHEN LOCAL PLAYER IS ELIMINATED) -->
      <div v-if="!player.alive" class="spectator-hud-overlay">
        <div class="spectator-card">
          <div class="spec-badge">👁️ MODO ESPECTADOR (EN 3RA PERSONA)</div>
          <div v-if="currentSpectatedPlayer" class="spec-player-row">
            <div class="spec-avatar-badge">{{ AGENTS[currentSpectatedPlayer.agentId]?.avatar || '⚔️' }}</div>
            <div class="spec-player-info">
              <div class="spec-player-name">
                {{ currentSpectatedPlayer.name }}
                <span class="spec-agent-tag">{{ (currentSpectatedPlayer.agentId || 'agente').toUpperCase() }}</span>
              </div>
              <div class="spec-stats-bar">
                <span class="spec-stat text-green">❤️ {{ Math.round(currentSpectatedPlayer.health || 0) }} HP</span>
                <span class="spec-stat text-cyan">🛡️ {{ Math.round(currentSpectatedPlayer.armor || 0) }}</span>
                <span class="spec-stat text-gold">🔫 {{ (WEAPONS[currentSpectatedPlayer.weapon]?.name || currentSpectatedPlayer.weapon || 'VANDAL').toUpperCase() }}</span>
              </div>
            </div>
          </div>
          <div v-else class="no-alive-msg">
            ⚠️ No quedan compañeros de equipo activos en la arena
          </div>
          <div class="spec-controls-tip">
            <span>🖱️ <strong>CLIC IZQ / ➡️</strong> Siguiente Jugador</span>
            <span class="spec-divider">|</span>
            <span>🖱️ <strong>CLIC DER / ⬅️</strong> Jugador Anterior</span>
          </div>
        </div>
      </div>

      <!-- BOTTOM HUD (WHEN ALIVE) -->
      <div v-if="player.alive" class="hud-bottom">
        <div class="hud-hp-shield">
          <div class="hp-box">
            <span class="hud-label">VIDA</span>
            <span class="hud-value text-green">{{ Math.round(player.health) }}</span>
          </div>
          <div class="shield-box">
            <span class="hud-label">ESCUDO</span>
            <span class="hud-value text-cyan">{{ Math.round(player.armor) }}</span>
          </div>
        </div>

        <div class="hud-abilities">
          <div class="ability-slot" title="[C] Nube de Humo Táctica"><span class="key-badge">C</span><span class="ab-icon">☁️</span></div>
          <div class="ability-slot" title="[Q] Construir Rampa 1v1 (High Ground)"><span class="key-badge">Q</span><span class="ab-icon">🪜</span></div>
          <div class="ability-slot" title="[E] Gancho de Agarre / Impulso"><span class="key-badge">E</span><span class="ab-icon">⚡</span></div>
          <div class="ability-slot ult-slot" :class="{ ready: player.ultPoints >= player.requiredUltPoints }" title="[X] Plataforma de Salto + Súper Escudo (+50)">
            <span class="key-badge">X</span>
            <span class="ab-icon">🚀</span>
          </div>
        </div>

        <!-- Inventory Switcher & Inspect Prompt -->
        <div class="hud-inventory">
          <button class="inv-slot" :class="{ active: player.currentSlot === 'primary' }" @click="equipPrimaryWeapon" title="Equipar Arma Principal [1]">
            <span class="slot-num">1</span>
            <span class="slot-icon">🔫</span>
            <span class="slot-name">{{ (WEAPONS[player.primaryWeapon]?.name || 'PRIMARIA').toUpperCase() }}</span>
          </button>
          <button class="inv-slot" :class="{ active: player.currentSlot === 'melee' }" @click="equipMeleeWeapon" title="Equipar Cuchillo Mariposa [3 / Rueda]">
            <span class="slot-num">3</span>
            <span class="slot-icon">🗡️</span>
            <span class="slot-name">CUCHILLO</span>
          </button>
          <button class="btn-inspect-hud" title="Inspeccionar Arma en Mano [Y]" @click="inspectCurrentWeapon">
            <span class="slot-num">Y</span>
            <span class="slot-icon">✨</span>
            <span class="slot-name">INSPECCIONAR</span>
          </button>
        </div>

        <div class="hud-weapon">
          <div class="wep-name">{{ WEAPONS[player.weapon]?.name.toUpperCase() }}</div>
          <div v-if="!WEAPONS[player.weapon]?.isMelee" class="ammo-val">
            <span class="ammo-cur">{{ player.ammo }}</span>
            <span class="ammo-res">/ {{ player.reserveAmmo }}</span>
          </div>
          <div v-else class="ammo-val melee-val">
            <span class="melee-badge">⚡ CORTE CUERPO A CUERPO</span>
          </div>
          <div class="credits-val">${{ player.credits }}</div>
        </div>
      </div>

      <!-- FLOATING ECONOMY REWARD TOAST -->
      <transition name="toast-anim">
        <div v-if="economyToast" class="economy-toast">
          {{ economyToast }}
        </div>
      </transition>

      <!-- BUY MENU (B) -->
      <div v-if="showBuyMenu" class="buy-menu-overlay" @click.stop>
        <div class="buy-header">
          <div class="buy-header-info">
            <h2>🛒 TIENDA DE ARSENAL TÁCTICO 3D</h2>
            <div class="shop-balance">CRÉDITOS DISPONIBLES: <span class="text-gold font-bold">${{ player.credits }}</span></div>
          </div>
          <button class="btn-close" @click.stop="closeBuyMenu">✕ CERRAR (B / ESC)</button>
        </div>
        <div class="buy-grid">
          <div 
            v-for="wep in Object.values(WEAPONS)" 
            :key="wep.id" 
            class="buy-card" 
            :class="{ 
              'equipped': (wep.isMelee ? player.meleeWeapon === wep.id : player.primaryWeapon === wep.id), 
              'cant-afford': player.credits < wep.cost && (wep.isMelee ? player.meleeWeapon !== wep.id : player.primaryWeapon !== wep.id) 
            }"
            @click.stop="buyItem(wep)"
          >
            <div class="buy-card-top">
              <div class="buy-name-row">
                <span class="buy-icon">{{ wep.icon || '🔫' }}</span>
                <h4>{{ wep.name }}</h4>
              </div>
              <span class="buy-cost">${{ wep.cost }}</span>
            </div>
            <p>{{ wep.desc }}</p>
            <div class="buy-card-status">
              <span v-if="(wep.isMelee ? player.meleeWeapon === wep.id : player.primaryWeapon === wep.id)" class="badge-equipped">EQUIPADA</span>
              <span v-else-if="player.credits < wep.cost" class="badge-no-money">FALTAN CRÉDITOS</span>
              <span v-else class="badge-buy">COMPRAR [${{ wep.cost }}]</span>
            </div>
          </div>

          <div 
            v-for="shield in Object.values(SHIELDS)" 
            :key="shield.id" 
            class="buy-card" 
            :class="{ 'equipped': player.armor >= shield.amount, 'cant-afford': player.credits < shield.cost && player.armor < shield.amount }"
            @click.stop="buyItem(shield)"
          >
            <div class="buy-card-top">
              <div class="buy-name-row">
                <span class="buy-icon">{{ shield.icon || '🛡️' }}</span>
                <h4>{{ shield.name }}</h4>
              </div>
              <span class="buy-cost">${{ shield.cost }}</span>
            </div>
            <p>{{ shield.desc }}</p>
            <div class="buy-card-status">
              <span v-if="player.armor >= shield.amount" class="badge-equipped">ACTIVO</span>
              <span v-else-if="player.credits < shield.cost" class="badge-no-money">FALTAN CRÉDITOS</span>
              <span v-else class="badge-buy">COMPRAR [${{ shield.cost }}]</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.valorant-container {
  position: relative;
  width: 100%;
  height: 88vh;
  min-height: 680px;
  background: #090d16;
  color: #f8fafc;
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
  user-select: none;
  border-radius: 12px;
}

/* THREE.JS CANVAS */
.three-canvas-wrap {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* CINEMATIC VIGNETTE OVERLAY */
.vignette-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: radial-gradient(circle at center, transparent 60%, rgba(4, 8, 20, 0.45) 100%);
  z-index: 5;
}

/* OVERLAYS */
.menu-overlay, .agent-select-overlay, .lobby-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 30px;
  display: flex;
  flex-direction: column;
  background: rgba(10, 15, 29, 0.92);
  backdrop-filter: blur(8px);
  z-index: 10;
  overflow-y: auto;
}

.menu-header {
  text-align: center;
  margin-bottom: 20px;
}

.logo-badge {
  display: inline-block;
  background: #ff4655;
  color: #fff;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  letter-spacing: 2px;
}

.game-title {
  font-size: 2.3rem;
  font-weight: 900;
  margin: 6px 0;
  background: linear-gradient(135deg, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.game-subtitle {
  color: #94a3b8;
  font-size: 0.95rem;
}

.menu-nav-tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.menu-tab {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-tab.active, .menu-tab:hover {
  background: #ff4655;
  color: #fff;
  border-color: #ff4655;
  box-shadow: 0 4px 14px rgba(255, 70, 85, 0.4);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.mode-card {
  max-width: 500px;
  margin: 20px auto;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(255, 70, 85, 0.4);
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.mode-card:hover {
  transform: translateY(-4px);
  border-color: #ff4655;
}

.mode-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.btn-primary {
  background: #ff4655;
  color: #fff;
  border: none;
  padding: 12px 28px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  margin-top: 16px;
}

.btn-primary:hover {
  opacity: 0.9;
}

/* AGENTS & WEAPONS GRIDS */
.agents-grid, .weapons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.agent-card, .weapon-card {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 10px;
}

.agent-card-header {
  display: flex;
  gap: 12px;
  align-items: center;
  border-left: 4px solid;
  padding-left: 8px;
  margin-bottom: 10px;
}

.agent-avatar { font-size: 1.8rem; }
.agent-desc { font-size: 0.85rem; color: #94a3b8; margin-bottom: 12px; }
.agent-abilities-list { display: flex; flex-direction: column; gap: 4px; }
.ability-pill { font-size: 0.75rem; background: rgba(15, 23, 42, 0.8); padding: 4px 8px; border-radius: 4px; }

/* AGENT SELECT */
.select-title { text-align: center; margin-bottom: 24px; font-weight: 900; }
.select-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.select-agent-card { background: rgba(30, 41, 59, 0.8); border: 2px solid rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.2s; }
.select-agent-card.selected { border-color: #ff4655; box-shadow: 0 0 16px rgba(255, 70, 85, 0.4); transform: scale(1.05); }
.select-avatar { font-size: 2.5rem; margin-bottom: 10px; }
.btn-lockin { margin: 30px auto 0 auto; display: block; background: #ff4655; color: #fff; border: none; padding: 14px 36px; border-radius: 8px; font-weight: 900; font-size: 1.1rem; cursor: pointer; }

/* HUD LAYER */
.hud-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  pointer-events: none;
}

.pointer-lock-prompt {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(15, 23, 42, 0.95);
  border: 2px solid #38bdf8;
  padding: 16px 28px;
  border-radius: 8px;
  font-weight: 800;
  color: #38bdf8;
  text-align: center;
  box-shadow: 0 0 24px rgba(56, 189, 248, 0.5);
  cursor: pointer;
  pointer-events: auto;
}

/* CROSSHAIR */
.crosshair-wrap {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  width: 0;
  height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crosshair-dot {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.9);
}

.crosshair-bar {
  position: absolute;
  background: #00ffcc;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.9);
  transition: transform 0.05s ease-out;
}

.bar-top, .bar-bottom {
  width: 2px;
  height: 7px;
}

.bar-left, .bar-right {
  width: 7px;
  height: 2px;
}

.hitmarker {
  position: absolute;
  top: -14px;
  left: -8px;
  font-size: 1.4rem;
  color: #ffffff;
  font-weight: 900;
  text-shadow: 0 0 6px #00ffcc;
  animation: hitmarkerPop 0.12s ease-out;
}

.hitmarker.headshot {
  color: #ef4444;
  font-size: 1.8rem;
  text-shadow: 0 0 8px #ef4444;
}

@keyframes hitmarkerPop {
  0% { transform: scale(0.6); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1.0); }
}

/* ADS OPTIC FOCUS VIGNETTE */
.ads-focus-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 30%, rgba(15, 23, 42, 0.4) 65%, rgba(4, 8, 20, 0.8) 100%);
  z-index: 4;
  animation: adsFocusFadeIn 0.12s ease-out;
}

@keyframes adsFocusFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* SNIPER SCOPE OVERLAY */
.sniper-scope-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, transparent 380px, #050811 385px);
  z-index: 50;
}

.scope-reticle {
  position: relative;
  width: 760px;
  height: 760px;
  border-radius: 50%;
  border: 3px solid rgba(239, 68, 68, 0.85);
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.9), 0 0 20px rgba(239, 68, 68, 0.4);
}

.scope-cross-h {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1.5px;
  background: rgba(239, 68, 68, 0.85);
  transform: translateY(-50%);
}

.scope-cross-v {
  position: absolute;
  left: 50%;
  top: 0;
  width: 1.5px;
  height: 100%;
  background: rgba(239, 68, 68, 0.85);
  transform: translateX(-50%);
}

.scope-center-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
  transform: translate(-50%, -50%);
}

.scope-range-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 1px dashed rgba(239, 68, 68, 0.5);
  transform: translate(-50%, -50%);
}

.scope-hit {
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
}

/* RADAR */
.radar-container {
  position: absolute;
  top: 20px;
  left: 20px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(56, 189, 248, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.radar-canvas { display: block; }

/* TOP HUD */
.hud-top {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(8px);
  padding: 8px 24px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.team-badge-hud {
  font-size: 0.75rem;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.atk-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.def-badge {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.5);
}

.team-score { font-size: 1.8rem; font-weight: 900; }
.score-atk { color: #ef4444; }
.score-def { color: #3b82f6; }
.timer-box { text-align: center; min-width: 140px; }
.timer-val { font-size: 1.4rem; font-weight: 800; }
.round-label { font-size: 0.65rem; color: #94a3b8; letter-spacing: 1px; }

.announcement-banner {
  position: absolute;
  top: 85px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 70, 85, 0.95);
  color: #fff;
  padding: 8px 30px;
  border-radius: 6px;
  font-weight: 800;
  box-shadow: 0 4px 20px rgba(255, 70, 85, 0.4);
  letter-spacing: 0.5px;
  text-align: center;
  z-index: 50;
}

.killfeed-wrap {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.killfeed-item {
  background: rgba(15, 23, 42, 0.8);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  display: flex;
  gap: 8px;
}

.text-atk { color: #ef4444; font-weight: 700; }
.text-def { color: #3b82f6; font-weight: 700; }

.hud-bottom {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 30px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  padding: 12px 30px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hud-hp-shield { display: flex; gap: 20px; }
.hud-label { font-size: 0.65rem; color: #94a3b8; display: block; }
.hud-value { font-size: 1.6rem; font-weight: 900; }
.text-green { color: #10b981; }
.text-cyan { color: #38bdf8; }
.text-gold { color: #eab308; }

.hud-abilities { display: flex; gap: 12px; }
.ability-slot {
  position: relative;
  width: 48px;
  height: 48px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.key-badge {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.65rem;
  font-weight: 800;
  color: #94a3b8;
}

.ult-slot.ready {
  border-color: #38bdf8;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
}

/* INVENTORY SLOTS HUD */
.hud-inventory {
  display: flex;
  gap: 8px;
  align-items: center;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 14px;
}

.inv-slot, .btn-inspect-hud {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all 0.15s ease;
}

.inv-slot:hover, .btn-inspect-hud:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #f8fafc;
}

.inv-slot.active {
  background: rgba(56, 189, 248, 0.3);
  border-color: #38bdf8;
  color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}

.btn-inspect-hud {
  border-color: rgba(234, 179, 8, 0.3);
  color: #facc15;
}

.btn-inspect-hud:hover {
  background: rgba(234, 179, 8, 0.25);
  border-color: #facc15;
  box-shadow: 0 0 10px rgba(234, 179, 8, 0.4);
}

.slot-num {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.65rem;
  color: #ffffff;
}

.slot-icon {
  font-size: 0.95rem;
}

.hud-weapon { text-align: right; }
.wep-name { font-size: 0.85rem; font-weight: 800; color: #94a3b8; }
.ammo-cur { font-size: 1.6rem; font-weight: 900; }
.ammo-res { font-size: 1rem; color: #64748b; }
.melee-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}
.credits-val { font-size: 0.8rem; color: #eab308; font-weight: 700; }

/* FLOATING ECONOMY TOAST */
.economy-toast {
  position: absolute;
  top: 135px;
  right: 24px;
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.95), rgba(202, 138, 4, 0.95));
  color: #0f172a;
  font-weight: 900;
  font-size: 1.05rem;
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(234, 179, 8, 0.4);
  border: 1px solid #fef08a;
  z-index: 90;
  letter-spacing: 0.5px;
  pointer-events: none;
}

.toast-anim-enter-active,
.toast-anim-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-anim-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.toast-anim-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

/* BUY MENU */
.buy-menu-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 960px;
  max-height: 85vh;
  background: rgba(15, 23, 42, 0.97);
  border: 2px solid #ff4655;
  border-radius: 14px;
  padding: 24px 28px;
  overflow-y: auto;
  z-index: 200;
  pointer-events: auto;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 70, 85, 0.2);
  cursor: default;
}

.buy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 14px;
}

.buy-header-info h2 {
  font-size: 1.4rem;
  font-weight: 900;
  margin: 0 0 4px 0;
  color: #f8fafc;
}

.shop-balance {
  font-size: 0.9rem;
  color: #94a3b8;
}

.buy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.buy-card {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.buy-card:hover:not(.cant-afford) {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.buy-card.equipped {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.15);
}

.buy-card.cant-afford {
  opacity: 0.55;
  cursor: not-allowed;
  border-color: rgba(239, 68, 68, 0.3);
}

.buy-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.buy-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.buy-name-row h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #f1f5f9;
}

.buy-icon {
  font-size: 1.3rem;
}

.buy-cost {
  color: #eab308;
  font-weight: 900;
  font-size: 1.1rem;
}

.buy-card p {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.4;
  margin: 0 0 14px 0;
  flex: 1;
}

.buy-card-status {
  margin-top: auto;
}

.badge-equipped {
  display: block;
  text-align: center;
  background: #10b981;
  color: #0f172a;
  font-weight: 800;
  font-size: 0.75rem;
  padding: 6px 12px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.badge-no-money {
  display: block;
  text-align: center;
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.4);
  font-weight: 700;
  font-size: 0.75rem;
  padding: 6px 12px;
  border-radius: 6px;
}

.badge-buy {
  display: block;
  text-align: center;
  background: #ff4655;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.75rem;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.buy-card:hover .badge-buy {
  background: #f43f5e;
}

/* MULTIPLAYER SETUP & LOBBY STYLES */
.mp-setup-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.mp-profile-row {
  display: flex;
  gap: 24px;
  background: rgba(30, 41, 59, 0.7);
  padding: 16px 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.input-group, .team-toggle-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.input-group label, .team-toggle-group label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.mp-input {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 700;
  outline: none;
}

.mp-input:focus { border-color: #38bdf8; }

.team-btns { display: flex; gap: 10px; }

.btn-team {
  flex: 1;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #94a3b8;
  padding: 10px;
  border-radius: 6px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-team.active {
  border-color: #38bdf8;
  color: #fff;
  background: rgba(56, 189, 248, 0.2);
}

.mp-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.mp-action-box {
  background: rgba(30, 41, 59, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.box-icon { font-size: 2.2rem; }
.mp-action-box h3 { font-size: 1.2rem; font-weight: 900; margin: 0; }
.mp-action-box p { font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.4; }

.join-input-row { display: flex; gap: 8px; width: 100%; margin-top: 8px; }
.code-input { flex: 1; text-transform: uppercase; text-align: center; letter-spacing: 2px; }

.btn-join {
  background: #38bdf8;
  color: #0f172a;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 800;
  cursor: pointer;
}

.public-rooms-section {
  background: rgba(15, 23, 42, 0.6);
  padding: 16px 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.public-rooms-section h4 { font-size: 0.85rem; color: #38bdf8; margin-bottom: 12px; }
.no-rooms-msg { font-size: 0.85rem; color: #64748b; font-style: italic; }

.rooms-list-grid { display: flex; flex-direction: column; gap: 8px; }
.room-item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.8);
  padding: 10px 16px;
  border-radius: 6px;
}

.room-info { display: flex; gap: 12px; align-items: center; }
.room-code-tag { background: #38bdf8; color: #0f172a; padding: 2px 8px; border-radius: 4px; font-weight: 900; font-size: 0.8rem; }
.room-name { font-weight: 700; font-size: 0.9rem; }
.room-count { font-size: 0.8rem; color: #94a3b8; }
.btn-join-sm { background: #ff4655; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-weight: 800; font-size: 0.8rem; cursor: pointer; }

/* MULTIPLAYER LOBBY OVERLAY */
.mp-lobby-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(8, 13, 26, 0.95);
  backdrop-filter: blur(12px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 50;
  overflow-y: auto;
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 16px;
}

.lobby-tag { font-size: 0.75rem; font-weight: 900; color: #38bdf8; letter-spacing: 1px; }
.lobby-title-wrap h2 { margin: 4px 0 0 0; font-weight: 900; font-size: 1.4rem; }

.lobby-code-box {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #38bdf8;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  transition: transform 0.15s;
}

.lobby-code-box:hover { transform: scale(1.03); }
.code-label { font-size: 0.75rem; color: #94a3b8; font-weight: 700; }
.code-val { font-size: 1.2rem; font-weight: 900; color: #38bdf8; letter-spacing: 1.5px; }
.copy-hint { font-size: 0.75rem; background: rgba(56, 189, 248, 0.2); padding: 2px 6px; border-radius: 4px; }

.lobby-teams-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 16px 0;
}

.team-lobby-col {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 16px;
}

.team-col-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 8px;
}

.team-col-header h3 { margin: 0; font-size: 1rem; font-weight: 900; }
.btn-switch-team { background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; font-size: 0.75rem; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
.btn-switch-team:hover { background: rgba(255, 255, 255, 0.1); }

.team-players-list { display: flex; flex-direction: column; gap: 8px; }
.player-lobby-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(30, 41, 59, 0.6);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid transparent;
}

.player-lobby-badge.is-me { border-color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
.agent-ico { font-size: 1.6rem; }
.p-details { flex: 1; }
.p-name { display: block; font-weight: 800; font-size: 0.9rem; }
.host-crown { color: #facc15; font-size: 0.75rem; margin-left: 6px; }
.p-agent-name { font-size: 0.75rem; color: #94a3b8; }
.ready-dot { font-size: 0.7rem; font-weight: 800; background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 3px 8px; border-radius: 4px; }
.ready-dot.locked { background: rgba(16, 185, 129, 0.2); color: #10b981; }

.lobby-agent-selection { margin-bottom: 16px; }
.lobby-agent-selection h4 { font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px; }
.lobby-agents-row { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; }

.lobby-agent-card {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 10px 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  min-width: 90px;
  transition: all 0.15s;
}

.lobby-agent-card.selected { border-color: #ff4655; background: rgba(255, 70, 85, 0.25); transform: translateY(-3px); }
.card-avatar { font-size: 1.6rem; }
.card-name { font-size: 0.75rem; font-weight: 800; }

/* ONLINE CUSTOM CONFIG CARD IN LOBBY */
.lobby-custom-config-card {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  padding: 16px 20px;
  margin: 12px 0 16px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.lobby-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.config-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  font-size: 0.85rem;
  color: #38bdf8;
  letter-spacing: 0.5px;
}

.guest-notice {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
  background: rgba(30, 41, 59, 0.6);
  padding: 3px 8px;
  border-radius: 4px;
}

.lobby-config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px 16px;
}

.lobby-config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cfg-title {
  font-size: 0.72rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.cfg-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-cfg-opt {
  flex: 1;
  min-width: 70px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.btn-cfg-opt:hover:not(:disabled) {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  color: #fff;
}

.btn-cfg-opt.active {
  background: #38bdf8;
  color: #0f172a;
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
}

.btn-cfg-opt:disabled, .btn-cfg-opt.is-guest {
  cursor: default;
  opacity: 0.85;
}

.btn-cfg-opt.is-guest:not(.active) {
  opacity: 0.45;
}

.lobby-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 16px;
}

.lobby-chat-area { display: flex; flex-direction: column; gap: 8px; }
.chat-logs { height: 90px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 8px; overflow-y: auto; font-size: 0.8rem; display: flex; flex-direction: column; gap: 4px; }
.chat-input-row { display: flex; gap: 8px; }
.lobby-chat-input { flex: 1; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; padding: 6px 10px; border-radius: 4px; font-size: 0.85rem; outline: none; }
.btn-chat-send { background: #38bdf8; color: #0f172a; border: none; padding: 6px 14px; border-radius: 4px; font-weight: 800; font-size: 0.8rem; cursor: pointer; }

.lobby-action-btns { display: flex; flex-direction: column; gap: 8px; justify-content: center; }
.btn-secondary { background: rgba(255, 255, 255, 0.1); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px; border-radius: 6px; font-weight: 800; font-size: 0.85rem; cursor: pointer; }
.btn-lockin-sm { background: #ff4655; color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: 900; font-size: 0.95rem; cursor: pointer; }
.btn-start-match { background: #10b981; color: #fff; border: none; padding: 12px; border-radius: 6px; font-weight: 900; font-size: 1.05rem; cursor: pointer; box-shadow: 0 0 16px rgba(16, 185, 129, 0.4); }
.waiting-host-msg { font-size: 0.85rem; color: #eab308; font-style: italic; text-align: center; }

/* SPECTATOR HUD OVERLAY */
.spectator-hud-overlay {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 25;
  pointer-events: none;
}

.spectator-card {
  background: rgba(10, 15, 29, 0.92);
  border: 1.5px solid rgba(56, 189, 248, 0.5);
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.8), 0 0 15px rgba(56, 189, 248, 0.2);
  backdrop-filter: blur(10px);
  padding: 14px 24px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 380px;
  animation: specPulse 2s infinite ease-in-out;
}

@keyframes specPulse {
  0%, 100% { border-color: rgba(56, 189, 248, 0.4); box-shadow: 0 0 20px rgba(0, 0, 0, 0.8), 0 0 10px rgba(56, 189, 248, 0.15); }
  50% { border-color: rgba(56, 189, 248, 0.8); box-shadow: 0 0 25px rgba(0, 0, 0, 0.9), 0 0 20px rgba(56, 189, 248, 0.35); }
}

.spec-badge {
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 2px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  padding: 3px 12px;
  border-radius: 20px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.spec-player-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.spec-avatar-badge {
  font-size: 2.2rem;
  background: rgba(30, 41, 59, 0.8);
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.spec-player-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spec-player-name {
  font-size: 1.15rem;
  font-weight: 900;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.spec-agent-tag {
  font-size: 0.75rem;
  font-weight: 800;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
}

.spec-stats-bar {
  display: flex;
  gap: 14px;
  font-size: 0.9rem;
  font-weight: 800;
}

.spec-stat {
  display: flex;
  align-items: center;
  gap: 3px;
}

.no-alive-msg {
  color: #f87171;
  font-size: 0.9rem;
  font-weight: 700;
}

.spec-controls-tip {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 8px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  font-size: 0.78rem;
  color: #cbd5e1;
}

.spec-controls-tip strong {
  color: #38bdf8;
}

.spec-divider {
  color: rgba(255, 255, 255, 0.2);
}

/* 1V1 DUELS & MODES GRID */
.modes-grid-duels {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 20px;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.mode-card.featured-1v1 {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(15, 23, 42, 0.95));
  border: 2px solid #ff4655;
  box-shadow: 0 0 30px rgba(255, 70, 85, 0.25);
  position: relative;
  overflow: hidden;
}

.mode-badge-top {
  position: absolute;
  top: 10px;
  right: 12px;
  background: #ff4655;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.btn-primary-glow {
  background: linear-gradient(135deg, #ff4655, #f43f5e);
  color: #ffffff;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 900;
  font-size: 1rem;
  cursor: pointer;
  letter-spacing: 1px;
  box-shadow: 0 0 20px rgba(255, 70, 85, 0.5);
  transition: all 0.2s;
  width: 100%;
  margin-top: auto;
}

.btn-primary-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 28px rgba(255, 70, 85, 0.7);
}

/* CUSTOM MATCH SETUP PANEL */
.custom-panel-tab {
  display: flex;
  justify-content: center;
  width: 100%;
}

.custom-setup-box {
  background: rgba(15, 23, 42, 0.9);
  border: 1.5px solid rgba(56, 189, 248, 0.35);
  border-radius: 12px;
  padding: 24px;
  max-width: 850px;
  width: 100%;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
}

.custom-box-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 14px;
  margin-bottom: 18px;
}

.custom-box-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #38bdf8;
  font-weight: 900;
}

.custom-box-header p {
  margin: 4px 0 0 0;
  color: #94a3b8;
  font-size: 0.85rem;
}

.custom-options-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.custom-opt-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.opt-label {
  font-size: 0.85rem;
  font-weight: 800;
  color: #e2e8f0;
}

.opt-btn-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-opt {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #94a3b8;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-opt:hover {
  background: rgba(56, 189, 248, 0.15);
  color: #ffffff;
}

.btn-opt.active {
  background: #38bdf8;
  color: #0f172a;
  border-color: #38bdf8;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}

.bot-count-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-count {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-count:hover {
  background: rgba(255, 70, 85, 0.15);
}

.btn-count.active {
  background: #ff4655;
  color: #ffffff;
  border-color: #ff4655;
  box-shadow: 0 0 12px rgba(255, 70, 85, 0.4);
}

.custom-launch-bar {
  margin-top: 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 16px;
}

.btn-start-custom {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-weight: 900;
  font-size: 1.1rem;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  transition: all 0.2s;
}

.btn-start-custom:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.6);
}

/* ADS HOLOGRAPHIC REFLEX RETICLE */
.ads-reflex-reticle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  pointer-events: none;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reflex-center-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  box-shadow: 0 0 6px #00f3ff, 0 0 14px #00f3ff, 0 0 22px #00f3ff;
}

.reflex-glow-ring {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 1.5px dashed rgba(0, 243, 255, 0.45);
  border-radius: 50%;
  animation: reflexPulse 2s infinite ease-in-out;
}

@keyframes reflexPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.08); opacity: 0.85; }
}

.reflex-side-notch {
  position: absolute;
  width: 5px;
  height: 1.5px;
  background: rgba(0, 243, 255, 0.6);
}

.reflex-side-notch.notch-left {
  left: 0;
}

.reflex-side-notch.notch-right {
  right: 0;
}

.reflex-bottom-post {
  position: absolute;
  bottom: 0;
  width: 1.5px;
  height: 4px;
  background: rgba(0, 243, 255, 0.6);
}

</style>
