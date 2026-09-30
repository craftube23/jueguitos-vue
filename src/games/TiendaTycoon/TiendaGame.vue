<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, watch } from 'vue'

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
    setTimeout(() => this.playTone(1320, 'triangle', 0.12, 0.15), 60)
  }
  playBuy() {
    this.playTone(440, 'sine', 0.06, 0.1)
    setTimeout(() => this.playTone(554.37, 'sine', 0.08, 0.12), 40)
  }
  playUpgrade() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.18, 0.14), i * 70)
    })
  }
  playLevelUp() {
    [440, 554.37, 659.25, 880, 1108.73, 1318.5].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.22, 0.15), i * 80)
    })
  }
  playAlarm() {
    this.playTone(600, 'sawtooth', 0.12, 0.2)
    setTimeout(() => this.playTone(450, 'sawtooth', 0.15, 0.2), 120)
  }
  playCatch() {
    this.playTone(300, 'triangle', 0.08, 0.25)
    setTimeout(() => this.playTone(800, 'triangle', 0.2, 0.25), 80)
  }
  playCombo(streak) {
    const baseFreq = 440 + Math.min(streak * 70, 800)
    this.playTone(baseFreq, 'sine', 0.12, 0.15)
  }
  playError() {
    this.playTone(180, 'sawtooth', 0.15, 0.15)
  }
}
const sfx = new SoundFx()

// --- GAME STATE ---
const nombreTienda = ref('Mercadito Mágico')
const dinero = ref(120)
const ventasTotales = ref(0)
const clientesAtendidos = ref(0)
const clientesPerdidos = ref(0)
const ladronesAtrapados = ref(0)
const nivel = ref(1)
const xp = ref(0)
const comboStreak = ref(0)
let comboResetTimer = null

// Store Titles by Level
const rangosTienda = [
  { nivel: 1, titulo: 'Puesto Callejero', icono: '⛺', color: '#94a3b8' },
  { nivel: 2, titulo: 'Kiosko de Barrio', icono: '🎪', color: '#38bdf8' },
  { nivel: 3, titulo: 'Bodega Mágica', icono: '🏪', color: '#4ade80' },
  { nivel: 4, titulo: 'Minimarket Urbano', icono: '🛒', color: '#a855f7' },
  { nivel: 5, titulo: 'Supermercado Express', icono: '🏬', color: '#f59e0b' },
  { nivel: 6, titulo: 'Centro Comercial Cyber', icono: '🏙️', color: '#ec4899' },
  { nivel: 7, titulo: 'Mega Plaza Radianite', icono: '💎', color: '#06b6d4' },
  { nivel: 8, titulo: 'Hyperstore Tecnológica', icono: '🚀', color: '#10b981' },
  { nivel: 9, titulo: 'Emporio Interdimensional', icono: '🌌', color: '#8b5cf6' },
  { nivel: 10, titulo: 'Megacorporación Galáctica', icono: '🪐', color: '#f97316' },
  { nivel: 11, titulo: 'Sindicato de Comercio Cósmico', icono: '🛸', color: '#e11d48' },
  { nivel: 12, titulo: 'Imperio Comercial Supremo', icono: '👑', color: '#eab308' }
]

const rangoActual = computed(() => {
  const r = rangosTienda.slice().reverse().find(x => nivel.value >= x.nivel)
  return r || rangosTienda[0]
})

const xpRequerido = computed(() => {
  return Math.round(nivel.value * 75 + Math.pow(nivel.value, 1.8) * 45)
})

