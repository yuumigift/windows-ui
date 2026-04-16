import type { Rect, WallPair } from "../types";
import { Entity } from "./Entity";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  WALL_GAP_HEIGHT,
  WALL_SAFE_PADDING,
  WALL_SPAWN_INTERVAL,
  WALL_SPEED,
  WALL_WIDTH,
} from "../common";

const WALL_COLOR = "#53a451";

export class WallEntity extends Entity {
  constructor(x: number, y: number, width: number, height: number) {
    super({
      type: "rect",
      color: WALL_COLOR,
    });
    this.rect.x = x;
    this.rect.y = y;
    this.rect.w = width;
    this.rect.h = height;
    this.is_falling = false;
    this.vx = -WALL_SPEED;
  }

  enterFrame() {
    this.move();
    this.draw();
  }

  isOffScreen() {
    return this.rect.x + this.rect.w / 2 < 0;
  }
}

const getRectEdge = (rect: Rect) => ({
  left: rect.x - rect.w / 2,
  right: rect.x + rect.w / 2,
  top: rect.y - rect.h / 2,
  bottom: rect.y + rect.h / 2,
});

const isRectOverlap = (a: Rect, b: Rect) => {
  const rectA = getRectEdge(a);
  const rectB = getRectEdge(b);
  return rectA.left < rectB.right && rectA.right > rectB.left && rectA.top < rectB.bottom && rectA.bottom > rectB.top;
};

export class Wall {
  list: WallPair[] = [];
  private frame = 0;

  private createPair() {
    const gapHalf = WALL_GAP_HEIGHT / 2;
    const minGapCenter = WALL_SAFE_PADDING + gapHalf;
    const maxGapCenter = GAME_HEIGHT - WALL_SAFE_PADDING - gapHalf;
    const gapCenter = Math.random() * (maxGapCenter - minGapCenter) + minGapCenter;
    const topHeight = gapCenter - gapHalf;
    const bottomHeight = GAME_HEIGHT - (gapCenter + gapHalf);
    const spawnX = GAME_WIDTH + WALL_WIDTH / 2;

    const top = new WallEntity(spawnX, topHeight / 2, WALL_WIDTH, topHeight);
    const bottom = new WallEntity(spawnX, GAME_HEIGHT - bottomHeight / 2, WALL_WIDTH, bottomHeight);

    this.list.push({ top, bottom, passed: false });
  }

  enterFrame() {
    this.frame++;
    if (!this.list.length || this.frame % WALL_SPAWN_INTERVAL === 0) {
      this.createPair();
    }

    this.list.forEach((wall) => {
      wall.top.enterFrame();
      wall.bottom.enterFrame();
    });

    this.list = this.list.filter((wall) => !wall.top.isOffScreen());
  }

  collectPassedScore(playerX: number) {
    let score = 0;
    this.list.forEach((wall) => {
      const wallRight = wall.top.rect.x + wall.top.rect.w / 2;
      if (!wall.passed && wallRight < playerX) {
        wall.passed = true;
        score++;
      }
    });
    return score;
  }

  hit(rect: Rect) {
    return this.list.some((wall) => isRectOverlap(rect, wall.top.rect) || isRectOverlap(rect, wall.bottom.rect));
  }

  reset() {
    this.list = [];
    this.frame = 0;
  }
}