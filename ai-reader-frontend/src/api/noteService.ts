import { apiClient } from './base'
import type { 
  NoteRequest, 
  NoteResponse, 
  Tag, 
  TagRequest, 
  NoteQueryParams, 
  PageResponse,
  NoteStatistics,
  TagStatistics
} from '@/types/note'
import type { ApiResponse } from './types/common'
import type { AxiosResponse } from 'axios'

/**
 * 笔记服务API
 * 提供笔记的CRUD操作和相关功能
 */
export class NoteService {
  
  /**
   * 创建笔记
   */
  static async createNote(noteData: NoteRequest): Promise<AxiosResponse<ApiResponse<NoteResponse>>> {
    return apiClient.post('/notes', noteData)
  }

  /**
   * 更新笔记
   */
  static async updateNote(noteId: string, noteData: Partial<NoteRequest>): Promise<AxiosResponse<ApiResponse<NoteResponse>>> {
    return apiClient.put(`/notes/${noteId}`, noteData)
  }

  /**
   * 删除笔记
   */
  static async deleteNote(noteId: string): Promise<AxiosResponse<ApiResponse<{ deleted: boolean }>>> {
    return apiClient.delete(`/notes/${noteId}`)
  }

  /**
   * 获取笔记详情
   */
  static async getNoteById(noteId: string): Promise<AxiosResponse<ApiResponse<NoteResponse>>> {
    return apiClient.get(`/notes/${noteId}`)
  }

  /**
   * 获取用户笔记列表
   */
  static async getUserNotes(params: NoteQueryParams = {}): Promise<AxiosResponse<ApiResponse<PageResponse<NoteResponse>>>> {
    const queryParams = new URLSearchParams()
    
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.keyword) queryParams.append('keyword', params.keyword)
    if (params.tagId) queryParams.append('tagId', params.tagId)

    const url = `/notes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get(url)
  }

  /**
   * 获取文章相关笔记
   */
  static async getArticleNotes(articleId: string, params: NoteQueryParams = {}): Promise<AxiosResponse<ApiResponse<NoteResponse[]>>> {
    const queryParams = new URLSearchParams()
    
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())

    const url = `/notes/article/${articleId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get(url)
  }

  /**
   * 获取标签下的笔记
   */
  static async getTagNotes(tagId: string, params: NoteQueryParams = {}): Promise<AxiosResponse<ApiResponse<PageResponse<NoteResponse>>>> {
    const queryParams = new URLSearchParams()
    
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())

    const url = `/notes/tag/${tagId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get(url)
  }

  /**
   * 搜索笔记
   */
  static async searchNotes(keyword: string, params: NoteQueryParams = {}): Promise<AxiosResponse<ApiResponse<PageResponse<NoteResponse>>>> {
    const queryParams = new URLSearchParams()
    queryParams.append('keyword', keyword)
    
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())

    return apiClient.get(`/notes/search?${queryParams.toString()}`)
  }

  /**
   * 获取用户标签列表
   */
  static async getUserTags(): Promise<AxiosResponse<ApiResponse<Tag[]>>> {
    return apiClient.get('/notes/tags')
  }

  /**
   * 创建标签
   */
  static async createTag(tagData: TagRequest): Promise<AxiosResponse<ApiResponse<Tag>>> {
    return apiClient.post('/notes/tags', tagData)
  }

  /**
   * 更新标签
   */
  static async updateTag(tagId: string, tagData: Partial<TagRequest>): Promise<AxiosResponse<ApiResponse<Tag>>> {
    return apiClient.put(`/notes/tags/${tagId}`, tagData)
  }

  /**
   * 删除标签
   */
  static async deleteTag(tagId: string): Promise<AxiosResponse<ApiResponse<{ deleted: boolean }>>> {
    return apiClient.delete(`/notes/tags/${tagId}`)
  }

  /**
   * 为笔记添加标签
   */
  static async addTagsToNote(noteId: string, tagIds: string[]): Promise<AxiosResponse<ApiResponse<NoteResponse>>> {
    return apiClient.post(`/notes/${noteId}/tags`, { tagIds })
  }

  /**
   * 从笔记移除标签
   */
  static async removeTagsFromNote(noteId: string, tagIds: string[]): Promise<AxiosResponse<ApiResponse<NoteResponse>>> {
    return apiClient.delete(`/notes/${noteId}/tags`, { data: { tagIds } })
  }

  /**
   * 获取笔记统计信息
   */
  static async getNoteStatistics(): Promise<AxiosResponse<ApiResponse<NoteStatistics>>> {
    return apiClient.get('/notes/statistics')
  }

  /**
   * 获取标签统计信息
   */
  static async getTagStatistics(): Promise<AxiosResponse<ApiResponse<TagStatistics[]>>> {
    return apiClient.get('/notes/tags/statistics')
  }

  /**
   * 批量删除笔记
   */
  static async batchDeleteNotes(noteIds: string[]): Promise<AxiosResponse<ApiResponse<{ deletedCount: number }>>> {
    return apiClient.delete('/notes/batch', { data: { noteIds } })
  }

  /**
   * 导出笔记
   */
  static async exportNotes(format: 'json' | 'markdown' | 'pdf' = 'json'): Promise<AxiosResponse<ApiResponse<{ downloadUrl: string }>>> {
    return apiClient.get(`/notes/export?format=${format}`)
  }

  /**
   * 导入笔记
   */
  static async importNotes(file: File): Promise<AxiosResponse<ApiResponse<{ importedCount: number }>>> {
    const formData = new FormData()
    formData.append('file', file)
    
    return apiClient.post('/notes/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * 获取最近笔记
   */
  static async getRecentNotes(limit: number = 10): Promise<AxiosResponse<ApiResponse<NoteResponse[]>>> {
    return apiClient.get(`/notes/recent?limit=${limit}`)
  }

  /**
   * 获取公开笔记
   */
  static async getPublicNotes(params: NoteQueryParams = {}): Promise<AxiosResponse<ApiResponse<PageResponse<NoteResponse>>>> {
    const queryParams = new URLSearchParams()
    
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.keyword) queryParams.append('keyword', params.keyword)

    const url = `/notes/public${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get(url)
  }

  /**
   * 分享笔记
   */
  static async shareNote(noteId: string, shareSettings: {
    isPublic: boolean
    shareUrl?: string
    expiresAt?: string
  }): Promise<AxiosResponse<ApiResponse<{ shareUrl: string }>>> {
    return apiClient.post(`/notes/${noteId}/share`, shareSettings)
  }

  /**
   * 取消分享笔记
   */
  static async unshareNote(noteId: string): Promise<AxiosResponse<ApiResponse<{ success: boolean }>>> {
    return apiClient.delete(`/notes/${noteId}/share`)
  }
}

// 导出默认实例
export const noteService = NoteService 