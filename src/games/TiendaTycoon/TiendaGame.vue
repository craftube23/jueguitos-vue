<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'

// --- PROCEDURAL AUDIO SYSTEM (Web Audio API) ---
class SoundFx {
  constructor() {
    this.ctx = null
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) this.ctx = new AudioContext()
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }
  playTone(freq, type = 'sine', duration = 0.12, gainVal = 0.15) {
    try {
      this.init()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + duration)
    } catch (e) {}
  }
  playCoin() {
    this.playTone(880, 'triangle', 0.08, 0.12)
    setTimeout(() => this.playTone(1320, 'triangle', 0.12, 0.15), 50)
  }
  playBuy() {
    this.playTone(440, 'sine', 0.05, 0.1)
    setTimeout(() => this.playTone(554.37, 'sine', 0.07, 0.12), 40)
  }
  playUpgrade() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.16, 0.14), i * 65)
    })
  }
  playLevelUp() {
    [440, 554.37, 659.25, 880, 1108.73, 1318.5, 1760].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.22, 0.15), i * 70)
    })
  }
  playAlarm() {
    this.playTone(700, 'sawtooth', 0.15, 0.25)
    setTimeout(() => this.playTone(450, 'sawtooth', 0.18, 0.25), 120)
  }
  playTaserHit() {
    this.playTone(220, 'square', 0.08, 0.2)
    setTimeout(() => this.playTone(660, 'sawtooth', 0.1, 0.22), 50)
  }
  playCatch() {
    this.playTone(300, 'triangle', 0.08, 0.25)
    setTimeout(() => this.playTone(800, 'triangle', 0.2, 0.25), 70)
  }
  playClean() {
    this.playTone(520, 'sine', 0.06, 0.1)
    setTimeout(() => this.playTone(740, 'sine', 0.08, 0.1), 50)
  }
  playCombo(streak) {
    const baseFreq = 440 + Math.min(streak * 60, 900)
    this.playTone(baseFreq, 'sine', 0.1, 0.15)
  }
  playError() {
    this.playTone(160, 'sawtooth', 0.18, 0.18)
  }
  playPrestige() {
    [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093.0].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.25, 0.18), i * 60)
    })
  }
}
const sfx = new SoundFx()

// --- GAME STATE ---
const nombreTienda = ref('Mercadito Mágico')
const dinero = ref(150)
const ventasTotales = ref(0)
const clientesAtendidos = ref(0)
const clientesPerdidos = ref(0)
const ladronesAtrapados = ref(0)
const nivel = ref(1)
const xp = ref(0)
const comboStreak = ref(0)
let comboResetTimer = null

// Prestige / Ascension System
const nivelPrestigio = ref(0)
const gemasPrestigio = ref(0)

// Store Maintenance & Difficulties
const suciedadTienda = ref(0) // 0 to 100%
const generadorBloqueado = ref(false)
const toquesGenerador = ref(0)
const tiempoHastaAlquiler = ref(50) // seconds countdown

// Store Titles & Ranks by Level (20 Total Tiers)
const rangosTienda = [
  { nivel: 1, titulo: 'Puesto Callejero', icono: '⛺', color: '#94a3b8', peligro: 'Tranquilo' },
  { nivel: 2, titulo: 'Kiosko de Barrio', icono: '🎪', color: '#38bdf8', peligro: 'Fácil' },
  { nivel: 3, titulo: 'Bodega Mágica', icono: '🏪', color: '#4ade80', peligro: 'Fácil' },
  { nivel: 4, titulo: 'Minimarket Urbano', icono: '🛒', color: '#a855f7', peligro: 'Moderado' },
  { nivel: 5, titulo: 'Supermercado Express', icono: '🏬', color: '#f59e0b', peligro: 'Moderado' },
  { nivel: 6, titulo: 'Centro Comercial Cyber', icono: '🏙️', color: '#ec4899', peligro: 'Desafiante' },
  { nivel: 7, titulo: 'Mega Plaza Radianite', icono: '💎', color: '#06b6d4', peligro: 'Desafiante' },
  { nivel: 8, titulo: 'Hyperstore Tecnológica', icono: '🚀', color: '#10b981', peligro: 'Intenso' },
  { nivel: 9, titulo: 'Emporio Interdimensional', icono: '🌌', color: '#8b5cf6', peligro: 'Intenso' },
  { nivel: 10, titulo: 'Megacorporación Galáctica', icono: '🪐', color: '#f97316', peligro: 'Difícil' },
  { nivel: 11, titulo: 'Sindicato de Comercio Cósmico', icono: '🛸', color: '#e11d48', peligro: 'Difícil' },
  { nivel: 12, titulo: 'Monopolio Planetario', icono: '🌐', color: '#eab308', peligro: 'Muy Difícil' },
  { nivel: 13, titulo: 'Bóveda de Agujeros Negros', icono: '🕳️', color: '#6366f1', peligro: 'Muy Difícil' },
  { nivel: 14, titulo: 'Bazar Interestelar Pro', icono: '✨', color: '#14b8a6', peligro: 'Pesadilla' },
  { nivel: 15, titulo: 'Fortaleza Comercial Titán', icono: '🏰', color: '#d946ef', peligro: 'Pesadilla' },
  { nivel: 16, titulo: 'Conglomerado Quántico', icono: '🔮', color: '#0ea5e9', peligro: 'Extremo' },
  { nivel: 17, titulo: 'Flota Mercante Galáctica', icono: '🛸', color: '#f43f5e', peligro: 'Extremo' },
  { nivel: 18, titulo: 'Imperio Multiversal', icono: '🌀', color: '#a855f7', peligro: 'Caos Total' },
  { nivel: 19, titulo: 'Panteón de Comercio Divino', icono: '⚡', color: '#fbbf24', peligro: 'Infierno' },
  { nivel: 20, titulo: 'DIOS SUPREMO DEL COMERCIO', icono: '👑', color: '#ef4444', peligro: 'INFIERNO ABSOLUTO' }
]

const rangoActual = computed(() => {
  const r = rangosTienda.slice().reverse().find(x => nivel.value >= x.nivel)
  return r || rangosTienda[0]
})

const xpRequerido = computed(() => {
  return Math.round(nivel.value * 90 + Math.pow(nivel.value, 1.95) * 55)
})

// Cost of Store Rent / Upkeep
const costoAlquiler = computed(() => {
  if (nivel.value <= 2) return 0
  return Math.round(Math.pow(nivel.value, 2.2) * 12)
})

// Multipliers from Prestige
const multiplicadorPrestigio = computed(() => {
  return 1 + (gemasPrestigio.value * 0.25)
})

// --- PRODUCT CATALOG (25 Expanded Items across 20 Levels) ---
const catalogo = ref([
  { id: 1, nombre: 'Manzana Dulce', emoji: '🍎', precioCompra: 4, precioVenta: 9, nivelMinimo: 1, categoria: 'Comida' },
  { id: 2, nombre: 'Pan Artesanal', emoji: '🥖', precioCompra: 8, precioVenta: 18, nivelMinimo: 1, categoria: 'Comida' },
  { id: 3, nombre: 'Leche Mágica', emoji: '🥛', precioCompra: 14, precioVenta: 30, nivelMinimo: 1, categoria: 'Bebidas' },
  { id: 4, nombre: 'Poción de Vida', emoji: '🧪', precioCompra: 22, precioVenta: 50, nivelMinimo: 2, categoria: 'Alquimia' },
  { id: 5, nombre: 'Café Espresso Pro', emoji: '☕', precioCompra: 32, precioVenta: 72, nivelMinimo: 2, categoria: 'Bebidas' },
  { id: 6, nombre: 'Hamburguesa Doble', emoji: '🍔', precioCompra: 48, precioVenta: 110, nivelMinimo: 3, categoria: 'Comida' },
  { id: 7, nombre: 'Espada de Madera', emoji: '🗡️', precioCompra: 75, precioVenta: 175, nivelMinimo: 3, categoria: 'Armamento' },
  { id: 8, nombre: 'Bebida Radianite', emoji: '⚡', precioCompra: 110, precioVenta: 260, nivelMinimo: 4, categoria: 'Bebidas' },
  { id: 9, nombre: 'Pizza Familiar', emoji: '🍕', precioCompra: 160, precioVenta: 380, nivelMinimo: 4, categoria: 'Comida' },
  { id: 10, nombre: 'Dron Repartidor', emoji: '🛸', precioCompra: 250, precioVenta: 600, nivelMinimo: 5, categoria: 'Tecnología' },
  { id: 11, nombre: 'Diamante Puro', emoji: '💎', precioCompra: 400, precioVenta: 980, nivelMinimo: 6, categoria: 'Lujo' },
  { id: 12, nombre: 'Casco VR Cuántico', emoji: '🥽', precioCompra: 650, precioVenta: 1600, nivelMinimo: 7, categoria: 'Tecnología' },
  { id: 13, nombre: 'Batería de Fusión', emoji: '🔋', precioCompra: 1050, precioVenta: 2600, nivelMinimo: 8, categoria: 'Tecnología' },
  { id: 14, nombre: 'Armadura Nanobots', emoji: '🛡️', precioCompra: 1700, precioVenta: 4200, nivelMinimo: 9, categoria: 'Armamento' },
  { id: 15, nombre: 'Huevo de Dragón', emoji: '🥚', precioCompra: 2800, precioVenta: 7000, nivelMinimo: 10, categoria: 'Mítico' },
  { id: 16, nombre: 'Katana Cyber Láser', emoji: '⚔️', precioCompra: 4500, precioVenta: 11500, nivelMinimo: 11, categoria: 'Armamento' },
  { id: 17, nombre: 'Corona del Vacío', emoji: '👑', precioCompra: 7500, precioVenta: 19500, nivelMinimo: 12, categoria: 'Mítico' },
  { id: 18, nombre: 'Fragmento de Estrella', emoji: '🪐', precioCompra: 12000, precioVenta: 32000, nivelMinimo: 13, categoria: 'Lujo' },
  { id: 19, nombre: 'Suero de Inmortalidad', emoji: '🧪', precioCompra: 20000, precioVenta: 55000, nivelMinimo: 14, categoria: 'Alquimia' },
  { id: 20, nombre: 'Agujero Negro en Botella', emoji: '🌌', precioCompra: 35000, precioVenta: 98000, nivelMinimo: 15, categoria: 'Mítico' },
  { id: 21, nombre: 'Androide Clase S', emoji: '🤖', precioCompra: 60000, precioVenta: 170000, nivelMinimo: 16, categoria: 'Tecnología' },
  { id: 22, nombre: 'Nave de Bolsillo', emoji: '🛸', precioCompra: 100000, precioVenta: 290000, nivelMinimo: 17, categoria: 'Tecnología' },
  { id: 23, nombre: 'Reloj Temporal', emoji: '⏳', precioCompra: 180000, precioVenta: 520000, nivelMinimo: 18, categoria: 'Mítico' },
  { id: 24, nombre: 'Orbe de Creación', emoji: '🔮', precioCompra: 320000, precioVenta: 950000, nivelMinimo: 19, categoria: 'Divino' },
  { id: 25, nombre: 'Trono del Cosmos', emoji: '👑', precioCompra: 600000, precioVenta: 1850000, nivelMinimo: 20, categoria: 'Divino' }
])

