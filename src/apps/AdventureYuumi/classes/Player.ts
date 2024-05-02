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
    const move_config: MoveConfig = {
      jump_force: PLAYER_JUMP_FORCE,
      speed_max: PLAYER_SPEED_MAX,
      speed_force: PLAYER_SPEED_FORCE,
    };

    this.move(payload, move_config);
    this.draw(payload);
  }
}
