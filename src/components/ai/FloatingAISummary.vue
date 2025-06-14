<template>
  <Teleport to="body">
    <div v-if="visible" class="floating-ai-container">
      <!-- 折叠状态：只显示小按钮 -->
      <div 
        v-if="!isExpanded" 
        class="floating-ai-trigger"
        @click="expandAI"
        title="AI助手"
      >
        <i class="fas fa-robot"></i>
        <div class="trigger-tooltip">AI助手</div>
      </div>

      <!-- 展开状态：显示完整AI助手 -->
      <div 
        v-if="isExpanded"
        class="floating-ai-assistant" 
        @click.stop
      >
        <!-- AI助手头部 -->
        <div class="ai-assistant-header">
          <div class="ai-header-left">
            <div class="ai-info">
              <div class="ai-avatar">
                <i class="fas fa-robot"></i>
              </div>
              <div class="ai-details">
                <h3 class="ai-assistant-title">AI阅读助手</h3>
                <span class="ai-status" :class="connectionStatus">{{ statusText }}</span>
              </div>
            </div>
          </div>
          <div class="ai-header-right">
            <button @click="collapseAI" class="ai-action-btn" title="收起">
              <i class="fas fa-minus"></i>
            </button>
            <button @click="handleClose" class="ai-action-btn close" title="关闭">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- AI助手主体 -->
        <div class="ai-assistant-body">
          <!-- 聊天区域 -->
          <div class="chat-area" ref="chatAreaRef">
            <!-- 欢迎消息 -->
            <div v-if="messages.length === 0" class="message-bubble assistant welcome-message">
              <div class="message-content">
                你好！我是您的AI阅读助手。我已经获取了当前文章的内容，可以帮您：
                <ul>
                  <li>总结文章要点</li>
                  <li>解释复杂概念</li>
                  <li>回答相关问题</li>
                  <li>提供深度分析</li>
                </ul>
              </div>
              <div class="message-meta">AI助手</div>
            </div>

            <!-- 消息列表 -->
            <div
              v-for="(message, index) in messages"
              :key="message.id"
              class="message-bubble"
              :class="message.sender"
            >
              <div class="message-content" v-html="formatMessage(message.content)"></div>
              <div class="message-meta">
                {{ formatMessageTime(message.timestamp) }}
              </div>
            </div>

            <!-- 正在输入指示器 -->
            <div v-if="isTyping" class="message-bubble assistant thinking">
              <div class="typing-animation">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="typing-text">正在思考...</span>
              </div>
              <div class="message-meta">AI助手</div>
            </div>
          </div>

          <!-- 快捷指令 -->
          <div class="quick-prompts" v-if="!isTyping">
            <span
              v-for="prompt in quickPrompts"
              :key="prompt.text"
              class="prompt-chip"
              @click="setPrompt(prompt.text)"
            >
              {{ prompt.text }}
            </span>
          </div>

          <!-- 输入区域 -->
          <div class="input-area">
            <div class="input-wrapper">
              <textarea
                ref="chatInputRef"
                v-model="inputText"
                class="chat-input"
                placeholder="输入您的问题或指令..."
                rows="1"
                @input="adjustTextareaHeight"
                @keypress="handleKeyPress"
                :disabled="isTyping"
              ></textarea>
              <button
                class="send-btn"
                :disabled="!inputText.trim() || isTyping"
                @click="sendMessage"
                title="发送消息"
              >
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { aiChatApi, type ChatMessage } from '@/api/aiChat'
import { ConfigService } from '@/api/services/configService'

// 类型定义
interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
}

interface QuickPrompt {
  text: string
  description?: string
}

interface Props {
  visible: boolean
  articleId?: string
  articleContent?: string
  initialPosition?: { x: number; y: number }
}

interface Emits {
  (e: 'close'): void
  (e: 'save', summary: string): void
  (e: 'minimize'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  articleContent: '',
  initialPosition: () => ({ x: 0, y: 0 })
})

const emit = defineEmits<Emits>()

// 响应式数据
const isExpanded = ref(false)
const inputText = ref('')
const isTyping = ref(false)
const messages = ref<Message[]>([])
const connectionStatus = ref<'connected' | 'connecting' | 'disconnected'>('connected')
const chatAreaRef = ref<HTMLElement>()
const chatInputRef = ref<HTMLTextAreaElement>()

// 快捷指令
const quickPrompts = ref<QuickPrompt[]>([
  { text: '总结这篇文章的主要内容' },
  { text: '提取文章的关键观点' },
  { text: '解释文章中的专业术语' },
  { text: '分析文章的论证逻辑' },
  { text: '这篇文章有什么启发？' }
])

