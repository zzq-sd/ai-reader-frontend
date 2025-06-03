<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-left">
        <div class="logo">
          <AppIcon :icon="ICONS.BRAND.LOGO" :size="ICON_SIZES.LG" :color="ICON_COLORS.ACCENT" />
          AI阅读器
        </div>
        
        <!-- 标签导航 -->
        <div class="tabs">
          <router-link to="/articles" class="tab" :class="{ active: isTabActive('articles') }">
            文章
          </router-link>
          <router-link to="/notes" class="tab" :class="{ active: isTabActive('notes') }">
            笔记
          </router-link>
          <router-link to="/collections" class="tab" :class="{ active: isTabActive('collections') }">
            收藏
          </router-link>
          <router-link to="/knowledge-graph" class="tab" :class="{ active: isTabActive('knowledge-graph') }">
            知识图谱
          </router-link>
        </div>
      </div>
      
      <div class="header-right">
        <!-- 用户头像 -->
        <div class="icon-btn user-avatar-btn" @click="uiStore.toggleUserPopover" title="用户资料">
          <span>{{ authStore.userInitials }}</span>
        </div>
        
        <!-- 通知下拉菜单 -->
        <transition name="dropdown">
          <div v-if="showNotifications" class="notifications-popover" @click.stop>
            <div class="popover-header">
              <h3>通知中心</h3>
              <button class="mark-all-read" @click="markAllAsRead">
                <AppIcon icon="fas fa-check-double" :size="ICON_SIZES.SM" />
                全部已读
              </button>
            </div>
            <div class="notifications-list">
              <div v-for="notification in notifications" :key="notification.id" class="notification-item" :class="{ unread: !notification.read }">
                <div class="notification-icon">
                  <AppIcon :icon="notification.icon" :size="ICON_SIZES.SM" />
                </div>
                <div class="notification-content">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-time">{{ formatTime(notification.time) }}</div>
                </div>
              </div>
            </div>
            <div class="popover-footer">
              <router-link to="/notifications" @click="showNotifications = false">
                查看全部通知
              </router-link>
            </div>
          </div>
        </transition>
        
        <!-- 新增内容对话框 -->
        <transition name="modal">
          <div v-if="showAddDialog" class="modal-overlay" @click="showAddDialog = false">
            <div class="add-dialog" @click.stop>
              <div class="dialog-header">
                <h3>新增内容</h3>
                <button class="close-btn" @click="showAddDialog = false">
                  <AppIcon :icon="ICONS.ACTION.CLOSE" :size="ICON_SIZES.SM" />
                </button>
              </div>
              <div class="dialog-content">
                <div class="add-options">
                  <router-link to="/rss-management" class="add-option" @click="showAddDialog = false">
                    <AppIcon :icon="ICONS.SIDEBAR.RSS_MANAGEMENT" :size="ICON_SIZES.LG" />
                    <span>添加 RSS 源</span>
                  </router-link>
                  <router-link to="/notes" class="add-option" @click="showAddDialog = false">
                    <AppIcon :icon="ICONS.SIDEBAR.NOTES" :size="ICON_SIZES.LG" />
                    <span>创建笔记</span>
                  </router-link>
                  <router-link to="/collections" class="add-option" @click="showAddDialog = false">
                    <AppIcon :icon="ICONS.SIDEBAR.COLLECTIONS" :size="ICON_SIZES.LG" />
                    <span>创建收藏夹</span>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </header>
    
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <!-- 概览部分 -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">概览</div>
        <router-link to="/articles" class="sidebar-item" :class="{ active: $route.name === 'articles' }">
          <AppIcon :icon="ICONS.SIDEBAR.ALL_ARTICLES" class="sidebar-item-icon" :size="ICON_SIZES.MD" />
          <span class="sidebar-item-text">所有文章</span>
          <span v-if="statisticsStore.totalArticles > 0" class="sidebar-item-badge">{{ statisticsStore.totalArticles }}</span>
        </router-link>
      </div>
      
      <!-- RSS源部分 -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">RSS源</div>
        <router-link to="/rss-management" class="sidebar-item" :class="{ active: $route.name === 'rss-management' }">
          <AppIcon :icon="ICONS.SIDEBAR.RSS_MANAGEMENT" class="sidebar-item-icon" :size="ICON_SIZES.MD" />
          <span class="sidebar-item-text">源管理</span>
        </router-link>
      </div>
      
      <!-- 智能功能部分 -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">智能功能</div>
        <router-link to="/knowledge-graph" class="sidebar-item" :class="{ active: $route.name === 'knowledge-graph' }">
          <AppIcon :icon="ICONS.SIDEBAR.KNOWLEDGE_GRAPH" class="sidebar-item-icon" :size="ICON_SIZES.MD" />
          <span class="sidebar-item-text">知识图谱</span>
        </router-link>
        <router-link to="/ai-assistant" class="sidebar-item" :class="{ active: $route.name === 'ai-assistant' }">
          <AppIcon :icon="ICONS.SIDEBAR.AI_ASSISTANT" class="sidebar-item-icon" :size="ICON_SIZES.MD" />
          <span class="sidebar-item-text">AI 助手</span>
          <span class="sidebar-item-badge" style="background-color: var(--color-accent-secondary); color:white; border:none;">Beta</span>
        </router-link>

      </div>
      
      <!-- 工具部分 -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">工具</div>
        <router-link to="/notes" class="sidebar-item" :class="{ active: $route.name === 'notes' }">
          <AppIcon :icon="ICONS.SIDEBAR.NOTES" class="sidebar-item-icon" :size="ICON_SIZES.MD" />
          <span class="sidebar-item-text">笔记</span>
        </router-link>
        <router-link to="/collections" class="sidebar-item" :class="{ active: $route.name === 'collections' }">
          <AppIcon :icon="ICONS.SIDEBAR.COLLECTIONS" class="sidebar-item-icon" :size="ICON_SIZES.MD" />
          <span class="sidebar-item-text">收藏夹</span>
        </router-link>
      </div>

      <!-- 系统管理部分 - 仅管理员可见 -->
      <div v-if="isAdmin" class="sidebar-section">
        <div class="sidebar-section-title">系统管理</div>
        <router-link to="/admin" class="sidebar-item" :class="{ active: $route.name === 'admin' }">
          <AppIcon icon="fas fa-cogs" class="sidebar-item-icon" :size="ICON_SIZES.MD" />
          <span class="sidebar-item-text">管理面板</span>
        </router-link>
      </div>
    </aside>
    
    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- 用户资料弹窗 -->
    <UserProfilePopover />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useStatisticsStore } from '@/stores/statistics'
