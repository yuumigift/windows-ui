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
    // 向右移动
    const moveRight = () => {
      // 如果实体在场景最左侧部分（视口已经到最左边，并且超出视口边界）
      if (this.rect.x <= VIEWPORT_PADDING) {
        // 向右移动实体
        this.rect.x += this.vx;
      }
      // 如果实体触碰右侧视口
      else if (this.rect.x >= GAME_WIDTH - VIEWPORT_PADDING) {
        // 实体不动（固定在视口右侧）
        this.rect.x = GAME_WIDTH - VIEWPORT_PADDING;
        // 视口向右移动
        payload.viewport.x += this.vx;
        // 如果视口移动大于1e5，则设置为1e5（右侧边界）
        if (payload.viewport.x > 1e5) {
          payload.viewport.x = 1e5;
        }
      }
      // 如果在视口内部（没有触碰边界）
      else {
        // 向右移动实体
        this.rect.x += this.vx;
      }
    };

    // 边界情况处理

    // 如果视口在场景中间
    if (payload.viewport.x > 0) {
      // 如果实体速度向左
      if (this.vx < 0) {
        // 如果实体碰到视口左边界
        if (this.rect.x <= VIEWPORT_PADDING) {
          // 实体不动（固定在视口左侧）
          this.rect.x = VIEWPORT_PADDING;
          // 视口向左移动
          payload.viewport.x += this.vx;
          // 如果视口左边界小于0，则设置为0
          if (payload.viewport.x < 0) {
            payload.viewport.x = 0;
          }
        }
        // 如果实体在视口内部（没有碰到视口左边界）
        else {
          // 实体向左移动
          this.rect.x += this.vx;
        }
      }
      // 如果实体向右运动
      else {
        // 调用向右移动的函数
        moveRight();
      }
    }
    // 如果视口在最左边
    else {
      // 如果实体向左移动
      if (this.vx < 0) {
        // 实体向左移动
        this.rect.x += this.vx;
      }
      // 如果实体向右移动
      else {
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
