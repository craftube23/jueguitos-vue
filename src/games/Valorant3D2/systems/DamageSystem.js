// src/games/Valorant3D2/systems/DamageSystem.js

export const PLAYER_STATES = {
  NORMAL: 'NORMAL',
  SLOWED: 'SLOWED',
  STUNNED: 'STUNNED',
  BLINDED: 'BLINDED',
  DEAFENED: 'DEAFENED',
  REVEALED: 'REVEALED',
  VULNERABLE: 'VULNERABLE',
  SUPPRESSED: 'SUPPRESSED',
  ROOTED: 'ROOTED',
  DISARMED: 'DISARMED',
  INVISIBLE: 'INVISIBLE',
  INVULNERABLE: 'INVULNERABLE',
  INTANGIBLE: 'INTANGIBLE',
  TELEPORTING: 'TELEPORTING',
  CHANNELING: 'CHANNELING',
  DEAD: 'DEAD',
  REVIVED: 'REVIVED'
}

export class DamageSystem {
  // Apply damage respecting armor absorption, vulnerability, and invulnerability
  static applyDamage(target, rawDamage, isHeadshot = false, isLegshot = false, damageType = 'bullet') {
    if (!target.alive) return { damageDealt: 0, killed: false, headshot: false }
    if (target.isInvulnerable || target.isIntangible) {
      return { damageDealt: 0, killed: false, headshot: false, blocked: true }
    }

    let finalDamage = rawDamage

    // Vulnerable multiplier (e.g. Alarmbot debuff)
    if (target.isVulnerable) {
      finalDamage *= 2.0
    }

    // Armor absorption (66% damage absorbed by shield first)
    let damageToShield = 0
    let damageToHp = 0

    if (target.armor > 0) {
      const shieldAbsorb = finalDamage * 0.66
      if (target.armor >= shieldAbsorb) {
        damageToShield = shieldAbsorb
        damageToHp = finalDamage - shieldAbsorb
        target.armor -= damageToShield
      } else {
        const remainingAfterShield = finalDamage - target.armor
        damageToShield = target.armor
        target.armor = 0
        damageToHp = remainingAfterShield
      }
    } else {
      damageToHp = finalDamage
    }

    target.health = Math.max(0, target.health - damageToHp)

    const killed = target.health <= 0
    if (killed) {
      target.alive = false
      target.health = 0
      target.state = PLAYER_STATES.DEAD
    }

    return {
      damageDealt: damageToShield + damageToHp,
      shieldAbsorbed: damageToShield,
      hpLost: damageToHp,
      remainingHp: target.health,
      remainingArmor: target.armor,
      killed,
      headshot: isHeadshot
    }
  }

  // Calculate hit location based on impact offset
  static calculateHitZone(playerX, playerY, hitX, hitY, lookAngle) {
    const dist = Math.hypot(hitX - playerX, hitY - playerY)
    // Headshot if hit on upper portion relative to look angle
    const angleToHit = Math.atan2(hitY - playerY, hitX - playerX)
    const angleDiff = Math.abs(Math.atan2(Math.sin(angleToHit - lookAngle), Math.cos(angleToHit - lookAngle)))

    if (dist < 10 && angleDiff < 0.8) {
      return 'head'
    } else if (dist > 18) {
      return 'leg'
    }
    return 'body'
  }
}
