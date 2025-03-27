import type { Gas } from "./classes/Gas";
import type { Player } from "./classes/Player";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RenderConfigRect {
  type: "rect";
  color: string;
}
interface RenderConfigCircle {
  type: "circle";
  color: string;
}
interface RenderConfigImg {
  type: "img";
  img: HTMLImageElement;
}
export type RenderConfig = RenderConfigRect | RenderConfigCircle | RenderConfigImg | null;

export type MoveConfig = {
  speed_force: number;
  speed_max: number;
  jump_force: number;
};

export type PushDirection = "left" | "right" | "up" | "down" | "";

export type Color = {
  r: number;
  g: number;
  b: number;
};
