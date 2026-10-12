// src/games/Valorant3D2/systems/PickupSystem3D.js
import * as THREE from 'three'
import { soundManager } from './SoundSystem.js'

export const PICKUP_TYPES = {
  SMOKE: {
    id: 'smoke',
    slot: 'C',
    name: 'Nube de Humo',
    icon: '☁️',
    color: 0x38bdf8,
    hexColor: '#38bdf8',
    charges: 1,
    maxCharges: 99,
    desc: '+1 Humo Táctico [C]'
  },
  RAMP: {
    id: 'ramp',
    slot: 'Q',
    name: 'Rampa 1v1',
    icon: '🪜',
    color: 0xf59e0b,
    hexColor: '#f59e0b',
    charges: 2,
    maxCharges: 99,
    desc: '+2 Rampas 1v1 [Q]'
  },
  GRAPPLE: {
    id: 'grapple',
    slot: 'E',
    name: 'Gancho Impulso',
    icon: '⚡',
    color: 0x00f3ff,
    hexColor: '#00f3ff',
    charges: 1,
    maxCharges: 99,
    desc: '+1 Gancho de Agarre [E]'
  },
  LAUNCHPAD: {
    id: 'launchpad',
    slot: 'X',
    name: 'Super Salto',
    icon: '🚀',
    color: 0xc084fc,
    hexColor: '#c084fc',
    charges: 1,
    maxCharges: 99,
    desc: '+1 Super Salto [X]'
  },
  HEALTH: {
    id: 'health',
    type: 'buff',
    name: 'Botiquín',
    icon: '💚',
    color: 0x10b981,
    hexColor: '#10b981',
    amount: 50,
    desc: '+50 Vida (HP)'
  },
  SHIELD: {
    id: 'shield',
    type: 'buff',
    name: 'Batería Escudo',
    icon: '🛡️',
    color: 0x06b6d4,
    hexColor: '#06b6d4',
    amount: 25,
    desc: '+25 Escudo'
  }
}

const PICKUP_POOL = [
  PICKUP_TYPES.RAMP,
  PICKUP_TYPES.RAMP,
  PICKUP_TYPES.GRAPPLE,
  PICKUP_TYPES.GRAPPLE,
  PICKUP_TYPES.SMOKE,
  PICKUP_TYPES.SMOKE,
  PICKUP_TYPES.LAUNCHPAD,
  PICKUP_TYPES.HEALTH,
  PICKUP_TYPES.SHIELD
]

function getRandomPickupType() {
  return PICKUP_POOL[Math.floor(Math.random() * PICKUP_POOL.length)]
}

function randRange(min, max) {
  return min + Math.random() * (max - min)
}

export class PickupSystem3D {
  constructor(scene) {
    this.scene = scene
    this.pickups = []
    this.pickupGroup = new THREE.Group()
    this.scene.add(this.pickupGroup)
    this.globalTimer = 0
    this.currentMapId = 'kasbah_temple'
  }

  // Clear all existing pickups and dispose meshes
  clear() {
    this.pickups.forEach(p => {
      if (p.mesh) {
        this.pickupGroup.remove(p.mesh)
        p.mesh.traverse(c => {
          if (c.geometry) c.geometry.dispose()
          if (c.material) {
            if (Array.isArray(c.material)) c.material.forEach(m => m.dispose())
            else c.material.dispose()
          }
        })
      }
    })
    this.pickups = []
  }

