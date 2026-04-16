import Plane from "../assets/plane.png";
import { PLAYER_SIZE } from "../common";
import { Entity } from "./Entity";

export class Player extends Entity {
  is_flying = false;
  private readonly handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
      case " ":
      case "w": {
        this.is_flying = true;
        break;
      }
    }
  };
  private readonly handleKeyUp = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
      case " ":
      case "w": {
        this.is_flying = false;
        break;
      }
    }
  };

  constructor() {
    const img = new Image();
    img.src = Plane;
    super({
      type: "img",
      img: img,
    });
    this.vy = 0;
    this.rect.x = 200;
    this.rect.y = 200;
    this.rect.w = PLAYER_SIZE;
    this.rect.h = PLAYER_SIZE;
    addEventListener("keydown", this.handleKeyDown);
    addEventListener("keyup", this.handleKeyUp);
  }
  reset() {
    this.is_flying = false;
    this.ax = 0;
    this.ay = 0;
    this.vx = 0;
    this.vy = 0;
    this.rect.x = 200;
    this.rect.y = 200;
  }
  enterFrame() {
    if (this.is_flying) {
      this.ay = -0.1;
    } else {
      this.ay = 0;
    }
    this.move();
    this.draw();
  }
  destroy() {
    removeEventListener("keydown", this.handleKeyDown);
    removeEventListener("keyup", this.handleKeyUp);
  }
}
