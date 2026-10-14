import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DamageSystem } from './DamageSystem.js'
import { soundManager } from './SoundSystem.js'

const WEAPON_MODELS = {
  classic: {
    path: '/models/armas/fps_character_animation_pack_pistol.glb',
    scale: [0.32, 0.32, 0.32],
    rotation: [0, Math.PI, 0],
    hideBodyMesh: true,
    hipPos: [0.04, -1.52, 0.04],
    adsPos: [-0.083, -1.49, 0.07],
    adsRot: [0.0, 0.0, 0.0],
    muzzlePos: [0.0, 1.49, -0.65],
    animMap: {
      draw: 'RIG_UE5_Comando_Equip',
      idle: 'RIG_UE5_Comando_Idle',
      shoot: 'RIG_UE5_Comando_Fire',
      reload: 'RIG_UE5_Comando_Reload',
      inspect: 'RIG_UE5_Comando_Equip'
    }
  },
  m4a1: {
    path: '/models/armas/m4_-_fps_weapon_animations_pack_v.1.glb',
    scale: [1, 1, 1],
    rotation: [0, Math.PI, 0],
    hideBodyMesh: false,
    hipPos: [0.04, -1.48, -0.16],
    adsPos: [0.035, -1.45, -0.12],
    adsRot: [0.0, 0.0, 0.0],
    muzzlePos: [0.0, 1.45, -0.75],
    subclips: {
      draw: { fromClip: 'Draw', start: 0.0, end: 1.033 },
      idle: { fromClip: 'Draw', start: 0.95, end: 1.033 },
      shoot: { fromClip: 'Fire', start: 0.0, end: 0.80 },
      reload: { fromClip: 'Reload', start: 0.0, end: 3.63 },
      inspect: { fromClip: 'Draw', start: 0.0, end: 1.033 }
    },
    animMap: {
      draw: 'draw',
      idle: 'idle',
      shoot: 'shoot',
      reload: 'reload',
      inspect: 'draw'
    }
  },
  ak74u: {
    path: '/models/armas/fps_character_animation_pack_ak-47.glb',
    scale: [1.08, 1.08, 1.08],
    rotation: [0, Math.PI, 0],
    hideBodyMesh: true,
    hipPos: [0.035, -1.68, -0.15],
    adsPos: [0.03, -1.65, -0.11],
    adsRot: [0.0, 0.0, 0.0],
    muzzlePos: [0.0, 1.62, -0.70],
    animMap: {
      draw: 'RIG_UE5_Comando_AK_Equip',
      idle: 'RIG_UE5_Comando_AK_Idle',
      shoot: 'RIG_UE5_Comando_AK_Fire',
      reload: 'RIG_UE5_Comando_AK_Reload',
      inspect: 'RIG_UE5_Comando_AK_Equip'
    }
  },
  benelli_m4: {
    path: '/models/armas/fps_character_animation_pack_saps-12.glb',
    scale: [0.46, 0.46, 0.46],
    rotation: [0, Math.PI, 0],
    hideBodyMesh: true,
    hipPos: [0.035, -1.68, -0.15],
    adsPos: [0.03, -1.65, -0.11],
    adsRot: [0.0, 0.0, 0.0],
    muzzlePos: [0.0, 1.62, -0.70],
    animMap: {
      draw: 'RIG_UE5_Comando_Equip',
      idle: 'RIG_UE5_Comando_Idle',
      shoot: 'RIG_UE5_Comando_Fire',
      reload: 'RIG_UE5_Comando_Reload',
      inspect: 'RIG_UE5_Comando_Equip'
    }
  },
  kriss_vector: {
    path: '/models/armas/kriss_vector_animated_free.glb',
    scale: [0.009, 0.009, 0.009],
    rotation: [0, Math.PI, 0],
    hideBodyMesh: true,
    hipPos: [0.03, -1.42, -0.38],
    adsPos: [0.025, -1.39, -0.34],
    adsRot: [0.0, 0.0, 0.0],
    muzzlePos: [0.0, 1.39, -0.65],
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
      inspect: 'draw'
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
      inspect: [1.0, 3.5]
    },
    animMap: {
      draw: 'draw',
      idle: 'idle',
      shoot: 'shoot',
      reload: 'reload',
      inspect: 'draw'
    }
  },
  knife: {
    path: '/models/armas/fps_butterfly_knife.glb',
    scale: [1.05, 1.05, 1.05],
    hideBodyMesh: true,
    hipPos: [0.05, 0.06, -0.18],
    adsPos: [0.05, 0.06, -0.18],
    muzzlePos: [0.0, 0.0, -0.5],
    isMelee: true,
    subclips: {
      draw: [0.0, 1.4],
      idle: [1.8, 7.0],
      shoot: [8.3, 10.5],
      inspect: [11.0, 22.8]
    },
    animMap: {
      draw: 'draw',
      idle: 'idle',
      shoot: 'shoot',
      inspect: 'inspect'
    }
  }
}

