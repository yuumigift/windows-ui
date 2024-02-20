<template>
  <div>
    <div class="box"></div>
  </div>
</template>

<script setup lang="ts">
import { promiseTimeout as sleep } from "@vueuse/core";
import { ElButton } from "element-plus";

const my_width = ref(100);

const withPx = (num: number) => `${num}px`;
const act = () => {
  my_width.value += 1;
  requestAnimationFrame(act);
};

act();
</script>

<style lang="less" scoped>
.box {
  position: absolute;
  left: 0;
  width: v-bind("withPx(my_width)");
  height: 50px;
  background: #fae;
}
</style>
