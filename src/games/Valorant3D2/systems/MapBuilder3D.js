// src/games/Valorant3D2/systems/MapBuilder3D.js
import * as THREE from 'three'

/**
 * Procedural Tactical Map Builder for Valorant3D: "SECTOR RADIAN-9"
 * Features 2 distinct floors (ground level & 3.6m elevated catwalks/heaven balconies),
 * solid architectural staircases with foundations and side guardrails,
 * high-fidelity procedural PBR textures for crates, containers, floors, and walls,
 * and seamless multi-level verticality.
 */

// 1. Procedural Concrete Floor Texture
function createConcreteTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#182030'
  ctx.fillRect(0, 0, 512, 512)

  // Subtle grid seams
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 4
  const step = 64
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 512)
    ctx.stroke()
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(512, y)
    ctx.stroke()
  }

  // Cyan tactical rivets at junctions
  ctx.fillStyle = '#38bdf8'
  for (let x = 0; x <= 512; x += step) {
    for (let y = 0; y <= 512; y += step) {
      if ((x + y) % (step * 2) === 0) {
        ctx.fillRect(x - 2, y - 2, 4, 4)
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 2. Procedural Metal Catwalk Grate Texture
function createMetalGrateTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#1e293b'
  ctx.fillRect(0, 0, 256, 256)

  // Outer bevel rim
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 3
  ctx.strokeRect(4, 4, 248, 248)
  ctx.strokeRect(16, 16, 224, 224)

  // Industrial diamond/dot pattern
  ctx.fillStyle = '#475569'
  for (let x = 24; x < 232; x += 16) {
    for (let y = 24; y < 232; y += 16) {
      ctx.fillRect(x, y, 6, 6)
    }
  }

  // Screws
  ctx.fillStyle = '#94a3b8'
  ;[[10, 10], [246, 10], [10, 246], [246, 246]].forEach(([px, py]) => {
    ctx.beginPath()
    ctx.arc(px, py, 3, 0, Math.PI * 2)
    ctx.fill()
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// 3. Procedural Industrial Cargo Shipping Container Texture
function createContainerTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Base industrial rust/orange
  ctx.fillStyle = '#b45309'
  ctx.fillRect(0, 0, 512, 512)

  // Corrugated vertical metal ribs
  const ribW = 32
  for (let x = 0; x < 512; x += ribW) {
    ctx.fillStyle = '#9a3412'
    ctx.fillRect(x, 0, ribW / 2, 512)
    ctx.fillStyle = '#d97706'
    ctx.fillRect(x + ribW / 2, 0, ribW / 2, 512)
  }

  // Heavy steel corner frame
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(0, 0, 512, 28)
  ctx.fillRect(0, 484, 512, 28)
  ctx.fillRect(0, 0, 28, 512)
  ctx.fillRect(484, 0, 28, 512)

  // Hazard yellow/black diagonal warning stripes on top banner
  ctx.fillStyle = '#eab308'
  ctx.fillRect(32, 34, 448, 22)
  ctx.fillStyle = '#0f172a'
  for (let x = 32; x < 480; x += 32) {
    ctx.beginPath()
    ctx.moveTo(x, 34)
    ctx.lineTo(x + 16, 34)
    ctx.lineTo(x - 4, 56)
    ctx.lineTo(x - 20, 56)
    ctx.fill()
  }

  // Military Stencil Decal
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.font = 'bold 36px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('RADIANITE // 04-B', 256, 260)
  ctx.font = 'bold 20px monospace'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fillText('HAZARD CLASS 4 · TACTICAL SUPPLY', 256, 295)

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// 4. Procedural Radianite Crystal Crate Texture
function createRadianiteTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Dark graphite shell
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, 256, 256)

  // Glowing crystal window
  ctx.fillStyle = '#064e3b'
  ctx.fillRect(32, 32, 192, 192)

  // Neon green energy grid
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 3
  ctx.strokeRect(32, 32, 192, 192)

  // Hexagon energy pattern
  ctx.strokeStyle = '#4ade80'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(128, 128, 45, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#86efac'
  ctx.beginPath()
  ctx.arc(128, 128, 16, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// 5. Procedural Sci-Fi Wall Texture
function createWallTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#1e293b'
  ctx.fillRect(0, 0, 512, 512)

  // Heavy modular panels
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 6
  ctx.strokeRect(16, 16, 480, 230)
  ctx.strokeRect(16, 266, 480, 230)

  // Cyan panel status lights
  ctx.fillStyle = '#38bdf8'
  ctx.fillRect(32, 32, 12, 12)
  ctx.fillRect(56, 32, 12, 12)

  ctx.fillStyle = '#0284c7'
  ctx.fillRect(32, 282, 12, 12)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export function buildTacticalArena(scene) {
  const meshColliders = []
  const wallsAABB = []

  const concreteTex = createConcreteTexture()
  concreteTex.repeat.set(16, 16)

  const metalTex = createMetalGrateTexture()
  metalTex.repeat.set(4, 4)

  const wallTex = createWallTexture()
  wallTex.repeat.set(4, 2)

  const containerTex = createContainerTexture()
  const radianiteTex = createRadianiteTexture()

  // --- MATERIALS ---
  const floorMat = new THREE.MeshStandardMaterial({
    map: concreteTex,
    roughness: 0.75,
    metalness: 0.25
  })

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.6,
    metalness: 0.35
  })

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.8
  })

  const catwalkFloorMat = new THREE.MeshStandardMaterial({
    map: metalTex,
    roughness: 0.4,
    metalness: 0.7
  })

  const glassRailingMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    metalness: 0.9,
    side: THREE.DoubleSide
  })

  const stairStepMat = new THREE.MeshStandardMaterial({
    map: metalTex,
    roughness: 0.5,
    metalness: 0.6
  })

  const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff })
  const neonOrangeMat = new THREE.MeshBasicMaterial({ color: 0xf97316 })

  const radianiteBoxMat = new THREE.MeshStandardMaterial({
    map: radianiteTex,
    emissive: 0x059669,
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.6
  })

  const containerMat = new THREE.MeshStandardMaterial({
    map: containerTex,
    roughness: 0.45,
    metalness: 0.4
  })

  // Helper: Create Box Wall
  function addWall(x, y, z, w, h, d, mat = wallMat, isAABB = true) {
    const geo = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, y + h / 2, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
    meshColliders.push(mesh)

    if (isAABB) {
      wallsAABB.push({ x, z, w, d, h: y + h })
    }
    return mesh
  }

  // Helper: Create Walkable Platform
  function addPlatform(x, y, z, w, d, mat = catwalkFloorMat, thickness = 0.35) {
    const geo = new THREE.BoxGeometry(w, thickness, d)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, y - thickness / 2, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
    meshColliders.push(mesh)
    return mesh
  }

  // Helper: Create Solid Grounded Architectural Staircase (Each step solid to ground, 100% walkable)
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

      // Solid block reaching from ground Y=0 up to stepTopY (No hollow gaps, no blocking ceiling)
      const stepGeo = new THREE.BoxGeometry(width, stepHeight, stepDepth)
      const stepMesh = new THREE.Mesh(stepGeo, stairStepMat)
      stepMesh.position.set(stepX, startY + stepHeight / 2, stepZ)
      stepMesh.rotation.y = angle
      stepMesh.castShadow = true
      stepMesh.receiveShadow = true
      scene.add(stepMesh)
      meshColliders.push(stepMesh)

      // Glowing Cyan Neon Tread Line on step edge
      const stripGeo = new THREE.BoxGeometry(width * 0.96, 0.02, 0.04)
      const strip = new THREE.Mesh(stripGeo, neonCyanMat)
      strip.position.set(stepX, stepTopY + 0.01, stepZ)
      strip.rotation.y = angle
      scene.add(strip)
    }
  }

  // Helper: Create Glass Railing on Catwalk
  function addRailing(x, y, z, length, isHorizontal = true, height = 1.1) {
    const geo = isHorizontal
      ? new THREE.BoxGeometry(length, height, 0.08)
      : new THREE.BoxGeometry(0.08, height, length)
    const mesh = new THREE.Mesh(geo, glassRailingMat)
    mesh.position.set(x, y + height / 2, z)
    scene.add(mesh)
    meshColliders.push(mesh)

    // Top Handrail Cap
    const capGeo = isHorizontal
      ? new THREE.BoxGeometry(length, 0.06, 0.12)
      : new THREE.BoxGeometry(0.12, 0.06, length)
    const cap = new THREE.Mesh(capGeo, darkTrimMat)
    cap.position.set(x, y + height + 0.03, z)
    scene.add(cap)
  }

  // --- 2. GROUND FLOOR BASE ---
  const groundGeo = new THREE.PlaneGeometry(64, 64)
  const groundMesh = new THREE.Mesh(groundGeo, floorMat)
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.position.y = 0
  groundMesh.receiveShadow = true
  scene.add(groundMesh)
  meshColliders.push(groundMesh)

  // --- 3. OUTER PERIMETER FORTIFIED WALLS (64x64) ---
  const perimeterH = 8.0
  addWall(0, 0, -32, 64, perimeterH, 2.5) // North Wall
  addWall(0, 0, 32, 64, perimeterH, 2.5)  // South Wall
  addWall(-32, 0, 0, 2.5, perimeterH, 64) // West Wall (Attacker spawn back)
  addWall(32, 0, 0, 2.5, perimeterH, 64)  // East Wall (Defender spawn back)

  // --- 4. ATTACKER SPAWN (West: X = -25.5, Z = 0) ---
  addWall(-24, 0, -12, 2.0, 5.0, 10)
  addWall(-24, 0, 12, 2.0, 5.0, 10)
  addWall(-20, 0, -16, 1.5, 6.0, 2.5)
  addWall(-20, 0, 16, 1.5, 6.0, 2.5)

  // --- 5. DEFENDER SPAWN (East: X = +25.5, Z = 0) ---
  addWall(24, 0, -12, 2.0, 5.0, 10)
  addWall(24, 0, 12, 2.0, 5.0, 10)
  addWall(20, 0, -16, 1.5, 6.0, 2.5)
  addWall(20, 0, 16, 1.5, 6.0, 2.5)

  // --- 6. SITE A (North: X = 0, Z = -16) - "THE FUSION REACTOR" ---
  const reactorBaseGeo = new THREE.CylinderGeometry(4.5, 4.8, 0.35, 8)
  const reactorBase = new THREE.Mesh(reactorBaseGeo, darkTrimMat)
  reactorBase.position.set(0, 0.175, -16)
  reactorBase.receiveShadow = true
  scene.add(reactorBase)
  meshColliders.push(reactorBase)

  const coreColGeo = new THREE.CylinderGeometry(1.2, 1.2, 4.0, 12)
  const coreCol = new THREE.Mesh(coreColGeo, darkTrimMat)
  coreCol.position.set(0, 2.35, -16)
  scene.add(coreCol)
  meshColliders.push(coreCol)

  const plasmaRingGeo = new THREE.TorusGeometry(1.4, 0.15, 12, 24)
  const plasmaRing = new THREE.Mesh(plasmaRingGeo, neonOrangeMat)
  plasmaRing.rotation.x = Math.PI / 2
  plasmaRing.position.set(0, 2.2, -16)
  scene.add(plasmaRing)

  const reactorLight = new THREE.PointLight(0xf97316, 2.5, 12)
  reactorLight.position.set(0, 2.5, -16)
  scene.add(reactorLight)

  // Cover: Radianite Green Crates & Textured Cargo Containers on Site A
  addWall(-5.5, 0, -14, 2.0, 1.8, 2.0, radianiteBoxMat)
  addWall(-5.5, 0, -18, 2.4, 2.2, 3.2, containerMat)
  addWall(5.0, 0, -13, 2.4, 1.2, 1.2, darkTrimMat)

  // Site A Choke Partition Walls
  addWall(-10, 0, -22, 12, 6.0, 2.0)
  addWall(10, 0, -22, 12, 6.0, 2.0)

  // --- 7. SITE B (South: X = 0, Z = +16) - "THE RADIANITE VAULT" ---
  addWall(-4.5, 0, 16, 2.2, 2.4, 2.2, radianiteBoxMat)
  addWall(-4.5, 2.4, 16, 1.8, 1.8, 1.8, radianiteBoxMat)
  addWall(4.5, 0, 15, 2.5, 2.2, 4.2, containerMat)
  addWall(0, 0, 18, 3.5, 1.2, 1.2, darkTrimMat)

  // Site B Choke Partition Walls
  addWall(-10, 0, 22, 12, 6.0, 2.0)
  addWall(10, 0, 22, 12, 6.0, 2.0)

  const vaultLight = new THREE.PointLight(0x22c55e, 2.2, 12)
  vaultLight.position.set(0, 3.0, 16)
  scene.add(vaultLight)

  // --- 8. MID COURTYARD & UNDERPASS (Center: X = 0, Z = 0) ---
  addWall(-3.5, 0, -5.0, 1.4, 3.8, 1.4, darkTrimMat)
  addWall(3.5, 0, -5.0, 1.4, 3.8, 1.4, darkTrimMat)
  addWall(-3.5, 0, 5.0, 1.4, 3.8, 1.4, darkTrimMat)
  addWall(3.5, 0, 5.0, 1.4, 3.8, 1.4, darkTrimMat)

  // Mid Ground Textured Tactical Containers (Positioned to keep stairways 100% open and clear)
  addWall(-10.0, 0, 6.0, 2.2, 1.8, 3.2, containerMat)
  addWall(10.0, 0, -6.0, 2.2, 1.8, 3.2, containerMat)

  // --- 9. SECOND FLOOR (ELEVATED LEVEL: Y = 3.6m to 3.8m) ---

  // A. Central Skybridge Overlooking Mid (X in [-3, 3], Z in [-9, 9] at Y = 3.8m)
  addPlatform(0, 3.8, 0, 6.0, 18.0, catwalkFloorMat)
  // East full railing
  addRailing(3.0, 3.8, 0, 18.0, false)
  // West segmented railing (leaving center open for Mid staircase)
  addRailing(-3.0, 3.8, -5.5, 7.0, false) // North segment
  addRailing(-3.0, 3.8, 5.5, 7.0, false)  // South segment

  // B. A-Heaven Balcony (North-East: X in [7, 17], Z in [-21, -15] at Y = 3.6m)
  addPlatform(12.0, 3.6, -18.0, 10.0, 6.0, catwalkFloorMat)
  addRailing(9.0, 3.6, -15.0, 4.0, true) // Front railing partial (leaves stairs opening at X=12..17)
  addRailing(7.0, 3.6, -18.0, 6.0, false)   // West side railing

  // C. B-Heaven Balcony (South-East: X in [7, 17], Z in [15, 21] at Y = 3.6m)
  addPlatform(12.0, 3.6, 18.0, 10.0, 6.0, catwalkFloorMat)
  addRailing(9.0, 3.6, 15.0, 4.0, true)  // Front railing partial (leaves stairs opening at X=12..17)
  addRailing(7.0, 3.6, 18.0, 6.0, false)   // West side railing

  // D. A-Rafters Balcony (North-West: X in [-17, -7], Z in [-21, -15] at Y = 3.6m)
  addPlatform(-12.0, 3.6, -18.0, 10.0, 6.0, catwalkFloorMat)
  addRailing(-9.0, 3.6, -15.0, 4.0, true) // Front railing partial (leaves stairs opening at X=-17..-12)
  addRailing(-7.0, 3.6, -18.0, 6.0, false)   // East side railing

  // E. B-Rafters Balcony (South-West: X in [-17, -7], Z in [15, 21] at Y = 3.6m)
  addPlatform(-12.0, 3.6, 18.0, 10.0, 6.0, catwalkFloorMat)
  addRailing(-9.0, 3.6, 15.0, 4.0, true)  // Front railing partial (leaves stairs opening at X=-17..-12)
  addRailing(-7.0, 3.6, 18.0, 6.0, false)   // East side railing

  // F. Skybridge to Balcony Connectors
  addPlatform(5.0, 3.8, -9.0, 4.0, 3.0, catwalkFloorMat) // Connects Mid Bridge to A-Heaven
  addPlatform(5.0, 3.8, 9.0, 4.0, 3.0, catwalkFloorMat)  // Connects Mid Bridge to B-Heaven
  addPlatform(-5.0, 3.8, -9.0, 4.0, 3.0, catwalkFloorMat) // Connects Mid Bridge to A-Rafters
  addPlatform(-5.0, 3.8, 9.0, 4.0, 3.0, catwalkFloorMat)  // Connects Mid Bridge to B-Rafters

  // --- 10. SOLID ARCHITECTURAL STAIRCASES (PERFECTLY ALIGNED & UNOBSTRUCTED) ---
  
  // 1. Defender to A-Heaven Staircase (Starts at Z=-9, climbs North cleanly landing at Z=-15 onto A-Heaven)
  addStaircase(14.0, -9.0, 14.0, -15.0, 0, 3.6, 3.0, 12)

  // 2. Defender to B-Heaven Staircase (Starts at Z=9, climbs South cleanly landing at Z=15 onto B-Heaven)
  addStaircase(14.0, 9.0, 14.0, 15.0, 0, 3.6, 3.0, 12)

  // 3. Mid Ground to Skybridge Staircase (Starts at X=-9, climbs East cleanly landing at X=-3 onto Skybridge)
  addStaircase(-9.0, 0.0, -3.0, 0.0, 0, 3.8, 3.2, 12)

  // 4. Attacker to A-Rafters Staircase (Starts at Z=-9, climbs North cleanly landing at Z=-15 onto A-Rafters)
  addStaircase(-14.0, -9.0, -14.0, -15.0, 0, 3.6, 3.0, 12)

  // 5. Attacker to B-Rafters Staircase (Starts at Z=9, climbs South cleanly landing at Z=15 onto B-Rafters)
  addStaircase(-14.0, 9.0, -14.0, 15.0, 0, 3.6, 3.0, 12)

  // --- 11. GREEN PLANT ZONES & HOLOGRAPHIC BEACONS ---
  const plantMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide
  })
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x22c55e })
  const beaconGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.4, 12)

  // Site A Hologram (14m x 10m)
  const siteAGeo = new THREE.PlaneGeometry(14, 10)
  const siteAMesh = new THREE.Mesh(siteAGeo, plantMat)
  siteAMesh.rotation.x = -Math.PI / 2
  siteAMesh.position.set(0, 0.04, -16)
  scene.add(siteAMesh)

  ;[
    { x: -7, z: -21 }, { x: 7, z: -21 },
    { x: -7, z: -11 }, { x: 7, z: -11 }
  ].forEach(c => {
    const b = new THREE.Mesh(beaconGeo, beaconMat)
    b.position.set(c.x, 0.7, c.z)
    scene.add(b)
  })

  // Site B Hologram (14m x 10m)
  const siteBGeo = new THREE.PlaneGeometry(14, 10)
  const siteBMesh = new THREE.Mesh(siteBGeo, plantMat)
  siteBMesh.rotation.x = -Math.PI / 2
  siteBMesh.position.set(0, 0.04, 16)
  scene.add(siteBMesh)

  ;[
    { x: -7, z: 11 }, { x: 7, z: 11 },
    { x: -7, z: 21 }, { x: 7, z: 21 }
  ].forEach(c => {
    const b = new THREE.Mesh(beaconGeo, beaconMat)
    b.position.set(c.x, 0.7, c.z)
    scene.add(b)
  })

  // --- 12. SPAWN PADS ---
  const redPadMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.75 })
  const bluePadMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.75 })
  const padGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.06, 24)

  const atkSlots = [
    { x: -26.0, y: 1.7, z: -10 },
    { x: -26.0, y: 1.7, z: -5 },
    { x: -26.0, y: 1.7, z: 0 },
    { x: -26.0, y: 1.7, z: 5 },
    { x: -26.0, y: 1.7, z: 10 }
  ]

  const defSlots = [
    { x: 26.0, y: 1.7, z: -10 },
    { x: 26.0, y: 1.7, z: -5 },
    { x: 26.0, y: 1.7, z: 0 },
    { x: 26.0, y: 1.7, z: 5 },
    { x: 26.0, y: 1.7, z: 10 }
  ]

  atkSlots.forEach(slot => {
    const pad = new THREE.Mesh(padGeo, redPadMat)
    pad.position.set(slot.x, 0.04, slot.z)
    scene.add(pad)
  })

  defSlots.forEach(slot => {
    const pad = new THREE.Mesh(padGeo, bluePadMat)
    pad.position.set(slot.x, 0.04, slot.z)
    scene.add(pad)
  })

  // --- 13. TACTICAL OVERHEAD NEON SIGNAGE ---
  function createTextSign(text, colorHex, x, y, z, rotY = 0) {
    const signCanvas = document.createElement('canvas')
    signCanvas.width = 512
    signCanvas.height = 128
    const ctx = signCanvas.getContext('2d')
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'
    ctx.fillRect(0, 0, 512, 128)
    ctx.strokeStyle = colorHex
    ctx.lineWidth = 6
    ctx.strokeRect(4, 4, 504, 120)
    ctx.fillStyle = colorHex
    ctx.font = 'bold 44px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 256, 64)

    const signTex = new THREE.CanvasTexture(signCanvas)
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.FrontSide })
    const signGeo = new THREE.PlaneGeometry(3.5, 0.9)

    const signGroup = new THREE.Group()
    const frontMesh = new THREE.Mesh(signGeo, signMat)
    frontMesh.position.z = 0.02
    signGroup.add(frontMesh)

    const backMesh = new THREE.Mesh(signGeo, signMat)
    backMesh.rotation.y = Math.PI
    backMesh.position.z = -0.02
    signGroup.add(backMesh)

    signGroup.position.set(x, y, z)
    signGroup.rotation.y = rotY
    scene.add(signGroup)
  }

  createTextSign('SITE A // REACTOR', '#f97316', 0, 5.2, -21.8)
  createTextSign('SITE B // VAULT', '#22c55e', 0, 5.2, 21.8, Math.PI)
  createTextSign('MID SKYBRIDGE', '#00f3ff', 0, 5.2, 0, Math.PI / 2)
  createTextSign('ATTACKER BASE', '#ef4444', -24, 4.5, 0, Math.PI / 2)
  createTextSign('DEFENDER BASE', '#3b82f6', 24, 4.5, 0, -Math.PI / 2)

  return {
    meshColliders,
    wallsAABB,
    bounds: { minX: -32, maxX: 32, minZ: -32, maxZ: 32 },
    spawnAtk: { x: -26.0, y: 1.7, z: 0 },
    spawnDef: { x: 26.0, y: 1.7, z: 0 },
    spawnAtkSlots: atkSlots,
    spawnDefSlots: defSlots,
    siteA: { x: 0, y: 0, z: -16, width: 14, depth: 10, radius: 8.0, name: 'SITE A (REACTOR)' },
    siteB: { x: 0, y: 0, z: 16, width: 14, depth: 10, radius: 8.0, name: 'SITE B (VAULT)' },
    skybridge: { x: 0, y: 3.8, z: 0, width: 5, depth: 16 }
  }
}
