import { GAME_WIDTH, MONSTER_HEIGHT, MONSTER_JUMP_FORCE, MONSTER_JUMP_WAITING, MONSTER_MOVE_WAITING, MONSTER_SPEED_FORCE, MONSTER_SPEED_MAX, MONSTER_WIDTH, block } from "../common";
import type { EnterFramePayload, MoveConfig } from "../types";
import { Entity } from "./Entity";

class MonsterBase extends Entity {
  is_moving = false;
  is_removed = false;
  move_waiting = 0;
  jump_waiting = 0;
  constructor(color: string = "red", x: number, y: number) {
    // 定义移动配置
    const move_config: MoveConfig = {
      jump_force: MONSTER_JUMP_FORCE,
      speed_max: MONSTER_SPEED_MAX,
      speed_force: MONSTER_SPEED_FORCE,
    };
    super(color, move_config);
    this.rect.x = x;
    this.rect.y = y;
    this.rect.w = MONSTER_WIDTH;
    this.rect.h = MONSTER_HEIGHT;
  }
  onGroundBlocked(block_info: ReturnType<typeof block>) {
    // 如果碰到墙边就跳跃
    if (["left", "right"].includes(block_info.direction)) {
      this.is_jump = true;
    }
  }

  enterFrame(payload: EnterFramePayload) {
    // 随机移动
    if (this.move_waiting < 0) {
      // 计算下一次移动等待时间
      this.move_waiting = Math.random() * MONSTER_MOVE_WAITING + MONSTER_MOVE_WAITING / 2;
      // 停止移动
      this.is_left = false;
      this.is_right = false;
      if (this.is_moving) {
        // 随机选择左右移动方向
        if (Math.random() < 0.5) {
          this.is_left = true;
        } else {
          this.is_right = true;
        }
      }
      // 切换移动状态
      this.is_moving = !this.is_moving;
    } else {
      // 移动等待时间递减
      this.move_waiting--;
    }

    // 随机跳跃
    if (this.jump_waiting < 0) {
      // 计算下一次跳跃等待时间
      this.jump_waiting = Math.random() * MONSTER_JUMP_WAITING + MONSTER_JUMP_WAITING / 2;
      // 设置跳跃状态为 true
      this.is_jump = true;
    } else {
      // 跳跃等待时间递减
      this.is_jump = false;
      this.jump_waiting--;
    }

    // 执行移动操作
    this.move(payload);
    // 执行绘制操作
    this.draw(payload);
  }
}

class MonsterBaseGroup {
  list = [] as MonsterBase[];
  enterFrame(payload: EnterFramePayload) {
    this.list = this.list.filter((monster) => !monster.is_removed);
    this.list.forEach((monster) => {
      monster.enterFrame(payload);
    });
  }
  remove(monster: MonsterBase) {
    monster.is_removed = true;
  }
}

export class Monster extends MonsterBaseGroup {
  constructor() {
    super();
    for (let index = 0; index < 50; index++) {
      const monster = new MonsterBase("red", Math.random() * 1e4 + 500 - MONSTER_WIDTH, -MONSTER_HEIGHT);
      this.list.push(monster);
    }
  }
}
