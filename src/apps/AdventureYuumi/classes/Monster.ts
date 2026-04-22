import { MONSTER_HEIGHT, MONSTER_JUMP_FORCE, MONSTER_JUMP_WAITING, MONSTER_MOVE_WAITING, MONSTER_SPEED_FORCE, MONSTER_SPEED_MAX, MONSTER_WIDTH, block } from "../common";
import type { EnterFramePayload, MoveConfig } from "../types";
import { Entity } from "./Entity";
import type { Ground } from "./Ground";

class MonsterBase extends Entity {
  is_moving = false;
  is_removed = false;
  move_waiting = 0;
  jump_waiting = 0;
  patrolLeft = 0;
  patrolRight = 0;
  constructor(color: string = "red", x: number, y: number, patrolLeft: number, patrolRight: number) {
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
    this.patrolLeft = patrolLeft;
    this.patrolRight = patrolRight;
    if (Math.random() < 0.5) {
      this.turnAround("left");
    } else {
      this.turnAround("right");
    }
  }
  onGroundBlocked(block_info: ReturnType<typeof block>) {
    // 如果碰到墙边就跳跃
    if (["left", "right"].includes(block_info.direction)) {
      this.turnAround(block_info.direction === "left" ? "right" : "left");
    }
  }

  turnAround(direction: "left" | "right") {
    this.is_left = direction === "left";
    this.is_right = direction === "right";
  }

  keepOnPlatform() {
    const minX = this.patrolLeft;
    const maxX = this.patrolRight - this.rect.w;
    if (this.rect.x <= minX + 2) {
      this.rect.x = minX;
      this.vx = Math.max(0, this.vx);
      this.turnAround("right");
      this.is_moving = true;
    }
    if (this.rect.x >= maxX - 2) {
      this.rect.x = maxX;
      this.vx = Math.min(0, this.vx);
      this.turnAround("left");
      this.is_moving = true;
    }
  }

  enterFrame(payload: EnterFramePayload) {
    this.keepOnPlatform();

    // 随机移动
    if (this.move_waiting < 0) {
      // 计算下一次移动等待时间
      this.move_waiting = Math.random() * MONSTER_MOVE_WAITING + MONSTER_MOVE_WAITING / 2;
      // 停止移动
      this.is_left = false;
      this.is_right = false;
      if (this.is_moving) {
        // 随机选择左右移动方向
        const nearLeft = this.rect.x <= this.patrolLeft + 12;
        const nearRight = this.rect.x + this.rect.w >= this.patrolRight - 12;
        if (nearLeft) {
          this.turnAround("right");
        } else if (nearRight) {
          this.turnAround("left");
        } else if (Math.random() < 0.5) {
          this.turnAround("left");
        } else {
          this.turnAround("right");
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

    this.move(payload);
    this.keepOnPlatform();
    this.draw(payload);
  }
}

class MonsterBaseGroup {
  list: MonsterBase[] = [];
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
  }

  reset(ground: Ground) {
    this.list = [];
    const candidatePlatforms = ground.platforms.slice(2, -1).filter((platform) => platform.w >= 110 && platform.h <= 24);
    const targetCount = Math.min(candidatePlatforms.length, 8);
    const used = new Set<number>();

    while (used.size < targetCount) {
      const index = Math.floor(Math.random() * candidatePlatforms.length);
      if (used.has(index)) continue;
      used.add(index);
      const platform = candidatePlatforms[index]!;
      const monster = new MonsterBase(
        "red",
        platform.x + Math.max(12, Math.random() * Math.max(16, platform.w - MONSTER_WIDTH - 24)),
        platform.y - MONSTER_HEIGHT,
        platform.x + 6,
        platform.x + platform.w - 6,
      );
      this.list.push(monster);
    }
  }
}
