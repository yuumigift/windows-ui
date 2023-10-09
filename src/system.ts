import type { System } from "@/types";
import { apps } from "@/apps/config";
import { reactive } from "vue";

export const Task = reactive({
  list: [] as System.ITask[],

  handleActive(task: System.ITask) {
    Task.list.forEach((task) => {
      task.isActive = false;
    });
    const foundTask = Task.list.find((item) => item.id === task.id);
    if (foundTask) {
      foundTask.isActive = true;
    }
  },
  handleClose(task: System.ITask) {
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

const appModules = import.meta.glob("@/apps/**/*.vue");
export const App = reactive({
  list: apps as System.IApp[],

  async open(app: System.IApp) {
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
