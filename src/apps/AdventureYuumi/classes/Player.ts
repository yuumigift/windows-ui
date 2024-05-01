import { GAME_WIDTH, PLAYER_HEIGHT, PLAYER_JUMP_FORCE, PLAYER_SPEED_FORCE, PLAYER_SPEED_MAX, PLAYER_WIDTH, VIEWPORT_PADDING } from "../common";
import type { EnterFramePayload, MoveConfig } from "../types";
import { Entity } from "./Entity";

export class Player extends Entity {
  constructor(color: string = "teal") {
    super(color);
    this.rect.x = 200;
    this.rect.w = PLAYER_WIDTH;
    this.rect.h = PLAYER_HEIGHT;
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
  enterFrame(payload: EnterFramePayload) {
    const moveRight = () => {
      // 向右移动
      if (this.rect.x <= VIEWPORT_PADDING) {
        // 如果矩形左边界小于等于视口内边距，则向右移动
        this.rect.x += this.vx;
      } else if (this.rect.x >= GAME_WIDTH - VIEWPORT_PADDING) {
        // 如果矩形右边界大于等于游戏宽度减去视口内边距，则矩形右边界设置为游戏宽度减去视口内边距
        this.rect.x = GAME_WIDTH - VIEWPORT_PADDING;
        // 视口左边界向右移动
        payload.viewport.x += this.vx;
        if (payload.viewport.x > 1e5) {
          // 如果视口左边界大于1e5，则设置为1e5
          payload.viewport.x = 1e5;
        }
      } else {
        // 否则，继续向右移动
        this.rect.x += this.vx;
      }
    };

    // 边界情况处理

    // 如果视口在中间
    if (payload.viewport.x > 0) {
      // 向左运动
      if (this.vx < 0) {
        // 如果矩形速度向左
        if (this.rect.x <= VIEWPORT_PADDING) {
          // 如果矩形左边界小于等于视口内边距，则矩形左边界设置为视口内边距
          this.rect.x = VIEWPORT_PADDING;
          // 视口左边界向右移动
          payload.viewport.x += this.vx;
          if (payload.viewport.x < 0) {
            // 如果视口左边界小于0，则设置为0
            payload.viewport.x = 0;
          }
        } else {
          // 否则，继续向左移动
          this.rect.x += this.vx;
        }
      } else {
        // 向右运动
        // 调用向右移动的函数
        moveRight();
      }
      // 如果视口在最左边
    } else {
      // 如果矩形速度向左，则继续向左移动
      if (this.vx < 0) {
        this.rect.x += this.vx;
      } else {
        // 否则，调用向右移动的函数
        moveRight();
      }
    }

    const move_config: MoveConfig = {
      jump_force: PLAYER_JUMP_FORCE,
      speed_max: PLAYER_SPEED_MAX,
      speed_force: PLAYER_SPEED_FORCE,
      is_control_viewport: true,
    };

    this.move(payload, move_config);
    this.draw(payload, move_config);
  }
}
