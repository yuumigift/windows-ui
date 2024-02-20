<template>
  <div>
    <div class="block" v-for="item in s.blocks" :style="getStyle(item)" :key="item.title" @mousedown="(e) => handleMouseDown(e, item)" @mouseup="handleMouseLeave"></div>
  </div>
</template>

<script setup lang="ts">
import { useMouse } from "@vueuse/core";

const mouse = useMouse();
const s = reactive({
  dragging: false,
  draggingItem: null as any,
  startMouse: { x: 0, y: 0 },
  startItemLocation: { x: 0, y: 0 },
  blocks: [
    {
      title: "a",
      content: "aaaa",
      width: 50,
      height: 50,
      x: 100,
      y: 100,
    },
    {
      title: "b",
      content: "bbbb",
      width: 120,
      height: 60,
      x: 300,
      y: 300,
    },
  ],
});

const getStyle = (item: any) => {
  return {
    width: item.width + "px",
    height: item.height + "px",
    left: item.x + "px",
    top: item.y + "px",
  };
};
const handleMouseDown = (e: any, item: any) => {
  s.dragging = true;
  s.startMouse.x = mouse.x.value;
  s.startMouse.y = mouse.y.value;
  s.startItemLocation.x = item.x;
  s.startItemLocation.y = item.y;
  s.draggingItem = item;
};
const handleMouseLeave = () => {
  s.dragging = false;
  s.draggingItem = null;
};
const handleMove = () => {
  if (s.dragging && s.draggingItem) {
    s.draggingItem.x = s.startItemLocation.x + mouse.x.value - s.startMouse.x;
    s.draggingItem.y = s.startItemLocation.y + mouse.y.value - s.startMouse.y;
  }
};

watch(
  () => mouse,
  () => handleMove(),
  { deep: true },
);
</script>
<style lang="less" scoped>
.block {
  position: absolute;
  background-color: #000;
  border: 1px solid #fff;
}
</style>
