import type { Ref } from "vue";
import { useCanvas } from "../common";
import type { EnterFramePayload } from "../types";
import { Ground } from "./Ground";
import { Monster } from "./Monster";
import { Player } from "./Player";
import { Viewport } from "./Viewport";

const { clear, setContext } = useCanvas();

export class Game {
  viewport: Viewport;
  player: Player;
  monster: Monster;
  ground: Ground;
  constructor(payload: EnterFramePayload) {
    this.viewport = payload.viewport;
    this.player = payload.player;
    this.monster = payload.monster;
    this.ground = payload.ground;
  }
  enterFrame() {
    requestAnimationFrame(() => this.enterFrame());
    clear();
    const enterFramePayload: EnterFramePayload = {
      viewport: this.viewport,
      player: this.player,
      monster: this.monster,
      ground: this.ground,
    };
    this.viewport.enterFrame(enterFramePayload);
    this.player.enterFrame(enterFramePayload);
    this.monster.enterFrame(enterFramePayload);
    this.ground.enterFrame(enterFramePayload);
  }
  start(cvs: Ref<HTMLCanvasElement | undefined>) {
    const init = () => {
      setContext(cvs.value?.getContext("2d"));
      this.enterFrame();
    };
    onMounted(init);
  }
}
