<template>
  <div class="c__game">
    <canvas ref="canvas" width="800" height="600"></canvas>
  </div>
</template>
<script lang="ts" setup>
import { Game } from "./classes/Game";
import { Viewport } from "./classes/Viewport";
import { Player } from "./classes/Player";
import { Ground } from "./classes/Ground";

const canvas = ref<HTMLCanvasElement>();

const game = new Game();
game.addViewport(new Viewport());
game.addPlayer(new Player("red"));
game.addGround(new Ground());

game.start(canvas);
</script>

<style lang="less" scoped>
//
</style>
