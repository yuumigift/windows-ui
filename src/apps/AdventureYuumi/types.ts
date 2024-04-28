import { Player } from "./classes/Player";
import { Ground } from "./classes/Ground";
import { Scene } from "./classes/Scene";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type EnterFramePayload = {
  player: InstanceType<typeof Player>;
  ground: InstanceType<typeof Ground>;
  scene: InstanceType<typeof Scene>;
};
