import { GAME_WIDTH, VIEWPORT_MOVE_FORCE, VIEWPORT_PADDING } from "../common";
import type { EnterFramePayload } from "../types";

export class Viewport {
  x = 0;
  enterFrame({ player }: EnterFramePayload) {
    // 玩家处于视口右侧区域（触发视口右移区域）
    if (player.rect.x > this.x + GAME_WIDTH - VIEWPORT_PADDING) {
      this.x += (player.rect.x - (this.x + GAME_WIDTH - VIEWPORT_PADDING)) * VIEWPORT_MOVE_FORCE;
    }
    // 玩家处于视口左侧区域（触发视口左移区域）
    if (player.rect.x < this.x + VIEWPORT_PADDING) {
      this.x -= (this.x + VIEWPORT_PADDING - player.rect.x) * VIEWPORT_MOVE_FORCE;
    }
    // 边界
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x > 1e5) {
      this.x = 1e5;
    }
  }
}
