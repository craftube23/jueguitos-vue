<script setup>
import { ref } from 'vue'
import Navbar from './components/Navbar.vue'
import HomeLobby from './components/HomeLobby.vue'
import ValorantGame from './games/Valorant2D/ValorantGame.vue'
import Valorant3D2 from './games/Valorant3D2/Valorant3D2.vue'
import TacticalGame from './games/TacticalBreach/TacticalGame.vue'
import SurvivorGame from './games/AbyssSurvivor/SurvivorGame.vue'
import TiendaGame from './games/TiendaTycoon/TiendaGame.vue'
import SpaceGame from './games/SpaceDefender/SpaceGame.vue'
import FightGame from './games/ShadowClash/FightGame.vue'
import RacingGame from './games/TurboRacing/RacingGame.vue'

const activeGame = ref('home')

const setGame = (gameId) => {
  activeGame.value = gameId
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="arcade-app">
    <Navbar :currentGame="activeGame" @changeGame="setGame" />

    <main class="main-content">
      <div v-if="activeGame !== 'home'" class="back-bar">
        <button class="btn-back" @click="setGame('home')">
          ⬅️ Volver al Menú Principal
        </button>
      </div>

      <transition name="fade-slide" mode="out-in">
        <HomeLobby v-if="activeGame === 'home'" key="home" @selectGame="setGame" />
        <Valorant3D2 v-else-if="activeGame === 'valoran3d2.0' || activeGame === 'valorant3d2'" key="valorant3d2" />
        <ValorantGame v-else-if="activeGame === 'valorant'" key="valorant" />
        <TacticalGame v-else-if="activeGame === 'tactical'" key="tactical" />
        <SurvivorGame v-else-if="activeGame === 'survivor'" key="survivor" />
        <TiendaGame v-else-if="activeGame === 'tienda'" key="tienda" />
        <SpaceGame v-else-if="activeGame === 'space'" key="space" />
        <FightGame v-else-if="activeGame === 'fight'" key="fight" />
        <RacingGame v-else-if="activeGame === 'racing'" key="racing" />
      </transition>
    </main>
  </div>
</template>

<style scoped>
.arcade-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 24px;
}

.back-bar {
  max-width: 1100px;
  margin: 0 auto 16px auto;
  display: flex;
}

.btn-back {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-back:hover {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-color: #38bdf8;
  transform: translateX(-3px);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
