<template>
  <div class="chat-header">
    <!-- AI助手信息 -->
    <div class="ai-info">
      <div class="ai-avatar">
        <div class="avatar-container">
          <i class="fas fa-robot"></i>
          <!-- 状态指示器 -->
          <div 
            class="status-indicator"
            :class="statusClass"
            :title="statusText"
          ></div>
        </div>
      </div>
      
      <div class="ai-details">
        <h3 class="ai-name">AI阅读助手</h3>
        <div class="ai-status">
          <span class="status-text" :class="statusClass">
            {{ statusText }}
          </span>
          <!-- 输入指示器 -->
          <div v-if="isTyping" class="typing-indicator">
            <span class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span class="typing-text">正在输入...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮组 -->
    <div class="header-actions">
      <!-- 连接状态按钮 -->
      <button 
        class="action-btn connection-btn"
        :class="connectionStatus.status"
        @click="handleConnectionToggle"
        :title="connectionTooltip"
      >
        <i :class="connectionIcon"></i>
      </button>

      <!-- 新建对话 -->
      <button 
        class="action-btn"
        @click="handleNewChat"
        title="新建对话 (Ctrl+N)"
      >
        <i class="fas fa-plus"></i>
      </button>

      <!-- 清空对话 -->
      <button 
        class="action-btn"
        @click="handleClearChat"
        title="清空对话"
        :disabled="!hasMessages"
      >
        <i class="fas fa-trash-alt"></i>
      </button>

      <!-- 导出对话 -->
      <button 
        class="action-btn"
        @click="handleExport"
        title="导出对话"
        :disabled="!hasMessages"
      >
        <i class="fas fa-download"></i>
      </button>

      <!-- 设置按钮 -->
      <button 
        class="action-btn settings-btn"
        @click="handleToggleSettings"
        title="设置"
      >
        <i class="fas fa-cog"></i>
      </button>

      <!-- 更多操作 -->
      <div class="dropdown" ref="dropdownRef">
        <button 
          class="action-btn dropdown-toggle"
          @click="showDropdown = !showDropdown"
          title="更多操作"
        >
          <i class="fas fa-ellipsis-v"></i>
        </button>
        
        <transition name="dropdown">
          <div v-if="showDropdown" class="dropdown-menu">
            <button @click="handleFullscreen" class="dropdown-item">
              <i class="fas fa-expand"></i>
              <span>全屏模式</span>
            </button>
            <button @click="handleMinimize" class="dropdown-item">
              <i class="fas fa-window-minimize"></i>
              <span>最小化</span>
            </button>
            <div class="dropdown-divider"></div>
            <button @click="handleHelp" class="dropdown-item">
              <i class="fas fa-question-circle"></i>
              <span>帮助</span>
            </button>
            <button @click="handleFeedback" class="dropdown-item">
              <i class="fas fa-comment"></i>
              <span>反馈</span>
            </button>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAiAssistantStore } from '@/stores/aiAssistantStore'
import type { ConnectionStatus } from '@/types/aiAssistant'

// Props
interface Props {
  isTyping: boolean
  connectionStatus: ConnectionStatus
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  clearChat: []
  toggleSettings: []
  newChat: []
  export: []
  fullscreen: []
  minimize: []
}>()

// 状态管理
const aiAssistantStore = useAiAssistantStore()

// 本地状态
const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement>()

// 计算属性
const hasMessages = computed(() => aiAssistantStore.hasMessages)

const statusClass = computed(() => {
  const status = props.connectionStatus.status
  return {
    'status-connected': status === 'connected',
    'status-connecting': status === 'connecting',
    'status-disconnected': status === 'disconnected',
    'status-error': status === 'error'
  }
})

const statusText = computed(() => {
  switch (props.connectionStatus.status) {
    case 'connected':
      return '在线'
    case 'connecting':
      return '连接中...'
    case 'disconnected':
      return '离线'
    case 'error':
      return '连接错误'
    default:
      return '未知状态'
  }
})

const connectionIcon = computed(() => {
  switch (props.connectionStatus.status) {
    case 'connected':
      return 'fas fa-wifi'
    case 'connecting':
      return 'fas fa-spinner fa-spin'
    case 'disconnected':
      return 'fas fa-wifi-slash'
    case 'error':
      return 'fas fa-exclamation-triangle'
    default:
      return 'fas fa-question'
  }
})

