/**
 * 收藏管理服务
 * 提供文章收藏、取消收藏和收藏列表查询功能
 */

import { apiClient } from '../base'
import type { ApiResponse } from '@/api/types/common'
import type { Article } from '@/api/types/article'

// 收藏搜索参数接口
export interface FavoritesSearchParams {
  keyword: string
  page?: number
  size?: number
}

// 收藏状态接口
export interface FavoriteStatus {
  isFavorited: boolean
}

// 分页响应接口
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

class FavoritesService {
  /**
   * 添加文章到收藏
   */
  async addToFavorites(articleId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(`/favorites/${articleId}`)
      return response.data
    } catch (error) {
      console.error('添加收藏失败:', error)
      throw error
    }
  }

  /**
   * 从收藏中移除文章
   */
  async removeFromFavorites(articleId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/favorites/${articleId}`)
      return response.data
    } catch (error) {
      console.error('移除收藏失败:', error)
      throw error
    }
  }

  /**
   * 检查文章收藏状态
   */
  async getFavoriteStatus(articleId: string): Promise<ApiResponse<FavoriteStatus>> {
    try {
      const response = await apiClient.get<ApiResponse<FavoriteStatus>>(`/favorites/${articleId}/status`)
      return response.data
    } catch (error) {
      console.error('获取收藏状态失败:', error)
      throw error
    }
  }

  /**
   * 获取收藏列表（分页）
   */
  async getFavorites(page: number = 0, size: number = 20): Promise<ApiResponse<PageResponse<Article>>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<Article>>>('/favorites', {
        params: { page, size }
      })
      return response.data
    } catch (error) {
      console.error('获取收藏列表失败:', error)
      throw error
    }
  }

  /**
   * 获取最近收藏的文章
   */
  async getRecentFavorites(limit: number = 5): Promise<ApiResponse<Article[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Article[]>>('/favorites/recent', {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('获取最近收藏失败:', error)
      throw error
    }
  }

  /**
   * 根据标签查询收藏的文章
   */
  async getFavoritesByTag(tagId: string, page: number = 0, size: number = 20): Promise<ApiResponse<PageResponse<Article>>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<Article>>>(`/favorites/tags/${tagId}`, {
        params: { page, size }
      })
      return response.data
    } catch (error) {
      console.error('按标签查询收藏失败:', error)
      throw error
    }
  }

  /**
   * 搜索收藏的文章
   */
  async searchFavorites(params: FavoritesSearchParams): Promise<ApiResponse<PageResponse<Article>>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<Article>>>('/favorites/search', {
        params: {
          keyword: params.keyword,
          page: params.page || 0,
          size: params.size || 20
        }
      })
      return response.data
    } catch (error) {
      console.error('搜索收藏失败:', error)
      throw error
    }
  }

  /**
   * 获取收藏文章数量
   */
  async getFavoritesCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>('/favorites/count')
      return response.data
    } catch (error) {
      console.error('获取收藏数量失败:', error)
      throw error
    }
  }

  /**
   * 切换文章收藏状态
   */
  async toggleFavorite(articleId: string, isFavorited: boolean): Promise<ApiResponse<void>> {
    if (isFavorited) {
      return await this.addToFavorites(articleId)
    } else {
      return await this.removeFromFavorites(articleId)
    }
  }
}

// 导出单例实例
export const favoritesService = new FavoritesService()
export default favoritesService 