// src/games/Valorant3D2/data/mapData.js

export const MAP_CONFIG = {
  id: 'haven_tactical',
  name: 'Haven Tactical 3D',
  modelPath: '/models/mapa.glb',
  width: 2200,
  height: 1500,
  scale3D: 28.0, // Scale factor to map 3D GLB units into 2D tactical coordinates

  // Team Spawn Zones (Top-Down Aligned)
  spawnAttackers: { x: -22, y: 0, z: 0, slots: [
    { x: -22, z: -10 },
    { x: -22, z: -6 },
    { x: -22, z: 0 },
    { x: -22, z: 6 },
    { x: -22, z: 10 }
  ], name: 'T SPAWN (Puntos Rojos Izquierda)' },
  
  spawnDefenders: { x: 22, y: 0, z: 0, slots: [
    { x: 22, z: -10 },
    { x: 22, z: -6 },
    { x: 22, z: 0 },
    { x: 22, z: 6 },
    { x: 22, z: 10 }
  ], name: 'CT SPAWN (Puntos Azules Derecha)' },

  // Bomb / Spike Plant Sites (Green Zones Top & Bottom)
  sites: {
    A: {
      id: 'A',
      name: 'SITE A (Zona Verde Superior)',
      x: 0,
      z: -14,
      width: 14,
      depth: 8,
      radius: 7.5,
      color: '#22c55e'
    },
    B: {
      id: 'B',
      name: 'SITE B (Zona Verde Inferior)',
      x: 0,
      z: 14,
      width: 14,
      depth: 8,
      radius: 7.5,
      color: '#22c55e'
    }
  },

  // Tactical Ultimate Point Orbs (Grant +1 Ult point on pickup)
  ultOrbs: [
    { id: 'orb_a_long', x: 780, y: 180, collected: false, name: 'Orbe A Long' },
    { id: 'orb_b_main', x: 780, y: 1320, collected: false, name: 'Orbe B Main' }
  ],

  // Buy Phase Spawn Barriers (Removed when Buy Phase ends)
  buyBarriers: [
    // Attackers barrier mid-corridors
    { x1: 420, y1: 100, x2: 420, y2: 1400, team: 'attackers', label: 'Barrera Atacantes' },
    // Defenders barrier site entrances
    { x1: 1400, y1: 100, x2: 1400, y2: 1400, team: 'defenders', label: 'Barrera Defensores' }
  ],

  // Tactical Callouts for Minimap & HUD
  callouts: [
    { name: 'T Spawn', x: 200, y: 750 },
    { name: 'A Long', x: 650, y: 250 },
    { name: 'A Lobby', x: 450, y: 320 },
    { name: 'A Short', x: 1050, y: 380 },
    { name: 'A Site', x: 1680, y: 350 },
    { name: 'A Heaven', x: 1880, y: 240 },
    { name: 'Mid Courtyard', x: 950, y: 750 },
    { name: 'Mid Doors', x: 1250, y: 750 },
    { name: 'B Lobby', x: 450, y: 1180 },
    { name: 'B Main', x: 650, y: 1250 },
    { name: 'B Site', x: 1680, y: 1150 },
    { name: 'B Backsite', x: 1900, y: 1220 },
    { name: 'CT Spawn', x: 2000, y: 750 }
  ],

  // 2D Tactical Collision & Wall Segments (Matches mapa.glb architecture)
  walls: [
    // Outer perimeter
    { x: 0, y: 0, w: 2200, h: 40, type: 'boundary' },
    { x: 0, y: 1460, w: 2200, h: 40, type: 'boundary' },
    { x: 0, y: 0, w: 40, h: 1500, type: 'boundary' },
    { x: 2160, y: 0, w: 40, h: 1500, type: 'boundary' },

    // Attackers Spawn Building & Corridor exits
    { x: 320, y: 240, w: 40, h: 360, type: 'wall' },
    { x: 320, y: 900, w: 40, h: 360, type: 'wall' },

    // A Long Walls & Corners
    { x: 360, y: 240, w: 480, h: 40, type: 'wall' },
    { x: 840, y: 120, w: 40, h: 260, type: 'wall' },
    { x: 1020, y: 220, w: 40, h: 300, type: 'wall' },

    // Mid Courtyard Dividers & Connectors
    { x: 620, y: 520, w: 40, h: 460, type: 'wall' },
    { x: 820, y: 440, w: 240, h: 40, type: 'wall' },
    { x: 820, y: 1020, w: 240, h: 40, type: 'wall' },
    { x: 1120, y: 600, w: 40, h: 300, type: 'wall' },

    // B Long & B Main Walls
    { x: 360, y: 1220, w: 480, h: 40, type: 'wall' },
    { x: 840, y: 1120, w: 40, h: 260, type: 'wall' },
    { x: 1020, y: 980, w: 40, h: 300, type: 'wall' },

    // Site A Cover Blocks (Radianite Crates)
    { x: 1540, y: 280, w: 70, h: 70, type: 'crate' },
    { x: 1780, y: 440, w: 70, h: 70, type: 'crate' },
    { x: 1420, y: 320, w: 40, h: 180, type: 'wall' },

    // Site B Cover Blocks (Radianite Crates)
    { x: 1540, y: 1150, w: 70, h: 70, type: 'crate' },
    { x: 1780, y: 990, w: 70, h: 70, type: 'crate' },
    { x: 1420, y: 1000, w: 40, h: 180, type: 'wall' },

    // CT Spawn Link Dividers
    { x: 1860, y: 620, w: 40, h: 260, type: 'wall' }
  ]
}
