// src/games/Valorant3D2/systems/PlayerController3D.js
import * as THREE from 'three'

export class PlayerController3D {
  constructor(camera, scene, domElement) {
    this.camera = camera
    this.scene = scene
    this.domElement = domElement

    this.position = new THREE.Vector3(-22, 1.7, 0)
    this.velocity = new THREE.Vector3()
    this.yaw = Math.PI / 2
    this.pitch = 0

    this.radius = 0.6
    this.eyeHeight = 1.7
    this.crouchEyeHeight = 1.1
    this.currentEyeHeight = 1.7

    this.isCrouching = false
    this.onGround = true
    this.isLocked = false

    this.walkSpeed = 5.8
    this.silentSpeed = 2.9
    this.crouchSpeed = 2.2
    this.jumpForce = 7.0
    this.gravity = -19.8

    this.mouseSensitivity = 0.0022
    this.gunRecoil = 0
    this.walkBobTimer = 0

    this.colliders = []
    this.meshColliders = []
    this.currentFloorY = 0
    this.maxStepHeight = 0.75
    this.groundRaycaster = new THREE.Raycaster()
  }

  setColliders(colliders) {
    this.colliders = colliders
  }

  setMeshColliders(meshList) {
    this.meshColliders = meshList
  }

  probeGround(x, z) {
    if (!this.meshColliders || this.meshColliders.length === 0) return 0

    // Cast downward ray from high above (Y = 16.0) to sample all terrain/stair/platform levels
    const probeOrigin = new THREE.Vector3(x, 16.0, z)
    const down = new THREE.Vector3(0, -1, 0)
    this.groundRaycaster.set(probeOrigin, down)
    this.groundRaycaster.far = 32.0

    const hits = this.groundRaycaster.intersectObjects(this.meshColliders, false)
    let bestGroundY = 0

    if (hits.length > 0) {
      const maxAllowedY = this.position.y - this.currentEyeHeight + this.maxStepHeight + 0.25
      for (const hit of hits) {
        const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0)
        normal.applyQuaternion(hit.object.getWorldQuaternion(new THREE.Quaternion()))
        // Walkable ground, stair tread, or platform (normal pointing upward)
        if (normal.y > 0.35 && hit.point.y <= maxAllowedY) {
          if (hit.point.y > bestGroundY) {
            bestGroundY = hit.point.y
          }
        }
      }
    }
    return Math.max(0, bestGroundY)
  }

  onMouseMove(movementX, movementY) {
    if (!this.isLocked) return
    this.yaw -= movementX * this.mouseSensitivity
    this.pitch -= movementY * this.mouseSensitivity
    this.pitch = Math.max(-Math.PI / 2.15, Math.min(Math.PI / 2.15, this.pitch))
  }

  update(dt, keys, isSlowed = false, isStimmed = false, isThirdPerson = false) {
    // 1. Update Camera Rotation (Yaw/Pitch)
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.yaw
    this.camera.rotation.x = this.pitch

    // 2. Pure Horizontal Motion Vector on XZ Plane (Independent of Camera Pitch)
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)

    let moveX = 0
    let moveZ = 0

    if (keys['KeyW']) { moveX += forward.x; moveZ += forward.z }
    if (keys['KeyS']) { moveX -= forward.x; moveZ -= forward.z }
    if (keys['KeyA']) { moveX -= right.x; moveZ -= right.z }
    if (keys['KeyD']) { moveX += right.x; moveZ += right.z }

    this.isCrouching = !!keys['ControlLeft'] || !!keys['ControlRight'] || !!keys['KeyC'] || !!keys['KeyC_crouch']
    const isSilent = !!keys['ShiftLeft'] || !!keys['ShiftRight']

    let targetSpeed = this.walkSpeed
    if (this.isCrouching) targetSpeed = this.crouchSpeed
    else if (isSilent) targetSpeed = this.silentSpeed

    if (isSlowed) targetSpeed *= 0.5
    if (isStimmed) targetSpeed *= 1.2

    const len = Math.hypot(moveX, moveZ)
    let moveDirX = 0
    let moveDirZ = 0

    if (len > 0) {
      moveDirX = moveX / len
      moveDirZ = moveZ / len
      this.velocity.x = moveDirX * targetSpeed
      this.velocity.z = moveDirZ * targetSpeed
      this.walkBobTimer += dt * 10
    } else {
      this.velocity.x *= 0.65
      this.velocity.z *= 0.65
    }

    // 3. Jump and Gravity
    if (keys['Space'] && this.onGround && !this.isCrouching) {
      this.velocity.y = this.jumpForce
      this.onGround = false
    }

    this.velocity.y += this.gravity * dt

    // 4. Look-Ahead Stair / Ramp Ground Height Detection
    const nextX = this.position.x + this.velocity.x * dt
    const nextZ = this.position.z + this.velocity.z * dt
    const nextY = this.position.y + this.velocity.y * dt

    const currentFeetY = this.position.y - this.currentEyeHeight
    const directGroundY = this.probeGround(nextX, nextZ)
    const aheadGroundY = len > 0 ? this.probeGround(nextX + moveDirX * 0.35, nextZ + moveDirZ * 0.35) : directGroundY
    const targetGroundY = Math.max(directGroundY, aheadGroundY)
    const stepUp = targetGroundY - currentFeetY

    // Auto Step-Up on Stairs / Slopes (Smooth Walking at any view angle)
    if (this.onGround && stepUp > 0.02 && stepUp <= this.maxStepHeight) {
      this.currentFloorY = targetGroundY
      this.position.y = this.currentFloorY + this.currentEyeHeight
      this.velocity.y = 0
    }

    // Resolve Horizontal Wall Collisions (at chest/head height, ignoring low stair treads)
    const resolved = this.resolveCollisions(this.position.x, this.position.z, nextX, nextZ)
    this.position.x = resolved.x
    this.position.z = resolved.z

    // Smooth Crouch Transition
    const targetEyeHeight = this.isCrouching ? this.crouchEyeHeight : this.eyeHeight
    this.currentEyeHeight += (targetEyeHeight - this.currentEyeHeight) * Math.min(1, 15 * dt)

    // 5. Final Elevation Settling
    const finalGroundY = this.probeGround(this.position.x, this.position.z)
    const finalStepDiff = finalGroundY - this.currentFloorY

    if (this.onGround) {
      if (Math.abs(finalStepDiff) <= this.maxStepHeight) {
        this.currentFloorY = finalGroundY
        this.position.y = this.currentFloorY + this.currentEyeHeight
        this.velocity.y = 0
      } else if (nextY <= finalGroundY + this.currentEyeHeight) {
        this.currentFloorY = finalGroundY
        this.position.y = finalGroundY + this.currentEyeHeight
        this.velocity.y = 0
      } else {
        this.position.y = nextY
        this.onGround = false
      }
    } else {
      if (nextY <= finalGroundY + this.currentEyeHeight) {
        this.currentFloorY = finalGroundY
        this.position.y = finalGroundY + this.currentEyeHeight
        this.velocity.y = 0
        this.onGround = true
      } else {
        this.position.y = nextY
        this.onGround = false
      }
    }

    // Camera Positioning
    const bobOffset = (len > 0 && this.onGround) ? Math.sin(this.walkBobTimer) * 0.04 : 0

    if (isThirdPerson) {
      // Third Person Over-the-Shoulder Camera
      const headPos = new THREE.Vector3(this.position.x, this.position.y + 0.15, this.position.z)

      const forward = new THREE.Vector3(0, 0, -1)
      forward.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch)
      forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)

      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)

      const maxDist = 2.7
      const shoulderOffset = 0.42
      const heightOffset = 0.28

      const targetCamPos = headPos.clone()
        .add(new THREE.Vector3(0, heightOffset, 0))
        .add(right.clone().multiplyScalar(shoulderOffset))
        .sub(forward.clone().multiplyScalar(maxDist))

      // Raycast from head to targetCamPos to prevent camera from clipping inside walls
      if (this.meshColliders && this.meshColliders.length > 0) {
        const rayDir = new THREE.Vector3().subVectors(targetCamPos, headPos)
        const rayDist = rayDir.length()
        if (rayDist > 0.01) {
          rayDir.normalize()
          const camRay = new THREE.Raycaster(headPos, rayDir, 0.1, rayDist)
          const hits = camRay.intersectObjects(this.meshColliders, false)
          if (hits.length > 0 && hits[0].distance < rayDist) {
            const safeDist = Math.max(0.3, hits[0].distance - 0.25)
            targetCamPos.copy(headPos).add(rayDir.multiplyScalar(safeDist))
          }
        }
      }

      this.camera.position.copy(targetCamPos)
    } else {
      this.camera.position.set(this.position.x, this.position.y + bobOffset, this.position.z)
    }
  }

  resolveCollisions(currX, currZ, targetX, targetZ) {
    let px = targetX
    let pz = targetZ
    const r = this.radius
    const bound = 30.5

    // 1. EXACT 3D MESH COLLISION (Checked at chest and head level to never snag on stairs)
    if (this.meshColliders && this.meshColliders.length > 0) {
      const raycaster = new THREE.Raycaster()
      const testHeights = [this.currentFloorY + 0.6, this.currentFloorY + 1.25]
      const vx = px - currX
      const vz = pz - currZ
      const vLen = Math.hypot(vx, vz)
      const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4]

      for (const h of testHeights) {
        const origin = new THREE.Vector3(currX, h, currZ)

        // Trajectory direction raycast
        if (vLen > 0.001) {
          const moveDir = new THREE.Vector3(vx / vLen, 0, vz / vLen)
          raycaster.set(origin, moveDir)
          raycaster.far = vLen + r
          const hits = raycaster.intersectObjects(this.meshColliders, false)
          if (hits.length > 0 && hits[0].distance < vLen + r) {
            const hit = hits[0]
            const normal = hit.face ? hit.face.normal.clone() : moveDir.clone().negate()
            normal.applyQuaternion(hit.object.getWorldQuaternion(new THREE.Quaternion()))
            
            // Only block if it is a steep vertical wall (normal.y < 0.35) and above step height
            if (normal.y < 0.35 && hit.point.y > this.currentFloorY + 0.35) {
              normal.y = 0
              if (normal.lengthSq() > 0.001) normal.normalize()
              else normal.copy(moveDir).negate()

              const overlap = (vLen + r) - hit.distance
              px += normal.x * (overlap + 0.02)
              pz += normal.z * (overlap + 0.02)

              const vDotN = this.velocity.x * normal.x + this.velocity.z * normal.z
              if (vDotN < 0) {
                this.velocity.x -= vDotN * normal.x
                this.velocity.z -= vDotN * normal.z
              }
            }
          }
        }

        // 8 Radial Angle Sensors around cylinder
        for (const angle of angles) {
          const targetOrigin = new THREE.Vector3(px, h, pz)
          const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
          raycaster.set(targetOrigin, dir)
          raycaster.far = r
          const hits = raycaster.intersectObjects(this.meshColliders, false)
          if (hits.length > 0 && hits[0].distance < r) {
            const hit = hits[0]
            const normal = hit.face ? hit.face.normal.clone() : dir.clone().negate()
            normal.applyQuaternion(hit.object.getWorldQuaternion(new THREE.Quaternion()))
            
            // Only block if it is a steep vertical wall (normal.y < 0.35) and above step height
            if (normal.y < 0.35 && hit.point.y > this.currentFloorY + 0.35) {
              normal.y = 0
              if (normal.lengthSq() > 0.001) normal.normalize()
              else normal.copy(dir).negate()

              const push = (r - hit.distance) + 0.02
              px += normal.x * push
              pz += normal.z * push

              const vDotN = this.velocity.x * normal.x + this.velocity.z * normal.z
              if (vDotN < 0) {
                this.velocity.x -= vDotN * normal.x
                this.velocity.z -= vDotN * normal.z
              }
            }
          }
        }
      }
    }

    // 2. World Outer Boundary Limit (30.5m)
    if (px < -bound + r) { px = -bound + r; this.velocity.x = Math.max(0, this.velocity.x) }
    if (px > bound - r) { px = bound - r; this.velocity.x = Math.min(0, this.velocity.x) }
    if (pz < -bound + r) { pz = -bound + r; this.velocity.z = Math.max(0, this.velocity.z) }
    if (pz > bound - r) { pz = bound - r; this.velocity.z = Math.min(0, this.velocity.z) }

    return { x: px, z: pz }
  }
}
