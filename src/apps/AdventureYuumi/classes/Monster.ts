import { GAME_WIDTH, MONSTER_HEIGHT, MONSTER_JUMP_FORCE, MONSTER_JUMP_WAITING, MONSTER_MOVE_WAITING, MONSTER_SPEED_FORCE, MONSTER_SPEED_MAX, MONSTER_WIDTH } from "../common";
import type { EnterFramePayload, MoveConfig } from "../types";
import { Entity } from "./Entity";

class MonsterBase extends Entity {
  is_moving = false;
  move_waiting = 0;
  jump_waiting = 0;
  constructor(color: string = "red", x: number, y: number) {
    super(color);
    this.rect.x = x;
    this.rect.y = y;
    this.rect.w = MONSTER_WIDTH;
    this.rect.h = MONSTER_HEIGHT;
  }
  enterFrame(payload: EnterFramePayload) {
    // 随机移动
    if (this.move_waiting < 0) {
      this.move_waiting = Math.random() * MONSTER_MOVE_WAITING + MONSTER_MOVE_WAITING / 2;
      if (this.is_moving) {
        if (Math.random() < 0.5) {
          this.is_left = true;
          this.is_right = false;
        } else {
          this.is_left = false;
          this.is_right = true;
        }
      } else {
        this.is_left = false;
        this.is_right = false;
      }
      this.is_moving = !this.is_moving;
    } else {
      this.move_waiting--;
    }

    // 随机跳跃
    if (this.jump_waiting < 0) {
      this.jump_waiting = Math.random() * MONSTER_JUMP_WAITING + MONSTER_JUMP_WAITING / 2;
      this.is_jump = true;
    } else {
      this.is_jump = false;
      this.jump_waiting--;
    }

    this.rect.x += this.vx;
    this.rect.y += this.vy;

    const move_config: MoveConfig = {
      jump_force: MONSTER_JUMP_FORCE,
      speed_max: MONSTER_SPEED_MAX,
      speed_force: MONSTER_SPEED_FORCE,
      is_control_viewport: false,
    };

    this.move(payload, move_config);
    this.draw(payload, move_config);
  }
}

class MonsterBaseGroup {
  list = [] as MonsterBase[];
  enterFrame(payload: EnterFramePayload) {
    this.list.forEach((monster) => {
      monster.enterFrame(payload);
    });
  }
}

export class Monster extends MonsterBaseGroup {
  constructor(color: string = "red") {
    super();
    setInterval(() => {
      const monster = new MonsterBase(color, Math.random() * GAME_WIDTH - MONSTER_WIDTH, -MONSTER_HEIGHT);
      this.list.push(monster);
    }, 1000);
  }
}
