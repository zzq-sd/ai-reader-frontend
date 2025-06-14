import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // 确保Font Awesome字体文件能够正确被处理
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot'],
  // 构建配置
  build: {
    rollupOptions: {
      external: (id) => {
        // 在生产环境中排除stagewise包
        if (process.env.NODE_ENV === 'production' && id.includes('@stagewise')) {
          return true
        }
        return false
      }
    }
  },
  // 开发服务器配置
  server: {
    port: 3000,
    fs: {
      // 允许访问node_modules中的字体文件
      allow: ['..', 'node_modules/@fortawesome']
    },
    // API代理配置
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1')
      }
    }
  }
})
