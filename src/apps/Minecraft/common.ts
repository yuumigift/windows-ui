export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

export const WORLD_SCALE = 10;
export const CHUNK_SIZE = 10;
export const CHUNK_RENDER_DISTANCE = 2;
export const WORLD_MAX_HEIGHT = 7;
export const WORLD_TOP_HEIGHT = 14;
export const SEA_LEVEL = 2;
export const BLOCK_SIZE = 1 * WORLD_SCALE;

export const MOVE_SPEED = 6.5 * WORLD_SCALE;
export const SPRINT_MULTIPLIER = 1.35;
export const LOOK_SENSITIVITY = 0.0022;
export const MAX_RAYCAST_DISTANCE = 8 * WORLD_SCALE;
export const CAMERA_FAR = 1200 * WORLD_SCALE;
export const GRAVITY = 52 * WORLD_SCALE;
export const JUMP_VELOCITY = 16 * WORLD_SCALE;
export const PLAYER_HEIGHT = BLOCK_SIZE * 1.75;
export const PLAYER_EYE_HEIGHT = BLOCK_SIZE * 1.55;
export const PLAYER_RADIUS = BLOCK_SIZE * 0.32;
export const GROUND_SNAP_HEIGHT = BLOCK_SIZE * 1.15;

export const CABIN_GROUND_HEIGHT = 4;
export const CABIN_HALF_WIDTH = 3;
export const CABIN_HALF_DEPTH = 2;
export const CABIN_WALL_HEIGHT = 3;
export const CABIN_ROOF_OVERHANG = 1;
export const PATH_LENGTH = 14;
export const FOREST_RING_RADIUS = 11;
export const FOREST_OUTER_RADIUS = 24;

export const CAMERA_START = {
  x: 0,
  y: (CABIN_GROUND_HEIGHT + 1.5) * BLOCK_SIZE + PLAYER_EYE_HEIGHT,
  z: 12 * WORLD_SCALE,
};
