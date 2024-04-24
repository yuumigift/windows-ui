import type { ISpiritInstance } from "../types";
import type { Ref } from "vue";
import { useCanvas } from "../common";

const { clear, setContext } = useCanvas();

export class Game {
  player: ISpiritInstance | null = null;
  ground: ISpiritInstance | null = null;
  list_platforms: ISpiritInstance[] = [];
  addPlayer(player: ISpiritInstance) {
    this.player = player;
  }
  addGround(ground: ISpiritInstance) {
    this.ground = ground;
  }
  enterFrame() {
    requestAnimationFrame(() => this.enterFrame());
    clear();
    this.player?.enterFrame();
    this.ground?.enterFrame();
  }
  start(cvs: Ref<HTMLCanvasElement | undefined>) {
    const init = () => {
      setContext(cvs.value?.getContext("2d"));
      this.enterFrame();
    };
    onMounted(init);
  }
}
