<template>
  <div ref="ref_right_menu" class="root--context-menu" :style="{ left: `${x}px`, top: `${y}px` }">
    <div class="context-menu-item" :class="{ is_disabled: item.disabled }" v-for="item in menu" :key="item.title" @click="() => handleMenuClick(item)">{{ item.title }}</div>
  </div>
</template>
<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { useTemplateRef } from "vue";
import type { ContextMenuItem } from "./types";

interface Props {
  x: number;
  y: number;
  menu: ContextMenuItem[];
  onCloseMenu: () => void;
}

const props = defineProps<Props>();
const emit = defineEmits(["menu-click"]);
const ref_right_menu = useTemplateRef("ref_right_menu");

const handleClickOutside = () => {
  props.onCloseMenu.call(null);
};
const handleMenuClick = (item: ContextMenuItem) => {
  if (item.disabled) return;
  item.handler.call(null);
  props.onCloseMenu.call(null);
};

onMounted(() => {
  onClickOutside(ref_right_menu, handleClickOutside);
});
</script>
<style lang="scss" scoped>
.root--context-menu {
  position: fixed;
  border-radius: 6px;
  border: 1px solid #0001;
  overflow: hidden;
  background: #fff;
  z-index: 9999999;
}
.context-menu-item {
  width: 160px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  cursor: default;
  user-select: none;
  transition: 0.1s;
  //
  &:hover {
    background: #0001;
  }
  &.is_disabled {
    color: #999;
    //
    &:hover {
      background: #fff;
    }
  }
}
</style>
