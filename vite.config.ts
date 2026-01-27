import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import Inspector from 'vite-plugin-vue-inspector'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    Inspector({
      toggleButtonVisibility: 'active',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173,
    host: true,
    // 代理配置，用于开发环境
    proxy: {
      '/api': {
        target: 'http://192.168.100.86:8002',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
