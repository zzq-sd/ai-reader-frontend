/**
 * 文章相关的TypeScript类型定义
 * 基于后端ArticleController的实际API接口
 */

// 文章基本信息接口 - 匹配后端ArticleDTO
export interface Article {
  id: string
  title: string
  author?: string
  publicationDate: string  // ISO timestamp
  summary?: string
  originalUrl: string
  imageUrl?: string
  coverImageUrl?: string  // 封面图URL
  categories?: string  // 后端返回的是string类型，不是数组
  createdAt?: string
  rssSourceId: string
  rssSourceName: string
  htmlContent?: string
  plainTextContent?: string
  aiProcessingStatus?: string
  extractedKeywords?: string[]
  extractedEntities?: string[]
  extractedTopics?: string[]
  language?: string
  wordCount?: number
  readingTimeMinutes?: number
  isFavorited?: boolean
  favoritedAt?: string
  isRead?: boolean
  lastReadAt?: string
  relatedArticles?: string[]
  relatedConcepts?: string[]
}

// 文章内容详情接口
export interface ArticleContent {
  articleId: string
  content: string
  parsedContent?: string
  summary?: string
}

// 文章查询参数接口
export interface ArticleQueryParams {
  page?: number
  size?: number
  sourceId?: string
  status?: 'read' | 'unread' | 'all'
  category?: string
  keyword?: string
  dateFrom?: string
  dateTo?: string
}

// 文章处理结果接口
export interface ArticleProcessResult {
  success: boolean
  articleId: string
  message?: string
}

// 分页结果接口
export interface PagedResult<T> {
  content: T[]
  number: number      // 当前页码
  size: number        // 每页大小
  totalElements: number  // 总元素数
  totalPages: number     // 总页数
  first: boolean         // 是否是第一页
  last: boolean          // 是否是最后一页
  empty: boolean         // 是否为空
}

// 文章列表响应类型
export type ArticleListResponse = PagedResult<Article>

// 收藏状态接口
export interface FavoriteStatus {
  isFavorited: boolean
}

// 文章统计接口 (用于仪表盘)
export interface ArticleStats {
  totalCount: number
  todayCount: number
  unreadCount: number
  favoriteCount: number
  recentGrowth?: number  // 百分比增长
} 