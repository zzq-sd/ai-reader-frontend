/**
 * RSS分类页面相关的TypeScript类型定义
 */

// 分类信息
export interface CategoryInfo {
  key: string
  name: string
  description: string
  icon: string
  color: string
  colorHover: string
}

// 分类RSS源信息
export interface CategoryFeedInfo {
  id: string
  name: string
  url: string
  description?: string
  category: string
  iconUrl?: string
  websiteUrl?: string
  active: boolean
  fetchStatus: 'SUCCESS' | 'ERROR' | 'PENDING'
  errorMessage?: string
  lastFetchedAt?: string
  createdAt: string
  updatedAt: string
  // 统计信息
  stats?: FeedStats
}

// RSS源统计数据
export interface FeedStats {
  totalArticles: number
  unreadCount: number
  lastUpdateTime: string
  lastUpdateTimeFormatted: string
}

// 分类文章信息
export interface CategoryArticle {
  id: string
  title: string
  summary?: string
  author?: string
  publicationDate: string
  originalUrl: string
  imageUrl?: string
  rssSourceId: string
  rssSourceName: string
  isRead?: boolean
  isFavorited?: boolean
  // 格式化的时间显示
  timeAgo: string
}

// 添加RSS源到分类的请求数据
export interface AddFeedToCategoryRequest {
  url: string
  name?: string
  description?: string
  category: string
  isPublic?: boolean
}

// 分类页面状态
export interface CategoryPageState {
  currentCategory: string
  categoryInfo: CategoryInfo | null
  feeds: CategoryFeedInfo[]
  articles: CategoryArticle[]
  loading: boolean
  feedsLoading: boolean
  articlesLoading: boolean
  error: string | null
}

// 分类配置映射
export const CATEGORY_CONFIG: Record<string, CategoryInfo> = {
  tech: {
    key: 'tech',
    name: '技术博客',
    description: '追踪前沿技术动态，学习深度开发技巧。',
    icon: 'fas fa-laptop-code',
    color: '#3B82F6',
    colorHover: '#2563EB'
  },
  news: {
    key: 'news',
    name: '新闻资讯',
    description: '获取全球热点、深度报道和即时新闻更新。',
    icon: 'far fa-newspaper',
    color: '#F59E0B',
    colorHover: '#D97706'
  },
  design: {
    key: 'design',
    name: '设计灵感',
    description: '发现创意设计、UI/UX趋势和视觉艺术。',
    icon: 'fas fa-palette',
    color: '#EC4899',
    colorHover: '#D92671'
  },
  business: {
    key: 'business',
    name: '商业财经',
    description: '洞悉市场动态，把握商业脉搏，获取深度财经解读。',
    icon: 'fas fa-chart-pie',
    color: '#10B981',
    colorHover: '#0E9F74'
  }
}

// 获取分类信息的辅助函数
export function getCategoryInfo(categoryKey: string): CategoryInfo | null {
  return CATEGORY_CONFIG[categoryKey] || null
}

// 格式化时间的辅助函数
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '刚刚'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}分钟前`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}小时前`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 格式化更新时间的辅助函数
export function formatUpdateTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '刚刚'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d`
  }
} 