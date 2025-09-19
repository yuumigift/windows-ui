import { Entity } from "./Entity";

class GasEntity extends Entity {
  constructor(x: number, y: number) {
    super({
      type: "circle",
      color: "#0002",
    });
    this.rect.x = x;
    this.rect.y = y;
    this.rect.w = 30;
    this.rect.h = 30;
    this.is_falling = false;
    this.vx = -1;
  }
  enterFrame() {
    this.move();
    this.draw();
  }
}

export class Gas {
  list: GasEntity[] = [];
  add(x: number, y: number) {
    const gas = new GasEntity(x, y);
    this.list.push(gas);
  }
  enterFrame() {
    this.list.forEach((gas) => {
      gas.enterFrame();
    });
  }
}
