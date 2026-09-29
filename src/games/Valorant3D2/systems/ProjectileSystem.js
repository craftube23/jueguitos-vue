// src/games/Valorant3D2/systems/ProjectileSystem.js

export class ProjectileSystem {
  constructor(collisionSystem) {
    this.collision = collisionSystem
    this.projectiles = []
    this.tracers = []
  }

  addTracer(x1, y1, x2, y2, color = '#fbbf24', duration = 0.08) {
    this.tracers.push({
      x1, y1, x2, y2,
      color,
      alpha: 1.0,
      duration,
      life: duration
    })
  }

  addProjectile(proj) {
    this.projectiles.push({
      id: Math.random().toString(36).substr(2, 9),
      x: proj.x,
      y: proj.y,
      vx: proj.vx,
      vy: proj.vy,
      speed: proj.speed || 600,
      radius: proj.radius || 4,
      type: proj.type || 'bullet', // 'bullet', 'recon_arrow', 'shock_arrow', 'molotov', 'dagger', 'flash', 'beam'
      bounces: proj.bounces || 0,
      maxBounces: proj.maxBounces || 0,
      ownerId: proj.ownerId,
      team: proj.team,
      damage: proj.damage || 0,
      color: proj.color || '#f59e0b',
      life: proj.life || 3.0,
      onHit: proj.onHit || null,
      onExpire: proj.onExpire || null,
      penetrateWalls: proj.penetrateWalls || false
    })
  }

  update(dt, onEventCallback) {
    // Update Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i]
      t.life -= dt
      t.alpha = Math.max(0, t.life / t.duration)
      if (t.life <= 0) {
        this.tracers.splice(i, 1)
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]
      p.life -= dt

      if (p.life <= 0) {
        if (p.onExpire) p.onExpire(p)
        this.projectiles.splice(i, 1)
        continue
      }

      const nextX = p.x + p.vx * dt
      const nextY = p.y + p.vy * dt

      if (!p.penetrateWalls) {
        // Test wall collision
        const hit = this.collision.raycast(p.x, p.y, nextX, nextY)
        if (hit) {
          if (p.bounces < p.maxBounces && hit.normal) {
            // Reflect velocity vector
            p.bounces++
            p.x = hit.x + hit.normal.x * 2
            p.y = hit.y + hit.normal.y * 2
            const dot = p.vx * hit.normal.x + p.vy * hit.normal.y
            p.vx = p.vx - 2 * dot * hit.normal.x
            p.vy = p.vy - 2 * dot * hit.normal.y
            if (onEventCallback) onEventCallback('projectile_bounce', { p, hit })
            continue
          } else {
            // Impact with wall
            p.x = hit.x
            p.y = hit.y
            if (p.onHit) p.onHit(p, null, hit)
            this.projectiles.splice(i, 1)
            continue
          }
        }
      }

      p.x = nextX
      p.y = nextY
    }
  }

  clear() {
    this.projectiles = []
    this.tracers = []
  }
}
