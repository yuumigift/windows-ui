import { GAME_HEIGHT, GAME_WIDTH } from "../common";
import type { EnterFramePayload } from "../types";
import type { Bullet } from "./Bullet";
import { Entity } from "./Entity";

export class Player extends Entity {
  is_left = false;
  is_right = false;
  is_up = false;
  is_down = false;
  speed = 2;
  size = 20;
  constructor(color: string = "teal") {
    super(color);
    this.rect.x = Math.random() * GAME_WIDTH;
    this.rect.y = Math.random() * GAME_HEIGHT;
    this.rect.w = this.size;
    this.rect.h = this.size;
    addEventListener("keydown", (e) => {
      switch (e.key) {
        case "w": {
          this.is_up = true;
          break;
        }
        case "s": {
          this.is_down = true;
          break;
        }
        case "a": {
          this.is_left = true;
          break;
        }
        case "d": {
          this.is_right = true;
          break;
        }
      }
    });
    addEventListener("keyup", (e) => {
      switch (e.key) {
        case "w": {
          this.is_up = false;
          break;
        }
        case "s": {
          this.is_down = false;
          break;
        }
        case "a": {
          this.is_left = false;
          break;
        }
        case "d": {
          this.is_right = false;
          break;
        }
      }
    });
  }
  addMouseListener(canvas: HTMLCanvasElement, bullet: Bullet, ownerId?: string) {
    canvas.addEventListener("mousedown", (e) => {
      // 发射雪球
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      const bulletAngle = Math.atan2(mouseY - this.rect.y, mouseX - this.rect.x);
      bullet.add(this.rect.x, this.rect.y, bulletAngle, ownerId);
    });
  }
  computeDirection() {
    const is_left = this.is_left;
    const is_right = this.is_right;
    const is_up = this.is_up;
    const is_down = this.is_down;
    if (is_left && !is_right && !is_up && !is_down) {
      this.vx = -this.speed;
      this.vy = 0;
    } else if (is_right && !is_left && !is_up && !is_down) {
      this.vx = this.speed;
      this.vy = 0;
    } else if (is_up && !is_down && !is_left && !is_right) {
      this.vx = 0;
      this.vy = -this.speed;
    } else if (is_down && !is_up && !is_left && !is_right) {
      this.vx = 0;
      this.vy = this.speed;
    } else if (is_up && is_left && !is_down && !is_right) {
      this.vx = -this.speed * Math.SQRT1_2;
      this.vy = -this.speed * Math.SQRT1_2;
    } else if (is_up && is_right && !is_down && !is_left) {
      this.vx = this.speed * Math.SQRT1_2;
      this.vy = -this.speed * Math.SQRT1_2;
    } else if (is_down && is_left && !is_up && !is_right) {
      this.vx = -this.speed * Math.SQRT1_2;
      this.vy = this.speed * Math.SQRT1_2;
    } else if (is_down && is_right && !is_up && !is_left) {
      this.vx = this.speed * Math.SQRT1_2;
      this.vy = this.speed * Math.SQRT1_2;
    } else {
      this.vx = 0;
      this.vy = 0;
    }
  }
  enterFrame(enterFramePayload: EnterFramePayload) {
    this.computeDirection();
    this.move();
    this.draw();
  }
}