import { useAuthStore } from '@/stores/auth'
import { ICONS, ICON_SIZES, ICON_COLORS } from '@/constants/icons'
import UserProfilePopover from '@/components/common/UserProfilePopover.vue'

// 获取当前路由信息
const $route = useRoute()
const router = useRouter()
const uiStore = useUIStore()
const statisticsStore = useStatisticsStore()
const authStore = useAuthStore()

// 计算属性
const isAdmin = computed(() => {
  // 确保用户已登录
  if (!authStore.isLoggedIn || !authStore.currentUser) {
    console.log('🔍 MainLayout: User not logged in or no user data')
    return false
  }
  
  // 基于数据库角色判断，而不是硬编码用户名
  const userRoles = authStore.currentUser.roles || []
  const isAdminUser = userRoles.includes('ROLE_ADMIN')
  
  console.log('🔍 MainLayout: Checking admin status')
  console.log('🔍 MainLayout: Username:', authStore.currentUser.username)
  console.log('🔍 MainLayout: User roles:', userRoles)
  console.log('🔍 MainLayout: Has ROLE_ADMIN?', isAdminUser)
  
  return isAdminUser
})

// 响应式数据
const searchQuery = ref('')
const isSearchFocused = ref(false)
const showAddDialog = ref(false)
const showNotifications = ref(false)

