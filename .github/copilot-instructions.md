# Copilot instructions for `windows-ui`

## 项目定位
- 这是一个基于 Vue 3 + TypeScript + Vite 的“Windows 桌面壳”，真正的入口在 `src/views/HomeView.vue`，不是多页面路由应用。
- 顶层路由只有 `/`（见 `src/router/index.ts`），桌面上的“应用”由 `src/system.ts` 动态加载并作为窗口实例管理。
- 新功能优先判断应该放在“系统壳层”还是某个 app 子目录：系统壳层负责桌面、窗口、任务栏；游戏/工具逻辑通常独立放在 `src/apps/<AppName>/`。

## 关键架构与数据流
- 应用清单定义在 `src/apps/config.ts`。桌面图标、窗口标题、任务栏图标都依赖这里的 `title`、`vuePath`、`icon`。
- `App.open()`（`src/system.ts`）通过 `import.meta.glob("@/apps/**/*.vue")` 按 `vuePath` 查找组件；修改或新增 app 时，`vuePath` 必须与实际文件路径/大小写一致。
- `Task.list`（`src/system.ts`）是全局响应式窗口状态：激活、最小化、关闭逻辑都集中在这里；不要在各个窗口组件里复制一套状态管理。
- `HomeView.vue` 负责把 `App.list` 渲染成桌面图标，把 `Task.list` 渲染成 `SystemWindow` 实例；任务切换要沿着这个数据流改，而不是直接操作 DOM。

## 系统层约定
- 系统组件位于 `src/components/system/`，例如 `Window/Index.vue`、`TaskBar/Index.vue`、`TaskIcon/Index.vue`、`ContextMenu/Index.vue`。
- 窗口组件依赖事件回传（`active` / `close` / `minimize`）驱动全局状态；扩展窗口行为时，优先补充 `src/system.ts`，其次再改 `SystemWindow`。
- 图标资源来自 `public/icon/`，`TaskBar` 与桌面图标都按 `/icon/${icon}` 取图；新增 app 时别把图标放进 `src/assets/`。

## app 目录模式
- 大多数 app 是独立的小项目，允许各自维护 `classes/`、`common.ts`、`types.ts`、`assets/` 等结构；不要强行把它们揉成统一抽象。
- 典型模式是“薄 Vue 壳 + 类驱动引擎”：例如 `src/apps/AdventureYuumi/Index.vue`、`src/apps/Snowball/Index.vue`、`src/apps/Minecraft/Index.vue` 只负责挂载 canvas/DOM，核心循环在 `classes/` 或 `world/` 下。
- 这类 app 往往在 `onMounted`/`onBeforeUnmount` 中启动和销毁引擎；新增可长期运行的循环、事件监听或 socket 时，要像 `Snowball` 一样补清理逻辑。

## 框架与编码习惯
- 项目广泛使用 `<script setup lang="ts">` 和 `lang="less" scoped`。
- Vue、Vue Router、VueUse API 通过 `unplugin-auto-import` 自动导入（见 `vite.config.ts` 与 `auto-imports.d.ts`）；看到 `ref`、`onMounted`、`useTemplateRef` 未显式 import 时，通常是刻意如此。
- 组件通过 `unplugin-vue-components` 自动注册；`components.d.ts` 和 `auto-imports.d.ts` 是生成文件，不要手改。
- 路径别名统一用 `@` 指向 `src/`；保持现有别名风格，不要混入大量相对跨目录导入。

## 运行与调试
- 本地开发：`pnpm dev`，Vite dev server 固定在 `http://localhost:1999`（见 `vite.config.ts`）。
- 生产构建前会先做类型检查：`pnpm build` 实际执行 `vue-tsc --build --force` + `vite build`。
- `Snowball` 需要单独启动 websocket 服务：`pnpm snowball-server`；前端默认连接 `ws://localhost:3001/ws`（见 `src/apps/Snowball/client/ws.ts`）。
- 只有 `Snowball` 带内置服务端；其余 app 主要是纯前端/canvas/Three.js 逻辑，排查问题时先看各自目录，不要假设存在共享后端。

## 修改时优先遵循的原则
- 新增桌面应用时，最小闭环通常是：新增 `src/apps/<Name>/Index.vue` → 补充所需资源/类 → 在 `src/apps/config.ts` 注册 → 在 `public/icon/` 放图标。
- 改系统行为时，优先搜索 `src/system.ts`、`src/views/HomeView.vue` 和 `src/components/system/`；改某个游戏玩法时，优先搜索该 app 自己的目录。
- 文档、注释和提交内容应明确指出影响的是“系统壳层”还是具体 app，避免把多款小游戏的逻辑混为一谈。
