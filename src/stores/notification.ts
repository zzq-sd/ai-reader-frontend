import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 通知接口
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  actionUrl?: string
}

export const useNotificationStore = defineStore('notification', () => {
  // 状态
  const notifications = ref<Notification[]>([])
  const isLoading = ref(false)

  // 计算属性
  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.read)
  })

  const recentNotifications = computed(() => {
    return notifications.value
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)
  })

  // 动作
  async function fetchNotifications() {
    isLoading.value = true
    try {
      // TODO: 实际的API调用
      // const response = await notificationApi.getNotifications()
      
      // 模拟通知数据
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: '新文章推送',
          message: '技术博客分类有 5 篇新文章',
          type: 'info',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
          read: false,
          actionUrl: '/rss-tech'
        },
        {
          id: '2',
          title: 'RSS源更新',
          message: 'Vue.js官方博客已更新',
          type: 'success',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
          read: false,
          actionUrl: '/rss-tech'
        },
        {
          id: '3',
          title: '系统维护通知',
          message: '系统将于今晚23:00进行维护',
          type: 'warning',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4小时前
          read: true
        }
      ]
      
      notifications.value = mockNotifications
      return { success: true }
    } catch (error) {
      console.error('获取通知失败:', error)
      return { success: false, error: '获取通知失败' }
    } finally {
      isLoading.value = false
    }
  }

  function markAsRead(id: string) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  function markAllAsRead() {
    notifications.value.forEach(notification => {
      notification.read = true
    })
  }

  function addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    notifications.value.unshift(newNotification)
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clearAllNotifications() {
    notifications.value = []
  }

  // 格式化时间显示
  function formatNotificationTime(timestamp: Date): string {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    return timestamp.toLocaleDateString('zh-CN')
  }

  // 初始化通知
  function initializeNotifications() {
    fetchNotifications()
  }

  return {
    // 状态
    notifications,
    isLoading,
    
    // 计算属性
    unreadCount,
    unreadNotifications,
    recentNotifications,
    
    // 动作
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    clearAllNotifications,
    formatNotificationTime,
    initializeNotifications
  }
}) 