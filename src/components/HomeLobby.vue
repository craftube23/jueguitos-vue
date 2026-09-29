<script setup>
import { ref } from 'vue'

const emit = defineEmits(['selectGame'])

const playerProfile = ref({
  name: 'Operador Ghost',
  level: 5,
  exp: 80,
  trophies: 20,
  coins: 520,
  avatar: '🪖'
})

const featuredGame = ref({
  id: 'valorant',
  title: 'Valorant 2D: Spike Rush',
  subtitle: 'Tactical 5v5 Spike Plant & Defuse Shooter',
  tag: '🔥 NUEVO ESTRENO TÁCTICO 5v5',
  desc: 'Elige tu Agente (Jett, Phoenix, Sova, Brimstone), compra tu arsenal en la fase de compra, domina los mapas tácticos con Site A y Site B, y planta o desactiva la Spike con tu equipo.',
  icon: '💣',
  accentColor: '#ff4655'
})

const games = [
  {
    id: 'valorant',
    title: 'Valorant 2D: Spike Rush',
    category: 'Shooter Táctico 5v5',
    desc: 'Elige tu bando (Atacante/Defensor), compra armas tácticas (Vandal, Phantom, Operator), usa habilidades de Agentes y defiende los Sites.',
    icon: '💣',
    badge: 'Nuevo · 5v5',
    rating: '5.0 ⭐',
    difficulty: 'Táctico / Habilidades',
    tags: ['Valorant', 'Spike Plant', 'Habilidades', 'Agentes']
  },
  {
    id: 'tactical',
    title: 'Tactical Breach 2D',
    category: 'Shooter Táctico & CQB',
    desc: 'Shooter táctico top-down. Usa cobertura, granadas flashbang, visión táctica y rescata al rehén.',
    icon: '🎯',
    badge: 'Táctico',
    rating: '5.0 ⭐',
    difficulty: 'Estratégico / Precisión',
    tags: ['Shooter', 'SWAT', 'Sigilo', 'CQB']
  },
  {
    id: 'survivor',
    title: 'Echoes of the Abyss',
    category: 'Roguelike & Sobrevivencia',
    desc: 'Juego indie de mazmorras. Recoge gemas de alma, sube de nivel y elige cartas de hechizo.',
    icon: '🔮',
    badge: 'Indie Roguelike',
    rating: '5.0 ⭐',
    difficulty: 'Progresivo',
    tags: ['Indie', 'Roguelike', 'Magia']
  },
  {
    id: 'racing',
    title: 'Turbo Drift 2D',
    category: 'Velocidad & Reflejos',
    desc: 'Conduce a más de 200 km/h esquivando el tráfico pesado con sistema de nitro y garaje.',
    icon: '🏎️',
    badge: 'Velocidad',
    rating: '4.9 ⭐',
    difficulty: 'Reflejos Rápidos',
    tags: ['Carreras', 'Nitro', 'Drift']
  },
  {
    id: 'space',
    title: 'Space Defender',
    category: 'Arcade & Acción',
    desc: 'Combate oleadas de invasores alienígenas, esquiva proyectiles y destruye jefes gigantes.',
    icon: '🚀',
    badge: 'Hardcore',
    rating: '4.8 ⭐',
    difficulty: 'Desafiante',
    tags: ['Sci-Fi', 'Bullet Hell']
  },
  {
    id: 'fight',
    title: 'Shadow Clash',
    category: 'Lucha 1v1',
    desc: 'Elige a tu maestro marcial y enfréntate a la IA con combos, bloqueos y súper poderes.',
    icon: '🥊',
    badge: 'PvE',
    rating: '4.9 ⭐',
    difficulty: 'Medio',
    tags: ['Combate', 'Física 2D']
  },
  {
    id: 'tienda',
    title: 'Tienda Tycoon',
    category: 'Gestión & Estrategia',
    desc: 'Administra tu tienda mágica, compra mercancía barata y atiende a clientes en tiempo real.',
    icon: '🏪',
    badge: 'Popular',
    rating: '4.9 ⭐',
    difficulty: 'Relajado',
    tags: ['Estrategia', 'Simulación']
  }
]
</script>

