<template>
  <div>
    <canvas ref="canvas" width="800" height="600"></canvas>
  </div>
</template>
<script lang="ts" setup>
import { useTemplateRef } from "vue";
import { Game } from "./classes/Game";
// 输入名字

const name = prompt("请输入你的名字");
const canvas = useTemplateRef("canvas");
const game = new Game(name || "匿名玩家");
game.start(canvas);
onBeforeUnmount(game.close.bind(game));
</script>
