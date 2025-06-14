/**
 * 管理员服务类
 * 提供管理员相关功能的高级业务逻辑
 */

import { AdminApiService } from '../admin'
import type { 
  SystemStatsResponse, 
  UserListResponse, 
  RssSourceStatusResponse,
  AdminUser, 
  RssSourceStatus,
  AiConfigResponse,
  KnowledgeConfigResponse,
  ReaderAssistantPromptsResponse
} from '../types/admin'

/**
 * 管理员服务类
 */
export class AdminService {
  /**
   * 获取系统统计数据
   */
  static async getSystemStats(): Promise<SystemStatsResponse> {
    const response = await AdminApiService.getSystemStats()
    if (!response.success) {
      throw new Error(response.message || '获取系统统计数据失败')
    }
    return response.data as SystemStatsResponse
  }

  /**
   * 获取用户列表
   */
  static async getUserList(query?: string): Promise<{ users: AdminUser[], total: number }> {
    const response = await AdminApiService.getUserList(query)
    if (!response.success) {
      throw new Error(response.message || '获取用户列表失败')
    }
    return response.data as UserListResponse
  }

  /**
   * 更新用户状态（启用/禁用）
   */
  static async updateUserStatus(userId: string, enabled: boolean): Promise<boolean> {
    const response = await AdminApiService.updateUserStatus(userId, enabled)
    if (!response.success) {
      throw new Error(response.message || '更新用户状态失败')
    }
    return response.data === true
  }

  /**
   * 获取所有RSS源状态
   */
  static async getRssSourcesStatus(): Promise<{ sources: RssSourceStatus[], total: number }> {
    const response = await AdminApiService.getRssSourcesStatus()
    if (!response.success) {
      throw new Error(response.message || '获取RSS源状态失败')
    }
    return response.data as RssSourceStatusResponse
  }

  /**
   * 获取AI配置
   */
  static async getAiConfig(): Promise<AiConfigResponse> {
    const response = await AdminApiService.getAiConfig()
    if (!response.success) {
      throw new Error(response.message || '获取AI配置失败')
    }
    return response.data as AiConfigResponse
  }

  /**
   * 更新AI配置
   */
  static async updateAiConfig(config: AiConfigResponse): Promise<AiConfigResponse> {
    const response = await AdminApiService.updateAiConfig(config)
    if (!response.success) {
      throw new Error(response.message || '更新AI配置失败')
    }
    return response.data as AiConfigResponse
  }

  /**
   * 测试AI配置连接
   */
  static async testAiConnection(config: AiConfigResponse): Promise<{ success: boolean; message: string }> {
    const response = await AdminApiService.testAiConnection(config)
    if (!response.data) {
      return { success: false, message: response.message || '测试连接失败' }
    }
    return response.data
  }

  /**
   * 获取知识关联配置
   */
  static async getKnowledgeConfig(): Promise<KnowledgeConfigResponse> {
    const response = await AdminApiService.getKnowledgeConfig()
    if (!response.success) {
      throw new Error(response.message || '获取知识关联配置失败')
    }
    return response.data as KnowledgeConfigResponse
  }

  /**
   * 更新知识关联配置
   */
  static async updateKnowledgeConfig(config: KnowledgeConfigResponse): Promise<KnowledgeConfigResponse> {
    const response = await AdminApiService.updateKnowledgeConfig(config)
    if (!response.success) {
      throw new Error(response.message || '更新知识关联配置失败')
    }
    return response.data as KnowledgeConfigResponse
  }

  /**
   * 获取默认AI配置
   */
  static getDefaultAiConfig(): AiConfigResponse {
    return {
      defaultModel: 'glm',
      modelVersion: 'latest',
      apiUrl: '',
      apiKey: '',
      timeout: 10,
      maxTokens: 1000,
      streamResponse: true
    }
  }

  /**
   * 获取默认知识关联配置
   */
  static getDefaultKnowledgeConfig(): KnowledgeConfigResponse {
    return {
      extractPrompt: '请从以下内容中抽取重要的知识实体:\n\n{{content}}',
      relationPrompt: '请分析以下实体之间的关联关系:\n\n{{entities}}',
      summaryPrompt: '请对以下内容进行简洁摘要:\n\n{{content}}',
      similarityThreshold: 0.75,
      maxRelatedNodes: 20,
      enableAutoRelation: true
    }
  }

  /**
   * 获取AI阅读助手快捷提示词配置
   */
  static async getReaderAssistantPrompts(): Promise<ReaderAssistantPromptsResponse> {
    const response = await AdminApiService.getReaderAssistantPrompts()
    if (!response.success) {
      throw new Error(response.message || '获取AI阅读助手快捷提示词配置失败')
    }
    return response.data as ReaderAssistantPromptsResponse
  }

  /**
   * 更新AI阅读助手快捷提示词配置
   */
  static async updateReaderAssistantPrompts(prompts: ReaderAssistantPromptsResponse): Promise<ReaderAssistantPromptsResponse> {
    const response = await AdminApiService.updateReaderAssistantPrompts(prompts)
    if (!response.success) {
      throw new Error(response.message || '更新AI阅读助手快捷提示词配置失败')
    }
    return response.data as ReaderAssistantPromptsResponse
  }

  /**
   * 获取默认AI阅读助手快捷提示词配置
   */
  static getDefaultReaderAssistantPrompts(): ReaderAssistantPromptsResponse {
    return {
      quickPrompts: [
        '总结这篇文章的主要内容',
        '提取文章的关键观点',
        '解释文章中的专业术语',
        '分析文章的论证逻辑',
        '这篇文章有什么启发？'
      ]
    }
  }
} 