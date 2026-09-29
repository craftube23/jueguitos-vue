<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const gameState = ref('MENU') // 'MENU', 'PLAYING', 'GAMEOVER', 'GARAGE'
const score = ref(0)
const distance = ref(0)
const speed = ref(0)
const maxSpeed = ref(180)
const coins = ref(0)
const nitro = ref(100)
const isNitroActive = ref(false)

const cars = [
  { id: 'red', name: 'Inferno GT', color: '#ef4444', topSpeed: 210, accel: 0.28, handling: 4.5, icon: '🏎️' },
  { id: 'blue', name: 'Cyber Phantom', color: '#38bdf8', topSpeed: 230, accel: 0.24, handling: 4.2, icon: '🚙' },
  { id: 'yellow', name: 'Viper Hornet', color: '#eab308', topSpeed: 250, accel: 0.32, handling: 4.8, icon: '🏎️' }
]
const selectedCar = ref(cars[0])

const upgrades = ref({
  engine: { level: 1, cost: 50, name: 'Motor Turbo' },
  tires: { level: 1, cost: 40, name: 'Neumáticos de Competición' },
  nitro: { level: 1, cost: 60, name: 'Tanque Nitro Óxido' }
})

let audioCtx = null
const initAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
}

const playSound = (type) => {
  if (!audioCtx) return
  try {
    const now = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)

    if (type === 'crash') {
      osc.type = 'square'
      osc.frequency.setValueAtTime(120, now)
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.3)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3)
      osc.start(now); osc.stop(now + 0.3)
    } else if (type === 'coin') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(500, now)
      osc.frequency.linearRampToValueAtTime(900, now + 0.1)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1)
      osc.start(now); osc.stop(now + 0.1)
    } else if (type === 'nitro') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(200, now)
      osc.frequency.linearRampToValueAtTime(600, now + 0.25)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25)
      osc.start(now); osc.stop(now + 0.25)
    }
  } catch (e) {}
}

const canvasRef = ref(null)
let ctx = null
let animationFrameId = null
const keys = {}

const ROAD_WIDTH = 420
const ROAD_LEFT = (800 - ROAD_WIDTH) / 2
const ROAD_RIGHT = ROAD_LEFT + ROAD_WIDTH

let player = {
  x: 400,
  y: 480,
  width: 42,
  height: 72,
  vx: 0,
  angle: 0
}

let roadOffset = 0
let obstacles = [] // Autos de tráfico y manchas
let trackCoins = []
let particles = []

const startGame = () => {
  initAudio()
  gameState.value = 'PLAYING'
  score.value = 0
  distance.value = 0
  speed.value = 0
  nitro.value = 100
  isNitroActive.value = false
  player.x = 400
  player.vx = 0
  player.angle = 0
  obstacles = []
  trackCoins = []
  particles = []
}

const buyUpgrade = (key) => {
  const upg = upgrades.value[key]
  if (coins.value >= upg.cost && upg.level < 5) {
    coins.value -= upg.cost
    upg.level++
    upg.cost = Math.round(upg.cost * 1.6)
    playSound('coin')
  }
}

