// src/games/Valorant3D2/systems/AbilitySystem3D.js
import * as THREE from 'three'
import { soundManager } from './SoundSystem.js'
import { DamageSystem } from './DamageSystem.js'

export class AbilitySystem3D {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    this.smokes = []
    this.fires = []
    this.walls = []
    this.reconArrows = []
    this.sonarPulses = []
    this.beams = []
    this.soulOrbs = []
    this.turrets = []
  }

  cast(player, key, targets = [], onAnnouncement) {
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation)
    const pos = new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z)
    const agent = player.agentId || 'gladiator'

    if (agent === 'gladiator' || agent === 'jett' || agent === '1v1' || !['phoenix', 'sova', 'reyna', 'sage', 'chamber'].includes(agent)) {
      if (key === 'E') {
        // Tailwind Dash
        soundManager.play('dash')
        const dashDir = new THREE.Vector3(forward.x, 0, forward.z).normalize()
        player.pos.x += dashDir.x * 12.0
        player.pos.z += dashDir.z * 12.0
        if (onAnnouncement) onAnnouncement('⚡ ¡DASH TÁCTICO!')
      } else if (key === 'Q') {
        // Updraft
        soundManager.play('dash')
        player.vel.y = 11.5
        player.onGround = false
        if (onAnnouncement) onAnnouncement('💨 ¡SUPER SALTO VERTICAL!')
      } else if (key === 'C') {
        // Cloudburst Smoke
        this.spawnSmoke(pos.clone().addScaledVector(forward, 8), 4.2, 0x64748b, 5.0)
        if (onAnnouncement) onAnnouncement('☁️ ¡GRANADA DE HUMO!')
      } else if (key === 'X') {
        // Blade Storm / Tactical Surge
        soundManager.play('ult_activate')
        if (onAnnouncement) onAnnouncement('🌪️ ¡SOBRETENSIÓN DEFINITIVA!')
      }
    } else if (player.agentId === 'phoenix') {
      if (key === 'E') {
        // Hot Hands Molotov
        soundManager.play('flash')
        const targetPos = pos.clone().addScaledVector(forward, 10)
        targetPos.y = 0.2
        this.spawnFire(targetPos, 4.0, 5.0)
      } else if (key === 'Q') {
        // Curveball Flash
        soundManager.play('flash')
        targets.forEach(t => {
          if (t.id !== player.id && t.alive) t.blindAlpha = 1.0
        })
        if (onAnnouncement) onAnnouncement('✨ PHOENIX: ¡CURVEBALL FLASH!')
      } else if (key === 'C') {
        // Blaze Wall
        this.spawnWall(pos.clone().addScaledVector(forward, 4), forward, 0xf97316, 6.0)
      } else if (key === 'X') {
        soundManager.play('ult_activate')
        if (onAnnouncement) onAnnouncement('🔥 PHOENIX: ¡CENIZAS (SEGUNDA VIDA)!')
      }
    } else if (player.agentId === 'sova') {
      if (key === 'E') {
        // Recon Bolt
        soundManager.play('recon')
        const arrowLanding = pos.clone().addScaledVector(forward, 16)
        this.spawnReconPulse(arrowLanding, targets, player.team)
        if (onAnnouncement) onAnnouncement('🎯 SOVA: ¡SONAR DE RECONOCIMIENTO!')
      } else if (key === 'X') {
        // Hunter's Fury 3D Beam
        soundManager.play('ult_activate')
        this.spawnBeam(pos, forward, targets, player.id)
        if (onAnnouncement) onAnnouncement('🏹 SOVA: ¡FURIA DEL CAZADOR!')
      }
    } else if (player.agentId === 'sage') {
      if (key === 'C') {
        // Barrier Wall (Jade crystal pillars)
        soundManager.play('buy')
        this.spawnWall(pos.clone().addScaledVector(forward, 4), forward, 0x10b981, 25.0)
      } else if (key === 'E') {
        // Heal
        player.health = Math.min(player.maxHealth, player.health + 40)
        soundManager.play('buy')
      }
    } else if (player.agentId === 'brimstone') {
      if (key === 'E') {
        // Sky Smoke
        this.spawnSmoke(pos.clone().addScaledVector(forward, 12), 5.5, 0x334155, 18.0)
      } else if (key === 'X') {
        // Orbital Strike
        soundManager.play('ult_activate')
        this.spawnOrbitalLaser(pos.clone().addScaledVector(forward, 10), targets, player.id)
      }
    }
  }

  spawnSmoke(pos, radius, color = 0x64748b, duration = 15.0) {
    soundManager.play('flash')
    const geo = new THREE.SphereGeometry(radius, 24, 24)
    const mat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.88, roughness: 0.9 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(pos.x, radius * 0.7, pos.z)
    this.scene.add(mesh)
    this.smokes.push({ mesh, life: duration })
  }

  spawnFire(pos, radius, duration = 5.0) {
    const geo = new THREE.CylinderGeometry(radius, radius, 0.4, 24)
    const mat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.6 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(pos.x, 0.2, pos.z)
    this.scene.add(mesh)
    this.fires.push({ mesh, pos, radius, life: duration })
  }

  spawnWall(pos, dir, color = 0x10b981, duration = 20.0) {
    const wallGroup = new THREE.Group()
    for (let i = -1.5; i <= 1.5; i++) {
      const geo = new THREE.BoxGeometry(1.6, 3.5, 1.6)
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 })
      const mesh = new THREE.Mesh(geo, mat)
      const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize()
      mesh.position.copy(pos).addScaledVector(right, i * 1.7)
      mesh.position.y = 1.75
      mesh.castShadow = true
      mesh.receiveShadow = true
      wallGroup.add(mesh)
    }
    this.scene.add(wallGroup)
    this.walls.push({ group: wallGroup, life: duration })
  }

  spawnReconPulse(pos, targets, team) {
    const geo = new THREE.RingGeometry(0.5, 0.7, 32)
    const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 1.0 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(pos.x, 0.3, pos.z)
    this.scene.add(mesh)
    this.sonarPulses.push({ mesh, radius: 0.5, maxRadius: 24.0, life: 3.0 })

    targets.forEach(t => {
      if (t.alive && t.team !== team) {
        const d = Math.hypot(t.pos.x - pos.x, t.pos.z - pos.z)
        if (d < 24.0) {
          t.revealed = true
          setTimeout(() => { t.revealed = false }, 3000)
        }
      }
    })
  }

  spawnBeam(origin, dir, targets, ownerId) {
    const geo = new THREE.CylinderGeometry(1.5, 1.5, 60, 24)
    const mat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.7 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(origin).addScaledVector(dir, 30)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    this.scene.add(mesh)
    this.beams.push({ mesh, life: 0.5 })

    // Damage all targets in beam line
    targets.forEach(t => {
      if (t.alive && t.id !== ownerId) {
        DamageSystem.applyDamage(t, 80, false, false, 'beam')
      }
    })
  }

  spawnOrbitalLaser(pos, targets, ownerId) {
    const geo = new THREE.CylinderGeometry(4.0, 4.0, 80, 24)
    const mat = new THREE.MeshBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.75 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(pos.x, 40, pos.z)
    this.scene.add(mesh)
    this.beams.push({ mesh, life: 3.0 })

    targets.forEach(t => {
      if (t.alive && t.id !== ownerId) {
        const d = Math.hypot(t.pos.x - pos.x, t.pos.z - pos.z)
        if (d < 4.5) DamageSystem.applyDamage(t, 120, false, false, 'orbital')
      }
    })
  }

  update(dt, player) {
    // Update Smokes
    for (let i = this.smokes.length - 1; i >= 0; i--) {
      const s = this.smokes[i]
      s.life -= dt
      if (s.life <= 0) {
        this.scene.remove(s.mesh)
        s.mesh.geometry.dispose()
        this.smokes.splice(i, 1)
      }
    }

    // Update Fire Zones (Damage / Self-heal)
    for (let i = this.fires.length - 1; i >= 0; i--) {
      const f = this.fires[i]
      f.life -= dt
      const d = Math.hypot(player.pos.x - f.pos.x, player.pos.z - f.pos.z)
      if (d < f.radius) {
        if (player.agentId === 'phoenix') {
          player.health = Math.min(player.maxHealth, player.health + 15 * dt)
        } else {
          DamageSystem.applyDamage(player, 40 * dt, false, false, 'fire')
        }
      }
      if (f.life <= 0) {
        this.scene.remove(f.mesh)
        f.mesh.geometry.dispose()
        this.fires.splice(i, 1)
      }
    }

    // Update Walls
    for (let i = this.walls.length - 1; i >= 0; i--) {
      const w = this.walls[i]
      w.life -= dt
      if (w.life <= 0) {
        this.scene.remove(w.group)
        this.walls.splice(i, 1)
      }
    }

    // Update Sonar Pulses
    for (let i = this.sonarPulses.length - 1; i >= 0; i--) {
      const p = this.sonarPulses[i]
      p.life -= dt
      p.radius += 10.0 * dt
      p.mesh.scale.set(p.radius, p.radius, p.radius)
      p.mesh.material.opacity = p.life / 3.0
      if (p.life <= 0) {
        this.scene.remove(p.mesh)
        p.mesh.geometry.dispose()
        this.sonarPulses.splice(i, 1)
      }
    }

    // Update Beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i]
      b.life -= dt
      if (b.life <= 0) {
        this.scene.remove(b.mesh)
        b.mesh.geometry.dispose()
        this.beams.splice(i, 1)
      }
    }
  }

  castRemote(caster, key, pos, dir, targets = []) {
    const origin = new THREE.Vector3(pos.x, pos.y, pos.z)
    const forward = new THREE.Vector3(dir.x, dir.y, dir.z).normalize()
    const agent = caster.agentId || 'gladiator'

    if (agent === 'gladiator' || agent === 'jett' || agent === '1v1' || !['phoenix', 'sova', 'reyna', 'sage', 'chamber', 'brimstone'].includes(agent)) {
      if (key === 'C') {
        this.spawnSmoke(origin.clone().addScaledVector(forward, 8), 4.2, 0x64748b, 5.0)
      } else if (key === 'E' || key === 'Q') {
        soundManager.play('dash')
      } else if (key === 'X') {
        soundManager.play('ult_activate')
      }
    } else if (agent === 'phoenix') {
      if (key === 'E') {
        soundManager.play('flash')
        const targetPos = origin.clone().addScaledVector(forward, 10)
        targetPos.y = 0.2
        this.spawnFire(targetPos, 4.0, 5.0)
      } else if (key === 'Q') {
        soundManager.play('flash')
      } else if (key === 'C') {
        this.spawnWall(origin.clone().addScaledVector(forward, 4), forward, 0xf97316, 6.0)
      } else if (key === 'X') {
        soundManager.play('ult_activate')
      }
    } else if (agent === 'sova') {
      if (key === 'E') {
        soundManager.play('recon')
        const arrowLanding = origin.clone().addScaledVector(forward, 16)
        this.spawnReconPulse(arrowLanding, targets, caster.team)
      } else if (key === 'X') {
        soundManager.play('ult_activate')
        this.spawnBeam(origin, forward, targets, caster.id)
      }
    } else if (agent === 'sage') {
      if (key === 'C') {
        soundManager.play('buy')
        this.spawnWall(origin.clone().addScaledVector(forward, 4), forward, 0x10b981, 25.0)
      }
    } else if (agent === 'brimstone') {
      if (key === 'E' || key === 'C') {
        this.spawnSmoke(origin.clone().addScaledVector(forward, 12), 5.5, 0x334155, 18.0)
      } else if (key === 'X') {
        soundManager.play('ult_activate')
        this.spawnOrbitalLaser(origin.clone().addScaledVector(forward, 10), targets, caster.id)
      }
    }
  }
}
