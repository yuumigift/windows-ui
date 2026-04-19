<template>
  <div class="elastic_ball">
    <!-- 顶部信息栏：展示当前局面的核心状态与重新开始按钮。 -->
    <div class="top_bar">
      <div class="panel">
        <span>状态：{{ Game.statusLabel }}</span>
        <span>得分：{{ Game.score }}</span>
        <span>剩余砖块：{{ Bricks.remainingCount }}</span>
        <span>球数：{{ Balls.list.length }}</span>
      </div>
      <button class="restart_btn" @click="Game.reset">重新开始</button>
    </div>

    <!--
      主游戏区域：
      - 鼠标移动时控制挡板位置
      - 鼠标点击时在 ready 状态下发射小球
      - 所有砖块、掉落物、挡板、小球与覆盖层都在这个容器里渲染
    -->
    <div :ref="Arena.setElement" class="arena" @mousemove="Paddle.handlePointerMove" @click="Game.handleLaunch">
      <!-- 仍然可见的砖块列表。 -->
      <div v-for="brick in Bricks.visibleList" :key="brick.id" class="brick" :style="Bricks.getStyle(brick)">
        <span class="brick__shine"></span>
      </div>

      <!-- 随机掉落的道具球。 -->
      <div v-for="drop in Drops.list" :key="drop.id" class="drop" :class="`drop--${drop.type}`" :style="Drops.getStyle(drop)">
        {{ drop.label }}
      </div>

      <!-- 玩家控制的挡板。 -->
      <div class="paddle" :style="Paddle.style"></div>

      <!-- 当前所有活动中的小球，支持多球效果。 -->
      <div v-for="ball in Balls.list" :key="ball.id" class="ball" :style="Balls.getStyle(ball)"></div>

      <!-- 短时间展示的道具效果提示。 -->
      <div class="effect_tip" v-if="Game.effectText">
        {{ Game.effectText }}
      </div>

      <!--
        覆盖层：
        - ready 状态显示开场提示
        - over 状态显示结束文案
      -->
      <div class="overlay" v-if="Game.status !== 'running'">
        <div class="overlay__card">
          <h3>{{ Game.overlayTitle }}</h3>
          <p>{{ Game.overlayText }}</p>
          <button class="overlay__btn" @click.stop="Game.handleOverlayAction">
            {{ Game.status === "ready" ? "点击发射" : "再来一局" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 底部说明栏：帮助玩家快速理解操作与道具。 -->
    <div class="bottom_bar">
      <span>操作说明：移动鼠标控制挡板，点击发射小球。</span>
      <span>随机道具：变长、变短、多球、加速、减速。</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/** 游戏当前所处的阶段：待发射 / 进行中 / 结束。 */
type GameStatus = "ready" | "running" | "over";
/** 掉落道具的分类。 */
type DropType = "long" | "short" | "multi" | "fast" | "slow";

/** 单个小球的运行时状态。 */
type Ball = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
};

/** 单个砖块的数据结构。 */
type Brick = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  color: string;
  visible: boolean;
};

/** 单个掉落道具的运动状态。 */
type Drop = {
  id: number;
  type: DropType;
  x: number;
  y: number;
  size: number;
  vy: number;
  label: string;
};

// 🗺️ 场地：负责共享尺寸、元素引用与基础数值工具。
const Arena = (() => {
  /** 常用数值夹取工具，保证值落在合法范围内。 */
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  /** 绑定主游戏区域元素引用。 */
  const setElement = (element: unknown) => {
    s.element = element instanceof HTMLDivElement ? element : null;
  };

  const s = reactive({
    width: 920,
    height: 560,
    element: null as HTMLDivElement | null,
    clamp,
    setElement,
  });

  return s;
})();

