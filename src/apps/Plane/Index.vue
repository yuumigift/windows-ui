<template>
  <div>
    <canvas ref="canvas" width="800" height="600"></canvas>
  </div>
</template>
<script lang="ts" setup>
import { useTemplateRef } from "vue";
import { Game } from "./classes/Game";

const canvas = useTemplateRef("canvas");
const game = new Game();
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
