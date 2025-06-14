<template>
  <div 
    class="note-list-item"
    :class="{ selected, 'has-hover': !selected }"
    @click="handleSelect"
  >
    <!-- 笔记内容 -->
    <div class="note-content">
      <h4 class="note-title">{{ note.title || '无标题笔记' }}</h4>
      <p class="note-preview">{{ note.preview || '暂无内容' }}</p>
      
      <!-- 标签 -->
      <div v-if="note.tags.length > 0" class="note-tags">
        <span 
          v-for="tag in displayTags"
          :key="tag"
          class="tag"
        >
          {{ tag }}
        </span>
        <span 
          v-if="note.tags.length > maxDisplayTags"
          class="tag-more"
        >
          +{{ note.tags.length - maxDisplayTags }}
        </span>
      </div>
      
      <!-- 时间信息 -->
      <div class="note-meta">
        <span class="note-time">{{ formatTime(note.lastModified) }}</span>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="note-actions">
      <button
        class="action-btn delete-btn"
        @click.stop="handleDelete"
        title="删除笔记"
      >
                    <i class="fas fa-trash"></i>
      </button>
    </div>
    
    <!-- 选中指示器 -->
    <div v-if="selected" class="selected-indicator"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NoteListItem } from '@/api/notes.d'

// Props
interface Props {
  note: NoteListItem
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false
})

// Events
const emit = defineEmits<{
  select: [noteId: string]
  delete: [noteId: string]
}>()

// 常量
const maxDisplayTags = 3

// 计算属性
const displayTags = computed(() => {
  return props.note.tags.slice(0, maxDisplayTags)
})

// 方法
const handleSelect = () => {
  emit('select', props.note.id)
}

const handleDelete = () => {
  emit('delete', props.note.id)
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  // 超过一周显示具体日期
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style lang="scss" scoped>
.note-list-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 12px 8px;
  margin: 2px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  
  &.has-hover:hover {
    background: var(--bg-hover);
    border-color: var(--border-color);
    
    .note-actions {
      opacity: 1;
    }
  }
  
  &.selected {
    background: var(--primary-bg);
    border-color: var(--primary-color);
    
    .note-title {
      color: var(--primary-color);
    }
    
    .note-actions {
      opacity: 1;
    }
  }
  
  .note-content {
    flex: 1;
    min-width: 0; // 防止内容溢出
    
    .note-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 4px 0;
      line-height: 1.4;
      
      // 文本截断
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .note-preview {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0 0 8px 0;
      line-height: 1.4;
      
      // 多行文本截断
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .note-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 8px;
      
      .tag {
        display: inline-block;
        padding: 2px 6px;
        font-size: 11px;
        background: var(--tag-bg);
        color: var(--tag-color);
        border-radius: 10px;
        border: 1px solid var(--tag-border);
        
        // 文本截断
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .tag-more {
        display: inline-block;
        padding: 2px 6px;
        font-size: 11px;
        color: var(--text-tertiary);
        background: var(--bg-tertiary);
        border-radius: 10px;
      }
    }
    
    .note-meta {
      .note-time {
        font-size: 12px;
        color: var(--text-tertiary);
      }
    }
  }
  
  .note-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
    margin-left: 8px;
    
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: var(--text-tertiary);
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--bg-hover);
        color: var(--text-secondary);
      }
      
      &.delete-btn:hover {
        background: var(--error-bg);
        color: var(--error-color);
      }
      
      i {
        width: 14px;
        height: 14px;
      }
    }
  }
  
  .selected-indicator {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: var(--primary-color);
    border-radius: 0 2px 2px 0;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .note-list-item {
    padding: 10px 6px;
    
    .note-content {
      .note-title {
        font-size: 13px;
      }
      
      .note-preview {
        font-size: 12px;
        -webkit-line-clamp: 1;
      }
      
      .note-tags {
        margin-bottom: 6px;
        
        .tag {
          font-size: 10px;
          padding: 1px 4px;
          max-width: 60px;
        }
        
        .tag-more {
          font-size: 10px;
          padding: 1px 4px;
        }
      }
      
      .note-meta {
        .note-time {
          font-size: 11px;
        }
      }
    }
    
    .note-actions {
      margin-left: 4px;
      
      .action-btn {
        width: 24px;
        height: 24px;
        
        i {
          width: 12px;
          height: 12px;
        }
      }
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .note-list-item {
    &.selected {
      background: rgba(var(--primary-rgb), 0.15);
    }
    
    .note-content {
      .note-tags {
        .tag {
          background: var(--bg-tertiary);
          border-color: var(--border-color-dark);
        }
      }
    }
  }
}
</style> 