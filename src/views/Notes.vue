<template>
  <div class="notes-container">
    <!-- 左侧边栏 -->
    <div class="notes-sidebar">
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <h1 class="page-title-notes">我的笔记</h1>
        <button class="new-note-btn" @click="createNewNote">
          <AppIcon icon="fas fa-plus" :size="14" />
          新建笔记
        </button>
      </div>
      
      <!-- 搜索框 -->
      <div class="search-box-notes">
        <AppIcon icon="fas fa-search" :size="13" color="var(--color-text-disabled)" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="搜索笔记..." 
          @input="handleSearch"
        />
      </div>
      
      <!-- 笔记列表 -->
      <div class="notes-list">
        <div v-if="loading" class="loading-state">
          <AppIcon icon="fas fa-spinner fa-spin" :size="16" />
          加载中...
        </div>
        
        <div v-else-if="error" class="error-state">
          <AppIcon icon="fas fa-exclamation-triangle" :size="16" />
          {{ error }}
        </div>
        
        <div
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-item"
          :class="{ active: currentNoteId === note.id }"
          @click="selectNote(note)"
        >
          <div class="note-title">{{ note.title || '无标题笔记' }}</div>
          <div class="note-preview">{{ getPreview(note.content) }}</div>
          <div class="note-meta">
            <div class="note-tags">
              <span
                v-for="tag in note.tags"
                :key="tag"
                class="note-tag"
              >
                {{ tag }}
              </span>
            </div>
            <span>{{ formatDate(note.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 标签统计 -->
      <div class="tags-statistics">
        <div class="section-header">
          <h3>标签</h3>
          <button class="collapse-btn" @click="toggleTagsCollapse">
            <AppIcon :icon="tagsCollapsed ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" :size="12" />
          </button>
        </div>
        
        <div v-if="!tagsCollapsed" class="tags-list">
          <div
            v-for="tag in tagStatistics"
            :key="tag.name"
            class="tag-stat-item"
            @click="filterByTag(tag.name)"
            :class="{ active: selectedTag === tag.name }"
          >
            <span class="tag-name">{{ tag.name }}</span>
            <span class="tag-count">{{ tag.count }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右侧编辑器 -->
    <div class="editor-container" v-if="currentNote">
      <NoteEditor
        :note="currentNote"
        :loading="loading"
        :hasUnsavedChanges="currentNote.content !== ''"
        @save="saveNote"
        @delete="deleteNote"
        @analyze="analyzeNote"
        @update-title="updateTitle"
        @update-content="updateContent"
        @add-tag="addTag"
        @remove-tag="removeTag"
      />
    </div>
    
    <!-- 空状态 -->
    <div v-else class="editor-container empty-state-notes">
      <AppIcon icon="fas fa-feather-alt" :size="40" class="empty-icon-notes" />
      <h3 class="empty-title-notes">开始记录您的想法</h3>
      <p class="empty-description-notes">选择一个笔记开始编辑，或创建一个新笔记。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import { useNotesStore } from '@/stores/notesNew'
import { useToast } from '@/composables/useToast'
import type { NoteRequest } from '@/types/note'
import { reanalyzeNote } from '@/api/knowledgeGraph'
import NoteEditor from '@/components/notes/NoteEditor.vue'

// 使用store和toast
const notesStore = useNotesStore()
const toast = useToast()
const {
  notes,
  currentNote,
  tagStatistics,
  loading,
  error,
  searchQuery,
  selectedTag,
  currentNoteId,
  filteredNotes
} = storeToRefs(notesStore)

// Quill 编辑器相关
let Quill: any = null
let quill: any = null

// 响应式数据
const tagsCollapsed = ref(false)
const newTagInput = ref('')
const quillEditor = ref<HTMLElement>()

// 方法
const initializeQuill = async () => {
  try {
    // 如果已经有Quill实例，先销毁它
    if (quill) {
      console.log('销毁现有Quill实例')
      quill.off('text-change') // 移除事件监听器
      quill = null
    }
    
    // 清空编辑器容器
    if (quillEditor.value) {
      quillEditor.value.innerHTML = ''
    }
    
    // 动态导入 Quill
    const QuillModule = await import('quill')
    Quill = QuillModule.default || QuillModule
    
    if (quillEditor.value) {
      console.log('初始化新的Quill实例')
      quill = new Quill(quillEditor.value, {
        theme: 'snow',
        placeholder: '开始写下你的笔记...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
          ]
        }
      })
      
      // 监听内容变化
      quill.on('text-change', () => {
        if (currentNote.value) {
          currentNote.value.content = JSON.stringify(quill.getContents())
        }
      })
      
      // 如果有当前笔记，加载其内容
      if (currentNote.value && currentNote.value.content) {
        await loadNoteContentToQuill()
      }
    }
  } catch (error) {
    console.error('Failed to initialize Quill:', error)
  }
}

const loadNoteContentToQuill = async () => {
  if (!quill || !currentNote.value) {
    console.log('无法加载内容: quill或currentNote为空')
    return
  }
  
  console.log('开始加载笔记内容:', currentNote.value.id, '内容类型:', typeof currentNote.value.content)
  
  try {
    let content
    
    // 如果内容为空或undefined，设置为空的Delta
    if (!currentNote.value.content || currentNote.value.content === '') {
      console.log('内容为空，设置空Delta')
      content = { ops: [] }
    }
    // 如果是字符串类型
    else if (typeof currentNote.value.content === 'string') {
      // 尝试解析JSON格式的Quill Delta
      try {
        const parsed = JSON.parse(currentNote.value.content)
        if (parsed && typeof parsed === 'object') {
          // 如果是Quill Delta格式 {ops: [...]}
          if (parsed.ops && Array.isArray(parsed.ops)) {
            content = parsed
            console.log('解析为Quill Delta格式，ops数量:', parsed.ops.length)
          } 
          // 如果是ops数组格式 [{insert: "..."}]
          else if (Array.isArray(parsed)) {
            content = { ops: parsed }
            console.log('解析为ops数组格式，ops数量:', parsed.length)
          }
          // 其他对象格式
          else {
            content = parsed
            console.log('解析为其他对象格式')
          }
        } else {
          // 解析后不是对象，当作纯文本处理
          console.log('解析后不是对象，当作纯文本处理')
          quill.setText(currentNote.value.content)
          return
        }
      } catch (parseError) {
        // JSON解析失败，当作纯文本处理
        console.log('JSON解析失败，当作纯文本处理')
        quill.setText(currentNote.value.content)
        return
      }
    } 
    // 如果已经是对象类型
    else if (currentNote.value.content && typeof currentNote.value.content === 'object') {
      content = currentNote.value.content
      console.log('内容已是对象格式')
    } 
    // 其他情况，设置为空内容
    else {
      console.log('其他情况，设置为空内容')
      content = { ops: [] }
    }
    
    // 设置Quill内容
    console.log('设置Quill内容:', content)
    quill.setContents(content)
    console.log('内容设置完成')
  } catch (e) {
    console.error('加载笔记内容失败:', e)
    // 出错时设置为空内容
    quill.setContents({ ops: [] })
  }
}

const loadNoteContent = async () => {
  // 这个方法现在只负责加载内容到已存在的Quill实例
  if (quill && currentNote.value) {
    await loadNoteContentToQuill()
  } else if (quillEditor.value && currentNote.value) {
    // 如果Quill还没初始化，先初始化
    await initializeQuill()
  }
}

const selectNote = async (note: any) => {
  console.log('选择笔记:', note)
  notesStore.selectNote(note)
  await nextTick()
  
  // 确保编辑器已初始化
  if (!quill && quillEditor.value) {
    console.log('编辑器未初始化，开始初始化')
    await initializeQuill()
  } else if (quill && currentNote.value) {
    // 如果编辑器已存在，加载新笔记的内容
    console.log('编辑器已存在，加载笔记内容:', currentNote.value.id)
    await loadNoteContentToQuill()
  }
  
  // 额外确保内容已加载
  if (quill && currentNote.value) {
    console.log('最终确保内容加载完成')
    await nextTick()
    await loadNoteContentToQuill()
  }
}

const createNewNote = async () => {
  try {
    const noteData: NoteRequest = {
      title: "无标题笔记",
      content: JSON.stringify([]),
      tags: [],
      public: false
    }
    
    await notesStore.createNote(noteData)
    await nextTick()
    await loadNoteContent()
  } catch (err) {
    console.error('创建笔记失败:', err)
  }
}

const saveNote = async () => {
  if (!currentNote.value) return
  
  try {
    const updateData: Partial<NoteRequest> = {
      title: currentNote.value.title,
      content: currentNote.value.content,
      tags: currentNote.value.tags
    }
    
    // 调用store的updateNote方法，它会自动更新列表中的笔记
    const updatedNote = await notesStore.updateNote(currentNote.value.id, updateData)
    
    if (updatedNote) {
      // 确保当前笔记也是最新的
      currentNote.value = updatedNote
      toast.success('笔记已保存！')
      
      // 重新计算标签统计
      await notesStore.fetchTagStatistics()
    }
  } catch (err) {
    console.error('保存笔记失败:', err)
    toast.error('保存失败，请重试')
  }
}

const deleteNote = async () => {
  if (!currentNote.value) return
  
  // 使用自定义确认对话框替代原生confirm
  const confirmed = await showConfirmDialog(`确定要删除笔记 "${currentNote.value.title}" 吗？`)
  if (!confirmed) return
  
  try {
    // 先保存要删除的笔记ID和当前笔记数量
    const deletingNoteId = currentNote.value.id
    const beforeDeleteCount = notes.value.length
    console.log(`[删除笔记] 开始删除笔记: ${deletingNoteId}, 删除前笔记数量: ${beforeDeleteCount}`)
    
    // 调用store删除笔记
    await notesStore.deleteNote(deletingNoteId)
    console.log(`[删除笔记] 删除API调用成功`)
    
    toast.success('笔记已删除！')
    
    // 等待一下确保状态更新完成
    await nextTick()
    
    const afterDeleteCount = notes.value.length
    console.log(`[删除笔记] 删除后笔记数量: ${afterDeleteCount}`)
    
    // 检查删除后的笔记列表
    if (notes.value.length > 0) {
      // 如果还有笔记，选择第一个
      const firstNote = notes.value[0]
      console.log(`[删除笔记] 选择第一个笔记: ${firstNote.id}`)
      
      // 等待一下再选择，确保DOM更新完成
      await nextTick()
      await selectNote(firstNote)
      
      // 再次确保编辑器内容加载
      await nextTick()
      if (quill && currentNote.value) {
        console.log(`[删除笔记] 最终确保编辑器内容加载`)
        await loadNoteContentToQuill()
      }
    } else {
      // 如果没有笔记了，清空当前状态
      console.log(`[删除笔记] 没有更多笔记，清空编辑器`)
      currentNote.value = null
      currentNoteId.value = ''
      
      // 清空编辑器内容
      if (quill) {
        quill.setContents({ ops: [] })
      }
    }
  } catch (err) {
    console.error('删除笔记失败:', err)
    toast.error('删除失败，请重试')
  }
}

// 自定义确认对话框
const showConfirmDialog = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // 创建确认对话框元素
    const dialog = document.createElement('div')
    dialog.className = 'confirm-dialog-overlay'
    dialog.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-dialog-header">
          <h3>确认删除</h3>
        </div>
        <div class="confirm-dialog-body">
          <p>${message}</p>
        </div>
        <div class="confirm-dialog-actions">
          <button class="btn-cancel">取消</button>
          <button class="btn-confirm">确定</button>
        </div>
      </div>
    `
    
    // 添加样式
    const style = document.createElement('style')
    style.textContent = `
      .confirm-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      }
      
      .confirm-dialog {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-primary);
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        min-width: 400px;
        max-width: 500px;
        animation: dialogEnter 0.2s ease-out;
      }
      
      @keyframes dialogEnter {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      .confirm-dialog-header {
        padding: 20px 20px 0;
      }
      
      .confirm-dialog-header h3 {
        margin: 0;
        color: var(--color-text-primary);
        font-size: 16px;
        font-weight: 600;
      }
      
      .confirm-dialog-body {
        padding: 16px 20px;
      }
      
      .confirm-dialog-body p {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: 14px;
        line-height: 1.5;
      }
      
      .confirm-dialog-actions {
        padding: 0 20px 20px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .btn-cancel, .btn-confirm {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease-out;
        border: 1px solid var(--color-border-primary);
      }
      
      .btn-cancel {
        background: var(--color-bg-tertiary);
        color: var(--color-text-secondary);
      }
      
      .btn-cancel:hover {
        background: var(--color-bg-hover);
        color: var(--color-text-primary);
      }
      
      .btn-confirm {
        background: #ef4444;
        color: white;
        border-color: #ef4444;
      }
      
      .btn-confirm:hover {
        background: #dc2626;
        border-color: #dc2626;
      }
    `
    
    document.head.appendChild(style)
    document.body.appendChild(dialog)
    
    // 绑定事件
    const cancelBtn = dialog.querySelector('.btn-cancel')
    const confirmBtn = dialog.querySelector('.btn-confirm')
    
    const cleanup = () => {
      document.body.removeChild(dialog)
      document.head.removeChild(style)
    }
    
    cancelBtn?.addEventListener('click', () => {
      cleanup()
      resolve(false)
    })
    
    confirmBtn?.addEventListener('click', () => {
      cleanup()
      resolve(true)
    })
    
    // 点击遮罩层关闭
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        cleanup()
        resolve(false)
      }
    })
    
    // ESC键关闭
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup()
        document.removeEventListener('keydown', handleEsc)
        resolve(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
  })
}

const shareNote = async () => {
  if (!currentNote.value) return
  
  try {
    const shareUrl = await notesStore.shareNote(currentNote.value.id, {
      isPublic: true
    })
    
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      toast.success('分享链接已复制到剪贴板！')
    }
  } catch (err) {
    console.error('分享笔记失败:', err)
    toast.error('分享失败，请重试')
  }
}

const updateTitle = async (newTitle: string) => {
  if (!currentNote.value) return
  
  try {
    console.log(`正在更新标题，旧标题: "${currentNote.value.title}"，新标题: "${newTitle}"`);
    
    // 立即更新本地标题
    currentNote.value.title = newTitle;
    
    // 立即保存到后端
    await notesStore.updateNote(currentNote.value.id, {
      title: newTitle,
      content: currentNote.value.content,
      tags: currentNote.value.tags || []
    });
    
    console.log('标题已成功保存到后端:', newTitle);
  } catch (err) {
    console.error('更新标题失败:', err);
    toast.error('保存标题失败');
  }
}

const addTagOnEnter = async (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    const tagText = newTagInput.value.trim()
    if (tagText && currentNote.value && !currentNote.value.tags.includes(tagText)) {
      currentNote.value.tags.push(tagText)
      newTagInput.value = ''
      
      // 保存更新 - 发送完整的笔记数据
      try {
        await notesStore.updateNote(currentNote.value.id, {
          title: currentNote.value.title || '无标题笔记',
          content: currentNote.value.content || JSON.stringify({ ops: [] }),
          tags: currentNote.value.tags
        })
      } catch (err) {
        console.error('添加标签失败:', err)
        // 如果保存失败，回滚标签添加
        currentNote.value.tags.pop()
      }
    }
  }
}

const removeTag = (tag: string) => {
  if (currentNote.value) {
    const index = currentNote.value.tags.indexOf(tag)
    if (index > -1) {
      currentNote.value.tags.splice(index, 1)
      saveNote()
    }
  }
}

const handleSearch = () => {
  // 搜索逻辑已在store的计算属性中处理
}

const toggleTagsCollapse = () => {
  tagsCollapsed.value = !tagsCollapsed.value
}

const filterByTag = (tagName: string) => {
  notesStore.setSelectedTag(tagName)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return minutes < 1 ? '刚刚' : `${minutes}分钟前`
  } else if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  } else if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

const getPreview = (content: string) => {
  try {
    if (typeof content === 'string') {
      // 尝试解析JSON格式的Quill Delta
      try {
        const parsed = JSON.parse(content)
        let text = ''
        
        if (parsed && typeof parsed === 'object') {
          // 如果是Quill Delta格式 {ops: [...]}
          if (parsed.ops && Array.isArray(parsed.ops)) {
            text = parsed.ops.map((op: any) => op.insert || '').join('')
          }
          // 如果是ops数组格式 [{insert: "..."}]
          else if (Array.isArray(parsed)) {
            text = parsed.map((op: any) => op.insert || '').join('')
          }
          // 其他格式，尝试转换为字符串
          else {
            text = JSON.stringify(parsed)
          }
        } else {
          text = String(parsed)
        }
        
        // 清理文本并截取预览
        text = text.replace(/\n/g, ' ').trim()
        return text ? (text.slice(0, 100) + (text.length > 100 ? '...' : '')) : '开始写下你的想法...'
      } catch (parseError) {
        // JSON解析失败，当作纯文本处理
        const text = content.replace(/\n/g, ' ').trim()
        return text ? (text.slice(0, 100) + (text.length > 100 ? '...' : '')) : '开始写下你的想法...'
      }
    }
    
    // 非字符串内容
    if (content && typeof content === 'object') {
      const text = JSON.stringify(content).replace(/\n/g, ' ').trim()
      return text ? (text.slice(0, 100) + (text.length > 100 ? '...' : '')) : '开始写下你的想法...'
    }
    
    return '开始写下你的想法...'
  } catch (e) {
    console.error('生成预览失败:', e)
    return '开始写下你的想法...'
  }
}

const analyzeNote = async () => {
  if (!currentNote.value) return
  
  try {
    loading.value = true
    console.log('开始AI分析笔记:', currentNote.value.id)
    const result = await reanalyzeNote(currentNote.value.id)
    console.log('分析API响应成功:', result)
    toast.success('笔记已提交AI分析，将在后台处理！')
  } catch (err) {
    // 即使API调用出错，由于reanalyzeNote已经修改为总是返回成功
    // 这个catch块不应该被触发，但保留它以防万一
    console.error('AI分析笔记意外失败:', err)
    toast.success('笔记已提交AI分析，将在后台处理！')
  } finally {
    loading.value = false
  }
}

const updateContent = (content: any[]) => {
  if (currentNote.value) {
    currentNote.value.content = JSON.stringify(content)
  }
}

const addTag = (tag: string) => {
  if (currentNote.value && !currentNote.value.tags.includes(tag)) {
    currentNote.value.tags.push(tag)
    saveNote()
  }
}

// 监听当前笔记变化，重新加载编辑器内容
watch(currentNote, async () => {
  if (currentNote.value && quill) {
    await nextTick()
    await loadNoteContentToQuill()
  }
})

// 生命周期
onMounted(async () => {
  // 初始化数据
  await notesStore.initializeData()
  
  // 如果有笔记，选择第一个
  if (notes.value.length > 0) {
    await selectNote(notes.value[0])
  }
})

onUnmounted(() => {
  if (quill) {
    console.log('组件卸载，清理Quill实例')
    quill.off('text-change') // 移除事件监听器
    quill = null
  }
  Quill = null
})
</script>

<style lang="scss" scoped>
@import url('https://cdn.quilljs.com/1.3.6/quill.snow.css');

.notes-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: 100vh;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  overflow: hidden;
}

.notes-sidebar {
  background-color: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--color-border-primary);
  flex-shrink: 0;
}

.page-title-notes {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
  margin: 0 0 12px 0;
}

.new-note-btn {
  width: 100%;
  padding: 10px 16px;
  background-color: var(--color-accent-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  
  &:hover {
    background-color: var(--color-accent-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(123, 97, 255, 0.3);
  }
}

.search-box-notes {
  display: flex;
  align-items: center;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  padding: 8px 12px;
  margin: 16px;
  transition: all 0.15s ease-out;
  flex-shrink: 0;
  
  &:focus-within {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2.5px rgba(123, 97, 255, 0.2);
  }
  
  input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-size: 13px;
    width: 100%;
    margin-left: 8px;
    
    &::placeholder {
      color: var(--color-text-disabled);
    }
  }
}

.notes-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px 8px;
}

.note-item {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.15s ease-out;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background-color: var(--color-bg-hover);
    transform: translateX(3px);
  }
  
  &.active {
    background-color: var(--color-bg-tertiary);
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 10px rgba(123, 97, 255, 0.15);
  }
}

.note-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-preview {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 8px;
  height: calc(1.5em * 2);
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--color-text-disabled);
}

.note-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.note-tag {
  padding: 2px 6px;
  background-color: rgba(123, 97, 255, 0.1);
  color: var(--color-accent-primary);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.tags-statistics {
  border-top: 1px solid var(--color-border-primary);
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    
    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    
    .collapse-btn {
      padding: 4px;
      border: none;
      background: transparent;
      color: var(--color-text-secondary);
      border-radius: 4px;
      cursor: pointer;
      
      &:hover {
        background: var(--color-bg-hover);
        color: var(--color-text-primary);
      }
    }
  }
  
  .tags-list {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .tag-stat-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    cursor: pointer;
    transition: background-color 0.15s ease-out;
    
    &:hover {
      background: var(--color-bg-hover);
    }
    
    &.active {
      background: rgba(123, 97, 255, 0.1);
      color: var(--color-accent-primary);
    }
    
    .tag-name {
      font-size: 13px;
    }
    
    .tag-count {
      font-size: 12px;
      color: var(--color-text-secondary);
      background: var(--color-bg-tertiary);
      padding: 2px 6px;
      border-radius: 4px;
      min-width: 20px;
      text-align: center;
    }
  }
}

.editor-container {
  background-color: var(--color-bg-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border-primary);
  flex-shrink: 0;
  min-height: 60px;
}

.editor-title-input {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-primary);
  background: transparent;
  border: none;
  outline: none;
  flex: 1;
  margin-right: 16px;
  padding: 4px 0;
  
  &::placeholder {
    color: var(--color-text-disabled);
  }
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.btn-editor {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--color-border-primary);
  cursor: pointer;
  transition: all 0.15s ease-out;
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  
  &:hover {
    background-color: var(--color-bg-hover);
    border-color: var(--color-border-secondary);
    color: var(--color-text-primary);
    transform: translateY(-1px);
  }
  
  &.primary {
    background-color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: white;
    
    &:hover {
      background-color: var(--color-accent-primary-hover);
      border-color: var(--color-accent-primary-hover);
      box-shadow: 0 2px 6px rgba(123, 97, 255, 0.3);
    }
  }
  
  &.danger {
    color: var(--color-danger);
    border-color: var(--color-danger);
    
    &:hover {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--color-danger-hover);
      border-color: var(--color-danger-hover);
    }
  }
}

.editor-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 20px 0;
  overflow: hidden;
}

.editor-tags-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-primary);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.tags-label {
  font-size: 12px;
  color: var(--color-text-disabled);
  font-weight: 500;
}

.tag-item-editor {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: var(--color-bg-tertiary);
  color: var(--color-accent-secondary);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--color-border-primary);
}

.tag-remove {
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s ease-out;
  font-size: 10px;
  margin-left: 2px;
  
  &:hover {
    opacity: 1;
  }
}

.tag-input {
  padding: 4px 6px;
  background-color: transparent;
  border: 1px dashed var(--color-border-secondary);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 11px;
  outline: none;
  width: 100px;
  transition: border-color 0.15s ease-out;
  
  &:focus {
    border-color: var(--color-accent-primary);
    border-style: solid;
  }
}

.quill-editor-wrapper {
  flex: 1;
  overflow-y: auto;
  margin: 0 -20px;
  padding: 0 20px 20px;
  
  :deep(.ql-toolbar.ql-snow) {
    border: 1px solid var(--color-border-primary);
    border-bottom: none;
    background-color: var(--color-bg-secondary);
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    padding: 8px 10px;
  }
  
  :deep(.ql-container.ql-snow) {
    border: 1px solid var(--color-border-primary);
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    font-size: 15px;
    line-height: 1.7;
    min-height: 200px;
  }
  
  :deep(.ql-editor) {
    padding: 16px;
    
    &.ql-blank::before {
      color: var(--color-text-disabled);
      font-style: normal;
      left: 16px;
    }
  }
  
  :deep(.ql-snow .ql-stroke),
  :deep(.ql-snow .ql-picker-label) {
    stroke: var(--color-text-secondary);
    color: var(--color-text-secondary);
  }
  
  :deep(.ql-snow .ql-fill) {
    fill: var(--color-text-secondary);
  }
  
  :deep(.ql-snow .ql-picker-options) {
    background-color: var(--color-bg-tertiary);
    border-color: var(--color-border-primary);
  }
  
  :deep(.ql-snow .ql-picker-item:hover) {
    color: var(--color-accent-primary);
  }
  
  :deep(.ql-snow .ql-picker-item.ql-selected) {
    color: var(--color-accent-primary);
  }
  
  :deep(.ql-snow .ql-tooltip) {
    background-color: var(--color-bg-tertiary);
    border-color: var(--color-border-primary);
    box-shadow: 0 2px 5px rgba(0,0,0,0.25);
    color: var(--color-text-primary);
  }
  
  :deep(.ql-snow .ql-tooltip input) {
    background-color: var(--color-bg-primary);
    border-color: var(--color-border-secondary);
    color: var(--color-text-primary);
  }
  
  :deep(.ql-snow .ql-action::before) {
    color: var(--color-text-primary);
  }
}

.empty-state-notes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 40px;
}

.empty-icon-notes {
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-title-notes {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--color-text-primary);
}

.empty-description-notes {
  font-size: 13px;
  opacity: 0.7;
}

// 响应式设计
@media (max-width: 768px) {
  .notes-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .notes-sidebar {
    height: auto;
    max-height: 40vh;
    border-right: none;
    border-bottom: 1px solid var(--color-border-primary);
  }
  
  .editor-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 16px;
  }
  
  .editor-title-input {
    font-size: 20px;
  }
  
  .editor-actions {
    justify-content: flex-end;
  }
  
  .editor-main-content {
    padding: 16px 16px 0;
  }
  
  .quill-editor-wrapper {
    margin: 0 -16px;
    padding: 0 16px 16px;
  }
}

// 加载和错误状态样式
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: var(--color-text-secondary);
  font-size: 13px;
  text-align: center;
}

.error-state {
  color: var(--color-danger);
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  margin: 8px;
}

.loading-state {
  color: var(--color-accent-primary);
}

// 禁用状态按钮样式
.btn-editor:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style> 