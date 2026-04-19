<template>
  <div class="elastic_ball">
    <div class="top_bar">
      <div class="panel">
        <span>状态：{{ game.statusLabel }}</span>
        <span>得分：{{ game.score }}</span>
        <span>剩余砖块：{{ remainingBrickCount }}</span>
        <span>球数：{{ game.balls.length }}</span>
      </div>
      <button class="restart_btn" @click="resetGame">重新开始</button>
    </div>

    <div ref="arenaRef" class="arena" @mousemove="handlePointerMove" @click="handleLaunch">
      <div v-for="brick in visibleBricks" :key="brick.id" class="brick" :style="getBrickStyle(brick)">
        <span class="brick__shine"></span>
      </div>

      <div v-for="drop in game.drops" :key="drop.id" class="drop" :class="`drop--${drop.type}`" :style="getDropStyle(drop)">
        {{ drop.label }}
      </div>

      <div class="paddle" :style="paddleStyle"></div>

      <div v-for="ball in game.balls" :key="ball.id" class="ball" :style="getBallStyle(ball)"></div>

      <div class="effect_tip" v-if="game.effectText">
        {{ game.effectText }}
      </div>

      <div class="overlay" v-if="game.status !== 'running'">
        <div class="overlay__card">
          <h3>{{ game.overlayTitle }}</h3>
          <p>{{ game.overlayText }}</p>
          <button class="overlay__btn" @click.stop="handleOverlayAction">
            {{ game.status === "ready" ? "点击发射" : "再来一局" }}
          </button>
        </div>
      </div>
    </div>

    <div class="bottom_bar">
      <span>操作说明：移动鼠标控制挡板，点击发射小球。</span>
      <span>随机道具：变长、变短、多球、加速、减速。</span>
    </div>
  </div>
</template>

<script setup lang="ts">
type GameStatus = "ready" | "running" | "over";
type DropType = "long" | "short" | "multi" | "fast" | "slow";

type Ball = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
};

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

type Drop = {
  id: number;
  type: DropType;
  x: number;
  y: number;
  size: number;
  vy: number;
  label: string;
};

const ARENA_WIDTH = 920;
const ARENA_HEIGHT = 560;
const BALL_SIZE = 14;
const PADDLE_HEIGHT = 16;
const DEFAULT_PADDLE_WIDTH = 148;
const MIN_PADDLE_WIDTH = 84;
const MAX_PADDLE_WIDTH = 230;
const PADDLE_Y = ARENA_HEIGHT - 34;
const BRICK_ROWS = 6;
const BRICK_COLUMNS = 10;
const BRICK_WIDTH = 76;
const BRICK_HEIGHT = 24;
const BRICK_GAP = 10;
const BRICK_OFFSET_TOP = 42;
const BASE_BALL_SPEED = 420;
const MIN_BALL_SPEED = 220;
const MAX_BALL_SPEED = 760;
const DROP_SIZE = 28;
const DROP_SPEED = 150;
const DROP_CHANCE = 0.32;
const EFFECT_TEXT_DURATION = 1400;

const dropPool: Array<{ type: DropType; label: string }> = [
  { type: "long", label: "长" },
  { type: "short", label: "短" },
  { type: "multi", label: "裂" },
  { type: "fast", label: "快" },
  { type: "slow", label: "慢" },
];

const brickColors = [
  "linear-gradient(135deg, #f87171, #ef4444)",
  "linear-gradient(135deg, #fb923c, #f97316)",
  "linear-gradient(135deg, #facc15, #eab308)",
  "linear-gradient(135deg, #4ade80, #22c55e)",
  "linear-gradient(135deg, #38bdf8, #0ea5e9)",
  "linear-gradient(135deg, #a78bfa, #8b5cf6)",
];

const arenaRef = ref<HTMLDivElement | null>(null);
let animationFrameId: number | null = null;
let lastTimestamp = 0;
let effectTextTimer: number | null = null;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const createBall = (id: number, x: number, y: number, vx = 0, vy = 0): Ball => ({
  id,
  x,
  y,
  vx,
  vy,
  size: BALL_SIZE,
});

