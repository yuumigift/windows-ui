import { useCanvas } from "../common";
import type { Rect } from "../types";
const { draw } = useCanvas();

export class Ground {
  rect_list: Rect[] = [];
  #_pixel_size = 20;
  constructor() {
    this.add({ x: 0, y: 500, w: 800, h: 100 });
    let tail = 0;
    for (let index = 0; index < 6; index++) {
      this.generateSteps(tail + index + 2, 0, 2 + index);
      tail += index + 2 + 2;
    }
  }
  enterFrame() {
    this.rect_list.forEach((rect) => {
      draw(rect.x, rect.y, rect.w, rect.h, "#333");
    });
  }
  add(rect: Rect) {
    this.rect_list.push(rect);
  }
  addCube(x: number, y: number, w: number = 1, h: number = 1) {
    this.add({ x: x * this.#_pixel_size, y: 500 - this.#_pixel_size - y * this.#_pixel_size, w: this.#_pixel_size * w, h: this.#_pixel_size * h });
  }
  generateSteps(x: number, y: number, step_num: number) {
    for (let index = 0; index < step_num; index++) {
      this.addCube(x + index, y + index, 1, index + 1);
    }
  }
}
