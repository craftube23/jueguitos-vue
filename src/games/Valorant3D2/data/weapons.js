// src/games/Valorant3D2/data/weapons.js

export const WEAPON_CATEGORIES = {
  SIDEARMS: 'Pistolas',
  SMGS: 'Subfusiles (SMG)',
  SHOTGUNS: 'Escopetas',
  RIFLES: 'Rifles de Asalto',
  SNIPERS: 'Francotiradores',
  HEAVIES: 'Ametralladoras Pesadas',
  MELEE: 'Cuerpo a Cuerpo'
}

export const WEAPONS = {
  // SIDEARMS
  classic: {
    id: 'classic',
    name: 'Classic',
    category: WEAPON_CATEGORIES.SIDEARMS,
    cost: 0,
    damage: { head: 78, body: 26, leg: 22 },
    fireRate: 6.75, // shots/sec
    magazineSize: 12,
    reserveAmmo: 36,
    reloadTime: 1.5,
    range: 600,
    spread: 0.04,
    recoil: 0.03,
    bulletSpeed: 2400,
    wallPenetration: 'LOW',
    sound: 'phantom',
    icon: '🔫',
    desc: 'Pistola estándar de dotación básica. Precisa en disparos individuales con modo ráfaga alternativo.'
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    category: WEAPON_CATEGORIES.SIDEARMS,
    cost: 500,
    damage: { head: 105, body: 30, leg: 25 },
    fireRate: 6.75,
    magazineSize: 15,
    reserveAmmo: 45,
    reloadTime: 1.5,
    range: 750,
    spread: 0.02,
    recoil: 0.025,
    bulletSpeed: 2600,
    wallPenetration: 'MEDIUM',
    sound: 'ghost',
    icon: '🤫',
    desc: 'Pistola con silenciador de alta precisión. Elimina de un solo tiro a la cabeza a rivales sin escudo.'
  },
  sheriff: {
    id: 'sheriff',
    name: 'Sheriff',
    category: WEAPON_CATEGORIES.SIDEARMS,
    cost: 800,
    damage: { head: 159, body: 55, leg: 46 },
    fireRate: 4.0,
    magazineSize: 6,
    reserveAmmo: 24,
    reloadTime: 2.25,
    range: 900,
    spread: 0.015,
    recoil: 0.08,
    bulletSpeed: 3000,
    wallPenetration: 'HIGH',
    sound: 'sheriff',
    icon: '🤠',
    desc: 'Revólver de gran calibre. Capaz de eliminar de un solo tiro en la cabeza a cualquier distancia media.'
  },

  // SMGS
  spectre: {
    id: 'spectre',
    name: 'Spectre',
    category: WEAPON_CATEGORIES.SMGS,
    cost: 1600,
    damage: { head: 78, body: 26, leg: 22 },
    fireRate: 13.33,
    magazineSize: 30,
    reserveAmmo: 90,
    reloadTime: 2.25,
    range: 650,
    spread: 0.05,
    recoil: 0.04,
    bulletSpeed: 2200,
    wallPenetration: 'MEDIUM',
    sound: 'spectre',
    icon: '⚡',
    desc: 'Subfusil silenciado versátil con excelente precisión en movimiento a corta distancia.'
  },

  // SHOTGUNS
  judge: {
    id: 'judge',
    name: 'Judge',
    category: WEAPON_CATEGORIES.SHOTGUNS,
    cost: 1850,
    damage: { head: 34, body: 17, leg: 14 }, // por perdigón (12 perdigones)
    pellets: 12,
    fireRate: 3.5,
    magazineSize: 7,
    reserveAmmo: 21,
    reloadTime: 2.2,
    range: 350,
    spread: 0.16,
    recoil: 0.12,
    bulletSpeed: 1800,
    wallPenetration: 'MEDIUM',
    sound: 'operator',
    icon: '💥',
    desc: 'Escopeta automática letal en espacios cerrados que dispara una lluvia de 12 perdigones.'
  },

  // RIFLES
  vandal: {
    id: 'vandal',
    name: 'Vandal',
    category: WEAPON_CATEGORIES.RIFLES,
    cost: 2900,
    damage: { head: 160, body: 40, leg: 34 },
    fireRate: 9.75,
    magazineSize: 25,
    reserveAmmo: 75,
    reloadTime: 2.5,
    range: 1200,
    spread: 0.012,
    recoil: 0.055,
    bulletSpeed: 3200,
    wallPenetration: 'MEDIUM',
    sound: 'vandal',
    icon: '🔥',
    desc: 'Rifle de asalto de alto impacto. 1 tiro en la cabeza (160 daño) elimina instantáneamente a cualquier distancia.'
  },
  phantom: {
    id: 'phantom',
    name: 'Phantom',
    category: WEAPON_CATEGORIES.RIFLES,
    cost: 2900,
    damage: { head: 156, body: 39, leg: 33 },
    fireRate: 11.0,
    magazineSize: 30,
    reserveAmmo: 90,
    reloadTime: 2.5,
    range: 1000,
    spread: 0.01,
    recoil: 0.038,
    bulletSpeed: 3000,
    wallPenetration: 'MEDIUM',
    sound: 'phantom',
    icon: '🌪️',
    desc: 'Rifle de asalto silenciado de alta cadencia. Sin trazadores de bala visibles a través del humo.'
  },
  guardian: {
    id: 'guardian',
    name: 'Guardian',
    category: WEAPON_CATEGORIES.RIFLES,
    cost: 2250,
    damage: { head: 195, body: 65, leg: 48 },
    fireRate: 5.25,
    magazineSize: 12,
    reserveAmmo: 36,
    reloadTime: 2.5,
    range: 1400,
    spread: 0.005,
    recoil: 0.07,
    bulletSpeed: 3500,
    wallPenetration: 'HIGH',
    sound: 'guardian',
    icon: '🎯',
    desc: 'Rifle semiautomático DMR de alta penetración de muros y precisión milimétrica.'
  },

  // SNIPERS
  operator: {
    id: 'operator',
    name: 'Operator (Op)',
    category: WEAPON_CATEGORIES.SNIPERS,
    cost: 4700,
    damage: { head: 255, body: 150, leg: 120 },
    fireRate: 0.75,
    magazineSize: 5,
    reserveAmmo: 10,
    reloadTime: 3.7,
    range: 2000,
    spread: 0.001,
    recoil: 0.35,
    bulletSpeed: 5000,
    wallPenetration: 'HIGH',
    sound: 'operator',
    icon: '🔭',
    desc: 'Francotirador pesado colosal. Elimina de un solo disparo en el cuerpo o la cabeza a cualquier objetivo.'
  },

  // HEAVY
  odin: {
    id: 'odin',
    name: 'Odin',
    category: WEAPON_CATEGORIES.HEAVIES,
    cost: 3200,
    damage: { head: 95, body: 38, leg: 32 },
    fireRate: 12.0, // ramps up to 15.6
    magazineSize: 100,
    reserveAmmo: 200,
    reloadTime: 5.0,
    range: 1100,
    spread: 0.045,
    recoil: 0.065,
    bulletSpeed: 2800,
    wallPenetration: 'HIGH',
    sound: 'vandal',
    icon: '💥',
    desc: 'Ametralladora pesada con cargador de 100 balas y penetración de muros masiva.'
  },

  // MELEE
  knife: {
    id: 'knife',
    name: 'Cuchillo Táctico',
    category: WEAPON_CATEGORIES.MELEE,
    cost: 0,
    damage: { head: 75, body: 50, backstab: 150 },
    fireRate: 2.0,
    magazineSize: Infinity,
    reserveAmmo: Infinity,
    reloadTime: 0,
    range: 65,
    spread: 0,
    recoil: 0,
    bulletSpeed: 0,
    wallPenetration: 'NONE',
    sound: 'ability',
    icon: '🔪',
    desc: 'Arma cuerpo a cuerpo rápida. Causa 150 de daño letal si atacas a un enemigo por la espalda.'
  }
}

export const SHIELDS = {
  light: {
    id: 'light',
    name: 'Escudo Ligero',
    cost: 400,
    amount: 25,
    absorption: 0.66,
    icon: '🛡️',
    desc: 'Otorga 25 puntos de blindaje y absorbe el 66% del daño recibido.'
  },
  heavy: {
    id: 'heavy',
    name: 'Escudo Pesado',
    cost: 1000,
    amount: 50,
    absorption: 0.66,
    icon: '🔰',
    desc: 'Otorga 50 puntos de blindaje máximo y absorbe el 66% del daño recibido.'
  }
}
