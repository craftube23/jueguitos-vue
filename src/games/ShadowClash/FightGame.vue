<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const gameState = ref('SELECT')
const currentRound = ref(1)
const timer = ref(60)
const roundAnnouncement = ref('')
const matchWinner = ref('')

const p1Wins = ref(0)
const p2Wins = ref(0)
const p1Hp = ref(100)
const p2Hp = ref(100)
const p1Energy = ref(0)
const p2Energy = ref(0)

const difficulty = ref('Normal')

const characters = ref([
  { id: 'ryu', name: 'KAI (FUEGO)', avatar: '🔥🥋', color: '#38bdf8', power: 4, speed: 3, defense: 3 },
  { id: 'shadow', name: 'RAIDEN (RAYO)', avatar: '⚡🥷', color: '#eab308', power: 3, speed: 5, defense: 2 },
  { id: 'goliath', name: 'TITÁN (ROCA)', avatar: '🪨🛡️', color: '#22c55e', power: 5, speed: 2, defense: 5 }
])

const selectedChar = ref(characters.value[0])
const cpuChar = ref({ id: 'akuma', name: 'VORTEX (CYBORG)', avatar: '🤖💀', color: '#ef4444' })

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

    if (type === 'punch') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(220, now); osc.frequency.exponentialRampToValueAtTime(60, now + 0.1)
      gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.1)
      osc.start(now); osc.stop(now + 0.1)
    } else if (type === 'kick') {
      osc.type = 'square'; osc.frequency.setValueAtTime(160, now); osc.frequency.exponentialRampToValueAtTime(30, now + 0.18)
      gain.gain.setValueAtTime(0.35, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.18)
      osc.start(now); osc.stop(now + 0.18)
    } else if (type === 'special') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(900, now + 0.25)
      gain.gain.setValueAtTime(0.25, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.25)
      osc.start(now); osc.stop(now + 0.25)
    } else if (type === 'block') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.08)
      gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.08)
      osc.start(now); osc.stop(now + 0.08)
    }
  } catch (e) {}
}

const canvasRef = ref(null)
let ctx = null
let animationFrameId = null
let timerInterval = null
const keys = {}
const GROUND_Y = 420

let p1 = { x: 200, y: GROUND_Y, vx: 0, vy: 0, width: 50, height: 90, isGrounded: true, isBlocking: false, isAttacking: false, attackType: null, attackTimer: 0, facing: 1, color: '#38bdf8' }
let p2 = { x: 650, y: GROUND_Y, vx: 0, vy: 0, width: 50, height: 90, isGrounded: true, isBlocking: false, isAttacking: false, attackType: null, attackTimer: 0, facing: -1, color: '#ef4444', aiDecisionTimer: 0 }
let projectiles = []
let particles = []
let screenShake = 0

const startMatch = () => {
  initAudio()
  p1Wins.value = 0
  p2Wins.value = 0
  currentRound.value = 1
  startRound()
}

const startRound = () => {
  gameState.value = 'FIGHTING'
  p1Hp.value = 100
  p2Hp.value = 100
  p1Energy.value = 30
  p2Energy.value = 30
  timer.value = 60
  projectiles = []
  particles = []

  p1.x = 200; p1.y = GROUND_Y; p1.vx = 0; p1.vy = 0; p1.isAttacking = false; p1.isBlocking = false; p1.color = selectedChar.value.color
  p2.x = 650; p2.y = GROUND_Y; p2.vx = 0; p2.vy = 0; p2.isAttacking = false; p2.isBlocking = false

  roundAnnouncement.value = `ROUND ${currentRound.value}`
  setTimeout(() => {
    roundAnnouncement.value = '¡FIGHT! 🥊'
    setTimeout(() => { roundAnnouncement.value = '' }, 1000)
  }, 1000)

  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (gameState.value === 'FIGHTING') {
      timer.value--
      if (timer.value <= 0) checkRoundTimeout()
    }
  }, 1000)
}

