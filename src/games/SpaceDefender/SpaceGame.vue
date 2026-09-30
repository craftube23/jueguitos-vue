<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const gameState = ref('START')
const score = ref(0)
const wave = ref(1)
const credits = ref(0)
const health = ref(100)
const soundEnabled = ref(true)

const weaponHeat = ref(0)
const isOverheated = ref(false)

const bossActive = ref(false)
const bossHpPercent = ref(100)

const upgrades = ref({
  damage: { level: 1, cost: 30 },
  fireRate: { level: 1, cost: 40 },
  speed: { level: 1, cost: 25 },
  maxHealth: { level: 1, cost: 50 }
})

const activePowerups = ref({ tripleShot: 0, shield: 0 })

let audioCtx = null
const initAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
}

const playSound = (type) => {
  if (!soundEnabled.value || !audioCtx) return
  try {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    const now = audioCtx.currentTime

    if (type === 'laser') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(850, now); osc.frequency.exponentialRampToValueAtTime(160, now + 0.1)
      gain.gain.setValueAtTime(0.12, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.1)
      osc.start(now); osc.stop(now + 0.1)
    } else if (type === 'alienLaser') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(450, now); osc.frequency.exponentialRampToValueAtTime(90, now + 0.15)
      gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.15)
      osc.start(now); osc.stop(now + 0.15)
    } else if (type === 'explosion') {
      osc.type = 'square'; osc.frequency.setValueAtTime(140, now); osc.frequency.exponentialRampToValueAtTime(25, now + 0.28)
      gain.gain.setValueAtTime(0.25, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.28)
      osc.start(now); osc.stop(now + 0.28)
    } else if (type === 'powerup') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(320, now); osc.frequency.linearRampToValueAtTime(950, now + 0.2)
      gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.2)
      osc.start(now); osc.stop(now + 0.2)
    } else if (type === 'hit') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(130, now); osc.frequency.linearRampToValueAtTime(50, now + 0.16)
      gain.gain.setValueAtTime(0.35, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.16)
      osc.start(now); osc.stop(now + 0.16)
    }
  } catch (e) {}
}

const canvasRef = ref(null)
let ctx = null
let animationFrameId = null
const keys = {}
let lastShotTime = 0

let player = { x: 400, y: 520, width: 44, height: 48, speed: 6 }
let stars = []
let bullets = []
let enemyBullets = []
let enemies = []
let particles = []
let powerups = []
let boss = null

const initStars = () => {
  stars = []
  for (let i = 0; i < 110; i++) {
    stars.push({
      x: Math.random() * 800, y: Math.random() * 600,
      size: Math.random() * 2 + 0.5, speed: Math.random() * 2 + 0.5, alpha: Math.random() * 0.8 + 0.2
    })
  }
}

const startGame = () => {
  initAudio()
  gameState.value = 'PLAYING'
  score.value = 0
  wave.value = 1
  health.value = 100 + (upgrades.value.maxHealth.level - 1) * 25
  weaponHeat.value = 0
  isOverheated.value = false
  activePowerups.value.tripleShot = 0
  activePowerups.value.shield = 0

  player.x = 400; player.y = 520
  bullets = []; enemyBullets = []; enemies = []; particles = []; powerups = []; boss = null
  bossActive.value = false
  spawnWave()
}

const spawnWave = () => {
  if (wave.value % 3 === 0) {
    bossActive.value = true
    boss = {
      x: 400, y: -100, targetY: 120, width: 90, height: 70,
      hp: 35 + wave.value * 15, maxHp: 35 + wave.value * 15,
      dir: 1, speed: 2 + wave.value * 0.3, shootTimer: 0
    }
    bossHpPercent.value = 100
    return
  }

  bossActive.value = false
  const count = 8 + wave.value * 4

  for (let i = 0; i < count; i++) {
    const rand = Math.random()
    let type = 'scout'
    if (rand < 0.35) type = 'meteor'
    else if (rand < 0.65) type = 'shooter'
    else if (rand < 0.85) type = 'kamikaze'

    enemies.push({
      x: Math.random() * 700 + 50, y: -Math.random() * 900 - 60,
      width: type === 'meteor' ? 44 : 36, height: type === 'meteor' ? 44 : 36,
      speed: type === 'kamikaze' ? 2.5 + Math.random() * 1.5 : (type === 'meteor' ? 1.5 + Math.random() * 1.2 : 1.8 + Math.random() * 1.2),
      hp: type === 'meteor' ? 4 + Math.floor(wave.value / 2) : 2 + Math.floor(wave.value / 3),
      maxHp: type === 'meteor' ? 4 + Math.floor(wave.value / 2) : 2 + Math.floor(wave.value / 3),
      type, angle: 0, rotationSpeed: (Math.random() - 0.5) * 0.06, shootTimer: Math.random() * 60, vx: (Math.random() - 0.5) * 2
    })
  }
}

