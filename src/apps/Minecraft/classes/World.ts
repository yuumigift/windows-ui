import * as THREE from "three";
import {
  BLOCK_SIZE,
  CABIN_GROUND_HEIGHT,
  CABIN_HALF_DEPTH,
  CABIN_HALF_WIDTH,
  CABIN_ROOF_OVERHANG,
  CABIN_WALL_HEIGHT,
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

const BLOCK_COLORS: Record<BlockType, string> = {
  grass: "#69b34c",
  dirt: "#8b5a2b",
  stone: "#8a94a6",
  wood: "#b07d42",
  glass: "#bde9ff",
};

type WorldBlock = {
  type: BlockType;
  mesh: THREE.Mesh;
};

type BreakParticle = {
  life: number;
  mesh: THREE.Mesh;
  rotationSpeed: THREE.Vector3;
  velocity: THREE.Vector3;
};

type BlockHit = THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>;

const getBlockKey = ({ x, y, z }: BlockPosition) => `${x},${y},${z}`;

const getChunkKey = (x: number, z: number) => `${x},${z}`;

const normalizeBlockPosition = (point: THREE.Vector3) => ({
  x: Math.round(point.x),
  y: Math.round(point.y),
  z: Math.round(point.z),
});

const hashNoise = (x: number, z: number) => {
  const seed = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return seed - Math.floor(seed);
};

const withinCabinPlot = (x: number, z: number) =>
  Math.abs(x) <= CABIN_HALF_WIDTH + 3 && z >= -CABIN_HALF_DEPTH - 3 && z <= PATH_LENGTH + 5;

export class World {
  private raycaster = new THREE.Raycaster();
  private blockMap = new Map<string, WorldBlock>();
  private chunkBlocks = new Map<string, string[]>();
  private overrides = new Map<string, BlockType | null>();
  private blockMeshes: THREE.Mesh[] = [];
  private particles: BreakParticle[] = [];
  private readonly blockGeometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  private readonly particleGeometry = new THREE.BoxGeometry(BLOCK_SIZE * 0.18, BLOCK_SIZE * 0.18, BLOCK_SIZE * 0.18);
  private readonly blockMaterials = {
    grass: new THREE.MeshLambertMaterial({ color: BLOCK_COLORS.grass }),
    dirt: new THREE.MeshLambertMaterial({ color: BLOCK_COLORS.dirt }),
    stone: new THREE.MeshLambertMaterial({ color: BLOCK_COLORS.stone }),
    wood: new THREE.MeshLambertMaterial({ color: BLOCK_COLORS.wood }),
    glass: new THREE.MeshLambertMaterial({ color: BLOCK_COLORS.glass, transparent: true, opacity: 0.65 }),
  } satisfies Record<BlockType, THREE.MeshLambertMaterial>;
  private readonly highlight = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(BLOCK_SIZE * 1.04, BLOCK_SIZE * 1.04, BLOCK_SIZE * 1.04)),
    new THREE.LineBasicMaterial({ color: "#ffffff" }),
  );

  constructor(private scene: THREE.Scene) {
    this.raycaster.far = MAX_RAYCAST_DISTANCE;
    this.highlight.visible = false;
    this.scene.add(this.highlight);
  }

  get count() {
    return this.blockMap.size;
  }

  update(delta: number, cameraPosition: THREE.Vector3) {
    this.ensureChunks(cameraPosition);
    if (!this.particles.length) return;

    this.particles = this.particles.filter((particle) => {
      particle.life -= delta;
      particle.velocity.y -= 7 * delta;
      particle.velocity.multiplyScalar(0.985);
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

  updateSelection(camera: THREE.Camera) {
    return this.getRaycastHit(camera);
  }

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

  collidesPlayer(position: THREE.Vector3) {
    const min = new THREE.Vector3(position.x - PLAYER_RADIUS, position.y - PLAYER_EYE_HEIGHT, position.z - PLAYER_RADIUS);
    const max = new THREE.Vector3(position.x + PLAYER_RADIUS, position.y - PLAYER_EYE_HEIGHT + PLAYER_HEIGHT, position.z + PLAYER_RADIUS);

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
          const withinSnapRange = blockTop <= feetY + maxSnapHeight && blockTop >= feetY - BLOCK_SIZE * 1.4;
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

          bestTop = Math.max(bestTop, blockTop);
        }
      }
    }

    return Number.isFinite(bestTop) ? bestTop : null;
  }

  reset(cameraPosition = new THREE.Vector3()) {
    this.clearBlocks();
    this.clearParticles();
    this.chunkBlocks.clear();
    this.overrides.clear();
    this.highlight.visible = false;
    this.ensureChunks(cameraPosition, true);
  }

  destroy() {
    this.clearBlocks();
    this.clearParticles();
    this.chunkBlocks.clear();
    this.overrides.clear();
    this.scene.remove(this.highlight);
    this.blockGeometry.dispose();
    this.particleGeometry.dispose();
    Object.values(this.blockMaterials).forEach((material) => material.dispose());
    this.highlight.geometry.dispose();
    (this.highlight.material as THREE.Material).dispose();
  }

  private ensureChunks(cameraPosition: THREE.Vector3, force = false) {
    const blockX = Math.round(cameraPosition.x / BLOCK_SIZE);
    const blockZ = Math.round(cameraPosition.z / BLOCK_SIZE);
    const chunkX = Math.floor(blockX / CHUNK_SIZE);
    const chunkZ = Math.floor(blockZ / CHUNK_SIZE);
    const wanted = new Set<string>();

    for (let x = chunkX - CHUNK_RENDER_DISTANCE; x <= chunkX + CHUNK_RENDER_DISTANCE; x++) {
      for (let z = chunkZ - CHUNK_RENDER_DISTANCE; z <= chunkZ + CHUNK_RENDER_DISTANCE; z++) {
        const key = getChunkKey(x, z);
        wanted.add(key);
        if (force || !this.chunkBlocks.has(key)) {
          this.loadChunk(x, z);
        }
      }
    }

    for (const key of [...this.chunkBlocks.keys()]) {
      if (!wanted.has(key)) {
        this.unloadChunk(key);
      }
    }
  }

  private loadChunk(chunkX: number, chunkZ: number) {
    const key = getChunkKey(chunkX, chunkZ);
    this.unloadChunk(key);

    const blockKeys: string[] = [];
    const startX = chunkX * CHUNK_SIZE;
    const startZ = chunkZ * CHUNK_SIZE;

    for (let x = startX; x < startX + CHUNK_SIZE; x++) {
      for (let z = startZ; z < startZ + CHUNK_SIZE; z++) {
        for (let y = 0; y <= WORLD_TOP_HEIGHT; y++) {
          const position = { x, y, z };
          const type = this.getResolvedBlockType(position);
          if (!type) continue;
          if (this.addRenderedBlock(position, type)) {
            blockKeys.push(getBlockKey(position));
          }
        }
      }
    }

    this.chunkBlocks.set(key, blockKeys);
  }

  private unloadChunk(key: string) {
    const blockKeys = this.chunkBlocks.get(key);
    if (!blockKeys) return;

    for (const blockKey of blockKeys) {
      const block = this.blockMap.get(blockKey);
      if (!block) continue;
      this.scene.remove(block.mesh);
      this.blockMeshes = this.blockMeshes.filter((mesh) => mesh !== block.mesh);
      this.blockMap.delete(blockKey);
    }

    this.chunkBlocks.delete(key);
  }

  private addRenderedBlock(position: BlockPosition, type: BlockType) {
    const key = getBlockKey(position);
    if (this.blockMap.has(key)) return false;

    const mesh = new THREE.Mesh(this.blockGeometry, this.blockMaterials[type]);
    mesh.position.set(position.x * BLOCK_SIZE, position.y * BLOCK_SIZE, position.z * BLOCK_SIZE);
    mesh.userData.blockPosition = { ...position } satisfies BlockPosition;
    this.scene.add(mesh);
    this.blockMap.set(key, { type, mesh });
    this.blockMeshes.push(mesh);
    return true;
  }

  private removeRenderedBlock(position: BlockPosition) {
    const key = getBlockKey(position);
    const block = this.blockMap.get(key);
    if (!block) return false;

    this.scene.remove(block.mesh);
    this.blockMeshes = this.blockMeshes.filter((mesh) => mesh !== block.mesh);
    this.blockMap.delete(key);

    for (const blockKeys of this.chunkBlocks.values()) {
      const index = blockKeys.indexOf(key);
      if (index >= 0) {
        blockKeys.splice(index, 1);
        break;
      }
    }
    return true;
  }

  private clearBlocks() {
    this.blockMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.blockMeshes = [];
    this.blockMap.clear();
  }

  private clearParticles() {
    this.particles.forEach((particle) => this.scene.remove(particle.mesh));
    this.particles = [];
  }

  private getResolvedBlockType(position: BlockPosition) {
    const key = getBlockKey(position);
    if (this.overrides.has(key)) {
      return this.overrides.get(key) ?? null;
    }
    return this.getGeneratedBlockType(position);
  }

  private getGeneratedBlockType(position: BlockPosition): BlockType | null {
    const structureBlock = this.getStructureBlockType(position);
    if (structureBlock) return structureBlock;

    const surfaceHeight = this.getSurfaceHeight(position.x, position.z);
    if (position.y < 0 || position.y > WORLD_TOP_HEIGHT || position.y > surfaceHeight) return null;
    if (position.y === surfaceHeight) return "grass";
    if (surfaceHeight - position.y <= 2) return "dirt";
    return "stone";
  }

  private getSurfaceHeight(x: number, z: number) {
    if (withinCabinPlot(x, z)) return CABIN_GROUND_HEIGHT;

    const wave = Math.sin(x * 0.19) * 1.5 + Math.cos(z * 0.17) * 1.3 + Math.sin((x + z) * 0.08) * 1.15;
    const detail = (hashNoise(x, z) - 0.5) * 1.2;
    return Math.max(SEA_LEVEL, Math.min(WORLD_MAX_HEIGHT, Math.round(SEA_LEVEL + 2 + wave + detail)));
  }

  private getStructureBlockType(position: BlockPosition): BlockType | null {
    return this.getCabinBlockType(position) ?? this.getPathBlockType(position) ?? this.getTreeBlockType(position);
  }

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

  private getPathBlockType(position: BlockPosition): BlockType | null {
    const { x, y, z } = position;
    const pathY = CABIN_GROUND_HEIGHT + 1;
    const inPath = Math.abs(x) <= 1 && z >= CABIN_HALF_DEPTH + 1 && z <= CABIN_HALF_DEPTH + PATH_LENGTH;
    return inPath && y === pathY ? "stone" : null;
  }

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

  private isTreeOrigin(x: number, z: number) {
    const distance = Math.sqrt(x * x + z * z);
    if (withinCabinPlot(x, z)) return false;

    const ringNoise = hashNoise(x, z);
    if (distance >= FOREST_RING_RADIUS - 1.4 && distance <= FOREST_RING_RADIUS + 1.8) {
      return ringNoise > 0.73;
    }

    if (distance > FOREST_RING_RADIUS + 1.8 && distance <= FOREST_OUTER_RADIUS) {
      return ringNoise > 0.82 && hashNoise(x + 13, z - 7) > 0.44;
    }

    return false;
  }

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
    return "wood";
  }

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
          (Math.random() - 0.5) * BLOCK_SIZE * 4,
          BLOCK_SIZE * (1.2 + Math.random() * 2.8),
          (Math.random() - 0.5) * BLOCK_SIZE * 4,
        ),
      });
    }
  }

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