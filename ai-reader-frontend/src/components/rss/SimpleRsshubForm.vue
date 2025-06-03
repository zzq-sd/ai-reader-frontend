<template>
  <div class="simple-rsshub-form">
    <div class="form-section">
      <div class="form-group">
        <label class="form-label">RSSHub路由 <span class="required">*</span></label>
        <input
          v-model="route"
          type="text"
          class="form-input"
          placeholder="/zhihu/daily"
        />
        <p class="form-hint">输入RSSHub路由，例如: /zhihu/daily, /weibo/user/2803301701</p>
      </div>
    </div>

    <div class="form-section">
      <div class="form-group">
        <label class="form-label">源名称</label>
        <input
          v-model="name"
          type="text"
          class="form-input"
          placeholder="自动获取或手动输入"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">分类</label>
        <select v-model="category" class="form-input form-select">
          <option value="">选择分类</option>
          <option value="tech">技术开发</option>
          <option value="news">新闻资讯</option>
          <option value="design">设计创意</option>
          <option value="business">商业财经</option>
          <option value="lifestyle">生活方式</option>
          <option value="entertainment">娱乐休闲</option>
          <option value="science">科学科技</option>
          <option value="other">其他</option>
        </select>
      </div>
    </div>

    <div class="actions-section">
      <button 
        class="btn btn-secondary"
        @click="resetForm"
        :disabled="adding"
      >
        <AppIcon :icon="ICONS.ACTION.RESET" :size="ICON_SIZES.SM" />
        重置
      </button>
      
      <button 
        class="btn btn-primary"
        @click="addRsshubSource"
        :disabled="!route || adding"
      >
        <AppIcon 
          v-if="adding"
          :icon="ICONS.NOTIFICATION.LOADING" 
          :size="ICON_SIZES.SM" 
          :spin="true"
        />
        <AppIcon 
          v-else
          :icon="ICONS.RSS.ADD" 
          :size="ICON_SIZES.SM"
        />
        {{ adding ? '添加中...' : '添加RSSHub源' }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ICONS, ICON_SIZES } from '@/constants/icons'
import AppIcon from '@/components/common/AppIcon.vue'
import { apiClient } from '@/api/base'
import type { ApiResponse } from '@/api/types/common'
import type { RssSource } from '@/api/types/rss'

// 表单数据
const route = ref('')
const name = ref('')
const category = ref('')

// 状态
const adding = ref(false)

// 添加RSSHub源
const addRsshubSource = async () => {
  if (!route.value) {
    return
  }
  
  adding.value = true
  try {
    // 确保路由以/开头
    let finalRoute = route.value
    if (!finalRoute.startsWith('/')) {
      finalRoute = '/' + finalRoute
    }
    
    // 直接发送到后端处理
    const response = await apiClient.post<ApiResponse<RssSource>>('/feeds/rsshub', {
      route: finalRoute,
      name: name.value,
      category: category.value
    })
    
    // 触发事件
    emit('source-added', response.data.data!)
    
    // 重置表单
    resetForm()
  } catch (error) {
    console.error('添加RSSHub源失败:', error)
  } finally {
    adding.value = false
  }
}

// 重置表单
const resetForm = () => {
  route.value = ''
  name.value = ''
  category.value = ''
}

// 定义事件
const emit = defineEmits<{
  (e: 'source-added', source: RssSource): void
}>()
</script>

<style lang="scss" scoped>
.simple-rsshub-form {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 6);
  padding: calc(var(--spacing-unit) * 6);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-m);
}

.form-section {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 6);
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  
  .required {
    color: #EF4444;
  }
}

.form-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: calc(var(--spacing-unit) * 1) 0 0 0;
}

.form-input {
  padding: calc(var(--spacing-unit) * 3);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color var(--transition-speed-fast);
  
  &:focus {
    border-color: var(--color-accent-primary);
  }
  
  &::placeholder {
    color: var(--color-text-disabled);
  }
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B6B70' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right calc(var(--spacing-unit) * 2) center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  padding-right: calc(var(--spacing-unit) * 8);
}

.actions-section {
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--spacing-unit) * 3);
  padding-top: calc(var(--spacing-unit) * 4);
  border-top: 1px solid var(--color-border-primary);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 4);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--border-radius-s);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  text-decoration: none;
  
  &.btn-primary {
    background: var(--color-accent-primary);
    color: white;
    border-color: var(--color-accent-primary);
    
    &:hover:not(:disabled) {
      background: #6B46C1;
      transform: translateY(-1px);
    }
  }
  
  &.btn-secondary {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border-color: var(--color-border-primary);
    
    &:hover:not(:disabled) {
      background: var(--color-bg-hover);
      border-color: var(--color-border-secondary);
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
}

@media (max-width: 768px) {
  .actions-section {
    flex-direction: column;
  }
}
</style> 