/**
 * 认证API服务
 * 对接后端认证相关的接口
 */

import { apiClient } from './base'
import type { ApiResponse } from './types/common'

// 登录请求接口
export interface LoginRequest {
  usernameOrEmail: string
  password: string
}

// 登录响应接口
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

// 用户信息接口
export interface UserInfo {
  id: string
  username: string
  email: string
  fullName?: string
  roles: string[]
  enabled: boolean
  createdAt: string
}

// 注册请求接口
export interface RegisterRequest {
  username: string
  email: string
  password: string
}

// 认证API服务类
export class AuthApiService {
  /**
   * 用户登录
   */
  static async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
      usernameOrEmail: credentials.usernameOrEmail,
      password: credentials.password
    })
    return response.data
  }

  /**
   * 用户注册
   */
  static async register(userData: RegisterRequest): Promise<ApiResponse<UserInfo>> {
    const response = await apiClient.post<ApiResponse<UserInfo>>('/auth/register', userData)
    return response.data
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    const response = await apiClient.get<ApiResponse<UserInfo>>('/auth/me')
    return response.data
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh', null, {
      params: { refreshToken }
    })
    return response.data
  }

  /**
   * 检查用户名是否可用
   */
  static async checkUsernameAvailability(username: string): Promise<ApiResponse<{ available: boolean }>> {
    const response = await apiClient.get<ApiResponse<{ available: boolean }>>('/auth/check-username', {
      params: { username }
    })
    return response.data
  }

  /**
   * 检查邮箱是否可用
   */
  static async checkEmailAvailability(email: string): Promise<ApiResponse<{ available: boolean }>> {
    const response = await apiClient.get<ApiResponse<{ available: boolean }>>('/auth/check-email', {
      params: { email }
    })
    return response.data
  }
}

export default AuthApiService 