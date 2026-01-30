import type { useTemplateRef } from "vue";
import { onMounted } from "vue";
import { useCanvas } from "../common";
import type { EnterFramePayload } from "../types";
import { Bullet } from "./Bullet";
import { Player } from "./Player";
import { connect, onState, sendJoin, sendLeave, sendUpdate } from "../client/ws";

const { clear, setContext, draw } = useCanvas();

export class Game {
  player: Player;
  bullet: Bullet;
  canvas: ReturnType<typeof useTemplateRef<HTMLCanvasElement>> | undefined;
  // remote entities received from server
  remotePlayers: Array<any> = [];
  remoteBullets: Array<any> = [];
  clientId: string;
  updateTimer: any;

  constructor() {
    this.clientId = `p_${Math.random().toString(36).slice(2, 9)}`;
    this.player = new Player(this.clientId);
    this.bullet = new Bullet(this.clientId);
  }
  enterFrame() {
    requestAnimationFrame(() => this.enterFrame());
    clear();
    // draw remote players
    this.remotePlayers.forEach((p) => {
      draw(p.x, p.y, 20, 20, "red");
    });
    // draw remote bullets
    this.remoteBullets.forEach((b) => {
      draw(b.x, b.y, 10, 10, "gray");
    });
    const enterFramePayload: EnterFramePayload = {
      player: this.player,
      bullet: this.bullet,
      remotePlayers: this.remotePlayers,
      remoteBullets: this.remoteBullets,
    };
    this.player.enterFrame(enterFramePayload);
    this.bullet.enterFrame(enterFramePayload);
  }
  start(cvs: ReturnType<typeof useTemplateRef<HTMLCanvasElement>>) {
    const init = () => {
      setContext(cvs.value?.getContext("2d"));

      // connect to websocket server
      const ws = connect();
      sendJoin("player", this.clientId, this.player.rect.x, this.player.rect.y);
      this.player.addMouseListener(cvs.value!, this.bullet, this.clientId);

      // handle incoming state from server
      onState((state) => {
        this.remotePlayers = state.players.filter((p) => p.id !== this.clientId);
        this.remoteBullets = (state.bullets || []).filter((b) => !(typeof b.id === "string" && b.id.startsWith(this.clientId)));
      });

      // periodic update of our player position (60Hz)
      this.updateTimer = setInterval(() => {
        sendUpdate("player", this.clientId, this.player.rect.x, this.player.rect.y);
      }, 1000 / 60);

      this.enterFrame();
    };
    onMounted(init);
  }
  close() {
    clearInterval(this.updateTimer);
    this.player.close();
    sendLeave(this.clientId);
  }
}