const inventario = ref({ 1: 5, 2: 3, 3: 2 })

// --- UPGRADES SYSTEM (10 Deep Upgrades, up to Level 10) ---
const mejoras = ref([
  { id: 'almacen', icono: '📦', nombre: 'Almacén Frigorífico', descripcion: 'Aumenta la capacidad máxima de stock (+40 slots por nivel).', costo: 80, nivelActual: 0, maxNivel: 10 },
  { id: 'robot', icono: '🤖', nombre: 'Flota de Robots Cajeros', descripcion: 'Atiende clientes automáticamente a intervalos más rápidos.', costo: 120, nivelActual: 0, maxNivel: 10 },
  { id: 'publicidad', icono: '📢', nombre: 'Marketing Viral Holográfico', descripcion: 'Atrae clientes masivamente con menor tiempo de espera.', costo: 70, nivelActual: 0, maxNivel: 10 },
  { id: 'decoracion', icono: '✨', nombre: 'Decoración Imperial', descripcion: 'Aumenta las propinas en cada venta (+20% por nivel).', costo: 95, nivelActual: 0, maxNivel: 10 },
  { id: 'seguridad', icono: '👮', nombre: 'Fuerza Policial & Torretas', descripcion: 'Detiene automáticamente a ladrones y neutraliza jefes de mafia.', costo: 140, nivelActual: 0, maxNivel: 6 },
  { id: 'cafe', icono: '☕', nombre: 'Salón VIP & Barista', descripcion: 'Los clientes tienen +25% de paciencia mientras esperan.', costo: 110, nivelActual: 0, maxNivel: 8 },
  { id: 'tpv', icono: '💳', nombre: 'TPV Financiero Cuántico', descripcion: 'Bonus permanente de +12% a todas las ganancias.', costo: 160, nivelActual: 0, maxNivel: 6 },
  { id: 'camion', icono: '🚚', nombre: 'Logística Mayorista Global', descripcion: 'Descuento del 7% en el precio de costo de todos los productos.', costo: 200, nivelActual: 0, maxNivel: 6 },
  { id: 'nanobots', icono: '🧹', nombre: 'Nanobots de Limpieza', descripcion: 'Limpian automáticamente la suciedad de la tienda cada segundo.', costo: 250, nivelActual: 0, maxNivel: 5 },
  { id: 'generador', icono: '⚡', nombre: 'Generador Anti-Apagón', descripcion: 'Evita apagones y hackeos en robots de servicio.', costo: 300, nivelActual: 0, maxNivel: 5 }
])

// --- ACTIVE EVENT SYSTEM ---
const eventoActivo = ref(null) // { tipo, titulo, desc, icono, duracion, fin }
let eventoTimeout = null

// --- CLIENTS & THIEVES ---
const clientes = ref([])
const notificaciones = ref([])
const floatingCoins = ref([])

const nombresClientes = ['Lucas', 'Sofía', 'Mateo', 'Valentina', 'Santiago', 'Emma', 'Gael', 'Mía', 'Leo', 'Zoe', 'Alex', 'Elena', 'Nicolás', 'Clara', 'Dante', 'Maya', 'Kael', 'Lyra', 'Vortex', 'Chronos']
const avataresNormales = ['🧙‍♂️', '🧝‍♀️', '🧑‍🚀', '👸', '🤠', '🥷', '👩‍🔬', '👨‍🍳', '🧚', '🕵️']
const avataresVip = ['💎', '👑', '🎩', '🤴', '💰', '🌟', '🦚']
const avataresLadron = ['🦹', '🦹‍♂️', '👺', '🐺']
const avataresBoss = ['🏴‍☠️', '👹', '👾', '👿']

// Quests / Achievements
const misiones = reactive([
  { id: 'm1', titulo: 'Atiende a 15 Clientes', meta: 15, actual: computed(() => clientesAtendidos.value), recompensa: 200, cobrada: false },
  { id: 'm2', titulo: 'Atrapa a 5 Ladrones o Jefes', meta: 5, actual: computed(() => ladronesAtrapados.value), recompensa: 450, cobrada: false },
  { id: 'm3', titulo: 'Logra un Combo de Ventas x6', meta: 6, actual: computed(() => comboStreak.value), recompensa: 350, cobrada: false },
  { id: 'm4', titulo: 'Alcanza $10,000 en Ventas Totales', meta: 10000, actual: computed(() => ventasTotales.value), recompensa: 1200, cobrada: false },
  { id: 'm5', titulo: 'Llega al Nivel 10 (Megacorporación)', meta: 10, actual: computed(() => nivel.value), recompensa: 2500, cobrada: false },
  { id: 'm6', titulo: 'Alcanza el Nivel 20 (Dios del Comercio)', meta: 20, actual: computed(() => nivel.value), recompensa: 50000, cobrada: false }
])

let intervals = []

// Computeds
const totalItemsInventario = computed(() => Object.values(inventario.value).reduce((sum, cant) => sum + cant, 0))

const capacidadAlmacen = computed(() => {
  const niv = mejoras.value.find(m => m.id === 'almacen')?.nivelActual || 0
  return 35 + (niv * 40)
})

const descuentoMayorista = computed(() => {
  const niv = mejoras.value.find(m => m.id === 'camion')?.nivelActual || 0
  return Math.max(0.55, 1 - (niv * 0.07))
})

const multiplicadorPropina = computed(() => {
  const nivDeco = mejoras.value.find(m => m.id === 'decoracion')?.nivelActual || 0
  const nivTpv = mejoras.value.find(m => m.id === 'tpv')?.nivelActual || 0
  return (1 + (nivDeco * 0.20) + (nivTpv * 0.12)) * multiplicadorPrestigio.value
})

const factorPaciencia = computed(() => {
  const niv = mejoras.value.find(m => m.id === 'cafe')?.nivelActual || 0
  let base = 1 + (niv * 0.25)
  // Dirt penalty: if dirty, customer patience drops faster
  if (suciedadTienda.value > 60) {
    base *= 0.65
  }
  return base
})

const productosDisponiblesPorNivel = computed(() => catalogo.value.filter(p => nivel.value >= p.nivelMinimo))

const maxClientesEnTienda = computed(() => {
  return Math.min(9, 4 + Math.floor(nivel.value / 2.5))
})

const intervaloCliente = computed(() => {
  const mejoraPub = mejoras.value.find(m => m.id === 'publicidad')?.nivelActual || 0
  // Scaling difficulty: as level goes up, customers arrive faster and faster!
  let base = Math.max(1200, (4800 - (nivel.value * 120)) - mejoraPub * 450)
  if (eventoActivo.value?.tipo === 'RUSH_HOUR') {
    base = 900
  }
  return Math.max(800, base)
})

