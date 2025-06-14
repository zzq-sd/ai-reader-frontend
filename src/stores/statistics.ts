/**
 * 统计数据状态管理
 * 负责管理仪表盘统计、分类统计、活动记录等数据
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { statisticsService } from '@/api/services/statisticsService'
import { articleService } from '@/api/services/articleService'
import { rssService } from '@/api/services/rssService'
import type { Article } from '@/api/types/article'
import type {
  DashboardStats,
  CategoryStats,
  ActivityRecord,
  TagStatistic,
  KnowledgeStats
} from '@/api/types/statistics'

export const useStatisticsStore = defineStore('statistics', () => {
  // 状态
  const dashboardStats = ref<DashboardStats | null>(null)
  const categoryStats = ref<CategoryStats[]>([])
  const recentActivities = ref<ActivityRecord[]>([])
  const tagStatistics = ref<TagStatistic[]>([])
  const knowledgeStats = ref<KnowledgeStats | null>(null)
  const latestArticles = ref<Article[]>([])
  
  // 加载状态
  const loading = ref({
    dashboard: false,
    categories: false,
    activities: false,
    tags: false,
    knowledge: false,
    articles: false
  })
  
  // 错误状态
  const error = ref<string | null>(null)
  
  // 缓存时间戳
  const lastUpdated = ref({
    dashboard: null as Date | null,
    categories: null as Date | null,
    activities: null as Date | null,
    tags: null as Date | null,
    knowledge: null as Date | null,
    articles: null as Date | null
  })
  
  // 缓存有效期（5分钟）
  const CACHE_DURATION = 5 * 60 * 1000

  // 计算属性
  const totalArticles = computed(() => dashboardStats.value?.articles.total || 0)
  const unreadArticles = computed(() => dashboardStats.value?.articles.unread || 0)
  const totalNotes = computed(() => dashboardStats.value?.notes.total || 0)
  const totalFeeds = computed(() => dashboardStats.value?.feeds.total || 0)
  const activeFeeds = computed(() => dashboardStats.value?.feeds.active || 0)
  const totalFavorites = computed(() => dashboardStats.value?.favorites.total || 0)

  const hasData = computed(() => dashboardStats.value !== null)
  const isLoading = computed(() => Object.values(loading.value).some(Boolean))

  // 分类未读数映射
  const categoryUnreadMap = computed(() => {
    const map: Record<string, number> = {}
    categoryStats.value.forEach(stat => {
      map[stat.category] = stat.unreadArticles
    })
    return map
  })

  // 动作方法
  
  /**
   * 获取仪表盘统计数据
   */
  async function fetchDashboardStats(forceRefresh = false): Promise<void> {
    // 检查缓存有效性
    if (!forceRefresh && dashboardStats.value && lastUpdated.value.dashboard) {
      const elapsed = Date.now() - lastUpdated.value.dashboard.getTime()
      if (elapsed < CACHE_DURATION) {
        return
      }
    }

    loading.value.dashboard = true
    error.value = null

    try {
      const stats = await statisticsService.getDashboardStats()
      dashboardStats.value = stats
      lastUpdated.value.dashboard = new Date()
    } catch (err) {
      console.error('获取仪表盘统计失败:', err)
      error.value = err instanceof Error ? err.message : '获取统计数据失败'
      // 尝试重新获取部分数据
      tryFetchPartialStats()
    } finally {
      loading.value.dashboard = false
    }
  }
  
  /**
   * 尝试获取部分统计数据
   * 当主要API失败时，尝试单独获取各个部分的数据
   */
  async function tryFetchPartialStats(): Promise<void> {
    if (!dashboardStats.value) {
      dashboardStats.value = {
        articles: { total: 0, unread: 0, growthRate: '0%', trend: 'neutral' },
        notes: { total: 0, growthRate: '0%', trend: 'neutral' },
        feeds: { total: 0, active: 0, growthCount: 0 },
        favorites: { total: 0, changeRate: '0%', trend: 'neutral' }
      }
    }
    
    // 尝试获取文章统计
    try {
      const articleStats = await articleService.getArticleStats()
      if (articleStats) {
        dashboardStats.value.articles.total = articleStats.total
        dashboardStats.value.articles.unread = articleStats.unread
      }
    } catch (e) {
      console.warn('获取部分文章统计失败', e)
    }
    
    // 尝试获取RSS源统计
    try {
      const feedStats = await rssService.getFeedStats()
      if (feedStats) {
        dashboardStats.value.feeds.total = feedStats.totalFeeds
        dashboardStats.value.feeds.active = feedStats.activeFeeds
      }
    } catch (e) {
      console.warn('获取部分RSS源统计失败', e)
    }
  }

  /**
   * 获取分类统计数据
   */
  async function fetchCategoryStats(forceRefresh = false): Promise<void> {
    if (!forceRefresh && categoryStats.value.length > 0 && lastUpdated.value.categories) {
      const elapsed = Date.now() - lastUpdated.value.categories.getTime()
      if (elapsed < CACHE_DURATION) {
        return
      }
    }

    loading.value.categories = true

    try {
      const stats = await statisticsService.getCategoryStats()
      categoryStats.value = stats
      lastUpdated.value.categories = new Date()
    } catch (err) {
      console.error('获取分类统计失败:', err)
      error.value = err instanceof Error ? err.message : '获取分类统计失败'
    } finally {
      loading.value.categories = false
    }
  }

  /**
   * 获取最近活动记录
   */
  async function fetchRecentActivities(limit = 10, forceRefresh = false): Promise<void> {
    if (!forceRefresh && recentActivities.value.length > 0 && lastUpdated.value.activities) {
      const elapsed = Date.now() - lastUpdated.value.activities.getTime()
      if (elapsed < CACHE_DURATION) {
        return
      }
    }

    loading.value.activities = true

    try {
      const activities = await statisticsService.getRecentActivities({ limit })
      recentActivities.value = activities
      lastUpdated.value.activities = new Date()
    } catch (err) {
      console.error('获取最近活动失败:', err)
      error.value = err instanceof Error ? err.message : '获取活动记录失败'
    } finally {
      loading.value.activities = false
    }
  }

  /**
   * 获取标签统计
   */
  async function fetchTagStatistics(forceRefresh = false): Promise<void> {
    if (!forceRefresh && tagStatistics.value.length > 0 && lastUpdated.value.tags) {
      const elapsed = Date.now() - lastUpdated.value.tags.getTime()
      if (elapsed < CACHE_DURATION) {
        return
      }
    }

    loading.value.tags = true

    try {
      const stats = await statisticsService.getTagStatistics()
      tagStatistics.value = stats
      lastUpdated.value.tags = new Date()
    } catch (err) {
      console.error('获取标签统计失败:', err)
      error.value = err instanceof Error ? err.message : '获取标签统计失败'
    } finally {
      loading.value.tags = false
    }
  }

  /**
   * 获取知识图谱统计
   */
  async function fetchKnowledgeStats(forceRefresh = false): Promise<void> {
    if (!forceRefresh && knowledgeStats.value && lastUpdated.value.knowledge) {
      const elapsed = Date.now() - lastUpdated.value.knowledge.getTime()
      if (elapsed < CACHE_DURATION) {
        return
      }
    }

    loading.value.knowledge = true

    try {
      const stats = await statisticsService.getKnowledgeStats()
      knowledgeStats.value = stats
      lastUpdated.value.knowledge = new Date()
    } catch (err) {
      console.error('获取知识图谱统计失败:', err)
      error.value = err instanceof Error ? err.message : '获取知识图谱统计失败'
    } finally {
      loading.value.knowledge = false
    }
  }

  /**
   * 刷新所有统计数据
   */
  async function refreshAllStats(): Promise<void> {
    await Promise.all([
      fetchDashboardStats(true),
      fetchCategoryStats(true),
      fetchRecentActivities(10, true),
      fetchTagStatistics(true),
      fetchKnowledgeStats(true),
      fetchLatestArticles(10, true)
    ])
  }

  /**
   * 记录用户活动
   */
  async function recordActivity(activity: Omit<ActivityRecord, 'id' | 'timestamp'>): Promise<void> {
    try {
      await statisticsService.recordActivity(activity)
      // 记录成功后，刷新活动列表
      await fetchRecentActivities(10, true)
    } catch (err) {
      console.error('记录活动失败:', err)
      // 不抛出错误，避免影响用户操作
    }
  }

  /**
   * 获取分类的未读数
   */
  function getCategoryUnreadCount(category: string): number {
    return categoryUnreadMap.value[category] || 0
  }

  /**
   * 强制刷新分类统计（用于实时更新徽章）
   */
  async function refreshCategoryStats(): Promise<void> {
    await fetchCategoryStats(true)
  }

  /**
   * 更新单个统计项（用于实时更新）
   */
  function updateStatItem(type: 'articles' | 'notes' | 'feeds' | 'favorites', delta: number): void {
    if (!dashboardStats.value) return

    switch (type) {
      case 'articles':
        dashboardStats.value.articles.total += delta
        break
      case 'notes':
        dashboardStats.value.notes.total += delta
        break
      case 'feeds':
        dashboardStats.value.feeds.total += delta
        break
      case 'favorites':
        dashboardStats.value.favorites.total += delta
        break
    }
  }

  /**
   * 更新文章已读状态统计
   */
  function updateArticleReadStats(isRead: boolean): void {
    if (!dashboardStats.value) return

    if (isRead) {
      dashboardStats.value.articles.unread = Math.max(0, dashboardStats.value.articles.unread - 1)
    } else {
      dashboardStats.value.articles.unread += 1
    }
  }

  /**
   * 清除错误状态
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * 初始化所有统计数据
   */
  async function initializeStats(): Promise<void> {
    if (!hasData.value) {
      await Promise.all([
        fetchDashboardStats(),
        fetchCategoryStats(),
        fetchRecentActivities(10),
        fetchLatestArticles(10)
      ])
    }
  }

  /**
   * 获取最新文章
   */
  async function fetchLatestArticles(limit = 10, forceRefresh = false): Promise<void> {
    if (!forceRefresh && latestArticles.value.length > 0 && lastUpdated.value.articles) {
      const elapsed = Date.now() - lastUpdated.value.articles.getTime()
      if (elapsed < CACHE_DURATION) {
        return
      }
    }

    loading.value.articles = true

    try {
      const articles = await statisticsService.getLatestArticles(limit)
      latestArticles.value = articles
      lastUpdated.value.articles = new Date()
    } catch (err) {
      console.error('获取最新文章失败:', err)
      error.value = err instanceof Error ? err.message : '获取最新文章失败'
    } finally {
      loading.value.articles = false
    }
  }

  return {
    // 状态
    dashboardStats,
    categoryStats,
    recentActivities,
    tagStatistics,
    knowledgeStats,
    latestArticles,
    loading,
    error,
    lastUpdated,

    // 计算属性
    totalArticles,
    unreadArticles,
    totalNotes,
    totalFeeds,
    activeFeeds,
    totalFavorites,
    hasData,
    isLoading,
    categoryUnreadMap,

    // 动作
    fetchDashboardStats,
    fetchCategoryStats,
    fetchRecentActivities,
    fetchTagStatistics,
    fetchKnowledgeStats,
    refreshAllStats,
    recordActivity,
    getCategoryUnreadCount,
    refreshCategoryStats,
    updateStatItem,
    updateArticleReadStats,
    clearError,
    initializeStats,
    fetchLatestArticles
  }
}) 