// 🎮 游戏：负责全局状态、提示文案、重置流程与主循环。
const Game = (() => {
  /** requestAnimationFrame 的句柄。 */
  let animationFrameId: number | null = null;
  /** 上一帧时间戳，用来计算 delta time。 */
  let lastTimestamp = 0;
  /** 效果提示自动清除的计时器。 */
  let effectTextTimer: number | null = null;
  /** 提示文字显示时长。 */
  const effectTextDuration = 1400;

  /** 切换游戏阶段，并同步更新 HUD / 覆盖层文案。 */
  const setStatus = (status: GameStatus, text?: string) => {
    s.status = status;
    if (status === "ready") {
      s.statusLabel = "待发射";
      s.overlayTitle = "弹弹球";
      s.overlayText = text ?? "移动鼠标控制挡板，点击鼠标发射小球。";
      return;
    }
    if (status === "running") {
      s.statusLabel = "进行中";
      s.overlayTitle = "";
      s.overlayText = "";
      return;
    }
    s.statusLabel = "已结束";
    s.overlayTitle = "游戏结束";
    s.overlayText = text ?? "球没有接住，点击按钮重新挑战。";
  };

  /** 显示短暂的效果提示，例如“挡板变长”、“多球来袭”。 */
  const showEffectText = (text: string) => {
    s.effectText = text;
    if (effectTextTimer !== null) {
      window.clearTimeout(effectTextTimer);
    }
    effectTextTimer = window.setTimeout(() => {
      s.effectText = "";
      effectTextTimer = null;
    }, effectTextDuration);
  };

  /** 统一分配 id，避免各模块自己维护自增游标。 */
  const takeBallId = () => s.nextBallId++;
  const takeBrickId = () => s.nextBrickId++;
  const takeDropId = () => s.nextDropId++;

  /**
   * 重置整局游戏：
   * - 清分与状态文案
   * - 重置挡板、砖块、掉落物
   * - 只保留一个待发射球
   */
  const reset = () => {
    s.score = 0;
    s.pointerX = Arena.width / 2;
    s.nextBallId = 1;
    s.nextBrickId = 1;
    s.nextDropId = 1;
    s.effectText = "";
    lastTimestamp = 0;

    if (effectTextTimer !== null) {
      window.clearTimeout(effectTextTimer);
      effectTextTimer = null;
    }

    Drops.reset();
    Paddle.reset();
    Bricks.reset();
    Balls.reset();
    setStatus("ready");
    Balls.syncReadyBall();
  };

  /** 覆盖层按钮的点击行为：结束时重开，准备时发射。 */
  const handleOverlayAction = () => {
    if (s.status === "over") {
      reset();
      return;
    }
    Balls.launch();
  };

  /** 仅在 ready 状态下响应点击发射。 */
  const handleLaunch = () => {
    if (s.status === "ready") {
      Balls.launch();
    }
  };

  /** 游戏主循环，驱动球与掉落物的逐帧更新。 */
  const gameLoop = (timestamp: number) => {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }
    const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.024);
    lastTimestamp = timestamp;

    if (s.status === "running") {
      Balls.update(delta);
      Drops.update(delta);
    } else if (s.status === "ready") {
      Balls.syncReadyBall();
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  };

  /** 启动主循环。 */
  const start = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    lastTimestamp = 0;
    animationFrameId = requestAnimationFrame(gameLoop);
  };

  /** 停止主循环并清理计时器。 */
  const stop = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (effectTextTimer !== null) {
      window.clearTimeout(effectTextTimer);
      effectTextTimer = null;
    }
  };

  /** 模块初始化：注册销毁清理。 */
  const init = () => {
    onBeforeUnmount(() => stop());
  };

  /** 模块挂载后：初始化游戏并启动循环。 */
  const initOnMounted = () => {
    reset();
    start();
  };

  /** 游戏核心状态树：集中管理 HUD、覆盖层、指针与 id 游标。 */
  const s = reactive({
    status: "ready" as GameStatus,
    statusLabel: "待发射",
    overlayTitle: "弹弹球",
    overlayText: "移动鼠标控制挡板，点击鼠标发射小球。",
    score: 0,
    pointerX: Arena.width / 2,
    nextBallId: 1,
    nextBrickId: 1,
    nextDropId: 1,
    effectText: "",
    setStatus,
    showEffectText,
    takeBallId,
    takeBrickId,
    takeDropId,
    reset,
    handleOverlayAction,
    handleLaunch,
    start,
    stop,
  });

  init();
  onMounted(() => initOnMounted());
  return s;
})();

