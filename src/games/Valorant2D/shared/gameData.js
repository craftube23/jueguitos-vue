// src/games/Valorant2D/shared/gameData.js

export const MAP_DATA = {
  width: 1800,
  height: 1200,
  spawnAttackers: { x: 120, y: 600, w: 100, h: 200 },
  spawnDefenders: { x: 1680, y: 600, w: 100, h: 200 },
  siteA: { x: 1350, y: 280, w: 220, h: 220, name: 'A SITE' },
  siteB: { x: 1350, y: 920, w: 220, h: 220, name: 'B SITE' },
  walls: [
    // Outer boundaries
    { x: 0, y: 0, w: 1800, h: 40 },
    { x: 0, y: 1160, w: 1800, h: 40 },
    { x: 0, y: 0, w: 40, h: 1200 },
    { x: 1760, y: 0, w: 40, h: 1200 },

    // A Main / Long A
    { x: 320, y: 180, w: 40, h: 280 },
    { x: 320, y: 180, w: 320, h: 40 },
    { x: 800, y: 180, w: 40, h: 200 },
    { x: 980, y: 180, w: 40, h: 300 },

    // Mid Area
    { x: 500, y: 480, w: 40, h: 240 },
    { x: 680, y: 400, w: 180, h: 40 },
    { x: 680, y: 760, w: 180, h: 40 },
    { x: 920, y: 560, w: 40, h: 180 },

    // B Main / Long B
    { x: 320, y: 740, w: 40, h: 280 },
    { x: 320, y: 980, w: 320, h: 40 },
    { x: 800, y: 820, w: 40, h: 200 },
    { x: 980, y: 720, w: 40, h: 300 },

    // Site A Cover Blocks
    { x: 1240, y: 220, w: 60, h: 60 },
    { x: 1460, y: 380, w: 60, h: 60 },

    // Site B Cover Blocks
    { x: 1240, y: 920, w: 60, h: 60 },
    { x: 1460, y: 760, w: 60, h: 60 },

    // Defender CT Spawn Dividers
    { x: 1540, y: 520, w: 40, h: 160 }
  ]
}

