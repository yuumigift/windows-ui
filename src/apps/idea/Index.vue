<template>
  <head-menu></head-menu>
  <div style="display: flex;justify-content: center;align-items: center;">
    <content style="height: 50%"></content>
  </div>
</template>
<script lang="ts" setup>
import HeadMenu from "@/apps/idea/components/HeadMenu.vue";
import Content from "@/apps/idea/components/Content.vue";
</script>
<style scoped lang="less">
div {
  height: 150vh;
  background-color: #2b2d30;
}

content {
  height: 100%;
  flex-grow: 1;
}
</style>