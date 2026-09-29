<script setup>
defineProps({
  currentGame: String
})

defineEmits(['changeGame'])

const gamesList = [
  { id: 'home', title: 'Inicio', icon: '🏠' },
  { id: 'valoran3d2.0', title: 'Valoran3D 2.0', icon: '🔥' },
  { id: 'valorant', title: 'Valorant 2D', icon: '💣' },
  { id: 'tactical', title: 'Tactical Breach', icon: '🎯' },
  { id: 'survivor', title: 'Abyss Survivor', icon: '🔮' },
  { id: 'racing', title: 'Turbo Drift', icon: '🏎️' },
  { id: 'space', title: 'Space Defender', icon: '🚀' },
  { id: 'fight', title: 'Shadow Clash', icon: '🥊' },
  { id: 'tienda', title: 'Tienda Tycoon', icon: '🏪' }
]
</script>

<template>
  <header class="navbar">
    <div class="nav-brand" @click="$emit('changeGame', 'home')">
      <div class="logo-icon-wrap">🎮</div>
      <div>
        <h1 class="nav-title">VUE ARCADE</h1>
        <span class="nav-subtitle">Gaming Hub 6 en 1</span>
      </div>
    </div>

    <nav class="nav-links">
      <button 
        v-for="game in gamesList" 
        :key="game.id"
        class="nav-tab-btn"
        :class="{ active: currentGame === game.id }"
        @click="$emit('changeGame', game.id)"
      >
        <span class="tab-icon">{{ game.icon }}</span>
        <span class="tab-text">{{ game.title }}</span>
      </button>
    </nav>
  </header>
</template>

<style scoped>
.navbar {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.logo-icon-wrap {
  font-size: 1.5rem;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.nav-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: -0.3px;
}

.nav-subtitle {
  font-size: 0.7rem;
  color: #94a3b8;
  display: block;
}

.nav-links {
  display: flex;
  gap: 4px;
  background: rgba(30, 41, 59, 0.6);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  flex-wrap: wrap;
}

.nav-tab-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 7px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s ease;
}

.nav-tab-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.nav-tab-btn.active {
  background: #38bdf8;
  color: #0f172a;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.3);
}
</style>
