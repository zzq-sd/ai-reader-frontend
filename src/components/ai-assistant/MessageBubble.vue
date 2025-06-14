<template>
  <div class="message-bubble" :class="messageClasses">
    <!-- 用户头像 -->
    <div v-if="showAvatar" class="message-avatar" :class="{ 'ai-avatar': message.sender === 'ai' }">
      <div class="avatar-container">
        <i :class="message.sender === 'user' ? 'fas fa-user' : 'fas fa-robot'"></i>
      </div>
    </div>

    <!-- 消息内容 -->
    <div class="message-content">
      <!-- 消息头部信息 -->
      <div v-if="showSenderInfo" class="message-header">
        <span class="sender-name">{{ getSenderName() }}</span>
        <span v-if="showTimestamp" class="message-time">{{ formatTime(message.timestamp) }}</span>
      </div>

      <!-- 消息主体 -->
      <div class="message-body">
        <!-- 文本消息 -->
        <div v-if="message.type === 'text'" class="text-content" v-html="formattedContent"></div>
        
        <!-- 文件消息 -->
        <div v-else-if="message.type === 'file'" class="file-content">
          <div class="file-info">
            <i class="fas fa-file" :class="getFileIcon()"></i>
            <div class="file-details">
              <span class="file-name">{{ message.metadata?.fileName || '未知文件' }}</span>
              <span class="file-size">{{ formatFileSize(message.metadata?.fileSize) }}</span>
            </div>
          </div>
        </div>

        <!-- 图片消息 -->
        <div v-else-if="message.type === 'image'" class="image-content">
          <img :src="message.content" :alt="message.metadata?.fileName" class="message-image" />
        </div>

        <!-- 代码消息 -->
        <div v-else-if="message.type === 'code'" class="code-content">
          <div class="code-header">
            <span class="code-language">{{ message.metadata?.codeLanguage || 'text' }}</span>
            <button @click="copyCode" class="copy-code-btn" title="复制代码">
              <i class="fas fa-copy"></i>
            </button>
          </div>
          <pre><code class="hljs" v-html="highlightedCode"></code></pre>
        </div>
      </div>

      <!-- 消息状态指示器 -->
      <div v-if="message.status" class="message-status">
        <i v-if="message.status === 'sending'" class="fas fa-clock status-sending"></i>
        <i v-else-if="message.status === 'sent'" class="fas fa-check status-sent"></i>
        <i v-else-if="message.status === 'error'" class="fas fa-exclamation-triangle status-error"></i>
        <div v-else-if="message.status === 'typing'" class="typing-indicator">
          <span class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </div>

      <!-- 消息操作按钮 -->
      <div v-if="showActions && message.sender === 'ai'" class="message-actions">
        <button @click="copyMessage" class="action-btn" title="复制消息">
          <i class="fas fa-copy"></i>
        </button>
        <button @click="regenerateMessage" class="action-btn" title="重新生成">
          <i class="fas fa-redo"></i>
        </button>
        <button @click="likeMessage" class="action-btn" :class="{ liked: isLiked }" title="点赞">
          <i class="fas fa-thumbs-up"></i>
        </button>
        <button @click="shareMessage" class="action-btn" title="分享">
          <i class="fas fa-share"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Message } from '@/types/aiAssistant'

interface Props {
  message: Message
  showAvatar?: boolean
  showTimestamp?: boolean
  showSenderInfo?: boolean
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
  showTimestamp: true,
  showSenderInfo: true,
  showActions: true
})

const emit = defineEmits<{
  copy: [content: string]
  regenerate: [messageId: string]
  like: [messageId: string]
  share: [message: Message]
}>()

const isLiked = ref(false)

// 计算属性
const messageClasses = computed(() => [
  `message-${props.message.sender}`,
  `message-${props.message.type}`,
  {
    'has-status': !!props.message.status,
    'has-actions': props.showActions && props.message.sender === 'ai'
  }
])

const formattedContent = computed(() => {
  if (props.message.type !== 'text') return props.message.content
  
  // 简单的 Markdown 渲染
  const content = props.message.content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
  
  return content
})

const highlightedCode = computed(() => {
  // TODO: 集成代码高亮库
  return props.message.content
})

// 方法
const getSenderName = () => {
  return props.message.sender === 'user' ? '您' : 'AI助手'
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return timestamp.toLocaleDateString()
}

const formatFileSize = (size?: number) => {
  if (!size) return ''
  
  if (size < 1024) return `${size}B`
  if (size < 1048576) return `${(size / 1024).toFixed(1)}KB`
  return `${(size / 1048576).toFixed(1)}MB`
}

