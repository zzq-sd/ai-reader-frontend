<template>
  <Teleport to="body">
    <div v-if="visible" class="floating-note-container">
      <!-- 折叠状态：只显示小按钮 -->
      <div 
        v-if="!isExpanded" 
        class="floating-note-trigger"
        :class="{ 'has-existing-note': hasExistingNote }"
        @click="expandEditor"
        :title="hasExistingNote ? '编辑笔记' : '创建笔记'"
      >
        <i :class="hasExistingNote ? 'fas fa-sticky-note' : 'fas fa-edit'"></i>
        <div class="trigger-tooltip">{{ hasExistingNote ? '编辑笔记' : '创建笔记' }}</div>
        <div v-if="hasExistingNote" class="note-indicator"></div>
      </div>

      <!-- 展开状态：显示完整编辑器 -->
      <div 
        v-if="isExpanded"
        class="floating-note-editor" 
        @click.stop
      >
        <!-- 编辑器头部 -->
        <div class="note-editor-header">
          <div class="note-header-left">
            <h3 class="note-editor-title">{{ props.existingNote ? '编辑笔记' : '创建笔记' }}</h3>
          </div>
          <div class="note-header-right">
            <button @click="collapseEditor" class="note-action-btn" title="收起">
              <i class="fas fa-minus"></i>
            </button>
            <button @click="handleClose" class="note-action-btn close" title="关闭">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- 编辑器主体 -->
        <div class="note-editor-body">
          <!-- 笔记标题 -->
          <div class="note-title-section">
            <input 
              v-model="noteData.title"
              type="text" 
              placeholder="输入笔记标题..."
              class="note-title-input"
              @keydown.enter="focusContent"
            />
          </div>

          <!-- 富文本编辑器 -->
          <div class="note-content-section">
            <div class="note-toolbar">
              <button 
                @click="execCommand('bold')" 
                class="toolbar-button" 
                :class="{ active: isCommandActive('bold') }"
                title="粗体"
              >
                <i class="fas fa-bold"></i>
              </button>
              <button 
                @click="execCommand('italic')" 
                class="toolbar-button"
                :class="{ active: isCommandActive('italic') }"
                title="斜体"
              >
                <i class="fas fa-italic"></i>
              </button>
              <button 
                @click="execCommand('underline')" 
                class="toolbar-button"
                :class="{ active: isCommandActive('underline') }"
                title="下划线"
              >
                <i class="fas fa-underline"></i>
              </button>
              <div class="toolbar-divider"></div>
              <button 
                @click="execCommand('insertUnorderedList')" 
                class="toolbar-button"
                title="无序列表"
              >
                <i class="fas fa-list-ul"></i>
              </button>
              <button 
                @click="execCommand('insertOrderedList')" 
                class="toolbar-button"
                title="有序列表"
              >
                <i class="fas fa-list-ol"></i>
              </button>
              <div class="toolbar-divider"></div>
              <button 
                @click="insertSelectedText" 
                class="toolbar-button"
                v-if="selectedText"
                title="插入选中文本"
              >
                <i class="fas fa-quote-right"></i>
              </button>
            </div>
            
            <div 
              ref="contentEditor"
              class="note-content-editor"
              contenteditable="true"
              @input="handleContentInput"
              @focus="handleEditorFocus"
              @blur="handleEditorBlur"
              data-placeholder="开始记录你的想法..."
            ></div>
          </div>

          <!-- 标签输入 -->
          <div class="note-tags-section">
            <div class="tags-input-wrapper">
              <div class="current-tags">
                <span 
                  v-for="(tag, index) in noteData.tags" 
                  :key="index"
                  class="tag-item"
                >
                  {{ tag }}
                  <button @click="removeTag(index)" class="tag-remove">
                    <i class="fas fa-times"></i>
                  </button>
                </span>
              </div>
              <input 
                v-model="tagInput"
                @keydown.enter="addTag"
                @keydown.backspace="handleTagBackspace"
                type="text" 
                placeholder="添加标签..."
                class="tag-input"
              />
            </div>
          </div>
        </div>

        <!-- 编辑器底部 -->
        <div class="note-editor-footer">
          <div class="note-meta">
            <span class="word-count">{{ wordCount }} 字</span>
            <span class="save-status" :class="saveStatus">
              <i :class="saveStatusIcon"></i>
              {{ saveStatusText }}
            </span>
          </div>
          <div class="note-actions">
            <button @click="handleCancel" class="note-btn secondary">
              取消
            </button>
            <button 
              @click="handleSave" 
              class="note-btn primary"
              :disabled="!canSave"
            >
              <i class="fas fa-save"></i>
              保存笔记
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useNotesStore } from '@/stores/notesNew'
import type { NoteRequest } from '@/types/note'

