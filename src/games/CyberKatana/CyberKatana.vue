<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue'

// --- SOUND EFFECTS (Web Audio API Synthesizer) ---
class SoundFX {
  constructor() {
    this.ctx = null
    this.muted = false
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) this.ctx = new AudioContext()
    }
  }

  playSlash() {
    if (this.muted || !this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(650, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12)

    filter.type = 'highpass'
    filter.frequency.setValueAtTime(400, this.ctx.currentTime)

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.13)
  }

  playDeflect() {
    if (this.muted || !this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime)
    osc.frequency.setValueAtTime(2200, this.ctx.currentTime + 0.04)
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2)

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.22)
  }

  playHit() {
    if (this.muted || !this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(180, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15)

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.16)
  }

  playSlowMo() {
    if (this.muted || !this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.3)

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.32)
  }

  playUpgrade() {
    if (this.muted || !this.ctx) return
    const notes = [440, 554, 659, 880]
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06)
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.06)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.06 + 0.15)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(this.ctx.currentTime + idx * 0.06)
      osc.stop(this.ctx.currentTime + idx * 0.06 + 0.16)
    })
  }
}

const sfx = new SoundFX()

// --- GAME STATE ---
const canvasRef = ref(null)
const gameState = ref('MENU') // 'MENU', 'PLAYING', 'UPGRADE', 'GAMEOVER', 'VICTORY'
const gameMode = ref('ENDLESS') // 'LEVELS', 'ENDLESS'
const score = ref(0)
const highScore = ref(parseInt(localStorage.getItem('cyber_katana_hs') || '0', 10))
const credits = ref(parseInt(localStorage.getItem('cyber_katana_credits') || '0', 10))
const currentWave = ref(1)
const currentFloor = ref(1)
const comboCount = ref(0)
const comboMultiplier = ref(1)
const comboTimer = ref(0)
const freezeFrames = ref(0)
const screenShake = ref(0)

// --- UPGRADES ---
const upgrades = reactive({
  katanaDamage: 1, // 1 -> 2 -> 3
  dashSpeed: 1,
  slowMoDuration: 1,
  maxHealth: 100,
  shurikenCharges: 2,
  bladeSkin: 'neon_cyan' // 'neon_cyan', 'muramasa_red', 'solar_gold', 'void_purple'
})

const BLADE_SKINS = {
  neon_cyan: { name: 'Katana Radianita', color: '#00f3ff', glow: 'rgba(0, 243, 255, 0.8)', price: 0 },
  muramasa_red: { name: 'Muramasa Carmesí', color: '#ff0055', glow: 'rgba(255, 0, 85, 0.8)', price: 350 },
  solar_gold: { name: 'Dragón Dorado', color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)', price: 700 },
  void_purple: { name: 'Filo del Vacío', color: '#c084fc', glow: 'rgba(192, 132, 252, 0.8)', price: 1200 }
}

// --- PLAYER ---
const player = reactive({
  x: 100,
  y: 400,
  vx: 0,
  vy: 0,
  width: 26,
  height: 48,
  speed: 420,
  jumpForce: 580,
  health: 100,
  maxHealth: 100,
  energy: 100,
  maxEnergy: 100,
  isSlowMo: false,
  isDashing: false,
  dashTime: 0,
  dashCooldown: 0,
  onGround: false,
  onWall: false,
  wallDir: 0,
  facingRight: true,
  shurikens: 2,
  maxShurikens: 2,
  shurikenCd: 0,
  slashes: [],
  trail: []
})

// --- ENTITIES ---
let enemies = []
let bullets = []
let shurikens = []
let particles = []
let floatingTexts = []
let platforms = []
let cameraX = 0
let animFrameId = null
let lastTime = 0

// Input keys & mouse
const keys = reactive({})
const mouse = reactive({ x: 0, y: 0, isDown: false, rightDown: false })

// --- PLATFORMS GENERATION ---
function buildLevelPlatforms(level = 1) {
  platforms = [
    // Main Floor
    { x: -200, y: 560, w: 2400, h: 80, type: 'floor' },
    // Ceiling
    { x: -200, y: -200, w: 2400, h: 40, type: 'wall' },
    // Left & Right boundary walls
    { x: -100, y: -200, w: 40, h: 800, type: 'wall' },
    { x: 1900, y: -200, w: 40, h: 800, type: 'wall' },

    // Tactical Platforms
    { x: 250, y: 440, w: 180, h: 18, type: 'platform' },
    { x: 550, y: 350, w: 220, h: 18, type: 'platform' },
    { x: 900, y: 440, w: 180, h: 18, type: 'platform' },
    { x: 1200, y: 330, w: 260, h: 18, type: 'platform' },
    { x: 1550, y: 430, w: 200, h: 18, type: 'platform' },

    // Upper Balconies & Wall Pillars
    { x: 400, y: 220, w: 160, h: 18, type: 'platform' },
    { x: 750, y: 160, w: 240, h: 18, type: 'platform' },
    { x: 1100, y: 200, w: 180, h: 18, type: 'platform' },
    { x: 700, y: 440, w: 30, h: 120, type: 'wall' },
    { x: 1400, y: 440, w: 30, h: 120, type: 'wall' }
  ]
}

