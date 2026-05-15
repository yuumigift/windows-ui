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
- Vite 生产环境默认 `base` 是 `/windows_ui/`，只有设置 `VITE_BASE_PATH` 才会覆盖；凡是拼资源路径、路由基地址或部署相关代码，都要先看 `vite.config.ts`，不要默认以 `/` 为根。

## 运行与调试
- 本地开发：`pnpm dev`，Vite dev server 固定在 `http://localhost:1999`（见 `vite.config.ts`）。
- 生产构建前会先做类型检查：`pnpm build` 实际执行 `vue-tsc --build --force` + `vite build`。
- 仓库没有统一的 `test` 脚本；默认验证方式是对受影响切片做 `pnpm build`、必要时手动打开对应 app 或系统壳路径验证行为。
- `Snowball` 需要单独启动 websocket 服务：`pnpm snowball-server`；前端默认连接 `ws://localhost:3001/ws`（见 `src/apps/Snowball/client/ws.ts`）。
- 只有 `Snowball` 带内置服务端；其余 app 主要是纯前端/canvas/Three.js 逻辑，排查问题时先看各自目录，不要假设存在共享后端。
- 这个仓库固定使用 `pnpm@11.1.2`；安装或运行前如果遇到 `ERR_PNPM_IGNORED_BUILDS`，要检查工作区级 build-script 审批，当前至少需要允许 `core-js` 和 `vue-demi`。

## 常见陷阱
- `src/apps/` 下的组件文件名大小写并不统一，既有 `Index.vue` 也有 `index.vue`；`src/apps/config.ts` 里的 `vuePath` 必须和真实路径/大小写完全一致，不能想当然“顺手统一”。
- `App.open()`（`src/system.ts`）是通过 `import.meta.glob("@/apps/**/*.vue")` 和 `vuePath` 做字符串匹配加载组件；一旦路径大小写或目录名写错，运行时才会报“未找到应用组件”。
- 任务栏图标在 `src/components/system/TaskBar/Index.vue` 里是按 `task.title` 去 `src/apps/config.ts` 反查的；如果两个 app 共用同一个标题，任务栏图标映射会失真。
- 图标资源统一来自 `public/icon/`，系统层通过 `import.meta.env.BASE_URL + "icon/"` 拼接路径；新增 app 时不要把任务栏或桌面图标放进 `src/assets/`。

## 修改时优先遵循的原则
- 新增桌面应用时，最小闭环通常是：新增 `src/apps/<Name>/Index.vue` → 补充所需资源/类 → 在 `src/apps/config.ts` 注册 → 在 `public/icon/` 放图标。
- 改系统行为时，优先搜索 `src/system.ts`、`src/views/HomeView.vue` 和 `src/components/system/`；改某个游戏玩法时，优先搜索该 app 自己的目录。
- 文档、注释和提交内容应明确指出影响的是“系统壳层”还是具体 app，避免把多款小游戏的逻辑混为一谈。
- 需要查项目概览、安装或公开说明时，优先链接 `README.md`，不要把 README 里的安装步骤整段复制进说明文件。
