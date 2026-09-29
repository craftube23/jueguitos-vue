// src/games/Valorant3D2/systems/BotAI3D.js
import * as THREE from 'three'
import { soundManager } from './SoundSystem.js'
import { DamageSystem } from './DamageSystem.js'

export class BotAI3D {
  constructor(scene) {
    this.scene = scene
    this.raycaster = new THREE.Raycaster()
    this.meshColliders = []
  }

  setMeshColliders(meshList) {
    this.meshColliders = meshList || []
  }

  updateBot(bot, dt, player, phase, map3D, onBotShoot) {
    if (!bot.alive) return

    // Buy Phase - stationary in spawn
    if (phase === 'BUY_PHASE') return

    // Dummy bot behavior
    if (bot.isDummy) {
      if (bot.strafing) {
        bot.dummyTimer = (bot.dummyTimer || 0) + dt
        bot.pos.z = bot.initialZ + Math.sin(bot.dummyTimer * 2) * 3.5
      }
      return
    }

    // Distance to local player
    const distToPlayer = Math.hypot(player.pos.x - bot.pos.x, player.pos.z - bot.pos.z)

    if (bot.team !== player.team && player.alive) {
      // Rotate bot towards player
      const angleToPlayer = Math.atan2(player.pos.x - bot.pos.x, player.pos.z - bot.pos.z)
      bot.yaw = angleToPlayer

      // Line of Sight & Combat: Check that no solid wall is blocking bot vision
      if (distToPlayer < 24.0 && phase === 'ROUND_ACTIVE') {
        let hasLineOfSight = true
        if (this.meshColliders && this.meshColliders.length > 0) {
          const botEye = new THREE.Vector3(bot.pos.x, (bot.pos.y || 1.7) + 0.3, bot.pos.z)
          const playerEye = new THREE.Vector3(player.pos.x, (player.pos.y || 1.7) + 0.3, player.pos.z)
          const dir = new THREE.Vector3().subVectors(playerEye, botEye).normalize()
          this.raycaster.set(botEye, dir)
          const hits = this.raycaster.intersectObjects(this.meshColliders, false)
          if (hits.length > 0 && hits[0].distance < distToPlayer - 0.4) {
            hasLineOfSight = false
          }
        }

        if (hasLineOfSight) {
          bot.shootCooldown = (bot.shootCooldown || 0) - dt
          if (bot.shootCooldown <= 0) {
            bot.shootCooldown = 0.35 + Math.random() * 0.2
            soundManager.play('vandal')
            if (onBotShoot) onBotShoot(bot, player)
          }
          return
        }
      }
    }

    // Tactical navigation towards objectives (Site A Top or Site B Bottom)
    if (!bot.targetSiteKey) {
      // Pick Site A or Site B based on bot ID parity
      const isA = parseInt(bot.id.replace(/\D/g, '') || '0') % 2 === 0
      bot.targetSiteKey = isA ? 'siteA' : 'siteB'
      // Spread offset so bots don't clump
      bot.targetOffset = {
        x: ((parseInt(bot.id.replace(/\D/g, '') || '0') % 3) - 1) * 3.5,
        z: ((parseInt(bot.id.replace(/\D/g, '') || '0') % 2) - 0.5) * 2.5
      }
    }

    const baseSite = map3D[bot.targetSiteKey] || map3D.siteA
    const targetX = baseSite.x + (bot.targetOffset ? bot.targetOffset.x : 0)
    const targetZ = baseSite.z + (bot.targetOffset ? bot.targetOffset.y || 0 : 0)

    const dx = targetX - bot.pos.x
    const dz = targetZ - bot.pos.z
    const distToSite = Math.hypot(dx, dz)

    if (distToSite > 1.8) {
      const moveAngle = Math.atan2(dx, dz)
      bot.yaw = moveAngle
      bot.pos.x += Math.sin(moveAngle) * 3.2 * dt
      bot.pos.z += Math.cos(moveAngle) * 3.2 * dt
    }
  }
}