// --- SPAWN ENEMY ---
function spawnEnemy(type = 'grunt') {
  const spawnPoints = [
    { x: 450, y: 500 },
    { x: 650, y: 300 },
    { x: 950, y: 400 },
    { x: 1300, y: 280 },
    { x: 1650, y: 500 },
    { x: 850, y: 120 }
  ]
  const pt = spawnPoints[Math.floor(Math.random() * spawnPoints.length)]

  let enemy = {
    id: Date.now() + Math.random(),
    type, // 'grunt', 'sniper', 'ninja', 'boss'
    x: pt.x,
    y: pt.y,
    vx: 0,
    vy: 0,
    width: type === 'boss' ? 56 : 28,
    height: type === 'boss' ? 72 : 48,
    health: type === 'boss' ? 400 : (type === 'ninja' ? 70 : 45),
    maxHealth: type === 'boss' ? 400 : (type === 'ninja' ? 70 : 45),
    speed: type === 'ninja' ? 240 : (type === 'boss' ? 120 : 140),
    shootTimer: Math.random() * 1.5 + 1.0,
    shootInterval: type === 'sniper' ? 2.8 : (type === 'boss' ? 1.2 : 2.0),
    facingRight: false,
    alerted: false,
    stateTimer: 0
  }
  enemies.push(enemy)
}

function spawnWave(w) {
  enemies = []
  bullets = []
  const count = Math.min(12, 3 + w * 2)
  for (let i = 0; i < count; i++) {
    const r = Math.random()
    if (w % 5 === 0 && i === 0) {
      spawnEnemy('boss')
    } else if (r < 0.35) {
      spawnEnemy('ninja')
    } else if (r < 0.65) {
      spawnEnemy('sniper')
    } else {
      spawnEnemy('grunt')
    }
  }
  floatingTexts.push({
    x: player.x,
    y: player.y - 60,
    text: `⚡ OLEADA ${w} // ¡COMBATE INICIADO!`,
    color: '#00f3ff',
    life: 2.5,
    size: 24
  })
}

// --- START GAME ---
function startGame(mode = 'ENDLESS') {
  sfx.init()
  gameMode.value = mode
  gameState.value = 'PLAYING'
  score.value = 0
  currentWave.value = 1
  currentFloor.value = 1
  comboCount.value = 0
  comboMultiplier.value = 1
  player.health = player.maxHealth
  player.energy = player.maxEnergy
  player.x = 120
  player.y = 480
  player.vx = 0
  player.vy = 0
  player.shurikens = player.maxShurikens
  player.slashes = []
  player.trail = []
  particles = []
  bullets = []
  floatingTexts = []

  buildLevelPlatforms(1)
  spawnWave(1)
  lastTime = performance.now()
}

// --- SLASH & DASH (ATTACK) ---
function triggerSlash() {
  if (player.dashCooldown > 0 || player.health <= 0) return

  sfx.playSlash()

  // Calculate direction toward mouse (screen to world)
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  const worldMouseX = mouse.x + cameraX
  const worldMouseY = mouse.y

  const dx = worldMouseX - (player.x + player.width / 2)
  const dy = worldMouseY - (player.y + player.height / 2)
  const len = Math.hypot(dx, dy) || 1
  const nx = dx / len
  const ny = dy / len

  const dashDist = 180 + upgrades.dashSpeed * 30
  const startX = player.x + player.width / 2
  const startY = player.y + player.height / 2
  const endX = startX + nx * dashDist
  const endY = startY + ny * dashDist

  player.facingRight = nx > 0
  player.isDashing = true
  player.dashTime = 0.15
  player.dashCooldown = 0.35

  // Move player along dash line with collision check
  player.x = endX - player.width / 2
  player.y = endY - player.height / 2
  player.vx = nx * 300
  player.vy = ny * 300

  // Register Slash Area
  const bladeColor = BLADE_SKINS[upgrades.bladeSkin]?.color || '#00f3ff'
  player.slashes.push({
    x1: startX,
    y1: startY,
    x2: endX,
    y2: endY,
    color: bladeColor,
    life: 0.22
  })

  // Spawn visual neon trail particles
  for (let i = 0; i < 16; i++) {
    const t = i / 16
    particles.push({
      x: startX + (endX - startX) * t + (Math.random() - 0.5) * 16,
      y: startY + (endY - startY) * t + (Math.random() - 0.5) * 16,
      vx: (Math.random() - 0.5) * 120,
      vy: (Math.random() - 0.5) * 120,
      color: bladeColor,
      size: Math.random() * 4 + 2,
      life: 0.35
    })
  }

  // --- HIT CHECK AGAINST ENEMIES ---
  let hits = 0
  const dmg = 45 * upgrades.katanaDamage

  enemies.forEach(enemy => {
    // Check line segment distance to enemy center
    const enemyCx = enemy.x + enemy.width / 2
    const enemyCy = enemy.y + enemy.height / 2
    const dist = distToSegment(enemyCx, enemyCy, startX, startY, endX, endY)

    if (dist < 42) {
      hits++
      enemy.health -= dmg
      sfx.playHit()
      freezeFrames.value = 4 // Juice impact freeze
      screenShake.value = 6

      // Spawn blood / spark particles
      for (let p = 0; p < 18; p++) {
        particles.push({
          x: enemyCx,
          y: enemyCy,
          vx: (Math.random() - 0.5) * 320 + nx * 180,
          vy: (Math.random() - 0.5) * 320,
          color: Math.random() > 0.5 ? '#ff0055' : '#facc15',
          size: Math.random() * 5 + 2,
          life: 0.5
        })
      }

      floatingTexts.push({
        x: enemyCx,
        y: enemyCy - 20,
        text: `-${Math.round(dmg)}`,
        color: '#ff0055',
        life: 0.8,
        size: 20
      })

      if (enemy.health <= 0) {
        onEnemyKilled(enemy)
      }
    }
  })

  // --- DEFLECT ENEMY BULLETS ---
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]
    if (!b.isDeflected) {
      const dist = distToSegment(b.x, b.y, startX, startY, endX, endY)
      if (dist < 36) {
        b.isDeflected = true
        b.vx = -b.vx * 1.5
        b.vy = -b.vy * 1.5
        b.color = bladeColor
        sfx.playDeflect()
        freezeFrames.value = 3
        floatingTexts.push({
          x: b.x,
          y: b.y - 15,
          text: '⚔️ DEFLECT!',
          color: '#38bdf8',
          life: 0.7,
          size: 16
        })
      }
    }
  }

  // If hit enemy, refill energy & reset air dash
  if (hits > 0) {
    player.energy = Math.min(player.maxEnergy, player.energy + 25)
    player.dashCooldown = 0.1
  }
}