const game = reactive({
  status: "ready" as GameStatus,
  statusLabel: "待发射",
  overlayTitle: "弹弹球",
  overlayText: "移动鼠标控制挡板，点击鼠标发射小球。",
  score: 0,
  pointerX: ARENA_WIDTH / 2,
  nextBallId: 1,
  nextBrickId: 1,
  nextDropId: 1,
  paddle: {
    x: (ARENA_WIDTH - DEFAULT_PADDLE_WIDTH) / 2,
    width: DEFAULT_PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
  },
  balls: [] as Ball[],
  bricks: [] as Brick[],
  drops: [] as Drop[],
  effectText: "",
});

const visibleBricks = computed(() => game.bricks.filter((brick) => brick.visible));
const remainingBrickCount = computed(() => visibleBricks.value.length);

const paddleStyle = computed(() => ({
  width: `${game.paddle.width}px`,
  height: `${game.paddle.height}px`,
  left: `${game.paddle.x}px`,
  top: `${PADDLE_Y}px`,
}));

const getBallStyle = (ball: Ball) => ({
  width: `${ball.size}px`,
  height: `${ball.size}px`,
  left: `${ball.x - ball.size / 2}px`,
  top: `${ball.y - ball.size / 2}px`,
});

const getBrickStyle = (brick: Brick) => ({
  width: `${brick.width}px`,
  height: `${brick.height}px`,
  left: `${brick.x}px`,
  top: `${brick.y}px`,
  background: brick.color,
});

const getDropStyle = (drop: Drop) => ({
  width: `${drop.size}px`,
  height: `${drop.size}px`,
  left: `${drop.x - drop.size / 2}px`,
  top: `${drop.y - drop.size / 2}px`,
});

const setStatus = (status: GameStatus, text?: string) => {
  game.status = status;
  if (status === "ready") {
    game.statusLabel = "待发射";
    game.overlayTitle = "弹弹球";
    game.overlayText = text ?? "移动鼠标控制挡板，点击鼠标发射小球。";
    return;
  }
  if (status === "running") {
    game.statusLabel = "进行中";
    game.overlayTitle = "";
    game.overlayText = "";
    return;
  }
  game.statusLabel = "已结束";
  game.overlayTitle = "游戏结束";
  game.overlayText = text ?? "球没有接住，点击按钮重新挑战。";
};

const showEffectText = (text: string) => {
  game.effectText = text;
  if (effectTextTimer !== null) {
    window.clearTimeout(effectTextTimer);
  }
  effectTextTimer = window.setTimeout(() => {
    game.effectText = "";
    effectTextTimer = null;
  }, EFFECT_TEXT_DURATION);
};

const syncReadyBall = () => {
  if (game.status !== "ready") return;
  const firstBall = game.balls[0];
  if (!firstBall) return;
  firstBall.x = game.paddle.x + game.paddle.width / 2;
  firstBall.y = PADDLE_Y - BALL_SIZE / 2 - 4;
  firstBall.vx = 0;
  firstBall.vy = 0;
};

const createBricks = () => {
  const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
  const offsetLeft = (ARENA_WIDTH - totalWidth) / 2;
  const bricks: Brick[] = [];

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLUMNS; col++) {
      bricks.push({
        id: game.nextBrickId++,
        x: offsetLeft + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        hp: 1,
        color: brickColors[row % brickColors.length] ?? brickColors[0] ?? "#ef4444",
        visible: true,
      });
    }
  }
  game.bricks = bricks;
};

const resetGame = () => {
  game.score = 0;
  game.nextBallId = 1;
  game.nextBrickId = 1;
  game.nextDropId = 1;
  game.drops = [];
  game.effectText = "";
  game.paddle.width = DEFAULT_PADDLE_WIDTH;
  game.paddle.x = (ARENA_WIDTH - game.paddle.width) / 2;
  game.pointerX = game.paddle.x + game.paddle.width / 2;
  createBricks();
  game.balls = [createBall(game.nextBallId++, game.paddle.x + game.paddle.width / 2, PADDLE_Y - BALL_SIZE / 2 - 4)];
  setStatus("ready");
};

const handleOverlayAction = () => {
  if (game.status === "over") {
    resetGame();
    return;
  }
  handleLaunch();
};

