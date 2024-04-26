import { useCanvas } from "../common";
import type { Rect } from "../types";
const { draw } = useCanvas();

export class Ground {
  rect_list: Rect[] = [];
  constructor() {
    this.add({
      x: 0,
      y: 400,
      w: 800,
      h: 200,
    });
    this.add({
      x: 300,
      y: 260,
      w: 100,
      h: 50,
    });
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