// Notifications helper
const mostrarNotificacion = (mensaje, tipo = 'info') => {
  const id = Date.now() + Math.random()
  notificaciones.value.push({ id, mensaje, tipo })
  setTimeout(() => {
    notificaciones.value = notificaciones.value.filter(n => n.id !== id)
  }, 3200)
}

const spawnFloatingText = (x, y, text, color = '#4ade80') => {
  const id = Date.now() + Math.random()
  floatingCoins.value.push({ id, x, y, text, color })
  setTimeout(() => {
    floatingCoins.value = floatingCoins.value.filter(f => f.id !== id)
  }, 1200)
}

const getStock = (productoId) => inventario.value[productoId] || 0

const getPrecioCompra = (producto) => {
  let p = producto.precioCompra * descuentoMayorista.value
  if (eventoActivo.value?.tipo === 'INFLATION') p *= 1.8
  return Math.max(1, Math.round(p))
}

// Purchase Stock
const comprarProducto = (producto, cantidad = 1) => {
  const costoUnitario = getPrecioCompra(producto)
  const costoTotal = costoUnitario * cantidad

  if (totalItemsInventario.value + cantidad > capacidadAlmacen.value) {
    mostrarNotificacion(`¡Almacén lleno! (${totalItemsInventario.value}/${capacidadAlmacen.value}) Mejora tu almacén.`, 'alerta')
    sfx.playError()
    return
  }

  if (dinero.value < costoTotal) {
    mostrarNotificacion('¡No tienes suficiente dinero en caja!', 'alerta')
    sfx.playError()
    return
  }

  dinero.value -= costoTotal
  inventario.value[producto.id] = (inventario.value[producto.id] || 0) + cantidad
  sfx.playBuy()
  mostrarNotificacion(`Compraste ${cantidad}x ${producto.nombre} (-$${costoTotal.toLocaleString()})`, 'info')
}

// Max Fill Stock for a Product
const rellenarProductoMax = (producto) => {
  const espacioLibre = capacidadAlmacen.value - totalItemsInventario.value
  if (espacioLibre <= 0) {
    mostrarNotificacion('¡Almacén completamente lleno!', 'alerta')
    sfx.playError()
    return
  }
  const costoUnitario = getPrecioCompra(producto)
  const cantidadPosiblePorDinero = Math.floor(dinero.value / costoUnitario)
  const aComprar = Math.min(espacioLibre, cantidadPosiblePorDinero, 15)

  if (aComprar <= 0) {
    mostrarNotificacion('¡Sin fondos suficientes para rellenar!', 'alerta')
    sfx.playError()
    return
  }
  comprarProducto(producto, aComprar)
}

// XP & Leveling logic
const sumarXP = (puntos) => {
  xp.value += puntos
  while (xp.value >= xpRequerido.value) {
    xp.value -= xpRequerido.value
    nivel.value++
    const bono = Math.round(nivel.value * 180 + Math.pow(nivel.value, 2) * 40)
    dinero.value += bono
    sfx.playLevelUp()
    mostrarNotificacion(`🎉 ¡SUBISTE AL NIVEL ${nivel.value} (${rangoActual.value.titulo})! Bonificación: +$${bono.toLocaleString()}`, 'exito')
  }
}

// Clean Store Action
const limpiarTienda = () => {
  suciedadTienda.value = Math.max(0, suciedadTienda.value - 28)
  sfx.playClean()
  mostrarNotificacion('🧹 ¡Tienda limpiada! Los clientes están más satisfechos.', 'info')
}

// Generator Fix Action
const repararGenerador = () => {
  toquesGenerador.value++
  sfx.playTaserHit()
  if (toquesGenerador.value >= 5) {
    generadorBloqueado.value = false
    toquesGenerador.value = 0
    sfx.playUpgrade()
    mostrarNotificacion('⚡ ¡Generador restablecido! Los robots vuelven a operar.', 'exito')
  }
}

// Generate Clients, Thieves & Bosses
const generarCliente = () => {
  if (clientes.value.length >= maxClientesEnTienda.value) return
  const pool = productosDisponiblesPorNivel.value
  if (pool.length === 0) return

  // Store gets dirtier with every visitor
  suciedadTienda.value = Math.min(100, suciedadTienda.value + (1.2 + nivel.value * 0.15))

  // High level Mafia Boss / Bandit Encounter (Level >= 6)
  const esBoss = nivel.value >= 6 && Math.random() < (0.05 + nivel.value * 0.008) && !clientes.value.some(c => c.esBoss)
  if (esBoss) {
    const guardiaNivel = mejoras.value.find(m => m.id === 'seguridad')?.nivelActual || 0
    if (guardiaNivel >= 4) {
      ladronesAtrapados.value++
      const recompensa = Math.round(300 + Math.pow(nivel.value, 1.8) * 40)
      dinero.value += recompensa
      sumarXP(90)
      sfx.playCatch()
      mostrarNotificacion(`👮 ¡Tus Torretas Policiales neutralizaron al Jefe Mafioso! Recompensa: +$${recompensa.toLocaleString()}`, 'exito')
      return
    }

    sfx.playAlarm()
    clientes.value.push({
      id: Date.now() + Math.random(),
      nombre: '🔥 ¡JEFE MAFIOSO ARMADO!',
      avatar: avataresBoss[Math.floor(Math.random() * avataresBoss.length)],
      esBoss: true,
      vidaBoss: 3,
      tiempoRobo: 100,
      paciencia: 100
    })
    mostrarNotificacion('⚠️ ¡UN JEFE MAFIOSO ESTÁ ASALTANDO LA TIENDA! ¡Dale 3 descargas con el Taser antes de que robe tu dinero!', 'alerta')
    return
  }

  // Common Thief Encounter (Level >= 2)
  const esLadron = nivel.value >= 2 && Math.random() < (0.10 + nivel.value * 0.008) && !clientes.value.some(c => c.esLadron)
  if (esLadron) {
    const guardiaNivel = mejoras.value.find(m => m.id === 'seguridad')?.nivelActual || 0
    if (guardiaNivel >= 1) {
      ladronesAtrapados.value++
      const recompensa = Math.round(100 + (nivel.value * 40))
      dinero.value += recompensa
      sumarXP(45)
      sfx.playCatch()
      mostrarNotificacion(`👮 ¡Tu Guardia arrestó a un Ladrón! Recompensa: +$${recompensa.toLocaleString()}`, 'exito')
      return
    }

    sfx.playAlarm()
    clientes.value.push({
      id: Date.now() + Math.random(),
      nombre: '¡Ladrón Sigiloso!',
      avatar: avataresLadron[Math.floor(Math.random() * avataresLadron.length)],
      esLadron: true,
      tiempoRobo: 100,
      paciencia: 100
    })
    mostrarNotificacion('🚨 ¡LADRÓN EN LA TIENDA! ¡Haz clic en él para atraparlo!', 'alerta')
    return
  }

  // Client Types
  const esVip = Math.random() < (0.14 + nivel.value * 0.01) && nivel.value >= 2
  const esCritico = !esVip && Math.random() < (0.08 + nivel.value * 0.008) && nivel.value >= 5
  const esApurado = !esVip && !esCritico && Math.random() < 0.28

  // Scaling Number of Items in Order (Up to 4 items in late game!)
  let numItems = 1
  if (esVip) numItems = Math.min(4, 2 + Math.floor(nivel.value / 6))
  else if (esCritico) numItems = Math.min(3, 2 + Math.floor(nivel.value / 8))
  else if (nivel.value >= 7 && Math.random() < 0.35) numItems = 2
  else if (nivel.value >= 14 && Math.random() < 0.4) numItems = 3

  const pedidos = []
  for (let i = 0; i < numItems; i++) {
    const item = pool[Math.floor(Math.random() * pool.length)]
    pedidos.push(item)
  }

  const nombre = nombresClientes[Math.floor(Math.random() * nombresClientes.length)]
  const avatar = esVip 
    ? avataresVip[Math.floor(Math.random() * avataresVip.length)]
    : (esCritico ? '🧐' : avataresNormales[Math.floor(Math.random() * avataresNormales.length)])

  clientes.value.push({
    id: Date.now() + Math.random(),
    nombre: esVip ? `👑 VIP ${nombre}` : (esCritico ? `🧐 Inspector ${nombre}` : nombre),
    avatar,
    esVip,
    esCritico,
    esApurado,
    pedidos,
    paciencia: 100,
    maxPaciencia: esApurado ? 60 : 100
  })
}

