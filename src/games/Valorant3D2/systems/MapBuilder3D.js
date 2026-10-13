// src/games/Valorant3D2/systems/MapBuilder3D.js
import * as THREE from 'three'

/**
 * Tactical Map Builder for Valorant3D:
 * Maps available:
 * 1. "kasbah_temple": TEMPLO CIBERNÉTICO KASBAH (Cyber Oasis Desert Citadel)
 *    Warm terracotta stonework, ancient sandstone archways with golden glowing circuitry,
 *    central sunlit desert bazaar, sunken celestial oasis Site A, golden Radianite obelisk vault Site B.
 * 2. "sector_radian": SECTOR RADIAN-9 (Urban High-Tech Night Research Facility)
 *    Dark concrete, cyan neon lines, elevated industrial catwalks, fusion reactor Site A, container yard Site B.
 * 3. "glacier_cryo": ESTACIÓN GLACIAR: CRYODOCK-7 (Sub-Zero Arctic Research Station)
 *    Frosted ice slabs, titanium suspension skybridge, sub-zero reactor, cryo coolant towers.
 * 4. "colossus_megacity": VALLE COLOSO: MEGACIUDAD 3D (Giant 180m x 180m Colossal Arena)
 *    Massive battlefield with 32m central Monolith, Site A Quantum Citadel, Site B Megadocks,
 *    Twin Mega Highway Skybridges, Bastion Sniper Towers, and Megacity Skyline.
 */

// --- PROCEDURAL TEXTURE GENERATORS ---

