import { GAME_HEIGHT, GAME_WIDTH, PLAYER_HEIGHT } from "../common";
import type { EnterFramePayload, Rect } from "../types";
import { useCanvas } from "../common";

const { draw, getContext } = useCanvas();

type PlatformRect = Rect;
type TerrainMode = "plain" | "mountain" | "descent" | "canyon" | "plateau";

const FLOOR_Y = 500;
const FLOOR_HEIGHT = GAME_HEIGHT - FLOOR_Y;
const PLATFORM_HEIGHT = 20;

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(randomBetween(min, max + 1));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)] ?? list[0]!;

class GroundBase {
  color: string;
  rect: Rect;
  constructor(color: string = "#333") {
    this.color = color;
    this.rect = { x: 0, y: 0, w: 0, h: 0 };
  }
  setRect(rect: Rect) {
    this.rect = { ...rect };
  }
  enterFrame(payload: EnterFramePayload) {
    draw(this.rect.x - payload.viewport.x, this.rect.y, this.rect.w + 1, this.rect.h + 1, this.color);
  }
}

class MovingGround extends GroundBase {
  top = 0;
  bottom = 0;
  speed = 0.6;
  direction = 1;

  constructor(color: string = "#2563eb") {
    super(color);
  }

  setRange(top: number, bottom: number, speed: number) {
    this.top = top;
    this.bottom = bottom;
    this.speed = speed;
  }

  override enterFrame(payload: EnterFramePayload) {
    if (this.rect.y <= this.top) {
      this.rect.y = this.top;
      this.direction = 1;
    }
    if (this.rect.y >= this.bottom) {
      this.rect.y = this.bottom;
      this.direction = -1;
    }
    this.rect.y += this.direction * this.speed;
    super.enterFrame(payload);
  }
}

class GroundGroupBase {
  list: GroundBase[] = [];
  enterFrame(payload: EnterFramePayload) {
    this.list.forEach((ground) => {
      ground.enterFrame(payload);
    });
  }
  fuseGroup(group: GroundGroupBase) {
    this.list.push(...group.list);
  }
}

export class Ground extends GroundGroupBase {
  platforms: PlatformRect[] = [];
  movingPlatforms: Rect[] = [];
  goal: Rect = { x: 0, y: 0, w: 24, h: 80 };
  spawnPoint = { x: 60, y: FLOOR_Y - PLAYER_HEIGHT };
  worldWidth = GAME_WIDTH;

  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.list = [];
    this.platforms = [];
    this.movingPlatforms = [];

    const startPlatform = this.createPlatform(0, FLOOR_Y, 230, FLOOR_HEIGHT, "#334155");
    const safePlatform = this.createPlatform(280, FLOOR_Y, 180, FLOOR_HEIGHT, "#334155");
    let previous = safePlatform;
    let terrainMode: TerrainMode = "plain";
    let terrainModeLife = 0;

    this.spawnPoint = {
      x: 56,
      y: startPlatform.y - PLAYER_HEIGHT,
    };

    const sections = randomInt(16, 22);
    for (let index = 0; index < sections; index++) {
      if (terrainModeLife <= 0) {
        terrainMode = this.pickTerrainMode(index);
        terrainModeLife = randomInt(2, 4);
      }
      terrainModeLife--;

      const spec = this.createTerrainSpec(terrainMode);
      const gap = randomInt(spec.gapMin, spec.gapMax);
      const width = randomInt(spec.widthMin, spec.widthMax);
      const nextTop = clamp(previous.y + randomInt(spec.deltaYMin, spec.deltaYMax), 150, FLOOR_Y);
      const nextX = previous.x + previous.w + gap;
      const current = this.createPlatform(nextX, nextTop, width, nextTop >= FLOOR_Y ? FLOOR_HEIGHT : PLATFORM_HEIGHT, this.getPlatformColor(nextTop));

      if (terrainMode === "mountain" && Math.random() < 0.38) {
        const upperY = clamp(current.y - randomInt(45, 85), 130, FLOOR_Y - 80);
        const upperX = current.x + randomInt(10, Math.max(18, current.w - 80));
        const upperWidth = randomInt(55, Math.min(120, Math.max(70, current.w - 20)));
        this.createPlatform(upperX, upperY, upperWidth, PLATFORM_HEIGHT, "#475569");
      }

      if ((terrainMode === "canyon" || gap >= 110 || Math.abs(current.y - previous.y) >= 60) && Math.random() < 0.9) {
        this.createMovingBridge(previous, current);
      }

      previous = current;
    }

