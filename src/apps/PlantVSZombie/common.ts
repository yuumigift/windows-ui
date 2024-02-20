export interface ISpirit {
  deleted?: boolean;
  name?: string;
  width?: number;
  height?: number;
  count?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  [key: string]: any;
}

export const mapCount: any = {
  plant_0: 8,
  plant_1: 5,
  plant_2: 8,
  plant_4: 8,
  plant_5: 8,
  zomb_0: 8,
};

export function block(rect1: { x: number; y: number; width: number; height: number }, rect2: { x: number; y: number; width: number; height: number }): boolean {
  // 计算每个矩形的左边和右边坐标
  const rect1Left = rect1.x ?? 0;
  const rect1Right = rect1.x + (rect1.width ?? 0);
  const rect1Top = rect1.y ?? 0;
  const rect1Bottom = rect1.y + (rect1.height ?? 0);

  const rect2Left = rect2.x ?? 0;
  const rect2Right = rect2.x + (rect2.width ?? 0);
  const rect2Top = rect2.y ?? 0;
  const rect2Bottom = rect2.y + (rect2.height ?? 0);

  // 检查两个矩形是否碰撞
  return (rect1Left < rect2Right && rect1Right > rect2Left && rect1Top < rect2Bottom && rect1Bottom > rect2Top) || (rect2Left < rect1Right && rect2Right > rect1Left && rect2Top < rect1Bottom && rect2Bottom > rect1Top);
}
