import type { Ref } from "vue";
import { useCanvas } from "../common";
import type { EnterFramePayload } from "../types";
import { Ground } from "./Ground";
import { Monster } from "./Monster";
import { Player } from "./Player";
import { Spark } from "./Spark.";
import { Viewport } from "./Viewport";

const { clear, setContext } = useCanvas();

export class Game {
  global = {
    over: ref(false),
    win: ref(false),
  };
  viewport: Viewport;
  player: Player;
  monster: Monster;
  ground: Ground;
  spark: Spark;

  constructor() {
    this.viewport = new Viewport();
    this.player = new Player();
    this.monster = new Monster();
    this.ground = new Ground();
    this.spark = new Spark();
  }
  enterFrame() {
    requestAnimationFrame(() => this.enterFrame());
    if (this.global.over.value) return;
    if (this.global.win.value) return;
    clear();
    const enterFramePayload: EnterFramePayload = {
      global: this.global,
      viewport: this.viewport,
      player: this.player,
      monster: this.monster,
      ground: this.ground,
      spark: this.spark,
    };
    this.viewport.enterFrame(enterFramePayload);
    this.player.enterFrame(enterFramePayload);
    this.monster.enterFrame(enterFramePayload);
    this.ground.enterFrame(enterFramePayload);
    this.spark.enterFrame(enterFramePayload);
  }
  start(cvs: Ref<HTMLCanvasElement | undefined>) {
    const init = () => {
      setContext(cvs.value?.getContext("2d"));
      this.enterFrame();
    };
    onMounted(init);
  }
}
