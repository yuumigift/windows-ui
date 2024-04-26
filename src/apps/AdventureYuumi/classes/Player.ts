import { Ground } from "./Ground";
import { GRAVITY, PLAYER_HEIGHT, PLAYER_WIDTH, block, useCanvas } from "../common";
import type { Rect } from "../types";
const { draw } = useCanvas();

export class Player {
  rect: Rect = {
    w: PLAYER_WIDTH,
    h: PLAYER_HEIGHT,
    x: 0,
    y: 0,
  };
  vx = 0;
  vy = 0;
  jumping = false;
  is_left = false;
  is_right = false;
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
          this.is_left = true;
          break;
        case "ArrowRight":
          this.is_right = true;
          break;
      }
    });
    addEventListener("keyup", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.is_left = false;
          break;
        case "ArrowRight":
          this.is_right = false;
          break;
      }
    });
  }
  enterFrame({ ground }: { ground: InstanceType<typeof Ground> }) {
    if (this.is_left && !this.is_right) {
      this.vx = -2;
    } else if (this.is_right && !this.is_left) {
      this.vx = 2;
    } else {
      this.vx = 0;
    }
    this.rect.x += this.vx;
    this.rect.y += this.vy;
    if (this.rect.x < 0) {
      this.rect.x = 0;
    } else if (this.rect.x + this.rect.w > 800) {
      this.rect.x = 800 - this.rect.w;
    }
    this.vy += GRAVITY;
    const old_player_rect: Rect = {
      x: this.rect.x,
      y: this.rect.y,
      w: this.rect.w,
      h: this.rect.h,
    };

    ground.rect_list.map((ground_rect) => {
      const new_player_rect: Rect = block(old_player_rect, ground_rect);
      if (new_player_rect.y !== old_player_rect.y) {
        this.jumping = false;
        this.vy = 0;
      }
      this.rect = new_player_rect;
    });

    draw(this.rect.x, this.rect.y, this.rect.w, this.rect.h, "red");
  }
}
