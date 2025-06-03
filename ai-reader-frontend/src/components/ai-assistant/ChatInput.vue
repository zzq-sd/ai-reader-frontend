<template>
  <div class="chat-input">
    <!-- 文件上传预览 -->
    <transition name="slide-up">
      <div v-if="uploadFiles.length > 0" class="upload-preview">
        <div class="upload-files">
          <div 
            v-for="file in uploadFiles"
            :key="file.name"
            class="upload-file-item"
          >
            <div class="file-preview">
              <div class="file-icon">
                <i :class="getFileIcon(file)"></i>
              </div>
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-size">{{ formatFileSize(file.size) }}</div>
              </div>
              <button 
                class="remove-file-btn"
                @click="removeFile(file)"
                title="移除文件"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <!-- 上传进度 -->
            <div v-if="getUploadProgress(file) < 100" class="upload-progress">
              <div 
                class="progress-bar"
                :style="{ width: getUploadProgress(file) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 输入区域 -->
    <div class="input-area">
      <!-- 工具栏 -->
      <div class="input-toolbar">
        <!-- 文件上传按钮 -->
        <button 
          class="toolbar-btn upload-btn"
          @click="triggerFileUpload"
          :disabled="disabled"
          title="上传文件 (Ctrl+U)"
        >
          <i class="fas fa-paperclip"></i>
        </button>

        <!-- 表情按钮 -->
        <div class="emoji-picker-wrapper" ref="emojiPickerRef">
          <button 
            class="toolbar-btn emoji-btn"
            @click="showEmojiPicker = !showEmojiPicker"
            :disabled="disabled"
            title="插入表情"
          >
            <i class="fas fa-smile"></i>
          </button>
          
          <!-- 表情选择器 -->
          <transition name="popup">
            <div v-if="showEmojiPicker" class="emoji-picker">
              <div class="emoji-grid">
                <button 
                  v-for="emoji in commonEmojis"
                  :key="emoji"
                  class="emoji-item"
                  @click="insertEmoji(emoji)"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>
          </transition>
        </div>

        <!-- 快捷指令按钮 -->
        <button 
          class="toolbar-btn quick-actions-btn"
          @click="toggleQuickActions"
          :disabled="disabled"
          title="快捷指令 (Ctrl+K)"
        >
          <i class="fas fa-magic"></i>
        </button>
      </div>

      <!-- 输入框容器 -->
      <div class="input-container">
        <div class="input-wrapper">
          <!-- 自适应文本框 -->
          <textarea
            ref="textareaRef"
            v-model="inputText"
            class="message-input"
            :placeholder="placeholder"
            :disabled="disabled"
            :maxlength="maxLength"
            @keydown="handleKeyDown"
            @input="handleInput"
            @paste="handlePaste"
            @focus="handleFocus"
            @blur="handleBlur"
            rows="1"
          ></textarea>

          <!-- 字符计数 -->
          <div 
            v-if="showCharCount"
            class="char-count"
            :class="{ 'char-limit-warning': isNearLimit }"
          >
            {{ inputText.length }}/{{ maxLength }}
          </div>
        </div>

        <!-- 发送按钮 -->
        <button 
          class="send-btn"
          :class="sendButtonClasses"
          @click="handleSend"
          :disabled="!canSend"
          title="发送消息 (Ctrl+Enter)"
        >
          <i v-if="disabled" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-paper-plane"></i>
        </button>
      </div>

      <!-- 输入提示 */
      <div v-if="showHints" class="input-hints">
        <div class="hint-item">
          <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 发送消息
        </div>
        <div class="hint-item">
          <kbd>Shift</kbd> + <kbd>Enter</kbd> 换行
        </div>
        <div class="hint-item">
          <kbd>Ctrl</kbd> + <kbd>K</kbd> 快捷指令
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*,application/pdf,.doc,.docx,.txt,.md"
      @change="handleFileSelect"
      style="display: none;"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useAiAssistantStore } from '@/stores/aiAssistantStore'

// Props
interface Props {
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  showCharCount?: boolean
  showHints?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '输入消息...',
  disabled: false,
  maxLength: 2000,
  showCharCount: false,
  showHints: true
})

// Emits
const emit = defineEmits<{
  sendMessage: [content: string, type: 'text' | 'file']
  toggleQuickActions: []
  fileUpload: [file: File]
  focus: []
  blur: []
}>()

// 状态管理
const aiAssistantStore = useAiAssistantStore()

