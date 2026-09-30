// src/games/Valorant3D2/systems/BotAISystem.js

export class BotAISystem {
  constructor(collisionSystem, visionSystem) {
    this.collision = collisionSystem
    this.vision = visionSystem
  }

  updateBot(bot, dt, gameState, onShoot, onUseAbility) {
    if (!bot.alive) return

    // Decrement reaction timers
    if (bot.reactionTimer > 0) bot.reactionTimer -= dt
    if (bot.shootCooldown > 0) bot.shootCooldown -= dt
    if (bot.abilityCooldown > 0) bot.abilityCooldown -= dt

    // Buy Phase logic
    if (gameState.phase === 'BUY_PHASE') {
      this.handleBotBuy(bot)
      return
    }

    // Training Dummy Logic (if flagged as dummy)
    if (bot.isDummy) {
      if (bot.dummyStrafing) {
        bot.dummyTimer = (bot.dummyTimer || 0) + dt
        bot.x += Math.sin(bot.dummyTimer * 2) * 80 * dt
      }
      return
    }

    // Find visible enemies
    const enemies = gameState.players.filter(p => p.alive && p.team !== bot.team)
    let visibleEnemy = null
    let minDist = Infinity

    for (const enemy of enemies) {
      if (this.vision.hasLineOfSight(bot.x, bot.y, enemy.x, enemy.y, gameState.smokes)) {
        const dist = Math.hypot(enemy.x - bot.x, enemy.y - bot.y)
        if (dist < minDist) {
          minDist = dist
          visibleEnemy = enemy
        }
      }
    }

    // Combat behavior if enemy visible
    if (visibleEnemy) {
      const targetAngle = Math.atan2(visibleEnemy.y - bot.y, visibleEnemy.x - bot.x)
      // Smooth aim interpolation towards target
      bot.lookAngle = this.lerpAngle(bot.lookAngle, targetAngle, 8.0 * dt)

      // Strafe and shoot
      if (bot.shootCooldown <= 0 && Math.abs(this.angleDiff(bot.lookAngle, targetAngle)) < 0.25) {
        bot.shootCooldown = 0.18 + Math.random() * 0.15
        if (onShoot) {
          onShoot(bot, visibleEnemy)
        }
      }

      // Tactical ability usage
      if (bot.abilityCooldown <= 0) {
        if (bot.agentId === 'jett' && bot.health < 60) {
          // Dash escape
          bot.abilityCooldown = 8.0
          if (onUseAbility) onUseAbility(bot, 'E', bot.lookAngle + Math.PI)
        } else if (bot.agentId === 'phoenix' && minDist < 350) {
          // Flash or Molotov
          bot.abilityCooldown = 10.0
          if (onUseAbility) onUseAbility(bot, 'Q', targetAngle)
        }
      }

      // Strafe slightly while in combat
      bot.strafeTimer = (bot.strafeTimer || 0) + dt
      const strafeDir = Math.sin(bot.strafeTimer * 3)
      const moveAngle = bot.lookAngle + (Math.PI / 2) * strafeDir
      const speed = 70
      const res = this.collision.resolveMovement(
        bot.x, bot.y, bot.radius,
        Math.cos(moveAngle) * speed * dt,
        Math.sin(moveAngle) * speed * dt,
        false, bot.team
      )
      bot.x = res.x
      bot.y = res.y
      return
    }

    // Objective Navigation behavior (No enemy in sight)
    this.handleObjectiveNavigation(bot, dt, gameState, onUseAbility)
  }

  handleObjectiveNavigation(bot, dt, gameState, onUseAbility) {
    let targetX = 0
    let targetY = 0

    if (bot.team === 'attackers') {
      if (gameState.spike.state === 'CARRIED' && gameState.spike.carrierId === bot.id) {
        // Carry Spike to Site A or Site B
        const site = gameState.targetSite || 'A'
        const targetSite = gameState.sites[site]
        targetX = targetSite.x
        targetY = targetSite.y

        // Check if inside site to plant
        const inSite = gameState.objectiveSystem.isPlayerInSiteZone(bot.x, bot.y)
        if (inSite && gameState.spike.state === 'CARRIED') {
          gameState.objectiveSystem.startPlanting(bot.id, inSite)
          return
        }
      } else if (gameState.spike.state === 'PLANTED') {
        // Defend planted Spike
        targetX = gameState.spike.x + Math.sin(bot.id.charCodeAt(0)) * 120
        targetY = gameState.spike.y + Math.cos(bot.id.charCodeAt(0)) * 120
      } else {
        // Push towards Site
        const targetSite = gameState.sites.A
        targetX = targetSite.x - 200
        targetY = targetSite.y
      }
    } else {
      // Defenders
      if (gameState.spike.state === 'PLANTED') {
        // Retake site & Defuse
        targetX = gameState.spike.x
        targetY = gameState.spike.y
        const distToSpike = Math.hypot(targetX - bot.x, targetY - bot.y)
        if (distToSpike < 45 && gameState.spike.state === 'PLANTED') {
          gameState.objectiveSystem.startDefusing(bot.id)
          return
        }
      } else {
        // Hold Sites A or B
        const assignedSite = bot.assignedSite || (bot.id.charCodeAt(0) % 2 === 0 ? 'A' : 'B')
        const site = gameState.sites[assignedSite]
        targetX = site.x + Math.sin(bot.id.charCodeAt(0)) * 80
        targetY = site.y + Math.cos(bot.id.charCodeAt(0)) * 80
      }
    }

    // Move towards target
    const distToTarget = Math.hypot(targetX - bot.x, targetY - bot.y)
    if (distToTarget > 30) {
      const angle = Math.atan2(targetY - bot.y, targetX - bot.x)
      bot.lookAngle = this.lerpAngle(bot.lookAngle, angle, 4.0 * dt)
      const speed = bot.isSlowed ? 80 : 160
      const res = this.collision.resolveMovement(
        bot.x, bot.y, bot.radius,
        Math.cos(angle) * speed * dt,
        Math.sin(angle) * speed * dt,
        false, bot.team
      )
      bot.x = res.x
      bot.y = res.y
    }
  }

  handleBotBuy(bot) {
    if (bot.hasBought) return
    bot.hasBought = true
    if (bot.credits >= 2900) {
      bot.weapon = 'ak74u'
      bot.armor = 50
    } else if (bot.credits >= 1850) {
      bot.weapon = 'benelli_m4'
      bot.armor = 25
    } else if (bot.credits >= 1600) {
      bot.weapon = 'kriss_vector'
      bot.armor = 25
    } else {
      bot.weapon = 'ak74u'
    }
  }

  lerpAngle(a, b, t) {
    let diff = this.angleDiff(a, b)
    return a + diff * Math.min(1, t)
  }

  angleDiff(a, b) {
    let diff = (b - a) % (Math.PI * 2)
    if (diff < -Math.PI) diff += Math.PI * 2
    if (diff > Math.PI) diff -= Math.PI * 2
    return diff
  }
}