// 🧱 挡板：负责鼠标映射、边界限制与自身样式。
const Paddle = (() => {
  /** 挡板默认、最短、最长宽度。 */
  const defaultWidth = 148;
  const minWidth = 84;
  const maxWidth = 230;
  /** 挡板高度。 */
  const height = 16;

  /** 根据鼠标横坐标更新挡板位置，并限制不能移出场地。 */
  const updateByPointer = (clientX: number) => {
    const rect = Arena.element?.getBoundingClientRect();
    if (!rect) return;

    const localX = Arena.clamp(clientX - rect.left, 0, rect.width);
    Game.pointerX = (localX / rect.width) * Arena.width;
    s.x = Arena.clamp(Game.pointerX - s.width / 2, 0, Arena.width - s.width);
  };

  /** 把挡板恢复为默认宽度与位置。 */
  const reset = () => {
    s.width = defaultWidth;
    s.x = (Arena.width - s.width) / 2;
    Game.pointerX = s.x + s.width / 2;
  };

  /** 鼠标在场地内移动时，实时更新挡板位置。 */
  const handlePointerMove = (event: MouseEvent) => {
    updateByPointer(event.clientX);
    Balls.syncReadyBall();
  };

  const s = reactive({
    x: (Arena.width - defaultWidth) / 2,
    width: defaultWidth,
    height,
    minWidth,
    maxWidth,
    get y() {
      return Arena.height - 34;
    },
    get style() {
      return {
        width: `${this.width}px`,
        height: `${this.height}px`,
        left: `${this.x}px`,
        top: `${this.y}px`,
      };
    },
    updateByPointer,
    handlePointerMove,
    reset,
  });

  return s;
})();

// 🧱 砖块：负责生成砖阵、统计剩余数量以及砖块样式。
const Bricks = (() => {
  /** 砖块矩阵配置。 */
  const rows = 6;
  const columns = 10;
  const width = 76;
  const height = 24;
  const gap = 10;
  const offsetTop = 42;
  /** 砖块按行循环使用的渐变色。 */
  const colors = [
    "linear-gradient(135deg, #f87171, #ef4444)",
    "linear-gradient(135deg, #fb923c, #f97316)",
    "linear-gradient(135deg, #facc15, #eab308)",
    "linear-gradient(135deg, #4ade80, #22c55e)",
    "linear-gradient(135deg, #38bdf8, #0ea5e9)",
    "linear-gradient(135deg, #a78bfa, #8b5cf6)",
  ];

  /** 生成一整屏砖块矩阵。 */
  const createList = () => {
    const totalWidth = columns * width + (columns - 1) * gap;
    const offsetLeft = (Arena.width - totalWidth) / 2;
    const bricks: Brick[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        bricks.push({
          id: Game.takeBrickId(),
          x: offsetLeft + col * (width + gap),
          y: offsetTop + row * (height + gap),
          width,
          height,
          hp: 1,
          color: colors[row % colors.length] ?? colors[0] ?? "#ef4444",
          visible: true,
        });
      }
    }

    return bricks;
  };

  /** 单个砖块的内联样式。 */
  const getStyle = (brick: Brick) => ({
    width: `${brick.width}px`,
    height: `${brick.height}px`,
    left: `${brick.x}px`,
    top: `${brick.y}px`,
    background: brick.color,
  });

  /** 重建砖块矩阵。 */
  const reset = () => {
    s.list = createList();
  };

  const s = reactive({
    list: [] as Brick[],
    get visibleList(): Brick[] {
      return this.list.filter((brick: Brick) => brick.visible);
    },
    get remainingCount(): number {
      return this.visibleList.length;
    },
    getStyle,
    reset,
  });

  return s;
})();

