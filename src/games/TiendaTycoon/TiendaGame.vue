<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const nombreTienda = ref('Mercadito Mágico')
const dinero = ref(80)
const ventasTotales = ref(0)
const clientesAtendidos = ref(0)
const nivel = ref(1)

const catalogo = ref([
  { id: 1, nombre: 'Manzana Dulce', emoji: '🍎', precioCompra: 5, precioVenta: 10, nivelMinimo: 1 },
  { id: 2, nombre: 'Pan Fresco', emoji: '🥖', precioCompra: 8, precioVenta: 16, nivelMinimo: 1 },
  { id: 3, nombre: 'Poción de Vida', emoji: '🧪', precioCompra: 18, precioVenta: 35, nivelMinimo: 2 },
  { id: 4, nombre: 'Hamburguesa Pro', emoji: '🍔', precioCompra: 25, precioVenta: 50, nivelMinimo: 2 },
  { id: 5, nombre: 'Espada de Madera', emoji: '🗡️', precioCompra: 50, precioVenta: 100, nivelMinimo: 3 },
  { id: 6, nombre: 'Diamante Brillante', emoji: '💎', precioCompra: 120, precioVenta: 260, nivelMinimo: 4 },
  { id: 7, nombre: 'Huevo de Dragón', emoji: '🥚', precioCompra: 300, precioVenta: 700, nivelMinimo: 5 }
])

const inventario = ref({ 1: 3, 2: 2 })

const mejoras = ref([
  { id: 'robot', icono: '🤖', nombre: 'Robot Ayudante', descripcion: 'Atiende clientes automáticamente cuando hay stock.', costo: 100, nivelActual: 0, maxNivel: 3 },
  { id: 'publicidad', icono: '📢', nombre: 'Campaña de Anuncios', descripcion: 'Atrae clientes más rápido a tu tienda.', costo: 60, nivelActual: 0, maxNivel: 4 },
  { id: 'decoracion', icono: '✨', nombre: 'Decoración Premium', descripcion: 'Los clientes dejan propina extra en cada venta (+15%).', costo: 80, nivelActual: 0, maxNivel: 3 }
])

const clientes = ref([])
const notificaciones = ref([])
const nombresClientes = ['Lucas', 'Sofía', 'Mateo', 'Valentina', 'Santiago', 'Emma', 'Gael', 'Mía', 'Leo', 'Zoe']
const avatares = ['🧙‍♂️', '🧝‍♀️', '🧑‍🚀', '👸', '🤠', '🥷', '👩‍🔬', '🧛‍♂️', '👨‍🍳', '🧚']

let intervals = []

const totalItemsInventario = computed(() => Object.values(inventario.value).reduce((sum, cant) => sum + cant, 0))
const productosDisponiblesPorNivel = computed(() => catalogo.value.filter(p => nivel.value >= p.nivelMinimo))
const intervaloCliente = computed(() => {
  const mejoraPub = mejoras.value.find(m => m.id === 'publicidad').nivelActual
  return Math.max(2500, 6000 - mejoraPub * 900)
})

const mostrarNotificacion = (mensaje, tipo = 'info') => {
  const id = Date.now() + Math.random()
  notificaciones.value.push({ id, mensaje, tipo })
  setTimeout(() => {
    notificaciones.value = notificaciones.value.filter(n => n.id !== id)
  }, 2500)
}

const getStock = (productoId) => inventario.value[productoId] || 0

const comprarProducto = (producto, cantidad = 1) => {
  const costoTotal = producto.precioCompra * cantidad
  if (dinero.value < costoTotal) {
    mostrarNotificacion('¡No tienes suficiente dinero!', 'alerta')
    return
  }
  dinero.value -= costoTotal
  inventario.value[producto.id] = (inventario.value[producto.id] || 0) + cantidad
  mostrarNotificacion(`Compraste ${cantidad}x ${producto.nombre} (-$${costoTotal})`, 'info')
}

