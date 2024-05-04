import type { Ref } from "vue";
import type { Ground } from "./classes/Ground";
import type { Monster } from "./classes/Monster";
import type { Player } from "./classes/Player";
import type { Spark } from "./classes/Spark.";
import type { Viewport } from "./classes/Viewport";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EnterFramePayload {
  global: {
    over: Ref<boolean>;
    win: Ref<boolean>;
  };
  player: Player;
  monster: Monster;
  ground: Ground;
  viewport: Viewport;
  spark: Spark;
}

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
