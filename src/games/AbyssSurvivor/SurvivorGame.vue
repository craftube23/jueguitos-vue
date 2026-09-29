<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const gameState = ref('MENU') // 'MENU', 'PLAYING', 'LEVEL_UP', 'GAMEOVER'
const timeSurvived = ref(0) // en segundos
const kills = ref(0)
const playerLevel = ref(1)
const playerExp = ref(0)
const expToNextLevel = ref(10)
const playerHp = ref(100)
const maxHp = ref(100)

// 🔮 MEJORAS ROGUELIKE (CARTAS AL SUBIR DE NIVEL)
const availableUpgrades = [
  { id: 'orbital', name: 'Orbe Arcano Giratorio', icon: '🔮', desc: 'Un orbe que gira alrededor tuyo dañando enemigos.', level: 0, max: 4 },
  { id: 'lightning', name: 'Rayo en Cadena', icon: '⚡', desc: 'Descarga rayos automáticos a enemigos cercanos.', level: 0, max: 4 },
  { id: 'aura', name: 'Aura de Fuego', icon: '🔥', desc: 'Quema a todos los monstruos que se acerquen a ti.', level: 0, max: 4 },
  { id: 'speed', name: 'Paso Etéreo', icon: '💨', desc: 'Aumenta tu velocidad de movimiento en +15%.', level: 0, max: 4 },
  { id: 'heal', name: 'Bendición Vital', icon: '💖', desc: 'Recupera 35 HP y aumenta tu vida máxima.', level: 0, max: 4 },
  { id: 'damage', name: 'Poder de las Sombras', icon: '🗡️', desc: 'Tus proyectiles hacen +25% de daño.', level: 0, max: 4 }
]

const levelUpCards = ref([])
const activeUpgrades = ref([])

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

    if (type === 'magic') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.12)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12)
      osc.start(now); osc.stop(now + 0.12)
    } else if (type === 'gem') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.linearRampToValueAtTime(1200, now + 0.08)
      gain.gain.setValueAtTime(0.1, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08)
      osc.start(now); osc.stop(now + 0.08)
    } else if (type === 'hit') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(140, now)
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15)
      osc.start(now); osc.stop(now + 0.15)
    } else if (type === 'levelup') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.linearRampToValueAtTime(880, now + 0.25)
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25)
      osc.start(now); osc.stop(now + 0.25)
    }
  } catch (e) {}
}

const canvasRef = ref(null)
let ctx = null
let animationFrameId = null
let surviveTimerInterval = null
const keys = {}

let player = {
  x: 400,
  y: 300,
  speed: 3.5,
  size: 16,
  facingX: 1,
  facingY: 0
}

let spells = []
let enemies = []
let gems = []
let particles = []
let orbitalAngle = 0
let autoShootTimer = 0
let lightningTimer = 0

const startGame = () => {
  initAudio()
  gameState.value = 'PLAYING'
  timeSurvived.value = 0
  kills.value = 0
  playerLevel.value = 1
  playerExp.value = 0
  expToNextLevel.value = 8
  maxHp.value = 100
  playerHp.value = 100

  player.x = 400
  player.y = 300
  player.speed = 3.5
  spells = []
  enemies = []
  gems = []
  particles = []

  // Reiniciar mejoras
  availableUpgrades.forEach(u => u.level = 0)
  activeUpgrades.value = []

  if (surviveTimerInterval) clearInterval(surviveTimerInterval)
  surviveTimerInterval = setInterval(() => {
    if (gameState.value === 'PLAYING') {
      timeSurvived.value++
      spawnWaveByTime()
    }
  }, 1000)
}

