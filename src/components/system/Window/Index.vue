<template>
  <div class="c__window" :class="{ is_active: isActive }" :style="Window.style" @mousedown="handleWindowMouseDown">
    <div class="title" @mousedown="handleDragStart" @mouseup="handleDragEnd">{{ title }}</div>
    <div class="controls">
      <div class="controls--btn">
        <img src="./assets/min.svg" alt="" />
      </div>
      <div class="controls--btn" v-if="!Window.isMaximize" @click="Window.isMaximize = true">
        <img src="./assets/max.svg" alt="" />
      </div>
      <div class="controls--btn" v-else @click="Window.isMaximize = false">
        <img src="./assets/reset.svg" alt="" />
      </div>
      <div class="controls--btn is_close" @click="handleClose">
        <img src="./assets/close.svg" alt="" />
      </div>
    </div>
    <div class="content">
      <slot name="default"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watchEffect } from "vue";
import { useMouse } from "@vueuse/core";

const mouse = useMouse();

const emit = defineEmits(["active", "close"]);
const modelValue = defineModel({
  default: false,
});
const props = defineProps({
  isActive: {
    default: false,
  },
  title: {
    default: "",
  },
});

const Window = reactive({
  dragging: false,
  isMaximize: false,
  x: Math.random() * 50 + 50,
  y: Math.random() * 50 + 50,
  ox: 0,
  oy: 0,
  sx: 0,
  sy: 0,
  width: 800,
  height: 600,

  style: computed((): any => {
    if (Window.isMaximize) {
      return {
        left: 0,
        right: 0,
        top: 0,
        bottom: "50px",
        zIndex: props.isActive ? 60 : 50,
      };
    } else {
      return {
        left: `${Window.x}px`,
        top: `${Window.y}px`,
        width: `${Window.width}px`,
        height: `${Window.height}px`,
        zIndex: props.isActive ? 60 : 50,
      };
    }
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
const handleWindowMouseDown = () => {
  emit("active");
};
const handleClose = () => {
  emit("close");
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
  display: grid;
  position: fixed;
  grid-template-areas: "a b" "c c";
  grid-template-rows: 40px 1fr;
  grid-template-columns: 1fr auto;
  border-radius: 8px;
  box-shadow: 2px 2px 6px #0003;
  background: linear-gradient(-10deg, #ccc, #fff);
  overflow: hidden;

  &.is_active {
    background: linear-gradient(-10deg, #ccc 0%, #fff 80%, #ecf4ff 100%);
    box-shadow: 2px 2px 6px #0009;
  }
}
.title {
  display: grid;
  grid-area: a;
  align-items: center;
  padding: 0 1em;
  color: #222;
  user-select: none;
}
.controls {
  display: grid;
  grid-area: b;
  grid-template-columns: repeat(3, 40px);

  &--btn {
    display: grid;
    align-items: center;
    justify-items: center;
    transition: 0.2s;
    background: #fff0;
    cursor: pointer;
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
      width: 36%;
      height: 36%;
    }
  }
}

.content {
  position: relative;
  grid-area: c;
}
</style>