const generarCliente = () => {
  if (clientes.value.length >= 4) return
  const pool = productosDisponiblesPorNivel.value
  if (pool.length === 0) return

  const pedido = pool[Math.floor(Math.random() * pool.length)]
  const nombre = nombresClientes[Math.floor(Math.random() * nombresClientes.length)]
  const avatar = avatares[Math.floor(Math.random() * avatares.length)]

  clientes.value.push({
    id: Date.now() + Math.random(),
    nombre,
    avatar,
    pedido,
    paciencia: 100
  })
}

const atenderCliente = (cliente) => {
  const stockActual = getStock(cliente.pedido.id)
  if (stockActual <= 0) {
    mostrarNotificacion(`¡No tienes stock de ${cliente.pedido.nombre}!`, 'alerta')
    return
  }

  inventario.value[cliente.pedido.id]--
  const mejoraDeco = mejoras.value.find(m => m.id === 'decoracion').nivelActual
  const multiplicadorPropina = 1 + (mejoraDeco * 0.15)
  const ganancia = Math.round(cliente.pedido.precioVenta * multiplicadorPropina)

  dinero.value += ganancia
  ventasTotales.value += ganancia
  clientesAtendidos.value++

  clientes.value = clientes.value.filter(c => c.id !== cliente.id)
  mostrarNotificacion(`¡Vendido a ${cliente.nombre}! +$${ganancia}`, 'exito')

  const proximoNivel = Math.floor(clientesAtendidos.value / 5) + 1
  if (proximoNivel > nivel.value && nivel.value < 5) {
    nivel.value = proximoNivel
    mostrarNotificacion(`🎉 ¡SUBISTE AL NIVEL ${nivel.value}!`, 'exito')
  }
}

const comprarMejora = (mejora) => {
  if (dinero.value < mejora.costo || mejora.nivelActual >= mejora.maxNivel) return
  dinero.value -= mejora.costo
  mejora.nivelActual++
  mejora.costo = Math.round(mejora.costo * 1.8)
  mostrarNotificacion(`¡Mejora: ${mejora.nombre} Nv.${mejora.nivelActual}!`, 'exito')
}

const ejecutarRobot = () => {
  const nivelRobot = mejoras.value.find(m => m.id === 'robot').nivelActual
  if (nivelRobot === 0 || clientes.value.length === 0) return
  for (const cliente of clientes.value) {
    if (getStock(cliente.pedido.id) > 0) {
      atenderCliente(cliente)
      break
    }
  }
}

onMounted(() => {
  intervals.push(setInterval(() => {
    for (let i = clientes.value.length - 1; i >= 0; i--) {
      const cliente = clientes.value[i]
      cliente.paciencia -= 2
      if (cliente.paciencia <= 0) {
        clientes.value.splice(i, 1)
        mostrarNotificacion(`${cliente.nombre} se fue 😢`, 'alerta')
      }
    }
  }, 300))

  intervals.push(setInterval(generarCliente, intervaloCliente.value))
  intervals.push(setInterval(ejecutarRobot, 2000))
})

onUnmounted(() => {
  intervals.forEach(clearInterval)
})
</script>

