/**
 * 管理员API服务
 * 对接后端管理相关的接口
 */

import { apiClient } from './base'
import type { ApiResponse } from './types/common'
import type { 
  SystemStatsResponse, 
  UserListResponse, 
  RssSourceStatusResponse,
  AiConfigResponse,
  KnowledgeConfigResponse,
  ReaderAssistantPromptsResponse
} from './types/admin'

/**
 * 管理员API服务类
 * 提供系统管理相关的API调用
 */
export class AdminApiService {
  /**
   * 获取系统统计数据
   */
  static async getSystemStats(): Promise<ApiResponse<SystemStatsResponse>> {
    const response = await apiClient.get<ApiResponse<SystemStatsResponse>>('/admin/stats')
    return response.data
  }

  /**
   * 获取用户列表
   */
  static async getUserList(query?: string): Promise<ApiResponse<UserListResponse>> {
    const response = await apiClient.get<ApiResponse<UserListResponse>>('/admin/users', {
      params: { query }
    })
    return response.data
  }

  /**
   * 更新用户状态（启用/禁用）
   */
  static async updateUserStatus(userId: string, enabled: boolean): Promise<ApiResponse<boolean>> {
    const response = await apiClient.patch<ApiResponse<boolean>>(`/admin/users/${userId}/status`, {
      enabled
    })
    return response.data
  }

  /**
   * 获取所有RSS源状态
   */
  static async getRssSourcesStatus(): Promise<ApiResponse<RssSourceStatusResponse>> {
    const response = await apiClient.get<ApiResponse<RssSourceStatusResponse>>('/admin/rss/status')
    return response.data
  }

  /**
   * 获取AI配置
   */
  static async getAiConfig(): Promise<ApiResponse<AiConfigResponse>> {
    const response = await apiClient.get<ApiResponse<AiConfigResponse>>('/admin/config/ai')
    return response.data
  }

  /**
   * 更新AI配置
   */
  static async updateAiConfig(config: AiConfigResponse): Promise<ApiResponse<AiConfigResponse>> {
    const response = await apiClient.put<ApiResponse<AiConfigResponse>>('/admin/config/ai', config)
    return response.data
  }

  /**
   * 测试AI配置连接
   */
  static async testAiConnection(config: AiConfigResponse): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/admin/config/ai/test', config)
    return response.data
  }

  /**
   * 获取知识关联配置
   */
  static async getKnowledgeConfig(): Promise<ApiResponse<KnowledgeConfigResponse>> {
    const response = await apiClient.get<ApiResponse<KnowledgeConfigResponse>>('/admin/config/knowledge')
    return response.data
  }

  /**
   * 更新知识关联配置
   */
  static async updateKnowledgeConfig(config: KnowledgeConfigResponse): Promise<ApiResponse<KnowledgeConfigResponse>> {
    const response = await apiClient.put<ApiResponse<KnowledgeConfigResponse>>('/admin/config/knowledge', config)
    return response.data
  }

  /**
   * 获取AI阅读助手快捷提示词配置
   */
  static async getReaderAssistantPrompts(): Promise<ApiResponse<ReaderAssistantPromptsResponse>> {
    const response = await apiClient.get<ApiResponse<ReaderAssistantPromptsResponse>>('/admin/config/reader-assistant-prompts')
    return response.data
  }

  /**
   * 更新AI阅读助手快捷提示词配置
   */
  static async updateReaderAssistantPrompts(prompts: ReaderAssistantPromptsResponse): Promise<ApiResponse<ReaderAssistantPromptsResponse>> {
    const response = await apiClient.put<ApiResponse<ReaderAssistantPromptsResponse>>('/admin/config/reader-assistant-prompts', prompts)
    return response.data
  }
} 