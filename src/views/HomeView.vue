<template>
  <div id="desktop" class="c__desktop">
    <div class="background"></div>
    <div class="title">
      <span>Windows UI</span>
    </div>
    <TaskBar></TaskBar>
    <Window title="Yuumi App"></Window>
  </div>
</template>
<script setup lang="ts">
import TaskBar from "@/components/system/TaskBar/Index.vue";
import Window from "@/components/system/Window/Index.vue";
</script>
<style lang="less" scoped>
.c__desktop {
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
