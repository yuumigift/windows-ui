<template>
  <div class="outer-div">
    <div class="inner-div">
      <div :style="Init?.getPosition" class="player"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LoadGameAssets } from "@/apps/Adventure/main/LoadGameAssets";
import type {Ref} from "vue";

let Init: Ref<ReturnType<typeof load.Init> | undefined> = ref();

const load = new LoadGameAssets(() => {
  Init.value = load.Init();
});
</script>

<style scoped lang="less">
.outer-div {
  width: 100%;
  height: 100%;
  display: grid; /* 使用 Grid 布局 */
  place-items: center; /* 垂直和水平居中对齐 */
}

.inner-div {
  display: inline-block;
}

.player{
  border: 1px solid red;
  width: 100px;
  height: 100px;
}
</style>