const gameLoop = () => {
  if (!ctx) return

  // 1. DIBUJAR PISTA Y CÉSPED
  ctx.fillStyle = '#166534' // Césped verde
  ctx.fillRect(0, 0, 800, 600)

  // Asfalto
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, 600)

  // Líneas laterales rojas/blancas
  ctx.fillStyle = '#ef4444'
  ctx.fillRect(ROAD_LEFT - 12, 0, 12, 600)
  ctx.fillRect(ROAD_RIGHT, 0, 12, 600)

  // Líneas centrales divisorias animadas
  roadOffset = (roadOffset + speed.value * 0.4) % 40
  ctx.fillStyle = '#cbd5e1'
  for (let y = -40 + roadOffset; y < 600; y += 40) {
    ctx.fillRect(ROAD_LEFT + ROAD_WIDTH / 3, y, 6, 20)
    ctx.fillRect(ROAD_LEFT + (ROAD_WIDTH / 3) * 2, y, 6, 20)
  }

  if (gameState.value === 'PLAYING') {
    // 2. FÍSICA Y VELOCIDAD
    const topCap = selectedCar.value.topSpeed + (upgrades.value.engine.level - 1) * 18
    const accelRate = selectedCar.value.accel + (upgrades.value.engine.level - 1) * 0.05
    const turnGrip = selectedCar.value.handling + (upgrades.value.tires.level - 1) * 0.5

    // Aceleración / Freno
    if (keys['ArrowUp'] || keys['KeyW']) {
      speed.value = Math.min(topCap, speed.value + accelRate * 3)
    } else if (keys['ArrowDown'] || keys['KeyS']) {
      speed.value = Math.max(0, speed.value - 2.5)
    } else {
      speed.value = Math.max(0, speed.value - 0.4) // Fricción natural
    }

    // Nitro
    if ((keys['Space'] || keys['ShiftLeft']) && nitro.value > 0 && speed.value > 30) {
      isNitroActive.value = true
      nitro.value = Math.max(0, nitro.value - 0.6)
      speed.value = Math.min(topCap + 40, speed.value + 1.2)
      if (Math.random() < 0.3) playSound('nitro')

      // Fuego de escape
      particles.push({
        x: player.x + (Math.random() - 0.5) * 14,
        y: player.y + 40,
        vx: (Math.random() - 0.5) * 2,
        vy: speed.value * 0.1 + 4,
        color: '#38bdf8',
        alpha: 1
      })
    } else {
      isNitroActive.value = false
      if (nitro.value < 100) nitro.value += 0.08 // Recarga lenta
    }

    // Giro y Derrape
    if (speed.value > 5) {
      if (keys['ArrowLeft'] || keys['KeyA']) {
        player.vx = -turnGrip
        player.angle = -0.12
      } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.vx = turnGrip
        player.angle = 0.12
      } else {
        player.vx *= 0.8
        player.angle *= 0.8
      }
    } else {
      player.vx = 0
      player.angle = 0
    }

    player.x += player.vx

    // Frenar si se sale al césped
    if (player.x < ROAD_LEFT + 20 || player.x > ROAD_RIGHT - 20) {
      speed.value = Math.max(20, speed.value - 1.2)
      // Partículas de polvo
      particles.push({
        x: player.x,
        y: player.y + 30,
        vx: (Math.random() - 0.5) * 4,
        vy: 2,
        color: '#4ade80',
        alpha: 0.8
      })
    }

    player.x = Math.max(ROAD_LEFT - 30, Math.min(ROAD_RIGHT + 30, player.x))

    distance.value += Math.round(speed.value * 0.05)
    score.value += Math.round(speed.value * 0.02)

    // 3. GENERAR TRÁFICO (AUTOS RIVALES)
    if (Math.random() < 0.025 && obstacles.length < 5) {
      const laneX = ROAD_LEFT + 40 + Math.random() * (ROAD_WIDTH - 80)
      const colors = ['#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#64748b']
      obstacles.push({
        x: laneX,
        y: -100,
        width: 38,
        height: 68,
        speed: 40 + Math.random() * 50,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }

    // GENERAR MONEDAS
    if (Math.random() < 0.02 && trackCoins.length < 4) {
      trackCoins.push({
        x: ROAD_LEFT + 50 + Math.random() * (ROAD_WIDTH - 100),
        y: -50,
        size: 12
      })
    }

    // MOVER Y DIBUJAR MONEDAS
    for (let i = trackCoins.length - 1; i >= 0; i--) {
      const c = trackCoins[i]
      c.y += (speed.value - 50) * 0.08 + 3

      ctx.fillStyle = '#eab308'
      ctx.shadowBlur = 10; ctx.shadowColor = '#eab308'
      ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0

      if (Math.hypot(player.x - c.x, player.y - c.y) < 32) {
        coins.value += 5
        playSound('coin')
        trackCoins.splice(i, 1)
        continue
      }
      if (c.y > 650) trackCoins.splice(i, 1)
    }

    // MOVER Y DIBUJAR TRÁFICO
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i]
      // Velocidad relativa con respecto al jugador
      const relSpeed = (speed.value - obs.speed) * 0.09
      obs.y += relSpeed

      // Dibujar auto rival
      ctx.save()
      ctx.translate(obs.x, obs.y)
      ctx.fillStyle = obs.color
      ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height)
      // Luces traseras rojas
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(-obs.width / 2 + 3, obs.height / 2 - 4, 8, 4)
      ctx.fillRect(obs.width / 2 - 11, obs.height / 2 - 4, 8, 4)
      // Parabrisas
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(-obs.width / 2 + 4, -14, obs.width - 8, 14)
      ctx.restore()

      // COLISIÓN (CHOQUE)
      if (Math.abs(player.x - obs.x) < (player.width + obs.width) / 2.3 &&
          Math.abs(player.y - obs.y) < (player.height + obs.height) / 2.3) {
        playSound('crash')
        gameOver()
        break
      }

      if (obs.y > 700 || obs.y < -300) obstacles.splice(i, 1)
    }

    // 4. DIBUJAR AUTO DEL JUGADOR
    drawPlayerCar()
  }

  // 5. PARTÍCULAS
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.alpha -= 0.04
    if (p.alpha <= 0) particles.splice(i, 1)
    else {
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  animationFrameId = requestAnimationFrame(gameLoop)
}