  // Generate random spawn points across tactical playable zones for a given map
  generateRandomSpawnPoints(mapId) {
    const points = []

    if (mapId === 'colossus_megacity') {
      // Megamap 180x180m: Generate 26-32 randomized orbs
      const total = 28
      const zones = [
        // Central Monolith & Plaza
        () => ({ x: randRange(-18, 18), y: 0.8, z: randRange(-18, 18), type: getRandomPickupType() }),
        // Site A Quantum Citadel
        () => ({ x: randRange(-35, 35), y: 0.8, z: randRange(-55, -35), type: getRandomPickupType() }),
        // Site B Megadocks
        () => ({ x: randRange(-35, 35), y: 0.8, z: randRange(35, 55), type: getRandomPickupType() }),
        // East / West Perimeters
        () => ({ x: randRange(-55, -25), y: 0.8, z: randRange(-30, 30), type: getRandomPickupType() }),
        () => ({ x: randRange(25, 55), y: 0.8, z: randRange(-30, 30), type: getRandomPickupType() }),
        // Elevated Skybridges / Towers
        () => ({ x: randRange(-30, 30), y: 8.0, z: randRange(-28, -20), type: getRandomPickupType() }),
        () => ({ x: randRange(-30, 30), y: 8.0, z: randRange(20, 28), type: getRandomPickupType() }),
        () => ({ x: (Math.random() > 0.5 ? -35 : 35), y: 4.5, z: randRange(-20, 20), type: getRandomPickupType() })
      ]

      for (let i = 0; i < total; i++) {
        const zoneFn = zones[i % zones.length]
        points.push(zoneFn())
      }
    } else if (mapId === 'kasbah_temple') {
      // Kasbah Desert Oasis: Generate 20-24 randomized orbs
      const total = 22
      const zones = [
        // Central Oasis & Sunlit Bazaar
        () => ({ x: randRange(-12, 12), y: 0.8, z: randRange(-8, 8), type: getRandomPickupType() }),
        // Site A Oasis Sanctuary
        () => ({ x: randRange(-16, 16), y: 0.8, z: randRange(-22, -12), type: getRandomPickupType() }),
        // Site B Radianite Vault
        () => ({ x: randRange(-16, 16), y: 0.8, z: randRange(12, 22), type: getRandomPickupType() }),
        // West Flank Corridor
        () => ({ x: randRange(-20, -14), y: 0.8, z: randRange(-16, 16), type: getRandomPickupType() }),
        // East Flank Corridor
        () => ({ x: randRange(14, 20), y: 0.8, z: randRange(-16, 16), type: getRandomPickupType() }),
        // Elevated Sandstone Balconies
        () => ({ x: (Math.random() > 0.5 ? -10 : 10), y: 4.5, z: randRange(-6, 6), type: getRandomPickupType() })
      ]

      for (let i = 0; i < total; i++) {
        const zoneFn = zones[i % zones.length]
        points.push(zoneFn())
      }
    } else if (mapId === 'glacier_cryo') {
      // Glacier Arctic Station: Generate 20-24 randomized orbs
      const total = 22
      const zones = [
        // Mid Ice Valley
        () => ({ x: randRange(-14, 14), y: 0.8, z: randRange(-8, 8), type: getRandomPickupType() }),
        // High Titanium Bridge
        () => ({ x: randRange(-6, 6), y: 4.5, z: randRange(-8, 8), type: getRandomPickupType() }),
        // Site A Cryo Station
        () => ({ x: randRange(-16, 16), y: 0.8, z: randRange(-22, -12), type: getRandomPickupType() }),
        // Site B Coolant Towers
        () => ({ x: randRange(-16, 16), y: 0.8, z: randRange(12, 22), type: getRandomPickupType() }),
        // Flank Ice Tunnels
        () => ({ x: randRange(-20, -14), y: 0.8, z: randRange(-14, 14), type: getRandomPickupType() }),
        () => ({ x: randRange(14, 20), y: 0.8, z: randRange(-14, 14), type: getRandomPickupType() })
      ]

      for (let i = 0; i < total; i++) {
        const zoneFn = zones[i % zones.length]
        points.push(zoneFn())
      }
    } else {
      // Sector Radian-9: Generate 20-24 randomized orbs
      const total = 22
      const zones = [
        // Mid Yard
        () => ({ x: randRange(-14, 14), y: 0.8, z: randRange(-8, 8), type: getRandomPickupType() }),
        // Industrial Catwalk
        () => ({ x: randRange(-8, 8), y: 4.5, z: randRange(-6, 6), type: getRandomPickupType() }),
        // Site A Fusion Core
        () => ({ x: randRange(-16, 16), y: 0.8, z: randRange(-22, -12), type: getRandomPickupType() }),
        // Site B Container Yard
        () => ({ x: randRange(-16, 16), y: 0.8, z: randRange(12, 22), type: getRandomPickupType() }),
        // Side Corridors
        () => ({ x: randRange(-20, -14), y: 0.8, z: randRange(-14, 14), type: getRandomPickupType() }),
        () => ({ x: randRange(14, 20), y: 0.8, z: randRange(-14, 14), type: getRandomPickupType() })
      ]

      for (let i = 0; i < total; i++) {
        const zoneFn = zones[i % zones.length]
        points.push(zoneFn())
      }
    }

    return points
  }

  // Generate tactical pickup locations based on map ID
  loadMapPickups(mapId) {
    this.currentMapId = mapId || this.currentMapId
    this.clear()

    const spawnPoints = this.generateRandomSpawnPoints(this.currentMapId)
    spawnPoints.forEach((sp, idx) => {
      this.createPickupMesh(sp, idx)
    })
  }