<template>
  <div class="home-lobby">
    <!-- HERO PRINCIPAL (DESTACADO TÁCTICO) -->
    <section class="hero-banner">
      <div class="hero-content">
        <span class="hero-tag">{{ featuredGame.tag }}</span>
        <h1 class="hero-title">{{ featuredGame.title }}</h1>
        <p class="hero-desc">{{ featuredGame.desc }}</p>

        <div class="hero-actions">
          <button class="btn-play-hero" @click="$emit('selectGame', featuredGame.id)">
            ▶️ Jugar Spike Rush 5v5
          </button>
          <div class="hero-stat-pill">
            <span>💣 Plantar / Desactivar Spike [4]</span>
            <span>⚡ Habilidades [E, Q, C]</span>
          </div>
        </div>
      </div>

      <div class="hero-art">
        <div class="art-glow"></div>
        <span class="art-emoji">{{ featuredGame.icon }}</span>
      </div>
    </section>

    <!-- CUERPO DEL LOBBY -->
    <div class="lobby-layout">
      <!-- LISTA DE JUEGOS -->
      <section class="games-section">
        <div class="section-title-row">
          <div>
            <h2>🎮 Catálogo de Juegos</h2>
            <p class="section-sub">Selecciona un juego para comenzar la partida al instante:</p>
          </div>
          <span class="total-games-pill">{{ games.length }} Juegos Disponibles</span>
        </div>

        <div class="games-grid">
          <div 
            v-for="game in games" 
            :key="game.id" 
            class="game-hub-card"
            @click="$emit('selectGame', game.id)"
          >
            <div class="card-top">
              <span class="game-icon-large">{{ game.icon }}</span>
              <span class="game-badge">{{ game.badge }}</span>
            </div>

            <div class="card-body">
              <span class="game-cat">{{ game.category }}</span>
              <h3 class="game-name">{{ game.title }}</h3>
              <p class="game-description">{{ game.desc }}</p>

              <div class="tags-row">
                <span v-for="t in game.tags" :key="t" class="tag-pill">{{ t }}</span>
              </div>
            </div>

            <div class="card-footer">
              <span class="game-rating">{{ game.rating }}</span>
              <button class="btn-launch-card">
                Jugar ➜
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- BARRA LATERAL: PERFIL & ACTIVIDAD -->
      <aside class="sidebar-section">
        <div class="profile-card">
          <div class="profile-header">
            <div class="avatar-box">{{ playerProfile.avatar }}</div>
            <div>
              <div class="player-name">{{ playerProfile.name }}</div>
              <div class="player-rank">Nivel {{ playerProfile.level }} • Comandante SWAT</div>
            </div>
          </div>

          <div class="exp-container">
            <div class="exp-label">
              <span>Experiencia</span>
              <span>{{ playerProfile.exp }}%</span>
            </div>
            <div class="exp-bar-bg">
              <div class="exp-bar-fill" :style="{ width: playerProfile.exp + '%' }"></div>
            </div>
          </div>

          <div class="quick-stats-grid">
            <div class="q-stat">
              <span class="q-val">🪙 {{ playerProfile.coins }}</span>
              <span class="q-label">Monedas</span>
            </div>
            <div class="q-stat">
              <span class="q-val">🏆 {{ playerProfile.trophies }}</span>
              <span class="q-label">Trofeos</span>
            </div>
          </div>
        </div>

        <div class="tips-card">
          <h4>💡 Tácticas SWAT</h4>
          <ul>
            <li>En <strong>Tactical Breach</strong>, lanza una <strong>Flashbang [F]</strong> antes de entrar a una habitación con enemigos.</li>
            <li>El arma <strong>MP5 Silenciada</strong> te permite eliminar guardias sin alertar a los demás.</li>
            <li>Recuerda pulsar <strong>[R]</strong> para recargar cuando estés detrás de cobertura.</li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.home-lobby {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.hero-banner {
  background: linear-gradient(135deg, rgba(15, 30, 60, 0.9) 0%, rgba(10, 15, 30, 0.95) 100%);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 20px;
  padding: 35px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.hero-content {
  max-width: 600px;
  z-index: 2;
}

.hero-tag {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  display: inline-block;
  margin-bottom: 12px;
}

.hero-title {
  font-size: 2.4rem;
  font-weight: 900;
  color: #fff;
  margin-bottom: 10px;
  letter-spacing: -0.5px;
}

.hero-desc {
  font-size: 1rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 24px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.btn-play-hero {
  background: #38bdf8;
  color: #0f172a;
  border: none;
  padding: 14px 30px;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(56, 189, 248, 0.4);
}

.btn-play-hero:hover {
  background: #7dd3fc;
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(56, 189, 248, 0.6);
}

.hero-stat-pill {
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.hero-art {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.art-emoji {
  font-size: 7rem;
  z-index: 2;
  filter: drop-shadow(0 15px 25px rgba(0, 0, 0, 0.5));
  animation: float 3s ease-in-out infinite alternate;
}

@keyframes float {
  from { transform: translateY(0px) rotate(0deg); }
  to { transform: translateY(-12px) rotate(3deg); }
}

.art-glow {
  position: absolute;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 1;
}

.lobby-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 25px;
}

@media (max-width: 1024px) {
  .lobby-layout { grid-template-columns: 1fr; }
  .hero-banner { flex-direction: column; text-align: center; }
  .hero-actions { justify-content: center; }
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
}

.section-title-row h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #f8fafc;
}

.section-sub {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-top: 4px;
}

.total-games-pill {
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}

.game-hub-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

.game-hub-card:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(56, 189, 248, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.game-icon-large {
  font-size: 2.5rem;
}

.game-badge {
  background: rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.game-cat {
  font-size: 0.75rem;
  color: #38bdf8;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.game-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: #fff;
  margin: 4px 0 8px 0;
}

.game-description {
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.45;
  margin-bottom: 15px;
}

.tags-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.tag-pill {
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 12px;
}

.game-rating {
  font-size: 0.85rem;
  color: #facc15;
  font-weight: 700;
}

.btn-launch-card {
  background: transparent;
  color: #38bdf8;
  border: none;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: transform 0.15s;
}

.game-hub-card:hover .btn-launch-card {
  transform: translateX(3px);
  color: #7dd3fc;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.profile-card {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 22px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.avatar-box {
  font-size: 2.2rem;
  background: rgba(15, 23, 42, 0.6);
  padding: 8px;
  border-radius: 12px;
}

.player-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: #fff;
}

.player-rank {
  font-size: 0.75rem;
  color: #38bdf8;
}

.exp-container {
  margin-bottom: 18px;
}

.exp-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 6px;
}

.exp-bar-bg {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.exp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #818cf8);
}

.quick-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.q-stat {
  background: rgba(15, 23, 42, 0.6);
  padding: 10px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.q-val {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
}

.q-label {
  font-size: 0.7rem;
  color: #94a3b8;
}

.tips-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
}

.tips-card h4 {
  font-size: 0.95rem;
  color: #cbd5e1;
  margin-bottom: 10px;
}

.tips-card ul {
  padding-left: 18px;
  font-size: 0.8rem;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 8px;
  line-height: 1.4;
}
</style>
