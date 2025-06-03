/**
 * RSS订阅相关的TypeScript类型定义
 * 基于后端RssSourceController的实际API接口
 */

// RSS源/订阅基本信息接口
export interface RssSource {
  id: string
  title: string
  url: string
  description?: string
  category?: string
  isPublic: boolean
  createdAt: string
  updatedAt?: string
  favicon?: string
  language?: string
  lastFetchAt?: string
  status?: 'active' | 'inactive' | 'error'
  articleCount?: number
  errorMessage?: string
}

// RSS源创建/更新请求接口
export interface RssSourceRequest {
  title: string
  url: string
  description?: string
  category?: string
  isPublic?: boolean
}

// RSS源统计信息接口
export interface RssSourceStats {
  sourceId: string
  totalArticles: number
  unreadArticles: number
  todayArticles: number
  weekArticles: number
  monthArticles: number
  lastFetchAt?: string
  averageArticlesPerDay?: number
}

// RSS源验证结果接口
export interface RssValidationResult {
  valid: boolean
  title?: string
  description?: string
  errorMessage?: string
}

// RSS源抓取结果接口
export interface RssFetchResult {
  success: boolean
  count: number
  message?: string
  errorMessage?: string
}

// 订阅查询参数接口
export interface SubscriptionQueryParams {
  category?: string
  status?: 'active' | 'inactive' | 'error' | 'all'
  search?: string
  sortBy?: 'title' | 'createdAt' | 'lastFetchAt' | 'articleCount'
  sortOrder?: 'asc' | 'desc'
}

// 订阅状态枚举
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive', 
  ERROR = 'error'
}

// 订阅类别预定义选项
export const SUBSCRIPTION_CATEGORIES = [
  '技术',
  '新闻',
  '科学',
  '娱乐',
  '体育',
  '财经',
  '生活',
  '教育',
  '健康',
  '其他'
] as const

export type SubscriptionCategory = typeof SUBSCRIPTION_CATEGORIES[number] 