const spawnWaveByTime = () => {
  const count = 3 + Math.floor(timeSurvived.value / 10)
  for (let i = 0; i < count; i++) {
    // Generar fuera de la pantalla
    const angle = Math.random() * Math.PI * 2
    const dist = 500
    const ex = player.x + Math.cos(angle) * dist
    const ey = player.y + Math.sin(angle) * dist

    const rand = Math.random()
    let type = 'bat' // Rápido, poca vida
    let hp = 2 + Math.floor(timeSurvived.value / 25)
    let spd = 2.2
    let size = 12
    let color = '#818cf8'

    if (rand < 0.3) {
      type = 'skeleton' // Normal
      hp = 4 + Math.floor(timeSurvived.value / 20)
      spd = 1.4
      size = 15
      color = '#e2e8f0'
    } else if (rand < 0.5) {
      type = 'slime' // Lento y resistente
      hp = 8 + Math.floor(timeSurvived.value / 15)
      spd = 0.9
      size = 18
      color = '#4ade80'
    }

    enemies.push({
      x: ex,
      y: ey,
      type,
      hp,
      maxHp: hp,
      speed: spd,
      size,
      color
    })
  }
}

const triggerLevelUp = () => {
  gameState.value = 'LEVEL_UP'
  playSound('levelup')

  // Elegir 3 mejoras aleatorias
  const pool = availableUpgrades.filter(u => u.level < u.max)
  const shuffled = [...pool].sort(() => 0.5 - Math.random())
  levelUpCards.value = shuffled.slice(0, 3)
}

const selectUpgrade = (upgrade) => {
  upgrade.level++
  
  if (upgrade.id === 'speed') player.speed += 0.5
  if (upgrade.id === 'heal') {
    maxHp.value += 20
    playerHp.value = Math.min(maxHp.value, playerHp.value + 40)
  }

  // Actualizar lista visible
  if (!activeUpgrades.value.includes(upgrade)) {
    activeUpgrades.value.push(upgrade)
  }

  gameState.value = 'PLAYING'
}

