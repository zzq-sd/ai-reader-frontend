/**
 * 统计服务
 * 负责获取各类统计数据，包括仪表盘统计、分类统计、活动记录等
 * 优先使用现有API，缺失的统计通过组合计算或模拟数据提供
 */

import { apiClient } from '../base'
import { rssService } from './rssService'
import { articleService } from './articleService'
import type { ApiResponse, PagedResponse } from '../types/common'
import type { Article } from '../types/article'
import type {
  DashboardStats,
  CategoryStats,
  ActivityRecord,
  ActivityRequest,
  StatsRequest,
  TagStatistic,
  KnowledgeStats
} from '../types/statistics'

class StatisticsService {
  /**
   * 获取仪表盘统计数据
   * 组合多个API调用来获取完整的统计信息
   */
  async getDashboardStats(request?: StatsRequest): Promise<DashboardStats> {
    try {
      // 并行调用多个API获取基础数据
      const [
        articlesResponse,
        notesResponse,
        feedsResponse,
        favoritesResponse
      ] = await Promise.allSettled([
        this.getArticleStats(),
        this.getNoteStats(),
        this.getFeedStats(),
        this.getFavoriteStats()
      ])

      // 获取真实的文章变化率和趋势（从后端获取或计算）
      let articleGrowthRate = '0%';
      let articlesTrend = 'neutral';
      try {
        const response = await apiClient.get<ApiResponse<{growthRate: string, trend: string}>>('/statistics/articles/growth');
        if (response.data.success) {
          articleGrowthRate = response.data.data?.growthRate || '0%';
          articlesTrend = response.data.data?.trend || 'neutral';
        }
      } catch (error) {
        console.warn('获取文章增长率失败，使用默认值');
      }

      // 获取真实的笔记变化率和趋势
      let notesGrowthRate = '0%';
      let notesTrend = 'neutral';
      try {
        const response = await apiClient.get<ApiResponse<{growthRate: string, trend: string}>>('/statistics/notes/growth');
        if (response.data.success) {
          notesGrowthRate = response.data.data?.growthRate || '0%';
          notesTrend = response.data.data?.trend || 'neutral';
        }
      } catch (error) {
        console.warn('获取笔记增长率失败，使用默认值');
      }

      // 获取真实的源增长数量
      let feedsGrowthCount = 0;
      try {
        const response = await apiClient.get<ApiResponse<{growthCount: number}>>('/statistics/feeds/growth');
        if (response.data.success) {
          feedsGrowthCount = response.data.data?.growthCount || 0;
        }
      } catch (error) {
        console.warn('获取源增长数量失败，使用默认值');
      }

      // 获取真实的收藏变化率和趋势
      let favoritesChangeRate = '0%';
      let favoritesTrend = 'neutral';
      try {
        const response = await apiClient.get<ApiResponse<{changeRate: string, trend: string}>>('/statistics/favorites/change');
        if (response.data.success) {
          favoritesChangeRate = response.data.data?.changeRate || '0%';
          favoritesTrend = response.data.data?.trend || 'neutral';
        }
      } catch (error) {
        console.warn('获取收藏变化率失败，使用默认值');
      }

      // 组装仪表盘统计数据
      const dashboardStats: DashboardStats = {
        articles: {
          total: articlesResponse.status === 'fulfilled' ? articlesResponse.value.total : 0,
          unread: articlesResponse.status === 'fulfilled' ? articlesResponse.value.unread : 0,
          growthRate: articleGrowthRate,
          trend: articlesTrend as 'positive' | 'negative' | 'neutral'
        },
        notes: {
          total: notesResponse.status === 'fulfilled' ? notesResponse.value.total : 0,
          growthRate: notesGrowthRate,
          trend: notesTrend as 'positive' | 'negative' | 'neutral'
        },
        feeds: {
          total: feedsResponse.status === 'fulfilled' ? feedsResponse.value.total : 0,
          active: feedsResponse.status === 'fulfilled' ? feedsResponse.value.active : 0,
          growthCount: feedsGrowthCount
        },
        favorites: {
          total: favoritesResponse.status === 'fulfilled' ? favoritesResponse.value.total : 0,
          changeRate: favoritesChangeRate,
          trend: favoritesTrend as 'positive' | 'negative' | 'neutral'
        }
      }

      return dashboardStats
    } catch (error) {
      console.error('获取仪表盘统计失败:', error)
      throw error
    }
  }

