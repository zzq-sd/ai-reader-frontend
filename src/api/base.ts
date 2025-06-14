/**
 * API基础配置
 * 包含axios实例、请求/响应拦截器、JWT认证处理
 */

import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios'
import type { ApiResponse, ErrorResponse } from './types/common'

// API基础URL - 开发环境使用代理，生产环境使用环境变量
const BASE_URL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080')

// 创建axios实例
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加JWT令牌
apiClient.interceptors.request.use(
  (config) => {
    // 从localStorage获取JWT令牌
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳用于调试
    config.metadata = { startTime: new Date() }
    
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理响应和错误
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 计算响应时间
    const endTime = new Date()
    const startTime = response.config.metadata?.startTime
    if (startTime) {
      const duration = endTime.getTime() - startTime.getTime()
      console.log(`API调用耗时: ${duration}ms - ${response.config.url}`)
    }

    // 检查业务层面的错误
    const { data } = response
    if (data && data.success === false) {
      const errorMessage = data.message || '请求失败'
      console.error('业务错误:', errorMessage)
      return Promise.reject(new Error(errorMessage))
    }

    return response
  },
  async (error: AxiosError<ErrorResponse>) => {
    const { response, config } = error

    // 处理网络错误
    if (!response) {
      console.error('网络错误:', error.message)
      return Promise.reject(new Error('网络连接失败，请检查网络状态'))
    }

    // 处理401未授权错误 - 尝试刷新令牌
    if (response.status === 401 && !config?.url?.includes('/auth/')) {
      try {
        await refreshToken()
        // 重试原请求
        return apiClient(config!)
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        handleAuthError()
        return Promise.reject(new Error('登录已过期，请重新登录'))
      }
    }

    // 处理其他HTTP错误
    const errorMessage = response.data?.message || getHttpErrorMessage(response.status)
    console.error(`API错误 ${response.status}:`, errorMessage)
    
    return Promise.reject(new Error(errorMessage))
  }
)

// 刷新令牌
async function refreshToken(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) {
    throw new Error('无刷新令牌')
  }

  try {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, null, {
      params: { refreshToken }
    })

    const { data } = response.data
    if (data?.accessToken) {
      localStorage.setItem('access_token', data.accessToken)
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken)
      }
    } else {
      throw new Error('刷新令牌响应格式错误')
    }
  } catch (error) {
    // 清除本地令牌
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    throw error
  }
}

// 处理认证错误
function handleAuthError(): void {
  // 清除本地令牌
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  
  // 跳转到登录页（避免循环重定向）
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login'
  }
}

// 获取HTTP错误消息
function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return '请求参数错误'
    case 401:
      return '未授权访问'
    case 403:
      return '权限不足'
    case 404:
      return '请求的资源不存在'
    case 500:
      return '服务器内部错误'
    case 502:
      return '网关错误'
    case 503:
      return '服务暂时不可用'
    default:
      return `请求失败 (${status})`
  }
}

// 扩展axios配置类型以支持metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: Date
    }
  }
}

export default apiClient 