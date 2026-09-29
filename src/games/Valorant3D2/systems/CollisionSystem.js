// src/games/Valorant3D2/systems/CollisionSystem.js

export class CollisionSystem {
  constructor(walls = []) {
    this.walls = walls
    this.barriers = []
  }

  setWalls(walls) {
    this.walls = walls
  }

  setBarriers(barriers) {
    this.barriers = barriers
  }

  // Check and resolve circle vs AABB boxes collision with sliding response
  resolveMovement(x, y, radius, dx, dy, isBuyPhase = false, playerTeam = 'attackers') {
    let nextX = x + dx
    let nextY = y + dy

    const allObstacles = [...this.walls]
    if (isBuyPhase) {
      // Add buy phase barriers for the player's team
      this.barriers.forEach(b => {
        if (b.team === playerTeam) {
          allObstacles.push({
            x: Math.min(b.x1, b.x2) - 10,
            y: Math.min(b.y1, b.y2),
            w: Math.abs(b.x2 - b.x1) + 20,
            h: Math.abs(b.y2 - b.y1)
          })
        }
      })
    }

    // Try moving X first
    let testX = nextX
    let collideX = false
    for (const wall of allObstacles) {
      if (this.circleIntersectsRect(testX, y, radius, wall)) {
        collideX = true
        break
      }
    }
    if (collideX) {
      nextX = x // Keep old X (slide along Y)
    }

    // Try moving Y
    let testY = nextY
    let collideY = false
    for (const wall of allObstacles) {
      if (this.circleIntersectsRect(nextX, testY, radius, wall)) {
        collideY = true
        break
      }
    }
    if (collideY) {
      nextY = y // Keep old Y (slide along X)
    }

    return { x: nextX, y: nextY }
  }

  circleIntersectsRect(cx, cy, r, rect) {
    // Find closest point on rect to circle center
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w))
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h))

    const distX = cx - closestX
    const distY = cy - closestY
    const distSq = distX * distX + distY * distY

    return distSq < (r * r)
  }

  // Cast a ray from (x1, y1) to (x2, y2) and find the first wall collision
  raycast(x1, y1, x2, y2, ignoreCrates = false) {
    let closestHit = null
    let minDistance = Infinity

    const dx = x2 - x1
    const dy = y2 - y1
    const totalDist = Math.hypot(dx, dy)
    if (totalDist === 0) return null

    for (const wall of this.walls) {
      if (ignoreCrates && wall.type === 'crate') continue

      // Test intersection with 4 sides of the wall rectangle
      const lines = [
        { p1: { x: wall.x, y: wall.y }, p2: { x: wall.x + wall.w, y: wall.y }, normal: { x: 0, y: -1 } }, // Top
        { p1: { x: wall.x, y: wall.y + wall.h }, p2: { x: wall.x + wall.w, y: wall.y + wall.h }, normal: { x: 0, y: 1 } }, // Bottom
        { p1: { x: wall.x, y: wall.y }, p2: { x: wall.x, y: wall.y + wall.h }, normal: { x: -1, y: 0 } }, // Left
        { p1: { x: wall.x + wall.w, y: wall.y }, p2: { x: wall.x + wall.w, y: wall.y + wall.h }, normal: { x: 1, y: 0 } } // Right
      ]

      for (const line of lines) {
        const hit = this.lineIntersection(x1, y1, x2, y2, line.p1.x, line.p1.y, line.p2.x, line.p2.y)
        if (hit) {
          const dist = Math.hypot(hit.x - x1, hit.y - y1)
          if (dist < minDistance) {
            minDistance = dist
            closestHit = {
              x: hit.x,
              y: hit.y,
              distance: dist,
              normal: line.normal,
              wall
            }
          }
        }
      }
    }

    return closestHit
  }

  // Line segment intersection helper
  lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
    if (denom === 0) return null

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: x1 + ua * (x2 - x1),
        y: y1 + ua * (y2 - y1)
      }
    }
    return null
  }

  // Check if position is inside a bounding box
  isInsideBox(x, y, box) {
    return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height
  }
}
