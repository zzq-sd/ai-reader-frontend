<template>
  <nav class="tabs">
    <div
      v-for="tab in tabs"
      :key="tab.route"
      class="tab"
      :class="{ 'active': isActiveTab(tab.route) }"
      @click="handleTabClick(tab.route)"
    >
      {{ tab.title }}
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNavigationStore } from '@/stores/navigation'

// 路由相关
const router = useRouter()
const route = useRoute()
const navigationStore = useNavigationStore()

// 标签配置
const tabs = [
  { title: '仪表盘', route: 'dashboard' },
  { title: '文章', route: 'articles' },
  { title: '笔记', route: 'notes' },
  { title: '收藏', route: 'collections' }
]

// 计算属性
const currentRoute = computed(() => {
  return route.name as string || navigationStore.activeRoute
})

// 方法
function isActiveTab(tabRoute: string): boolean {
  return currentRoute.value === tabRoute
}

function handleTabClick(tabRoute: string) {
  // 更新导航状态
  navigationStore.setActiveRoute(tabRoute)
  
  // 路由跳转
  if (route.name !== tabRoute) {
    router.push({ name: tabRoute })
  }
}
</script>

<style lang="scss" scoped>
.tabs {
  display: flex;
  align-items: center;
  gap: spacing(1);
}

.tab {
  position: relative;
  padding: spacing(1.5) spacing(3);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-m);
  transition: color var(--transition-speed-fast), background-color var(--transition-speed-fast);
  user-select: none;
  
  &:hover {
    color: var(--color-text-primary);
    background-color: var(--color-bg-hover);
  }
  
  &.active {
    color: var(--color-text-primary);
    background-color: var(--color-bg-active);
  }
}
</style> 