export const AGENTS = {
  jett: {
    id: 'jett',
    name: 'JETT',
    role: 'Duelista',
    row: 1, col: 0,
    color: '#00ffff',
    desc: 'Dash direccional supersónico, elevación vertical y dagas precisas.',
    ultName: 'Tormenta de Cuchillas (5 Dagas)',
    abilities: [
      { key: 'E', name: 'Tailwind (Dash)', desc: 'Impulso supersónico instantáneo en dirección de movimiento.', icon: '⚡' },
      { key: 'Q', name: 'Updraft (Salto)', desc: 'Impulso vertical evasivo.', icon: '🌪️' },
      { key: 'C', name: 'Cloudburst (Humo)', desc: 'Humo táctico rápido de 4.5s.', icon: '☁️' }
    ]
  },
  sova: {
    id: 'sova',
    name: 'SOVA',
    role: 'Iniciador',
    row: 3, col: 1,
    color: '#1e88e5',
    desc: 'Flechas de reconocimiento con rebotes matemáticos y rayos de daño a través de muros.',
    ultName: 'Furia del Cazador (3 Rayos Perforantes)',
    abilities: [
      { key: 'E', name: 'Recon Bolt (Radar)', desc: 'Flecha sonar que rebota y proyecta siluetas enemigas.', icon: '🎯' },
      { key: 'Q', name: 'Shock Bolt (Choque)', desc: 'Flecha explosiva de rebote (10-75 daño).', icon: '⚡' },
      { key: 'C', name: 'Owl Drone (Dron)', desc: 'Pilotea un dron que marca y revela enemigos.', icon: '🦉' }
    ]
  },
  phoenix: {
    id: 'phoenix',
    name: 'PHOENIX',
    role: 'Duelista',
    row: 2, col: 0,
    color: '#ff5722',
    desc: 'Fuego que quema rivales y le cura la vida. Flashes en esquinas de 90°.',
    ultName: 'Cenizas (Segunda Vida)',
    abilities: [
      { key: 'E', name: 'Hot Hands (Fuego)', desc: 'Molotov que daña enemigos y cura a Phoenix.', icon: '🔥' },
      { key: 'Q', name: 'Curveball (Flash)', desc: 'Destello en curva de 90° que ciega.', icon: '✨' },
      { key: 'C', name: 'Blaze (Muro)', desc: 'Pared de fuego ardiente que corta visión.', icon: '🧱' }
    ]
  },
  reyna: {
    id: 'reyna',
    name: 'REYNA',
    role: 'Duelista',
    row: 2, col: 2,
    color: '#9c27b0',
    desc: 'Cosecha orbes de alma de enemigos eliminados para curarse o volverse intangible.',
    ultName: 'Emperatriz (Frenesí Total)',
    abilities: [
      { key: 'E', name: 'Dismiss (Intangible)', desc: 'Invulnerabilidad temporal y velocidad al consumir un orbe.', icon: '👻' },
      { key: 'Q', name: 'Devour (Curación)', desc: 'Consume un orbe y se cura hasta 100 HP (+50 sobreescudo).', icon: '💖' },
      { key: 'C', name: 'Leer (Ojo Ciego)', desc: 'Ojo etéreo a través de muros que reduce visión (Nearsight).', icon: '👁️' }
    ]
  },
  sage: {
    id: 'sage',
    name: 'SAGE',
    role: 'Centinela',
    row: 2, col: 3,
    color: '#26a69a',
    desc: 'Muros físicos destructibles, orbes de ralentización y resurrección de aliados.',
    ultName: 'Resurrección (Revivir Aliado)',
    abilities: [
      { key: 'E', name: 'Healing Orb (Cura)', desc: 'Restaura 100 HP a un aliado o 30 HP a sí misma.', icon: '💚' },
      { key: 'Q', name: 'Slow Orb (Hielo)', desc: 'Campo de hielo que ralentiza un 50% el paso.', icon: '❄️' },
      { key: 'C', name: 'Barrier Orb (Muro)', desc: 'Construye 4 bloques sólidos con 800 HP destructibles.', icon: '🧱' }
    ]
  },
  cypher: {
    id: 'cypher',
    name: 'CYPHER',
    role: 'Centinela',
    row: 0, col: 3,
    color: '#cfd8dc',
    desc: 'Cables trampa láser, jaulas sonoras y revelación global de enemigos.',
    ultName: 'Hurto Neuronal (Revelar Todos)',
    abilities: [
      { key: 'E', name: 'Spycam (Cámara)', desc: 'Cámara remota que dispara dardos de rastreo.', icon: '📷' },
      { key: 'Q', name: 'Cyber Cage (Jaula)', desc: 'Cilindro de bloqueo de visión con aviso sonoro.', icon: '🕸️' },
      { key: 'C', name: 'Trapwire (Cable)', desc: 'Cable láser que aturde, ralentiza y revela al cruzarlo.', icon: '⚡' }
    ]
  },
  brimstone: {
    id: 'brimstone',
    name: 'BRIMSTONE',
    role: 'Controlador',
    row: 0, col: 2,
    color: '#e65100',
    desc: 'Humos orbitales triples de 19s, molotov industrial y baliza de cadencia rápida.',
    ultName: 'Golpe Orbital (Láser Satelital)',
    abilities: [
      { key: 'E', name: 'Sky Smokes (3 Humos)', desc: 'Despliegue orbital de hasta 3 humos simultáneos.', icon: '💨' },
      { key: 'Q', name: 'Incendiary (Molly)', desc: 'Granada de napalm que quema el suelo (60 DPS).', icon: '🔥' },
      { key: 'C', name: 'Stim Beacon (Baliza)', desc: '+15% velocidad y +25% cadencia de disparo.', icon: '⚡' }
    ]
  },
  raze: {
    id: 'raze',
    name: 'RAZE',
    role: 'Duelista',
    row: 2, col: 1,
    color: '#ff9800',
    desc: 'Fardo de impulso aéreo, granada de racimo cuádruple y lanzacohetes letal.',
    ultName: 'Cierre de Telón (Lanzacohetes)',
    abilities: [
      { key: 'E', name: 'Boom Bot (Robot)', desc: 'Dron rodante que persigue y explota al contacto.', icon: '🤖' },
      { key: 'Q', name: 'Paint Shells (Granada)', desc: 'Granada de racimo que se divide en 4 submuniciones.', icon: '💣' },
      { key: 'C', name: 'Blast Pack (Fardo)', desc: 'Paquete de impulso aéreo y daño en área.', icon: '💥' }
    ]
  },
  omen: {
    id: 'omen',
    name: 'OMEN',
    role: 'Controlador',
    row: 1, col: 3,
    color: '#5c6bc0',
    desc: 'Teletransporte táctico, proyectil de paranoia a través de muros y humos sombríos.',
    ultName: 'Desde las Sombras (Teleport Global)',
    abilities: [
      { key: 'E', name: 'Dark Cover (Humo)', desc: 'Esfera de sombra hueca recargable cada 30s.', icon: '🌑' },
      { key: 'Q', name: 'Paranoia (Ceguera)', desc: 'Sombra perforante que ensordece y ciega a través de paredes.', icon: '👁️' },
      { key: 'C', name: 'Shrouded Step (Salto)', desc: 'Teletransporte corto a una posición visible.', icon: '👣' }
    ]
  },
  neon: {
    id: 'neon',
    name: 'NEON',
    role: 'Duelista',
    customImg: '/assets/agent_neon.png',
    color: '#00e5ff',
    desc: 'Sprint electrizante, doble muro de rayos, rebote aturdidor y láser dactilar.',
    ultName: 'Sobrecarga (Láser de Dedos)',
    abilities: [
      { key: 'E', name: 'High Gear (Sprint)', desc: 'Aumenta velocidad +60% y permite deslizamiento veloz.', icon: '⚡' },
      { key: 'Q', name: 'Relay Bolt (Aturdir)', desc: 'Lanza rayo que rebota y crea 2 zonas de aturdimiento.', icon: '💥' },
      { key: 'C', name: 'Fast Lane (Muro Doble)', desc: 'Lanza 2 líneas paralelas de electricidad que bloquean visión.', icon: '⚡' }
    ]
  },
  gekko: {
    id: 'gekko',
    name: 'GEKKO',
    role: 'Iniciador',
    customImg: '/assets/agent_gekko.png',
    color: '#76ff03',
    desc: 'Compañeros biológicos recuperables: Dizzy ciega, Wingman planta la Spike y Thrash detiene.',
    ultName: 'Thrash (Criatura de Carga)',
    abilities: [
      { key: 'E', name: 'Dizzy (Plasma)', desc: 'Dispara plasma aéreo que ciega a los enemigos en visión.', icon: '🌟' },
      { key: 'Q', name: 'Wingman (Planta/Busca)', desc: 'Pequeño compañero que busca enemigos o planta la Spike.', icon: '🐾' },
      { key: 'C', name: 'Mosh Pit (Ácido)', desc: 'Lanza criatura verde que cubre un área amplia de ácido letal.', icon: '🟢' }
    ]
  },
  chamber: {
    id: 'chamber',
    name: 'CHAMBER',
    role: 'Centinela',
    customImg: '/assets/agent_chamber.png',
    color: '#ffd700',
    desc: 'Elegancia letal con pistola Headhunter, trampa Trademark y francotirador pesado Tour de Force.',
    ultName: 'Tour De Force (Francotirador Pesado)',
    abilities: [
      { key: 'E', name: 'Rendezvous (Teleport)', desc: 'Ancla que te teletransporta instantáneamente al activarla.', icon: '📍' },
      { key: 'Q', name: 'Headhunter (Pistola Pesada)', desc: 'Pistola personalizada de alta precisión con mira.', icon: '🎯' },
      { key: 'C', name: 'Trademark (Trampa)', desc: 'Escáner que ralentiza a los enemigos que ingresan al área.', icon: '⏱️' }
    ]
  },
  viper: {
    id: 'viper',
    name: 'VIPER',
    role: 'Controlador',
    row: 3, col: 3,
    color: '#00e676',
    desc: 'Combustible tóxico reutilizable, muros corrosivos y pozo químico.',
    ultName: 'Fosa de Viper (Gran Nube Tóxica)',
    abilities: [
      { key: 'E', name: 'Toxic Screen (Muro Tóxico)', desc: 'Línea de emisores de gas venenoso.', icon: '☣️' },
      { key: 'Q', name: 'Poison Cloud (Emisor)', desc: 'Dispositivo que emite humo tóxico consumible.', icon: '☁️' },
      { key: 'C', name: 'Snake Bite (Ácido)', desc: 'Frasco de químico que daña y vuelve vulnerable.', icon: '🧪' }
    ]
  },
  breach: {
    id: 'breach',
    name: 'BREACH',
    role: 'Iniciador',
    row: 0, col: 1,
    color: '#8d6e63',
    desc: 'Cargas perforantes sísmicas a través de muros y conmoción masiva.',
    ultName: 'Fragor Imparable (Terremoto Cono)',
    abilities: [
      { key: 'E', name: 'Fault Line (Terremoto)', desc: 'Línea sísmica que aturde a los enemigos.', icon: '⚡' },
      { key: 'Q', name: 'Flashpoint (Flash Muro)', desc: 'Carga que ciega a través de paredes.', icon: '💥' },
      { key: 'C', name: 'Aftershock (Réplica)', desc: 'Ráfaga de tres pulsos de daño alto por el muro.', icon: '🧨' }
    ]
  },
  kayo: {
    id: 'kayo',
    name: 'KAY/O',
    role: 'Iniciador',
    row: 1, col: 1,
    color: '#78909c',
    desc: 'Supresión robótica que bloquea habilidades enemigas y granadas cegadoras pop-flash.',
    ultName: 'NULL/cmd (Pulsos Supresores)',
    abilities: [
      { key: 'E', name: 'ZERO/point (Cuchillo)', desc: 'Cuchillo que suprime habilidades enemigas en un radio de 12m.', icon: '🗡️' },
      { key: 'Q', name: 'FLASH/drive (Granada Cegadora)', desc: 'Granada de destello con activación rápida.', icon: '✨' },
      { key: 'C', name: 'FRAG/ment (Granada de Pulsos)', desc: 'Granada que explota 4 veces en el centro.', icon: '💥' }
    ]
  },
  astra: {
    id: 'astra',
    name: 'ASTRA',
    role: 'Controlador',
    row: 0, col: 0,
    color: '#ba68c8',
    desc: 'Colocación astral de estrellas en el mapa para activar pozos, pulsos y muros cósmicos.',
    ultName: 'División Cósmica (Muro Infinito)',
    abilities: [
      { key: 'E', name: 'Nebula (Humo Cósmico)', desc: 'Activa una estrella para convertirla en humo.', icon: '🌌' },
      { key: 'Q', name: 'Nova Pulse (Conmoción)', desc: 'Detona una estrella para aturdir a todos en el área.', icon: '💫' },
      { key: 'C', name: 'Gravity Well (Pozo Gravitatorio)', desc: 'Atrae a los jugadores hacia el centro y los hace vulnerables.', icon: '🌀' }
    ]
  },
  killjoy: {
    id: 'killjoy',
    name: 'KILLJOY',
    role: 'Centinela',
    row: 1, col: 2,
    color: '#ffeb3b',
    desc: 'Torretas automáticas, nanoenjambres y dispositivo de bloqueo de zona.',
    ultName: 'Bloqueo (Detener Zona)',
    abilities: [
      { key: 'E', name: 'Turret (Torreta)', desc: 'Torreta automática con 180° de visión que dispara a enemigos.', icon: '🔫' },
      { key: 'Q', name: 'Alarmbot (Bot Alarma)', desc: 'Bot invisible que persigue y aplica Vulnerable.', icon: '🚨' },
      { key: 'C', name: 'Nanoswarm (Nanoenjambre)', desc: 'Granada oculta que despliega un enjambre de nanobots.', icon: '🐝' }
    ]
  },
  skye: {
    id: 'skye',
    name: 'SKYE',
    role: 'Iniciador',
    row: 3, col: 0,
    color: '#81c784',
    desc: 'Halcón teledirigido que ciega, lobo explorador y curación a todo su equipo.',
    ultName: 'Buscadores (3 Espíritus)',
    abilities: [
      { key: 'E', name: 'Guiding Light (Halcón)', desc: 'Halcón controlable que destella al activarlo.', icon: '🦅' },
      { key: 'Q', name: 'Trailblazer (Lobo)', desc: 'Controla a un lobo que muerde y conmociona.', icon: '🐺' },
      { key: 'C', name: 'Regrowth (Curación)', desc: 'Sana a todos los aliados cercanos en línea de visión.', icon: '🌿' }
    ]
  },
  yoru: {
    id: 'yoru',
    name: 'YORU',
    role: 'Duelista',
    row: 3, col: 2,
    color: '#3949ab',
    desc: 'Distorsión dimensional, clones de distracción, flashes que rebotan y grieta dimensional.',
    ultName: 'Viaje Interdimensional (Invisibilidad)',
    abilities: [
      { key: 'E', name: 'Gatecrash (Teleport)', desc: 'Lanza un orbe hacia adelante y te teletransportas a él.', icon: '🌀' },
      { key: 'Q', name: 'Blindside (Flash)', desc: 'Granada de destello que ciega tras rebotar en una pared.', icon: '✨' },
      { key: 'C', name: 'Fakeout (Clon)', desc: 'Crea un clon de ti mismo que camina y ciega al ser disparado.', icon: '👥' }
    ]
  }
}

