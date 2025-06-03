<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 模态框头部 -->
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-plus-circle"></i>
          添加RSS源
        </h3>
        <button class="close-btn" @click="handleClose">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 模态框内容 -->
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- RSS源URL -->
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-link"></i>
              RSS源地址 *
            </label>
            <div class="input-with-validation">
              <input
                v-model="formData.url"
                type="url"
                class="form-input"
                :class="{ 'error': errors.url, 'success': validUrl }"
                placeholder="请输入RSS源地址，例如：https://example.com/feed.xml"
                @input="handleUrlInput"
                @blur="validateUrl"
                required
              />
              <div class="validation-indicator">
                <i v-if="isValidating" class="fas fa-spinner fa-spin"></i>
                <i v-else-if="validUrl" class="fas fa-check text-success"></i>
                <i v-else-if="errors.url" class="fas fa-exclamation-triangle text-error"></i>
              </div>
            </div>
            <div v-if="errors.url" class="error-message">
              {{ errors.url }}
            </div>
            <div v-if="urlSuggestion" class="url-suggestion">
              <span>建议使用：</span>
              <button type="button" @click="useUrlSuggestion" class="suggestion-btn">
                {{ urlSuggestion }}
              </button>
            </div>
          </div>

          <!-- 自定义名称 -->
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-tag"></i>
              自定义名称
            </label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              :placeholder="detectedInfo.title || '将自动从RSS源获取'"
              @input="handleNameInput"
            />
            <div class="form-hint">
              留空将自动使用RSS源的标题
            </div>
          </div>

          <!-- 分类选择 -->
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-folder"></i>
              分类 *
            </label>
            <div class="category-grid">
              <button
                v-for="category in categories"
                :key="category.value"
                type="button"
                class="category-item"
                :class="{ 'active': formData.category === category.value }"
                @click="selectCategory(category.value)"
              >
                <i :class="category.icon" :style="{ color: category.color }"></i>
                <span>{{ category.label }}</span>
              </button>
            </div>
            <div v-if="errors.category" class="error-message">
              {{ errors.category }}
            </div>
          </div>

          <!-- 优先级设置 -->
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-star"></i>
              优先级
            </label>
            <div class="priority-options">
              <label
                v-for="priority in priorities"
                :key="priority.value"
                class="priority-option"
                :class="{ 'active': formData.priority === priority.value }"
              >
                <input
                  v-model="formData.priority"
                  type="radio"
                  :value="priority.value"
                  class="priority-radio"
                />
                <div class="priority-content">
                  <i :class="priority.icon" :style="{ color: priority.color }"></i>
                  <span>{{ priority.label }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- 检测到的信息预览 -->
          <div v-if="detectedInfo.title || detectedInfo.description" class="detected-info">
            <h4 class="detected-title">
              <i class="fas fa-info-circle"></i>
              检测到的RSS源信息
            </h4>
            <div class="info-preview">
              <div v-if="detectedInfo.title" class="info-item">
                <span class="info-label">标题：</span>
                <span class="info-value">{{ detectedInfo.title }}</span>
              </div>
              <div v-if="detectedInfo.description" class="info-item">
                <span class="info-label">描述：</span>
                <span class="info-value">{{ detectedInfo.description }}</span>
              </div>
              <div v-if="detectedInfo.link" class="info-item">
                <span class="info-label">网站：</span>
                <a :href="detectedInfo.link" target="_blank" class="info-link">
                  {{ detectedInfo.link }}
                  <i class="fas fa-external-link-alt"></i>
                </a>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- 模态框底部 -->
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleClose"
        >
          取消
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!canSubmit || isSubmitting"
          @click="handleSubmit"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-plus"></i>
          {{ isSubmitting ? '添加中...' : '添加RSS源' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { AddFeedData, FeedCategory } from '../../api/rss.d'
import { detectFeedUrl, getCategoryInfo } from '../../api/rss.js'

// Emits 定义
interface Emits {
  (e: 'close'): void
  (e: 'confirm', data: AddFeedData): void
}

const emit = defineEmits<Emits>()

// 响应式状态
const formData = ref<AddFeedData>({
  url: '',
  name: '',
  category: 'tech' as FeedCategory,
  priority: 'medium'
})

const errors = ref({
  url: '',
  category: ''
})

const isValidating = ref(false)
const isSubmitting = ref(false)
const validUrl = ref(false)
const urlSuggestion = ref('')
const detectedInfo = ref({
  title: '',
  description: '',
  link: ''
})

// 分类选项
const categories = ref([
  { value: 'tech' as FeedCategory, label: '技术博客', icon: 'fas fa-code', color: '#3B82F6' },
  { value: 'news' as FeedCategory, label: '新闻资讯', icon: 'fas fa-newspaper', color: '#EF4444' },
  { value: 'design' as FeedCategory, label: '设计灵感', icon: 'fas fa-palette', color: '#8B5CF6' },
  { value: 'business' as FeedCategory, label: '商业财经', icon: 'fas fa-chart-line', color: '#10B981' },
  { value: 'lifestyle' as FeedCategory, label: '生活方式', icon: 'fas fa-heart', color: '#F59E0B' },
  { value: 'entertainment' as FeedCategory, label: '娱乐资讯', icon: 'fas fa-film', color: '#EC4899' },
  { value: 'science' as FeedCategory, label: '科学研究', icon: 'fas fa-flask', color: '#06B6D4' },
  { value: 'other' as FeedCategory, label: '其他', icon: 'fas fa-folder', color: '#6B7280' }
])

// 优先级选项
const priorities = ref([
  { value: 'high', label: '高优先级', icon: 'fas fa-arrow-up', color: '#EF4444' },
  { value: 'medium', label: '普通', icon: 'fas fa-minus', color: '#6B7280' },
  { value: 'low', label: '低优先级', icon: 'fas fa-arrow-down', color: '#10B981' }
])

// 计算属性
const canSubmit = computed(() => {
  return formData.value.url && 
         formData.value.category && 
         validUrl.value && 
         !Object.values(errors.value).some(error => error)
})

// 方法
const handleUrlInput = async () => {
  errors.value.url = ''
  validUrl.value = false
  urlSuggestion.value = ''
  
  if (formData.value.url.length < 10) return
  
  // 防抖处理
  if (validateTimeout.value !== null) {
    clearTimeout(validateTimeout.value)
  }
  validateTimeout.value = setTimeout(validateUrl, 800)
}

const validateTimeout = ref<number | null>(null)

const validateUrl = async () => {
  if (!formData.value.url) {
    errors.value.url = '请输入RSS源地址'
    return
  }

  isValidating.value = true
  
  try {
    const result = await detectFeedUrl(formData.value.url)
    
    if (result.isValid) {
      validUrl.value = true
      
      if (result.feedUrl && result.feedUrl !== formData.value.url) {
        urlSuggestion.value = result.feedUrl
      }
      
      if (result.title || result.description || result.homepageUrl) {
        detectedInfo.value = {
          title: result.title || '',
          description: result.description || '',
          link: result.homepageUrl || ''
        }
      }
    } else {
      errors.value.url = result.error || '无效的RSS源地址'
      validUrl.value = false
    }
  } catch (error) {
    errors.value.url = '验证RSS源时出错，请检查地址是否正确'
    validUrl.value = false
  } finally {
    isValidating.value = false
  }
}

const useUrlSuggestion = () => {
  formData.value.url = urlSuggestion.value
  urlSuggestion.value = ''
  validateUrl()
}

const handleNameInput = () => {
  // 名称输入处理逻辑
}

const selectCategory = (category: FeedCategory) => {
  formData.value.category = category
  errors.value.category = ''
}

const handleSubmit = async () => {
  // 最终验证
  if (!formData.value.url) {
    errors.value.url = '请输入RSS源地址'
    return
  }
  
  if (!formData.value.category) {
    errors.value.category = '请选择分类'
    return
  }

  if (!canSubmit.value) return

  isSubmitting.value = true
  
  try {
    const submitData: AddFeedData = {
      url: formData.value.url,
      name: formData.value.name || detectedInfo.value.title || '',
      category: formData.value.category,
      priority: formData.value.priority
    }
    
    emit('confirm', submitData)
  } catch (error) {
    console.error('提交表单时出错:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  handleClose()
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleClose()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// 清理
const cleanup = () => {
  document.removeEventListener('keydown', handleKeydown)
  if (validateTimeout.value) {
    clearTimeout(validateTimeout.value)
  }
}

// 组件卸载时清理
defineExpose({
  cleanup
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-l);
  box-shadow: var(--shadow-2xl);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  animation: slideInUp 0.3s ease-out;

  [data-theme="dark"] & {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

// 模态框头部
.modal-header {
  padding: calc(var(--spacing-unit) * 6);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);

  i {
    color: var(--primary-color);
  }
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius-s);
  transition: all var(--transition-duration);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }
}

// 模态框内容
.modal-body {
  padding: calc(var(--spacing-unit) * 6);
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: calc(var(--spacing-unit) * 6);
}

.form-label {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: calc(var(--spacing-unit) * 2);

  i {
    color: var(--primary-color);
    width: 16px;
  }
}

.input-with-validation {
  position: relative;
}

.form-input {
  width: 100%;
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 10) calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all var(--transition-duration);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-color-light);
  }

  &.error {
    border-color: var(--error-color);
    
    &:focus {
      box-shadow: 0 0 0 3px var(--error-color-light);
    }
  }

  &.success {
    border-color: var(--success-color);
    
    &:focus {
      box-shadow: 0 0 0 3px var(--success-color-light);
    }
  }

  &::placeholder {
    color: var(--text-disabled);
  }
}

.validation-indicator {
  position: absolute;
  right: calc(var(--spacing-unit) * 3);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;

  .text-success {
    color: var(--success-color);
  }

  .text-error {
    color: var(--error-color);
  }
}

.error-message {
  margin-top: calc(var(--spacing-unit) * 2);
  font-size: 0.75rem;
  color: var(--error-color);
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1);

  &::before {
    content: '⚠';
    font-size: 0.875rem;
  }
}

.form-hint {
  margin-top: calc(var(--spacing-unit) * 2);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.url-suggestion {
  margin-top: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 3);
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  border-radius: var(--border-radius-s);
  font-size: 0.875rem;
  color: var(--info-color);
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
}

.suggestion-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  text-decoration: underline;
  cursor: pointer;
  font-size: inherit;
  padding: 0;

  &:hover {
    color: var(--primary-color-dark);
  }
}

