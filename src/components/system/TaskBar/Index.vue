<template>
  <div class="c__task_bar">
    <div class="container">
        <div class="start" @click="toggleStart" ref="startButton">
          <img src="./assets//start.svg" alt="" />
        </div>

        <!-- Start menu -->
        <div v-if="showStart" class="start_menu" ref="startMenu" @click.stop>
          <div class="start_header">
            <input class="search" v-model="search" placeholder="搜索应用..." />
          </div>
          <div class="apps_grid">
            <div class="app_item" v-for="app in filteredApps" :key="app.title" @click="openApp(app)">
              <div class="app_icon"><img :src="getIconUrl(app.icon)" alt="" /></div>
              <div class="app_title">{{ app.title }}</div>
            </div>
          </div>
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
import { Task, App } from "@/system";
import { apps } from "@/apps/config";

const iconBase = `${import.meta.env.BASE_URL}icon/`;

const getIconUrl = (icon?: string) => `${iconBase}${icon ?? ""}`;

const getIcon = (task: System.ITask) => {
  const title = task.title;
  const icon = apps.find((app) => app.title === title);
  return getIconUrl(icon?.icon);
};

// Start menu state
const showStart = ref(false);
const search = ref("");
const startMenu = ref<HTMLElement | null>(null);
const startButton = ref<HTMLElement | null>(null);

const filteredApps = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return apps;
  return apps.filter((a) => a.title.toLowerCase().includes(q));
});

const toggleStart = () => {
  showStart.value = !showStart.value;
};

const openApp = (app: System.IApp) => {
  App.open(app);
  showStart.value = false;
};

const onDocClick = (e: MouseEvent) => {
  const t = e.target as Node | null;
  if (!showStart.value) return;
  if (startMenu.value && startMenu.value.contains(t)) return;
  if (startButton.value && startButton.value.contains(t)) return;
  showStart.value = false;
};

onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
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

/* Start menu styles */
.start_menu {
  position: absolute;
  left: 0;
  bottom: @size;
  width: 420px;
  max-width: 70vw;
  background: linear-gradient(180deg, #ffffff, #f3f6fb);
  border-radius: 12px 12px 8px 8px;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.35);
  padding: 12px;
  z-index: 110;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.start_header {
  display: flex;
  padding: 6px;
}
.search {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px 10px;
  border-radius: 8px;
  background: #eef5ff;
  font-size: 14px;
}

.apps_grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.app_item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: 0.15s;
  text-align: center;
}
.app_item:hover { background: #ffffffcc; transform: translateY(-2px); }
.app_icon img { width: 40px; height: 40px; object-fit: contain; }
.app_title { font-size: 12px; color: #111827; }

.start_footer { display:flex; justify-content:space-between; padding: 6px 8px; font-size:13px; color:#374151; }

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
