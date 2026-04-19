export type BlockType = "grass" | "dirt" | "stone" | "wood" | "glass";

export const BLOCK_TYPES: BlockType[] = ["grass", "dirt", "stone", "wood", "glass"];

export interface BlockPosition {
  x: number;
  y: number;
  z: number;
}

export interface BlockData {
  type: BlockType;
  position: BlockPosition;
}

export interface TerrainCell {
  height: number;
}

export interface ChunkCoordinate {
  x: number;
  z: number;
}
