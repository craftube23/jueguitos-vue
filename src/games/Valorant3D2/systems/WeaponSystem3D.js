import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DamageSystem } from './DamageSystem.js'
import { soundManager } from './SoundSystem.js'

const WEAPON_MODELS = {
  ak74u: {
    path: '/models/armas/ak74u__free_animation.glb',
    scale: [1, 1, 1],
    hideBodyMesh: true,
    hipPos: [0.07, -1.63, -0.26],
    adsPos: [-0.067, -1.585, -0.22],
    muzzlePos: [0.067, 1.51, -0.65],
    animMap: {
      draw: 'DRAW',
      idle: 'IDLE',
      shoot: 'SHOOT',
      reload: 'RELOAD1',
      inspect: 'DRAW'
    }
  },
  benelli_m4: {
    path: '/models/armas/fps_benelli_m4_animations.glb',
    scale: [0.025, 0.025, 0.025],
    rotation: [0, Math.PI, 0],
    meshScale: {
      Object_18: 0.01,
      Object_19: 0.01,
      Object_20: 0.01
    },
    hideBodyMesh: true,
    hipPos: [0.08, -0.855, -0.22],
    adsPos: [-0.041, -0.778, -0.15],
    muzzlePos: [0.0, 0.778, -0.90],
    animMap: {
      draw: 'Rig|M4_Idle',
      idle: 'Rig|M4_Idle',
      shoot: 'Rig|M4_Fire',
      reload: 'Rig|M4_ReloadFull_type1',
      inspect: 'Rig|M4_ReloadOne_type1'
    }
  },
  kriss_vector: {
    path: '/models/armas/kriss_vector_animated_free.glb',
    scale: [0.009, 0.009, 0.009],
    rotation: [0, Math.PI, 0],
    hideBodyMesh: true,
    hipPos: [0.03, -1.42, -0.38],
    adsPos: [-0.1102, -1.348, -0.28],
    muzzlePos: [0.0, 1.348, -0.70],
    subclips: {
      draw: { fromClip: 'Draw', start: 4.166, end: 4.666 },
      idle: { fromClip: 'Draw', start: 4.55, end: 4.666 },
      shoot: { fromClip: 'Shoot', start: 3.366, end: 3.567 },
      reload: { fromClip: 'Reload', start: 0.0, end: 3.333 },
      inspect: { fromClip: 'Draw', start: 4.166, end: 4.666 }
    },
    animMap: {
      draw: 'draw',
      idle: 'idle',
      shoot: 'shoot',
      reload: 'reload',
      inspect: 'inspect'
    }
  },
  sniper: {
    path: '/models/armas/sniper_fps_animation.glb',
    scale: [0.5, 0.5, 0.5],
    hideBodyMesh: true,
    hipPos: [-0.065, -0.10, -0.25],
    adsPos: [-0.065, -0.05, -0.15],
    muzzlePos: [0.0, 0.05, -1.2],
    isSniper: true,
    subclips: {
      draw: [0, 1.2],
      idle: [1.0, 3.5],
      shoot: [4.2, 8.5],
      reload: [19.5, 26.5],
      inspect: [11.5, 15.5]
    },
    animMap: {
      draw: 'draw',
      idle: 'idle',
      shoot: 'shoot',
      reload: 'reload',
      inspect: 'inspect'
    }
  },
  knife: {
    path: '/models/armas/fps_butterfly_knife.glb',
    scale: [1.0, 1.0, 1.0],
    hideBodyMesh: true,
    hipPos: [0.05, 0.08, -0.22],
    adsPos: [0.05, 0.08, -0.22],
    muzzlePos: [0.0, 0.0, -0.5],
    isMelee: true,
    subclips: {
      draw: [0, 1.4],
      idle: [2.0, 7.0],
      shoot: [8.0, 10.5],
      inspect: [11.0, 21.0]
    },
    animMap: {
      draw: 'draw',
      idle: 'idle',
      shoot: 'shoot',
      inspect: 'inspect'
    }
  }
}

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

    // Multi-Weapon Models & Animation State
    this.weaponModels = {}
    this.activeModelKey = 'ak74u'
    this.currentWeaponId = 'ak74u'
    this.wasReloading = false

    this.initMuzzleEffects()
    this.loadAllWeaponModels()

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

  loadAllWeaponModels() {
    const loader = new GLTFLoader()

    Object.entries(WEAPON_MODELS).forEach(([key, config]) => {
      loader.load(
        config.path,
        (gltf) => {
          const modelScene = gltf.scene

          // Configure shadows & materials, hide bare cut-off arm stumps
          modelScene.traverse((child) => {
            if (child.isMesh) {
              const meshName = child.name.toLowerCase()
              const matName = child.material?.name?.toLowerCase() || ''

              if (
                (config.hideBodyMesh && (
                  meshName.includes('body') ||
                  meshName.includes('sleeve') ||
                  child.name === 'Object_57' ||
                  child.name === 'Object_12'
                )) ||
                meshName.includes('hand_mesh_hand') ||
                matName === 'hand_d' ||
                matName === 'sleeve_st6_generalist'
              ) {
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

          if (config.meshScale) {
            Object.entries(config.meshScale).forEach(([meshName, factor]) => {
              const targetMesh = modelScene.getObjectByName(meshName)
              if (targetMesh && targetMesh.geometry) {
                targetMesh.geometry.scale(factor, factor, factor)
                targetMesh.geometry.computeBoundingBox()
              }
            })
          }

          modelScene.position.set(0, 0, 0)
          if (config.rotation) {
            modelScene.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2])
          } else {
            modelScene.rotation.set(0, 0, 0)
          }
          modelScene.scale.set(config.scale[0], config.scale[1], config.scale[2])
          modelScene.visible = (key === this.activeModelKey)
          this.gunGroup.add(modelScene)

          // Setup AnimationMixer & actions
          let mixer = null
          const actions = {}
          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(modelScene)
            const fullClip = gltf.animations[0]

            // If subclips are configured, slice them
            if (config.subclips) {
              const fps = 30
              Object.entries(config.subclips).forEach(([clipName, def]) => {
                let sourceClip = fullClip
                let startSec = 0
                let endSec = 1
                if (Array.isArray(def)) {
                  startSec = def[0]
                  endSec = def[1]
                } else if (typeof def === 'object') {
                  const found = gltf.animations.find(a => a.name.toLowerCase() === (def.fromClip || '').toLowerCase())
                  if (found) sourceClip = found
                  startSec = def.start !== undefined ? def.start : 0
                  endSec = def.end !== undefined ? def.end : sourceClip.duration
                }
                const sub = THREE.AnimationUtils.subclip(sourceClip, clipName, Math.round(startSec * fps), Math.round(endSec * fps), fps)
                actions[clipName] = mixer.clipAction(sub)
                actions[clipName.toUpperCase()] = mixer.clipAction(sub)
              })
            }

            gltf.animations.forEach((clip) => {
              actions[clip.name] = mixer.clipAction(clip)
              actions[clip.name.toUpperCase()] = mixer.clipAction(clip)
            })
          }

          this.weaponModels[key] = {
            scene: modelScene,
            mixer,
            actions,
            config,
            currentLoopAction: null,
            loaded: true
          }

          // If this is currently the active model, configure muzzle and start idle animation
          if (key === this.activeModelKey) {
            if (this.muzzleFlashMesh && config.muzzlePos) {
              this.muzzleFlashMesh.position.set(config.muzzlePos[0], config.muzzlePos[1], config.muzzlePos[2])
            }
            if (this.muzzleLight && config.muzzlePos) {
              this.muzzleLight.position.set(config.muzzlePos[0], config.muzzlePos[1], config.muzzlePos[2] - 0.05)
            }
            this.playWeaponAnimation(key, config.animMap.draw || config.animMap.idle, false, 1.2, () => {
              if (config.animMap.idle) this.playWeaponAnimation(key, config.animMap.idle, true, 1.0)
            })
          }
        },
        undefined,
        (error) => {
          console.warn(`Could not load weapon model [${key}]:`, error)
        }
      )
    })
  }

  setWeapon(weaponId) {
    this.currentWeaponId = weaponId
    let targetKey = 'ak74u'
    if (weaponId === 'knife' || weaponId === 'melee' || weaponId === 'cuchillo') {
      targetKey = 'knife'
    } else if (weaponId === 'sniper' || weaponId === 'awp' || weaponId === 'operator') {
      targetKey = 'sniper'
    } else if (weaponId === 'benelli_m4' || ['shotgun', 'judge', 'bucky', 'shorty'].includes(weaponId)) {
      targetKey = 'benelli_m4'
    } else if (weaponId === 'kriss_vector' || ['smg', 'spectre', 'stinger', 'classic', 'ghost', 'sheriff', 'frenzy'].includes(weaponId)) {
      targetKey = 'kriss_vector'
    } else if (weaponId === 'ak74u' || ['rifle', 'vandal', 'phantom', 'guardian', 'marshal', 'ares', 'odin'].includes(weaponId)) {
      targetKey = 'ak74u'
    }

    this.activeModelKey = targetKey

    // Switch visibility of loaded models
    Object.entries(this.weaponModels).forEach(([k, data]) => {
      if (data && data.scene) {
        data.scene.visible = (k === targetKey)
      }
    })

    const activeData = this.weaponModels[targetKey]
    if (activeData) {
      const cfg = activeData.config
      if (this.muzzleFlashMesh && cfg.muzzlePos) {
        this.muzzleFlashMesh.position.set(cfg.muzzlePos[0], cfg.muzzlePos[1], cfg.muzzlePos[2])
      }
      if (this.muzzleLight && cfg.muzzlePos) {
        this.muzzleLight.position.set(cfg.muzzlePos[0], cfg.muzzlePos[1], cfg.muzzlePos[2] - 0.05)
      }

      this.playWeaponAnimation(targetKey, cfg.animMap.draw || cfg.animMap.idle, false, 1.2, () => {
        if (cfg.animMap.idle) this.playWeaponAnimation(targetKey, cfg.animMap.idle, true, 1.0)
      })
    }
  }

  inspectWeapon() {
    const activeData = this.weaponModels[this.activeModelKey]
    if (!activeData) return
    const cfg = activeData.config
    const inspectAnim = cfg.animMap.inspect || cfg.animMap.draw
    if (inspectAnim) {
      this.playWeaponAnimation(this.activeModelKey, inspectAnim, false, 1.15, () => {
        if (cfg.animMap.idle) {
          this.playWeaponAnimation(this.activeModelKey, cfg.animMap.idle, true, 1.0)
        }
      })
    }
  }

  playWeaponAnimation(modelKey, animName, loop = false, timeScale = 1.0, onComplete = null) {
    const data = this.weaponModels[modelKey]
    if (!data || !data.mixer) return
    if (!animName || !data.actions[animName]) {
      if (onComplete) onComplete()
      return
    }

    const action = data.actions[animName]
    if (loop) {
      if (data.currentLoopAction === action && action.isRunning()) return
      if (data.currentLoopAction && data.currentLoopAction !== action) {
        data.currentLoopAction.fadeOut(0.2)
      }
      action.reset().fadeIn(0.2).setLoop(THREE.LoopRepeat).setEffectiveTimeScale(timeScale).play()
      data.currentLoopAction = action
    } else {
      action.reset().setLoop(THREE.LoopOnce, 1).setEffectiveTimeScale(timeScale)
      action.clampWhenFinished = true
      if (data.currentLoopAction) {
        action.crossFadeFrom(data.currentLoopAction, 0.06, true)
      }
      action.play()

      const onFinish = (e) => {
        if (e.action === action) {
          data.mixer.removeEventListener('finished', onFinish)
          if (onComplete) onComplete()
          if (data.currentLoopAction) {
            data.currentLoopAction.reset().fadeIn(0.15).play()
          }
        }
      }
      data.mixer.addEventListener('finished', onFinish)
    }
  }

  playAnimation(name, loop = false, timeScale = 1.0, onComplete = null) {
    this.playWeaponAnimation(this.activeModelKey, name, loop, timeScale, onComplete)
  }

  onCameraMove(movementX, movementY) {
    // Dynamic weapon sway
    this.swayX = Math.max(-0.05, Math.min(0.05, this.swayX - movementX * 0.0003))
    this.swayY = Math.max(-0.035, Math.min(0.035, this.swayY + movementY * 0.0003))
  }

  update(dt, isReloading, reloadProgress, isAiming = false, baseFov = 75, isSniper = false) {
    this.idleTimer += dt

    // Update all loaded GLTF Skeletal Animation Mixers
    Object.values(this.weaponModels).forEach((m) => {
      if (m.mixer) m.mixer.update(dt)
    })

    // Handle Reload Animation Transitions for active weapon
    const activeData = this.weaponModels[this.activeModelKey]
    if (activeData) {
      const cfg = activeData.config
      if (isReloading && !this.wasReloading) {
        const reloadAnim = cfg.animMap.reload
        if (reloadAnim) {
          this.playWeaponAnimation(this.activeModelKey, reloadAnim, false, 1.35, () => {
            if (cfg.holdPose) {
              this.playWeaponAnimation(this.activeModelKey, cfg.animMap.draw, false, 2.0)
            }
          })
        }
      } else if (!isReloading && this.wasReloading) {
        if (cfg.holdPose) {
          this.playWeaponAnimation(this.activeModelKey, cfg.animMap.draw, false, 2.0)
        } else if (cfg.animMap.idle) {
          this.playWeaponAnimation(this.activeModelKey, cfg.animMap.idle, true, 1.0)
        }
      }
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

    // Coordinates calibrated per active weapon model:
    const activeConfig = activeData?.config || WEAPON_MODELS.ak74u
    const hipBase = activeConfig.hipPos
    const adsBase = activeConfig.adsPos

    const hipX = hipBase[0] + this.swayX * 0.4 + idleBobX
    const hipY = hipBase[1] + this.swayY * 0.4 + idleBobY + this.recoil * 0.02
    const hipZ = hipBase[2] + this.recoil * 0.05

    const adsX = adsBase[0] + this.swayX * 0.04 + idleBobX
    const adsY = adsBase[1] + this.swayY * 0.04 + idleBobY + this.recoil * 0.005
    const adsZ = adsBase[2] + this.recoil * 0.01

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
    const isMelee = wep.isMelee || wep.category === 'Cuerpo a Cuerpo' || this.activeModelKey === 'knife'

    if (!isMelee) {
      if (shooter.ammo <= 0) return null
      shooter.ammo--
      soundManager.play(wep.sound || 'vandal')
    } else {
      soundManager.play('slash')
    }

    // Trigger Active Weapon Shoot / Slash Animation
    const activeConfig = this.weaponModels[this.activeModelKey]?.config
    if (activeConfig && activeConfig.animMap.shoot) {
      this.playWeaponAnimation(this.activeModelKey, activeConfig.animMap.shoot, false, isMelee ? 1.8 : 2.2, () => {
        if (activeConfig.holdPose) {
          this.playWeaponAnimation(this.activeModelKey, activeConfig.animMap.draw, false, 2.0)
        } else if (activeConfig.animMap.idle) {
          this.playWeaponAnimation(this.activeModelKey, activeConfig.animMap.idle, true, 1.0)
        }
      })
    }

    if (!isMelee) {
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
    }

    // 3D Raycasting
    const raycaster = new THREE.Raycaster()
    const origin = new THREE.Vector3(shooter.pos.x, shooter.pos.y, shooter.pos.z)
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation)

    // Spread (Zero spread in ADS = Pinpoint Laser Precision!)
    const baseSpread = shooter.isSilent ? 0 : (wep.spread || 0)
    const spreadVal = (isAiming || isMelee) ? 0.0 : baseSpread
    if (spreadVal > 0) {
      dir.x += (Math.random() - 0.5) * spreadVal
      dir.y += (Math.random() - 0.5) * spreadVal
      dir.normalize()
    }
    raycaster.set(origin, dir)

    // 1. Raycast against World Geometry (Walls, Obstacles, Platforms)
    let wallHitDist = isMelee ? (wep.range || 3.2) : (wep.range || 80)
    let wallHitPoint = null

    if (this.meshColliders && this.meshColliders.length > 0) {
      const wallIntersects = raycaster.intersectObjects(this.meshColliders, false)
      if (wallIntersects.length > 0) {
        wallHitDist = wallIntersects[0].distance
        wallHitPoint = wallIntersects[0].point
      }
    }

    // 2. Check Player/Bot targets (only if closer than the obstructing wall and within range)
    let closestHit = null
    let hitTarget = null
    let isHeadshot = false

    const maxReach = isMelee ? (wep.range || 3.2) : wallHitDist

    for (const target of targets) {
      if (!target.alive || target.team === shooter.team || target.id === shooter.id) continue
      const targetCenter = new THREE.Vector3(target.pos.x, target.pos.y - 0.2, target.pos.z)
      const distToRay = raycaster.ray.distanceToPoint(targetCenter)
      const hitRadius = isMelee ? (target.radius * 2.2) : (target.radius * 1.5)

      if (distToRay < hitRadius) {
        const distFromShooter = origin.distanceTo(targetCenter)
        if (distFromShooter <= maxReach && distFromShooter < wallHitDist) {
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

    if (!isMelee) {
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
    } else {
      if (closestHit) {
        this.spawnSparks(closestHit.pos, 0xef4444)
      } else if (wallHitPoint && wallHitDist <= maxReach) {
        this.spawnSparks(wallHitPoint, 0x94a3b8)
      }
    }

    if (hitTarget) {
      const rawDmg = isHeadshot ? wep.damage.head : wep.damage.body
      if (isHeadshot) soundManager.play('headshot')
      else soundManager.play('hit')

      const res = DamageSystem.applyDamage(hitTarget, rawDmg, isHeadshot, false, isMelee ? 'knife' : 'bullet')
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
