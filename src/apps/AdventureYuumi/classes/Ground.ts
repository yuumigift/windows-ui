import type { EnterFramePayload, Rect } from "../types";
import { useCanvas } from "../common";

const { draw } = useCanvas();

export class Ground {
  #pixel_size = 20;
  rect_list: Rect[] = [];
  constructor() {
    this.add({ x: 0, y: 500, w: 8000, h: 100 });
    let tail = 0;
    for (let index = 0; index < 20; index++) {
      this.generateSteps(tail + index + 2, 0, 3 + index);
      tail += index + 2 + 2;
    }
  }
  enterFrame({ viewport }: EnterFramePayload) {
    this.rect_list.forEach((rect) => {
      draw(rect.x - viewport.x, rect.y, rect.w + 1, rect.h + 1, "#333");
    });
  }
  add(rect: Rect) {
    this.rect_list.push(rect);
  }
  addCube(x: number, y: number, w: number = 1, h: number = 1) {
    this.add({ x: x * this.#pixel_size, y: 500 - this.#pixel_size - y * this.#pixel_size, w: this.#pixel_size * w, h: this.#pixel_size * h });
  }
  generateSteps(x: number, y: number, step_num: number) {
    for (let index = 0; index < step_num; index++) {
      this.addCube(x + index, y + index, 1, index + 1);
    }
  }
}
