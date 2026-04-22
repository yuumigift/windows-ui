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
  private animationFrameId = 0;
  private started = false;

  constructor() {
    this.viewport = new Viewport();
    this.player = new Player();
    this.monster = new Monster();
    this.ground = new Ground();
    this.spark = new Spark();
    this.reset();
  }
  enterFrame() {
    this.animationFrameId = requestAnimationFrame(() => this.enterFrame());
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
    this.ground.enterFrame(enterFramePayload);
    this.monster.enterFrame(enterFramePayload);
    this.player.enterFrame(enterFramePayload);
    this.spark.enterFrame(enterFramePayload);
  }
  reset() {
    this.global.over.value = false;
    this.global.win.value = false;
    this.viewport.reset();
    this.ground.reset();
    this.player.reset(this.ground.spawnPoint.x, this.ground.spawnPoint.y);
    this.monster.reset(this.ground);
    this.spark.list = [];
  }
  start(cvs: Ref<HTMLCanvasElement | undefined>) {
    const init = () => {
      setContext(cvs.value?.getContext("2d"));
      this.reset();
      if (this.started) return;
      this.started = true;
      this.enterFrame();
    };
    onMounted(init);
    onBeforeUnmount(() => {
      cancelAnimationFrame(this.animationFrameId);
      this.started = false;
    });
  }
}