// 通知数据
const notifications = ref([
  {
    id: 1,
    title: '新文章推荐',
    icon: 'fas fa-newspaper',
    time: new Date(Date.now() - 10 * 60 * 1000), // 10分钟前
    read: false
  },
  {
    id: 2,
    title: 'RSS源更新',
    icon: 'fas fa-rss',
    time: new Date(Date.now() - 30 * 60 * 1000), // 30分钟前
    read: false
  },
  {
    id: 3,
    title: '系统消息',
    icon: 'fas fa-cog',
    time: new Date(Date.now() - 60 * 60 * 1000), // 1小时前
    read: true
  }
])

// 方法
const isTabActive = (routeName: string) => {
  const currentName = $route.name as string
  return currentName === routeName || 
         (currentName?.includes(routeName))
}

const performSearch = () => {
  if (searchQuery.value.trim()) {
    // 这里可以实现全网搜索功能
    console.log('搜索:', searchQuery.value)
    // 可以跳转到搜索页面或显示搜索结果
    router.push({ path: '/search', query: { q: searchQuery.value } })
  }
}

const clearSearch = () => {
  searchQuery.value = ''
}

const markAllAsRead = () => {
  notifications.value.forEach(notification => {
    notification.read = true
  })
}

const formatTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (minutes < 24 * 60) {
    const hours = Math.floor(minutes / 60)
    return `${hours}小时前`
  } else {
    const days = Math.floor(minutes / (24 * 60))
    return `${days}天前`
  }
}

// 点击外部关闭弹窗
const handleClickOutside = (event: MouseEvent) => {
  showNotifications.value = false
}

// 键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showAddDialog.value = false
    showNotifications.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
  
  // 初始化统计数据
  statisticsStore.initializeStats()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.app-container {
  display: grid;
  grid-template-areas: 
    "header header"
    "sidebar content";
  grid-template-columns: 240px 1fr; 
  grid-template-rows: 48px 1fr; 
  height: 100vh;
  overflow: hidden;
}

.app-header {
  grid-area: header;
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 calc(var(--spacing-unit) * 5); 
  z-index: 50;
  box-shadow: var(--shadow-xs); 
}

.header-left { 
  display: flex; 
  align-items: center; 
}

.logo {
  font-size: 1.1rem; 
  font-weight: 600;
  color: var(--color-text-primary);
  margin-right: calc(var(--spacing-unit) * 6); 
  display: flex;
  align-items: center;
}

.logo i {
  margin-right: calc(var(--spacing-unit) * 1.5);
  color: var(--color-accent-primary);
}

.tabs { 
  display: flex; 
  align-items: center; 
  gap: calc(var(--spacing-unit) * 1); 
}

.tab {
  position: relative;
  padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 3); 
  font-size: 13px; 
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-m); 
  transition: color var(--transition-speed-fast), background-color var(--transition-speed-fast);
  text-decoration: none;
}

.tab:hover { 
  color: var(--color-text-primary); 
  background-color: var(--color-bg-hover); 
}

.tab.active { 
  color: var(--color-text-primary); 
  background-color: var(--color-bg-active); 
}

.header-right { 
  display: flex; 
  align-items: center; 
  gap: calc(var(--spacing-unit) * 3); 
}

.search-box {
  display: flex; 
  align-items: center; 
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary); 
  border-radius: var(--border-radius-m); 
  padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2.5);
  width: 220px; 
  transition: border-color var(--transition-speed-fast), box-shadow var(--transition-speed-fast);
}

.search-box:focus-within {
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.2); 
}

.search-box i {
  color: var(--color-text-disabled);
  font-size: 13px;
}

