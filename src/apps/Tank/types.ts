/** 地图格子的地形类型。 */
export type TerrainType = "empty" | "iron" | "brick" | "grass" | "water";

/** 坦克和子弹都只允许四方向移动。 */
export type Direction = "up" | "down" | "left" | "right";

/** 玩家与敌人共享的坦克运行时结构。 */
export interface TankEntity {
  id: number;
  kind: "player" | "enemy";
  x: number;
  y: number;
  direction: Direction;
  fireCooldown: number;
  aiMoveCooldown?: number;
  desiredDirection?: Direction;
}

/** 子弹只记录所属方、位置与方向。 */
export interface BulletEntity {
  id: number;
  owner: "player" | "enemy";
  x: number;
  y: number;
  direction: Direction;
}

/** 命中火花与爆炸统一抽象为特效实体。 */
export interface EffectEntity {
  id: number;
  kind: "hit" | "explosion";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  age: number;
  duration: number;
}