// --- PRODUCT CATALOG (17 Expanded Items across 12 Levels) ---
const catalogo = ref([
  { id: 1, nombre: 'Manzana Crujiente', emoji: '🍎', precioCompra: 4, precioVenta: 9, nivelMinimo: 1, categoria: 'Comida' },
  { id: 2, nombre: 'Pan Artesanal', emoji: '🥖', precioCompra: 8, precioVenta: 18, nivelMinimo: 1, categoria: 'Comida' },
  { id: 3, nombre: 'Leche Mágica', emoji: '🥛', precioCompra: 14, precioVenta: 30, nivelMinimo: 1, categoria: 'Bebidas' },
  { id: 4, nombre: 'Poción de Vida', emoji: '🧪', precioCompra: 22, precioVenta: 50, nivelMinimo: 2, categoria: 'Alquimia' },
  { id: 5, nombre: 'Café Espresso Pro', emoji: '☕', precioCompra: 32, precioVenta: 72, nivelMinimo: 2, categoria: 'Bebidas' },
  { id: 6, nombre: 'Hamburguesa Doble', emoji: '🍔', precioCompra: 48, precioVenta: 110, nivelMinimo: 3, categoria: 'Comida' },
  { id: 7, nombre: 'Espada de Madera', emoji: '🗡️', precioCompra: 75, precioVenta: 175, nivelMinimo: 3, categoria: 'Equipo' },
  { id: 8, nombre: 'Bebida Radianite', emoji: '⚡', precioCompra: 110, precioVenta: 260, nivelMinimo: 4, categoria: 'Bebidas' },
  { id: 9, nombre: 'Pizza Familiar', emoji: '🍕', precioCompra: 160, precioVenta: 380, nivelMinimo: 4, categoria: 'Comida' },
  { id: 10, nombre: 'Dron Repartidor', emoji: '🛸', precioCompra: 250, precioVenta: 600, nivelMinimo: 5, categoria: 'Tecnología' },
  { id: 11, nombre: 'Diamante Puro', emoji: '💎', precioCompra: 400, precioVenta: 980, nivelMinimo: 6, categoria: 'Lujo' },
  { id: 12, nombre: 'Casco VR Cuántico', emoji: '🥽', precioCompra: 650, precioVenta: 1600, nivelMinimo: 7, categoria: 'Tecnología' },
  { id: 13, nombre: 'Batería de Fusión', emoji: '🔋', precioCompra: 1050, precioVenta: 2600, nivelMinimo: 8, categoria: 'Tecnología' },
  { id: 14, nombre: 'Armadura Nanobots', emoji: '🛡️', precioCompra: 1700, precioVenta: 4200, nivelMinimo: 9, categoria: 'Equipo' },
  { id: 15, nombre: 'Huevo de Dragón', emoji: '🥚', precioCompra: 2800, precioVenta: 7000, nivelMinimo: 10, categoria: 'Mítico' },
  { id: 16, nombre: 'Katana Cyber Láser', emoji: '⚔️', precioCompra: 4500, precioVenta: 11500, nivelMinimo: 11, categoria: 'Mítico' },
  { id: 17, nombre: 'Corona del Vacío', emoji: '👑', precioCompra: 7500, precioVenta: 19500, nivelMinimo: 12, categoria: 'Mítico' }
])

const inventario = ref({ 1: 5, 2: 3, 3: 2 })

// --- UPGRADES SYSTEM (8 Diverse Upgrades) ---
const mejoras = ref([
  { id: 'almacen', icono: '📦', nombre: 'Expansión de Almacén', descripcion: 'Aumenta la capacidad máxima de stock (+30 slots).', costo: 80, nivelActual: 0, maxNivel: 6 },
  { id: 'robot', icono: '🤖', nombre: 'Robot Cajero Automático', descripcion: 'Atiende clientes automáticamente a intervalos regulares.', costo: 120, nivelActual: 0, maxNivel: 5 },
  { id: 'publicidad', icono: '📢', nombre: 'Campaña de Marketing', descripcion: 'Atrae clientes más rápido y con mayor frecuencia.', costo: 70, nivelActual: 0, maxNivel: 5 },
  { id: 'decoracion', icono: '✨', nombre: 'Decoración de Lujo', descripcion: 'Aumenta las propinas de cada venta (+18% por nivel).', costo: 95, nivelActual: 0, maxNivel: 5 },
  { id: 'seguridad', icono: '👮', nombre: 'Seguridad & Alarmas', descripcion: 'Detecta y arresta ladrones automáticamente sin perder dinero.', costo: 140, nivelActual: 0, maxNivel: 3 },
  { id: 'cafe', icono: '☕', nombre: 'Sala Lounge & Café', descripcion: 'Los clientes tienen +25% de paciencia mientras esperan.', costo: 110, nivelActual: 0, maxNivel: 4 },
  { id: 'tpv', icono: '💳', nombre: 'Terminal TPV Contactless', descripcion: 'Bonus de velocidad de venta y +10% de ganancia fija.', costo: 160, nivelActual: 0, maxNivel: 3 },
  { id: 'camion', icono: '🚚', nombre: 'Distribuidor Mayorista', descripcion: 'Descuento del 8% en el precio de compra de todos los productos.', costo: 200, nivelActual: 0, maxNivel: 4 }
])

