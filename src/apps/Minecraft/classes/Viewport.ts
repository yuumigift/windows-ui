import * as THREE from "three";
import {
  BLOCK_SIZE,
  CAMERA_FAR,
  CAMERA_START,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRAVITY,
  GROUND_SNAP_HEIGHT,
  JUMP_VELOCITY,
  LOOK_SENSITIVITY,
  MOVE_SPEED,
  PLAYER_EYE_HEIGHT,
  STEP_DOWN_HEIGHT,
  SPRINT_MULTIPLIER,
} from "../common";
import { World } from "./World";

/** 默认视角稍微向下，进入世界时能更自然地看到地面与前方结构。 */
const DEFAULT_PITCH = -0.35;

/**
 * `Viewport` 负责第一人称视角相关的所有逻辑：
 * - 相机与渲染器创建
 * - 鼠标锁定和视角转向
 * - 键盘输入记录
 * - 玩家水平/垂直移动与简单物理
 */
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

    // 视口大小跟随窗口变化，保证系统窗口缩放后画面不会拉伸变形。
    const width = this.root.clientWidth || GAME_WIDTH;
    const height = this.root.clientHeight || GAME_HEIGHT;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  private readonly handleMouseMove = (event: MouseEvent) => {
    if (!this.isPointerLocked()) return;

    // 鼠标水平移动控制偏航角，垂直移动控制俯仰角。
    this.yaw -= event.movementX * LOOK_SENSITIVITY;
    this.pitch -= event.movementY * LOOK_SENSITIVITY;
    // 限制俯仰范围，避免翻转到“头朝下”的状态。
    this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    this.applyRotation();
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    // 使用 Set 记录当前按下的按键，便于在每帧连续读取输入状态。
    this.keys.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  constructor() {
    // 初始出生点由公共常量统一决定，方便和世界地形保持一致。
    this.camera.position.set(CAMERA_START.x, CAMERA_START.y, CAMERA_START.z);
    this.applyRotation();
  }

  get domElement() {
    return this.renderer.domElement;
  }

  mount(root: HTMLDivElement) {
    this.root = root;
    // 每次重新挂载时清空容器，避免旧 canvas 残留。
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
    // 把帧时间上限限制在 50ms 内，避免窗口切回来后一步跨太远。
    return Math.min(this.clock.getDelta(), 0.05);
  }

  updateMovement(world: World, delta: number) {
    // 从相机朝向中提取“水平前方”，故意忽略 Y，避免抬头时向上飞。
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() === 0) {
      forward.set(0, 0, -1);
    }
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const moveDirection = new THREE.Vector3();

    // 累加 WASD 输入得到最终平面移动方向。
    if (this.keys.has("KeyW")) moveDirection.add(forward);
    if (this.keys.has("KeyS")) moveDirection.sub(forward);
    if (this.keys.has("KeyD")) moveDirection.add(right);
    if (this.keys.has("KeyA")) moveDirection.sub(right);

    const speedMultiplier = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? SPRINT_MULTIPLIER : 1;
    if (moveDirection.lengthSq() > 0) {
      // 归一化后乘速度与 delta，保证斜向移动不会更快。
      moveDirection.normalize().multiplyScalar(MOVE_SPEED * speedMultiplier * delta);
      this.moveHorizontally(world, moveDirection);
    } else if (this.grounded) {
      // 站立不动时仍然尝试贴合地面，适配区块加载后地面高度变化。
      const groundHeight = world.getGroundHeight(this.camera.position, STEP_DOWN_HEIGHT);
      if (groundHeight !== null) {
        this.camera.position.y = groundHeight + PLAYER_EYE_HEIGHT;
      } else {
        this.grounded = false;
      }
    }

    const wantsJump = this.keys.has("Space");
    if (wantsJump && this.grounded && !this.jumpHeld) {
      // 只在按键从“未按下”切换为“按下”时触发跳跃，避免长按连续起跳。
      this.verticalVelocity = JUMP_VELOCITY;
      this.grounded = false;
    }
    this.jumpHeld = wantsJump;

    if (!this.grounded || this.verticalVelocity > 0) {
      // 空中状态下持续施加重力，并尝试进行垂直位移。
      this.verticalVelocity -= GRAVITY * delta;
      this.moveVertically(world, this.verticalVelocity * delta);
    } else {
      // 已落地时，继续检查脚下平台是否仍存在，防止走出台阶后错误悬浮。
      const groundHeight = world.getGroundHeight(this.camera.position, STEP_DOWN_HEIGHT);
      if (groundHeight !== null) {
        this.camera.position.y = groundHeight + PLAYER_EYE_HEIGHT;
      } else {
        this.grounded = false;
      }
    }
  }

  render(scene: THREE.Scene) {
    this.renderer.render(scene, this.camera);
  }

  reset() {
    // 重置到初始出生点，并清理所有瞬时运动状态。
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
    // WebGLRenderer 占用的 GPU 资源较多，离开时需要主动释放。
    this.renderer.dispose();
  }

  private applyRotation() {
    // 使用 YXZ 顺序可避免第一人称视角下常见的欧拉角错乱。
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  private moveHorizontally(world: World, offset: THREE.Vector3) {
    // 分轴移动：先尝试 X，再尝试 Z，可以减少斜向卡角时的手感问题。
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
      // 地面移动后只允许向下寻找很小的高度差，形成“下台阶”效果，
      // 但不会在走出边缘时瞬间吸附到更低的平台。
      const groundHeight = world.getGroundHeight(this.camera.position, STEP_DOWN_HEIGHT);
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
      const groundHeight = world.getGroundHeight(this.camera.position, GROUND_SNAP_HEIGHT);
      if (groundHeight !== null && this.verticalVelocity <= 0 && this.camera.position.y <= groundHeight + PLAYER_EYE_HEIGHT + 0.01) {
        // 下落接近地面时进行吸附，避免因为离散步长产生“悬空一丝”的视觉误差。
        this.camera.position.y = groundHeight + PLAYER_EYE_HEIGHT;
        this.verticalVelocity = 0;
        this.grounded = true;
      }
      return;
    }

    if (amount < 0) {
      // 向下运动撞到方块时，把玩家脚底贴到地面顶部。
      const groundHeight = world.getGroundHeight(this.camera.position, GROUND_SNAP_HEIGHT);
      if (groundHeight !== null) {
        this.camera.position.y = groundHeight + PLAYER_EYE_HEIGHT;
      }
      this.grounded = true;
    }
    // 无论是撞地板还是顶到天花板，垂直速度都应该被清零。
    this.verticalVelocity = 0;
  }

  private bindEvents() {
    // 这里统一监听 window，保证焦点切换后键盘/鼠标事件依然稳定。
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