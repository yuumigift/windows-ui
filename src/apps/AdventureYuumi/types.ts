import { Ground } from "./classes/Ground";
import { Monster } from "./classes/Monster";
import { Player } from "./classes/Player";
import { Viewport } from "./classes/Viewport";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type EnterFramePayload = {
  player: Player;
  monster: Monster;
  ground: Ground;
  viewport: Viewport;
};

export type MoveConfig = {
  speed_force: number;
  speed_max: number;
  jump_force: number;
};