const executeAttack = (playerObj, type) => {
  if (playerObj.isAttacking) return
  playerObj.isAttacking = true
  playerObj.attackType = type
  playerObj.attackTimer = type === 'punch' ? 12 : (type === 'kick' ? 18 : 25)

  if (type === 'special') {
    playSound('special')
    projectiles.push({
      x: playerObj.x + (playerObj.facing === 1 ? 40 : -40),
      y: playerObj.y - 45,
      vx: playerObj.facing * 10,
      owner: playerObj === p1 ? 'P1' : 'P2',
      radius: 16,
      color: playerObj === p1 ? '#38bdf8' : '#ef4444'
    })
  } else if (type === 'punch') playSound('punch')
  else if (type === 'kick') playSound('kick')
}

const createHitSparks = (x, y, color = '#facc15') => {
  screenShake = 6
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 6 + 2
    particles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      size: Math.random() * 3 + 2, color, alpha: 1, decay: 0.05
    })
  }
}

const checkMeleeHit = (attacker, defender, targetHp, targetEnergy, isPlayerAttacker) => {
  if (!attacker.isAttacking || attacker.attackTimer !== 8) return
  const range = attacker.attackType === 'kick' ? 75 : 55
  const dist = Math.abs(attacker.x - defender.x)
  const inFront = (attacker.facing === 1 && defender.x > attacker.x) || (attacker.facing === -1 && defender.x < attacker.x)

  if (dist < range && inFront && Math.abs(attacker.y - defender.y) < 60) {
    let damage = attacker.attackType === 'kick' ? 14 : 8
    if (defender.isBlocking) {
      damage = Math.round(damage * 0.25)
      playSound('block')
      createHitSparks(defender.x, defender.y - 45, '#38bdf8')
    } else {
      createHitSparks(defender.x, defender.y - 45, '#facc15')
      defender.vx = attacker.facing * (attacker.attackType === 'kick' ? 9 : 5)
      if (isPlayerAttacker) p1Energy.value = Math.min(100, p1Energy.value + 12)
      else p2Energy.value = Math.min(100, p2Energy.value + 12)
    }
    targetHp.value = Math.max(0, targetHp.value - damage)
    checkRoundEnd()
  }
}

const updateCpuAI = () => {
  p2.aiDecisionTimer--
  const dist = Math.abs(p1.x - p2.x)
  p2.facing = p1.x > p2.x ? 1 : -1

  if (p2.aiDecisionTimer <= 0) {
    const diffRates = {
      'Fácil': { reaction: 35, attackChance: 0.04, blockChance: 0.15 },
      'Normal': { reaction: 20, attackChance: 0.08, blockChance: 0.35 },
      'Difícil': { reaction: 12, attackChance: 0.14, blockChance: 0.65 },
      'Pesadilla': { reaction: 6, attackChance: 0.22, blockChance: 0.90 }
    }[difficulty.value]

    p2.aiDecisionTimer = diffRates.reaction

    if (p1.isAttacking && dist < 85 && Math.random() < diffRates.blockChance) {
      p2.isBlocking = true; p2.vx = 0; return
    } else {
      p2.isBlocking = false
    }

    if (p2Energy.value >= 100 && Math.random() < 0.6) {
      p2Energy.value = 0; executeAttack(p2, 'special'); return
    }

    if (dist < 70) {
      if (Math.random() < diffRates.attackChance * 5) {
        executeAttack(p2, Math.random() < 0.5 ? 'punch' : 'kick')
      }
    } else {
      p2.vx = p1.x > p2.x ? 3.5 : -3.5
      if (Math.random() < 0.03 && p2.isGrounded) {
        p2.vy = -14; p2.isGrounded = false
      }
    }
  }
}

const checkRoundEnd = () => {
  if (gameState.value !== 'FIGHTING') return
  if (p2Hp.value <= 0) handleRoundWin('P1')
  else if (p1Hp.value <= 0) handleRoundWin('P2')
}

const checkRoundTimeout = () => {
  if (p1Hp.value > p2Hp.value) handleRoundWin('P1')
  else if (p2Hp.value > p1Hp.value) handleRoundWin('P2')
  else handleRoundWin('DRAW')
}

const handleRoundWin = (winner) => {
  gameState.value = 'ROUND_END'
  roundAnnouncement.value = '💥 K.O. 💥'
  playSound('kick')

  if (winner === 'P1') p1Wins.value++
  else if (winner === 'P2') p2Wins.value++

  setTimeout(() => {
    if (p1Wins.value >= 2) endMatch('P1')
    else if (p2Wins.value >= 2) endMatch('P2')
    else {
      currentRound.value++
      startRound()
    }
  }, 2000)
}

