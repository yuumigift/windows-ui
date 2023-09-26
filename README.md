# windows-ui

本项目基于 Vue3+ts 开发，模仿 Windows 界面，将原本的路由模式，改为桌面的应用程序模式，每个应用程序都可以最大化、最小化、关闭，窗口拖动等。

在 apps 文件夹下的.vue 文件，可自动识别为应用程序，在桌面配置好应用程序信息，即可通过点击桌面图标打开

```js
// 应用程序配置示例
{
    title: "测试程序",
    vuePath: "MyTest/Index.vue",
    icon: "garden.png",
}
```

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```
