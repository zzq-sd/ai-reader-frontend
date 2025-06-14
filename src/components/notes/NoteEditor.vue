<template>
  <div class="note-editor">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <div class="header-left">
        <!-- 标题编辑 -->
        <input
          v-model="localTitle"
          type="text"
          placeholder="无标题笔记"
          class="title-input"
          @input="titleChanged = true"
          @blur="updateTitle"
          @keydown.enter="handleTitleEnter"
        />
      </div>
      
      <div class="header-right">
        <!-- 保存状态指示器 -->
        <div class="save-status">
          <span v-if="!hasUnsavedChanges" class="status-saved">
            <i class="fas fa-check"></i>
            已保存
          </span>
        </div>
        
        <!-- 操作按钮 -->
        <div class="header-actions">
          <button
            class="btn btn-secondary"
            @click="handleSave"
            :disabled="!hasUnsavedChanges || loading"
          >
            <i class="fas fa-save"></i>
            保存
          </button>
          
          <button
            class="btn btn-primary"
            @click="handleAnalyze"
            :disabled="loading"
          >
            <i class="fas fa-brain"></i>
            AI分析
          </button>
          
          <button
            class="btn btn-danger"
            @click="handleDelete"
            :disabled="loading"
          >
                          <i class="fas fa-trash"></i>
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 标签管理 -->
    <div class="tags-section">
      <div class="tags-header">
        <span class="tags-label">标签</span>
        <button
          class="add-tag-btn"
          @click="showTagInput = true"
          v-if="!showTagInput"
        >
                      <i class="fas fa-plus"></i>
          添加标签
        </button>
      </div>
      
      <div class="tags-content">
        <!-- 现有标签 -->
        <div v-if="localTags.length > 0" class="current-tags">
          <span
            v-for="tag in localTags"
            :key="tag"
            class="tag"
          >
            {{ tag }}
            <button
              class="tag-remove"
              @click="removeTag(tag)"
            >
              <i class="fas fa-times"></i>
            </button>
          </span>
        </div>
        
        <!-- 添加标签输入框 -->
        <div v-if="showTagInput" class="tag-input-wrapper">
          <input
            ref="tagInputRef"
            v-model="newTagInput"
            type="text"
            placeholder="输入标签名称"
            class="tag-input"
            @keydown.enter="addTag"
            @keydown.escape="cancelTagInput"
            @blur="cancelTagInput"
          />
        </div>
      </div>
    </div>

    <!-- 富文本编辑器 -->
    <div class="editor-content">
      <div
        ref="editorRef"
        class="quill-editor"
      ></div>
    </div>

    <!-- 编辑器底部工具栏 -->
    <div class="editor-footer">
      <div class="footer-left">
        <span class="word-count">{{ wordCount }} 字</span>
        <span class="last-modified">最后修改：{{ formatTime(note.lastModified) }}</span>
      </div>
      
      <div class="footer-right">
        <button
          class="btn btn-text"
          @click="toggleFullscreen"
        >
          <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"></i>
          {{ isFullscreen ? '退出全屏' : '全屏编辑' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { Note } from '@/api/notes.d'

// Props
interface Props {
  note: Note
  loading?: boolean
  hasUnsavedChanges?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  hasUnsavedChanges: false
})

// Events
const emit = defineEmits<{
  save: []
  delete: []
  'update-title': [title: string]
  'update-content': [content: any[]]
  'add-tag': [tag: string]
  'remove-tag': [tag: string]
  analyze: []
}>()

// 响应式状态
const localTitle = ref('')
const titleChanged = ref(false)
const localTags = ref<string[]>([])
const showTagInput = ref(false)
const newTagInput = ref('')
const isFullscreen = ref(false)
const editorRef = ref<HTMLElement>()
const tagInputRef = ref<HTMLInputElement>()

// Quill编辑器实例
let quillInstance: any = null

// 计算属性
const wordCount = computed(() => {
  if (!quillInstance) return 0
  const text = quillInstance.getText()
  return text.trim().length
})

// 方法
const handleTitleEnter = (event: KeyboardEvent) => {
  const target = event.target as HTMLInputElement
  if (target) {
    target.blur()
  }
}

const initializeEditor = async () => {
  if (!editorRef.value) return
  
  try {
    // 动态导入Quill和样式
    const [QuillModule, QuillStyles] = await Promise.all([
      import('quill'),
      import('quill/dist/quill.snow.css')
    ])
    
    const Quill = QuillModule.default
    
    // 配置Quill工具栏
    const toolbarOptions = [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ]
    
    // 创建Quill实例
    quillInstance = new Quill(editorRef.value, {
      theme: 'snow',
      modules: {
        toolbar: toolbarOptions
      },
      placeholder: '开始写作...'
    })
    
    // 等待编辑器初始化完成
    await nextTick()
    
    // 设置初始内容
    loadContent(props.note.content)
    
    // 监听内容变化
    quillInstance.on('text-change', () => {
      const content = quillInstance.getContents()
      emit('update-content', content.ops)
    })
    
  } catch (error) {
    console.error('初始化编辑器失败:', error)
  }
}

// 加载内容到编辑器
const loadContent = (content: any) => {
  if (!quillInstance) return
  
  try {
    // 如果内容为空，设置空内容
    if (!content || content.length === 0) {
      quillInstance.setContents([])
      return
    }
    
    // 如果是字符串，尝试解析JSON
    if (typeof content === 'string') {
      try {
        const parsedContent = JSON.parse(content)
        if (parsedContent && typeof parsedContent === 'object') {
          // 如果是Delta格式 {ops: [...]}
          if (parsedContent.ops && Array.isArray(parsedContent.ops)) {
            quillInstance.setContents(parsedContent)
          }
          // 如果是ops数组格式
          else if (Array.isArray(parsedContent)) {
            quillInstance.setContents({ ops: parsedContent })
          }
          // 其他对象格式
          else {
            quillInstance.setContents(parsedContent)
          }
        } else {
          // 纯文本
          quillInstance.setText(content)
        }
      } catch (e) {
        // JSON解析失败，当作纯文本
        quillInstance.setText(content)
      }
    }
    // 如果已经是对象格式
    else if (typeof content === 'object') {
      quillInstance.setContents(content)
    }
  } catch (e) {
    console.error('加载内容到编辑器失败:', e)
    quillInstance.setText('')
  }
}

const updateTitle = async () => {
  // 只有当标题确实发生变化时才更新
  if (titleChanged.value) {
    // 只有当标题为空字符串时才使用默认值
    const finalTitle = localTitle.value.trim() === '' ? '无标题笔记' : localTitle.value
    
    // 先更新本地标题，确保界面显示正确
    localTitle.value = finalTitle
    
    // 发送更新事件到父组件
    emit('update-title', finalTitle)
    
    // 重置标题变更标志
    titleChanged.value = false
    
    console.log('标题已更新:', finalTitle)
  }
}

const addTag = () => {
  const tag = newTagInput.value.trim()
  if (tag && !localTags.value.includes(tag)) {
    localTags.value.push(tag)
    emit('add-tag', tag)
  }
  newTagInput.value = ''
  showTagInput.value = false
}

const removeTag = (tag: string) => {
  const index = localTags.value.indexOf(tag)
  if (index >= 0) {
    localTags.value.splice(index, 1)
    emit('remove-tag', tag)
  }
}

const cancelTagInput = () => {
  newTagInput.value = ''
  showTagInput.value = false
}

const handleAnalyze = () => {
  emit('analyze')
}

const handleSave = () => {
  emit('save')
}

const handleDelete = () => {
  emit('delete')
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  // TODO: 实现全屏逻辑
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听props变化
watch(() => props.note, (newNote) => {
  // 只有当本地标题未被修改时，才使用从props获取的标题
  if (!titleChanged.value) {
    localTitle.value = newNote.title || '无标题笔记'
  }
  localTags.value = [...newNote.tags]
  
  // 更新编辑器内容
  if (quillInstance && newNote.content) {
    // 确保内容正确加载
    nextTick(() => {
      loadContent(newNote.content)
    })
  }
}, { immediate: true, deep: true })

// 监听标签输入显示状态
watch(showTagInput, async (show) => {
  if (show) {
    await nextTick()
    tagInputRef.value?.focus()
  }
})

// 生命周期
onMounted(() => {
  initializeEditor()
})

onUnmounted(() => {
  if (quillInstance) {
    quillInstance = null
  }
})
</script>

<style lang="scss" scoped>
.note-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  
  .header-left {
    flex: 1;
    
    .title-input {
      width: 100%;
      max-width: 600px;
      padding: 8px 12px;
      border: none;
      background: var(--bg-primary);
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
      outline: none;
      border-radius: 8px;
      transition: all 0.2s ease;
      
      &::placeholder {
        color: var(--text-tertiary);
      }
      
      &:focus {
        background: var(--bg-hover);
        box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.2);
      }
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .save-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      
      .status-saved {
        color: var(--success-color, #10b981);
        
        i {
          font-size: 14px;
        }
      }
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
      
      .btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        &.btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border-color, #3a3a43);
          
          &:hover:not(:disabled) {
            background: var(--bg-hover);
            transform: translateY(-1px);
          }
        }
        
        &.btn-primary {
          background: var(--color-accent-primary, #7B61FF);
          color: white;
          
          &:hover:not(:disabled) {
            background: var(--color-accent-primary-hover, #6951e6);
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(123, 97, 255, 0.3);
          }
        }
        
        &.btn-danger {
          background: var(--error-bg);
          color: var(--error-color);
          border: 1px solid var(--error-color, #ef4444);
          
          &:hover:not(:disabled) {
            background: var(--error-hover);
            transform: translateY(-1px);
          }
        }
        
        i {
          width: 14px;
          height: 14px;
        }
      }
    }
  }
}

.tags-section {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  
  .tags-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    
    .tags-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .add-tag-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 12px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }
      
      i {
        font-size: 12px;
      }
    }
  }
  
  .tags-content {
    .current-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
      
      .tag {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        background: var(--tag-bg);
        color: var(--tag-color);
        border: 1px solid var(--tag-border);
        border-radius: 12px;
        font-size: 12px;
        
        .tag-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
          border-radius: 50%;
          transition: background-color 0.2s ease;
          
          &:hover {
            background: rgba(0, 0, 0, 0.1);
          }
          
          i {
            font-size: 10px;
          }
        }
      }
    }
    
    .tag-input-wrapper {
      .tag-input {
        padding: 4px 8px;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 12px;
        outline: none;
        
        &:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
        }
      }
    }
  }
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .quill-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    :deep(.ql-toolbar) {
      border: none;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
      padding: 12px 24px;
    }
    
    :deep(.ql-container) {
      flex: 1;
      border: none;
      font-size: 16px;
      line-height: 1.6;
      
      .ql-editor {
        padding: 24px;
        color: var(--text-primary);
        
        &.ql-blank::before {
          color: var(--text-tertiary);
          font-style: normal;
        }
        
        p, h1, h2, h3, h4, h5, h6 {
          margin-bottom: 12px;
        }
        
        h1, h2, h3 {
          color: var(--text-primary);
          font-weight: 600;
        }
        
        blockquote {
          border-left: 4px solid var(--primary-color);
          padding-left: 16px;
          margin: 16px 0;
          color: var(--text-secondary);
          background: var(--bg-secondary);
          padding: 12px 16px;
          border-radius: 0 6px 6px 0;
        }
        
        code {
          background: var(--bg-secondary);
          padding: 2px 4px;
          border-radius: 3px;
          font-family: var(--font-mono);
        }
        
        pre {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
        }
      }
    }
  }
}

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  
  .footer-left {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 12px;
    color: var(--text-tertiary);
    
    .word-count {
      font-weight: 500;
    }
  }
  
  .footer-right {
    .btn-text {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 12px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }
      
      i {
        width: 12px;
        height: 12px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .editor-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    
    .header-left {
      .title-input {
        font-size: 20px;
      }
    }
    
    .header-right {
      justify-content: space-between;
    }
  }
  
  .tags-section {
    padding: 12px 16px;
  }
  
  .editor-content {
    .quill-editor {
      :deep(.ql-toolbar) {
        padding: 8px 16px;
      }
      
      :deep(.ql-container .ql-editor) {
        padding: 16px;
        font-size: 14px;
      }
    }
  }
  
  .editor-footer {
    padding: 8px 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    
    .footer-left,
    .footer-right {
      justify-content: center;
    }
  }
}
</style> 