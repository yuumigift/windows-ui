import type { Ref } from "vue";
import { useCanvas } from "../common";
import type { EnterFramePayload } from "../types";
import { Ground } from "./Ground";
import { Monster } from "./Monster";
import { Player } from "./Player";
import { Viewport } from "./Viewport";

const { clear, setContext } = useCanvas();

export class Game {
  monster: Monster | null = null;
  player: Player | null = null;
  ground: Ground | null = null;
  viewport: Viewport | null = null;
  addViewport(viewport: Viewport) {
    this.viewport = viewport;
  }
  addPlayer(player: Player) {
    this.player = player;
  }
  addMonster(monster: Monster) {
    this.monster = monster;
  }
  addGround(ground: Ground) {
    this.ground = ground;
  }
  enterFrame() {
    requestAnimationFrame(() => this.enterFrame());
    clear();
    if (!this.viewport) return;
    if (!this.player) return;
    if (!this.ground) return;
    if (!this.monster) return;
    const enterFramePayload: EnterFramePayload = {
      viewport: this.viewport,
      player: this.player,
      monster: this.monster,
      ground: this.ground,
    };
    this.player.enterFrame(enterFramePayload);
    this.ground.enterFrame(enterFramePayload);
    this.monster.enterFrame(enterFramePayload);
  }
  start(cvs: Ref<HTMLCanvasElement | undefined>) {
    const init = () => {
      setContext(cvs.value?.getContext("2d"));
      this.enterFrame();
    };
    onMounted(init);
  }
}