// --- THROW SHURIKEN ---
function throwShuriken() {
  if (player.shurikens <= 0 || player.shurikenCd > 0) return
  player.shurikens--
  player.shurikenCd = 0.4
  sfx.playSlash()

  const startX = player.x + player.width / 2
  const startY = player.y + player.height / 2
  const worldMouseX = mouse.x + cameraX
  const worldMouseY = mouse.y

  const dx = worldMouseX - startX
  const dy = worldMouseY - startY
  const len = Math.hypot(dx, dy) || 1

  shurikens.push({
    x: startX,
    y: startY,
    vx: (dx / len) * 750,
    vy: (dy / len) * 750,
    rot: 0,
    life: 2.0
  })
}

function onEnemyKilled(enemy) {
  comboCount.value++
  comboTimer.value = 3.5
  comboMultiplier.value = Math.min(5, 1 + Math.floor(comboCount.value / 3))

  const earnCredits = enemy.type === 'boss' ? 120 : (enemy.type === 'ninja' ? 30 : 15)
  const earnScore = (enemy.type === 'boss' ? 1000 : 200) * comboMultiplier.value

  credits.value += earnCredits
  score.value += earnScore
  localStorage.setItem('cyber_katana_credits', credits.value)

  if (score.value > highScore.value) {
    highScore.value = score.value
    localStorage.setItem('cyber_katana_hs', highScore.value)
  }

  floatingTexts.push({
    x: enemy.x,
    y: enemy.y - 35,
    text: `+${earnScore} [COMBO x${comboMultiplier.value}]`,
    color: '#facc15',
    life: 1.2,
    size: 22
  })

  // Remove enemy
  enemies = enemies.filter(e => e.id !== enemy.id)

  // Check wave completion
  if (enemies.length === 0) {
    currentWave.value++
    sfx.playUpgrade()
    setTimeout(() => {
      spawnWave(currentWave.value)
    }, 1200)
  }
}

// --- POINT TO LINE DISTANCE HELPER ---
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)
  if (l2 === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)))
}

// --- MAIN GAME LOOP ---
function gameLoop(now) {
  const dtRaw = Math.min(0.08, (now - lastTime) / 1000)
  lastTime = now

  if (gameState.value === 'PLAYING') {
    // Check freeze frame impact
    if (freezeFrames.value > 0) {
      freezeFrames.value--
    } else {
      // Time dilation (Slow-Mo)
      const timeScale = player.isSlowMo ? 0.28 : 1.0
      const dt = dtRaw * timeScale
      updateGame(dt)
    }
  }

  render()
  animFrameId = requestAnimationFrame(gameLoop)
}

