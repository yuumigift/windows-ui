<template>
  <div id="desktop" class="c__desktop" @contextmenu.prevent="handleContextMenu" @click="hideContextMenu">
    <div class="background"></div>
    <div class="title">
      <span>Windows UI</span>
    </div>
    <div class="desk">
      <SystemTaskIcon v-for="(app, index) in App.list" :key="index" :icon="app.icon" :title="app.title" @click="App.open(app)"></SystemTaskIcon>
    </div>
    <SystemWindow
      v-for="task in Task.list"
      :key="task.id"
      :title="task.title"
      :is-active="task.isActive"
      :is-minimize="task.isMinimize"
      :width="task.width"
      :height="task.height"
      @active="Task.handleActive(task)"
      @close="Task.handleClose(task)"
      @minimize="Task.handleMinimize(task)"
    >
      <component :is="task.render" :key="task.id"></component>
    </SystemWindow>
    <SystemTaskBar></SystemTaskBar>

    <SystemContextMenu ref="contextMenu" @menu-click="handleMenuClick" />
  </div>
</template>

<script setup lang="ts">
import { Task, App } from "@/system";

import { useTemplateRef } from "vue";


const contextMenu = useTemplateRef("contextMenu");

const handleContextMenu = (event: MouseEvent) => {
  // 阻止在窗口和图标上显示右键菜单
  const target = event.target as HTMLElement;
  if (target.closest(".c__window") || target.closest(".task-icon")) {
    return;
  }

  contextMenu.value?.show(event.clientX, event.clientY);
};

const hideContextMenu = () => {
  contextMenu.value?.hide();
};

const handleMenuClick = (action: string) => {
  console.log("菜单点击:", action);

  switch (action) {
    case "refresh":
      // 刷新桌面
      console.log("刷新桌面");
      break;
    case "paste":
      // 粘贴操作
      console.log("粘贴");
      break;
    case "new":
      // 新建操作
      console.log("新建");
      break;
    case "display-settings":
      // 显示设置
      console.log("打开显示设置");
      break;
    case "personalize":
      // 个性化
      console.log("打开个性化设置");
      break;
    default:
      console.log("未实现的菜单项:", action);
  }
};
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
  color: #fff6;
  font-size: 100px;
  inset: 0;
}
.background {
  position: absolute;
  background: radial-gradient(#2e4055, #151d27);
  inset: 0;
}
.desk {
  position: absolute;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
  z-index: 10;
  inset: 0;
}
</style>
