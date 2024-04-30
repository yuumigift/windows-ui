import type { EnterFramePayload, Rect } from "../types";
import { useCanvas } from "../common";

const { draw } = useCanvas();

class GroundBase {
  #pixel_size = 20;
  rect: Rect;
  constructor() {
    this.rect = { x: 0, y: 0, w: 0, h: 0 };
  }
  setCube(x: number, y: number, w: number = 1, h: number = 1) {
    this.rect = { x: x * this.#pixel_size, y: 500 - this.#pixel_size - y * this.#pixel_size, w: this.#pixel_size * w, h: this.#pixel_size * h };
  }
  enterFrame(payload: EnterFramePayload) {
    draw(this.rect.x - payload.viewport.x, this.rect.y, this.rect.w + 1, this.rect.h + 1, "#333");
  }
}

class GroundGroupBase {
  list: GroundBase[] = [];
  enterFrame(payload: EnterFramePayload) {
    this.list.forEach((ground) => {
      ground.enterFrame(payload);
    });
  }
}

class StaticGroundGroup extends GroundGroupBase {
  constructor() {
    super();
    const underground = new GroundBase();
    underground.rect = { x: 0, y: 500, w: 1e5, h: 100 };
    this.list.push(underground);
    let tail = 0;
    for (let index = 0; index < 20; index++) {
      this.generateSteps(tail + index + 2, 0, 3 + index);
      tail += index + 2 + 2;
    }
  }
  generateSteps(x: number, y: number, step_num: number) {
    for (let index = 0; index < step_num; index++) {
      const underground = new GroundBase();
      underground.setCube(x + index, y + index, 1, index + 1);
      this.list.push(underground);
    }
  }
}

class MovingGround extends GroundBase {
  vy = -1;
  top = 0;
  bottom = 0;
  speed = 1;
  constructor() {
    super();
  }
  setMovingRange(top: number, bottom: number, speed: number = 1) {
    this.top = top;
    this.bottom = bottom;
    this.speed = speed;
  }
  enterFrame(payload: EnterFramePayload) {
    if (this.rect.y < this.top) {
      this.rect.y = this.top;
      this.vy = this.speed;
    }
    if (this.rect.y > this.bottom) {
      this.rect.y = this.bottom;
      this.vy = -this.speed;
    }
    this.rect.y += this.vy;
    super.enterFrame(payload);
  }
}

class MovingGroundGroup extends GroundGroupBase {
  list: MovingGround[] = [];
  constructor() {
    super();
    const ground_1 = new MovingGround();
    ground_1.setCube(10, 10, 3, 1);
    ground_1.setMovingRange(200, 360, 1);
    const ground_2 = new MovingGround();
    ground_2.setCube(15, 15, 5, 1);
    ground_2.setMovingRange(80, 260, 0.6);
    this.list.push(ground_1, ground_2);
  }
}

export class Ground extends GroundGroupBase {
  constructor() {
    super();
    const static_ground_group = new StaticGroundGroup();
    const moving_ground_group = new MovingGroundGroup();
    this.list = [...static_ground_group.list, ...moving_ground_group.list];
  }
}
