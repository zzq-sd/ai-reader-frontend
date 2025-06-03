/**
 * RSS管理模块状态管理
 * 使用Pinia管理RSS源的状态和操作
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 导入类型定义
import type {
  RssFeed,
  AddFeedData,
  UpdateFeedData,
  FeedSearchParams,
  RssState,
  FeedStats,
  FeedStatus,
  FeedPriority,
  FeedCategory,
  FeedDetectionResult,
  UrlValidationResult,
  RssExportData,
  BulkOperationProgress,
  BatchUpdateData,
  DragState,
  ContextMenuState,
  ImportProgress,
  ExportOptions,
  OperationResult,
  OPMLData
} from '@/api/rss.d'

// API函数导入 - 使用RSS服务
import { rssService } from '@/api/services/rssService'
import { articleService } from '@/api/services/articleService'

export const useRssStore = defineStore('rss', () => {
  // ===== 状态定义 =====
  
  // RSS源列表
  const feeds = ref<RssFeed[]>([])
  
  // 当前选中的分类
  const currentCategory = ref<FeedCategory | 'all'>('all')
  
  // 当前选中的状态过滤
  const currentStatus = ref<FeedStatus | 'all'>('all')
  
  // 当前选中的优先级过滤
  const currentPriority = ref<FeedPriority | 'all'>('all')
  
  // 搜索查询
  const searchQuery = ref<string>('')
  
  // 选中的标签
  const selectedTags = ref<string[]>([])
  
  // 排序设置
  const sortBy = ref<string>('lastUpdated')
  const sortOrder = ref<'asc' | 'desc'>('desc')
  
  // 分页设置
  const currentPage = ref<number>(1)
  const pageSize = ref<number>(20)
  const totalFeeds = ref<number>(0)
  const hasMore = ref<boolean>(false)
  
  // 加载状态
  const isLoading = ref<boolean>(false)
  const isRefreshing = ref<boolean>(false)
  const isBulkOperating = ref<boolean>(false)
  
  // 新增：单个RSS源刷新状态跟踪
  const refreshingFeeds = ref<Set<string>>(new Set())
  
  // 新增：单个RSS源切换状态跟踪
  const togglingFeeds = ref<Set<string>>(new Set())
  
  // 错误状态
  const error = ref<string | null>(null)
  
  // 模态框状态
  const isAddFeedModalVisible = ref<boolean>(false)
  const isEditFeedModalVisible = ref<boolean>(false)
  const isBulkOperationModalVisible = ref<boolean>(false)
  const isStatsModalVisible = ref<boolean>(false)
  
  // 当前编辑的RSS源
  const editingFeed = ref<RssFeed | null>(null)
  
  // 选中的RSS源（用于批量操作）
  const selectedFeeds = ref<Set<string>>(new Set())
  
  // 统计数据
  const stats = ref<FeedStats | null>(null)
  
  // URL检测结果
  const urlDetectionResult = ref<FeedDetectionResult | null>(null)
  
  // 新增：批量操作状态
  const isSelectMode = ref<boolean>(false)
  const bulkOperationProgress = ref<BulkOperationProgress | null>(null)
  const showBatchOperationModal = ref<boolean>(false)
  const batchOperation = ref<string | null>(null)
  
  // 新增：拖拽排序状态
  const dragState = ref<DragState | null>(null)
  const feedOrder = ref<string[]>([])
  
  // 新增：右键菜单状态
  const contextMenuState = ref<ContextMenuState | null>(null)
  
  // 新增：导入导出状态
  const importProgress = ref<ImportProgress | null>(null)
  const isImporting = ref<boolean>(false)
  const isExporting = ref<boolean>(false)
  const showImportExportModal = ref<boolean>(false)
  
  // ===== 计算属性 =====
  
  // 过滤后的RSS源
  const filteredFeeds = computed(() => {
    return feeds.value.filter(feed => {
      // 分类过滤
      if (currentCategory.value !== 'all' && feed.category !== currentCategory.value) {
        return false
      }
      
      // 状态过滤
      if (currentStatus.value !== 'all' && feed.status !== currentStatus.value) {
        return false
      }
      
      // 优先级过滤
      if (currentPriority.value !== 'all' && feed.priority !== currentPriority.value) {
        return false
      }
      
      // 搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        return feed.name.toLowerCase().includes(query) ||
               feed.description?.toLowerCase().includes(query) ||
               feed.url.toLowerCase().includes(query) ||
               feed.tags.some(tag => tag.toLowerCase().includes(query))
      }
      
      // 标签过滤
      if (selectedTags.value.length > 0) {
        return selectedTags.value.some(tag => feed.tags.includes(tag))
      }
      
      return true
    })
  })
  
  // 所有标签
  const allTags = computed(() => {
    const tagSet = new Set<string>()
    feeds.value.forEach(feed => {
      feed.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  })
  
  // 分类统计 - 简化版本
  const categoryStats = computed(() => {
    const defaultCategories = ['tech', 'news', 'design', 'business', 'lifestyle', 'entertainment', 'science', 'other']
    const stats = defaultCategories.reduce((acc, category) => {
      acc[category] = feeds.value.filter(feed => feed.category === category).length
      return acc
    }, {} as Record<string, number>)
    
    stats.all = feeds.value.length
    return stats
  })
  
  // 状态统计
  const statusStats = computed(() => {
    return {
      all: feeds.value.length,
      active: feeds.value.filter(feed => feed.status === 'active').length,
      error: feeds.value.filter(feed => feed.status === 'error').length,
      updating: feeds.value.filter(feed => feed.status === 'updating').length,
      paused: feeds.value.filter(feed => feed.status === 'paused').length
    }
  })
  
  // 是否全选
  const isAllSelected = computed(() => {
    return filteredFeeds.value.length > 0 && 
           filteredFeeds.value.every(feed => selectedFeeds.value.has(feed.id))
  })
  
  // 是否部分选中
  const isIndeterminate = computed(() => {
    const selectedCount = filteredFeeds.value.filter(feed => selectedFeeds.value.has(feed.id)).length
    return selectedCount > 0 && selectedCount < filteredFeeds.value.length
  })
  
  // 检查单个RSS源是否正在刷新
  const isFeedRefreshing = (feedId: string) => {
    return refreshingFeeds.value.has(feedId)
  }
  
  // 检查单个RSS源是否正在切换状态
  const isFeedToggling = (feedId: string) => {
    return togglingFeeds.value.has(feedId)
  }
  
  // ===== 操作方法 =====
  
  // 错误处理
  const handleError = (errorMessage: string) => {
    error.value = errorMessage
    console.error('RSS Store Error:', errorMessage)
  }
  
  // 辅助函数：将RssSource转换为RssFeed
  async function mapRssSourceToFeed(source: any): Promise<RssFeed> {
    // 获取该RSS源的文章数量，优化错误处理
    let articlesCount = 0
    try {
      console.log(`[ARTICLES-COUNT] 开始获取RSS源文章数量: ${source.name} (ID: ${source.id})`)
      const response = await articleService.getArticlesBySource(source.id, { page: 0, size: 1 })
      articlesCount = response.totalElements || 0
      console.log(`[ARTICLES-COUNT] RSS源 ${source.name} 文章数量获取成功:`, {
        sourceId: source.id,
        sourceName: source.name,
        totalElements: response.totalElements,
        articlesCount: articlesCount,
        responseKeys: Object.keys(response),
        fullResponse: response
      })
    } catch (error) {
      console.warn(`[ARTICLES-COUNT] 获取RSS源 ${source.id} 文章数量失败:`, error)
      // 设置为0而不是随机数，这样更准确
      articlesCount = 0
    }

    // 严格处理active状态
    const isEnabled = Boolean(source.active === true)
    
    console.log(`映射RSS源 ${source.name}:`, {
      sourceActive: source.active,
      sourceActiveType: typeof source.active,
      isEnabled: isEnabled,
      articlesCount: articlesCount
    })

    return {
      id: source.id,
      name: source.name || 'Untitled Feed',
      url: source.url,
      description: source.description || '',
      category: (source.category as FeedCategory) || 'other',
      favicon: source.iconUrl || '',
      status: determineSourceStatus(source),
      articlesCount: articlesCount,
      unreadCount: Math.floor(articlesCount * 0.3), // 假设30%的文章未读
      lastUpdated: source.lastFetchedAt || source.updatedAt || new Date().toISOString(),
      createdAt: source.createdAt || new Date().toISOString(),
      updateFrequency: source.fetchInterval || 24,
      lastError: source.errorMessage || '',
      tags: [], // 暂时为空数组
      priority: 'medium' as FeedPriority,
      isEnabled: isEnabled,
      customIcon: source.iconUrl || '',
      homepageUrl: source.websiteUrl || ''
    }
  }

  // 新增：同步版本的映射函数，避免异步干扰
  function mapRssSourceToFeedSync(source: any): RssFeed {
    // 严格处理active状态
    const isEnabled = Boolean(source.active === true)
    
    console.log(`[TOGGLE-DEBUG] 同步映射RSS源 ${source.name}:`, {
      sourceActive: source.active,
      sourceActiveType: typeof source.active,
      isEnabled: isEnabled
    })

    return {
      id: source.id,
      name: source.name || 'Untitled Feed',
      url: source.url,
      description: source.description || '',
      category: (source.category as FeedCategory) || 'other',
      favicon: source.iconUrl || '',
      status: determineSourceStatus(source),
      articlesCount: 0, // 在toggle操作中不异步获取文章数量，避免干扰
      unreadCount: 0,
      lastUpdated: source.lastFetchedAt || source.updatedAt || new Date().toISOString(),
      createdAt: source.createdAt || new Date().toISOString(),
      updateFrequency: source.fetchInterval || 24,
      lastError: source.errorMessage || '',
      tags: [], // 暂时为空数组
      priority: 'medium' as FeedPriority,
      isEnabled: isEnabled,
      customIcon: source.iconUrl || '',
      homepageUrl: source.websiteUrl || ''
    }
  }

  // 辅助函数：确定RSS源状态
  function determineSourceStatus(source: any): FeedStatus {
    if (!source.active || source.active === false) {
      return 'paused'
    }
    if (source.errorMessage) {
      return 'error'
    }
    if (source.fetchStatus === 'PENDING') {
      return 'updating'
    }
    return 'active'
  }

  // 加载RSS源列表
  const loadFeeds = async (params: FeedSearchParams = {}) => {
    isLoading.value = true
    error.value = null
    
    try {
      console.log('[RssStore] 尝试加载RSS源列表...')
      const feedsData = await rssService.getUserFeeds()
      
      if (Array.isArray(feedsData)) {
        // 转换RssSource为RssFeed格式，并获取文章统计
        const feedPromises = feedsData.map(source => mapRssSourceToFeed(source))
        feeds.value = await Promise.all(feedPromises)
        
        totalFeeds.value = feedsData.length
        hasMore.value = false
        
        // 成功加载后清除错误状态
        error.value = null
        
        // 保存状态到localStorage
        saveToLocalStorage()
        
        console.log('[RssStore] RSS源列表加载成功, 共', feedsData.length, '项')
        return feeds.value
      } else {
        handleError('RSS源数据格式错误')
        return []
      }
    } catch (err: any) {
      const errorMsg = err?.message || '网络错误，请稍后重试'
      console.error('[RssStore] 加载RSS源失败:', errorMsg)
      handleError(errorMsg)
      return []
    } finally {
      isLoading.value = false
    }
  }
  
  // 添加RSS源
  const createFeed = async (feedData: AddFeedData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const newFeed = await rssService.addFeed({
        url: feedData.url,
        name: feedData.name,
        category: feedData.category,
        description: feedData.description,
        isPublic: false
      })
      
      // 转换为RssFeed格式并添加到列表
      const mappedFeed = await mapRssSourceToFeed(newFeed)
      feeds.value.unshift(mappedFeed)
      totalFeeds.value++
      closeAddFeedModal()
      
      // 保存状态
      saveToLocalStorage()
      
      return mappedFeed
    } catch (err) {
      handleError('添加RSS源失败')
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // 更新RSS源
  const updateFeedData = async (feedId: string, updateData: UpdateFeedData, options: { closeModal?: boolean } = {}) => {
    isLoading.value = true
    error.value = null
    
    try {
      const updatedFeed = await rssService.updateFeed(feedId, {
        name: updateData.name,
        url: updateData.url,
        category: updateData.category,
        description: updateData.description,
        active: updateData.isEnabled
      })
      
      // 更新本地状态
      const index = feeds.value.findIndex(feed => feed.id === feedId)
      if (index !== -1) {
        const mappedFeed = await mapRssSourceToFeed(updatedFeed)
        feeds.value[index] = mappedFeed
      }
      
      // 只在明确指定时才关闭编辑模态框
      if (options.closeModal) {
        closeEditFeedModal()
      }
      
      saveToLocalStorage()
      
      return updatedFeed
    } catch (err) {
      handleError('更新RSS源失败')
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // 切换RSS源启用/禁用状态 - 专门方法
  const toggleFeedStatus = async (feedId: string) => {
    const feedIndex = feeds.value.findIndex(feed => feed.id === feedId)
    if (feedIndex === -1) {
      console.warn(`RSS源不存在: ${feedId}`)
      return { success: false, error: 'RSS源不存在' }
    }
    
    // 防止重复切换
    if (togglingFeeds.value.has(feedId)) {
      return { success: false, error: '正在切换状态中' }
    }
    
    const originalFeed = feeds.value[feedIndex]
    const newStatus = !originalFeed.isEnabled
    
    // 添加到切换状态
    togglingFeeds.value.add(feedId)
    
    console.log(`[TOGGLE-DEBUG] 开始切换RSS源状态: ${originalFeed.name}`)
    console.log(`[TOGGLE-DEBUG] 当前状态: ${originalFeed.isEnabled ? '启用' : '禁用'}`)
    console.log(`[TOGGLE-DEBUG] 目标状态: ${newStatus ? '启用' : '禁用'}`)
    console.log(`[TOGGLE-DEBUG] 切换前feeds数组状态:`, {
      feedIndex,
      feedId: originalFeed.id,
      isEnabled: originalFeed.isEnabled,
      feedsLength: feeds.value.length
    })
    
    try {
      // 调用后端API更新状态 - 不使用乐观更新，等待API响应
      const updatedFeed = await rssService.updateFeed(feedId, {
        name: originalFeed.name,
        url: originalFeed.url,
        category: originalFeed.category,
        description: originalFeed.description,
        active: newStatus
      })
      
      console.log(`[TOGGLE-DEBUG] API调用成功，返回数据:`, updatedFeed)
      
      if (updatedFeed) {
        // **重要**: 在重新映射之前，先记录当前状态
        const beforeMapping = {
          feedIndex: feeds.value.findIndex(f => f.id === feedId),
          currentEnabled: feeds.value[feedIndex]?.isEnabled,
          feedsCount: feeds.value.length
        }
        console.log(`[TOGGLE-DEBUG] 映射前状态检查:`, beforeMapping)
        
        // API成功后，重新映射并更新UI - 使用简化映射避免异步干扰
        const mappedFeed = mapRssSourceToFeedSync(updatedFeed)
        
        console.log(`[TOGGLE-DEBUG] 映射后的feed数据:`, {
          id: mappedFeed.id,
          name: mappedFeed.name,
          isEnabled: mappedFeed.isEnabled,
          status: mappedFeed.status
        })
        
        // **关键**: 确保索引仍然有效，避免并发修改导致的问题
        const currentIndex = feeds.value.findIndex(feed => feed.id === feedId)
        if (currentIndex !== -1) {
          console.log(`[TOGGLE-DEBUG] 更新feeds数组，索引: ${currentIndex}`)
          
          // 直接更新，不触发其他异步操作
          feeds.value[currentIndex] = mappedFeed
          
          // 立即验证更新结果
          const afterUpdate = feeds.value[currentIndex]
          console.log(`[TOGGLE-DEBUG] 更新后验证:`, {
            feedId: afterUpdate.id,
            isEnabled: afterUpdate.isEnabled,
            expected: newStatus
          })
          
          if (afterUpdate.isEnabled !== newStatus) {
            console.error(`[TOGGLE-DEBUG] 严重错误: 更新后状态不匹配!`, {
              expected: newStatus,
              actual: afterUpdate.isEnabled
            })
          }
        } else {
          console.error(`[TOGGLE-DEBUG] 严重错误: 更新时找不到RSS源`, { feedId })
        }
        
        // 保存到localStorage
        saveToLocalStorage()
        
        console.log(`[TOGGLE-DEBUG] RSS源状态切换成功: ${originalFeed.name}, 新状态: ${mappedFeed.isEnabled ? '启用' : '禁用'}`)
        
        return { 
          success: true, 
          newStatus: mappedFeed.isEnabled,
          message: `已${mappedFeed.isEnabled ? '启用' : '禁用'} ${originalFeed.name}`
        }
      } else {
        throw new Error('更新失败，服务器未返回数据')
      }
    } catch (err: any) {
      console.error(`[TOGGLE-DEBUG] RSS源状态切换失败: ${originalFeed.name}`, err)
      console.error(`[TOGGLE-DEBUG] 错误详情:`, err.response?.data || err.message)
      
      return { 
        success: false, 
        error: err.message || '状态切换失败',
        message: `切换${originalFeed.name}状态失败: ${err.response?.data?.message || err.message || '未知错误'}`
      }
    } finally {
      // 移除切换状态
      togglingFeeds.value.delete(feedId)
      
      console.log(`[TOGGLE-DEBUG] 切换操作完成，最终状态检查:`, {
        feedId,
        finalEnabled: feeds.value.find(f => f.id === feedId)?.isEnabled,
        togglingComplete: !togglingFeeds.value.has(feedId)
      })
    }
  }
  
  // 删除RSS源
  const removeFeed = async (feedId: string) => {
    isLoading.value = true
    error.value = null
    
    try {
      await rssService.deleteFeed(feedId)
      
      // 从本地状态中移除
      const index = feeds.value.findIndex(feed => feed.id === feedId)
      if (index !== -1) {
        feeds.value.splice(index, 1)
        totalFeeds.value--
      }
      
      selectedFeeds.value.delete(feedId)
      saveToLocalStorage()
      
      return true
    } catch (err) {
      handleError('删除RSS源失败')
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // 手动刷新RSS源 - 完全优化版本
  const refreshSingleFeed = async (feedId: string) => {
    const feedIndex = feeds.value.findIndex(feed => feed.id === feedId)
    if (feedIndex === -1) {
      console.warn(`RSS源不存在: ${feedId}`)
      return { success: false, error: 'RSS源不存在' }
    }
    
    // 防止重复刷新
    if (refreshingFeeds.value.has(feedId)) {
      return { success: false, error: '正在刷新中' }
    }
    
    // 添加到刷新状态
    refreshingFeeds.value.add(feedId)
    
    // 立即更新UI状态为updating
    const originalFeed = feeds.value[feedIndex]
    feeds.value[feedIndex] = {
      ...originalFeed,
      status: 'updating' as FeedStatus
    }
    
    try {
      console.log(`开始刷新RSS源: ${originalFeed.name}`)
      
      // 调用后端文章抓取API
      const result = await rssService.fetchFeed(feedId)
      
      if (result.success) {
        console.log(`RSS源刷新成功: ${originalFeed.name}, 新增文章: ${result.count || 0}`)
        
        // 重新从后端获取RSS源的最新数据
        const userFeeds = await rssService.getUserFeeds()
        const updatedSource = userFeeds.find(source => source.id === feedId)
        
        if (updatedSource) {
          // 使用最新的RSS源数据重新映射
          const updatedFeed = await mapRssSourceToFeed(updatedSource)
          // 确保更新时间反映当前时间
          updatedFeed.lastUpdated = new Date().toISOString()
          updatedFeed.status = 'active'
          feeds.value[feedIndex] = updatedFeed
        } else {
          // 如果没有获取到更新数据，至少更新时间和状态
          feeds.value[feedIndex] = {
            ...originalFeed,
            lastUpdated: new Date().toISOString(),
            status: 'active' as FeedStatus
          }
        }
        
        // 保存到localStorage
        saveToLocalStorage()
        
        return { 
          success: true, 
          articlesAdded: result.count || 0,
          message: `刷新完成，新增 ${result.count || 0} 篇文章`
        }
      } else {
        console.error(`RSS源刷新失败: ${originalFeed.name}`)
        
        // 恢复为错误状态
        feeds.value[feedIndex] = {
          ...originalFeed,
          status: 'error' as FeedStatus,
          lastError: '刷新失败'
        }
        
        return { 
          success: false, 
          error: '刷新失败',
          message: '刷新失败，请稍后重试'
        }
      }
    } catch (err: any) {
      console.error(`RSS源刷新异常: ${originalFeed.name}`, err)
      
      // 恢复为错误状态
      feeds.value[feedIndex] = {
        ...originalFeed,
        status: 'error' as FeedStatus,
        lastError: err.message || '刷新异常'
      }
      
      return { 
        success: false, 
        error: err.message || '刷新异常',
        message: '刷新失败，请检查网络连接'
      }
    } finally {
      // 移除刷新状态
      refreshingFeeds.value.delete(feedId)
    }
  }
  
  // 刷新所有RSS源 - 简化版本
  const refreshAll = async () => {
    isRefreshing.value = true
    error.value = null
    
    try {
      // 重新加载RSS源列表
      await loadFeeds()
      return { success: true }
    } catch (err) {
      handleError('批量刷新失败')
      return null
    } finally {
      isRefreshing.value = false
    }
  }
  
  // 批量删除RSS源
  const bulkDelete = async (feedIds: string[]) => {
    isBulkOperating.value = true
    error.value = null
    
    try {
      // 逐个删除
      for (const feedId of feedIds) {
        await removeFeed(feedId)
      }
      
      return { success: true, deletedCount: feedIds.length }
    } catch (err) {
      handleError('批量删除失败')
      return null
    } finally {
      isBulkOperating.value = false
    }
  }
  
  // 批量更新分类
  const bulkUpdateFeedCategory = async (feedIds: string[], category: FeedCategory) => {
    isBulkOperating.value = true
    error.value = null
    
    try {
      // 本地更新
      feedIds.forEach(feedId => {
        const index = feeds.value.findIndex(feed => feed.id === feedId)
        if (index !== -1) {
          feeds.value[index].category = category
        }
      })
      
      saveToLocalStorage()
      return { success: true, updatedCount: feedIds.length }
    } catch (err) {
      handleError('批量更新分类失败')
      return null
    } finally {
      isBulkOperating.value = false
    }
  }
  
  // 加载统计数据
  const loadStats = async () => {
    try {
      const statsData = await rssService.getFeedStats()
      stats.value = statsData
      return statsData
    } catch (err) {
      console.warn('[RssStore] 获取统计数据失败:', err)
      // 不再设置全局error状态，避免影响整体页面显示
      // handleError('获取统计数据失败')
      return null
    }
  }
  
  // 检测RSS源URL - 简化版本（暂时禁用）
  const detectUrl = async (url: string) => {
    try {
      // 暂时返回简单验证结果
      return {
        isValid: url.includes('rss') || url.includes('feed') || url.includes('xml'),
        feedUrl: url,
        title: 'Unknown Feed',
        description: '',
        error: url.includes('rss') || url.includes('feed') || url.includes('xml') ? '' : 'URL 可能不是有效的RSS源'
      }
    } catch (err) {
      handleError('URL检测失败')
      return null
    }
  }
  
  // 验证RSS源URL
  const validateUrl = async (url: string) => {
    try {
      const result = await rssService.validateFeedUrl(url)
      return result
    } catch (err) {
      handleError('URL验证失败')
      return null
    }
  }
  
  // 导出数据 - 简化版本（暂时禁用）
  const exportData = async (format: string = 'json') => {
    try {
      // 简单的本地导出
      return {
        feeds: feeds.value,
        stats: stats.value,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
    } catch (err) {
      handleError('导出数据失败')
      return null
    }
  }
  
  // ===== 过滤和搜索方法 =====
  
  // 设置分类过滤
  const setCategory = (category: FeedCategory) => {
    currentCategory.value = category
    currentPage.value = 1
    loadFeeds()
  }
  
  // 设置状态过滤
  const setStatus = (status: FeedStatus | 'all') => {
    currentStatus.value = status
    currentPage.value = 1
    loadFeeds()
  }
  
  // 设置优先级过滤
  const setPriority = (priority: FeedPriority | 'all') => {
    currentPriority.value = priority
    currentPage.value = 1
    loadFeeds()
  }
  
  // 设置搜索查询
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
    loadFeeds()
  }
  
  // 设置标签过滤
  const setSelectedTags = (tags: string[]) => {
    selectedTags.value = tags
    currentPage.value = 1
    loadFeeds()
  }
  
  // 设置排序
  const setSorting = (field: string, order: 'asc' | 'desc') => {
    sortBy.value = field
    sortOrder.value = order
    currentPage.value = 1
    loadFeeds()
  }
  
  // 加载更多
  const loadMore = () => {
    if (hasMore.value && !isLoading.value) {
      currentPage.value++
      loadFeeds()
    }
  }
  
  // ===== 选择操作 =====
  
  // 切换RSS源选择状态
  const toggleFeedSelection = (feedId: string) => {
    if (selectedFeeds.value.has(feedId)) {
      selectedFeeds.value.delete(feedId)
    } else {
      selectedFeeds.value.add(feedId)
    }
  }
  
  // 全选/取消全选
  const toggleSelectAll = () => {
    if (isAllSelected.value) {
      // 取消全选
      filteredFeeds.value.forEach(feed => {
        selectedFeeds.value.delete(feed.id)
      })
    } else {
      // 全选
      filteredFeeds.value.forEach(feed => {
        selectedFeeds.value.add(feed.id)
      })
    }
  }
  
  // 清空选择
  const clearSelection = () => {
    selectedFeeds.value.clear()
  }
  
  // ===== 模态框操作 =====
  
  // 打开添加RSS源模态框
  const openAddFeedModal = () => {
    isAddFeedModalVisible.value = true
    urlDetectionResult.value = null
    error.value = null
  }
  
  // 关闭添加RSS源模态框
  const closeAddFeedModal = () => {
    isAddFeedModalVisible.value = false
    urlDetectionResult.value = null
    error.value = null
  }
  
  // 打开编辑RSS源模态框
  const openEditFeedModal = (feed: RssFeed) => {
    editingFeed.value = feed
    isEditFeedModalVisible.value = true
    error.value = null
  }
  
  // 关闭编辑RSS源模态框
  const closeEditFeedModal = () => {
    editingFeed.value = null
    isEditFeedModalVisible.value = false
    error.value = null
  }
  
  // 打开批量操作模态框
  const openBulkOperationModal = () => {
    isBulkOperationModalVisible.value = true
    error.value = null
  }
  
  // 关闭批量操作模态框
  const closeBulkOperationModal = () => {
    isBulkOperationModalVisible.value = false
    error.value = null
  }
  
  // 打开统计模态框
  const openStatsModal = () => {
    isStatsModalVisible.value = true
    loadStats()
  }
  
  // 关闭统计模态框
  const closeStatsModal = () => {
    isStatsModalVisible.value = false
  }
  
  // ===== 初始化和重置 =====
  
  // 初始化RSS管理
  const initializeRss = async () => {
    console.log('[RssStore] 开始初始化RSS管理...')
    // 重置错误状态
    error.value = null
    
    try {
      // 从localStorage恢复状态
      restoreFromLocalStorage()
      
      // 先尝试加载RSS源，这是最重要的
      const feedsResult = await loadFeeds().catch(err => {
        console.error('[RssStore] 加载RSS源列表失败:', err)
        return []
      })
      
      // 即使RSS源加载失败，依然尝试继续执行
      if (feedsResult.length === 0 && error.value) {
        console.warn('[RssStore] RSS源加载失败，但将继续尝试加载统计数据')
      }
      
      // 尝试加载统计数据，但不让统计数据失败影响整体页面
      try {
        await loadStats()
      } catch (statsErr) {
        console.error('[RssStore] 加载统计数据失败，但不影响页面显示:', statsErr)
        // 不设置全局error状态
      }
      
      console.log('[RssStore] RSS初始化完成')
      return feedsResult
    } catch (err: any) {
      const errorMsg = err?.message || '初始化RSS管理失败'
      console.error('[RssStore] 初始化RSS管理失败:', errorMsg)
      handleError(errorMsg)
      throw err
    }
  }
  
  // 重置状态
  const resetState = () => {
    feeds.value = []
    currentCategory.value = 'all'
    currentStatus.value = 'all'
    currentPriority.value = 'all'
    searchQuery.value = ''
    selectedTags.value = []
    sortBy.value = 'lastUpdated'
    sortOrder.value = 'desc'
    currentPage.value = 1
    totalFeeds.value = 0
    hasMore.value = false
    isLoading.value = false
    isRefreshing.value = false
    isBulkOperating.value = false
    error.value = null
    selectedFeeds.value.clear()
    stats.value = null
    urlDetectionResult.value = null
    
    // 关闭所有模态框
    isAddFeedModalVisible.value = false
    isEditFeedModalVisible.value = false
    isBulkOperationModalVisible.value = false
    isStatsModalVisible.value = false
    editingFeed.value = null
  }
  
  // 新增：批量操作方法
  
  // 切换选择模式
  const toggleSelectMode = () => {
    isSelectMode.value = !isSelectMode.value
    if (!isSelectMode.value) {
      selectedFeeds.value.clear()
    }
  }
  
  // 全选
  const selectAllFeeds = () => {
    const visibleFeeds = filteredFeeds.value
    selectedFeeds.value.clear()
    visibleFeeds.forEach(feed => selectedFeeds.value.add(feed.id))
  }
  
  // 取消全选
  const deselectAllFeeds = () => {
    selectedFeeds.value.clear()
  }
  
  // 反选
  const invertSelection = () => {
    const visibleFeeds = filteredFeeds.value
    const visibleFeedIds = visibleFeeds.map(feed => feed.id)
    const newSelection = new Set<string>()
    
    visibleFeedIds.forEach(id => {
      if (!selectedFeeds.value.has(id)) {
        newSelection.add(id)
      }
    })
    
    selectedFeeds.value.clear()
    newSelection.forEach(id => selectedFeeds.value.add(id))
  }
  
  // 批量删除
  const batchDeleteFeeds = async (feedIds: string[]) => {
    bulkOperationProgress.value = {
      total: feedIds.length,
      completed: 0,
      failed: 0,
      operation: 'delete',
      errors: []
    }
    
    for (const feedId of feedIds) {
      try {
        await removeFeed(feedId)
        bulkOperationProgress.value.completed++
      } catch (error) {
        bulkOperationProgress.value.failed++
        bulkOperationProgress.value.errors?.push(`删除 ${feedId} 失败: ${error}`)
      }
    }
    
    selectedFeeds.value.clear()
    bulkOperationProgress.value = null
  }
  
  // 批量更新
  const batchUpdateFeeds = async (feedIds: string[], updateData: BatchUpdateData) => {
    bulkOperationProgress.value = {
      total: feedIds.length,
      completed: 0,
      failed: 0,
      operation: 'update',
      errors: []
    }
    
    for (const feedId of feedIds) {
      try {
        const feed = feeds.value.find(f => f.id === feedId)
        if (feed) {
          Object.assign(feed, updateData, { updatedAt: new Date().toISOString() })
          bulkOperationProgress.value.completed++
        }
      } catch (error) {
        bulkOperationProgress.value.failed++
        bulkOperationProgress.value.errors?.push(`更新 ${feedId} 失败: ${error}`)
      }
    }
    
    selectedFeeds.value.clear()
    bulkOperationProgress.value = null
  }
  
  // 新增：拖拽排序方法
  
  // 开始拖拽
  const startDrag = (feedId: string, dragType: 'reorder' | 'category' = 'reorder') => {
    dragState.value = {
      isDragging: true,
      draggedFeedId: feedId,
      dropTarget: null,
      dragType
    }
  }
  
  // 更新拖拽目标
  const updateDropTarget = (targetId: string | null) => {
    if (dragState.value) {
      dragState.value.dropTarget = targetId
    }
  }
  
  // 结束拖拽
  const endDrag = () => {
    dragState.value = null
  }
  
  // 重新排序Feed
  const reorderFeeds = (fromIndex: number, toIndex: number) => {
    const feedsCopy = [...feeds.value]
    const [movedFeed] = feedsCopy.splice(fromIndex, 1)
    feedsCopy.splice(toIndex, 0, movedFeed)
    feeds.value = feedsCopy
    
    // 更新排序数组
    feedOrder.value = feedsCopy.map(feed => feed.id)
  }
  
  // 移动Feed到新分类 - 简化版本
  const moveFeedToCategory = (feedId: string, newCategory: FeedCategory) => {
    const feed = feeds.value.find(f => f.id === feedId)
    if (feed) {
      feed.category = newCategory
      // 注意：不再访问不存在的updatedAt属性
    }
  }
  
  // 新增：右键菜单方法
  
  // 显示右键菜单
  const showContextMenu = (x: number, y: number, feedId: string) => {
    contextMenuState.value = {
      isVisible: true,
      x,
      y,
      targetFeedId: feedId
    }
  }
  
  // 隐藏右键菜单
  const hideContextMenu = () => {
    contextMenuState.value = null
  }
  
  // 新增：导入导出方法
  
  // 开始导入
  const startImport = async (opmlData: OPMLData) => {
    isImporting.value = true
    importProgress.value = {
      total: opmlData.feeds.length,
      processed: 0,
      imported: 0,
      failed: 0,
      conflicts: [],
      isCompleted: false
    }
    
    // 检查冲突
    for (const opmlFeed of opmlData.feeds) {
      const existingFeed = feeds.value.find(f => f.url === opmlFeed.xmlUrl)
      if (existingFeed) {
        importProgress.value.conflicts.push({
          url: opmlFeed.xmlUrl,
          existingFeed,
          newFeed: {
            name: opmlFeed.title,
            url: opmlFeed.xmlUrl,
            description: opmlFeed.description,
            category: (opmlFeed.category as FeedCategory) || 'other'
          },
          conflictType: 'duplicate'
        })
      }
    }
    
    // 导入非冲突的Feed
    for (const opmlFeed of opmlData.feeds) {
      const hasConflict = importProgress.value.conflicts.some(c => c.url === opmlFeed.xmlUrl)
      
      if (!hasConflict) {
        try {
          await createFeed({
            name: opmlFeed.title,
            url: opmlFeed.xmlUrl,
            category: (opmlFeed.category as FeedCategory) || 'other',
            priority: 'medium'
          })
          importProgress.value.imported++
        } catch (error) {
          importProgress.value.failed++
        }
      }
      
      importProgress.value.processed++
    }
    
    importProgress.value.isCompleted = true
    isImporting.value = false
  }
  
  // 导出为OPML
  const exportToOPML = async (options: ExportOptions): Promise<string> => {
    isExporting.value = true
    
    try {
      let feedsToExport = feeds.value
      
      if (options.includeSelected && options.selectedFeeds) {
        feedsToExport = feeds.value.filter(feed => options.selectedFeeds!.includes(feed.id))
      }
      
      if (options.categories && options.categories.length > 0) {
        feedsToExport = feeds.value.filter(feed => options.categories!.includes(feed.category))
      }
      
      const opmlData: OPMLData = {
        title: 'AI阅读器 RSS订阅',
        dateCreated: new Date().toISOString(),
        ownerName: '用户',
        feeds: feedsToExport.map(feed => ({
          title: feed.name,
          xmlUrl: feed.url,
          htmlUrl: feed.url,
          description: feed.description || '',
          category: feed.category,
          tags: feed.tags || []
        })),
        categories: []
      }
      
      // 按分类分组
      const categoryGroups = feedsToExport.reduce((groups, feed) => {
        if (!groups[feed.category]) {
          groups[feed.category] = []
        }
        groups[feed.category].push({
          title: feed.name,
          xmlUrl: feed.url,
          htmlUrl: feed.url,
          description: feed.description || '',
          category: feed.category,
          tags: feed.tags || []
        })
        return groups
      }, {} as Record<string, any[]>)
      
      opmlData.categories = Object.entries(categoryGroups).map(([name, feeds]) => ({
        name,
        feeds
      }))
      
      return generateOPMLString(opmlData)
    } finally {
      isExporting.value = false
    }
  }
  
  // 生成OPML字符串
  const generateOPMLString = (data: OPMLData): string => {
    let opml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    opml += `<opml version="2.0">\n`
    opml += `  <head>\n`
    opml += `    <title>${data.title || 'RSS Feeds'}</title>\n`
    opml += `    <dateCreated>${data.dateCreated || new Date().toISOString()}</dateCreated>\n`
    opml += `    <ownerName>${data.ownerName || ''}</ownerName>\n`
    opml += `  </head>\n`
    opml += `  <body>\n`
    
    // 按分类输出
    for (const category of data.categories) {
      opml += `    <outline text="${category.name}" title="${category.name}">\n`
      for (const feed of category.feeds) {
        opml += `      <outline text="${feed.title}" title="${feed.title}" type="rss" xmlUrl="${feed.xmlUrl}" htmlUrl="${feed.htmlUrl || feed.xmlUrl}"`
        if (feed.description) {
          opml += ` description="${feed.description}"`
        }
        opml += `/>\n`
      }
      opml += `    </outline>\n`
    }
    
    opml += `  </body>\n`
    opml += `</opml>`
    
    return opml
  }
  
  // 模态框控制方法
  const openBatchOperationModal = (operation: string) => {
    batchOperation.value = operation
    showBatchOperationModal.value = true
  }
  
  const closeBatchOperationModal = () => {
    showBatchOperationModal.value = false
    batchOperation.value = null
  }
  
  const openImportExportModal = () => {
    showImportExportModal.value = true
  }
  
  const closeImportExportModal = () => {
    showImportExportModal.value = false
  }
  
  // 保存状态到localStorage
  const saveToLocalStorage = () => {
    try {
      const state = {
        currentCategory: currentCategory.value,
        currentStatus: currentStatus.value,
        currentPriority: currentPriority.value,
        searchQuery: searchQuery.value,
        selectedTags: selectedTags.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        pageSize: pageSize.value,
        feedOrder: feedOrder.value
      }
      localStorage.setItem('rss-management-state', JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save RSS state to localStorage:', error)
    }
  }
  
  // 从localStorage恢复状态
  const restoreFromLocalStorage = () => {
    try {
      const savedState = localStorage.getItem('rss-management-state')
      if (savedState) {
        const state = JSON.parse(savedState)
        currentCategory.value = state.currentCategory || 'all'
        currentStatus.value = state.currentStatus || 'all'
        currentPriority.value = state.currentPriority || 'all'
        searchQuery.value = state.searchQuery || ''
        selectedTags.value = state.selectedTags || []
        sortBy.value = state.sortBy || 'lastUpdated'
        sortOrder.value = state.sortOrder || 'desc'
        pageSize.value = state.pageSize || 20
        feedOrder.value = state.feedOrder || []
      }
    } catch (error) {
      console.warn('Failed to restore RSS state from localStorage:', error)
    }
  }
  
  return {
    // 状态
    feeds,
    currentCategory,
    currentStatus,
    currentPriority,
    searchQuery,
    selectedTags,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
    totalFeeds,
    hasMore,
    isLoading,
    isRefreshing,
    isBulkOperating,
    refreshingFeeds,
    togglingFeeds,
    error,
    isAddFeedModalVisible,
    isEditFeedModalVisible,
    isBulkOperationModalVisible,
    isStatsModalVisible,
    editingFeed,
    selectedFeeds,
    stats,
    urlDetectionResult,
    
    // 计算属性
    filteredFeeds,
    allTags,
    categoryStats,
    statusStats,
    isAllSelected,
    isIndeterminate,
    isFeedRefreshing,
    isFeedToggling,
    
    // 操作方法
    loadFeeds,
    createFeed,
    updateFeedData,
    removeFeed,
    refreshSingleFeed,
    refreshAll,
    bulkDelete,
    bulkUpdateFeedCategory,
    loadStats,
    detectUrl,
    validateUrl,
    exportData,
    
    // 过滤和搜索
    setCategory,
    setStatus,
    setPriority,
    setSearchQuery,
    setSelectedTags,
    setSorting,
    loadMore,
    
    // 选择操作
    toggleFeedSelection,
    toggleSelectAll,
    clearSelection,
    
    // 模态框操作
    openAddFeedModal,
    closeAddFeedModal,
    openEditFeedModal,
    closeEditFeedModal,
    openBulkOperationModal,
    closeBulkOperationModal,
    openStatsModal,
    closeStatsModal,
    
    // 初始化和重置
    initializeRss,
    resetState,
    saveToLocalStorage,
    restoreFromLocalStorage,
    
    // 批量操作方法
    toggleSelectMode,
    selectAllFeeds,
    deselectAllFeeds,
    invertSelection,
    batchDeleteFeeds,
    batchUpdateFeeds,
    
    // 拖拽排序方法
    startDrag,
    updateDropTarget,
    endDrag,
    reorderFeeds,
    moveFeedToCategory,
    
    // 右键菜单方法
    showContextMenu,
    hideContextMenu,
    
    // 导入导出方法
    startImport,
    exportToOPML,
    
    // 模态框控制方法
    openBatchOperationModal,
    closeBatchOperationModal,
    openImportExportModal,
    closeImportExportModal,
    
    // 新增：切换RSS源启用/禁用状态方法
    toggleFeedStatus
  }
}) 