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
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) audioCtx = new AudioContextClass()
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
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
      osc.frequency.setValueAtTime(480, now)
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12)
      gain.gain.setValueAtTime(0.35, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12)
      osc.start(now); osc.stop(now + 0.12)
    } else if (type === 'shotgun') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(250, now)
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2)
      gain.gain.setValueAtTime(0.5, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2)
      osc.start(now); osc.stop(now + 0.2)
    } else if (type === 'silenced') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(280, now)
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.07)
      gain.gain.setValueAtTime(0.18, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.07)
      osc.start(now); osc.stop(now + 0.07)
    } else if (type === 'reload') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.linearRampToValueAtTime(620, now + 0.12)
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12)
      osc.start(now); osc.stop(now + 0.12)
    } else if (type === 'flash') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1100, now)
      osc.frequency.linearRampToValueAtTime(100, now + 0.6)
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.6)
      osc.start(now); osc.stop(now + 0.6)
    } else if (type === 'rescue') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25, now) // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1) // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2) // G5
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4)
      osc.start(now); osc.stop(now + 0.4)
    } else if (type === 'hit') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1)
      osc.start(now); osc.stop(now + 0.1)
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
const player = {
  x: 90,
  y: 90,
  angle: 0,
  speed: 3.2,
  size: 14
}

// MAPA TÁCTICO: MUROS Y HABITACIONES CQB
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
  { x: 120, y: 280, w: 45, h: 45 },
  { x: 380, y: 120, w: 50, h: 50 },
  { x: 650, y: 400, w: 60, h: 40 },
  { x: 680, y: 160, w: 45, h: 45 }
]