// 分类网格
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: calc(var(--spacing-unit) * 3);
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  cursor: pointer;
  transition: all var(--transition-duration);
  font-size: 0.75rem;

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-color-hover);
    transform: translateY(-1px);
  }

  &.active {
    background: var(--primary-color-light);
    border-color: var(--primary-color);
    color: var(--primary-color);
    font-weight: 500;
  }

  i {
    font-size: 1.25rem;
  }
}

// 优先级选项
.priority-options {
  display: flex;
  gap: calc(var(--spacing-unit) * 3);
}

.priority-option {
  flex: 1;
  cursor: pointer;
}

.priority-radio {
  display: none;
}

.priority-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  transition: all var(--transition-duration);
  font-size: 0.875rem;

  .priority-option:hover & {
    background: var(--bg-tertiary);
    border-color: var(--border-color-hover);
  }

  .priority-option.active & {
    background: var(--primary-color-light);
    border-color: var(--primary-color);
    color: var(--primary-color);
    font-weight: 500;
  }
}

// 检测信息
.detected-info {
  margin-top: calc(var(--spacing-unit) * 6);
  padding: calc(var(--spacing-unit) * 4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
}

.detected-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 calc(var(--spacing-unit) * 3) 0;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);

  i {
    color: var(--info-color);
  }
}

.info-preview {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: calc(var(--spacing-unit) * 2);
  font-size: 0.75rem;
}

.info-label {
  color: var(--text-secondary);
  min-width: 40px;
  font-weight: 500;
}

.info-value {
  color: var(--text-primary);
  flex: 1;
  word-break: break-word;
}

.info-link {
  color: var(--primary-color);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1);

  &:hover {
    text-decoration: underline;
  }

  i {
    font-size: 0.6rem;
  }
}

// 模态框底部
.modal-footer {
  padding: calc(var(--spacing-unit) * 6);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--spacing-unit) * 3);
}

// 动画
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 95vh;
    margin: calc(var(--spacing-unit) * 2);
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: calc(var(--spacing-unit) * 4);
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .priority-options {
    flex-direction: column;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }
}
</style> 