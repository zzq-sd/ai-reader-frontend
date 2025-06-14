/**
 * 文章API服务
 * 基于后端ArticleController的实际接口实现
 */

import { apiClient } from './base'
import type { ApiResponse } from './types/common'
import type { 
  Article, 
  ArticleContent, 
  ArticleQueryParams, 
  ArticleListResponse, 
  ArticleProcessResult,
  FavoriteStatus,
  ArticleStats 
} from './types/article'

export class ArticleApiService {
  /**
   * 获取最新文章列表 (分页)
   */
  static async getLatestArticles(params: ArticleQueryParams = {}): Promise<ApiResponse<ArticleListResponse>> {
    const response = await apiClient.get<ApiResponse<ArticleListResponse>>('/articles/latest', {
      params: {
        page: params.page || 0,
        size: params.size || 20,
        ...params
      }
    })
    return response.data
  }

  /**
   * 获取文章详情内容
   */
  static async getArticleContent(articleId: string): Promise<ApiResponse<ArticleContent>> {
    const response = await apiClient.get<ApiResponse<ArticleContent>>(`/articles/${articleId}/content`)
    return response.data
  }

  /**
   * 解析文章内容 (手动触发)
   */
  static async parseArticle(articleId: string): Promise<ApiResponse<ArticleProcessResult>> {
    const response = await apiClient.post<ApiResponse<ArticleProcessResult>>(`/articles/${articleId}/parse`)
    return response.data
  }

  /**
   * 处理文章 (加入处理队列)
   */
  static async processArticle(articleId: string): Promise<ApiResponse<ArticleProcessResult>> {
    const response = await apiClient.post<ApiResponse<ArticleProcessResult>>(`/articles/${articleId}/process`)
    return response.data
  }

  /**
   * 添加文章到收藏
   */
  static async addToFavorites(articleId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/favorites/${articleId}`)
    return response.data
  }

  /**
   * 从收藏中移除文章
   */
  static async removeFromFavorites(articleId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/favorites/${articleId}`)
    return response.data
  }

  /**
   * 检查文章收藏状态
   */
  static async getFavoriteStatus(articleId: string): Promise<ApiResponse<FavoriteStatus>> {
    const response = await apiClient.get<ApiResponse<FavoriteStatus>>(`/favorites/${articleId}/status`)
    return response.data
  }

  /**
   * 获取收藏的文章列表
   */
  static async getFavoriteArticles(params: ArticleQueryParams = {}): Promise<ApiResponse<ArticleListResponse>> {
    const response = await apiClient.get<ApiResponse<ArticleListResponse>>('/favorites', {
      params: {
        page: params.page || 0,
        size: params.size || 20,
        ...params
      }
    })
    return response.data
  }

  // 以下是计划中的API，需要与后端确认是否已实现

  /**
   * 获取文章统计数据 (仪表盘用)
   * 注意: 这个接口可能需要后端新增实现
   */
  static async getArticleStats(): Promise<ApiResponse<ArticleStats>> {
    try {
      const response = await apiClient.get<ApiResponse<ArticleStats>>('/articles/stats')
      return response.data
    } catch (error) {
      // 如果接口不存在，返回模拟数据
      console.warn('文章统计接口尚未实现，使用模拟数据')
      return {
        success: true,
        data: {
          totalCount: 0,
          todayCount: 0,
          unreadCount: 0,
          favoriteCount: 0,
          recentGrowth: 0
        }
      }
    }
  }

  /**
   * 获取今日新增文章数
   * 注意: 这个接口可能需要后端新增实现
   */
  static async getTodayArticleCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>('/articles/count/today')
      return response.data
    } catch (error) {
      console.warn('今日文章统计接口尚未实现')
      return { success: true, data: { count: 0 } }
    }
  }

  /**
   * 获取未读文章数
   * 注意: 这个接口可能需要后端新增实现
   */
  static async getUnreadArticleCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>('/articles/count/unread')
      return response.data
    } catch (error) {
      console.warn('未读文章统计接口尚未实现')
      return { success: true, data: { count: 0 } }
    }
  }

  /**
   * 获取收藏文章数
   * 注意: 这个接口可能需要后端新增实现
   */
  static async getFavoriteArticleCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>('/articles/count/favorite')
      return response.data
    } catch (error) {
      console.warn('收藏文章统计接口尚未实现')
      return { success: true, data: { count: 0 } }
    }
  }

  /**
   * 标记文章为已读
   * 注意: 这个接口可能需要后端新增实现
   */
  static async markAsRead(articleId: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.put<ApiResponse<boolean>>(`/articles/${articleId}/read`)
      return response.data
    } catch (error) {
      console.warn('标记已读接口尚未实现')
      return { success: false, message: '接口未实现' }
    }
  }

  /**
   * 搜索文章
   * 注意: 这个接口可能需要后端新增实现
   */
  static async searchArticles(keyword: string, params: ArticleQueryParams = {}): Promise<ApiResponse<ArticleListResponse>> {
    try {
      const response = await apiClient.get<ApiResponse<ArticleListResponse>>('/articles/search', {
        params: {
          q: keyword,
          page: params.page || 0,
          size: params.size || 20,
          ...params
        }
      })
      return response.data
    } catch (error) {
      console.warn('文章搜索接口尚未实现')
      return { 
        success: true, 
        data: { 
          content: [], 
          number: 0, 
          size: 20, 
          totalElements: 0, 
          totalPages: 0, 
          first: true, 
          last: true, 
          empty: true 
        } 
      }
    }
  }
} 