<template>
  <div class="outer-div">
    <div class="inner-div">
      <div class="world" v-if="load.IsLoad()">
        <div :style="Init?.getPosition" class="player"></div>
        {{ Player.getPosition }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {LoadGameAssets, ThePlayer} from "@/apps/Adventure/main/LoadGameAssets";
import type {Ref, StyleValue} from "vue";
import {AllActivePrefabs} from "@/gameScript/scripts/main";

let Init: Ref<ReturnType<typeof load.Init> | undefined> = ref();
const widthPx = (prop: number = 0) => `${prop}px`
const load = new LoadGameAssets(() => {
  Init.value = load.Init();
});

watch(() => load.IsLoad(), () => {

})


const Player = (() => {

  const getPosition = computed((): StyleValue => ({marginLeft: `${s.pos?.x}px`, marginBottom: `${s.pos?.y}px`,}))
  const s = reactive({
    inst: ThePlayer,
    pos: {} as { x: number, y: number } | undefined,
    getPosition
  })
  s.pos = s.inst?.Physical.pos

  return s;
})();

const Build = (() => {


  const s = reactive({
    inst: AllActivePrefabs.find(item => item.HasTag("build"))
  })

  return s
})()
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

.world {
  width: 800px;
  height: 600px;
  border: 1px solid red;
  display: flex;
  justify-content: start;
  align-items: end;
}

.player {
  border: 1px solid red;
  width: v-bind("widthPx(Init?.player.width)");
  height: 100px;
}
</style>