// --- ACTIVE EVENT SYSTEM ---
const eventoActivo = ref(null) // { tipo, titulo, desc, icono, duracion, fin, efecto }
let eventoTimeout = null

// --- CLIENTS & THIEVES ---
const clientes = ref([])
const notificaciones = ref([])
const floatingCoins = ref([])

const nombresClientes = ['Lucas', 'Sofía', 'Mateo', 'Valentina', 'Santiago', 'Emma', 'Gael', 'Mía', 'Leo', 'Zoe', 'Alex', 'Elena', 'Nicolás', 'Clara', 'Dante', 'Maya']
const avataresNormales = ['🧙‍♂️', '🧝‍♀️', '🧑‍🚀', '👸', '🤠', '🥷', '👩‍🔬', '👨‍🍳', '🧚', '🕵️']
const avataresVip = ['💎', '👑', '🎩', '🤴', '💰', '🌟']
const avataresLadron = ['🦹', '🦹‍♂️', '👺', '🐺']

// Quests / Achievements
const misiones = reactive([
  { id: 'm1', titulo: 'Atiende a 10 Clientes', meta: 10, actual: computed(() => clientesAtendidos.value), recompensa: 150, cobrada: false },
  { id: 'm2', titulo: 'Atrapa a 3 Ladrones', meta: 3, actual: computed(() => ladronesAtrapados.value), recompensa: 350, cobrada: false },
  { id: 'm3', titulo: 'Logra un Combo x5', meta: 5, actual: computed(() => comboStreak.value), recompensa: 250, cobrada: false },
  { id: 'm4', titulo: 'Alcanza $5,000 en Ventas', meta: 5000, actual: computed(() => ventasTotales.value), recompensa: 800, cobrada: false },
  { id: 'm5', titulo: 'Llega al Nivel 5 de Tienda', meta: 5, actual: computed(() => nivel.value), recompensa: 1200, cobrada: false }
])

let intervals = []

// Computeds
const totalItemsInventario = computed(() => Object.values(inventario.value).reduce((sum, cant) => sum + cant, 0))

const capacidadAlmacen = computed(() => {
  const niv = mejoras.value.find(m => m.id === 'almacen')?.nivelActual || 0
  return 30 + (niv * 35)
})

const descuentoMayorista = computed(() => {
  const niv = mejoras.value.find(m => m.id === 'camion')?.nivelActual || 0
  return 1 - (niv * 0.08)
})

const multiplicadorPropina = computed(() => {
  const nivDeco = mejoras.value.find(m => m.id === 'decoracion')?.nivelActual || 0
  const nivTpv = mejoras.value.find(m => m.id === 'tpv')?.nivelActual || 0
  return 1 + (nivDeco * 0.18) + (nivTpv * 0.10)
})

const factorPaciencia = computed(() => {
  const niv = mejoras.value.find(m => m.id === 'cafe')?.nivelActual || 0
  return 1 + (niv * 0.25)
})

const productosDisponiblesPorNivel = computed(() => catalogo.value.filter(p => nivel.value >= p.nivelMinimo))

const maxClientesEnTienda = computed(() => {
  return Math.min(7, 4 + Math.floor(nivel.value / 3))
})

const intervaloCliente = computed(() => {
  const mejoraPub = mejoras.value.find(m => m.id === 'publicidad')?.nivelActual || 0
  let base = Math.max(1800, 5200 - mejoraPub * 700)
  if (eventoActivo.value?.tipo === 'RUSH_HOUR') {
    base = 1100
  }
  return base
})

// Notification helper
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
  return Math.max(1, Math.round(producto.precioCompra * descuentoMayorista.value))
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
    mostrarNotificacion('¡No tienes suficiente dinero!', 'alerta')
    sfx.playError()
    return
  }

  dinero.value -= costoTotal
  inventario.value[producto.id] = (inventario.value[producto.id] || 0) + cantidad
  sfx.playBuy()
  mostrarNotificacion(`Compraste ${cantidad}x ${producto.nombre} (-$${costoTotal})`, 'info')
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
  const aComprar = Math.min(espacioLibre, cantidadPosiblePorDinero, 10)

  if (aComprar <= 0) {
    mostrarNotificacion('¡Sin dinero suficiente para rellenar!', 'alerta')
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
    dinero.value += nivel.value * 120 // Level up reward bonus
    sfx.playLevelUp()
    mostrarNotificacion(`🎉 ¡SUBISTE AL NIVEL ${nivel.value}! Bonificación: +$${nivel.value * 120}`, 'exito')
  }
}

