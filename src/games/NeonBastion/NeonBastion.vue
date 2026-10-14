<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'

// --- PROCEDURAL WEB AUDIO SOUND ENGINE ---
class BastionAudio {
  constructor() {
    this.ctx = null
    this.muted = false
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }
  tone(freq, type = 'sine', duration = 0.1, gainVal = 0.12, slideTo = null) {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, now)
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration)
      }
      gain.gain.setValueAtTime(gainVal, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + duration)
    } catch (e) {}
  }
  shootGatling() { this.tone(360, 'square', 0.04, 0.05, 140) }
  shootTesla() { this.tone(920, 'sawtooth', 0.09, 0.07, 420) }
  shootRocket() { this.tone(240, 'sawtooth', 0.18, 0.1, 70) }
  shootLaser() { this.tone(680, 'sine', 0.06, 0.06, 880) }
  orbitalClick() {
    this.tone(800, 'sawtooth', 0.12, 0.15, 180)
    setTimeout(() => this.tone(120, 'square', 0.15, 0.15, 50), 30)
  }
  buildTower() {
    this.tone(440, 'triangle', 0.08, 0.12)
    setTimeout(() => this.tone(660, 'triangle', 0.12, 0.14), 60)
  }
  upgradeTower() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 'triangle', 0.12, 0.12), i * 55))
  }
  waveStart() {
    [220, 277, 330, 440].forEach((f, i) => setTimeout(() => this.tone(f, 'sawtooth', 0.18, 0.12), i * 80))
  }
  bossAlert() {
    [160, 120, 160, 110].forEach((f, i) => setTimeout(() => this.tone(f, 'sawtooth', 0.25, 0.2), i * 220))
  }
  explosion() {
    this.tone(130, 'sawtooth', 0.22, 0.16, 35)
  }
  skillActivate() {
    [330, 494, 659, 987, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 'sine', 0.16, 0.15), i * 45))
  }
}
const sfx = new BastionAudio()

// --- MAPS & PATHS ---
const MAPS = [
  {
    id: 'ruta_alfa',
    name: 'Sector Alfa: Corredor Neón',
    difficulty: 'Normal -> Infierno Progresivo',
    color: '#38bdf8',
    waypoints: [
      { x: 0, y: 120 },
      { x: 240, y: 120 },
      { x: 240, y: 360 },
      { x: 520, y: 360 },
      { x: 520, y: 150 },
      { x: 740, y: 150 },
      { x: 740, y: 440 },
      { x: 900, y: 440 }
    ],
    slots: [
      { id: 1, x: 130, y: 200 },
      { id: 2, x: 160, y: 60 },
      { id: 3, x: 320, y: 260 },
      { id: 4, x: 380, y: 430 },
      { id: 5, x: 440, y: 250 },
      { id: 6, x: 600, y: 260 },
      { id: 7, x: 630, y: 80 },
      { id: 8, x: 660, y: 360 },
      { id: 9, x: 820, y: 280 },
      { id: 10, x: 810, y: 500 }
    ]
  },
  {
    id: 'espiral_caos',
    name: 'Núcleo Omega: Laberinto Cuántico',
    difficulty: 'Difícil -> Pesadilla',
    color: '#a855f7',
    waypoints: [
      { x: 0, y: 270 },
      { x: 180, y: 270 },
      { x: 180, y: 90 },
      { x: 680, y: 90 },
      { x: 680, y: 450 },
      { x: 340, y: 450 },
      { x: 340, y: 260 },
      { x: 900, y: 260 }
    ],
    slots: [
      { id: 1, x: 100, y: 190 },
      { id: 2, x: 260, y: 170 },
      { id: 3, x: 430, y: 170 },
      { id: 4, x: 590, y: 170 },
      { id: 5, x: 760, y: 180 },
      { id: 6, x: 590, y: 360 },
      { id: 7, x: 440, y: 360 },
      { id: 8, x: 250, y: 370 },
      { id: 9, x: 510, y: 260 },
      { id: 10, x: 780, y: 340 }
    ]
  }
]

// --- TURRET CATALOG ---
const TOWER_TYPES = [
  {
    id: 'gatling',
    name: 'Torreta Vulcan',
    icon: '🔫',
    cost: 70,
    color: '#38bdf8',
    range: 145,
    fireRate: 4.5, // shots/sec
    damage: 16,
    desc: 'Cadencia extrema contra objetivos individuales.'
  },
  {
    id: 'tesla',
    name: 'Bobina Tesla',
    icon: '⚡',
    cost: 115,
    color: '#a855f7',
    range: 135,
    fireRate: 1.4,
    damage: 34,
    chainCount: 4,
    desc: 'Rayo en cadena que salta hasta a 4 enemigos.'
  },
  {
    id: 'cryo',
    name: 'Cañón Criogénico',
    icon: '❄️',
    cost: 95,
    color: '#06b6d4',
    range: 130,
    fireRate: 1.8,
    damage: 14,
    slowFactor: 0.45,
    desc: 'Congela y reduce la velocidad enemiga un 55%.'
  },
  {
    id: 'missile',
    name: 'Mortero Hydra',
    icon: '🚀',
    cost: 150,
    color: '#f97316',
    range: 195,
    fireRate: 0.85,
    damage: 70,
    splashRadius: 68,
    desc: 'Misiles explosivos con daño en área masivo.'
  },
  {
    id: 'plasma',
    name: 'Rayo Térmico',
    icon: '🔥',
    cost: 210,
    color: '#ef4444',
    range: 165,
    fireRate: 6.5,
    damage: 28,
    desc: 'Láser de plasma fundidor de blindajes y jefes.'
  },
  {
    id: 'bank',
    name: 'Reactor Radianita',
    icon: '💎',
    cost: 130,
    color: '#10b981',
    range: 95,
    fireRate: 0,
    damage: 0,
    incomePerSec: 8,
    desc: 'Genera +$8/seg y potencia +20% a torres cercanas.'
  }
]

// --- REACTIVE STATE ---
const canvasRef = ref(null)
const currentMapIdx = ref(0)
const currentMap = computed(() => MAPS[currentMapIdx.value])

const gameState = ref('PLAYING') // 'PLAYING', 'GAME_OVER', 'VICTORY'
const gold = ref(240)
const coreHp = ref(100)
const maxCoreHp = ref(100)
const wave = ref(1)
const score = ref(0)
const totalKills = ref(0)
const waveActive = ref(false)
const autoNextWave = ref(false)
const gameSpeed = ref(1) // 1x or 2x

