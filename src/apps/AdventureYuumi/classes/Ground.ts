import { useCanvas } from "../common";
import type { Rect } from "../types";
const { draw } = useCanvas();

export class Ground {
  rect_list: Rect[] = [];
  constructor() {
    this.add({ x: 0, y: 500, w: 800, h: 100 });
    this.add({ x: 200, y: 450, w: 50, h: 50 });
    this.add({ x: 250, y: 400, w: 50, h: 100 });
    this.add({ x: 300, y: 350, w: 50, h: 150 });
    this.add({ x: 350, y: 350, w: 150, h: 50 });
  }
  enterFrame() {
    this.rect_list.forEach((rect) => {
      draw(rect.x, rect.y, rect.w, rect.h, "#333");
    });
  }
  add(rect: Rect) {
    this.rect_list.push(rect);
  }
}
