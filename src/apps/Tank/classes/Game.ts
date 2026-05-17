import {
  BULLET_SPEED,
  CANVAS_SIZE,
  COLORS,
  ENEMY_COUNT,
  ENEMY_FIRE_COOLDOWN,
  ENEMY_BULLET_SPEED,
  ENEMY_MOVE_INTERVAL,
  ENEMY_SPEED,
  EXPLOSION_EFFECT_DURATION,
  EXPLOSION_PARTICLE_COUNT,
  HIT_EFFECT_DURATION,
  HIT_PARTICLE_COUNT,
  MAP_SIZE,
  PLAYER_FIRE_COOLDOWN,
  PLAYER_SPAWN,
  PLAYER_SPEED,
  TILE_SIZE,
  VIEWPORT_EDGE_PADDING,
  VIEWPORT_FOLLOW_LERP,
  VIEWPORT_SIZE,
} from "../common";
import type { BulletEntity, Direction, EffectEntity, TankEntity, TerrainType } from "../types";

/** 四方向统一映射到单位位移向量，供移动和发射共用。 */
const DIRECTION_OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** 方便从四个方向里随机抽取一个。 */
const ALL_DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

/** 常用钳制函数，主要用于边界与视口限制。 */
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** 生成包含端点的随机整数。 */
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** 用平方距离代替开平方，降低高频碰撞计算成本。 */
const distanceSquared = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
};

/** 把方向字符串转换为具体的 x/y 轴偏移。 */
const normalizeDirection = (direction: Direction) => DIRECTION_OFFSET[direction];

/** 生成 0 到 1 之间的随机小数。 */
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

/**
 * Game 负责坦克大战的完整运行时：
 * - 关卡随机生成
 * - 玩家/敌方/子弹更新
 * - 视口缓动跟随
 * - 命中火花与爆炸特效
 * - canvas 渲染循环
 */
export class Game {
  /** 对外暴露给 HUD 的当前分数。 */
  score = ref(0);

  /** 玩家被击毁后置为 true，用来显示结算层。 */
  over = ref(false);

  /** 当前处于按下状态的键位集合。 */
  private readonly pressedKeys = new Set<string>();

  /** 当前视口左上角在地图坐标系中的位置。 */
  private readonly viewport = reactive({ x: 0, y: 0 });

  /** 视口目标位置，真正的镜头通过插值慢慢追上它。 */
  private readonly viewportTarget = reactive({ x: 0, y: 0 });

  /** 挂载 canvas 的根容器。 */
  private root: HTMLDivElement | null = null;

  /** 游戏唯一的画布实例。 */
  private canvas: HTMLCanvasElement | null = null;

  /** 2D 上下文，所有绘制都依赖这里。 */
  private context: CanvasRenderingContext2D | null = null;

  /** 当前 requestAnimationFrame 句柄，方便停止循环。 */
  private animationFrameId: number | null = null;

  /** 上一帧时间戳，用于计算 deltaTime。 */
  private lastFrameTime = 0;

  /** 统一的递增 id 生成器。 */
  private nextEntityId = 1;

  /** 地图地形数据，按 [row][column] 存储。 */
  private terrain: TerrainType[][] = [];

  /** 玩家坦克实例。 */
  private player: TankEntity | null = null;

  /** 所有存活中的敌方坦克。 */
  private enemies: TankEntity[] = [];

  /** 所有仍在飞行中的子弹。 */
  private bullets: BulletEntity[] = [];

  /** 所有短生命周期视觉特效。 */
  private effects: EffectEntity[] = [];

  /** 组件彻底销毁后设为 true，阻止后续帧继续调度。 */
  private destroyed = false;

