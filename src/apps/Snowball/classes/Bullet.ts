import { GAME_HEIGHT, GAME_WIDTH, useCanvas } from "../common";
import { sendJoin, sendUpdate, sendLeave } from "../client/ws";
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
  id: string;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  opacity = 1;
  is_removed = false;
  speed = 5;
  constructor(x: number, y: number, angle: number, owner_id: string) {
    super(owner_id, "black");
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.x = x;
    this.y = y;
    const rand = Math.random().toString(36).slice(2, 9);
    this.id = owner_id ? `${owner_id}_b_${rand}` : `b_${rand}`;
    // announce bullet to server
    try {
      sendJoin("bullet", this.id, this.x, this.y);
    } catch (e) {
      // ignore if ws not ready
    }
  }
  enterFrame() {
    this.x += this.vx;
    this.y += this.vy;
    const x = this.x;
    const y = this.y;
    if (x < 0 || x > GAME_WIDTH || y < 0 || y > GAME_HEIGHT) {
      this.is_removed = true;
    }
    try {
      sendUpdate("bullet", this.id, this.x, this.y);
    } catch (e) {}
    draw(this.x, this.y, this.rect.w, this.rect.h, "black");
  }
}

export class Bullet {
  owner_id: string;
  constructor(owner_id: string) {
    this.owner_id = owner_id;
  }
  list = [] as BulletSpirit[];
  add(x: number, y: number, angle: number, owner_id: string) {
    const bullet = new BulletSpirit(x, y, angle, owner_id);
    this.list.push(bullet);
  }
  enterFrame(payload: EnterFramePayload) {
    // send update for this bullet
    this.list.forEach((bullet) => {
      if (bullet.is_removed) {
        try {
          sendLeave(bullet.id);
        } catch (e) {}
      }
    });
    this.list = this.list.filter((bullet) => !bullet.is_removed);
    this.list.forEach((bullet) => {
      bullet.enterFrame();
    });
  }
}
