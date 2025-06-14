<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 模态框头部 -->
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-edit"></i>
          编辑RSS源
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
                placeholder="请输入RSS源地址"
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
          </div>

          <!-- 自定义名称 -->
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-tag"></i>
              RSS源名称 *
            </label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              :class="{ 'error': errors.name }"
              placeholder="请输入RSS源名称"
              required
            />
            <div v-if="errors.name" class="error-message">
              {{ errors.name }}
            </div>
          </div>

          <!-- 描述 -->
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-file-alt"></i>
              描述
            </label>
            <textarea
              v-model="formData.description"
              class="form-textarea"
              placeholder="RSS源的简短描述（可选）"
              rows="3"
            ></textarea>
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

          <!-- 更新频率 -->
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-clock"></i>
              更新频率
            </label>
            <div class="frequency-selector">
              <select
                v-model="formData.updateFrequency"
                class="form-select"
              >
                <option value="1">每小时</option>
                <option value="2">每2小时</option>
                <option value="6">每6小时</option>
                <option value="12">每12小时</option>
                <option value="24">每天</option>
                <option value="168">每周</option>
              </select>
            </div>
          </div>

          <!-- 标签管理 -->
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-tags"></i>
              标签
            </label>
            <div class="tags-input">
              <div class="tag-list">
                <span
                  v-for="(tag, index) in formData.tags"
                  :key="index"
                  class="tag-item"
                >
                  {{ tag }}
                  <button
                    type="button"
                    class="tag-remove"
                    @click="removeTag(index)"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </span>
              </div>
              <div class="tag-input-container">
                <input
                  v-model="newTag"
                  type="text"
                  class="tag-input"
                  placeholder="输入标签后按回车添加"
                  @keyup.enter="addTag"
                  @keyup.space="addTag"
                />
              </div>
            </div>
            <div class="form-hint">
              标签可以帮助你更好地组织和搜索RSS源
            </div>
          </div>

          <!-- 启用状态 -->
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-power-off"></i>
              状态设置
            </label>
            <div class="switch-container">
              <label class="switch">
                <input
                  v-model="formData.isEnabled"
                  type="checkbox"
                  class="switch-input"
                />
                <span class="switch-slider"></span>
              </label>
              <span class="switch-label">
                {{ formData.isEnabled ? '启用' : '禁用' }}
              </span>
            </div>
            <div class="form-hint">
              禁用后将不会自动获取该RSS源的更新
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
          <i v-else class="fas fa-save"></i>
          {{ isSubmitting ? '保存中...' : '保存更改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

// Props 定义
interface Props {
  feed: any // 使用any暂时避免类型错误
}

const props = defineProps<Props>()

// Emits 定义
interface Emits {
  (e: 'close'): void
  (e: 'confirm', data: any): void
}

const emit = defineEmits<Emits>()

// 响应式状态
const formData = ref({
  url: '',
  name: '',
  description: '',
  category: 'tech',
  priority: 'medium',
  updateFrequency: 24,
  tags: [] as string[],
  isEnabled: true
})

const errors = ref({
  url: '',
  name: '',
  category: ''
})

const isValidating = ref(false)
const isSubmitting = ref(false)
const validUrl = ref(true)
const newTag = ref('')

// 分类选项
const categories = ref([
  { value: 'tech', label: '技术博客', icon: 'fas fa-code', color: '#3B82F6' },
  { value: 'news', label: '新闻资讯', icon: 'fas fa-newspaper', color: '#EF4444' },
  { value: 'design', label: '设计灵感', icon: 'fas fa-palette', color: '#8B5CF6' },
  { value: 'business', label: '商业财经', icon: 'fas fa-chart-line', color: '#10B981' },
  { value: 'lifestyle', label: '生活方式', icon: 'fas fa-heart', color: '#F59E0B' },
  { value: 'entertainment', label: '娱乐资讯', icon: 'fas fa-film', color: '#EC4899' },
  { value: 'science', label: '科学研究', icon: 'fas fa-flask', color: '#06B6D4' },
  { value: 'other', label: '其他', icon: 'fas fa-folder', color: '#6B7280' }
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
         formData.value.name && 
         formData.value.category && 
         validUrl.value && 
         !Object.values(errors.value).some(error => error)
})

// 监听props变化，初始化表单数据
watch(() => props.feed, (newFeed) => {
  if (newFeed) {
    formData.value = {
      url: newFeed.url || '',
      name: newFeed.name || '',
      description: newFeed.description || '',
      category: newFeed.category || 'tech',
      priority: newFeed.priority || 'medium',
      updateFrequency: newFeed.updateFrequency || 24,
      tags: newFeed.tags ? [...newFeed.tags] : [],
      isEnabled: newFeed.isEnabled !== undefined ? newFeed.isEnabled : true
    }
    validUrl.value = true
  }
}, { immediate: true })

// 方法
const handleUrlInput = async () => {
  errors.value.url = ''
  validUrl.value = false
  
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
    // 这里应该调用验证API，暂时简单验证URL格式
    const urlPattern = /^https?:\/\/.+/
    if (urlPattern.test(formData.value.url)) {
      validUrl.value = true
    } else {
      errors.value.url = '请输入有效的URL地址'
      validUrl.value = false
    }
  } catch (error) {
    errors.value.url = '验证RSS源时出错'
    validUrl.value = false
  } finally {
    isValidating.value = false
  }
}

const selectCategory = (category: string) => {
  formData.value.category = category
  errors.value.category = ''
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  formData.value.tags.splice(index, 1)
}

const handleSubmit = async () => {
  // 验证表单
  if (!formData.value.url) {
    errors.value.url = '请输入RSS源地址'
    return
  }
  
  if (!formData.value.name) {
    errors.value.name = '请输入RSS源名称'
    return
  }
  
  if (!formData.value.category) {
    errors.value.category = '请选择分类'
    return
  }

  if (!canSubmit.value) return

  isSubmitting.value = true
  
  try {
    const submitData = {
      url: formData.value.url,
      name: formData.value.name,
      description: formData.value.description,
      category: formData.value.category,
      priority: formData.value.priority,
      updateFrequency: formData.value.updateFrequency,
      tags: formData.value.tags,
      isEnabled: formData.value.isEnabled
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
  max-width: 700px;
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

.form-textarea {
  width: 100%;
  padding: calc(var(--spacing-unit) * 3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all var(--transition-duration);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-color-light);
  }

  &::placeholder {
    color: var(--text-disabled);
  }
}

.form-select {
  width: 100%;
  padding: calc(var(--spacing-unit) * 3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-duration);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-color-light);
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

// 标签管理
.tags-input {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 2);
  background: var(--bg-primary);
  min-height: 80px;
  transition: all var(--transition-duration);

  &:focus-within {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-color-light);
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 2);
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1);
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  background: var(--primary-color-light);
  color: var(--primary-color);
  border-radius: var(--border-radius-s);
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity var(--transition-duration);

  &:hover {
    opacity: 1;
  }

  i {
    font-size: 0.6rem;
  }
}

.tag-input-container {
  flex: 1;
  min-width: 120px;
}

.tag-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.875rem;
  padding: calc(var(--spacing-unit) * 1) 0;

  &::placeholder {
    color: var(--text-disabled);
  }
}

// 开关组件
.switch-container {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color);
  transition: all var(--transition-duration);
  border-radius: 26px;

  &:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: all var(--transition-duration);
    border-radius: 50%;
    box-shadow: var(--shadow-s);
  }

  .switch-input:checked + & {
    background-color: var(--primary-color);
  }

  .switch-input:checked + &:before {
    transform: translateX(24px);
  }
}

.switch-label {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
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