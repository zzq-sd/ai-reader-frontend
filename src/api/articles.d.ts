export interface Article {
  id: string
  title: string
  excerpt: string
  content?: string
  imageUrl?: string
  source: string
  sourceId: string
  publishTime: string
  readStatus: 'read' | 'unread'
  isFavorited: boolean
  tags: string[]
  url: string
  createdAt: string
  updatedAt: string
}

export interface RssSource {
  id: string
  name: string
  url: string
  isActive: boolean
  articleCount: number
}

export interface ArticlesResponse {
  articles: Article[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ArticleStats {
  total: number
  unread: number
  favorited: number
  today: number
}

export interface FetchArticlesParams {
  search?: string
  source?: string
  status?: 'all' | 'read' | 'unread'
  sortBy?: 'date-desc' | 'date-asc' | 'title' | 'source'
  sortOrder?: 'asc' | 'desc'
  tags?: string[]
  page?: number
  pageSize?: number
}

export interface UpdateArticleStatusParams {
  readStatus?: 'read' | 'unread'
  isFavorited?: boolean
}

export declare function fetchArticles(params?: FetchArticlesParams): Promise<ArticlesResponse>
export declare function updateArticleStatus(id: string, updates: UpdateArticleStatusParams): Promise<Article>
export declare function toggleArticleFavorite(id: string): Promise<Article>
export declare function fetchRssSources(): Promise<RssSource[]>
export declare function fetchArticleById(id: string): Promise<Article>
export declare function markArticlesAsRead(ids: string[]): Promise<void>
export declare function fetchArticleStats(): Promise<ArticleStats> 