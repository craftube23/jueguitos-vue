<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'
import { AGENTS } from './data/agents.js'
import { WEAPONS, SHIELDS, WEAPON_CATEGORIES } from './data/weapons.js'
import { soundManager } from './systems/SoundSystem.js'
import { DamageSystem, PLAYER_STATES } from './systems/DamageSystem.js'
import { SPIKE_STATES } from './systems/ObjectiveSystem.js'
import { PlayerController3D } from './systems/PlayerController3D.js'
import { WeaponSystem3D } from './systems/WeaponSystem3D.js'
import { AbilitySystem3D } from './systems/AbilitySystem3D.js'
import { SpikeObjective3D } from './systems/SpikeObjective3D.js'
import { BotAI3D } from './systems/BotAI3D.js'
import { NetworkSystem } from './systems/NetworkSystem.js'
import { buildTacticalArena } from './systems/MapBuilder3D.js'

// --- GAME STATE ---
const gameMode = ref('MENU') // 'MENU', 'AGENT_SELECT', 'IN_GAME', 'MULTIPLAYER_LOBBY', 'PRACTICE'
const isOnline = ref(false)
const showBuyMenu = ref(false)
const showScoreboard = ref(false)
const showSettings = ref(false)
const activeTab = ref('play')
const isPointerLocked = ref(false)
const isThirdPerson = ref(false)

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

