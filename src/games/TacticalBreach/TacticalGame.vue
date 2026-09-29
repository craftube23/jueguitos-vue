<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const gameState = ref('MENU') // 'MENU', 'PLAYING', 'VICTORY', 'GAMEOVER'
const score = ref(0)
const terroristsLeft = ref(0)
const hostageRescued = ref(false)
const missionTimer = ref(0)

// Armas disponibles
const weapons = [
  { id: 'm4', name: 'M4A1 Asalto', damage: 35, fireDelay: 120, magSize: 30, reloadTime: 1800, range: 600, spread: 0.05, icon: '🔫' },
  { id: 'shotgun', name: 'Escopeta Táctica', damage: 22, pellets: 6, fireDelay: 550, magSize: 8, reloadTime: 2200, range: 350, spread: 0.22, icon: '💥' },
  { id: 'mp5', name: 'MP5 Silenciado', damage: 26, fireDelay: 90, magSize: 30, reloadTime: 1500, range: 450, spread: 0.08, silenced: true, icon: '🤫' },
  { id: 'sniper', name: 'AWM Francotirador', damage: 100, fireDelay: 900, magSize: 5, reloadTime: 2600, range: 800, spread: 0.01, icon: '🔭' }
]
const selectedWeapon = ref(weapons[0])

const currentAmmo = ref(30)
const maxAmmo = ref(30)
const totalMags = ref(4)
const isReloading = ref(false)
const flashbangs = ref(2)
const smokes = ref(1)

const playerHealth = ref(100)

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

    if (type === 'gunshot') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(450, now)
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1)
      osc.start(now); osc.stop(now + 0.1)
    } else if (type === 'silenced') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(250, now)
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.06)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.06)
      osc.start(now); osc.stop(now + 0.06)
    } else if (type === 'reload') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(300, now)
      osc.frequency.linearRampToValueAtTime(600, now + 0.1)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1)
      osc.start(now); osc.stop(now + 0.1)
    } else if (type === 'flash') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(900, now)
      osc.frequency.linearRampToValueAtTime(100, now + 0.5)
      gain.gain.setValueAtTime(0.35, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.5)
      osc.start(now); osc.stop(now + 0.5)
    }
  } catch (e) {}
}

const canvasRef = ref(null)
let ctx = null
let animationFrameId = null
let timerInterval = null
const keys = {}
let mouse = { x: 400, y: 300, isDown: false }
let lastShotTime = 0

// OPERADOR JUGADOR
let player = {
  x: 100,
  y: 100,
  angle: 0,
  speed: 2.8,
  size: 14
}

// MAPA TÁCTICO: MUROS Y HABITACIONES
const walls = [
  // Bordes exteriores
  { x: 0, y: 0, w: 800, h: 20 },
  { x: 0, y: 580, w: 800, h: 20 },
  { x: 0, y: 0, w: 20, h: 600 },
  { x: 780, y: 0, w: 20, h: 600 },
  // Habitaciones interiores
  { x: 250, y: 20, w: 20, h: 220 },
  { x: 250, y: 320, w: 20, h: 260 },
  { x: 250, y: 300, w: 280, h: 20 },
  { x: 530, y: 20, w: 20, h: 180 },
  { x: 530, y: 280, w: 20, h: 300 },
  // Cajas de cobertura
  { x: 120, y: 280, w: 40, h: 40 },
  { x: 380, y: 120, w: 50, h: 50 },
  { x: 650, y: 400, w: 60, h: 40 },
  { x: 680, y: 160, w: 40, h: 40 }
]

let enemies = []
let bullets = []
let bloodStains = []
let smokeClouds = []
let flashEffect = 0
let hostage = { x: 700, y: 100, rescued: false, size: 12 }

