<template>
  <div class="message-list" ref="messageListRef">
    <!-- 消息容器 -->
    <div class="messages-container" ref="messagesContainerRef">
      <!-- 空状态 -->
      <div v-if="!hasMessages && !loading" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-comments"></i>
        </div>
        <h3 class="empty-title">开始对话</h3>
        <p class="empty-description">
          您好！我是您的AI阅读助手。<br>
          我可以帮您总结文章、解释概念、翻译文本等。
        </p>
        <div class="quick-start-tips">
          <div class="tip-item">
            <i class="fas fa-lightbulb"></i>
            <span>试试问我："总结这篇文章"</span>
          </div>
          <div class="tip-item">
            <i class="fas fa-language"></i>
            <span>或者："翻译这段文字"</span>
          </div>
          <div class="tip-item">
            <i class="fas fa-question-circle"></i>
            <span>还可以："解释这个概念"</span>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div v-else class="messages">
        <transition-group name="message" tag="div">
          <MessageBubble
            v-for="message in messages"
            :key="message.id"
            :message="message"
            :show-avatar="shouldShowAvatar(message)"
            :show-timestamp="shouldShowTimestamp(message)"
            @action="handleMessageAction"
            @retry="handleRetry"
          />
        </transition-group>

        <!-- AI输入指示器 -->
        <transition name="fade">
          <div v-if="isTyping" class="typing-message">
            <MessageBubble
              :message="typingMessage"
              :show-avatar="true"
              :show-timestamp="false"
              :is-typing="true"
            />
          </div>
        </transition>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <span class="loading-text">正在处理...</span>
      </div>
    </div>

    <!-- 滚动到底部按钮 -->
    <transition name="slide-up">
      <button
        v-if="showScrollButton"
        class="scroll-to-bottom"
        @click="scrollToBottom"
        title="滚动到底部"
      >
        <i class="fas fa-chevron-down"></i>
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useAiAssistantStore } from '@/stores/aiAssistantStore'
import MessageBubble from './MessageBubble.vue'
import type { Message } from '@/types/aiAssistant'

// Props
interface Props {
  messages: Message[]
  isTyping: boolean
  loading: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  messageAction: [action: string, messageId: string]
  retry: [messageId: string]
}>()

// 状态管理
const aiAssistantStore = useAiAssistantStore()

// 本地状态
const messageListRef = ref<HTMLElement>()
const messagesContainerRef = ref<HTMLElement>()
const showScrollButton = ref(false)
const unreadCount = ref(0)
const isUserScrolling = ref(false)
const lastScrollTop = ref(0)
const autoScrollThreshold = 100 // 距离底部多少像素时自动滚动

// 计算属性
const hasMessages = computed(() => props.messages.length > 0)

const typingMessage = computed((): Message => ({
  id: 'typing',
  content: '',
  type: 'text',
  timestamp: new Date(),
  sender: 'ai',
  status: 'typing'
}))

// 方法
const shouldShowAvatar = (message: Message): boolean => {
  const messageIndex = props.messages.findIndex(m => m.id === message.id)
  if (messageIndex === 0) return true
  
  const prevMessage = props.messages[messageIndex - 1]
  return prevMessage.sender !== message.sender
}

const shouldShowTimestamp = (message: Message): boolean => {
  const messageIndex = props.messages.findIndex(m => m.id === message.id)
  if (messageIndex === 0) return true
  
  const prevMessage = props.messages[messageIndex - 1]
  const timeDiff = message.timestamp.getTime() - prevMessage.timestamp.getTime()
  
  // 如果时间间隔超过5分钟，显示时间戳
  return timeDiff > 5 * 60 * 1000
}

const scrollToBottom = (smooth = true) => {
  if (!messagesContainerRef.value) return
  
  const container = messagesContainerRef.value
  const scrollOptions: ScrollToOptions = {
    top: container.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  }
  
  container.scrollTo(scrollOptions)
  showScrollButton.value = false
  unreadCount.value = 0
}

const handleScroll = () => {
  if (!messagesContainerRef.value) return
  
  const container = messagesContainerRef.value
  const { scrollTop, scrollHeight, clientHeight } = container
  
  // 检查是否接近底部
  const isNearBottom = scrollHeight - scrollTop - clientHeight < autoScrollThreshold
  
  // 检查用户是否在主动滚动
  if (scrollTop !== lastScrollTop.value) {
    isUserScrolling.value = true
    setTimeout(() => {
      isUserScrolling.value = false
    }, 150)
  }
  
  lastScrollTop.value = scrollTop
  
  // 显示/隐藏滚动按钮
  showScrollButton.value = !isNearBottom && hasMessages.value
  
  // 如果用户滚动到底部，清除未读计数
  if (isNearBottom) {
    unreadCount.value = 0
  }
}

