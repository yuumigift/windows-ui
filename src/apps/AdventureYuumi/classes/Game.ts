import type { ISpiritInstance } from "../types";
import type { Ref } from "vue";
import { useCanvas } from "../common";
import { Player } from "./Player";
import { Ground } from "./Ground";

const { clear, setContext } = useCanvas();

export class Game {
  player: InstanceType<typeof Player> | null = null;
  ground: InstanceType<typeof Ground> | null = null;
  list_platforms: ISpiritInstance[] = [];
  addPlayer(player: InstanceType<typeof Player>) {
    this.player = player;
  }
  addGround(ground: InstanceType<typeof Ground>) {
    this.ground = ground;
  }
  enterFrame() {
    requestAnimationFrame(() => this.enterFrame());
    clear();
    if (!this.player) return;
    if (!this.ground) return;
    this.ground?.enterFrame();
    this.player?.enterFrame({
      ground: this.ground,
    });
  }
  start(cvs: Ref<HTMLCanvasElement | undefined>) {
    const init = () => {
      setContext(cvs.value?.getContext("2d"));
      this.enterFrame();
    };
    onMounted(init);
  }
}
