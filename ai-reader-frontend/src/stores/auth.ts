import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { AuthApiService, type LoginRequest, type RegisterRequest, type UserInfo } from '@/api/auth'

// 用户信息接口 - 基于后端UserResponseDto
export interface User {
  id: string
  username: string
  email: string
  fullName?: string
  roles: string[]
  enabled: boolean
  createdAt: string
  displayName: string // 计算属性，用于显示
  avatar?: string // 前端扩展属性
}

// 登录凭据接口 - 适配前端表单
export interface LoginCredentials {
  email: string
  password: string
}

// 注册数据接口
export interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const isLoggedIn = ref(false)
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)

  // 计算属性
  const userDisplayName = computed(() => {
    return currentUser.value?.displayName || currentUser.value?.username || '用户'
  })

  const userAvatar = computed(() => {
    return currentUser.value?.avatar || null
  })

  const userInitials = computed(() => {
    if (currentUser.value?.displayName) {
      return currentUser.value.displayName.charAt(0).toUpperCase()
    }
    if (currentUser.value?.username) {
      return currentUser.value.username.charAt(0).toUpperCase()
    }
    return '用'
  })

  // 动作
  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    try {
      // 调用后端登录API
      const loginRequest: LoginRequest = {
        usernameOrEmail: credentials.email,
        password: credentials.password
      }
      
      const loginResponse = await AuthApiService.login(loginRequest)
      
      if (loginResponse.success && loginResponse.data) {
        // 保存令牌
        const { accessToken, refreshToken, tokenType, expiresIn } = loginResponse.data
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        localStorage.setItem('token_type', tokenType)
        localStorage.setItem('token_expires_in', expiresIn.toString())
        
        // 获取用户信息
        const userResponse = await AuthApiService.getCurrentUser()
        if (userResponse.success && userResponse.data) {
          const userInfo = userResponse.data
          const user: User = {
            id: userInfo.id,
            username: userInfo.username,
            email: userInfo.email,
            fullName: userInfo.fullName,
            roles: userInfo.roles,
            enabled: userInfo.enabled,
            createdAt: userInfo.createdAt,
            displayName: userInfo.fullName || userInfo.username,
            avatar: undefined
          }
          
          currentUser.value = user
          isLoggedIn.value = true
          
          // 保存用户信息到localStorage
          localStorage.setItem('user', JSON.stringify(user))
          localStorage.setItem('isLoggedIn', 'true')
          localStorage.setItem('userEmail', userInfo.email)
          localStorage.setItem('userRoles', JSON.stringify(userInfo.roles))
          
          // 调试日志
          console.log('🔐 Auth: Login successful')
          console.log('🔐 Auth: User info:', userInfo)
          console.log('🔐 Auth: User roles:', userInfo.roles)
          console.log('🔐 Auth: Saved to localStorage - userRoles:', JSON.stringify(userInfo.roles))
          
          // 手动触发导航数据重新加载
          try {
            const { useNavigationStore } = await import('@/stores/navigation')
            const navigationStore = useNavigationStore()
            console.log('🔐 Auth: Triggering navigation reload')
            
            // 使用nextTick确保DOM正确更新
            const { nextTick } = await import('vue')
            await nextTick()
            
            // 延迟一点确保用户数据已保存
            setTimeout(async () => {
              navigationStore.loadNavigationData()
              await nextTick()
              console.log('🔐 Auth: Navigation reload completed')
            }, 100)
          } catch (error) {
            console.error('🔐 Auth: Failed to reload navigation:', error)
          }
          
          return { success: true }
        } else {
          throw new Error('获取用户信息失败')
        }
      } else {
        throw new Error(loginResponse.message || '登录失败')
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      const errorMessage = error.message || '登录失败，请检查网络连接'
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  async function register(registerData: RegisterData) {
    if (registerData.password !== registerData.confirmPassword) {
      return { success: false, error: '两次输入的密码不一致' }
    }

    isLoading.value = true
    try {
      // 调用后端注册API
      const registerRequest: RegisterRequest = {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password
      }
      
      const registerResponse = await AuthApiService.register(registerRequest)
      
      if (registerResponse.success && registerResponse.data) {
        const userInfo = registerResponse.data
        const user: User = {
          id: userInfo.id,
          username: userInfo.username,
          email: userInfo.email,
          fullName: userInfo.fullName,
          roles: userInfo.roles,
          enabled: userInfo.enabled,
          createdAt: userInfo.createdAt,
          displayName: userInfo.fullName || userInfo.username,
          avatar: undefined
        }
        
        currentUser.value = user
        isLoggedIn.value = true
        
        // 保存到localStorage
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userEmail', registerData.email)
        localStorage.setItem('userRoles', JSON.stringify(userInfo.roles))
        
        return { success: true }
      } else {
        throw new Error(registerResponse.message || '注册失败')
      }
    } catch (error: any) {
      console.error('注册失败:', error)
      const errorMessage = error.message || '注册失败，请检查网络连接'
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    try {
      // TODO: 实际的登出API调用
      // await authApi.logout()
      
      currentUser.value = null
      isLoggedIn.value = false
      
      // 清除localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userRoles')
      
      return { success: true }
    } catch (error) {
      console.error('登出失败:', error)
      return { success: false, error: '登出失败' }
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(userData: Partial<User>) {
    if (!currentUser.value) return { success: false, error: '用户未登录' }
    
    isLoading.value = true
    try {
      // TODO: 实际的更新用户信息API调用
      // const response = await authApi.updateProfile(userData)
      
      // 模拟更新成功
      currentUser.value = { ...currentUser.value, ...userData }
      
      // 更新localStorage
      localStorage.setItem('user', JSON.stringify(currentUser.value))
      
      return { success: true }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return { success: false, error: '更新失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 初始化认证状态
  function initializeAuth() {
    const savedUser = localStorage.getItem('user')
    const savedLoginStatus = localStorage.getItem('isLoggedIn')
    
    if (savedUser && savedLoginStatus === 'true') {
      try {
        currentUser.value = JSON.parse(savedUser)
        isLoggedIn.value = true
      } catch (error) {
        console.error('恢复用户状态失败:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('isLoggedIn')
      }
    }
  }

  // 检查认证状态
  function checkAuthStatus() {
    // TODO: 向服务器验证token有效性
    return isLoggedIn.value
  }

      return {
    // 状态
    isLoggedIn,
    currentUser,
    isLoading,
    
    // 计算属性
    userDisplayName,
    userAvatar,
    userInitials,
    
    // 动作
    login,
    register,
    logout,
    updateProfile,
    initializeAuth,
    checkAuthStatus
  }
}) 