/**
 * RSS源API服务
 * 负责RSS源的CRUD操作和统计数据获取
 */

import { apiClient } from '../base'
import { getFeedStats as mockGetFeedStats } from '../rss'
import type { ApiResponse, PagedResponse } from '../types/common'
import type { RssSource, RssSourceCreateRequest, RssSourceUpdateRequest, RssValidationResult } from '../types/rss'

// 模拟API响应类型
interface MockApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// RSS源统计数据接口（基于JavaScript实现）
export interface RssStats {
  totalFeeds: number
  activeFeeds: number
  errorFeeds: number
  pausedFeeds: number
  totalArticles: number
  unreadArticles: number
  lastUpdateTime: string
  categoriesCount: Record<string, number>
  averageUpdateFrequency: number
}

class RssService {
  /**
   * 获取用户的RSS源列表
   */
  async getUserFeeds(): Promise<RssSource[]> {
    try {
      const response = await apiClient.get<ApiResponse<RssSource[]>>('/feeds')
      return response.data.data || []
    } catch (error) {
      console.error('获取RSS源列表失败:', error)
      throw error
    }
  }

  /**
   * 获取RSS源统计数据
   */
  async getFeedStats(): Promise<RssStats> {
    try {
      console.log('[RssService] 正在获取RSS源统计数据...')
      // 增加超时设置，避免长时间阻塞
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      try {
        const response = await apiClient.get<ApiResponse<RssStats>>('/feeds/stats', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.data.success && response.data.data) {
          console.log('[RssService] 获取RSS源统计数据成功')
          return response.data.data;
        } else {
          console.warn('[RssService] 获取RSS源统计数据接口返回非成功状态')
          // 返回默认数据而不是抛出异常
          return this.getDefaultStats();
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error: any) {
      console.error('[RssService] 获取RSS源统计数据失败:', error.message || error);
      // 返回默认统计数据，避免UI出现错误状态
      return this.getDefaultStats();
    }
  }

  /**
   * 生成默认的统计数据
   * 在API失败时提供备用数据
   */
  private getDefaultStats(): RssStats {
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
    };
  }

  /**
   * 添加RSS源
   */
  async addFeed(feedData: RssSourceCreateRequest): Promise<RssSource> {
    try {
      const response = await apiClient.post<ApiResponse<RssSource>>('/feeds', feedData)
      return response.data.data!
    } catch (error) {
      console.error('添加RSS源失败:', error)
      throw error
    }
  }

  /**
   * 更新RSS源
   */
  async updateFeed(feedId: string, feedData: RssSourceUpdateRequest): Promise<RssSource> {
    try {
      console.log(`[API] 更新RSS源请求:`, {
        feedId: feedId,
        requestData: feedData,
        activeField: feedData.active,
        activeType: typeof feedData.active
      })
      
      const response = await apiClient.put<ApiResponse<RssSource>>(`/feeds/${feedId}`, feedData)
      
      console.log(`[API] 更新RSS源响应:`, {
        feedId: feedId,
        status: response.status,
        responseData: response.data,
        returnedActiveField: response.data.data?.active,
        returnedActiveType: typeof response.data.data?.active
      })
      
      // 验证后端是否正确更新了active字段
      if (feedData.active !== undefined && response.data.data?.active !== feedData.active) {
        console.error(`[API] 严重错误: 后端未正确更新active字段!`, {
          requested: feedData.active,
          returned: response.data.data?.active,
          feedId: feedId
        })
      }
      
      return response.data.data!
    } catch (error) {
      console.error(`[API] 更新RSS源失败:`, {
        feedId: feedId,
        requestData: feedData,
        error: error
      })
      throw error
    }
  }

  /**
   * 删除RSS源
   */
  async deleteFeed(feedId: string): Promise<void> {
    try {
      await apiClient.delete(`/feeds/${feedId}`)
    } catch (error) {
      console.error('删除RSS源失败:', error)
      throw error
    }
  }

  /**
   * 验证RSS源URL
   */
  async validateFeedUrl(url: string): Promise<RssValidationResult> {
    try {
      const response = await apiClient.get<ApiResponse<RssValidationResult>>('/feeds/validate', {
        params: { url }
      })
      return response.data.data!
    } catch (error) {
      console.error('验证RSS源URL失败:', error)
      throw error
    }
  }

  /**
   * 手动抓取RSS源
   */
  async fetchFeed(feedId: string): Promise<{ success: boolean; count: number }> {
    try {
      const response = await apiClient.post<ApiResponse<{ success: boolean; count: number }>>(`/feeds/${feedId}/fetch`)
      return response.data.data!
    } catch (error) {
      console.error('手动抓取RSS源失败:', error)
      throw error
    }
  }

  /**
   * 获取分类的RSS源数量
   */
  async getCategoryFeedCount(category: string): Promise<number> {
    try {
      const response = await apiClient.get<ApiResponse<RssSource[]>>('/feeds', {
        params: { category }
      })
      return response.data.data?.length || 0
    } catch (error) {
      console.warn(`获取分类${category}的RSS源数量失败:`, error)
      return 0
    }
  }

  /**
   * 获取分类的未读文章数
   */
  async getCategoryUnreadCount(category: string): Promise<number> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>(`/feeds/categories/${category}/unread`)
      return response.data.data?.count || 0
    } catch (error) {
      console.warn(`获取分类${category}未读数失败:`, error)
      return 0
    }
  }
}

// 导出单例实例
export const rssService = new RssService()
export default rssService