const drawPlayerCar = () => {
  ctx.save()
  ctx.translate(player.x, player.y)
  ctx.rotate(player.angle)

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.fillRect(-player.width / 2 + 4, -player.height / 2 + 6, player.width, player.height)

  // Carrocería
  ctx.fillStyle = selectedCar.value.color
  ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height)

  // Franjas de competición
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(-4, -player.height / 2, 8, player.height)

  // Parabrisas
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(-player.width / 2 + 4, -18, player.width - 8, 16)
  ctx.fillRect(-player.width / 2 + 6, 12, player.width - 12, 10)

  // Faros delanteros
  ctx.fillStyle = '#fef08a'
  ctx.fillRect(-player.width / 2 + 3, -player.height / 2, 8, 4)
  ctx.fillRect(player.width / 2 - 11, -player.height / 2, 8, 4)

  ctx.restore()
}

const gameOver = () => {
  gameState.value = 'GAMEOVER'
}

const handleKeyDown = (e) => { keys[e.code] = true }
const handleKeyUp = (e) => { keys[e.code] = false }

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
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
  <div class="racing-game">
    <!-- PANEL DE VELOCIDAD Y HUD -->
    <header class="racing-hud">
      <div class="hud-item">
        <span class="label">VELOCÍMETRO</span>
        <span class="val speed-val">{{ Math.round(speed) }} <small>KM/H</small></span>
      </div>

      <div class="hud-item">
        <span class="label">DISTANCIA</span>
        <span class="val">{{ distance }} m</span>
      </div>

      <div class="hud-item">
        <span class="label">MONEDAS</span>
        <span class="val coin-val">🪙 {{ coins }}</span>
      </div>

      <!-- BARRA DE NITRO -->
      <div class="hud-item nitro-box">
        <span class="label">{{ isNitroActive ? '🔥 NITRO ACTIVADO' : 'NITRO (ESPACIO)' }}</span>
        <div class="nitro-bar-bg">
          <div class="nitro-bar-fill" :style="{ width: nitro + '%' }" :class="{ active: isNitroActive }"></div>
        </div>
      </div>
    </header>

    <div class="canvas-wrapper">
      <canvas ref="canvasRef" width="800" height="600"></canvas>

      <!-- MENU INICIO -->
      <div v-if="gameState === 'MENU'" class="overlay">
        <div class="modal">
          <h1>🏎️ TURBO DRIFT 2D</h1>
          <p class="sub">Esquiva el tráfico a toda velocidad y junta monedas.</p>

          <!-- SELECCIONAR AUTO -->
          <div class="cars-grid">
            <div 
              v-for="car in cars" 
              :key="car.id" 
              class="car-card" 
              :class="{ active: selectedCar.id === car.id }"
              @click="selectedCar = car"
            >
              <div class="car-icon">{{ car.icon }}</div>
              <h4>{{ car.name }}</h4>
              <div class="stats-mini">Vel: {{ car.topSpeed }} km/h</div>
            </div>
          </div>

          <div class="controls-info">
            <strong>W / ⬆️</strong> Acelerar | <strong>S / ⬇️</strong> Frenar | <strong>A/D</strong> Girar | <strong>ESPACIO</strong> Nitro
          </div>

          <button class="btn-race" @click="startGame">🏁 ¡INICIAR CARRERA!</button>
        </div>
      </div>

      <!-- GAME OVER -->
      <div v-if="gameState === 'GAMEOVER'" class="overlay">
        <div class="modal">
          <h1 class="crash-title">💥 ¡CHOQUE TOTAL!</h1>
          <p>Distancia recorrida: <strong>{{ distance }} metros</strong></p>
          <p>Monedas acumuladas: <strong>🪙 {{ coins }}</strong></p>

          <div class="modal-btns">
            <button class="btn-race" @click="startGame">🔄 Reintentar</button>
            <button class="btn-garage" @click="gameState = 'GARAGE'">🔧 Garaje & Mejoras</button>
          </div>
        </div>
      </div>

      <!-- GARAJE DE MEJORAS -->
      <div v-if="gameState === 'GARAGE'" class="overlay">
        <div class="modal garage-modal">
          <h2>🔧 GARAJE DE ALTO RENDIMIENTO (🪙 {{ coins }})</h2>
          <div class="upgrades-list">
            <div v-for="(upg, key) in upgrades" :key="key" class="upg-item">
              <div>
                <strong>{{ upg.name }}</strong> (Nv. {{ upg.level }}/5)
              </div>
              <button 
                class="btn-buy" 
                :disabled="coins < upg.cost || upg.level >= 5"
                @click="buyUpgrade(key)"
              >
                <span v-if="upg.level < 5">🪙 {{ upg.cost }}</span>
                <span v-else>MAX</span>
              </button>
            </div>
          </div>
          <button class="btn-race" @click="gameState = 'PLAYING'; startGame()">🏎️ PISTA DE CARRERAS</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.racing-game { max-width: 820px; margin: 0 auto; }