const selectedSlotId = ref(null)
const selectedTowerType = ref('gatling')

// Active Commander Skills
const skills = reactive({
  airstrike: { name: 'Bombardeo Orbital', key: 'Q', icon: '☄️', cost: 75, cd: 0, maxCd: 14 },
  overdrive: { name: 'Sobrecarga x2', key: 'W', icon: '⚡', cost: 60, cd: 0, maxCd: 16, activeTimer: 0 },
  emp: { name: 'Pulso EMP', key: 'E', icon: '❄️', cost: 65, cd: 0, maxCd: 18 }
})

// Permanent Commander Upgrades (In-Match Tech Tree)
const commanderUpgrades = reactive({
  clickDamageLvl: 1,
  turretDmgLvl: 1,
  bountyLvl: 1
})

const clickDamage = computed(() => Math.round(25 * Math.pow(1.45, commanderUpgrades.clickDamageLvl - 1)))
const globalTurretMultiplier = computed(() => 1 + (commanderUpgrades.turretDmgLvl - 1) * 0.22)
const bountyMultiplier = computed(() => 1 + (commanderUpgrades.bountyLvl - 1) * 0.2)

// Built Towers Map: slotId -> towerObj
const towers = ref([])
const selectedSlot = computed(() => currentMap.value.slots.find(s => s.id === selectedSlotId.value) || null)
const selectedTower = computed(() => towers.value.find(t => t.slotId === selectedSlotId.value) || null)

// Entities for Canvas Loop
let enemies = []
let projectiles = []
let particles = []
let lightningBeams = []
let floatingTexts = []
let spawnQueue = []
let spawnTimer = 0
let incomeAccumulator = 0
let animFrameId = null
let lastTime = 0

const notifications = ref([])
const notify = (msg, type = 'info') => {
  const id = Date.now() + Math.random()
  notifications.value.push({ id, msg, type })
  setTimeout(() => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }, 2800)
}

// --- WAVE GENERATOR (Starts smooth, becomes total hell!) ---
const getWaveDifficultyLabel = computed(() => {
  if (wave.value <= 3) return { text: 'Suave / Calentamiento', color: '#4ade80' }
  if (wave.value <= 7) return { text: 'Alerta Táctica', color: '#38bdf8' }
  if (wave.value <= 12) return { text: 'Asedio Intenso', color: '#f59e0b' }
  if (wave.value <= 17) return { text: 'Pesadilla Cyber', color: '#f97316' }
  return { text: '💀 INFIERNO ABSOLUTO', color: '#ef4444' }
})

function buildWaveQueue(waveNum) {
  const queue = []
  // Exponential HP scaling after wave 5 so it starts smooth and turns into an inferno!
  const hpMult = waveNum <= 3
    ? 1 + (waveNum - 1) * 0.35
    : Math.pow(1.36, waveNum - 1)

  const count = 7 + Math.floor(waveNum * 3.2)

  for (let i = 0; i < count; i++) {
    let type = 'grunt'
    const r = Math.random()

    if (waveNum >= 2 && r < 0.28) type = 'runner'
    if (waveNum >= 4 && r >= 0.28 && r < 0.48) type = 'tank'
    if (waveNum >= 6 && r >= 0.48 && r < 0.62) type = 'healer'
    if (waveNum >= 8 && r >= 0.62 && r < 0.78) type = 'shielded'

    queue.push(createEnemyConfig(type, hpMult, waveNum))
  }

  // Bosses every 5 waves, and multiple Mini-Bosses in high waves!
  if (waveNum % 5 === 0 || waveNum >= 12) {
    const bossCount = waveNum >= 15 ? 2 : 1
    for (let b = 0; b < bossCount; b++) {
      queue.push(createEnemyConfig('boss', hpMult * 1.4, waveNum))
    }
  }

  return queue
}

function createEnemyConfig(type, hpMult, waveNum) {
  const baseConfigs = {
    grunt: { name: 'Dron Asaltante', hp: 55, speed: 68, gold: 12, radius: 12, color: '#38bdf8', dmg: 6 },
    runner: { name: 'Velociraptor Cyber', hp: 38, speed: 118, gold: 15, radius: 10, color: '#facc15', dmg: 5 },
    tank: { name: 'Gólem Blindado', hp: 185, speed: 44, gold: 28, radius: 16, color: '#f97316', dmg: 14 },
    healer: { name: 'Médico Nanobot', hp: 95, speed: 60, gold: 24, radius: 13, color: '#4ade80', dmg: 8, isHealer: true },
    shielded: { name: 'Ciber-Espectro', hp: 130, shield: 90, speed: 78, gold: 32, radius: 14, color: '#c084fc', dmg: 10 },
    boss: { name: `TITÁN APOCALIPSIS MK-${waveNum}`, hp: 750, shield: 300, speed: 36, gold: 140, radius: 23, color: '#ef4444', dmg: 35, isBoss: true }
  }

  const cfg = baseConfigs[type] || baseConfigs.grunt
  const maxHp = Math.round(cfg.hp * hpMult)
  const maxShield = cfg.shield ? Math.round(cfg.shield * hpMult) : 0

  return {
    type,
    name: cfg.name,
    maxHp,
    hp: maxHp,
    maxShield,
    shield: maxShield,
    baseSpeed: cfg.speed + Math.min(45, waveNum * 1.8),
    gold: Math.round(cfg.gold * (1 + waveNum * 0.08)),
    radius: cfg.radius,
    color: cfg.color,
    dmg: cfg.dmg,
    isHealer: !!cfg.isHealer,
    isBoss: !!cfg.isBoss
  }
}

// --- START WAVE ---
function startNextWave() {
  if (waveActive.value || gameState.value !== 'PLAYING') return
  spawnQueue = buildWaveQueue(wave.value)
  spawnTimer = 0.2
  waveActive.value = true

  if (spawnQueue.some(e => e.isBoss)) {
    sfx.bossAlert()
    notify(`🚨 ¡ALERTA DE JEFE EN LA OLEADA ${wave.value}! ¡Prepárate para el impacto!`, 'danger')
  } else {
    sfx.waveStart()
    notify(`⚔️ ¡Oleada ${wave.value} iniciada! (${spawnQueue.length} enemigos en camino)`, 'info')
  }
}