let enemies = []
let bullets = []
let bloodStains = []
let smokeClouds = []
let hitSparks = []
let flashEffect = 0
const hostage = { x: 700, y: 100, rescued: false, size: 13 }

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

  player.x = 90
  player.y = 90
  player.angle = 0
  bullets = []
  bloodStains = []
  smokeClouds = []
  hitSparks = []
  flashEffect = 0
  hostage.rescued = false

  // Generar Terroristas en distintas habitaciones
  enemies = [
    { x: 180, y: 220, hp: 60, maxHp: 60, angle: 0, state: 'patrol', patrolDir: 1, sightRange: 260, stunned: 0, shootTimer: 0 },
    { x: 380, y: 80, hp: 70, maxHp: 70, angle: Math.PI / 2, state: 'guard', sightRange: 300, stunned: 0, shootTimer: 0 },
    { x: 400, y: 240, hp: 60, maxHp: 60, angle: Math.PI, state: 'patrol', patrolDir: -1, sightRange: 280, stunned: 0, shootTimer: 0 },
    { x: 400, y: 450, hp: 80, maxHp: 80, angle: 0, state: 'guard', sightRange: 300, stunned: 0, shootTimer: 0 },
    { x: 680, y: 480, hp: 70, maxHp: 70, angle: -Math.PI / 2, state: 'patrol', patrolDir: 1, sightRange: 280, stunned: 0, shootTimer: 0 },
    { x: 660, y: 100, hp: 110, maxHp: 110, angle: Math.PI, state: 'guard', isBoss: true, sightRange: 330, stunned: 0, shootTimer: 0 } // Guardia del rehén
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
    if (totalMags.value > 0) {
      totalMags.value--
      currentAmmo.value = maxAmmo.value
    }
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
    if (dist < 420) {
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
    radius: 80,
    life: 550
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

  if (w.id === 'shotgun') playSound('shotgun')
  else if (w.silenced) playSound('silenced')
  else playSound('gunshot')

  const count = w.pellets || 1
  for (let i = 0; i < count; i++) {
    const spreadAngle = (Math.random() - 0.5) * w.spread
    const finalAngle = player.angle + spreadAngle
    bullets.push({
      x: player.x + Math.cos(player.angle) * 18,
      y: player.y + Math.sin(player.angle) * 18,
      vx: Math.cos(finalAngle) * 17,
      vy: Math.sin(finalAngle) * 17,
      damage: w.damage,
      range: w.range,
      distanceTraveled: 0,
      isEnemy: false
    })
  }

  // Alerta sonora a enemigos si el arma no es silenciada
  if (!w.silenced) {
    enemies.forEach(e => {
      if (Math.hypot(e.x - player.x, e.y - player.y) < 440) {
        e.state = 'alert'
      }
    })
  }
}

// COLISIÓN CON MUROS
const checkWallCollision = (x, y, radius = 14) => {
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
  const steps = 30
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
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, 800, 600)

  // Baldosas CQB
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1
  for (let x = 0; x < 800; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke()
  }
  for (let y = 0; y < 600; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke()
  }

  // Manchas de sangre
  bloodStains.forEach(b => {
    ctx.fillStyle = 'rgba(185, 28, 28, 0.65)'
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill()
  })

  // 2. DIBUJAR MUROS
  ctx.fillStyle = '#334155'
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 2
  walls.forEach(w => {
    ctx.fillRect(w.x, w.y, w.w, w.h)
    ctx.strokeRect(w.x, w.y, w.w, w.h)
  })

  // 3. REHÉN
  if (!hostage.rescued) {
    ctx.save()
    ctx.fillStyle = '#38bdf8'
    ctx.beginPath(); ctx.arc(hostage.x, hostage.y, hostage.size, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#bae6fd'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('REHÉN 🛡️', hostage.x, hostage.y - 18)
    ctx.restore()

    if (Math.hypot(player.x - hostage.x, player.y - hostage.y) < 38) {
      hostage.rescued = true
      hostageRescued.value = true
      score.value += 500
      playSound('rescue')

      if (enemies.length === 0) {
        gameState.value = 'VICTORY'
        if (timerInterval) clearInterval(timerInterval)
      }
    }
  }

  if (gameState.value === 'PLAYING') {
    // 4. MOVIMIENTO OPERADOR
    let mx = 0, my = 0
    if (keys['KeyW'] || keys['ArrowUp'] || keys['w'] || keys['arrowup']) my -= 1
    if (keys['KeyS'] || keys['ArrowDown'] || keys['s'] || keys['arrowdown']) my += 1
    if (keys['KeyA'] || keys['ArrowLeft'] || keys['a'] || keys['arrowleft']) mx -= 1
    if (keys['KeyD'] || keys['ArrowRight'] || keys['d'] || keys['arrowright']) mx += 1

    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my)
      const stepX = (mx / len) * player.speed
      const stepY = (my / len) * player.speed

      if (!checkWallCollision(player.x + stepX, player.y, player.size)) player.x += stepX
      if (!checkWallCollision(player.x, player.y + stepY, player.size)) player.y += stepY
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
      ctx.beginPath(); ctx.arc(b.x, b.y, b.isEnemy ? 2.5 : 3.0, 0, Math.PI * 2); ctx.fill()

      // Choque con muros
      if (checkWallCollision(b.x, b.y, 2) || b.distanceTraveled > b.range) {
        bullets.splice(i, 1)
        continue
      }

      // Bala enemiga -> Jugador
      if (b.isEnemy) {
        if (Math.hypot(player.x - b.x, player.y - b.y) < player.size + 3) {
          playerHealth.value -= b.damage
          playSound('hit')
          bloodStains.push({ x: player.x, y: player.y, r: 10 + Math.random() * 8 })
          bullets.splice(i, 1)
          if (playerHealth.value <= 0) {
            playerHealth.value = 0
            gameState.value = 'GAMEOVER'
            if (timerInterval) clearInterval(timerInterval)
          }
          continue
        }
      } else {
        // Bala jugador -> Enemigo
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j]
          if (Math.hypot(e.x - b.x, e.y - b.y) < 18) {
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
              e.state = 'attack'
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
        // Icono de aturdido
        ctx.fillStyle = '#ffd700'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('💫', e.x, e.y - 22)
        return
      }

      const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y)
      const canSee = distToPlayer < e.sightRange && hasLineOfSight(e.x, e.y, player.x, player.y)

      if (canSee) {
        e.state = 'attack'
        e.angle = Math.atan2(player.y - e.y, player.x - e.x)

        // Disparo terrorista
        e.shootTimer++
        if (e.shootTimer > (e.isBoss ? 28 : 48)) {
          e.shootTimer = 0
          playSound('gunshot')
          bullets.push({
            x: e.x + Math.cos(e.angle) * 16,
            y: e.y + Math.sin(e.angle) * 16,
            vx: Math.cos(e.angle) * 10,
            vy: Math.sin(e.angle) * 10,
            damage: 16,
            range: 400,
            distanceTraveled: 0,
            isEnemy: true
          })
        }
      } else if (e.state === 'patrol') {
        e.x += e.patrolDir * 0.9
        if (checkWallCollision(e.x + e.patrolDir * 16, e.y, 14)) e.patrolDir *= -1
        e.angle = e.patrolDir === 1 ? 0 : Math.PI
      }

      // Dibujar Terrorista
      ctx.save()
      ctx.translate(e.x, e.y)
      ctx.rotate(e.angle)
      ctx.fillStyle = e.isBoss ? '#991b1b' : '#dc2626'
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#f87171'
      ctx.lineWidth = 1.5
      ctx.stroke()
      // Arma terrorista
      ctx.fillStyle = '#0f172a'; ctx.fillRect(8, 2, 14, 4)
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

    // Cono de visión táctica / Linterna
    const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 320)
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.28)')
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, 320, -Math.PI / 5, Math.PI / 5)
    ctx.closePath()
    ctx.fill()

    // Línea láser táctica
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(14, 4)
    ctx.lineTo(360, 4)
    ctx.stroke()

    // Cuerpo Operador SWAT
    ctx.fillStyle = '#1e3a8a'
    ctx.beginPath(); ctx.arc(0, 0, player.size, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Casco
    ctx.fillStyle = '#0f172a'
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill()

    // Arma
    ctx.fillStyle = '#020617'
    ctx.fillRect(8, 2, 16, 5)
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
  if (e.key) keys[e.key.toLowerCase()] = true
  if (e.code === 'KeyR' || e.key?.toLowerCase() === 'r') reload()
  if (e.code === 'KeyF' || e.key?.toLowerCase() === 'f') throwFlashbang()
  if (e.code === 'KeyG' || e.key?.toLowerCase() === 'g') throwSmoke()
}

