<template>
  <div v-if="visible" ref="r__right_menu" class="c__right_menu" :style="{ left: `${menuX}px`, top: `${menuY}px` }" @click="handleClick">
    <div class="menu" v-for="item in menu" :key="item.title" @click="item.handler">{{ item.title }}</div>
  </div>
</template>
<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";

const props = defineProps({
  menu: {
    default: () => <{ title: string; handler: Function }[]>[],
  },
});

const visible = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const r__right_menu = ref<HTMLElement>();

const handleMenuOpen = (e: MouseEvent) => {
  e.preventDefault();
  visible.value = true;
  menuX.value = e.clientX;
  menuY.value = e.clientY;
};
const handleClick = async () => {
  visible.value = false;
};
const handleClickOutside = () => {
  visible.value = false;
};

onMounted(() => {
  window.addEventListener("contextmenu", handleMenuOpen);
  onClickOutside(r__right_menu, handleClickOutside);
});
onUnmounted(() => {
  window.removeEventListener("contextmenu", handleMenuOpen);
});
</script>
<style lang="less" scoped>
.c__right_menu {
  position: fixed;
  border-radius: 8px;
  border: 1px solid #0001;
  overflow: hidden;
}
.menu {
  width: 160px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  cursor: pointer;
  //
  &:hover {
    background: #0001;
  }
}
</style>
