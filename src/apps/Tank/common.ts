/** 整张地图固定为 32 x 32 格。 */
export const MAP_SIZE = 32;

/** 玩家实际能看到的视口是 16 x 16 格。 */
export const VIEWPORT_SIZE = 16;

/** 每个地块对应到画布上的像素尺寸。 */
export const TILE_SIZE = 48;

/** 画布边长由可视格数与单格像素大小共同决定。 */
export const CANVAS_SIZE = VIEWPORT_SIZE * TILE_SIZE;

/** 玩家出生在地图下方中间，和需求保持一致。 */
export const PLAYER_SPAWN = {
  x: Math.floor(MAP_SIZE / 2),
  y: MAP_SIZE - 2,
};

/** 玩家接近视口边缘时，允许保留的安全距离。 */
export const VIEWPORT_EDGE_PADDING = 3.5;

/**
 * 视口采用插值缓动跟随。
 * 这里调得更小，让镜头移动明显更慢、更有拖拽感。
 */
export const VIEWPORT_FOLLOW_LERP = 0.035;

/** 玩家移动速度，单位约为“格/秒”。 */
export const PLAYER_SPEED = 4.2;

/** 敌方移动速度略慢，给玩家更多躲避与瞄准空间。 */
export const ENEMY_SPEED = 2.1;

/** 子弹移动速度显著高于坦克，保证射击手感。 */
export const BULLET_SPEED = 12;

/** 敌方子弹速度减半，让玩家有更清晰的躲避窗口。 */
export const ENEMY_BULLET_SPEED = BULLET_SPEED / 2;

/** 玩家连续发射的最小间隔。 */
export const PLAYER_FIRE_COOLDOWN = 0.28;

/** 敌方开火节奏略慢，避免压力过高。 */
export const ENEMY_FIRE_COOLDOWN = 1.1;

/** 敌方多久重新考虑一次移动方向。 */
export const ENEMY_MOVE_INTERVAL = 1.4;

/** 战场上维持的敌方坦克数量上限。 */
export const ENEMY_COUNT = 6;

/** 子弹撞墙或击中砖块时的火花特效持续时间。 */
export const HIT_EFFECT_DURATION = 0.16;

/** 坦克被摧毁时的爆炸特效持续时间。 */
export const EXPLOSION_EFFECT_DURATION = 0.42;

/** 子弹命中时生成的粒子数量。 */
export const HIT_PARTICLE_COUNT = 8;

/** 坦克爆炸时生成的粒子数量。 */
export const EXPLOSION_PARTICLE_COUNT = 22;

/** 整个小游戏共用的颜色面板。 */
export const COLORS = {
  background: "#16120d",
  empty: "#3f6f38",
  iron: "#95a0ab",
  brick: "#b85d2f",
  grass: "#5cae47",
  water: "#2b74b8",
  player: "#f6d14a",
  enemy: "#ff8c42",
  bullet: "#f8f4e8",
  text: "#f4ead5",
  panel: "rgba(16, 12, 8, 0.82)",
};