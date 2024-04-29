import type { EnterFramePayload, Rect } from "../types";
import { useCanvas } from "../common";

const { draw } = useCanvas();

class GroundBase {
  #pixel_size = 20;
  rect_list: Rect[] = [];
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

class StaticGround extends GroundBase {
  constructor() {
    super();
    this.add({ x: 0, y: 500, w: 1e5, h: 100 });
    let tail = 0;
    for (let index = 0; index < 20; index++) {
      this.generateSteps(tail + index + 2, 0, 3 + index);
      tail += index + 2 + 2;
    }
  }
}

class MovingGround extends GroundBase {
  vy = -1;
  constructor() {
    super();
    this.addCube(10, 10, 5, 1);
  }
  enterFrame({ viewport }: EnterFramePayload) {
    this.rect_list.forEach((rect) => {
      if (rect.y < 200) {
        rect.y = 200;
        this.vy = 1;
      }
      if (rect.y > 360) {
        rect.y = 360;
        this.vy = -1;
      }
      rect.y += this.vy;
    });
  }
}

export class Ground extends GroundBase {
  static_ground: StaticGround;
  moving_ground: MovingGround;
  constructor() {
    super();
    this.static_ground = new StaticGround();
    this.moving_ground = new MovingGround();
    this.rect_list = [...this.static_ground.rect_list, ...this.moving_ground.rect_list];
  }
  enterFrame(payload: EnterFramePayload) {
    this.moving_ground.enterFrame(payload);
    this.rect_list.forEach((rect) => {
      draw(rect.x - payload.viewport.x, rect.y, rect.w + 1, rect.h + 1, "#333");
    });
  }
}
