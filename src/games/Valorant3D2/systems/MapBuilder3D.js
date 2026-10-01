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

// --- MAIN ARENA BUILDER ---

let currentMapGroup = null
let currentBarrierGroup = null

export function buildTacticalArena(scene, mapId = 'kasbah_temple') {
  const isKasbah = (mapId === 'kasbah_temple' || mapId === 'templo_kasbah')
  const isGlacier = (mapId === 'glacier_cryo' || mapId === 'estacion_glaciar')
  const isColossus = (mapId === 'colossus_megacity' || mapId === 'valle_coloso' || mapId === 'coloso')

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
    roughness: isGlacier ? 0.25 : (isColossus ? 0.45 : 0.65),
    metalness: isGlacier ? 0.45 : (isColossus ? 0.35 : 0.15)
  })
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.5,
    metalness: isGlacier ? 0.6 : (isColossus ? 0.5 : 0.25)
  })
  const trimMat = new THREE.MeshStandardMaterial({
    color: isKasbah ? 0x451a03 : (isGlacier ? 0x0f172a : (isColossus ? 0x111827 : 0x0f172a)),
    roughness: 0.4,
    metalness: 0.7
  })
  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: isGlacier ? 0x38bdf8 : (isColossus ? 0x06b6d4 : 0xf59e0b),
    roughness: 0.2,
    metalness: 0.9
  })
  const cyanNeonMat = new THREE.MeshBasicMaterial({ color: isGlacier ? 0x7dd3fc : (isColossus ? 0x00f3ff : 0x00f3ff) })
  const purpleNeonMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 })
  const containerMat = new THREE.MeshStandardMaterial({ map: containerTex, roughness: 0.5, metalness: 0.4 })
  const skylineMat = isColossus ? new THREE.MeshStandardMaterial({ map: skylineTex, roughness: 0.35, metalness: 0.65 }) : null
  const canopyMat = new THREE.MeshStandardMaterial({ map: canopyTex, roughness: 0.7, side: THREE.DoubleSide })
  const glassRailingMat = new THREE.MeshPhysicalMaterial({
    color: isGlacier ? 0xbae6fd : (isColossus ? 0x00e5ff : 0x38bdf8),
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
  const mapRadius = isColossus ? 88 : 32
  const mapSize = mapRadius * 2
  const groundGeo = new THREE.PlaneGeometry(mapSize, mapSize)
  const groundMesh = new THREE.Mesh(groundGeo, floorMat)
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.position.y = 0
  groundMesh.receiveShadow = true
  mapObjectsGroup.add(groundMesh)
  meshColliders.push(groundMesh)

  const perimeterH = isColossus ? 16.0 : 8.5
  const wallThick = isColossus ? 4.0 : 2.5
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
    addWall(-60, 0, 0, 3.0, 4.5, 28.0) // West Front Trench Barricade
    addWall(-78, 0, -20, 3.0, 6.0, 16.0)
    addWall(-78, 0, 20, 3.0, 6.0, 16.0)

    // East Blue Bastion (Defenders: X = +72)
    // Twin Sniper Towers
    ;[{ z: -28 }, { z: 28 }].forEach(tw => {
      addWall(64, 0, tw.z, 5.0, 8.0, 5.0, wallMat)
      addPlatform(64, 8.0, tw.z, 6.5, 6.5, trimMat)
      addStaircase(70, tw.z, 65, tw.z, 0, 8.0, 2.5, 14)
    })
    addWall(60, 0, 0, 3.0, 4.5, 28.0) // East Front Trench Barricade
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

  const siteAZ = isColossus ? -52 : -16
  const siteBZ = isColossus ? 52 : 16
  const siteW = isColossus ? 24 : 14
  const siteD = isColossus ? 18 : 10

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
  ] : [
    { x: -26.0, y: 1.7, z: -10 },
    { x: -26.0, y: 1.7, z: -5 },
    { x: -26.0, y: 1.7, z: 0 },
    { x: -26.0, y: 1.7, z: 5 },
    { x: -26.0, y: 1.7, z: 10 }
  ]

  const defSlots = isColossus ? [
    { x: 72.0, y: 1.7, z: -18 },
    { x: 72.0, y: 1.7, z: -9 },
    { x: 72.0, y: 1.7, z: 0 },
    { x: 72.0, y: 1.7, z: 9 },
    { x: 72.0, y: 1.7, z: 18 }
  ] : [
    { x: 26.0, y: 1.7, z: -10 },
    { x: 26.0, y: 1.7, z: -5 },
    { x: 26.0, y: 1.7, z: 0 },
    { x: 26.0, y: 1.7, z: 5 },
    { x: 26.0, y: 1.7, z: 10 }
  ]

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

  const barrierWallH = isColossus ? 14.0 : 7.5
  const barrierWallDepth = isColossus ? 172.0 : 48.0
  const barrierAtkX = isColossus ? -48.0 : -17.5
  const barrierDefX = isColossus ? 48.0 : 17.5

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
  else if (isGlacier) mapDisplayName = 'ESTACIÓN GLACIAR ÁRTICA: CRYODOCK-7'
  else if (!isKasbah) mapDisplayName = 'SECTOR RADIAN-9'

  return {
    mapId,
    name: mapDisplayName,
    meshColliders,
    wallsAABB,
    bounds: isColossus ? { minX: -88, maxX: 88, minZ: -88, maxZ: 88 } : { minX: -32, maxX: 32, minZ: -32, maxZ: 32 },
    spawnAtk: isColossus ? { x: -72.0, y: 1.7, z: 0 } : { x: -26.0, y: 1.7, z: 0 },
    spawnDef: isColossus ? { x: 72.0, y: 1.7, z: 0 } : { x: 26.0, y: 1.7, z: 0 },
    spawnAtkSlots: atkSlots,
    spawnDefSlots: defSlots,
    siteA: { x: 0, y: 0, z: siteAZ, width: siteW, depth: siteD, radius: isColossus ? 14.0 : 8.0, name: 'SITE A' },
    siteB: { x: 0, y: 0, z: siteBZ, width: siteW, depth: siteD, radius: isColossus ? 14.0 : 8.0, name: 'SITE B' },
    skybridge: { x: 0, y: isColossus ? 4.8 : 3.8, z: 0, width: isColossus ? 8 : 6, depth: isColossus ? 52 : 18 },
    barrierGroup,
    setBarriersActive
  }
}

