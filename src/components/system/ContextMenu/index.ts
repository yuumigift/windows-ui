import type { ContextMenuItem } from "./types";
export type { ContextMenuItem } from "./types";
export const vContextMenu = (el: HTMLElement, binding: { value: ContextMenuItem[] }) => {
  el.addEventListener("contextmenu", async (e) => {
    e.preventDefault();

    // 构建菜单组件实例
    const menuModule = await import("./ContextMenu.vue");
    const menuComponent = h(menuModule.default, {
      menu: binding.value,
      x: e.clientX,
      y: e.clientY,
      onCloseMenu() {
        app.unmount();
        container.remove();
      },
    });
    const app = createApp({
      render: () => menuComponent,
    });

    // 渲染
    const contextMenuElement = document.querySelector(".context-menu-container");
    contextMenuElement && contextMenuElement.remove();
    const container = document.createElement("div");
    container.className = "context-menu-container";
    document.body.appendChild(container);
    app.mount(container);
  });
};
