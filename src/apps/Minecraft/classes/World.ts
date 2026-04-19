import * as THREE from "three";
import {
  BLOCK_SIZE,
  CABIN_GROUND_HEIGHT,
  CABIN_HALF_DEPTH,
  CABIN_HALF_WIDTH,
  CABIN_ROOF_OVERHANG,
  CABIN_WALL_HEIGHT,
  CHUNK_BUILD_TIME_BUDGET,
  CHUNK_RENDER_DISTANCE,
  CHUNK_SIZE,
  FOREST_OUTER_RADIUS,
  FOREST_RING_RADIUS,
  GROUND_SNAP_HEIGHT,
  MAX_RAYCAST_DISTANCE,
  PATH_LENGTH,
  PLAYER_EYE_HEIGHT,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  SEA_LEVEL,
  WORLD_MAX_HEIGHT,
  WORLD_TOP_HEIGHT,
} from "../common";
import type { BlockPosition, BlockType } from "../types";

/** 各类方块对应的贴图资源地址。 */
const BLOCK_TEXTURE_URLS: Record<BlockType, string> = {
  grass: new URL("../texture/grass.png", import.meta.url).href,
  dirt: new URL("../texture/dirt.png", import.meta.url).href,
  stone: new URL("../texture/stone.png", import.meta.url).href,
  wood: new URL("../texture/wood.png", import.meta.url).href,
  glass: new URL("../texture/glass.png", import.meta.url).href,
  leaf: new URL("../texture/leaf.png", import.meta.url).href,
};

/** 复用同一个贴图加载器，避免重复创建内部资源。 */
const textureLoader = new THREE.TextureLoader();

/** 对半透明方块单独指定可见透明度。 */
const BLOCK_OPACITY: Partial<Record<BlockType, number>> = {
  glass: 0.4,
  leaf: 0.6,
};

/** 破坏粒子的重力与阻尼，用于做出“碎块掉落”的视觉反馈。 */
const BREAK_PARTICLE_GRAVITY = BLOCK_SIZE * 2;
const BREAK_PARTICLE_DRAG = 0.995;

/**
 * 为指定方块类型创建材质。
 *
 * 这里统一处理：
 * - 贴图读取
 * - 像素风采样方式
 * - 透明方块的 alpha / opacity / side 配置
 */
const createBlockMaterial = (type: BlockType) => {
  const texture = textureLoader.load(BLOCK_TEXTURE_URLS[type]);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  return new THREE.MeshLambertMaterial({
    alphaTest: type === "leaf" || type === "glass" ? 0.1 : 0,
    color: "#ffffff",
    depthWrite: type === "glass" ? false : true,
    map: texture,
    opacity: BLOCK_OPACITY[type] ?? 1,
    side: type === "leaf" ? THREE.DoubleSide : THREE.FrontSide,
    transparent: type === "leaf" || type === "glass",
  });
};

/** 已渲染方块在运行时保存的附加信息。 */
type WorldBlock = {
  chunkKey: string;
  type: BlockType;
  mesh: THREE.Mesh;
};

/** 单个破坏粒子的瞬时状态。 */
type BreakParticle = {
  life: number;
  mesh: THREE.Mesh;
  rotationSpeed: THREE.Vector3;
  velocity: THREE.Vector3;
};

/** 区块异步构建任务，按列渐进推进。 */
type PendingChunkTask = {
  chunkX: number;
  chunkZ: number;
  key: string;
  nextColumnIndex: number;
};

/** 射线命中的方块交点类型别名，便于后续复用。 */
type BlockHit = THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>;

/** 逻辑坐标转字符串 key，用于 Map 快速索引。 */
const getBlockKey = ({ x, y, z }: BlockPosition) => `${x},${y},${z}`;
const getChunkKey = (x: number, z: number) => `${x},${z}`;
const getColumnKey = (x: number, z: number) => `${x},${z}`;

/** 把世界坐标转换到最近的逻辑方块坐标。 */
const normalizeBlockPosition = (point: THREE.Vector3) => ({
  x: Math.round(point.x),
  y: Math.round(point.y),
  z: Math.round(point.z),
});

/**
 * 轻量级伪随机噪声函数。
 *
 * 不追求严格的地形学意义，只要求：
 * - 同一个坐标总是得到同一个值
 * - 相邻坐标有足够变化
 * - 计算足够便宜，适合实时按需生成区块
 */
