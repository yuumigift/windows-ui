import type { PushDirection, Rect } from "./types";

// game
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const GRAVITY = 0.05;
export const FRICTION = 0.95;
export const VIEWPORT_PADDING = 350;
export const VIEWPORT_MOVE_FORCE = 0.02;

// player
export const PLAYER_WIDTH = 18;
export const PLAYER_HEIGHT = 38;
export const PLAYER_SPEED_FORCE = 0.1;
export const PLAYER_SPEED_MAX = 5;
export const PLAYER_JUMP_FORCE = 3;

// monster
export const MONSTER_MOVE_WAITING = 300;
export const MONSTER_JUMP_WAITING = 200;
export const MONSTER_WIDTH = 18;
export const MONSTER_HEIGHT = 18;
export const MONSTER_SPEED_FORCE = 0.1;
export const MONSTER_SPEED_MAX = 1;
export const MONSTER_JUMP_FORCE = 2;

let ctx: CanvasRenderingContext2D | undefined | null;
export const useCanvas = () => {
  const checkCtx = (ctx: CanvasRenderingContext2D | undefined | null): ctx is CanvasRenderingContext2D => !!ctx;
  const setContext = (_ctx: CanvasRenderingContext2D | undefined | null) => {
    ctx = _ctx;
  };
  const draw = (x: number, y: number, width: number, height: number, color: string = "black") => {
    if (!checkCtx(ctx)) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  };
  const clear = () => {
    if (!checkCtx(ctx)) return;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  };
  return { draw, clear, setContext };
};

export const block = (a: Rect, b: Rect): { rect: Rect; direction: PushDirection } => {
  // 计算a和b的边界
  const a_right = a.x + a.w;
  const a_bottom = a.y + a.h;
  const b_right = b.x + b.w;
  const b_bottom = b.y + b.h;
  let direction: PushDirection = "";

  // 判断a和b是否有重叠
  if (a_right <= b.x || a.x >= b_right || a_bottom <= b.y || a.y >= b_bottom) {
    return { rect: a, direction }; // 没有重叠，直接返回原位置
  }

  // 计算重叠区域的宽度和高度
  const overlap_width = Math.min(a_right, b_right) - Math.max(a.x, b.x);
  const overlap_height = Math.min(a_bottom, b_bottom) - Math.max(a.y, b.y);

  // 确定推开的方向：如果重叠宽度较小，则左右推开；如果重叠高度较小，则上下推开
  const push_vertically = overlap_height < overlap_width;

  // 计算a和b的中心点
  const center_a = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  const center_b = { x: b.x + b.w / 2, y: b.y + b.h / 2 };

  // 计算新的位置
  let new_x = a.x;
  let new_y = a.y;
  // 上下推开
  if (push_vertically) {
    // a中心点在上方，向上推开
    if (center_a.y < center_b.y) {
      new_y = b.y - a.h;
      direction = "up";
    }
    // a中心点在下方或重合，向下推开
    else {
      new_y = b_bottom;
      direction = "down";
    }
  }
  // 左右推开
  else {
    // a中心点在左侧，向左推开
    if (center_a.x < center_b.x) {
      new_x = b.x - a.w;
      direction = "left";
    }
    // a中心点在右侧或重合，向右推开
    else {
      new_x = b_right;
      direction = "right";
    }
  }

  const rect = {
    x: new_x,
    y: new_y,
    w: a.w,
    h: a.h,
  };
  // 返回调整后的a的位置
  return { rect, direction };
};
