<template>
  <div class="c__game">
    <canvas ref="canvas" width="800" height="600"></canvas>
    <div class="game_over" v-if="game.global.over.value">你失败了！</div>
  </div>
</template>
<script lang="ts" setup>
import { Game } from "./classes/Game";
import { Viewport } from "./classes/Viewport";
import { Player } from "./classes/Player";
import { Ground } from "./classes/Ground";
import { Monster } from "./classes/Monster";

const canvas = ref<HTMLCanvasElement>();

const game = new Game({
  viewport: new Viewport(),
  player: new Player(),
  monster: new Monster(),
  ground: new Ground(),
});

game.start(canvas);
</script>

<style lang="less" scoped>
.game_over {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: #0009;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 30px;
}
</style>
