<template>
  <div class="login-container">
    <!-- 背景动画 -->
    <div class="background-pattern"></div>
    
    <div class="form-container">
      <div class="form-card">
        <!-- Logo 部分 -->
        <div class="logo-section">
          <div class="logo">
            <i class="fas fa-brain"></i>AI阅读器
          </div>
          <div class="subtitle">智能RSS与知识管理</div>
        </div>
        
        <!-- 登录表单 -->
        <form @submit.prevent="handleSubmit" class="login-form">
          <!-- 错误信息显示 -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <!-- 邮箱或用户名 -->
          <div class="form-group">
            <label class="form-label" for="email">邮箱地址或用户名</label>
            <input 
              type="text" 
              id="email" 
              v-model="formData.email"
              class="form-input" 
              placeholder="输入邮箱地址或用户名" 
              required
              :disabled="isLoading"
            >
          </div>
          
          <!-- 密码 -->
          <div class="form-group">
            <label class="form-label" for="password">密码</label>
            <div class="password-field">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                id="password" 
                v-model="formData.password"
                class="form-input" 
                placeholder="输入您的密码" 
                required
                :disabled="isLoading"
              >
              <button 
                type="button" 
                class="password-toggle" 
                @click="togglePassword"
                title="显示/隐藏密码"
                :disabled="isLoading"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>

          <!-- 记住密码和忘记密码 -->
          <div class="form-options">
            <div class="checkbox-group">
              <input 
                type="checkbox" 
                id="remember" 
                v-model="formData.rememberMe"
                class="checkbox-input"
                :disabled="isLoading"
              >
              <label for="remember" class="checkbox-label">记住我</label>
            </div>
            <a href="#" @click.prevent="forgotPassword" class="forgot-password">忘记密码？</a>
          </div>
          
          <!-- 提交按钮 -->
          <button 
            type="submit" 
            class="login-button" 
            :class="{ success: isSuccess }"
            :disabled="isLoading"
          >
            <div v-if="isLoading" class="loading-spinner"></div>
            <span id="buttonText">{{ buttonText }}</span>
          </button>
        </form>

        <!-- 分割线 -->
        <div class="divider"><span>或</span></div>
        
        <!-- 注册链接 -->
        <div class="register-link">
          还没有账户？ <a href="#" @click.prevent="goToRegister">立即创建</a>
        </div>
      </div>
    </div>

    <!-- 成功提示 -->
    <Transition name="toast">
      <div v-if="showSuccessToast" class="success-toast">
        <i class="fas fa-check-circle"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, type LoginCredentials } from '@/stores/auth'

// 路由和状态管理
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const isLoading = computed(() => authStore.isLoading)
const isSuccess = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const showSuccessToast = ref(false)
const toastMessage = ref('')

// 表单数据
const formData = reactive<LoginCredentials & { rememberMe: boolean }>({
  email: '',
  password: '',
  rememberMe: false
})

// 计算属性
const buttonText = computed(() => {
  if (isSuccess.value) return '登录成功！'
  if (isLoading.value) return '登录中...'
  return '安全登录'
})

// 方法
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const showError = (message: string) => {
  errorMessage.value = message
  
  // 添加错误动画
  const errorElement = document.querySelector('.error-message') as HTMLElement
  if (errorElement) {
    errorElement.classList.remove('shake-animation')
    void errorElement.offsetWidth // 强制重排
    errorElement.classList.add('shake-animation')
  }
}

const hideError = () => {
  errorMessage.value = ''
}

const validateForm = (): boolean => {
  hideError()
  
  // 检查必填字段
  if (!formData.email || !formData.password) {
    showError('请输入邮箱地址/用户名和密码。')
    return false
  }

  // 基本格式验证：如果包含@符号，则验证邮箱格式
  if (formData.email.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showError('请输入有效的邮箱地址。')
      return false
    }
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  hideError()
  
  try {
    const result = await authStore.login({
      email: formData.email,
      password: formData.password
    })
    
    if (result.success) {
      isSuccess.value = true
      
      // 保存登录信息到localStorage (登录成功时已由store处理)
      // localStorage.setItem('userEmail', formData.email)
      
      // 按钮成功动画
      const loginButton = document.querySelector('.login-button') as HTMLElement
      if (loginButton) {
        loginButton.style.backgroundColor = 'var(--color-positive)'
        loginButton.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.03)' },
          { transform: 'scale(1)' }
        ], { duration: 300, easing: 'ease-in-out' })
      }
      
      // 显示成功提示
      toastMessage.value = '登录成功！欢迎回来'
      showSuccessToast.value = true
      
      setTimeout(() => {
        showSuccessToast.value = false
      }, 3000)
      
      // 延迟跳转到文章列表页
      setTimeout(() => {
        router.push('/articles')
      }, 800)
      
    } else {
      showError(result.error || '登录失败，请检查邮箱/用户名和密码。')
      // 触发输入框震动提示
      const emailInput = document.getElementById('email') as HTMLElement
      const passwordInput = document.getElementById('password') as HTMLElement
      if (emailInput && passwordInput) {
        emailInput.style.animation = 'shake 0.3s ease-out'
        passwordInput.style.animation = 'shake 0.3s ease-out'
        setTimeout(() => {
          emailInput.style.animation = ''
          passwordInput.style.animation = ''
        }, 300)
      }
    }
  } catch (error) {
    showError('网络错误，请稍后重试。')
  }
}

