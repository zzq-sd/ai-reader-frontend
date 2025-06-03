/**
 * 分类页面API服务层
 * 处理RSS分类相关的所有API调用
 */

import { apiClient } from './base'
import type { ApiResponse } from './types/common'
import type { 
  CategoryFeedInfo, 
  CategoryArticle, 
  FeedStats, 
  AddFeedToCategoryRequest 
} from '@/types/category'
import type { RssSource } from './types/rss'
import type { Article } from './types/article'

/**
 * 获取指定分类的RSS源列表
 */
export async function getCategoryFeeds(category: string): Promise<CategoryFeedInfo[]> {
  try {
    const response = await apiClient.get<ApiResponse<RssSource[]>>('/feeds', {
      params: { category }
    })
    
    const feeds = response.data.data || []
    
    // 转换为前端类型并获取统计信息
    const categoryFeeds: CategoryFeedInfo[] = await Promise.all(
      feeds.map(async (feed) => {
        const feedId = String(feed.id)
        const stats = await getFeedStats(feedId).catch(() => undefined)
        
        return {
          id: feedId,
          name: feed.name || '未命名RSS源',
          url: feed.url,
          description: feed.description,
          category: feed.category || category,
          iconUrl: feed.iconUrl,
          websiteUrl: feed.websiteUrl,
          active: feed.active,
          fetchStatus: (feed.fetchStatus as 'SUCCESS' | 'ERROR' | 'PENDING') || 'PENDING',
          errorMessage: feed.errorMessage,
          lastFetchedAt: feed.lastFetchedAt,
          createdAt: feed.createdAt || new Date().toISOString(),
          updatedAt: feed.updatedAt || new Date().toISOString(),
          stats
        }
      })
    )
    
    return categoryFeeds
  } catch (error) {
    console.error('获取分类RSS源失败:', error)
    throw new Error('获取分类RSS源失败')
  }
}

/**
 * 获取RSS源的统计信息
 */
export async function getFeedStats(feedId: string): Promise<FeedStats> {
  try {
    // 获取RSS源的文章列表来计算统计信息
    const response = await apiClient.get<ApiResponse<{
      content: Article[]
      totalElements: number
    }>>(`/feeds/${feedId}/articles`, {
      params: { page: 0, size: 1 } // 只需要总数
    })
    
    const data = response.data.data
    const totalArticles = data?.totalElements || 0
    
    // 获取未读文章数（这里需要根据实际API调整）
    // 暂时使用模拟数据，实际应该调用专门的统计API
    const unreadCount = Math.floor(Math.random() * Math.min(totalArticles, 50))
    
    // 获取最后更新时间（从RSS源信息中获取）
    const feedResponse = await apiClient.get<ApiResponse<RssSource>>(`/feeds/${feedId}`)
    const lastUpdateTime = feedResponse.data.data?.lastFetchedAt || new Date().toISOString()
    
    return {
      totalArticles,
      unreadCount,
      lastUpdateTime,
      lastUpdateTimeFormatted: formatUpdateTime(lastUpdateTime)
    }
  } catch (error) {
    console.error('获取RSS源统计失败:', error)
    // 返回默认统计信息
    return {
      totalArticles: 0,
      unreadCount: 0,
      lastUpdateTime: new Date().toISOString(),
      lastUpdateTimeFormatted: '未知'
    }
  }
}

/**
 * 获取指定分类的最新文章
 */