// 🟠 小球：负责待发射吸附、发射、碰撞、消球与胜负判定。
const Balls = (() => {
  /** 小球基础尺寸。 */
  const size = 14;
  /** 小球初始速度与速度上下限。 */
  const baseSpeed = 420;
  const minSpeed = 220;
  const maxSpeed = 760;

  /** 创建一个新的球对象。 */
  const createBall = (id: number, x: number, y: number, vx = 0, vy = 0): Ball => ({
    id,
    x,
    y,
    vx,
    vy,
    size,
  });

  /** 单个小球的内联样式。 */
  const getStyle = (ball: Ball) => ({
    width: `${ball.size}px`,
    height: `${ball.size}px`,
    left: `${ball.x - ball.size / 2}px`,
    top: `${ball.y - ball.size / 2}px`,
  });

  /** 在 ready 状态下，让待发射的小球始终吸附在挡板中心上方。 */
  const syncReadyBall = () => {
    if (Game.status !== "ready") return;
    const firstBall = s.list[0];
    if (!firstBall) return;
    firstBall.x = Paddle.x + Paddle.width / 2;
    firstBall.y = Paddle.y - size / 2 - 4;
    firstBall.vx = 0;
    firstBall.vy = 0;
  };

  /** 重置为单球待发射状态。 */
  const reset = () => {
    s.list = [createBall(Game.takeBallId(), Paddle.x + Paddle.width / 2, Paddle.y - size / 2 - 4)];
  };

  /**
   * 发射第一个球。
   *
   * 初始水平速度会受鼠标相对挡板中心的位置影响，
   * 这样玩家能在开局时控制发射角度。
   */
  const launch = () => {
    if (Game.status !== "ready") return;

    const firstBall = s.list[0];
    if (!firstBall) return;

    const paddleCenter = Paddle.x + Paddle.width / 2;
    const influence = Arena.clamp((Game.pointerX - paddleCenter) / (Paddle.width / 2 || 1), -1, 1);
    firstBall.vx = influence * 220;
    firstBall.vy = -Math.sqrt(Math.max(baseSpeed ** 2 - firstBall.vx ** 2, baseSpeed ** 2 * 0.55));
    Game.setStatus("running");
  };

  /** 调整单个球的速度倍率，同时受上下限约束。 */
  const setSpeed = (ball: Ball, multiplier: number) => {
    const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2) || baseSpeed;
    const nextSpeed = Arena.clamp(speed * multiplier, minSpeed, maxSpeed);
    const scale = nextSpeed / speed;
    ball.vx *= scale;
    ball.vy *= scale;
  };

  /** 多球效果：把当前球裂变为 6~8 个角度分散的小球。 */
  const spawnMultiBalls = () => {
    const sourceBall = s.list[0];
    if (!sourceBall) return;

    const targetCount = 6 + Math.floor(Math.random() * 3);
    const nextBaseSpeed = Arena.clamp(Math.sqrt(sourceBall.vx ** 2 + sourceBall.vy ** 2) || baseSpeed, minSpeed, maxSpeed);
    const startAngle = -Math.PI * 0.9;
    const endAngle = -Math.PI * 0.1;

    const balls: Ball[] = [];
    for (let index = 0; index < targetCount; index++) {
      const t = targetCount === 1 ? 0.5 : index / (targetCount - 1);
      const angle = startAngle + (endAngle - startAngle) * t;
      balls.push(createBall(Game.takeBallId(), sourceBall.x, sourceBall.y, Math.cos(angle) * nextBaseSpeed, Math.sin(angle) * nextBaseSpeed));
    }
    s.list = balls;
  };

  /** 判断球的包围盒是否与某个矩形区域相交。 */
  const intersectsRect = (ball: Ball, rect: { x: number; y: number; width: number; height: number }) => {
    const half = ball.size / 2;
    return ball.x + half >= rect.x && ball.x - half <= rect.x + rect.width && ball.y + half >= rect.y && ball.y - half <= rect.y + rect.height;
  };

  /**
   * 根据最小重叠方向来反弹小球，
   * 这样能更自然地区分是撞到了砖块的上下边还是左右边。
   */
  const reflectFromBrick = (ball: Ball, brick: Brick) => {
    const half = ball.size / 2;
    const overlapLeft = Math.abs(ball.x + half - brick.x);
    const overlapRight = Math.abs(brick.x + brick.width - (ball.x - half));
    const overlapTop = Math.abs(ball.y + half - brick.y);
    const overlapBottom = Math.abs(brick.y + brick.height - (ball.y - half));
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapLeft) {
      ball.x = brick.x - half;
      ball.vx = -Math.abs(ball.vx);
      return;
    }
    if (minOverlap === overlapRight) {
      ball.x = brick.x + brick.width + half;
      ball.vx = Math.abs(ball.vx);
      return;
    }
    if (minOverlap === overlapTop) {
      ball.y = brick.y - half;
      ball.vy = -Math.abs(ball.vy);
      return;
    }
    ball.y = brick.y + brick.height + half;
    ball.vy = Math.abs(ball.vy);
  };

  /**
   * 更新所有球的运动与碰撞：
   * - 四周墙壁反弹
   * - 挡板反弹
   * - 砖块碰撞与消除
   * - 漏球判定
   * - 清空砖块后的胜利判定
   */
  const update = (delta: number) => {
    const paddleRect = {
      x: Paddle.x,
      y: Paddle.y,
      width: Paddle.width,
      height: Paddle.height,
    };

    for (const ball of s.list) {
      ball.x += ball.vx * delta;
      ball.y += ball.vy * delta;

      const half = ball.size / 2;
      if (ball.x - half <= 0) {
        ball.x = half;
        ball.vx = Math.abs(ball.vx);
      }
      if (ball.x + half >= Arena.width) {
        ball.x = Arena.width - half;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y - half <= 0) {
        ball.y = half;
        ball.vy = Math.abs(ball.vy);
      }

      if (
        ball.vy > 0 &&
        ball.y + half >= paddleRect.y &&
        ball.y - half <= paddleRect.y + paddleRect.height &&
        ball.x + half >= paddleRect.x &&
        ball.x - half <= paddleRect.x + paddleRect.width
      ) {
        const impact = Arena.clamp((ball.x - (paddleRect.x + paddleRect.width / 2)) / (paddleRect.width / 2 || 1), -1, 1);
        const speed = Arena.clamp(Math.sqrt(ball.vx ** 2 + ball.vy ** 2) * 1.01, minSpeed, maxSpeed);
        ball.vx = impact * speed * 0.95;
        ball.vy = -Math.sqrt(Math.max(speed ** 2 - ball.vx ** 2, minSpeed ** 2 * 0.35));
        ball.y = paddleRect.y - half - 1;
      }

      for (const brick of Bricks.list) {
        if (!brick.visible) continue;
        if (!intersectsRect(ball, brick)) continue;

        brick.hp -= 1;
        reflectFromBrick(ball, brick);
        if (brick.hp <= 0) {
          brick.visible = false;
          Game.score += 10;
          Drops.add(brick.x + brick.width / 2, brick.y + brick.height / 2);
        }
        break;
      }
    }

    s.list = s.list.filter((ball) => ball.y - ball.size / 2 <= Arena.height + 20);

    if (!Bricks.remainingCount) {
      Game.setStatus("over", "所有砖块都被清掉了，漂亮！");
      return;
    }

    if (!s.list.length) {
      Game.setStatus("over", "球没有接住，挑战结束。");
    }
  };

  const s = reactive({
    list: [] as Ball[],
    getStyle,
    syncReadyBall,
    reset,
    launch,
    setSpeed,
    spawnMultiBalls,
    update,
  });

  return s;
})();

