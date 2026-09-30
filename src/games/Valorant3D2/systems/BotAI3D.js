// src/games/Valorant3D2/systems/BotAI3D.js
import * as THREE from 'three'
import { soundManager } from './SoundSystem.js'
import { DamageSystem } from './DamageSystem.js'

export class BotAI3D {
  constructor(scene) {
    this.scene = scene
    this.raycaster = new THREE.Raycaster()
    this.meshColliders = []
    this.wallsAABB = []
  }

  setMeshColliders(meshList) {
    this.meshColliders = meshList || []
  }

  setColliders(wallsAABB) {
    this.wallsAABB = wallsAABB || []
  }

  resolveMovement(currX, currZ, targetX, targetZ, radius = 0.55) {
    let px = targetX
    let pz = targetZ
    const r = radius
    const bound = 29.5

    if (this.wallsAABB && this.wallsAABB.length > 0) {
      // 1. Resolve X movement
      let testX = px
      for (const w of this.wallsAABB) {
        const minX = w.x - w.w / 2 - r
        const maxX = w.x + w.w / 2 + r
        const minZ = w.z - w.d / 2 - r
        const maxZ = w.z + w.d / 2 + r

        if (testX > minX && testX < maxX && currZ > minZ && currZ < maxZ) {
          if (targetX >= currX) {
            testX = minX - 0.001
          } else {
            testX = maxX + 0.001
          }
        }
      }
      px = testX

      // 2. Resolve Z movement
      let testZ = pz
      for (const w of this.wallsAABB) {
        const minX = w.x - w.w / 2 - r
        const maxX = w.x + w.w / 2 + r
        const minZ = w.z - w.d / 2 - r
        const maxZ = w.z + w.d / 2 + r

        if (px > minX && px < maxX && testZ > minZ && testZ < maxZ) {
          if (targetZ >= currZ) {
            testZ = minZ - 0.001
          } else {
            testZ = maxZ + 0.001
          }
        }
      }
      pz = testZ
    }

    // Outer map perimeter containment
    px = Math.max(-bound + r, Math.min(bound - r, px))
    pz = Math.max(-bound + r, Math.min(bound - r, pz))

    return { x: px, z: pz }
  }

  updateBot(bot, dt, player, phase, map3D, onBotShoot, allPlayersList = []) {
    if (!bot.alive) return

    // Buy Phase - stationary in spawn
    if (phase === 'BUY_PHASE') return

    // Practice Range Dummy bot behavior
    if (bot.isDummy) {
      if (bot.strafing) {
        bot.dummyTimer = (bot.dummyTimer || 0) + dt
        const targetZ = bot.initialZ + Math.sin(bot.dummyTimer * 2) * 3.5
        const resolved = this.resolveMovement(bot.pos.x, bot.pos.z, bot.pos.x, targetZ)
        bot.pos.x = resolved.x
        bot.pos.z = resolved.z
      }
      return
    }

    // Find all living enemies
    const candidates = []
    if (player && player.alive && player.team !== bot.team) {
      candidates.push(player)
    }
    if (Array.isArray(allPlayersList)) {
      allPlayersList.forEach(p => {
        if (p.id !== bot.id && p.alive && p.team !== bot.team && p.id !== player?.id) {
          candidates.push(p)
        }
      })
    }

    if (candidates.length === 0) return

    // Pick closest enemy
    let closestEnemy = candidates[0]
    let minDist = Math.hypot(closestEnemy.pos.x - bot.pos.x, closestEnemy.pos.z - bot.pos.z)
    for (let i = 1; i < candidates.length; i++) {
      const d = Math.hypot(candidates[i].pos.x - bot.pos.x, candidates[i].pos.z - bot.pos.z)
      if (d < minDist) {
        minDist = d
        closestEnemy = candidates[i]
      }
    }

    const distToEnemy = minDist
    const angleToEnemy = Math.atan2(closestEnemy.pos.x - bot.pos.x, closestEnemy.pos.z - bot.pos.z)
    bot.yaw = angleToEnemy

    // Line of Sight Check
    let hasLineOfSight = true
    if (this.meshColliders && this.meshColliders.length > 0) {
      const botEye = new THREE.Vector3(bot.pos.x, (bot.pos.y || 1.7) + 0.3, bot.pos.z)
      const enemyEye = new THREE.Vector3(closestEnemy.pos.x, (closestEnemy.pos.y || 1.7) + 0.3, closestEnemy.pos.z)
      const dir = new THREE.Vector3().subVectors(enemyEye, botEye).normalize()
      this.raycaster.set(botEye, dir)
      const hits = this.raycaster.intersectObjects(this.meshColliders, false)
      if (hits.length > 0 && hits[0].distance < distToEnemy - 0.4) {
        hasLineOfSight = false
      }
    }

    // Combat & Engagement
    if (hasLineOfSight && distToEnemy < 28.0 && phase === 'ROUND_ACTIVE') {
      bot.shootCooldown = (bot.shootCooldown || 0) - dt
      if (bot.shootCooldown <= 0) {
        bot.shootCooldown = 0.32 + Math.random() * 0.22
        soundManager.play('vandal')
        if (onBotShoot) onBotShoot(bot, closestEnemy)
      }

      // Tactical combat strafing when in combat (respecting solid walls)
      bot.strafeTimer = (bot.strafeTimer || 0) + dt
      const strafeDir = Math.sin(bot.strafeTimer * 3.0)
      const perpAngle = angleToEnemy + Math.PI / 2
      const targetX = bot.pos.x + Math.sin(perpAngle) * strafeDir * 1.8 * dt
      const targetZ = bot.pos.z + Math.cos(perpAngle) * strafeDir * 1.8 * dt
      const resolved = this.resolveMovement(bot.pos.x, bot.pos.z, targetX, targetZ)
      bot.pos.x = resolved.x
      bot.pos.z = resolved.z
      return
    }

    // Pursuit / Navigation towards closest enemy (respecting solid walls)
    if (distToEnemy > 4.0) {
      const speed = 3.6
      const targetX = bot.pos.x + Math.sin(angleToEnemy) * speed * dt
      const targetZ = bot.pos.z + Math.cos(angleToEnemy) * speed * dt
      const resolved = this.resolveMovement(bot.pos.x, bot.pos.z, targetX, targetZ)
      bot.pos.x = resolved.x
      bot.pos.z = resolved.z
    }
  }
}
