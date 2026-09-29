// src/games/Valorant3D2/systems/ObjectiveSystem.js

export const SPIKE_STATES = {
  DROPPED: 'DROPPED',
  CARRIED: 'CARRIED',
  PLANTING: 'PLANTING',
  PLANTED: 'PLANTED',
  DEFUSING: 'DEFUSING',
  DEFUSED: 'DEFUSED',
  EXPLODED: 'EXPLODED'
}

export class ObjectiveSystem {
  constructor(sites) {
    this.sites = sites
    this.reset()
  }

  reset() {
    this.state = SPIKE_STATES.DROPPED
    this.x = 220
    this.y = 750
    this.carrierId = null
    this.planterId = null
    this.defuserId = null
    this.site = null // 'A' or 'B'
    this.plantProgress = 0
    this.plantDuration = 4.0
    this.defuseProgress = 0
    this.defuseDuration = 7.0
    this.hasHalfDefuse = false
    this.fuseTimer = 45.0
    this.maxFuseTimer = 45.0
    this.beepTimer = 0
    this.beepInterval = 1.0
    this.explosionRadius = 0
    this.maxExplosionRadius = 900
    this.exploded = false
  }

  drop(x, y) {
    this.state = SPIKE_STATES.DROPPED
    this.carrierId = null
    this.x = x
    this.y = y
  }

  pickup(playerId) {
    this.state = SPIKE_STATES.CARRIED
    this.carrierId = playerId
  }

  startPlanting(playerId, siteKey) {
    this.state = SPIKE_STATES.PLANTING
    this.planterId = playerId
    this.site = siteKey
    this.plantProgress = 0
  }

  cancelPlanting() {
    if (this.state === SPIKE_STATES.PLANTING) {
      this.state = SPIKE_STATES.CARRIED
      this.plantProgress = 0
      this.planterId = null
    }
  }

  startDefusing(playerId) {
    this.state = SPIKE_STATES.DEFUSING
    this.defuserId = playerId
  }

  cancelDefusing() {
    if (this.state === SPIKE_STATES.DEFUSING) {
      this.state = SPIKE_STATES.PLANTED
      this.defuserId = null
      // Retain half defuse checkpoint if reached 3.5s
      if (this.defuseProgress < 3.5) {
        this.defuseProgress = 0
      } else {
        this.defuseProgress = 3.5
        this.hasHalfDefuse = true
      }
    }
  }

  update(dt, onBeep, onExplode, onDefused, onPlanted) {
    // Planting update
    if (this.state === SPIKE_STATES.PLANTING) {
      this.plantProgress += dt
      if (this.plantProgress >= this.plantDuration) {
        this.state = SPIKE_STATES.PLANTED
        this.carrierId = null
        this.planterId = null
        this.plantProgress = 0
        if (onPlanted) onPlanted(this.site, this.x, this.y)
      }
    }

    // Defusing update
    if (this.state === SPIKE_STATES.DEFUSING) {
      this.defuseProgress += dt
      if (this.defuseProgress >= 3.5) {
        this.hasHalfDefuse = true
      }
      if (this.defuseProgress >= this.defuseDuration) {
        this.state = SPIKE_STATES.DEFUSED
        if (onDefused) onDefused(this.defuserId)
      }
    }

    // Fuse countdown when planted or defusing
    if (this.state === SPIKE_STATES.PLANTED || this.state === SPIKE_STATES.DEFUSING) {
      this.fuseTimer -= dt

      // Progressive beep interval (speeds up as timer lowers)
      this.beepInterval = Math.max(0.12, (this.fuseTimer / this.maxFuseTimer) * 1.0)
      this.beepTimer += dt
      if (this.beepTimer >= this.beepInterval) {
        this.beepTimer = 0
        if (onBeep) onBeep(this.fuseTimer)
      }

      if (this.fuseTimer <= 0 && this.state !== SPIKE_STATES.DEFUSED) {
        this.state = SPIKE_STATES.EXPLODED
        this.exploded = true
        if (onExplode) onExplode(this.x, this.y)
      }
    }

    // Expanding explosion wave
    if (this.state === SPIKE_STATES.EXPLODED && this.explosionRadius < this.maxExplosionRadius) {
      this.explosionRadius += 1200 * dt
    }
  }

  isPlayerInSiteZone(x, y) {
    for (const [key, site] of Object.entries(this.sites)) {
      if (x >= site.x - site.width / 2 && x <= site.x + site.width / 2 &&
          y >= site.y - site.height / 2 && y <= site.y + site.height / 2) {
        return key
      }
    }
    return null
  }
}
