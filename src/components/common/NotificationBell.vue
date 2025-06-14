<template>
  <div class="notification-bell">
    <IconButton
      icon="fas fa-bell"
      :title="`通知 (${notificationStore.unreadCount})`"
      @click="handleClick"
    />
    <div 
      v-if="notificationStore.unreadCount > 0" 
      class="notification-badge"
    >
      {{ displayBadgeCount }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import IconButton from './IconButton.vue'

// 使用stores
const notificationStore = useNotificationStore()

// 计算属性
const displayBadgeCount = computed(() => {
  const count = notificationStore.unreadCount
  return count > 99 ? '99+' : count.toString()
})

// 事件处理
function handleClick() {
  // TODO: 打开通知面板或跳转到通知页面
  console.log('打开通知面板')
  
  // 可以在这里触发通知面板的显示
  // 或者使用路由跳转到通知页面
}
</script>

<style lang="scss" scoped>
.notification-bell {
  position: relative;
  display: inline-block;
}

.notification-badge {
  position: absolute;
  top: spacing(0.5);
  right: spacing(0.5);
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
  pointer-events: none;
}
</style> 