.search-box input {
  background: transparent; 
  border: none; 
  outline: none;
  color: var(--color-text-primary); 
  font-size: 13px; 
  width: 100%; 
  margin-left: calc(var(--spacing-unit) * 1.5);
}

.search-box input::placeholder { 
  color: var(--color-text-disabled); 
}

.icon-btn { 
  display: flex; 
  align-items: center; 
  justify-content: center;
  width: 32px; 
  height: 32px; 
  border-radius: var(--border-radius-m);
  color: var(--color-text-secondary); 
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  position: relative;
}

.icon-btn:hover { 
  color: var(--color-text-primary); 
  background-color: var(--color-bg-hover); 
}

.notification-bell { 
  position: relative; 
}

.notification-badge {
  position: absolute; 
  top: calc(var(--spacing-unit) * 0.5); 
  right: calc(var(--spacing-unit) * 0.5);
  background-color: var(--color-accent-primary); 
  color: white;
  font-size: 9px; 
  font-weight: 600; 
  padding: 1px 4px;
  border-radius: 8px; 
  min-width: 14px; 
  line-height: 10px;
  text-align: center; 
  border: 1px solid var(--color-bg-secondary); 
}

.user-avatar-btn { 
  width: 28px; 
  height: 28px; 
  background-color: var(--color-accent-primary); 
  display: flex; 
  align-items: center; 
  justify-content: center;
  color: white; 
  font-weight: 500; 
  font-size: 13px;
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
}

.user-avatar-btn:hover {
  background-color: var(--color-accent-primary-hover);
  transform: translateY(-1px);
}

.sidebar {
  grid-area: sidebar; 
  background-color: var(--color-bg-tertiary);
  border-right: 1px solid var(--color-border-primary);
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 2); 
  overflow-y: auto; 
  display: flex; 
  flex-direction: column;
}

.sidebar-section { 
  margin-bottom: calc(var(--spacing-unit) * 4); 
}

.sidebar-section-title {
  font-size: 10px; 
  font-weight: 600; 
  color: var(--color-text-secondary);
  text-transform: uppercase; 
  letter-spacing: 0.5px; 
  margin-bottom: calc(var(--spacing-unit) * 2);
  padding: 0 calc(var(--spacing-unit) * 2); 
}

.sidebar-item {
  display: flex; 
  align-items: center;
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 2); 
  border-radius: var(--border-radius-m); 
  color: var(--color-text-secondary); 
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  margin-bottom: calc(var(--spacing-unit) * 0.5);
  text-decoration: none;
  
  &:hover { 
    background-color: var(--color-bg-hover); 
    color: var(--color-text-primary); 
  }
  
  &.active {
    background-color: var(--color-bg-active); 
    color: var(--color-text-primary); 
    font-weight: 500; 
    
    .sidebar-item-icon { 
      color: var(--color-accent-primary); 
    }
    
    .sidebar-item-badge {
      background-color: var(--color-accent-primary); 
      color: white;
      border-color: var(--color-accent-primary);
    }
  }
}

.sidebar-item-icon {
  font-size: 15px; 
  margin-right: calc(var(--spacing-unit) * 2.5);
  width: 18px; 
  text-align: center;
  color: var(--color-text-disabled); 
  transition: color var(--transition-speed-fast);
}

.sidebar-item:hover .sidebar-item-icon { 
  color: var(--color-text-secondary); 
}

.sidebar-item-text { 
  font-size: 13px; 
  font-weight: 500; 
  flex: 1; 
}

.sidebar-item-badge {
  background-color: var(--color-bg-secondary); 
  border: 1px solid var(--color-border-primary); 
  color: var(--color-text-secondary); 
  font-size: 10px; 
  font-weight: 500; 
  padding: 1px 6px; 
  border-radius: 10px;
  min-width: 18px; 
  line-height: 12px; 
  text-align: center;
  
  &.beta {
    background-color: var(--color-accent-secondary);
    color: white;
    border-color: var(--color-accent-secondary);
  }
}