// 1. Terracotta Desert Sandstone Tile Texture (Kasbah)
function createSandstoneTileTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Warm terracotta / sandstone base
  ctx.fillStyle = '#b45309'
  ctx.fillRect(0, 0, 512, 512)

  // Geometric tiled stone slabs
  ctx.fillStyle = '#92400e'
  for (let x = 0; x < 512; x += 128) {
    for (let y = 0; y < 512; y += 128) {
      ctx.fillRect(x + 4, y + 4, 120, 120)
    }
  }

  // Golden Radianite circuitry inlays
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 3
  ctx.strokeRect(16, 16, 480, 480)
  ctx.strokeRect(144, 144, 224, 224)

  // Intricate oriental center motif
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(256, 256, 32, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 2. Kasbah Ancient Sandstone Wall Texture
function createKasbahWallTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#78350f'
  ctx.fillRect(0, 0, 512, 512)

  // Large desert bricks
  const bh = 64
  const bw = 128
  for (let y = 0; y < 512; y += bh) {
    const offset = (Math.floor(y / bh) % 2) * (bw / 2)
    for (let x = -offset; x < 512; x += bw) {
      ctx.fillStyle = (Math.random() > 0.5) ? '#92400e' : '#a16207'
      ctx.fillRect(x + 3, y + 3, bw - 6, bh - 6)
      ctx.strokeStyle = '#451a03'
      ctx.lineWidth = 3
      ctx.strokeRect(x + 3, y + 3, bw - 6, bh - 6)
    }
  }

  // Golden glowing runic glyphs / cyber circuits
  ctx.strokeStyle = '#fde047'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(32, 256)
  ctx.lineTo(128, 256)
  ctx.lineTo(160, 200)
  ctx.lineTo(352, 200)
  ctx.lineTo(384, 256)
  ctx.lineTo(480, 256)
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 3. Golden Radianite Obelisk Texture
function createGoldenObeliskTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#b45309'
  ctx.fillRect(0, 0, 256, 512)

  // Pure gold vertical core
  ctx.fillStyle = '#fde047'
  ctx.fillRect(48, 0, 160, 512)

  // Cyan glowing power veins
  ctx.strokeStyle = '#06b6d4'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(128, 0)
  ctx.lineTo(128, 512)
  ctx.stroke()

  ctx.fillStyle = '#0891b2'
  for (let y = 32; y < 512; y += 64) {
    ctx.fillRect(116, y, 24, 24)
  }

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// 4. Fabric Canopy Textile Texture (Desert Bazaar)
function createFabricCanopyTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Bold Crimson and Gold Stripes
  const stripeW = 32
  for (let x = 0; x < 256; x += stripeW * 2) {
    ctx.fillStyle = '#dc2626'
    ctx.fillRect(x, 0, stripeW, 256)
    ctx.fillStyle = '#f59e0b'
    ctx.fillRect(x + stripeW, 0, stripeW, 256)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 5. Forcefield Spawn Barrier Texture (Hex / Grid Energy)
function createForcefieldTexture(colorHex = '#00e5ff') {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
  ctx.fillRect(0, 0, 256, 256)

  ctx.strokeStyle = colorHex
  ctx.lineWidth = 4
  const step = 32
  for (let x = 0; x <= 256; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 256)
    ctx.stroke()
  }
  for (let y = 0; y <= 256; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(256, y)
    ctx.stroke()
  }

  // Warning Banner Decal
  ctx.fillStyle = colorHex
  ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('BARRIER // LOCKED', 128, 134)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 6. Concrete Texture (Sector Radian)
function createConcreteTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#182030'
  ctx.fillRect(0, 0, 512, 512)
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 4
  const step = 64
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(512, x); ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 7. Metal Container Texture
function createContainerTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, 512, 512)

  const ribW = 32
  for (let x = 0; x < 512; x += ribW) {
    ctx.fillStyle = (Math.floor(x / ribW) % 2 === 0) ? '#1e293b' : '#334155'
    ctx.fillRect(x, 0, ribW, 512)
    ctx.strokeStyle = '#020617'
    ctx.lineWidth = 2
    ctx.strokeRect(x, 0, ribW, 512)
  }

  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 8
  ctx.strokeRect(16, 16, 480, 480)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 8. Glacier Ice Tile Texture (Cryodock-7)
function createGlacierIceTileTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Deep Sub-zero Navy & Frosted Ice Base
  const grad = ctx.createLinearGradient(0, 0, 512, 512)
  grad.addColorStop(0, '#0284c7')
  grad.addColorStop(0.5, '#0369a1')
  grad.addColorStop(1, '#082f49')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 512)

  // Hexagonal Crystal Slabs
  ctx.fillStyle = '#0e7490'
  for (let x = 0; x < 512; x += 128) {
    for (let y = 0; y < 512; y += 128) {
      ctx.fillRect(x + 4, y + 4, 120, 120)
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.strokeRect(x + 6, y + 6, 116, 116)
    }
  }

  // Glowing Frost Veins & Runes
  ctx.strokeStyle = '#e0f2fe'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(32, 256); ctx.lineTo(256, 32); ctx.lineTo(480, 256); ctx.lineTo(256, 480); ctx.closePath()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(256, 256, 28, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 9. Arctic Insulated Titanium Wall Texture
function createArcticTitaniumWallTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Titanium Steel Base
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(0, 0, 512, 512)

  // Modular Titanium Panels
  const ph = 128
  const pw = 256
  for (let y = 0; y < 512; y += ph) {
    for (let x = 0; x < 512; x += pw) {
      ctx.fillStyle = (Math.random() > 0.5) ? '#334155' : '#1e293b'
      ctx.fillRect(x + 4, y + 4, pw - 8, ph - 8)
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 4
      ctx.strokeRect(x + 4, y + 4, pw - 8, ph - 8)

      // Rivets
      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(x + 10, y + 10, 6, 6)
      ctx.fillRect(x + pw - 16, y + 10, 6, 6)
      ctx.fillRect(x + 10, y + ph - 16, 6, 6)
      ctx.fillRect(x + pw - 16, y + ph - 16, 6, 6)
    }
  }

  // Cryo Warning Hazard Cyan / White Stripes
  ctx.fillStyle = '#38bdf8'
  ctx.fillRect(0, 240, 512, 32)
  ctx.fillStyle = '#f8fafc'
  for (let s = 0; s < 512; s += 48) {
    ctx.beginPath()
    ctx.moveTo(s, 240); ctx.lineTo(s + 24, 240); ctx.lineTo(s + 48, 272); ctx.lineTo(s + 24, 272); ctx.closePath()
    ctx.fill()
  }

  // Cryo Decal Text
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('CRYO-SECTOR 07 // SUB-ZERO', 256, 262)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 10. Cryo Coolant Reactor Core Texture
function createCryoReactorTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#082f49'
  ctx.fillRect(0, 0, 256, 512)

  // Swirling Sub-Zero Plasma Core
  ctx.fillStyle = '#38bdf8'
  ctx.fillRect(40, 0, 176, 512)

  ctx.strokeStyle = '#e0f2fe'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(128, 0); ctx.lineTo(128, 512)
  ctx.stroke()

  ctx.fillStyle = '#bae6fd'
  for (let y = 20; y < 512; y += 48) {
    ctx.beginPath()
    ctx.arc(128, y, 14, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// 11. Colossus Megacity High-Tech Hex/Grid Road Slab Texture
function createColossusFloorTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Dark alloy titanium asphalt base
  ctx.fillStyle = '#0a0f1d'
  ctx.fillRect(0, 0, 512, 512)

  // Hexagonal and Grid Alloy Tiles
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 4
  const step = 64
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke()
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke()
  }

  // Tactical Amber & Cyan Conduit Strips
  ctx.fillStyle = '#0f172a'
  for (let x = 0; x < 512; x += 128) {
    for (let y = 0; y < 512; y += 128) {
      ctx.fillRect(x + 8, y + 8, 112, 112)
    }
  }

  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 2
  ctx.strokeRect(16, 16, 480, 480)

  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(256, 16); ctx.lineTo(256, 496)
  ctx.moveTo(16, 256); ctx.lineTo(496, 256)
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 12. Colossus Reinforced Fortress Wall Texture
function createColossusWallTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Deep obsidian steel base
  ctx.fillStyle = '#0b1329'
  ctx.fillRect(0, 0, 512, 512)

  // Armored modular composite blast plates
  const pw = 256
  const ph = 128
  for (let y = 0; y < 512; y += ph) {
    const offset = (Math.floor(y / ph) % 2) * (pw / 2)
    for (let x = -offset; x < 512; x += pw) {
      ctx.fillStyle = (Math.random() > 0.5) ? '#131e3a' : '#182747'
      ctx.fillRect(x + 4, y + 4, pw - 8, ph - 8)
      ctx.strokeStyle = '#030712'
      ctx.lineWidth = 4
      ctx.strokeRect(x + 4, y + 4, pw - 8, ph - 8)

      // Bolt rivets
      ctx.fillStyle = '#64748b'
      ctx.fillRect(x + 12, y + 12, 6, 6)
      ctx.fillRect(x + pw - 18, y + 12, 6, 6)
      ctx.fillRect(x + 12, y + ph - 18, 6, 6)
      ctx.fillRect(x + pw - 18, y + ph - 18, 6, 6)
    }
  }

  // Glowing Warning & LED Circuit Line
  ctx.strokeStyle = '#06b6d4'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(0, 256); ctx.lineTo(512, 256)
  ctx.stroke()

  ctx.fillStyle = '#f59e0b'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('COLOSSUS SECTOR // HIGH SECURITY', 256, 240)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 13. Colossus Central Monolith Texture (Hyper-Structure Crystal)
function createColossusMonolithTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#050b14'
  ctx.fillRect(0, 0, 256, 512)

  // Hyper-dense Radianite Cyan & Emerald Core
  const grad = ctx.createLinearGradient(0, 0, 256, 512)
  grad.addColorStop(0, '#06b6d4')
  grad.addColorStop(0.5, '#3b82f6')
  grad.addColorStop(1, '#10b981')
  ctx.fillStyle = grad
  ctx.fillRect(48, 0, 160, 512)

  // Electric pulsing geometric lines
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(128, 0); ctx.lineTo(128, 512)
  ctx.stroke()

  for (let y = 30; y < 512; y += 40) {
    ctx.fillStyle = '#ec4899'
    ctx.fillRect(114, y, 28, 6)
    ctx.strokeStyle = '#38bdf8'
    ctx.strokeRect(100, y - 4, 56, 14)
  }

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// 14. Distant Skyscraper Window Matrix Texture
function createSkyscraperWindowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#080d1a'
  ctx.fillRect(0, 0, 256, 512)

  // Window grid with random glowing cyan/warm neon lights
  for (let y = 8; y < 512; y += 16) {
    for (let x = 8; x < 256; x += 16) {
      const rand = Math.random()
      if (rand > 0.45) {
        ctx.fillStyle = rand > 0.85 ? '#38bdf8' : (rand > 0.7 ? '#fbbf24' : '#1e3a8a')
        ctx.fillRect(x, y, 10, 10)
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 15. Quantum Void Obsidian & Hex Circuitry Texture (Vortex Quantum)
function createQuantumHexFloorTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Deep obsidian carbon background
  ctx.fillStyle = '#050714'
  ctx.fillRect(0, 0, 512, 512)

  // Hexagonal tactical grid lines
  ctx.strokeStyle = '#0e172e'
  ctx.lineWidth = 4
  const size = 32
  const h = size * Math.sqrt(3)
  for (let y = 0; y < 512 + h; y += h) {
    for (let x = 0; x < 512 + size * 3; x += size * 3) {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        const px = x + size * Math.cos(angle)
        const py = y + size * Math.sin(angle)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
    }
  }

  // Glowing Electric Cyan & Magenta Quantum Circuit Inlays
  ctx.lineWidth = 3
  ctx.strokeStyle = '#00f3ff'
  ctx.beginPath()
  ctx.moveTo(64, 64); ctx.lineTo(192, 64); ctx.lineTo(256, 128); ctx.lineTo(384, 128)
  ctx.moveTo(128, 448); ctx.lineTo(256, 448); ctx.lineTo(320, 384); ctx.lineTo(448, 384)
  ctx.stroke()

  ctx.strokeStyle = '#c084fc'
  ctx.beginPath()
  ctx.moveTo(64, 448); ctx.lineTo(128, 384); ctx.lineTo(128, 256); ctx.lineTo(192, 192)
  ctx.moveTo(448, 64); ctx.lineTo(384, 128); ctx.lineTo(384, 256); ctx.lineTo(320, 320)
  ctx.stroke()

  // Central Radianite Quantum Nodes
  ;[
    { x: 128, y: 128 }, { x: 384, y: 128 },
    { x: 128, y: 384 }, { x: 384, y: 384 },
    { x: 256, y: 256 }
  ].forEach(pt => {
    ctx.fillStyle = '#00f3ff'
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#c084fc'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2)
    ctx.stroke()
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 16. Antimatter Alloy Wall Texture with Power Conduits
function createAntimatterWallTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Titanium dark alloy base
  ctx.fillStyle = '#080d1a'
  ctx.fillRect(0, 0, 512, 512)

  // Structural composite panels
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(12, 12, 236, 236)
  ctx.fillRect(264, 12, 236, 236)
  ctx.fillRect(12, 264, 236, 236)
  ctx.fillRect(264, 264, 236, 236)

  // Beveled titanium seams
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 4
  ctx.strokeRect(12, 12, 236, 236)
  ctx.strokeRect(264, 12, 236, 236)
  ctx.strokeRect(12, 264, 236, 236)
  ctx.strokeRect(264, 264, 236, 236)

  // Glowing Purple Plasma Conduits
  ctx.strokeStyle = '#a855f7'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(256, 0); ctx.lineTo(256, 512)
  ctx.moveTo(0, 256); ctx.lineTo(512, 256)
  ctx.stroke()

  // Cyan quantum hazard marks
  ctx.fillStyle = '#00f3ff'
  ;[64, 192, 320, 448].forEach(x => {
    ctx.fillRect(x - 6, 250, 12, 12)
    ctx.fillRect(250, x - 6, 12, 12)
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 17. Hyper-Speed Runway Conduit Texture
function createSpeedConduitTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#050a18'
  ctx.fillRect(0, 0, 512, 128)

  // Glowing cyan neon edge guide rails
  ctx.fillStyle = '#00f3ff'
  ctx.fillRect(0, 0, 512, 8)
  ctx.fillRect(0, 120, 512, 8)

  // Electric cyan forward chevrons (>>>)
  ctx.strokeStyle = '#00f3ff'
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  for (let x = 32; x < 512; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 24)
    ctx.lineTo(x + 28, 64)
    ctx.lineTo(x, 104)
    ctx.stroke()
  }

  // Soft secondary purple glow chevrons
  ctx.strokeStyle = '#c084fc'
  ctx.lineWidth = 4
  for (let x = 46; x < 512; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 32)
    ctx.lineTo(x + 22, 64)
    ctx.lineTo(x, 96)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 18. Quantum Portal Swirling Vortex Texture
function createQuantumPortalTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Radial gradient
  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 126)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(0.25, '#00f3ff')
  grad.addColorStop(0.55, '#a855f7')
  grad.addColorStop(0.85, '#3b0764')
  grad.addColorStop(1, 'rgba(3, 0, 20, 0)')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 256)

  // Swirling spiral arms
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  for (let arm = 0; arm < 4; arm++) {
    const baseAngle = (arm * Math.PI) / 2
    ctx.beginPath()
    for (let r = 10; r < 120; r += 4) {
      const a = baseAngle + (r / 20)
      const x = 128 + r * Math.cos(a)
      const y = 128 + r * Math.sin(a)
      if (r === 10) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// --- MAIN ARENA BUILDER ---

let currentMapGroup = null
let currentBarrierGroup = null

export function buildTacticalArena(scene, mapId = 'kasbah_temple') {
  const isKasbah = (mapId === 'kasbah_temple' || mapId === 'templo_kasbah')
  const isGlacier = (mapId === 'glacier_cryo' || mapId === 'estacion_glaciar')
  const isColossus = (mapId === 'colossus_megacity' || mapId === 'valle_coloso' || mapId === 'coloso')
  const isQuantum = (mapId === 'vortex_quantum' || mapId === 'nucleo_cuantico' || mapId === 'vortex')

  if (currentMapGroup) {
    scene.remove(currentMapGroup)
  }
  if (currentBarrierGroup) {
    scene.remove(currentBarrierGroup)
  }

  const meshColliders = []
  const wallsAABB = []
  const mapObjectsGroup = new THREE.Group()
  currentMapGroup = mapObjectsGroup
  scene.add(mapObjectsGroup)

  // Interactive Map Triggers & Animated Meshes
  const jumpPads = []
  const teleporters = []
  const speedPads = []
  const animatedMeshes = []

  // Textures
  let floorTex, wallTex
  if (isKasbah) {
    floorTex = createSandstoneTileTexture()
    floorTex.repeat.set(8, 8)
    wallTex = createKasbahWallTexture()
    wallTex.repeat.set(4, 2)
  } else if (isGlacier) {
    floorTex = createGlacierIceTileTexture()
    floorTex.repeat.set(8, 8)
    wallTex = createArcticTitaniumWallTexture()
    wallTex.repeat.set(4, 2)
  } else if (isColossus) {
    floorTex = createColossusFloorTexture()
    floorTex.repeat.set(24, 24)
    wallTex = createColossusWallTexture()
    wallTex.repeat.set(12, 4)
  } else if (isQuantum) {
    floorTex = createQuantumHexFloorTexture()
    floorTex.repeat.set(12, 12)
    wallTex = createAntimatterWallTexture()
    wallTex.repeat.set(6, 3)
  } else {
    floorTex = createConcreteTexture()
    floorTex.repeat.set(8, 8)
    wallTex = createConcreteTexture()
    wallTex.repeat.set(4, 2)
  }

  const containerTex = createContainerTexture()
  const goldObeliskTex = isGlacier ? createCryoReactorTexture() : (isColossus ? createColossusMonolithTexture() : createGoldenObeliskTexture())
  const skylineTex = isColossus ? createSkyscraperWindowTexture() : null
  const canopyTex = createFabricCanopyTexture()
  canopyTex.repeat.set(3, 3)

  // Materials
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: isGlacier ? 0.25 : (isQuantum ? 0.3 : (isColossus ? 0.45 : 0.65)),
    metalness: isGlacier ? 0.45 : (isQuantum ? 0.65 : (isColossus ? 0.35 : 0.15))
  })
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: isQuantum ? 0.35 : 0.5,
    metalness: isGlacier ? 0.6 : (isQuantum ? 0.75 : (isColossus ? 0.5 : 0.25))
  })
  const trimMat = new THREE.MeshStandardMaterial({
    color: isKasbah ? 0x451a03 : (isGlacier ? 0x0f172a : (isQuantum ? 0x110c22 : (isColossus ? 0x111827 : 0x0f172a))),
    roughness: 0.35,
    metalness: 0.8
  })
  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: isGlacier ? 0x38bdf8 : (isQuantum ? 0x00f3ff : (isColossus ? 0x06b6d4 : 0xf59e0b)),
    roughness: 0.2,
    metalness: 0.9
  })
  const cyanNeonMat = new THREE.MeshBasicMaterial({ color: isGlacier ? 0x7dd3fc : 0x00f3ff })
  const purpleNeonMat = new THREE.MeshBasicMaterial({ color: isQuantum ? 0xc084fc : 0xa855f7 })
  const containerMat = new THREE.MeshStandardMaterial({ map: containerTex, roughness: 0.5, metalness: 0.4 })
  const skylineMat = isColossus ? new THREE.MeshStandardMaterial({ map: skylineTex, roughness: 0.35, metalness: 0.65 }) : null
  const canopyMat = new THREE.MeshStandardMaterial({ map: canopyTex, roughness: 0.7, side: THREE.DoubleSide })
  const glassRailingMat = new THREE.MeshPhysicalMaterial({
    color: isGlacier ? 0xbae6fd : (isQuantum ? 0x00f3ff : (isColossus ? 0x00e5ff : 0x38bdf8)),
    transparent: true,
    opacity: 0.55,
    roughness: 0.1,
    metalness: 0.3
  })

  // Helper: Create Wall
  function addWall(x, y, z, w, h, d, mat = wallMat) {
    const geo = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, y + h / 2, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mapObjectsGroup.add(mesh)
    meshColliders.push(mesh)
    wallsAABB.push({ x, z, w, d, minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, y, h })
    return mesh
  }

  // Helper: Create Walkable Platform
  function addPlatform(x, y, z, w, d, mat = trimMat, thickness = 0.4) {
    const geo = new THREE.BoxGeometry(w, thickness, d)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, y - thickness / 2, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mapObjectsGroup.add(mesh)
    meshColliders.push(mesh)
    return mesh
  }

  // Helper: Create Staircase / Ramp
  function addStaircase(startX, startZ, endX, endZ, startY, endY, width, numSteps = 12) {
    const dx = (endX - startX) / numSteps
    const dz = (endZ - startZ) / numSteps
    const dy = (endY - startY) / numSteps
    const totalDist = Math.hypot(endX - startX, endZ - startZ)
    const stepDepth = (totalDist / numSteps) * 1.08
    const angle = Math.atan2(dx, dz)

    for (let i = 0; i < numSteps; i++) {
      const stepX = startX + dx * (i + 0.5)
      const stepZ = startZ + dz * (i + 0.5)
      const stepTopY = startY + dy * (i + 1)
      const stepHeight = stepTopY - startY

      const stepGeo = new THREE.BoxGeometry(width, stepHeight, stepDepth)
      const stepMesh = new THREE.Mesh(stepGeo, trimMat)
      stepMesh.position.set(stepX, startY + stepHeight / 2, stepZ)
      stepMesh.rotation.y = angle
      stepMesh.castShadow = true
      stepMesh.receiveShadow = true
      mapObjectsGroup.add(stepMesh)
      meshColliders.push(stepMesh)

      const stripGeo = new THREE.BoxGeometry(width * 0.96, 0.02, 0.04)
      const strip = new THREE.Mesh(stripGeo, goldAccentMat)
      strip.position.set(stepX, stepTopY + 0.01, stepZ)
      strip.rotation.y = angle
      mapObjectsGroup.add(strip)
    }
  }

  // --- 1. GROUND BASE & PERIMETER ---
  const mapRadius = isColossus ? 88 : (isQuantum ? 48 : 32)
  const mapSize = mapRadius * 2
  const groundGeo = new THREE.PlaneGeometry(mapSize, mapSize)
  const groundMesh = new THREE.Mesh(groundGeo, floorMat)
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.position.y = 0
  groundMesh.receiveShadow = true
  mapObjectsGroup.add(groundMesh)
  meshColliders.push(groundMesh)

  const perimeterH = isColossus ? 16.0 : (isQuantum ? 11.0 : 8.5)
  const wallThick = isColossus ? 4.0 : (isQuantum ? 3.0 : 2.5)
  addWall(0, 0, -mapRadius, mapSize, perimeterH, wallThick) // North
  addWall(0, 0, mapRadius, mapSize, perimeterH, wallThick)  // South
  addWall(-mapRadius, 0, 0, wallThick, perimeterH, mapSize) // West (Attackers Back)
  addWall(mapRadius, 0, 0, wallThick, perimeterH, mapSize)  // East (Defenders Back)

  if (isColossus) {
    // ==========================================
    // MAP 4: "VALLE COLOSO: MEGACIUDAD 3D" (SUPER GIANT 180m x 180m)
    // ==========================================

    // --- A. CENTRAL MONOLITH PLAZA (Mid - 0, 0) ---
    // Giant 32m Radianite Monolith in center
    const monolithBase = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 7.0, 1.6, 16), trimMat)
    monolithBase.position.set(0, 0.8, 0)
    monolithBase.castShadow = true
    mapObjectsGroup.add(monolithBase)
    meshColliders.push(monolithBase)

    const monolithGeo = new THREE.CylinderGeometry(2.2, 4.0, 32.0, 8)
    const monolithMesh = new THREE.Mesh(monolithGeo, new THREE.MeshStandardMaterial({
      map: goldObeliskTex,
      roughness: 0.15,
      metalness: 0.85
    }))
    monolithMesh.position.set(0, 17.6, 0)
    monolithMesh.castShadow = true
    mapObjectsGroup.add(monolithMesh)
    meshColliders.push(monolithMesh)

    // Pulsing Neon Conduit Rings around Monolith
    ;[8, 16, 24].forEach(yPos => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.16, 8, 24), cyanNeonMat)
      ring.rotation.x = Math.PI / 2
      ring.position.set(0, yPos, 0)
      mapObjectsGroup.add(ring)
    })

    // Apex Octahedron Crown
    const apexGeo = new THREE.OctahedronGeometry(2.4, 0)
    const apexMesh = new THREE.Mesh(apexGeo, purpleNeonMat)
    apexMesh.position.set(0, 34.0, 0)
    mapObjectsGroup.add(apexMesh)

    // Elevated Circular Ring Platform around Monolith at Y=4.8m (Radius 20m)
    addPlatform(0, 4.8, -16, 24, 6.0, trimMat) // North ring segment
    addPlatform(0, 4.8, 16, 24, 6.0, trimMat)  // South ring segment
    addPlatform(-16, 4.8, 0, 6.0, 24, trimMat) // West ring segment
    addPlatform(16, 4.8, 0, 6.0, 24, trimMat)  // East ring segment

    // 4 Corner Ring Links
    addPlatform(-14, 4.8, -14, 6.0, 6.0, trimMat)
    addPlatform(14, 4.8, -14, 6.0, 6.0, trimMat)
    addPlatform(-14, 4.8, 14, 6.0, 6.0, trimMat)
    addPlatform(14, 4.8, 14, 6.0, 6.0, trimMat)

    // 4 Grand Staircases climbing from Ground to Monolith Ring
    addStaircase(0, -30, 0, -19, 0, 4.8, 5.0, 14) // North
    addStaircase(0, 30, 0, 19, 0, 4.8, 5.0, 14)   // South
    addStaircase(-30, 0, -19, 0, 0, 4.8, 5.0, 14) // West
    addStaircase(30, 0, 19, 0, 0, 4.8, 5.0, 14)   // East

    // 4 Jump / Launch Pads (Diagonal Plaza Corners)
    const padBeaconGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.15, 24)
    ;[{ x: -16, z: -16 }, { x: 16, z: -16 }, { x: -16, z: 16 }, { x: 16, z: 16 }].forEach(c => {
      const pad = new THREE.Mesh(padBeaconGeo, goldAccentMat)
      pad.position.set(c.x, 0.08, c.z)
      mapObjectsGroup.add(pad)

      const innerBeacon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16), cyanNeonMat)
      innerBeacon.position.set(c.x, 0.1, c.z)
      mapObjectsGroup.add(innerBeacon)
    })

    // Plaza Tactical Cover Barricades
    addWall(-8, 0, -8, 3.2, 2.8, 3.2, containerMat)
    addWall(8, 0, -8, 3.2, 2.8, 3.2, containerMat)
    addWall(-8, 0, 8, 3.2, 2.8, 3.2, containerMat)
    addWall(8, 0, 8, 3.2, 2.8, 3.2, containerMat)

    // --- B. NORTH SECTOR: SITE A - QUANTUM REACTOR CITADEL (Z = -52) ---
    // Massive Cylindrical Fusion Reactor Dome
    const citadelBase = new THREE.Mesh(new THREE.CylinderGeometry(13, 14, 0.6, 24), trimMat)
    citadelBase.position.set(0, 0.3, -52)
    mapObjectsGroup.add(citadelBase)
    meshColliders.push(citadelBase)

    // Quantum Reactor Core
    const citadelCore = new THREE.Mesh(new THREE.IcosahedronGeometry(4.2, 2), cyanNeonMat)
    citadelCore.position.set(0, 5.5, -52)
    mapObjectsGroup.add(citadelCore)

    // 4 Coolant Heatsink Towers surrounding Site A
    const coolantTowerGeo = new THREE.CylinderGeometry(1.6, 1.9, 13.0, 16)
    ;[
      { x: -18, z: -62 }, { x: 18, z: -62 },
      { x: -18, z: -42 }, { x: 18, z: -42 }
    ].forEach(c => {
      const tower = new THREE.Mesh(coolantTowerGeo, wallMat)
      tower.position.set(c.x, 6.5, c.z)
      tower.castShadow = true
      tower.receiveShadow = true
      mapObjectsGroup.add(tower)
      meshColliders.push(tower)

      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.12, 8, 24), cyanNeonMat)
      ring.rotation.x = Math.PI / 2
      ring.position.set(c.x, 8.0, c.z)
      mapObjectsGroup.add(ring)
    })

    // Elevated Site A Catwalks (Y=4.8m)
    addPlatform(0, 4.8, -62, 26, 4.5, trimMat)
    addPlatform(-14, 4.8, -52, 4.5, 18, trimMat)
    addPlatform(14, 4.8, -52, 4.5, 18, trimMat)
    addStaircase(-20, -42, -14, -42, 0, 4.8, 3.5, 12)
    addStaircase(20, -42, 14, -42, 0, 4.8, 3.5, 12)

    // Blast Shield Bunkers and Crates
    addWall(-6, 0, -48, 3.0, 2.5, 3.0, goldAccentMat)
    addWall(6, 0, -56, 3.0, 2.5, 3.0, goldAccentMat)
    addWall(0, 0, -68, 18.0, 6.0, 3.0)
    addWall(-28, 0, -52, 3.0, 6.0, 18.0)
    addWall(28, 0, -52, 3.0, 6.0, 18.0)

    // --- C. SOUTH SECTOR: SITE B - MEGADOCKS & CARGO VAULTS (Z = +52) ---
    // 16 Multi-story stacked freight shipping containers
    const cColors = [containerMat, goldAccentMat, trimMat]
    const containerPositions = [
      { x: -14, y: 0, z: 46, w: 4, h: 3.2, d: 8, mat: containerMat },
      { x: -14, y: 3.2, z: 46, w: 4, h: 3.2, d: 8, mat: containerMat },
      { x: 14, y: 0, z: 46, w: 4, h: 3.2, d: 8, mat: containerMat },
      { x: 14, y: 3.2, z: 46, w: 4, h: 3.2, d: 8, mat: containerMat },
      { x: -8, y: 0, z: 58, w: 8, h: 3.2, d: 4, mat: containerMat },
      { x: -8, y: 3.2, z: 58, w: 8, h: 3.2, d: 4, mat: containerMat },
      { x: 8, y: 0, z: 58, w: 8, h: 3.2, d: 4, mat: containerMat },
      { x: 8, y: 3.2, z: 58, w: 8, h: 3.2, d: 4, mat: containerMat },
      { x: 0, y: 0, z: 42, w: 4.5, h: 2.8, d: 4.5, mat: goldAccentMat },
      { x: -22, y: 0, z: 52, w: 4, h: 3.2, d: 12, mat: containerMat },
      { x: 22, y: 0, z: 52, w: 4, h: 3.2, d: 12, mat: containerMat },
      { x: 0, y: 0, z: 62, w: 5.0, h: 3.0, d: 5.0, mat: goldAccentMat }
    ]
    containerPositions.forEach(cp => {
      addWall(cp.x, cp.y, cp.z, cp.w, cp.h, cp.d, cp.mat)
    })

    // Giant Overhead Industrial Gantry Crane
    const craneLegMat = trimMat
    addWall(-18, 0, 52, 2.0, 16.0, 2.0, craneLegMat)
    addWall(18, 0, 52, 2.0, 16.0, 2.0, craneLegMat)
    addPlatform(0, 16.0, 52, 38.0, 3.5, craneLegMat, 1.2) // Overhead crossbeam

    // Suspended Freight Container under crane
    addWall(0, 8.5, 52, 6.0, 3.2, 3.2, containerMat)
    const cableGeo = new THREE.CylinderGeometry(0.06, 0.06, 4.5, 8)
    ;[{ x: -2.5, z: 52 }, { x: 2.5, z: 52 }].forEach(c => {
      const cable = new THREE.Mesh(cableGeo, trimMat)
      cable.position.set(c.x, 12.8, c.z)
      mapObjectsGroup.add(cable)
    })

    // Covered Warehouse Depot at South Back
    addWall(0, 0, 72, 24.0, 7.5, 3.0)
    addWall(-28, 0, 52, 3.0, 6.0, 18.0)
    addWall(28, 0, 52, 3.0, 6.0, 18.0)

    // --- D. TWIN MEGA HIGHWAY SKYBRIDGES (North & South spanning 110m!) ---
    // North Highway (Z = -26, Y = 4.8m)
    addPlatform(0, 4.8, -26, 110, 6.0, trimMat)
    ;[-45, -20, 0, 20, 45].forEach(px => {
      addWall(px, 0, -26, 1.8, 4.8, 1.8, trimMat)
    })

    // Glass Railings North Highway
    const nRailGeo = new THREE.BoxGeometry(108, 1.1, 0.15)
    const nRailLeft = new THREE.Mesh(nRailGeo, glassRailingMat)
    nRailLeft.position.set(0, 5.35, -29)
    mapObjectsGroup.add(nRailLeft)
    meshColliders.push(nRailLeft)
    const nRailRight = new THREE.Mesh(nRailGeo, glassRailingMat)
    nRailRight.position.set(0, 5.35, -23)
    mapObjectsGroup.add(nRailRight)
    meshColliders.push(nRailRight)

    // South Highway (Z = +26, Y = 4.8m)
    addPlatform(0, 4.8, 26, 110, 6.0, trimMat)
    ;[-45, -20, 0, 20, 45].forEach(px => {
      addWall(px, 0, 26, 1.8, 4.8, 1.8, trimMat)
    })

    // Glass Railings South Highway
    const sRailLeft = new THREE.Mesh(nRailGeo, glassRailingMat)
    sRailLeft.position.set(0, 5.35, 23)
    mapObjectsGroup.add(sRailLeft)
    meshColliders.push(sRailLeft)
    const sRailRight = new THREE.Mesh(nRailGeo, glassRailingMat)
    sRailRight.position.set(0, 5.35, 29)
    mapObjectsGroup.add(sRailRight)
    meshColliders.push(sRailRight)

    // Flank Highway Staircases (Connecting West & East Bastions to Skybridges)
    addStaircase(-58, -16, -58, -24, 0, 4.8, 4.0, 12)
    addStaircase(58, -16, 58, -24, 0, 4.8, 4.0, 12)
    addStaircase(-58, 16, -58, 24, 0, 4.8, 4.0, 12)
    addStaircase(58, 16, 58, 24, 0, 4.8, 4.0, 12)

    // --- E. WEST & EAST FORTIFIED BASTIONS (Sniper Towers & Spawns) ---
    // West Red Bastion (Attackers: X = -72)
    // Twin Sniper Towers
    ;[{ z: -28 }, { z: 28 }].forEach(tw => {
      addWall(-64, 0, tw.z, 5.0, 8.0, 5.0, wallMat)
      addPlatform(-64, 8.0, tw.z, 6.5, 6.5, trimMat)
      addStaircase(-70, tw.z, -65, tw.z, 0, 8.0, 2.5, 14)
    })
    // Wide open corridors for smooth direct advance towards mid and skybridges
    addWall(-60, 0, -20, 3.0, 4.0, 10.0)
    addWall(-60, 0, 20, 3.0, 4.0, 10.0)
    addWall(-78, 0, -20, 3.0, 6.0, 16.0)
    addWall(-78, 0, 20, 3.0, 6.0, 16.0)

    // East Blue Bastion (Defenders: X = +72)
    // Twin Sniper Towers
    ;[{ z: -28 }, { z: 28 }].forEach(tw => {
      addWall(64, 0, tw.z, 5.0, 8.0, 5.0, wallMat)
      addPlatform(64, 8.0, tw.z, 6.5, 6.5, trimMat)
      addStaircase(70, tw.z, 65, tw.z, 0, 8.0, 2.5, 14)
    })
    // Wide open corridors for smooth direct advance towards mid and skybridges
    addWall(60, 0, -20, 3.0, 4.0, 10.0)
    addWall(60, 0, 20, 3.0, 4.0, 10.0)
    addWall(78, 0, -20, 3.0, 6.0, 16.0)
    addWall(78, 0, 20, 3.0, 6.0, 16.0)

    // --- F. DISTANT MEGACITY SKYLINE (28 Megacity Skyscrapers) ---
    if (skylineMat) {
      const skyscraperCoords = [
        // North Skyline (Z < -95)
        { x: -70, z: -115, w: 22, h: 65, d: 22 },
        { x: -35, z: -125, w: 26, h: 80, d: 24 },
        { x: 0, z: -130, w: 30, h: 95, d: 28 },
        { x: 35, z: -125, w: 24, h: 75, d: 24 },
        { x: 70, z: -115, w: 20, h: 60, d: 20 },
        // South Skyline (Z > 95)
        { x: -70, z: 115, w: 22, h: 65, d: 22 },
        { x: -35, z: 125, w: 26, h: 85, d: 24 },
        { x: 0, z: 130, w: 28, h: 90, d: 28 },
        { x: 35, z: 125, w: 24, h: 70, d: 24 },
        { x: 70, z: 115, w: 20, h: 60, d: 20 },
        // West Skyline (X < -95)
        { x: -115, z: -60, w: 22, h: 70, d: 22 },
        { x: -125, z: -20, w: 26, h: 88, d: 24 },
        { x: -130, z: 20, w: 28, h: 82, d: 26 },
        { x: -115, z: 60, w: 22, h: 65, d: 22 },
        // East Skyline (X > 95)
        { x: 115, z: -60, w: 22, h: 70, d: 22 },
        { x: 125, z: -20, w: 26, h: 85, d: 24 },
        { x: 130, z: 20, w: 28, h: 92, d: 26 },
        { x: 115, z: 60, w: 22, h: 65, d: 22 },
        // Diagonal Corners
        { x: -110, z: -110, w: 24, h: 75, d: 24 },
        { x: 110, z: -110, w: 24, h: 75, d: 24 },
        { x: -110, z: 110, w: 24, h: 75, d: 24 },
        { x: 110, z: 110, w: 24, h: 75, d: 24 }
      ]
      skyscraperCoords.forEach(sc => {
        const skyGeo = new THREE.BoxGeometry(sc.w, sc.h, sc.d)
        const skyMesh = new THREE.Mesh(skyGeo, skylineMat)
        skyMesh.position.set(sc.x, sc.h / 2, sc.z)
        skyMesh.castShadow = true
        mapObjectsGroup.add(skyMesh)
      })
    }

  } else if (isQuantum) {
    // ==========================================
    // MAP 5: "VORTEX CUÁNTICO: NÚCLEO OMEGA" (96m x 96m Orbital Arena)
    // Multiple Interactive Mechanics: Gravitational Jump Pads, Quantum Portals, Speed Conduits, Vertical Catwalk Ring
    // ==========================================

    // Helper: Create Glowing Interactive Jump Pad
    function addInteractiveJumpPad(x, z, targetY = 4.5, impulseY = 17.5) {
      const padBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.15, 24), trimMat)
      padBase.position.set(x, 0.075, z)
      padBase.castShadow = true
      mapObjectsGroup.add(padBase)
      meshColliders.push(padBase)

      const innerNeon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.18, 24), cyanNeonMat)
      innerNeon.position.set(x, 0.09, z)
      mapObjectsGroup.add(innerNeon)

      // Holographic Upward Energy Beacon Cylinder
      const beaconGeo = new THREE.CylinderGeometry(1.2, 1.4, 3.2, 16, 1, true)
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      })
      const beacon = new THREE.Mesh(beaconGeo, beaconMat)
      beacon.position.set(x, 1.6, z)
      mapObjectsGroup.add(beacon)

      jumpPads.push({
        x,
        y: 0,
        z,
        radius: 1.8,
        impulseY,
        cooldown: 1000,
        lastUsed: 0
      })
    }

    // Helper: Create Quantum Teleporter Portal Gate
    const portalTex = createQuantumPortalTexture()
    function addQuantumPortalGate(id, x, z, rotY, targetX, targetZ, targetYaw) {
      const gateGroup = new THREE.Group()
      gateGroup.position.set(x, 0, z)
      gateGroup.rotation.y = rotY

      // Outer Arch Pillars
      const archMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.85 })
      const pillarGeo = new THREE.BoxGeometry(0.5, 4.8, 0.6)
      const pLeft = new THREE.Mesh(pillarGeo, archMat)
      pLeft.position.set(-1.6, 2.4, 0)
      gateGroup.add(pLeft)
      meshColliders.push(pLeft)

      const pRight = new THREE.Mesh(pillarGeo, archMat)
      pRight.position.set(1.6, 2.4, 0)
      gateGroup.add(pRight)
      meshColliders.push(pRight)

      // Arch Top Header
      const topGeo = new THREE.BoxGeometry(3.7, 0.6, 0.6)
      const pTop = new THREE.Mesh(topGeo, archMat)
      pTop.position.set(0, 4.8, 0)
      gateGroup.add(pTop)
      meshColliders.push(pTop)

      // Neon Trim Borders
      const trimGeoL = new THREE.BoxGeometry(0.08, 4.6, 0.62)
      const tL = new THREE.Mesh(trimGeoL, cyanNeonMat)
      tL.position.set(-1.3, 2.4, 0)
      gateGroup.add(tL)

      const tR = new THREE.Mesh(trimGeoL, cyanNeonMat)
      tR.position.set(1.3, 2.4, 0)
      gateGroup.add(tR)

      // Swirling Vortex Core Disc
      const discGeo = new THREE.CircleGeometry(1.4, 32)
      const discMat = new THREE.MeshBasicMaterial({
        map: portalTex,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide
      })
      const vortexMesh = new THREE.Mesh(discGeo, discMat)
      vortexMesh.position.set(0, 2.4, 0)
      gateGroup.add(vortexMesh)

      // Soft Portal Glow Light
      const pLight = new THREE.PointLight(0x00f3ff, 1.8, 8)
      pLight.position.set(0, 2.4, 0.5)
      gateGroup.add(pLight)

      mapObjectsGroup.add(gateGroup)

      animatedMeshes.push({ mesh: vortexMesh, rotZ: 2.2 })

      teleporters.push({
        id,
        x,
        y: 0,
        z,
        targetX,
        targetY: 0,
        targetZ,
        targetYaw,
        radius: 1.8,
        cooldown: 3.0,
        lastUsed: 0
      })
    }

    // Helper: Create Hyper-Speed Runway
    const speedTex = createSpeedConduitTexture()
    speedTex.repeat.set(4, 1)
    function addSpeedConduitRunway(startX, endX, z, width = 3.8) {
      const len = Math.abs(endX - startX)
      const midX = (startX + endX) / 2
      const geo = new THREE.PlaneGeometry(len, width)
      const mat = new THREE.MeshBasicMaterial({ map: speedTex, transparent: true, opacity: 0.95 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(midX, 0.03, z)
      mapObjectsGroup.add(mesh)

      // Neon Guide rails
      const railGeo = new THREE.BoxGeometry(len, 0.1, 0.15)
      const rail1 = new THREE.Mesh(railGeo, cyanNeonMat)
      rail1.position.set(midX, 0.05, z - width / 2)
      mapObjectsGroup.add(rail1)
      const rail2 = new THREE.Mesh(railGeo, cyanNeonMat)
      rail2.position.set(midX, 0.05, z + width / 2)
      mapObjectsGroup.add(rail2)

      speedPads.push({
        minX: Math.min(startX, endX),
        maxX: Math.max(startX, endX),
        minZ: z - width / 2,
        maxZ: z + width / 2,
        boostDuration: 3.5
      })
    }

    // --- A. CENTRAL MID: NÚCLEO CUÁNTICO LEVITANTE & MID CATWALK RING ---
    // Ground Energy Pit / Reactor Basin
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.2, 0.6, 24), trimMat)
    basin.position.set(0, 0.3, 0)
    basin.castShadow = true
    mapObjectsGroup.add(basin)
    meshColliders.push(basin)

    const basinRing = new THREE.Mesh(new THREE.TorusGeometry(5.8, 0.16, 8, 32), cyanNeonMat)
    basinRing.rotation.x = Math.PI / 2
    basinRing.position.set(0, 0.6, 0)
    mapObjectsGroup.add(basinRing)

    // Levitating Quantum Antimatter Core at Y = 9.5m
    const outerCoreGeo = new THREE.IcosahedronGeometry(3.0, 1)
    const outerCoreMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, wireframe: true, transparent: true, opacity: 0.85 })
    const outerCoreMesh = new THREE.Mesh(outerCoreGeo, outerCoreMat)
    outerCoreMesh.position.set(0, 9.5, 0)
    mapObjectsGroup.add(outerCoreMesh)
    animatedMeshes.push({ mesh: outerCoreMesh, rotY: 0.8, rotX: 0.5, baseY: 9.5, bobSpeed: 1.2, bobAmp: 0.4 })

    const innerCoreGeo = new THREE.OctahedronGeometry(1.8, 0)
    const innerCoreMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.95 })
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat)
    innerCoreMesh.position.set(0, 9.5, 0)
    mapObjectsGroup.add(innerCoreMesh)
    animatedMeshes.push({ mesh: innerCoreMesh, rotY: -1.4, rotZ: 0.8, baseY: 9.5, bobSpeed: 1.2, bobAmp: 0.4 })

    // Orbiting Pulsar Rings
    const ringT1 = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.14, 8, 32), cyanNeonMat)
    ringT1.rotation.x = Math.PI / 3
    ringT1.position.set(0, 9.5, 0)
    mapObjectsGroup.add(ringT1)
    animatedMeshes.push({ mesh: ringT1, rotY: 1.6, rotX: 0.8 })

    const ringT2 = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.12, 8, 32), purpleNeonMat)
    ringT2.rotation.z = Math.PI / 3
    ringT2.position.set(0, 9.5, 0)
    mapObjectsGroup.add(ringT2)
    animatedMeshes.push({ mesh: ringT2, rotY: -1.2, rotZ: -0.9 })

    // Elevated Mid Catwalk Ring (Y = 4.5m)
    addPlatform(0, 4.5, -11, 16, 4.5, trimMat) // North ring segment
    addPlatform(0, 4.5, 11, 16, 4.5, trimMat)  // South ring segment
    addPlatform(-11, 4.5, 0, 4.5, 16, trimMat) // West ring segment
    addPlatform(11, 4.5, 0, 4.5, 16, trimMat)  // East ring segment

    // Corner links
    addPlatform(-9, 4.5, -9, 4.5, 4.5, trimMat)
    addPlatform(9, 4.5, -9, 4.5, 4.5, trimMat)
    addPlatform(-9, 4.5, 9, 4.5, 4.5, trimMat)
    addPlatform(9, 4.5, 9, 4.5, 4.5, trimMat)

    // Glass Railings on Mid Catwalk
    ;[
      { x: 0, z: -8.8, w: 14, d: 0.18 },
      { x: 0, z: 8.8, w: 14, d: 0.18 },
      { x: -8.8, z: 0, w: 0.18, d: 14 },
      { x: 8.8, z: 0, w: 0.18, d: 14 }
    ].forEach(r => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(r.w, 1.1, r.d), glassRailingMat)
      rail.position.set(r.x, 5.05, r.z)
      mapObjectsGroup.add(rail)
      meshColliders.push(rail)
    })

    // 4 Skybridges connecting Mid Ring to Outer Zones
    addPlatform(0, 4.5, -19, 4.5, 12, trimMat) // Skybridge North (Site A approach)
    addPlatform(0, 4.5, 19, 4.5, 12, trimMat)  // Skybridge South (Site B approach)
    addPlatform(-19, 4.5, 0, 12, 4.5, trimMat) // Skybridge West (Atk approach)
    addPlatform(19, 4.5, 0, 12, 4.5, trimMat)  // Skybridge East (Def approach)

    // 2 Grand Staircases climbing from Ground (Y=0) to West & East Skybridges (Y=4.5m)
    addStaircase(-27, -5, -19, -5, 0, 4.5, 3.2, 12)
    addStaircase(27, 5, 19, 5, 0, 4.5, 3.2, 12)

    // Ground Mid Cover Blocks
    addWall(-6, 0, -5, 2.6, 2.4, 2.6, goldAccentMat)
    addWall(6, 0, 5, 2.6, 2.4, 2.6, goldAccentMat)
    addWall(-5, 0, 6, 2.8, 2.4, 2.8, containerMat)
    addWall(5, 0, -6, 2.8, 2.4, 2.8, containerMat)

    // --- B. SITE A (NORTH: Z = -28): GENERADOR DE HIPER-ESPACIO ---
    const siteABase = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 0.4, 16), trimMat)
    siteABase.position.set(0, 0.2, -28)
    mapObjectsGroup.add(siteABase)
    meshColliders.push(siteABase)

    // Floating Quantum Crystal Prism
    const prismMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(2.2, 0),
      new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.9 })
    )
    prismMesh.position.set(0, 3.5, -28)
    mapObjectsGroup.add(prismMesh)
    animatedMeshes.push({ mesh: prismMesh, rotY: 1.0, rotX: 0.4, baseY: 3.5, bobSpeed: 1.5, bobAmp: 0.35 })

    // 4 Hyper-Conduit Energy Pylons flanking Site A
    ;[
      { x: -9, z: -35 }, { x: 9, z: -35 },
      { x: -9, z: -21 }, { x: 9, z: -21 }
    ].forEach(p => {
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 8.5, 12), wallMat)
      pylon.position.set(p.x, 4.25, p.z)
      pylon.castShadow = true
      mapObjectsGroup.add(pylon)
      meshColliders.push(pylon)

      const pRing = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.1, 8, 24), cyanNeonMat)
      pRing.rotation.x = Math.PI / 2
      pRing.position.set(p.x, 5.5, p.z)
      mapObjectsGroup.add(pRing)
    })

    // High Ground Sniper Balcony (Site A: Y = 5.5m)
    addPlatform(0, 5.5, -39, 14, 5.0, trimMat)
    addWall(0, 5.5, -41.2, 14, 1.2, 0.4, trimMat) // Back guard wall
    addStaircase(8, -32, 4, -39, 0, 5.5, 2.6, 12)  // Access stairs

    // Site A Cover Blocks
    addWall(-4.5, 0, -25, 2.5, 2.4, 2.5, containerMat)
    addWall(4.5, 0, -31, 2.5, 2.4, 2.5, goldAccentMat)
    addWall(0, 0, -35, 7.0, 4.0, 1.8)

    // --- C. SITE B (SOUTH: Z = 28): CÁMARA DE SINGULARIDAD ---
    const siteBBase = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 0.4, 16), trimMat)
    siteBBase.position.set(0, 0.2, 28)
    mapObjectsGroup.add(siteBBase)
    meshColliders.push(siteBBase)

    // Rotating Singular Pulsar Rings
    const pRing1 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.18, 8, 32), purpleNeonMat)
    pRing1.position.set(0, 3.5, 28)
    mapObjectsGroup.add(pRing1)
    animatedMeshes.push({ mesh: pRing1, rotX: 1.4, rotY: 0.8 })

    const pRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.14, 8, 32), cyanNeonMat)
    pRing2.position.set(0, 3.5, 28)
    mapObjectsGroup.add(pRing2)
    animatedMeshes.push({ mesh: pRing2, rotZ: 1.4, rotY: -0.8 })

    const singCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x050714, roughness: 0.1, metalness: 0.9 })
    )
    singCore.position.set(0, 3.5, 28)
    mapObjectsGroup.add(singCore)

    // 4 Antimatter Power Capacitors
    ;[
      { x: -9, z: 35 }, { x: 9, z: 35 },
      { x: -9, z: 21 }, { x: 9, z: 21 }
    ].forEach(p => {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 8.5, 12), wallMat)
      cap.position.set(p.x, 4.25, p.z)
      cap.castShadow = true
      mapObjectsGroup.add(cap)
      meshColliders.push(cap)

      const cRing = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.1, 8, 24), purpleNeonMat)
      cRing.rotation.x = Math.PI / 2
      cRing.position.set(p.x, 5.5, p.z)
      mapObjectsGroup.add(cRing)
    })

    // High Ground Sniper Balcony (Site B: Y = 5.5m)
    addPlatform(0, 5.5, 39, 14, 5.0, trimMat)
    addWall(0, 5.5, 41.2, 14, 1.2, 0.4, trimMat)
    addStaircase(-8, 32, -4, 39, 0, 5.5, 2.6, 12)

    // Site B Cover Blocks
    addWall(-4.5, 0, 25, 2.5, 2.4, 2.5, goldAccentMat)
    addWall(4.5, 0, 31, 2.5, 2.4, 2.5, containerMat)
    addWall(0, 0, 35, 7.0, 4.0, 1.8)

    // --- D. SPAWN COURTYARDS & FLANK CORRIDORS ---
    // Attacker Courtyard (West: X = -38)
    addWall(-32, 0, -14, 2.5, 6.0, 10.0)
    addWall(-32, 0, 14, 2.5, 6.0, 10.0)
    addWall(-42, 0, -14, 2.0, 4.5, 6.0, containerMat)
    addWall(-42, 0, 14, 2.0, 4.5, 6.0, containerMat)

    // Defender Courtyard (East: X = +38)
    addWall(32, 0, -14, 2.5, 6.0, 10.0)
    addWall(32, 0, 14, 2.5, 6.0, 10.0)
    addWall(42, 0, -14, 2.0, 4.5, 6.0, containerMat)
    addWall(42, 0, 14, 2.0, 4.5, 6.0, containerMat)

    // --- E. INTERACTIVE MECHANIC 1: GRAVITATIONAL JUMP PADS (4 Pads) ---
    // Mid West approach -> Launches player directly onto Mid Catwalk!
    addInteractiveJumpPad(-14.0, -8.0, 4.5, 17.5)
    // Mid East approach -> Launches player directly onto Mid Catwalk!
    addInteractiveJumpPad(14.0, 8.0, 4.5, 17.5)
    // Site A Balcony launcher -> Boosts player up to Site A Sniper Perch!
    addInteractiveJumpPad(-18.0, -26.0, 5.5, 18.0)
    // Site B Balcony launcher -> Boosts player up to Site B Sniper Perch!
    addInteractiveJumpPad(18.0, 26.0, 5.5, 18.0)

    // --- F. INTERACTIVE MECHANIC 2: QUANTUM PORTALS / TELEPORTERS (2 Gates) ---
    // Outer West Flank (Site A path) <--> Outer East Flank (Site B path)
    addQuantumPortalGate('alpha', -26.0, -18.0, 0, 23.5, 18.0, -Math.PI / 2)
    addQuantumPortalGate('beta', 26.0, 18.0, Math.PI, -23.5, -18.0, Math.PI / 2)

    // --- G. INTERACTIVE MECHANIC 3: SPEED CONDUIT RUNWAYS (2 Hyper-Tracks) ---
    // West Spurt towards Mid (Boosts player speed across main straight)
    addSpeedConduitRunway(-28.0, -14.0, 0, 3.8)
    // East Spurt towards Mid
    addSpeedConduitRunway(14.0, 28.0, 0, 3.8)

  } else if (isKasbah) {
    // ==========================================
    // MAP 1: "TEMPLO CIBERNÉTICO KASBAH"
    // ==========================================

    // --- NORTH: SITE A - CELESTIAL OASIS SANCTUARY ---
    const sanctuaryRing = new THREE.Mesh(
      new THREE.CylinderGeometry(5.2, 5.5, 0.4, 16),
      goldAccentMat
    )
    sanctuaryRing.position.set(0, 0.2, -16)
    mapObjectsGroup.add(sanctuaryRing)
    meshColliders.push(sanctuaryRing)

    // Floating Celestial Cyan Water Crystal (Holographic center)
    const waterGeo = new THREE.OctahedronGeometry(1.6, 0)
    const waterMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.85 })
    const waterCrystal = new THREE.Mesh(waterGeo, waterMat)
    waterCrystal.position.set(0, 2.4, -16)
    mapObjectsGroup.add(waterCrystal)

    // 8 Grand Sandstone Pillars surrounding Site A
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const px = Math.cos(angle) * 7.5
      const pz = -16 + Math.sin(angle) * 7.5
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 7.5, 12), wallMat)
      pillar.position.set(px, 3.75, pz)
      pillar.castShadow = true
      mapObjectsGroup.add(pillar)
      meshColliders.push(pillar)
    }

    // Site A Cover Blocks (Golden Radianite Crates)
    addWall(-4.5, 0, -14, 2.2, 2.2, 2.2, goldAccentMat)
    addWall(4.5, 0, -18, 2.2, 2.2, 2.2, goldAccentMat)
    addWall(0, 0, -23, 8.0, 5.0, 1.8)

    // --- SOUTH: SITE B - THE GOLDEN RADIANITE VAULT ---
    // Massive Glowing Golden Obelisk in Center
    const obeliskGeo = new THREE.ConeGeometry(2.2, 8.0, 4)
    const obeliskMat = new THREE.MeshStandardMaterial({ map: goldObeliskTex, roughness: 0.2, metalness: 0.85 })
    const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat)
    obelisk.position.set(0, 4.0, 16)
    obelisk.rotation.y = Math.PI / 4
    mapObjectsGroup.add(obelisk)
    meshColliders.push(obelisk)

    // Vault Fortified Archways & Columns
    addWall(-8, 0, 16, 2.0, 6.5, 8.0)
    addWall(8, 0, 16, 2.0, 6.5, 8.0)
    addWall(0, 0, 23, 10.0, 5.5, 2.0)
    addWall(-4, 0, 12, 2.4, 2.4, 2.4, containerMat)
    addWall(4, 0, 20, 2.4, 2.4, 2.4, containerMat)

    // --- MID: GRAND BAZAAR & ELEVATED SNIPER ARCH BRIDGE ---
    // Elevated Stone Bridge at Mid (X=0, Z=0, Y=3.8m)
    addPlatform(0, 3.8, 0, 6.0, 18.0, trimMat)

    // Oriental Fabric Canopy over Mid Bridge
    const canopyGeo = new THREE.PlaneGeometry(6.4, 18.2)
    const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat)
    canopyMesh.position.set(0, 6.2, 0)
    canopyMesh.rotation.x = Math.PI / 2
    mapObjectsGroup.add(canopyMesh)

    // Staircases climbing to Mid Bridge
    addStaircase(-8.0, 0, -3.0, 0, 0, 3.8, 2.8, 12) // West to Mid
    addStaircase(8.0, 0, 3.0, 0, 0, 3.8, 2.8, 12)   // East to Mid

    // Mid Bazaar Stalls & Stone Divider Walls
    addWall(-12, 0, -8, 2.0, 5.0, 8.0)
    addWall(-12, 0, 8, 2.0, 5.0, 8.0)
    addWall(12, 0, -8, 2.0, 5.0, 8.0)
    addWall(12, 0, 8, 2.0, 5.0, 8.0)

    // Market stalls
    addWall(-6, 0, -7, 3.2, 2.0, 3.2, containerMat)
    addWall(6, 0, 7, 3.2, 2.0, 3.2, containerMat)

    // --- SPAWN ZONES ---
    // Attacker Spawn (West: X = -26.0)
    addWall(-22, 0, -12, 2.0, 5.5, 8.0)
    addWall(-22, 0, 12, 2.0, 5.5, 8.0)

    // Defender Spawn (East: X = +26.0)
    addWall(22, 0, -12, 2.0, 5.5, 8.0)
    addWall(22, 0, 12, 2.0, 5.5, 8.0)

  } else if (isGlacier) {
    // ==========================================
    // MAP 3: "ESTACIÓN GLACIAR ÁRTICA: CRYODOCK-7"
    // ==========================================

    // --- NORTH: SITE A - SUB-ZERO CRYO REACTOR DOME ---
    const cryoRing = new THREE.Mesh(
      new THREE.CylinderGeometry(5.2, 5.6, 0.45, 16),
      trimMat
    )
    cryoRing.position.set(0, 0.225, -16)
    mapObjectsGroup.add(cryoRing)
    meshColliders.push(cryoRing)

    // Glowing Sub-Zero Reactor Core
    const outerCoreGeo = new THREE.IcosahedronGeometry(2.0, 1)
    const outerCoreMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85, wireframe: true })
    const outerCore = new THREE.Mesh(outerCoreGeo, outerCoreMat)
    outerCore.position.set(0, 2.8, -16)
    mapObjectsGroup.add(outerCore)

    const innerCoreGeo = new THREE.OctahedronGeometry(1.2, 0)
    const innerCoreMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.95 })
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat)
    innerCore.position.set(0, 2.8, -16)
    mapObjectsGroup.add(innerCore)

    // 4 Heavy Cryogenic Coolant Towers / Heatsinks
    const towerGeo = new THREE.CylinderGeometry(0.85, 1.05, 8.0, 16)
    const towerCoords = [
      { x: -6.5, z: -21.5 },
      { x: 6.5, z: -21.5 },
      { x: -6.5, z: -10.5 },
      { x: 6.5, z: -10.5 }
    ]
    towerCoords.forEach(c => {
      const tower = new THREE.Mesh(towerGeo, wallMat)
      tower.position.set(c.x, 4.0, c.z)
      tower.castShadow = true
      tower.receiveShadow = true
      mapObjectsGroup.add(tower)
      meshColliders.push(tower)

      // Cyan Glowing Coolant Ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.08, 8, 24), cyanNeonMat)
      ring.rotation.x = Math.PI / 2
      ring.position.set(c.x, 5.0, c.z)
      mapObjectsGroup.add(ring)
    })

    // Site A Cover Blocks (Frozen Radianite Crates)
    addWall(-4.5, 0, -14, 2.4, 2.4, 2.4, goldAccentMat)
    addWall(4.5, 0, -18, 2.4, 2.4, 2.4, goldAccentMat)
    addWall(0, 0, -23, 8.0, 5.0, 2.0)

    // --- SOUTH: SITE B - ARCTIC CARGO HANGAR & CRYO VAULT ---
    // Massive Glowing Cryo Coolant Chamber
    const cryoVaultGeo = new THREE.ConeGeometry(2.4, 8.5, 6)
    const cryoVaultMat = new THREE.MeshStandardMaterial({ map: goldObeliskTex, roughness: 0.2, metalness: 0.85 })
    const cryoVault = new THREE.Mesh(cryoVaultGeo, cryoVaultMat)
    cryoVault.position.set(0, 4.25, 16)
    mapObjectsGroup.add(cryoVault)
    meshColliders.push(cryoVault)

    // Vault Fortified Archways & Columns
    addWall(-8, 0, 16, 2.2, 7.0, 8.0)
    addWall(8, 0, 16, 2.2, 7.0, 8.0)
    addWall(0, 0, 23, 10.0, 5.5, 2.0)
    addWall(-4, 0, 12, 2.6, 2.6, 2.6, containerMat)
    addWall(4, 0, 20, 2.6, 2.6, 2.6, containerMat)

    // --- MID: GLACIER CHASM & TITANIUM SUSPENSION BRIDGE ---
    addPlatform(0, 3.8, 0, 6.0, 18.0, trimMat)

    // Frost Glass Railings
    const railGeo = new THREE.BoxGeometry(0.18, 1.1, 18.0)
    const railLeft = new THREE.Mesh(railGeo, glassRailingMat)
    railLeft.position.set(-2.9, 4.35, 0)
    mapObjectsGroup.add(railLeft)
    meshColliders.push(railLeft)

    const railRight = new THREE.Mesh(railGeo, glassRailingMat)
    railRight.position.set(2.9, 4.35, 0)
    mapObjectsGroup.add(railRight)
    meshColliders.push(railRight)

    // Staircases climbing to Mid Bridge
    addStaircase(-8.0, 0, -3.0, 0, 0, 3.8, 2.8, 12) // West to Mid
    addStaircase(8.0, 0, 3.0, 0, 0, 3.8, 2.8, 12)   // East to Mid

    // Tactical Chasm Flank Walls
    addWall(-12, 0, -8, 2.0, 5.5, 8.0)
    addWall(-12, 0, 8, 2.0, 5.5, 8.0)
    addWall(12, 0, -8, 2.0, 5.5, 8.0)
    addWall(12, 0, 8, 2.0, 5.5, 8.0)

    // Mid Arctic Crates
    addWall(-6, 0, -6, 3.0, 2.2, 3.0, containerMat)
    addWall(6, 0, 6, 3.0, 2.2, 3.0, containerMat)

    // --- SPAWN ZONES ---
    // Attacker Spawn (West: X = -26.0)
    addWall(-22, 0, -12, 2.0, 5.5, 8.0)
    addWall(-22, 0, 12, 2.0, 5.5, 8.0)

    // Defender Spawn (East: X = +26.0)
    addWall(22, 0, -12, 2.0, 5.5, 8.0)
    addWall(22, 0, 12, 2.0, 5.5, 8.0)

  } else {
    // ==========================================
    // MAP 2: "SECTOR RADIAN-9"
    // ==========================================
    // North Site A Reactor
    const reactorBase = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.8, 0.35, 8), trimMat)
    reactorBase.position.set(0, 0.175, -16)
    mapObjectsGroup.add(reactorBase)
    meshColliders.push(reactorBase)

    const coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 4.8, 16), cyanNeonMat)
    coreMesh.position.set(0, 2.5, -16)
    mapObjectsGroup.add(coreMesh)
    meshColliders.push(coreMesh)

    addWall(0, 0, -22, 8.0, 5.0, 2.0)
    addWall(-5, 0, -14, 2.0, 2.0, 2.0, containerMat)
    addWall(5, 0, -18, 2.0, 2.0, 2.0, containerMat)

    // South Site B Warehouse Vault
    addWall(0, 0, 22, 10.0, 5.5, 2.0)
    addWall(-7, 0, 16, 2.0, 5.5, 8.0)
    addWall(7, 0, 16, 2.0, 5.5, 8.0)
    addWall(-4, 0, 14, 2.8, 2.8, 2.8, containerMat)
    addWall(4, 0, 18, 2.8, 2.8, 2.8, containerMat)

    // Mid Skybridge
    addPlatform(0, 3.8, 0, 5.0, 16.0, trimMat)
    addStaircase(-7.0, -8.0, -2.5, -8.0, 0, 3.8, 2.6, 12)
    addStaircase(7.0, 8.0, 2.5, 8.0, 0, 3.8, 2.6, 12)

    addWall(-12, 0, -6, 2.0, 5.0, 8.0)
    addWall(-12, 0, 6, 2.0, 5.0, 8.0)
    addWall(12, 0, -6, 2.0, 5.0, 8.0)
    addWall(12, 0, 6, 2.0, 5.0, 8.0)
    addWall(-22, 0, 0, 2.0, 5.0, 8.0)
    addWall(22, 0, 0, 2.0, 5.0, 8.0)
  }

  // --- GREEN PLANT SITES VISUALS ---
  const plantMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x22c55e })
  const beaconGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.4, 12)

  const siteAZ = isColossus ? -52 : (isQuantum ? -28 : -16)
  const siteBZ = isColossus ? 52 : (isQuantum ? 28 : 16)
  const siteW = isColossus ? 24 : (isQuantum ? 16 : 14)
  const siteD = isColossus ? 18 : (isQuantum ? 12 : 10)

  // Site A
  const siteAGeo = new THREE.PlaneGeometry(siteW, siteD)
  const siteAMesh = new THREE.Mesh(siteAGeo, plantMat)
  siteAMesh.rotation.x = -Math.PI / 2
  siteAMesh.position.set(0, 0.04, siteAZ)
  mapObjectsGroup.add(siteAMesh)

  ;[
    { x: -siteW / 2, z: siteAZ - siteD / 2 }, { x: siteW / 2, z: siteAZ - siteD / 2 },
    { x: -siteW / 2, z: siteAZ + siteD / 2 }, { x: siteW / 2, z: siteAZ + siteD / 2 }
  ].forEach(c => {
    const b = new THREE.Mesh(beaconGeo, beaconMat)
    b.position.set(c.x, 0.7, c.z)
    mapObjectsGroup.add(b)
  })

  // Site B
  const siteBGeo = new THREE.PlaneGeometry(siteW, siteD)
  const siteBMesh = new THREE.Mesh(siteBGeo, plantMat)
  siteBMesh.rotation.x = -Math.PI / 2
  siteBMesh.position.set(0, 0.04, siteBZ)
  mapObjectsGroup.add(siteBMesh)

  ;[
    { x: -siteW / 2, z: siteBZ - siteD / 2 }, { x: siteW / 2, z: siteBZ - siteD / 2 },
    { x: -siteW / 2, z: siteBZ + siteD / 2 }, { x: siteW / 2, z: siteBZ + siteD / 2 }
  ].forEach(c => {
    const b = new THREE.Mesh(beaconGeo, beaconMat)
    b.position.set(c.x, 0.7, c.z)
    mapObjectsGroup.add(b)
  })

  // --- SPAWN SLOTS & PADS ---
  const redPadMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.75 })
  const bluePadMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.75 })
  const padGeo = new THREE.CylinderGeometry(isColossus ? 1.4 : 0.95, isColossus ? 1.4 : 0.95, 0.06, 24)

  const atkSlots = isColossus ? [
    { x: -72.0, y: 1.7, z: -18 },
    { x: -72.0, y: 1.7, z: -9 },
    { x: -72.0, y: 1.7, z: 0 },
    { x: -72.0, y: 1.7, z: 9 },
    { x: -72.0, y: 1.7, z: 18 }
  ] : (isQuantum ? [
    { x: -38.0, y: 1.7, z: -10 },
    { x: -38.0, y: 1.7, z: -5 },
    { x: -38.0, y: 1.7, z: 0 },
    { x: -38.0, y: 1.7, z: 5 },
    { x: -38.0, y: 1.7, z: 10 }
  ] : [
    { x: -26.0, y: 1.7, z: -10 },
    { x: -26.0, y: 1.7, z: -5 },
    { x: -26.0, y: 1.7, z: 0 },
    { x: -26.0, y: 1.7, z: 5 },
    { x: -26.0, y: 1.7, z: 10 }
  ])

  const defSlots = isColossus ? [
    { x: 72.0, y: 1.7, z: -18 },
    { x: 72.0, y: 1.7, z: -9 },
    { x: 72.0, y: 1.7, z: 0 },
    { x: 72.0, y: 1.7, z: 9 },
    { x: 72.0, y: 1.7, z: 18 }
  ] : (isQuantum ? [
    { x: 38.0, y: 1.7, z: -10 },
    { x: 38.0, y: 1.7, z: -5 },
    { x: 38.0, y: 1.7, z: 0 },
    { x: 38.0, y: 1.7, z: 5 },
    { x: 38.0, y: 1.7, z: 10 }
  ] : [
    { x: 26.0, y: 1.7, z: -10 },
    { x: 26.0, y: 1.7, z: -5 },
    { x: 26.0, y: 1.7, z: 0 },
    { x: 26.0, y: 1.7, z: 5 },
    { x: 26.0, y: 1.7, z: 10 }
  ])

  atkSlots.forEach(slot => {
    const pad = new THREE.Mesh(padGeo, redPadMat)
    pad.position.set(slot.x, 0.04, slot.z)
    mapObjectsGroup.add(pad)
  })

  defSlots.forEach(slot => {
    const pad = new THREE.Mesh(padGeo, bluePadMat)
    pad.position.set(slot.x, 0.04, slot.z)
    mapObjectsGroup.add(pad)
  })

  // --- SPAWN FORCEFIELD BARRIER SYSTEM (Buy Phase Barrier Walls) ---
  const barrierGroup = new THREE.Group()
  currentBarrierGroup = barrierGroup
  const barrierColliders = []

  const redForceTex = createForcefieldTexture('#ff4655')
  redForceTex.repeat.set(isColossus ? 12 : 4, 1)
  const blueForceTex = createForcefieldTexture(isGlacier ? '#38bdf8' : (isColossus ? '#00e5ff' : '#00e5ff'))
  blueForceTex.repeat.set(isColossus ? 12 : 4, 1)

  const redBarrierMat = new THREE.MeshBasicMaterial({
    map: redForceTex,
    color: 0xff4655,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide
  })
  const blueBarrierMat = new THREE.MeshBasicMaterial({
    map: blueForceTex,
    color: isGlacier ? 0x38bdf8 : 0x00e5ff,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide
  })

  const barrierWallH = isColossus ? 14.0 : (isQuantum ? 10.0 : 7.5)
  const barrierWallDepth = isColossus ? 172.0 : (isQuantum ? 92.0 : 48.0)
  const barrierAtkX = isColossus ? -48.0 : (isQuantum ? -28.0 : -17.5)
  const barrierDefX = isColossus ? 48.0 : (isQuantum ? 28.0 : 17.5)

  const barrierGeo = new THREE.BoxGeometry(1.5, barrierWallH, barrierWallDepth)

  // 1. Attacker Barrier Wall
  const atkBarrierMesh = new THREE.Mesh(barrierGeo, redBarrierMat)
  atkBarrierMesh.position.set(barrierAtkX, barrierWallH / 2, 0)
  barrierGroup.add(atkBarrierMesh)
  barrierColliders.push(atkBarrierMesh)

  // 2. Defender Barrier Wall
  const defBarrierMesh = new THREE.Mesh(barrierGeo, blueBarrierMat)
  defBarrierMesh.position.set(barrierDefX, barrierWallH / 2, 0)
  barrierGroup.add(defBarrierMesh)
  barrierColliders.push(defBarrierMesh)

  scene.add(barrierGroup)

  function setBarriersActive(isActive) {
    barrierGroup.visible = isActive
    if (isActive) {
      if (!meshColliders.includes(atkBarrierMesh)) meshColliders.push(atkBarrierMesh)
      if (!meshColliders.includes(defBarrierMesh)) meshColliders.push(defBarrierMesh)
    } else {
      const idx1 = meshColliders.indexOf(atkBarrierMesh)
      if (idx1 !== -1) meshColliders.splice(idx1, 1)
      const idx2 = meshColliders.indexOf(defBarrierMesh)
      if (idx2 !== -1) meshColliders.splice(idx2, 1)
    }
  }

  // Initial state: active
  setBarriersActive(true)

  let mapDisplayName = 'TEMPLO CIBERNÉTICO KASBAH'
  if (isColossus) mapDisplayName = 'VALLE COLOSO: MEGACIUDAD 3D'
  else if (isQuantum) mapDisplayName = 'VORTEX CUÁNTICO: NÚCLEO OMEGA'
  else if (isGlacier) mapDisplayName = 'ESTACIÓN GLACIAR ÁRTICA: CRYODOCK-7'
  else if (!isKasbah) mapDisplayName = 'SECTOR RADIAN-9'

  return {
    mapId,
    name: mapDisplayName,
    meshColliders,
    wallsAABB,
    bounds: isColossus
      ? { minX: -88, maxX: 88, minZ: -88, maxZ: 88 }
      : (isQuantum
        ? { minX: -48, maxX: 48, minZ: -48, maxZ: 48 }
        : { minX: -32, maxX: 32, minZ: -32, maxZ: 32 }),
    spawnAtk: isColossus ? { x: -72.0, y: 1.7, z: 0 } : (isQuantum ? { x: -38.0, y: 1.7, z: 0 } : { x: -26.0, y: 1.7, z: 0 }),
    spawnDef: isColossus ? { x: 72.0, y: 1.7, z: 0 } : (isQuantum ? { x: 38.0, y: 1.7, z: 0 } : { x: 26.0, y: 1.7, z: 0 }),
    spawnAtkSlots: atkSlots,
    spawnDefSlots: defSlots,
    siteA: { x: 0, y: 0, z: siteAZ, width: siteW, depth: siteD, radius: isColossus ? 14.0 : (isQuantum ? 10.0 : 8.0), name: isQuantum ? 'SITE A (HIPER-ESPACIO)' : 'SITE A' },
    siteB: { x: 0, y: 0, z: siteBZ, width: siteW, depth: siteD, radius: isColossus ? 14.0 : (isQuantum ? 10.0 : 8.0), name: isQuantum ? 'SITE B (SINGULARIDAD)' : 'SITE B' },
    skybridge: { x: 0, y: isColossus ? 4.8 : (isQuantum ? 4.5 : 3.8), z: 0, width: isColossus ? 8 : (isQuantum ? 5 : 6), depth: isColossus ? 52 : (isQuantum ? 26 : 18) },
    barrierGroup,
    setBarriersActive,
    jumpPads,
    teleporters,
    speedPads,
    animatedMeshes
  }
}

