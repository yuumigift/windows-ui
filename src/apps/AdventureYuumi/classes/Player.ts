import { GRAVITY, useCanvas } from "../common";
const { draw } = useCanvas();

export class Player {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  jumping = false;
  constructor() {
    addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowUp":
          if (!this.jumping) {
            this.vy = -4;
            this.jumping = true;
          }
          break;
        case "ArrowLeft":
          this.vx = -1;
          break;
        case "ArrowRight":
          this.vx = 1;
          break;
      }
    });
    addEventListener("keyup", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.vx = 0;
          break;
        case "ArrowRight":
          this.vx = 0;
          break;
      }
    });
  }
  enterFrame() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += GRAVITY;
    if (this.y > 400 - 50) {
      this.y = 400 - 50;
      this.jumping = false;
    }

    draw(this.x, this.y, 50, 50, "red");
  }
}