// 加载快捷提示词
async function loadQuickPrompts() {
  try {
    const promptsConfig = await ConfigService.getReaderAssistantPrompts()
    if (promptsConfig && promptsConfig.quickPrompts && promptsConfig.quickPrompts.length > 0) {
      quickPrompts.value = promptsConfig.quickPrompts.map(text => ({ text }))
    }
  } catch (error) {
    console.error('加载AI阅读助手快捷提示词失败:', error)
    // 加载失败时使用默认值
    quickPrompts.value = [
      { text: '总结这篇文章的主要内容' },
      { text: '提取文章的关键观点' },
      { text: '解释文章中的专业术语' },
      { text: '分析文章的论证逻辑' },
      { text: '这篇文章有什么启发？' }
    ]
  }
}

// 计算属性
const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected':
      return '在线'
    case 'connecting':
      return '连接中...'
    case 'disconnected':
      return '离线'
    default:
      return '未知状态'
  }
})

// 展开/折叠方法
function expandAI() {
  isExpanded.value = true
  nextTick(() => {
    chatInputRef.value?.focus()
  })
}

function collapseAI() {
  isExpanded.value = false
}

// 方法
function handleClose() {
  emit('close')
}

function handleMinimize() {
  emit('minimize')
}

function handleOverlayClick() {
  // 点击遮罩层不关闭，保持打开状态
}

function setPrompt(text: string) {
  inputText.value = text
  chatInputRef.value?.focus()
}

async function sendMessage() {
  if (!inputText.value.trim() || isTyping.value) return

  const userMessage: Message = {
    id: crypto.randomUUID(),
    content: inputText.value.trim(),
    sender: 'user',
    timestamp: new Date()
  }
  messages.value.push(userMessage)

  const currentInput = inputText.value.trim()
  inputText.value = ''
  adjustTextareaHeight()
  
  await nextTick()
  scrollToBottom()

  isTyping.value = true
  
  let contextualMessage = currentInput
  if (props.articleContent && props.articleContent.trim()) {
    const articleContext = props.articleContent.substring(0, 4000) // 增加上下文长度
    contextualMessage = `基于以下文章内容回答问题，请直接回答问题本身，不要重复说"根据文章内容"：\n\n文章内容：${articleContext}\n\n问题：${currentInput}`
  } else if (props.articleId) {
    contextualMessage = `基于ID为 ${props.articleId} 的文章内容，回答以下问题：${currentInput}`
  }
  
  const request = {
    message: contextualMessage,
    sessionId: `article-${props.articleId || 'unknown'}`
  }

  let assistantMessage: Message | null = null

  aiChatApi.streamChat(
    request,
    (contentChunk) => {
      if (!assistantMessage) {
        assistantMessage = {
          id: crypto.randomUUID(),
          content: '',
          sender: 'assistant',
          timestamp: new Date()
        }
        messages.value.push(assistantMessage)
      }
      assistantMessage.content += contentChunk
      nextTick(scrollToBottom)
    },
    () => {
      isTyping.value = false
      if (assistantMessage && (currentInput.includes('总结') || currentInput.includes('概括'))) {
        emit('save', assistantMessage.content)
      }
      nextTick(scrollToBottom)
    },
    (error) => {
      console.error('AI流式回复失败:', error)
      if (!assistantMessage) {
        assistantMessage = {
          id: crypto.randomUUID(),
          content: `抱歉，连接出现问题: ${error}`,
          sender: 'assistant',
          timestamp: new Date()
        }
        messages.value.push(assistantMessage)
      } else {
        assistantMessage.content += `\n\n[错误: ${error}]`
      }
      isTyping.value = false
      nextTick(scrollToBottom)
    }
  )
}

function formatMessage(content: string) {
  // 简单的消息格式化，支持换行和基本的HTML
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

function formatMessageTime(timestamp: Date) {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return timestamp.toLocaleDateString()
}

function adjustTextareaHeight() {
  const textarea = chatInputRef.value
  if (!textarea) return
  
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

function scrollToBottom() {
  if (chatAreaRef.value) {
    chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
  }
}

// 生命周期
onMounted(() => {
  // 加载快捷提示词
  loadQuickPrompts()
  
  // 如果是展开状态，聚焦输入框
  if (isExpanded.value) {
    nextTick(() => {
      chatInputRef.value?.focus()
    })
  }

  // 滚动到底部
  scrollToBottom()
})

onUnmounted(() => {
  // 清理拖动相关的事件监听器
})

// 监听visible变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // 组件变为可见时，默认显示悬浮按钮（折叠状态）
    isExpanded.value = false
  } else {
    // 组件隐藏时重置为折叠状态
    isExpanded.value = false
  }
})
</script>

<style scoped lang="scss">
// 浮动AI容器
.floating-ai-container {
  position: fixed;
  bottom: 80px; // 比笔记编辑器高一些，笔记在bottom: 20px
  right: 20px;
  z-index: 9999;
}

// 悬浮触发按钮 - AI机器人
.floating-ai-trigger {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 
    0 8px 25px rgba(59, 130, 246, 0.3),
    0 4px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: float 3s ease-in-out infinite;
  position: relative;
  
  i {
    color: white;
    font-size: 20px;
  }
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 
      0 12px 35px rgba(59, 130, 246, 0.4),
      0 6px 15px rgba(0, 0, 0, 0.3);
    
    .trigger-tooltip {
      opacity: 1;
      transform: translateX(-100%) scale(1);
    }
  }
  
  &:active {
    transform: scale(0.95);
  }
}

