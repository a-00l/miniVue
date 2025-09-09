// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true, // 启用全局模式
    environment: 'jsdom', // 根据需要设置环境（如浏览器环境用 jsdom）
  },
})