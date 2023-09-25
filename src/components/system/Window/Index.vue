<template>
  <div class="c__window" :style="Window.style">
    <div class="title" @mousedown="handleDragStart" @mouseup="handleDragEnd">{{ title }}</div>
    <div class="controls">
      <div class="controls--btn">
        <img src="./assets/min.svg" alt="" />
      </div>
      <div class="controls--btn">
        <img src="./assets/max.svg" alt="" />
      </div>
      <div class="controls--btn is_close">
        <img src="./assets/close.svg" alt="" />
      </div>
    </div>
    <div class="content">
      {{ mouse }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watchEffect } from "vue";
import { useMouse } from "@vueuse/core";

const mouse = useMouse();

const modelValue = defineModel({
  default: false,
});
const props = defineProps({
  title: {
    default: "",
  },
});

const Window = reactive({
  dragging: false,
  x: 50,
  y: 50,
  ox: 0,
  oy: 0,
  sx: 0,
  sy: 0,
  width: 800,
  height: 600,

  style: computed((): any => {
    return {
      left: `${Window.x}px`,
      top: `${Window.y}px`,
      width: `${Window.width}px`,
      height: `${Window.height}px`,
    };
  }),
});

const handleDragStart = () => {
  Window.sx = mouse.x.value;
  Window.sy = mouse.y.value;
  Window.ox = Window.x;
  Window.oy = Window.y;
  Window.dragging = true;
};
const handleDragEnd = () => {
  Window.dragging = false;
};

watchEffect(() => {
  if (Window.dragging) {
    Window.x = Window.ox + mouse.x.value - Window.sx;
    Window.y = Window.oy + mouse.y.value - Window.sy;
  }
});
</script>

<style lang="less" scoped>
.c__window {
  border-radius: 8px;
  display: grid;
  grid-template-areas: "a b" "c c";
  grid-template-columns: 1fr auto;
  grid-template-rows: 40px 1fr;
  overflow: hidden;
  position: fixed;
  z-index: 50;
  background: linear-gradient(-10deg, #ccc, #fff);
  box-shadow: 2px 2px 6px #0006;
}
.title {
  align-items: center;
  color: #222;
  display: grid;
  grid-area: a;
  padding: 0 1em;
  user-select: none;
}
.controls {
  grid-area: b;
  display: grid;
  grid-template-columns: repeat(3, 40px);

  &--btn {
    align-items: center;
    background: #fff0;
    cursor: pointer;
    display: grid;
    justify-items: center;
    transition: 0.2s;
    user-select: none;

    &.is_close {
      &:hover {
        background: #f00;
      }
    }
    &:hover {
      background: #0002;
    }
    & > img {
      width: 50%;
      height: 50%;
    }
  }
}

.content {
  grid-area: c;
}
</style>
