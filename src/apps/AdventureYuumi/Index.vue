<template>
  <div class="c__game">
    <canvas ref="canvas" width="800" height="600"></canvas>
  </div>
</template>
<script lang="ts" setup>
import { useCanvas } from "./common";

const canvas = ref<HTMLCanvasElement>();
const { draw, clear, setContext } = useCanvas();

const GRAVITY = 0.05;
class Game {
  player;
  ground;
  constructor(player: InstanceType<typeof Player>, ground: InstanceType<typeof Ground>) {
    this.player = player;
    this.ground = ground;
  }
  enterFrame() {
    requestAnimationFrame(() => this.enterFrame());
    clear();
    player.enterFrame();
    ground.enterFrame();
  }
  start() {
    const init = () => {
      setContext(canvas.value?.getContext("2d"));
      this.enterFrame();
    };
    onMounted(init);
  }
}
class Player {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  jumping = false;
  constructor() {
    addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowUp":
          if (!this.jumping) {
            this.vy = -4;
            this.jumping = true;
          }
          break;
        case "ArrowLeft":
          this.vx = -1;
          break;
        case "ArrowRight":
          this.vx = 1;
          break;
      }
    });
    addEventListener("keyup", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.vx = 0;
          break;
        case "ArrowRight":
          this.vx = 0;
          break;
      }
    });
  }
  enterFrame() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += GRAVITY;
    if (this.y > 400 - 50) {
      this.y = 400 - 50;
      this.jumping = false;
    }

    draw(this.x, this.y, 50, 50, "red");
  }
}
class Ground {
  enterFrame() {
    draw(0, 400, 800, 200, "#333");
  }
}

const player = new Player();
const ground = new Ground();
const game = new Game(player, ground);

game.start();
</script>
<style lang="less" scoped>
//
</style>
