import type { Player } from "./classes/Player";
import type { Bullet } from "./classes/Bullet";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EnterFramePayload {
  player: Player;
  bullet: Bullet;
}

export type MoveConfig = {
  speed_force: number;
  speed_max: number;
  jump_force: number;
};

export type PushDirection = "left" | "right" | "up" | "down" | "";