// 悬浮按钮的提示文字
.trigger-tooltip {
  position: absolute;
  right: 70px;
  top: 50%;
  transform: translateY(-50%) translateX(-100%) scale(0.8);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: all 0.2s ease;
  pointer-events: none;
  
  &::after {
    content: '';
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-left-color: rgba(0, 0, 0, 0.8);
  }
}

// 悬浮动画
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
}

// AI助手主体 - 从右下角展开
.floating-ai-assistant {
  width: 450px;
  max-width: 90vw;
  max-height: 80vh;
  background: linear-gradient(145deg, 
    rgba(0, 0, 0, 0.98), 
    rgba(10, 10, 12, 0.95), 
    rgba(20, 20, 24, 0.92)
  );
  backdrop-filter: blur(80px) saturate(200%) brightness(1.2);
  -webkit-backdrop-filter: blur(80px) saturate(200%) brightness(1.2);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 40px 80px rgba(0, 0, 0, 0.9),
    0 20px 40px rgba(0, 0, 0, 0.7),
    0 10px 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 -1px 0 rgba(0, 0, 0, 0.7);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: aiSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: bottom right;
  
  // 调整位置，确保从右下角展开
  position: absolute;
  bottom: 0;
  right: 0;
}

@keyframes aiSlideIn {
  from {
    opacity: 0;
    transform: scale(0.3) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

// 头部样式
.ai-assistant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 16px;
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.4), 
    rgba(17, 24, 39, 0.3), 
    rgba(30, 41, 59, 0.2)
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  flex-shrink: 0;
}

.ai-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
}

.ai-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ai-assistant-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.ai-status {
  font-size: 12px;
  color: #94a3b8;
  
  &.connected {
    color: #10b981;
  }
  
  &.connecting {
    color: #f59e0b;
  }
  
  &.disconnected {
    color: #ef4444;
  }
}

.ai-header-right {
  display: flex;
  gap: 8px;
}

.ai-action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &.close:hover {
    background: rgba(127, 29, 29, 0.8);
    border-color: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  }
}

// 主体内容
.ai-assistant-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-bubble {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 16px;
  word-wrap: break-word;
  animation: messageSlideIn 0.3s ease-out;
  
  &.user {
    align-self: flex-end;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border-bottom-right-radius: 4px;
  }
  
  &.assistant {
    align-self: flex-start;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
    border-bottom-left-radius: 4px;
    
    &.welcome-message {
      background: linear-gradient(135deg, 
        rgba(59, 130, 246, 0.1), 
        rgba(29, 78, 216, 0.05)
      );
      border-color: rgba(59, 130, 246, 0.2);
    }
    
    &.thinking {
      background: rgba(251, 191, 36, 0.1);
      border-color: rgba(251, 191, 36, 0.2);
    }
  }
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
  
  ul {
    margin: 8px 0;
    padding-left: 20px;
    
    li {
      margin: 4px 0;
    }
  }
}

.message-meta {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 6px;
}

.typing-animation {
  display: flex;
  align-items: center;
  gap: 8px;
}

.typing-dots {
  display: flex;
  gap: 4px;
  
  span {
    width: 6px;
    height: 6px;
    background: #fbbf24;
    border-radius: 50%;
    animation: typingBounce 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
    &:nth-child(3) { animation-delay: 0s; }
  }
}

@keyframes typingBounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.typing-text {
  font-size: 12px;
  color: #fbbf24;
}

// 快捷指令
.quick-prompts {
  padding: 0 20px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prompt-chip {
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
    color: #60a5fa;
    transform: translateY(-1px);
  }
}

// 输入区域
.input-area {
  padding: 16px 20px;
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.4), 
    rgba(17, 24, 39, 0.3), 
    rgba(30, 41, 59, 0.2)
  );
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  color: #e2e8f0;
  font-size: 14px;
  line-height: 1.4;
  outline: none;
  resize: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #3b82f6;
    background: rgba(0, 0, 0, 0.4);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
  
  &::placeholder {
    color: #64748b;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.send-btn {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb, #1e40af);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
  }
  
  &:disabled {
    background: rgba(75, 85, 99, 0.5);
    cursor: not-allowed;
    box-shadow: none;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .floating-ai-container {
    bottom: 140px; // 手机端位置调整
    right: 10px;
  }

  .floating-ai-trigger {
    width: 48px;
    height: 48px;
    
    i {
      font-size: 18px;
    }
  }

  .floating-ai-assistant {
    width: calc(100vw - 20px);
    max-height: 70vh;
    right: -10px;
    bottom: -60px;
  }

  .ai-assistant-header {
    padding: 12px 16px;
  }

  .chat-area {
    padding: 16px;
  }

  .input-area {
    padding: 12px 16px;
  }
}
</style> 