const handleKeyUp = (e) => {
  keys[e.code] = false
  if (e.key) keys[e.key.toLowerCase()] = false
}

const handleMouseMove = (e) => {
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  mouse.x = (e.clientX - rect.left) * (canvasRef.value.width / rect.width)
  mouse.y = (e.clientY - rect.top) * (canvasRef.value.height / rect.height)
}

const handleMouseDown = () => {
  mouse.isDown = true
  initAudio()
}

const handleMouseUp = () => {
  mouse.isDown = false
}

const handleTouchMove = (e) => {
  if (!canvasRef.value || e.touches.length === 0) return
  const touch = e.touches[0]
  const rect = canvasRef.value.getBoundingClientRect()
  mouse.x = (touch.clientX - rect.left) * (canvasRef.value.width / rect.width)
  mouse.y = (touch.clientY - rect.top) * (canvasRef.value.height / rect.height)
}

const handleTouchStart = (e) => {
  if (!canvasRef.value || e.touches.length === 0) return
  handleTouchMove(e)
  mouse.isDown = true
  initAudio()
}

const handleTouchEnd = () => {
  mouse.isDown = false
}

const setKey = (code, val) => {
  keys[code] = val
  initAudio()
}

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    canvasRef.value.addEventListener('mousedown', handleMouseDown)
    canvasRef.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    canvasRef.value.addEventListener('touchmove', handleTouchMove, { passive: true })
    canvasRef.value.addEventListener('touchend', handleTouchEnd)
    gameLoop()
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  if (timerInterval) clearInterval(timerInterval)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('mousemove', handleMouseMove)
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

    <!-- CONTROLES TÁCTILES MÓVILES -->
    <div v-if="gameState === 'PLAYING'" class="mobile-touch-bar">
      <div class="virtual-dpad">
        <div></div>
        <button 
          class="dpad-btn" 
          @touchstart.prevent="setKey('KeyW', true)" 
          @touchend.prevent="setKey('KeyW', false)"
          @mousedown="setKey('KeyW', true)"
          @mouseup="setKey('KeyW', false)"
        >⬆️</button>
        <div></div>

        <button 
          class="dpad-btn" 
          @touchstart.prevent="setKey('KeyA', true)" 
          @touchend.prevent="setKey('KeyA', false)"
          @mousedown="setKey('KeyA', true)"
          @mouseup="setKey('KeyA', false)"
        >⬅️</button>
        <button 
          class="dpad-btn" 
          @touchstart.prevent="setKey('KeyS', true)" 
          @touchend.prevent="setKey('KeyS', false)"
          @mousedown="setKey('KeyS', true)"
          @mouseup="setKey('KeyS', false)"
        >⬇️</button>
        <button 
          class="dpad-btn" 
          @touchstart.prevent="setKey('KeyD', true)" 
          @touchend.prevent="setKey('KeyD', false)"
          @mousedown="setKey('KeyD', true)"
          @mouseup="setKey('KeyD', false)"
        >➡️</button>

        <div></div>
        <div></div>
        <div></div>
      </div>

      <div class="virtual-actions">
        <button 
          class="touch-action-btn btn-fire-touch" 
          @touchstart.prevent="mouse.isDown = true" 
          @touchend.prevent="mouse.isDown = false"
          @mousedown="mouse.isDown = true"
          @mouseup="mouse.isDown = false"
        >
          🔴 FUEGO
        </button>
        <button class="touch-action-btn btn-reload-touch" @click="reload">
          🔄 RECARGA
        </button>
        <button class="touch-action-btn" :disabled="flashbangs <= 0" @click="throwFlashbang">
          ⚡ FLASH
        </button>
        <button class="touch-action-btn" :disabled="smokes <= 0" @click="throwSmoke">
          💨 HUMO
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tactical-game {
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
}