.racing-hud {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(15, 23, 42, 0.85); padding: 12px 20px; border-radius: 12px; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;
}
.hud-item { display: flex; flex-direction: column; }
.label { font-size: 0.7rem; color: #94a3b8; font-weight: bold; }
.val { font-size: 1.2rem; font-weight: 800; color: #f8fafc; }
.speed-val { color: #38bdf8; }
.coin-val { color: #eab308; }

.nitro-box { min-width: 160px; }
.nitro-bar-bg { width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-top: 3px; }
.nitro-bar-fill { height: 100%; background: #38bdf8; transition: width 0.1s; }
.nitro-bar-fill.active { background: #f59e0b; }

.canvas-wrapper { position: relative; width: 100%; aspect-ratio: 4/3; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); }
canvas { width: 100%; height: 100%; display: block; }

.overlay { position: absolute; inset: 0; background: rgba(10, 15, 30, 0.9); display: flex; justify-content: center; align-items: center; padding: 20px; }
.modal { background: rgba(30, 41, 59, 0.95); border: 2px solid #38bdf8; border-radius: 16px; padding: 25px; text-align: center; max-width: 500px; width: 100%; }
.modal h1 { color: #38bdf8; font-size: 1.8rem; margin-bottom: 6px; }
.crash-title { color: #ef4444 !important; }
.sub { color: #94a3b8; font-size: 0.9rem; margin-bottom: 16px; }

.cars-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; }
.car-card { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px; cursor: pointer; }
.car-card.active { border-color: #38bdf8; background: rgba(56,189,248,0.15); }
.car-icon { font-size: 2rem; }
.car-card h4 { font-size: 0.85rem; margin: 4px 0; }
.stats-mini { font-size: 0.7rem; color: #94a3b8; }

.controls-info { background: rgba(0,0,0,0.5); padding: 8px; border-radius: 8px; font-size: 0.75rem; color: #cbd5e1; margin-bottom: 15px; }

.btn-race { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 12px 25px; border-radius: 8px; font-weight: 900; font-size: 1rem; cursor: pointer; }
.btn-garage { background: #7c3aed; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.modal-btns { display: flex; gap: 10px; justify-content: center; margin-top: 15px; }

.upgrades-list { display: flex; flex-direction: column; gap: 8px; margin: 15px 0; text-align: left; }
.upg-item { display: flex; justify-content: space-between; align-items: center; background: rgba(15,23,42,0.7); padding: 10px 14px; border-radius: 8px; }
.btn-buy { background: #eab308; color: #000; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-buy:disabled { background: #475569; color: #94a3b8; cursor: not-allowed; }
</style>