// Catch Thief / Taser Boss
const clickEnemigo = (cliente) => {
  if (cliente.esBoss) {
    cliente.vidaBoss--
    sfx.playTaserHit()
    if (cliente.vidaBoss <= 0) {
      ladronesAtrapados.value++
      const botin = Math.round(400 + Math.pow(nivel.value, 1.8) * 50)
      dinero.value += botin
      sumarXP(110)
      sfx.playCatch()
      clientes.value = clientes.value.filter(c => c.id !== cliente.id)
      mostrarNotificacion(`🎯 ¡ABATISTE AL JEFE MAFIOSO! Recompensa federal: +$${botin.toLocaleString()}`, 'exito')
    } else {
      mostrarNotificacion(`⚡ ¡Impacto con Taser! (Vida del Jefe: ${cliente.vidaBoss}/3)`, 'info')
    }
    return
  }

  if (cliente.esLadron) {
    ladronesAtrapados.value++
    const botin = Math.round(120 + (nivel.value * 45))
    dinero.value += botin
    sumarXP(50)
    sfx.playCatch()
    clientes.value = clientes.value.filter(c => c.id !== cliente.id)
    mostrarNotificacion(`🎯 ¡ATRAPASTE AL LADRÓN! Recompensa policial: +$${botin.toLocaleString()}`, 'exito')
  }
}

// Check stock for order
const puedeAtenderCliente = (cliente) => {
  if (cliente.esLadron || cliente.esBoss) return false
  const countsNeeded = {}
  cliente.pedidos.forEach(p => {
    countsNeeded[p.id] = (countsNeeded[p.id] || 0) + 1
  })
  return Object.entries(countsNeeded).every(([id, count]) => getStock(id) >= count)
}

// Serve Customer
const atenderCliente = (cliente, event) => {
  if (cliente.esLadron || cliente.esBoss) {
    clickEnemigo(cliente)
    return
  }

  if (!puedeAtenderCliente(cliente)) {
    mostrarNotificacion('¡Te falta stock de algunos productos pedidos!', 'alerta')
    sfx.playError()
    return
  }

  // Deduct inventory
  let baseVenta = 0
  let xpBase = 0
  cliente.pedidos.forEach(prod => {
    inventario.value[prod.id]--
    baseVenta += prod.precioVenta
    xpBase += Math.max(8, Math.round(prod.precioVenta * 0.22))
  })

  // Multipliers
  let multiplier = multiplicadorPropina.value
  if (cliente.esVip) multiplier *= 2.4
  if (cliente.esCritico) multiplier *= 3.0
  if (cliente.esApurado) multiplier *= 1.5
  if (eventoActivo.value?.tipo === 'MARKET_BOOM') multiplier *= 1.8

  // Combo Streak
  comboStreak.value++
  if (comboResetTimer) clearTimeout(comboResetTimer)
  comboResetTimer = setTimeout(() => {
    comboStreak.value = 0
  }, 4500)

  const comboBonus = 1 + (Math.min(comboStreak.value, 15) * 0.09)
  const gananciaFinal = Math.round(baseVenta * multiplier * comboBonus)

  dinero.value += gananciaFinal
  ventasTotales.value += gananciaFinal
  clientesAtendidos.value++
  sumarXP(Math.round(xpBase * (cliente.esVip ? 3 : (cliente.esCritico ? 4 : 1))))

  sfx.playCoin()
  if (comboStreak.value > 1) {
    sfx.playCombo(comboStreak.value)
  }

  // Floating text
  if (event && event.clientX) {
    spawnFloatingText(event.clientX - 20, event.clientY - 30, `+$${gananciaFinal.toLocaleString()}`, cliente.esVip ? '#fbbf24' : '#4ade80')
  }

  clientes.value = clientes.value.filter(c => c.id !== cliente.id)
  mostrarNotificacion(`¡Vendido a ${cliente.nombre}! +$${gananciaFinal.toLocaleString()} ${comboStreak.value > 2 ? `🔥 Racha x${comboStreak.value}` : ''}`, 'exito')
}

// Upgrade purchase
const comprarMejora = (mejora) => {
  if (dinero.value < mejora.costo || mejora.nivelActual >= mejora.maxNivel) {
    sfx.playError()
    return
  }
  dinero.value -= mejora.costo
  mejora.nivelActual++
  mejora.costo = Math.round(mejora.costo * 1.95)
  sfx.playUpgrade()
  sumarXP(45 * mejora.nivelActual)
  mostrarNotificacion(`⭐ ¡Mejora: ${mejora.nombre} Nv.${mejora.nivelActual}!`, 'exito')
}

// Robot automation
const ejecutarRobot = () => {
  if (generadorBloqueado.value) return // Blocked during blackouts
  const nivelRobot = mejoras.value.find(m => m.id === 'robot')?.nivelActual || 0
  if (nivelRobot === 0 || clientes.value.length === 0) return

  // Higher level robots can serve multiple clients per tick!
  const maxAtencionesPorTick = Math.min(3, 1 + Math.floor(nivelRobot / 4))
  let atendidos = 0

  for (const cliente of clientes.value) {
    if (!cliente.esLadron && !cliente.esBoss && puedeAtenderCliente(cliente)) {
      atenderCliente(cliente)
      atendidos++
      if (atendidos >= maxAtencionesPorTick) break
    }
  }
}

// Dynamic Chaotic Events
const lanzarEventoAleatorio = () => {
  if (eventoActivo.value) return
  const eventosPosibles = [
    {
      tipo: 'RUSH_HOUR',
      titulo: '🔥 ¡HORA PUNTA EN LA TIENDA!',
      desc: 'Oleada masiva de clientes entrando sin parar durante 18 segundos. ¡Aprovecha las ventas!',
      icono: '⚡',
      duracion: 18
    },
    {
      tipo: 'MARKET_BOOM',
      titulo: '📈 ¡BOOM DE VENTAS VIRAL!',
      desc: '¡Todos los clientes pagan un +80% extra por sus compras durante 20 segundos!',
      icono: '🚀',
      duracion: 20
    },
    {
      tipo: 'INFLATION',
      titulo: '📉 ¡CRISIS DE INFLACIÓN MAYORISTA!',
      desc: 'Los distribuidores suben los precios de costo temporalmente por 18 segundos.',
      icono: '💸',
      duracion: 18
    },
    {
      tipo: 'BLACKOUT',
      titulo: '⚡ ¡HACKEO & APAGÓN DE ROBOTS!',
      desc: 'Los robots se han quedado sin energía. ¡Pulsa en "Reiniciar Generador" para restablecerlos!',
      icono: '🔌',
      duracion: 15
    },
    {
      tipo: 'INSPECTION',
      titulo: '📋 ¡INSPECCIÓN DE VARIEDAD Y SANIDAD!',
      desc: 'El gremio evalúa tu stock. Si tienes al menos 5 productos surtidos y tienda limpia, ganas un gran subsidio.',
      icono: '👨‍⚖️',
      duracion: 6
    }
  ]

  const ev = eventosPosibles[Math.floor(Math.random() * eventosPosibles.length)]
  eventoActivo.value = { ...ev, fin: Date.now() + ev.duracion * 1000 }
  sfx.playUpgrade()

  if (ev.tipo === 'BLACKOUT') {
    const antiGen = mejoras.value.find(m => m.id === 'generador')?.nivelActual || 0
    if (antiGen >= 3) {
      mostrarNotificacion('🛡️ ¡Tu Generador de Respaldo neutralizó el apagón automáticamente!', 'exito')
      eventoActivo.value = null
      return
    }
    generadorBloqueado.value = true
    toquesGenerador.value = 0
  }

  if (ev.tipo === 'INSPECTION') {
    setTimeout(() => {
      const productosConStock = catalogo.value.filter(p => getStock(p.id) > 0).length
      if (productosConStock >= 5 && suciedadTienda.value < 40) {
        const premio = Math.round(300 + Math.pow(nivel.value, 1.8) * 80)
        dinero.value += premio
        sumarXP(80)
        sfx.playLevelUp()
        mostrarNotificacion(`🏆 ¡Inspección Impecable! Gremio otorgó subsidio: +$${premio.toLocaleString()}`, 'exito')
      } else {
        const multa = Math.min(dinero.value, Math.round(150 + nivel.value * 30))
        dinero.value -= multa
        sfx.playError()
        mostrarNotificacion(`⚠️ Inspección reprobada (falta variedad o tienda sucia). Multa aplicada: -$${multa.toLocaleString()}`, 'alerta')
      }
      eventoActivo.value = null
    }, 4500)
    return
  }

  eventoTimeout = setTimeout(() => {
    eventoActivo.value = null
    generadorBloqueado.value = false
    mostrarNotificacion('El evento especial ha terminado.', 'info')
  }, ev.duracion * 1000)
}

// Prestige / Ascension
const puedePrestigiar = computed(() => {
  return nivel.value >= 20 || ventasTotales.value >= 1000000
})

const ascenderPrestigio = () => {
  if (!puedePrestigiar.value) return
  if (confirm('¿Deseas ascender al Panteón Cósmico? Reiniciarás tu tienda al Nivel 1 a cambio de +5 Gemas de Prestigio (Multiplicador permanente de ganancias +125%).')) {
    gemasPrestigio.value += 5
    nivelPrestigio.value++
    nivel.value = 1
    xp.value = 0
    dinero.value = 500
    ventasTotales.value = 0
    clientesAtendidos.value = 0
    clientesPerdidos.value = 0
    ladronesAtrapados.value = 0
    inventario.value = { 1: 10, 2: 8, 3: 5 }
    mejoras.value.forEach(m => {
      m.nivelActual = 0
      m.costo = m.id === 'almacen' ? 80 : (m.id === 'robot' ? 120 : (m.id === 'publicidad' ? 70 : 100))
    })
    clientes.value = []
    sfx.playPrestige()
    mostrarNotificacion(`🌟 ¡ASCENDISTE AL PRESTIGIO NV.${nivelPrestigio.value}! Multiplicador cósmico activado.`, 'exito')
  }
}

