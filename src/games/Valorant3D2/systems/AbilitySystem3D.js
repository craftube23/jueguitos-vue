// src/games/Valorant3D2/systems/AbilitySystem3D.js
import * as THREE from 'three'
import { soundManager } from './SoundSystem.js'
import { DamageSystem } from './DamageSystem.js'

export class AbilitySystem3D {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    this.playerController = null
    this.meshColliders = []

    // Active 1v1.LOL 3D Structures & VFX
    this.smokes = []
    this.ramps = []
    this.grappleCables = []
    this.launchPads = []
    this.dashTrails = []
    this.updraftVortices = []
    this.healingAuras = []
  }

  setPlayerController(pc) {
    this.playerController = pc
  }

  setMeshColliders(meshList) {
    this.meshColliders = meshList || []
  }

  // --- LOCAL 1V1.LOL ABILITY CAST ---
  cast(player, key, targets = [], onAnnouncement) {
    if (key === 'C') {
      // ====================================================
      // 1. [C] NUBE DE HUMO TÁCTICA (SMOKE GRENADE) - MANTENIDA
      // ====================================================
      const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation)
      const targetPos = new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z).addScaledVector(forward, 7)
      this.spawnSmoke(targetPos, 4.5, 0x64748b, 7.5)
      soundManager.play('flash')
      if (onAnnouncement) onAnnouncement('☁️ ¡NUBE DE HUMO TÁCTICA DESPLEGADA!')
    } else if (key === 'Q') {
      // ====================================================
      // 2. [Q] CONSTRUIR RAMPA / ESCALERA 1V1 (RAMP BUILD)
      // ====================================================
      this.spawnRamp(player)
      soundManager.play('buy')
      if (onAnnouncement) onAnnouncement('🪜 ¡RAMPA 1v1 CONSTRUIDA (HIGH GROUND)!')
    } else if (key === 'E') {
      // ====================================================
      // 3. [E] GANCHO DE AGARRE / IMPULSO AÉREO (GRAPPLER)
      // ====================================================
      this.castGrappleHook(player)
      if (onAnnouncement) onAnnouncement('⚡ ¡GANCHO DE AGARRE / IMPULSO AÉREO!')
    } else if (key === 'X') {
      // ====================================================
      // 4. [X] LANZADOR / PLATAFORMA DE SALTO + ESCUDO
      // ====================================================
      this.spawnLaunchPad(player)
      if (onAnnouncement) onAnnouncement('🚀 ¡PLATAFORMA DE SALTO + 50 ESCUDO ACTIVADO!')
    }
  }

  // ====================================================
  // 1. [C] SMOKE GRENADE (Nube de humo táctica)
  // ====================================================
  spawnSmoke(pos, radius = 4.5, color = 0x64748b, duration = 8.0) {
    const smokeGroup = new THREE.Group()

    // Outer Translucent Cloud Sphere
    const outerGeo = new THREE.SphereGeometry(radius, 24, 24)
    const outerMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
      depthWrite: false
    })
    const outerMesh = new THREE.Mesh(outerGeo, outerMat)
    outerMesh.position.y = radius * 0.75
    smokeGroup.add(outerMesh)

    // Inner Core Dark Smoke
    const innerGeo = new THREE.SphereGeometry(radius * 0.7, 16, 16)
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.95
    })
    const innerMesh = new THREE.Mesh(innerGeo, innerMat)
    innerMesh.position.y = radius * 0.75
    smokeGroup.add(innerMesh)

    // Swirling Ground Dust Ring
    const ringGeo = new THREE.RingGeometry(radius * 0.2, radius * 1.1, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.rotation.x = -Math.PI / 2
    ringMesh.position.y = 0.08
    smokeGroup.add(ringMesh)

    smokeGroup.position.set(pos.x, 0, pos.z)
    smokeGroup.scale.set(0.1, 0.1, 0.1)
    this.scene.add(smokeGroup)

    this.smokes.push({
      group: smokeGroup,
      ringMesh,
      targetScale: 1.0,
      currentScale: 0.1,
      life: duration,
      maxLife: duration
    })
  }

  // ====================================================
  // 2. [Q] 1V1.LOL RAMP BUILD (Escalera sólida 3D)
  // ====================================================
  spawnRamp(player) {
    const rampGroup = new THREE.Group()
    const numSteps = 8
    const rampWidth = 3.6
    const rampLength = 5.2
    const rampHeight = 3.2
    const stepDepth = (rampLength / numSteps) * 1.05
    const stepHeight = rampHeight / numSteps

    const woodCanvas = document.createElement('canvas')
    woodCanvas.width = 256
    woodCanvas.height = 256
    const ctx = woodCanvas.getContext('2d')
    ctx.fillStyle = '#78350f'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#92400e'
    for (let y = 0; y < 256; y += 32) {
      ctx.fillRect(0, y + 2, 256, 28)
    }
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 4
    ctx.strokeRect(4, 4, 248, 248)
    const woodTex = new THREE.CanvasTexture(woodCanvas)
    woodTex.wrapS = THREE.RepeatWrapping
    woodTex.wrapT = THREE.RepeatWrapping

    const plankMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.65,
      metalness: 0.2
    })
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff })

    const yaw = (this.playerController ? this.playerController.yaw : player.yaw) || 0
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)

    const startY = Math.max(0, (player.pos.y || 1.7) - (this.playerController ? this.playerController.currentEyeHeight : 1.7))
    const startX = player.pos.x + forward.x * 1.2
    const startZ = player.pos.z + forward.z * 1.2

    const colliders = []

    for (let i = 0; i < numSteps; i++) {
      const curH = stepHeight * (i + 1)
      const distAlong = (i + 0.5) * (rampLength / numSteps)
      const sx = startX + forward.x * distAlong
      const sz = startZ + forward.z * distAlong
      const sy = startY + curH / 2

      const stepGeo = new THREE.BoxGeometry(rampWidth, curH, stepDepth)
      const stepMesh = new THREE.Mesh(stepGeo, plankMat)
      stepMesh.position.set(sx, sy, sz)
      stepMesh.rotation.y = yaw
      stepMesh.castShadow = true
      stepMesh.receiveShadow = true
      rampGroup.add(stepMesh)
      colliders.push(stepMesh)

      // Glowing cyan neon edge
      const edgeGeo = new THREE.BoxGeometry(rampWidth * 0.98, 0.03, 0.06)
      const edge = new THREE.Mesh(edgeGeo, edgeMat)
      edge.position.set(sx, startY + curH + 0.01, sz + (stepDepth / 2) * 0.9)
      edge.rotation.y = yaw
      rampGroup.add(edge)
    }

    // Top landing platform (0.9m extension)
    const topX = startX + forward.x * (rampLength + 0.45)
    const topZ = startZ + forward.z * (rampLength + 0.45)
    const topGeo = new THREE.BoxGeometry(rampWidth, 0.25, 0.9)
    const topMesh = new THREE.Mesh(topGeo, plankMat)
    topMesh.position.set(topX, startY + rampHeight - 0.125, topZ)
    topMesh.rotation.y = yaw
    topMesh.castShadow = true
    topMesh.receiveShadow = true
    rampGroup.add(topMesh)
    colliders.push(topMesh)

    this.scene.add(rampGroup)

    // Register colliders with playerController, scene, and meshColliders
    colliders.forEach(c => {
      if (this.meshColliders && !this.meshColliders.includes(c)) this.meshColliders.push(c)
      if (this.playerController) this.playerController.addMeshCollider(c)
    })

    this.ramps.push({
      group: rampGroup,
      colliders,
      plankMat,
      edgeMat,
      life: 12.0,
      maxLife: 12.0
    })

    // Brief holographic pop-in effect
    this.spawnHoloBuildBox(new THREE.Vector3(startX + forward.x * 2.5, startY + 1.5, startZ + forward.z * 2.5), rampWidth, rampHeight, rampLength, yaw)
  }

  spawnHoloBuildBox(pos, w, h, d, yaw) {
    const boxGeo = new THREE.BoxGeometry(w, h, d)
    const boxMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.85 })
    const box = new THREE.Mesh(boxGeo, boxMat)
    box.position.copy(pos)
    box.rotation.y = yaw
    this.scene.add(box)
    setTimeout(() => {
      this.scene.remove(box)
      boxGeo.dispose()
      boxMat.dispose()
    }, 180)
  }

  // ====================================================
  // 3. [E] 1V1.LOL GRAPPLING HOOK (Gancho acrobático)
  // ====================================================
  castGrappleHook(player) {
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation)
    const headPos = this.camera.position.clone()
    const raycaster = new THREE.Raycaster(headPos, forward, 0.2, 45.0)

    let hitPoint = null
    const validTargets = (this.meshColliders || []).filter(m => m && m.isMesh)
    const hits = raycaster.intersectObjects(validTargets, false)

    if (hits.length > 0) {
      hitPoint = hits[0].point
    }

    if (hitPoint) {
      // 1. Render 3D glowing energy tether cable
      const dist = headPos.distanceTo(hitPoint)
      const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, dist, 8)
      cableGeo.rotateX(Math.PI / 2)
      const cableMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.95 })
      const cableMesh = new THREE.Mesh(cableGeo, cableMat)
      const midPoint = new THREE.Vector3().addVectors(headPos, hitPoint).multiplyScalar(0.5)
      cableMesh.position.copy(midPoint)
      cableMesh.lookAt(hitPoint)
      this.scene.add(cableMesh)

      this.grappleCables.push({
        mesh: cableMesh,
        life: 0.35,
        maxLife: 0.35
      })

      // 2. Apply fast momentum pull impulse toward target surface
      const pullDir = new THREE.Vector3().subVectors(hitPoint, headPos).normalize()
      const speed = 23.0
      const impX = pullDir.x * speed
      const impY = Math.max(7.5, pullDir.y * speed + 5.0)
      const impZ = pullDir.z * speed

      if (this.playerController) {
        this.playerController.applyImpulse(impX, impY, impZ)
      } else {
        player.pos.x += pullDir.x * 12.0
        player.pos.z += pullDir.z * 12.0
      }
      soundManager.play('dash')
    } else {
      // Free Air Rocket Impulse Dash
      const speed = 18.0
      if (this.playerController) {
        this.playerController.applyImpulse(forward.x * speed, 8.5, forward.z * speed)
      }
      soundManager.play('dash')
    }

    // Velocity trail streaks
    this.spawnDashTrail(headPos, headPos.clone().addScaledVector(forward, 10), forward)
  }

  // ====================================================
  // 4. [X] 1V1.LOL LAUNCH PAD & SHIELD (Plataforma + Escudo)
  // ====================================================
  spawnLaunchPad(player) {
    const pos = new THREE.Vector3(player.pos.x, 0, player.pos.z)
    const footY = Math.max(0, (player.pos.y || 1.7) - (this.playerController ? this.playerController.currentEyeHeight : 1.7))
    pos.y = footY

    const padGroup = new THREE.Group()

    // Outer Octagonal Steel Rim
    const rimGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.12, 16)
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 })
    const rim = new THREE.Mesh(rimGeo, rimMat)
    rim.position.y = 0.06
    padGroup.add(rim)

    // Inner Glowing Cyan/Gold Kinetic Trampoline Core
    const coreGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.14, 16)
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff })
    const core = new THREE.Mesh(coreGeo, coreMat)
    core.position.y = 0.08
    padGroup.add(core)

    // Energy Arrow Glyph Ring
    const ringGeo = new THREE.RingGeometry(0.4, 0.9, 24)
    ringGeo.rotateX(-Math.PI / 2)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.y = 0.16
    padGroup.add(ring)

    padGroup.position.set(pos.x, pos.y, pos.z)
    this.scene.add(padGroup)

    this.launchPads.push({
      group: padGroup,
      pos: pos.clone(),
      radius: 2.0,
      life: 25.0,
      maxLife: 25.0
    })

    // 1. Immediately launch casting player sky-high
    if (this.playerController) {
      this.playerController.applyImpulse(0, 18.0, 0)
    }

    // 2. Grant +50 Shield Overcharge
    player.armor = Math.min(player.maxArmor || 50, (player.armor || 0) + 50)

    // 3. Spawns visual vertical cyclone & shockwave ring
    this.spawnUpdraftVortex(pos)
    this.spawnHealingAura(player, 0x00f3ff)
    soundManager.play('ult_activate')
  }

  // ====================================================
  // VFX PARTICLES & SENSORY HELPERS
  // ====================================================

  spawnUpdraftVortex(pos) {
    const vortexGroup = new THREE.Group()

    const coneGeo = new THREE.ConeGeometry(2.4, 5.0, 16, 1, true)
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      wireframe: true
    })
    const coneMesh = new THREE.Mesh(coneGeo, coneMat)
    coneMesh.position.y = 2.5
    vortexGroup.add(coneMesh)

    const ringGeo = new THREE.RingGeometry(0.5, 3.2, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.rotation.x = -Math.PI / 2
    ringMesh.position.y = 0.1
    vortexGroup.add(ringMesh)

    vortexGroup.position.set(pos.x, 0, pos.z)
    this.scene.add(vortexGroup)

    this.updraftVortices.push({
      group: vortexGroup,
      coneMesh,
      ringMesh,
      life: 0.7,
      maxLife: 0.7
    })
  }

  spawnDashTrail(startPos, endPos, dir) {
    const trailGroup = new THREE.Group()
    const dist = startPos.distanceTo(endPos)
    const ringCount = 6

    for (let i = 0; i < ringCount; i++) {
      const t = (i + 1) / ringCount
      const ringPos = new THREE.Vector3().lerpVectors(startPos, endPos, t)
      const ringGeo = new THREE.TorusGeometry(0.65 + (1 - t) * 0.4, 0.04, 8, 16)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.85
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(ringPos)
      ring.lookAt(ringPos.clone().add(dir))
      trailGroup.add(ring)
    }

    this.scene.add(trailGroup)
    this.dashTrails.push({
      group: trailGroup,
      life: 0.45,
      maxLife: 0.45
    })
  }

  spawnHealingAura(player, color = 0x10b981) {
    const auraGroup = new THREE.Group()

    const beamGeo = new THREE.CylinderGeometry(0.95, 0.95, 2.2, 16, 1, true)
    const beamMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    })
    const beam = new THREE.Mesh(beamGeo, beamMat)
    beam.position.y = 1.1
    auraGroup.add(beam)

    this.scene.add(auraGroup)
    this.healingAuras.push({
      group: auraGroup,
      player,
      life: 0.8,
      maxLife: 0.8
    })
  }

  // --- FRAME UPDATE ---
  update(dt, player, targets = []) {
    // 1. Update Ramps (Auto-cleanup, fadeout & collider cleanup)
    for (let i = this.ramps.length - 1; i >= 0; i--) {
      const r = this.ramps[i]
      r.life -= dt

      // Visual warning fade / flash in the last 2 seconds
      if (r.life < 2.0 && r.group) {
        const fade = Math.max(0.1, r.life / 2.0)
        r.group.traverse(child => {
          if (child.isMesh && child.material) {
            child.material.transparent = true
            child.material.opacity = fade
          }
        })
      }

      if (r.life <= 0) {
        if (r.colliders) {
          r.colliders.forEach(c => {
            const idx = this.meshColliders.indexOf(c)
            if (idx !== -1) this.meshColliders.splice(idx, 1)
            if (this.playerController) this.playerController.removeMeshCollider(c)
          })
        }
        this.scene.remove(r.group)
        this.ramps.splice(i, 1)
      }
    }

    // 2. Update Grapple Cables
    for (let i = this.grappleCables.length - 1; i >= 0; i--) {
      const g = this.grappleCables[i]
      g.life -= dt
      if (g.mesh && g.mesh.material) {
        g.mesh.material.opacity = Math.max(0, g.life / g.maxLife)
      }
      if (g.life <= 0) {
        this.scene.remove(g.mesh)
        if (g.mesh.geometry) g.mesh.geometry.dispose()
        if (g.mesh.material) g.mesh.material.dispose()
        this.grappleCables.splice(i, 1)
      }
    }

    // 3. Update Launch Pads & Trampoline Triggering
    for (let i = this.launchPads.length - 1; i >= 0; i--) {
      const pad = this.launchPads[i]
      pad.life -= dt

      if (pad.group) {
        pad.group.rotation.y += dt * 1.5
      }

      // Check if local player steps on launch pad
      if (player && this.playerController) {
        const d = Math.hypot(player.pos.x - pad.pos.x, player.pos.z - pad.pos.z)
        const curFeetY = Math.max(0, (player.pos.y || 1.7) - this.playerController.currentEyeHeight)
        if (d <= pad.radius && Math.abs(curFeetY - pad.pos.y) < 0.6) {
          if (this.playerController.velocity.y <= 0.1) {
            this.playerController.applyImpulse(0, 18.0, 0)
            soundManager.play('ult_activate')
          }
        }
      }

      if (pad.life <= 0) {
        this.scene.remove(pad.group)
        this.launchPads.splice(i, 1)
      }
    }

    // 4. Update Smokes
    for (let i = this.smokes.length - 1; i >= 0; i--) {
      const s = this.smokes[i]
      s.life -= dt
      if (s.currentScale < s.targetScale) {
        s.currentScale = Math.min(s.targetScale, s.currentScale + dt * 4.5)
        s.group.scale.set(s.currentScale, s.currentScale, s.currentScale)
      }
      if (s.ringMesh) s.ringMesh.rotation.z += dt * 0.4
      if (s.life < 1.5) {
        const fade = s.life / 1.5
        s.group.scale.set(s.targetScale * fade, s.targetScale * fade, s.targetScale * fade)
      }
      if (s.life <= 0) {
        this.scene.remove(s.group)
        this.smokes.splice(i, 1)
      }
    }

    // 5. Update Updrafts & Trails
    for (let i = this.updraftVortices.length - 1; i >= 0; i--) {
      const u = this.updraftVortices[i]
      u.life -= dt
      if (u.coneMesh) u.coneMesh.rotation.y += dt * 10.0
      if (u.ringMesh) {
        const s = (1.0 - u.life / u.maxLife) * 2.0
        u.ringMesh.scale.set(1 + s, 1 + s, 1 + s)
        u.ringMesh.material.opacity = (u.life / u.maxLife)
      }
      if (u.life <= 0) {
        this.scene.remove(u.group)
        this.updraftVortices.splice(i, 1)
      }
    }

    for (let i = this.dashTrails.length - 1; i >= 0; i--) {
      const d = this.dashTrails[i]
      d.life -= dt
      if (d.life <= 0) {
        this.scene.remove(d.group)
        this.dashTrails.splice(i, 1)
      }
    }

    for (let i = this.healingAuras.length - 1; i >= 0; i--) {
      const a = this.healingAuras[i]
      a.life -= dt
      if (a.player) {
        a.group.position.set(a.player.pos.x, a.player.pos.y, a.player.pos.z)
        a.group.rotation.y += dt * 4.0
      }
      if (a.life <= 0) {
        this.scene.remove(a.group)
        this.healingAuras.splice(i, 1)
      }
    }
  }

  // --- MULTIPLAYER REMOTE ABILITY CAST ---
  castRemote(caster, key, pos, dir, targets = []) {
    const origin = new THREE.Vector3(pos.x, pos.y, pos.z)
    const forward = new THREE.Vector3(dir.x, dir.y, dir.z).normalize()

    if (key === 'C') {
      this.spawnSmoke(origin.clone().addScaledVector(forward, 7), 4.5, 0x64748b, 7.5)
      soundManager.play('flash')
    } else if (key === 'Q') {
      this.spawnRamp(caster)
      soundManager.play('buy')
    } else if (key === 'E') {
      this.spawnDashTrail(origin, origin.clone().addScaledVector(forward, 10), forward)
      soundManager.play('dash')
    } else if (key === 'X') {
      this.spawnLaunchPad(caster)
      soundManager.play('ult_activate')
    }
  }

  // Clear all built structures (ramps, launch pads, smokes) between rounds
  clearRoundStructures() {
    // 1. Clear and unregister all ramps
    for (let i = this.ramps.length - 1; i >= 0; i--) {
      const r = this.ramps[i]
      if (r.colliders) {
        r.colliders.forEach(c => {
          const idx = this.meshColliders.indexOf(c)
          if (idx !== -1) this.meshColliders.splice(idx, 1)
          if (this.playerController) this.playerController.removeMeshCollider(c)
        })
      }
      this.scene.remove(r.group)
    }
    this.ramps = []

    // 2. Clear all launch pads
    for (let i = this.launchPads.length - 1; i >= 0; i--) {
      this.scene.remove(this.launchPads[i].group)
    }
    this.launchPads = []

    // 3. Clear all smoke clouds
    for (let i = this.smokes.length - 1; i >= 0; i--) {
      this.scene.remove(this.smokes[i].group)
    }
    this.smokes = []

    // 4. Clear all temporary VFX
    for (let i = this.grappleCables.length - 1; i >= 0; i--) {
      this.scene.remove(this.grappleCables[i].mesh)
    }
    this.grappleCables = []

    for (let i = this.updraftVortices.length - 1; i >= 0; i--) {
      this.scene.remove(this.updraftVortices[i].group)
    }
    this.updraftVortices = []

    for (let i = this.dashTrails.length - 1; i >= 0; i--) {
      this.scene.remove(this.dashTrails[i].group)
    }
    this.dashTrails = []

    for (let i = this.healingAuras.length - 1; i >= 0; i--) {
      this.scene.remove(this.healingAuras[i].group)
    }
    this.healingAuras = []
  }
}