function updateGame(dt) {
  // 1. Slow-mo Energy handling
  if (mouse.rightDown || keys['ShiftLeft'] || keys['KeyK']) {
    if (player.energy > 0) {
      if (!player.isSlowMo) sfx.playSlowMo()
      player.isSlowMo = true
      player.energy = Math.max(0, player.energy - 35 * dt)
    } else {
      player.isSlowMo = false
    }
  } else {
    player.isSlowMo = false
    player.energy = Math.min(player.maxEnergy, player.energy + 18 * dt)
  }

  // 2. Player Timers
  if (player.dashCooldown > 0) player.dashCooldown -= dt
  if (player.dashTime > 0) player.dashTime -= dt
  if (player.shurikenCd > 0) player.shurikenCd -= dt

  // Recharging Shurikens
  if (player.shurikens < player.maxShurikens) {
    if (!player.shurikenRechargeTimer) player.shurikenRechargeTimer = 0
    player.shurikenRechargeTimer += dt
    if (player.shurikenRechargeTimer > 3.0) {
      player.shurikens++
      player.shurikenRechargeTimer = 0
    }
  }

  // Combo timer
  if (comboTimer.value > 0) {
    comboTimer.value -= dt
    if (comboTimer.value <= 0) {
      comboCount.value = 0
      comboMultiplier.value = 1
    }
  }

  // Screen Shake decay
  if (screenShake.value > 0) {
    screenShake.value = Math.max(0, screenShake.value - 20 * dt)
  }

  // 3. Player Movement & Physics
  if (!player.isDashing) {
    let moveDir = 0
    if (keys['KeyA'] || keys['ArrowLeft']) moveDir -= 1
    if (keys['KeyD'] || keys['ArrowRight']) moveDir += 1

    player.vx = moveDir * player.speed
    if (moveDir !== 0) player.facingRight = moveDir > 0

    // Gravity
    player.vy += 1200 * dt

    // Wall slide friction
    if (player.onWall && player.vy > 0) {
      player.vy = Math.min(player.vy, 140)
    }

    // Jump / Wall Jump
    if ((keys['KeyW'] || keys['ArrowUp'] || keys['Space']) && !player.jumpHeld) {
      player.jumpHeld = true
      if (player.onGround) {
        player.vy = -player.jumpForce
        player.onGround = false
        sfx.playSlash()
      } else if (player.onWall) {
        player.vy = -player.jumpForce * 0.95
        player.vx = -player.wallDir * player.speed * 1.3
        player.onWall = false
        sfx.playSlash()
      }
    }
    if (!keys['KeyW'] && !keys['ArrowUp'] && !keys['Space']) {
      player.jumpHeld = false
    }

    // Apply Velocity
    player.x += player.vx * dt
    player.y += player.vy * dt
  }

  // 4. Player Platform Collisions
  player.onGround = false
  player.onWall = false
  player.wallDir = 0

  platforms.forEach(plat => {
    // Vertical collision (Landing on floor / platform)
    if (
      player.x + player.width > plat.x &&
      player.x < plat.x + plat.w &&
      player.y + player.height >= plat.y &&
      player.y + player.height <= plat.y + 24 &&
      player.vy >= 0
    ) {
      player.y = plat.y - player.height
      player.vy = 0
      player.onGround = true
    }

    // Wall collision
    if (plat.type === 'wall') {
      if (
        player.y + player.height > plat.y &&
        player.y < plat.y + plat.h
      ) {
        if (player.x + player.width >= plat.x && player.x < plat.x + plat.w && player.vx > 0) {
          player.x = plat.x - player.width
          player.onWall = true
          player.wallDir = 1
        } else if (player.x <= plat.x + plat.w && player.x + player.width > plat.x + plat.w && player.vx < 0) {
          player.x = plat.x + plat.w
          player.onWall = true
          player.wallDir = -1
        }
      }
    }
  })

  // Keep player inside boundary
  if (player.y > 650) {
    player.health = 0
  }

  // 5. Update Slashes & Trails
  for (let i = player.slashes.length - 1; i >= 0; i--) {
    const s = player.slashes[i]
    s.life -= dt
    if (s.life <= 0) player.slashes.splice(i, 1)
  }

  // 6. Update Shurikens
  for (let i = shurikens.length - 1; i >= 0; i--) {
    const sh = shurikens[i]
    sh.life -= dt
    sh.x += sh.vx * dt
    sh.y += sh.vy * dt
    sh.rot += 25 * dt

    // Check hit against enemies
    enemies.forEach(e => {
      if (
        sh.x > e.x &&
        sh.x < e.x + e.width &&
        sh.y > e.y &&
        sh.y < e.y + e.height
      ) {
        e.health -= 60 * upgrades.katanaDamage
        sfx.playHit()
        sh.life = 0
        if (e.health <= 0) onEnemyKilled(e)
      }
    })

    if (sh.life <= 0) shurikens.splice(i, 1)
  }

  // 7. Update Enemies AI & Shooting
  enemies.forEach(e => {
    const dx = (player.x + player.width / 2) - (e.x + e.width / 2)
    const dy = (player.y + player.height / 2) - (e.y + e.height / 2)
    const dist = Math.hypot(dx, dy)

    e.facingRight = dx > 0

    // Enemy movement toward player
    if (e.type === 'ninja') {
      if (dist > 60) {
        e.vx = (dx > 0 ? 1 : -1) * e.speed
      } else {
        e.vx = 0
        // Melee swipe
        e.shootTimer -= dt
        if (e.shootTimer <= 0) {
          e.shootTimer = 1.2
          sfx.playSlash()
          if (dist < 70) {
            player.health -= 25
            sfx.playHit()
            screenShake.value = 10
          }
        }
      }
    } else {
      // Ranged enemies patrol or hold position
      e.shootTimer -= dt
      if (e.shootTimer <= 0 && dist < 700) {
        e.shootTimer = e.shootInterval

        // Shoot bullet toward player
        const speed = e.type === 'sniper' ? 620 : (e.type === 'boss' ? 380 : 340)
        bullets.push({
          x: e.x + e.width / 2,
          y: e.y + e.height / 2,
          vx: (dx / dist) * speed,
          vy: (dy / dist) * speed,
          radius: e.type === 'boss' ? 8 : 4,
          color: e.type === 'sniper' ? '#e11d48' : '#f97316',
          isDeflected: false,
          damage: e.type === 'sniper' ? 45 : (e.type === 'boss' ? 30 : 18),
          life: 3.5
        })
        sfx.playSlash()
      }
    }

    // Apply enemy gravity & horizontal move
    e.vy += 1000 * dt
    e.x += (e.vx || 0) * dt
    e.y += e.vy * dt

    // Platform collision for enemies
    platforms.forEach(p => {
      if (
        e.x + e.width > p.x &&
        e.x < p.x + p.w &&
        e.y + e.height >= p.y &&
        e.y + e.height <= p.y + 24 &&
        e.vy >= 0
      ) {
        e.y = p.y - e.height
        e.vy = 0
      }
    })
  })

  // 8. Update Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]
    b.life -= dt
    b.x += b.vx * dt
    b.y += b.vy * dt

    // If deflected: hits enemies!
    if (b.isDeflected) {
      for (const e of enemies) {
        if (
          b.x > e.x &&
          b.x < e.x + e.width &&
          b.y > e.y &&
          b.y < e.y + e.height
        ) {
          e.health -= 70 * upgrades.katanaDamage
          sfx.playHit()
          b.life = 0
          if (e.health <= 0) onEnemyKilled(e)
          break
        }
      }
    } else {
      // Enemy bullet hits player
      if (
        b.x > player.x &&
        b.x < player.x + player.width &&
        b.y > player.y &&
        b.y < player.y + player.height
      ) {
        player.health -= b.damage
        sfx.playHit()
        screenShake.value = 12
        b.life = 0
        floatingTexts.push({
          x: player.x,
          y: player.y - 20,
          text: `-${b.damage}`,
          color: '#ef4444',
          life: 0.7,
          size: 20
        })
      }
    }

    if (b.life <= 0) bullets.splice(i, 1)
  }

  // 9. Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.life -= dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.life <= 0) particles.splice(i, 1)
  }

  // 10. Update Floating Texts
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const t = floatingTexts[i]
    t.life -= dt
    t.y -= 30 * dt
    if (t.life <= 0) floatingTexts.splice(i, 1)
  }

  // 11. Check Player Death
  if (player.health <= 0) {
    gameState.value = 'GAMEOVER'
  }

  // 12. Smooth Camera Follow
  const targetCamX = player.x - 450
  cameraX += (targetCamX - cameraX) * 8.0 * dt
}