// DOM引用
const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const emojiPickerRef = ref<HTMLElement>()

// 本地状态
const inputText = ref('')
const uploadFiles = ref<File[]>([])
const showEmojiPicker = ref(false)
const isFocused = ref(false)
const isComposing = ref(false)

// 表情符号
const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟',
  '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍'
]

// 计算属性
const canSend = computed(() => {
  return !props.disabled && 
         (inputText.value.trim() || uploadFiles.value.length > 0)
})

const sendButtonClasses = computed(() => ({
  'send-btn-active': canSend.value,
  'send-btn-disabled': !canSend.value
}))

const isNearLimit = computed(() => {
  return inputText.value.length > props.maxLength * 0.9
})

// 方法
const handleInput = () => {
  adjustTextareaHeight()
}

const adjustTextareaHeight = () => {
  if (!textareaRef.value) return
  
  const textarea = textareaRef.value
  textarea.style.height = 'auto'
  
  // 限制最大高度为5行
  const lineHeight = 24
  const maxHeight = lineHeight * 5
  const scrollHeight = textarea.scrollHeight
  
  textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px'
  
  // 如果内容超过最大高度，显示滚动条
  if (scrollHeight > maxHeight) {
    textarea.style.overflowY = 'auto'
  } else {
    textarea.style.overflowY = 'hidden'
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  // 处理中文输入法
  if (event.code === 'Enter' && isComposing.value) {
    return
  }
  
  // Ctrl/Cmd + Enter 发送消息
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    handleSend()
    return
  }
  
  // Shift + Enter 换行
  if (event.shiftKey && event.key === 'Enter') {
    return // 允许默认行为
  }
  
  // Enter 发送消息（可配置）
  if (event.key === 'Enter' && !event.shiftKey && aiAssistantStore.settings.autoScroll) {
    event.preventDefault()
    handleSend()
    return
  }
  
  // Ctrl/Cmd + K 快捷指令
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    emit('toggleQuickActions')
    return
  }
  
  // Ctrl/Cmd + U 文件上传
  if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
    event.preventDefault()
    triggerFileUpload()
    return
  }
  
  // Escape 关闭表情选择器
  if (event.key === 'Escape') {
    showEmojiPicker.value = false
  }
}

const handleSend = async () => {
  if (!canSend.value) return
  
  const content = inputText.value.trim()
  const files = [...uploadFiles.value]
  
  // 清空输入
  inputText.value = ''
  uploadFiles.value = []
  adjustTextareaHeight()
  
  // 发送消息
  if (content) {
    emit('sendMessage', content, 'text')
  }
  
  // 处理文件上传
  for (const file of files) {
    emit('fileUpload', file)
  }
  
  // 重新聚焦输入框
  await nextTick()
  focusInput()
}

const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault()
      const file = item.getAsFile()
      if (file) {
        addFile(file)
      }
    }
  }
}

const handleFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur')
}

const triggerFileUpload = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    for (const file of input.files) {
      addFile(file)
    }
  }
  
  // 清空文件选择
  input.value = ''
}

const addFile = (file: File) => {
  // 检查文件大小（限制为10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    alert('文件大小不能超过10MB')
    return
  }
  
  // 检查文件类型
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/markdown'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    alert('不支持的文件类型')
    return
  }
  
  uploadFiles.value.push(file)
}

const removeFile = (file: File) => {
  const index = uploadFiles.value.indexOf(file)
  if (index > -1) {
    uploadFiles.value.splice(index, 1)
  }
}