/**
 * Safely slices an AnimationClip into a subclip, preserving ALL tracks from the source clip.
 * THREE.AnimationUtils.subclip drops tracks that do not have keyframes in the specified range.
 * For complex models (like rigs with multi-armature weapons or bones with static poses),
 * dropping tracks causes bones to snap to default bind pose.
 * safeSubclip retains any dropped track by sampling its value at startSec and writing a static hold.
 */
function safeSubclip(sourceClip, name, startSec, endSec, fps = 30) {
  const startFrame = Math.round(startSec * fps)
  const endFrame = Math.round(endSec * fps)
  const sub = THREE.AnimationUtils.subclip(sourceClip, name, startFrame, endFrame, fps)
  const duration = Math.max(0.01, endSec - startSec)

  const subTrackNames = new Set(sub.tracks.map(t => t.name))
  sourceClip.tracks.forEach(track => {
    if (!subTrackNames.has(track.name)) {
      const itemSize = track.getValueSize()
      const times = track.times
      const values = track.values

      let valIndex = 0
      for (let i = 0; i < times.length; i++) {
        if (times[i] <= startSec) {
          valIndex = i
        } else {
          break
        }
      }

      const sampleVal = values.slice(valIndex * itemSize, (valIndex + 1) * itemSize)
      if (sampleVal.length === itemSize) {
        const TrackConstructor = track.constructor
        const newTrack = new TrackConstructor(
          track.name,
          [0, duration],
          [...sampleVal, ...sampleVal]
        )
        sub.tracks.push(newTrack)
      }
    }
  })

  return sub
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
    this.inspectTimer = 0

    this.initMuzzleEffects()
    this.initProceduralWeaponRig()
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

  initProceduralWeaponRig() {
    this.procWeaponGroup = new THREE.Group()
    this.gunGroup.add(this.procWeaponGroup)

    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.5,
      metalness: 0.35
    })
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.8,
      metalness: 0.15
    })
    const gunMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.28,
      metalness: 0.85
    })
    const gunTrimMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.35,
      metalness: 0.6
    })
    const gunSteelMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.2,
      metalness: 0.95
    })
    const tritiumMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e
    })
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xef4444
    })
    const opticGlassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.9
    })
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.1,
      metalness: 0.98
    })

    this.procVariants = {}

    // 1. PROCEDURAL PISTOL (Classic / Sidearm)
    const pistolGroup = new THREE.Group()
    pistolGroup.position.set(0.04, 1.49, -0.45)

    const pArmGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.45, 8)
    pArmGeo.rotateX(0.9)
    pArmGeo.rotateY(-0.35)
    const pArm = new THREE.Mesh(pArmGeo, sleeveMat)
    pArm.position.set(0.12, -0.22, 0.15)
    pistolGroup.add(pArm)

    const pGloveGeo = new THREE.BoxGeometry(0.065, 0.08, 0.10)
    pGloveGeo.rotateX(0.2)
    const pGlove = new THREE.Mesh(pGloveGeo, gloveMat)
    pGlove.position.set(0.02, -0.06, 0.02)
    pistolGroup.add(pGlove)

    const pFrameGeo = new THREE.BoxGeometry(0.034, 0.055, 0.20)
    const pFrame = new THREE.Mesh(pFrameGeo, gunTrimMat)
    pFrame.position.set(0, 0, -0.02)
    pistolGroup.add(pFrame)

    const pGripGeo = new THREE.BoxGeometry(0.032, 0.12, 0.06)
    pGripGeo.rotateX(-0.35)
    const pGrip = new THREE.Mesh(pGripGeo, gunTrimMat)
    pGrip.position.set(0, -0.075, 0.04)
    pistolGroup.add(pGrip)

    const pSlideGroup = new THREE.Group()
    const pSlideGeo = new THREE.BoxGeometry(0.034, 0.042, 0.22)
    const pSlide = new THREE.Mesh(pSlideGeo, gunMetalMat)
    pSlide.position.set(0, 0.038, -0.03)
    pSlideGroup.add(pSlide)

    const pBarrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8)
    pBarrelGeo.rotateX(Math.PI / 2)
    const pBarrel = new THREE.Mesh(pBarrelGeo, gunSteelMat)
    pBarrel.position.set(0, 0.038, -0.15)
    pSlideGroup.add(pBarrel)

    const rearDotL = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, 0.004), tritiumMat)
    rearDotL.position.set(-0.01, 0.062, 0.075)
    pSlideGroup.add(rearDotL)

    const rearDotR = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, 0.004), tritiumMat)
    rearDotR.position.set(0.01, 0.062, 0.075)
    pSlideGroup.add(rearDotR)

    const frontDot = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.007, 0.004), tritiumMat)
    frontDot.position.set(0, 0.063, -0.13)
    pSlideGroup.add(frontDot)

    pistolGroup.add(pSlideGroup)
    this.procVariants.classic = { group: pistolGroup, slide: pSlideGroup }
    this.procWeaponGroup.add(pistolGroup)

    // 2. PROCEDURAL ASSAULT RIFLE (AK74U / M4A1)
    const rifleGroup = new THREE.Group()
    rifleGroup.position.set(0.035, 1.62, -0.45)

    const rArmRG = new THREE.CylinderGeometry(0.045, 0.055, 0.45, 8)
    rArmRG.rotateX(0.85)
    rArmRG.rotateY(-0.35)
    const rArmR = new THREE.Mesh(rArmRG, sleeveMat)
    rArmR.position.set(0.14, -0.22, 0.15)
    rifleGroup.add(rArmR)

    const rGloveR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.11), gloveMat)
    rGloveR.position.set(0.03, -0.06, 0.04)
    rifleGroup.add(rGloveR)

    const rArmLG = new THREE.CylinderGeometry(0.045, 0.055, 0.48, 8)
    rArmLG.rotateX(0.8)
    rArmLG.rotateY(0.45)
    const rArmL = new THREE.Mesh(rArmLG, sleeveMat)
    rArmL.position.set(-0.16, -0.24, 0.02)
    rifleGroup.add(rArmL)

    const rGloveL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.10), gloveMat)
    rGloveL.position.set(-0.02, -0.06, -0.18)
    rifleGroup.add(rGloveL)

    const rBodyGeo = new THREE.BoxGeometry(0.052, 0.09, 0.36)
    const rBody = new THREE.Mesh(rBodyGeo, gunMetalMat)
    rBody.position.set(0, 0, -0.04)
    rifleGroup.add(rBody)

    const rGuardGeo = new THREE.BoxGeometry(0.048, 0.075, 0.24)
    const rGuard = new THREE.Mesh(rGuardGeo, gunTrimMat)
    rGuard.position.set(0, 0, -0.30)
    rifleGroup.add(rGuard)

    const rBarrelGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8)
    rBarrelGeo.rotateX(Math.PI / 2)
    const rBarrel = new THREE.Mesh(rBarrelGeo, gunSteelMat)
    rBarrel.position.set(0, 0.015, -0.48)
    rifleGroup.add(rBarrel)

    const rMuzzleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.07, 8)
    rMuzzleGeo.rotateX(Math.PI / 2)
    const rMuzzle = new THREE.Mesh(rMuzzleGeo, gunTrimMat)
    rMuzzle.position.set(0, 0.015, -0.60)
    rifleGroup.add(rMuzzle)

    const rMagGeo = new THREE.BoxGeometry(0.038, 0.18, 0.08)
    rMagGeo.rotateX(-0.25)
    const rMag = new THREE.Mesh(rMagGeo, gunTrimMat)
    rMag.position.set(0, -0.12, -0.10)
    rifleGroup.add(rMag)

    const rOpticGeo = new THREE.BoxGeometry(0.044, 0.055, 0.11)
    const rOptic = new THREE.Mesh(rOpticGeo, gunTrimMat)
    rOptic.position.set(0, 0.072, -0.06)
    rifleGroup.add(rOptic)

    const rLensGeo = new THREE.BoxGeometry(0.036, 0.038, 0.005)
    const rLens = new THREE.Mesh(rLensGeo, opticGlassMat)
    rLens.position.set(0, 0.076, -0.06)
    rifleGroup.add(rLens)

    const rDotGeo = new THREE.SphereGeometry(0.0035, 8, 8)
    const rDot = new THREE.Mesh(rDotGeo, reticleMat)
    rDot.position.set(0, 0.076, -0.06)
    rifleGroup.add(rDot)

    const rStockGeo = new THREE.BoxGeometry(0.045, 0.08, 0.20)
    const rStock = new THREE.Mesh(rStockGeo, gunTrimMat)
    rStock.position.set(0, -0.01, 0.22)
    rifleGroup.add(rStock)

    this.procVariants.ak74u = { group: rifleGroup }
    this.procVariants.m4a1 = { group: rifleGroup }
    this.procWeaponGroup.add(rifleGroup)

    // 3. PROCEDURAL SMG (Kriss Vector)
    const smgGroup = new THREE.Group()
    smgGroup.position.set(0.03, 1.39, -0.42)

    const smgArmR = new THREE.Mesh(pArmGeo, sleeveMat)
    smgArmR.position.set(0.12, -0.22, 0.15)
    smgGroup.add(smgArmR)

    const smgGloveR = new THREE.Mesh(pGloveGeo, gloveMat)
    smgGloveR.position.set(0.02, -0.06, 0.02)
    smgGroup.add(smgGloveR)

    const smgBody = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.14, 0.30), gunMetalMat)
    smgBody.position.set(0, 0, -0.04)
    smgGroup.add(smgBody)

    const smgForegrip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.10, 0.045), gunTrimMat)
    smgForegrip.rotation.x = -0.3
    smgForegrip.position.set(0, -0.08, -0.14)
    smgGroup.add(smgForegrip)

    const smgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8), gunTrimMat)
    smgBarrel.rotateX(Math.PI / 2)
    smgBarrel.position.set(0, 0.03, -0.24)
    smgGroup.add(smgBarrel)

    const smgSight = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.045, 0.08), gunTrimMat)
    smgSight.position.set(0, 0.088, -0.05)
    smgGroup.add(smgSight)

    const smgDot = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 8), reticleMat)
    smgDot.position.set(0, 0.088, -0.05)
    smgGroup.add(smgDot)

    this.procVariants.kriss_vector = { group: smgGroup }
    this.procWeaponGroup.add(smgGroup)

    // 4. PROCEDURAL SHOTGUN (Benelli M4)
    const shotGroup = new THREE.Group()
    shotGroup.position.set(0.035, 1.62, -0.45)

    const shotArmR = new THREE.Mesh(rArmRG, sleeveMat)
    shotArmR.position.set(0.14, -0.22, 0.15)
    shotGroup.add(shotArmR)
    shotGroup.add(rGloveR.clone())

    const shotArmL = new THREE.Mesh(rArmLG, sleeveMat)
    shotArmL.position.set(-0.16, -0.24, 0.02)
    shotGroup.add(shotArmL)
    shotGroup.add(rGloveL.clone())

    const shotBody = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, 0.32), gunMetalMat)
    shotBody.position.set(0, 0, -0.02)
    shotGroup.add(shotBody)

    const pumpGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.22, 12)
    pumpGeo.rotateX(Math.PI / 2)
    const pump = new THREE.Mesh(pumpGeo, gunTrimMat)
    pump.position.set(0, -0.03, -0.26)
    shotGroup.add(pump)

    const shotBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.36, 12), gunSteelMat)
    shotBarrel.rotateX(Math.PI / 2)
    shotBarrel.position.set(0, 0.025, -0.38)
    shotGroup.add(shotBarrel)

    const shotTube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.30, 8), gunTrimMat)
    shotTube.rotateX(Math.PI / 2)
    shotTube.position.set(0, -0.025, -0.35)
    shotGroup.add(shotTube)

    const shotStock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.22), gunTrimMat)
    shotStock.position.set(0, -0.02, 0.22)
    shotGroup.add(shotStock)

    this.procVariants.benelli_m4 = { group: shotGroup }
    this.procWeaponGroup.add(shotGroup)

    // 5. PROCEDURAL SNIPER RIFLE (Operator)
    const sniperGroup = new THREE.Group()
    sniperGroup.position.set(-0.065, 0.05, -0.55)

    const snipBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.42), gunMetalMat)
    snipBody.position.set(0, 0, 0)
    sniperGroup.add(snipBody)

    const snipBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 12), gunSteelMat)
    snipBarrel.rotateX(Math.PI / 2)
    snipBarrel.position.set(0, 0.025, -0.50)
    sniperGroup.add(snipBarrel)

    const snipBrake = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.10), gunTrimMat)
    snipBrake.position.set(0, 0.025, -0.84)
    sniperGroup.add(snipBrake)

    const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.32, 16), gunTrimMat)
    scopeTube.rotateX(Math.PI / 2)
    scopeTube.position.set(0, 0.095, -0.04)
    sniperGroup.add(scopeTube)

    const scopeLensF = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.005, 16), opticGlassMat)
    scopeLensF.rotateX(Math.PI / 2)
    scopeLensF.position.set(0, 0.095, -0.20)
    sniperGroup.add(scopeLensF)

    const snipStock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.28), gunTrimMat)
    snipStock.position.set(0, -0.02, 0.32)
    sniperGroup.add(snipStock)

    this.procVariants.sniper = { group: sniperGroup }
    this.procWeaponGroup.add(sniperGroup)

    // 6. PROCEDURAL TACTICAL COMBAT KNIFE
    const knifeGroup = new THREE.Group()
    knifeGroup.position.set(0.05, 0.06, -0.25)

    const kArm = new THREE.Mesh(pArmGeo, sleeveMat)
    kArm.position.set(0.10, -0.18, 0.12)
    knifeGroup.add(kArm)

    const kGlove = new THREE.Mesh(pGloveGeo, gloveMat)
    kGlove.position.set(0.02, -0.04, 0.02)
    knifeGroup.add(kGlove)

    const kHandle = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.04, 0.14), gunTrimMat)
    kHandle.position.set(0, 0, 0)
    knifeGroup.add(kHandle)

    const kGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.015, 12), gunSteelMat)
    kGuard.position.set(0, 0, -0.08)
    knifeGroup.add(kGuard)

    const bladeGeo = new THREE.BoxGeometry(0.008, 0.042, 0.18)
    const blade = new THREE.Mesh(bladeGeo, bladeMat)
    blade.position.set(0, 0.01, -0.17)
    blade.rotation.x = -0.15
    knifeGroup.add(blade)

    this.procVariants.knife = { group: knifeGroup }
    this.procWeaponGroup.add(knifeGroup)

    this.updateProceduralActiveVariant(this.activeModelKey)
  }

  updateProceduralActiveVariant(key) {
    if (!this.procVariants) return
    let matchedKey = key
    if (key === 'm4a1' || key === 'ak74u') matchedKey = 'ak74u'
    Object.entries(this.procVariants).forEach(([vKey, data]) => {
      if (data && data.group) {
        data.group.visible = (vKey === matchedKey || (matchedKey === 'ak74u' && (vKey === 'ak74u' || vKey === 'm4a1')))
      }
    })
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

              // Protect weapon and glove meshes
              const isGunOrGlove = (
                meshName.includes('weapon') ||
                meshName.includes('pistol') ||
                meshName.includes('glove') ||
                meshName.includes('case') ||
                meshName.includes('cargador') ||
                meshName.includes('ak') ||
                meshName.includes('saps') ||
                meshName.includes('spas') ||
                meshName.includes('balisong') ||
                meshName.includes('knife') ||
                child.name === 'Object_65' ||
                child.name === 'Object_79' ||
                child.name === 'Object_124' ||
                child.name === 'Object_12' ||
                child.name === 'Object_20' ||
                child.name === 'Object_27' ||
                child.name === 'Object_28' ||
                child.name === 'Object_25' ||
                child.name === 'Object_14' ||
                child.name === 'Object_15' ||
                child.name === 'Object_17' ||
                child.name === 'Object_18'
              )

              if (
                config.hideBodyMesh && !isGunOrGlove && (
                  meshName.includes('body') ||
                  meshName.includes('sleeve') ||
                  meshName.includes('shirt') ||
                  meshName.includes('torso') ||
                  child.name === 'Object_57' ||
                  child.name === 'Object_13' ||
                  child.name === 'Object_26' ||
                  child.name === 'Object_28' ||
                  matName === 'sleeve_st6_generalist' ||
                  matName.includes('shirt')
                )
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

            // If subclips are configured, slice them safely preserving all bone tracks
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
                const sub = safeSubclip(sourceClip, clipName, startSec, endSec, fps)
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
    let targetKey = 'm4a1'
    if (weaponId === 'knife' || weaponId === 'melee' || weaponId === 'cuchillo') {
      targetKey = 'knife'
    } else if (weaponId === 'sniper' || weaponId === 'awp' || weaponId === 'operator') {
      targetKey = 'sniper'
    } else if (weaponId === 'benelli_m4' || ['shotgun', 'judge', 'bucky', 'shorty'].includes(weaponId)) {
      targetKey = 'benelli_m4'
    } else if (weaponId === 'classic' || ['pistol', 'pistola', 'ghost', 'sheriff', 'frenzy'].includes(weaponId)) {
      targetKey = 'classic'
    } else if (weaponId === 'kriss_vector' || ['smg', 'spectre', 'stinger'].includes(weaponId)) {
      targetKey = 'kriss_vector'
    } else if (weaponId === 'm4a1' || weaponId === 'm4' || weaponId === 'carabina') {
      targetKey = 'm4a1'
    } else if (weaponId === 'ak74u' || ['rifle', 'vandal', 'phantom', 'guardian', 'marshal', 'ares', 'odin'].includes(weaponId)) {
      targetKey = 'ak74u'
    }

    this.activeModelKey = targetKey
    this.updateProceduralActiveVariant(targetKey)

    // Switch visibility of loaded models
    Object.entries(this.weaponModels).forEach(([k, data]) => {
      if (data && data.scene) {
        data.scene.visible = (k === targetKey)
      }
    })

    const activeData = this.weaponModels[targetKey]
    const cfg = activeData?.config || WEAPON_MODELS[targetKey]
    if (this.muzzleFlashMesh && cfg?.muzzlePos) {
      this.muzzleFlashMesh.position.set(cfg.muzzlePos[0], cfg.muzzlePos[1], cfg.muzzlePos[2])
    }
    if (this.muzzleLight && cfg?.muzzlePos) {
      this.muzzleLight.position.set(cfg.muzzlePos[0], cfg.muzzlePos[1], cfg.muzzlePos[2] - 0.05)
    }

    if (activeData && cfg?.animMap) {
      this.playWeaponAnimation(targetKey, cfg.animMap.draw || cfg.animMap.idle, false, 1.2, () => {
        if (cfg.animMap.idle) this.playWeaponAnimation(targetKey, cfg.animMap.idle, true, 1.0)
      })
    }
  }

  inspectWeapon() {
    const activeData = this.weaponModels[this.activeModelKey]
    if (!activeData) return
    const cfg = activeData.config
    this.inspectTimer = cfg.isMelee ? 11.8 : 2.4
    const inspectAnim = cfg.animMap.inspect || cfg.animMap.draw
    if (inspectAnim) {
      this.playWeaponAnimation(this.activeModelKey, inspectAnim, false, 1.0, () => {
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
      // Cleanly stop any existing one-shot action so animations don't conflict
      if (data.currentOneShotAction && data.currentOneShotAction !== action) {
        data.currentOneShotAction.stop()
      }
      data.currentOneShotAction = action

      action.reset().setLoop(THREE.LoopOnce, 1).setEffectiveTimeScale(timeScale)
      action.clampWhenFinished = true
      if (data.currentLoopAction) {
        action.crossFadeFrom(data.currentLoopAction, 0.08, true)
      }
      action.play()

      let completed = false
      const onFinish = (e) => {
        if (e.action === action && !completed) {
          completed = true
          data.mixer.removeEventListener('finished', onFinish)
          data.currentOneShotAction = null
          action.fadeOut(0.15)
          if (onComplete) {
            onComplete()
          } else if (data.currentLoopAction) {
            data.currentLoopAction.reset().fadeIn(0.15).play()
          }
        }
      }
      data.mixer.addEventListener('finished', onFinish)

      // Fallback timer in case clip finishes without event
      const clipDuration = ((action.getClip()?.duration || 1.5) / timeScale) * 1000
      setTimeout(() => {
        if (!completed) {
          completed = true
          data.mixer.removeEventListener('finished', onFinish)
          data.currentOneShotAction = null
          action.fadeOut(0.15)
          if (onComplete) {
            onComplete()
          } else if (data.currentLoopAction) {
            data.currentLoopAction.reset().fadeIn(0.15).play()
          }
        }
      }, Math.round(clipDuration) + 120)
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

  update(dt, isReloading, reloadProgress, isAiming = false, baseFov = 75, isSniper = false, expectedReloadDuration = 2.8) {
    this.idleTimer += dt

    // Update all loaded GLTF Skeletal Animation Mixers
    Object.values(this.weaponModels).forEach((m) => {
      if (m.mixer) m.mixer.update(dt)
    })

    // Cancel inspect when aiming or reloading
    if (isAiming || isReloading) {
      this.inspectTimer = 0
    } else if (this.inspectTimer > 0) {
      this.inspectTimer = Math.max(0, this.inspectTimer - dt)
    }

    // Handle Reload Animation Transitions for active weapon
    const activeData = this.weaponModels[this.activeModelKey]
    if (activeData) {
      const cfg = activeData.config
      if (isReloading && !this.wasReloading) {
        const reloadAnim = cfg.animMap.reload
        if (reloadAnim && activeData.actions[reloadAnim]) {
          const action = activeData.actions[reloadAnim]
          const clip = action.getClip()
          const clipDuration = clip ? clip.duration : 3.0
          const targetDuration = expectedReloadDuration || 2.8
          // Calculate exact timeScale so the animation plays completely from 0% to 100% without being cut off
          const dynamicTimeScale = Math.max(0.6, clipDuration / targetDuration)
          this.playWeaponAnimation(this.activeModelKey, reloadAnim, false, dynamicTimeScale, () => {
            if (cfg.animMap.idle) {
              this.playWeaponAnimation(this.activeModelKey, cfg.animMap.idle, true, 1.0)
            }
          })
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
    const adsBaseRot = activeConfig.adsRot || [0, 0, 0]

    // Procedural weapon inspect 3D rotation curve (smooth bell curve) - only for firearms without full inspect animations
    let inspectTiltX = 0
    let inspectTiltY = 0
    let inspectTiltZ = 0
    if (this.inspectTimer > 0 && !isAiming && !isReloading && !activeConfig?.isMelee) {
      const t = Math.max(0, this.inspectTimer / 2.4)
      const curve = Math.sin(t * Math.PI)
      inspectTiltX = -0.05 * curve
      inspectTiltY = 0.16 * curve
      inspectTiltZ = 0.12 * curve
    }

    const hipX = hipBase[0] + this.swayX * 0.4 + idleBobX
    const hipY = hipBase[1] + this.swayY * 0.4 + idleBobY + this.recoil * 0.02
    const hipZ = hipBase[2] + this.recoil * 0.05

    const adsX = adsBase[0] + this.swayX * 0.04 + idleBobX
    const adsY = adsBase[1] + this.swayY * 0.04 + idleBobY + this.recoil * 0.005
    const adsZ = adsBase[2] + this.recoil * 0.01

    this.gunGroup.position.x = THREE.MathUtils.lerp(hipX, adsX, this.adsProgress)
    this.gunGroup.position.y = THREE.MathUtils.lerp(hipY, adsY, this.adsProgress)
    this.gunGroup.position.z = THREE.MathUtils.lerp(hipZ, adsZ, this.adsProgress)

    // Rotation interpolation for realistic handling + inspect tilt
    const hipRotX = this.recoil * 0.12 - this.swayY * 0.8 + inspectTiltX
    const hipRotY = (Math.random() - 0.5) * this.recoil * 0.02 + this.swayX * 1.0 + inspectTiltY
    const hipRotZ = -this.swayX * 0.8 + inspectTiltZ

    const adsRotX = adsBaseRot[0] + this.recoil * 0.02 - this.swayY * 0.08
    const adsRotY = adsBaseRot[1] + this.swayX * 0.08
    const adsRotZ = adsBaseRot[2]

    this.gunGroup.rotation.x = THREE.MathUtils.lerp(hipRotX, adsRotX, this.adsProgress)
    this.gunGroup.rotation.y = THREE.MathUtils.lerp(hipRotY, adsRotY, this.adsProgress)
    this.gunGroup.rotation.z = THREE.MathUtils.lerp(hipRotZ, adsRotZ, this.adsProgress)

    // In full sniper scope, hide the gun model to show full scope reticle
    if (isSniper && this.adsProgress > 0.85) {
      this.gunGroup.visible = false
    } else {
      this.gunGroup.visible = true
    }

    // Seamless toggle between loaded GLTF model and Procedural First-Person Weapon
    const gltfLoaded = !!(activeData && activeData.loaded && activeData.scene)
    if (gltfLoaded) {
      if (this.procWeaponGroup) this.procWeaponGroup.visible = false
      activeData.scene.visible = true
    } else {
      if (this.procWeaponGroup) {
        this.procWeaponGroup.visible = true
        this.updateProceduralActiveVariant(this.activeModelKey)

        // Procedural slide kickback from recoil
        const activeVariant = this.procVariants?.[this.activeModelKey]
        if (activeVariant?.slide) {
          activeVariant.slide.position.z = -0.03 + this.recoil * 0.05
        }

        // Procedural reload movement
        if (isReloading) {
          const reloadCycle = Math.sin((reloadProgress || 0) * Math.PI)
          this.procWeaponGroup.position.y = -0.08 * reloadCycle
          this.procWeaponGroup.rotation.x = -0.25 * reloadCycle
        } else {
          this.procWeaponGroup.position.y = 0
          this.procWeaponGroup.rotation.x = 0
        }
      }
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
      // Recoil kick & Visual Muzzle Flash (reduced in ADS and when Crouching for superior precision)
      const crouchRecoilMult = shooter.crouching ? 0.65 : 1.0
      const recoilKick = (wep.recoil || 0.35) * (isAiming ? 0.25 : 1.0) * crouchRecoilMult
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

    // Spread (Zero spread in ADS, significantly reduced when crouching)
    const crouchSpreadMult = shooter.crouching ? 0.45 : 1.0
    const baseSpread = shooter.isSilent ? 0 : ((wep.spread || 0) * crouchSpreadMult)
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
    let isLegshot = false

    const maxReach = isMelee ? (wep.range || 3.2) : wallHitDist

    for (const target of targets) {
      if (!target.alive || target.team === shooter.team || target.id === shooter.id) continue

      const eyeH = target.crouching ? 1.1 : 1.7
      const feetY = Math.max(0, (target.pos.y !== undefined ? target.pos.y : 1.7) - eyeH)
      const headY = (target.pos.y !== undefined ? target.pos.y : 1.7)

      // Test vertical player capsule segment from feet to head
      const segP0 = new THREE.Vector3(target.pos.x, feetY + 0.15, target.pos.z)
      const segP1 = new THREE.Vector3(target.pos.x, headY + 0.05, target.pos.z)
      const segDir = segP1.clone().sub(segP0)
      const segLen = segDir.length()
      segDir.normalize()

      let distToBody = 999
      let bestHitY = (feetY + headY) / 2

      // Step along vertical body column to find closest distance to shooting ray
      const stepCount = 8
      for (let s = 0; s <= stepCount; s++) {
        const pt = segP0.clone().addScaledVector(segDir, (s / stepCount) * segLen)
        const d = raycaster.ray.distanceToPoint(pt)
        if (d < distToBody) {
          distToBody = d
          bestHitY = pt.y
        }
      }

      // Precise Head Hitbox Sphere (Radius 0.18m centered on head)
      const headCenter = new THREE.Vector3(target.pos.x, headY - 0.08, target.pos.z)
      const distToHead = raycaster.ray.distanceToPoint(headCenter)

      // Precise Body Cylinder Hitbox (Radius 0.30m standing, 0.35m crouching)
      const bodyRadius = target.crouching ? 0.35 : 0.30
      const hitThreshold = isMelee ? 0.65 : bodyRadius

      const isHeadHit = distToHead <= 0.18
      const isBodyHit = distToBody <= hitThreshold
      const isLegHit = !isHeadHit && (bestHitY < feetY + 0.65)

      if (isHeadHit || isBodyHit) {
        const hitPosition = isHeadHit ? headCenter : new THREE.Vector3(target.pos.x, bestHitY, target.pos.z)
        const distFromShooter = origin.distanceTo(hitPosition)

        if (distFromShooter <= maxReach && distFromShooter < wallHitDist) {
          if (!closestHit || distFromShooter < closestHit.dist) {
            closestHit = { dist: distFromShooter, pos: hitPosition }
            hitTarget = target
            isHeadshot = isHeadHit
            isLegshot = isLegHit
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
      let rawDmg = wep.damage.body
      if (isHeadshot) {
        rawDmg = wep.damage.head
      } else if (isLegshot && wep.damage.leg) {
        rawDmg = wep.damage.leg
      }

      if (isHeadshot) soundManager.play('headshot')
      else soundManager.play('hit')

      const res = DamageSystem.applyDamage(hitTarget, rawDmg, isHeadshot, isLegshot, isMelee ? 'knife' : 'bullet')
      if (onHitCallback) onHitCallback(hitTarget, isHeadshot, rawDmg, res.killed)
      return { hit: true, target: hitTarget, headshot: isHeadshot, legshot: isLegshot, damageDealt: rawDmg, killed: res.killed }
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
