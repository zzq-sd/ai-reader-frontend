<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 模态框头部 -->
      <div class="modal-header">
        <h3 class="modal-title" :class="titleClass">
          <i :class="titleIcon"></i>
          {{ title }}
        </h3>
        <button class="close-btn" @click="handleClose">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 模态框内容 -->
      <div class="modal-body">
        <div class="confirm-content">
          <div class="confirm-icon" :class="iconClass">
            <i :class="confirmIcon"></i>
          </div>
          
          <div class="confirm-message">
            <p class="message-text" v-html="message"></p>
            
            <!-- 额外信息 -->
            <div v-if="details" class="message-details">
              <ul>
                <li v-for="(detail, index) in details" :key="index">
                  {{ detail }}
                </li>
              </ul>
            </div>
            
            <!-- 警告信息 -->
            <div v-if="warning" class="warning-box">
              <i class="fas fa-exclamation-triangle"></i>
              <span>{{ warning }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 模态框底部 -->
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleClose"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          class="btn"
          :class="confirmButtonClass"
          :disabled="isProcessing"
          @click="handleConfirm"
        >
          <i v-if="isProcessing" class="fas fa-spinner fa-spin"></i>
          <i v-else :class="confirmButtonIcon"></i>
          {{ isProcessing ? processingText : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Props 定义
interface Props {
  title?: string
  message: string
  details?: string[]
  warning?: string
  confirmText?: string
  cancelText?: string
  confirmType?: 'primary' | 'danger' | 'warning' | 'success'
  processingText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作',
  confirmText: '确认',
  cancelText: '取消',
  confirmType: 'primary',
  processingText: '处理中...'
})

// Emits 定义
interface Emits {
  (e: 'close'): void
  (e: 'confirm'): void
}

const emit = defineEmits<Emits>()

// 响应式状态
const isProcessing = ref(false)

// 计算属性
const titleClass = computed(() => {
  return {
    'text-danger': props.confirmType === 'danger',
    'text-warning': props.confirmType === 'warning',
    'text-success': props.confirmType === 'success',
    'text-primary': props.confirmType === 'primary'
  }
})

const titleIcon = computed(() => {
  switch (props.confirmType) {
    case 'danger':
      return 'fas fa-exclamation-triangle'
    case 'warning':
      return 'fas fa-exclamation-circle'
    case 'success':
      return 'fas fa-check-circle'
    default:
      return 'fas fa-question-circle'
  }
})

const iconClass = computed(() => {
  return {
    'icon-danger': props.confirmType === 'danger',
    'icon-warning': props.confirmType === 'warning',
    'icon-success': props.confirmType === 'success',
    'icon-primary': props.confirmType === 'primary'
  }
})

const confirmIcon = computed(() => {
  switch (props.confirmType) {
    case 'danger':
      return 'fas fa-trash-alt'
    case 'warning':
      return 'fas fa-exclamation-triangle'
    case 'success':
      return 'fas fa-check'
    default:
      return 'fas fa-info-circle'
  }
})

const confirmButtonClass = computed(() => {
  switch (props.confirmType) {
    case 'danger':
      return 'btn-danger'
    case 'warning':
      return 'btn-warning'
    case 'success':
      return 'btn-success'
    default:
      return 'btn-primary'
  }
})

const confirmButtonIcon = computed(() => {
  switch (props.confirmType) {
    case 'danger':
      return 'fas fa-trash-alt'
    case 'warning':
      return 'fas fa-exclamation-triangle'
    case 'success':
      return 'fas fa-check'
    default:
      return 'fas fa-check'
  }
})

// 方法
const handleConfirm = async () => {
  isProcessing.value = true
  
  try {
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 500))
    emit('confirm')
  } catch (error) {
    console.error('确认操作时出错:', error)
  } finally {
    isProcessing.value = false
  }
}

const handleClose = () => {
  if (!isProcessing.value) {
    emit('close')
  }
}

const handleOverlayClick = () => {
  handleClose()
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleClose()
  } else if (event.key === 'Enter' && !isProcessing.value) {
    handleConfirm()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// 清理
const cleanup = () => {
  document.removeEventListener('keydown', handleKeydown)
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
  max-width: 480px;
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
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);

  &.text-danger {
    color: var(--error-color);
  }

  &.text-warning {
    color: var(--warning-color);
  }

  &.text-success {
    color: var(--success-color);
  }

  &.text-primary {
    color: var(--primary-color);
  }

  i {
    font-size: 1rem;
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
}

.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: calc(var(--spacing-unit) * 4);
}

.confirm-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;

  &.icon-primary {
    background: var(--primary-color-light);
    color: var(--primary-color);
  }

  &.icon-danger {
    background: var(--error-bg);
    color: var(--error-color);
  }

  &.icon-warning {
    background: var(--warning-bg);
    color: var(--warning-color);
  }

  &.icon-success {
    background: var(--success-bg);
    color: var(--success-color);
  }
}

.confirm-message {
  flex: 1;
}

.message-text {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--text-primary);
  margin: 0 0 calc(var(--spacing-unit) * 3) 0;
}

.message-details {
  margin-bottom: calc(var(--spacing-unit) * 4);

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    background: var(--bg-secondary);
    border-radius: var(--border-radius-s);
    padding: calc(var(--spacing-unit) * 3);
  }

  li {
    font-size: 0.75rem;
    color: var(--text-secondary);
    padding: calc(var(--spacing-unit) * 1) 0;
    border-bottom: 1px solid var(--border-color);

    &:last-child {
      border-bottom: none;
    }

    &::before {
      content: '•';
      color: var(--primary-color);
      margin-right: calc(var(--spacing-unit) * 2);
      font-weight: bold;
    }
  }
}

.warning-box {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 3);
  background: var(--warning-bg);
  border: 1px solid var(--warning-border);
  border-radius: var(--border-radius-s);
  font-size: 0.75rem;
  color: var(--warning-color);

  i {
    color: var(--warning-color);
    font-size: 0.875rem;
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

// 按钮变体
.btn-danger {
  background: var(--error-color);
  color: white;
  border-color: var(--error-color);

  &:hover:not(:disabled) {
    background: var(--error-color-dark);
    border-color: var(--error-color-dark);
  }

  &:focus {
    box-shadow: 0 0 0 3px var(--error-color-light);
  }
}

.btn-warning {
  background: var(--warning-color);
  color: white;
  border-color: var(--warning-color);

  &:hover:not(:disabled) {
    background: var(--warning-color-dark);
    border-color: var(--warning-color-dark);
  }

  &:focus {
    box-shadow: 0 0 0 3px var(--warning-color-light);
  }
}

.btn-success {
  background: var(--success-color);
  color: white;
  border-color: var(--success-color);

  &:hover:not(:disabled) {
    background: var(--success-color-dark);
    border-color: var(--success-color-dark);
  }

  &:focus {
    box-shadow: 0 0 0 3px var(--success-color-light);
  }
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
    margin: calc(var(--spacing-unit) * 2);
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: calc(var(--spacing-unit) * 4);
  }

  .confirm-content {
    flex-direction: column;
    text-align: center;
  }

  .confirm-icon {
    align-self: center;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style> 