// 🎁 掉落物：负责生成、下落、接取，以及把效果派发到对应模块。
const Drops = (() => {
  /** 掉落道具尺寸、下落速度与掉落概率。 */
  const size = 28;
  const speed = 150;
  const chance = 0.32;
  /** 道具池：被砖块打碎时按这个池子随机掉落。 */
  const dropPool: Array<{ type: DropType; label: string }> = [
    { type: "long", label: "长" },
    { type: "short", label: "短" },
    { type: "multi", label: "裂" },
    { type: "fast", label: "快" },
    { type: "slow", label: "慢" },
  ];

  /** 单个掉落物的内联样式。 */
  const getStyle = (drop: Drop) => ({
    width: `${drop.size}px`,
    height: `${drop.size}px`,
    left: `${drop.x - drop.size / 2}px`,
    top: `${drop.y - drop.size / 2}px`,
  });

  /** 砖块被打碎后，按概率在砖块中心生成一个道具。 */
  const add = (x: number, y: number) => {
    if (Math.random() > chance) return;
    const picked = dropPool[Math.floor(Math.random() * dropPool.length)] ?? dropPool[0];
    if (!picked) return;

    s.list.push({
      id: Game.takeDropId(),
      type: picked.type,
      x,
      y,
      size,
      vy: speed,
      label: picked.label,
    });
  };

  /** 根据道具类型应用不同效果。 */
  const applyEffect = (type: DropType) => {
    if (type === "long") {
      Paddle.width = Arena.clamp(Paddle.width + 34, Paddle.minWidth, Paddle.maxWidth);
      Paddle.x = Arena.clamp(Paddle.x, 0, Arena.width - Paddle.width);
      Game.showEffectText("挡板变长");
      return;
    }

    if (type === "short") {
      Paddle.width = Arena.clamp(Paddle.width - 26, Paddle.minWidth, Paddle.maxWidth);
      Paddle.x = Arena.clamp(Paddle.x, 0, Arena.width - Paddle.width);
      Game.showEffectText("挡板变短");
      return;
    }

    if (type === "multi") {
      Balls.spawnMultiBalls();
      Game.showEffectText("多球来袭");
      return;
    }

    if (type === "fast") {
      Balls.list.forEach((ball) => Balls.setSpeed(ball, 1.18));
      Game.showEffectText("球速提升");
      return;
    }

    Balls.list.forEach((ball) => Balls.setSpeed(ball, 0.84));
    Game.showEffectText("球速降低");
  };

  /** 更新掉落物：下落、接住、移出场地。 */
  const update = (delta: number) => {
    const paddleRect = {
      x: Paddle.x,
      y: Paddle.y,
      width: Paddle.width,
      height: Paddle.height,
    };

    s.list = s.list.filter((drop) => {
      drop.y += drop.vy * delta;

      const intersectsPaddle =
        drop.x + drop.size / 2 >= paddleRect.x &&
        drop.x - drop.size / 2 <= paddleRect.x + paddleRect.width &&
        drop.y + drop.size / 2 >= paddleRect.y &&
        drop.y - drop.size / 2 <= paddleRect.y + paddleRect.height;

      if (intersectsPaddle) {
        applyEffect(drop.type);
        return false;
      }

      return drop.y - drop.size / 2 <= Arena.height;
    });
  };

  /** 清空当前局面的所有掉落物。 */
  const reset = () => {
    s.list = [];
  };

  const s = reactive({
    list: [] as Drop[],
    getStyle,
    add,
    update,
    reset,
  });

  return s;
})();

