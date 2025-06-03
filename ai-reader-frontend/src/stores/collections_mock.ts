/**
 * Collections模块状态管理
 * 使用Pinia管理收藏夹和收藏项的状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 类型导入
import type {
  Collection,
  CollectionItem,
  CreateFolderData,
  UpdateFolderData,
  AddItemData,
  CollectionSearchParams,
  ViewMode,
  CollectionsState
} from '@/api/collections.d'

// 导入API函数
import {
  fetchWorkspaceFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  fetchWorkspaceCollections,
  addCollectionItem,
  removeCollectionItem,
  moveItemToFolder,
  searchCollections,
  getCollectionStats,
  exportCollections,
  folderIconOptions
} from '@/api/collections.js'

export const useCollectionsStore = defineStore('collections', () => {
  // ===== 状态定义 =====
  
  // 文件夹相关状态
  const folders = ref<Collection[]>([])
  const currentFolderId = ref<string | null>('all')
  
  // 收藏项相关状态
  const items = ref<CollectionItem[]>([])
  const filteredItems = ref<CollectionItem[]>([])
  
  // UI状态
  const viewMode = ref<ViewMode>('grid')
  const searchQuery = ref<string>('')
  const selectedTags = ref<string[]>([])
  
  // 加载状态
  const isLoadingFolders = ref<boolean>(false)
  const isLoadingItems = ref<boolean>(false)
  
  // 错误状态
  const error = ref<string | null>(null)
  
  // 模态框状态
  const showNewFolderModal = ref<boolean>(false)
  const showEditFolderModal = ref<boolean>(false)
  const editingFolder = ref<Collection | null>(null)
  
  // ===== 计算属性 =====
  
  // 加载状态组合
  const loading = computed(() => ({
    folders: isLoadingFolders.value,
    items: isLoadingItems.value,
    createFolder: isLoadingFolders.value
  }))
  
  // 当前选中的文件夹
  const currentFolder = computed(() => {
    return folders.value.find(folder => folder.id === currentFolderId.value) || null
  })
  
  // 当前文件夹的收藏项数量
  const currentFolderItemCount = computed(() => {
    if (currentFolderId.value === 'all') {
      return items.value.length
    }
    return items.value.filter(item => item.folderId === currentFolderId.value).length
  })
  
  // 获取所有标签
  const allTags = computed(() => {
    const tagSet = new Set<string>()
    items.value.forEach(item => {
      item.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  })
  
  // 根据文件夹ID获取文件夹
  const getFolderById = computed(() => {
    return (id: string) => folders.value.find(folder => folder.id === id)
  })
  
  // 检查项目是否已收藏
  const isItemCollected = computed(() => {
    return (originalId: string, folderId?: string) => {
      if (folderId) {
        return items.value.some(item => 
          item.originalId === originalId && item.folderId === folderId
        )
      }
      return items.value.some(item => item.originalId === originalId)
    }
  })
  
  // ===== 操作方法 =====
  
  // 清除错误状态
  const clearError = () => {
    error.value = null
  }
  
  // 设置错误状态
  const setError = (message: string) => {
    error.value = message
    console.error('Collections Store Error:', message)
  }
  
  // 获取文件夹列表
  const loadFolders = async () => {
    isLoadingFolders.value = true
    clearError()
    
    try {
      const response = await fetchWorkspaceFolders()
      
      if (response && response.success && response.data) {
        folders.value = response.data
      } else {
        setError(response?.error || '获取文件夹列表失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      isLoadingFolders.value = false
    }
  }
  
  // 创建新文件夹
  const createNewFolder = async (folderData: CreateFolderData) => {
    clearError()
    
    try {
      const response = await createFolder(folderData)
      
      if (response.success) {
        folders.value.push(response.data)
        showNewFolderModal.value = false
        return response.data
      } else {
        setError(response.error || '创建文件夹失败')
        return null
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      return null
    }
  }
  
  // 更新文件夹
  const updateExistingFolder = async (folderId: string, updateData: UpdateFolderData) => {
    clearError()
    
    try {
      const response = await updateFolder(folderId, updateData)
      
      if (response.success) {
        const index = folders.value.findIndex(folder => folder.id === folderId)
        if (index !== -1) {
          folders.value[index] = response.data
        }
        showEditFolderModal.value = false
        editingFolder.value = null
        return response.data
      } else {
        setError(response.error || '更新文件夹失败')
        return null
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      return null
    }
  }
  
  // 删除文件夹
  const deleteExistingFolder = async (folderId: string) => {
    clearError()
    
    try {
      const response = await deleteFolder(folderId)
      
      if (response.success) {
        // 移除文件夹
        folders.value = folders.value.filter(folder => folder.id !== folderId)
        
        // 移除该文件夹下的所有收藏项
        items.value = items.value.filter(item => item.folderId !== folderId)
        
        // 如果删除的是当前选中的文件夹，切换到"全部收藏"
        if (currentFolderId.value === folderId) {
          currentFolderId.value = 'all'
        }
        
        return true
      } else {
        setError(response.error || '删除文件夹失败')
        return false
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      return false
    }
  }
  
  // 选择文件夹
  const selectFolder = (folderId: string) => {
    currentFolderId.value = folderId
    // 切换文件夹时重新加载收藏项
    loadCollectionItems()
  }
  
  // 获取收藏项列表
  const loadCollectionItems = async (params?: CollectionSearchParams) => {
    isLoadingItems.value = true
    clearError()
    
    try {
      const searchParams = {
        query: searchQuery.value,
        tags: selectedTags.value,
        ...params
      }
      
      const response = await fetchWorkspaceCollections(
        currentFolderId.value || 'all',
        searchParams
      )
      
      if (response.success) {
        items.value = response.data.items
        filteredItems.value = response.data.items
      } else {
        setError(response.error || '获取收藏项失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      isLoadingItems.value = false
    }
  }
  
  // 添加收藏项
  const addNewCollectionItem = async (itemData: AddItemData) => {
    clearError()
    
    try {
      const response = await addCollectionItem(itemData)
      
      if (response.success) {
        items.value.push(response.data)
        
        // 更新文件夹项目数量
        const folder = folders.value.find(f => f.id === itemData.folderId)
        if (folder) {
          folder.itemCount += 1
        }
        
        return response.data
      } else {
        setError(response.error || '添加收藏项失败')
        return null
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      return null
    }
  }
  
  // 移除收藏项
  const removeExistingCollectionItem = async (itemId: string, folderId: string) => {
    clearError()
    
    try {
      const response = await removeCollectionItem(itemId, folderId)
      
      if (response.success) {
        items.value = items.value.filter(item => item.id !== itemId)
        
        // 更新文件夹项目数量
        const folder = folders.value.find(f => f.id === folderId)
        if (folder && folder.itemCount > 0) {
          folder.itemCount -= 1
        }
        
        return true
      } else {
        setError(response.error || '移除收藏项失败')
        return false
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      return false
    }
  }
  
  // 移动收藏项到其他文件夹
  const moveItemBetweenFolders = async (itemId: string, fromFolderId: string, toFolderId: string) => {
    clearError()
    
    try {
      const response = await moveItemToFolder(itemId, fromFolderId, toFolderId)
      
      if (response.success) {
        // 更新本地状态
        const itemIndex = items.value.findIndex(item => item.id === itemId)
        if (itemIndex !== -1) {
          items.value[itemIndex] = response.data
        }
        
        // 更新文件夹项目数量
        const fromFolder = folders.value.find(f => f.id === fromFolderId)
        const toFolder = folders.value.find(f => f.id === toFolderId)
        
        if (fromFolder && fromFolder.itemCount > 0) {
          fromFolder.itemCount -= 1
        }
        if (toFolder) {
          toFolder.itemCount += 1
        }
        
        return response.data
      } else {
        setError(response.error || '移动收藏项失败')
        return null
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      return null
    }
  }
  
  // 搜索收藏项
  const searchCollectionItems = async (query: string) => {
    searchQuery.value = query
    await loadCollectionItems({ query })
  }
  
  // 按标签过滤
  const filterByTags = async (tags: string[]) => {
    selectedTags.value = tags
    await loadCollectionItems({ tags })
  }
  
  // 切换视图模式
  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
  }
  
  // 设置视图模式
  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode
  }
  
  // 打开新建文件夹模态框
  const openNewFolderModal = () => {
    showNewFolderModal.value = true
  }
  
  // 关闭新建文件夹模态框
  const closeNewFolderModal = () => {
    showNewFolderModal.value = false
  }
  
  // 打开编辑文件夹模态框
  const openEditFolderModal = (folder: Collection) => {
    editingFolder.value = folder
    showEditFolderModal.value = true
  }
  
  // 关闭编辑文件夹模态框
  const closeEditFolderModal = () => {
    showEditFolderModal.value = false
    editingFolder.value = null
  }
  
  // 获取收藏统计
  const loadCollectionStats = async () => {
    try {
      const response = await getCollectionStats()
      
      if (response.success) {
        return response.data
      } else {
        setError(response.error || '获取统计数据失败')
        return null
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      return null
    }
  }
  
  // 导出收藏数据
  const exportCollectionData = async (format = 'json') => {
    try {
      const response = await exportCollections(format)
      
      if (response.success) {
        return response.data
      } else {
        setError(response.error || '导出数据失败')
        return null
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      return null
    }
  }
  
  // 初始化数据
  const initializeCollections = async () => {
    await loadFolders()
    await loadCollectionItems()
  }
  
  // 重置状态
  const resetState = () => {
    folders.value = []
    items.value = []
    filteredItems.value = []
    currentFolderId.value = 'all'
    searchQuery.value = ''
    selectedTags.value = []
    viewMode.value = 'grid'
    error.value = null
    showNewFolderModal.value = false
    showEditFolderModal.value = false
    editingFolder.value = null
  }
  
  // 返回store接口
  return {
    // 状态
    folders,
    currentFolderId,
    items,
    filteredItems,
    viewMode,
    searchQuery,
    selectedTags,
    isLoadingFolders,
    isLoadingItems,
    error,
    showNewFolderModal,
    showEditFolderModal,
    editingFolder,
    
    // 计算属性
    loading,
    currentFolder,
    currentFolderItemCount,
    allTags,
    getFolderById,
    isItemCollected,
    
    // 方法
    clearError,
    loadFolders,
    createFolder: createNewFolder,
    updateFolder: updateExistingFolder,
    deleteFolder: deleteExistingFolder,
    selectFolder,
    loadCollectionItems,
    addCollectionItem: addNewCollectionItem,
    removeCollectionItem: removeExistingCollectionItem,
    moveItemToFolder: moveItemBetweenFolders,
    searchItems: searchCollectionItems,
    filterByTags,
    toggleViewMode,
    setViewMode,
    openNewFolderModal,
    closeNewFolderModal,
    openEditFolderModal,
    closeEditFolderModal,
    loadCollectionStats,
    exportCollections: exportCollectionData,
    initializeCollections,
    resetState,
    
    // 常量
    folderIconOptions
  }
}) 