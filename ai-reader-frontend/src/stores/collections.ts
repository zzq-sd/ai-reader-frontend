/**
 * Collections模块状态管理 - 真实API版本
 * 使用Pinia管理收藏夹和收藏项的状态，调用真实后端API
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { favoritesService } from '../api/services/favoritesService'
import type { Article } from '@/api/types/article'
import type { FavoritesSearchParams } from '../api/services/favoritesService'

// 简化的文件夹类型（目前只支持"全部收藏"）
export interface SimpleFolder {
  id: string
  name: string
  icon: string
  itemCount: number
}

// 视图模式类型
export type ViewMode = 'grid' | 'list'

export const useCollectionsStore = defineStore('collections', () => {
  // ===== 状态定义 =====
  
  // 文件夹相关状态（目前只有"全部收藏"）
  const folders = ref<SimpleFolder[]>([])
  const currentFolderId = ref<string>('all')
  
  // 收藏项相关状态
  const items = ref<Article[]>([])
  const filteredItems = ref<Article[]>([])
  const totalCount = ref<number>(0)
  const currentPage = ref<number>(0)
  const pageSize = ref<number>(20)
  const totalPages = ref<number>(0)
  
  // UI状态
  const viewMode = ref<ViewMode>('grid')
  const searchQuery = ref<string>('')
  
  // 加载状态
  const isLoadingFolders = ref<boolean>(false)
  const isLoadingItems = ref<boolean>(false)
  const isLoadingCount = ref<boolean>(false)
  
  // 错误状态
  const error = ref<string | null>(null)
  
  // 模态框状态（暂时保留，但不使用）
  const showNewFolderModal = ref<boolean>(false)
  
  // ===== 计算属性 =====
  
  // 加载状态组合
  const loading = computed(() => ({
    folders: isLoadingFolders.value,
    items: isLoadingItems.value,
    createFolder: false // 暂不支持创建文件夹
  }))
  
  // 当前选中的文件夹
  const currentFolder = computed(() => {
    return folders.value.find(folder => folder.id === currentFolderId.value) || null
  })
  
  // 当前文件夹的收藏项数量
  const currentFolderItemCount = computed(() => {
    return filteredItems.value.length
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
  
  // 获取收藏数量并更新文件夹信息
  const loadFoldersWithCount = async () => {
    isLoadingFolders.value = true
    isLoadingCount.value = true
    clearError()
    
    try {
      const countResponse = await favoritesService.getFavoritesCount()
      
      if (countResponse.success && countResponse.data) {
        const count = countResponse.data.count
        totalCount.value = count
        
        // 更新文件夹列表（目前只有"全部收藏"）
        folders.value = [
          {
            id: 'all',
            name: '全部收藏',
            icon: 'fas fa-star',
            itemCount: count
          }
        ]
      } else {
        setError(countResponse.message || '获取收藏数量失败')
      }
    } catch (err: any) {
      setError('网络错误，请稍后重试')
    } finally {
      isLoadingFolders.value = false
      isLoadingCount.value = false
    }
  }
  
  // 选择文件夹并加载对应的收藏项
  const selectFolder = async (folderId: string) => {
    currentFolderId.value = folderId
    currentPage.value = 0 // 重置页码
    await loadCollectionItems()
  }
  
  // 加载收藏项列表
  const loadCollectionItems = async (append: boolean = false) => {
    if (!append) {
      isLoadingItems.value = true
    }
    clearError()
    
    try {
      let response
      
      if (searchQuery.value.trim()) {
        // 如果有搜索查询，使用搜索接口
        response = await favoritesService.searchFavorites({
          keyword: searchQuery.value.trim(),
          page: currentPage.value,
          size: pageSize.value
        })
      } else {
        // 否则获取所有收藏
        response = await favoritesService.getFavorites(currentPage.value, pageSize.value)
      }
      
      if (response.success && response.data) {
        const { content, totalElements, totalPages: total, number } = response.data
        
        if (append) {
          // 追加模式（分页加载）
          items.value = [...items.value, ...content]
        } else {
          // 替换模式（新查询）
          items.value = content
        }
        
        filteredItems.value = items.value
        totalCount.value = totalElements
        totalPages.value = total
        currentPage.value = number
      } else {
        setError(response.message || '获取收藏列表失败')
      }
    } catch (err: any) {
      setError('网络错误，请稍后重试')
    } finally {
      isLoadingItems.value = false
    }
  }
  
  // 加载更多收藏项（分页）
  const loadMoreItems = async () => {
    if (currentPage.value + 1 < totalPages.value && !isLoadingItems.value) {
      currentPage.value += 1
      await loadCollectionItems(true)
    }
  }
  
  // 搜索收藏项
  const searchItems = async (query: string) => {
    searchQuery.value = query
    currentPage.value = 0
    await loadCollectionItems()
  }
  
  // 移除收藏项
  const removeCollectionItem = async (articleId: string) => {
    try {
      const response = await favoritesService.removeFromFavorites(articleId)
      
      if (response.success) {
        // 从本地状态中移除
        items.value = items.value.filter(item => item.id !== articleId)
        filteredItems.value = filteredItems.value.filter(item => item.id !== articleId)
        
        // 更新计数
        totalCount.value = Math.max(0, totalCount.value - 1)
        
        // 更新文件夹计数
        if (folders.value.length > 0) {
          folders.value[0].itemCount = totalCount.value
        }
        
        return { success: true }
      } else {
        setError(response.message || '移除收藏失败')
        return { success: false, error: response.message || '移除收藏失败' }
      }
    } catch (err: any) {
      const errorMessage = '网络错误，请稍后重试'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }
  
  // 设置视图模式
  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode
  }
  
  // 切换视图模式
  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
  }
  
  // 打开新建文件夹模态框（暂不支持）
  const openNewFolderModal = () => {
    showNewFolderModal.value = true
  }
  
  // 关闭新建文件夹模态框
  const closeNewFolderModal = () => {
    showNewFolderModal.value = false
  }
  
  // 创建文件夹（暂不支持）
  const createFolder = async (folderData: any) => {
    // 暂不支持创建自定义文件夹
    throw new Error('暂不支持创建自定义文件夹')
  }
  
  // 删除文件夹（暂不支持）
  const deleteFolder = async (folderId: string) => {
    // 暂不支持删除文件夹
    throw new Error('暂不支持删除文件夹')
  }
  
  // 导出收藏（暂不支持）
  const exportCollections = async (format: string = 'json') => {
    // 暂不支持导出功能
    throw new Error('暂不支持导出功能')
  }
  
  // 初始化收藏数据
  const initializeCollections = async () => {
    await loadFoldersWithCount()
    await loadCollectionItems()
  }
  
  // 重置状态
  const resetState = () => {
    folders.value = []
    items.value = []
    filteredItems.value = []
    totalCount.value = 0
    currentPage.value = 0
    totalPages.value = 0
    currentFolderId.value = 'all'
    searchQuery.value = ''
    error.value = null
    isLoadingFolders.value = false
    isLoadingItems.value = false
    isLoadingCount.value = false
  }
  
  // 刷新收藏数据
  const refreshCollections = async () => {
    await initializeCollections()
  }
  
  // 添加收藏项（用于其他页面调用）
  const addCollectionItem = async (articleId: string) => {
    try {
      const response = await favoritesService.addToFavorites(articleId)
      
      if (response.success) {
        // 刷新收藏数据
        await refreshCollections()
        return { success: true }
      } else {
        setError(response.message || '添加收藏失败')
        return { success: false, error: response.message || '添加收藏失败' }
      }
    } catch (err: any) {
      const errorMessage = '网络错误，请稍后重试'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }
  
  // 返回store的状态和方法
  return {
    // 状态
    folders,
    currentFolderId,
    items,
    filteredItems,
    totalCount,
    currentPage,
    pageSize,
    totalPages,
    viewMode,
    searchQuery,
    loading,
    error,
    showNewFolderModal,
    
    // 计算属性
    currentFolder,
    currentFolderItemCount,
    
    // 方法
    clearError,
    setError,
    loadFoldersWithCount,
    selectFolder,
    loadCollectionItems,
    loadMoreItems,
    searchItems,
    removeCollectionItem,
    setViewMode,
    toggleViewMode,
    openNewFolderModal,
    closeNewFolderModal,
    createFolder,
    deleteFolder,
    exportCollections,
    initializeCollections,
    resetState,
    refreshCollections,
    addCollectionItem
  }
}) 