import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import VueDevTools from "vite-plugin-vue-devtools";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE_PATH || (command === "build" ? "/windows_ui/" : "/");

  return {
    server: {
      port: 1999,
    },
    base,
    plugins: [
      vue({
        script: {
          propsDestructure: true,
        },
      }),
      vueJsx(),
      AutoImport({
        imports: ["vue", "vue-router", "@vueuse/core"],
        dts: "auto-imports.d.ts",
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        directoryAsNamespace: true,
        resolvers: [ElementPlusResolver()],
      }),
      VueDevTools(),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
