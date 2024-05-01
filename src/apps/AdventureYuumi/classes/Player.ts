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
      if (this.rect.x <= VIEWPORT_PADDING) {
        this.rect.x += this.vx;
      } else if (this.rect.x >= GAME_WIDTH - VIEWPORT_PADDING) {
        this.rect.x = GAME_WIDTH - VIEWPORT_PADDING;
        payload.viewport.x += this.vx;
        if (payload.viewport.x > 1e5) {
          payload.viewport.x = 1e5;
        }
      } else {
        this.rect.x += this.vx;
      }
    };

    // 边界情况
    if (payload.viewport.x > 0) {
      // 视口在中间
      if (this.vx < 0) {
        // 向左运动
        if (this.rect.x <= VIEWPORT_PADDING) {
          this.rect.x = VIEWPORT_PADDING;
          payload.viewport.x += this.vx;
          if (payload.viewport.x < 0) {
            payload.viewport.x = 0;
          }
        } else {
          this.rect.x += this.vx;
        }
        // 向右运动
      } else {
        moveRight();
      }
    } else {
      // 视口在最左边
      if (this.vx < 0) {
        this.rect.x += this.vx;
      } else {
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
