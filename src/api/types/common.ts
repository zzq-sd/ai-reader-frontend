/**
 * 通用API类型定义
 * 基于后端统一响应格式设计
 */

// 统一响应格式
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

// 分页信息
export interface PaginationInfo {
  page: number
  size: number
  total: number
  totalPages: number
  first: boolean
  last: boolean
}

// 分页响应
export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// 分页请求参数
export interface PageRequest {
  page?: number
  size?: number
}

// 错误响应
export interface ErrorResponse {
  success: false
  message: string
  data?: null
}

// 趋势类型
export type TrendType = 'positive' | 'negative' | 'neutral'

// 通用ID类型
export type ID = string | number

// 时间戳类型
export type Timestamp = string // ISO 8601 格式 