<template>
  <div class="tienda-game">
    <header class="header">
      <div class="brand">
        <h1>🏪 {{ nombreTienda }}</h1>
        <span class="level-badge">Nivel {{ nivel }} ⭐</span>
      </div>

      <div class="stats-bar">
        <div class="stat-item dinero">
          <span class="stat-icon">💰</span>
          <div><div class="stat-label">Dinero</div><div class="stat-value">${{ dinero }}</div></div>
        </div>
        <div class="stat-item">
          <span class="stat-icon">👥</span>
          <div><div class="stat-label">Atendidos</div><div class="stat-value">{{ clientesAtendidos }}</div></div>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📈</span>
          <div><div class="stat-label">Ventas</div><div class="stat-value">${{ ventasTotales }}</div></div>
        </div>
      </div>
    </header>

    <div class="notifications-container">
      <div v-for="notif in notificaciones" :key="notif.id" :class="['notif-pill', notif.tipo]">
        {{ notif.mensaje }}
      </div>
    </div>

    <main class="game-grid">
      <!-- CLIENTES -->
      <section class="game-card clientes-col">
        <div class="card-header">
          <h2>🚶‍♂️ Clientes ({{ clientes.length }}/4)</h2>
          <span class="speed-indicator">⏱️ {{ (intervaloCliente / 1000).toFixed(1) }}s</span>
        </div>

        <div v-if="clientes.length === 0" class="empty-state">
          <p>Esperando clientes... 👀</p>
        </div>

        <div class="clientes-list">
          <div 
            v-for="cliente in clientes" 
            :key="cliente.id" 
            class="cliente-card"
            :class="{ 'paciencia-baja': cliente.paciencia < 30 }"
          >
            <div class="cliente-avatar">{{ cliente.avatar }}</div>
            <div class="cliente-info">
              <div class="cliente-nombre"><strong>{{ cliente.nombre }}</strong></div>
              <div class="cliente-pedido">
                Pide: <span class="pedido-tag">{{ cliente.pedido.emoji }} {{ cliente.pedido.nombre }}</span>
              </div>
              <div class="paciencia-bar">
                <div class="paciencia-fill" :style="{ width: cliente.paciencia + '%' }"></div>
              </div>
            </div>

            <button 
              class="btn-vender"
              :disabled="getStock(cliente.pedido.id) === 0"
              @click="atenderCliente(cliente)"
            >
              <span v-if="getStock(cliente.pedido.id) > 0">Vender (+${{ cliente.pedido.precioVenta }})</span>
              <span v-else class="sin-stock">¡Sin Stock!</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ALMACÉN -->
      <section class="game-card inventario-col">
        <div class="card-header">
          <h2>📦 Almacén y Compras</h2>
          <span class="capacidad-tag">Items: {{ totalItemsInventario }}</span>
        </div>

        <div class="productos-grid">
          <div 
            v-for="prod in catalogo" 
            :key="prod.id" 
            class="producto-card"
            :class="{ bloqueado: nivel < prod.nivelMinimo }"
          >
            <div v-if="nivel < prod.nivelMinimo" class="bloqueado-overlay">
              <span>🔒 Nivel {{ prod.nivelMinimo }}</span>
            </div>

            <div class="producto-emoji">{{ prod.emoji }}</div>
            <div class="producto-detalles">
              <h3>{{ prod.nombre }}</h3>
              <div class="precios-info">
                <span class="costo">Costo: ${{ prod.precioCompra }}</span>
                <span class="venta">Venta: ${{ prod.precioVenta }}</span>
              </div>
              <div class="stock-badge" :class="{ 'stock-cero': getStock(prod.id) === 0 }">
                Stock: <strong>{{ getStock(prod.id) }}</strong>
              </div>
            </div>

            <div class="compra-acciones">
              <button 
                class="btn-comprar"
                :disabled="dinero < prod.precioCompra || nivel < prod.nivelMinimo"
                @click="comprarProducto(prod, 1)"
              >
                +1 (${{ prod.precioCompra }})
              </button>
              <button 
                class="btn-comprar-pack"
                :disabled="dinero < prod.precioCompra * 5 || nivel < prod.nivelMinimo"
                @click="comprarProducto(prod, 5)"
              >
                +5
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- MEJORAS -->
      <section class="game-card mejoras-col">
        <div class="card-header">
          <h2>⚡ Mejoras</h2>
        </div>

        <div class="mejoras-list">
          <div 
            v-for="mejora in mejoras" 
            :key="mejora.id" 
            class="mejora-card"
            :class="{ 'comprada-max': mejora.nivelActual >= mejora.maxNivel }"
          >
            <div class="mejora-icon">{{ mejora.icono }}</div>
            <div class="mejora-info">
              <h4>{{ mejora.nombre }} (Nv. {{ mejora.nivelActual }}/{{ mejora.maxNivel }})</h4>
              <p>{{ mejora.descripcion }}</p>
            </div>

            <button 
              class="btn-upgrade"
              :disabled="mejora.nivelActual >= mejora.maxNivel || dinero < mejora.costo"
              @click="comprarMejora(mejora)"
            >
              <span v-if="mejora.nivelActual < mejora.maxNivel">${{ mejora.costo }}</span>
              <span v-else>MAX ✔️</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.tienda-game { max-width: 1200px; margin: 0 auto; }