// Match Stats & Phases
const match = reactive({
  round: 1,
  maxRounds: 13,
  scoreAtk: 0,
  scoreDef: 0,
  phase: 'BUY_PHASE', // 'BUY_PHASE', 'ROUND_ACTIVE', 'ROUND_ENDED'
  timer: 20,
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
  credits: 800,
  weapon: 'vandal',
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

// Hitmarker & Crosshair
const hitmarkerActive = ref(false)
const hitmarkerHeadshot = ref(false)
const crosshairSpread = ref(0)
const inPlantZone = ref(false)
const inDefuseZone = ref(false)
const plantSiteName = ref('')
const isAiming = computed(() => mouse.rightDown && isPointerLocked.value && !player.isReloading && player.alive)

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

// Modular Systems
let playerController = null
let weaponSystem = null
let abilitySystem = null
let spikeObjective = null
let botAI = null
let networkSystem = null

const playerMeshes = new Map()

// Input Tracking
const keys = reactive({})
const mouse = reactive({ isDown: false, rightDown: false })

// Multiplayer Room
const roomCode = ref('')
const joinCodeInput = ref('')
const roomPlayerList = ref([])
const isHost = ref(false)

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
  camera = new THREE.PerspectiveCamera(settings.fov, width / height, 0.1, 1000)
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

  // 4. Build Atmosphere & Procedural 2-Floor Tactical Arena (SECTOR RADIAN-9)
  buildAtmosphere()
  const arenaData = buildTacticalArena(scene)
  Object.assign(MAP_3D, arenaData)

  // 5. Initialize Systems
  playerController = new PlayerController3D(camera, scene, container)
  playerController.setMeshColliders(arenaData.meshColliders)
  playerController.setColliders(arenaData.wallsAABB)
  weaponSystem = new WeaponSystem3D(scene, camera)
  weaponSystem.setMeshColliders(arenaData.meshColliders)
  abilitySystem = new AbilitySystem3D(scene, camera)
  spikeObjective = new SpikeObjective3D(scene)
  botAI = new BotAI3D(scene)
  botAI.setMeshColliders(arenaData.meshColliders)

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

function buildAtmosphere() {
  // Atmospheric Sky Dome with Tactical Gradient
  const skyCanvas = document.createElement('canvas')
  skyCanvas.width = 512
  skyCanvas.height = 512
  const skyCtx = skyCanvas.getContext('2d')
  const grad = skyCtx.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#040814')    // Deep zenith
  grad.addColorStop(0.5, '#0b192e')  // Mid twilight
  grad.addColorStop(0.85, '#1e3a5f') // Horizon glow
  grad.addColorStop(1.0, '#38bdf8')  // Horizon accent line
  skyCtx.fillStyle = grad
  skyCtx.fillRect(0, 0, 512, 512)

  const skyTex = new THREE.CanvasTexture(skyCanvas)
  const skyGeo = new THREE.SphereGeometry(250, 32, 16)
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })
  const skyDome = new THREE.Mesh(skyGeo, skyMat)
  scene.add(skyDome)

  // Floating Radianite Dust Particles (Atmospheric Motes)
  const dustCount = 120
  const dustGeo = new THREE.BufferGeometry()
  const dustPositions = new Float32Array(dustCount * 3)
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 60
    dustPositions[i * 3 + 1] = Math.random() * 8 + 0.5
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 60
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
  const dustMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.12,
    transparent: true,
    opacity: 0.55,
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
    match.timer -= dt
    if (match.timer <= 0) {
      match.phase = 'ROUND_ACTIVE'
      match.timer = 100
      match.announcement = '¡BARRERAS ABAJO! ¡A LA CARGA!'
      soundManager.play('ult_activate')
    }
  } else if (match.phase === 'ROUND_ACTIVE') {
    match.timer -= dt
    if (match.timer <= 0 && spikeObjective.state !== SPIKE_STATES.PLANTED && spikeObjective.state !== SPIKE_STATES.DEFUSING) {
      endRound('defenders', '¡Tiempo agotado! Defensores aseguran la ronda.')
    }
  } else if (match.phase === 'ROUND_ENDED') {
    match.timer -= dt
    if (match.timer <= 0) {
      match.round++
      if (match.scoreAtk >= match.maxRounds || match.scoreDef >= match.maxRounds) {
        match.announcement = match.scoreAtk > match.scoreDef ? '🏆 ¡VICTORIA DE ATACANTES!' : '🏆 ¡VICTORIA DE DEFENSORES!'
        gameMode.value = 'MENU'
      } else {
        resetRound(false)
      }
    }
  }

  // Update Player Controller
  playerController.isLocked = isPointerLocked.value
  playerController.update(dt, keys, player.isSlowed, player.isStimmed)
  player.pos.x = playerController.position.x
  player.pos.y = playerController.position.y
  player.pos.z = playerController.position.z
  player.yaw = playerController.yaw
  player.pitch = playerController.pitch

  // Blind recovery
  if (player.blindAlpha > 0) {
    player.blindAlpha = Math.max(0, player.blindAlpha - 0.7 * dt)
  }

  // Update Weapon & Shooting
  const wep = WEAPONS[player.weapon] || WEAPONS.vandal
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

  // Dynamically scale mouse sensitivity with camera zoom
  if (camera && playerController) {
    playerController.mouseSensitivity = settings.mouseSensitivity * (camera.fov / settings.fov)
  }

  if (mouse.isDown && isPointerLocked.value && player.shootCooldown <= 0 && !player.isReloading && match.phase !== 'BUY_PHASE') {
    triggerFire()
  }

  // Update Abilities & Spike
  abilitySystem.update(dt, player)
  spikeObjective.update(
    dt,
    () => {},
    (site) => { match.announcement = `¡SPIKE PLANTADA EN SITE ${site}!`; soundManager.play('spike_plant') },
    () => { soundManager.play('spike_defused'); endRound('defenders', '¡Spike desactivada con éxito!') },
    (pos) => { soundManager.play('explosion'); endRound('attackers', '¡La Spike ha detonado el objetivo!') }
  )

  // Evaluate Zone Proximity for HUD Prompt
  const inA = (Math.abs(player.pos.x - MAP_3D.siteA.x) <= MAP_3D.siteA.width / 2 + 1.2 &&
               Math.abs(player.pos.z - MAP_3D.siteA.z) <= MAP_3D.siteA.depth / 2 + 1.2) ||
              Math.hypot(player.pos.x - MAP_3D.siteA.x, player.pos.z - MAP_3D.siteA.z) < MAP_3D.siteA.radius

  const inB = (Math.abs(player.pos.x - MAP_3D.siteB.x) <= MAP_3D.siteB.width / 2 + 1.2 &&
               Math.abs(player.pos.z - MAP_3D.siteB.z) <= MAP_3D.siteB.depth / 2 + 1.2) ||
              Math.hypot(player.pos.x - MAP_3D.siteB.x, player.pos.z - MAP_3D.siteB.z) < MAP_3D.siteB.radius

  inPlantZone.value = player.team === 'attackers' && (inA || inB) && spikeObjective.state === SPIKE_STATES.CARRIED && spikeObjective.carrierId === player.id
  if (inA) plantSiteName.value = 'SITE A (REACTOR)'
  else if (inB) plantSiteName.value = 'SITE B (VAULT)'

  inDefuseZone.value = player.team === 'defenders' && spikeObjective.state === SPIKE_STATES.PLANTED && Math.hypot(player.pos.x - spikeObjective.position.x, player.pos.z - spikeObjective.position.z) < 3.5

  // Plant / Defuse Keys (F or 4)
  if (keys['KeyF'] || keys['Digit4']) {
    handlePlantOrDefuse3D()
  }

  // Update Bots AI
  players.value.forEach(bot => {
    if (bot.id !== player.id) {
      botAI.updateBot(bot, dt, player, match.phase, MAP_3D, (shooter, target) => {
        weaponSystem.spawnTracer(new THREE.Vector3(shooter.pos.x, shooter.pos.y, shooter.pos.z), new THREE.Vector3(target.pos.x, target.pos.y, target.pos.z))
        if (!godMode.value) DamageSystem.applyDamage(target, 25, false, false, 'bullet')
      })
    }
  })

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
      weapon: player.weapon
    })
  }
}

