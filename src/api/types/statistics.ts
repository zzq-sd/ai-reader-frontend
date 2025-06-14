/**
 * 统计相关API类型定义
 * 基于后端API文档和规划需求设计
 */

import type { TrendType, Timestamp, ID } from './common'

// 仪表盘统计数据
export interface DashboardStats {
  articles: {
    total: number
    unread: number
    growthRate: string
    trend: TrendType
  }
  notes: {
    total: number
    growthRate: string
    trend: TrendType
  }
  feeds: {
    total: number
    active: number
    growthCount: number
  }
  favorites: {
    total: number
    changeRate: string
    trend: TrendType
  }
}

// 分类统计
export interface CategoryStats {
  category: string
  totalArticles: number
  unreadArticles: number
  lastUpdated: Timestamp
}

// 活动记录类型
export type ActivityType = 'add_feed' | 'create_note' | 'bookmark' | 'read_article' | 'share'

// 活动记录
export interface ActivityRecord {
  id: ID
  type: ActivityType
  description: string
  timestamp: Timestamp
  metadata?: Record<string, any>
}

// RSS源统计
export interface RssSourceStats {
  sourceId: ID
  sourceName: string
  totalArticles: number
  unreadArticles: number
  lastFetchedAt?: Timestamp
  fetchStatus: string
}

// 标签统计
export interface TagStatistic {
  name: string
  count: number
  lastUsed: Timestamp
}

// 知识图谱统计（基于后端API）
export interface KnowledgeStats {
  totalNodes: number
  totalRelationships: number
  concepts: number
  articles: number
  notes: number
}

// 统计数据请求参数
export interface StatsRequest {
  timeRange?: 'day' | 'week' | 'month' | 'year'
  category?: string
  includeGrowth?: boolean
}

// 活动记录请求参数
export interface ActivityRequest {
  limit?: number
  type?: ActivityType
  startDate?: Timestamp
  endDate?: Timestamp
} 