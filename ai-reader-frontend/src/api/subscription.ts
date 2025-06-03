/**
 * RSS订阅API服务
 * 基于后端RssSourceController的实际接口实现
 */

import { apiClient } from './base'
import type { ApiResponse } from './types/common'
import type { 
  RssSource, 
  RssSourceRequest, 
  RssSourceStats,
  RssValidationResult,
  RssFetchResult,
  SubscriptionQueryParams
} from './types/subscription'
import type { Article } from './types/article'

export class SubscriptionApiService {
  /**
   * 获取用户的所有RSS源
   */
  static async getUserSubscriptions(): Promise<ApiResponse<RssSource[]>> {
    try {
      const response = await apiClient.get<ApiResponse<RssSource[]>>('/feeds')
      return response.data
    } catch (error) {
      console.warn('获取用户订阅接口调用失败，使用模拟数据')
      return {
        success: true,
        data: []
      }
    }
  }

  /**
   * 获取公共RSS源列表
   */
  static async getPublicSubscriptions(): Promise<ApiResponse<RssSource[]>> {
    try {
      const response = await apiClient.get<ApiResponse<RssSource[]>>('/feeds/public')
      return response.data
    } catch (error) {
      console.warn('获取公共订阅接口调用失败，使用模拟数据')
      return {
        success: true,
        data: []
      }
    }
  }

  /**
   * 根据ID获取RSS源详情
   */
  static async getSubscriptionById(sourceId: string): Promise<ApiResponse<RssSource>> {
    try {
      const response = await apiClient.get<ApiResponse<RssSource>>(`/feeds/${sourceId}`)
      return response.data
    } catch (error) {
      console.warn(`获取订阅详情失败: ${sourceId}`)
      return {
        success: false,
        message: '订阅源不存在'
      }
    }
  }

  /**
   * 添加新的RSS源
   */
  static async addSubscription(subscriptionData: RssSourceRequest): Promise<ApiResponse<RssSource>> {
    try {
      const response = await apiClient.post<ApiResponse<RssSource>>('/feeds', subscriptionData)
      return response.data
    } catch (error) {
      console.error('添加订阅失败:', error)
      return {
        success: false,
        message: '添加订阅失败，请检查RSS源URL是否有效'
      }
    }
  }

  /**
   * 更新RSS源信息
   */
  static async updateSubscription(sourceId: string, subscriptionData: RssSourceRequest): Promise<ApiResponse<RssSource>> {
    try {
      const response = await apiClient.put<ApiResponse<RssSource>>(`/feeds/${sourceId}`, subscriptionData)
      return response.data
    } catch (error) {
      console.error('更新订阅失败:', error)
      return {
        success: false,
        message: '更新订阅失败'
      }
    }
  }

  /**
   * 删除RSS源
   */
  static async deleteSubscription(sourceId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/feeds/${sourceId}`)
      return response.data
    } catch (error) {
      console.error('删除订阅失败:', error)
      return {
        success: false,
        message: '删除订阅失败'
      }
    }
  }

  /**
   * 验证RSS源URL
   */
  static async validateRssUrl(url: string): Promise<ApiResponse<RssValidationResult>> {
    try {
      const response = await apiClient.get<ApiResponse<{ valid: boolean }>>('/feeds/validate', {
        params: { url }
      })
      
      if (response.data.success) {
        return {
          success: true,
          data: {
            valid: response.data.data?.valid || false
          }
        }
      } else {
        return {
          success: false,
          message: 'URL验证失败'
        }
      }
    } catch (error) {
      console.error('RSS URL验证失败:', error)
      return {
        success: false,
        message: 'URL验证失败，请检查网络连接'
      }
    }
  }

  /**
   * 手动抓取RSS源
   */
  static async fetchRssSource(sourceId: string): Promise<ApiResponse<RssFetchResult>> {
    try {
      const response = await apiClient.post<ApiResponse<{ success: boolean; count: number }>>(`/feeds/${sourceId}/fetch`)
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: {
            success: response.data.data.success,
            count: response.data.data.count,
            message: response.data.message
          }
        }
      } else {
        return {
          success: false,
          message: 'RSS抓取失败'
        }
      }
    } catch (error) {
      console.error('RSS抓取失败:', error)
      return {
        success: false,
        message: 'RSS抓取失败，请稍后重试'
      }
    }
  }

  /**
   * 获取RSS源的文章列表
   */
  static async getSubscriptionArticles(
    sourceId: string, 
    page: number = 0, 
    size: number = 20
  ): Promise<ApiResponse<Article[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Article[]>>(`/feeds/${sourceId}/articles`, {
        params: { page, size }
      })
      return response.data
    } catch (error) {
      console.warn(`获取订阅文章失败: ${sourceId}`)
      return {
        success: true,
        data: []
      }
    }
  }

  /**
   * 获取RSS源统计信息
   * 注意: 这个接口可能需要后端新增实现
   */
  static async getSubscriptionStats(sourceId: string): Promise<ApiResponse<RssSourceStats>> {
    try {
      const response = await apiClient.get<ApiResponse<RssSourceStats>>(`/feeds/${sourceId}/stats`)
      return response.data
    } catch (error) {
      console.warn('订阅统计接口尚未实现，使用模拟数据')
      return {
        success: true,
        data: {
          sourceId,
          totalArticles: 0,
          unreadArticles: 0,
          todayArticles: 0,
          weekArticles: 0,
          monthArticles: 0
        }
      }
    }
  }

  /**
   * 获取订阅数量统计
   * 注意: 这个接口可能需要后端新增实现
   */
  static async getSubscriptionCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>('/feeds/count')
      return response.data
    } catch (error) {
      console.warn('订阅数量统计接口尚未实现')
      return {
        success: true,
        data: { count: 0 }
      }
    }
  }
} 