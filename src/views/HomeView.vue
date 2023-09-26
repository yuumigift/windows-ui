<template>
  <div id="desktop" class="c__desktop">
    <div class="background"></div>
    <div class="title">
      <span>Windows UI</span>
    </div>
    <div class="desk">
      <TaskIcon v-for="(app, index) in App.list" :key="index" :icon="`/icon/${app.icon}`" :title="app.title" @click="App.open(app)"></TaskIcon>
    </div>

    <Window v-for="task in Task.list" :key="task.id" :title="task.title" :is-active="task.isActive" @active="Task.handleActive(task)" @close="Task.handleClose(task)">
      <component :is="task.render" :key="task.id"></component>
    </Window>
    <TaskBar></TaskBar>
  </div>
</template>
<script setup lang="ts">
import TaskBar from "@/components/system/TaskBar/Index.vue";
import TaskIcon from "@/components/system/TaskIcon/Index.vue";
import Window from "@/components/system/Window/Index.vue";
import { apps } from "@/system";
import { reactive } from "vue";

interface IApp {
  title: string;
  vuePath: string;
  icon: string;
}

interface ITask {
  id: number;
  title: string;
  render: any;
  isActive: boolean;
}

const appModules = import.meta.glob("@/apps/**/*.vue");

const App = reactive({
  list: apps as IApp[],

  async open(app: IApp) {
    const getModule = (path?: string) => {
      const globs = Object.keys(appModules);
      const glob = globs.find((g) => g.includes(path ?? "--"));
      return appModules[glob ?? ""];
    };
    const module = getModule(app.vuePath);
    const render: any = await module();
    Task.list.push({
      id: Math.floor(Math.random() * 1e10),
      title: app.title,
      render: render.default,
      isActive: true,
    });
  },
});

const Task = reactive({
  list: [] as ITask[],

  handleActive(task: ITask) {
    Task.list.forEach((task) => {
      task.isActive = false;
    });
    const foundTask = Task.list.find((item) => item.id === task.id);
    if (foundTask) {
      foundTask.isActive = true;
    }
  },
  handleClose(task: ITask) {
    Task.list = Task.list.filter((item) => item.id !== task.id);
    Task.setDefaultActive();
  },
  setDefaultActive() {
    const foundTask = Task.list.find((item) => item.isActive);
    if (!foundTask && Task.list.length) {
      Task.list[Task.list.length - 1].isActive = true;
    }
  },
});
</script>
<style lang="less" scoped>
.c__desktop {
  display: grid;
  position: fixed;
  inset: 0;
}
.title {
  display: grid;
  position: absolute;
  align-items: center;
  justify-items: center;
  text-shadow: 2px 2px 4px #0006;
  color: #fff9;
  font-size: 100px;
  inset: 0;
}
.background {
  position: absolute;
  background: linear-gradient(135deg, #327aff, #250047);
  inset: 0;
}
.desk {
  position: absolute;
  z-index: 10;
  inset: 0;
}
</style>