// --- RENDER ---
function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  // Screen shake offset
  const shakeX = (Math.random() - 0.5) * screenShake.value
  const shakeY = (Math.random() - 0.5) * screenShake.value

  ctx.save()
  ctx.translate(shakeX, shakeY)

  // 1. Dark Cyberpunk Background with Grid Lines
  ctx.fillStyle = '#060913'
  ctx.fillRect(0, 0, width, height)

  // Grid Neon Lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)'
  ctx.lineWidth = 1
  const gridOffset = -cameraX * 0.4
  for (let x = gridOffset % 60; x < width; x += 60) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += 60) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Slow-Mo Cyan Vignette
  if (player.isSlowMo) {
    const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.6)
    grad.addColorStop(0, 'rgba(0, 243, 255, 0)')
    grad.addColorStop(1, 'rgba(0, 243, 255, 0.22)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  }

  // --- WORLD RENDERING (APPLY CAMERA OFFSET) ---
  ctx.save()
  ctx.translate(-cameraX, 0)

  // 2. Draw Platforms
  platforms.forEach(p => {
    ctx.fillStyle = p.type === 'wall' ? '#0f172a' : '#1e293b'
    ctx.fillRect(p.x, p.y, p.w, p.h)

    // Neon Accent Border
    ctx.strokeStyle = p.type === 'wall' ? '#334155' : '#00f3ff'
    ctx.lineWidth = 2
    ctx.strokeRect(p.x, p.y, p.w, p.h)
  })

  // 3. Draw Slashes
  player.slashes.forEach(s => {
    ctx.save()
    ctx.strokeStyle = s.color
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.shadowColor = s.color
    ctx.shadowBlur = 18
    ctx.beginPath()
    ctx.moveTo(s.x1, s.y1)
    ctx.lineTo(s.x2, s.y2)
    ctx.stroke()
    ctx.restore()
  })

  // 4. Draw Particles
  particles.forEach(p => {
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2)
    ctx.fill()
  })

  // 5. Draw Shurikens
  shurikens.forEach(sh => {
    ctx.save()
    ctx.translate(sh.x, sh.y)
    ctx.rotate(sh.rot)
    ctx.fillStyle = '#00f3ff'
    ctx.shadowColor = '#00f3ff'
    ctx.shadowBlur = 10
    ctx.fillRect(-8, -2, 16, 4)
    ctx.fillRect(-2, -8, 4, 16)
    ctx.restore()
  })

  // 6. Draw Bullets
  bullets.forEach(b => {
    ctx.save()
    ctx.fillStyle = b.color
    ctx.shadowColor = b.color
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })

  // 7. Draw Enemies
  enemies.forEach(e => {
    ctx.save()
    const isBoss = e.type === 'boss'
    const isNinja = e.type === 'ninja'

    // Enemy Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.beginPath()
    ctx.ellipse(e.x + e.width / 2, e.y + e.height, e.width * 0.6, 6, 0, 0, Math.PI * 2)
    ctx.fill()

    // Enemy Body
    ctx.fillStyle = isBoss ? '#e11d48' : (isNinja ? '#9333ea' : '#f97316')
    ctx.fillRect(e.x, e.y, e.width, e.height)

    // Cyber Visor
    ctx.fillStyle = '#facc15'
    ctx.shadowColor = '#facc15'
    ctx.shadowBlur = 8
    const eyeX = e.facingRight ? e.x + e.width - 10 : e.x + 2
    ctx.fillRect(eyeX, e.y + 10, 8, 4)

    // Sniper Laser sight
    if (e.type === 'sniper') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(e.x + (e.facingRight ? e.width : 0), e.y + 12)
      ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2)
      ctx.stroke()
    }

    // Health Bar
    const hpRatio = Math.max(0, e.health / e.maxHealth)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(e.x - 4, e.y - 12, e.width + 8, 5)
    ctx.fillStyle = isBoss ? '#ef4444' : '#22c55e'
    ctx.fillRect(e.x - 4, e.y - 12, (e.width + 8) * hpRatio, 5)

    ctx.restore()
  })

  // 8. Draw Player (Cyber Ninja)
  ctx.save()
  const skinColor = BLADE_SKINS[upgrades.bladeSkin]?.color || '#00f3ff'

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.beginPath()
  ctx.ellipse(player.x + player.width / 2, player.y + player.height, player.width * 0.6, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  // Ninja Body
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(player.x, player.y, player.width, player.height)

  // Cyber Armor plates
  ctx.fillStyle = skinColor
  ctx.shadowColor = skinColor
  ctx.shadowBlur = 10
  ctx.fillRect(player.x + 4, player.y + 8, player.width - 8, 14) // Chest armor

  // Glowing Cyber Visor
  ctx.fillStyle = '#ffffff'
  const pEyeX = player.facingRight ? player.x + player.width - 8 : player.x + 2
  ctx.fillRect(pEyeX, player.y + 8, 6, 3)

  // Katana in Hand
  ctx.strokeStyle = skinColor
  ctx.lineWidth = 3
  ctx.shadowColor = skinColor
  ctx.shadowBlur = 12
  const swordHandX = player.facingRight ? player.x + player.width : player.x
  const swordHandY = player.y + 24
  ctx.beginPath()
  ctx.moveTo(swordHandX, swordHandY)
  ctx.lineTo(swordHandX + (player.facingRight ? 26 : -26), swordHandY - 14)
  ctx.stroke()

  ctx.restore()

  // 9. Draw Floating Texts
  floatingTexts.forEach(t => {
    ctx.save()
    ctx.fillStyle = t.color
    ctx.font = `bold ${t.size || 18}px 'Inter', sans-serif`
    ctx.shadowColor = t.color
    ctx.shadowBlur = 8
    ctx.fillText(t.text, t.x, t.y)
    ctx.restore()
  })

  ctx.restore() // Restore world camera translate
  ctx.restore() // Restore screen shake
}

