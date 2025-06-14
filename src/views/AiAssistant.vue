<template>
  <div class="ai-assistant-container">
    <!-- 页面头部 -->
    <header class="page-header-ai">
      <h1 class="page-title-ai">
        <i class="fas fa-robot"></i>
        AI 助手
        <!-- AI服务状态指示器 -->
        <span class="service-status" :class="aiServiceStatus">
          <i v-if="aiServiceStatus === 'checking'" class="fas fa-spinner fa-spin"></i>
          <i v-else-if="aiServiceStatus === 'healthy'" class="fas fa-circle"></i>
          <i v-else class="fas fa-exclamation-triangle"></i>
        </span>
      </h1>
      <p class="page-subtitle-ai">
        与智能助手对话，获取信息、总结文章或进行创作。
        <span v-if="aiServiceStatus === 'unhealthy'" class="status-warning">
          (AI服务暂时不可用)
        </span>
      </p>
    </header>

    <!-- 聊天区域 -->
    <div class="chat-area" ref="chatAreaRef">
      <!-- 欢迎消息 -->
      <div v-if="messages.length === 0" class="message-bubble assistant welcome-message">
        你好！我是您的 AI 阅读助手，有什么可以帮助您的吗？例如，您可以问我：
        <ul>
          <li>"总结一下最近关于AI的文章"</li>
          <li>"Vue.js 和 React 有哪些主要区别？"</li>
          <li>"帮我写一篇关于未来科技的短文"</li>
        </ul>
        <div class="message-meta">AI助手</div>
      </div>

      <!-- 消息列表 -->
      <div
        v-for="(message, index) in messages"
        :key="message.id"
        class="message-bubble"
        :class="message.sender"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <div v-if="message.type === 'text'" v-html="formatMessage(message.content)"></div>
        <div v-else-if="message.type === 'code'" class="code-content">
          <pre><code>{{ message.content }}</code></pre>
        </div>
        <div class="message-meta">
          {{ formatMessageTime(message.timestamp) }}
        </div>
      </div>

      <!-- 正在输入指示器 -->
      <div v-if="isTyping" class="message-bubble assistant thinking">
        <div class="typing-animation">
          正在思考... <i class="fas fa-spinner fa-pulse fa-xs"></i>
        </div>
        <div class="message-meta">AI助手</div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <!-- 快捷指令 -->
      <div class="quick-prompts">
        <span
          v-for="prompt in quickPrompts"
          :key="prompt.text"
          class="prompt-chip"
          @click="setPrompt(prompt.text)"
        >
          {{ prompt.text }}
        </span>
      </div>

      <!-- 输入框 -->
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
          :disabled="!inputText.trim() || isTyping || aiServiceStatus !== 'healthy'"
          @click="sendMessage"
          :title="aiServiceStatus === 'healthy' ? '发送消息' : 'AI服务暂时不可用'"
        >
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { aiChatApi, type ChatMessage } from '@/api/aiChat'

// 类型定义
interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  type: 'text' | 'code'
  timestamp: Date
}

interface QuickPrompt {
  text: string
  description?: string
}

// 响应式数据
const inputText = ref('')
const isTyping = ref(false)
const messages = ref<Message[]>([])
const aiServiceStatus = ref<'checking' | 'healthy' | 'unhealthy'>('checking')

// DOM引用
const chatAreaRef = ref<HTMLElement>()
const chatInputRef = ref<HTMLTextAreaElement>()

// 快捷指令
const quickPrompts: QuickPrompt[] = [
  { text: '总结当前文章' },
  { text: '提取关键信息' },
  { text: '翻译成英文' },
  { text: '解释这个概念' }
]

// 方法
const adjustTextareaHeight = () => {
  if (chatInputRef.value) {
    chatInputRef.value.style.height = 'auto'
    chatInputRef.value.style.height = chatInputRef.value.scrollHeight + 'px'
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatAreaRef.value) {
      chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
    }
  })
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const setPrompt = (promptText: string) => {
  inputText.value = promptText
  chatInputRef.value?.focus()
  adjustTextareaHeight()
}

