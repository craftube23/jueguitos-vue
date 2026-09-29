// src/games/Valorant3D2/systems/AreaEffectSystem.js

export class AreaEffectSystem {
  constructor() {
    this.zones = []
  }

  addZone(zone) {
    this.zones.push({
      id: Math.random().toString(36).substr(2, 9),
      x: zone.x,
      y: zone.y,
      radius: zone.radius || 80,
      type: zone.type, // 'smoke', 'fire', 'slow', 'recon_pulse', 'orbital', 'stim', 'lockdown'
      team: zone.team,
      ownerId: zone.ownerId,
      ownerAgent: zone.ownerAgent,
      color: zone.color || 'rgba(100, 116, 139, 0.8)',
      duration: zone.duration || 5.0,
      maxDuration: zone.duration || 5.0,
      damagePerSec: zone.damagePerSec || 0,
      slowFactor: zone.slowFactor || 0.5,
      active: true,
      pulses: zone.pulses || 0,
      lastTick: 0,
      customData: zone.customData || {}
    })
  }

  update(dt, players = [], onDamageCallback, onRevealCallback) {
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i]
      z.duration -= dt

      if (z.duration <= 0) {
        this.zones.splice(i, 1)
        continue
      }

      // Check player interactions
      for (const player of players) {
        if (!player.alive) continue
        const dist = Math.hypot(player.x - z.x, player.y - z.y)

        if (dist <= z.radius + player.radius) {
          // Fire / Damage zone
          if (z.type === 'fire' || z.type === 'orbital') {
            if (z.ownerAgent === 'phoenix' && player.id === z.ownerId) {
              // Phoenix self-heal in fire
              if (player.health < player.maxHealth) {
                player.health = Math.min(player.maxHealth, player.health + 15 * dt)
              }
            } else if (player.team !== z.team || player.id === z.ownerId) {
              // Enemies receive fire damage
              if (onDamageCallback) {
                onDamageCallback(player, z.damagePerSec * dt, z.ownerId, z.type)
              }
            }
          }

          // Slow zone
          if (z.type === 'slow') {
            player.isSlowed = true
            player.slowTimer = 0.2
          }

          // Stim Beacon buff
          if (z.type === 'stim' && player.team === z.team) {
            player.isStimmed = true
            player.stimTimer = 0.3
          }
        }
      }

      // Sova Recon Bolt Pulses
      if (z.type === 'recon_pulse') {
        z.lastTick += dt
        if (z.lastTick >= 1.2 && z.pulses > 0) {
          z.lastTick = 0
          z.pulses--
          if (onRevealCallback) {
            onRevealCallback(z)
          }
        }
      }
    }
  }

  getActiveSmokes() {
    return this.zones.filter(z => z.type === 'smoke' && z.active)
  }

  clear() {
    this.zones = []
  }
}
