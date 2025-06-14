import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 数据接口定义
export interface DashboardStats {
  articles: StatItem
  notes: StatItem
  feeds: StatItem
  collections: StatItem
}

export interface StatItem {
  type: string
  value: number
  change: string
  trend: 'positive' | 'negative' | 'neutral'
}

export interface ArticlePreview {
  id: string
  title: string
  source: string
  publishTime: string
  readStatus: 'read' | 'unread'
  imageUrl?: string
  url: string
}

export interface ActivityItem {
  id: string
  type: 'add_feed' | 'create_note' | 'bookmark' | 'share'
  description: string
  timestamp: string
  icon: string
}

export interface QuickAction {
  id: string
  title: string
  icon: string
  route: string
}

export interface DashboardData {
  stats: DashboardStats
  latestArticles: ArticlePreview[]
  recentActivities: ActivityItem[]
  recommendations: ArticlePreview[]
  quickActions: QuickAction[]
}

export const useDashboardStore = defineStore('dashboard', () => {
  // 状态
  const dashboardData = ref<DashboardData | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const hasData = computed(() => dashboardData.value !== null)

  const stats = computed(() => dashboardData.value?.stats || null)
  const latestArticles = computed(() => dashboardData.value?.latestArticles || [])
  const recentActivities = computed(() => dashboardData.value?.recentActivities || [])
  const recommendations = computed(() => dashboardData.value?.recommendations || [])
  const quickActions = computed(() => dashboardData.value?.quickActions || [])

  // 动作
  async function fetchDashboardData() {
    isLoading.value = true
    error.value = null
    
    try {
      // 动态导入API函数
      const { fetchDashboardData: apiCall } = await import('@/api/dashboard')
      const data = await apiCall()
      dashboardData.value = data
      return { success: true }
    } catch (err) {
      console.error('获取仪表盘数据失败:', err)
      error.value = err instanceof Error ? err.message : '获取数据失败'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function refreshStats() {
    if (!dashboardData.value) return
    
    try {
      const { fetchDashboardData: apiCall } = await import('@/api/dashboard')
      const data = await apiCall()
      // 只更新统计数据，保持其他数据不变
      dashboardData.value.stats = data.stats
      return { success: true }
    } catch (err) {
      console.error('刷新统计数据失败:', err)
      return { success: false, error: '刷新失败' }
    }
  }

  function markArticleAsRead(articleId: string) {
    if (!dashboardData.value) return

    // 更新最新文章列表中的阅读状态
    const article = dashboardData.value.latestArticles.find(a => a.id === articleId)
    if (article) {
      article.readStatus = 'read'
    }

    // 更新推荐列表中的阅读状态
    const recommendation = dashboardData.value.recommendations.find(a => a.id === articleId)
    if (recommendation) {
      recommendation.readStatus = 'read'
    }
  }

  function clearError() {
    error.value = null
  }

  // 初始化仪表盘数据
  function initializeDashboard() {
    fetchDashboardData()
  }

  return {
    // 状态
    dashboardData,
    isLoading,
    error,
    
    // 计算属性
    hasData,
    stats,
    latestArticles,
    recentActivities,
    recommendations,
    quickActions,
    
    // 动作
    fetchDashboardData,
    refreshStats,
    markArticleAsRead,
    clearError,
    initializeDashboard
  }
}) 