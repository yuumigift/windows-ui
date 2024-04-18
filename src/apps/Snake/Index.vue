<template>
  <div>
    <div class="stage" :style="stage.style">
      <div class="snake_body" :class="{ is_head: index === 0 }" :style="snake.getStyle(item)" v-for="(item, index) in snake.body" :key="index"></div>
      <div class="food" :style="food.style"></div>
      <div class="die" v-if="snake.is_die">你死了！</div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Piece = [number, number];
type Direction = "left" | "right" | "up" | "down";
type PieceStyle = {
  left: string;
  top: string;
  width: string;
  height: string;
};

const stage = reactive({
  size: 32,
  pixel: 16,
  style: computed((): { width: string; height: string } => {
    return {
      width: `${(stage.size + 1) * stage.pixel}px`,
      height: `${(stage.size + 1) * stage.pixel}px`,
    };
  }),

  handleKeyDown(e: KeyboardEvent) {
    const map_direction: Record<string, Direction> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    };
    const new_direction = map_direction[e.code];
    if (!new_direction) {
      return;
    }
    // 阻止倒车
    if (snake.direction === "left" && new_direction === "right") {
      return;
    } else if (snake.direction === "right" && new_direction === "left") {
      return;
    } else if (snake.direction === "up" && new_direction === "down") {
      return;
    } else if (snake.direction === "down" && new_direction === "up") {
      return;
    }
    snake.direction = new_direction;
  },
  enterFrame() {
    if (!snake.is_die) {
      snake.move();
      if (snake.body[0][0] === food.position[0] && snake.body[0][1] === food.position[1]) {
        snake.is_growing = true;
        food.create();
      }
    }
  },
  start() {
    snake.init();
    food.create();
    setInterval(() => {
      stage.enterFrame();
    }, 200);
  },
});

const snake = reactive({
  is_die: false,
  is_growing: false,
  direction: "up" as Direction,
  body: [] as Piece[],

  getStyle(body_piece: Piece) {
    return {
      left: `${body_piece[0] * stage.pixel}px`,
      top: `${body_piece[1] * stage.pixel}px`,
      width: `${stage.pixel}px`,
      height: `${stage.pixel}px`,
    } as PieceStyle;
  },
  init() {
    const center_x = Math.floor(stage.size / 2);
    const center_y = Math.floor(stage.size / 2);
    snake.body = [
      [center_x, center_y],
      [center_x, center_y + 1],
      [center_x, center_y + 2],
    ];
  },
  move() {
    const getNewSnakeTail = () => {
      if (snake.is_growing) {
        snake.is_growing = false;
        return snake.body;
      } else {
        return snake.body.filter((o, i) => i < snake.body.length - 1);
      }
    };

    const getNewSnakeHead = (): Piece => {
      const oldHead = snake.body[0];
      if (snake.direction === "left") {
        if (oldHead[0] === 0) {
          snake.is_die = true;
          return [0, oldHead[1]];
        } else {
          return [oldHead[0] - 1, oldHead[1]];
        }
      } else if (snake.direction === "right") {
        if (oldHead[0] === stage.size) {
          snake.is_die = true;
          return [stage.size, oldHead[1]];
        } else {
          return [oldHead[0] + 1, oldHead[1]];
        }
      } else if (snake.direction === "up") {
        if (oldHead[1] === 0) {
          snake.is_die = true;
          return [oldHead[0], 0];
        } else {
          return [oldHead[0], oldHead[1] - 1];
        }
      } else if (snake.direction === "down") {
        if (oldHead[1] === stage.size) {
          snake.is_die = true;
          return [oldHead[0], stage.size];
        } else {
          return [oldHead[0], oldHead[1] + 1];
        }
      } else {
        return [0, 0];
      }
    };
    const new_body = [getNewSnakeHead(), ...getNewSnakeTail()];
    const head = new_body[0];
    new_body.forEach((o, i) => {
      if (i > 0 && o[0] === head[0] && o[1] === head[1]) {
        snake.is_die = true;
      }
    });
    snake.body = new_body;
  },
});

const food = reactive({
  position: [0, 0] as Piece,
  style: computed((): PieceStyle => {
    return {
      left: `${food.position[0] * stage.pixel}px`,
      top: `${food.position[1] * stage.pixel}px`,
      width: `${stage.pixel}px`,
      height: `${stage.pixel}px`,
    } as PieceStyle;
  }),

  create() {
    const createPosition = () => {
      const x = Math.floor(Math.random() * stage.size);
      const y = Math.floor(Math.random() * stage.size);
      // 避免在贪吃蛇身体中生成食物
      let is_in_body = false;
      for (let index = 0; index < snake.body.length; index++) {
        const body_piece = snake.body[index];
        if (body_piece[0] === x && body_piece[1] === y) {
          is_in_body = true;
        }
      }
      if (is_in_body) {
        createPosition();
      } else {
        food.position = [x, y];
      }
    };
    createPosition();
  },
});

onMounted(() => {
  window.addEventListener("keydown", stage.handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", stage.handleKeyDown);
});

stage.start();
</script>

<style lang="less" scoped>
.stage {
  position: relative;
  border: solid 1px teal;
  margin: 0 auto;
}

.snake_body {
  position: absolute;
  background: gray;

  &.is_head {
    background: red;
    z-index: 10;
  }
}
.food {
  position: absolute;
  background: teal;
}

.die {
  z-index: 20;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000a;
  font-size: 30px;
  color: red;
}
</style>
