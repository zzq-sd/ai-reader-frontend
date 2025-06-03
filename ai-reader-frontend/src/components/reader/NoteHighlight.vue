<template>
  <div class="note-highlight" :style="positionStyle">
    <div class="note-popup">
      <div class="note-header">
        <h4 class="note-title">
          <i class="fas fa-sticky-note"></i>
          {{ note ? '编辑笔记' : '添加笔记' }}
        </h4>
        <button class="close-button" @click="handleCancel">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="note-body">
        <!-- 高亮文本 -->
        <div class="highlighted-text" v-if="highlightedText">
          <div class="highlight-label">选中文本：</div>
          <div class="highlight-content">{{ highlightedText }}</div>
        </div>
        
        <!-- 笔记内容 -->
        <div class="note-content">
          <label class="content-label">笔记内容：</label>
          <textarea 
            v-model="noteContent"
            class="content-textarea"
            placeholder="在此添加您的笔记..."
            rows="4"
            @keydown.enter.ctrl="handleSave"
            @keydown.enter.meta="handleSave"
          ></textarea>
        </div>
        
        <!-- 颜色选择 -->
        <div class="color-picker">
          <label class="color-label">高亮颜色：</label>
          <div class="color-options">
            <button 
              v-for="color in colorOptions"
              :key="color.value"
              class="color-option"
              :class="{ 'active': selectedColor === color.value }"
              :style="{ backgroundColor: color.value }"
              :title="color.name"
              @click="selectedColor = color.value"
            >
              <i v-if="selectedColor === color.value" class="fas fa-check"></i>
            </button>
          </div>
        </div>
        
        <!-- 标签 -->
        <div class="note-tags">
          <label class="tags-label">标签：</label>
          <div class="tags-input">
            <div class="selected-tags">
              <span 
                v-for="tag in selectedTags"
                :key="tag"
                class="tag"
              >
                {{ tag }}
                <button @click="removeTag(tag)" class="tag-remove">
                  <i class="fas fa-times"></i>
                </button>
              </span>
            </div>
            <input 
              v-model="tagInput"
              class="tag-input"
              placeholder="添加标签..."
              @keydown.enter="addTag"
              @keydown.comma="addTag"
            />
          </div>
        </div>
      </div>
      
      <div class="note-footer">
        <div class="note-actions">
          <button 
            v-if="note"
            class="action-button delete-button"
            @click="handleDelete"
          >
            <i class="fas fa-trash"></i>
            删除
          </button>
          
          <div class="primary-actions">
            <button class="action-button cancel-button" @click="handleCancel">
              取消
            </button>
            <button 
              class="action-button save-button"
              @click="handleSave"
              :disabled="!noteContent.trim() && !highlightedText"
            >
              <i class="fas fa-save"></i>
              {{ note ? '更新' : '保存' }}
            </button>
          </div>
        </div>
        
        <div class="note-info" v-if="note">
          <span class="created-time">
            创建于 {{ formatDate(note.createdAt) }}
          </span>
          <span v-if="note.updatedAt !== note.createdAt" class="updated-time">
            · 更新于 {{ formatDate(note.updatedAt) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { ArticleNote } from '@/api/reader'

// Props
interface Props {
  note?: ArticleNote | null
  position: { x: number; y: number }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'save': [note: ArticleNote]
  'cancel': []
  'delete': [noteId: string]
}>()

// 响应式数据
const noteContent = ref('')
const selectedColor = ref('#ffeb3b')
const selectedTags = ref<string[]>([])
const tagInput = ref('')
const highlightedText = ref('')

// 颜色选项
const colorOptions = [
  { name: '黄色', value: '#ffeb3b' },
  { name: '绿色', value: '#4caf50' },
  { name: '蓝色', value: '#2196f3' },
  { name: '橙色', value: '#ff9800' },
  { name: '紫色', value: '#9c27b0' },
  { name: '红色', value: '#f44336' }
]

// 计算属性
const positionStyle = computed(() => ({
  position: 'fixed',
  top: `${props.position.y}px`,
  left: `${props.position.x}px`,
  zIndex: 1003
}))

// 事件处理
function handleSave() {
  if (!noteContent.value.trim() && !highlightedText.value) return
  
  const noteData: ArticleNote = {
    id: props.note?.id || generateId(),
    articleId: props.note?.articleId || '',
    content: noteContent.value,
    highlightText: highlightedText.value,
    position: props.note?.position || { start: 0, end: 0 },
    color: selectedColor.value,
    tags: selectedTags.value,
    createdAt: props.note?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  emit('save', noteData)
}

function handleCancel() {
  emit('cancel')
}

function handleDelete() {
  if (props.note?.id) {
    emit('delete', props.note.id)
  }
}

function addTag() {
  const tag = tagInput.value.trim().replace(',', '')
  if (tag && !selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag)
    tagInput.value = ''
  }
}

function removeTag(tag: string) {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听props变化
watch(() => props.note, (newNote) => {
  if (newNote) {
    noteContent.value = newNote.content
    selectedColor.value = newNote.color
    selectedTags.value = [...(newNote.tags || [])]
    highlightedText.value = newNote.highlightText
  } else {
    noteContent.value = ''
    selectedColor.value = '#ffeb3b'
    selectedTags.value = []
    highlightedText.value = ''
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  // 自动聚焦到文本框
  const textarea = document.querySelector('.content-textarea') as HTMLTextAreaElement
  if (textarea) {
    textarea.focus()
  }
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.note-highlight {
  position: fixed;
  z-index: 1003;
}

.note-popup {
  width: 400px;
  max-width: 90vw;
  
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  
  animation: popupSlideIn 0.3s ease-out;
  
  @include mobile {
    width: 320px;
  }
}

.note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  padding: spacing(4);
  border-bottom: 1px solid var(--color-border-primary);
  
  .note-title {
    display: flex;
    align-items: center;
    gap: spacing(2);
    
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
    
    i {
      color: var(--color-accent-primary);
    }
  }
  
  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    
    width: 32px;
    height: 32px;
    
    background: transparent;
    border: none;
    border-radius: var(--border-radius-s);
    
    color: var(--color-text-secondary);
    cursor: pointer;
    
    transition: all var(--transition-speed-fast);
    
    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
  }
}

.note-body {
  padding: spacing(4);
  
  .highlighted-text {
    margin-bottom: spacing(4);
    
    .highlight-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-bottom: spacing(1);
    }
    
    .highlight-content {
      padding: spacing(2) spacing(3);
      
      background: var(--color-bg-secondary);
      border-left: 3px solid var(--color-accent-primary);
      border-radius: var(--border-radius-s);
      
      font-size: 14px;
      line-height: 1.5;
      color: var(--color-text-primary);
    }
  }
  
  .note-content {
    margin-bottom: spacing(4);
    
    .content-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-bottom: spacing(1);
    }
    
    .content-textarea {
      width: 100%;
      padding: spacing(3);
      
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-primary);
      border-radius: var(--border-radius-s);
      
      font-size: 14px;
      line-height: 1.5;
      color: var(--color-text-primary);
      resize: vertical;
      
      transition: border-color var(--transition-speed-fast);
      
      &:focus {
        outline: none;
        border-color: var(--color-accent-primary);
      }
      
      &::placeholder {
        color: var(--color-text-disabled);
      }
    }
  }
  
  .color-picker {
    margin-bottom: spacing(4);
    
    .color-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-bottom: spacing(2);
    }
    
    .color-options {
      display: flex;
      gap: spacing(2);
      
      .color-option {
        width: 32px;
        height: 32px;
        
        border: 2px solid transparent;
        border-radius: 50%;
        cursor: pointer;
        
        display: flex;
        align-items: center;
        justify-content: center;
        
        color: white;
        font-size: 12px;
        
        transition: all var(--transition-speed-fast);
        
        &:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        &.active {
          border-color: var(--color-text-primary);
          transform: scale(1.1);
        }
      }
    }
  }
  
  .note-tags {
    .tags-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-bottom: spacing(2);
    }
    
    .tags-input {
      display: flex;
      flex-wrap: wrap;
      gap: spacing(1);
      
      padding: spacing(2);
      
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-primary);
      border-radius: var(--border-radius-s);
      
      &:focus-within {
        border-color: var(--color-accent-primary);
      }
      
      .selected-tags {
        display: flex;
        flex-wrap: wrap;
        gap: spacing(1);
        
        .tag {
          display: flex;
          align-items: center;
          gap: spacing(1);
          
          padding: spacing(0.5) spacing(2);
          
          background: var(--color-accent-primary);
          color: white;
          font-size: 12px;
          border-radius: var(--border-radius-s);
          
          .tag-remove {
            background: transparent;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 10px;
            
            &:hover {
              opacity: 0.7;
            }
          }
        }
      }
      
      .tag-input {
        flex: 1;
        min-width: 100px;
        
        background: transparent;
        border: none;
        outline: none;
        
        font-size: 14px;
        color: var(--color-text-primary);
        
        &::placeholder {
          color: var(--color-text-disabled);
        }
      }
    }
  }
}