interface Props {
  visible: boolean
  articleId?: string
  selectedText?: string
  existingNote?: any // 已有笔记数据
  initialPosition?: { x: number; y: number }
}

interface Emits {
  (e: 'close'): void
  (e: 'save', note: NoteRequest): void
  (e: 'minimize'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  selectedText: '',
  existingNote: null,
  initialPosition: () => ({ x: 0, y: 0 })
})

const emit = defineEmits<Emits>()

// Store
const notesStore = useNotesStore()

// 响应式数据
const isExpanded = ref(false)
const contentEditor = ref<HTMLElement>()
const tagInput = ref('')
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('unsaved')
const isEditorFocused = ref(false)
const selectedText = ref('')

// 笔记数据
const noteData = ref<NoteRequest>({
  title: '',
  content: '',
  articleId: props.articleId,
  tags: [],
  public: false
})

// 当前是否为编辑模式
const isEditMode = computed(() => !!props.existingNote)

// 是否有已存在的笔记
const hasExistingNote = computed(() => !!props.existingNote || noteData.value.title.trim() || noteData.value.content.trim())

// 计算属性
const wordCount = computed(() => {
  const text = contentEditor.value?.innerText || ''
  return text.trim().length
})

const canSave = computed(() => {
  return noteData.value.title.trim() || (contentEditor.value?.innerText?.trim() || '').length > 0
})

const saveStatusIcon = computed(() => {
  switch (saveStatus.value) {
    case 'saving': return 'fas fa-spinner fa-spin'
    case 'saved': return 'fas fa-check'
    default: return 'fas fa-edit'
  }
})

const saveStatusText = computed(() => {
  switch (saveStatus.value) {
    case 'saving': return '保存中...'
    case 'saved': return '已保存'
    default: return '未保存'
  }
})

// 展开/折叠方法
function expandEditor() {
  isExpanded.value = true
  
  // 获取当前选中的文本
  const selection = window.getSelection()
  if (selection && selection.toString().trim()) {
    selectedText.value = selection.toString().trim()
  }
  
  nextTick(() => {
    // 如果有选中文本，自动插入
    if (selectedText.value) {
      insertSelectedText()
    }
    
    if (noteData.value.title === '' && !selectedText.value) {
      const titleInput = document.querySelector('.note-title-input') as HTMLInputElement
      titleInput?.focus()
    } else {
      focusContent()
    }
  })
}

function collapseEditor() {
  if (canSave.value && saveStatus.value === 'unsaved') {
    if (confirm('您有未保存的更改，确定要收起吗？')) {
      isExpanded.value = false
    }
  } else {
    isExpanded.value = false
  }
}

// 方法
function handleClose() {
  if (canSave.value && saveStatus.value === 'unsaved') {
    if (confirm('您有未保存的更改，确定要关闭吗？')) {
      emit('close')
    }
  } else {
    emit('close')
  }
}

function handleCancel() {
  handleClose()
}

async function handleSave() {
  if (!canSave.value) return

  try {
    saveStatus.value = 'saving'
    
    // 获取内容
    const content = contentEditor.value?.innerHTML || ''
    const noteToSave: NoteRequest = {
      ...noteData.value,
      content: content
    }

    console.log('保存笔记数据:', noteToSave)
    console.log('编辑模式:', isEditMode.value)
    console.log('已有笔记:', props.existingNote)

    if (isEditMode.value && props.existingNote) {
      // 编辑模式：更新已有笔记
      console.log('更新笔记 ID:', props.existingNote.id)
      await notesStore.updateNote(props.existingNote.id, noteToSave)
    } else {
      // 创建模式：创建新笔记
      console.log('创建新笔记')
      await notesStore.createNote(noteToSave)
    }
    
    saveStatus.value = 'saved'
    emit('save', noteToSave)
    
    // 延迟关闭
    setTimeout(() => {
      emit('close')
    }, 1000)
    
  } catch (error) {
    console.error('保存笔记失败:', error)
    saveStatus.value = 'unsaved'
    alert('保存失败，请重试')
  }
}

function focusContent() {
  nextTick(() => {
    contentEditor.value?.focus()
  })
}

function handleContentInput() {
  saveStatus.value = 'unsaved'
}

function handleEditorFocus() {
  isEditorFocused.value = true
}

function handleEditorBlur() {
  isEditorFocused.value = false
}

