// src/games/Valorant3D2/systems/AbilitySystem3D.js
import * as THREE from 'three'
import { soundManager } from './SoundSystem.js'
import { DamageSystem } from './DamageSystem.js'

export class AbilitySystem3D {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera

    // Active 3D VFX Objects
    this.smokes = []
    this.fires = []
    this.walls = []
    this.sonarPulses = []
    this.beams = []
    this.updraftVortices = []
    this.dashTrails = []
    this.projectiles = []
    this.flashOrbs = []
    this.healingAuras = []
    this.activeUltKnives = [] // 5 orbiting daggers for Jett / Gladiator Blade Storm
    this.hasUltKnivesActive = false
  }

  // --- LOCAL ABILITY CAST ---
  cast(player, key, targets = [], onAnnouncement) {
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation)
    const pos = new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z)
    const agent = player.agentId || 'jett'

    // ==========================================
    // 1. JETT / GLADIATOR / DEFAULT AGENT
    // ==========================================
    if (agent === 'jett' || agent === 'gladiator' || !['phoenix', 'sova', 'sage', 'brimstone', 'reyna'].includes(agent)) {
      if (key === 'C') {
        // --- C: NUBE DE HUMO RADIANITA (CLOUDBURST) ---
        const targetPos = pos.clone().addScaledVector(forward, 7)
        this.spawnSmoke(targetPos, 4.5, 0x64748b, 7.0)
        soundManager.play('flash')
        if (onAnnouncement) onAnnouncement('☁️ ¡NUBE DE HUMO TÁCTICA DESPLEGADA!')
      } else if (key === 'Q') {
        // --- Q: SUPER SALTO CON VÓRTICE DE VIENTO (UPDRAFT) ---
        player.vel.y = 12.5
        player.onGround = false
        this.spawnUpdraftVortex(pos)
        soundManager.play('dash')
        if (onAnnouncement) onAnnouncement('💨 ¡SUPER SALTO CICLÓN!')
      } else if (key === 'E') {
        // --- E: DASH SUPERSÓNICO CON ESTELA DE VIENTO (TAILWIND) ---
        const dashDir = new THREE.Vector3(forward.x, 0, forward.z).normalize()
        const startPos = pos.clone()
        const targetPos = pos.clone().addScaledVector(dashDir, 14.0)

        // Spawn visual speed streaks and wind rings
        this.spawnDashTrail(startPos, targetPos, dashDir)
        player.pos.x = targetPos.x
        player.pos.z = targetPos.z
        soundManager.play('dash')
        if (onAnnouncement) onAnnouncement('⚡ ¡DASH SUPERSÓNICO!')
      } else if (key === 'X') {
        // --- X: TORMENTA DE CUCHILLAS / DAGAS VOLADORAS (BLADE STORM) ---
        if (this.hasUltKnivesActive && this.activeUltKnives.length > 0) {
          // Fire one dagger forward
          this.fireUltDagger(pos, forward, targets, player.id)
          if (onAnnouncement) onAnnouncement('🗡️ ¡DAGA RADIANITA LANZADA!')
        } else {
          // Activate Blade Storm: spawn 5 floating glowing daggers around player
          this.activateBladeStorm(player)
          soundManager.play('ult_activate')
          if (onAnnouncement) onAnnouncement('🌪️ ¡TORMENTA DE CUCHILLAS ACTIVADA (5 DAGAS)!')
        }
      }
    }

    // ==========================================
    // 2. PHOENIX (FUEGO & FLASHES)
    // ==========================================
    else if (agent === 'phoenix') {
      if (key === 'C') {
        // --- C: MURO DE FUEGO (BLAZE) ---
        this.spawnFireWall(pos.clone().addScaledVector(forward, 4), forward, 8.0)
        soundManager.play('flash')
        if (onAnnouncement) onAnnouncement('🔥 PHOENIX: ¡MURO DE FUEGO INFERNAL!')
      } else if (key === 'Q') {
        // --- Q: FLASH CEGADORA ORBE (CURVEBALL) ---
        const flashPos = pos.clone().addScaledVector(forward, 8).add(new THREE.Vector3(0, 1.2, 0))
        this.spawnFlashOrb(flashPos, targets, player.id)
        soundManager.play('flash')
        if (onAnnouncement) onAnnouncement('✨ PHOENIX: ¡ORBE DE DESTELLO CEGADOR!')
      } else if (key === 'E') {
        // --- E: MOLOTOV DE FUEGO LÍQUIDO (HOT HANDS) ---
        const fireLanding = pos.clone().addScaledVector(forward, 11)
        fireLanding.y = 0.2
        this.spawnFireZone(fireLanding, 4.2, 7.0)
        soundManager.play('flash')
        if (onAnnouncement) onAnnouncement('🔥 PHOENIX: ¡ZONA DE FUEGO MOLOTOV!')
      } else if (key === 'X') {
        // --- X: AURA DE RENACIMIENTO FÉNIX (RUN IT BACK) ---
        this.spawnPhoenixAura(player)
        soundManager.play('ult_activate')
        if (onAnnouncement) onAnnouncement('🔥 PHOENIX: ¡RENACIMIENTO DEL FÉNIX!')
      }
    }

    // ==========================================
    // 3. SOVA (SONAR & RAYO DEFINITIVO)
    // ==========================================
    else if (agent === 'sova') {
      if (key === 'C') {
        // --- C: FLECHA DE CHOQUE EXPLOSIVA (SHOCK BOLT) ---
        const impactPos = pos.clone().addScaledVector(forward, 14)
        this.spawnShockExplosion(impactPos, targets, player.id)
        soundManager.play('flash')
        if (onAnnouncement) onAnnouncement('⚡ SOVA: ¡DESCARGA DE FLECHA ELÉCTRICA!')
      } else if (key === 'Q') {
        // --- Q: DRON DE EXPLORACIÓN / ONDA SONAR ---
        const dronePos = pos.clone().addScaledVector(forward, 10)
        this.spawnReconPulse(dronePos, targets, player.team)
        soundManager.play('recon')
        if (onAnnouncement) onAnnouncement('📡 SOVA: ¡SONAR DE RECONOCIMIENTO!')
      } else if (key === 'E') {
        // --- E: FLECHA RADAR (RECON BOLT) ---
        const arrowLanding = pos.clone().addScaledVector(forward, 18)
        this.spawnReconPulse(arrowLanding, targets, player.team)
        soundManager.play('recon')
        if (onAnnouncement) onAnnouncement('🎯 SOVA: ¡FLECHA RECONOCEDORA CLAVADA!')
      } else if (key === 'X') {
        // --- X: FURIA DEL CAZADOR (HUNTER\'S FURY BEAM) ---
        this.spawnBeam(pos, forward, targets, player.id)
        soundManager.play('ult_activate')
        if (onAnnouncement) onAnnouncement('🏹 SOVA: ¡FURIA DEL CAZADOR (RAYO DRAGÓN)!')
      }
    }

    // ==========================================
    // 4. SAGE (MURO DE CRISTAL & CURACIÓN)
    // ==========================================
    else if (agent === 'sage') {
      if (key === 'C') {
        // --- C: MURO DE CRISTALES DE JADE (BARRIER WALL) ---
        this.spawnCrystalWall(pos.clone().addScaledVector(forward, 4), forward, 20.0)
        soundManager.play('buy')
        if (onAnnouncement) onAnnouncement('🛡️ SAGE: ¡MURO DE BARRERA DE CRISTAL!')
      } else if (key === 'Q') {
        // --- Q: ORBE DE RALENTIZACIÓN / HIELO (SLOW ORB) ---
        const orbLanding = pos.clone().addScaledVector(forward, 12)
        this.spawnIceSlowField(orbLanding, 5.0, 8.0)
        soundManager.play('flash')
        if (onAnnouncement) onAnnouncement('❄️ SAGE: ¡CAMPO DE HIELO CRIOGÉNICO!')
      } else if (key === 'E') {
        // --- E: ORBE DE CURACIÓN RESTAURADORA (HEALING ORB) ---
        player.health = Math.min(player.maxHealth || 100, (player.health || 0) + 50)
        this.spawnHealingAura(player)
        soundManager.play('buy')
        if (onAnnouncement) onAnnouncement('💚 SAGE: ¡AURA DE REGENERACIÓN (+50 HP)!')
      } else if (key === 'X') {
        // --- X: RESURRECCIÓN / SOBRECARGA SANADORA ---
        player.health = 100
        player.armor = 50
        this.spawnHealingAura(player, 0x38bdf8)
        soundManager.play('ult_activate')
        if (onAnnouncement) onAnnouncement('🌟 SAGE: ¡RESURRECCIÓN RADIANITA COMPLETA!')
      }
    }

    // ==========================================
    // 5. BRIMSTONE / REYNA / OMEN
    // ==========================================
    else if (agent === 'brimstone' || agent === 'reyna') {
      if (key === 'C') {
        // Humo orbital
        this.spawnSmoke(pos.clone().addScaledVector(forward, 10), 5.5, 0x334155, 12.0)
        soundManager.play('flash')
        if (onAnnouncement) onAnnouncement('☁️ ¡HUMO TÁCTICO ORBITAL!')
      } else if (key === 'Q') {
        // Ojo de la Devoradora / Destello Cegador
        const eyePos = pos.clone().addScaledVector(forward, 9).add(new THREE.Vector3(0, 1.5, 0))
        this.spawnFlashOrb(eyePos, targets, player.id, 0xa855f7)
        soundManager.play('flash')
        if (onAnnouncement) onAnnouncement('👁️ ¡ORBE DE MIRADA CEGADORA!')
      } else if (key === 'E') {
        // Fuego / Estimulante de Combate
        this.spawnHealingAura(player, 0xf59e0b)
        soundManager.play('buy')
        if (onAnnouncement) onAnnouncement('⚡ ¡ESTIMULANTE DE COMBATE VELOZ!')
      } else if (key === 'X') {
        // Rayo Orbital Satelital
        const laserPos = pos.clone().addScaledVector(forward, 12)
        this.spawnOrbitalLaser(laserPos, targets, player.id)
        soundManager.play('ult_activate')
        if (onAnnouncement) onAnnouncement('🛰️ BRIMSTONE: ¡GOLPE ORBITAL DEVASTADOR!')
      }
    }
  }

  // ==========================================
  // 3D VFX SPAWNERS & GEOMETRY
  // ==========================================

  // 1. DENSE VOLUMETRIC SMOKE WITH SWIRLING MESHES
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
    smokeGroup.scale.set(0.1, 0.1, 0.1) // Start small for pop-in expansion animation
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

  // 2. UPDRAFT AIR VORTEX (CYLINDER CONE + GROUND SHOCKWAVE)
  spawnUpdraftVortex(pos) {
    const vortexGroup = new THREE.Group()

    // Swirling air cone
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

    // Ground Wind Blast Ring
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

  // 3. SUPERSONIC DASH WIND TRAIL & TUNNEL RINGS
  spawnDashTrail(startPos, endPos, dir) {
    const trailGroup = new THREE.Group()
    const dist = startPos.distanceTo(endPos)
    const ringCount = 5

    for (let i = 0; i <= ringCount; i++) {
      const frac = i / ringCount
      const ringPos = startPos.clone().lerp(endPos, frac)
      const ringGeo = new THREE.TorusGeometry(0.8 + frac * 0.4, 0.05, 8, 20)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.85
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(ringPos)
      ring.position.y = 1.2
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
      trailGroup.add(ring)
    }

    // Central speed laser beam
    const lineGeo = new THREE.CylinderGeometry(0.12, 0.12, dist, 8)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 })
    const lineMesh = new THREE.Mesh(lineGeo, lineMat)
    const midPoint = startPos.clone().lerp(endPos, 0.5)
    lineMesh.position.copy(midPoint)
    lineMesh.position.y = 1.2
    lineMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    trailGroup.add(lineMesh)

    this.scene.add(trailGroup)
    this.dashTrails.push({ group: trailGroup, life: 0.45 })
  }

  // 4. BLADE STORM ORBITING KUNAI DAGGER SYSTEM (5 GLOWING KNIVES)
  activateBladeStorm(player) {
    this.clearUltKnives()
    this.hasUltKnivesActive = true

    const knifeCount = 5
    for (let i = 0; i < knifeCount; i++) {
      const knifeGroup = new THREE.Group()

      // Dagger Blade
      const bladeGeo = new THREE.ConeGeometry(0.09, 0.6, 5)
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x00f3ff,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.2
      })
      const blade = new THREE.Mesh(bladeGeo, bladeMat)
      blade.rotation.x = Math.PI / 2
      knifeGroup.add(blade)

      // Dagger Handle / Ring
      const hiltGeo = new THREE.TorusGeometry(0.06, 0.02, 6, 12)
      const hiltMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const hilt = new THREE.Mesh(hiltGeo, hiltMat)
      hilt.position.z = 0.35
      knifeGroup.add(hilt)

      this.scene.add(knifeGroup)
      this.activeUltKnives.push({
        group: knifeGroup,
        offsetAngle: (i - 2) * 0.38, // Semi-circle spread
        orbitRadius: 1.1,
        heightOffset: 1.2,
        player
      })
    }
  }

  fireUltDagger(pos, dir, targets, ownerId) {
    if (this.activeUltKnives.length === 0) return
    const knifeObj = this.activeUltKnives.pop()
    if (!knifeObj) return

    soundManager.play('slash')

    // Animate dagger flying at high speed
    const projectileMesh = knifeObj.group
    projectileMesh.position.copy(pos).add(new THREE.Vector3(0, 1.2, 0))
    projectileMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir)

    this.projectiles.push({
      mesh: projectileMesh,
      pos: projectileMesh.position.clone(),
      vel: dir.clone().multiplyScalar(48.0), // 48 m/s bullet speed
      life: 2.0,
      damage: 75,
      ownerId,
      targets
    })

    if (this.activeUltKnives.length === 0) {
      this.hasUltKnivesActive = false
    }
  }

  clearUltKnives() {
    this.activeUltKnives.forEach(k => {
      this.scene.remove(k.group)
    })
    this.activeUltKnives = []
    this.hasUltKnivesActive = false
  }

  // 5. BLINDING FLASH ORB (3D SPHERE EXPLOSION)
  spawnFlashOrb(pos, targets, ownerId, color = 0xffe600) {
    const flashGroup = new THREE.Group()

    const orbGeo = new THREE.SphereGeometry(0.7, 16, 16)
    const orbMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1.0 })
    const orb = new THREE.Mesh(orbGeo, orbMat)
    flashGroup.add(orb)

    const ringGeo = new THREE.RingGeometry(0.2, 2.5, 24)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    flashGroup.add(ring)

    flashGroup.position.copy(pos)
    this.scene.add(flashGroup)

    this.flashOrbs.push({ group: flashGroup, orb, ring, scale: 0.2, life: 0.5 })

    // Blind nearby targets in LOS
    targets.forEach(t => {
      if (t.id !== ownerId && t.alive) {
        const d = Math.hypot(t.pos.x - pos.x, t.pos.z - pos.z)
        if (d < 16.0) {
          t.blindAlpha = 1.0
        }
      }
    })
  }

  // 6. FIRE ZONE (HOT HANDS MOLOTOV)
  spawnFireZone(pos, radius = 4.2, duration = 6.0) {
    const fireGroup = new THREE.Group()

    // Boiling Lava Ground Disc
    const discGeo = new THREE.CylinderGeometry(radius, radius, 0.15, 24)
    const discMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.75 })
    const disc = new THREE.Mesh(discGeo, discMat)
    disc.position.y = 0.08
    fireGroup.add(disc)

    // Inner Hot Core
    const coreGeo = new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, 0.2, 20)
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.9 })
    const core = new THREE.Mesh(coreGeo, coreMat)
    core.position.y = 0.12
    fireGroup.add(core)

    // Rising Fire Embers Particles
    const emberCount = 30
    const emberGeo = new THREE.BufferGeometry()
    const emberPos = new Float32Array(emberCount * 3)
    for (let i = 0; i < emberCount; i++) {
      const ang = Math.random() * Math.PI * 2
      const r = Math.random() * radius * 0.8
      emberPos[i * 3] = Math.cos(ang) * r
      emberPos[i * 3 + 1] = Math.random() * 2.5
      emberPos[i * 3 + 2] = Math.sin(ang) * r
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3))
    const emberMat = new THREE.PointsMaterial({ color: 0xffedd5, size: 0.2, transparent: true, opacity: 0.8 })
    const embers = new THREE.Points(emberGeo, emberMat)
    fireGroup.add(embers)

    fireGroup.position.set(pos.x, 0, pos.z)
    this.scene.add(fireGroup)

    this.fires.push({ group: fireGroup, embers, pos, radius, life: duration })
  }

  // 7. BLAZING WALL OF FIRE (PHOENIX BLAZE)
  spawnFireWall(pos, dir, duration = 7.0) {
    const wallGroup = new THREE.Group()
    const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize()

    for (let i = -3; i <= 3; i++) {
      const pillarGeo = new THREE.CylinderGeometry(0.6, 0.8, 4.0, 12)
      const pillarMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.8 })
      const pillar = new THREE.Mesh(pillarGeo, pillarMat)
      pillar.position.copy(pos).addScaledVector(right, i * 1.3)
      pillar.position.y = 2.0
      wallGroup.add(pillar)
    }

    this.scene.add(wallGroup)
    this.walls.push({ group: wallGroup, life: duration })
  }

  // 8. SAGE SOLID JADE CRYSTAL WALL (BARRIER)
  spawnCrystalWall(pos, dir, duration = 20.0) {
    const wallGroup = new THREE.Group()
    const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize()

    for (let i = -1.5; i <= 1.5; i++) {
      const geo = new THREE.BoxGeometry(1.5, 3.6, 1.5)
      const mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x047857,
        emissiveIntensity: 0.3,
        roughness: 0.2,
        metalness: 0.5,
        transparent: true,
        opacity: 0.92
      })
      const pillar = new THREE.Mesh(geo, mat)
      pillar.position.copy(pos).addScaledVector(right, i * 1.6)
      pillar.position.y = 1.8
      pillar.castShadow = true
      pillar.receiveShadow = true
      wallGroup.add(pillar)
    }

    this.scene.add(wallGroup)
    this.walls.push({ group: wallGroup, life: duration })
  }

  // 9. ICE CRIOGENIC SLOW FIELD (SAGE SLOW ORB)
  spawnIceSlowField(pos, radius = 5.0, duration = 8.0) {
    const iceGroup = new THREE.Group()

    const iceDiscGeo = new THREE.CylinderGeometry(radius, radius, 0.1, 24)
    const iceDiscMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1
    })
    const iceDisc = new THREE.Mesh(iceDiscGeo, iceDiscMat)
    iceDisc.position.y = 0.06
    iceGroup.add(iceDisc)

    iceGroup.position.set(pos.x, 0, pos.z)
    this.scene.add(iceGroup)

    this.fires.push({ group: iceGroup, pos, radius, life: duration, isSlowField: true })
  }

  // 10. HEALING AURA LIGHT SPIRAL (SAGE HEAL)
  spawnHealingAura(player, color = 0x10b981) {
    const auraGroup = new THREE.Group()

    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(0.7 + i * 0.15, 0.03, 8, 20)
      const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 0.3 + i * 0.5
      auraGroup.add(ring)
    }

    this.scene.add(auraGroup)
    this.healingAuras.push({ group: auraGroup, player, life: 1.8 })
  }

  // 11. PHOENIX RISING FIRE AURA
  spawnPhoenixAura(player) {
    const auraGroup = new THREE.Group()

    const ringGeo = new THREE.RingGeometry(0.4, 1.8, 24)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.08
    auraGroup.add(ring)

    this.scene.add(auraGroup)
    this.healingAuras.push({ group: auraGroup, player, life: 3.0 })
  }

  // 12. SHOCK EXPLOSION BURST
  spawnShockExplosion(pos, targets, ownerId) {
    const shockGroup = new THREE.Group()

    const sphereGeo = new THREE.SphereGeometry(3.0, 16, 16)
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8, wireframe: true })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.position.y = 1.0
    shockGroup.add(sphere)

    shockGroup.position.set(pos.x, 0, pos.z)
    this.scene.add(shockGroup)

    this.flashOrbs.push({ group: shockGroup, scale: 0.3, life: 0.4 })

    targets.forEach(t => {
      if (t.id !== ownerId && t.alive) {
        const d = Math.hypot(t.pos.x - pos.x, t.pos.z - pos.z)
        if (d < 5.0) {
          DamageSystem.applyDamage(t, 65, false, false, 'shock')
        }
      }
    })
  }

  // 13. RECON SONAR RADAR PULSE
  spawnReconPulse(pos, targets, team) {
    const geo = new THREE.RingGeometry(0.5, 0.8, 32)
    const mat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 1.0 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(pos.x, 0.25, pos.z)
    this.scene.add(mesh)
    this.sonarPulses.push({ mesh, radius: 0.5, maxRadius: 26.0, life: 3.5 })

    targets.forEach(t => {
      if (t.alive && t.team !== team) {
        const d = Math.hypot(t.pos.x - pos.x, t.pos.z - pos.z)
        if (d < 26.0) {
          t.revealed = true
          setTimeout(() => { t.revealed = false }, 3500)
        }
      }
    })
  }

  // 14. SOVA PIERCING DRAGON ENERGY BEAM
  spawnBeam(origin, dir, targets, ownerId) {
    const beamGroup = new THREE.Group()

    const coreGeo = new THREE.CylinderGeometry(1.6, 1.6, 70, 24)
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.85 })
    const core = new THREE.Mesh(coreGeo, coreMat)
    beamGroup.add(core)

    const outerGeo = new THREE.CylinderGeometry(2.4, 2.4, 70, 16)
    const outerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, wireframe: true })
    const outer = new THREE.Mesh(outerGeo, outerMat)
    beamGroup.add(outer)

    beamGroup.position.copy(origin).addScaledVector(dir, 35)
    beamGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    this.scene.add(beamGroup)
    this.beams.push({ group: beamGroup, life: 0.7 })

    targets.forEach(t => {
      if (t.alive && t.id !== ownerId) {
        DamageSystem.applyDamage(t, 90, false, false, 'beam')
      }
    })
  }

  // 15. BRIMSTONE GIANT ORBITAL STRIKE
  spawnOrbitalLaser(pos, targets, ownerId) {
    const laserGroup = new THREE.Group()

    const geo = new THREE.CylinderGeometry(4.5, 4.5, 90, 24)
    const mat = new THREE.MeshBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.8 })
    const laser = new THREE.Mesh(geo, mat)
    laser.position.set(pos.x, 45, pos.z)
    laserGroup.add(laser)

    const ringGeo = new THREE.RingGeometry(1.0, 5.2, 32)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(pos.x, 0.15, pos.z)
    laserGroup.add(ring)

    this.scene.add(laserGroup)
    this.beams.push({ group: laserGroup, life: 3.5 })

    targets.forEach(t => {
      if (t.alive && t.id !== ownerId) {
        const d = Math.hypot(t.pos.x - pos.x, t.pos.z - pos.z)
        if (d < 5.5) DamageSystem.applyDamage(t, 140, false, false, 'orbital')
      }
    })
  }

  // ==========================================
  // TICK & ANIMATION GAME LOOP
  // ==========================================
  update(dt, player, targets = []) {
    // 1. Update Orbiting Blade Storm Knives around player
    if (this.hasUltKnivesActive && this.activeUltKnives.length > 0 && player) {
      const yaw = player.yaw || 0
      const pitch = player.pitch || 0
      const headPos = new THREE.Vector3(player.pos.x, player.pos.y + 1.3, player.pos.z)

      this.activeUltKnives.forEach((k, idx) => {
        const angle = yaw + k.offsetAngle
        const rad = k.orbitRadius
        const hoverBob = Math.sin(Date.now() * 0.005 + idx) * 0.06

        k.group.position.set(
          headPos.x + Math.sin(angle) * rad,
          headPos.y + hoverBob,
          headPos.z + Math.cos(angle) * rad
        )
        k.group.rotation.y = angle + Math.PI / 2
        k.group.rotation.x = pitch
      })
    }

    // 2. Update Flying Projectiles (Thrown Ult Knives)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]
      p.life -= dt
      p.pos.addScaledVector(p.vel, dt)
      p.mesh.position.copy(p.pos)

      // Hit check against targets
      if (p.targets) {
        for (const t of p.targets) {
          if (t.alive && t.id !== p.ownerId) {
            const dist = p.pos.distanceTo(new THREE.Vector3(t.pos.x, t.pos.y + 1.0, t.pos.z))
            if (dist < 1.2) {
              DamageSystem.applyDamage(t, p.damage, false, false, 'knife')
              soundManager.play('hit')
              p.life = 0
              break
            }
          }
        }
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh)
        this.projectiles.splice(i, 1)
      }
    }

    // 3. Update Smokes
    for (let i = this.smokes.length - 1; i >= 0; i--) {
      const s = this.smokes[i]
      s.life -= dt

      // Pop-in expansion animation
      if (s.currentScale < s.targetScale) {
        s.currentScale = Math.min(s.targetScale, s.currentScale + dt * 4.0)
        s.group.scale.set(s.currentScale, s.currentScale, s.currentScale)
      }
      if (s.ringMesh) {
        s.ringMesh.rotation.z += dt * 0.5
      }

      if (s.life <= 0) {
        this.scene.remove(s.group)
        this.smokes.splice(i, 1)
      }
    }

    // 4. Update Updraft Vortices
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

    // 5. Update Dash Trails
    for (let i = this.dashTrails.length - 1; i >= 0; i--) {
      const d = this.dashTrails[i]
      d.life -= dt
      if (d.life <= 0) {
        this.scene.remove(d.group)
        this.dashTrails.splice(i, 1)
      }
    }

    // 6. Update Flash Orbs & Shockwaves
    for (let i = this.flashOrbs.length - 1; i >= 0; i--) {
      const o = this.flashOrbs[i]
      o.life -= dt
      o.scale += dt * 8.0
      o.group.scale.set(o.scale, o.scale, o.scale)
      if (o.life <= 0) {
        this.scene.remove(o.group)
        this.flashOrbs.splice(i, 1)
      }
    }

    // 7. Update Fire & Ice Slow Zones
    for (let i = this.fires.length - 1; i >= 0; i--) {
      const f = this.fires[i]
      f.life -= dt
      if (f.embers && f.embers.geometry && f.embers.geometry.attributes.position) {
        const posAttr = f.embers.geometry.attributes.position
        for (let j = 0; j < posAttr.count; j++) {
          let y = posAttr.getY(j) + dt * 1.5
          if (y > 3.0) y = 0.1
          posAttr.setY(j, y)
        }
        posAttr.needsUpdate = true
      }

      // Check damage / slow on local player
      if (player) {
        const dist = Math.hypot(player.pos.x - f.pos.x, player.pos.z - f.pos.z)
        if (dist < f.radius) {
          if (f.isSlowField) {
            player.isSlowed = true
          } else if (player.agentId === 'phoenix') {
            player.health = Math.min(player.maxHealth || 100, player.health + 12 * dt)
          } else {
            DamageSystem.applyDamage(player, 35 * dt, false, false, 'fire')
          }
        }
      }

      if (f.life <= 0) {
        this.scene.remove(f.group)
        this.fires.splice(i, 1)
      }
    }

    // 8. Update Solid Walls
    for (let i = this.walls.length - 1; i >= 0; i--) {
      const w = this.walls[i]
      w.life -= dt
      if (w.life <= 0) {
        this.scene.remove(w.group)
        this.walls.splice(i, 1)
      }
    }

    // 9. Update Sonar Pulses
    for (let i = this.sonarPulses.length - 1; i >= 0; i--) {
      const p = this.sonarPulses[i]
      p.life -= dt
      p.radius += 10.0 * dt
      p.mesh.scale.set(p.radius, p.radius, p.radius)
      p.mesh.material.opacity = p.life / 3.5
      if (p.life <= 0) {
        this.scene.remove(p.mesh)
        p.mesh.geometry.dispose()
        this.sonarPulses.splice(i, 1)
      }
    }

    // 10. Update Beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i]
      b.life -= dt
      if (b.life <= 0) {
        this.scene.remove(b.group || b.mesh)
        this.beams.splice(i, 1)
      }
    }

    // 11. Update Healing & Phoenix Auras
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
    const agent = caster.agentId || 'jett'

    if (agent === 'jett' || agent === 'gladiator' || !['phoenix', 'sova', 'sage', 'brimstone', 'reyna'].includes(agent)) {
      if (key === 'C') {
        this.spawnSmoke(origin.clone().addScaledVector(forward, 7), 4.5, 0x64748b, 7.0)
        soundManager.play('flash')
      } else if (key === 'Q') {
        this.spawnUpdraftVortex(origin)
        soundManager.play('dash')
      } else if (key === 'E') {
        const startPos = origin.clone()
        const targetPos = origin.clone().addScaledVector(forward, 14.0)
        this.spawnDashTrail(startPos, targetPos, forward)
        soundManager.play('dash')
      } else if (key === 'X') {
        this.activateBladeStorm(caster)
        soundManager.play('ult_activate')
      }
    } else if (agent === 'phoenix') {
      if (key === 'C') {
        this.spawnFireWall(origin.clone().addScaledVector(forward, 4), forward, 8.0)
        soundManager.play('flash')
      } else if (key === 'Q') {
        const flashPos = origin.clone().addScaledVector(forward, 8).add(new THREE.Vector3(0, 1.2, 0))
        this.spawnFlashOrb(flashPos, targets, caster.id)
        soundManager.play('flash')
      } else if (key === 'E') {
        const fireLanding = origin.clone().addScaledVector(forward, 11)
        fireLanding.y = 0.2
        this.spawnFireZone(fireLanding, 4.2, 7.0)
        soundManager.play('flash')
      } else if (key === 'X') {
        this.spawnPhoenixAura(caster)
        soundManager.play('ult_activate')
      }
    } else if (agent === 'sova') {
      if (key === 'C') {
        const impactPos = origin.clone().addScaledVector(forward, 14)
        this.spawnShockExplosion(impactPos, targets, caster.id)
        soundManager.play('flash')
      } else if (key === 'Q' || key === 'E') {
        const arrowLanding = origin.clone().addScaledVector(forward, 18)
        this.spawnReconPulse(arrowLanding, targets, caster.team)
        soundManager.play('recon')
      } else if (key === 'X') {
        this.spawnBeam(origin, forward, targets, caster.id)
        soundManager.play('ult_activate')
      }
    } else if (agent === 'sage') {
      if (key === 'C') {
        this.spawnCrystalWall(origin.clone().addScaledVector(forward, 4), forward, 20.0)
        soundManager.play('buy')
      } else if (key === 'Q') {
        const orbLanding = origin.clone().addScaledVector(forward, 12)
        this.spawnIceSlowField(orbLanding, 5.0, 8.0)
        soundManager.play('flash')
      } else if (key === 'E' || key === 'X') {
        this.spawnHealingAura(caster)
        soundManager.play('buy')
      }
    } else if (agent === 'brimstone' || agent === 'reyna') {
      if (key === 'C') {
        this.spawnSmoke(origin.clone().addScaledVector(forward, 10), 5.5, 0x334155, 12.0)
        soundManager.play('flash')
      } else if (key === 'Q') {
        const eyePos = origin.clone().addScaledVector(forward, 9).add(new THREE.Vector3(0, 1.5, 0))
        this.spawnFlashOrb(eyePos, targets, caster.id, 0xa855f7)
        soundManager.play('flash')
      } else if (key === 'X') {
        const laserPos = origin.clone().addScaledVector(forward, 12)
        this.spawnOrbitalLaser(laserPos, targets, caster.id)
        soundManager.play('ult_activate')
      }
    }
  }
}