const updatePaddleByPointer = (clientX: number) => {
  const rect = arenaRef.value?.getBoundingClientRect();
  if (!rect) return;

  const localX = clamp(clientX - rect.left, 0, rect.width);
  game.pointerX = (localX / rect.width) * ARENA_WIDTH;
  game.paddle.x = clamp(game.pointerX - game.paddle.width / 2, 0, ARENA_WIDTH - game.paddle.width);
  syncReadyBall();
};

const handlePointerMove = (event: MouseEvent) => {
  updatePaddleByPointer(event.clientX);
};

const launchBall = () => {
  const firstBall = game.balls[0];
  if (!firstBall) return;

  const paddleCenter = game.paddle.x + game.paddle.width / 2;
  const influence = clamp((game.pointerX - paddleCenter) / (game.paddle.width / 2 || 1), -1, 1);
  firstBall.vx = influence * 220;
  firstBall.vy = -Math.sqrt(Math.max(BASE_BALL_SPEED ** 2 - firstBall.vx ** 2, BASE_BALL_SPEED ** 2 * 0.55));
  setStatus("running");
};

const handleLaunch = () => {
  if (game.status === "ready") {
    launchBall();
  }
};

const setBallSpeed = (ball: Ball, multiplier: number) => {
  const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2) || BASE_BALL_SPEED;
  const nextSpeed = clamp(speed * multiplier, MIN_BALL_SPEED, MAX_BALL_SPEED);
  const scale = nextSpeed / speed;
  ball.vx *= scale;
  ball.vy *= scale;
};

const addDrop = (x: number, y: number) => {
  if (Math.random() > DROP_CHANCE) return;
  const picked = dropPool[Math.floor(Math.random() * dropPool.length)] ?? dropPool[0];
  if (!picked) return;

  game.drops.push({
    id: game.nextDropId++,
    type: picked.type,
    x,
    y,
    size: DROP_SIZE,
    vy: DROP_SPEED,
    label: picked.label,
  });
};

const spawnMultiBalls = () => {
  const sourceBall = game.balls[0];
  if (!sourceBall) return;

  const targetCount = 6 + Math.floor(Math.random() * 3);
  const baseSpeed = clamp(Math.sqrt(sourceBall.vx ** 2 + sourceBall.vy ** 2) || BASE_BALL_SPEED, MIN_BALL_SPEED, MAX_BALL_SPEED);
  const startAngle = -Math.PI * 0.9;
  const endAngle = -Math.PI * 0.1;

  const balls: Ball[] = [];
  for (let index = 0; index < targetCount; index++) {
    const t = targetCount === 1 ? 0.5 : index / (targetCount - 1);
    const angle = startAngle + (endAngle - startAngle) * t;
    balls.push(createBall(game.nextBallId++, sourceBall.x, sourceBall.y, Math.cos(angle) * baseSpeed, Math.sin(angle) * baseSpeed));
  }
  game.balls = balls;
};

const applyDropEffect = (type: DropType) => {
  if (type === "long") {
    game.paddle.width = clamp(game.paddle.width + 34, MIN_PADDLE_WIDTH, MAX_PADDLE_WIDTH);
    game.paddle.x = clamp(game.paddle.x, 0, ARENA_WIDTH - game.paddle.width);
    showEffectText("挡板变长");
    return;
  }

  if (type === "short") {
    game.paddle.width = clamp(game.paddle.width - 26, MIN_PADDLE_WIDTH, MAX_PADDLE_WIDTH);
    game.paddle.x = clamp(game.paddle.x, 0, ARENA_WIDTH - game.paddle.width);
    showEffectText("挡板变短");
    return;
  }

  if (type === "multi") {
    spawnMultiBalls();
    showEffectText("多球来袭");
    return;
  }

  if (type === "fast") {
    game.balls.forEach((ball) => setBallSpeed(ball, 1.18));
    showEffectText("球速提升");
    return;
  }

  game.balls.forEach((ball) => setBallSpeed(ball, 0.84));
  showEffectText("球速降低");
};