    const finalGap = randomInt(70, 120);
    const finalTop = clamp(previous.y + randomInt(-45, 30), 180, FLOOR_Y);
    const finalPlatform = this.createPlatform(previous.x + previous.w + finalGap, finalTop, randomInt(220, 320), finalTop >= FLOOR_Y ? FLOOR_HEIGHT : PLATFORM_HEIGHT, "#1f2937");
    this.goal = {
      x: finalPlatform.x + finalPlatform.w - 48,
      y: finalPlatform.y - 88,
      w: 26,
      h: 88,
    };
    this.worldWidth = finalPlatform.x + finalPlatform.w + 220;
  }

  pickTerrainMode(index: number): TerrainMode {
    if (index < 2) return "plain";
    return pick(["plain", "mountain", "descent", "canyon", "plateau"]);
  }

  createTerrainSpec(mode: TerrainMode) {
    switch (mode) {
      case "mountain":
        return { gapMin: 55, gapMax: 105, widthMin: 80, widthMax: 170, deltaYMin: -75, deltaYMax: -20 };
      case "descent":
        return { gapMin: 60, gapMax: 130, widthMin: 90, widthMax: 190, deltaYMin: 20, deltaYMax: 75 };
      case "canyon":
        return { gapMin: 95, gapMax: 155, widthMin: 75, widthMax: 160, deltaYMin: -25, deltaYMax: 25 };
      case "plateau":
        return { gapMin: 45, gapMax: 95, widthMin: 140, widthMax: 280, deltaYMin: -20, deltaYMax: 20 };
      default:
        return { gapMin: 50, gapMax: 115, widthMin: 70, widthMax: 240, deltaYMin: -55, deltaYMax: 60 };
    }
  }

  getPlatformColor(y: number) {
    if (y <= 220) return "#0f172a";
    if (y <= 320) return "#1e293b";
    return "#334155";
  }

  createPlatform(x: number, y: number, w: number, h: number, color: string = "#333") {
    const rect = { x, y, w, h };
    const ground = new GroundBase(color);
    ground.setRect(rect);
    this.list.push(ground);
    this.platforms.push(rect);
    return rect;
  }

  createMovingBridge(from: Rect, to: Rect) {
    const bridgeWidth = randomInt(70, 120);
    const minX = from.x + from.w + 8;
    const maxX = to.x - bridgeWidth - 8;
    if (maxX <= minX) return;

    const x = clamp(Math.floor((minX + maxX) / 2), minX, maxX);
    const baseY = clamp(Math.floor((from.y + to.y) / 2) + randomInt(-15, 20), 190, FLOOR_Y - 50);
    const travel = randomInt(45, 130);
    const top = clamp(baseY - travel, 120, FLOOR_Y - 120);
    const bottom = clamp(baseY + travel, top + 55, FLOOR_Y - 10);

    const movingGround = new MovingGround();
    movingGround.setRect({ x, y: baseY, w: bridgeWidth, h: PLATFORM_HEIGHT });
    movingGround.setRange(top, bottom, randomBetween(0.45, 1.1));
    this.list.push(movingGround);
    this.movingPlatforms.push(movingGround.rect);
  }

  override enterFrame(payload: EnterFramePayload) {
    super.enterFrame(payload);
    this.drawGoal(payload);
  }

  drawGoal(payload: EnterFramePayload) {
    const ctx = getContext();
    if (!ctx) return;

    const goalX = this.goal.x - payload.viewport.x;
    const poleX = goalX - 12;
    const poleTop = this.goal.y - 8;
    const poleHeight = this.goal.h + 26;
    const baseY = this.goal.y + this.goal.h - 2;

    ctx.save();

    ctx.shadowColor = "rgba(255, 255, 255, 0.55)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.ellipse(goalX + 18, this.goal.y + 18, 34, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#6b7280";
    ctx.fillRect(poleX, poleTop, 7, poleHeight);

    const poleGradient = ctx.createLinearGradient(poleX, poleTop, poleX + 7, poleTop);
    poleGradient.addColorStop(0, "#94a3b8");
    poleGradient.addColorStop(0.5, "#e2e8f0");
    poleGradient.addColorStop(1, "#64748b");
    ctx.fillStyle = poleGradient;
    ctx.fillRect(poleX + 1, poleTop, 5, poleHeight);

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(poleX + 3.5, poleTop - 2, 6, 0, Math.PI * 2);
    ctx.fill();

    const flagGradient = ctx.createLinearGradient(goalX, this.goal.y + 8, goalX + 56, this.goal.y + 34);
    flagGradient.addColorStop(0, "#fb7185");
    flagGradient.addColorStop(0.55, "#f97316");
    flagGradient.addColorStop(1, "#facc15");
    ctx.fillStyle = flagGradient;
    ctx.beginPath();
    ctx.moveTo(goalX - 2, this.goal.y + 10);
    ctx.bezierCurveTo(goalX + 18, this.goal.y - 2, goalX + 32, this.goal.y + 12, goalX + 46, this.goal.y + 10);
    ctx.lineTo(goalX + 54, this.goal.y + 21);
    ctx.bezierCurveTo(goalX + 36, this.goal.y + 26, goalX + 24, this.goal.y + 36, goalX + 4, this.goal.y + 30);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(goalX + 5, this.goal.y + 13);
    ctx.quadraticCurveTo(goalX + 18, this.goal.y + 8, goalX + 30, this.goal.y + 16);
    ctx.stroke();

    ctx.fillStyle = "rgba(15,23,42,0.22)";
    ctx.beginPath();
    ctx.ellipse(goalX + 8, baseY + 13, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const pedestalGradient = ctx.createLinearGradient(goalX - 14, baseY - 4, goalX + 18, baseY + 16);
    pedestalGradient.addColorStop(0, "#f8fafc");
    pedestalGradient.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = pedestalGradient;
    ctx.beginPath();
    ctx.roundRect(goalX - 16, baseY - 6, 32, 14, 6);
    ctx.fill();

    ctx.fillStyle = "#1d4ed8";
    ctx.beginPath();
    ctx.arc(goalX + 22, this.goal.y + 18, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dbeafe";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GO", goalX + 22, this.goal.y + 18);

    ctx.restore();
  }
}