export async function getCategoryLatestArticles(category: string, limit: number = 10): Promise<CategoryArticle[]> {
  try {
    // 首先获取该分类的RSS源
    const feeds = await getCategoryFeeds(category)
    const feedIds = feeds.map(feed => feed.id)
    
    if (feedIds.length === 0) {
      return []
    }
    
    // 获取最新文章
    const response = await apiClient.get<ApiResponse<Article[]>>('/articles/latest', {
      params: { 
        page: 0, 
        size: limit * 2 // 获取更多文章以便过滤
      }
    })
    
    const articles = response.data.data || []
    
    // 过滤出属于当前分类的文章并转换格式
    const categoryArticles: CategoryArticle[] = articles
      .filter(article => feedIds.includes(article.rssSourceId))
      .slice(0, limit)
      .map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        author: article.author,
        publicationDate: article.publicationDate,
        originalUrl: article.originalUrl,
        imageUrl: article.imageUrl,
        rssSourceId: article.rssSourceId,
        rssSourceName: article.rssSourceName,
        isRead: article.isRead,
        isFavorited: article.isFavorited,
        timeAgo: formatTimeAgo(article.publicationDate)
      }))
    
    return categoryArticles
  } catch (error) {
    console.error('获取分类最新文章失败:', error)
    throw new Error('获取分类最新文章失败')
  }
}

/**
 * 刷新指定的RSS源
 */
export async function refreshFeed(feedId: string): Promise<{ success: boolean; count?: number; message?: string }> {
  try {
    const response = await apiClient.post<ApiResponse<{ success: boolean; count: number }>>(`/feeds/${feedId}/fetch`)
    
    const data = response.data.data
    return {
      success: data?.success || false,
      count: data?.count,
      message: response.data.message
    }
  } catch (error) {
    console.error('刷新RSS源失败:', error)
    throw new Error('刷新RSS源失败')
  }
}

/**
 * 添加RSS源到指定分类
 */
export async function addFeedToCategory(feedData: AddFeedToCategoryRequest): Promise<CategoryFeedInfo> {
  try {
    const response = await apiClient.post<ApiResponse<RssSource>>('/feeds', {
      title: feedData.name,
      url: feedData.url,
      description: feedData.description,
      category: feedData.category,
      isPublic: feedData.isPublic || false
    })
    
    const feed = response.data.data
    if (!feed) {
      throw new Error('添加RSS源失败：无返回数据')
    }
    
    // 转换为前端类型
    const categoryFeed: CategoryFeedInfo = {
      id: String(feed.id),
      name: feed.name || feedData.name || '未命名RSS源',
      url: feed.url,
      description: feed.description,
      category: feed.category || feedData.category,
      iconUrl: feed.iconUrl,
      websiteUrl: feed.websiteUrl,
      active: feed.active,
      fetchStatus: (feed.fetchStatus as 'SUCCESS' | 'ERROR' | 'PENDING') || 'PENDING',
      errorMessage: feed.errorMessage,
      lastFetchedAt: feed.lastFetchedAt,
      createdAt: feed.createdAt || new Date().toISOString(),
      updatedAt: feed.updatedAt || new Date().toISOString()
    }
    
    return categoryFeed
  } catch (error) {
    console.error('添加RSS源到分类失败:', error)
    throw new Error('添加RSS源到分类失败')
  }
}

/**
 * 验证RSS源URL是否有效
 */
export async function validateFeedUrl(url: string): Promise<{ valid: boolean; message?: string }> {
  try {
    const response = await apiClient.get<ApiResponse<{ valid: boolean }>>('/feeds/validate', {
      params: { url }
    })
    
    const data = response.data.data
    return {
      valid: data?.valid || false,
      message: response.data.message
    }
  } catch (error) {
    console.error('验证RSS源URL失败:', error)
    return {
      valid: false,
      message: '验证RSS源URL失败'
    }
  }
}

/**
 * 删除RSS源
 */
export async function deleteFeed(feedId: string): Promise<{ success: boolean }> {
  try {
    const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/feeds/${feedId}`)
    
    return {
      success: response.data.data?.deleted || false
    }
  } catch (error) {
    console.error('删除RSS源失败:', error)
    throw new Error('删除RSS源失败')
  }
}

// 辅助函数：格式化时间
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '刚刚'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}分钟前`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}小时前`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

function formatUpdateTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '刚刚'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d`
  }
} 