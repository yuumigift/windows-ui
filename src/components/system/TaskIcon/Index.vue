<template>
  <div class="c__task_icon">
    <div class="icon">
      <img :src="icon" alt="" />
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
  width: 80px;
  padding: 10px;
  cursor: pointer;
  border: 1px solid #0000;
  margin: 8px;
  border-radius: 8px;
  overflow: hidden;
  transition: 0.2s;

  &:hover {
    background: #0002;
    border: 1px solid #0004;
  }
}
.icon {
  width: 50px;
  height: 50px;
  margin: 0 auto;
}
.title {
  color: #f1f1f1;
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-align: center;
  font-size: 14px;
}
</style>