// --- TOWER BUILDING & UPGRADING ---
function selectSlot(slot) {
  selectedSlotId.value = slot.id
}

function buildTower(typeObj) {
  if (!selectedSlot.value || selectedTower.value) return
  if (gold.value < typeObj.cost) {
    notify('¡No tienes suficiente Oro/Radianita!', 'danger')
    return
  }

  gold.value -= typeObj.cost
  sfx.buildTower()

  towers.value.push({
    id: Date.now() + Math.random(),
    slotId: selectedSlot.value.id,
    x: selectedSlot.value.x,
    y: selectedSlot.value.y,
    type: typeObj.id,
    name: typeObj.name,
    icon: typeObj.icon,
    color: typeObj.color,
    level: 1,
    maxLevel: 5,
    baseDamage: typeObj.damage,
    baseRange: typeObj.range,
    baseFireRate: typeObj.fireRate,
    chainCount: typeObj.chainCount || 0,
    slowFactor: typeObj.slowFactor || 1,
    splashRadius: typeObj.splashRadius || 0,
    incomePerSec: typeObj.incomePerSec || 0,
    totalInvested: typeObj.cost,
    cooldown: 0,
    angle: 0,
    kills: 0
  })

  spawnParticles(selectedSlot.value.x, selectedSlot.value.y, typeObj.color, 14)
  notify(`🛠️ Construiste ${typeObj.name} en Nodo #${selectedSlot.value.id}`, 'success')
}

function getTowerStats(tower) {
  const lvlMult = Math.pow(1.38, tower.level - 1)
  // Check adjacent Reactor Radianita buffs
  let reactorBonus = 1
  towers.value.forEach(other => {
    if (other.type === 'bank' && other.id !== tower.id) {
      const dist = Math.hypot(other.x - tower.x, other.y - tower.y)
      if (dist <= 180) {
        reactorBonus += 0.20 + (other.level - 1) * 0.05
      }
    }
  })

  const overdriveMult = skills.overdrive.activeTimer > 0 ? 2.0 : 1.0

  return {
    damage: Math.round(tower.baseDamage * lvlMult * globalTurretMultiplier.value * reactorBonus),
    range: Math.round(tower.baseRange * (1 + (tower.level - 1) * 0.08)),
    fireRate: +(tower.baseFireRate * (1 + (tower.level - 1) * 0.12) * overdriveMult).toFixed(2),
    upgradeCost: Math.round(tower.totalInvested * 0.78),
    sellValue: Math.round(tower.totalInvested * 0.7)
  }
}

function upgradeSelectedTower() {
  const t = selectedTower.value
  if (!t || t.level >= t.maxLevel) return
  const stats = getTowerStats(t)
  if (gold.value < stats.upgradeCost) {
    notify('¡Oro insuficiente para mejorar esta torreta!', 'danger')
    return
  }

  gold.value -= stats.upgradeCost
  t.totalInvested += stats.upgradeCost
  t.level++
  sfx.upgradeTower()
  spawnParticles(t.x, t.y, '#facc15', 18)
  notify(`⬆️ ¡${t.name} mejorada a Nivel ${t.level}!`, 'success')
}

function sellSelectedTower() {
  const t = selectedTower.value
  if (!t) return
  const stats = getTowerStats(t)
  gold.value += stats.sellValue
  towers.value = towers.value.filter(x => x.id !== t.id)
  notify(`💰 Vendiste ${t.name} por +$${stats.sellValue}`, 'info')
}

// --- COMMANDER ACTIVE SKILLS ---
function triggerSkill(skillKey) {
  const sk = skills[skillKey]
  if (!sk || sk.cd > 0) return
  if (gold.value < sk.cost) {
    notify(`¡Necesitas $${sk.cost} para activar ${sk.name}!`, 'danger')
    return
  }

  gold.value -= sk.cost
  sk.cd = sk.maxCd
  sfx.skillActivate()

  if (skillKey === 'airstrike') {
    notify('☄️ ¡BOMBARDEO ORBITAL EN CURSO!', 'success')
    const wps = currentMap.value.waypoints
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        // Pick random point along path or on enemies
        let tx = 450 + (Math.random() - 0.5) * 500
        let ty = 270 + (Math.random() - 0.5) * 320
        if (enemies.length > 0) {
          const target = enemies[Math.floor(Math.random() * enemies.length)]
          tx = target.x + (Math.random() - 0.5) * 30
          ty = target.y + (Math.random() - 0.5) * 30
        }
        sfx.explosion()
        spawnParticles(tx, ty, '#ef4444', 28)
        floatingTexts.push({ x: tx, y: ty, text: '💥 BOOM!', color: '#f97316', life: 0.9 })
        enemies.forEach(e => {
          if (Math.hypot(e.x - tx, e.y - ty) <= 110) {
            damageEnemy(e, 140 + wave.value * 35, '#ef4444')
          }
        })
      }, i * 160)
    }
  } else if (skillKey === 'overdrive') {
    sk.activeTimer = 8.0
    notify('⚡ ¡SOBRECARGA ACTIVADA! Todas las torretas disparan al DOBLE de velocidad por 8s.', 'success')
  } else if (skillKey === 'emp') {
    notify('❄️ ¡PULSO ELECTROMAGNÉTICO! Enemigos congelados y escudos destruidos.', 'success')
    enemies.forEach(e => {
      e.shield = 0
      e.stunTimer = 4.5
      spawnParticles(e.x, e.y, '#38bdf8', 12)
    })
  }
}

// --- COMMANDER TECH UPGRADES ---
function buyCommanderUpgrade(type) {
  if (type === 'click') {
    const cost = Math.round(90 * Math.pow(1.65, commanderUpgrades.clickDamageLvl - 1))
    if (gold.value < cost) return
    gold.value -= cost
    commanderUpgrades.clickDamageLvl++
    sfx.upgradeTower()
  } else if (type === 'turret') {
    const cost = Math.round(140 * Math.pow(1.75, commanderUpgrades.turretDmgLvl - 1))
    if (gold.value < cost) return
    gold.value -= cost
    commanderUpgrades.turretDmgLvl++
    sfx.upgradeTower()
  } else if (type === 'bounty') {
    const cost = Math.round(120 * Math.pow(1.7, commanderUpgrades.bountyLvl - 1))
    if (gold.value < cost) return
    gold.value -= cost
    commanderUpgrades.bountyLvl++
    sfx.upgradeTower()
  }
}

