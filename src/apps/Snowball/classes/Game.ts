import type { useTemplateRef } from "vue";
import { useCanvas } from "../common";
import type { EnterFramePayload } from "../types";
import { Bullet } from "./Bullet";
import { Player } from "./Player";

const { clear, setContext } = useCanvas();

export class Game {
  player: Player;
  bullet: Bullet;
  canvas: ReturnType<typeof useTemplateRef<HTMLCanvasElement>> | undefined;

  constructor() {
    this.player = new Player();
    this.bullet = new Bullet();
  }
  enterFrame() {
    requestAnimationFrame(() => this.enterFrame());
    clear();
    const enterFramePayload: EnterFramePayload = {
      player: this.player,
      bullet: this.bullet,
    };
    this.player.enterFrame(enterFramePayload);
    this.bullet.enterFrame(enterFramePayload);
  }
  start(cvs: ReturnType<typeof useTemplateRef<HTMLCanvasElement>>) {
    const init = () => {
      // 设置
      setContext(cvs.value?.getContext("2d"));
      this.player.addMouseListener(cvs.value!, this.bullet);
      this.enterFrame();
    };
    onMounted(init);
  }
}
