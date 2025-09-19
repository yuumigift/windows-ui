import Plane from "../assets/plane.png";
import { PLAYER_SIZE } from "../common";
import { Entity } from "./Entity";

export class Player extends Entity {
  is_flying = false;
  constructor() {
    const img = new Image();
    img.src = Plane;
    super({
      type: "img",
      img: img,
    });
    this.vy = -4;
    this.rect.x = 200;
    this.rect.y = 200;
    this.rect.w = PLAYER_SIZE;
    this.rect.h = PLAYER_SIZE;
    addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowUp": {
          this.is_flying = true;
          break;
        }
      }
    });
    addEventListener("keyup", (e) => {
      switch (e.key) {
        case "ArrowUp": {
          this.is_flying = false;
          break;
        }
      }
    });
  }
  enterFrame() {
    if (this.is_flying) {
      this.ay = -0.2;
    } else {
      this.ay = 0;
    }
    this.move();
    this.draw();
  }
}
