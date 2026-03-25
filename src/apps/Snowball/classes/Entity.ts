import { useCanvas } from "../common";
import type { Rect } from "../types";

const { draw, stroke, text } = useCanvas();

export class Entity {
  name?: string;
  owner_id: string;
  rect: Rect = {
    w: 0,
    h: 0,
    x: 0,
    y: 0,
  };
  vx = 0;
  vy = 0;
  health = 50;
  color = "black";
  constructor(owner_id: string, name: string, color: string) {
    this.name = name;
    this.owner_id = owner_id;
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
    // 本体
    draw(this.rect.x, this.rect.y, this.rect.w, this.rect.h, this.color);

    // 名字
    if (this.name) {
      // 把名字渲染在实体上方（以实体中心 x 为中心）
      const nameY = this.rect.y - this.rect.h / 2 - 20;
      text(this.rect.x, nameY, this.name, "black", "12px Arial");
      console.log(this.name);
    }

    // 血条
    const barTotalW = this.rect.w * 2;
    const barH = 6;
    const barY = this.rect.y - this.rect.h / 2 - 10;
    const fillW = barTotalW * (this.health / 100);
    const fillCenterX = this.rect.x - barTotalW / 2 + fillW / 2;
    draw(fillCenterX, barY, fillW, barH, "red");

    // 血条边框
    stroke(this.rect.x, barY, barTotalW, barH, "black", 1);
  }
}
