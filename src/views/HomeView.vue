<template>
  <div class="page">
    <div class="background"></div>
    <div class="title">
      <span>Windows UI</span>
    </div>
  </div>
</template>
<style lang="less" scoped>
.page {
  position: fixed;
  display: grid;
  inset: 0;
}
.title {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  display: grid;
  align-items: center;
  justify-items: center;
  font-size: 100px;
  background: linear-gradient(to right, #fff, #ed6af1);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  z-index: 10;
  text-shadow: 2px 2px 5px #0006;
}
.background {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  background: linear-gradient(135deg, #327aff, #250047);
}
</style>
