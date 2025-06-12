import { apiClient as api } from './base'
import axios from 'axios'

export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'assistant'
  type: 'text' | 'code'
  timestamp: Date
}

export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  response?: string
  error?: string
  fallback?: string
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  message: string
  test_response_length?: number
}

/**
 * AI聊天API服务
 */
export const aiChatApi = {
  /**
   * 普通聊天 - 直接使用axios避免通用拦截器的干扰
   */
  async chat(message: string): Promise<ChatResponse> {
    try {
      const baseURL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
      const response = await axios.post<ChatResponse>(`${baseURL}/ai/chat/message`, {
        message
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('AI聊天请求失败:', error)
      return {
        error: '网络请求失败，请检查网络连接'
      }
    }
  },

  /**
   * 流式聊天 - 使用Server-Sent Events
   */
  streamChat(message: string, onMessage: (content: string) => void, onComplete: () => void, onError: (error: string) => void): () => void {
    const baseURL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
    const url = `${baseURL}/ai/chat/stream`
    
    console.log('发起流式聊天请求:', url)
    console.log('流式聊天请求内容:', { message })
    
    let eventSource: EventSource | null = null
    let isCompleted = false

    try {
      // 创建POST请求体
      const requestBody = JSON.stringify({ message })
      
      // 使用fetch发起POST请求获取流式响应
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: requestBody
      })
      .then(response => {
        // 记录响应状态和头信息
        console.log('流式聊天响应状态:', response.status, response.statusText)
        console.log('流式聊天响应头:', {
          contentType: response.headers.get('Content-Type'),
          contentLength: response.headers.get('Content-Length')
        })
        
        if (!response.ok) {
          const statusText = response.statusText || `HTTP ${response.status}`;
          throw new Error(`${statusText}`)
        }

        if (!response.body) {
          throw new Error('Response body is null')
        }

        // 检查响应类型，确保是SSE
        const contentType = response.headers.get('Content-Type')
        if (!contentType || !contentType.includes('text/event-stream')) {
          // 尝试读取非SSE响应内容
          return response.text().then(text => {
            console.error('非SSE响应内容:', text)
            try {
              // 尝试解析JSON
              const data = JSON.parse(text)
              throw new Error(data.message || data.error || '服务器返回了非SSE响应')
            } catch (parseError) {
              // 如果无法解析JSON，直接返回文本
              throw new Error(`服务器返回了非SSE响应: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`)
            }
          })
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        function readStream(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              if (!isCompleted) {
                isCompleted = true
                onComplete()
              }
              return
            }

            const chunk = decoder.decode(value)
            console.log('收到流式响应片段:', chunk)
            
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6) // 移除 "data: " 前缀
                
                if (data === '[DONE]') {
                  if (!isCompleted) {
                    isCompleted = true
                    onComplete()
                  }
                  return
                }

                if (data.trim() && !data.startsWith('{')) {
                  // 普通文本内容
                  onMessage(data)
                } else if (data.startsWith('{')) {
                  // JSON格式的错误消息
                  try {
                    const errorData = JSON.parse(data)
                    if (errorData.error) {
                      onError(errorData.error)
                      return
                    }
                  } catch (e) {
                    // 如果解析失败，当作普通文本处理
                    onMessage(data)
                  }
                }
              }
            }

            return readStream()
          })
        }

        return readStream()
      })
      .catch(error => {
        console.error('流式聊天请求失败:', error)
        if (!isCompleted) {
          onError(error.message || '流式聊天连接失败')
        }
      })

    } catch (error) {
      console.error('流式聊天初始化失败:', error)
      onError('无法初始化流式聊天连接')
    }

    // 返回取消函数
    return () => {
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
      isCompleted = true
    }
  },

  /**
   * 健康检查 - 直接使用axios避免通用拦截器的干扰
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const baseURL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
      const requestUrl = `${baseURL}/ai/chat/health`
      console.log('AI健康检查请求URL:', requestUrl)
      const response = await axios.get<HealthCheckResponse>(requestUrl, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('AI助手健康检查失败:', error)
      return {
        status: 'unhealthy',
        message: '无法连接到AI助手服务'
      }
    }
  }
} 