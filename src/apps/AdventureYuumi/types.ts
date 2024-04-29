import { Player } from "./classes/Player";
import { Ground } from "./classes/Ground";
import { Viewport } from "./classes/Viewport";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type EnterFramePayload = {
  player: InstanceType<typeof Player>;
  ground: InstanceType<typeof Ground>;
  viewport: InstanceType<typeof Viewport>;
};
