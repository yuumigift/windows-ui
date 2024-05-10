import { useCanvas } from "../common";
import type {
  Color,
  EnterFramePayload,
  Rect,
} from "../types";

const { draw } = useCanvas();

class SparkBase {
  rect: Rect = {
    x: 0,
    y: 0,
    w: 5,
    h: 5,
  };
  color: Color = {
    r: 0,
    g: 0,
    b: 0,
  };
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  opacity = 1;
  is_removed = false;
  constructor(
    rect: Rect,
    speed: number,
    color: Color,
    opacity: number
  ) {
    const center = {
      x: rect.x + rect.w / 2,
      y: rect.y + rect.h / 2,
    };
    const x = center.x;
    const y = center.y;
    const angle = Math.random() * 2 * Math.PI;
    this.vx = Math.cos(angle) * Math.random() * speed;
    this.vy = Math.sin(angle) * Math.random() * speed;
    this.x = x - this.rect.x / 2;
    this.y = y - this.rect.y / 2;
    this.color = color;
    this.opacity = opacity;
  }
  enterFrame({ viewport }: EnterFramePayload) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.opacity -= 0.01;
    if (this.opacity < 0) {
      this.is_removed = true;
    }
    const { r, g, b } = this.color;
    draw(
      this.x - viewport.x,
      this.y,
      this.rect.w,
      this.rect.h,
      `rgba(${r},${g},${b},${this.opacity}`
    );
  }
}

class SparkBaseGroup {
  list = [] as SparkBase[];
  /**
   * 添加火花效果
   *
   * @param rect 矩形区域
   * @param speed 火花速度
   * @param color 火花颜色
   * @param count 火花数量
   */
  add(
    rect: Rect,
    speed: number,
    color: Color,
    count: number
  ) {
    for (let i = 0; i < count; ++i) {
      const opacity = Math.random() * 0.5 + 0.5;
      const spark = new SparkBase(
        rect,
        speed,
        color,
        opacity
      );
      this.list.push(spark);
    }
  }
  enterFrame(payload: EnterFramePayload) {
    this.list = this.list.filter(
      (spark) => !spark.is_removed
    );
    this.list.forEach((spark) => {
      spark.enterFrame(payload);
    });
  }
}

export class Spark extends SparkBaseGroup {
  constructor() {
    super();
  }
}