const startMission = () => {
  initAudio()
  gameState.value = 'PLAYING'
  score.value = 0
  missionTimer.value = 0
  playerHealth.value = 100
  hostageRescued.value = false
  currentAmmo.value = selectedWeapon.value.magSize
  maxAmmo.value = selectedWeapon.value.magSize
  totalMags.value = 4
  flashbangs.value = 2
  smokes.value = 1
  isReloading.value = false

  player.x = 80
  player.y = 80
  bullets = []
  bloodStains = []
  smokeClouds = []
  flashEffect = 0
  hostage.rescued = false

  // Generar Terroristas en distintas habitaciones
  enemies = [
    { x: 180, y: 220, hp: 60, maxHp: 60, angle: 0, state: 'patrol', patrolDir: 1, sightRange: 260, stunned: 0, shootTimer: 0 },
    { x: 380, y: 80, hp: 70, maxHp: 70, angle: Math.PI / 2, state: 'guard', sightRange: 300, stunned: 0, shootTimer: 0 },
    { x: 400, y: 240, hp: 60, maxHp: 60, angle: Math.PI, state: 'patrol', patrolDir: -1, sightRange: 280, stunned: 0, shootTimer: 0 },
    { x: 400, y: 450, hp: 80, maxHp: 80, angle: 0, state: 'guard', sightRange: 300, stunned: 0, shootTimer: 0 },
    { x: 680, y: 480, hp: 70, maxHp: 70, angle: -Math.PI / 2, state: 'patrol', patrolDir: 1, sightRange: 280, stunned: 0, shootTimer: 0 },
    { x: 660, y: 100, hp: 100, maxHp: 100, angle: Math.PI, state: 'guard', isBoss: true, sightRange: 320, stunned: 0, shootTimer: 0 } // Guardia del rehén
  ]
  terroristsLeft.value = enemies.length

  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (gameState.value === 'PLAYING') missionTimer.value++
  }, 1000)
}

// RECARGA TÁCTICA
const reload = () => {
  if (isReloading.value || totalMags.value <= 0 || currentAmmo.value === maxAmmo.value) return
  isReloading.value = true
  playSound('reload')
  setTimeout(() => {
    totalMags.value--
    currentAmmo.value = maxAmmo.value
    isReloading.value = false
  }, selectedWeapon.value.reloadTime)
}

// LANZAR FLASHBANG
const throwFlashbang = () => {
  if (flashbangs.value <= 0 || gameState.value !== 'PLAYING') return
  flashbangs.value--
  flashEffect = 1.0
  playSound('flash')

  // Cegar a todos los enemigos en rango
  enemies.forEach(e => {
    const dist = Math.hypot(e.x - player.x, e.y - player.y)
    if (dist < 400) {
      e.stunned = 240 // 4 segundos aturdido
    }
  })
}

// LANZAR HUMO
const throwSmoke = () => {
  if (smokes.value <= 0 || gameState.value !== 'PLAYING') return
  smokes.value--
  smokeClouds.push({
    x: player.x + Math.cos(player.angle) * 80,
    y: player.y + Math.sin(player.angle) * 80,
    radius: 70,
    life: 500
  })
}

// DISPARAR ARMA
const shootWeapon = () => {
  if (isReloading.value || gameState.value !== 'PLAYING') return
  if (currentAmmo.value <= 0) {
    reload()
    return
  }

  const now = performance.now()
  if (now - lastShotTime < selectedWeapon.value.fireDelay) return
  lastShotTime = now

  currentAmmo.value--
  const w = selectedWeapon.value

  if (w.silenced) playSound('silenced')
  else playSound('gunshot')

  const count = w.pellets || 1
  for (let i = 0; i < count; i++) {
    const spreadAngle = (Math.random() - 0.5) * w.spread
    const finalAngle = player.angle + spreadAngle
    bullets.push({
      x: player.x + Math.cos(player.angle) * 18,
      y: player.y + Math.sin(player.angle) * 18,
      vx: Math.cos(finalAngle) * 16,
      vy: Math.sin(finalAngle) * 16,
      damage: w.damage,
      range: w.range,
      distanceTraveled: 0,
      isEnemy: false
    })
  }

  // Alerta sonora a enemigos si el arma no es silenciada
  if (!w.silenced) {
    enemies.forEach(e => {
      if (Math.hypot(e.x - player.x, e.y - player.y) < 420) {
        e.state = 'alert'
      }
    })
  }
}