  /**
   * 键盘按下时只更新输入状态，不直接在事件回调里改游戏逻辑，
   * 这样每帧按状态读取输入会更稳定，也更容易处理长按。
   */
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "ArrowUp" || event.code === "ArrowDown" || event.code === "ArrowLeft" || event.code === "ArrowRight" || event.code === "Space") {
      event.preventDefault();
    }
    this.pressedKeys.add(event.code);
  };

  /** 键盘抬起时同步移除输入状态。 */
  private readonly handleKeyUp = (event: KeyboardEvent) => {
    this.pressedKeys.delete(event.code);
  };

  /**
   * 把游戏挂载到指定容器中。
   * 这里负责创建 canvas、绑定键盘事件并启动首局游戏。
   */
  mount(root: HTMLDivElement) {
    this.root = root;
    this.destroyed = false;
    this.canvas = document.createElement("canvas");
    this.canvas.width = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
    this.context = this.canvas.getContext("2d");
    root.innerHTML = "";
    root.appendChild(this.canvas);
    this.bindEvents();
    this.restart();
  }

  /** 重新开始时重置所有运行时状态，并重新生成关卡。 */
  restart() {
    this.score.value = 0;
    this.over.value = false;
    this.lastFrameTime = 0;
    this.bullets = [];
    this.effects = [];
    this.enemies = [];
    this.player = null;
    this.createLevel();
    this.startLoop();
  }

  /** 彻底销毁游戏实例，释放循环和事件监听。 */
  destroy() {
    this.destroyed = true;
    this.stopLoop();
    this.unbindEvents();
    if (this.root) {
      this.root.innerHTML = "";
    }
  }

  /** 外层模板依赖这个尺寸把舞台容器撑开。 */
  get viewportStyle() {
    return {
      width: `${CANVAS_SIZE}px`,
      height: `${CANVAS_SIZE}px`,
    };
  }

  /** 统一在 window 上监听输入，避免焦点轻微变化导致事件丢失。 */
  private bindEvents() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  /** 与 bindEvents 成对出现的清理逻辑。 */
  private unbindEvents() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  /** 启动前先停掉旧循环，防止重复 requestAnimationFrame。 */
  private startLoop() {
    this.stopLoop();
    this.animationFrameId = requestAnimationFrame(this.enterFrame);
  }

  /** 取消当前动画帧循环。 */
  private stopLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 生成新关卡：
   * - 随机铺地图
   * - 清理出生安全区
   * - 创建玩家
   * - 补足敌方数量
   * - 初始化视口
   */
  private createLevel() {
    this.terrain = Array.from({ length: MAP_SIZE }, (_, row) => Array.from({ length: MAP_SIZE }, (_, column) => this.generateTile(row, column)));

    this.clearSpawnArea(PLAYER_SPAWN.x, PLAYER_SPAWN.y, 2);

    this.player = {
      id: this.nextId(),
      kind: "player",
      x: PLAYER_SPAWN.x + 0.5,
      y: PLAYER_SPAWN.y + 0.5,
      direction: "up",
      fireCooldown: 0,
    };

    this.viewport.x = clamp(this.player.x - VIEWPORT_SIZE / 2, 0, MAP_SIZE - VIEWPORT_SIZE);
    this.viewport.y = clamp(this.player.y - VIEWPORT_SIZE / 2, 0, MAP_SIZE - VIEWPORT_SIZE);
    this.viewportTarget.x = this.viewport.x;
    this.viewportTarget.y = this.viewport.y;

    while (this.enemies.length < ENEMY_COUNT) {
      const enemy = this.createEnemy();
      if (enemy) {
        this.enemies.push(enemy);
      }
    }
  }

  /**
   * 按概率生成地块：
   * - 边缘更偏向铁墙/砖墙，形成自然边界
   * - 中间区域随机出现铁墙、砖墙、草地和水面
   */
  private generateTile(row: number, column: number): TerrainType {
    if (row === 0 || column === 0 || row === MAP_SIZE - 1 || column === MAP_SIZE - 1) {
      return Math.random() > 0.4 ? "iron" : "brick";
    }

    const roll = Math.random();
    if (roll < 0.08) return "iron";
    if (roll < 0.2) return "brick";
    if (roll < 0.34) return "grass";
    if (roll < 0.44) return "water";
    return "empty";
  }

  /** 清出一个安全区域，避免出生点被随机障碍堵住。 */
  private clearSpawnArea(tileX: number, tileY: number, radius: number) {
    for (let row = tileY - radius; row <= tileY + radius; row++) {
      for (let column = tileX - radius; column <= tileX + radius; column++) {
        if (!this.isInsideMap(column, row)) continue;
        this.terrain[row]![column] = "empty";
      }
    }
  }

  /**
   * 尝试随机生成一个敌方坦克。
   * 如果连续多次找不到合适落点，就返回 null，避免死循环。
   */
  private createEnemy() {
    for (let attempt = 0; attempt < 40; attempt++) {
      const x = randomInt(1, MAP_SIZE - 2) + 0.5;
      const y = randomInt(1, MAP_SIZE - 2) + 0.5;
      if (distanceSquared(x, y, PLAYER_SPAWN.x + 0.5, PLAYER_SPAWN.y + 0.5) < 64) {
        continue;
      }
      if (!this.canTankOccupy(x, y)) {
        continue;
      }
      if (this.enemies.some((enemy) => distanceSquared(enemy.x, enemy.y, x, y) < 4)) {
        continue;
      }
      this.clearSpawnArea(Math.floor(x), Math.floor(y), 1);
      return {
        id: this.nextId(),
        kind: "enemy",
        x,
        y,
        direction: ALL_DIRECTIONS[randomInt(0, ALL_DIRECTIONS.length - 1)]!,
        fireCooldown: Math.random() * ENEMY_FIRE_COOLDOWN,
        aiMoveCooldown: 0,
        desiredDirection: ALL_DIRECTIONS[randomInt(0, ALL_DIRECTIONS.length - 1)]!,
      } satisfies TankEntity;
    }

    return null;
  }

  /**
   * 每一帧的统一入口：
   * - 计算 deltaTime
   * - 更新运行时状态
   * - 重绘当前画面
   * - 决定是否调度下一帧
   */
  private readonly enterFrame = (timestamp: number) => {
    if (this.destroyed) return;

    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
    }
    const delta = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = timestamp;

    this.update(delta);
    this.render();

    if (!this.over.value || this.effects.length > 0) {
      this.animationFrameId = requestAnimationFrame(this.enterFrame);
      return;
    }

    this.animationFrameId = null;
  };

  /**
   * 更新所有动态内容。
   * 游戏结束后只保留特效更新，让爆炸动画完整播放。
   */
  private update(delta: number) {
    this.updateEffects(delta);

    const player = this.player;
    if (!player || this.over.value) return;

    this.handlePlayerInput(player, delta);
    this.updateEnemies(delta);
    this.updateBullets(delta);
    this.updateViewport(player);

    player.fireCooldown = Math.max(0, player.fireCooldown - delta);
    for (const enemy of this.enemies) {
      enemy.fireCooldown = Math.max(0, enemy.fireCooldown - delta);
      enemy.aiMoveCooldown = Math.max(0, (enemy.aiMoveCooldown ?? 0) - delta);
    }

    while (this.enemies.length < ENEMY_COUNT) {
      const enemy = this.createEnemy();
      if (!enemy) break;
      this.enemies.push(enemy);
    }
  }

  /** 玩家移动和发射完全由按键状态驱动。 */
  private handlePlayerInput(player: TankEntity, delta: number) {
    const nextDirection = this.getInputDirection();
    if (nextDirection) {
      player.direction = nextDirection;
      this.moveTank(player, PLAYER_SPEED * delta, this.enemies);
    }

    const wantsFire = this.pressedKeys.has("Space") || this.pressedKeys.has("KeyJ");
    if (wantsFire && player.fireCooldown <= 0) {
      this.spawnBullet(player);
      player.fireCooldown = PLAYER_FIRE_COOLDOWN;
    }
  }

  /**
   * 敌方 AI 比较轻量：
   * - 定期重新决定方向
   * - 更倾向朝玩家方向移动
   * - 对齐时更容易开火
   */
  private updateEnemies(delta: number) {
    const player = this.player;
    if (!player) return;

    for (const enemy of this.enemies) {
      if ((enemy.aiMoveCooldown ?? 0) <= 0) {
        enemy.desiredDirection = this.pickEnemyDirection(enemy, player);
        enemy.aiMoveCooldown = ENEMY_MOVE_INTERVAL * (0.6 + Math.random() * 0.8);
      }

      enemy.direction = enemy.desiredDirection ?? enemy.direction;
      this.moveTank(enemy, ENEMY_SPEED * delta, [player, ...this.enemies.filter((item) => item.id !== enemy.id)]);

      if (enemy.fireCooldown <= 0 && this.shouldEnemyFire(enemy, player)) {
        this.spawnBullet(enemy);
        enemy.fireCooldown = ENEMY_FIRE_COOLDOWN * (0.7 + Math.random() * 0.8);
      }
    }
  }

  /**
   * 子弹更新同时处理所有命中结果：
   * - 铁墙：阻挡并产生火花
   * - 砖墙：被摧毁并产生火花
   * - 草地/空地/水面：继续穿过
   * - 命中坦克：触发爆炸
   */
  private updateBullets(delta: number) {
    const survivors: BulletEntity[] = [];

    for (const bullet of this.bullets) {
      const offset = normalizeDirection(bullet.direction);
      const speed = bullet.owner === "enemy" ? ENEMY_BULLET_SPEED : BULLET_SPEED;
      bullet.x += offset.x * speed * delta;
      bullet.y += offset.y * speed * delta;

      if (!this.isInsideMap(bullet.x, bullet.y)) {
        continue;
      }

      const tileX = Math.floor(bullet.x);
      const tileY = Math.floor(bullet.y);
      const tile = this.terrain[tileY]?.[tileX] ?? "iron";

      if (tile === "iron") {
        this.spawnHitEffect(bullet.x, bullet.y);
        continue;
      }

      if (tile === "brick") {
        this.terrain[tileY]![tileX] = "empty";
        this.spawnHitEffect(bullet.x, bullet.y);
        continue;
      }

      if (bullet.owner === "player") {
        const hitEnemyIndex = this.enemies.findIndex((enemy) => this.isBulletTouchingTank(bullet, enemy));
        if (hitEnemyIndex !== -1) {
          const hitEnemy = this.enemies[hitEnemyIndex]!;
          this.enemies.splice(hitEnemyIndex, 1);
          this.score.value += 1;
          this.spawnExplosionEffect(hitEnemy);
          continue;
        }
      } else if (this.player && this.isBulletTouchingTank(bullet, this.player)) {
        this.spawnExplosionEffect(this.player);
        this.over.value = true;
        continue;
      }

      survivors.push(bullet);
    }

    this.bullets = survivors;
  }

  /** 推进所有特效的时间轴，并清理已经结束的实例。 */
  private updateEffects(delta: number) {
    const survivors: EffectEntity[] = [];
    for (const effect of this.effects) {
      effect.age += delta;
      effect.x += effect.vx * delta;
      effect.y += effect.vy * delta;
      effect.vx *= 0.99;
      effect.vy *= 0.99;
      if (effect.age < effect.duration) {
        survivors.push(effect);
      }
    }
    this.effects = survivors;
  }

  /**
   * 玩家逼近视口边缘时才移动目标镜头。
   * 实际视口通过 lerp 慢慢跟上，形成更迟缓的跟随感。
   */
  private updateViewport(player: TankEntity) {
    const relativeX = player.x - this.viewportTarget.x;
    const relativeY = player.y - this.viewportTarget.y;
    const maxViewportOffset = MAP_SIZE - VIEWPORT_SIZE;

    if (relativeX < VIEWPORT_EDGE_PADDING) {
      this.viewportTarget.x = player.x - VIEWPORT_EDGE_PADDING;
    } else if (relativeX > VIEWPORT_SIZE - VIEWPORT_EDGE_PADDING) {
      this.viewportTarget.x = player.x - (VIEWPORT_SIZE - VIEWPORT_EDGE_PADDING);
    }

    if (relativeY < VIEWPORT_EDGE_PADDING) {
      this.viewportTarget.y = player.y - VIEWPORT_EDGE_PADDING;
    } else if (relativeY > VIEWPORT_SIZE - VIEWPORT_EDGE_PADDING) {
      this.viewportTarget.y = player.y - (VIEWPORT_SIZE - VIEWPORT_EDGE_PADDING);
    }

    this.viewportTarget.x = clamp(this.viewportTarget.x, 0, maxViewportOffset);
    this.viewportTarget.y = clamp(this.viewportTarget.y, 0, maxViewportOffset);
    this.viewport.x += (this.viewportTarget.x - this.viewport.x) * VIEWPORT_FOLLOW_LERP;
    this.viewport.y += (this.viewportTarget.y - this.viewport.y) * VIEWPORT_FOLLOW_LERP;
  }

  /** 每帧都完整重绘当前可见区域。 */
  private render() {
    const context = this.context;
    if (!context) return;

    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    context.fillStyle = COLORS.background;
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    this.drawTiles(context, false);
    if (this.player) {
      this.drawTank(context, this.player, COLORS.player);
    }
    for (const enemy of this.enemies) {
      this.drawTank(context, enemy, COLORS.enemy);
    }
    for (const bullet of this.bullets) {
      this.drawBullet(context, bullet);
    }
    for (const effect of this.effects) {
      this.drawEffect(context, effect);
    }
    this.drawTiles(context, true);
    this.drawGrid(context);
  }

  /**
   * 地块分两层绘制：
   * - 第一层画普通地形
   * - 最后一层只画草地，实现“草挡住坦克和子弹”的视觉规则
   */
  private drawTiles(context: CanvasRenderingContext2D, grassOnly: boolean) {
    const startColumn = Math.floor(this.viewport.x);
    const endColumn = Math.min(MAP_SIZE, Math.ceil(this.viewport.x + VIEWPORT_SIZE));
    const startRow = Math.floor(this.viewport.y);
    const endRow = Math.min(MAP_SIZE, Math.ceil(this.viewport.y + VIEWPORT_SIZE));

    for (let row = startRow; row < endRow; row++) {
      for (let column = startColumn; column < endColumn; column++) {
        const tile = this.terrain[row]?.[column] ?? "empty";
        if (grassOnly !== (tile === "grass")) {
          continue;
        }
        const px = (column - this.viewport.x) * TILE_SIZE;
        const py = (row - this.viewport.y) * TILE_SIZE;
        this.drawTile(context, tile, px, py);
      }
    }
  }

  /** 根据地形类型绘制不同纹理。 */
  private drawTile(context: CanvasRenderingContext2D, tile: TerrainType, x: number, y: number) {
    if (tile === "empty") {
      context.fillStyle = COLORS.empty;
      context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      return;
    }

    if (tile === "water") {
      context.fillStyle = COLORS.empty;
      context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      context.fillStyle = COLORS.water;
      for (let index = 0; index < 3; index++) {
        const waveY = y + 12 + index * 10;
        context.beginPath();
        context.moveTo(x + 4, waveY);
        context.quadraticCurveTo(x + TILE_SIZE / 2, waveY - 6, x + TILE_SIZE - 4, waveY);
        context.strokeStyle = "rgba(212, 240, 255, 0.9)";
        context.lineWidth = 3;
        context.stroke();
      }
      context.fillStyle = "rgba(38, 116, 184, 0.8)";
      context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      return;
    }

    if (tile === "grass") {
      context.fillStyle = "rgba(84, 156, 64, 0.2)";
      context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      context.fillStyle = COLORS.grass;
      for (let index = 0; index < 10; index++) {
        const bladeX = x + 4 + (index % 5) * 9 + (index > 4 ? 3 : 0);
        const bladeY = y + 16 + Math.floor(index / 5) * 16;
        context.beginPath();
        context.moveTo(bladeX, bladeY + 10);
        context.lineTo(bladeX + 3, bladeY - 4);
        context.lineTo(bladeX + 6, bladeY + 10);
        context.fill();
      }
      return;
    }

    context.fillStyle = tile === "iron" ? COLORS.iron : COLORS.brick;
    context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    context.fillStyle = tile === "iron" ? "rgba(255,255,255,0.28)" : "rgba(120, 46, 12, 0.24)";
    const step = tile === "iron" ? 12 : 16;
    for (let offset = 0; offset < TILE_SIZE; offset += step) {
      context.fillRect(x + offset, y, 3, TILE_SIZE);
      context.fillRect(x, y + offset, TILE_SIZE, 3);
    }
  }

  /** 坦克由履带、车身和炮管三部分组成。 */
  private drawTank(context: CanvasRenderingContext2D, tank: TankEntity, color: string) {
    const centerX = (tank.x - this.viewport.x) * TILE_SIZE;
    const centerY = (tank.y - this.viewport.y) * TILE_SIZE;

    context.save();
    context.translate(centerX, centerY);
    context.rotate(this.getDirectionAngle(tank.direction));

    context.fillStyle = color;
    context.fillRect(-16, -18, 32, 36);
    context.fillStyle = "rgba(0, 0, 0, 0.28)";
    context.fillRect(-22, -18, 6, 36);
    context.fillRect(16, -18, 6, 36);
    context.fillStyle = "#2d2418";
    context.fillRect(-8, -12, 16, 24);
    context.fillRect(-4, -28, 8, 24);
    context.restore();
  }

  /** 子弹表现为高亮圆点，便于在复杂背景中识别。 */
  private drawBullet(context: CanvasRenderingContext2D, bullet: BulletEntity) {
    const x = (bullet.x - this.viewport.x) * TILE_SIZE;
    const y = (bullet.y - this.viewport.y) * TILE_SIZE;
    context.fillStyle = COLORS.bullet;
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.fill();
  }

  /** 命中火花与爆炸共用一个绘制入口。 */
  private drawEffect(context: CanvasRenderingContext2D, effect: EffectEntity) {
    const progress = effect.age / effect.duration;
    const x = (effect.x - this.viewport.x) * TILE_SIZE;
    const y = (effect.y - this.viewport.y) * TILE_SIZE;

    context.save();
    context.globalAlpha = 1 - progress;
    context.fillStyle = effect.kind === "hit" ? "#ffd88c" : "#ff8f43";
    context.beginPath();
    context.arc(x, y, effect.radius * TILE_SIZE, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  /** 细网格线帮助玩家快速判断格子边界。 */
  private drawGrid(context: CanvasRenderingContext2D) {
    context.strokeStyle = "rgba(255, 255, 255, 0.06)";
    context.lineWidth = 1;
    for (let index = 0; index <= VIEWPORT_SIZE; index++) {
      const position = index * TILE_SIZE;
      context.beginPath();
      context.moveTo(position, 0);
      context.lineTo(position, CANVAS_SIZE);
      context.stroke();
      context.beginPath();
      context.moveTo(0, position);
      context.lineTo(CANVAS_SIZE, position);
      context.stroke();
    }
  }

  /**
   * 坦克移动只尝试朝当前方向推进一小步。
   * 如果撞墙或撞到别的坦克，就保留原位；敌方会顺便换一个方向。
   */
  private moveTank(tank: TankEntity, speed: number, blockers: TankEntity[]) {
    const direction = normalizeDirection(tank.direction);
    const nextX = tank.x + direction.x * speed;
    const nextY = tank.y + direction.y * speed;
    if (this.canTankOccupy(nextX, nextY, tank.id, blockers)) {
      tank.x = nextX;
      tank.y = nextY;
      return;
    }

    if (tank.kind === "enemy") {
      tank.desiredDirection = ALL_DIRECTIONS[randomInt(0, ALL_DIRECTIONS.length - 1)]!;
      tank.aiMoveCooldown = 0.2;
    }
  }

  /**
   * 通过坦克四角采样近似碰撞盒：
   * - 铁墙、砖墙、水面都不能进入
   * - 草地和空地允许进入
   * - 其他坦克视为动态阻挡物
   */
  private canTankOccupy(x: number, y: number, ignoreId?: number, blockers: TankEntity[] = []) {
    const halfSize = 0.36;
    const corners = [
      { x: x - halfSize, y: y - halfSize },
      { x: x + halfSize, y: y - halfSize },
      { x: x - halfSize, y: y + halfSize },
      { x: x + halfSize, y: y + halfSize },
    ];

    for (const corner of corners) {
      if (!this.isInsideMap(corner.x, corner.y)) {
        return false;
      }
      const tile = this.terrain[Math.floor(corner.y)]?.[Math.floor(corner.x)] ?? "iron";
      if (tile === "iron" || tile === "brick" || tile === "water") {
        return false;
      }
    }

    for (const blocker of blockers) {
      if (blocker.id === ignoreId) continue;
      if (distanceSquared(x, y, blocker.x, blocker.y) < 0.72) {
        return false;
      }
    }

    return true;
  }

  /** 在炮管前方生成一枚子弹。 */
  private spawnBullet(tank: TankEntity) {
    const direction = normalizeDirection(tank.direction);
    this.bullets.push({
      id: this.nextId(),
      owner: tank.kind,
      x: tank.x + direction.x * 0.6,
      y: tank.y + direction.y * 0.6,
      direction: tank.direction,
    });
  }

  /**
   * 在子弹消失点生成一组小圆点粒子。
   * 粒子会向 360 度随机方向飞散，并逐渐减速和淡出。
   */
  private spawnHitEffect(x: number, y: number) {
    this.spawnParticleBurst("hit", HIT_PARTICLE_COUNT, () => ({ x, y }));
  }

  /**
   * 在坦克被删除时占用的矩形区域内随机生成爆炸粒子。
   * 粒子起点不固定在中心，而是散落于坦克本体范围内。
   */
  private spawnExplosionEffect(tank: TankEntity) {
    const bounds = this.getTankBounds(tank);
    this.spawnParticleBurst("explosion", EXPLOSION_PARTICLE_COUNT, () => ({
      x: randomFloat(bounds.minX, bounds.maxX),
      y: randomFloat(bounds.minY, bounds.maxY),
    }));
  }

  /** 统一生成粒子爆发，命中和爆炸只是在参数上不同。 */
  private spawnParticleBurst(kind: EffectEntity["kind"], count: number, getOrigin: () => { x: number; y: number }) {
    const duration = kind === "hit" ? HIT_EFFECT_DURATION : EXPLOSION_EFFECT_DURATION;
    for (let index = 0; index < count; index++) {
      const origin = getOrigin();
      const angle = randomFloat(0, Math.PI * 2);
      const speed = kind === "hit" ? randomFloat(1.6, 3.4) : randomFloat(1.2, 4.8);
      this.effects.push({
        id: this.nextId(),
        kind,
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: kind === "hit" ? randomFloat(0.05, 0.11) : randomFloat(0.06, 0.14),
        age: 0,
        duration,
      });
    }
  }

  /** 根据坦克朝向推导当前绘制矩形在地图坐标中的近似占用范围。 */
  private getTankBounds(tank: TankEntity) {
    const isHorizontal = tank.direction === "left" || tank.direction === "right";
    const halfWidth = (isHorizontal ? 18 : 16) / TILE_SIZE;
    const halfHeight = (isHorizontal ? 16 : 18) / TILE_SIZE;
    return {
      minX: tank.x - halfWidth,
      maxX: tank.x + halfWidth,
      minY: tank.y - halfHeight,
      maxY: tank.y + halfHeight,
    };
  }

  /** 子弹命中判定采用中心点附近的简化矩形碰撞。 */
  private isBulletTouchingTank(bullet: BulletEntity, tank: TankEntity) {
    return Math.abs(bullet.x - tank.x) < 0.38 && Math.abs(bullet.y - tank.y) < 0.38;
  }

  /**
   * 敌方射击策略：
   * - 与玩家同列或同行时会主动转向
   * - 中间没有硬障碍时更容易开火
   * - 其他情况保留少量随机射击，避免显得过于机械
   */
  private shouldEnemyFire(enemy: TankEntity, player: TankEntity) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const alignedHorizontally = Math.abs(dx) < 0.45;
    const alignedVertically = Math.abs(dy) < 0.45;

    if (alignedHorizontally) {
      enemy.direction = dy > 0 ? "down" : "up";
      return !this.hasBlockingTileBetween(enemy.x, enemy.y, player.x, player.y, true) || Math.random() > 0.75;
    }

    if (alignedVertically) {
      enemy.direction = dx > 0 ? "right" : "left";
      return !this.hasBlockingTileBetween(enemy.x, enemy.y, player.x, player.y, false) || Math.random() > 0.75;
    }

    return Math.random() > 0.985;
  }

  /** 检查两点连线之间是否存在会挡子弹的铁墙或砖墙。 */
  private hasBlockingTileBetween(x1: number, y1: number, x2: number, y2: number, vertical: boolean) {
    if (vertical) {
      const column = Math.floor(x1);
      const start = Math.min(Math.floor(y1), Math.floor(y2));
      const end = Math.max(Math.floor(y1), Math.floor(y2));
      for (let row = start; row <= end; row++) {
        const tile = this.terrain[row]?.[column] ?? "iron";
        if (tile === "iron" || tile === "brick") {
          return true;
        }
      }
      return false;
    }

    const row = Math.floor(y1);
    const start = Math.min(Math.floor(x1), Math.floor(x2));
    const end = Math.max(Math.floor(x1), Math.floor(x2));
    for (let column = start; column <= end; column++) {
      const tile = this.terrain[row]?.[column] ?? "iron";
      if (tile === "iron" || tile === "brick") {
        return true;
      }
    }
    return false;
  }

  /** 敌方多数时间会朝玩家靠近，少部分时间随机游走。 */
  private pickEnemyDirection(enemy: TankEntity, player: TankEntity): Direction {
    if (Math.random() > 0.45) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? "right" : "left";
      }
      return dy > 0 ? "down" : "up";
    }

    return ALL_DIRECTIONS[randomInt(0, ALL_DIRECTIONS.length - 1)]!;
  }

  /** 玩家输入按上下左右顺序解析为唯一方向。 */
  private getInputDirection() {
    if (this.pressedKeys.has("ArrowUp") || this.pressedKeys.has("KeyW")) return "up";
    if (this.pressedKeys.has("ArrowDown") || this.pressedKeys.has("KeyS")) return "down";
    if (this.pressedKeys.has("ArrowLeft") || this.pressedKeys.has("KeyA")) return "left";
    if (this.pressedKeys.has("ArrowRight") || this.pressedKeys.has("KeyD")) return "right";
    return null;
  }

  /** 把方向枚举映射成 canvas 旋转角度。 */
  private getDirectionAngle(direction: Direction) {
    if (direction === "right") return Math.PI / 2;
    if (direction === "down") return Math.PI;
    if (direction === "left") return -Math.PI / 2;
    return 0;
  }

  /** 地图边界判定，坦克与子弹都复用这套逻辑。 */
  private isInsideMap(x: number, y: number) {
    return x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE;
  }

  /** 统一生成递增 id。 */
  private nextId() {
    this.nextEntityId += 1;
    return this.nextEntityId;
  }
}