// --- CANVAS CLICK (SELECT SLOT OR FIRE ORBITAL RAILGUN) ---
function onCanvasClick(e) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const mx = (e.clientX - rect.left) * scaleX
  const my = (e.clientY - rect.top) * scaleY

  // 1. Check if clicked a build slot
  for (const slot of currentMap.value.slots) {
    if (Math.hypot(mx - slot.x, my - slot.y) <= 28) {
      selectedSlotId.value = slot.id
      return
    }
  }

  // 2. Otherwise, fire Commander Orbital Railgun at click position!
  sfx.orbitalClick()
  spawnParticles(mx, my, '#38bdf8', 14)

  let hitAny = false
  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i]
    if (Math.hypot(en.x - mx, en.y - my) <= en.radius + 34) {
      damageEnemy(en, clickDamage.value, '#38bdf8')
      hitAny = true
    }
  }

  if (hitAny) {
    floatingTexts.push({ x: mx, y: my - 12, text: `⚡ -${clickDamage.value}`, color: '#38bdf8', life: 0.7 })
  }
}

function damageEnemy(enemy, amount, color = '#fff', sourceTower = null) {
  if (enemy.dead) return
  let remaining = amount

  if (enemy.shield > 0) {
    const absorbed = Math.min(enemy.shield, remaining)
    enemy.shield -= absorbed
    remaining -= absorbed
  }

  if (remaining > 0) {
    enemy.hp -= remaining
  }

  if (enemy.hp <= 0 && !enemy.dead) {
    enemy.dead = true
    const earned = Math.round(enemy.gold * bountyMultiplier.value)
    gold.value += earned
    score.value += earned * 10
    totalKills.value++
    if (sourceTower) sourceTower.kills++

    spawnParticles(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 35 : 14)
    floatingTexts.push({
      x: enemy.x,
      y: enemy.y,
      text: `+$${earned}`,
      color: '#4ade80',
      life: 0.85
    })
  }
}

function spawnParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 30 + Math.random() * 110
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 0.4 + Math.random() * 0.35
    })
  }
}

// --- CHANGE MAP / RESET ---
function selectMap(index) {
  currentMapIdx.value = index
  resetGame()
}

function resetGame() {
  gold.value = 240
  coreHp.value = 100
  wave.value = 1
  score.value = 0
  totalKills.value = 0
  waveActive.value = false
  gameState.value = 'PLAYING'
  towers.value = []
  enemies = []
  projectiles = []
  particles = []
  lightningBeams = []
  floatingTexts = []
  spawnQueue = []
  selectedSlotId.value = currentMap.value.slots[0]?.id || null
  commanderUpgrades.clickDamageLvl = 1
  commanderUpgrades.turretDmgLvl = 1
  commanderUpgrades.bountyLvl = 1
}

// --- MAIN UPDATE & RENDER LOOP ---
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp
  const rawDt = Math.min(0.05, (timestamp - lastTime) / 1000)
  lastTime = timestamp

  const dt = rawDt * gameSpeed.value

  if (gameState.value === 'PLAYING') {
    updateSimulation(dt, rawDt)
  }
  renderScene()

  animFrameId = requestAnimationFrame(gameLoop)
}