const connectionTooltip = computed(() => {
  const status = props.connectionStatus
  let tooltip = `连接状态: ${statusText.value}`
  
  if (status.lastConnected) {
    tooltip += `\n最后连接: ${status.lastConnected.toLocaleString()}`
  }
  
  if (status.errorMessage) {
    tooltip += `\n错误信息: ${status.errorMessage}`
  }
  
  return tooltip
})

// 方法
const handleConnectionToggle = () => {
  if (props.connectionStatus.status === 'connected') {
    aiAssistantStore.disconnect()
  } else {
    aiAssistantStore.connect()
  }
}

const handleNewChat = () => {
  aiAssistantStore.createSession()
  emit('newChat')
}

const handleClearChat = () => {
  emit('clearChat')
}

const handleToggleSettings = () => {
  emit('toggleSettings')
}

const handleExport = () => {
  emit('export')
}

const handleFullscreen = () => {
  showDropdown.value = false
  emit('fullscreen')
}

const handleMinimize = () => {
  showDropdown.value = false
  emit('minimize')
}

const handleHelp = () => {
  showDropdown.value = false
  // 打开帮助页面或模态框
  window.open('/help', '_blank')
}

const handleFeedback = () => {
  showDropdown.value = false
  // 打开反馈页面或模态框
  window.open('/feedback', '_blank')
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

// 键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  // Ctrl/Cmd + N 新建对话
  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault()
    handleNewChat()
  }
  
  // Escape 关闭下拉菜单
  if (event.key === 'Escape') {
    showDropdown.value = false
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped lang="scss">
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-primary);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 10;
}

/* AI信息区域 */
.ai-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  position: relative;
}

.avatar-container {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  position: relative;
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.3);
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--color-bg-secondary);
  
  &.status-connected {
    background: var(--color-success);
    box-shadow: 0 0 0 2px rgba(var(--color-success-rgb), 0.3);
  }
  
  &.status-connecting {
    background: var(--color-warning);
    animation: pulse 1.5s infinite;
  }
  
  &.status-disconnected {
    background: var(--color-text-tertiary);
  }
  
  &.status-error {
    background: var(--color-danger);
    animation: pulse 1s infinite;
  }
}

.ai-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ai-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.status-text {
  &.status-connected {
    color: var(--color-success);
  }
  
  &.status-connecting {
    color: var(--color-warning);
  }
  
  &.status-disconnected {
    color: var(--color-text-tertiary);
  }
  
  &.status-error {
    color: var(--color-danger);
  }
}

/* 输入指示器 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-secondary);
}

.typing-dots {
  display: flex;
  gap: 2px;
  
  span {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--color-primary);
    animation: typing 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
    &:nth-child(3) { animation-delay: 0s; }
  }
}

.typing-text {
  font-size: 11px;
}

/* 操作按钮组 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
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
  font-size: 14px;
  transition: all var(--transition-speed-fast);
  position: relative;
  
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

.connection-btn {
  &.connected {
    color: var(--color-success);
  }
  
  &.connecting {
    color: var(--color-warning);
  }
  
  &.error {
    color: var(--color-danger);
  }
}

.settings-btn {
  &:hover {
    transform: translateY(-1px) rotate(90deg);
  }
}

/* 下拉菜单 */
.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  min-width: 160px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  overflow: hidden;
  z-index: 1000;
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  text-align: left;
  transition: background-color var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
  }
  
  i {
    width: 16px;
    color: var(--color-text-secondary);
  }
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border-primary);
  margin: 4px 0;
}

/* 动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 下拉菜单动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--transition-speed-normal);
  transform-origin: top right;
}

.dropdown-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-header {
    padding: 12px 16px;
  }
  
  .ai-name {
    font-size: 14px;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
  
  .header-actions {
    gap: 4px;
  }
}

/* 毛玻璃效果优化 */
.chat-header {
  background: rgba(var(--color-bg-secondary-rgb), 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(var(--color-border-primary-rgb), 0.2);
}

.dropdown-menu {
  background: rgba(var(--color-bg-secondary-rgb), 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--color-border-primary-rgb), 0.2);
}
</style> 