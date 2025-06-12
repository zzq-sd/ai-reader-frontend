/**
 * 管理员模块相关API类型定义
 */

import type { ID, Timestamp } from './common'

/**
 * 系统统计数据响应
 */
export interface SystemStatsResponse {
  userCount: number
  rssCount: number
  articleCount: number
  conceptCount: number
}

/**
 * 用户信息
 */
export interface AdminUser {
  id: ID
  username: string
  email: string
  roles: string[]
  enabled: boolean
  createdAt: Timestamp
}

/**
 * 用户列表响应
 */
export interface UserListResponse {
  users: AdminUser[]
  total: number
}

/**
 * RSS源状态信息
 */
export interface RssSourceStatus {
  id: ID
  title: string
  url: string
  active: boolean
  articleCount: number
  lastUpdate: Timestamp
  errorMessage?: string
}

/**
 * RSS源状态响应
 */
export interface RssSourceStatusResponse {
  sources: RssSourceStatus[]
  total: number
}

/**
 * AI配置响应
 */
export interface AiConfigResponse {
  defaultModel: string
  modelVersion: string
  apiUrl: string
  apiKey: string
  timeout: number
  maxTokens: number
  streamResponse: boolean
  temperature: number
}

/**
 * 知识关联配置响应
 */
export interface KnowledgeConfigResponse {
  extractPrompt: string
  relationPrompt: string
  summaryPrompt: string
  similarityThreshold: number
  maxRelatedNodes: number
  enableAutoRelation: boolean
}

/**
 * AI阅读助手快捷提示词配置响应
 */
export interface ReaderAssistantPromptsResponse {
  /**
   * 快捷提示词列表
   */
  quickPrompts: string[]
} 