// Generate Clients & Thieves
const generarCliente = () => {
  if (clientes.value.length >= maxClientesEnTienda.value) return
  const pool = productosDisponiblesPorNivel.value
  if (pool.length === 0) return

  // 12% chance of Thief if level >= 2
  const esLadron = nivel.value >= 2 && Math.random() < 0.12 && !clientes.value.some(c => c.esLadron)
  if (esLadron) {
    const guardiaNivel = mejoras.value.find(m => m.id === 'seguridad')?.nivelActual || 0
    if (guardiaNivel > 0) {
      // Auto-caught by security guard!
      ladronesAtrapados.value++
      const recompensa = 80 + (nivel.value * 25)
      dinero.value += recompensa
      sumarXP(40)
      sfx.playCatch()
      mostrarNotificacion(`👮 ¡Tu Guardia arrestó a un Ladrón! Recompensa: +$${recompensa}`, 'exito')
      return
    }

    // Spawn thief as interactive challenge
    sfx.playAlarm()
    clientes.value.push({
      id: Date.now() + Math.random(),
      nombre: '¡Ladrón Sospechoso!',
      avatar: avataresLadron[Math.floor(Math.random() * avataresLadron.length)],
      esLadron: true,
      tiempoRobo: 100, // decays to 0
      paciencia: 100
    })
    mostrarNotificacion('🚨 ¡UN LADRÓN ENTRÓ A LA TIENDA! ¡Haz clic en él para atraparlo!', 'alerta')
    return
  }

  // 15% chance of VIP customer
  const esVip = Math.random() < 0.16 && nivel.value >= 2
  const esApurado = !esVip && Math.random() < 0.25

  // Pick 1 to 2 items if VIP or level >= 4
  const numItems = esVip ? 2 : (nivel.value >= 5 && Math.random() < 0.3 ? 2 : 1)
  const pedidos = []
  for (let i = 0; i < numItems; i++) {
    const item = pool[Math.floor(Math.random() * pool.length)]
    pedidos.push(item)
  }

  const nombre = nombresClientes[Math.floor(Math.random() * nombresClientes.length)]
  const avatar = esVip 
    ? avataresVip[Math.floor(Math.random() * avataresVip.length)]
    : avataresNormales[Math.floor(Math.random() * avataresNormales.length)]

  clientes.value.push({
    id: Date.now() + Math.random(),
    nombre: esVip ? `👑 VIP ${nombre}` : nombre,
    avatar,
    esVip,
    esApurado,
    pedidos,
    paciencia: 100,
    maxPaciencia: esApurado ? 65 : 100
  })
}

// Catch Thief Click
const atraparLadron = (cliente) => {
  if (!cliente.esLadron) return
  ladronesAtrapados.value++
  const botin = 100 + (nivel.value * 35)
  dinero.value += botin
  sumarXP(50)
  sfx.playCatch()
  clientes.value = clientes.value.filter(c => c.id !== cliente.id)
  mostrarNotificacion(`🎯 ¡ATRAPASTE AL LADRÓN! Recompensa policial: +$${botin}`, 'exito')
}

// Check if player has all items for a multi-item client
const puedeAtenderCliente = (cliente) => {
  if (cliente.esLadron) return false
  const countsNeeded = {}
  cliente.pedidos.forEach(p => {
    countsNeeded[p.id] = (countsNeeded[p.id] || 0) + 1
  })
  return Object.entries(countsNeeded).every(([id, count]) => getStock(id) >= count)
}

