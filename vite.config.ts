import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import ViteAutoImport from "unplugin-auto-import/vite";
import VueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 1999,
  },
  base: "",
  plugins: [
    vue({
      script: {
        propsDestructure: true,
      },
    }),
    vueJsx(),
    ViteAutoImport({
      imports:["vue","vue-router"],
      dts:"auto-imports.d.ts"
    }),
    VueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
