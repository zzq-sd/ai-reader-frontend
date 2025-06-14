<template>
  <!-- 弹窗遮罩 -->
  <div 
    v-if="uiStore.showUserPopover" 
    class="profile-popover-overlay active"
    @click="handleBackdropClick"
  ></div>
  
  <!-- 用户资料弹窗 -->
  <div 
    v-if="uiStore.showUserPopover"
    class="profile-popover active"
    @click.stop
  >
          <div class="popover-header">
        <div class="popover-avatar">{{ authStore.userInitials }}</div>
        <div class="popover-user-info">
          <div class="popover-username">{{ authStore.userDisplayName }}</div>
          <div class="popover-email">{{ authStore.currentUser?.email || userEmail }}</div>
        </div>
      </div>
    <nav class="popover-nav">
      <a href="javascript:void(0);" @click="logoutUser()" class="popover-nav-item danger">
        <AppIcon icon="fas fa-sign-out-alt" :size="ICON_SIZES.SM" />
        退出登录
      </a>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { ICON_SIZES } from '@/constants/icons'
import AppIcon from '@/components/common/AppIcon.vue'

// 状态管理
const uiStore = useUIStore()
const authStore = useAuthStore()
const router = useRouter()

// 用户信息响应式数据
const userName = ref('AI阅读爱好者')
const userEmail = ref('user@example.com')

// 处理背景点击
const handleBackdropClick = () => {
  uiStore.setUserPopover(false)
}

// 用户退出登录
const logoutUser = () => {
  if (confirm('您确定要退出登录吗？')) {
    // 清除本地存储
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userEmail')
    
    // 执行退出登录逻辑
    authStore.logout()
    uiStore.setUserPopover(false)
    
    // 跳转到登录页面
    router.push('/login')
  }
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Escape' && uiStore.showUserPopover) {
    uiStore.setUserPopover(false)
  }
}

// 组件挂载时添加键盘监听
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  
  // 从 authStore 或 localStorage 获取用户信息
  if (authStore.currentUser) {
    userEmail.value = authStore.currentUser.email
    userName.value = authStore.currentUser.displayName || authStore.currentUser.username
  } else {
    const storedEmail = localStorage.getItem('userEmail')
    if (storedEmail) {
      userEmail.value = storedEmail
      userName.value = storedEmail.split('@')[0] || "用户"
    }
  }
})

// 组件卸载时移除键盘监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
/* User Profile Popover Styles (from index.html) */
.profile-popover-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.2);
  z-index: 998;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--transition-speed-normal), visibility var(--transition-speed-normal);
}

.profile-popover-overlay.active {
  opacity: 1;
  visibility: visible;
}

.profile-popover {
  position: fixed;
  top: calc(var(--spacing-unit) * 12.5);
  right: calc(var(--spacing-unit) * 4);
  width: 260px;
  background-color: var(--color-bg-frosted);
  backdrop-filter: blur(var(--backdrop-blur-intensity)) saturate(130%);
  border: 1px solid var(--frosted-border-color);
  border-radius: var(--border-radius-l);
  box-shadow: var(--shadow-l);
  z-index: 999;
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  transform-origin: top right;
  transition: opacity var(--transition-speed-popover), transform var(--transition-speed-popover);
  visibility: hidden;
}

.profile-popover.active {
  opacity: 1;
  transform: translateY(0) scale(1);
  visibility: visible;
}

.popover-header {
  padding: calc(var(--spacing-unit) * 3.5) calc(var(--spacing-unit) * 4);
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  border-bottom: 1px solid var(--frosted-border-color);
}

.popover-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--color-accent-secondary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 15px;
}

.popover-user-info {
  line-height: 1.4;
}

.popover-username {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.popover-email {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.popover-nav {
  padding: calc(var(--spacing-unit) * 1.5) 0;
}

.popover-nav-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2.5);
  padding: calc(var(--spacing-unit) * 2.2) calc(var(--spacing-unit) * 4);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color var(--transition-speed-fast), color var(--transition-speed-fast);
  border-radius: var(--border-radius-s);
  margin: calc(var(--spacing-unit) * 0.5) calc(var(--spacing-unit) * 2);
  text-decoration: none;
}

.popover-nav-item :deep(i) {
  font-size: 14px;
  width: 16px;
  text-align: center;
  color: var(--color-text-disabled);
  transition: color var(--transition-speed-fast);
}

.popover-nav-item:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.popover-nav-item:hover :deep(i) {
  color: var(--color-text-secondary);
}

.popover-nav-item.danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.popover-nav-item.danger:hover :deep(i) {
  color: var(--color-danger);
}

hr.popover-divider {
  border: none;
  height: 1px;
  background-color: var(--frosted-border-color);
  margin: var(--spacing-unit) calc(var(--spacing-unit)*2);
}

@media (max-width: 768px) {
  .profile-popover {
    right: calc(var(--spacing-unit) * 2);
  }
}
</style> 