.header {
  background: rgba(30, 41, 59, 0.85); padding: 12px 20px; border-radius: 12px;
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand h1 { font-size: 1.3rem; color: #38bdf8; }
.level-badge { background: #f59e0b; color: #000; padding: 3px 8px; border-radius: 15px; font-weight: 800; font-size: 0.75rem; }
.stats-bar { display: flex; gap: 12px; }
.stat-item { display: flex; align-items: center; gap: 6px; background: rgba(15, 23, 42, 0.6); padding: 5px 10px; border-radius: 8px; }
.stat-item.dinero .stat-value { color: #4ade80; font-weight: 800; }
.stat-label { font-size: 0.65rem; color: #94a3b8; }
.stat-value { font-size: 0.95rem; font-weight: 700; }

.notifications-container { position: fixed; top: 85px; right: 20px; z-index: 100; display: flex; flex-direction: column; gap: 6px; }
.notif-pill { padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 0.8rem; }
.notif-pill.exito { background: #16a34a; color: white; }
.notif-pill.alerta { background: #dc2626; color: white; }
.notif-pill.info { background: #0284c7; color: white; }

.game-grid { display: grid; grid-template-columns: 1fr 1.3fr 0.9fr; gap: 15px; }
@media (max-width: 1024px) { .game-grid { grid-template-columns: 1fr; } }

.game-card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 6px; }
.card-header h2 { font-size: 1rem; }
.speed-indicator, .capacidad-tag { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }

.clientes-list { display: flex; flex-direction: column; gap: 8px; }
.empty-state { text-align: center; padding: 25px; color: #94a3b8; }
.cliente-card { background: rgba(15, 23, 42, 0.75); border-radius: 8px; padding: 8px; display: flex; align-items: center; gap: 8px; }
.cliente-avatar { font-size: 1.6rem; }
.cliente-info { flex: 1; }
.cliente-nombre { font-size: 0.85rem; }
.cliente-pedido { font-size: 0.75rem; color: #cbd5e1; }
.pedido-tag { background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 3px; font-weight: bold; }

.paciencia-bar { height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden; margin-top: 3px; }
.paciencia-fill { height: 100%; background: linear-gradient(90deg, #ef4444, #22c55e); }
.btn-vender { background: #22c55e; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 0.75rem; cursor: pointer; }
.btn-vender:disabled { background: #475569; opacity: 0.6; cursor: not-allowed; }

.productos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; }
.producto-card { background: rgba(15, 23, 42, 0.75); border-radius: 8px; padding: 8px; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; }
.producto-card.bloqueado { opacity: 0.4; }
.bloqueado-overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.85); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.75rem; color: #f59e0b; }
.producto-emoji { font-size: 1.6rem; }
.producto-detalles h3 { font-size: 0.8rem; }
.precios-info { display: flex; gap: 4px; font-size: 0.65rem; }
.costo { color: #f87171; }
.venta { color: #4ade80; font-weight: bold; }
.stock-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 1px 5px; border-radius: 3px; font-size: 0.7rem; margin: 4px 0; }
.compra-acciones { display: flex; gap: 4px; width: 100%; }
.btn-comprar { flex: 1; background: #3b82f6; color: white; border: none; padding: 4px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; cursor: pointer; }
.btn-comprar-pack { background: rgba(255,255,255,0.1); color: white; border: none; padding: 4px 6px; border-radius: 4px; font-size: 0.7rem; cursor: pointer; }

.mejoras-list { display: flex; flex-direction: column; gap: 6px; }
.mejora-card { background: rgba(15, 23, 42, 0.75); border-radius: 8px; padding: 8px; display: flex; align-items: center; gap: 8px; }
.mejora-icon { font-size: 1.4rem; }
.mejora-info { flex: 1; }
.mejora-info h4 { font-size: 0.8rem; }
.mejora-info p { font-size: 0.65rem; color: #94a3b8; }
.btn-upgrade { background: #f59e0b; color: #000; border: none; padding: 5px 8px; border-radius: 4px; font-weight: bold; font-size: 0.75rem; cursor: pointer; }
</style>
