<template>
  <div class="c__game">
    <canvas ref="canvas" width="800" height="600"></canvas>
  </div>
</template>
<script lang="ts" setup>
import { Game } from "./classes/Game";
import { Scene } from "./classes/Scene";
import { Player } from "./classes/Player";
import { Ground } from "./classes/Ground";

const canvas = ref<HTMLCanvasElement>();

const game = new Game();
game.addScene(new Scene());
game.addPlayer(new Player());
game.addGround(new Ground());

game.start(canvas);
</script>

<style lang="less" scoped>
//
</style>