const sendMessage = async () => {
  const messageText = inputText.value.trim()
  if (!messageText || isTyping.value) return

  // 添加用户消息
  const userMessage: Message = {
    id: Date.now().toString(),
    content: messageText,
    sender: 'user',
    type: 'text',
    timestamp: new Date()
  }
  messages.value.push(userMessage)

  // 清空输入框
  inputText.value = ''
  if (chatInputRef.value) {
    chatInputRef.value.style.height = 'auto'
  }

  scrollToBottom()

  // 使用流式AI回复
  isTyping.value = true
  
  // 创建AI消息占位符
  const aiMessage: Message = {
    id: (Date.now() + 1).toString(),
    content: '',
    sender: 'assistant',
    type: 'text',
    timestamp: new Date()
  }
  messages.value.push(aiMessage)
  
  try {
    // 使用流式聊天API
    const cancelStream = aiChatApi.streamChat(
      { message: messageText },
      // onMessage - 接收流式内容
      (content: string) => {
        aiMessage.content += content
        scrollToBottom()
      },
      // onComplete - 流式传输完成
      () => {
        isTyping.value = false
        scrollToBottom()
      },
      // onError - 处理错误
      (error: string) => {
        console.error('流式聊天失败:', error)
        aiMessage.content = '抱歉，我遇到了一些问题，请稍后再试。'
        isTyping.value = false
        scrollToBottom()
      }
    )
    
    // 可以保存取消函数以便需要时取消流式传输
    // cancelStreamRef.value = cancelStream
    
  } catch (error) {
    console.error('AI回复失败:', error)
    
    aiMessage.content = '抱歉，我遇到了一些问题，请稍后再试。'
    isTyping.value = false
    scrollToBottom()
  }
}

const formatMessage = (content: string): string => {
  // 简单的格式化，支持HTML标签
  return content
}

const formatMessageTime = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return timestamp.toLocaleDateString()
  }
}

// 检查AI服务状态
const checkAiServiceHealth = async () => {
  try {
    const result = await aiChatApi.healthCheck()
    aiServiceStatus.value = result.status
    
    if (result.status === 'unhealthy') {
      console.warn('AI服务状态异常:', result.message)
    }
  } catch (error) {
    console.error('AI服务健康检查失败:', error)
    aiServiceStatus.value = 'unhealthy'
  }
}

// 生命周期
onMounted(async () => {
  // 检查AI服务状态
  await checkAiServiceHealth()
  
  // 自动聚焦输入框
  chatInputRef.value?.focus()
})
</script>

<style lang="scss" scoped>
.ai-assistant-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: calc(100vh - 48px);
  max-width: 900px;
  margin: 0 auto;
  padding: calc(var(--spacing-unit) * 6) calc(var(--spacing-unit) * 6) 0;
  opacity: 0;
  transform: translateY(15px);
  animation: pageFadeInUp 0.5s var(--transition-speed-slow) forwards;
}

@keyframes pageFadeInUp {
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.page-header-ai {
  padding-bottom: calc(var(--spacing-unit) * 4);
  margin-bottom: calc(var(--spacing-unit) * 4);
  border-bottom: 1px solid var(--color-border-primary);
  flex-shrink: 0;
}

.page-title-ai {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  margin: 0;
  
  i {
    margin-right: calc(var(--spacing-unit) * 3);
    color: var(--color-accent-primary);
  }
}

.service-status {
  margin-left: calc(var(--spacing-unit) * 2);
  font-size: 12px;
  
  &.checking i {
    color: var(--color-text-secondary);
  }
  
  &.healthy i {
    color: #10b981; // 绿色
  }
  
  &.unhealthy i {
    color: #ef4444; // 红色
  }
}

.page-subtitle-ai {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: calc(var(--spacing-unit) * 1) 0 0 0;
  
  .status-warning {
    color: #ef4444;
    font-weight: 500;
  }
}

.chat-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 1);
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 5);
  
  // 滚动条美化
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--color-border-secondary);
    border-radius: 6px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-text-disabled);
  }
}

