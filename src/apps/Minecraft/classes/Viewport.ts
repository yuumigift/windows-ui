import * as THREE from "three";
import {
  BLOCK_SIZE,
  CAMERA_FAR,
  CAMERA_START,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRAVITY,
  JUMP_VELOCITY,
  LOOK_SENSITIVITY,
  MOVE_SPEED,
  PLAYER_EYE_HEIGHT,
  SPRINT_MULTIPLIER,
} from "../common";
import { World } from "./World";

const DEFAULT_PITCH = -0.35;

export class Viewport {
  camera = new THREE.PerspectiveCamera(75, GAME_WIDTH / GAME_HEIGHT, 0.1, CAMERA_FAR);
  renderer = new THREE.WebGLRenderer({ antialias: true });

  private clock = new THREE.Clock();
  private root: HTMLDivElement | null = null;
  private keys = new Set<string>();
  private yaw = 0;
  private pitch = DEFAULT_PITCH;
  private verticalVelocity = 0;
  private grounded = false;
  private jumpHeld = false;

  private readonly handleResize = () => {
    if (!this.root) return;
    const width = this.root.clientWidth || GAME_WIDTH;
    const height = this.root.clientHeight || GAME_HEIGHT;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  private readonly handleMouseMove = (event: MouseEvent) => {
    if (!this.isPointerLocked()) return;
    this.yaw -= event.movementX * LOOK_SENSITIVITY;
    this.pitch -= event.movementY * LOOK_SENSITIVITY;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    this.applyRotation();
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  constructor() {
    this.camera.position.set(CAMERA_START.x, CAMERA_START.y, CAMERA_START.z);
    this.applyRotation();
  }

  get domElement() {
    return this.renderer.domElement;
  }

  mount(root: HTMLDivElement) {
    this.root = root;
    root.innerHTML = "";
    root.appendChild(this.renderer.domElement);
    this.renderer.domElement.tabIndex = 0;
    this.bindEvents();
    this.handleResize();
  }

  isPointerLocked() {
    return document.pointerLockElement === this.renderer.domElement;
  }

  requestPointerLock() {
    this.renderer.domElement.requestPointerLock();
  }

  update() {
    return Math.min(this.clock.getDelta(), 0.05);
  }

  updateMovement(world: World, delta: number) {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() === 0) {
      forward.set(0, 0, -1);
    }
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const moveDirection = new THREE.Vector3();

    if (this.keys.has("KeyW")) moveDirection.add(forward);
    if (this.keys.has("KeyS")) moveDirection.sub(forward);
    if (this.keys.has("KeyD")) moveDirection.add(right);
    if (this.keys.has("KeyA")) moveDirection.sub(right);

    const speedMultiplier = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? SPRINT_MULTIPLIER : 1;
    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize().multiplyScalar(MOVE_SPEED * speedMultiplier * delta);
      this.moveHorizontally(world, moveDirection);
    } else if (this.grounded) {
      const groundHeight = world.getGroundHeight(this.camera.position);
      if (groundHeight !== null) {
        this.camera.position.y = groundHeight + PLAYER_EYE_HEIGHT;
      }
    }

    const wantsJump = this.keys.has("Space");
    if (wantsJump && this.grounded && !this.jumpHeld) {
      this.verticalVelocity = JUMP_VELOCITY;
      this.grounded = false;
    }
    this.jumpHeld = wantsJump;

    if (!this.grounded || this.verticalVelocity > 0) {
      this.verticalVelocity -= GRAVITY * delta;
      this.moveVertically(world, this.verticalVelocity * delta);
    } else {
      const groundHeight = world.getGroundHeight(this.camera.position);
      if (groundHeight !== null) {
        this.camera.position.y = groundHeight + PLAYER_EYE_HEIGHT;
      }
    }
  }

  render(scene: THREE.Scene) {
    this.renderer.render(scene, this.camera);
  }

  reset() {
    this.keys.clear();
    this.yaw = 0;
    this.pitch = DEFAULT_PITCH;
    this.verticalVelocity = 0;
    this.grounded = false;
    this.jumpHeld = false;
    this.camera.position.set(CAMERA_START.x, CAMERA_START.y, CAMERA_START.z);
    this.applyRotation();
    this.clock.getDelta();
  }

  destroy() {
    this.unbindEvents();
    if (this.isPointerLocked()) {
      document.exitPointerLock();
    }
    this.renderer.dispose();
  }

  private applyRotation() {
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  private moveHorizontally(world: World, offset: THREE.Vector3) {
    const nextX = this.camera.position.clone();
    nextX.x += offset.x;
    if (!world.collidesPlayer(nextX)) {
      this.camera.position.x = nextX.x;
    }

    const nextZ = this.camera.position.clone();
    nextZ.z += offset.z;
    if (!world.collidesPlayer(nextZ)) {
      this.camera.position.z = nextZ.z;
    }

    if (this.grounded) {
      const groundHeight = world.getGroundHeight(this.camera.position, BLOCK_SIZE * 1.2);
      if (groundHeight !== null) {
        this.camera.position.y = groundHeight + PLAYER_EYE_HEIGHT;
      } else {
        this.grounded = false;
      }
    }
  }

  private moveVertically(world: World, amount: number) {
    if (amount === 0) return;

    const next = this.camera.position.clone();
    next.y += amount;
    if (!world.collidesPlayer(next)) {
      this.camera.position.y = next.y;
      const groundHeight = world.getGroundHeight(this.camera.position, BLOCK_SIZE * 0.35);
      if (groundHeight !== null && this.verticalVelocity <= 0 && this.camera.position.y <= groundHeight + PLAYER_EYE_HEIGHT + 0.01) {
        this.camera.position.y = groundHeight + PLAYER_EYE_HEIGHT;
        this.verticalVelocity = 0;
        this.grounded = true;
      }
      return;
    }

    if (amount < 0) {
      const groundHeight = world.getGroundHeight(this.camera.position, BLOCK_SIZE * 1.2);
      if (groundHeight !== null) {
        this.camera.position.y = groundHeight + PLAYER_EYE_HEIGHT;
      }
      this.grounded = true;
    }
    this.verticalVelocity = 0;
  }

  private bindEvents() {
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  private unbindEvents() {
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}