// Claim Quest Reward
const cobrarMision = (mision) => {
  if (mision.cobrada || mision.actual < mision.meta) return
  mision.cobrada = true
  dinero.value += mision.recompensa
  sumarXP(90)
  sfx.playLevelUp()
  mostrarNotificacion(`🎁 ¡Recompensa de misión cobrada: +$${mision.recompensa.toLocaleString()}!`, 'exito')
}

// LocalStorage Auto-save & Load
const guardarPartida = () => {
  try {
    const data = {
      dinero: dinero.value,
      ventasTotales: ventasTotales.value,
      clientesAtendidos: clientesAtendidos.value,
      ladronesAtrapados: ladronesAtrapados.value,
      nivel: nivel.value,
      xp: xp.value,
      nivelPrestigio: nivelPrestigio.value,
      gemasPrestigio: gemasPrestigio.value,
      inventario: inventario.value,
      mejoras: mejoras.value.map(m => ({ id: m.id, nivelActual: m.nivelActual, costo: m.costo }))
    }
    localStorage.setItem('tienda_tycoon_save', JSON.stringify(data))
  } catch (e) {}
}

const cargarPartida = () => {
  try {
    const raw = localStorage.getItem('tienda_tycoon_save')
    if (!raw) return
    const d = JSON.parse(raw)
    if (d.dinero !== undefined) dinero.value = d.dinero
    if (d.ventasTotales !== undefined) ventasTotales.value = d.ventasTotales
    if (d.clientesAtendidos !== undefined) clientesAtendidos.value = d.clientesAtendidos
    if (d.ladronesAtrapados !== undefined) ladronesAtrapados.value = d.ladronesAtrapados
    if (d.nivel !== undefined) nivel.value = d.nivel
    if (d.xp !== undefined) xp.value = d.xp
    if (d.nivelPrestigio !== undefined) nivelPrestigio.value = d.nivelPrestigio
    if (d.gemasPrestigio !== undefined) gemasPrestigio.value = d.gemasPrestigio
    if (d.inventario) inventario.value = d.inventario
    if (d.mejoras) {
      d.mejoras.forEach(savedM => {
        const target = mejoras.value.find(m => m.id === savedM.id)
        if (target) {
          target.nivelActual = savedM.nivelActual
          target.costo = savedM.costo
        }
      })
    }
  } catch (e) {}
}

const reiniciarPartida = () => {
  if (confirm('¿Estás seguro de reiniciar tu tienda desde el nivel 1?')) {
    localStorage.removeItem('tienda_tycoon_save')
    dinero.value = 150
    ventasTotales.value = 0
    clientesAtendidos.value = 0
    clientesPerdidos.value = 0
    ladronesAtrapados.value = 0
    nivel.value = 1
    xp.value = 0
    nivelPrestigio.value = 0
    gemasPrestigio.value = 0
    inventario.value = { 1: 5, 2: 3, 3: 2 }
    mejoras.value.forEach(m => {
      m.nivelActual = 0
      m.costo = m.id === 'almacen' ? 80 : (m.id === 'robot' ? 120 : (m.id === 'publicidad' ? 70 : 100))
    })
    clientes.value = []
    mostrarNotificacion('¡Partida reiniciada con éxito!', 'info')
  }
}

// Lifecycle Loops
onMounted(() => {
  cargarPartida()

  // Patience decay & Thief countdown loop
  intervals.push(setInterval(() => {
    // Dynamic patience decay based on store tier and cleanliness
    const basePatienceSpeed = (1.5 + (nivel.value * 0.08)) / factorPaciencia.value
    for (let i = clientes.value.length - 1; i >= 0; i--) {
      const cliente = clientes.value[i]

      if (cliente.esBoss) {
        cliente.tiempoRobo -= (2.4 + (nivel.value * 0.06))
        if (cliente.tiempoRobo <= 0) {
          const robo = Math.min(dinero.value, Math.round(250 + Math.pow(nivel.value, 1.8) * 60))
          dinero.value -= robo
          clientes.value.splice(i, 1)
          sfx.playError()
          mostrarNotificacion(`💥 ¡EL JEFE MAFIOSO ESCAPÓ CON $${robo.toLocaleString()} DE TU CAJA!`, 'alerta')
        }
      } else if (cliente.esLadron) {
        cliente.tiempoRobo -= (2.8 + (nivel.value * 0.05))
        if (cliente.tiempoRobo <= 0) {
          const robo = Math.min(dinero.value, Math.round(90 + nivel.value * 28))
          dinero.value -= robo
          clientes.value.splice(i, 1)
          sfx.playError()
          mostrarNotificacion(`💸 ¡EL LADRÓN ESCAPÓ CON $${robo.toLocaleString()}!`, 'alerta')
        }
      } else {
        cliente.paciencia -= (cliente.esApurado ? basePatienceSpeed * 1.9 : basePatienceSpeed)
        if (cliente.paciencia <= 0) {
          clientes.value.splice(i, 1)
          clientesPerdidos.value++
          comboStreak.value = 0
          mostrarNotificacion(`${cliente.nombre} se cansó de esperar y se fue 😢`, 'alerta')
        }
      }
    }
  }, 250))

  // Rent / Maintenance Countdown (every 50s)
  intervals.push(setInterval(() => {
    tiempoHastaAlquiler.value--
    if (tiempoHastaAlquiler.value <= 0) {
      tiempoHastaAlquiler.value = 50
      if (costoAlquiler.value > 0) {
        dinero.value -= costoAlquiler.value
        if (dinero.value < 0) {
          sfx.playError()
          mostrarNotificacion(`📉 ¡PAGO DE ALQUILER E IMPUESTOS: -$${costoAlquiler.value.toLocaleString()}! Saldo negativo en caja.`, 'alerta')
        } else {
          mostrarNotificacion(`🏢 Pago de alquiler y mantenimiento: -$${costoAlquiler.value.toLocaleString()}`, 'info')
        }
      }
    }
  }, 1000))

  // Auto-cleaner Nanobots Loop
  intervals.push(setInterval(() => {
    const nivNanobots = mejoras.value.find(m => m.id === 'nanobots')?.nivelActual || 0
    if (nivNanobots > 0 && suciedadTienda.value > 0) {
      suciedadTienda.value = Math.max(0, suciedadTienda.value - (nivNanobots * 1.5))
    }
  }, 1000))

  // Customer Spawner
  const runSpawner = () => {
    generarCliente()
    intervals.push(setTimeout(runSpawner, intervaloCliente.value))
  }
  intervals.push(setTimeout(runSpawner, 2000))

  // Robot Automation Loop
  intervals.push(setInterval(ejecutarRobot, 1400))

  // Dynamic Event Spawner (every 32-45s)
  intervals.push(setInterval(() => {
    if (Math.random() < 0.7) {
      lanzarEventoAleatorio()
    }
  }, 34000))

  // Auto-save loop (every 10s)
  intervals.push(setInterval(guardarPartida, 10000))
})

onUnmounted(() => {
  guardarPartida()
  intervals.forEach(id => {
    clearInterval(id)
    clearTimeout(id)
  })
  if (eventoTimeout) clearTimeout(eventoTimeout)
  if (comboResetTimer) clearTimeout(comboResetTimer)
})
</script>