</script>

<style scoped lang="less">
/* 根容器：提供整页的深色科技感背景和上下布局。 */
.elastic_ball {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 18px;
  gap: 14px;
  box-sizing: border-box;
  background: radial-gradient(circle at top, #1e3a8a 0%, #0f172a 45%, #020617 100%);
  color: #eff6ff;
}

/* 顶部栏和底部栏共用的横向布局。 */
.top_bar,
.bottom_bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* 顶部状态面板。 */
.panel {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 14px;
  background: #0f172ab8;
  box-shadow: 0 10px 24px #00000026;
  backdrop-filter: blur(8px);

  span {
    font-size: 14px;
    color: #dbeafe;
  }
}

/* 重新开始按钮和覆盖层按钮使用同一套高亮风格。 */
.restart_btn,
.overlay__btn {
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  color: #0f172a;
  background: linear-gradient(135deg, #fef08a, #f59e0b);
  box-shadow: 0 10px 20px #00000022;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 26px #00000033;
  }
}

/* 主游戏场地，包含网格背景和发光边框。 */
.arena {
  position: relative;
  width: 920px;
  height: 560px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 24px;
  cursor: crosshair;
  background:
    linear-gradient(#ffffff12 1px, transparent 1px), linear-gradient(90deg, #ffffff12 1px, transparent 1px), radial-gradient(circle at top, #1d4ed8 0%, #0f172a 48%, #020617 100%);
  background-size:
    40px 40px,
    40px 40px,
    100% 100%;
  border: 1px solid #93c5fd33;
  box-shadow:
    inset 0 0 20px #ffffff0f,
    0 20px 40px #00000035;
}

/* 这些元素都采用绝对定位，方便直接使用游戏坐标渲染。 */
.brick,
.paddle,
.ball,
.drop,
.effect_tip,
.overlay {
  position: absolute;
}

/* 砖块视觉样式。 */
.brick {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 6px 14px #00000022;

  &__shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, #ffffff55, transparent 45%);
  }
}

/* 挡板样式。 */
.paddle {
  border-radius: 999px;
  background: linear-gradient(135deg, #f8fafc, #60a5fa);
  box-shadow: 0 8px 18px #00000035;
}

/* 小球样式。 */
.ball {
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffffff, #fef08a 38%, #f59e0b 72%, #b45309 100%);
  box-shadow: 0 0 14px #fde68a99;
}

/* 掉落道具的公共样式与不同类型的配色。 */
.drop {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
  box-shadow: 0 8px 18px #00000033;

  &--long {
    background: linear-gradient(135deg, #22c55e, #15803d);
  }

  &--short {
    background: linear-gradient(135deg, #ef4444, #b91c1c);
  }

  &--multi {
    background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  }

  &--fast {
    background: linear-gradient(135deg, #f97316, #c2410c);
  }

  &--slow {
    background: linear-gradient(135deg, #0ea5e9, #0369a1);
  }
}

/* 右上角短暂效果提示。 */
.effect_tip {
  top: 18px;
  right: 18px;
  z-index: 5;
  padding: 8px 14px;
  border-radius: 999px;
  background: #0f172ac7;
  color: #fde68a;
  font-weight: 700;
}

/* 非 running 状态下的覆盖层。 */
.overlay {
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0206179a;
  backdrop-filter: blur(4px);

  &__card {
    width: min(420px, calc(100% - 40px));
    padding: 26px;
    border-radius: 24px;
    text-align: center;
    background: linear-gradient(180deg, #0f172af2, #111827f2);
    box-shadow: 0 18px 40px #0000004d;

    h3 {
      margin: 0 0 12px;
      font-size: 28px;
      color: #f8fafc;
    }

    p {
      margin: 0 0 18px;
      color: #cbd5e1;
      line-height: 1.7;
    }
  }
}

/* 底部说明栏。 */
.bottom_bar {
  justify-content: center;
  flex-wrap: wrap;
  color: #bfdbfe;
  font-size: 13px;
}
</style>
