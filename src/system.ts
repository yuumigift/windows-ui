import type { System } from "@/types";
import { apps } from "@/apps/config";
import { markRaw, reactive } from "vue";

export const Task = reactive({
  list: [] as System.ITask[],

  handleActive(task: System.ITask) {
    Task.list.forEach((task) => {
      task.isActive = false;
    });
    const foundTask = Task.list.find((item) => item.id === task.id);
    if (foundTask) {
      foundTask.isActive = true;
      foundTask.isMinimize = false;
    }
  },
  handleClose(task: System.ITask) {
    Task.list = Task.list.filter((item) => item.id !== task.id);
    Task.setDefaultActive();
  },
  handleMinimize(task: System.ITask) {
    task.isMinimize = true;
    task.isActive = false;
    Task.setDefaultActive();
  },
  setDefaultActive() {
    const foundTask = Task.list.find((item) => item.isActive);
    const showedTask = Task.list.filter((item) => !item.isMinimize);
    if (!foundTask && showedTask.length) {
      Task.handleActive.call(null, showedTask[showedTask.length - 1]);
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
    Task.list = Task.list.map((task) => ({ ...task, isActive: false }));
    Task.list.push({
      id: Math.floor(Math.random() * 1e10),
      title: app.title,
      render: markRaw(render.default),
      isActive: true,
      isMinimize: false,
    });
  },
});