const intersectsRect = (ball: Ball, rect: { x: number; y: number; width: number; height: number }) => {
  const half = ball.size / 2;
  return ball.x + half >= rect.x && ball.x - half <= rect.x + rect.width && ball.y + half >= rect.y && ball.y - half <= rect.y + rect.height;
};

const reflectBallFromBrick = (ball: Ball, brick: Brick) => {
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

const updateDrops = (delta: number) => {
  const paddleRect = {
    x: game.paddle.x,
    y: PADDLE_Y,
    width: game.paddle.width,
    height: game.paddle.height,
  };

  game.drops = game.drops.filter((drop) => {
    drop.y += drop.vy * delta;

    const intersectsPaddle =
      drop.x + drop.size / 2 >= paddleRect.x &&
      drop.x - drop.size / 2 <= paddleRect.x + paddleRect.width &&
      drop.y + drop.size / 2 >= paddleRect.y &&
      drop.y - drop.size / 2 <= paddleRect.y + paddleRect.height;

    if (intersectsPaddle) {
      applyDropEffect(drop.type);
      return false;
    }

    return drop.y - drop.size / 2 <= ARENA_HEIGHT;
  });
};

const updateBalls = (delta: number) => {
  const paddleRect = {
    x: game.paddle.x,
    y: PADDLE_Y,
    width: game.paddle.width,
    height: game.paddle.height,
  };

  for (const ball of game.balls) {
    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;

    const half = ball.size / 2;
    if (ball.x - half <= 0) {
      ball.x = half;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x + half >= ARENA_WIDTH) {
      ball.x = ARENA_WIDTH - half;
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
      const impact = clamp((ball.x - (paddleRect.x + paddleRect.width / 2)) / (paddleRect.width / 2 || 1), -1, 1);
      const speed = clamp(Math.sqrt(ball.vx ** 2 + ball.vy ** 2) * 1.01, MIN_BALL_SPEED, MAX_BALL_SPEED);
      ball.vx = impact * speed * 0.95;
      ball.vy = -Math.sqrt(Math.max(speed ** 2 - ball.vx ** 2, MIN_BALL_SPEED ** 2 * 0.35));
      ball.y = paddleRect.y - half - 1;
    }

    for (const brick of game.bricks) {
      if (!brick.visible) continue;
      if (!intersectsRect(ball, brick)) continue;

      brick.hp -= 1;
      reflectBallFromBrick(ball, brick);
      if (brick.hp <= 0) {
        brick.visible = false;
        game.score += 10;
        addDrop(brick.x + brick.width / 2, brick.y + brick.height / 2);
      }
      break;
    }
  }

  game.balls = game.balls.filter((ball) => ball.y - ball.size / 2 <= ARENA_HEIGHT + 20);

  if (!remainingBrickCount.value) {
    setStatus("over", "所有砖块都被清掉了，漂亮！");
    return;
  }

  if (!game.balls.length) {
    setStatus("over", "球没有接住，挑战结束。");
  }
};

const gameLoop = (timestamp: number) => {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }
  const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.024);
  lastTimestamp = timestamp;

  if (game.status === "running") {
    updateBalls(delta);
    updateDrops(delta);
  } else if (game.status === "ready") {
    syncReadyBall();
  }

  animationFrameId = requestAnimationFrame(gameLoop);
};

onMounted(() => {
  resetGame();
  animationFrameId = requestAnimationFrame(gameLoop);
});

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
  if (effectTextTimer !== null) {
    window.clearTimeout(effectTextTimer);
  }
});
</script>

<style scoped lang="less">
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

.top_bar,
.bottom_bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

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

.brick,
.paddle,
.ball,
.drop,
.effect_tip,
.overlay {
  position: absolute;
}

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

.paddle {
  border-radius: 999px;
  background: linear-gradient(135deg, #f8fafc, #60a5fa);
  box-shadow: 0 8px 18px #00000035;
}

.ball {
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffffff, #fef08a 38%, #f59e0b 72%, #b45309 100%);
  box-shadow: 0 0 14px #fde68a99;
}

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

.bottom_bar {
  justify-content: center;
  flex-wrap: wrap;
  color: #bfdbfe;
  font-size: 13px;
}
</style>