// Serve Customer
const atenderCliente = (cliente, event) => {
  if (cliente.esLadron) {
    atraparLadron(cliente)
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
    xpBase += Math.max(5, Math.round(prod.precioVenta * 0.25))
  })

  // Multipliers
  let multiplier = multiplicadorPropina.value
  if (cliente.esVip) multiplier *= 2.2
  if (cliente.esApurado) multiplier *= 1.4
  if (eventoActivo.value?.tipo === 'MARKET_BOOM') multiplier *= 1.8

  // Combo Streak
  comboStreak.value++
  if (comboResetTimer) clearTimeout(comboResetTimer)
  comboResetTimer = setTimeout(() => {
    comboStreak.value = 0
  }, 4500)

  const comboBonus = 1 + (Math.min(comboStreak.value, 10) * 0.08)
  const gananciaFinal = Math.round(baseVenta * multiplier * comboBonus)

  dinero.value += gananciaFinal
  ventasTotales.value += gananciaFinal
  clientesAtendidos.value++
  sumarXP(Math.round(xpBase * (cliente.esVip ? 3 : 1)))

  sfx.playCoin()
  if (comboStreak.value > 1) {
    sfx.playCombo(comboStreak.value)
  }

  // Floating text
  if (event && event.clientX) {
    spawnFloatingText(event.clientX - 20, event.clientY - 30, `+$${gananciaFinal}`, cliente.esVip ? '#fbbf24' : '#4ade80')
  }

  clientes.value = clientes.value.filter(c => c.id !== cliente.id)
  mostrarNotificacion(`¡Vendido a ${cliente.nombre}! +$${gananciaFinal} ${comboStreak.value > 2 ? `🔥 Racha x${comboStreak.value}` : ''}`, 'exito')
}

// Upgrade purchase
const comprarMejora = (mejora) => {
  if (dinero.value < mejora.costo || mejora.nivelActual >= mejora.maxNivel) {
    sfx.playError()
    return
  }
  dinero.value -= mejora.costo
  mejora.nivelActual++
  mejora.costo = Math.round(mejora.costo * 1.85)
  sfx.playUpgrade()
  sumarXP(35 * mejora.nivelActual)
  mostrarNotificacion(`⭐ ¡Mejora: ${mejora.nombre} Nv.${mejora.nivelActual}!`, 'exito')
}

// Robot automation
const ejecutarRobot = () => {
  const nivelRobot = mejoras.value.find(m => m.id === 'robot')?.nivelActual || 0
  if (nivelRobot === 0 || clientes.value.length === 0) return

  for (const cliente of clientes.value) {
    if (!cliente.esLadron && puedeAtenderCliente(cliente)) {
      atenderCliente(cliente)
      break
    }
  }
}

// Trigger Random Dynamic Events
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
      tipo: 'INSPECTION',
      titulo: '📋 ¡INSPECCIÓN DE VARIEDAD Y SANIDAD!',
      desc: 'El gremio evalúa tu stock. Si tienes al menos 4 productos con stock, ganas un subsidio.',
      icono: '👨‍⚖️',
      duracion: 6
    }
  ]

  const ev = eventosPosibles[Math.floor(Math.random() * eventosPosibles.length)]
  eventoActivo.value = { ...ev, fin: Date.now() + ev.duracion * 1000 }
  sfx.playUpgrade()

  if (ev.tipo === 'INSPECTION') {
    setTimeout(() => {
      const productosConStock = catalogo.value.filter(p => getStock(p.id) > 0).length
      if (productosConStock >= 4) {
        const premio = 180 + (nivel.value * 60)
        dinero.value += premio
        sumarXP(60)
        sfx.playLevelUp()
        mostrarNotificacion(`🏆 ¡Excelente inspección! Gremio otorgó subsidio: +$${premio}`, 'exito')
      } else {
        mostrarNotificacion('⚠️ Inspección mediocre: necesitas tener stock variado para ganar premios.', 'alerta')
      }
      eventoActivo.value = null
    }, 4500)
    return
  }

  eventoTimeout = setTimeout(() => {
    eventoActivo.value = null
    mostrarNotificacion('El evento especial ha terminado.', 'info')
  }, ev.duracion * 1000)
}