const createExplosion = (x, y, color, count = 18) => {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 5 + 1.5
    particles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      size: Math.random() * 3 + 2, color: color || '#f59e0b', alpha: 1, decay: 0.03
    })
  }
}

const shoot = () => {
  if (isOverheated.value) return
  const now = performance.now()
  const fireDelay = Math.max(120, 290 - (upgrades.value.fireRate.level - 1) * 40)
  if (now - lastShotTime < fireDelay) return
  lastShotTime = now

  weaponHeat.value = Math.min(100, weaponHeat.value + 9)
  if (weaponHeat.value >= 100) isOverheated.value = true

  const bulletDamage = upgrades.value.damage.level
  if (activePowerups.value.tripleShot > 0) {
    bullets.push({ x: player.x, y: player.y - 20, vx: 0, vy: -13, damage: bulletDamage, color: '#facc15' })
    bullets.push({ x: player.x - 12, y: player.y - 15, vx: -3.5, vy: -12, damage: bulletDamage, color: '#facc15' })
    bullets.push({ x: player.x + 12, y: player.y - 15, vx: 3.5, vy: -12, damage: bulletDamage, color: '#facc15' })
  } else {
    bullets.push({ x: player.x - 14, y: player.y - 15, vx: 0, vy: -13, damage: bulletDamage, color: '#38bdf8' })
    bullets.push({ x: player.x + 14, y: player.y - 15, vx: 0, vy: -13, damage: bulletDamage, color: '#38bdf8' })
  }
  playSound('laser')
}

const buyUpgrade = (type) => {
  const upg = upgrades.value[type]
  if (credits.value >= upg.cost && upg.level < 5) {
    credits.value -= upg.cost
    upg.level++
    upg.cost = Math.round(upg.cost * 1.7)
    playSound('powerup')
  }
}

