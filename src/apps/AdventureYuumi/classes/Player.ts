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
  is_jump = false;
  is_left = false;
  is_right = false;
  constructor() {
    addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowUp":
          if (!this.jumping) {
            this.is_jump = true;
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
    this.rect.x += this.vx;
    this.rect.y += this.vy;
    this.vy += GRAVITY;

    if (this.is_left && !this.is_right) {
      this.vx = -2;
    } else if (this.is_right && !this.is_left) {
      this.vx = 2;
    } else {
      this.vx = 0;
    }

    if (this.rect.x < 0) {
      this.rect.x = 0;
    } else if (this.rect.x + this.rect.w > 800) {
      this.rect.x = 800 - this.rect.w;
    }

    let is_understand_ground = false;
    ground.rect_list.map((ground_rect) => {
      const block_info = block(this.rect, ground_rect);
      this.rect = block_info.rect;
      if (block_info.info.direction === "up") {
        is_understand_ground = true;
        this.jumping = false;
        if (this.vy > 1) {
          this.vy = 1;
        }
      }
      if (block_info.info.direction === "down") {
        if (this.vy < 0) {
          this.vy = 0;
        }
      }
    });
    if (is_understand_ground) {
      if (this.is_jump) {
        this.vy = -3;
      }
    }
    this.is_jump = false;
    
    draw(this.rect.x, this.rect.y, this.rect.w, this.rect.h, "red");
  }
}