// 富文本编辑命令
function execCommand(command: string, value?: string) {
  document.execCommand(command, false, value)
  contentEditor.value?.focus()
  saveStatus.value = 'unsaved'
}

function isCommandActive(command: string): boolean {
  return document.queryCommandState(command)
}

function insertSelectedText() {
  if (selectedText.value) {
    const quotedText = `<blockquote>${selectedText.value}</blockquote><p></p>`
    document.execCommand('insertHTML', false, quotedText)
    saveStatus.value = 'unsaved'
    // 清空选中文本，避免重复插入
    selectedText.value = ''
  }
}

// 标签管理
function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !noteData.value.tags?.includes(tag)) {
    if (!noteData.value.tags) {
      noteData.value.tags = []
    }
    noteData.value.tags.push(tag)
    tagInput.value = ''
    saveStatus.value = 'unsaved'
  }
}

function removeTag(index: number) {
  noteData.value.tags?.splice(index, 1)
  saveStatus.value = 'unsaved'
}

function handleTagBackspace() {
  if (!tagInput.value && noteData.value.tags?.length) {
    noteData.value.tags.pop()
    saveStatus.value = 'unsaved'
  }
}

// 生命周期
onMounted(() => {
  // 自动检查该文章是否已有笔记
  if (props.articleId) {
    checkExistingNote()
  }
})

// 自动检查已有笔记
async function checkExistingNote() {
  if (!props.articleId) return
  
  try {
    const { noteService } = await import('@/api/noteService')
    const response = await noteService.getArticleNotes(props.articleId, { page: 0, size: 1 })
    
    if (response.data?.success && response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      // 找到已有笔记，更新笔记数据
      const existingNote = response.data.data[0]
      noteData.value = {
        title: existingNote.title || '',
        content: existingNote.content || '',
        articleId: props.articleId,
        tags: existingNote.tags || [],
        public: existingNote.isPublic || false
      }
      
      // 设置编辑器内容
      nextTick(() => {
        if (contentEditor.value) {
          contentEditor.value.innerHTML = existingNote.content || ''
        }
      })
      
      saveStatus.value = 'saved'
    }
  } catch (error) {
    console.warn('检查已有笔记失败:', error)
  }
}

// 监听 Escape 键关闭
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 监听可见性变化
watch(() => props.visible, (newValue) => {
  if (newValue) {
    // 组件变为可见时，默认显示悬浮按钮（折叠状态）
    isExpanded.value = false
    
    // 如果有已有笔记，加载其数据
    if (props.existingNote) {
      loadExistingNoteData()
    } else {
      // 重置为空白笔记
      resetNoteData()
    }
  } else {
    // 组件隐藏时重置为折叠状态
    isExpanded.value = false
  }
})

// 加载已有笔记数据
function loadExistingNoteData() {
  if (!props.existingNote) return
  
  console.log('加载已有笔记数据:', props.existingNote)
  console.log('当前文章ID:', props.articleId)
  
  noteData.value = {
    title: props.existingNote.title || '',
    content: props.existingNote.content || '',
    articleId: props.articleId, // 始终使用当前文章ID，确保关联正确
    tags: props.existingNote.tags || [],
    public: props.existingNote.isPublic || false
  }
  
  // 设置编辑器内容
  nextTick(() => {
    if (contentEditor.value) {
      contentEditor.value.innerHTML = props.existingNote.content || ''
    }
  })
  
  saveStatus.value = 'saved'
}

// 重置笔记数据
function resetNoteData() {
  noteData.value = {
    title: '',
    content: '',
    articleId: props.articleId,
    tags: [],
    public: false
  }
  
  // 清空编辑器内容
  nextTick(() => {
    if (contentEditor.value) {
      contentEditor.value.innerHTML = ''
    }
  })
  
  saveStatus.value = 'unsaved'
}
</script>

<style scoped lang="scss">
// 浮动笔记容器
.floating-note-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000;
}

