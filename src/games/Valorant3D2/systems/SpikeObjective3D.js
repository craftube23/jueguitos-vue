// src/games/Valorant3D2/systems/SpikeObjective3D.js
import * as THREE from 'three'
import { soundManager } from './SoundSystem.js'
import { SPIKE_STATES } from './ObjectiveSystem.js'

export class SpikeObjective3D {
  constructor(scene) {
    this.scene = scene
    this.state = SPIKE_STATES.DROPPED
    this.position = new THREE.Vector3(-20, 0.25, 0)
    this.carrierId = null
    this.planterId = null
    this.defuserId = null
    this.site = null
    this.plantProgress = 0
    this.defuseProgress = 0
    this.fuseTimer = 45.0
    this.beepTimer = 0
    this.exploded = false

    this.mesh = null
    this.light = null
    this.blastMesh = null
    this.blastRadius = 0

    this.init3DSpike()
  }

  init3DSpike() {
    this.mesh = new THREE.Group()

    // Core Box
    const coreGeo = new THREE.BoxGeometry(0.5, 0.7, 0.5)
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
    const core = new THREE.Mesh(coreGeo, coreMat)
    core.position.y = 0.35
    core.castShadow = true

    // LED Warning Ring
    const ringGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.1, 16)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.y = 0.55

    this.mesh.add(core)
    this.mesh.add(ring)

    // Point Light
    this.light = new THREE.PointLight(0xef4444, 2, 8)
    this.light.position.y = 0.7
    this.mesh.add(this.light)

    this.mesh.position.copy(this.position)
    this.scene.add(this.mesh)

    // Detonation Blast Hemisphere
    const blastGeo = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    const blastMat = new THREE.MeshBasicMaterial({ color: 0x111827, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    this.blastMesh = new THREE.Mesh(blastGeo, blastMat)
    this.blastMesh.visible = false
    this.scene.add(this.blastMesh)
  }

  reset(isAttacker, playerId, spawnPos) {
    this.state = isAttacker ? SPIKE_STATES.CARRIED : SPIKE_STATES.DROPPED
    this.carrierId = isAttacker ? playerId : null
    this.planterId = null
    this.defuserId = null
    this.site = null
    this.plantProgress = 0
    this.defuseProgress = 0
    this.fuseTimer = 45.0
    this.beepTimer = 0
    this.exploded = false
    this.blastRadius = 0
    if (this.blastMesh) this.blastMesh.visible = false

    this.position.set(spawnPos.x + 2, 0.25, spawnPos.z)
    this.mesh.position.copy(this.position)
    this.mesh.visible = !isAttacker
  }

  update(dt, onBeep, onPlanted, onDefused, onExplode) {
    if (this.state === SPIKE_STATES.CARRIED) {
      this.mesh.visible = false
      return
    }

    this.mesh.visible = true
    this.mesh.position.copy(this.position)
    this.mesh.rotation.y += 1.2 * dt

    // Planted or Defusing
    if (this.state === SPIKE_STATES.PLANTED || this.state === SPIKE_STATES.DEFUSING) {
      this.fuseTimer -= dt

      // Accelerating beep
      const interval = Math.max(0.12, (this.fuseTimer / 45.0) * 1.0)
      this.beepTimer += dt
      if (this.beepTimer >= interval) {
        this.beepTimer = 0
        soundManager.play('spike_beep')
        this.light.intensity = 8.0
        setTimeout(() => { if (this.light) this.light.intensity = 2.0 }, 60)
      }

      if (this.fuseTimer <= 0 && !this.exploded) {
        this.exploded = true
        this.state = SPIKE_STATES.EXPLODED
        soundManager.play('explosion')
        this.blastMesh.position.copy(this.position)
        this.blastMesh.visible = true
        if (onExplode) onExplode(this.position)
      }
    }

    // Expanding blast sphere
    if (this.exploded && this.blastRadius < 60) {
      this.blastRadius += 45 * dt
      this.blastMesh.scale.set(this.blastRadius, this.blastRadius, this.blastRadius)
      this.blastMesh.material.opacity = Math.max(0, 1.0 - this.blastRadius / 60)
    }
  }

  startPlant(planterId, site, playerPos) {
    this.state = SPIKE_STATES.PLANTING
    this.planterId = planterId
    this.site = site
    this.position.set(playerPos.x, 0.25, playerPos.z)
  }

  completePlant() {
    this.state = SPIKE_STATES.PLANTED
    this.carrierId = null
    this.planterId = null
    this.plantProgress = 0
    soundManager.play('spike_plant')
  }

  startDefuse(defuserId) {
    this.state = SPIKE_STATES.DEFUSING
    this.defuserId = defuserId
  }

  completeDefuse() {
    this.state = SPIKE_STATES.DEFUSED
    soundManager.play('spike_defused')
  }
}