.message-bubble {
  max-width: 75%;
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 4);
  border-radius: var(--border-radius-xl);
  line-height: 1.6;
  font-size: 14px;
  box-shadow: var(--shadow-xs);
  opacity: 0;
  transform: translateY(10px);
  animation: messageFadeInUp 0.3s ease-out forwards;
  
  &.user {
    background-color: var(--color-accent-primary);
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: var(--border-radius-s);
  }
  
  &.assistant {
    background-color: var(--color-bg-secondary);
    color: var(--color-text-primary);
    align-self: flex-start;
    border: 1px solid var(--color-border-primary);
    border-bottom-left-radius: var(--border-radius-s);
    
    :deep(strong) {
      color: var(--color-accent-secondary);
    }
    
    :deep(code) {
      background-color: var(--color-bg-tertiary);
      padding: calc(var(--spacing-unit) * 0.5) calc(var(--spacing-unit) * 1.5);
      border-radius: var(--border-radius-s);
      font-size: 0.9em;
      border: 1px solid var(--color-border-primary);
    }
    
    :deep(ul) {
      margin: calc(var(--spacing-unit) * 2) 0;
      padding-left: calc(var(--spacing-unit) * 5);
    }
    
    :deep(li) {
      margin: calc(var(--spacing-unit) * 1) 0;
    }
  }
  
  &.welcome-message {
    max-width: 85%;
  }
  
  &.thinking {
    opacity: 0.8;
  }
}

@keyframes messageFadeInUp {
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.code-content {
  pre {
    background-color: #0F1014;
    padding: calc(var(--spacing-unit) * 3);
    border-radius: var(--border-radius-m);
    overflow-x: auto;
    margin: 0;
    font-size: 0.85em;
    border: 1px solid var(--color-border-primary);
    
    code {
      background: none !important;
      padding: 0 !important;
      border: none !important;
      color: #cdd3de;
    }
  }
}

.typing-animation {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  
  i {
    color: var(--color-accent-primary);
  }
}

.message-meta {
  font-size: 11px;
  margin-top: calc(var(--spacing-unit) * 1.5);
  opacity: 0.7;
  
  .message-bubble.user & {
    text-align: right;
  }
  
  .message-bubble.assistant & {
    text-align: left;
  }
}

.input-area {
  padding: calc(var(--spacing-unit) * 4) calc(var(--spacing-unit) * 1);
  background-color: var(--color-bg-primary);
  border-top: 1px solid var(--color-border-primary);
  flex-shrink: 0;
}

.quick-prompts {
  display: flex;
  gap: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 3);
  padding-left: calc(var(--spacing-unit) * 1);
  flex-wrap: wrap;
}

.prompt-chip {
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  color: var(--color-text-secondary);
  padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 3);
  border-radius: var(--border-radius-xl);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
    border-color: var(--color-border-secondary);
    transform: translateY(-1px);
  }
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-l);
  padding: calc(var(--spacing-unit) * 1.5);
  box-shadow: var(--shadow-s);
  transition: border-color var(--transition-speed-fast), box-shadow var(--transition-speed-fast);
  
  &:focus-within {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 3px rgba(123, 97, 255, 0.2);
  }
}

.chat-input {
  flex-grow: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text-primary);
  font-size: 14px;
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  resize: none;
  min-height: 24px;
  max-height: 120px;
  overflow-y: auto;
  font-family: inherit;
  
  &::placeholder {
    color: var(--color-text-disabled);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.send-btn {
  background-color: var(--color-accent-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-m);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  margin-left: calc(var(--spacing-unit) * 2);
  flex-shrink: 0;
  
  i {
    font-size: 16px;
  }
  
  &:hover:not(:disabled) {
    background-color: var(--color-accent-primary-hover);
    transform: scale(1.05);
  }
  
  &:disabled {
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-disabled);
    cursor: not-allowed;
    transform: none;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .ai-assistant-container {
    padding: calc(var(--spacing-unit) * 4) calc(var(--spacing-unit) * 3) 0;
  }
  
  .page-title-ai {
    font-size: 20px;
  }
  
  .page-subtitle-ai {
    font-size: 13px;
  }
  
  .message-bubble {
    max-width: 85%;
    font-size: 13px;
  }
  
  .input-area {
    padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 1);
  }
  
  .chat-input {
    padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2.5);
  }
  
  .send-btn {
    width: 32px;
    height: 32px;
    
    i {
      font-size: 14px;
    }
  }
  
  .quick-prompts {
    justify-content: center;
  }
}
</style>