// 悬浮触发按钮 - 小尖尖
.floating-note-trigger {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #a855f7, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 
    0 8px 25px rgba(168, 85, 247, 0.3),
    0 4px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: float 3s ease-in-out infinite;
  position: relative;
  
  i {
    color: white;
    font-size: 20px;
  }
  
  &.has-existing-note {
    background: linear-gradient(135deg, #10b981, #059669);
    
    &:hover {
      box-shadow: 
        0 12px 35px rgba(16, 185, 129, 0.4),
        0 6px 15px rgba(0, 0, 0, 0.3);
    }
  }
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 
      0 12px 35px rgba(168, 85, 247, 0.4),
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

// 编辑器主体 - 从右下角展开
.floating-note-editor {
  width: 400px;
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
  animation: editorSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: bottom right;
  
  // 调整位置，确保从右下角展开
  position: absolute;
  bottom: 0;
  right: 0;
}

@keyframes editorSlideIn {
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
.note-editor-header {
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

.note-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.note-editor-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.note-header-right {
  display: flex;
  gap: 8px;
}

.note-action-btn {
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
.note-editor-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.note-title-section {
  .note-title-input {
    width: 100%;
    border: none;
    background: transparent;
    font-size: 20px;
    font-weight: 600;
    color: #f1f5f9;
    outline: none;
    padding: 12px 0;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;

    &:focus {
      border-bottom-color: #a855f7;
      text-shadow: 0 0 8px rgba(168, 85, 247, 0.3);
    }

    &::placeholder {
      color: #64748b;
      font-weight: 400;
    }
  }
}

.note-content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(25px) saturate(150%);
  -webkit-backdrop-filter: blur(25px) saturate(150%);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

.toolbar-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.6);
    color: #e2e8f0;
    transform: scale(1.05);
  }

  &.active {
    background: #a855f7;
    color: white;
    box-shadow: 0 0 12px rgba(168, 85, 247, 0.4);
  }
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 8px;
}

.note-content-editor {
  flex: 1;
  min-height: 200px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(30px) saturate(120%);
  -webkit-backdrop-filter: blur(30px) saturate(120%);
  outline: none;
  font-size: 14px;
  line-height: 1.6;
  color: #e2e8f0;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);

  &:focus {
    border-color: #a855f7;
    background: rgba(0, 0, 0, 0.4);
    box-shadow: 
      0 0 0 3px rgba(168, 85, 247, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  &[data-placeholder]:empty::before {
    content: attr(data-placeholder);
    color: #64748b;
    pointer-events: none;
  }
}

// 标签部分
.note-tags-section {
  .tags-input-wrapper {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(30px) saturate(120%);
    -webkit-backdrop-filter: blur(30px) saturate(120%);
    border: 1px solid rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    min-height: 48px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }

  .current-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #7b61ff;
    color: white;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .tag-remove {
    border: none;
    background: transparent;
    color: white;
    cursor: pointer;
    padding: 0;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    font-size: 10px;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  .tag-input {
    flex: 1;
    min-width: 120px;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: #e2e8f0;

    &::placeholder {
      color: #64748b;
    }
  }
}

// 底部 - 深色毛玻璃效果
.note-editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.4), 
    rgba(17, 24, 39, 0.3), 
    rgba(30, 41, 59, 0.2)
  );
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  flex-shrink: 0;
}

.note-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #94a3b8;
}

.save-status {
  display: flex;
  align-items: center;
  gap: 4px;

  &.saving {
    color: #f59e0b;
  }

  &.saved {
    color: #10b981;
  }

  &.unsaved {
    color: #6b7280;
  }
}

.note-actions {
  display: flex;
  gap: 12px;
}

.note-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  &.secondary {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: #94a3b8;

    &:hover {
      background: rgba(0, 0, 0, 0.5);
      border-color: rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }

  &.primary {
    background: linear-gradient(135deg, #a855f7, #8b5cf6);
    border: 1px solid rgba(168, 85, 247, 0.3);
    color: white;
    box-shadow: 0 2px 8px rgba(168, 85, 247, 0.2);

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #9333ea, #7c3aed);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(168, 85, 247, 0.4);
    }

    &:disabled {
      background: rgba(75, 85, 99, 0.5);
      border-color: rgba(75, 85, 99, 0.3);
      cursor: not-allowed;
      box-shadow: none;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .floating-note-container {
    bottom: 10px;
    right: 10px;
  }

  .floating-note-trigger {
    width: 48px;
    height: 48px;
    
    i {
      font-size: 18px;
    }
  }

  .floating-note-editor {
    width: calc(100vw - 20px);
    max-height: 90vh;
    right: -10px;
    bottom: -10px;
  }

  .note-editor-header {
    padding: 12px 16px;
  }

  .note-editor-body {
    padding: 16px;
  }

  .note-editor-footer {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
  }

  .note-actions {
    width: 100%;
    justify-content: stretch;

    .note-btn {
      flex: 1;
    }
  }
}

// 强制深色主题 - 移除亮色主题支持

// 笔记存在指示器
.note-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 12px;
  height: 12px;
  background: #fbbf24;
  border: 2px solid white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}
</style> 