function updateSimulation(dt, rawDt) {
  // Cooldowns
  Object.values(skills).forEach(sk => {
    if (sk.cd > 0) sk.cd = Math.max(0, sk.cd - rawDt)
    if (sk.activeTimer !== undefined && sk.activeTimer > 0) {
      sk.activeTimer = Math.max(0, sk.activeTimer - rawDt)
    }
  })

  // Spawn enemies from wave queue
  if (waveActive.value && spawnQueue.length > 0) {
    spawnTimer -= dt
    if (spawnTimer <= 0) {
      const nextCfg = spawnQueue.shift()
      const startWp = currentMap.value.waypoints[0]
      enemies.push({
        ...nextCfg,
        id: Date.now() + Math.random(),
        x: startWp.x,
        y: startWp.y,
        wpIndex: 1,
        slowTimer: 0,
        slowFactor: 1,
        stunTimer: 0,
        healTimer: 0,
        dead: false
      })
      // Faster spawning in higher waves!
      spawnTimer = Math.max(0.22, 0.85 - wave.value * 0.03)
    }
  }

  // Passive Income from Bank Towers
  if (waveActive.value) {
    incomeAccumulator += dt
    if (incomeAccumulator >= 1.0) {
      incomeAccumulator -= 1.0
      let totalBankIncome = 0
      towers.value.forEach(t => {
        if (t.type === 'bank') {
          const inc = Math.round(t.incomePerSec * (1 + (t.level - 1) * 0.45))
          totalBankIncome += inc
          floatingTexts.push({ x: t.x, y: t.y - 18, text: `+$${inc}`, color: '#10b981', life: 0.7 })
        }
      })
      if (totalBankIncome > 0) {
        gold.value += totalBankIncome
      }
    }
  }

  // Update Enemies
  const wps = currentMap.value.waypoints
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]
    if (e.dead) {
      enemies.splice(i, 1)
      continue
    }

    if (e.stunTimer > 0) {
      e.stunTimer -= dt
      continue
    }

    if (e.slowTimer > 0) {
      e.slowTimer -= dt
      if (e.slowTimer <= 0) e.slowFactor = 1
    }

    // Healer pulse
    if (e.isHealer) {
      e.healTimer += dt
      if (e.healTimer >= 1.8) {
        e.healTimer = 0
        enemies.forEach(other => {
          if (!other.dead && Math.hypot(other.x - e.x, other.y - e.y) <= 95) {
            other.hp = Math.min(other.maxHp, other.hp + Math.round(other.maxHp * 0.08))
          }
        })
        spawnParticles(e.x, e.y, '#4ade80', 6)
      }
    }

    const targetWp = wps[e.wpIndex]
    if (!targetWp) {
      // Reached Reactor Core!
      coreHp.value = Math.max(0, coreHp.value - e.dmg)
      sfx.explosion()
      spawnParticles(e.x, e.y, '#ef4444', 20)
      enemies.splice(i, 1)

      if (coreHp.value <= 0) {
        gameState.value = 'GAME_OVER'
        notify('💀 ¡EL NÚCLEO FUE DESTRUIDO! Fin de la partida.', 'danger')
      }
      continue
    }

    const dx = targetWp.x - e.x
    const dy = targetWp.y - e.y
    const dist = Math.hypot(dx, dy)
    const moveStep = e.baseSpeed * e.slowFactor * dt

    if (dist <= moveStep) {
      e.x = targetWp.x
      e.y = targetWp.y
      e.wpIndex++
    } else {
      e.x += (dx / dist) * moveStep
      e.y += (dy / dist) * moveStep
    }
  }

  // Check Wave Cleared
  if (waveActive.value && spawnQueue.length === 0 && enemies.length === 0 && gameState.value === 'PLAYING') {
    waveActive.value = false
    const waveBonus = 60 + wave.value * 25
    gold.value += waveBonus
    score.value += waveBonus * 5
    notify(`🏆 ¡Oleada ${wave.value} superada! Bonus de defensa: +$${waveBonus}`, 'success')
    wave.value++

    if (autoNextWave.value) {
      setTimeout(() => {
        if (!waveActive.value && gameState.value === 'PLAYING') startNextWave()
      }, 1200)
    }
  }

  // Update Towers
  towers.value.forEach(t => {
    if (t.type === 'bank') return
    const stats = getTowerStats(t)
    if (t.cooldown > 0) t.cooldown -= dt

    // Find furthest enemy in range
    let bestTarget = null
    let bestProgress = -1

    enemies.forEach(e => {
      if (e.dead) return
      const d = Math.hypot(e.x - t.x, e.y - t.y)
      if (d <= stats.range) {
        const progress = e.wpIndex * 1000 - d
        if (progress > bestProgress) {
          bestProgress = progress
          bestTarget = e
        }
      }
    })

    if (bestTarget) {
      t.angle = Math.atan2(bestTarget.y - t.y, bestTarget.x - t.x)

      if (t.cooldown <= 0) {
        t.cooldown = 1 / stats.fireRate
        fireTower(t, bestTarget, stats)
      }
    }
  })

  // Update Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]
    const dx = p.tx - p.x
    const dy = p.ty - p.y
    const dist = Math.hypot(dx, dy)
    const step = p.speed * dt

    if (dist <= step) {
      // Impact!
      if (p.splashRadius > 0) {
        sfx.explosion()
        spawnParticles(p.tx, p.ty, p.color, 16)
        enemies.forEach(e => {
          if (Math.hypot(e.x - p.tx, e.y - p.ty) <= p.splashRadius) {
            damageEnemy(e, p.damage, p.color, p.sourceTower)
          }
        })
      } else if (p.target && !p.target.dead) {
        damageEnemy(p.target, p.damage, p.color, p.sourceTower)
        if (p.slowFactor < 1) {
          p.target.slowFactor = p.slowFactor
          p.target.slowTimer = 2.8
        }
      }
      projectiles.splice(i, 1)
    } else {
      p.x += (dx / dist) * step
      p.y += (dy / dist) * step
      if (p.target && !p.target.dead) {
        p.tx = p.target.x
        p.ty = p.target.y
      }
    }
  }

  // Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i]
    pt.x += pt.vx * dt
    pt.y += pt.vy * dt
    pt.life -= dt
    if (pt.life <= 0) particles.splice(i, 1)
  }

  // Update Lightning Beams
  for (let i = lightningBeams.length - 1; i >= 0; i--) {
    lightningBeams[i].life -= dt
    if (lightningBeams[i].life <= 0) lightningBeams.splice(i, 1)
  }

  // Update Floating Texts
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    floatingTexts[i].y -= 28 * dt
    floatingTexts[i].life -= dt
    if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1)
  }
}

function fireTower(tower, target, stats) {
  if (tower.type === 'tesla') {
    sfx.shootTesla()
    // Chain lightning across multiple targets
    const hitList = [target]
    let curr = target
    for (let c = 1; c < tower.chainCount + Math.floor(tower.level / 2); c++) {
      let nextEnemy = null
      let minDist = 115
      enemies.forEach(e => {
        if (!e.dead && !hitList.includes(e)) {
          const d = Math.hypot(e.x - curr.x, e.y - curr.y)
          if (d < minDist) {
            minDist = d
            nextEnemy = e
          }
        }
      })
      if (nextEnemy) {
        hitList.push(nextEnemy)
        curr = nextEnemy
      } else {
        break
      }
    }

    let prevX = tower.x
    let prevY = tower.y
    hitList.forEach(en => {
      damageEnemy(en, stats.damage, '#a855f7', tower)
      lightningBeams.push({
        x1: prevX,
        y1: prevY,
        x2: en.x,
        y2: en.y,
        color: '#c084fc',
        life: 0.14
      })
      prevX = en.x
      prevY = en.y
    })
    return
  }

  if (tower.type === 'plasma') {
    sfx.shootLaser()
    damageEnemy(target, stats.damage, '#ef4444', tower)
    lightningBeams.push({
      x1: tower.x,
      y1: tower.y,
      x2: target.x,
      y2: target.y,
      color: '#ef4444',
      life: 0.1
    })
    return
  }

  if (tower.type === 'missile') sfx.shootRocket()
  else sfx.shootGatling()

  projectiles.push({
    x: tower.x,
    y: tower.y,
    tx: target.x,
    ty: target.y,
    target,
    speed: tower.type === 'missile' ? 340 : 560,
    damage: stats.damage,
    color: tower.color,
    splashRadius: tower.splashRadius ? tower.splashRadius + (tower.level - 1) * 8 : 0,
    slowFactor: tower.slowFactor || 1,
    sourceTower: tower
  })
}

