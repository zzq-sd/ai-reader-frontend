/**
 * RSS源相关API类型定义
 * 严格基于后端RssSourceDTO.java设计
 */

import type { Timestamp, ID } from './common'

// RSS源类型（严格基于RssSourceDTO.java）
export interface RssSource {
  id: ID
  url: string
  name?: string
  category?: string
  description?: string
  websiteUrl?: string
  iconUrl?: string
  fetchStatus?: string
  errorMessage?: string
  lastFetchedAt?: Timestamp
  active: boolean
  isPublic: boolean
  fetchInterval?: number
  userId?: ID
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// RSS源创建请求
export interface RssSourceCreateRequest {
  url: string
  name?: string
  category?: string
  description?: string
  isPublic?: boolean
  fetchInterval?: number
}

// RSS源更新请求
export interface RssSourceUpdateRequest {
  name?: string
  url?: string
  category?: string
  description?: string
  isPublic?: boolean
  fetchInterval?: number
  active?: boolean
}

// RSS源统计扩展
export interface RssSourceWithStats extends RssSource {
  articleCount?: number
  unreadCount?: number
  lastArticleDate?: Timestamp
}

// RSS分类
export interface RssCategory {
  id: string
  name: string
  count: number
}

// RSS源验证结果
export interface RssValidationResult {
  valid: boolean
  title?: string
  description?: string
  error?: string
} 