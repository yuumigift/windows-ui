/**
 * Minecraft 示例的全局常量配置。
 *
 * 这里集中维护画面尺寸、世界单位、玩家物理参数以及地形生成参数，
 * 便于不同模块（`Game` / `Viewport` / `World`）使用统一的数值体系。
 */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

/** 世界中的 1 个逻辑方块会被渲染为多少 Three.js 世界单位。 */
export const WORLD_SCALE = 10;
/** 单个区块在 X/Z 平面上包含的列数。 */
export const CHUNK_SIZE = 14;
/** 以玩家所在区块为中心，向外额外保留多少圈区块。 */
export const CHUNK_RENDER_DISTANCE = 3;
/** 单帧内用于构建区块网格的时间预算，单位毫秒，用来减轻卡顿。 */
export const CHUNK_BUILD_TIME_BUDGET = 5;
/** 自然地形允许生成到的最大高度。 */
export const WORLD_MAX_HEIGHT = 7;
/** 世界中允许存在方块的绝对最高层，建筑/树冠也不能超过该值。 */
export const WORLD_TOP_HEIGHT = 14;
/** 海平面高度，也是地形噪声的下限之一。 */
export const SEA_LEVEL = 2;
/** 单个方块在 Three.js 世界中的边长。 */
export const BLOCK_SIZE = 1 * WORLD_SCALE;

/** 正常行走速度。 */
export const MOVE_SPEED = 6.5 * WORLD_SCALE;
/** 按住 Shift 时的冲刺倍率。 */
export const SPRINT_MULTIPLIER = 1.35;
/** 鼠标视角灵敏度。 */
export const LOOK_SENSITIVITY = 0.0022;
/** 方块交互（射线检测）的最大距离。 */
export const MAX_RAYCAST_DISTANCE = 8 * WORLD_SCALE;
/** 相机远裁剪面，确保远处区块也能正常显示。 */
export const CAMERA_FAR = 1200 * WORLD_SCALE;
/** 重力加速度。 */
export const GRAVITY = 52 * WORLD_SCALE;
/** 跳跃起始速度。 */
export const JUMP_VELOCITY = 16 * WORLD_SCALE;
/** 玩家碰撞体总高度。 */
export const PLAYER_HEIGHT = BLOCK_SIZE * 1.75;
/** 玩家眼睛相对脚底的高度，用于第一人称视角和落地判定。 */
export const PLAYER_EYE_HEIGHT = BLOCK_SIZE * 1.55;
/** 玩家碰撞体半径，按圆柱近似。 */
export const PLAYER_RADIUS = BLOCK_SIZE * 0.32;
/** 垂直移动时允许“吸附”到地面的最大距离。 */
export const GROUND_SNAP_HEIGHT = BLOCK_SIZE * 1.15;
/** 水平移动后允许向下寻找台阶的最大高度，避免边缘瞬移到更低平台。 */
export const STEP_DOWN_HEIGHT = BLOCK_SIZE * 0.22;

/** 木屋地基高度，木屋周围地形会被强制拉平到这一层。 */
export const CABIN_GROUND_HEIGHT = 4;
/** 木屋在 X 方向上的半宽。 */
export const CABIN_HALF_WIDTH = 3;
/** 木屋在 Z 方向上的半深度。 */
export const CABIN_HALF_DEPTH = 2;
/** 木屋墙体高度。 */
export const CABIN_WALL_HEIGHT = 3;
/** 屋顶向外挑出的宽度。 */
export const CABIN_ROOF_OVERHANG = 1;
/** 木屋前方石头小路的长度。 */
export const PATH_LENGTH = 14;
/** 森林第一圈的半径，主要用于制造“围绕木屋”的分布感。 */
export const FOREST_RING_RADIUS = 11;
/** 树林最外层的半径，超出后不再生成树。 */
export const FOREST_OUTER_RADIUS = 24;
/** 森林内圈生成树的噪声阈值，值越高树越少。 */
export const FOREST_RING_TREE_THRESHOLD = 0.82;
/** 森林外圈生成树的噪声阈值，值越高树越少。 */
export const FOREST_OUTER_TREE_THRESHOLD = 0.9;
/** 外圈树木额外采样的第二层筛选阈值，用于进一步拉开树间距。 */
export const FOREST_OUTER_SECONDARY_THRESHOLD = 0.56;

/** 玩家初始出生点，Y 值同时考虑地基高度、玩家身高与视角高度。 */
export const CAMERA_START = {
  x: 0,
  y: (CABIN_GROUND_HEIGHT + 1.5) * BLOCK_SIZE + PLAYER_EYE_HEIGHT,
  z: 12 * WORLD_SCALE,
};