// --- RENDER 2D TACTICAL CANVAS ---
function renderScene() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  // 1. Cyber Background Grid
  ctx.fillStyle = '#090d16'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 45) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  for (let y = 0; y < H; y += 45) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // 2. Draw Enemy Path
  const wps = currentMap.value.waypoints
  if (wps.length > 1) {
    // Outer Glow
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)'
    ctx.lineWidth = 42
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(wps[0].x, wps[0].y)
    for (let i = 1; i < wps.length; i++) ctx.lineTo(wps[i].x, wps[i].y)
    ctx.stroke()

    // Inner Road
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 30
    ctx.stroke()

    // Center Neon Guide Line
    ctx.strokeStyle = currentMap.value.color
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 3. Draw Spawn Portal & Reactor Core Base
  const startWp = wps[0]
  const endWp = wps[wps.length - 1]

  // Spawn Portal
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(startWp.x + 18, startWp.y, 20, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('SPAWN', startWp.x + 26, startWp.y - 26)

  // Reactor Core
  ctx.fillStyle = '#0ea5e9'
  ctx.beginPath()
  ctx.arc(endWp.x - 22, endWp.y, 24, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.fillText('NÚCLEO', endWp.x - 28, endWp.y - 30)

  // 4. Draw Build Slots & Towers
  currentMap.value.slots.forEach(slot => {
    const isSelected = selectedSlotId.value === slot.id
    const tower = towers.value.find(t => t.slotId === slot.id)

    // Range indicator if selected
    if (isSelected) {
      const range = tower
        ? getTowerStats(tower).range
        : (TOWER_TYPES.find(x => x.id === selectedTowerType.value)?.range || 140)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.1)'
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(slot.x, slot.y, range, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    // Slot Pad
    ctx.fillStyle = isSelected ? '#1e3a8a' : '#0f172a'
    ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)'
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.beginPath()
    ctx.arc(slot.x, slot.y, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    if (!tower) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('+', slot.x, slot.y + 5)
    } else {
      // Draw Tower Base & Turret Barrel
      ctx.save()
      ctx.translate(slot.x, slot.y)
      if (tower.type !== 'bank') {
        ctx.rotate(tower.angle)
        ctx.fillStyle = tower.color
        ctx.fillRect(0, -4, 24, 8)
      }
      ctx.restore()

      ctx.fillStyle = tower.color
      ctx.beginPath()
      ctx.arc(slot.x, slot.y, 15, 0, Math.PI * 2)
      ctx.fill()

      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(tower.icon, slot.x, slot.y + 5)

      // Level stars badge
      ctx.fillStyle = '#facc15'
      ctx.font = 'bold 10px sans-serif'
      ctx.fillText(`Nv.${tower.level}`, slot.x, slot.y + 32)
    }
  })

  // 5. Draw Enemies
  enemies.forEach(e => {
    ctx.save()
    // Slow / Stun Aura
    if (e.stunTimer > 0 || e.slowFactor < 1) {
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.radius + 5, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Body
    ctx.fillStyle = e.color
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = e.isBoss ? 3 : 1.5
    ctx.stroke()

    // Shield ring
    if (e.shield > 0) {
      ctx.strokeStyle = '#c084fc'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.radius + 3, 0, Math.PI * 2)
      ctx.stroke()
    }

    // HP Bar
    const bw = e.isBoss ? 54 : 30
    const bh = e.isBoss ? 6 : 4
    const bx = e.x - bw / 2
    const by = e.y - e.radius - 11
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.fillRect(bx, by, bw, bh)
    ctx.fillStyle = e.isBoss ? '#ef4444' : '#4ade80'
    ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), bh)
    ctx.restore()
  })

  // 6. Draw Lightning & Laser Beams
  lightningBeams.forEach(b => {
    ctx.strokeStyle = b.color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(b.x1, b.y1)
    ctx.lineTo(b.x2, b.y2)
    ctx.stroke()
  })

  // 7. Draw Projectiles
  projectiles.forEach(p => {
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.splashRadius > 0 ? 6 : 4, 0, Math.PI * 2)
    ctx.fill()
  })

  // 8. Draw Particles
  particles.forEach(pt => {
    ctx.fillStyle = pt.color
    ctx.globalAlpha = Math.max(0, pt.life * 1.5)
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  })

  // 9. Draw Floating Texts
  floatingTexts.forEach(ft => {
    ctx.fillStyle = ft.color
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ft.text, ft.x, ft.y)
  })
}

// Keyboard shortcuts for Commander Skills
function onKeyDown(e) {
  const k = e.key.toUpperCase()
  if (k === 'Q') triggerSkill('airstrike')
  if (k === 'W') triggerSkill('overdrive')
  if (k === 'E') triggerSkill('emp')
  if (k === ' ') {
    e.preventDefault()
    if (!waveActive.value) startNextWave()
  }
}

onMounted(() => {
  selectedSlotId.value = currentMap.value.slots[0]?.id || 1
  window.addEventListener('keydown', onKeyDown)
  animFrameId = requestAnimationFrame(gameLoop)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  if (animFrameId) cancelAnimationFrame(animFrameId)
})
</script>

