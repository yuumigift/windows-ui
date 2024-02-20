<template>
  <div class="c__task_bar">
    <div class="container">
      <div class="start">
        <img src="./assets//start.svg" alt="" />
      </div>
    </div>
    <div class="task" v-for="task in Task.list" :key="task.id" :class="{ is_active: task.isActive }" @click="Task.handleActive(task)">
      <div class="task--icon">
        <img :src="getIcon(task)" alt="" />
      </div>
      <div class="task--title">{{ task.title }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { System } from "@/types";
import { Task } from "@/system";
import { apps } from "@/apps/config";

const getIcon = (task: System.ITask) => {
  const title = task.title;
  const icon = apps.find((app) => app.title === title);
  return `/icon/${icon?.icon}`;
};
</script>

<style lang="less" scoped>
@size: 40px;
.c__task_bar {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 100;
  background: #0004;
  width: 100vw;
  height: @size;
  backdrop-filter: blur(5px);
}
.start {
  display: grid;
  align-items: center;
  justify-items: center;
  transition: 0.2s;
  cursor: pointer;
  width: @size;
  height: @size;

  &:hover {
    background: #fff2;
  }
  & > img {
    width: 50%;
    height: 50%;
  }
}
.task {
  flex: 1 1 auto;
  max-width: 200px;
  display: flex;
  align-items: center;
  height: @size;
  padding: 0 0.5em;
  border-bottom: solid 3px #fac;
  cursor: default;

  &:hover {
    background: #fff3;
  }
  &.is_active {
    background: #fff6;

    &:hover {
      background: #fff8;
    }
  }
  &--icon {
    flex: 0 0 @size;
    height: @size;
    display: grid;
    align-items: center;
    justify-items: center;

    & > img {
      width: 50%;
      height: 50%;
    }
  }
  &--title {
    padding-left: 0.5em;
    color: #fff;
    text-shadow: 1px 1px 2px #0009;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
