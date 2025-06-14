<template>
  <aside 
    class="app-sidebar"
    :class="{ 'collapsed': uiStore.sidebarCollapsed }"
  >
    <!-- 侧边栏头部 -->
    <div class="sidebar-header">
      <div class="logo-section">
        <i class="fas fa-book-reader logo-icon"></i>
        <span class="logo-text" v-show="!uiStore.sidebarCollapsed">AI阅读器</span>
      </div>
    </div>

    <!-- 导航内容 -->
    <nav class="sidebar-nav" :key="forceUpdateKey">
      <div 
        v-for="(section, index) in sidebarSections" 
        :key="section.title + '-' + forceUpdateKey"
        class="nav-section"
      >
        <!-- 分组标题 -->
        <div 
          class="section-title" 
          v-show="!uiStore.sidebarCollapsed"
        >
          {{ section.title }}
        </div>
        
        <!-- 导航项列表 -->
        <ul class="nav-list">
          <SidebarItem
            v-for="item in section.items"
            :key="item.id + '-' + forceUpdateKey"
            :item="item"
            :collapsed="uiStore.sidebarCollapsed"
            @click="handleNavClick"
          />
        </ul>
      </div>
    </nav>

    <!-- 侧边栏底部 -->
    <div class="sidebar-footer">
      <!-- 底部内容已删除 -->
    </div>
  </aside>
</template>

<script setup>
import { onMounted, watch, computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useNavigationStore } from '@/stores/navigation'
import { useAuthStore } from '@/stores/auth'
import SidebarItem from '@/components/navigation/SidebarItem.vue'

// 状态管理
const uiStore = useUIStore()
const navigationStore = useNavigationStore()
const authStore = useAuthStore()
const router = useRouter()

// 强制重新渲染的key
const forceUpdateKey = ref(0)

// 使用computed确保响应式更新
const sidebarSections = computed(() => {
  // 添加forceUpdateKey作为依赖，确保能强制更新
  const key = forceUpdateKey.value
  console.log('🔧 Sidebar: Computing sidebar sections, count:', navigationStore.sidebarSections.length, 'key:', key)
  return navigationStore.sidebarSections
})

// 强制更新方法
const forceUpdate = async () => {
  forceUpdateKey.value++
  await nextTick()
  console.log('🔧 Sidebar: Forced update completed, key:', forceUpdateKey.value)
}

// 处理导航点击
const handleNavClick = (item) => {
  if (item.route) {
    router.push(item.route)
    navigationStore.setActiveRoute(item.route)
    
    // 移动端点击导航后收起侧边栏
    if (window.innerWidth <= 768) {
      uiStore.setSidebarCollapsed(true)
    }
  }
}

// 组件挂载时加载导航数据
onMounted(() => {
  console.log('🔧 Sidebar: Component mounted')
  console.log('🔧 Sidebar: Auth store isLoggedIn:', authStore.isLoggedIn)
  console.log('🔧 Sidebar: Current user:', authStore.currentUser)
  
  // 确保加载导航数据
  navigationStore.loadNavigationData()
  
  // 检查加载后的状态
  setTimeout(() => {
    console.log('🔧 Sidebar: After initial load - sections:', navigationStore.sidebarSections.length)
  }, 50)
})

// 监听登录状态变化，重新加载导航数据
watch(() => authStore.isLoggedIn, async (newValue) => {
  if (newValue) {
    console.log('🔧 Sidebar: User logged in, reloading navigation')
    // 用户登录后重新加载导航数据，以显示管理员菜单（如果有权限）
    navigationStore.loadNavigationData()
    
    // 强制组件重新渲染
    setTimeout(async () => {
      console.log('🔧 Sidebar: Current sections count:', navigationStore.sidebarSections.length)
      console.log('🔧 Sidebar: Sections:', navigationStore.sidebarSections)
      
      // 强制Vue重新渲染组件
      if (navigationStore.sidebarSections.length > 0) {
        console.log('🔧 Sidebar: Forcing component update')
        await forceUpdate()
      }
    }, 200)
  }
}, { immediate: false })

// 监听用户变化，重新加载导航数据
watch(() => authStore.currentUser?.username, async (newUsername) => {
  if (newUsername) {
    console.log('🔧 Sidebar: User username changed:', newUsername)
    // 用户变化后重新加载导航数据
    navigationStore.loadNavigationData()
    await nextTick()
    await forceUpdate()
  }
}, { immediate: false })

// 监听导航sections变化
watch(() => navigationStore.sidebarSections, async (newSections) => {
  console.log('🔧 Sidebar: Navigation sections updated:', newSections.length, 'sections')
  newSections.forEach((section, index) => {
    console.log(`🔧 Sidebar: Section ${index}:`, section.title, 'with', section.items.length, 'items')
  })
  
  // 强制更新UI
  await forceUpdate()
}, { immediate: true, deep: true })
</script>

<style lang="scss" scoped>
.app-sidebar {
  grid-area: sidebar;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-duration) var(--transition-timing);
  overflow: hidden;
  position: relative;
  z-index: 100;

  &.collapsed {
    width: var(--sidebar-collapsed-width);
  }

  // 移动端样式
  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    width: var(--sidebar-width);
    transform: translateX(-100%);
    transition: transform var(--transition-duration) var(--transition-timing);
    box-shadow: var(--shadow-lg);
    z-index: 1000;

    &:not(.collapsed) {
      transform: translateX(0);
    }
  }
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;

  .logo-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .logo-icon {
      font-size: 1.5rem;
      color: var(--color-accent-primary);
      flex-shrink: 0;
    }

    .logo-text {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
    }
  }
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }
}

.nav-section {
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  padding: 0 1rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  justify-content: center;

  .collapsed & {
    flex-direction: column;
    align-items: center;
  }
}

// 动画效果
.sidebar-nav {
  .nav-section {
    animation: slideInLeft 0.3s ease-out;
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 悬浮效果
.sidebar-footer {
  :deep(.icon-button) {
    transition: all var(--transition-duration) var(--transition-timing);

    &:hover {
      background: var(--hover-bg);
      transform: translateY(-1px);
    }
  }
}
</style> 