<template>
  <div class="bastion-wrapper">
    <!-- TOP HEADER HUD -->
    <header class="bastion-header">
      <div class="brand-box">
        <span class="brand-icon">🏰</span>
        <div>
          <h1>NEON BASTION: CYBER DEFENSE</h1>
          <div class="sub-badges">
            <span class="diff-pill" :style="{ color: getWaveDifficultyLabel.color }">
              {{ getWaveDifficultyLabel.text }}
            </span>
            <span class="hint-pill">🖱️ Clic en enemigos = Cañón Orbital (-{{ clickDamage }} HP)</span>
          </div>
        </div>
      </div>

      <!-- MAP SELECTOR -->
      <div class="map-selector">
        <button
          v-for="(m, idx) in MAPS"
          :key="m.id"
          class="btn-map"
          :class="{ active: currentMapIdx === idx }"
          @click="selectMap(idx)"
        >
          🗺️ {{ m.name }}
        </button>
      </div>

      <!-- METRICS BAR -->
      <div class="metrics-bar">
        <div class="metric-box gold">
          <span>💰 Oro</span>
          <strong>${{ gold.toLocaleString() }}</strong>
        </div>
        <div class="metric-box hp" :class="{ critical: coreHp <= 30 }">
          <span>❤️ Núcleo</span>
          <strong>{{ coreHp }} / {{ maxCoreHp }}</strong>
        </div>
        <div class="metric-box wave">
          <span>🌊 Oleada</span>
          <strong>#{{ wave }}</strong>
        </div>
        <div class="metric-box score">
          <span>🏆 Puntos</span>
          <strong>{{ score.toLocaleString() }}</strong>
        </div>
      </div>
    </header>

    <!-- NOTIFICATIONS -->
    <div class="notif-stack">
      <div v-for="n in notifications" :key="n.id" class="notif-item" :class="n.type">
        {{ n.msg }}
      </div>
    </div>

    <!-- MAIN TACTICAL GRID -->
    <div class="bastion-main">
      <!-- LEFT / CENTER: CANVAS & SKILLS BAR -->
      <div class="canvas-column">
        <div class="canvas-container">
          <canvas
            ref="canvasRef"
            width="900"
            height="540"
            class="td-canvas"
            @click="onCanvasClick"
          ></canvas>

          <!-- GAME OVER OVERLAY -->
          <div v-if="gameState === 'GAME_OVER'" class="overlay-modal">
            <h2>💀 NÚCLEO DESTRUIDO</h2>
            <p>Sobreviviste hasta la <strong>Oleada #{{ wave }}</strong> y eliminaste a <strong>{{ totalKills }}</strong> invasores.</p>
            <p class="final-score">Puntuación Final: {{ score.toLocaleString() }}</p>
            <button class="btn-Action-primary" @click="resetGame">🔄 Jugar de Nuevo</button>
          </div>
        </div>

        <!-- COMMANDER SKILLS & WAVE CONTROLS -->
        <div class="controls-bar">
          <div class="skills-group">
            <button
              v-for="(sk, key) in skills"
              :key="key"
              class="btn-skill"
              :disabled="sk.cd > 0 || gold < sk.cost"
              @click="triggerSkill(key)"
            >
              <span class="sk-icon">{{ sk.icon }}</span>
              <div class="sk-info">
                <span class="sk-name">[{{ sk.key }}] {{ sk.name }}</span>
                <span class="sk-cost" v-if="sk.cd <= 0">${{ sk.cost }}</span>
                <span class="sk-cd" v-else>⏳ {{ sk.cd.toFixed(1) }}s</span>
              </div>
            </button>
          </div>

          <div class="wave-actions">
            <button
              class="btn-speed"
              :class="{ active: gameSpeed === 2 }"
              @click="gameSpeed = gameSpeed === 1 ? 2 : 1"
            >
              ⏩ Velocidad x{{ gameSpeed }}
            </button>
            <button
              class="btn-auto"
              :class="{ active: autoNextWave }"
              @click="autoNextWave = !autoNextWave"
            >
              🔄 Auto-Oleada: {{ autoNextWave ? 'SÍ' : 'NO' }}
            </button>
            <button
              class="btn-start-wave"
              :disabled="waveActive"
              @click="startNextWave"
            >
              {{ waveActive ? '⚔️ OLEADA EN CURSO...' : `🚀 LANZAR OLEADA #${wave} [ESPACIO]` }}
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT SIDEBAR: TOWER BUILDER & TECH TREE -->
      <aside class="builder-sidebar">
        <!-- SELECTED NODE PANEL -->
        <div class="panel-card">
          <div class="panel-header">
            <h3>📍 Nodo Táctico #{{ selectedSlotId || '-' }}</h3>
            <span v-if="selectedTower" class="badge-lvl">Nivel {{ selectedTower.level }}/{{ selectedTower.maxLevel }}</span>
          </div>

          <!-- IF TOWER EXISTS ON SLOT: UPGRADE / SELL -->
          <div v-if="selectedTower" class="tower-inspector">
            <div class="inspector-title">
              <span class="big-ico">{{ selectedTower.icon }}</span>
              <div>
                <h4>{{ selectedTower.name }}</h4>
                <small>Eliminaciones: {{ selectedTower.kills }}</small>
              </div>
            </div>

            <div class="inspector-stats">
              <div><span>Daño:</span> <strong>{{ getTowerStats(selectedTower).damage }}</strong></div>
              <div><span>Alcance:</span> <strong>{{ getTowerStats(selectedTower).range }}m</strong></div>
              <div><span>Cadencia:</span> <strong>{{ getTowerStats(selectedTower).fireRate }}/s</strong></div>
            </div>

            <div class="inspector-btns">
              <button
                class="btn-upgrade-tower"
                :disabled="selectedTower.level >= selectedTower.maxLevel || gold < getTowerStats(selectedTower).upgradeCost"
                @click="upgradeSelectedTower"
              >
                <span v-if="selectedTower.level < selectedTower.maxLevel">
                  ⬆️ Mejorar (${{ getTowerStats(selectedTower).upgradeCost }})
                </span>
                <span v-else>🌟 NIVEL MÁXIMO</span>
              </button>
              <button class="btn-sell-tower" @click="sellSelectedTower">
                💰 Vender (+${{ getTowerStats(selectedTower).sellValue }})
              </button>
            </div>
          </div>

          <!-- IF SLOT IS EMPTY: BUILD CATALOG -->
          <div v-else class="build-catalog">
            <p class=" catalog-hint">Selecciona una torreta para construir en el Nodo #{{ selectedSlotId }}:</p>
            <div class="towers-grid">
              <div
                v-for="t in TOWER_TYPES"
                :key="t.id"
                class="tower-buy-card"
                :class="{ disabled: gold < t.cost }"
                @mouseenter="selectedTowerType = t.id"
                @click="buildTower(t)"
              >
                <div class="t-top">
                  <span class="t-ico">{{ t.icon }}</span>
                  <span class="t-cost">${{ t.cost }}</span>
                </div>
                <div class="t-name">{{ t.name }}</div>
                <p class="t-desc">{{ t.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- COMMANDER GLOBAL TECH UPGRADES -->
        <div class="panel-card tech-card">
          <h3>🔬 Laboratorio del Comandante</h3>
          <div class="tech-list">
            <div class="tech-item">
              <div>
                <strong>🖱️ Cañón Orbital Clic (Nv.{{ commanderUpgrades.clickDamageLvl }})</strong>
                <p>Daño manual al hacer clic: {{ clickDamage }} HP</p>
              </div>
              <button
                class="btn-tech"
                :disabled="gold < Math.round(90 * Math.pow(1.65, commanderUpgrades.clickDamageLvl - 1))"
                @click="buyCommanderUpgrade('click')"
              >
                ${{ Math.round(90 * Math.pow(1.65, commanderUpgrades.clickDamageLvl - 1)) }}
              </button>
            </div>

            <div class="tech-item">
              <div>
                <strong>⚙️ Munición de Uranio (Nv.{{ commanderUpgrades.turretDmgLvl }})</strong>
                <p>Daño global de torretas: +{{ (commanderUpgrades.turretDmgLvl - 1) * 22 }}%</p>
              </div>
              <button
                class="btn-tech"
                :disabled="gold < Math.round(140 * Math.pow(1.75, commanderUpgrades.turretDmgLvl - 1))"
                @click="buyCommanderUpgrade('turret')"
              >
                ${{ Math.round(140 * Math.pow(1.75, commanderUpgrades.turretDmgLvl - 1)) }}
              </button>
            </div>

            <div class="tech-item">
              <div>
                <strong>💎 Recolector de Botín (Nv.{{ commanderUpgrades.bountyLvl }})</strong>
                <p>Oro ganado por baja: +{{ (commanderUpgrades.bountyLvl - 1) * 20 }}%</p>
              </div>
              <button
                class="btn-tech"
                :disabled="gold < Math.round(120 * Math.pow(1.7, commanderUpgrades.bountyLvl - 1))"
                @click="buyCommanderUpgrade('bounty')"
              >
                ${{ Math.round(120 * Math.pow(1.7, commanderUpgrades.bountyLvl - 1)) }}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.bastion-wrapper {
  max-width: 1320px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: #f8fafc;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.bastion-header {
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 14px;
  padding: 12px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.brand-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  font-size: 2rem;
  background: rgba(56, 189, 248, 0.15);
  padding: 8px;
  border-radius: 12px;
}

.brand-box h1 {
  font-size: 1.25rem;
  font-weight: 900;
  margin: 0;
  color: #38bdf8;
}

.sub-badges {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 4px;
  flex-wrap: wrap;
}

.diff-pill {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.hint-pill {
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 8px;
  border-radius: 6px;
  color: #cbd5e1;
}

.map-selector {
  display: flex;
  gap: 6px;
}

.btn-map {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-map.active {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border-color: #38bdf8;
}

.metrics-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.metric-box {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 6px 12px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  min-width: 90px;
}

.metric-box span {
  font-size: 0.68rem;
  color: #94a3b8;
  text-transform: uppercase;
}

.metric-box strong {
  font-size: 1.05rem;
  font-weight: 900;
}

.metric-box.gold strong { color: #4ade80; }
.metric-box.hp strong { color: #38bdf8; }
.metric-box.hp.critical strong { color: #ef4444; }
.metric-box.wave strong { color: #facc15; }

.notif-stack {
  position: fixed;
  top: 85px;
  right: 24px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
}

.notif-item {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  background: #0284c7;
  color: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}
.notif-item.success { background: #16a34a; }
.notif-item.danger { background: #dc2626; }

.bastion-main {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 14px;
}

@media (max-width: 1100px) {
  .bastion-main {
    grid-template-columns: 1fr;
  }
}

.canvas-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.canvas-container {
  position: relative;
  background: #090d16;
  border: 2px solid rgba(56, 189, 248, 0.25);
  border-radius: 14px;
  overflow: hidden;
}

.td-canvas {
  width: 100%;
  height: auto;
  display: block;
  cursor: crosshair;
}

.overlay-modal {
  position: absolute;
  inset: 0;
  background: rgba(9, 13, 22, 0.88);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}

.overlay-modal h2 {
  font-size: 2.2rem;
  color: #ef4444;
  margin: 0;
}

.final-score {
  font-size: 1.3rem;
  color: #facc15;
  font-weight: 800;
}

.btn-Action-primary {
  background: #38bdf8;
  color: #0f172a;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 900;
  font-size: 1rem;
  cursor: pointer;
}

.controls-bar {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.skills-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-skill {
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.btn-skill:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.sk-icon { font-size: 1.3rem; }
.sk-info { display: flex; flex-direction: column; text-align: left; }
.sk-name { font-size: 0.75rem; font-weight: 800; }
.sk-cost { font-size: 0.7rem; color: #4ade80; font-weight: 700; }
.sk-cd { font-size: 0.7rem; color: #facc15; }

.wave-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.btn-speed, .btn-auto {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.78rem;
  cursor: pointer;
}

.btn-speed.active, .btn-auto.active {
  background: rgba(168, 85, 247, 0.25);
  border-color: #a855f7;
  color: #e9d5ff;
}

.btn-start-wave {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  border: none;
  padding: 9px 16px;
  border-radius: 8px;
  font-weight: 900;
  font-size: 0.82rem;
  cursor: pointer;
}

.btn-start-wave:disabled {
  background: #334155;
  color: #94a3b8;
  cursor: not-allowed;
}

.builder-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-card {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.panel-header h3, .tech-card h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #38bdf8;
}

.badge-lvl {
  background: #f59e0b;
  color: #000;
  font-size: 0.7rem;
  font-weight: 900;
  padding: 2px 7px;
  border-radius: 10px;
}

.catalog-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0 0 8px 0;
}

.towers-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.tower-buy-card {
  background: rgba(30, 41, 59, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tower-buy-card:hover:not(.disabled) {
  border-color: #38bdf8;
  transform: translateY(-2px);
}

.tower-buy-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.t-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.t-ico { font-size: 1.4rem; }
.t-cost { font-size: 0.78rem; font-weight: 900; color: #4ade80; }
.t-name { font-size: 0.8rem; font-weight: 800; margin: 4px 0 2px 0; }
.t-desc { font-size: 0.66rem; color: #94a3b8; margin: 0; line-height: 1.25; }

.tower-inspector {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inspector-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.big-ico { font-size: 2rem; }
.inspector-title h4 { margin: 0; font-size: 1rem; }
.inspector-title small { color: #94a3b8; }

.inspector-stats {
  background: rgba(30, 41, 59, 0.6);
  padding: 8px 10px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
}

.inspector-btns {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn-upgrade-tower {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #000;
  border: none;
  padding: 9px;
  border-radius: 8px;
  font-weight: 900;
  cursor: pointer;
}

.btn-upgrade-tower:disabled {
  background: #334155;
  color: #94a3b8;
  cursor: not-allowed;
}

.btn-sell-tower {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
  padding: 7px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.tech-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.tech-item {
  background: rgba(30, 41, 59, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.tech-item strong { font-size: 0.78rem; display: block; }
.tech-item p { font-size: 0.68rem; color: #94a3b8; margin: 2px 0 0 0; }

.btn-tech {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.75rem;
  cursor: pointer;
}

.btn-tech:disabled {
  background: #334155;
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