// Claim Quest Reward
const cobrarMision = (mision) => {
  if (mision.cobrada || mision.actual < mision.meta) return
  mision.cobrada = true
  dinero.value += mision.recompensa
  sumarXP(80)
  sfx.playLevelUp()
  mostrarNotificacion(`🎁 ¡Recompensa de misión cobrada: +$${mision.recompensa}!`, 'exito')
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
    dinero.value = 120
    ventasTotales.value = 0
    clientesAtendidos.value = 0
    clientesPerdidos.value = 0
    ladronesAtrapados.value = 0
    nivel.value = 1
    xp.value = 0
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

  // Patience decay loop
  intervals.push(setInterval(() => {
    const rate = 1.8 / factorPaciencia.value
    for (let i = clientes.value.length - 1; i >= 0; i--) {
      const cliente = clientes.value[i]
      if (cliente.esLadron) {
        cliente.tiempoRobo -= 2.2
        if (cliente.tiempoRobo <= 0) {
          // Thief stole money!
          const robo = Math.min(dinero.value, 80 + nivel.value * 20)
          dinero.value -= robo
          clientes.value.splice(i, 1)
          sfx.playError()
          mostrarNotificacion(`💸 ¡EL LADRÓN ESCAPÓ CON $${robo} DE TU CAJA!`, 'alerta')
        }
      } else {
        cliente.paciencia -= (cliente.esApurado ? rate * 1.8 : rate)
        if (cliente.paciencia <= 0) {
          clientes.value.splice(i, 1)
          clientesPerdidos.value++
          comboStreak.value = 0
          mostrarNotificacion(`${cliente.nombre} se cansó de esperar y se fue 😢`, 'alerta')
        }
      }
    }
  }, 250))

  // Customer Spawner
  const runSpawner = () => {
    generarCliente()
    intervals.push(setTimeout(runSpawner, intervaloCliente.value))
  }
  intervals.push(setTimeout(runSpawner, 2000))

  // Robot Automation Loop
  intervals.push(setInterval(ejecutarRobot, 1600))

  // Dynamic Event Spawner (every 35-50s)
  intervals.push(setInterval(() => {
    if (Math.random() < 0.65) {
      lanzarEventoAleatorio()
    }
  }, 38000))

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
    <!-- TOP HEADER WITH RANK, PROGRESS & STATS -->
    <header class="header">
      <div class="brand-section">
        <div class="brand-title-row">
          <span class="store-avatar">{{ rangoActual.icono }}</span>
          <div>
            <h1>🏪 {{ nombreTienda }}</h1>
            <span class="rango-subtag" :style="{ color: rangoActual.color }">{{ rangoActual.titulo }}</span>
          </div>
          <span class="level-badge">NV. {{ nivel }} ⭐</span>
        </div>

        <!-- XP PROGRESS BAR -->
        <div class="xp-container">
          <div class="xp-labels">
            <span>Experiencia (XP)</span>
            <span>{{ xp }} / {{ xpRequerido }} XP</span>
          </div>
          <div class="xp-bar">
            <div class="xp-fill" :style="{ width: Math.min(100, (xp / xpRequerido) * 100) + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat-item dinero">
          <span class="stat-icon">💰</span>
          <div>
            <div class="stat-label">Caja / Dinero</div>
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
          <span class="stat-icon">📈</span>
          <div>
            <div class="stat-label">Ventas Totales</div>
            <div class="stat-value">${{ ventasTotales.toLocaleString() }}</div>
          </div>
        </div>
        <div class="stat-item combo-item" v-if="comboStreak > 1">
          <span class="stat-icon">🔥</span>
          <div>
            <div class="stat-label">Racha Combo</div>
            <div class="stat-value text-combo">x{{ comboStreak }} (x{{ (1 + comboStreak * 0.08).toFixed(2) }} $)</div>
          </div>
        </div>
      </div>
    </header>

    <!-- ACTIVE EVENT BANNER -->
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
          <p>Esperando clientes... 👀 ¡Mejora el marketing para atraer más rápido!</p>
        </div>

        <div class="clientes-list">
          <div 
            v-for="cliente in clientes" 
            :key="cliente.id" 
            class="cliente-card"
            :class="{ 
              'paciencia-baja': cliente.paciencia < 35,
              'es-vip': cliente.esVip,
              'es-ladron': cliente.esLadron,
              'es-apurado': cliente.esApurado
            }"
          >
            <div class="cliente-avatar">{{ cliente.avatar }}</div>

            <!-- Normal / VIP Customer View -->
            <div v-if="!cliente.esLadron" class="cliente-info">
              <div class="cliente-header-row">
                <strong class="cliente-nombre">{{ cliente.nombre }}</strong>
                <span v-if="cliente.esVip" class="vip-tag">⭐ VIP (x2.2 $)</span>
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
            <div v-else class="cliente-info ladron-info">
              <div class="cliente-nombre text-danger"><strong>¡ALERTA DE ROBO!</strong></div>
              <p class="ladron-sub">¡Está intentando vaciar tu caja registradora!</p>
              <div class="paciencia-bar">
                <div class="paciencia-fill robo-fill" :style="{ width: cliente.tiempoRobo + '%' }"></div>
              </div>
            </div>

            <!-- Action Button -->
            <button 
              v-if="!cliente.esLadron"
              class="btn-vender"
              :class="{ 'btn-vip': cliente.esVip }"
              :disabled="!puedeAtenderCliente(cliente)"
              @click="atenderCliente(cliente, $event)"
            >
              <span v-if="puedeAtenderCliente(cliente)">
                Vender (+${{ Math.round(cliente.pedidos.reduce((s, p) => s + p.precioVenta, 0) * multiplicadorPropina * (cliente.esVip ? 2.2 : 1)) }})
              </span>
              <span v-else class="sin-stock">¡Falta Stock!</span>
            </button>

            <button 
              v-else 
              class="btn-atrapar-ladron"
              @click="atraparLadron(cliente)"
            >
              🚨 ¡ATRAPAR!
            </button>
          </div>
        </div>
      </section>

      <!-- 2. ALMACÉN Y SUMINISTROS -->
      <section class="game-card inventario-col">
        <div class="card-header">
          <h2>📦 Almacén y Suministros</h2>
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
                <span class="costo">Costo: ${{ getPrecioCompra(prod) }}</span>
                <span class="venta">Venta: ${{ prod.precioVenta }}</span>
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
                +1 (${{ getPrecioCompra(prod) }})
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

      <!-- 3. MEJORAS & MISIONES -->
      <section class="game-card mejoras-col">
        <div class="card-header">
          <h2>⚡ Mejoras y Negocio</h2>
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
                <span class="quest-prog">{{ Math.min(m.actual, m.meta) }} / {{ m.meta }}</span>
              </div>
              <button 
                class="btn-claim-quest"
                :disabled="m.cobrada || m.actual < m.meta"
                @click="cobrarMision(m)"
              >
                <span v-if="!m.cobrada">+${{ m.recompensa }}</span>
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
  max-width: 1300px; 
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
  margin-bottom: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}

