// 文章内容接口
export interface ArticleContent {
  id: string
  title: string
  subtitle?: string
  author: string
  publishTime: string
  readTime: number // 预计阅读时间（分钟）
  source: string
  sourceUrl: string
  tags: string[]
  content: string // HTML格式的文章内容
  wordCount: number
  readStatus: 'read' | 'unread'
  isFavorited: boolean
  readProgress: number // 阅读进度 0-100
  lastReadTime?: string
  relatedArticles: RelatedArticle[]
  notes: ArticleNote[]
}

// 相关文章接口
export interface RelatedArticle {
  id: string
  title: string
  excerpt: string
  coverImage?: string
  coverImageUrl?: string
  summary?: string
  imageUrl?: string
  source: string
  author: string
  publishTime: string
  readTime: number
  tags?: string[]
  similarity: number // 相似度 0-1
}

// 文章笔记接口
export interface ArticleNote {
  id: string
  articleId: string
  content: string
  highlightText: string
  color: string
  tags?: string[]
  position: {
    start: number
    end: number
    selector: string
  }
  createdAt: string
  updatedAt: string
}

// 阅读偏好接口
export interface ReadingPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  fontFamily: 'serif' | 'sans-serif' | 'monospace'
  lineHeight: 'compact' | 'normal' | 'relaxed'
  theme: 'light' | 'dark' | 'sepia'
  contentWidth: 'narrow' | 'medium' | 'wide'
  autoSave: boolean
}

// API响应接口
export interface ArticleContentResponse {
  article: ArticleContent
  success: boolean
  message?: string
}

// API函数声明
export declare function fetchArticleContent(articleId: string): Promise<ArticleContentResponse>
export declare function updateReadingProgress(articleId: string, progress: number): Promise<void>
export declare function fetchRelatedArticles(articleId: string): Promise<RelatedArticle[]>
export declare function addArticleNote(note: Omit<ArticleNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<ArticleNote>
export declare function updateArticleNote(noteId: string, updates: Partial<ArticleNote>): Promise<ArticleNote>
export declare function deleteArticleNote(noteId: string): Promise<void>
export declare function fetchArticleNotes(articleId: string): Promise<ArticleNote[]>
export declare function toggleArticleFavoriteStatus(articleId: string): Promise<boolean> 