import { useCanvas } from "../common";
import type { Rect } from "../types";

const { draw } = useCanvas();

export class Entity {
  rect: Rect = {
    w: 0,
    h: 0,
    x: 0,
    y: 0,
  };
  vx = 0;
  vy = 0;
  color = "black";
  constructor(color: string) {
    this.color = color;
  }
  move() {
    // 运动
    this.rect.x += this.vx;
    this.rect.y += this.vy;

    // 边界
    if (this.rect.x < 0) {
      this.rect.x = 0;
    }
  }
  draw() {
    draw(this.rect.x, this.rect.y, this.rect.w, this.rect.h, this.color);
  }
}
