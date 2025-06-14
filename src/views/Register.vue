<template>
  <div class="register-container">
    <!-- 背景动画 -->
    <div class="background-pattern"></div>
    
    <div class="form-container">
      <div class="form-card">
        <!-- Logo 部分 -->
        <div class="logo-section">
          <div class="logo">
            <i class="fas fa-brain"></i>AI阅读器
          </div>
          <div class="subtitle">创建您的智能账户</div>
        </div>
        
        <!-- 注册表单 -->
        <form @submit.prevent="handleSubmit" class="register-form">
          <!-- 错误信息显示 -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <!-- 用户名 -->
          <div class="form-group">
            <label class="form-label" for="username">用户名</label>
            <input 
              type="text" 
              id="username" 
              v-model="formData.username"
              class="form-input" 
              placeholder="设置一个用户名" 
              required
              :disabled="isLoading"
            >
          </div>
          
          <!-- 邮箱 -->
          <div class="form-group">
            <label class="form-label" for="email">邮箱地址</label>
            <input 
              type="email" 
              id="email" 
              v-model="formData.email"
              class="form-input" 
              placeholder="you@example.com" 
              required
              :disabled="isLoading"
            >
          </div>
          
          <!-- 密码 -->
          <div class="form-group">
            <label class="form-label" for="password">设置密码</label>
            <div class="password-field">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                id="password" 
                v-model="formData.password"
                class="form-input" 
                placeholder="至少8位字符" 
                required
                :disabled="isLoading"
              >
              <button 
                type="button" 
                class="password-toggle" 
                @click="togglePassword('password')"
                title="显示/隐藏密码"
                :disabled="isLoading"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>

          <!-- 确认密码 -->
          <div class="form-group">
            <label class="form-label" for="confirmPassword">确认密码</label>
            <div class="password-field">
              <input 
                :type="showConfirmPassword ? 'text' : 'password'" 
                id="confirmPassword" 
                v-model="formData.confirmPassword"
                class="form-input" 
                placeholder="再次输入密码" 
                required
                :disabled="isLoading"
              >
              <button 
                type="button" 
                class="password-toggle" 
                @click="togglePassword('confirmPassword')"
                title="显示/隐藏密码"
                :disabled="isLoading"
              >
                <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
          
          <!-- 服务条款 -->
          <div class="terms-text">
            创建账户即表示您同意我们的 
            <a href="#" @click.prevent="openTerms">服务条款</a> 和 
            <a href="#" @click.prevent="openPrivacy">隐私政策</a>。
          </div>
          
          <!-- 提交按钮 -->
          <button 
            type="submit" 
            class="submit-button" 
            :class="{ success: isSuccess }"
            :disabled="isLoading"
          >
            <div v-if="isLoading" class="loading-spinner"></div>
            <span class="button-text">{{ buttonText }}</span>
          </button>
        </form>
        
        <!-- 登录链接 -->
        <div class="login-link">
          已有账户？ 
          <a href="#" @click.prevent="goToLogin">立即登录</a>
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
import { useAuthStore, type RegisterData } from '@/stores/auth'

// 路由和状态管理
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const isLoading = computed(() => authStore.isLoading)
const isSuccess = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const errorMessage = ref('')
const showSuccessToast = ref(false)
const toastMessage = ref('')

// 表单数据
const formData = reactive<RegisterData>({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 计算属性
const buttonText = computed(() => {
  if (isSuccess.value) return '注册成功！'
  if (isLoading.value) return '创建中...'
  return '创建账户'
})

// 方法
const togglePassword = (field: 'password' | 'confirmPassword') => {
  if (field === 'password') {
    showPassword.value = !showPassword.value
  } else {
    showConfirmPassword.value = !showConfirmPassword.value
  }
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
  if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
    showError('所有字段均为必填项。')
    return false
  }

  // 检查密码长度
  if (formData.password.length < 8) {
    showError('密码至少需要8位字符。')
    return false
  }
  
  // 检查密码一致性
  if (formData.password !== formData.confirmPassword) {
    showError('两次输入的密码不一致。')
    
    // 密码字段抖动动画
    const passwordFields = document.querySelectorAll('#password, #confirmPassword')
    passwordFields.forEach(field => {
      (field as HTMLElement).style.animation = 'shake 0.3s ease-out'
      setTimeout(() => {
        (field as HTMLElement).style.animation = ''
      }, 300)
    })
    
    return false
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    showError('请输入有效的邮箱地址。')
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  hideError()
  
  try {
    const result = await authStore.register(formData)
    
    if (result.success) {
      isSuccess.value = true
      
      // 按钮成功动画
      const submitButton = document.querySelector('.submit-button') as HTMLElement
      if (submitButton) {
        submitButton.style.backgroundColor = 'var(--color-positive)'
        submitButton.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.03)' },
          { transform: 'scale(1)' }
        ], { duration: 300, easing: 'ease-in-out' })
      }
      
      // 显示成功提示
      toastMessage.value = '注册成功！即将跳转到文章列表页'
      showSuccessToast.value = true
      
      setTimeout(() => {
        showSuccessToast.value = false
      }, 3000)
      
      // 延迟跳转到文章列表页
      setTimeout(() => {
        router.push('/articles')
      }, 1200)
      
    } else {
      showError(result.error || '注册失败，邮箱可能已被使用或服务器错误。')
    }
  } catch (error) {
    showError('网络错误，请稍后重试。')
  }
}

const goToLogin = () => {
  router.push('/login')
}

const openTerms = () => {
  // 打开服务条款
  window.open('/terms', '_blank')
}

const openPrivacy = () => {
  // 打开隐私政策
  window.open('/privacy', '_blank')
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
.register-container {
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
  max-width: 400px;
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
  margin-bottom: 24px;
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
.register-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 18px;
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

/* 服务条款 */
.terms-text {
  font-size: 12px;
  color: #9B9CA3;
  text-align: center;
  margin: 16px 0;
  line-height: 1.4;
  
  a {
    color: #7B61FF;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

/* 提交按钮 */
.submit-button {
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
  margin: 8px 0 16px;
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

/* 登录链接 */
.login-link {
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