<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, ref, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

// 初始化认证状态
const authStore = useAuthStore()

// stagewise配置
const stagewiseConfig = {
  plugins: []
}

// stagewise工具栏组件（仅开发环境）
const showStagewise = ref(import.meta.env.DEV)

onMounted(() => {
  // 应用启动时初始化认证状态
  authStore.initializeAuth()
})
</script>

<template>
  <RouterView />
  
  <!-- stagewise工具栏 - 仅开发环境 -->
  <div v-if="showStagewise" id="stagewise-toolbar-container"></div>
</template>

<script lang="ts">
// 在开发模式下动态加载stagewise工具栏
if (import.meta.env.DEV) {
  import('@stagewise/toolbar-vue').then(({ StagewiseToolbar }) => {
    import('vue').then(({ createApp }) => {
      const container = document.getElementById('stagewise-toolbar-container')
      if (container) {
        const stagewiseApp = createApp(StagewiseToolbar, {
          config: {
            plugins: []
          }
        })
        stagewiseApp.mount(container)
      }
    })
  }).catch(() => {
    console.warn('Stagewise toolbar could not be loaded')
  })
}
</script>

<style lang="scss">
// 全局样式应该在 main.ts 中导入，这里不需要额外样式
</style>
