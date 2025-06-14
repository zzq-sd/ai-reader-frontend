import { apiClient as api } from './base'
import axios from 'axios'
import { SSE } from 'sse.js'

export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'assistant'
  type: 'text' | 'code'
  timestamp: Date
}

export interface ChatRequest {
  message: string
  sessionId?: string
  history?: Array<Map<string, string>>
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

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * AI聊天API服务
 */
export const aiChatApi = {
  /**
   * 流式聊天 - 使用Server-Sent Events
   */
  streamChat(request: ChatRequest, onMessage: (content: string) => void, onComplete: () => void, onError: (error: string) => void): () => void {
    const url = `${baseURL}/ai/chat/stream`
    
    console.log('发起流式聊天请求:', url)
    const requestBody = {
      ...request,
      sessionId: request.sessionId || crypto.randomUUID(),
    }
    console.log('流式聊天请求内容:', requestBody)
    
    let eventSource: EventSource | null = null
    let isCompleted = false

    try {
      // 使用fetch发起POST请求获取流式响应
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(requestBody)
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
        let buffer = ''

        function readStream(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              if (!isCompleted) {
                isCompleted = true
                onComplete()
              }
              return
            }

            buffer += decoder.decode(value, { stream: true })
            
            // 修正：按标准的SSE消息分隔符('\n\n')分割，这是最健壮的方式
            const messages = buffer.split('\n\n');
            
            // 最后一个元素可能是未接收完整的消息，将其放回缓冲区
            buffer = messages.pop() || ''

            for (const message of messages) {
                // 每条消息都应该以 "data:" 开头
                if (message.startsWith('data:')) {
                    const jsonData = message.substring(5).trim();
                    if (jsonData) {
                        try {
                            const parsed = JSON.parse(jsonData);
                            
                            if (parsed.done === true) {
                                if (!isCompleted) {
                                    isCompleted = true;
                                    onComplete();
                                }
                                return; // 找到结束信号，停止处理
                            }

                            if (parsed.content) {
                                onMessage(parsed.content);
                            }
                        } catch (e) {
                            console.error('无法解析SSE JSON数据:', jsonData, e);
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