export const WEAPONS = [
  // Sidearms
  { id: 'classic', name: 'Classic', category: 'Sidearms', price: 0, damage: 26, headshotMult: 3.0, fireRate: 250, magSize: 12, range: 450, sound: 'ghost' },
  { id: 'shorty', name: 'Shorty', category: 'Sidearms', price: 300, damage: 12, headshotMult: 2.2, fireRate: 300, magSize: 2, pellets: 8, range: 250, sound: 'guardian' },
  { id: 'frenzy', name: 'Frenzy', category: 'Sidearms', price: 450, damage: 22, headshotMult: 2.4, fireRate: 90, magSize: 13, range: 400, sound: 'frenzy' },
  { id: 'ghost', name: 'Ghost', category: 'Sidearms', price: 500, damage: 30, headshotMult: 3.5, fireRate: 180, magSize: 15, range: 550, sound: 'ghost' },
  { id: 'sheriff', name: 'Sheriff', category: 'Sidearms', price: 800, damage: 55, headshotMult: 3.0, fireRate: 350, magSize: 6, range: 700, sound: 'sheriff' },

  // SMGs
  { id: 'stinger', name: 'Stinger', category: 'SMGs', price: 1100, damage: 27, headshotMult: 2.5, fireRate: 65, magSize: 20, range: 480, sound: 'spectre' },
  { id: 'spectre', name: 'Spectre', category: 'SMGs', price: 1600, damage: 26, headshotMult: 3.0, fireRate: 95, magSize: 30, range: 550, sound: 'spectre' },

  // Shotguns
  { id: 'bucky', name: 'Bucky', category: 'Shotguns', price: 850, damage: 20, headshotMult: 2.0, fireRate: 600, magSize: 5, pellets: 15, range: 300, sound: 'guardian' },
  { id: 'judge', name: 'Judge', category: 'Shotguns', price: 1850, damage: 17, headshotMult: 2.0, fireRate: 220, magSize: 7, pellets: 12, range: 350, sound: 'guardian' },

  // Rifles
  { id: 'bulldog', name: 'Bulldog', category: 'Rifles', price: 2050, damage: 35, headshotMult: 3.3, fireRate: 120, magSize: 24, range: 750, sound: 'vandal' },
  { id: 'guardian', name: 'Guardian', category: 'Rifles', price: 2250, damage: 65, headshotMult: 3.0, fireRate: 280, magSize: 12, range: 850, sound: 'guardian' },
  { id: 'phantom', name: 'Phantom', category: 'Rifles', price: 2900, damage: 39, headshotMult: 4.0, fireRate: 105, magSize: 30, range: 750, sound: 'phantom' },
  { id: 'vandal', name: 'Vandal', category: 'Rifles', price: 2900, damage: 40, headshotMult: 4.0, fireRate: 115, magSize: 25, range: 800, sound: 'vandal' },

  // Snipers
  { id: 'marshal', name: 'Marshal', category: 'Snipers', price: 950, damage: 101, headshotMult: 2.0, fireRate: 650, magSize: 5, range: 1000, sound: 'marshal' },
  { id: 'outlaw', name: 'Outlaw', category: 'Snipers', price: 2400, damage: 140, headshotMult: 1.7, fireRate: 500, magSize: 2, range: 1000, sound: 'outlaw' },
  { id: 'operator', name: 'Operator', category: 'Snipers', price: 4700, damage: 150, headshotMult: 2.0, fireRate: 1200, magSize: 5, range: 1200, sound: 'operator' },

  // Heavies
  { id: 'ares', name: 'Ares', category: 'Heavies', price: 1600, damage: 30, headshotMult: 2.4, fireRate: 100, magSize: 50, range: 700, sound: 'vandal' },
  { id: 'odin', name: 'Odin', category: 'Heavies', price: 3200, damage: 38, headshotMult: 2.5, fireRate: 80, magSize: 100, range: 800, sound: 'vandal' },

  // Shields
  { id: 'light_shield', name: 'Escudo Ligero', category: 'Shields', price: 400, shield: 25, isShield: true },
  { id: 'heavy_shield', name: 'Escudo Pesado', category: 'Shields', price: 1000, shield: 50, isShield: true }
]
