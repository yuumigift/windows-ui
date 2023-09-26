<template>
  <div class="c__task_bar">
    <div class="container">
      <div class="start">
        <img src="./assets//start.svg" alt="" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style lang="less" scoped>
.c__task_bar {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 100;
  background: #fff6;
  width: 100vw;
  height: 50px;
  backdrop-filter: blur(5px);
}
.start {
  display: grid;
  align-items: center;
  justify-items: center;
  transition: 0.2s;
  cursor: pointer;
  width: 50px;
  height: 50px;

  &:hover {
    background: #fff2;
  }
  & > img {
    width: 70%;
    height: 70%;
  }
}
</style>
