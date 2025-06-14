<template>
  <main class="main-content">
    <!-- 页面内容容器 -->
    <div class="content-container">
      <!-- 路由视图，带有页面切换动画 -->
      <router-view v-slot="{ Component, route }">
        <transition
          name="page"
          mode="out-in"
          @enter="onPageEnter"
          @leave="onPageLeave"
        >
          <component 
            :is="Component" 
            :key="route.path"
            class="page-component"
          />
        </transition>
      </router-view>
    </div>

    <!-- 加载指示器 -->
    <transition name="loading">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span class="loading-text">加载中...</span>
        </div>
      </div>
    </transition>

    <!-- 错误状态 -->
    <transition name="error">
      <div v-if="hasError" class="error-overlay">
        <div class="error-content">
          <i class="fas fa-exclamation-triangle error-icon"></i>
          <h3 class="error-title">页面加载失败</h3>
          <p class="error-message">{{ errorMessage }}</p>
          <button class="retry-button" @click="handleRetry">
            <i class="fas fa-redo"></i>
            重试
          </button>
        </div>
      </div>
    </transition>
  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

// 路由实例
const router = useRouter()

// 状态管理
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

// 页面进入动画回调
const onPageEnter = (el) => {
  // 添加页面进入动画类
  el.classList.add('page-enter')
  
  // 触发重排以确保动画生效
  el.offsetHeight
  
  // 移除动画类
  setTimeout(() => {
    el.classList.remove('page-enter')
  }, 300)
}

// 页面离开动画回调
const onPageLeave = (el) => {
  // 添加页面离开动画类
  el.classList.add('page-leave')
}

// 处理重试
const handleRetry = () => {
  hasError.value = false
  errorMessage.value = ''
  
  // 重新加载当前路由
  router.go(0)
}

// 监听路由错误
const handleRouteError = (error) => {
  console.error('Route error:', error)
  hasError.value = true
  errorMessage.value = error.message || '未知错误'
}

// 监听路由开始
const handleRouteStart = () => {
  isLoading.value = true
  hasError.value = false
}

// 监听路由结束
const handleRouteEnd = () => {
  isLoading.value = false
}

// 组件挂载时设置路由监听
onMounted(() => {
  // 监听路由变化
  router.beforeEach((to, from, next) => {
    handleRouteStart()
    next()
  })

  router.afterEach(() => {
    handleRouteEnd()
  })

  router.onError(handleRouteError)
})

// 组件卸载时清理
onUnmounted(() => {
  // Vue Router 会自动清理监听器
})
</script>

<style lang="scss" scoped>
.main-content {
  grid-area: content;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
  background: var(--color-bg-primary);
  overflow: hidden;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.page-component {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

// 页面切换动画
.page-enter-active,
.page-leave-active {
  transition: all var(--transition-duration) var(--transition-timing);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.page-enter-to,
.page-leave-from {
  opacity: 1;
  transform: translateY(0);
}

// 页面进入动画类
.page-enter {
  animation: pageFadeInUp 0.6s var(--transition-timing);
}

.page-leave {
  animation: pageFadeOut 0.3s var(--transition-timing);
}

@keyframes pageFadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pageFadeOut {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}

// 加载状态
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: var(--color-bg-primary);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border-primary);

  i {
    font-size: 2rem;
    color: var(--color-accent-primary);
  }

  .loading-text {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }
}

// 加载动画
.loading-enter-active,
.loading-leave-active {
  transition: all 0.3s ease;
}

.loading-enter-from,
.loading-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

// 错误状态
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.error-content {
  text-align: center;
  padding: 3rem;
  max-width: 400px;

  .error-icon {
    font-size: 3rem;
    color: var(--color-danger);
    margin-bottom: 1.5rem;
  }

  .error-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 1rem;
  }

  .error-message {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-bottom: 2rem;
    line-height: 1.5;
  }

  .retry-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--color-accent-primary);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-duration) var(--transition-timing);

    &:hover {
      background: var(--color-accent-primary-hover);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    i {
      font-size: 0.875rem;
    }
  }
}

// 错误动画
.error-enter-active,
.error-leave-active {
  transition: all 0.3s ease;
}

.error-enter-from,
.error-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

// 响应式设计
@media (max-width: 768px) {
  .main-content {
    // 移动端调整
    padding: 0;
  }

  .loading-spinner {
    padding: 1.5rem;
    margin: 1rem;
  }

  .error-content {
    padding: 2rem 1rem;
    margin: 1rem;

    .error-icon {
      font-size: 2.5rem;
    }

    .error-title {
      font-size: 1.25rem;
    }
  }
}

// 滚动条样式
.content-container {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }
}

// 焦点管理
.main-content {
  &:focus-within {
    outline: none;
  }
}

// 性能优化：使用 transform 而不是改变布局属性
.page-component {
  will-change: transform, opacity;
}

.loading-overlay,
.error-overlay {
  will-change: opacity, transform;
}
</style> 