import type { EnterFramePayload } from "../types";
import type { Ref } from "vue";
import { Ground } from "./Ground";
import { Player } from "./Player";
import { Viewport } from "./Viewport";
import { useCanvas } from "../common";

const { clear, setContext } = useCanvas();

export class Game {
  player: InstanceType<typeof Player> | null = null;
  ground: InstanceType<typeof Ground> | null = null;
  viewport: InstanceType<typeof Viewport> | null = null;
  addPlayer(player: InstanceType<typeof Player>) {
    this.player = player;
  }
  addGround(ground: InstanceType<typeof Ground>) {
    this.ground = ground;
  }
  addViewport(viewport: InstanceType<typeof Viewport>) {
    this.viewport = viewport;
  }
  enterFrame() {
    requestAnimationFrame(() => this.enterFrame());
    clear();
    if (!this.viewport) return;
    if (!this.player) return;
    if (!this.ground) return;
    const enterFramePayload: EnterFramePayload = {
      viewport: this.viewport,
      player: this.player,
      ground: this.ground,
    };
    this.player.enterFrame(enterFramePayload);
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