const endMatch = (winner) => {
  gameState.value = 'GAMEOVER'
  matchWinner.value = winner
}

const gameLoop = () => {
  if (!ctx) return
  ctx.fillStyle = '#0f081d'; ctx.fillRect(0, 0, 900, 500)
  ctx.fillStyle = '#1c0f33'; ctx.fillRect(0, 0, 900, 360)
  ctx.fillStyle = 'rgba(234, 179, 8, 0.15)'; ctx.beginPath(); ctx.arc(450, 180, 100, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#311b54'; ctx.fillRect(0, GROUND_Y, 900, 80)
  ctx.fillStyle = '#eab308'; ctx.fillRect(0, GROUND_Y, 900, 4)

  if (screenShake > 0) {
    ctx.save(); ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake)
    screenShake *= 0.85
  }

  if (gameState.value === 'FIGHTING' || gameState.value === 'ROUND_END') {
    p1.facing = p2.x > p1.x ? 1 : -1
    p1.isBlocking = keys['KeyS'] || keys['ArrowDown']

    if (!p1.isBlocking && !p1.isAttacking) {
      if (keys['KeyA'] || keys['ArrowLeft']) p1.vx = -5
      else if (keys['KeyD'] || keys['ArrowRight']) p1.vx = 5
      else p1.vx *= 0.7

      if ((keys['KeyW'] || keys['ArrowUp']) && p1.isGrounded) {
        p1.vy = -14; p1.isGrounded = false
      }
    } else {
      p1.vx *= 0.7
    }

    p1.y += p1.vy; p1.x += p1.vx
    if (p1.y < GROUND_Y) p1.vy += 0.8
    else { p1.y = GROUND_Y; p1.vy = 0; p1.isGrounded = true }
    p1.x = Math.max(30, Math.min(870, p1.x))

    if (p1.isAttacking) {
      p1.attackTimer--
      checkMeleeHit(p1, p2, p2Hp, p2Energy, true)
      if (p1.attackTimer <= 0) p1.isAttacking = false
    }

    if (gameState.value === 'FIGHTING') updateCpuAI()

    p2.y += p2.vy; p2.x += p2.vx
    if (p2.y < GROUND_Y) p2.vy += 0.8
    else { p2.y = GROUND_Y; p2.vy = 0; p2.isGrounded = true }
    p2.x = Math.max(30, Math.min(870, p2.x))

    if (p2.isAttacking) {
      p2.attackTimer--
      checkMeleeHit(p2, p1, p1Hp, p1Energy, false)
      if (p2.attackTimer <= 0) p2.isAttacking = false
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const pr = projectiles[i]
      pr.x += pr.vx
      ctx.fillStyle = pr.color; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2); ctx.fill()

      const target = pr.owner === 'P1' ? p2 : p1
      const targetHp = pr.owner === 'P1' ? p2Hp : p1Hp
      if (Math.hypot(pr.x - target.x, pr.y - (target.y - 45)) < target.width / 2 + pr.radius) {
        let dmg = 25
        if (target.isBlocking) { dmg = 6; playSound('block') }
        else { target.vx = Math.sign(pr.vx) * 12; playSound('kick') }
        createHitSparks(pr.x, pr.y, pr.color)
        targetHp.value = Math.max(0, targetHp.value - dmg)
        projectiles.splice(i, 1)
        checkRoundEnd()
        continue
      }
      if (pr.x < -30 || pr.x > 930) projectiles.splice(i, 1)
    }

    drawFighter(p1)
    drawFighter(p2)
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

  if (screenShake > 0) ctx.restore()
  animationFrameId = requestAnimationFrame(gameLoop)
}