function handlePlantOrDefuse3D() {
  if (player.team === 'attackers' && spikeObjective.state === SPIKE_STATES.CARRIED && spikeObjective.carrierId === player.id) {
    const inA = (Math.abs(player.pos.x - MAP_3D.siteA.x) <= MAP_3D.siteA.width / 2 + 1.2 &&
                 Math.abs(player.pos.z - MAP_3D.siteA.z) <= MAP_3D.siteA.depth / 2 + 1.2) ||
                Math.hypot(player.pos.x - MAP_3D.siteA.x, player.pos.z - MAP_3D.siteA.z) < MAP_3D.siteA.radius

    const inB = (Math.abs(player.pos.x - MAP_3D.siteB.x) <= MAP_3D.siteB.width / 2 + 1.2 &&
                 Math.abs(player.pos.z - MAP_3D.siteB.z) <= MAP_3D.siteB.depth / 2 + 1.2) ||
                Math.hypot(player.pos.x - MAP_3D.siteB.x, player.pos.z - MAP_3D.siteB.z) < MAP_3D.siteB.radius

    if (inA || inB) {
      if (spikeObjective.state !== SPIKE_STATES.PLANTING) {
        spikeObjective.startPlant(player.id, inA ? 'A (REACTOR)' : 'B (VAULT)', player.pos)
      }
      spikeObjective.plantProgress += 0.03
      if (spikeObjective.plantProgress >= 4.0) {
        spikeObjective.completePlant()
        match.announcement = `¡SPIKE PLANTADA EN SITE ${spikeObjective.site}!`
      }
    }
  } else if (player.team === 'defenders' && spikeObjective.state === SPIKE_STATES.PLANTED) {
    const dist = Math.hypot(player.pos.x - spikeObjective.position.x, player.pos.z - spikeObjective.position.z)
    if (dist < 3.5) {
      if (spikeObjective.state !== SPIKE_STATES.DEFUSING) {
        spikeObjective.startDefuse(player.id)
      }
      spikeObjective.defuseProgress += 0.03
      if (spikeObjective.defuseProgress >= 7.0) {
        spikeObjective.completeDefuse()
        endRound('defenders', '¡Spike desactivada con éxito!')
      }
    }
  }
}

