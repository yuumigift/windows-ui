import * as THREE from "three";
import { BLOCK_TYPES, type BlockType } from "../types";
import { Viewport } from "./Viewport";
import { World } from "./World";

export class Game {
  blockName = ref<BlockType>("wood");
  blockCount = ref(0);

  private scene = new THREE.Scene();
  private viewport = new Viewport();
  private world = new World(this.scene);
  private animationFrameId: number | null = null;
  private destroyed = false;

  private readonly handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
  };

  private readonly handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? 1 : -1;
    this.cycleBlockType(direction);
  };

  private readonly handlePointerDown = (event: PointerEvent) => {
    if (event.button === 1) return;
    if (!this.viewport.isPointerLocked()) {
      this.viewport.requestPointerLock();
      return;
    }

    event.preventDefault();
    if (event.button === 0) {
      if (this.world.breakSelected(this.viewport.camera)) {
        this.blockCount.value = this.world.count;
      }
      return;
    }

    if (event.button === 2) {
      if (this.world.placeSelected(this.viewport.camera, this.blockName.value)) {
        this.blockCount.value = this.world.count;
      }
    }
  };

  constructor() {
    this.scene.background = new THREE.Color("#8fd3ff");
    this.setupLights();
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight("#ffffff", 1.2);
    const directionalLight = new THREE.DirectionalLight("#fff7dd", 1.6);
    directionalLight.position.set(18, 36, 24);
    this.scene.add(ambientLight, directionalLight);
  }

  private renderFrame = () => {
    if (this.destroyed) return;
    this.animationFrameId = requestAnimationFrame(this.renderFrame);
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
    this.viewport.reset();
    this.world.reset(this.viewport.camera.position);
    this.blockCount.value = this.world.count;
  }

  setBlockType(type: BlockType) {
    this.blockName.value = type;
  }

  private cycleBlockType(direction: 1 | -1) {
    const currentIndex = BLOCK_TYPES.indexOf(this.blockName.value);
    const nextIndex = (currentIndex + direction + BLOCK_TYPES.length) % BLOCK_TYPES.length;
    this.blockName.value = BLOCK_TYPES[nextIndex] ?? this.blockName.value;
  }

  private bindEvents() {
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
