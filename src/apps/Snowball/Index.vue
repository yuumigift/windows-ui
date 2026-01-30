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
onBeforeUnmount(game.close.bind(game));
</script>
