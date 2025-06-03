import { defineStore } from 'pinia'
import { ref, computed, watch, readonly } from 'vue'
// 类型导入
import type { 
  Note, 
  NoteListItem, 
  NoteSearchParams, 
  NoteCreateData, 
  NoteUpdateData,
  NotesState,
  TagSuggestion
} from '@/api/notes.d'
// 函数导入
import {
  fetchWorkspaceNotes,
  fetchWorkspaceNoteDetail,
  createNote,
  updateNote,
  saveNote,
  deleteNote,
  searchNotes,
  fetchTagSuggestions
} from '@/api/notes.js'
import { useNotificationStore } from '@/stores/notification'
import { noteService } from '@/api/noteService'
import type { 
  NoteResponse, 
  NoteRequest, 
  Tag, 
  TagRequest, 
  NoteQueryParams,
  TagStatistics,
  NoteStatistics
} from '@/types/note'

export const useNotesStore = defineStore('notes', () => {
  // 状态定义
  const notes = ref<NoteResponse[]>([])
  const currentNote = ref<NoteResponse | null>(null)
  const selectedNoteId = ref<string | null>(null)
  
  // 搜索和过滤
  const searchQuery = ref('')
  const filteredNotes = ref<NoteResponse[]>([])
  
  // 编辑器状态
  const isEditing = ref(false)
  const hasUnsavedChanges = ref(false)
  const autoSaveTimer = ref<number | null>(null)
  const autoSaveEnabled = ref(true)
  
  // 标签管理
  const availableTags = ref<string[]>([])
  const tagSuggestions = ref<TagSuggestion[]>([])
  
  // UI状态
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sidebarCollapsed = ref(false)
  
  // 通知系统
  const notification = useNotificationStore()
  
  // 分页信息
  const pagination = ref({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: false
  })
  
  // 搜索和过滤
  const selectedTag = ref('')
  const currentNoteId = ref('')
  
  // 计算属性
  const displayNotes = computed(() => {
    return searchQuery.value.trim() ? filteredNotes.value : notes.value
  })
  
  const hasNotes = computed(() => notes.value.length > 0)
  
  const canSave = computed(() => 
    currentNote.value && hasUnsavedChanges.value && !loading.value
  )
  
  const currentNoteIndex = computed(() => {
    if (!selectedNoteId.value) return -1
    return displayNotes.value.findIndex(note => note.id === selectedNoteId.value)
  })
  
  const hasPreviousNote = computed(() => currentNoteIndex.value > 0)
  const hasNextNote = computed(() => 
    currentNoteIndex.value >= 0 && currentNoteIndex.value < displayNotes.value.length - 1
  )
  
  const currentNoteComputed = computed(() => {
    return currentNoteId.value ? notes.value.find(note => note.id === currentNoteId.value) : null
  })
  
  // 错误处理装饰器
  function withErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return (async (...args: any[]) => {
      try {
        loading.value = true
        error.value = null
        return await fn(...args)
      } catch (err) {
        const message = err instanceof Error ? err.message : '操作失败'
        error.value = message
        notification.addNotification({
          title: '操作失败',
          message,
          type: 'error',
          read: false
        })
        throw err
      } finally {
        loading.value = false
      }
    }) as T
  }
  
  // 获取笔记列表
  const fetchNotes = withErrorHandling(async (params?: NoteQueryParams) => {
    const response = await noteService.getUserNotes(params)
    notes.value = response.data.data.content
    pagination.value = {
      page: response.data.data.number,
      size: response.data.data.size,
      totalElements: response.data.data.totalElements,
      totalPages: response.data.data.totalPages,
      first: response.data.data.first,
      last: response.data.data.last
    }
    updateAvailableTags()
    return response
  })
  
  // 获取笔记详情
  const fetchNoteDetail = withErrorHandling(async (noteId: string) => {
    const response = await noteService.getNoteById(noteId)
    currentNote.value = response.data.data
    return response.data.data
  })
  
  // 创建新笔记
  const createNewNote = withErrorHandling(async (data?: Partial<NoteRequest>) => {
    const noteData: NoteRequest = {
      title: '无标题笔记',
      content: [],
      tags: [],
      ...data
    }
    
    const response = await noteService.createNote(noteData)
    const newNote = response.data.data
    
    // 添加到列表顶部
    const newListItem: NoteResponse = {
      id: newNote.id,
      title: newNote.title,
      preview: newNote.preview,
      tags: newNote.tags,
      lastModified: newNote.lastModified
    }
    
    notes.value.unshift(newListItem)
    updateAvailableTags()
    
    // 自动选择新创建的笔记
    await selectNote(newListItem)
    
    notification.addNotification({
      title: '笔记创建成功',
      message: '新笔记已创建',
      type: 'success',
      read: false
    })
    return newNote
  })
  
  // 更新笔记
  const updateCurrentNote = withErrorHandling(async (data: Partial<NoteRequest>) => {
    if (!currentNote.value) {
      throw new Error('没有选中的笔记')
    }
    
    const updateData: NoteRequest = {
      id: currentNote.value.id,
      ...data
    }
    
    const response = await noteService.updateNote(currentNote.value.id, updateData)
    currentNote.value = response.data.data
    
    // 更新列表中对应的项
    const listIndex = notes.value.findIndex(note => note.id === response.data.data.id)
    if (listIndex >= 0) {
      notes.value[listIndex] = response.data.data
    }
    
    updateAvailableTags()
    hasUnsavedChanges.value = false
    
    return response.data.data
  })
  
  // 保存当前笔记
  const saveCurrentNote = withErrorHandling(async () => {
    if (!currentNote.value || !hasUnsavedChanges.value) return
    
    await updateCurrentNote({
      title: currentNote.value.title,
      content: [...currentNote.value.content],
      tags: [...currentNote.value.tags]
    })
    
    notification.addNotification({
      title: '保存成功',
      message: '笔记已保存',
      type: 'success',
      read: false
    })
  })
  
  // 删除笔记
  const deleteCurrentNote = withErrorHandling(async (noteId?: string) => {
    const targetId = noteId || selectedNoteId.value
    if (!targetId) {
      throw new Error('没有指定要删除的笔记')
    }
    
    await noteService.deleteNote(targetId)
    
    // 从列表中移除
    notes.value = notes.value.filter(note => note.id !== targetId)
    updateAvailableTags()
    
    // 如果删除的是当前笔记，选择列表中的第一个笔记
    if (targetId === selectedNoteId.value) {
      currentNote.value = null
      selectedNoteId.value = null
      
      if (notes.value.length > 0) {
        await selectNote(notes.value[0])
      }
    }
    
    notification.addNotification({
      title: '删除成功',
      message: '笔记已删除',
      type: 'success',
      read: false
    })
  })
  
  // 选择笔记
  const selectNote = withErrorHandling(async (note: NoteResponse) => {
    // 检查是否有未保存的更改
    if (hasUnsavedChanges.value && selectedNoteId.value !== note.id) {
      const confirmed = confirm('当前笔记有未保存的更改，是否要丢弃这些更改？')
      if (!confirmed) {
        return
      }
    }
    
    selectedNoteId.value = note.id
    await fetchNoteDetail(note.id)
    hasUnsavedChanges.value = false
    isEditing.value = true
  })
  
  // 搜索笔记
  const performSearch = withErrorHandling(async (query: string) => {
    searchQuery.value = query
    
    if (query.trim()) {
      const response = await searchNotes(query)
      filteredNotes.value = response.data.data.content
    } else {
      filteredNotes.value = []
    }
  })
  
  // 清空搜索
  const clearSearch = () => {
    searchQuery.value = ''
    filteredNotes.value = []
  }
  
  // 自动保存
  const startAutoSave = () => {
    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value)
    }
    
    if (autoSaveEnabled.value && hasUnsavedChanges.value) {
      autoSaveTimer.value = window.setTimeout(() => {
        saveCurrentNote().catch(console.error)
      }, 2000) // 2秒后自动保存
    }
  }
  
  const stopAutoSave = () => {
    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value)
      autoSaveTimer.value = null
    }
  }
  
  // 标签管理
  const addTagToCurrentNote = async (tag: string) => {
    if (!currentNote.value || currentNote.value.tags.includes(tag)) return
    
    currentNote.value = {
      ...currentNote.value,
      tags: [...currentNote.value.tags, tag]
    }
    markAsChanged()
    updateAvailableTags()
  }
  
  const removeTagFromCurrentNote = async (tag: string) => {
    if (!currentNote.value) return
    
    const index = currentNote.value.tags.indexOf(tag)
    if (index >= 0) {
      currentNote.value = {
        ...currentNote.value,
        tags: currentNote.value.tags.filter(t => t !== tag)
      }
      markAsChanged()
      updateAvailableTags()
    }
  }
  
  // 获取标签建议
  const loadTagSuggestions = withErrorHandling(async () => {
    const response = await fetchTagSuggestions()
    tagSuggestions.value = response.tags
    return response.tags
  })
  
  // 更新可用标签列表
  const updateAvailableTags = () => {
    const allTags = new Set<string>()
    notes.value.forEach(note => {
      note.tags.forEach(tag => allTags.add(tag))
    })
    availableTags.value = Array.from(allTags).sort()
  }
  
  // 导航方法
  const selectPreviousNote = async () => {
    if (hasPreviousNote.value) {
      const prevNote = displayNotes.value[currentNoteIndex.value - 1]
      await selectNote(prevNote)
    }
  }
  
  const selectNextNote = async () => {
    if (hasNextNote.value) {
      const nextNote = displayNotes.value[currentNoteIndex.value + 1]
      await selectNote(nextNote)
    }
  }
  
  // 标记为已更改
  const markAsChanged = () => {
    hasUnsavedChanges.value = true
    startAutoSave()
  }
  
  // 更新笔记内容
  const updateNoteContent = (content: any[]) => {
    if (currentNote.value) {
      currentNote.value = {
        ...currentNote.value,
        content: [...content]
      }
      markAsChanged()
    }
  }
  
  // 更新笔记标题
  const updateNoteTitle = (title: string) => {
    if (currentNote.value) {
      currentNote.value = {
        ...currentNote.value,
        title
      }
      markAsChanged()
    }
  }
  
  // 重置状态
  const resetState = () => {
    notes.value = []
    currentNote.value = null
    selectedNoteId.value = null
    searchQuery.value = ''
    filteredNotes.value = []
    isEditing.value = false
    hasUnsavedChanges.value = false
    stopAutoSave()
    availableTags.value = []
    tagSuggestions.value = []
    error.value = null
  }
  
  // 监听内容变化
  watch(
    () => currentNote.value?.content,
    () => {
      if (currentNote.value && isEditing.value) {
        markAsChanged()
      }
    },
    { deep: true }
  )
  
  // 组件卸载时清理定时器
  const cleanup = () => {
    stopAutoSave()
  }
  
  // 获取用户标签
  const fetchTags = async () => {
    try {
      const response = await noteService.getUserTags()
      
      if (response.data.success && response.data.data) {
        availableTags.value = response.data.data.map(tag => tag.name)
      }
    } catch (err) {
      console.error('获取标签列表失败:', err)
    }
  }
  
  // 创建标签
  const createTag = async (tagData: TagRequest) => {
    try {
      const response = await noteService.createTag(tagData)
      
      if (response.data.success && response.data.data) {
        const newTag = response.data.data
        availableTags.value.push(newTag.name)
        return newTag
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建标签失败'
      console.error('创建标签失败:', err)
      throw err
    }
  }
  
  // 删除标签
  const deleteTag = async (tagId: string) => {
    try {
      const response = await noteService.deleteTag(tagId)
      
      if (response.data.success) {
        availableTags.value = availableTags.value.filter(tag => tag !== tagId)
        await fetchTagStatistics()
        return true
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除标签失败'
      console.error('删除标签失败:', err)
      throw err
    }
  }
  
  // 获取标签统计
  const fetchTagStatistics = async () => {
    try {
      const response = await noteService.getTagStatistics()
      
      if (response.data.success && response.data.data) {
        tagStatistics.value = response.data.data
      }
    } catch (err) {
      console.error('获取标签统计失败:', err)
    }
  }
  
  // 获取笔记统计
  const fetchNoteStatistics = async () => {
    try {
      const response = await noteService.getNoteStatistics()
      
      if (response.data.success && response.data.data) {
        noteStatistics.value = response.data.data
      }
    } catch (err) {
      console.error('获取笔记统计失败:', err)
    }
  }
  
  // 设置搜索查询
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }
  
  // 设置选中的标签
  const setSelectedTag = (tagName: string) => {
    selectedTag.value = selectedTag.value === tagName ? '' : tagName
  }
  
  // 清空选中的标签
  const clearSelectedTag = () => {
    selectedTag.value = ''
  }
  
  // 获取最近笔记
  const fetchRecentNotes = async (limit: number = 10) => {
    try {
      const response = await noteService.getRecentNotes(limit)
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      return []
    } catch (err) {
      console.error('获取最近笔记失败:', err)
      return []
    }
  }
  
  // 分享笔记
  const shareNote = async (noteId: string, shareSettings: {
    isPublic: boolean
    shareUrl?: string
    expiresAt?: string
  }) => {
    try {
      const response = await noteService.shareNote(noteId, shareSettings)
      
      if (response.data.success && response.data.data) {
        // 更新笔记的分享状态
        const note = notes.value.find(n => n.id === noteId)
        if (note) {
          note.isPublic = shareSettings.isPublic
        }
        
        if (currentNote.value?.id === noteId) {
          currentNote.value.isPublic = shareSettings.isPublic
        }
        
        return response.data.data.shareUrl
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '分享笔记失败'
      console.error('分享笔记失败:', err)
      throw err
    }
  }
  
  // 初始化数据
  const initializeData = async () => {
    await Promise.all([
      fetchNotes(),
      fetchTags(),
      fetchTagStatistics(),
      fetchNoteStatistics()
    ])
  }
  
  return {
    // 状态
    notes,
    currentNote,
    selectedNoteId,
    searchQuery,
    filteredNotes,
    isEditing,
    hasUnsavedChanges,
    autoSaveEnabled,
    availableTags,
    tagSuggestions,
    loading,
    error,
    sidebarCollapsed,
    pagination,
    selectedTag,
    currentNoteId,
    
    // 计算属性
    displayNotes,
    hasNotes,
    canSave,
    currentNoteIndex,
    hasPreviousNote,
    hasNextNote,
    currentNoteComputed,
    
    // 方法
    fetchNotes,
    fetchNoteDetail,
    createNewNote,
    updateCurrentNote,
    saveCurrentNote,
    deleteCurrentNote,
    selectNote,
    performSearch,
    clearSearch,
    addTagToCurrentNote,
    removeTagFromCurrentNote,
    loadTagSuggestions,
    updateAvailableTags,
    selectPreviousNote,
    selectNextNote,
    markAsChanged,
    updateNoteContent,
    updateNoteTitle,
    resetState,
    cleanup,
    fetchTags,
    createTag,
    deleteTag,
    fetchTagStatistics,
    fetchNoteStatistics,
    setSearchQuery,
    setSelectedTag,
    clearSelectedTag,
    fetchRecentNotes,
    shareNote,
    initializeData
  }
}) 