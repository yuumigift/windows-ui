<template>
  <div class="outer-div">
    <div class="inner-div">
      <div class="world" v-if="game.IsLoad()">
        <div :style="Player.getPosition" class="player"></div>
        <div v-for="(item, index) in Build.insts">2</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {LoadGameAssets, ThePlayer} from "@/apps/Adventure/main/LoadGameAssets";
import type {StyleValue} from "vue";
import {AllActivePrefabs} from "@/gameScript/scripts/main";
import type {EntityScript} from "@/gameScript/scripts/entityscript";

const widthPx = (prop: number = 0) => `${prop}px`
const game = new LoadGameAssets(() => {
});

watch(() => game.IsLoad().value, () => {
  Player.init()
})

const Player = (() => {
  const init = () => {
    Player.pos = Player.inst?.Physical.pos
  }
  const getPosition = computed((): StyleValue => ({marginLeft: `${s.pos?.x}px`, marginBottom: `${s.pos?.y}px`,}))
  const s = reactive({
    inst: ThePlayer,
    pos: {} as { x: number, y: number } | undefined,
    getPosition,
    init
  })

  return s;
})();

const Build = (() => {
  const init = () => {
    s.insts = AllActivePrefabs.find(item => item.HasTag("build"))
  }
  const s = reactive({
    insts: {} as ReturnType<typeof EntityScript>[],
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
  width: v-bind("widthPx(Player.inst?.width)");
  height: v-bind("widthPx(Player.inst?.height)");
}
</style>
