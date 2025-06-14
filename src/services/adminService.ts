import { AdminApiService } from '@/api/admin'
import type { 
  SystemStatsResponse, 
  UserListResponse, 
  RssSourceStatusResponse,
  AiConfigResponse,
  KnowledgeConfigResponse,
  ReaderAssistantPromptsResponse
} from '@/api/types/admin'

/**
 * 管理员服务
 * 封装管理员相关的业务逻辑
 */
export class AdminService {
  /**
   * 获取系统统计数据
   */
  static async getSystemStats(): Promise<SystemStatsResponse> {
    const response = await AdminApiService.getSystemStats()
    if (response.success) {
      return response.data
    }
    throw new Error(response.message)
  }

  /**
   * 获取用户列表
   */
  static async getUserList(query?: string): Promise<UserListResponse> {
    const response = await AdminApiService.getUserList(query)
    if (response.success) {
      return response.data
    }
    throw new Error(response.message)
  }

  /**
   * 更新用户状态
   */
  static async updateUserStatus(userId: string, enabled: boolean): Promise<boolean> {
    const response = await AdminApiService.updateUserStatus(userId, enabled)
    if (response.success) {
      return response.data === true
    }
    throw new Error(response.message)
  }

  /**
   * 获取RSS源状态
   */
  static async getRssSourcesStatus(): Promise<RssSourceStatusResponse> {
    const response = await AdminApiService.getRssSourcesStatus()
    if (response.success) {
      return response.data
    }
    throw new Error(response.message)
  }

  /**
   * 获取AI配置
   */
  static async getAiConfig(): Promise<AiConfigResponse> {
    const response = await AdminApiService.getAiConfig()
    if (response.success) {
      return response.data
    }
    throw new Error(response.message)
  }

  /**
   * 获取默认AI配置
   */
  static getDefaultAiConfig(): AiConfigResponse {
    return {
      defaultModel: 'zhipuai',
      modelVersion: 'GLM-4-Flash',
      apiUrl: 'https://open.bigmodel.cn/api/paas',
      apiKey: '',
      timeout: 10,
      maxTokens: 2000,
      streamResponse: true,
      temperature: 0.7
    }
  }

  /**
   * 获取默认阅读助手提示词配置
   */
  static getDefaultReaderAssistantPrompts(): ReaderAssistantPromptsResponse {
    return {
      quickPrompts: [
        '请总结这篇文章的主要观点',
        '请解释这段内容中的技术细节',
        '请分析这篇文章的论据是否合理',
        '请用更简单的语言解释这个概念',
        '请列出这篇文章中的关键点'
      ]
    }
  }

  /**
   * 更新AI配置
   */
  static async updateAiConfig(config: AiConfigResponse): Promise<AiConfigResponse> {
    const response = await AdminApiService.updateAiConfig(config)
    if (response.success) {
      return response.data
    }
    throw new Error(response.message)
  }

  /**
   * 测试AI连接
   */
  static async testAiConnection(config: AiConfigResponse): Promise<{ success: boolean; message: string }> {
    const response = await AdminApiService.testAiConnection(config)
    if (response.success) {
      return response.data ?? { success: false, message: '无响应数据' }
    }
    throw new Error(response.message)
  }

  /**
   * 获取知识关联配置
   */
  static async getKnowledgeConfig(): Promise<KnowledgeConfigResponse> {
    const response = await AdminApiService.getKnowledgeConfig()
    if (response.success) {
      return response.data
    }
    throw new Error(response.message)
  }

  /**
   * 更新知识关联配置
   */
  static async updateKnowledgeConfig(config: KnowledgeConfigResponse): Promise<KnowledgeConfigResponse> {
    const response = await AdminApiService.updateKnowledgeConfig(config)
    if (response.success) {
      return response.data
    }
    throw new Error(response.message)
  }

  /**
   * 获取AI阅读助手提示词配置
   */
  static async getReaderAssistantPrompts(): Promise<ReaderAssistantPromptsResponse> {
    const response = await AdminApiService.getReaderAssistantPrompts()
    if (response.success) {
      return response.data
    }
    throw new Error(response.message)
  }

  /**
   * 更新AI阅读助手提示词配置
   */
  static async updateReaderAssistantPrompts(prompts: ReaderAssistantPromptsResponse): Promise<ReaderAssistantPromptsResponse> {
    const response = await AdminApiService.updateReaderAssistantPrompts(prompts)
    if (response.success) {
      return response.data
    }
    throw new Error(response.message)
  }
} 