.brand-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 280px;
}

.brand-title-row { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}

.store-avatar {
  font-size: 2rem;
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

.rango-subtag {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  background: linear-gradient(90deg, #38bdf8, #818cf8);
  transition: width 0.3s ease;
}

.stats-bar { 
  display: flex; 
  gap: 12px; 
  flex-wrap: wrap;
}

.stat-item { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  background: rgba(15, 23, 42, 0.75); 
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px 14px; 
  border-radius: 10px; 
}

.stat-item.dinero {
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(74, 222, 128, 0.08);
}

.stat-item.dinero .stat-value { 
  color: #4ade80; 
  font-weight: 900; 
  font-size: 1.15rem;
}

.stat-item.combo-item {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.1);
  animation: pulse 1s infinite alternate;
}

.text-combo {
  color: #f59e0b;
  font-weight: 900;
}

.stat-icon { font-size: 1.3rem; }
.stat-label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
.stat-value { font-size: 1rem; font-weight: 800; }

/* EVENT BANNER */
.event-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  border-radius: 10px;
  margin-bottom: 16px;
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

.cliente-card.es-ladron {
  border-color: #ef4444;
  background: rgba(127, 29, 29, 0.35);
  animation: pulseThief 1s infinite alternate;
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

.robo-fill {
  background: linear-gradient(90deg, #dc2626, #ef4444);
}

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

.btn-vip {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #000;
}

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

/* WAREHOUSE PRODUCTS GRID */
.productos-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); 
  gap: 10px; 
  max-height: 540px;
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
.producto-detalles h3 { font-size: 0.82rem; margin: 0 0 4px 0; font-weight: 700; }
.precios-info { display: flex; gap: 6px; font-size: 0.7rem; justify-content: center; }
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

.stock-cero {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.compra-acciones { display: flex; gap: 4px; width: 100%; }
.btn-comprar { 
  flex: 1; 
  background: #2563eb; 
  color: white; 
  border: none; 
  padding: 6px 4px; 
  border-radius: 6px; 
  font-size: 0.72rem; 
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
  font-size: 0.72rem; 
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
.mejora-info h4 { font-size: 0.85rem; margin: 0 0 2px 0; font-weight: 800; }
.mejora-info p { font-size: 0.7rem; color: #94a3b8; margin: 0; line-height: 1.3; }

.btn-upgrade { 
  background: linear-gradient(135deg, #f59e0b, #d97706); 
  color: #000; 
  border: none; 
  padding: 7px 12px; 
  border-radius: 6px; 
  font-weight: 900; 
  font-size: 0.8rem; 
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
  100% { box-shadow: 0 0 18px rgba(239, 68, 68, 0.6); }
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
