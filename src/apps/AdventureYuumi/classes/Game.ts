import type { EnterFramePayload } from "../types";
import type { Ref } from "vue";
import { Ground } from "./Ground";
import { Player } from "./Player";
import { Scene } from "./Scene";
import { useCanvas } from "../common";

const { clear, setContext } = useCanvas();

export class Game {
  player: InstanceType<typeof Player> | null = null;
  ground: InstanceType<typeof Ground> | null = null;
  scene: InstanceType<typeof Scene> | null = null;
  addPlayer(player: InstanceType<typeof Player>) {
    this.player = player;
  }
  addGround(ground: InstanceType<typeof Ground>) {
    this.ground = ground;
  }
  addScene(scene: InstanceType<typeof Scene>) {
    this.scene = scene;
  }
  enterFrame() {
    requestAnimationFrame(() => this.enterFrame());
    clear();
    if (!this.scene) return;
    if (!this.player) return;
    if (!this.ground) return;
    const enterFramePayload: EnterFramePayload = {
      scene: this.scene,
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
