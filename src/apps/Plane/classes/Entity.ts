import { useCanvas } from "@/gameScript/tools/canvas";
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY } from "../common";
import type { Rect, RenderConfig } from "../types";

const { drawImg, drawCircle, drawRect } = useCanvas(GAME_WIDTH, GAME_HEIGHT);

export class Entity {
  is_falling = true;
  rect: Rect = {
    w: 0,
    h: 0,
    x: 0,
    y: 0,
  };
  ax = 0;
  ay = 0;
  vx = 0;
  vy = 0;

  render_config: RenderConfig = null;

  constructor(render_config: RenderConfig) {
    this.render_config = render_config;
  }
  move() {
    // 运动
    this.vx += this.ax;
    this.vy += this.ay;
    this.rect.x += this.vx;
    this.rect.y += this.vy;
    if (this.is_falling) this.vy += GRAVITY;
  }
  draw() {
    if (this.render_config?.type === "img") {
      drawImg(this.rect.x, this.rect.y, this.rect.w, this.rect.h, this.render_config.img);
    }
    if (this.render_config?.type === "circle") {
      drawCircle(this.rect.x, this.rect.y, this.rect.w, this.render_config.color);
    }
    if (this.render_config?.type === "rect") {
      drawRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h, this.render_config.color);
    }
  }
}
