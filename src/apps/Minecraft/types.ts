/**
 * 当前世界中支持的所有方块类型。
 *
 * 这里既决定了工具栏中能放置哪些方块，
 * 也决定了 `World` 中材质、地形与结构生成的可选值。
 */
export type BlockType = "grass" | "dirt" | "stone" | "wood" | "glass" | "leaf";

/** 用于遍历方块类型的顺序数组，例如滚轮切换、工具栏渲染。 */
export const BLOCK_TYPES: BlockType[] = ["grass", "dirt", "stone", "wood", "glass", "leaf"];

/** 逻辑网格坐标，单位是“方块”，而不是 Three.js 场景单位。 */
export interface BlockPosition {
  x: number;
  y: number;
  z: number;
}

/** 渲染层或生成层使用的完整方块描述。 */
export interface BlockData {
  type: BlockType;
  position: BlockPosition;
}

/** 单个地形列的缓存信息，目前只保存表面高度。 */
export interface TerrainCell {
  height: number;
}

/** 区块坐标，按 X/Z 平面划分。 */
export interface ChunkCoordinate {
  x: number;
  z: number;
}