.tactical-hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.95);
  padding: 12px 18px;
  border-radius: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
  border: 1px solid rgba(56, 189, 248, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.hud-item { display: flex; flex-direction: column; }
.label { font-size: 0.65rem; color: #94a3b8; font-weight: bold; letter-spacing: 0.5px; }
.val { font-size: 1.05rem; font-weight: 800; color: #f8fafc; }
.ammo-val { color: #facc15; }
.rescued-tag { color: #4ade80 !important; }

.hp-bar-wrap { width: 120px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-top: 3px; }
.hp-bar-fill { height: 100%; background: #22c55e; transition: width 0.15s ease; }

.gadget-btns { display: flex; gap: 6px; margin-top: 2px; }
.btn-gadget {
  background: #334155;
  border: 1px solid rgba(255,255,255,0.1);
  color: #cbd5e1;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-gadget:hover:not(:disabled) {
  background: #475569;
  color: #38bdf8;
  border-color: #38bdf8;
}
.btn-gadget:disabled { opacity: 0.4; cursor: not-allowed; }

.canvas-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(56, 189, 248, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  background: #000;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: crosshair;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 15, 30, 0.92);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  z-index: 20;
}

.modal {
  background: rgba(30, 41, 59, 0.96);
  border: 1px solid #38bdf8;
  border-radius: 16px;
  padding: 25px;
  text-align: center;
  max-width: 580px;
  width: 100%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
}

.tac-badge {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border: 1px solid #38bdf8;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  display: inline-block;
  margin-bottom: 8px;
}

.modal h1 { color: #f8fafc; font-size: 1.8rem; margin-bottom: 6px; }
.win-title { color: #22c55e !important; }
.fail-title { color: #ef4444 !important; }
.sub { color: #94a3b8; font-size: 0.85rem; margin-bottom: 16px; }

.loadout-picker { margin-bottom: 15px; text-align: left; }
.loadout-picker label { font-size: 0.8rem; color: #cbd5e1; font-weight: bold; margin-bottom: 8px; display: block; }
.weapons-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.w-card {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}
.w-card:hover {
  background: rgba(56, 189, 248, 0.08);
  transform: translateY(-2px);
}
.w-card.active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}
.w-icon { font-size: 1.8rem; margin-bottom: 4px; }
.w-card h4 { font-size: 0.75rem; color: #fff; margin-bottom: 2px; }
.w-stat { font-size: 0.65rem; color: #94a3b8; }

.controls-guide {
  background: rgba(0,0,0,0.4);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  color: #cbd5e1;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.btn-breach {
  background: linear-gradient(135deg, #0284c7, #2563eb);
  color: white;
  border: none;
  padding: 12px 26px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-breach:hover {
  transform: scale(1.03);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
}

/* CONTROLES MÓVILES */
.mobile-touch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  touch-action: manipulation;
}

.virtual-dpad {
  display: grid;
  grid-template-columns: repeat(3, 46px);
  grid-template-rows: repeat(3, 46px);
  gap: 4px;
}

.dpad-btn {
  background: rgba(51, 65, 85, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 8px;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
}
.dpad-btn:active {
  background: #38bdf8;
  color: #000;
}

.virtual-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.touch-action-btn {
  padding: 10px 14px;
  background: #334155;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  font-weight: 800;
  font-size: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
}
.btn-fire-touch {
  background: #dc2626;
  grid-column: span 2;
  font-size: 0.9rem;
}
.btn-fire-touch:active { background: #ef4444; }
.btn-reload-touch { background: #d97706; }
</style>