<template>
  <div class="tienda-game">
    <!-- TOP HEADER WITH PROGRESS, STATS & MAINTENANCE -->
    <header class="header">
      <div class="brand-section">
        <div class="brand-title-row">
          <span class="store-avatar">{{ rangoActual.icono }}</span>
          <div>
            <h1>🏪 {{ nombreTienda }}</h1>
            <div class="rango-sub-row">
              <span class="rango-subtag" :style="{ color: rangoActual.color }">{{ rangoActual.titulo }}</span>
              <span class="peligro-badge" :class="'peligro-' + rangoActual.peligro.toLowerCase().replace(/ /g, '-')">
                ⚠️ {{ rangoActual.peligro }}
              </span>
              <span v-if="nivelPrestigio > 0" class="prestige-tag">🔮 Prestigio Nv.{{ nivelPrestigio }} (+{{ (gemasPrestigio * 25) }}%)</span>
            </div>
          </div>
          <span class="level-badge" :class="{ 'level-max': nivel >= 20 }">NV. {{ nivel }} / 20 ⭐</span>
        </div>

        <!-- XP PROGRESS BAR -->
        <div class="xp-container">
          <div class="xp-labels">
            <span>Progreso de Nivel (XP)</span>
            <span>{{ xp.toLocaleString() }} / {{ xpRequerido.toLocaleString() }} XP</span>
          </div>
          <div class="xp-bar">
            <div class="xp-fill" :style="{ width: Math.min(100, (xp / xpRequerido) * 100) + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- MAIN METRICS & STATS -->
      <div class="stats-bar">
        <div class="stat-item dinero" :class="{ 'dinero-negativo': dinero < 0 }">
          <span class="stat-icon">💰</span>
          <div>
            <div class="stat-label">Caja / Fondos</div>
            <div class="stat-value">${{ dinero.toLocaleString() }}</div>
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-icon">👥</span>
          <div>
            <div class="stat-label">Atendidos</div>
            <div class="stat-value">{{ clientesAtendidos }}</div>
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🏢</span>
          <div>
            <div class="stat-label">Alquiler (en {{ tiempoHastaAlquiler }}s)</div>
            <div class="stat-value text-rent">-${{ costoAlquiler.toLocaleString() }}</div>
          </div>
        </div>
        <div class="stat-item combo-item" v-if="comboStreak > 1">
          <span class="stat-icon">🔥</span>
          <div>
            <div class="stat-label">Racha Combo</div>
            <div class="stat-value text-combo">x{{ comboStreak }} (x{{ (1 + comboStreak * 0.09).toFixed(2) }} $)</div>
          </div>
        </div>
      </div>
    </header>

    <!-- STORE STATUS & CLEANLINESS BAR -->
    <div class="store-status-bar">
      <div class="clean-box">
        <div class="clean-info">
          <span>🧹 Limpieza de Tienda: <strong>{{ Math.round(100 - suciedadTienda) }}%</strong></span>
          <span v-if="suciedadTienda > 50" class="text-dirty">⚠️ Tienda Sucia (-35% Paciencia)</span>
        </div>
        <div class="clean-bar-wrap">
          <div class="clean-fill" :style="{ width: (100 - suciedadTienda) + '%' }" :class="{ 'clean-low': suciedadTienda > 50 }"></div>
        </div>
      </div>
      <button class="btn-clean" @click="limpiarTienda">🧹 BARRER Y LIMPIAR</button>

      <!-- Generator emergency button during blackout -->
      <div v-if="generadorBloqueado" class="generator-alert">
        <span>🔌 ¡HACKEO/APAGÓN EN ROBOTS!</span>
        <button class="btn-repair-gen" @click="repararGenerador">
          ⚡ REINICIAR GENERADOR ({{ toquesGenerador }}/5)
        </button>
      </div>

      <!-- Prestige ascension button when maxed -->
      <button v-if="puedePrestigiar" class="btn-ascend" @click="ascenderPrestigio">
        🔮 ASCENDER AL PANTEÓN CÓSMICO
      </button>
    </div>

    <!-- ACTIVE DYNAMIC EVENT BANNER -->
    <div v-if="eventoActivo" class="event-banner" :class="eventoActivo.tipo.toLowerCase()">
      <div class="event-icon">{{ eventoActivo.icono }}</div>
      <div class="event-info">
        <h3>{{ eventoActivo.titulo }}</h3>
        <p>{{ eventoActivo.desc }}</p>
      </div>
    </div>

    <!-- NOTIFICATIONS & FLOATING TEXTS -->
    <div class="notifications-container">
      <div v-for="notif in notificaciones" :key="notif.id" :class="['notif-pill', notif.tipo]">
        {{ notif.mensaje }}
      </div>
    </div>

    <!-- MAIN GAME LAYOUT GRID -->
    <main class="game-grid">
      <!-- 1. CLIENTES (QUEUE COLUMN) -->
      <section class="game-card clientes-col">
        <div class="card-header">
          <h2>🚶‍♂️ Cola de Clientes ({{ clientes.length }}/{{ maxClientesEnTienda }})</h2>
          <span class="speed-indicator">⏱️ {{ (intervaloCliente / 1000).toFixed(1) }}s</span>
        </div>

        <div v-if="clientes.length === 0" class="empty-state">
          <p>Esperando clientes... 👀 ¡Mejora el marketing para atraer compradores a mayor velocidad!</p>
        </div>

        <div class="clientes-list">
          <div 
            v-for="cliente in clientes" 
            :key="cliente.id" 
            class="cliente-card"
            :class="{ 
              'paciencia-baja': cliente.paciencia < 35,
              'es-vip': cliente.esVip,
              'es-critico': cliente.esCritico,
              'es-boss': cliente.esBoss,
              'es-ladron': cliente.esLadron,
              'es-apurado': cliente.esApurado
            }"
          >
            <div class="cliente-avatar">{{ cliente.avatar }}</div>

            <!-- Normal / VIP / Critic Customer View -->
            <div v-if="!cliente.esLadron && !cliente.esBoss" class="cliente-info">
              <div class="cliente-header-row">
                <strong class="cliente-nombre">{{ cliente.nombre }}</strong>
                <span v-if="cliente.esVip" class="vip-tag">⭐ VIP (x2.4 $)</span>
                <span v-if="cliente.esCritico" class="critico-tag">🧐 CRÍTICO (x3.0 $)</span>
                <span v-if="cliente.esApurado" class="apurado-tag">⚡ APURADO</span>
              </div>

              <!-- Orders List -->
              <div class="cliente-pedidos-wrap">
                <div 
                  v-for="(p, pIdx) in cliente.pedidos" 
                  :key="pIdx"
                  class="pedido-chip"
                  :class="{ 'stock-ok': getStock(p.id) > 0, 'stock-bad': getStock(p.id) === 0 }"
                >
                  <span>{{ p.emoji }} {{ p.nombre }}</span>
                  <span class="stock-check">{{ getStock(p.id) > 0 ? '✔️' : '❌' }}</span>
                </div>
              </div>

              <div class="paciencia-bar">
                <div class="paciencia-fill" :style="{ width: cliente.paciencia + '%' }"></div>
              </div>
            </div>

            <!-- Thief Customer View -->
            <div v-else-if="cliente.esLadron" class="cliente-info ladron-info">
              <div class="cliente-nombre text-danger"><strong>🚨 ¡LADRÓN SIGILOSO!</strong></div>
              <p class="ladron-sub">¡Está abriendo la caja para robarse tu dinero!</p>
              <div class="paciencia-bar">
                <div class="paciencia-fill robo-fill" :style="{ width: cliente.tiempoRobo + '%' }"></div>
              </div>
            </div>

            <!-- Mafia Boss Enemy View -->
            <div v-else-if="cliente.esBoss" class="cliente-info boss-info">
              <div class="cliente-nombre text-boss"><strong>🔥 ¡ASALTO DE JEFE MAFIOSO!</strong></div>
              <p class="ladron-sub">Vida del Jefe: <strong>{{ cliente.vidaBoss }}/3</strong> | ¡Usa el Taser!</p>
              <div class="paciencia-bar">
                <div class="paciencia-fill boss-fill" :style="{ width: cliente.tiempoRobo + '%' }"></div>
              </div>
            </div>

            <!-- Action Button -->
            <button 
              v-if="!cliente.esLadron && !cliente.esBoss"
              class="btn-vender"
              :class="{ 'btn-vip': cliente.esVip, 'btn-critico': cliente.esCritico }"
              :disabled="!puedeAtenderCliente(cliente)"
              @click="atenderCliente(cliente, $event)"
            >
              <span v-if="puedeAtenderCliente(cliente)">
                Vender (+${{ Math.round(cliente.pedidos.reduce((s, p) => s + p.precioVenta, 0) * multiplicadorPropina * (cliente.esVip ? 2.4 : (cliente.esCritico ? 3.0 : 1))).toLocaleString() }})
              </span>
              <span v-else class="sin-stock">¡Falta Stock!</span>
            </button>

            <button 
              v-else-if="cliente.esLadron" 
              class="btn-atrapar-ladron"
              @click="clickEnemigo(cliente)"
            >
              🚨 ¡ATRAPAR!
            </button>

            <button 
              v-else-if="cliente.esBoss" 
              class="btn-taser-boss"
              @click="clickEnemigo(cliente)"
            >
              ⚡ ¡TASER ({{ cliente.vidaBoss }}/3)!
            </button>
          </div>
        </div>
      </section>

      <!-- 2. ALMACÉN Y SUMINISTROS (CATÁLOGO DE 25 PRODUCTOS) -->
      <section class="game-card inventario-col">
        <div class="card-header">
          <h2>📦 Almacén y Suministros ({{ catalogo.length }} Items)</h2>
          <span class="capacidad-tag" :class="{ 'capacidad-casi-llena': totalItemsInventario >= capacidadAlmacen * 0.9 }">
            Capacidad: {{ totalItemsInventario }} / {{ capacidadAlmacen }}
          </span>
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

            <div class="prod-badge-category">{{ prod.categoria }}</div>
            <div class="producto-emoji">{{ prod.emoji }}</div>
            <div class="producto-detalles">
              <h3>{{ prod.nombre }}</h3>
              <div class="precios-info">
                <span class="costo">Costo: ${{ getPrecioCompra(prod).toLocaleString() }}</span>
                <span class="venta">Venta: ${{ prod.precioVenta.toLocaleString() }}</span>
              </div>
              <div class="stock-badge" :class="{ 'stock-cero': getStock(prod.id) === 0 }">
                Stock: <strong>{{ getStock(prod.id) }}</strong>
              </div>
            </div>

            <div class="compra-acciones">
              <button 
                class="btn-comprar"
                :disabled="dinero < getPrecioCompra(prod) || nivel < prod.nivelMinimo || totalItemsInventario >= capacidadAlmacen"
                @click="comprarProducto(prod, 1)"
                title="Comprar 1 unidad"
              >
                +1 (${{ getPrecioCompra(prod).toLocaleString() }})
              </button>
              <button 
                class="btn-comprar-pack"
                :disabled="dinero < getPrecioCompra(prod) * 5 || nivel < prod.nivelMinimo || totalItemsInventario + 5 > capacidadAlmacen"
                @click="comprarProducto(prod, 5)"
                title="Comprar pack de 5"
              >
                +5
              </button>
              <button 
                class="btn-comprar-max"
                :disabled="dinero < getPrecioCompra(prod) || nivel < prod.nivelMinimo || totalItemsInventario >= capacidadAlmacen"
                @click="rellenarProductoMax(prod)"
                title="Rellenar stock máximo posible"
              >
                MAX
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. MEJORAS & MISIONES (10 UPGRADES) -->
      <section class="game-card mejoras-col">
        <div class="card-header">
          <h2>⚡ Mejoras y Negocio ({{ mejoras.length }})</h2>
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
              <span v-if="mejora.nivelActual < mejora.maxNivel">${{ mejora.costo.toLocaleString() }}</span>
              <span v-else>MAX ✔️</span>
            </button>
          </div>
        </div>

        <!-- QUESTS / REPUTATION MISSIONS -->
        <div class="quests-box">
          <h3>🎯 Misiones del Gremio</h3>
          <div class="quests-list">
            <div 
              v-for="m in misiones" 
              :key="m.id" 
              class="quest-item"
              :class="{ 'quest-ready': m.actual >= m.meta && !m.cobrada, 'quest-claimed': m.cobrada }"
            >
              <div class="quest-text">
                <span class="quest-title">{{ m.titulo }}</span>
                <span class="quest-prog">{{ Math.min(m.actual, m.meta).toLocaleString() }} / {{ m.meta.toLocaleString() }}</span>
              </div>
              <button 
                class="btn-claim-quest"
                :disabled="m.cobrada || m.actual < m.meta"
                @click="cobrarMision(m)"
              >
                <span v-if="!m.cobrada">+${{ m.recompensa.toLocaleString() }}</span>
                <span v-else>Listo ✔️</span>
              </button>
            </div>
          </div>
        </div>

        <!-- RESET FOOTER -->
        <div class="system-footer">
          <button class="btn-reset-game" @click="reiniciarPartida">🗑️ Reiniciar Tienda</button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.tienda-game { 
  max-width: 1350px; 
  margin: 0 auto; 
  padding: 10px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: #f8fafc;
}

