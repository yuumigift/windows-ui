<template>
  <div class="page">
    <div class="background"></div>
    <div class="title">
      <span>Windows UI</span>
    </div>
  </div>
  <TaskBar></TaskBar>
</template>
<script setup lang="ts">
import TaskBar from "@/components/system/TaskBar/Index.vue";
</script>
<style lang="less" scoped>
.page {
  position: relative;
  position: fixed;
  display: grid;
  inset: 0;
}
.title {
  position: absolute;
  inset: 0;
  display: grid;
  align-items: center;
  justify-items: center;
  font-size: 100px;
  color: #fff9;
  text-shadow: 2px 2px 4px #0006;
}
.background {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #327aff, #250047);
}
</style>