const drawFighter = (f) => {
  ctx.save(); ctx.translate(f.x, f.y); ctx.scale(f.facing, 1)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2); ctx.fill()

  if (f.isBlocking) {
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(15, -45, 45, -Math.PI / 2, Math.PI / 2); ctx.stroke()
  }

  ctx.fillStyle = f.color; ctx.fillRect(-18, -80, 36, 55)
  ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(0, -92, 16, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = f.color; ctx.fillRect(-16, -98, 32, 6)

  if (f.isAttacking && f.attackType === 'punch') {
    ctx.fillStyle = '#fed7aa'; ctx.fillRect(10, -65, 36, 12)
    ctx.fillStyle = '#fff'; ctx.fillRect(40, -67, 14, 16)
  } else if (f.isAttacking && f.attackType === 'kick') {
    ctx.fillStyle = f.color; ctx.fillRect(5, -45, 42, 14)
    ctx.fillStyle = '#fed7aa'; ctx.fillRect(42, -47, 15, 18)
  } else {
    ctx.fillStyle = '#fed7aa'; ctx.fillRect(10, -68, 14, 25)
  }
  ctx.restore()
}

const handleKeyDown = (e) => {
  keys[e.code] = true
  if (gameState.value === 'FIGHTING') {
    if (e.code === 'KeyJ') executeAttack(p1, 'punch')
    if (e.code === 'KeyK') executeAttack(p1, 'kick')
    if (e.code === 'KeyL' && p1Energy.value >= 100) {
      p1Energy.value = 0
      executeAttack(p1, 'special')
    }
  }
}
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
  if (timerInterval) clearInterval(timerInterval)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<template>
  <div class="fight-game">
    <header class="fight-hud">
      <div class="fighter-hud">
        <div class="fighter-name">{{ selectedChar.name }}</div>
        <div class="hp-bar-outer"><div class="hp-bar-inner" :style="{ width: Math.max(0, p1Hp) + '%' }"></div></div>
        <div class="energy-bar-outer"><div class="energy-bar-inner" :style="{ width: p1Energy + '%' }"></div></div>
      </div>

      <div class="timer-box">
        <div class="round-title">R{{ currentRound }}</div>
        <div class="timer-number">{{ timer }}</div>
      </div>

      <div class="fighter-hud right">
        <div class="fighter-name">{{ cpuChar.name }}</div>
        <div class="hp-bar-outer"><div class="hp-bar-inner cpu-hp" :style="{ width: Math.max(0, p2Hp) + '%' }"></div></div>
        <div class="energy-bar-outer"><div class="energy-bar-inner cpu-energy" :style="{ width: p2Energy + '%' }"></div></div>
      </div>
    </header>

    <div class="arena-container">
      <canvas ref="canvasRef" width="900" height="500"></canvas>
      <div v-if="roundAnnouncement" class="announcement-banner">{{ roundAnnouncement }}</div>

      <div v-if="gameState === 'SELECT'" class="overlay-screen">
        <div class="select-modal">
          <h1>🥊 SHADOW CLASH 2D</h1>
          <p>Selecciona tu luchador:</p>
          <div class="characters-grid">
            <div 
              v-for="c in characters" 
              :key="c.id" 
              class="char-card" 
              :class="{ active: selectedChar.id === c.id }"
              @click="selectedChar = c"
            >
              <div class="char-avatar">{{ c.avatar }}</div>
              <h3>{{ c.name }}</h3>
            </div>
          </div>
          <button class="btn-fight" @click="startMatch">🔥 ¡A PELEAR!</button>
        </div>
      </div>

      <div v-if="gameState === 'GAMEOVER'" class="overlay-screen">
        <div class="select-modal">
          <h1 :class="matchWinner === 'P1' ? 'win-title' : 'lose-title'">
            {{ matchWinner === 'P1' ? '🏆 ¡VICTORIA!' : '💀 DERROTA' }}
          </h1>
          <button class="btn-fight" @click="startMatch">🔄 Revancha</button>
        </div>
      </div>
    </div>

    <!-- CONTROLES ARCADE TÁCTILES MÓVILES -->
    <div v-if="gameState === 'FIGHTING'" class="mobile-touch-bar">
      <div class="virtual-dpad">
        <div></div>
        <button 
          class="dpad-btn" 
          @touchstart.prevent="keys['KeyW'] = true" 
          @touchend.prevent="keys['KeyW'] = false"
          @mousedown="keys['KeyW'] = true"
          @mouseup="keys['KeyW'] = false"
        >⬆️</button>
        <div></div>

        <button 
          class="dpad-btn" 
          @touchstart.prevent="keys['KeyA'] = true" 
          @touchend.prevent="keys['KeyA'] = false"
          @mousedown="keys['KeyA'] = true"
          @mouseup="keys['KeyA'] = false"
        >⬅️</button>
        <button 
          class="dpad-btn" 
          @touchstart.prevent="keys['KeyS'] = true" 
          @touchend.prevent="keys['KeyS'] = false"
          @mousedown="keys['KeyS'] = true"
          @mouseup="keys['KeyS'] = false"
        >🛡️</button>
        <button 
          class="dpad-btn" 
          @touchstart.prevent="keys['KeyD'] = true" 
          @touchend.prevent="keys['KeyD'] = false"
          @mousedown="keys['KeyD'] = true"
          @mouseup="keys['KeyD'] = false"
        >➡️</button>

        <div></div>
        <div></div>
        <div></div>
      </div>

      <div class="virtual-actions">
        <button 
          class="touch-action-btn" 
          style="background: #2563eb;" 
          @click="executeAttack(p1, 'punch')"
        >
          🥊 GOLPE [J]
        </button>
        <button 
          class="touch-action-btn" 
          style="background: #dc2626;" 
          @click="executeAttack(p1, 'kick')"
        >
          🦶 PATADA [K]
        </button>
        <button 
          class="touch-action-btn" 
          :style="{ background: p1Energy >= 100 ? '#f59e0b' : '#475569', opacity: p1Energy >= 100 ? 1 : 0.6 }" 
          :disabled="p1Energy < 100" 
          @click="if (p1Energy >= 100) { p1Energy = 0; executeAttack(p1, 'special') }"
        >
          ⚡ SÚPER [L]
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fight-game { max-width: 900px; margin: 0 auto; }
.fight-hud {
  display: grid; grid-template-columns: 1fr 80px 1fr; gap: 15px; align-items: center;
  background: rgba(0,0,0,0.6); padding: 10px 15px; border-radius: 12px; margin-bottom: 12px;
}
.fighter-hud { display: flex; flex-direction: column; gap: 4px; }
.fighter-hud.right { text-align: right; }
.fighter-name { font-size: 0.95rem; font-weight: 800; color: #38bdf8; }
.fighter-hud.right .fighter-name { color: #ef4444; }

.hp-bar-outer { width: 100%; height: 16px; background: #334155; border-radius: 4px; overflow: hidden; border: 1px solid #fff; }
.hp-bar-inner { height: 100%; background: #22c55e; }
.hp-bar-inner.cpu-hp { background: #ef4444; float: right; }

.energy-bar-outer { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
.energy-bar-inner { height: 100%; background: #38bdf8; }
.energy-bar-inner.cpu-energy { background: #a855f7; float: right; }

.timer-box { text-align: center; }
.round-title { font-size: 0.7rem; color: #eab308; font-weight: bold; }
.timer-number { font-size: 1.8rem; font-weight: 900; color: #fff; }

.arena-container {
  position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; background: #000; border: 1px solid rgba(255,255,255,0.15);
}
canvas { width: 100%; height: 100%; display: block; }

.announcement-banner {
  position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);
  font-size: 3rem; font-weight: 900; color: #eab308; text-shadow: 0 0 20px rgba(234, 179, 8, 0.8);
}

.overlay-screen {
  position: absolute; inset: 0; background: rgba(10, 5, 20, 0.9); display: flex; justify-content: center; align-items: center; padding: 20px;
}
.select-modal {
  background: rgba(30, 20, 45, 0.95); border: 2px solid #eab308; border-radius: 14px; padding: 20px; text-align: center; max-width: 500px; width: 100%;
}
.characters-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0; }
.char-card { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; cursor: pointer; }
.char-card.active { border-color: #eab308; background: rgba(234, 179, 8, 0.15); }
.char-avatar { font-size: 2.2rem; }
.char-card h3 { font-size: 0.85rem; }

.btn-fight {
  background: #eab308; color: #000; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 900; font-size: 1rem; cursor: pointer;
}
.win-title { color: #22c55e; margin-bottom: 12px; }
.lose-title { color: #ef4444; margin-bottom: 12px; }
</style>
