import { FRICTION, GRAVITY, block, useCanvas } from "../common";
import type { EnterFramePayload, MoveConfig, Rect } from "../types";

const { draw } = useCanvas();

export class Entity {
  rect: Rect = {
    w: 0,
    h: 0,
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
  color = "red";
  constructor(color: string) {
    this.color = color;
  }
  move(payload: EnterFramePayload, { is_control_viewport, jump_force, speed_force, speed_max }: MoveConfig) {
    // 运动
    this.vx += this.ax;
    this.vy += GRAVITY;
    this.rect.y += this.vy;

    // 摩擦力
    if (Math.abs(this.vx) > 1e-5) {
      this.vx *= FRICTION;
    } else {
      this.vx = 0;
    }

    // 方向
    if (this.is_left && !this.is_right) {
      this.ax = -speed_force;
    } else if (this.is_right && !this.is_left) {
      this.ax = speed_force;
    } else {
      this.ax = 0;
    }

    // 最大速度
    if (this.vx > speed_max) {
      this.vx = speed_max;
    } else if (this.vx < -speed_max) {
      this.vx = -speed_max;
    }

    // 碰撞检测
    let is_understand_ground = false;
    payload.ground.list.map((ground_rect: any) => {
      const moved_ground_rect = { ...ground_rect.rect };
      if (is_control_viewport) {
        moved_ground_rect.x -= payload.viewport.x;
      }
      const block_info = block(this.rect, moved_ground_rect);
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
      this.vy = -jump_force;
    }

    if (this.rect.x < 0) {
      this.rect.x = 0;
    }
  }
  draw(payload: EnterFramePayload, { is_control_viewport }: MoveConfig) {
    const x = is_control_viewport ? this.rect.x : this.rect.x - payload.viewport.x;
    draw(x, this.rect.y, this.rect.w, this.rect.h, this.color);
  }
}
