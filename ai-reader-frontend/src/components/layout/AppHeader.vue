<template>
  <header class="app-header">
    <div class="header-left">
      <!-- 移动端菜单按钮 -->
      <IconButton
        v-if="uiStore.isMobile"
        class="mobile-menu-btn"
        icon="fas fa-bars"
        @click="uiStore.toggleSidebar()"
      />
      
      <!-- Logo -->
      <div class="logo">
        <i class="fas fa-brain"></i>
        AI阅读器
      </div>
      
      <!-- 标签导航 (桌面端显示) -->
      <TabNavigation v-if="!uiStore.isMobile" />
    </div>
    
    <div class="header-right">
      <!-- 搜索框 (桌面端显示) -->
      <SearchBox v-if="!uiStore.isMobile" />
      
      <!-- 通知铃铛 -->
      <NotificationBell />
      
      <!-- 用户头像 -->
      <div 
        class="user-avatar-btn"
        @click="uiStore.toggleUserPopover()"
        :title="authStore.userDisplayName"
      >
        <img 
          v-if="authStore.userAvatar" 
          :src="authStore.userAvatar" 
          :alt="authStore.userDisplayName"
          class="avatar-image"
        />
        <span v-else class="avatar-text">
          {{ authStore.userInitials }}
        </span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

import IconButton from '@/components/common/IconButton.vue'
import TabNavigation from '@/components/navigation/TabNavigation.vue'
import SearchBox from '@/components/common/SearchBox.vue'
import NotificationBell from '@/components/common/NotificationBell.vue'

// 使用stores
const uiStore = useUIStore()
const authStore = useAuthStore()
</script>

<style lang="scss" scoped>
.app-header {
  grid-area: header;
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 spacing(5);
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
  margin-right: spacing(6);
  display: flex;
  align-items: center;
  user-select: none;
  
  i {
    margin-right: spacing(1.5);
    color: var(--color-accent-primary);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: spacing(3);
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
  
  &:hover {
    background-color: var(--color-accent-primary-hover);
    transform: translateY(-1px);
  }
  
  .avatar-image {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .avatar-text {
    font-size: 13px;
    font-weight: 500;
  }
}

.mobile-menu-btn {
  margin-right: spacing(3);
}
</style> 