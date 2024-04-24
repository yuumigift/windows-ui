export const GRAVITY = 0.05;

let ctx: CanvasRenderingContext2D | undefined | null;
export const useCanvas = () => {
  const checkCtx = (ctx: CanvasRenderingContext2D | undefined | null): ctx is CanvasRenderingContext2D => {
    if (!ctx) return false;
    return true;
  };
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