// --- EVENT LISTENERS ---
function onKeyDown(e) {
  keys[e.code] = true
  if (e.code === 'KeyJ' || e.code === 'KeyF') triggerSlash()
  if (e.code === 'KeyE') throwShuriken()
}

function onKeyUp(e) {
  keys[e.code] = false
}

function onMouseMove(e) {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  mouse.x = e.clientX - rect.left
  mouse.y = e.clientY - rect.top
}

function onMouseDown(e) {
  if (e.button === 0) {
    mouse.isDown = true
    triggerSlash()
  }
  if (e.button === 2) {
    e.preventDefault()
    mouse.rightDown = true
  }
  if (e.button === 1) {
    e.preventDefault()
    throwShuriken()
  }
}

function onMouseUp(e) {
  if (e.button === 0) mouse.isDown = false
  if (e.button === 2) mouse.rightDown = false
}

function buyUpgrade(type) {
  if (type === 'damage' && credits.value >= 150) {
    credits.value -= 150
    upgrades.katanaDamage += 0.5
    sfx.playUpgrade()
  } else if (type === 'dash' && credits.value >= 120) {
    credits.value -= 120
    upgrades.dashSpeed += 0.4
    sfx.playUpgrade()
  } else if (type === 'health' && credits.value >= 180) {
    credits.value -= 180
    player.maxHealth += 25
    player.health = player.maxHealth
    sfx.playUpgrade()
  }
  localStorage.setItem('cyber_katana_credits', credits.value)
}

function selectSkin(skinKey) {
  const s = BLADE_SKINS[skinKey]
  if (credits.value >= s.price) {
    upgrades.bladeSkin = skinKey
    sfx.playUpgrade()
  }
}