/* HEADER & BRAND */
.header {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95)); 
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 22px; 
  border-radius: 14px;
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  flex-wrap: wrap; 
  gap: 15px; 
  margin-bottom: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}

.brand-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 320px;
}

.brand-title-row { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}

.store-avatar {
  font-size: 2.2rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 6px;
  border-radius: 10px;
}

.brand-title-row h1 { 
  font-size: 1.35rem; 
  color: #38bdf8; 
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.rango-sub-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.rango-subtag {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}

.peligro-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
}
.peligro-tranquilo, .peligro-fácil { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
.peligro-moderado, .peligro-desafiante { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
.peligro-intenso, .peligro-difícil { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.peligro-muy-difícil, .peligro-pesadilla { background: rgba(239, 68, 68, 0.25); color: #f87171; }
.peligro-extremo, .peligro-caos-total, .peligro-infierno, .peligro-infierno-absoluto {
  background: linear-gradient(90deg, #dc2626, #b91c1c);
  color: white;
  animation: pulse 1s infinite alternate;
}

.prestige-tag {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 900;
}

.level-badge { 
  background: linear-gradient(135deg, #f59e0b, #d97706); 
  color: #000; 
  padding: 4px 10px; 
  border-radius: 20px; 
  font-weight: 900; 
  font-size: 0.8rem; 
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
}
.level-badge.level-max {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.7);
}

.xp-container {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
}

.xp-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
}

.xp-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #a855f7);
  transition: width 0.3s ease;
}

.stats-bar { 
  display: flex; 
  gap: 10px; 
  flex-wrap: wrap;
}

.stat-item { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  background: rgba(15, 23, 42, 0.75); 
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px 12px; 
  border-radius: 10px; 
}

.stat-item.dinero {
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(74, 222, 128, 0.08);
}
.stat-item.dinero-negativo {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
}
.stat-item.dinero .stat-value { 
  color: #4ade80; 
  font-weight: 900; 
  font-size: 1.15rem;
}
.stat-item.dinero-negativo .stat-value {
  color: #f87171;
}

.text-rent { color: #f87171; font-weight: 800; font-size: 0.9rem; }

.stat-item.combo-item {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.1);
  animation: pulse 1s infinite alternate;
}
.text-combo { color: #f59e0b; font-weight: 900; }

.stat-icon { font-size: 1.3rem; }
.stat-label { font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
.stat-value { font-size: 0.95rem; font-weight: 800; }

/* STORE STATUS & CLEANLINESS BAR */
.store-status-bar {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.clean-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 200px;
}

.clean-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 700;
}

.text-dirty { color: #f87171; animation: pulse 0.8s infinite alternate; }

.clean-bar-wrap {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.clean-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #38bdf8);
  transition: width 0.3s ease;
}
.clean-fill.clean-low {
  background: linear-gradient(90deg, #ef4444, #f59e0b);
}

.btn-clean {
  background: #0284c7;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.75rem;
  cursor: pointer;
  transition: transform 0.1s, background 0.2s;
}
.btn-clean:hover { background: #0369a1; transform: scale(1.03); }

.generator-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid #ef4444;
  padding: 4px 10px;
  border-radius: 6px;
  animation: pulse 0.8s infinite alternate;
}
.generator-alert span { font-size: 0.75rem; font-weight: 800; color: #fca5a5; }

.btn-repair-gen {
  background: #ef4444;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 900;
  font-size: 0.75rem;
  cursor: pointer;
}

.btn-ascend {
  background: linear-gradient(135deg, #a855f7, #ec4899);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-weight: 900;
  font-size: 0.8rem;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.5);
  animation: pulse 1s infinite alternate;
}

/* EVENT BANNER */
.event-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  border-radius: 10px;
  margin-bottom: 14px;
  animation: slideDown 0.3s ease;
}

.event-banner.rush_hour {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.9), rgba(245, 158, 11, 0.9));
  color: white;
}
.event-banner.market_boom {
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.9), rgba(56, 189, 248, 0.9));
  color: white;
}
.event-banner.inflation {
  background: linear-gradient(90deg, rgba(220, 38, 38, 0.9), rgba(185, 28, 28, 0.9));
  color: white;
}
.event-banner.blackout {
  background: linear-gradient(90deg, rgba(88, 28, 135, 0.9), rgba(126, 34, 206, 0.9));
  color: white;
}
.event-banner.inspection {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.9), rgba(236, 72, 153, 0.9));
  color: white;
}

.event-icon { font-size: 2rem; }
.event-info h3 { margin: 0; font-size: 1rem; font-weight: 900; }
.event-info p { margin: 2px 0 0 0; font-size: 0.8rem; opacity: 0.95; }

/* NOTIFICATIONS */
.notifications-container { 
  position: fixed; 
  top: 90px; 
  right: 20px; 
  z-index: 999; 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  pointer-events: none;
}

