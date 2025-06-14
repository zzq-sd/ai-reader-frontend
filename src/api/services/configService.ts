/**
 * 配置服务类
 * 提供系统配置的公共访问服务
 */

import { apiClient } from '../base'
import type { ApiResponse } from '../types/common'
import type { ReaderAssistantPromptsResponse } from '../types/admin'

/**
 * 配置服务类
 */
export class ConfigService {
  /**
   * 获取AI阅读助手快捷提示词配置
   */
  static async getReaderAssistantPrompts(): Promise<ReaderAssistantPromptsResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ReaderAssistantPromptsResponse>>('/api/config/reader-assistant-prompts')
      if (!response.data.success) {
        throw new Error(response.data.message || '获取AI阅读助手快捷提示词配置失败')
      }
      return response.data.data as ReaderAssistantPromptsResponse
    } catch (error) {
      console.error('获取AI阅读助手快捷提示词配置失败:', error)
      // 出错时返回默认配置
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
} 