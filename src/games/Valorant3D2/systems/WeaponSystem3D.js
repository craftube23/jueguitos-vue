import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DamageSystem } from './DamageSystem.js'
import { soundManager } from './SoundSystem.js'

export class WeaponSystem3D {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    this.gunGroup = new THREE.Group()
    this.muzzleLight = null
    this.muzzleFlashMesh = null
    this.tracers = []
    this.sparks = []
    this.recoil = 0
    this.flashTimer = 0
    this.swayX = 0
    this.swayY = 0
    this.idleTimer = 0
    this.adsProgress = 0
    this.meshColliders = []

    // Animation & GLTF State
    this.mixer = null
    this.actions = {}
    this.currentLoopAction = null
    this.akModel = null
    this.isGlbLoaded = false
    this.wasReloading = false

    this.initMuzzleEffects()
    this.loadAk74uModel()

    this.camera.add(this.gunGroup)
    this.scene.add(this.camera)
  }

  setMeshColliders(meshList) {
    this.meshColliders = meshList || []
  }

  initMuzzleEffects() {
    // 3D Muzzle Flash Star Mesh & Dynamic Point Light
    const flashGeo = new THREE.OctahedronGeometry(0.12, 0)
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffea00, transparent: true, opacity: 0.95 })
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat)
    this.muzzleFlashMesh.position.set(0.067, 1.51, -0.65)
    this.muzzleFlashMesh.visible = false
    this.gunGroup.add(this.muzzleFlashMesh)

    this.muzzleLight = new THREE.PointLight(0xfde047, 0, 12)
    this.muzzleLight.position.set(0.067, 1.51, -0.7)
    this.gunGroup.add(this.muzzleLight)
  }

  loadAk74uModel() {
    const loader = new GLTFLoader()
    loader.load(
      '/models/ak74u__free_animation.glb',
      (gltf) => {
        this.akModel = gltf.scene

        // Configure shadows & tactical materials
        this.akModel.traverse((child) => {
          if (child.isMesh) {
            // Hide the character head/body mesh (Object_57 / Ch08_Body) so camera is never inside the neck/head!
            // Only show the arms/sleeves (Ch08_Hoodie) and the AK-74u weapon meshes
            if (child.name.toLowerCase().includes('body') || child.name === 'Object_57') {
              child.visible = false
              return
            }

            child.castShadow = true
            child.receiveShadow = true
            child.frustumCulled = false

            if (child.material) {
              child.material.roughness = Math.min(child.material.roughness || 0.4, 0.6)
              child.material.metalness = Math.max(child.material.metalness || 0.5, 0.4)
              child.material.depthTest = true
              child.material.needsUpdate = true
            }
          }
        })

        this.akModel.position.set(0, 0, 0)
        this.akModel.scale.set(1, 1, 1)
        this.gunGroup.add(this.akModel)

        // Set up AnimationMixer with all animation clips
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.akModel)
          gltf.animations.forEach((clip) => {
            const name = clip.name.toUpperCase()
            const action = this.mixer.clipAction(clip)
            this.actions[name] = action
          })

          // Start with DRAW -> IDLE or IDLE directly
          if (this.actions['DRAW']) {
            this.playAnimation('DRAW', false, 1.2, () => {
              this.playAnimation('IDLE', true, 1.0)
            })
          } else if (this.actions['IDLE']) {
            this.playAnimation('IDLE', true, 1.0)
          }
        }

        this.isGlbLoaded = true
      },
      undefined,
      (error) => {
        console.warn('Could not load AK74u model:', error)
      }
    )
  }

  playAnimation(name, loop = false, timeScale = 1.0, onComplete = null) {
    if (!this.mixer || !this.actions[name]) return
    const action = this.actions[name]

    if (loop) {
      if (this.currentLoopAction === action && action.isRunning()) return
      if (this.currentLoopAction && this.currentLoopAction !== action) {
        this.currentLoopAction.fadeOut(0.2)
      }
      action.reset().fadeIn(0.2).setLoop(THREE.LoopRepeat).setEffectiveTimeScale(timeScale).play()
      this.currentLoopAction = action
    } else {
      // One-shot action (e.g. SHOOT, RELOAD1, RELOAD2, DRAW, INSPEC)
      action.reset().setLoop(THREE.LoopOnce, 1).setEffectiveTimeScale(timeScale)
      action.clampWhenFinished = false

      if (this.currentLoopAction) {
        action.crossFadeFrom(this.currentLoopAction, 0.06, true)
      }
      action.play()

      const onFinish = (e) => {
        if (e.action === action) {
          this.mixer.removeEventListener('finished', onFinish)
          if (onComplete) onComplete()
          if (this.currentLoopAction) {
            this.currentLoopAction.reset().fadeIn(0.15).play()
          }
        }
      }
      this.mixer.addEventListener('finished', onFinish)
    }
  }

  onCameraMove(movementX, movementY) {
    // Dynamic weapon sway
    this.swayX = Math.max(-0.05, Math.min(0.05, this.swayX - movementX * 0.0003))
    this.swayY = Math.max(-0.035, Math.min(0.035, this.swayY + movementY * 0.0003))
  }

  update(dt, isReloading, reloadProgress, isAiming = false, baseFov = 75, isSniper = false) {
    this.idleTimer += dt

    // Update GLTF Skeletal Animation Mixer
    if (this.mixer) {
      this.mixer.update(dt)
    }

    // Handle Reload Animation Transitions
    if (isReloading && !this.wasReloading) {
      const reloadAnim = this.actions['RELOAD1'] ? 'RELOAD1' : (this.actions['RELOAD2'] ? 'RELOAD2' : null)
      if (reloadAnim) {
        this.playAnimation(reloadAnim, false, 1.35)
      }
    } else if (!isReloading && this.wasReloading) {
      this.playAnimation('IDLE', true, 1.0)
    }
    this.wasReloading = isReloading

    // Recoil Spring Recovery & Sway Decay
    this.recoil = Math.max(0, this.recoil - 8.5 * dt)
    this.swayX *= 0.88
    this.swayY *= 0.88

    // Smooth ADS Transition (0: Hipfire, 1: Aiming Down Sights)
    const targetAds = (isAiming && !isReloading) ? 1.0 : 0.0
    this.adsProgress = THREE.MathUtils.lerp(this.adsProgress, targetAds, dt * 18.0)

    // Dynamic FOV Zoom (Comfortable 1.4x zoom in ADS, high zoom for Snipers)
    const targetFov = isSniper ? 20.0 : 54.0
    const currentFov = THREE.MathUtils.lerp(baseFov, targetFov, this.adsProgress)
    if (Math.abs(this.camera.fov - currentFov) > 0.01) {
      this.camera.fov = currentFov
      this.camera.updateProjectionMatrix()
    }

    // Natural Idle Breathing Bobbing (stabilized in ADS)
    const bobFactor = THREE.MathUtils.lerp(1.0, 0.1, this.adsProgress)
    const idleBobX = Math.sin(this.idleTimer * 1.5) * 0.002 * bobFactor
    const idleBobY = Math.cos(this.idleTimer * 3.0) * 0.002 * bobFactor

    // Coordinates calibrated for the animated AK-74u character model:
    // Hipfire Coordinates (Comfortably placed on bottom-right viewport)
    const hipX = 0.07 + this.swayX * 0.4 + idleBobX
    const hipY = -1.63 + this.swayY * 0.4 + idleBobY + this.recoil * 0.02
    const hipZ = -0.26 + this.recoil * 0.05

    // ADS Coordinates (Lowered gun body for crystal clear target visibility and perfect sight line alignment)
    const adsX = -0.067 + this.swayX * 0.04 + idleBobX
    const adsY = -1.585 + this.swayY * 0.04 + idleBobY + this.recoil * 0.005
    const adsZ = -0.22 + this.recoil * 0.01

    this.gunGroup.position.x = THREE.MathUtils.lerp(hipX, adsX, this.adsProgress)
    this.gunGroup.position.y = THREE.MathUtils.lerp(hipY, adsY, this.adsProgress)
    this.gunGroup.position.z = THREE.MathUtils.lerp(hipZ, adsZ, this.adsProgress)

    // Rotation interpolation for realistic handling
    const hipRotX = this.recoil * 0.12 - this.swayY * 0.8
    const hipRotY = (Math.random() - 0.5) * this.recoil * 0.02 + this.swayX * 1.0
    const hipRotZ = -this.swayX * 0.8

    const adsRotX = this.recoil * 0.02 - this.swayY * 0.08
    const adsRotY = this.swayX * 0.08
    const adsRotZ = 0

    this.gunGroup.rotation.x = THREE.MathUtils.lerp(hipRotX, adsRotX, this.adsProgress)
    this.gunGroup.rotation.y = THREE.MathUtils.lerp(hipRotY, adsRotY, this.adsProgress)
    this.gunGroup.rotation.z = THREE.MathUtils.lerp(hipRotZ, adsRotZ, this.adsProgress)

    // In full sniper scope, hide the gun model to show full scope reticle
    if (isSniper && this.adsProgress > 0.85) {
      this.gunGroup.visible = false
    } else {
      this.gunGroup.visible = true
    }

    // Muzzle flash visibility timer
    if (this.flashTimer > 0) {
      this.flashTimer -= dt
      if (this.flashTimer <= 0) {
        if (this.muzzleFlashMesh) this.muzzleFlashMesh.visible = false
        if (this.muzzleLight) this.muzzleLight.intensity = 0
      }
    }

    // Update 3D Tracers (moving forward and fading)
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i]
      t.life -= dt
      t.mesh.material.opacity = Math.max(0, t.life / t.maxLife)
      if (t.life <= 0) {
        this.scene.remove(t.mesh)
        t.mesh.geometry.dispose()
        this.tracers.splice(i, 1)
      }
    }

    // Update 3D Impact Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]
      s.life -= dt
      s.mesh.position.addScaledVector(s.velocity, dt)
      s.mesh.scale.multiplyScalar(0.92)
      if (s.life <= 0) {
        this.scene.remove(s.mesh)
        s.mesh.geometry.dispose()
        this.sparks.splice(i, 1)
      }
    }
  }

  fire(shooter, wep, targets = [], onHitCallback, isAiming = false) {
    if (shooter.ammo <= 0) return null

    shooter.ammo--
    soundManager.play(wep.sound)

    // Trigger AK-74u Shoot Animation (bolt kick, recoil, hand reaction)
    if (this.actions['SHOOT']) {
      this.playAnimation('SHOOT', false, 2.2)
    }

    // Recoil kick & Visual Muzzle Flash (reduced by 75% in ADS for superior precision)
    const recoilKick = (wep.recoil || 0.35) * (isAiming ? 0.25 : 1.0)
    this.recoil = Math.min(1.0, this.recoil + recoilKick)
    this.flashTimer = 0.06

    if (this.muzzleFlashMesh) {
      this.muzzleFlashMesh.visible = true
      this.muzzleFlashMesh.scale.set(1.4 + Math.random() * 0.4, 1.4 + Math.random() * 0.4, 1.4 + Math.random() * 0.4)
      this.muzzleFlashMesh.rotation.z = Math.random() * Math.PI
    }
    if (this.muzzleLight) {
      this.muzzleLight.intensity = 6.0
    }

    // 3D Raycasting
    const raycaster = new THREE.Raycaster()
    const origin = new THREE.Vector3(shooter.pos.x, shooter.pos.y, shooter.pos.z)
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation)

    // Spread (Zero spread in ADS = Pinpoint Laser Precision!)
    const baseSpread = shooter.isSilent ? 0 : wep.spread
    const spreadVal = isAiming ? 0.0 : baseSpread
    if (spreadVal > 0) {
      dir.x += (Math.random() - 0.5) * spreadVal
      dir.y += (Math.random() - 0.5) * spreadVal
      dir.normalize()
    }
    raycaster.set(origin, dir)

    // 1. Raycast against World Geometry (Walls, Obstacles, Platforms)
    // Bullets must NEVER penetrate through walls
    let wallHitDist = wep.range || 80
    let wallHitPoint = null

    if (this.meshColliders && this.meshColliders.length > 0) {
      const wallIntersects = raycaster.intersectObjects(this.meshColliders, false)
      if (wallIntersects.length > 0) {
        wallHitDist = wallIntersects[0].distance
        wallHitPoint = wallIntersects[0].point
      }
    }

    // 2. Check Player/Bot targets (only if closer than the obstructing wall)
    let closestHit = null
    let hitTarget = null
    let isHeadshot = false

    for (const target of targets) {
      if (!target.alive || target.team === shooter.team || target.id === shooter.id) continue
      const targetCenter = new THREE.Vector3(target.pos.x, target.pos.y - 0.2, target.pos.z)
      const distToRay = raycaster.ray.distanceToPoint(targetCenter)

      if (distToRay < target.radius * 1.5) {
        const distFromShooter = origin.distanceTo(targetCenter)
        // If the wall is closer than the enemy, the bullet is stopped by the wall!
        if (distFromShooter < wallHitDist) {
          if (!closestHit || distFromShooter < closestHit.dist) {
            const headPos = new THREE.Vector3(target.pos.x, target.pos.y + 0.45, target.pos.z)
            const isHead = raycaster.ray.distanceToPoint(headPos) < 0.35

            closestHit = { dist: distFromShooter, pos: targetCenter }
            hitTarget = target
            isHeadshot = isHead
          }
        }
      }
    }

    // Tracer starts from the gun muzzle position
    const muzzleOffset = new THREE.Vector3(
      THREE.MathUtils.lerp(0.12, 0.0, this.adsProgress),
      THREE.MathUtils.lerp(-0.08, -0.01, this.adsProgress),
      -0.65
    )
    const muzzleWorld = muzzleOffset.applyEuler(this.camera.rotation).add(origin)

    // Tracer End: target if hit, wall impact point if hit wall, or max range in open air
    let tracerEnd
    if (closestHit) {
      tracerEnd = closestHit.pos
      this.spawnSparks(tracerEnd, 0xef4444)
    } else if (wallHitPoint) {
      tracerEnd = wallHitPoint
      this.spawnSparks(tracerEnd, 0xfde047)
    } else {
      tracerEnd = origin.clone().add(dir.clone().multiplyScalar(wep.range || 80))
    }

    this.spawnTracer(muzzleWorld, tracerEnd)

    if (hitTarget) {
      const rawDmg = isHeadshot ? wep.damage.head : wep.damage.body
      if (isHeadshot) soundManager.play('headshot')
      else soundManager.play('hit')

      const res = DamageSystem.applyDamage(hitTarget, rawDmg, isHeadshot, false, 'bullet')
      if (onHitCallback) onHitCallback(hitTarget, isHeadshot, rawDmg, res.killed)
      return { hit: true, target: hitTarget, headshot: isHeadshot, killed: res.killed }
    }

    return { hit: false }
  }

  spawnTracer(start, end) {
    // 3D Cylinder Tracer Beam (thick glowing line visible from all angles)
    const dist = start.distanceTo(end)
    const geo = new THREE.CylinderGeometry(0.02, 0.02, dist, 8)
    const mat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.95 })
    const mesh = new THREE.Mesh(geo, mat)

    // Position at midpoint between muzzle and target
    mesh.position.copy(start).add(end).multiplyScalar(0.5)

    // Orient along ray
    const dir = new THREE.Vector3().subVectors(end, start).normalize()
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)

    this.scene.add(mesh)
    this.tracers.push({ mesh, life: 0.12, maxLife: 0.12 })
  }

  spawnSparks(pos, color = 0xfde047) {
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.SphereGeometry(0.05, 6, 6)
      const mat = new THREE.MeshBasicMaterial({ color })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 1.5,
        (Math.random() - 0.5) * 5
      )
      this.scene.add(mesh)
      this.sparks.push({ mesh, velocity: vel, life: 0.35 })
    }
  }
}