.notif-pill { 
  padding: 8px 16px; 
  border-radius: 8px; 
  font-weight: bold; 
  font-size: 0.85rem; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  animation: fadeInRight 0.25s ease;
}
.notif-pill.exito { background: #16a34a; color: white; border-left: 4px solid #4ade80; }
.notif-pill.alerta { background: #b91c1c; color: white; border-left: 4px solid #f87171; }
.notif-pill.info { background: #0369a1; color: white; border-left: 4px solid #38bdf8; }

/* GRID LAYOUT */
.game-grid { 
  display: grid; 
  grid-template-columns: 1fr 1.35fr 0.95fr; 
  gap: 16px; 
}

@media (max-width: 1100px) { 
  .game-grid { grid-template-columns: 1fr 1fr; } 
  .mejoras-col { grid-column: 1 / -1; }
}
@media (max-width: 768px) { 
  .game-grid { grid-template-columns: 1fr; } 
}

.game-card { 
  background: rgba(30, 41, 59, 0.75); 
  border: 1px solid rgba(255, 255, 255, 0.08); 
  border-radius: 14px; 
  padding: 16px; 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
  backdrop-filter: blur(8px);
}

.card-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  border-bottom: 1px solid rgba(255, 255, 255, 0.1); 
  padding-bottom: 8px; 
}

.card-header h2 { font-size: 1.05rem; font-weight: 800; margin: 0; }
.speed-indicator, .capacidad-tag { 
  background: rgba(56, 189, 248, 0.15); 
  color: #38bdf8; 
  padding: 3px 8px; 
  border-radius: 6px; 
  font-size: 0.75rem; 
  font-weight: 800; 
}

.capacidad-casi-llena {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* CLIENTS QUEUE */
.clientes-list { display: flex; flex-direction: column; gap: 10px; }
.empty-state { text-align: center; padding: 35px 20px; color: #94a3b8; font-size: 0.9rem; }

.cliente-card { 
  background: rgba(15, 23, 42, 0.85); 
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px; 
  padding: 10px 12px; 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  transition: all 0.2s ease;
}

.cliente-card.es-vip {
  border-color: rgba(245, 158, 11, 0.6);
  background: linear-gradient(135deg, rgba(30, 27, 75, 0.9), rgba(15, 23, 42, 0.9));
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.15);
}

.cliente-card.es-critico {
  border-color: rgba(168, 85, 247, 0.6);
  background: linear-gradient(135deg, rgba(46, 16, 101, 0.9), rgba(15, 23, 42, 0.9));
}

.cliente-card.es-ladron {
  border-color: #ef4444;
  background: rgba(127, 29, 29, 0.35);
  animation: pulseThief 1s infinite alternate;
}

.cliente-card.es-boss {
  border-color: #dc2626;
  background: linear-gradient(135deg, rgba(153, 27, 27, 0.85), rgba(0, 0, 0, 0.9));
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
  animation: pulseThief 0.7s infinite alternate;
}

.cliente-card.paciencia-baja {
  border-color: rgba(239, 68, 68, 0.5);
}

.cliente-avatar { font-size: 2rem; line-height: 1; }
.cliente-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.cliente-header-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.cliente-nombre { font-size: 0.85rem; font-weight: 700; }

.vip-tag {
  background: #f59e0b;
  color: #000;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 900;
}
.critico-tag {
  background: #a855f7;
  color: #fff;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 900;
}
.apurado-tag {
  background: #38bdf8;
  color: #000;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 900;
}

.cliente-pedidos-wrap { display: flex; gap: 5px; flex-wrap: wrap; }
.pedido-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
}
.pedido-chip.stock-bad {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.paciencia-bar { 
  height: 5px; 
  background: rgba(255, 255, 255, 0.1); 
  border-radius: 3px; 
  overflow: hidden; 
  margin-top: 2px; 
}

.paciencia-fill { 
  height: 100%; 
  background: linear-gradient(90deg, #ef4444, #eab308, #22c55e); 
  transition: width 0.25s linear;
}

.robo-fill { background: linear-gradient(90deg, #dc2626, #ef4444); }
.boss-fill { background: linear-gradient(90deg, #b91c1c, #f87171); }

.text-danger { color: #f87171; }
.text-boss { color: #fca5a5; font-size: 0.9rem; }
.ladron-sub { font-size: 0.7rem; color: #cbd5e1; margin: 0; }

.btn-vender { 
  background: #16a34a; 
  color: white; 
  border: none; 
  padding: 8px 12px; 
  border-radius: 8px; 
  font-weight: 800; 
  font-size: 0.8rem; 
  cursor: pointer; 
  transition: transform 0.1s, background 0.2s;
  white-space: nowrap;
}
.btn-vender:hover:not(:disabled) {
  background: #22c55e;
  transform: scale(1.03);
}
.btn-vender:disabled { 
  background: #475569; 
  opacity: 0.55; 
  cursor: not-allowed; 
}

.btn-vip { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; }
.btn-critico { background: linear-gradient(135deg, #9333ea, #7c3aed); color: #fff; }

.btn-atrapar-ladron {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 900;
  font-size: 0.85rem;
  cursor: pointer;
  animation: wobble 0.6s infinite alternate;
}

.btn-taser-boss {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 900;
  font-size: 0.85rem;
  cursor: pointer;
  animation: pulse 0.5s infinite alternate;
}

/* WAREHOUSE PRODUCTS GRID */
.productos-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)); 
  gap: 10px; 
  max-height: 560px;
  overflow-y: auto;
  padding-right: 4px;
}

.producto-card { 
  background: rgba(15, 23, 42, 0.8); 
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px; 
  padding: 10px 8px; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  text-align: center; 
  position: relative; 
}

.producto-card.bloqueado { opacity: 0.35; }
.bloqueado-overlay { 
  position: absolute; 
  inset: 0; 
  background: rgba(15, 23, 42, 0.9); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-weight: 900; 
  font-size: 0.8rem; 
  color: #f59e0b; 
  border-radius: 10px;
  z-index: 2;
}

.prod-badge-category {
  font-size: 0.6rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 800;
  margin-bottom: 2px;
}

.producto-emoji { font-size: 1.8rem; margin: 2px 0; }
.producto-detalles h3 { font-size: 0.8rem; margin: 0 0 4px 0; font-weight: 700; }
.precios-info { display: flex; gap: 6px; font-size: 0.68rem; justify-content: center; }
.costo { color: #f87171; }
.venta { color: #4ade80; font-weight: 800; }

.stock-badge { 
  background: rgba(56, 189, 248, 0.15); 
  color: #38bdf8; 
  padding: 2px 8px; 
  border-radius: 4px; 
  font-size: 0.72rem; 
  margin: 6px 0; 
  width: 90%;
}
.stock-cero { background: rgba(239, 68, 68, 0.2); color: #f87171; }

.compra-acciones { display: flex; gap: 4px; width: 100%; }
.btn-comprar { 
  flex: 1; 
  background: #2563eb; 
  color: white; 
  border: none; 
  padding: 6px 4px; 
  border-radius: 6px; 
  font-size: 0.7rem; 
  font-weight: 800; 
  cursor: pointer; 
}
.btn-comprar:disabled { background: #334155; opacity: 0.5; cursor: not-allowed; }

.btn-comprar-pack, .btn-comprar-max { 
  background: rgba(255,255,255,0.1); 
  color: white; 
  border: none; 
  padding: 6px 6px; 
  border-radius: 6px; 
  font-size: 0.7rem; 
  font-weight: 800; 
  cursor: pointer; 
}
.btn-comprar-pack:hover:not(:disabled), .btn-comprar-max:hover:not(:disabled) {
  background: rgba(255,255,255,0.2);
}
.btn-comprar-pack:disabled, .btn-comprar-max:disabled { opacity: 0.4; cursor: not-allowed; }

/* UPGRADES LIST */
.mejoras-list { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}

.mejora-card { 
  background: rgba(15, 23, 42, 0.8); 
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px; 
  padding: 10px; 
  display: flex; 
  align-items: center; 
  gap: 10px; 
}

.mejora-icon { font-size: 1.6rem; }
.mejora-info { flex: 1; }
.mejora-info h4 { font-size: 0.82rem; margin: 0 0 2px 0; font-weight: 800; }
.mejora-info p { font-size: 0.68rem; color: #94a3b8; margin: 0; line-height: 1.3; }

.btn-upgrade { 
  background: linear-gradient(135deg, #f59e0b, #d97706); 
  color: #000; 
  border: none; 
  padding: 7px 12px; 
  border-radius: 6px; 
  font-weight: 900; 
  font-size: 0.78rem; 
  cursor: pointer; 
  white-space: nowrap;
}
.btn-upgrade:hover:not(:disabled) { transform: scale(1.03); }
.btn-upgrade:disabled { background: #475569; color: #94a3b8; opacity: 0.5; cursor: not-allowed; }

/* QUESTS */
.quests-box {
  margin-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 10px;
}

.quests-box h3 { font-size: 0.9rem; font-weight: 800; margin: 0 0 8px 0; color: #f59e0b; }
.quests-list { display: flex; flex-direction: column; gap: 6px; }

.quest-item {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 6px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quest-item.quest-ready {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.quest-text { display: flex; flex-direction: column; }
.quest-title { font-size: 0.75rem; font-weight: 700; }
.quest-prog { font-size: 0.65rem; color: #94a3b8; }

.btn-claim-quest {
  background: #22c55e;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
}
.btn-claim-quest:disabled { background: #334155; opacity: 0.4; cursor: not-allowed; }

.system-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn-reset-game {
  background: transparent;
  color: #64748b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
}
.btn-reset-game:hover { color: #f87171; border-color: #f87171; }

/* ANIMATIONS */
@keyframes pulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.03); }
}

@keyframes pulseThief {
  0% { box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 18px rgba(239, 68, 68, 0.7); }
}

@keyframes wobble {
  0% { transform: rotate(-2deg); }
  100% { transform: rotate(2deg); }
}

@keyframes fadeInRight {
  0% { opacity: 0; transform: translateX(20px); }
  100% { opacity: 1; transform: translateX(0); }
}

@keyframes slideDown {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}
</style>
