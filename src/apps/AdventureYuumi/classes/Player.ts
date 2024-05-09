import { PLAYER_HEIGHT, PLAYER_JUMP_FORCE, PLAYER_SPEED_FORCE, PLAYER_SPEED_MAX, PLAYER_WIDTH, block } from "../common";
import type { EnterFramePayload, MoveConfig } from "../types";
import { Entity } from "./Entity";

export class Player extends Entity {
  constructor(color: string = "teal") {
    const move_config: MoveConfig = {
      jump_force: PLAYER_JUMP_FORCE,
      speed_max: PLAYER_SPEED_MAX,
      speed_force: PLAYER_SPEED_FORCE,
    };
    super(color, move_config);
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
    payload.monster.list.forEach((monster) => {
      const monster_block_info = block(this.rect, monster.rect);
      // 接触怪物时
      if (monster_block_info.direction !== "") {
        // 如果踩到怪物
        if (monster_block_info.direction === "up") {
          // 怪物消失，玩家跳跃
          payload.monster.remove(monster);
          payload.spark.add(monster.rect, 2, { r: 255, g: 0, b: 0 }, 30);
          this.jump();
        }
        // 如果身体碰到怪物
        else {
          // 游戏失败
          payload.global.over.value = true;
        }
      }
    });
    
    this.move(payload);
    this.draw(payload);
  }
}