onMounted(() => {
  nextTick(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    lastTime = performance.now()
    animFrameId = requestAnimationFrame(gameLoop)
  })
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<template>
  <div class="cyber-katana-app" @contextmenu.prevent>
    <!-- TOP TACTICAL HUD -->
    <header class="game-hud">
      <div class="hud-left">
        <div class="stat-badge">
          <span class="ico">❤️</span>
          <div class="bar-wrap">
            <div class="bar-fill hp-bar" :style="{ width: `${Math.max(0, (player.health / player.maxHealth) * 100)}%` }"></div>
          </div>
          <span class="val">{{ Math.round(player.health) }}</span>
        </div>

        <div class="stat-badge">
          <span class="ico">⚡</span>
          <div class="bar-wrap">
            <div class="bar-fill energy-bar" :style="{ width: `${Math.max(0, (player.energy / player.maxEnergy) * 100)}%` }"></div>
          </div>
          <span class="val">{{ Math.round(player.energy) }}%</span>
        </div>
      </div>

      <div class="hud-center">
        <div class="score-display">
          <span class="score-label">PUNTOS</span>
          <span class="score-val">{{ score }}</span>
        </div>
        <div v-if="comboCount > 1" class="combo-badge" :class="{ ultra: comboMultiplier >= 3 }">
          COMBO x{{ comboMultiplier }} ({{ comboCount }} Bajas)
        </div>
      </div>

      <div class="hud-right">
        <div class="credit-box">
          <span class="ico">💰</span>
          <span class="credit-val">${{ credits }}</span>
        </div>
        <div class="wave-box">
          OLEADA {{ currentWave }}
        </div>
      </div>
    </header>

    <!-- MAIN CANVAS ARENA -->
    <div class="canvas-wrap">
      <canvas 
        ref="canvasRef" 
        width="1000" 
        height="600" 
        class="game-canvas"
        @mousemove="onMouseMove"
        @mousedown="onMouseDown"
        @mouseup="onMouseUp"
      ></canvas>

      <!-- OVERLAYS: MENU -->
      <div v-if="gameState === 'MENU'" class="overlay menu-overlay">
        <div class="menu-box">
          <div class="cyber-logo">⚔️ CYBER KATANA ZERO</div>
          <p class="cyber-desc">
            Slasher de acción rápida y cámara lenta en tiempo bala. Corta a tus enemigos en dos, desvía proyectiles láser y activa tu tiempo bala para aniquilar las oleadas cibernéticas.
          </p>

          <div class="controls-guide">
            <div class="ctrl-col">
              <h4>🕹️ MOVIMIENTO</h4>
              <p><strong>A / D:</strong> Correr</p>
              <p><strong>W / Espacio:</strong> Doble Salto</p>
              <p><strong>Muro + Salto:</strong> Wall Jump</p>
            </div>
            <div class="ctrl-col">
              <h4>⚔️ COMBATE</h4>
              <p><strong>Clic Izq / J:</strong> Katana Dash & Slash</p>
              <p><strong>Clic Der / Shift:</strong> Tiempo Bala (Slow-Mo)</p>
              <p><strong>E / Rueda:</strong> Shuriken Láser</p>
            </div>
          </div>

          <div class="menu-actions">
            <button class="btn-play" @click="startGame('ENDLESS')">🎮 JUGAR OLEADAS INFINITAS</button>
            <button class="btn-shop" @click="gameState = 'UPGRADE'">🛒 MEJORAS & KATANAS</button>
          </div>
        </div>
      </div>

      <!-- OVERLAYS: UPGRADES & SKINS SHOP -->
      <div v-else-if="gameState === 'UPGRADE'" class="overlay shop-overlay">
        <div class="shop-box">
          <div class="shop-header">
            <h2>🛒 ARSENAL CYBERNETICO & MEJORAS</h2>
            <div class="balance">CRÉDITOS: <strong class="text-gold">${{ credits }}</strong></div>
          </div>

          <div class="shop-grid">
            <div class="shop-card">
              <span class="icon">🗡️</span>
              <h3>Filo de Plasma (+50% Daño)</h3>
              <p>Nivel Actual: {{ upgrades.katanaDamage }}x Daño</p>
              <button class="btn-buy" :disabled="credits < 150" @click="buyUpgrade('damage')">Mejorar [$150]</button>
            </div>

            <div class="shop-card">
              <span class="icon">⚡</span>
              <h3>Dash Hipersónico (+30% Alcance)</h3>
              <p>Alcance: +{{ Math.round((upgrades.dashSpeed - 1) * 100) }}%</p>
              <button class="btn-buy" :disabled="credits < 120" @click="buyUpgrade('dash')">Mejorar [$120]</button>
            </div>

            <div class="shop-card">
              <span class="icon">🛡️</span>
              <h3>Armadura Radianita (+25 Vida)</h3>
              <p>Vida Máxima: {{ player.maxHealth }} HP</p>
              <button class="btn-buy" :disabled="credits < 180" @click="buyUpgrade('health')">Mejorar [$180]</button>
            </div>
          </div>

          <h3 class="skins-title">🎨 KATANAS LEGENDARIAS</h3>
          <div class="skins-grid">
            <div 
              v-for="(skin, key) in BLADE_SKINS" 
              :key="key" 
              class="skin-card"
              :class="{ active: upgrades.bladeSkin === key }"
              @click="selectSkin(key)"
            >
              <div class="skin-blade-preview" :style="{ backgroundColor: skin.color, boxShadow: `0 0 14px ${skin.color}` }"></div>
              <h4>{{ skin.name }}</h4>
              <span v-if="upgrades.bladeSkin === key" class="badge-equipped">EQUIPADA</span>
              <span v-else class="badge-price">${{ skin.price }}</span>
            </div>
          </div>

          <button class="btn-back-menu" @click="gameState = 'MENU'">⬅️ VOLVER AL MENÚ</button>
        </div>
      </div>

      <!-- OVERLAYS: GAME OVER -->
      <div v-else-if="gameState === 'GAMEOVER'" class="overlay gameover-overlay">
        <div class="gameover-box">
          <h2>💀 OPERADOR ELIMINADO</h2>
          <div class="final-stats">
            <div class="stat-row"><span>Puntuación Final:</span> <strong>{{ score }}</strong></div>
            <div class="stat-row"><span>Récord Histórico:</span> <strong>{{ highScore }}</strong></div>
            <div class="stat-row"><span>Oleada Alcanzada:</span> <strong>Oleada {{ currentWave }}</strong></div>
            <div class="stat-row"><span>Créditos Ganados:</span> <strong class="text-gold">+${{ credits }}</strong></div>
          </div>
          <div class="gameover-btns">
            <button class="btn-play" @click="startGame('ENDLESS')">🔄 REINTENTAR</button>
            <button class="btn-shop" @click="gameState = 'UPGRADE'">🛒 MEJORAS</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cyber-katana-app {
  position: relative;
  width: 100%;
  max-width: 1020px;
  margin: 0 auto;
  background: #090d16;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 243, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  font-family: 'Inter', system-ui, sans-serif;
  user-select: none;
}

/* TOP HUD */
.game-hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(0, 243, 255, 0.15);
}

