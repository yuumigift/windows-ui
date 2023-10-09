<template>
  <div class="c__task_icon">
    <div class="icon">
      <img :src="`/icon/${icon}`" alt="" />
    </div>
    <div class="title">{{ title }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  icon: {
    default: "",
  },
  title: {
    default: "",
  },
});
</script>

<style lang="less" scoped>
.c__task_icon {
  transition: 0.2s;
  margin: 8px;
  border: 1px solid #0000;
  border-radius: 8px;
  cursor: pointer;
  padding: 10px;
  width: 80px;
  overflow: hidden;

  &:hover {
    background: #0002;
    border: 1px solid #0004;
  }
}
.icon {
  margin: 0 auto;
  width: 50px;
  height: 50px;
}
.title {
  display: -webkit-box;
  margin-top: 8px;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  color: #f1f1f1;
  font-size: 14px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