// COLISIÓN CON MUROS
const checkWallCollision = (x, y, radius) => {
  for (const w of walls) {
    if (x + radius > w.x && x - radius < w.x + w.w &&
        y + radius > w.y && y - radius < w.y + w.h) {
      return true
    }
  }
  return false
}

// RAYCASTING SIMPLE PARA LÍNEA DE VISIÓN
const hasLineOfSight = (x1, y1, x2, y2) => {
  const steps = 25
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const cx = x1 + (x2 - x1) * t
    const cy = y1 + (y2 - y1) * t
    if (checkWallCollision(cx, cy, 3)) return false
  }
  return true
}

const gameLoop = () => {
  if (!ctx) return

  // 1. DIBUJAR SUELO DE LA INSTALACIÓN TÁCTICA
  ctx.fillStyle = '#111827'
  ctx.fillRect(0, 0, 800, 600)

  // Baldosas
  ctx.strokeStyle = '#1f2937'
  ctx.lineWidth = 1
  for (let x = 0; x < 800; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke()
  }
  for (let y = 0; y < 600; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke()
  }

  // Manchas de sangre
  bloodStains.forEach(b => {
    ctx.fillStyle = 'rgba(153, 27, 27, 0.6)'
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill()
  })

  // 2. DIBUJAR MUROS
  ctx.fillStyle = '#374151'
  ctx.strokeStyle = '#4b5563'
  ctx.lineWidth = 2
  walls.forEach(w => {
    ctx.fillRect(w.x, w.y, w.w, w.h)
    ctx.strokeRect(w.x, w.y, w.w, w.h)
  })

  // 3. REHÉN
  if (!hostage.rescued) {
    ctx.fillStyle = '#38bdf8'
    ctx.beginPath(); ctx.arc(hostage.x, hostage.y, hostage.size, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('REHÉN', hostage.x, hostage.y - 15)

    if (Math.hypot(player.x - hostage.x, player.y - hostage.y) < 35) {
      hostage.rescued = true
      hostageRescued.value = true
      score.value += 500
    }
  }

  if (gameState.value === 'PLAYING') {
    // 4. MOVIMIENTO OPERADOR
    let mx = 0, my = 0
    if (keys['KeyW'] || keys['ArrowUp']) my -= 1
    if (keys['KeyS'] || keys['ArrowDown']) my += 1
    if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1
    if (keys['KeyD'] || keys['ArrowRight']) mx += 1

    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my)
      const nextX = player.x + (mx / len) * player.speed
      const nextY = player.y + (my / len) * player.speed

      if (!checkWallCollision(nextX, player.y, player.size)) player.x = nextX
      if (!checkWallCollision(player.x, nextY, player.size)) player.y = nextY
    }

    // Ángulo apuntando al ratón
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x)

    if (mouse.isDown) shootWeapon()

    // 5. NUBES DE HUMO
    for (let i = smokeClouds.length - 1; i >= 0; i--) {
      const sm = smokeClouds[i]
      sm.life--
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)'
      ctx.beginPath(); ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2); ctx.fill()
      if (sm.life <= 0) smokeClouds.splice(i, 1)
    }

    // 6. ACTUALIZAR BALAS
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]
      b.x += b.vx
      b.y += b.vy
      b.distanceTraveled += Math.hypot(b.vx, b.vy)

      ctx.fillStyle = b.isEnemy ? '#ef4444' : '#facc15'
      ctx.beginPath(); ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2); ctx.fill()

      // Choque con muros
      if (checkWallCollision(b.x, b.y, 2) || b.distanceTraveled > b.range) {
        bullets.splice(i, 1)
        continue
      }

      // Bala enemiga -> Jugador
      if (b.isEnemy) {
        if (Math.hypot(player.x - b.x, player.y - b.y) < player.size + 3) {
          playerHealth.value -= b.damage
          bloodStains.push({ x: player.x, y: player.y, r: 10 + Math.random() * 8 })
          bullets.splice(i, 1)
          if (playerHealth.value <= 0) gameState.value = 'GAMEOVER'
          continue
        }
      } else {
        // Bala jugador -> Enemigo
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j]
          if (Math.hypot(e.x - b.x, e.y - b.y) < 16) {
            e.hp -= b.damage
            bloodStains.push({ x: e.x, y: e.y, r: 8 + Math.random() * 6 })
            bullets.splice(i, 1)

            if (e.hp <= 0) {
              enemies.splice(j, 1)
              score.value += 100
              terroristsLeft.value = enemies.length

              // Si mató a todos y rescató al rehén -> Victoria
              if (enemies.length === 0) {
                gameState.value = 'VICTORY'
                if (timerInterval) clearInterval(timerInterval)
              }
            } else {
              e.state = 'alert'
            }
            break
          }
        }
      }
    }

    // 7. IA TERRORISTAS
    enemies.forEach(e => {
      if (e.stunned > 0) {
        e.stunned--
        return
      }

      const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y)
      const canSee = distToPlayer < e.sightRange && hasLineOfSight(e.x, e.y, player.x, player.y)

      if (canSee) {
        e.state = 'attack'
        e.angle = Math.atan2(player.y - e.y, player.x - e.x)

        // Disparo terrorista
        e.shootTimer++
        if (e.shootTimer > (e.isBoss ? 25 : 45)) {
          e.shootTimer = 0
          playSound('gunshot')
          bullets.push({
            x: e.x + Math.cos(e.angle) * 16,
            y: e.y + Math.sin(e.angle) * 16,
            vx: Math.cos(e.angle) * 10,
            vy: Math.sin(e.angle) * 10,
            damage: 18,
            range: 400,
            distanceTraveled: 0,
            isEnemy: true
          })
        }
      } else if (e.state === 'patrol') {
        e.x += e.patrolDir * 0.8
        if (checkWallCollision(e.x + e.patrolDir * 16, e.y, 14)) e.patrolDir *= -1
        e.angle = e.patrolDir === 1 ? 0 : Math.PI
      }

      // Dibujar Terrorista
      ctx.save()
      ctx.translate(e.x, e.y)
      ctx.rotate(e.angle)
      ctx.fillStyle = e.isBoss ? '#b91c1c' : '#dc2626'
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill()
      // Arma terrorista
      ctx.fillStyle = '#111827'; ctx.fillRect(8, 2, 14, 4)
      ctx.restore()

      // Barra de vida
      if (e.hp < e.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(e.x - 14, e.y - 20, 28, 4)
        ctx.fillStyle = '#ef4444'; ctx.fillRect(e.x - 14, e.y - 20, (28 * e.hp) / e.maxHp, 4)
      }
    })

    // 8. DIBUJAR OPERADOR (JUGADOR)
    ctx.save()
    ctx.translate(player.x, player.y)
    ctx.rotate(player.angle)

    // Cono de visión / Linterna táctica
    const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 320)
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.25)')
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, 320, -Math.PI / 5, Math.PI / 5)
    ctx.closePath()
    ctx.fill()

    // Cuerpo Operador SWAT
    ctx.fillStyle = '#1e3a8a'
    ctx.beginPath(); ctx.arc(0, 0, player.size, 0, Math.PI * 2); ctx.fill()

    // Casco
    ctx.fillStyle = '#0f172a'
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill()

    // Arma
    ctx.fillStyle = '#000'
    ctx.fillRect(8, 3, 16, 5)
    ctx.restore()
  }

  // Flashbang overlay
  if (flashEffect > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${flashEffect})`
    ctx.fillRect(0, 0, 800, 600)
    flashEffect -= 0.02
  }

  animationFrameId = requestAnimationFrame(gameLoop)
}

const handleKeyDown = (e) => {
  keys[e.code] = true
  if (e.code === 'KeyR') reload()
  if (e.code === 'KeyF') throwFlashbang()
  if (e.code === 'KeyG') throwSmoke()
}
const handleKeyUp = (e) => { keys[e.code] = false }
const handleMouseMove = (e) => {
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  mouse.x = (e.clientX - rect.left) * (canvasRef.value.width / rect.width)
  mouse.y = (e.clientY - rect.top) * (canvasRef.value.height / rect.height)
}
const handleMouseDown = () => { mouse.isDown = true }
const handleMouseUp = () => { mouse.isDown = false }

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvasRef.value.addEventListener('mousemove', handleMouseMove)
    canvasRef.value.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    gameLoop()
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  if (timerInterval) clearInterval(timerInterval)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div class="tactical-game">
    <!-- HUD TÁCTICO -->
    <header class="tactical-hud">
      <div class="hud-item">
        <span class="label">OBJETIVO TÁCTICO</span>
        <span class="val">Eliminar Amenazas ({{ terroristsLeft }} restantes)</span>
      </div>

      <div class="hud-item">
        <span class="label">ESTADO REHÉN</span>
        <span class="val" :class="{ 'rescued-tag': hostageRescued }">
          {{ hostageRescued ? '✅ RESCATADO' : '⚠️ EN PELIGRO' }}
        </span>
      </div>

      <div class="hud-item">
        <span class="label">MUNICIÓN [R: Recargar]</span>
        <span class="val ammo-val">
          {{ isReloading ? '🔄 RECARGANDO...' : `${currentAmmo} / ${maxAmmo} (Mags: ${totalMags})` }}
        </span>
      </div>

      <div class="hud-item">
        <span class="label">SALUD OPERADOR</span>
        <div class="hp-bar-wrap">
          <div class="hp-bar-fill" :style="{ width: Math.max(0, playerHealth) + '%' }"></div>
        </div>
      </div>

      <div class="hud-item gadgets-wrap">
        <span class="label">GADGETS TÁCTICOS</span>
        <div class="gadget-btns">
          <button class="btn-gadget" :disabled="flashbangs <= 0" @click="throwFlashbang">
            ⚡ Flash [F] ({{ flashbangs }})
          </button>
          <button class="btn-gadget" :disabled="smokes <= 0" @click="throwSmoke">
            💨 Humo [G] ({{ smokes }})
          </button>
        </div>
      </div>
    </header>

    <div class="canvas-wrap">
      <canvas ref="canvasRef" width="800" height="600"></canvas>

      <!-- MENU BREACHING -->
      <div v-if="gameState === 'MENU'" class="overlay">
        <div class="modal">
          <span class="tac-badge">SWAT / CQB TACTICAL SHOOTER</span>
          <h1>🎯 TACTICAL BREACH 2D</h1>
          <p class="sub">Infiltra el complejo hostil, neutraliza a los terroristas y asegura al rehén.</p>

          <div class="loadout-picker">
            <label>Elige tu Armamento Operativo:</label>
            <div class="weapons-grid">
              <div 
                v-for="w in weapons" 
                :key="w.id" 
                class="w-card"
                :class="{ active: selectedWeapon.id === w.id }"
                @click="selectedWeapon = w"
              >
                <div class="w-icon">{{ w.icon }}</div>
                <h4>{{ w.name }}</h4>
                <div class="w-stat">Daño: {{ w.damage }} | Mag: {{ w.magSize }}</div>
              </div>
            </div>
          </div>

          <div class="controls-guide">
            <strong>W/A/S/D</strong>: Moverse | <strong>Ratón</strong>: Apuntar y Disparar | <strong>R</strong>: Recargar | <strong>F</strong>: Flashbang | <strong>G</strong>: Humo
          </div>

          <button class="btn-breach" @click="startMission">🚪 ¡INICIAR INCURSIÓN (BREACH)!</button>
        </div>
      </div>

      <!-- VICTORIA -->
      <div v-if="gameState === 'VICTORY'" class="overlay">
        <div class="modal victory-modal">
          <h1 class="win-title">🏆 ¡MISIÓN CUMPLIDA CON ÉXITO!</h1>
          <p>Amenazas neutralizadas y complejo asegurado en <strong>{{ missionTimer }} segundos</strong>.</p>
          <p>Puntuación táctica: <strong>{{ score }} pts</strong></p>
          <button class="btn-breach" @click="startMission">🔄 Siguiente Operación</button>
        </div>
      </div>

      <!-- DERROTA -->
      <div v-if="gameState === 'GAMEOVER'" class="overlay">
        <div class="modal">
          <h1 class="fail-title">💀 OPERADOR K.I.A. (BAJA EN COMBATE)</h1>
          <p>Fuiste alcanzado por fuego hostil.</p>
          <button class="btn-breach" @click="startMission">🔄 Reintentar Incursión</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tactical-game { max-width: 820px; margin: 0 auto; }

.tactical-hud {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(15, 23, 42, 0.95); padding: 12px 18px; border-radius: 12px; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}
.hud-item { display: flex; flex-direction: column; }
.label { font-size: 0.65rem; color: #94a3b8; font-weight: bold; }
.val { font-size: 1.05rem; font-weight: 800; color: #f8fafc; }
.ammo-val { color: #facc15; }
.rescued-tag { color: #4ade80 !important; }

.hp-bar-wrap { width: 120px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-top: 3px; }
.hp-bar-fill { height: 100%; background: #22c55e; }

.gadget-btns { display: flex; gap: 6px; margin-top: 2px; }
.btn-gadget {
  background: #334155; border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; cursor: pointer;
}
.btn-gadget:disabled { opacity: 0.4; cursor: not-allowed; }

.canvas-wrap { position: relative; width: 100%; aspect-ratio: 4/3; border-radius: 12px; overflow: hidden; border: 1px solid rgba(56, 189, 248, 0.3); }
canvas { width: 100%; height: 100%; display: block; cursor: crosshair; }

.overlay { position: absolute; inset: 0; background: rgba(10, 15, 30, 0.92); backdrop-filter: blur(6px); display: flex; justify-content: center; align-items: center; padding: 20px; }
.modal { background: rgba(30, 41, 59, 0.96); border: 1px solid #38bdf8; border-radius: 16px; padding: 25px; text-align: center; max-width: 580px; width: 100%; }

.tac-badge { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; display: inline-block; margin-bottom: 8px; }
.modal h1 { color: #f8fafc; font-size: 1.8rem; margin-bottom: 6px; }
.win-title { color: #22c55e !important; }
.fail-title { color: #ef4444 !important; }
.sub { color: #94a3b8; font-size: 0.85rem; margin-bottom: 16px; }

.loadout-picker { margin-bottom: 15px; text-align: left; }
.loadout-picker label { font-size: 0.8rem; color: #cbd5e1; font-weight: bold; margin-bottom: 8px; display: block; }
.weapons-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.w-card { background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; text-align: center; cursor: pointer; }
.w-card.active { border-color: #38bdf8; background: rgba(56, 189, 248, 0.15); }
.w-icon { font-size: 1.8rem; margin-bottom: 4px; }
.w-card h4 { font-size: 0.75rem; color: #fff; margin-bottom: 2px; }
.w-stat { font-size: 0.65rem; color: #94a3b8; }

.controls-guide { background: rgba(0,0,0,0.4); padding: 8px; border-radius: 8px; font-size: 0.75rem; color: #cbd5e1; margin-bottom: 16px; }

.btn-breach { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 12px 26px; border-radius: 8px; font-weight: 800; font-size: 1rem; cursor: pointer; }
</style>