.note-footer {
  padding: spacing(4);
  border-top: 1px solid var(--color-border-primary);
  
  .note-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: spacing(2);
    
    .primary-actions {
      display: flex;
      gap: spacing(2);
    }
    
    .action-button {
      display: flex;
      align-items: center;
      gap: spacing(1);
      
      padding: spacing(2) spacing(4);
      
      border: 1px solid var(--color-border-primary);
      border-radius: var(--border-radius-s);
      
      font-size: 14px;
      cursor: pointer;
      
      transition: all var(--transition-speed-fast);
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &.save-button {
        background: var(--color-accent-primary);
        border-color: var(--color-accent-primary);
        color: white;
        
        &:hover:not(:disabled) {
          background: var(--color-accent-secondary);
        }
      }
      
      &.cancel-button {
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
        
        &:hover {
          background: var(--color-bg-hover);
        }
      }
      
      &.delete-button {
        background: var(--color-error);
        border-color: var(--color-error);
        color: white;
        
        &:hover {
          background: #d32f2f;
        }
      }
    }
  }
  
  .note-info {
    font-size: 12px;
    color: var(--color-text-disabled);
    
    .updated-time {
      opacity: 0.7;
    }
  }
}

// 动画
@keyframes popupSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

// 响应式设计
@include mobile {
  .note-popup {
    .note-header,
    .note-body,
    .note-footer {
      padding: spacing(3);
    }
    
    .color-options {
      .color-option {
        width: 28px;
        height: 28px;
        font-size: 10px;
      }
    }
    
    .note-actions {
      flex-direction: column;
      gap: spacing(2);
      
      .primary-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  }
}
</style> 