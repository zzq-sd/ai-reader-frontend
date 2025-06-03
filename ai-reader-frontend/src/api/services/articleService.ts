/**
 * 文章API服务
 * 负责文章的获取、状态管理、收藏等功能
 */

import { apiClient } from '../base'
import type { ApiResponse, PagedResponse, PageRequest } from '../types/common'
import type { Article } from '../types/article'

// 文章请求参数接口
export interface ArticleListParams extends PageRequest {
  search?: string
  source?: string
  sourceId?: string
  status?: 'all' | 'read' | 'unread' | 'favorited'
  sortBy?: 'publishDate' | 'publishDate_asc' | 'title' | 'source'
  sortOrder?: 'asc' | 'desc'
  tags?: string[]
  category?: string
}

// 文章统计接口
export interface ArticleStats {
  total: number
  unread: number
  read: number
  favorited: number
}

class ArticleService {
  /**
   * 获取文章列表
   */
  async getArticles(params: ArticleListParams = {}): Promise<PagedResponse<Article>> {
    const {
      page = 0,
      size = 20,
      search,
      sourceId,
      status,
      sortBy = 'publishDate',
      sortOrder = 'desc',
      category
    } = params
    
    try {
      console.log('ArticleService.getArticles 请求参数:', params);
      
      const queryParams: Record<string, any> = {
        page,
        size
      }

      // 添加筛选参数
      if (search) queryParams.search = search
      if (sourceId) queryParams.sourceId = sourceId
      if (status && status !== 'all') queryParams.status = status
      if (category) queryParams.category = category

      // 排序参数
      queryParams.sortBy = sortBy
      queryParams.sortOrder = sortOrder
      
      console.log('ArticleService 发送请求参数:', queryParams);

      // 从API获取数据 
      const response = await apiClient.get<ApiResponse<Article[]>>('/feeds/latest-articles', {
        params: queryParams
      })

      // 获取文章数据
      let articles = response.data.data || [];
      
      console.log(`ArticleService 从后端获取: 总计${articles.length}篇文章`);
      
      // 前端筛选逻辑（后端可能不支持的筛选）
      let filteredArticles = articles;

      // 按源筛选（如果后端没有处理）
      if (sourceId) {
        filteredArticles = filteredArticles.filter(article => 
          article.rssSourceId === sourceId
        );
        console.log(`按源筛选后: ${filteredArticles.length}篇文章`);
      }

      // 按状态筛选（如果后端没有处理）
      if (status && status !== 'all') {
        if (status === 'read') {
          filteredArticles = filteredArticles.filter(article => article.isRead === true);
        } else if (status === 'unread') {
          filteredArticles = filteredArticles.filter(article => article.isRead !== true);
        } else if (status === 'favorited') {
          filteredArticles = filteredArticles.filter(article => article.isFavorited === true);
        }
        console.log(`按状态筛选后: ${filteredArticles.length}篇文章`);
      }

      // 按搜索关键词筛选
      if (search) {
        const searchLower = search.toLowerCase();
        filteredArticles = filteredArticles.filter(article => 
          (article.title?.toLowerCase().includes(searchLower)) ||
          (article.summary?.toLowerCase().includes(searchLower)) ||
          (article.author?.toLowerCase().includes(searchLower))
        );
        console.log(`按搜索筛选后: ${filteredArticles.length}篇文章`);
      }

      // 前端排序（确保排序正确）
      filteredArticles.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'publishDate':
          case 'publishDate_asc':
            const dateA = new Date(a.publicationDate).getTime();
            const dateB = new Date(b.publicationDate).getTime();
            comparison = dateA - dateB;
            break;
          case 'title':
            comparison = (a.title || '').localeCompare(b.title || '');
            break;
          case 'source':
            comparison = (a.rssSourceName || '').localeCompare(b.rssSourceName || '');
            break;
          default:
            comparison = 0;
        }
        
        // 应用排序顺序
        if (sortBy === 'publishDate_asc') {
          return comparison; // 升序（最早发布）
        } else {
          return sortOrder === 'desc' ? -comparison : comparison;
        }
      });

      console.log(`排序后: ${filteredArticles.length}篇文章`);
      
      // 手动分页
      const startIndex = page * size;
      const endIndex = startIndex + size;
      const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
      
      console.log(`分页结果: 总计${filteredArticles.length}篇，当前页显示${paginatedArticles.length}篇 (第${page + 1}页)`);
      
      // 构造分页响应
      return {
        content: paginatedArticles,
        totalElements: filteredArticles.length,
        totalPages: Math.ceil(filteredArticles.length / size),
        size: size,
        number: page,
        first: page === 0,
        last: endIndex >= filteredArticles.length
      }
    } catch (error) {
      console.error('获取文章列表失败:', error)
      // 返回空的分页对象而不是抛出错误
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: size,
        number: page,
        first: true,
        last: true
      }
    }
  }

  /**
   * 获取文章详情
   */
  async getArticleById(articleId: string): Promise<Article> {
    try {
      const response = await apiClient.get<ApiResponse<Article>>(`/articles/${articleId}`)
      return response.data.data!
    } catch (error) {
      console.error('获取文章详情失败:', error)
      throw error
    }
  }

  /**
   * 获取文章内容
   */
  async getArticleContent(articleId: string): Promise<string> {
    try {
      const response = await apiClient.get<ApiResponse<{ content: string }>>(`/articles/${articleId}/content`)
      return response.data.data?.content || ''
    } catch (error) {
      console.error('获取文章内容失败:', error)
      throw error
    }
  }

  /**
   * 标记文章为已读
   */
  async markAsRead(articleId: string): Promise<void> {
    try {
      await apiClient.patch(`/articles/${articleId}/status`, { status: 'read' })
    } catch (error) {
      console.error('标记文章已读失败:', error)
      throw error
    }
  }

  /**
   * 标记文章为未读
   */
  async markAsUnread(articleId: string): Promise<void> {
    try {
      await apiClient.patch(`/articles/${articleId}/status`, { status: 'unread' })
    } catch (error) {
      console.error('标记文章未读失败:', error)
      throw error
    }
  }

  /**
   * 批量标记文章已读
   */
  async markMultipleAsRead(articleIds: string[]): Promise<void> {
    try {
      await apiClient.patch('/articles/batch/status', {
        articleIds,
        status: 'read'
      })
    } catch (error) {
      console.error('批量标记文章已读失败:', error)
      throw error
    }
  }

  /**
   * 标记所有文章为已读
   */
  async markAllAsRead(): Promise<{ markedCount: number }> {
    try {
      const response = await apiClient.post<ApiResponse<{ markedCount: number }>>('/articles/mark-all-read')
      return response.data.data || { markedCount: 0 }
    } catch (error) {
      console.error('标记所有文章已读失败:', error)
      throw error
    }
  }

  /**
   * 检查文章阅读状态
   */
  async getReadStatus(articleId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ isRead: boolean }>>(`/articles/${articleId}/read-status`)
      return response.data.data?.isRead || false
    } catch (error) {
      console.warn('获取文章阅读状态失败:', error)
      return false
    }
  }

  /**
   * 获取已读文章列表
   */
  async getReadArticles(params: Partial<ArticleListParams> = {}): Promise<PagedResponse<Article>> {
    const { page = 0, size = 20 } = params
    
    try {
      const response = await apiClient.get<ApiResponse<PagedResponse<Article>>>('/articles/read', {
        params: { page, size }
      })
      return response.data.data || {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: size,
        number: page,
        first: true,
        last: true
      }
    } catch (error) {
      console.error('获取已读文章失败:', error)
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: size,
        number: page,
        first: true,
        last: true
      }
    }
  }

  /**
   * 获取未读文章列表
   */
  async getUnreadArticles(params: Partial<ArticleListParams> = {}): Promise<PagedResponse<Article>> {
    const { page = 0, size = 20 } = params
    
    try {
      const response = await apiClient.get<ApiResponse<PagedResponse<Article>>>('/articles/unread', {
        params: { page, size }
      })
      return response.data.data || {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: size,
        number: page,
        first: true,
        last: true
      }
    } catch (error) {
      console.error('获取未读文章失败:', error)
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: size,
        number: page,
        first: true,
        last: true
      }
    }
  }

  /**
   * 获取阅读统计
   */
  async getReadStats(): Promise<{ readCount: number; unreadCount: number; totalCount: number }> {
    try {
      const response = await apiClient.get<ApiResponse<{ readCount: number; unreadCount: number; totalCount: number }>>('/articles/read-stats')
      return response.data.data || { readCount: 0, unreadCount: 0, totalCount: 0 }
    } catch (error) {
      console.error('获取阅读统计失败:', error)
      return { readCount: 0, unreadCount: 0, totalCount: 0 }
    }
  }

  /**
   * 添加/移除文章收藏
   */
  async toggleFavorite(articleId: string, isFavorited: boolean): Promise<void> {
    try {
      if (isFavorited) {
        await apiClient.post(`/favorites/${articleId}`)
      } else {
        await apiClient.delete(`/favorites/${articleId}`)
      }
    } catch (error) {
      console.error('切换文章收藏状态失败:', error)
      throw error
    }
  }

  /**
   * 检查文章收藏状态
   */
  async getFavoriteStatus(articleId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ isFavorited: boolean }>>(`/favorites/${articleId}/status`)
      return response.data.data?.isFavorited || false
    } catch (error) {
      console.warn('获取文章收藏状态失败:', error)
      return false
    }
  }

  /**
   * 获取文章统计
   */
  async getArticleStats(): Promise<ArticleStats> {
    try {
      // 直接从后端API获取统计数据
      const response = await apiClient.get<ApiResponse<ArticleStats>>('/articles/stats')
      
      if (response.data.success && response.data.data) {
        return response.data.data
      } else {
        throw new Error('获取文章统计失败')
      }
    } catch (error) {
      console.error('获取文章统计失败:', error)
      throw error
    }
  }

  /**
   * 搜索文章
   */
  async searchArticles(query: string, params: Partial<ArticleListParams> = {}): Promise<PagedResponse<Article>> {
    return this.getArticles({
      ...params,
      search: query
    })
  }

  /**
   * 根据分类获取文章
   */
  async getArticlesByCategory(category: string, params: Partial<ArticleListParams> = {}): Promise<PagedResponse<Article>> {
    return this.getArticles({
      ...params,
      category
    })
  }

  /**
   * 根据RSS源获取文章
   */
  async getArticlesBySource(sourceId: string, params: Partial<ArticleListParams> = {}): Promise<PagedResponse<Article>> {
    const {
      page = 0,
      size = 20,
      search,
      status,
      sortBy = 'publishDate',
      sortOrder = 'desc'
    } = params
    
    try {
      const queryParams: Record<string, any> = {
        page,
        size
      }

      // 添加筛选参数
      if (search) queryParams.search = search
      if (status && status !== 'all') queryParams.status = status

      // 排序参数
      queryParams.sortBy = sortBy
      queryParams.sortOrder = sortOrder

      const response = await apiClient.get<ApiResponse<{
        content: Article[]
        totalElements: number
        totalPages: number
        size: number
        number: number
        first: boolean
        last: boolean
      }>>(`/feeds/${sourceId}/articles`, {
        params: queryParams
      })

      return response.data.data || {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: size,
        number: page,
        first: true,
        last: true
      }
    } catch (error) {
      console.error('获取RSS源文章失败:', error)
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: size,
        number: page,
        first: true,
        last: true
      }
    }
  }

  /**
   * 处理文章（AI分析等）
   */
  async processArticle(articleId: string): Promise<void> {
    try {
      await apiClient.post(`/articles/${articleId}/process`)
    } catch (error) {
      console.error('处理文章失败:', error)
      throw error
    }
  }

  /**
   * 解析文章内容
   */
  async parseArticle(articleId: string): Promise<void> {
    try {
      await apiClient.post(`/articles/${articleId}/parse`)
    } catch (error) {
      console.error('解析文章失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export const articleService = new ArticleService()
export default articleService 