.main-content {
  grid-area: content;
  background-color: var(--color-bg-primary);
  overflow-y: auto;
  padding: 0;
  position: relative;
}

/* 搜索框交互样式 */
.search-box.is-focused {
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.2);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: var(--color-text-disabled);
  color: white;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed-fast);
}

.clear-search-btn:hover {
  background: var(--color-accent-primary);
}

/* 用户头像按钮 */
.user-avatar-btn {
  width: 28px;
  height: 28px;
  background-color: var(--color-accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
  font-size: 13px;
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
}

.user-avatar-btn:hover {
  background-color: var(--color-accent-primary-hover);
}

/* 通知下拉菜单 */
.notifications-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 80px;
  width: 320px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-l);
  box-shadow: var(--shadow-l);
  backdrop-filter: blur(20px);
  overflow: hidden;
  z-index: 1000;
}

.popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--spacing-unit) * 4);
  border-bottom: 1px solid var(--color-border-primary);
}

.popover-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.mark-all-read {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1);
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius-m);
  transition: all var(--transition-speed-fast);
}

.mark-all-read:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.notifications-list {
  max-height: 300px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: calc(var(--spacing-unit) * 3);
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 4);
  border-left: 3px solid transparent;
  transition: all var(--transition-speed-fast);
}

.notification-item.unread {
  background: rgba(var(--color-accent-primary-rgb), 0.05);
  border-left-color: var(--color-accent-primary);
}

.notification-item:hover {
  background: var(--color-bg-hover);
}

.notification-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon i {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 13px;
  color: var(--color-text-primary);
  margin-bottom: calc(var(--spacing-unit) * 1);
}

.notification-time {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.popover-footer {
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 4);
  border-top: 1px solid var(--color-border-primary);
  text-align: center;
}

.popover-footer a {
  color: var(--color-accent-primary);
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
}

.popover-footer a:hover {
  text-decoration: underline;
}

/* 新增内容对话框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.add-dialog {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-l);
  min-width: 400px;
  max-width: 90vw;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--spacing-unit) * 5) calc(var(--spacing-unit) * 5) calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 5);
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--border-radius-m);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed-fast);
}

.close-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.dialog-content {
  padding: 0 calc(var(--spacing-unit) * 5) calc(var(--spacing-unit) * 5) calc(var(--spacing-unit) * 5);
}

.add-options {
  display: grid;
  gap: calc(var(--spacing-unit) * 3);
}

.add-option {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 4);
  padding: calc(var(--spacing-unit) * 4);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-l);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  text-decoration: none;
  transition: all var(--transition-speed-fast);
}

.add-option:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-accent-primary);
  transform: translateY(-1px);
}

.add-option i {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-primary);
  color: white;
  border-radius: var(--border-radius-m);
  font-size: 12px;
}

.add-option span {
  font-size: 14px;
  font-weight: 500;
}

/* 动画 */
.dropdown-enter-active, .dropdown-leave-active {
  transition: all var(--transition-speed-fast);
  transform-origin: top right;
}

.dropdown-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

.modal-enter-active, .modal-leave-active {
  transition: all var(--transition-speed-normal);
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-from .add-dialog, .modal-leave-to .add-dialog {
  transform: scale(0.9) translateY(-20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    grid-template-areas: 
      "header"
      "content";
    grid-template-columns: 1fr;
    grid-template-rows: 48px 1fr;
  }
  
  .sidebar {
    display: none;
  }
  
  .tabs {
    display: none;
  }
  
  .search-box {
    width: 160px;
  }
  
  .user-popover, .notifications-popover {
    position: fixed;
    top: 48px;
    right: 8px;
    left: 8px;
    width: auto;
  }
  
  .add-dialog {
    margin: calc(var(--spacing-unit) * 4);
    min-width: auto;
  }
}
</style> 