const gameLoop = () => {
  if (!ctx) return
  ctx.fillStyle = '#060913'
  ctx.fillRect(0, 0, 800, 600)

  stars.forEach(s => {
    s.y += s.speed
    if (s.y > 600) { s.y = 0; s.x = Math.random() * 800 }
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`
    ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill()
  })

  if (gameState.value === 'PLAYING') {
    if (weaponHeat.value > 0) {
      weaponHeat.value = Math.max(0, weaponHeat.value - 0.7)
      if (weaponHeat.value <= 15 && isOverheated.value) isOverheated.value = false
    }

    if (activePowerups.value.tripleShot > 0) activePowerups.value.tripleShot--
    if (activePowerups.value.shield > 0) activePowerups.value.shield--

    player.speed = 5.5 + (upgrades.value.speed.level - 1) * 1.5
    if ((keys['ArrowLeft'] || keys['KeyA']) && player.x > 30) player.x -= player.speed
    if ((keys['ArrowRight'] || keys['KeyD']) && player.x < 770) player.x += player.speed
    if ((keys['ArrowUp'] || keys['KeyW']) && player.y > 80) player.y -= player.speed
    if ((keys['ArrowDown'] || keys['KeyS']) && player.y < 560) player.y += player.speed

    if (keys['Space']) shoot()

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]
      b.x += b.vx; b.y += b.vy
      ctx.fillStyle = b.color
      ctx.fillRect(b.x - 2.5, b.y - 8, 5, 16)
      if (b.y < -20) bullets.splice(i, 1)
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const eb = enemyBullets[i]
      eb.x += eb.vx; eb.y += eb.vy
      ctx.fillStyle = '#ef4444'
      ctx.beginPath(); ctx.arc(eb.x, eb.y, 4.5, 0, Math.PI * 2); ctx.fill()

      if (Math.hypot(player.x - eb.x, player.y - eb.y) < 24) {
        enemyBullets.splice(i, 1)
        if (activePowerups.value.shield > 0) playSound('powerup')
        else {
          health.value -= 15; playSound('hit')
          if (health.value <= 0) gameOver()
        }
        continue
      }
      if (eb.y > 630) enemyBullets.splice(i, 1)
    }

    if (boss) {
      if (boss.y < boss.targetY) boss.y += 2
      boss.x += boss.speed * boss.dir
      if (boss.x > 720 || boss.x < 80) boss.dir *= -1

      boss.shootTimer++
      if (boss.shootTimer > 45) {
        boss.shootTimer = 0
        playSound('alienLaser')
        enemyBullets.push({ x: boss.x, y: boss.y + 35, vx: 0, vy: 5 })
        enemyBullets.push({ x: boss.x - 25, y: boss.y + 30, vx: -2.5, vy: 4.5 })
        enemyBullets.push({ x: boss.x + 25, y: boss.y + 30, vx: 2.5, vy: 4.5 })
      }

      ctx.save(); ctx.translate(boss.x, boss.y)
      ctx.fillStyle = '#dc2626'; ctx.beginPath()
      ctx.moveTo(0, 35); ctx.lineTo(45, -35); ctx.lineTo(-45, -35); ctx.closePath(); ctx.fill()
      ctx.restore()

      bossHpPercent.value = Math.max(0, (boss.hp / boss.maxHp) * 100)

      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j]
        if (Math.hypot(b.x - boss.x, b.y - boss.y) < 45) {
          boss.hp -= b.damage; bullets.splice(j, 1)
          if (boss.hp <= 0) {
            createExplosion(boss.x, boss.y, '#ef4444', 50)
            playSound('explosion'); score.value += 500; credits.value += 100
            boss = null; bossActive.value = false; wave.value++; spawnWave()
            break
          }
        }
      }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]
      e.y += e.speed; e.x += e.vx
      if (e.type === 'kamikaze') e.x += Math.sign(player.x - e.x) * 1.8
      if (e.type === 'shooter' && e.y > 0 && e.y < 450) {
        e.shootTimer++
        if (e.shootTimer > 90) {
          e.shootTimer = 0; playSound('alienLaser')
          enemyBullets.push({ x: e.x, y: e.y + 15, vx: (player.x - e.x) * 0.008, vy: 4.5 })
        }
      }

      ctx.fillStyle = e.type === 'meteor' ? '#78716c' : (e.type === 'kamikaze' ? '#f97316' : '#8b5cf6')
      ctx.beginPath(); ctx.arc(e.x, e.y, e.width / 2, 0, Math.PI * 2); ctx.fill()

      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j]
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.width / 2 + 7) {
          e.hp -= b.damage; bullets.splice(j, 1)
          if (e.hp <= 0) {
            createExplosion(e.x, e.y, '#f59e0b', 16); playSound('explosion'); score.value += 40
            if (Math.random() < 0.3) {
              credits.value += 5; powerups.push({ x: e.x, y: e.y, type: 'credit', emoji: '💎' })
            } else if (Math.random() < 0.2) {
              powerups.push({ x: e.x, y: e.y, type: 'triple', emoji: '⚡' })
            }
            enemies.splice(i, 1)
            break
          }
        }
      }

      if (Math.hypot(player.x - e.x, player.y - e.y) < 35) {
        enemies.splice(i, 1); createExplosion(e.x, e.y, '#ef4444', 20)
        if (activePowerups.value.shield > 0) playSound('powerup')
        else {
          health.value -= 30; playSound('hit')
          if (health.value <= 0) gameOver()
        }
      }
      if (e.y > 650) enemies.splice(i, 1)
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i]
      p.y += 2.2; ctx.font = '20px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(p.emoji, p.x, p.y)

      if (Math.hypot(player.x - p.x, player.y - p.y) < 32) {
        playSound('powerup')
        if (p.type === 'triple') activePowerups.value.tripleShot = 400
        powerups.splice(i, 1)
      } else if (p.y > 620) powerups.splice(i, 1)
    }

    if (enemies.length === 0 && !boss) {
      wave.value++; score.value += 200; credits.value += 20; spawnWave()
    }

    drawPlayer()
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i]
    pt.x += pt.vx; pt.y += pt.vy; pt.alpha -= pt.decay
    if (pt.alpha <= 0) particles.splice(i, 1)
    else {
      ctx.fillStyle = pt.color; ctx.globalAlpha = pt.alpha
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  animationFrameId = requestAnimationFrame(gameLoop)
}

const drawPlayer = () => {
  ctx.save(); ctx.translate(player.x, player.y)
  ctx.fillStyle = Math.random() < 0.5 ? '#f59e0b' : '#ef4444'
  ctx.beginPath(); ctx.moveTo(-8, 20); ctx.lineTo(8, 20); ctx.lineTo(0, 32 + Math.random() * 8); ctx.closePath(); ctx.fill()
  ctx.fillStyle = isOverheated.value ? '#ef4444' : '#0284c7'
  ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(20, 20); ctx.lineTo(0, 12); ctx.lineTo(-20, 20); ctx.closePath(); ctx.fill()
  ctx.restore()
}

const gameOver = () => {
  gameState.value = 'GAMEOVER'
  playSound('explosion')
}

const handleKeyDown = (e) => {
  keys[e.code] = true
  if (e.code === 'Space' && gameState.value === 'PLAYING') {
    e.preventDefault(); shoot()
  }
}
const handleKeyUp = (e) => { keys[e.code] = false }
const handleMouseMove = (e) => {
  if (gameState.value !== 'PLAYING' || !canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  player.x = Math.max(30, Math.min(770, (e.clientX - rect.left) * scaleX))
}
const handleMouseDown = () => { if (gameState.value === 'PLAYING') { initAudio(); shoot() } }

const handleTouchMove = (e) => {
  if (gameState.value !== 'PLAYING' || !canvasRef.value || e.touches.length === 0) return
  const touch = e.touches[0]
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height
  player.x = Math.max(30, Math.min(770, (touch.clientX - rect.left) * scaleX))
  player.y = Math.max(80, Math.min(560, (touch.clientY - rect.top) * scaleY))
}

const handleTouchStart = (e) => {
  if (gameState.value !== 'PLAYING') return
  initAudio()
  handleTouchMove(e)
  shoot()
}

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    initStars()
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvasRef.value.addEventListener('mousemove', handleMouseMove)
    canvasRef.value.addEventListener('mousedown', handleMouseDown)
    canvasRef.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    canvasRef.value.addEventListener('touchmove', handleTouchMove, { passive: true })
    gameLoop()
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<template>
  <div class="space-game">
    <header class="hud-header">
      <div class="hud-item"><span class="hud-label">PUNTOS</span><span class="hud-value">{{ score }}</span></div>
      <div class="hud-item"><span class="hud-label">OLEADA</span><span class="hud-value">#{{ wave }} 🌊</span></div>
      <div class="hud-item"><span class="hud-label">CRÉDITOS</span><span class="hud-value">💎 {{ credits }}</span></div>

      <div class="hud-item health-box">
        <span class="hud-label">ESCUDO ({{ Math.max(0, health) }}%)</span>
        <div class="health-bar-bg"><div class="health-bar-fill" :style="{ width: Math.max(0, health) + '%' }"></div></div>
      </div>

      <div class="hud-item heat-box">
        <span class="hud-label">{{ isOverheated ? '🔥 SOBRECALENTADO' : 'TEMPERATURA' }}</span>
        <div class="heat-bar-bg"><div class="heat-bar-fill" :style="{ width: weaponHeat + '%' }" :class="{ 'heat-max': isOverheated }"></div></div>
      </div>
    </header>

    <div v-if="bossActive" class="boss-hud-bar">
      <div class="boss-title">⚠️ ¡JEFE NODRIZA DETECTADO! ⚠️</div>
      <div class="boss-bar-bg"><div class="boss-bar-fill" :style="{ width: bossHpPercent + '%' }"></div></div>
    </div>

    <div class="canvas-container">
      <canvas ref="canvasRef" width="800" height="600"></canvas>

      <div v-if="gameState === 'START'" class="overlay-screen">
        <div class="modal-content">
          <h1 class="glow-title">🚀 SPACE DEFENDER 2D</h1>
          <p class="subtitle">Defiende la galaxia de invasores y jefes nodriza.</p>
          <button class="btn-start" @click="startGame">▶️ INICIAR MISIÓN</button>
        </div>
      </div>

      <div v-if="gameState === 'GAMEOVER'" class="overlay-screen">
        <div class="modal-content">
          <h1 class="danger-title">💥 NAVE DESTRUIDA</h1>
          <p>Puntos: {{ score }} | Oleada: {{ wave }}</p>
          <div class="modal-buttons">
            <button class="btn-start" @click="startGame">🔄 REINTENTAR</button>
            <button class="btn-shop" @click="gameState = 'SHOP'">🏪 TALLER</button>
          </div>
        </div>
      </div>

      <div v-if="gameState === 'SHOP'" class="overlay-screen">
        <div class="modal-content shop-modal">
          <h2>🛠️ TALLER ESPACIAL (💎 {{ credits }})</h2>
          <div class="upgrades-grid">
            <div class="upgrade-card">
              <div><strong>Potencia Láser</strong> (Nv. {{ upgrades.damage.level }})</div>
              <button class="btn-buy-upg" :disabled="credits < upgrades.damage.cost" @click="buyUpgrade('damage')">💎 {{ upgrades.damage.cost }}</button>
            </div>
            <div class="upgrade-card">
              <div><strong>Cadencia</strong> (Nv. {{ upgrades.fireRate.level }})</div>
              <button class="btn-buy-upg" :disabled="credits < upgrades.fireRate.cost" @click="buyUpgrade('fireRate')">💎 {{ upgrades.fireRate.cost }}</button>
            </div>
          </div>
          <button class="btn-start" @click="gameState = 'PLAYING'">🚀 CONTINUAR</button>
        </div>
      </div>
    </div>

    <!-- CONTROLES TÁCTILES MÓVILES -->
    <div v-if="gameState === 'PLAYING'" class="mobile-touch-bar">
      <div class="virtual-dpad" style="grid-template-columns: repeat(2, 54px); grid-template-rows: 54px;">
        <button 
          class="dpad-btn" 
          @touchstart.prevent="keys['KeyA'] = true; keys['ArrowLeft'] = true" 
          @touchend.prevent="keys['KeyA'] = false; keys['ArrowLeft'] = false"
          @mousedown="keys['KeyA'] = true"
          @mouseup="keys['KeyA'] = false"
        >⬅️</button>
        <button 
          class="dpad-btn" 
          @touchstart.prevent="keys['KeyD'] = true; keys['ArrowRight'] = true" 
          @touchend.prevent="keys['KeyD'] = false; keys['ArrowRight'] = false"
          @mousedown="keys['KeyD'] = true"
          @mouseup="keys['KeyD'] = false"
        >➡️</button>
      </div>

      <div class="virtual-actions">
        <button 
          class="touch-action-btn" 
          style="background: #0284c7; padding: 12px 24px; font-size: 1rem;" 
          @touchstart.prevent="shoot"
          @click="shoot"
        >
          🔴 DISPARAR LÁSER
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.space-game { max-width: 850px; margin: 0 auto; }
.hud-header {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(30, 41, 59, 0.7); padding: 10px 15px; border-radius: 12px; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;
}
.hud-item { display: flex; flex-direction: column; }
.hud-label { font-size: 0.7rem; color: #94a3b8; font-weight: bold; }
.hud-value { font-size: 1.1rem; font-weight: 800; color: #38bdf8; }

.health-box, .heat-box { min-width: 130px; }
.health-bar-bg, .heat-bar-bg { width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-top: 3px; }
.health-bar-fill { height: 100%; background: #22c55e; }
.heat-bar-fill { height: 100%; background: #f59e0b; }
.heat-bar-fill.heat-max { background: #ef4444; }

.boss-hud-bar { background: rgba(220, 38, 38, 0.2); border: 1px solid #ef4444; border-radius: 8px; padding: 6px 12px; margin-bottom: 10px; text-align: center; }
.boss-title { font-size: 0.8rem; font-weight: bold; color: #fca5a5; }
.boss-bar-bg { height: 8px; background: #000; border-radius: 4px; overflow: hidden; }
.boss-bar-fill { height: 100%; background: #ef4444; }

.canvas-container { position: relative; width: 100%; aspect-ratio: 4/3; border-radius: 12px; overflow: hidden; background: #000; border: 1px solid rgba(56, 189, 248, 0.3); }
canvas { width: 100%; height: 100%; display: block; }

.overlay-screen { position: absolute; inset: 0; background: rgba(10, 15, 30, 0.88); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; padding: 20px; }
.modal-content { background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 14px; padding: 25px; text-align: center; max-width: 480px; width: 100%; }
.glow-title { color: #38bdf8; font-size: 1.8rem; margin-bottom: 8px; }
.danger-title { color: #ef4444; font-size: 1.8rem; margin-bottom: 8px; }
.subtitle { color: #94a3b8; margin-bottom: 18px; font-size: 0.9rem; }

.btn-start { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 800; cursor: pointer; }
.btn-shop { background: #7c3aed; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.modal-buttons { display: flex; gap: 10px; justify-content: center; margin-top: 15px; }

.upgrades-grid { display: flex; flex-direction: column; gap: 10px; margin: 15px 0; }
.upgrade-card { display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.7); padding: 10px; border-radius: 8px; }
.btn-buy-upg { background: #22c55e; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-buy-upg:disabled { background: #475569; opacity: 0.5; }
</style>