.hud-left {
  display: flex;
  gap: 16px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.4);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bar-wrap {
  width: 90px;
  height: 10px;
  background: #1e293b;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.15s ease;
}

.hp-bar {
  background: linear-gradient(90deg, #ef4444, #22c55e);
}

.energy-bar {
  background: linear-gradient(90deg, #0284c7, #00f3ff);
}

.val {
  font-size: 0.85rem;
  font-weight: 800;
  color: #fff;
}

.hud-center {
  text-align: center;
}

.score-display {
  display: flex;
  flex-direction: column;
}

.score-label {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 700;
  letter-spacing: 1px;
}

.score-val {
  font-size: 1.4rem;
  font-weight: 900;
  color: #00f3ff;
  text-shadow: 0 0 10px rgba(0, 243, 255, 0.6);
}

.combo-badge {
  font-size: 0.75rem;
  font-weight: 800;
  color: #facc15;
  background: rgba(250, 204, 21, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
  margin-top: 2px;
  animation: pulse 0.5s infinite alternate;
}

.combo-badge.ultra {
  color: #ff0055;
  background: rgba(255, 0, 85, 0.2);
}

.hud-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.credit-box, .wave-box {
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.credit-val {
  color: #fbbf24;
}

.wave-box {
  color: #38bdf8;
}

/* CANVAS */
.canvas-wrap {
  position: relative;
  width: 100%;
  height: 600px;
  background: #000;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* OVERLAYS */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(6, 9, 19, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.menu-box, .shop-box, .gameover-box {
  background: #0f172a;
  border: 1px solid rgba(0, 243, 255, 0.3);
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  max-width: 680px;
  width: 90%;
  box-shadow: 0 0 30px rgba(0, 243, 255, 0.15);
}

.cyber-logo {
  font-size: 2.2rem;
  font-weight: 900;
  color: #00f3ff;
  letter-spacing: 2px;
  text-shadow: 0 0 15px rgba(0, 243, 255, 0.8);
  margin-bottom: 12px;
}

.cyber-desc {
  color: #cbd5e1;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 24px;
}

.controls-guide {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  background: rgba(0, 0, 0, 0.4);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  text-align: left;
}

.ctrl-col h4 {
  color: #38bdf8;
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.ctrl-col p {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 4px 0;
}

.menu-actions, .gameover-btns {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-play {
  background: linear-gradient(135deg, #00f3ff, #0284c7);
  color: #000;
  border: none;
  font-weight: 900;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-play:hover {
  transform: scale(1.04);
  box-shadow: 0 0 20px rgba(0, 243, 255, 0.7);
}

.btn-shop {
  background: rgba(30, 41, 59, 0.8);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 800;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-shop:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
}

/* SHOP */
.shop-box {
  max-width: 800px;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
  margin-bottom: 20px;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.shop-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.shop-card .icon {
  font-size: 1.8rem;
  margin-bottom: 8px;
  display: block;
}

.shop-card h3 {
  font-size: 0.95rem;
  color: #f8fafc;
  margin-bottom: 6px;
}

.shop-card p {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 12px;
}

.btn-buy {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}

.btn-buy:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.skins-title {
  color: #cbd5e1;
  font-size: 0.9rem;
  margin-bottom: 12px;
  text-align: left;
}

.skins-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.skin-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.skin-card.active {
  border-color: #00f3ff;
  box-shadow: 0 0 12px rgba(0, 243, 255, 0.4);
}

.skin-blade-preview {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  margin-bottom: 8px;
}

.skin-card h4 {
  font-size: 0.8rem;
  color: #fff;
  margin-bottom: 4px;
}

.badge-equipped {
  font-size: 0.7rem;
  color: #22c55e;
  font-weight: 800;
}

.badge-price {
  font-size: 0.7rem;
  color: #fbbf24;
  font-weight: 800;
}

.btn-back-menu {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #cbd5e1;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}

/* GAMEOVER */
.gameover-box h2 {
  color: #ef4444;
  font-size: 2rem;
  font-weight: 900;
  margin-bottom: 18px;
}

.final-stats {
  background: rgba(0, 0, 0, 0.4);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.95rem;
  color: #cbd5e1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.text-gold {
  color: #fbbf24;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.06); }
}
</style>
