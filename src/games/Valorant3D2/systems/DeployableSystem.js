// src/games/Valorant3D2/systems/DeployableSystem.js

export class DeployableSystem {
  constructor(collisionSystem) {
    this.collision = collisionSystem
    this.deployables = []
    this.soulOrbs = []
  }

  addSageWall(x, y, angle, ownerId, team) {
    // 4 wall segments
    const segmentLength = 32
    for (let i = -1.5; i <= 1.5; i++) {
      const offsetX = Math.cos(angle + Math.PI / 2) * (i * segmentLength)
      const offsetY = Math.sin(angle + Math.PI / 2) * (i * segmentLength)
      this.deployables.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'sage_wall_segment',
        x: x + offsetX - 16,
        y: y + offsetY - 16,
        w: 32,
        h: 32,
        health: 800,
        maxHealth: 800,
        ownerId,
        team,
        duration: 30.0,
        solid: true
      })
    }
  }

  addTurret(x, y, angle, ownerId, team) {
    this.deployables.push({
      id: Math.random().toString(36).substr(2, 9),
      type: 'kj_turret',
      x,
      y,
      angle,
      health: 125,
      maxHealth: 125,
      ownerId,
      team,
      range: 350,
      fireCooldown: 0,
      burstCount: 0,
      targetId: null,
      solid: false
    })
  }

  addChamberTP(x, y, ownerId, team) {
    this.deployables.push({
      id: Math.random().toString(36).substr(2, 9),
      type: 'chamber_anchor',
      x,
      y,
      radius: 180,
      ownerId,
      team,
      health: 50,
      maxHealth: 50,
      solid: false
    })
  }

  addSoulOrb(x, y, victimName) {
    this.soulOrbs.push({
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      radius: 20,
      duration: 4.0,
      victimName
    })
  }

  update(dt, players = [], onTurretShoot, onWallDestroyed) {
    // Update Soul Orbs
    for (let i = this.soulOrbs.length - 1; i >= 0; i--) {
      const orb = this.soulOrbs[i]
      orb.duration -= dt
      if (orb.duration <= 0) {
        this.soulOrbs.splice(i, 1)
      }
    }

    // Update Deployables
    for (let i = this.deployables.length - 1; i >= 0; i--) {
      const d = this.deployables[i]

      if (d.duration !== undefined) {
        d.duration -= dt
        if (d.duration <= 0 || d.health <= 0) {
          if (d.type === 'sage_wall_segment' && onWallDestroyed) onWallDestroyed(d)
          this.deployables.splice(i, 1)
          continue
        }
      }

      if (d.health <= 0) {
        this.deployables.splice(i, 1)
        continue
      }

      // Turret logic
      if (d.type === 'kj_turret') {
        d.fireCooldown -= dt
        let nearestEnemy = null
        let minDist = d.range

        for (const player of players) {
          if (!player.alive || player.team === d.team) continue
          const dist = Math.hypot(player.x - d.x, player.y - d.y)
          if (dist < minDist) {
            // Check line of sight
            const hit = this.collision.raycast(d.x, d.y, player.x, player.y)
            if (!hit || hit.distance >= dist - 15) {
              minDist = dist
              nearestEnemy = player
            }
          }
        }

        if (nearestEnemy) {
          d.angle = Math.atan2(nearestEnemy.y - d.y, nearestEnemy.x - d.x)
          if (d.fireCooldown <= 0) {
            d.fireCooldown = 0.8
            if (onTurretShoot) onTurretShoot(d, nearestEnemy)
          }
        }
      }
    }
  }

  getSolidWalls() {
    return this.deployables
      .filter(d => d.solid && d.health > 0)
      .map(d => ({ x: d.x, y: d.y, w: d.w, h: d.h, type: 'sage_wall' }))
  }

  clear() {
    this.deployables = []
    this.soulOrbs = []
  }
}
