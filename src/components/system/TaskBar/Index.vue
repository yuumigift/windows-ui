<template>
  <div class="c__task_bar">
    <div class="container">
      <div class="start">
        <img src="./assets//start.svg" alt="" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="less" scoped>
.c__task_bar {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100vw;
  height: 50px;
  backdrop-filter: blur(5px);
  z-index: 100;
  display: flex;
  background: #fff6;
}
.start {
  width: 50px;
  height: 50px;
  display: grid;
  align-items: center;
  justify-items: center;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background: #fff2;
  }
  & > img {
    width: 70%;
    height: 70%;
  }
}
</style>
