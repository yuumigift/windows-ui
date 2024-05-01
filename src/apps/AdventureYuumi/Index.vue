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
import { Monster } from "./classes/Monster";

const canvas = ref<HTMLCanvasElement>();

const game = new Game();

game.viewport = new Viewport();
game.player = new Player("teal");
game.monster = new Monster("red");
game.ground = new Ground();

game.start(canvas);
</script>

<style lang="less" scoped>
//
</style>
