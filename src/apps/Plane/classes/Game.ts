import { useCanvas } from "@/apps/Adventure/gameScript/tools/canvas";
import { Gas } from "./Gas";
import { Player } from "./Player";
import { GAME_HEIGHT, GAME_WIDTH } from "../common";
import { Wall } from "./Wall";

const { clear, setContext } = useCanvas(GAME_WIDTH, GAME_HEIGHT);

export class Game {
  over = ref(false);
  score = ref(0);
  player: Player;
  gas: Gas;
  wall: Wall;
  frame: number;
  private animationFrameId: number | null = null;
  private destroyed = false;

  constructor() {
    this.player = new Player();
    this.gas = new Gas();
    this.wall = new Wall();
    this.frame = 0;
  }
  private stopLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  private resetState() {
    this.over.value = false;
    this.score.value = 0;
    this.frame = 0;
    this.player.reset();
    this.gas.reset();
    this.wall.reset();
  }
  private isOutOfBounds() {
    return this.player.rect.y - this.player.rect.h / 2 <= 0 || this.player.rect.y + this.player.rect.h / 2 >= GAME_HEIGHT;
  }
  enterFrame = () => {
    if (this.destroyed) return;
    this.animationFrameId = requestAnimationFrame(this.enterFrame);
    clear();
    this.wall.enterFrame();
    this.gas.enterFrame();
    this.player.enterFrame();
    this.score.value += this.wall.collectPassedScore(this.player.rect.x);
    this.frame++;
    if (this.frame > 1e6) this.frame = 0;
    if (!this.over.value && this.frame % 20 === 0) {
      this.gas.add(this.player.rect.x - 30, this.player.rect.y);
    }
    if (this.wall.hit(this.player.rect) || this.isOutOfBounds()) {
      this.over.value = true;
      this.stopLoop();
    }
  };
  start(cvs: Ref<HTMLCanvasElement | null>) {
    const init = () => {
      setContext(cvs.value?.getContext("2d"));
      this.resetState();
      this.enterFrame();
    };
    onMounted(init);
    onBeforeUnmount(() => this.destroy());
  }
  restart() {
    if (this.destroyed) return;
    this.stopLoop();
    this.resetState();
    this.enterFrame();
  }
  destroy() {
    this.destroyed = true;
    this.stopLoop();
    this.player.destroy();
  }
}