const getFileIcon = () => {
  const fileType = props.message.metadata?.fileType?.toLowerCase()
  if (!fileType) return 'fa-file'
  
  if (fileType.includes('pdf')) return 'fa-file-pdf'
  if (fileType.includes('word') || fileType.includes('doc')) return 'fa-file-word'
  if (fileType.includes('image')) return 'fa-file-image'
  if (fileType.includes('text')) return 'fa-file-alt'
  return 'fa-file'
}

const copyMessage = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
    emit('copy', props.message.content)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
  } catch (error) {
    console.error('复制代码失败:', error)
  }
}

const regenerateMessage = () => {
  emit('regenerate', props.message.id)
}

const likeMessage = () => {
  isLiked.value = !isLiked.value
  emit('like', props.message.id)
}

const shareMessage = () => {
  emit('share', props.message)
}
</script>

<style scoped lang="scss">
.message-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  max-width: 100%;
  
  &.message-user {
    flex-direction: row-reverse;
    
    .message-content {
      background: var(--color-primary);
      color: white;
      border-bottom-right-radius: 4px;
    }
    
    .message-avatar {
      .avatar-container {
        background: var(--color-primary);
        color: white;
      }
    }
  }
  
  &.message-ai {
    .message-content {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
      border-bottom-left-radius: 4px;
    }
    
    .message-avatar {
      .avatar-container {
        background: var(--color-bg-quaternary);
        color: var(--color-primary);
      }
    }
  }
}

.message-avatar {
  flex-shrink: 0;
  
  .avatar-container {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all var(--transition-speed-fast);
  }
  
  &.ai-avatar {
    .avatar-container {
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    }
  }
}

.message-content {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
  word-wrap: break-word;
  line-height: 1.5;
  
  .message-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 12px;
    opacity: 0.7;
    
    .sender-name {
      font-weight: 500;
    }
    
    .message-time {
      font-size: 11px;
    }
  }
  
  .message-body {
    margin-bottom: 8px;
    
    .text-content {
      word-break: break-word;
      
      :deep(strong) {
        font-weight: 600;
      }
      
      :deep(em) {
        font-style: italic;
      }
      
      :deep(code) {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 4px;
        border-radius: 4px;
        font-family: 'Fira Code', monospace;
        font-size: 0.9em;
      }
    }
    
    .file-content {
      .file-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        
        .fa-file {
          font-size: 24px;
          color: var(--color-primary);
        }
        
        .file-details {
          flex: 1;
          
          .file-name {
            display: block;
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .file-size {
            font-size: 12px;
            opacity: 0.7;
          }
        }
      }
    }
    
    .image-content {
      .message-image {
        max-width: 100%;
        max-height: 300px;
        border-radius: 8px;
        object-fit: cover;
      }
    }
    
    .code-content {
      background: var(--color-bg-code);
      border-radius: 8px;
      overflow: hidden;
      
      .code-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.1);
        border-bottom: 1px solid var(--color-border-secondary);
        
        .code-language {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
        }
        
        .copy-code-btn {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all var(--transition-speed-fast);
          
          &:hover {
            background: var(--color-bg-hover);
            color: var(--color-text-primary);
          }
        }
      }
      
      pre {
        margin: 0;
        padding: 12px;
        overflow-x: auto;
        
        code {
          font-family: 'Fira Code', monospace;
          font-size: 14px;
          line-height: 1.4;
        }
      }
    }
  }
  
  .message-status {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 4px;
    font-size: 12px;
    
    .status-sending {
      color: var(--color-warning);
      animation: pulse 1.5s infinite;
    }
    
    .status-sent {
      color: var(--color-success);
    }
    
    .status-error {
      color: var(--color-danger);
    }
    
    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      
      .typing-dots {
        display: flex;
        gap: 2px;
        
        span {
          width: 4px;
          height: 4px;
          background: currentColor;
          border-radius: 50%;
          animation: typingDot 1.4s infinite;
          
          &:nth-child(2) { animation-delay: 0.2s; }
          &:nth-child(3) { animation-delay: 0.4s; }
        }
      }
    }
  }
  
  .message-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    opacity: 0;
    transition: opacity var(--transition-speed-fast);
    
    .action-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: currentColor;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      transition: all var(--transition-speed-fast);
      
      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
      }
      
      &.liked {
        color: var(--color-accent);
        background: rgba(var(--color-accent-rgb), 0.2);
      }
    }
  }
  
  &:hover .message-actions {
    opacity: 1;
  }
}

// 动画
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes typingDot {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .message-bubble {
    gap: 8px;
    margin-bottom: 12px;
    
    .message-avatar .avatar-container {
      width: 32px;
      height: 32px;
      font-size: 14px;
    }
    
    .message-content {
      padding: 10px 12px;
      font-size: 14px;
    }
  }
}
</style> 