const handleMessageAction = (action: string, messageId: string) => {
  emit('messageAction', action, messageId)
}

const handleRetry = (messageId: string) => {
  emit('retry', messageId)
}

// 监听消息变化，自动滚动
watch(
  () => props.messages.length,
  async (newLength, oldLength) => {
    if (newLength > oldLength) {
      await nextTick()
      
      if (!messagesContainerRef.value) return
      
      const container = messagesContainerRef.value
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < autoScrollThreshold
      
      // 如果用户在底部附近或者设置了自动滚动，则滚动到底部
      if (isNearBottom || aiAssistantStore.settings.autoScroll) {
        scrollToBottom()
      } else {
        // 否则增加未读计数
        unreadCount.value++
      }
    }
  }
)

// 监听输入状态变化
watch(
  () => props.isTyping,
  async (isTyping) => {
    if (isTyping) {
      await nextTick()
      
      if (!messagesContainerRef.value) return
      
      const container = messagesContainerRef.value
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < autoScrollThreshold
      
      if (isNearBottom || aiAssistantStore.settings.autoScroll) {
        scrollToBottom()
      }
    }
  }
)

// 键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  // End 键滚动到底部
  if (event.key === 'End') {
    event.preventDefault()
    scrollToBottom()
  }
  
  // Home 键滚动到顶部
  if (event.key === 'Home') {
    event.preventDefault()
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }
}

// 生命周期
onMounted(() => {
  if (messagesContainerRef.value) {
    messagesContainerRef.value.addEventListener('scroll', handleScroll)
  }
  
  document.addEventListener('keydown', handleKeyDown)
  
  // 初始滚动到底部
  nextTick(() => {
    scrollToBottom(false)
  })
})

onUnmounted(() => {
  if (messagesContainerRef.value) {
    messagesContainerRef.value.removeEventListener('scroll', handleScroll)
  }
  
  document.removeEventListener('keydown', handleKeyDown)
})

// 暴露方法给父组件
defineExpose({
  scrollToBottom
})
</script>

<style scoped lang="scss">
.message-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  scroll-behavior: smooth;
  
  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-border-secondary);
    border-radius: 3px;
    
    &:hover {
      background: var(--color-border-primary);
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  
  i {
    font-size: 36px;
    color: white;
  }
}

.empty-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
}

.empty-description {
  font-size: 16px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 32px 0;
  max-width: 400px;
}

.quick-start-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 300px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--color-border-primary);
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    transform: translateY(-1px);
  }
  
  i {
    color: var(--color-primary);
    font-size: 14px;
    width: 16px;
  }
  
  span {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
}

/* 消息列表 */
.messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.typing-message {
  margin-top: 16px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: var(--color-text-secondary);
}

.loading-spinner {
  font-size: 16px;
}

.loading-text {
  font-size: 14px;
}

/* 滚动到底部按钮 */
.scroll-to-bottom {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
  transition: all var(--transition-speed-fast);
  z-index: 10;
  
  &:hover {
    background: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(var(--color-primary-rgb), 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.unread-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: var(--color-danger);
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border: 2px solid var(--color-bg-primary);
}

/* 消息动画 */
.message-enter-active {
  transition: all var(--transition-speed-normal);
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.message-leave-active {
  transition: all var(--transition-speed-fast);
}

.message-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

.message-move {
  transition: transform var(--transition-speed-normal);
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-speed-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滑入动画 */
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
  transform: translateY(20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .messages-container {
    padding: 16px;
  }
  
  .empty-state {
    padding: 20px 16px;
  }
  
  .empty-icon {
    width: 60px;
    height: 60px;
    
    i {
      font-size: 28px;
    }
  }
  
  .empty-title {
    font-size: 20px;
  }
  
  .empty-description {
    font-size: 14px;
  }
  
  .scroll-to-bottom {
    width: 40px;
    height: 40px;
    bottom: 16px;
    right: 16px;
    font-size: 14px;
  }
  
  .messages {
    gap: 12px;
  }
}

/* 毛玻璃效果 */
.scroll-to-bottom {
  background: rgba(var(--color-primary-rgb), 0.9);
  backdrop-filter: blur(10px);
}

.tip-item {
  background: rgba(var(--color-bg-secondary-rgb), 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--color-border-primary-rgb), 0.3);
}
</style> 