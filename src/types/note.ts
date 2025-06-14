/**
 * 笔记相关类型定义
 * 与后端DTO保持一致
 */

/**
 * 笔记请求类型
 */
export interface NoteRequest {
  title: string
  content: string
  articleId?: string
  tags?: string[]
  public?: boolean
  type?: string
  color?: string
  position?: string
}

/**
 * 笔记响应类型
 */
export interface NoteResponse {
  id: string
  title: string
  content: string
  userId: string
  username: string
  articleId?: string
  articleTitle?: string
  tags: string[]
  isPublic: boolean
  type?: string
  color?: string
  position?: string
  createdAt: string
  updatedAt: string
}

/**
 * 标签类型
 */
export interface Tag {
  id: string
  name: string
  color?: string
  description?: string
  count?: number
  userId: string
}

/**
 * 标签请求类型
 */
export interface TagRequest {
  name: string
  color?: string
  description?: string
}

/**
 * 笔记查询参数
 */
export interface NoteQueryParams {
  page?: number
  size?: number
  keyword?: string
  tagId?: string
  articleId?: string
}

/**
 * 分页响应类型
 */
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

/**
 * 笔记统计信息
 */
export interface NoteStatistics {
  totalNotes: number
  totalTags: number
  recentNotes: number
  publicNotes: number
}

/**
 * 标签统计信息
 */
export interface TagStatistics {
  name: string
  count: number
} 