const goToRegister = () => {
  router.push('/register')
}

const forgotPassword = () => {
  // TODO: 实现忘记密码功能
  showError('忘记密码功能暂未开放')
}

// 生命周期
onMounted(() => {
  // 页面加载动画
  const formCard = document.querySelector('.form-card') as HTMLElement
  if (formCard) {
    formCard.classList.add('card-entry-animation')
  }
})
</script>

<style scoped lang="scss">
.login-container {
  margin: 0;
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  background-color: #0A0A0C;
  color: #E8E8ED;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 背景动画 */
.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 15% 85%, rgba(123, 97, 255, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 85% 15%, rgba(59, 130, 246, 0.06) 0%, transparent 40%);
  z-index: 0;
  animation: subtleShine 20s linear infinite alternate;
}

@keyframes subtleShine {
  0% { 
    opacity: 0.7; 
    transform: scale(1); 
  }
  100% { 
    opacity: 1; 
    transform: scale(1.05); 
  }
}

/* 表单容器 */
.form-container {
  width: 100%;
  max-width: 380px;
  padding: 24px;
  position: relative;
  z-index: 1;
}

.form-card {
  background-color: #101014;
  border: 1px solid #2A2B30;
  border-radius: 16px;
  padding: 32px 28px;
  box-shadow: 
    0 20px 50px rgba(0,0,0,0.4), 
    0 0 15px rgba(123, 97, 255, 0.1);
  opacity: 0;
  transform: translateY(20px) scale(0.98);
  
  &.card-entry-animation {
    animation: cardEntry 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  }
}

@keyframes cardEntry {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Logo 部分 */
.logo-section {
  text-align: center;
  margin-bottom: 28px;
}

.logo {
  font-size: 1.8rem;
  font-weight: 700;
  color: #E8E8ED;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    color: #7B61FF;
    margin-right: 8px;
    font-size: 1.6rem;
  }
}

.subtitle {
  color: #9B9CA3;
  font-size: 15px;
}

/* 表单样式 */
.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #9B9CA3;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  color: #E8E8ED;
  background-color: #18191D;
  border: 1px solid #2A2B30;
  border-radius: 6px;
  transition: border-color 0.15s ease-out, box-shadow 0.15s ease-out, background-color 0.15s ease-out;
  outline: none;
  
  &::placeholder {
    color: #4B4C52;
  }
  
  &:focus {
    border-color: #7B61FF;
    background-color: #101014;
    box-shadow: 0 0 0 3px rgba(123, 97, 255, 0.15);
  }
  
  &:invalid {
    border-color: #EF4444;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

/* 密码字段 */
.password-field {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #4B4C52;
  cursor: pointer;
  padding: 4px;
  transition: color 0.15s ease-out;
  font-size: 14px;
  
  &:hover:not(:disabled) {
    color: #E8E8ED;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-input {
  margin-right: 6px;
  width: 14px;
  height: 14px;
  accent-color: #7B61FF;
  cursor: pointer;
}

.checkbox-label {
  font-size: 13px;
  color: #9B9CA3;
  cursor: pointer;
}

.forgot-password {
  font-size: 13px;
  color: #7B61FF;
  text-decoration: none;
  transition: color 0.15s ease-out;
  
  &:hover {
    color: #6A52E0;
  }
}

/* 提交按钮 */
.login-button {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background-color: #7B61FF;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease-out, transform 0.15s ease-out, box-shadow 0.25s ease-out;
  margin-bottom: 20px;
  box-shadow: 0 2px 6px rgba(123, 97, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover:not(:disabled) {
    background-color: #6A52E0;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(123, 97, 255, 0.25);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(123, 97, 255, 0.15);
  }
  
  &:disabled {
    background-color: #18191D;
    color: #4B4C52;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  &.success {
    background-color: #10B981;
  }
}

/* 加载动画 */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 分割线 */
.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: #2A2B30;
  }
  
  span {
    padding: 0 12px;
    font-size: 11px;
    color: #4B4C52;
    text-transform: uppercase;
  }
}

/* 注册链接 */
.register-link {
  text-align: center;
  font-size: 13px;
  color: #9B9CA3;
  
  a {
    color: #7B61FF;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s ease-out;
    
    &:hover {
      color: #6A52E0;
      text-decoration: underline;
    }
  }
}

/* 错误信息 */
.error-message {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #FCA5A5;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 16px;
  
  &.shake-animation {
    animation: shake 0.3s ease-out;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  50% { transform: translateX(3px); }
  75% { transform: translateX(-3px); }
}

/* 成功提示 */
.success-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #10B981;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* Toast 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .form-container {
    padding: 16px;
  }
  
  .form-card {
    padding: 24px 20px;
  }
  
  .logo {
    font-size: 1.6rem;
    
    i {
      font-size: 1.4rem;
    }
  }
  
  .subtitle {
    font-size: 14px;
  }
}

/* CSS变量定义 */
:root {
  --color-positive: #10B981;
}
</style> 