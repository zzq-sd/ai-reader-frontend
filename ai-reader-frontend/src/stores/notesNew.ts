import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
  // 状态
  const notes = ref<NoteResponse[]>([])
  const currentNote = ref<NoteResponse | null>(null)
  const tags = ref<Tag[]>([])
  const tagStatistics = ref<TagStatistics[]>([])
  const noteStatistics = ref<NoteStatistics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
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
  const searchQuery = ref('')
  const selectedTag = ref('')
  const currentNoteId = ref('')

  // 计算属性
  const filteredNotes = computed(() => {
    let filtered = notes.value
    
    // 搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      )
    }
    
    // 标签过滤
    if (selectedTag.value) {
      filtered = filtered.filter(note => 
        note.tags && note.tags.includes(selectedTag.value)
      )
    }
    
    return filtered
  })

  const currentNoteComputed = computed(() => {
    return currentNoteId.value ? notes.value.find(note => note.id === currentNoteId.value) : null
  })

  // Actions
  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  // 获取用户笔记列表
  const fetchNotes = async (params: NoteQueryParams = {}) => {
    try {
      setLoading(true)
      clearError()
      
      const response = await noteService.getUserNotes(params)
      
      if (response.data?.success && response.data?.data) {
        const pageData = response.data.data
        // 确保content是数组
        notes.value = Array.isArray(pageData.content) ? pageData.content : []
        pagination.value = {
          page: pageData.number || 0,
          size: pageData.size || 20,
          totalElements: pageData.totalElements || 0,
          totalPages: pageData.totalPages || 0,
          first: pageData.first || true,
          last: pageData.last || false
        }
      } else {
        // API调用失败时，确保notes.value为空数组
        notes.value = []
      }
    } catch (err) {
      // 错误时确保notes.value为空数组
      notes.value = []
      setError(err instanceof Error ? err.message : '获取笔记列表失败')
      console.error('获取笔记列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 获取笔记详情
  const fetchNoteById = async (noteId: string) => {
    try {
      setLoading(true)
      clearError()
      
      const response = await noteService.getNoteById(noteId)
      
      if (response.data?.success && response.data?.data) {
        currentNote.value = response.data.data
        
        // 确保notes.value是数组
        if (!Array.isArray(notes.value)) {
          notes.value = []
        }
        
        // 如果笔记不在列表中，添加到列表
        const existingIndex = notes.value.findIndex(note => note.id === noteId)
        if (existingIndex === -1) {
          notes.value.unshift(response.data.data)
        } else {
          notes.value[existingIndex] = response.data.data
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取笔记详情失败')
      console.error('获取笔记详情失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 创建笔记
  const createNote = async (noteData: NoteRequest) => {
    try {
      setLoading(true)
      clearError()
      
      const response = await noteService.createNote(noteData)
      
      if (response.data?.success && response.data?.data) {
        const newNote = response.data.data
        
        // 确保notes.value是数组
        if (!Array.isArray(notes.value)) {
          notes.value = []
        }
        
        notes.value.unshift(newNote)
        currentNote.value = newNote
        currentNoteId.value = newNote.id
        
        // 更新统计信息 - 使用本地计算
        await fetchNoteStatistics()
        await fetchTagStatistics()
        
        return newNote
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建笔记失败')
      console.error('创建笔记失败:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 更新笔记
  const updateNote = async (noteId: string, noteData: Partial<NoteRequest>) => {
    try {
      setLoading(true)
      clearError()
      
      const response = await noteService.updateNote(noteId, noteData)
      
      if (response.data?.success && response.data?.data) {
        const updatedNote = response.data.data
        
        // 更新列表中的笔记
        const index = notes.value.findIndex(note => note.id === noteId)
        if (index !== -1) {
          notes.value[index] = updatedNote
        }
        
        // 更新当前笔记
        if (currentNote.value?.id === noteId) {
          currentNote.value = updatedNote
        }
        
        // 更新标签统计
        await fetchTagStatistics()
        
        return updatedNote
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新笔记失败')
      console.error('更新笔记失败:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 删除笔记
  const deleteNote = async (noteId: string) => {
    try {
      setLoading(true)
      clearError()
      
      console.log(`[Store] 开始删除笔记: ${noteId}`)
      const response = await noteService.deleteNote(noteId)
      console.log(`[Store] 删除笔记API响应:`, response.data)
      
      // 检查响应是否成功，后端返回的是 {success: true, data: {deleted: true}}
      if (response.data?.success && response.data?.data?.deleted) {
        console.log(`[Store] 删除成功，从列表中移除笔记`)
        
        // 从列表中移除
        const beforeCount = notes.value.length
        notes.value = notes.value.filter(note => note.id !== noteId)
        const afterCount = notes.value.length
        console.log(`[Store] 笔记列表更新: ${beforeCount} -> ${afterCount}`)
        
        // 如果删除的是当前笔记，清空当前笔记
        if (currentNote.value?.id === noteId) {
          console.log(`[Store] 清空当前笔记状态`)
          currentNote.value = null
          currentNoteId.value = ''
        }
        
        // 重新获取笔记列表确保数据同步
        console.log(`[Store] 重新获取笔记列表`)
        await fetchNotes()
        console.log(`[Store] 重新获取后笔记数量: ${notes.value.length}`)
        
        // 更新统计信息 - 使用本地计算
        await fetchNoteStatistics()
        await fetchTagStatistics()
        
        return true
      } else {
        throw new Error('删除笔记失败：服务器返回失败状态')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除笔记失败')
      console.error('删除笔记失败:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 搜索笔记
  const searchNotes = async (keyword: string, params: NoteQueryParams = {}) => {
    try {
      setLoading(true)
      clearError()
      
      const response = await noteService.searchNotes(keyword, params)
      
      if (response.data?.success && response.data?.data) {
        const pageData = response.data.data
        // 确保content是数组
        notes.value = Array.isArray(pageData.content) ? pageData.content : []
        pagination.value = {
          page: pageData.number || 0,
          size: pageData.size || 20,
          totalElements: pageData.totalElements || 0,
          totalPages: pageData.totalPages || 0,
          first: pageData.first || true,
          last: pageData.last || false
        }
      } else {
        // API调用失败时，确保notes.value为空数组
        notes.value = []
      }
    } catch (err) {
      // 错误时确保notes.value为空数组
      notes.value = []
      setError(err instanceof Error ? err.message : '搜索笔记失败')
      console.error('搜索笔记失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 获取用户标签
  const fetchTags = async () => {
    try {
      const response = await noteService.getUserTags()
      
      if (response.data?.success && response.data?.data) {
        tags.value = response.data.data
      }
    } catch (err) {
      console.error('获取标签列表失败:', err)
    }
  }

  // 创建标签
  const createTag = async (tagData: TagRequest) => {
    try {
      const response = await noteService.createTag(tagData)
      
      if (response.data?.success && response.data?.data) {
        const newTag = response.data.data
        tags.value.push(newTag)
        return newTag
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建标签失败')
      console.error('创建标签失败:', err)
      throw err
    }
  }

  // 删除标签
  const deleteTag = async (tagId: string) => {
    try {
      const response = await noteService.deleteTag(tagId)
      
      if (response.data?.success) {
        tags.value = tags.value.filter(tag => tag.id !== tagId)
        // 更新统计信息 - 使用本地计算
        await fetchTagStatistics()
        return true
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除标签失败')
      console.error('删除标签失败:', err)
      throw err
    }
  }

  // 获取标签统计 - 暂时注释掉，因为后端没有这个端点
  const fetchTagStatistics = async () => {
    try {
      // const response = await noteService.getTagStatistics()
      
      // if (response.data?.success && response.data?.data) {
      //   tagStatistics.value = response.data.data
      // }
      
      // 临时使用本地计算的标签统计
      const tagCounts: { [key: string]: number } = {}
      notes.value.forEach(note => {
        if (note.tags) {
          note.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        }
      })
      
      tagStatistics.value = Object.entries(tagCounts).map(([name, count]) => ({
        name,
        count
      }))
    } catch (err) {
      console.error('获取标签统计失败:', err)
    }
  }

  // 获取笔记统计 - 暂时注释掉，因为后端没有这个端点
  const fetchNoteStatistics = async () => {
    try {
      // const response = await noteService.getNoteStatistics()
      
      // if (response.data?.success && response.data?.data) {
      //   noteStatistics.value = response.data.data
      // }
      
      // 临时使用本地计算的笔记统计
      noteStatistics.value = {
        totalNotes: notes.value.length,
        totalTags: tags.value.length,
        publicNotes: notes.value.filter(note => note.isPublic).length,
        recentNotes: notes.value.filter(note => {
          const updatedAt = new Date(note.updatedAt)
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          return updatedAt > sevenDaysAgo
        }).length
      }
    } catch (err) {
      console.error('获取笔记统计失败:', err)
    }
  }

  // 选择笔记
  const selectNote = (note: NoteResponse) => {
    currentNote.value = note
    currentNoteId.value = note.id
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

  // 获取最近笔记 - 暂时注释掉，因为后端没有这个端点
  const fetchRecentNotes = async (limit: number = 10) => {
    try {
      // const response = await noteService.getRecentNotes(limit)
      
      // if (response.data?.success && response.data?.data) {
      //   return response.data.data
      // }
      
      // 临时返回按更新时间排序的前N个笔记
      return notes.value
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, limit)
    } catch (err) {
      console.error('获取最近笔记失败:', err)
      return []
    }
  }

  // 分享笔记 - 暂时注释掉，因为后端没有这个端点
  const shareNote = async (noteId: string, shareSettings: {
    isPublic: boolean
    shareUrl?: string
    expiresAt?: string
  }) => {
    try {
      // const response = await noteService.shareNote(noteId, shareSettings)
      
      // if (response.data?.success && response.data?.data) {
      //   // 更新笔记的分享状态
      //   const note = notes.value.find(n => n.id === noteId)
      //   if (note) {
      //     note.isPublic = shareSettings.isPublic
      //   }
      //   
      //   if (currentNote.value?.id === noteId) {
      //     currentNote.value.isPublic = shareSettings.isPublic
      //   }
      //   
      //   return response.data.data.shareUrl
      // }
      
      // 临时实现：只更新本地状态
      const note = notes.value.find(n => n.id === noteId)
      if (note) {
        note.isPublic = shareSettings.isPublic
      }
      
      if (currentNote.value?.id === noteId) {
        currentNote.value.isPublic = shareSettings.isPublic
      }
      
      // 返回一个临时的分享链接
      return `${window.location.origin}/notes/shared/${noteId}`
    } catch (err) {
      setError(err instanceof Error ? err.message : '分享笔记失败')
      console.error('分享笔记失败:', err)
      throw err
    }
  }

  // 初始化数据
  const initializeData = async () => {
    await Promise.all([
      fetchNotes(),
      fetchTags(),
      // 暂时注释掉，因为后端没有这些端点
      // fetchTagStatistics(),
      // fetchNoteStatistics()
    ])
    
    // 在获取笔记和标签后，计算统计信息
    await fetchTagStatistics()
    await fetchNoteStatistics()
  }

  return {
    // 状态
    notes,
    currentNote,
    tags,
    tagStatistics,
    noteStatistics,
    loading,
    error,
    pagination,
    searchQuery,
    selectedTag,
    currentNoteId,
    
    // 计算属性
    filteredNotes,
    currentNoteComputed,
    
    // Actions
    setLoading,
    setError,
    clearError,
    fetchNotes,
    fetchNoteById,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    fetchTags,
    createTag,
    deleteTag,
    fetchTagStatistics,
    fetchNoteStatistics,
    selectNote,
    setSearchQuery,
    setSelectedTag,
    clearSelectedTag,
    fetchRecentNotes,
    shareNote,
    initializeData
  }
}) 