const gameLoop = () => {
  if (!ctx) return

  // 1. DIBUJAR PISO MAZMORRA OSCURA
  ctx.fillStyle = '#090714'
  ctx.fillRect(0, 0, 800, 600)

  // Baldosas tenues de mazmorra
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
  ctx.lineWidth = 1
  for (let x = 0; x < 800; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke()
  }
  for (let y = 0; y < 600; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke()
  }

  if (gameState.value === 'PLAYING') {
    // 2. MOVIMIENTO DEL JUGADOR
    let moveX = 0
    let moveY = 0
    if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1
    if (keys['KeyS'] || keys['ArrowDown']) moveY += 1
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY)
      player.x += (moveX / len) * player.speed
      player.y += (moveY / len) * player.speed
      player.facingX = moveX / len
      player.facingY = moveY / len
    }

    player.x = Math.max(20, Math.min(780, player.x))
    player.y = Math.max(20, Math.min(580, player.y))

    // 3. DISPARO AUTOMÁTICO DE HECHIZOS
    autoShootTimer++
    if (autoShootTimer > 28) {
      autoShootTimer = 0
      // Buscar enemigo más cercano
      let nearest = null
      let minDist = 350
      for (const e of enemies) {
        const d = Math.hypot(e.x - player.x, e.y - player.y)
        if (d < minDist) {
          minDist = d
          nearest = e
        }
      }

      let dirX = player.facingX
      let dirY = player.facingY
      if (nearest) {
        const d = Math.hypot(nearest.x - player.x, nearest.y - player.y)
        dirX = (nearest.x - player.x) / d
        dirY = (nearest.y - player.y) / d
      }

      const dmgLvl = availableUpgrades.find(u => u.id === 'damage').level
      const baseDmg = 2 + dmgLvl * 1.5

      spells.push({
        x: player.x,
        y: player.y,
        vx: dirX * 7,
        vy: dirY * 7,
        damage: baseDmg,
        color: '#c084fc',
        life: 70
      })
      playSound('magic')
    }

    // 4. MEJORA: AURA DE FUEGO
    const auraLvl = availableUpgrades.find(u => u.id === 'aura').level
    if (auraLvl > 0) {
      const radius = 50 + auraLvl * 15
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.25)'
      ctx.fillStyle = 'rgba(249, 115, 22, 0.06)'
      ctx.beginPath(); ctx.arc(player.x, player.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

      // Dañar enemigos dentro del aura
      if (autoShootTimer % 6 === 0) {
        for (const e of enemies) {
          if (Math.hypot(e.x - player.x, e.y - player.y) < radius + e.size) {
            e.hp -= 0.6 * auraLvl
          }
        }
      }
    }

    // 5. MEJORA: ORBES GIRATORIOS (ORBITALS)
    const orbitalLvl = availableUpgrades.find(u => u.id === 'orbital').level
    if (orbitalLvl > 0) {
      orbitalAngle += 0.05
      const orbRadius = 60
      const orbCount = orbitalLvl

      for (let i = 0; i < orbCount; i++) {
        const a = orbitalAngle + (i * (Math.PI * 2 / orbCount))
        const ox = player.x + Math.cos(a) * orbRadius
        const oy = player.y + Math.sin(a) * orbRadius

        ctx.fillStyle = '#38bdf8'
        ctx.shadowBlur = 12; ctx.shadowColor = '#38bdf8'
        ctx.beginPath(); ctx.arc(ox, oy, 8, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0

        // Colisión con enemigos
        for (const e of enemies) {
          if (Math.hypot(e.x - ox, e.y - oy) < e.size + 8) {
            e.hp -= 0.8
            particles.push({ x: ox, y: oy, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, color: '#38bdf8', alpha: 1 })
          }
        }
      }
    }

    // 6. MEJORA: RAYO EN CADENA
    const lightningLvl = availableUpgrades.find(u => u.id === 'lightning').level
    if (lightningLvl > 0) {
      lightningTimer++
      if (lightningTimer > 90 - lightningLvl * 12) {
        lightningTimer = 0
        if (enemies.length > 0) {
          const target = enemies[Math.floor(Math.random() * enemies.length)]
          target.hp -= 4 + lightningLvl * 2
          ctx.strokeStyle = '#facc15'
          ctx.lineWidth = 3
          ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(target.x, target.y); ctx.stroke()
        }
      }
    }

    // 7. MOVER Y DIBUJAR HECHIZOS
    for (let i = spells.length - 1; i >= 0; i--) {
      const s = spells[i]
      s.x += s.vx
      s.y += s.vy
      s.life--

      ctx.fillStyle = s.color
      ctx.shadowBlur = 10; ctx.shadowColor = s.color
      ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0

      // Colisión Hechizo <-> Enemigo
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j]
        if (Math.hypot(s.x - e.x, s.y - e.y) < e.size + 6) {
          e.hp -= s.damage
          spells.splice(i, 1)
          break
        }
      }

      if (s.life <= 0) spells.splice(i, 1)
    }

    // 8. MOVER Y DIBUJAR ENEMIGOS
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]
      const dx = player.x - e.x
      const dy = player.y - e.y
      const dist = Math.hypot(dx, dy)

      if (dist > 0) {
        e.x += (dx / dist) * e.speed
        e.y += (dy / dist) * e.speed
      }

      // Dibujar Enemigo
      ctx.fillStyle = e.color
      ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill()

      // Daño al jugador por contacto
      if (dist < player.size + e.size) {
        playerHp.value -= 0.4
        playSound('hit')
        if (playerHp.value <= 0) {
          gameState.value = 'GAMEOVER'
          if (surviveTimerInterval) clearInterval(surviveTimerInterval)
        }
      }

      // Muerte del enemigo
      if (e.hp <= 0) {
        kills.value++
        // Soltar gema de EXP
        gems.push({ x: e.x, y: e.y, exp: 2 })
        enemies.splice(i, 1)
      }
    }

    // 9. GEMAS DE EXP
    for (let i = gems.length - 1; i >= 0; i--) {
      const g = gems[i]
      const dist = Math.hypot(player.x - g.x, player.y - g.y)

      // Atracción de gemas hacia el jugador (Magnet)
      if (dist < 90) {
        g.x += (player.x - g.x) * 0.15
        g.y += (player.y - g.y) * 0.15
      }

      ctx.fillStyle = '#38bdf8'
      ctx.beginPath(); ctx.arc(g.x, g.y, 4, 0, Math.PI * 2); ctx.fill()

      if (dist < player.size + 4) {
        playSound('gem')
        playerExp.value += g.exp
        gems.splice(i, 1)

        // Subir de nivel
        if (playerExp.value >= expToNextLevel.value) {
          playerLevel.value++
          playerExp.value = 0
          expToNextLevel.value = Math.round(expToNextLevel.value * 1.5)
          triggerLevelUp()
        }
      }
    }

    // 10. DIBUJAR JUGADOR (MAGO OSCURO)
    ctx.save()
    ctx.translate(player.x, player.y)

    // Túnica
    ctx.fillStyle = '#7c3aed'
    ctx.beginPath(); ctx.arc(0, 0, player.size, 0, Math.PI * 2); ctx.fill()

    // Ojos brillantes
    ctx.fillStyle = '#38bdf8'
    ctx.beginPath(); ctx.arc(player.facingX * 5 - 3, player.facingY * 5 - 2, 3, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(player.facingX * 5 + 3, player.facingY * 5 - 2, 3, 0, Math.PI * 2); ctx.fill()

    ctx.restore()
  }

  animationFrameId = requestAnimationFrame(gameLoop)
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
  if (surviveTimerInterval) clearInterval(surviveTimerInterval)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<template>
  <div class="survivor-game">
    <!-- HUD MAZMORRA -->
    <header class="survivor-hud">
      <div class="hud-item">
        <span class="label">TIEMPO VIVO</span>
        <span class="val">{{ Math.floor(timeSurvived / 60) }}m {{ timeSurvived % 60 }}s ⏳</span>
      </div>

      <div class="hud-item">
        <span class="label">BAJAS</span>
        <span class="val kills-val">💀 {{ kills }}</span>
      </div>

      <div class="hud-item">
        <span class="label">NIVEL MAGO</span>
        <span class="val lvl-val">Nv. {{ playerLevel }}</span>
      </div>

      <!-- BARRA DE VIDA -->
      <div class="hud-item bar-box">
        <span class="label">SALUD ({{ Math.round(playerHp) }}/{{ maxHp }})</span>
        <div class="bar-bg"><div class="bar-fill hp" :style="{ width: Math.max(0, (playerHp / maxHp) * 100) + '%' }"></div></div>
      </div>

      <!-- BARRA DE EXP -->
      <div class="hud-item bar-box">
        <span class="label">EXPERIENCIA ALMA</span>
        <div class="bar-bg"><div class="bar-fill exp" :style="{ width: (playerExp / expToNextLevel) * 100 + '%' }"></div></div>
      </div>
    </header>

    <div class="canvas-wrap">
      <canvas ref="canvasRef" width="800" height="600"></canvas>

      <!-- MENU INICIO -->
      <div v-if="gameState === 'MENU'" class="overlay">
        <div class="modal">
          <span class="indie-tag">Roguelike Survivor Indie</span>
          <h1>🔮 ECHOES OF THE ABYSS</h1>
          <p class="sub">Sobrevive a las hordas oscuras, sube de nivel y forja tu build mágica.</p>
          <div class="ctrls"><strong>W / A / S / D</strong> o <strong>Flechas</strong> para Moverte. Los hechizos se disparan solos.</div>
          <button class="btn-start" @click="startGame">🕯️ ENTRAR AL ABISMO</button>
        </div>
      </div>

      <!-- LEVEL UP: ELECCIÓN DE CARTAS ROGUELIKE -->
      <div v-if="gameState === 'LEVEL_UP'" class="overlay">
        <div class="modal levelup-modal">
          <h2 class="levelup-title">✨ ¡SUBIDA DE NIVEL! (Nv. {{ playerLevel }})</h2>
          <p class="sub">Elige una reliquia para potenciar tus poderes mágicos:</p>

          <div class="cards-grid">
            <div 
              v-for="card in levelUpCards" 
              :key="card.id" 
              class="upgrade-card"
              @click="selectUpgrade(card)"
            >
              <div class="upg-icon">{{ card.icon }}</div>
              <h3>{{ card.name }}</h3>
              <span class="upg-lvl">Nv. {{ card.level + 1 }}/{{ card.max }}</span>
              <p class="upg-desc">{{ card.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- GAME OVER -->
      <div v-if="gameState === 'GAMEOVER'" class="overlay">
        <div class="modal">
          <h1 class="dead-title">💀 EL ABISMO TE HA CONSUMIDO</h1>
          <p>Sobreviviste: <strong>{{ Math.floor(timeSurvived / 60) }}m {{ timeSurvived % 60 }}s</strong></p>
          <p>Monstruos eliminados: <strong>{{ kills }}</strong></p>
          <button class="btn-start" @click="startGame">🔄 Reencarnar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.survivor-game { max-width: 820px; margin: 0 auto; }

.survivor-hud {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(15, 23, 42, 0.9); padding: 12px 18px; border-radius: 12px; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;
}
.hud-item { display: flex; flex-direction: column; }
.label { font-size: 0.65rem; color: #94a3b8; font-weight: bold; }
.val { font-size: 1.1rem; font-weight: 800; color: #f8fafc; }
.kills-val { color: #f87171; }
.lvl-val { color: #a855f7; }

.bar-box { min-width: 140px; }
.bar-bg { width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-top: 3px; }
.bar-fill.hp { height: 100%; background: #22c55e; }
.bar-fill.exp { height: 100%; background: #38bdf8; }

.canvas-wrap { position: relative; width: 100%; aspect-ratio: 4/3; border-radius: 12px; overflow: hidden; border: 1px solid rgba(168, 85, 247, 0.3); }
canvas { width: 100%; height: 100%; display: block; }

.overlay { position: absolute; inset: 0; background: rgba(8, 4, 18, 0.92); backdrop-filter: blur(6px); display: flex; justify-content: center; align-items: center; padding: 20px; }
.modal { background: rgba(25, 16, 42, 0.95); border: 1px solid #a855f7; border-radius: 16px; padding: 25px; text-align: center; max-width: 520px; width: 100%; box-shadow: 0 0 30px rgba(168, 85, 247, 0.25); }

.indie-tag { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid #a855f7; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; display: inline-block; margin-bottom: 8px; }
.modal h1 { color: #e2e8f0; font-size: 1.8rem; margin-bottom: 6px; }
.dead-title { color: #ef4444 !important; }
.sub { color: #94a3b8; font-size: 0.85rem; margin-bottom: 16px; }
.ctrls { background: rgba(0,0,0,0.4); padding: 8px; border-radius: 8px; font-size: 0.75rem; color: #cbd5e1; margin-bottom: 16px; }

.btn-start { background: linear-gradient(135deg, #7c3aed, #9333ea); color: white; border: none; padding: 12px 26px; border-radius: 8px; font-weight: 800; font-size: 1rem; cursor: pointer; }

/* CARTAS DE LEVEL UP */
.levelup-modal { max-width: 650px; }
.levelup-title { color: #c084fc; font-size: 1.4rem; margin-bottom: 4px; }
.cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 15px; }

.upgrade-card {
  background: rgba(15, 10, 28, 0.85); border: 2px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 15px 10px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; text-align: center;
}
.upgrade-card:hover { border-color: #38bdf8; background: rgba(56, 189, 248, 0.15); transform: translateY(-4px); }
.upg-icon { font-size: 2.2rem; margin-bottom: 6px; }
.upgrade-card h3 { font-size: 0.9rem; color: #fff; margin-bottom: 2px; }
.upg-lvl { font-size: 0.7rem; color: #facc15; font-weight: bold; margin-bottom: 6px; }
.upg-desc { font-size: 0.75rem; color: #94a3b8; line-height: 1.35; }
</style>