const getFileIcon = (file: File): string => {
  const type = file.type.toLowerCase()
  if (type.startsWith('image/')) return 'fas fa-image'
  if (type === 'application/pdf') return 'fas fa-file-pdf'
  if (type.includes('word') || type.includes('document')) return 'fas fa-file-word'
  if (type.startsWith('text/')) return 'fas fa-file-alt'
  return 'fas fa-file'
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getUploadProgress = (file: File): number => {
  // 这里应该从store中获取上传进度，暂时返回100
  return 100
}

const insertEmoji = (emoji: string) => {
  if (!textareaRef.value) return
  
  const textarea = textareaRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = inputText.value
  
  inputText.value = text.substring(0, start) + emoji + text.substring(end)
  
  // 恢复光标位置
  nextTick(() => {
    const newPosition = start + emoji.length
    textarea.setSelectionRange(newPosition, newPosition)
    textarea.focus()
  })
  
  showEmojiPicker.value = false
}

const toggleQuickActions = () => {
  emit('toggleQuickActions')
}

const focusInput = () => {
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
}

// 点击外部关闭表情选择器
const handleClickOutside = (event: MouseEvent) => {
  if (emojiPickerRef.value && !emojiPickerRef.value.contains(event.target as Node)) {
    showEmojiPicker.value = false
  }
}

// 中文输入法处理
const handleCompositionStart = () => {
  isComposing.value = true
}

const handleCompositionEnd = () => {
  isComposing.value = false
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  if (textareaRef.value) {
    textareaRef.value.addEventListener('compositionstart', handleCompositionStart)
    textareaRef.value.addEventListener('compositionend', handleCompositionEnd)
  }
  
  // 初始调整高度
  nextTick(() => {
    adjustTextareaHeight()
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  
  if (textareaRef.value) {
    textareaRef.value.removeEventListener('compositionstart', handleCompositionStart)
    textareaRef.value.removeEventListener('compositionend', handleCompositionEnd)
  }
})

// 监听输入文本变化
watch(inputText, () => {
  nextTick(() => {
    adjustTextareaHeight()
  })
})

// 暴露方法给父组件
defineExpose({
  focusInput,
  clearInput: () => {
    inputText.value = ''
    uploadFiles.value = []
    adjustTextareaHeight()
  }
})
</script>

<style scoped lang="scss">
.chat-input {
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-primary);
  backdrop-filter: blur(10px);
}

/* 文件上传预览 */
.upload-preview {
  padding: 16px 20px 0;
  border-bottom: 1px solid var(--color-border-primary);
}

.upload-files {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.upload-file-item {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.file-preview {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
}

.file-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.file-info {
  flex: 1;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.remove-file-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: var(--color-danger);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-danger-dark);
    transform: scale(1.1);
  }
}

.upload-progress {
  height: 3px;
  background: var(--color-bg-primary);
  position: relative;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--color-primary);
  transition: width var(--transition-speed-normal);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: shimmer 1.5s infinite;
  }
}

/* 输入区域 */
.input-area {
  padding: 16px 20px;
}

.input-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background: transparent;
      transform: none;
    }
  }
}

/* 表情选择器 */
.emoji-picker-wrapper {
  position: relative;
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  padding: 12px;
  z-index: 100;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  max-width: 280px;
}

.emoji-item {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    transform: scale(1.2);
  }
}

/* 输入容器 */
.input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.input-wrapper {
  flex: 1;
  position: relative;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border-primary);
  border-radius: 12px;
  transition: all var(--transition-speed-fast);
  
  &:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
  }
}

.message-input {
  width: 100%;
  min-height: 24px;
  max-height: 120px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  font-family: inherit;
  
  &::placeholder {
    color: var(--color-text-tertiary);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.char-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 11px;
  color: var(--color-text-tertiary);
  pointer-events: none;
  
  &.char-limit-warning {
    color: var(--color-warning);
  }
}

/* 发送按钮 */
.send-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: var(--color-text-tertiary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all var(--transition-speed-fast);
  flex-shrink: 0;
  
  &.send-btn-active {
    background: var(--color-primary);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
    
    &:hover {
      background: var(--color-primary-dark);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(var(--color-primary-rgb), 0.4);
    }
  }
  
  &.send-btn-disabled {
    cursor: not-allowed;
    
    &:hover {
      transform: none;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
}

/* 输入提示 */
.input-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-secondary);
  border-radius: 4px;
  font-size: 10px;
  font-family: inherit;
  color: var(--color-text-secondary);
}

/* 动画 */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--transition-speed-normal);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.popup-enter-active,
.popup-leave-active {
  transition: all var(--transition-speed-normal);
}

.popup-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.popup-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .input-area {
    padding: 12px 16px;
  }
  
  .input-toolbar {
    margin-bottom: 8px;
  }
  
  .toolbar-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .send-btn {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
  
  .message-input {
    padding: 10px 12px;
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  .emoji-grid {
    grid-template-columns: repeat(6, 1fr);
    max-width: 210px;
  }
  
  .emoji-item {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
  
  .input-hints {
    display: none; /* 移动端隐藏提示 */
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .chat-input {
    background: rgba(var(--color-bg-secondary-rgb), 0.95);
  }
  
  .emoji-picker {
    background: rgba(var(--color-bg-secondary-rgb), 0.95);
    border-color: rgba(var(--color-border-primary-rgb), 0.3);
  }
}
</style> 