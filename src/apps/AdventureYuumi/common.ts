import type { Rect } from "./types";
export const GRAVITY = 0.05;
export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 80;

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
    ctx.clearRect(0, 0, 800, 600);
  };
  return { draw, clear, setContext };
};

export const block = (a: Rect, b: Rect): { rect: Rect; direction: string } => {
  // 计算a和b的边界
  a = { ...a };
  b = { ...b };
  const aRight = a.x + a.w;
  const aBottom = a.y + a.h;
  const bRight = b.x + b.w;
  const bBottom = b.y + b.h;
  let direction = "";

  // 判断a和b是否有重叠
  if (aRight <= b.x || a.x >= bRight || aBottom <= b.y || a.y >= bBottom) {
    return { rect: a, direction }; // 没有重叠，直接返回原位置
  }

  // 计算重叠区域的宽度和高度
  const overlapWidth = Math.min(aRight, bRight) - Math.max(a.x, b.x);
  const overlapHeight = Math.min(aBottom, bBottom) - Math.max(a.y, b.y);

  // 确定推开的方向：如果重叠宽度较小，则左右推开；如果重叠高度较小，则上下推开
  const pushVertically = overlapHeight < overlapWidth;

  // 计算a和b的中心点
  const centerA = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  const centerB = { x: b.x + b.w / 2, y: b.y + b.h / 2 };

  // 计算新的位置
  let newX = a.x;
  let newY = a.y;
  if (pushVertically) {
    // 上下推开
    if (centerA.y < centerB.y) {
      // a中心点在上方，向上推开
      newY = b.y - a.h;
      direction = "up";
    } else {
      // a中心点在下方或重合，向下推开
      newY = bBottom;
      direction = "down";
    }
  } else {
    // 左右推开
    if (centerA.x < centerB.x) {
      // a中心点在左侧，向左推开
      newX = b.x - a.w;
      direction = "left";
    } else {
      // a中心点在右侧或重合，向右推开
      newX = bRight;
      direction = "right";
    }
  }

  const rect = {
    x: newX,
    y: newY,
    w: a.w,
    h: a.h,
  };
  // 返回调整后的a的位置
  return {
    rect,
    direction,
  };
};
