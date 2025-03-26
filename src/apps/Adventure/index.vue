<template>
  <div class="outer-div">
    <div class="inner-div">
      <div class="world" v-if="game.IsLoad()">
        <div :style="Player.getPosition" class="player">{{ Player.inst?.data.name }}</div>
        <div style="position:absolute;display: flex">
          <div :style="Thorn.getStyle(item)" v-for="(item, index) in Thorn.insts">
            {{ item.width }}
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LoadGameAssets, ThePlayer } from "@/apps/Adventure/main/LoadGameAssets";
import type { StyleValue } from "vue";
import { AllActivePrefabs, type ent } from "@/gameScript/scripts/main";

const widthPx = (prop: number = 0) => `${prop}px`;
const game = new LoadGameAssets(() => {
});

watch(() => game.IsLoad().value, () => {
  Player.init();
  Thorn.init();
});

const Player = (() => {
  const init = () => {
    Player.pos = Player.inst?.Physical.pos;
  };
  const getPosition = computed((): StyleValue => ({ left: `${s.pos?.x}px`, bottom: `${s.pos?.y}px` }));
  const s = reactive({
    inst: ThePlayer,
    pos: {} as { x: number, y: number } | undefined,
    getPosition,
    init
  });

  return s;
})();

const Thorn = (() => {
  const init = () => {
    s.insts = AllActivePrefabs.filter(item => item.data.name === "thorn");
  };

  const getStyle = (inst: ent): StyleValue => ({
    width: `${inst.width}px`,
    height: `${inst.height}px`,
    left: `${inst.Physical.pos.x}px`,
    bottom: `${inst.Physical.pos.y}px`,
    border: "1px solid",
    position: "absolute"
  });
  const s = reactive({
    insts: AllActivePrefabs as ent[] | undefined,
    init,
    getStyle
  });

  return s;
})();
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
  position: relative;
  border: 1px solid red;
  width: v-bind("widthPx(Player.inst?.width)");
  height: v-bind("widthPx(Player.inst?.height)");
}
</style>
