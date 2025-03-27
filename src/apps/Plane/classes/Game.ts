import { useCanvas } from "@/gameScript/tools/canvas";
import { type Ref } from "vue";
import { Gas } from "./Gas";
import { Player } from "./Player";

const { clear, setContext } = useCanvas(800, 600);

export class Game {
  player: Player;
  gas: Gas;
  frame: number;

  constructor() {
    this.player = new Player();
    this.gas = new Gas();
    this.frame = 0;
  }
  enterFrame() {
    requestAnimationFrame(() => this.enterFrame());
    clear();
    this.player.enterFrame();
    this.gas.enterFrame();
    this.frame++;
    if (this.frame > 1e6) this.frame = 0;
    if (this.frame % 20 === 0) {
      this.gas.add(this.player.rect.x - 30, this.player.rect.y);
    }
  }
  start(cvs: Ref<HTMLCanvasElement | null>) {
    const init = () => {
      setContext(cvs.value?.getContext("2d"));
      this.enterFrame();
    };
    onMounted(init);
  }
}