  /**
   * 获取文章统计数据
   * 使用新的articleService获取统计信息
   */
  private async getArticleStats() {
    try {
      const stats = await articleService.getArticleStats()
      return { 
        total: stats.total, 
        unread: stats.unread 
      }
    } catch (error) {
      console.warn('获取文章统计失败，使用默认值:', error)
      return { total: 0, unread: 0 }
    }
  }

  /**
   * 获取笔记统计数据
   */
  private async getNoteStats() {
    try {
      const response = await apiClient.get<ApiResponse<{ total: number }>>('/notes/stats')
      return { total: response.data.data?.total || 0 }
    } catch (error) {
      console.warn('获取笔记统计失败，使用默认值:', error)
      return { total: 0 }
    }
  }

  /**
   * 获取RSS源统计数据
   */
  private async getFeedStats() {
    try {
      const stats = await rssService.getFeedStats()
      return { 
        total: stats.totalFeeds, 
        active: stats.activeFeeds 
      }
    } catch (error) {
      console.warn('获取RSS源统计失败，使用默认值:', error)
      return { total: 0, active: 0 }
    }
  }

  /**
   * 获取收藏统计数据
   */
  private async getFavoriteStats() {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>('/favorites/count')
      const total = response.data.data?.count || 0

      return { total }
    } catch (error) {
      console.warn('获取收藏统计失败，使用默认值:', error)
      return { total: 0 }
    }
  }

  /**
   * 获取分类统计数据
   * 基于RSS源数据和文章API组合计算分类统计
   */
  async getCategoryStats(): Promise<CategoryStats[]> {
    try {
      // 并行获取RSS源统计和各分类的文章数据
      const [rssStatsResponse, ...categoryArticleResponses] = await Promise.allSettled([
        this.getRSSSourceStats(),
        this.getCategoryArticleStats('tech'),
        this.getCategoryArticleStats('news'), 
        this.getCategoryArticleStats('design'),
        this.getCategoryArticleStats('business')
      ])

      const categories = ['tech', 'news', 'design', 'business']
      const categoryStats: CategoryStats[] = []

      categories.forEach((category, index) => {
        const articleStatsResponse = categoryArticleResponses[index]
        
        let totalArticles = 0
        let unreadArticles = 0
        
        if (articleStatsResponse.status === 'fulfilled') {
          totalArticles = articleStatsResponse.value.total
          unreadArticles = articleStatsResponse.value.unread
        }

        categoryStats.push({
          category,
          totalArticles,
          unreadArticles,
          lastUpdated: new Date().toISOString()
        })
      })

      return categoryStats
    } catch (error) {
      console.error('获取分类统计失败:', error)
      // 返回默认数据以防止页面崩溃
      return [
        { category: 'tech', totalArticles: 0, unreadArticles: 0, lastUpdated: new Date().toISOString() },
        { category: 'news', totalArticles: 0, unreadArticles: 0, lastUpdated: new Date().toISOString() },
        { category: 'design', totalArticles: 0, unreadArticles: 0, lastUpdated: new Date().toISOString() },
        { category: 'business', totalArticles: 0, unreadArticles: 0, lastUpdated: new Date().toISOString() }
      ]
    }
  }

  /**
   * 获取RSS源统计数据（私有方法）
   */
  private async getRSSSourceStats() {
    try {
      return await rssService.getFeedStats()
    } catch (error) {
      console.warn('获取RSS源统计失败:', error)
      return {
        totalFeeds: 0,
        activeFeeds: 0,
        errorFeeds: 0,
        pausedFeeds: 0,
        totalArticles: 0,
        unreadArticles: 0,
        lastUpdateTime: new Date().toISOString(),
        categoriesCount: {},
        averageUpdateFrequency: 0
      }
    }
  }

  /**
   * 获取特定分类的文章统计（私有方法）
   */
  private async getCategoryArticleStats(category: string) {
    try {
      // 组合使用RSS统计和文章API获取更准确的数据
      const [rssStats, unreadCount] = await Promise.allSettled([
        this.getRSSSourceStats(),
        rssService.getCategoryUnreadCount(category)
      ])

      let total = 0
      let unread = 0

      // 从RSS统计中获取分类文章总数的估算值
      if (rssStats.status === 'fulfilled') {
        const categoryCount = rssStats.value.categoriesCount[category] || 0
        // 估算：每个源平均50篇文章（可根据实际情况调整）
        total = categoryCount * 50
      }

      // 获取未读数
      if (unreadCount.status === 'fulfilled') {
        unread = unreadCount.value
      }

      return { total, unread }
    } catch (error) {
      console.warn(`获取分类${category}文章统计失败:`, error)
      return { total: 0, unread: 0 }
    }
  }

  /**
   * 获取最近活动记录
   * 暂时使用模拟数据，等待后端实现活动记录API
   */
  async getRecentActivities(request?: ActivityRequest): Promise<ActivityRecord[]> {
    try {
      // TODO: 等待后端实现 GET /api/activities/recent
      // 暂时返回模拟数据
      const limit = request?.limit || 10
      
      const mockActivities: ActivityRecord[] = [
        {
          id: '1',
          type: 'add_feed',
          description: '添加了新的RSS源 "React Blog"',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
          metadata: { feedName: 'React Blog' }
        },
        {
          id: '2',
          type: 'create_note',
          description: '创建了笔记 "Vue组件设计模式"',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4小时前
        },
        {
          id: '3',
          type: 'bookmark',
          description: '收藏了文章 "AI在前端开发中的应用"',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1天前
        },
        {
          id: '4',
          type: 'read_article',
          description: '阅读了文章 "TypeScript 5.3 新特性"',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2天前
        }
      ]

      return mockActivities.slice(0, limit)
    } catch (error) {
      console.error('获取最近活动失败:', error)
      throw error
    }
  }

  /**
   * 记录用户活动
   * 暂时为空实现，等待后端API
   */
  async recordActivity(activity: Omit<ActivityRecord, 'id' | 'timestamp'>): Promise<void> {
    try {
      // TODO: 等待后端实现 POST /api/activities
      console.log('记录活动:', activity)
      // 暂时不发送到后端，只在控制台记录
    } catch (error) {
      console.error('记录活动失败:', error)
      // 不抛出错误，避免影响用户操作
    }
  }

  /**
   * 获取标签统计
   */
  async getTagStatistics(): Promise<TagStatistic[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/notes/tags')
      const tags = response.data.data || []

      // 转换为标签统计格式
      return tags.map((tag: any) => ({
        name: tag.name || tag,
        count: tag.count || 1,
        lastUsed: new Date().toISOString()
      }))
    } catch (error) {
      console.warn('获取标签统计失败，使用默认值:', error)
      return []
    }
  }

  /**
   * 获取知识图谱统计
   */
  async getKnowledgeStats(): Promise<KnowledgeStats> {
    try {
      const response = await apiClient.get<ApiResponse<KnowledgeStats>>('/api/v1/knowledge/statistics')
      return response.data.data || {
        totalNodes: 0,
        totalRelationships: 0,
        concepts: 0,
        articles: 0,
        notes: 0
      }
    } catch (error) {
      console.warn('获取知识图谱统计失败，使用默认值:', error)
      return {
        totalNodes: 0,
        totalRelationships: 0,
        concepts: 0,
        articles: 0,
        notes: 0
      }
    }
  }

  /**
   * 刷新所有统计数据
   */
  async refreshAllStats(): Promise<void> {
    try {
      // 并行刷新所有统计数据
      await Promise.all([
        this.getDashboardStats(),
        this.getCategoryStats(),
        this.getTagStatistics(),
        this.getKnowledgeStats()
      ])
    } catch (error) {
      console.error('刷新统计数据失败:', error)
      throw error
    }
  }

  /**
   * 获取最新文章列表
   * @param limit 要获取的文章数量
   */
  async getLatestArticles(limit: number = 10): Promise<Article[]> {
    try {
      const response = await apiClient.get<ApiResponse<Article[]>>('/articles/latest', {
        params: { limit }
      })
      if (response.data.success && response.data.data) {
        return response.data.data
      } else {
        throw new Error('获取最新文章失败')
      }
    } catch (error) {
      console.error('获取最新文章失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export const statisticsService = new StatisticsService()
export default statisticsService 