import type { EnterFramePayload, Rect } from "../types";
import { FRICTION, GRAVITY, PLAYER_HEIGHT, PLAYER_SPEED_FORCE, PLAYER_SPEED_MAX, PLAYER_WIDTH, block, useCanvas } from "../common";

const { draw } = useCanvas();

export class Player {
  rect: Rect = {
    w: PLAYER_WIDTH,
    h: PLAYER_HEIGHT,
    x: 0,
    y: 0,
  };
  ax = 0;
  vx = 0;
  vy = 0;
  jumping = false;
  is_jump = false;
  is_left = false;
  is_right = false;
  constructor() {
    addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowUp": {
          this.is_jump = true;
          break;
        }
        case "ArrowLeft": {
          this.is_left = true;
          break;
        }
        case "ArrowRight": {
          this.is_right = true;
          break;
        }
      }
    });
    addEventListener("keyup", (e) => {
      switch (e.key) {
        case "ArrowUp": {
          this.is_jump = false;
          break;
        }
        case "ArrowLeft": {
          this.is_left = false;
          break;
        }
        case "ArrowRight": {
          this.is_right = false;
          break;
        }
      }
    });
  }
  enterFrame({ ground, scene }: EnterFramePayload) {
    // 运动
    this.vx += this.ax;
    this.vy += GRAVITY;
    this.rect.x += this.vx;
    this.rect.y += this.vy;

    // 摩擦力
    if (Math.abs(this.vx) > 1e-5) {
      this.vx *= FRICTION;
    } else {
      this.vx = 0;
    }

    // 方向
    if (this.is_left && !this.is_right) {
      this.ax = -PLAYER_SPEED_FORCE;
    } else if (this.is_right && !this.is_left) {
      this.ax = PLAYER_SPEED_FORCE;
    } else {
      this.ax = 0;
    }

    // 最大速度
    if (this.vx > PLAYER_SPEED_MAX) {
      this.vx = PLAYER_SPEED_MAX;
    } else if (this.vx < -PLAYER_SPEED_MAX) {
      this.vx = -PLAYER_SPEED_MAX;
    }

    // 边界
    if (this.rect.x < 0) {
      this.rect.x = 0;
    } else if (this.rect.x + this.rect.w > 800) {
      this.rect.x = 800 - this.rect.w;
    }

    // 碰撞检测
    let is_understand_ground = false;
    ground.rect_list.map((ground_rect) => {
      const block_info = block(this.rect, ground_rect);
      this.rect = block_info.rect;
      if (block_info.direction === "up") {
        is_understand_ground = true;
        this.jumping = false;
        if (this.vy > 1) {
          this.vy = 1;
        }
      }
      if (block_info.direction === "down") {
        if (this.vy < 0) {
          this.vy = 0;
        }
      }
    });

    // 跳跃
    if (is_understand_ground && this.is_jump && this.vy > 0) {
      this.vy = -3;
    }

    draw(this.rect.x, this.rect.y, this.rect.w, this.rect.h, "red");
  }
}