function updatePlayer3DMeshes() {
  players.value.forEach(p => {
    if (p.id === player.id) return

    let mesh = playerMeshes.get(p.id)
    if (!mesh) {
      mesh = new THREE.Group()

      const isAtk = p.team === 'attackers'
      const teamColor = isAtk ? 0xef4444 : 0x00f3ff
      const darkArmorMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.5,
        metalness: 0.35
      })
      const teamGlowMat = new THREE.MeshBasicMaterial({ color: teamColor })

      // 1. Legs (Dual tactical combat boots/legs)
      const legGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.75, 8)
      const leftLeg = new THREE.Mesh(legGeo, darkArmorMat)
      leftLeg.position.set(-0.16, 0.38, 0)
      leftLeg.castShadow = true
      mesh.add(leftLeg)

      const rightLeg = new THREE.Mesh(legGeo, darkArmorMat)
      rightLeg.position.set(0.16, 0.38, 0)
      rightLeg.castShadow = true
      mesh.add(rightLeg)

      // 2. Torso (Armored tactical vest)
      const torsoGeo = new THREE.CylinderGeometry(0.3, 0.22, 0.7, 8)
      const torso = new THREE.Mesh(torsoGeo, darkArmorMat)
      torso.position.set(0, 1.1, 0)
      torso.castShadow = true
      mesh.add(torso)

      // 3. Chest Radianite Core (Glowing team badge)
      const coreGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.04, 8)
      coreGeo.rotateX(Math.PI / 2)
      const core = new THREE.Mesh(coreGeo, teamGlowMat)
      core.position.set(0, 1.22, 0.22)
      mesh.add(core)

      // 4. Armored Pauldrons (Shoulders)
      const pauldronGeo = new THREE.BoxGeometry(0.14, 0.12, 0.18)
      const leftShoulder = new THREE.Mesh(pauldronGeo, darkArmorMat)
      leftShoulder.position.set(-0.36, 1.35, 0)
      mesh.add(leftShoulder)

      const rightShoulder = new THREE.Mesh(pauldronGeo, darkArmorMat)
      rightShoulder.position.set(0.36, 1.35, 0)
      mesh.add(rightShoulder)

      // 5. Tactical Helmet & Glowing Visor Slit
      const helmetGeo = new THREE.SphereGeometry(0.18, 16, 16)
      helmetGeo.scale(1, 1.15, 1.1)
      const helmet = new THREE.Mesh(helmetGeo, darkArmorMat)
      helmet.position.set(0, 1.62, 0)
      helmet.castShadow = true
      mesh.add(helmet)

      // Holographic / Neon Visor Slit
      const visorGeo = new THREE.BoxGeometry(0.22, 0.05, 0.08)
      const visor = new THREE.Mesh(visorGeo, teamGlowMat)
      visor.position.set(0, 1.64, 0.14)
      mesh.add(visor)

      // 6. Tactical Rifle slung on back
      const backRifleGeo = new THREE.BoxGeometry(0.08, 0.65, 0.1)
      const backRifleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 })
      const backRifle = new THREE.Mesh(backRifleGeo, backRifleMat)
      backRifle.position.set(0.1, 1.1, -0.22)
      backRifle.rotation.z = -0.4
      mesh.add(backRifle)

      scene.add(mesh)
      playerMeshes.set(p.id, mesh)
    }

    mesh.visible = p.alive
    mesh.position.set(p.pos.x, 0, p.pos.z)
    if (p.yaw !== undefined) {
      mesh.rotation.y = p.yaw
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
  if (spikeObjective && spikeObjective.state !== SPIKE_STATES.CARRIED) {
    ctx.fillStyle = '#eab308'
    ctx.beginPath()
    ctx.arc(cx + spikeObjective.position.x * scale, cy + spikeObjective.position.z * scale, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // 5. Draw Live Players
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

function resetRound(fullReset = false) {
  if (fullReset) {
    match.scoreAtk = 0
    match.scoreDef = 0
    match.round = 1
    player.credits = 800
    player.kills = 0
    player.deaths = 0
  }

  match.phase = 'BUY_PHASE'
  match.timer = 15
  match.winner = null
  match.announcement = 'FASE DE COMPRA - SELECCIONA TU ARSENAL'

  player.alive = true
  player.health = 100
  player.armor = 50
  player.ammo = 25
  player.reserveAmmo = 75

  const mySlots = player.team === 'attackers' ? MAP_3D.spawnAtkSlots : MAP_3D.spawnDefSlots
  const mySpawn = mySlots[2]

  if (playerController) {
    playerController.position.set(mySpawn.x, mySpawn.y, mySpawn.z)
    playerController.velocity.set(0, 0, 0)
    playerController.yaw = player.team === 'attackers' ? Math.PI / 2 : -Math.PI / 2
    playerController.pitch = 0
  }

  if (spikeObjective) {
    spikeObjective.reset(player.team === 'attackers', player.id, mySpawn)
  }

  setup3DBots()
  soundManager.play('buy')
}

function setup3DBots() {
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
        strafing: i % 2 === 1
      })
    }
    return
  }

  const mySlots = player.team === 'attackers' ? MAP_3D.spawnAtkSlots : MAP_3D.spawnDefSlots
  const enemySlots = player.team === 'attackers' ? MAP_3D.spawnDefSlots : MAP_3D.spawnAtkSlots

  // Local player sits at slot 2
  const mySpawn = mySlots[2]
  player.pos.x = mySpawn.x
  player.pos.y = mySpawn.y
  player.pos.z = mySpawn.z

  // 4 Allies take slots 0, 1, 3, 4
  const allySlotIndices = [0, 1, 3, 4]
  for (let i = 0; i < 4; i++) {
    const slot = mySlots[allySlotIndices[i]]
    players.value.push({
      id: `ally_${i}`,
      name: `Aliado ${i + 1}`,
      team: player.team,
      agentId: botAgents[i % botAgents.length],
      pos: { x: slot.x, y: slot.y, z: slot.z },
      radius: 0.6,
      health: 100,
      armor: 50,
      alive: true
    })
  }

  // 5 Enemies take the 5 slots of the enemy team
  const enemyTeam = player.team === 'attackers' ? 'defenders' : 'attackers'
  for (let i = 0; i < 5; i++) {
    const slot = enemySlots[i]
    players.value.push({
      id: `enemy_${i}`,
      name: `Rival ${i + 1}`,
      team: enemyTeam,
      agentId: botAgents[(i + 2) % botAgents.length],
      pos: { x: slot.x, y: slot.y, z: slot.z },
      radius: 0.6,
      health: 100,
      armor: 50,
      alive: true
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
  soundManager.play('round_won')
}

function handlePlayerKilled3D(victim, killerId, weaponName, isHeadshot) {
  victim.alive = false
  victim.health = 0
  victim.deaths++
  const killer = players.value.find(p => p.id === killerId)
  if (killer) killer.kills++

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
}

function reloadWeapon3D(p) {
  const wep = WEAPONS[p.weapon] || WEAPONS.vandal
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
  document.addEventListener('pointerlockchange', onPointerLockChange)
}

function removeEventListeners() {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mouseup', onMouseUp)
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
  const wep = WEAPONS[player.weapon] || WEAPONS.vandal
  if (player.ammo <= 0) {
    reloadWeapon3D(player)
    return
  }
  player.shootCooldown = 1.0 / wep.fireRate
  crosshairSpread.value = 1.0
  if (infiniteAmmo.value) player.ammo = wep.magazineSize

  weaponSystem.fire(player, wep, players.value, (target, isHeadshot, dmg, killed) => {
    hitmarkerActive.value = true
    hitmarkerHeadshot.value = isHeadshot
    setTimeout(() => { hitmarkerActive.value = false }, 120)
    if (killed) handlePlayerKilled3D(target, player.id, wep.name, isHeadshot)
    if (isOnline.value) networkSystem.sendHit(roomCode.value, target.id, dmg, wep.name, isHeadshot, player.name)
  }, isAiming.value)
}

function onMouseDown(e) {
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
  if (e.code === 'KeyB' && match.phase === 'BUY_PHASE') showBuyMenu.value = !showBuyMenu.value
  if (e.code === 'Tab') { e.preventDefault(); showScoreboard.value = true }
  if (e.code === 'KeyR') reloadWeapon3D(player)
  if (e.code === 'KeyV') isThirdPerson.value = !isThirdPerson.value
  if (e.code === 'KeyC') abilitySystem.cast(player, 'C', players.value, (msg) => match.announcement = msg)
  if (e.code === 'KeyQ') abilitySystem.cast(player, 'Q', players.value, (msg) => match.announcement = msg)
  if (e.code === 'KeyE') abilitySystem.cast(player, 'E', players.value, (msg) => match.announcement = msg)
  if (e.code === 'KeyX' && (player.ultPoints >= player.requiredUltPoints || infiniteAbilities.value)) {
    abilitySystem.cast(player, 'X', players.value, (msg) => match.announcement = msg)
    if (!infiniteAbilities.value) player.ultPoints = 0
  }
}

function onKeyUp(e) {
  keys[e.code] = false
  if (e.code === 'Tab') showScoreboard.value = false
}

function setupNetworkListeners() {
  networkSystem.on('room_joined', ({ room, player: p }) => {
    roomCode.value = room.id
    isHost.value = p.isHost
    roomPlayerList.value = room.players
    gameMode.value = 'MULTIPLAYER_LOBBY'
  })

  networkSystem.on('room_updated', (room) => {
    roomPlayerList.value = room.players
  })

  networkSystem.on('match_started', (room) => {
    gameMode.value = 'IN_GAME'
    isOnline.value = true
    resetRound(true)
  })
}

function startStandardGame() {
  gameMode.value = 'AGENT_SELECT'
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
  if (item.magazineSize) {
    player.weapon = item.id
    player.ammo = item.magazineSize
    player.reserveAmmo = item.reserveAmmo
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
        <div class="logo-badge">VALORAN3D 2.0</div>
        <h1 class="game-title">TACTICAL 3D FPS ARENA</h1>
        <p class="game-subtitle">Motor 3D Three.js con mapa.glb, Balística, Habilidades y Multijugador</p>
      </div>

      <div class="menu-nav-tabs">
        <button class="menu-tab" :class="{ active: activeTab === 'play' }" @click="activeTab = 'play'">⚔️ JUGAR 3D</button>
        <button class="menu-tab" :class="{ active: activeTab === 'training' }" @click="activeTab = 'training'">🎯 PRÁCTICA 3D</button>
        <button class="menu-tab" :class="{ active: activeTab === 'agents' }" @click="activeTab = 'agents'">👥 AGENTES</button>
        <button class="menu-tab" :class="{ active: activeTab === 'weapons' }" @click="activeTab = 'weapons'">🔫 ARMAS</button>
        <button class="menu-tab" :class="{ active: activeTab === 'multiplayer' }" @click="activeTab = 'multiplayer'">🌐 MULTIJUGADOR</button>
      </div>

      <!-- PLAY TAB -->
      <div v-if="activeTab === 'play'" class="tab-content">
        <div class="mode-card" @click="startStandardGame">
          <div class="mode-icon">💣</div>
          <h3>PARTIDA CLÁSICA 5v5 3D</h3>
          <p>Shooter táctico en primera persona 3D con plantado y desactivación de Spike en Haven 3D.</p>
          <button class="btn-primary">ENTRAR A LA ARENA</button>
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

      <!-- AGENTS TAB -->
      <div v-if="activeTab === 'agents'" class="tab-content agents-grid">
        <div v-for="agent in Object.values(AGENTS)" :key="agent.id" class="agent-card">
          <div class="agent-card-header" :style="{ borderColor: agent.color }">
            <span class="agent-avatar">{{ agent.avatar }}</span>
            <div>
              <h4>{{ agent.name }}</h4>
              <span class="agent-role">{{ agent.role }}</span>
            </div>
          </div>
          <p class="agent-desc">{{ agent.desc }}</p>
          <div class="agent-abilities-list">
            <span v-for="(ab, k) in agent.abilities" :key="k" class="ability-pill">
              <strong>{{ k }}:</strong> {{ ab.name }}
            </span>
          </div>
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
        <div class="mp-box">
          <h3>CREAR SALA ONLINE 3D</h3>
          <button class="btn-primary" @click="networkSystem.connect(); networkSystem.createRoom('Sala 3D', player.name, player.team)">CREAR SALA</button>
        </div>
      </div>
    </div>

    <!-- AGENT SELECT -->
    <div v-else-if="gameMode === 'AGENT_SELECT'" class="agent-select-overlay">
      <h2 class="select-title">SELECCIONA TU AGENTE 3D</h2>
      <div class="select-grid">
        <div 
          v-for="agent in Object.values(AGENTS)" 
          :key="agent.id"
          class="select-agent-card"
          :class="{ selected: player.agentId === agent.id }"
          @click="player.agentId = agent.id"
        >
          <div class="select-avatar">{{ agent.avatar }}</div>
          <h3>{{ agent.name }}</h3>
          <span class="role-tag">{{ agent.role }}</span>
        </div>
      </div>
      <button class="btn-lockin" @click="lockAgent(player.agentId)">BLOQUEAR ELECCIÓN (LOCK IN)</button>
    </div>

    <!-- 3D IN-GAME HUD LAYER -->
    <div v-else class="hud-layer">
      <!-- Pointer Lock Prompt -->
      <div v-if="!isPointerLocked" class="pointer-lock-prompt" @click="requestPointerLock">
        🖱️ HAZ CLIC AQUÍ PARA BLOQUEAR EL RATÓN Y APUNTAR EN 3D (FPS)
      </div>

      <!-- 3D Crosshair (Hides during ADS so player looks through sight reticle) -->
      <div v-if="!isAiming" class="crosshair-wrap">
        <div class="crosshair-dot" :style="{ backgroundColor: settings.crosshairColor }"></div>
        <div class="crosshair-bar bar-top" :style="{ backgroundColor: settings.crosshairColor, transform: `translateY(-${5 + crosshairSpread * 14}px)` }"></div>
        <div class="crosshair-bar bar-bottom" :style="{ backgroundColor: settings.crosshairColor, transform: `translateY(${5 + crosshairSpread * 14}px)` }"></div>
        <div class="crosshair-bar bar-left" :style="{ backgroundColor: settings.crosshairColor, transform: `translateX(-${5 + crosshairSpread * 14}px)` }"></div>
        <div class="crosshair-bar bar-right" :style="{ backgroundColor: settings.crosshairColor, transform: `translateX(${5 + crosshairSpread * 14}px)` }"></div>
        <div v-if="hitmarkerActive" class="hitmarker" :class="{ headshot: hitmarkerHeadshot }">✕</div>
      </div>

      <!-- Tactical Sniper Scope Fullscreen Overlay (For Operator / Marshal) -->
      <div v-if="isAiming && (WEAPONS[player.weapon]?.category === WEAPON_CATEGORIES.SNIPERS)" class="sniper-scope-overlay">
        <div class="scope-reticle">
          <div class="scope-cross-h"></div>
          <div class="scope-cross-v"></div>
          <div class="scope-center-dot"></div>
          <div class="scope-range-ring"></div>
        </div>
        <div v-if="hitmarkerActive" class="hitmarker scope-hit" :class="{ headshot: hitmarkerHeadshot }">✕</div>
      </div>

      <!-- Tactical ADS Optic Focus Vignette (For Assault Rifles, SMGs, Pistols) -->
      <div v-if="isAiming && (WEAPONS[player.weapon]?.category !== WEAPON_CATEGORIES.SNIPERS)" class="ads-focus-overlay"></div>

      <!-- Tactical Minimap Radar -->
      <div class="radar-container">
        <canvas ref="radarCanvasRef" width="140" height="140" class="radar-canvas"></canvas>
      </div>

      <!-- TOP SCOREBOARD -->
      <div class="hud-top">
        <div class="team-score score-atk">{{ match.scoreAtk }}</div>
        <div class="timer-box">
          <div class="timer-val">{{ Math.ceil(match.timer) }}s</div>
          <div class="round-label">RONDA {{ match.round }} · {{ match.phase === 'BUY_PHASE' ? 'COMPRA' : '3D EN VIVO' }}</div>
        </div>
        <div class="team-score score-def">{{ match.scoreDef }}</div>
      </div>

      <!-- ANNOUNCEMENT BANNER -->
      <div v-if="match.announcement" class="announcement-banner">
        {{ match.announcement }}
      </div>

      <!-- PLANT / DEFUSE TACTICAL PROMPT -->
      <div v-if="inPlantZone" class="tactical-zone-prompt plant-active">
        <span class="prompt-icon">🟢</span>
        <span class="prompt-text">ZONA DE PLANTADO <strong>{{ plantSiteName }}</strong> — MANTÉN <strong>[4]</strong> O <strong>[F]</strong> PARA PLANTAR LA SPIKE</span>
      </div>
      <div v-else-if="inDefuseZone" class="tactical-zone-prompt defuse-active">
        <span class="prompt-icon">🔵</span>
        <span class="prompt-text">SPIKE DETECTADA — MANTÉN <strong>[4]</strong> O <strong>[F]</strong> PARA DESACTIVAR (DEFUSE)</span>
      </div>

      <!-- KILLFEED -->
      <div class="killfeed-wrap">
        <div v-for="item in killfeed" :key="item.id" class="killfeed-item">
          <span :class="item.killerTeam === 'attackers' ? 'text-atk' : 'text-def'">{{ item.killerName }}</span>
          <span class="killfeed-wep">{{ item.weaponName }} {{ item.isHeadshot ? '💥' : '🔫' }}</span>
          <span :class="item.victimTeam === 'attackers' ? 'text-atk' : 'text-def'">{{ item.victimName }}</span>
        </div>
      </div>

      <!-- BOTTOM HUD -->
      <div class="hud-bottom">
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
          <div class="ability-slot"><span class="key-badge">C</span><span class="ab-icon">☁️</span></div>
          <div class="ability-slot"><span class="key-badge">Q</span><span class="ab-icon">✨</span></div>
          <div class="ability-slot"><span class="key-badge">E</span><span class="ab-icon">⚡</span></div>
          <div class="ability-slot ult-slot" :class="{ ready: player.ultPoints >= player.requiredUltPoints }">
            <span class="key-badge">X</span>
            <span class="ab-icon">🌪️</span>
          </div>
        </div>

        <div class="hud-weapon">
          <div class="wep-name">{{ WEAPONS[player.weapon]?.name.toUpperCase() }}</div>
          <div class="ammo-val">
            <span class="ammo-cur">{{ player.ammo }}</span>
            <span class="ammo-res">/ {{ player.reserveAmmo }}</span>
          </div>
          <div class="credits-val">${{ player.credits }}</div>
        </div>
      </div>

      <!-- BUY MENU (B) -->
      <div v-if="showBuyMenu" class="buy-menu-overlay">
        <div class="buy-header">
          <h2>TIENDA DE ARSENAL TÁCTICO 3D · CRÉDITOS: <span class="text-gold">${{ player.credits }}</span></h2>
          <button class="btn-close" @click="showBuyMenu = false">✕ CERRAR (B)</button>
        </div>
        <div class="buy-grid">
          <div v-for="wep in Object.values(WEAPONS)" :key="wep.id" class="buy-card" @click="buyItem(wep)">
            <h4>{{ wep.name }}</h4>
            <span class="buy-cost">${{ wep.cost }}</span>
            <p>{{ wep.desc }}</p>
          </div>
          <div v-for="shield in Object.values(SHIELDS)" :key="shield.id" class="buy-card" @click="buyItem(shield)">
            <h4>{{ shield.name }}</h4>
            <span class="buy-cost">${{ shield.cost }}</span>
            <p>{{ shield.desc }}</p>
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
  gap: 20px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  padding: 8px 24px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.team-score { font-size: 1.8rem; font-weight: 900; }
.score-atk { color: #ef4444; }
.score-def { color: #3b82f6; }
.timer-box { text-align: center; }
.timer-val { font-size: 1.4rem; font-weight: 800; }
.round-label { font-size: 0.65rem; color: #94a3b8; letter-spacing: 1px; }

.announcement-banner {
  position: absolute;
  top: 90px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 70, 85, 0.9);
  color: #fff;
  padding: 8px 30px;
  border-radius: 6px;
  font-weight: 800;
}

.tactical-zone-prompt {
  position: absolute;
  top: 140px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  border-radius: 30px;
  font-size: 0.95rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.6);
  animation: pulsePrompt 1.4s infinite alternate ease-in-out;
}

.tactical-zone-prompt.plant-active {
  background: rgba(16, 185, 129, 0.95);
  border: 2px solid #4ade80;
  color: #ffffff;
}

.tactical-zone-prompt.defuse-active {
  background: rgba(56, 189, 248, 0.95);
  border: 2px solid #bae6fd;
  color: #0f172a;
}

@keyframes pulsePrompt {
  0% { transform: translateX(-50%) scale(0.96); }
  100% { transform: translateX(-50%) scale(1.04); }
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

.hud-weapon { text-align: right; }
.wep-name { font-size: 0.85rem; font-weight: 800; color: #94a3b8; }
.ammo-cur { font-size: 1.6rem; font-weight: 900; }
.ammo-res { font-size: 1rem; color: #64748b; }
.credits-val { font-size: 0.8rem; color: #eab308; font-weight: 700; }

/* BUY MENU */
.buy-menu-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 85%;
  max-width: 900px;
  max-height: 80vh;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid #ff4655;
  border-radius: 12px;
  padding: 24px;
  overflow-y: auto;
  z-index: 100;
  pointer-events: auto;
}

.buy-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.buy-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.buy-card { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.15s ease; }
.buy-card:hover { border-color: #38bdf8; background: rgba(56, 189, 248, 0.15); }
.buy-cost { color: #eab308; font-weight: 800; }
</style>
