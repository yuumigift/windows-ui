import type { Ref } from "vue";
import { useCanvas } from "../common";
import type { EnterFramePayload, GameInitInfo } from "../types";
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
  global = {
    over: ref(false),
    win: ref(false),
  };
  constructor(info: GameInitInfo) {
    this.viewport = info.viewport;
    this.player = info.player;
    this.monster = info.monster;
    this.ground = info.ground;
  }
  enterFrame() {
    requestAnimationFrame(() => this.enterFrame());
    if(this.global.over.value) return;
    if(this.global.win.value) return;
    clear();
    const enterFramePayload: EnterFramePayload = {
      viewport: this.viewport,
      player: this.player,
      monster: this.monster,
      ground: this.ground,
      global: this.global,
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
