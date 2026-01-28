import { GAME_HEIGHT, GAME_WIDTH, useCanvas } from "../common";
import type { EnterFramePayload, Rect } from "../types";
import { Entity } from "./Entity";

const { draw } = useCanvas();

class BulletSpirit extends Entity {
  rect: Rect = {
    x: 0,
    y: 0,
    w: 10,
    h: 10,
  };
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  opacity = 1;
  is_removed = false;
  speed = 5;
  constructor(x: number, y: number, angle: number) {
    super("black");
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.x = x;
    this.y = y;
  }
  enterFrame() {
    this.x += this.vx;
    this.y += this.vy;
    const x = this.x;
    const y = this.y;
    if (x < 0 || x > GAME_WIDTH || y < 0 || y > GAME_HEIGHT) {
      this.is_removed = true;
    }
    draw(this.x, this.y, this.rect.w, this.rect.h, "black");
  }
}

export class Bullet {
  list = [] as BulletSpirit[];
  add(x: number, y: number, angle: number) {
    const bullet = new BulletSpirit(x, y, angle);
    this.list.push(bullet);
  }
  enterFrame(payload: EnterFramePayload) {
    this.list = this.list.filter((bullet) => !bullet.is_removed);
    this.list.forEach((bullet) => {
      bullet.enterFrame();
    });
  }
}
