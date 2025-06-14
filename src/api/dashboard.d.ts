export interface StatItem {
  type: string
  value: number
  change: string
  trend: 'positive' | 'negative' | 'neutral'
}

export interface DashboardStats {
  articles: StatItem
  notes: StatItem
  feeds: StatItem
  collections: StatItem
}

export interface ArticlePreview {
  id: string
  title: string
  source: string
  publishTime: string
  readStatus: 'read' | 'unread'
  imageUrl?: string
  url: string
}

export interface ActivityItem {
  id: string
  type: 'add_feed' | 'create_note' | 'bookmark' | 'share'
  description: string
  timestamp: string
  icon: string
}

export interface QuickAction {
  id: string
  title: string
  icon: string
  route: string
}

export interface DashboardData {
  stats: DashboardStats
  latestArticles: ArticlePreview[]
  recentActivities: ActivityItem[]
  recommendations: ArticlePreview[]
  quickActions: QuickAction[]
}

export declare function fetchDashboardData(): Promise<DashboardData> 