  // Create individual 3D Pickup Mesh
  createPickupMesh(sp, index) {
    const group = new THREE.Group()

    // 1. Glowing Geometric Core (Octahedron)
    const geo = new THREE.OctahedronGeometry(0.38, 0)
    const mat = new THREE.MeshStandardMaterial({
      color: sp.type.color,
      emissive: sp.type.color,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false
    })
    const coreMesh = new THREE.Mesh(geo, mat)
    group.add(coreMesh)

    // 2. Rotating Holographic Outer Ring
    const ringGeo = new THREE.RingGeometry(0.52, 0.60, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color: sp.type.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.rotation.x = Math.PI / 3
    group.add(ringMesh)

    // 3. Floating Holographic Label Decal Sprite
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 96
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
    ctx.roundRect(6, 6, 244, 84, 12)
    ctx.fill()
    ctx.strokeStyle = sp.type.hexColor
    ctx.lineWidth = 4
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${sp.type.icon} ${sp.type.name}`, 128, 48)

    const labelTex = new THREE.CanvasTexture(canvas)
    const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true })
    const labelSprite = new THREE.Sprite(labelMat)
    labelSprite.scale.set(1.4, 0.52, 1.0)
    labelSprite.position.set(0, 0.78, 0)
    group.add(labelSprite)

    // 4. Ground Beacon Glow Disc
    const groundBeaconGeo = new THREE.RingGeometry(0.2, 0.75, 32)
    const groundBeaconMat = new THREE.MeshBasicMaterial({
      color: sp.type.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    })
    const groundBeacon = new THREE.Mesh(groundBeaconGeo, groundBeaconMat)
    groundBeacon.rotation.x = -Math.PI / 2
    groundBeacon.position.y = -sp.y + 0.05
    group.add(groundBeacon)

    group.position.set(sp.x, sp.y + 0.5, sp.z)
    this.pickupGroup.add(group)

    this.pickups.push({
      id: `pickup_${index}`,
      type: sp.type,
      mesh: group,
      coreMesh,
      ringMesh,
      labelSprite,
      groundBeacon,
      basePos: { x: sp.x, y: sp.y + 0.5, z: sp.z },
      active: true,
      respawnTimer: 0,
      respawnDuration: 12.0 // Respawns after 12 seconds in randomized positions
    })
  }

  // Update pickup animations and collect detection per frame
  update(dt, player, onCollectCallback, playersList = []) {
    this.globalTimer += dt

    for (const p of this.pickups) {
      if (!p.active) {
        p.respawnTimer -= dt
        if (p.respawnTimer <= 0) {
          // Re-activate pickup and assign a fresh randomized position nearby or in active zones
          const freshSp = this.generateRandomSpawnPoints(this.currentMapId)[0]
          if (freshSp) {
            p.type = freshSp.type
            p.basePos.x = freshSp.x
            p.basePos.y = freshSp.y + 0.5
            p.basePos.z = freshSp.z
            p.mesh.position.set(p.basePos.x, p.basePos.y, p.basePos.z)
            p.groundBeacon.position.y = -freshSp.y + 0.05
          }

          p.active = true
          p.mesh.visible = true
          p.mesh.scale.set(0.01, 0.01, 0.01)
        } else {
          continue
        }
      }

      // Smooth respawn entrance scaling
      if (p.mesh.scale.x < 1.0) {
        const nextScale = Math.min(1.0, p.mesh.scale.x + dt * 4.0)
        p.mesh.scale.set(nextScale, nextScale, nextScale)
      }

      // Hovering & Spinning Animations
      p.mesh.position.y = p.basePos.y + Math.sin(this.globalTimer * 2.8 + p.basePos.x) * 0.15
      p.coreMesh.rotation.y += 1.6 * dt
      p.coreMesh.rotation.x += 0.8 * dt
      p.ringMesh.rotation.z += 2.2 * dt

      // Check Collection by Local Player
      if (player && player.alive) {
        const dist = Math.hypot(player.pos.x - p.basePos.x, player.pos.z - p.basePos.z)
        const verticalDist = Math.abs((player.pos.y || 1.7) - 1.0 - p.basePos.y)

        if (dist < 1.45 && verticalDist < 2.2) {
          const collected = this.applyPickupToPlayer(p.type, player)
          if (collected) {
            p.active = false
            p.mesh.visible = false
            p.respawnTimer = p.respawnDuration
            soundManager.play('buy')
            if (onCollectCallback) {
              onCollectCallback(p.type, player)
            }
          }
        }
      }

      // Check Collection by Bots
      if (Array.isArray(playersList)) {
        for (const bot of playersList) {
          if (!p.active) break
          if (bot.id === player?.id || !bot.alive) continue
          const dist = Math.hypot(bot.pos.x - p.basePos.x, bot.pos.z - p.basePos.z)
          if (dist < 1.45) {
            const collected = this.applyPickupToPlayer(p.type, bot)
            if (collected) {
              p.active = false
              p.mesh.visible = false
              p.respawnTimer = p.respawnDuration
              break
            }
          }
        }
      }
    }
  }

  // Apply effect to player/bot (powers accumulate up to 99 charges!)
  applyPickupToPlayer(type, target) {
    if (!target.abilityCharges) {
      target.abilityCharges = { C: 0, Q: 0, E: 0, X: 0 }
    }

    if (type.slot) {
      const current = target.abilityCharges[type.slot] || 0
      const maxC = type.maxCharges || 99
      if (current >= maxC) return false
      // Accumulate charges smoothly!
      target.abilityCharges[type.slot] = Math.min(maxC, current + type.charges)
      return true
    }

    if (type.id === 'health') {
      const maxHp = target.maxHealth || 150
      if (target.health >= maxHp) return false
      target.health = Math.min(maxHp, target.health + type.amount)
      return true
    }

    if (type.id === 'shield') {
      const maxArmor = 50
      if (target.armor >= maxArmor) return false
      target.armor = Math.min(maxArmor, target.armor + type.amount)
      return true
    }

    return false
  }

  // Reset all pickups on round restart and re-shuffle random spawn locations
  resetRoundPickups(mapId) {
    if (mapId) {
      this.currentMapId = mapId
    }
    this.loadMapPickups(this.currentMapId)
  }
}
