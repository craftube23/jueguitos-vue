// src/games/Valorant3D2/systems/VisionSystem.js

export class VisionSystem {
  constructor(collisionSystem) {
    this.collision = collisionSystem
    this.viewDistance = 1100
    this.rayCount = 90 // Rays for polygon field-of-view calculation
  }

  // Calculate field of view visibility polygon for a player
  computeVisibilityPolygon(originX, originY, baseAngle, fov = Math.PI * 2, smokes = []) {
    const polygon = []
    const startAngle = baseAngle - fov / 2
    const endAngle = baseAngle + fov / 2
    const step = fov / this.rayCount

    for (let i = 0; i <= this.rayCount; i++) {
      const angle = startAngle + i * step
      const targetX = originX + Math.cos(angle) * this.viewDistance
      const targetY = originY + Math.sin(angle) * this.viewDistance

      // Check wall occlusion
      let hit = this.collision.raycast(originX, originY, targetX, targetY)
      let endX = hit ? hit.x : targetX
      let endY = hit ? hit.y : targetY

      // Check smoke occlusion
      for (const smoke of smokes) {
        if (!smoke.active) continue
        const distToSmoke = Math.hypot(smoke.x - originX, smoke.y - originY)
        // If observer is not inside the smoke, smoke acts as a solid vision blocker
        if (distToSmoke > smoke.radius) {
          const smokeHit = this.rayIntersectsCircle(originX, originY, endX, endY, smoke.x, smoke.y, smoke.radius)
          if (smokeHit) {
            endX = smokeHit.x
            endY = smokeHit.y
          }
        }
      }

      polygon.push({ x: endX, y: endY, angle })
    }

    return polygon
  }

  // Check if player A has clear direct Line of Sight to player B
  hasLineOfSight(x1, y1, x2, y2, smokes = []) {
    const dist = Math.hypot(x2 - x1, y2 - y1)
    if (dist > this.viewDistance) return false

    // Check walls
    const hit = this.collision.raycast(x1, y1, x2, y2)
    if (hit && hit.distance < dist - 15) {
      return false
    }

    // Check smokes blocking line of sight
    for (const smoke of smokes) {
      if (!smoke.active) continue
      const dist1 = Math.hypot(smoke.x - x1, smoke.y - y1)
      const dist2 = Math.hypot(smoke.x - x2, smoke.y - y2)
      // If either player is outside and the line passes through the smoke sphere
      if (dist1 > smoke.radius || dist2 > smoke.radius) {
        if (this.rayIntersectsCircle(x1, y1, x2, y2, smoke.x, smoke.y, smoke.radius)) {
          return false
        }
      }
    }

    return true
  }

  // Intersects ray segment with circle
  rayIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1
    const dy = y2 - y1
    const fx = x1 - cx
    const fy = y1 - cy

    const a = dx * dx + dy * dy
    const b = 2 * (fx * dx + fy * dy)
    const c = fx * fx + fy * fy - r * r

    let discriminant = b * b - 4 * a * c
    if (discriminant < 0) return null

    discriminant = Math.sqrt(discriminant)
    const t1 = (-b - discriminant) / (2 * a)

    if (t1 >= 0 && t1 <= 1) {
      return { x: x1 + t1 * dx, y: y1 + t1 * dy }
    }
    return null
  }
}