const hashNoise = (x: number, z: number) => {
  const seed = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return seed - Math.floor(seed);
};

/** 木屋与小路所在的核心保护区，生成自然地形/树木时需要避开。 */
const withinCabinPlot = (x: number, z: number) =>
  Math.abs(x) <= CABIN_HALF_WIDTH + 3 && z >= -CABIN_HALF_DEPTH - 3 && z <= PATH_LENGTH + 5;

/**
 * `World` 负责管理所有“世界内容”：
 * - 按需生成和卸载区块
 * - 维护逻辑方块数据与已渲染网格
 * - 处理玩家碰撞、落地检测、射线选中
 * - 放置/破坏方块与碎块粒子效果
 */
export class World {
  /** 射线检测器，用于准星选中与交互。 */
  private raycaster = new THREE.Raycaster();
  /** 逻辑坐标 -> 已渲染方块信息。 */
  private blockMap = new Map<string, WorldBlock>();
  /** 区块 key -> 属于该区块的所有逻辑方块 key。 */
  private chunkBlocks = new Map<string, Set<string>>();
  /** 玩家手动改动过的方块覆盖表，`null` 表示删除原生生成方块。 */
  private overrides = new Map<string, BlockType | null>();
  /** 所有已渲染的方块网格，供射线检测快速遍历。 */
  private blockMeshes: THREE.Mesh[] = [];
  /** 记录 mesh 在 `blockMeshes` 中的位置，便于 O(1) 删除。 */
  private meshIndexes = new Map<THREE.Mesh, number>();
  /** 当前仍在播放中的破坏粒子。 */
  private particles: BreakParticle[] = [];
  /** 尚未构建完成的区块任务表。 */
  private pendingChunkTasks = new Map<string, PendingChunkTask>();
  /** 区块构建队列，按距离优先级顺序推进。 */
  private pendingChunkQueue: PendingChunkTask[] = [];
  /** 地表高度缓存，避免重复计算噪声。 */
  private surfaceHeightCache = new Map<string, number>();
  /** 树木原点缓存，保证树生成稳定且查询更快。 */
  private treeOriginCache = new Map<string, boolean>();
  /** 主方块网格复用同一个几何体，减少内存占用。 */
  private readonly blockGeometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  /** 粒子几何体比普通方块小很多，模拟碎块。 */
  private readonly particleGeometry = new THREE.BoxGeometry(BLOCK_SIZE * 0.18, BLOCK_SIZE * 0.18, BLOCK_SIZE * 0.18);
  /** 每种方块类型对应一份共享材质。 */
  private readonly blockMaterials = {
    grass: createBlockMaterial("grass"),
    dirt: createBlockMaterial("dirt"),
    stone: createBlockMaterial("stone"),
    wood: createBlockMaterial("wood"),
    glass: createBlockMaterial("glass"),
    leaf: createBlockMaterial("leaf"),
  } satisfies Record<BlockType, THREE.MeshLambertMaterial>;
  /** 准星命中方块后显示的白色描边框。 */
  private readonly highlight = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(BLOCK_SIZE * 1.04, BLOCK_SIZE * 1.04, BLOCK_SIZE * 1.04)),
    new THREE.LineBasicMaterial({ color: "#ffffff" }),
  );

  constructor(private scene: THREE.Scene) {
    this.raycaster.far = MAX_RAYCAST_DISTANCE;
    this.highlight.visible = false;
    this.scene.add(this.highlight);
  }

  /** 对外暴露当前世界中的已渲染方块总数。 */
  get count() {
    return this.blockMap.size;
  }

  update(delta: number, cameraPosition: THREE.Vector3) {
    // 优先保证玩家附近区块持续加载，再更新粒子动画。
    this.ensureChunks(cameraPosition);
    this.processChunkQueue();
    if (!this.particles.length) return;

    this.particles = this.particles.filter((particle) => {
      particle.life -= delta;
      particle.velocity.y -= BREAK_PARTICLE_GRAVITY * delta;
      particle.velocity.x *= BREAK_PARTICLE_DRAG;
      particle.velocity.z *= BREAK_PARTICLE_DRAG;
      particle.mesh.position.addScaledVector(particle.velocity, delta);
      particle.mesh.rotation.x += particle.rotationSpeed.x * delta;
      particle.mesh.rotation.y += particle.rotationSpeed.y * delta;
      particle.mesh.rotation.z += particle.rotationSpeed.z * delta;

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh);
        return false;
      }
      return true;
    });
  }

  /** 每帧刷新准星命中的方块高亮。 */
  updateSelection(camera: THREE.Camera) {
    return this.getRaycastHit(camera);
  }

  /** 破坏准星选中的方块，并记录为“已删除覆盖”。 */
  breakSelected(camera: THREE.Camera) {
    const hit = this.getRaycastHit(camera);
    if (!hit) return false;

    const mesh = hit.object as THREE.Mesh;
    const position = mesh.userData.blockPosition as BlockPosition;
    const block = this.blockMap.get(getBlockKey(position));
    if (!block) return false;

    this.spawnBreakParticles(position, block.type);
    this.overrides.set(getBlockKey(position), null);
    return this.removeRenderedBlock(position);
  }

  /** 在准星命中面的外侧尝试放置一个新方块。 */
  placeSelected(camera: THREE.Camera, type: BlockType) {
    const hit = this.getRaycastHit(camera);
    if (!hit || !hit.face) return false;

    const mesh = hit.object as THREE.Mesh;
    const base = mesh.userData.blockPosition as BlockPosition;
    const worldNormal = hit.face.normal.clone().transformDirection(mesh.matrixWorld).round();
    const position = {
      x: base.x + worldNormal.x,
      y: base.y + worldNormal.y,
      z: base.z + worldNormal.z,
    };

    // 禁止把方块放进玩家身体、世界边界之外，或覆盖已有方块。
    const cameraCell = normalizeBlockPosition((camera as THREE.PerspectiveCamera).position.clone().divideScalar(BLOCK_SIZE));
    const cameraNearCell =
      Math.abs(position.x - cameraCell.x) <= 1 &&
      Math.abs(position.y - cameraCell.y) <= 1 &&
      Math.abs(position.z - cameraCell.z) <= 1;
    if (cameraNearCell || position.y < 0 || position.y > WORLD_TOP_HEIGHT) return false;
    if (this.getResolvedBlockType(position)) return false;
    if (this.blockIntersectsPlayer(position, (camera as THREE.PerspectiveCamera).position)) return false;

    this.overrides.set(getBlockKey(position), type);
    return this.addRenderedBlock(position, type);
  }

  /** 使用近似圆柱碰撞体检测玩家是否与任意方块重叠。 */
  collidesPlayer(position: THREE.Vector3) {
    const min = new THREE.Vector3(position.x - PLAYER_RADIUS, position.y - PLAYER_EYE_HEIGHT, position.z - PLAYER_RADIUS);
    const max = new THREE.Vector3(position.x + PLAYER_RADIUS, position.y - PLAYER_EYE_HEIGHT + PLAYER_HEIGHT, position.z + PLAYER_RADIUS);

    // 只遍历玩家包围盒附近的少量逻辑格，而不是整个世界。
    const minX = Math.floor(min.x / BLOCK_SIZE) - 1;
    const maxX = Math.floor(max.x / BLOCK_SIZE) + 1;
    const minY = Math.floor(min.y / BLOCK_SIZE) - 1;
    const maxY = Math.floor(max.y / BLOCK_SIZE) + 1;
    const minZ = Math.floor(min.z / BLOCK_SIZE) - 1;
    const maxZ = Math.floor(max.z / BLOCK_SIZE) + 1;

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (!this.getResolvedBlockType({ x, y, z })) continue;

          const blockMin = new THREE.Vector3((x - 0.5) * BLOCK_SIZE, (y - 0.5) * BLOCK_SIZE, (z - 0.5) * BLOCK_SIZE);
          const blockMax = new THREE.Vector3((x + 0.5) * BLOCK_SIZE, (y + 0.5) * BLOCK_SIZE, (z + 0.5) * BLOCK_SIZE);
          const intersects =
            min.x < blockMax.x &&
            max.x > blockMin.x &&
            min.y < blockMax.y &&
            max.y > blockMin.y &&
            min.z < blockMax.z &&
            max.z > blockMin.z;
          if (intersects) return true;
        }
      }
    }

    return false;
  }

  /**
   * 查询玩家脚下最近可站立的地面高度。
   *
   * 该方法既用于普通落地，也用于非常小幅度的“下台阶”贴地行为。
   */
  getGroundHeight(position: THREE.Vector3, maxSnapHeight = GROUND_SNAP_HEIGHT) {
    const feetY = position.y - PLAYER_EYE_HEIGHT;
    const minX = Math.floor((position.x - PLAYER_RADIUS) / BLOCK_SIZE) - 1;
    const maxX = Math.floor((position.x + PLAYER_RADIUS) / BLOCK_SIZE) + 1;
    const minZ = Math.floor((position.z - PLAYER_RADIUS) / BLOCK_SIZE) - 1;
    const maxZ = Math.floor((position.z + PLAYER_RADIUS) / BLOCK_SIZE) + 1;
    const minY = Math.floor((feetY - BLOCK_SIZE) / BLOCK_SIZE) - 1;
    const maxY = Math.floor((feetY + maxSnapHeight) / BLOCK_SIZE) + 1;

    let bestTop = Number.NEGATIVE_INFINITY;

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let y = minY; y <= maxY; y++) {
          if (!this.getResolvedBlockType({ x, y, z })) continue;
          const blockTop = (y + 0.5) * BLOCK_SIZE;
          const withinSnapRange = blockTop <= feetY + maxSnapHeight && blockTop >= feetY - maxSnapHeight;
          if (!withinSnapRange) continue;

          const blockMinX = (x - 0.5) * BLOCK_SIZE;
          const blockMaxX = (x + 0.5) * BLOCK_SIZE;
          const blockMinZ = (z - 0.5) * BLOCK_SIZE;
          const blockMaxZ = (z + 0.5) * BLOCK_SIZE;
          const overlapsHorizontal =
            position.x + PLAYER_RADIUS > blockMinX &&
            position.x - PLAYER_RADIUS < blockMaxX &&
            position.z + PLAYER_RADIUS > blockMinZ &&
            position.z - PLAYER_RADIUS < blockMaxZ;
          if (!overlapsHorizontal) continue;

          // 选择脚下能接触到的最高平面，避免站到更低的一层上。
          bestTop = Math.max(bestTop, blockTop);
        }
      }
    }

    return Number.isFinite(bestTop) ? bestTop : null;
  }

  /** 重置世界状态，并立即强制构建玩家出生点附近区块。 */
  reset(cameraPosition = new THREE.Vector3()) {
    this.clearBlocks();
    this.clearParticles();
    this.pendingChunkTasks.clear();
    this.pendingChunkQueue = [];
    this.chunkBlocks.clear();
    this.overrides.clear();
    this.highlight.visible = false;
    this.ensureChunks(cameraPosition, true);
    this.processChunkQueue(true);
  }

  /** 彻底释放世界持有的场景对象和 GPU 资源。 */
  destroy() {
    this.clearBlocks();
    this.clearParticles();
    this.pendingChunkTasks.clear();
    this.pendingChunkQueue = [];
    this.chunkBlocks.clear();
    this.overrides.clear();
    this.scene.remove(this.highlight);
    this.blockGeometry.dispose();
    this.particleGeometry.dispose();
    Object.values(this.blockMaterials).forEach((material) => material.dispose());
    this.highlight.geometry.dispose();
    (this.highlight.material as THREE.Material).dispose();
  }

  /**
   * 维护玩家周围的区块集合：
   * - 近处缺失的区块加入构建队列
   * - 超出范围的区块立即卸载
   */
  private ensureChunks(cameraPosition: THREE.Vector3, force = false) {
      const blockX = Math.round(cameraPosition.x / BLOCK_SIZE);
      const blockZ = Math.round(cameraPosition.z / BLOCK_SIZE);
      const chunkX = Math.floor(blockX / CHUNK_SIZE);
      const chunkZ = Math.floor(blockZ / CHUNK_SIZE);
      const wanted = new Set<string>();
      const missingChunks: Array<{ chunkX: number; chunkZ: number; key: string; distance: number }> = [];

      for (let x = chunkX - CHUNK_RENDER_DISTANCE; x <= chunkX + CHUNK_RENDER_DISTANCE; x++) {
        for (let z = chunkZ - CHUNK_RENDER_DISTANCE; z <= chunkZ + CHUNK_RENDER_DISTANCE; z++) {
          const key = getChunkKey(x, z);
          wanted.add(key);
          if (force && this.chunkBlocks.has(key)) {
            this.unloadChunk(key);
          }
          if (!this.chunkBlocks.has(key)) {
            missingChunks.push({
              chunkX: x,
              chunkZ: z,
              key,
              distance: (x - chunkX) ** 2 + (z - chunkZ) ** 2,
            });
          }
        }
      }

      missingChunks
        .sort((left, right) => left.distance - right.distance)
        .forEach(({ chunkX: nextChunkX, chunkZ: nextChunkZ, key }) => this.enqueueChunk(nextChunkX, nextChunkZ, key));

      for (const key of [...this.chunkBlocks.keys()]) {
        if (!wanted.has(key)) {
          this.unloadChunk(key);
        }
      }
    }

  /** 把新区块加入待构建队列，避免重复入队。 */
  private enqueueChunk(chunkX: number, chunkZ: number, key = getChunkKey(chunkX, chunkZ)) {
      if (this.chunkBlocks.has(key) || this.pendingChunkTasks.has(key)) return;

      const task: PendingChunkTask = {
        chunkX,
        chunkZ,
        key,
        nextColumnIndex: 0,
      };
      this.pendingChunkTasks.set(key, task);
      this.pendingChunkQueue.push(task);
      this.chunkBlocks.set(key, new Set());
    }

  /** 卸载区块时，同步移除它关联的所有已渲染方块。 */
  private unloadChunk(key: string) {
      this.pendingChunkTasks.delete(key);

      const blockKeys = this.chunkBlocks.get(key);
      if (blockKeys) {
        for (const blockKey of blockKeys) {
          const block = this.blockMap.get(blockKey);
          if (!block) continue;
          this.removeMesh(block.mesh);
          this.scene.remove(block.mesh);
          this.blockMap.delete(blockKey);
        }
      }

      if (this.pendingChunkQueue.length) {
        this.pendingChunkQueue = this.pendingChunkQueue.filter((task) => task.key !== key);
      }

      this.chunkBlocks.delete(key);
    }

  /** 在时间预算内逐步构建区块，减少大批量生成带来的帧卡顿。 */
  private processChunkQueue(force = false) {
      if (!this.pendingChunkQueue.length) return;

      const startTime = performance.now();
      while (this.pendingChunkQueue.length) {
        const task = this.pendingChunkQueue[0];
        if (!task) break;

        if (!this.pendingChunkTasks.has(task.key) || !this.chunkBlocks.has(task.key)) {
          this.pendingChunkQueue.shift();
          continue;
        }

        this.buildChunkColumns(task, force ? Number.POSITIVE_INFINITY : CHUNK_BUILD_TIME_BUDGET, startTime);
        if (task.nextColumnIndex >= CHUNK_SIZE * CHUNK_SIZE) {
          this.pendingChunkTasks.delete(task.key);
          this.pendingChunkQueue.shift();
        }

        if (!force && performance.now() - startTime >= CHUNK_BUILD_TIME_BUDGET) {
          break;
        }
      }
    }

  /** 把一个区块按“列”分批构建出来，而不是一次性整块生成。 */
  private buildChunkColumns(task: PendingChunkTask, budgetMs: number, startTime: number) {
      const startX = task.chunkX * CHUNK_SIZE;
      const startZ = task.chunkZ * CHUNK_SIZE;
      const chunkBlockKeys = this.chunkBlocks.get(task.key);
      if (!chunkBlockKeys) return;

      while (task.nextColumnIndex < CHUNK_SIZE * CHUNK_SIZE) {
        const localX = task.nextColumnIndex % CHUNK_SIZE;
        const localZ = Math.floor(task.nextColumnIndex / CHUNK_SIZE);
        const worldX = startX + localX;
        const worldZ = startZ + localZ;

        for (let y = 0; y <= WORLD_TOP_HEIGHT; y++) {
          const position = { x: worldX, y, z: worldZ };
          const type = this.getResolvedBlockType(position);
          if (!type) continue;
          if (this.addRenderedBlock(position, type, task.key)) {
            chunkBlockKeys.add(getBlockKey(position));
          }
        }

        task.nextColumnIndex += 1;
        if (!Number.isFinite(budgetMs)) continue;
        if (performance.now() - startTime >= budgetMs) {
          break;
        }
      }
    }

  /** 将逻辑方块实例化成 Three.js 网格并加入场景。 */
  private addRenderedBlock(
      position: BlockPosition,
      type: BlockType,
      chunkKey = getChunkKey(Math.floor(position.x / CHUNK_SIZE), Math.floor(position.z / CHUNK_SIZE)),
    ) {
      const key = getBlockKey(position);
      if (this.blockMap.has(key)) return false;

      const mesh = new THREE.Mesh(this.blockGeometry, this.blockMaterials[type]);
      mesh.position.set(position.x * BLOCK_SIZE, position.y * BLOCK_SIZE, position.z * BLOCK_SIZE);
      mesh.userData.blockPosition = { ...position } satisfies BlockPosition;
      this.scene.add(mesh);
      this.meshIndexes.set(mesh, this.blockMeshes.length);
      this.blockMeshes.push(mesh);
      this.blockMap.set(key, { chunkKey, type, mesh });
      return true;
    }

  /** 从场景和索引结构中移除指定位置的已渲染方块。 */
  private removeRenderedBlock(position: BlockPosition) {
      const key = getBlockKey(position);
      const block = this.blockMap.get(key);
      if (!block) return false;

      this.removeMesh(block.mesh);
      this.scene.remove(block.mesh);
      this.blockMap.delete(key);
      this.chunkBlocks.get(block.chunkKey)?.delete(key);
      return true;
    }

  /**
   * 使用“尾元素覆盖”的方式删除 mesh，
   * 避免数组中间删除导致的 O(n) 移动成本。
   */
  private removeMesh(mesh: THREE.Mesh) {
      const index = this.meshIndexes.get(mesh);
      if (index === undefined) return;

      const lastIndex = this.blockMeshes.length - 1;
      const lastMesh = this.blockMeshes[lastIndex];
      if (index !== lastIndex && lastMesh) {
        this.blockMeshes[index] = lastMesh;
        this.meshIndexes.set(lastMesh, index);
      }

      this.blockMeshes.pop();
      this.meshIndexes.delete(mesh);
    }

  /** 清空当前已经加载到场景中的所有方块。 */
  private clearBlocks() {
      this.blockMeshes.forEach((mesh) => this.scene.remove(mesh));
      this.blockMeshes = [];
      this.meshIndexes.clear();
      this.blockMap.clear();
      this.chunkBlocks.clear();
    }

  /** 清空所有碎块粒子。 */
  private clearParticles() {
      this.particles.forEach((particle) => this.scene.remove(particle.mesh));
      this.particles = [];
    }

  /** 优先读取玩家修改结果，其次才回退到程序化生成结果。 */
  private getResolvedBlockType(position: BlockPosition) {
      const key = getBlockKey(position);
      if (this.overrides.has(key)) {
        return this.overrides.get(key) ?? null;
      }
      return this.getGeneratedBlockType(position);
    }

  /** 根据结构与自然地形规则，计算某个逻辑坐标原本应该是什么方块。 */
  private getGeneratedBlockType(position: BlockPosition): BlockType | null {
      const structureBlock = this.getStructureBlockType(position);
      if (structureBlock) return structureBlock;

      const surfaceHeight = this.getSurfaceHeight(position.x, position.z);
      if (position.y < 0 || position.y > WORLD_TOP_HEIGHT || position.y > surfaceHeight) return null;
      if (position.y === surfaceHeight) return "grass";
      if (surfaceHeight - position.y <= 2) return "dirt";
      return "stone";
    }

  /**
   * 计算地表高度。
   *
   * 木屋区域使用固定平地，其他地方用正弦 + 噪声组合出柔和起伏。
   */
  private getSurfaceHeight(x: number, z: number) {
      const key = getColumnKey(x, z);
      const cachedHeight = this.surfaceHeightCache.get(key);
      if (cachedHeight !== undefined) return cachedHeight;

      const height = withinCabinPlot(x, z)
        ? CABIN_GROUND_HEIGHT
        : Math.max(
            SEA_LEVEL,
            Math.min(
              WORLD_MAX_HEIGHT,
              Math.round(
                SEA_LEVEL +
                  2 +
                  Math.sin(x * 0.19) * 1.5 +
                  Math.cos(z * 0.17) * 1.3 +
                  Math.sin((x + z) * 0.08) * 1.15 +
                  (hashNoise(x, z) - 0.5) * 1.2,
              ),
            ),
          );

      this.surfaceHeightCache.set(key, height);
      return height;
    }

  /** 按优先级查询人造结构与树木，结构会覆盖自然地形结果。 */
  private getStructureBlockType(position: BlockPosition): BlockType | null {
      return this.getCabinBlockType(position) ?? this.getPathBlockType(position) ?? this.getTreeBlockType(position);
    }

  /** 生成木屋主体，包括地板、墙体、门洞、窗户和屋顶。 */
  private getCabinBlockType(position: BlockPosition): BlockType | null {
      const { x, y, z } = position;
      const floorY = CABIN_GROUND_HEIGHT + 1;
      const roofY = floorY + CABIN_WALL_HEIGHT + 1;
      const insideX = Math.abs(x) <= CABIN_HALF_WIDTH;
      const insideZ = Math.abs(z) <= CABIN_HALF_DEPTH;

      if (insideX && insideZ && y === floorY) return "stone";

      const onWallShell = (Math.abs(x) === CABIN_HALF_WIDTH || Math.abs(z) === CABIN_HALF_DEPTH) && insideX && insideZ;
      const isDoor = z === CABIN_HALF_DEPTH && x === 0 && (y === floorY + 1 || y === floorY + 2);
      const isWindow = y === floorY + 2 && ((Math.abs(x) === CABIN_HALF_WIDTH && z === 0) || (Math.abs(z) === CABIN_HALF_DEPTH && Math.abs(x) === 2));
      if (onWallShell && y >= floorY + 1 && y <= floorY + CABIN_WALL_HEIGHT) {
        if (isDoor) return null;
        if (isWindow) return "glass";
        return "wood";
      }

      const roofInsideX = Math.abs(x) <= CABIN_HALF_WIDTH + CABIN_ROOF_OVERHANG;
      const roofInsideZ = Math.abs(z) <= CABIN_HALF_DEPTH + CABIN_ROOF_OVERHANG;
      if (roofInsideX && roofInsideZ && y === roofY) return "wood";

      return null;
    }

  /** 生成木屋前的石头小路。 */
  private getPathBlockType(position: BlockPosition): BlockType | null {
      const { x, y, z } = position;
      const pathY = CABIN_GROUND_HEIGHT + 1;
      const inPath = Math.abs(x) <= 1 && z >= CABIN_HALF_DEPTH + 1 && z <= CABIN_HALF_DEPTH + PATH_LENGTH;
      return inPath && y === pathY ? "stone" : null;
    }

  /** 检查当前坐标是否落在附近某棵树的树干或树冠范围内。 */
  private getTreeBlockType(position: BlockPosition): BlockType | null {
      for (let originX = position.x - 2; originX <= position.x + 2; originX++) {
        for (let originZ = position.z - 2; originZ <= position.z + 2; originZ++) {
          if (!this.isTreeOrigin(originX, originZ)) continue;
          const treeBlock = this.getTreePartType(position, originX, originZ);
          if (treeBlock) return treeBlock;
        }
      }
      return null;
    }

  /** 判断某个地表列是否应该作为树的原点，并缓存结果。 */
  private isTreeOrigin(x: number, z: number) {
      const key = getColumnKey(x, z);
      const cached = this.treeOriginCache.get(key);
      if (cached !== undefined) return cached;

      const distance = Math.sqrt(x * x + z * z);
      const ringNoise = hashNoise(x, z);
      const result =
        !withinCabinPlot(x, z) &&
        ((distance >= FOREST_RING_RADIUS - 1.4 && distance <= FOREST_RING_RADIUS + 1.8 && ringNoise > 0.73) ||
          (distance > FOREST_RING_RADIUS + 1.8 && distance <= FOREST_OUTER_RADIUS && ringNoise > 0.82 && hashNoise(x + 13, z - 7) > 0.44));

      this.treeOriginCache.set(key, result);
      return result;
    }

  /** 以树原点为中心，计算当前坐标对应树干还是树叶。 */
  private getTreePartType(position: BlockPosition, originX: number, originZ: number): BlockType | null {
      const trunkHeight = 4 + Math.floor(hashNoise(originX * 2, originZ * 3) * 3);
      const groundY = this.getSurfaceHeight(originX, originZ);
      const trunkBaseY = groundY + 1;
      const { x, y, z } = position;

      if (x === originX && z === originZ && y >= trunkBaseY && y < trunkBaseY + trunkHeight) {
        return "wood";
      }

      const canopyBaseY = trunkBaseY + trunkHeight - 1;
      const offsetX = x - originX;
      const offsetZ = z - originZ;
      const offsetY = y - canopyBaseY;
      const inCanopyRange = Math.abs(offsetX) <= 2 && Math.abs(offsetZ) <= 2 && offsetY >= 0 && offsetY <= 2;
      if (!inCanopyRange) return null;

      const canopyDistance = Math.abs(offsetX) + Math.abs(offsetZ) + offsetY;
      if (canopyDistance > 4) return null;
      if (offsetX === 0 && offsetZ === 0 && offsetY < 2) return null;
      return "leaf";
    }

  /** 放置方块前检测该方块是否会和玩家碰撞体重叠。 */
  private blockIntersectsPlayer(position: BlockPosition, eyePosition: THREE.Vector3) {
      const playerMin = new THREE.Vector3(eyePosition.x - PLAYER_RADIUS, eyePosition.y - PLAYER_EYE_HEIGHT, eyePosition.z - PLAYER_RADIUS);
      const playerMax = new THREE.Vector3(
        eyePosition.x + PLAYER_RADIUS,
        eyePosition.y - PLAYER_EYE_HEIGHT + PLAYER_HEIGHT,
        eyePosition.z + PLAYER_RADIUS,
      );
      const blockMin = new THREE.Vector3((position.x - 0.5) * BLOCK_SIZE, (position.y - 0.5) * BLOCK_SIZE, (position.z - 0.5) * BLOCK_SIZE);
      const blockMax = new THREE.Vector3((position.x + 0.5) * BLOCK_SIZE, (position.y + 0.5) * BLOCK_SIZE, (position.z + 0.5) * BLOCK_SIZE);

      return (
        playerMin.x < blockMax.x &&
        playerMax.x > blockMin.x &&
        playerMin.y < blockMax.y &&
        playerMax.y > blockMin.y &&
        playerMin.z < blockMax.z &&
        playerMax.z > blockMin.z
      );
    }

  /** 在方块破坏位置生成一组带重力的碎块粒子。 */
  private spawnBreakParticles(position: BlockPosition, type: BlockType) {
      const material = this.blockMaterials[type];

      for (let index = 0; index < 12; index++) {
        const mesh = new THREE.Mesh(this.particleGeometry, material);
        mesh.position.set(
          position.x * BLOCK_SIZE + (Math.random() - 0.5) * BLOCK_SIZE * 0.45,
          position.y * BLOCK_SIZE + (Math.random() - 0.5) * BLOCK_SIZE * 0.45,
          position.z * BLOCK_SIZE + (Math.random() - 0.5) * BLOCK_SIZE * 0.45,
        );
        this.scene.add(mesh);
        this.particles.push({
          life: 0.35 + Math.random() * 0.3,
          mesh,
          rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * BLOCK_SIZE * 2.4,
            BLOCK_SIZE * (0.45 + Math.random() * 0.85),
            (Math.random() - 0.5) * BLOCK_SIZE * 2.4,
          ),
        });
      }
    }

  /** 沿屏幕中心发射射线，并同步更新高亮框位置。 */
  private getRaycastHit(camera: THREE.Camera) {
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hit = this.raycaster.intersectObjects(this.blockMeshes, false)[0] as BlockHit | undefined;
      if (!hit) {
        this.highlight.visible = false;
        return null;
      }

      const mesh = hit.object as THREE.Mesh;
      const position = mesh.userData.blockPosition as BlockPosition;
      this.highlight.visible = true;
      this.highlight.position.set(position.x * BLOCK_SIZE, position.y * BLOCK_SIZE, position.z * BLOCK_SIZE);
      return hit;
  }
}