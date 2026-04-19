import * as THREE from "three";
import { BLOCK_TYPES, type BlockType } from "../types";
import { Viewport } from "./Viewport";
import { World } from "./World";

/**
 * `Game` 负责把视口、世界与界面状态串起来。
 *
 * 可以把它理解成 Minecraft 小游戏的“总控器”：
 * - 管理当前选中的方块类型
 * - 驱动主循环
 * - 监听鼠标滚轮 / 点击事件
 * - 在世界状态变化后同步 HUD 显示
 */
export class Game {
  /** 当前工具栏中选中的方块类型。 */
  blockName = ref<BlockType>("wood");
  /** 当前世界里已经渲染出的方块总数。 */
  blockCount = ref(0);

  private scene = new THREE.Scene();
  private viewport = new Viewport();
  private world = new World(this.scene);
  private animationFrameId: number | null = null;
  private destroyed = false;

  private readonly handleContextMenu = (event: MouseEvent) => {
    // 右键在游戏里用于放置方块，因此阻止浏览器默认菜单。
    event.preventDefault();
  };

  private readonly handleWheel = (event: WheelEvent) => {
    // 使用滚轮在工具栏中循环切换方块类型。
    event.preventDefault();
    const direction = event.deltaY > 0 ? 1 : -1;
    this.cycleBlockType(direction);
  };

  private readonly handlePointerDown = (event: PointerEvent) => {
    // 忽略鼠标中键，避免和浏览器滚轮点击行为冲突。
    if (event.button === 1) return;
    if (!this.viewport.isPointerLocked()) {
      // 第一次点击先锁定鼠标，进入第一人称操作状态。
      this.viewport.requestPointerLock();
      return;
    }

    event.preventDefault();
    if (event.button === 0) {
      // 左键破坏当前准星选中的方块。
      if (this.world.breakSelected(this.viewport.camera)) {
        this.blockCount.value = this.world.count;
      }
      return;
    }

    if (event.button === 2) {
      // 右键按当前选中类型放置方块。
      if (this.world.placeSelected(this.viewport.camera, this.blockName.value)) {
        this.blockCount.value = this.world.count;
      }
    }
  };

  constructor() {
    // 场景背景色与环境光共同构成一个偏明亮的户外观感。
    this.scene.background = new THREE.Color("#8fd3ff");
    this.setupLights();
  }

  private setupLights() {
    // 环境光负责基础亮度，平行光负责制造更自然的受光层次。
    const ambientLight = new THREE.AmbientLight("#ffffff", 1.2);
    const directionalLight = new THREE.DirectionalLight("#fff7dd", 1.6);
    directionalLight.position.set(18, 36, 24);
    this.scene.add(ambientLight, directionalLight);
  }

  private renderFrame = () => {
    if (this.destroyed) return;
    this.animationFrameId = requestAnimationFrame(this.renderFrame);

    // 每一帧按固定顺序更新：
    // 1. 读取时间步长
    // 2. 更新玩家移动与碰撞
    // 3. 推进世界区块、粒子等逻辑
    // 4. 更新准星命中的高亮方块
    // 5. 将最新统计同步到界面
    // 6. 最终渲染场景
    const delta = this.viewport.update();
    this.viewport.updateMovement(this.world, delta);
    this.world.update(delta, this.viewport.camera.position);
    this.world.updateSelection(this.viewport.camera);
    this.blockCount.value = this.world.count;
    this.viewport.render(this.scene);
  };

  start(rootRef: Ref<HTMLDivElement | null>) {
    const init = () => {
      const root = rootRef.value;
      if (!root) return;

      // 初始化挂载顺序非常重要：先挂载渲染器，再重置视口与世界，最后开始循环。
      this.viewport.mount(root);
      this.viewport.reset();
      this.world.reset(this.viewport.camera.position);
      this.blockCount.value = this.world.count;
      this.bindEvents();
      this.renderFrame();
    };

    onMounted(init);
    onBeforeUnmount(() => this.destroy());
  }

  restart() {
    if (this.destroyed) return;

    // 重置时保留同一个渲染器与场景对象，只恢复玩家状态与世界内容。
    this.viewport.reset();
    this.world.reset(this.viewport.camera.position);
    this.blockCount.value = this.world.count;
  }

  setBlockType(type: BlockType) {
    // 提供给 UI 工具栏按钮调用的显式切换入口。
    this.blockName.value = type;
  }

  private cycleBlockType(direction: 1 | -1) {
    // 使用环形下标，让滚轮能在首尾之间无缝循环。
    const currentIndex = BLOCK_TYPES.indexOf(this.blockName.value);
    const nextIndex = (currentIndex + direction + BLOCK_TYPES.length) % BLOCK_TYPES.length;
    this.blockName.value = BLOCK_TYPES[nextIndex] ?? this.blockName.value;
  }

  private bindEvents() {
    // 事件统一绑定到渲染 canvas 上，避免影响外层系统窗口的其他交互。
    this.viewport.domElement.addEventListener("pointerdown", this.handlePointerDown);
    this.viewport.domElement.addEventListener("contextmenu", this.handleContextMenu);
    this.viewport.domElement.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  private unbindEvents() {
    this.viewport.domElement.removeEventListener("pointerdown", this.handlePointerDown);
    this.viewport.domElement.removeEventListener("contextmenu", this.handleContextMenu);
    this.viewport.domElement.removeEventListener("wheel", this.handleWheel);
  }

  destroy() {
    // 销毁顺序：先停循环，再解绑事件，最后释放世界与视口资源。
    this.destroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.unbindEvents();
    this.world.destroy();
    this.viewport.destroy();
  }
}
