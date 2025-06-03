/**
 * 分类页面状态管理
 * 使用Pinia管理RSS分类相关的状态
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { 
  CategoryPageState, 
  CategoryFeedInfo, 
  CategoryArticle, 
  CategoryInfo,
  AddFeedToCategoryRequest 
} from '@/types/category'
import { getCategoryInfo } from '@/types/category'
import * as categoryService from '@/api/categoryService'

export const useCategoryStore = defineStore('category', () => {
  // 状态
  const currentCategory = ref<string>('')
  const categoryInfo = ref<CategoryInfo | null>(null)
  const feeds = ref<CategoryFeedInfo[]>([])
  const articles = ref<CategoryArticle[]>([])
  const loading = ref<boolean>(false)
  const feedsLoading = ref<boolean>(false)
  const articlesLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // 计算属性
  const feedCount = computed(() => feeds.value.length)
  const activeFeedCount = computed(() => feeds.value.filter(feed => feed.active).length)
  const totalArticleCount = computed(() => 
    feeds.value.reduce((total, feed) => total + (feed.stats?.totalArticles || 0), 0)
  )
  const totalUnreadCount = computed(() => 
    feeds.value.reduce((total, feed) => total + (feed.stats?.unreadCount || 0), 0)
  )

  // Actions
  
  /**
   * 设置当前分类
   */
  function setCurrentCategory(category: string) {
    currentCategory.value = category
    categoryInfo.value = getCategoryInfo(category)
  }

  /**
   * 加载分类数据（RSS源和文章）
   */
  async function loadCategoryData(category: string) {
    try {
      loading.value = true
      error.value = null
      
      setCurrentCategory(category)
      
      // 并行加载RSS源和文章数据
      await Promise.all([
        loadCategoryFeeds(category),
        loadCategoryArticles(category)
      ])
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载分类数据失败'
      console.error('加载分类数据失败:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载分类RSS源
   */
  async function loadCategoryFeeds(category: string) {
    try {
      feedsLoading.value = true
      const categoryFeeds = await categoryService.getCategoryFeeds(category)
      feeds.value = categoryFeeds
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载RSS源失败'
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      feedsLoading.value = false
    }
  }

  /**
   * 加载分类文章
   */
  async function loadCategoryArticles(category: string, limit: number = 10) {
    try {
      articlesLoading.value = true
      const categoryArticles = await categoryService.getCategoryLatestArticles(category, limit)
      articles.value = categoryArticles
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载分类文章失败'
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      articlesLoading.value = false
    }
  }

  /**
   * 刷新指定RSS源
   */
  async function refreshCategoryFeed(feedId: string) {
    try {
      const result = await categoryService.refreshFeed(feedId)
      
      if (result.success) {
        // 刷新成功后重新加载该RSS源的统计信息
        const feedIndex = feeds.value.findIndex(feed => feed.id === feedId)
        if (feedIndex !== -1) {
          const stats = await categoryService.getFeedStats(feedId)
          feeds.value[feedIndex].stats = stats
          feeds.value[feedIndex].lastFetchedAt = new Date().toISOString()
          feeds.value[feedIndex].fetchStatus = 'SUCCESS'
          feeds.value[feedIndex].errorMessage = undefined
        }
        
        // 重新加载文章列表
        if (currentCategory.value) {
          await loadCategoryArticles(currentCategory.value)
        }
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新RSS源失败'
      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  /**
   * 添加RSS源到当前分类
   */
  async function addFeedToCategory(feedData: AddFeedToCategoryRequest) {
    try {
      const newFeed = await categoryService.addFeedToCategory(feedData)
      
      // 添加到本地状态
      feeds.value.push(newFeed)
      
      // 重新加载文章列表
      if (currentCategory.value) {
        await loadCategoryArticles(currentCategory.value)
      }
      
      return newFeed
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加RSS源失败'
      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  /**
   * 删除RSS源
   */
  async function deleteFeed(feedId: string) {
    try {
      const result = await categoryService.deleteFeed(feedId)
      
      if (result.success) {
        // 从本地状态中移除
        const feedIndex = feeds.value.findIndex(feed => feed.id === feedId)
        if (feedIndex !== -1) {
          feeds.value.splice(feedIndex, 1)
        }
        
        // 重新加载文章列表
        if (currentCategory.value) {
          await loadCategoryArticles(currentCategory.value)
        }
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除RSS源失败'
      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  /**
   * 验证RSS源URL
   */
  async function validateFeedUrl(url: string) {
    try {
      return await categoryService.validateFeedUrl(url)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '验证RSS源URL失败'
      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  /**
   * 清除错误状态
   */
  function clearError() {
    error.value = null
  }

  /**
   * 重置状态
   */
  function resetState() {
    currentCategory.value = ''
    categoryInfo.value = null
    feeds.value = []
    articles.value = []
    loading.value = false
    feedsLoading.value = false
    articlesLoading.value = false
    error.value = null
  }

  /**
   * 获取指定RSS源的信息
   */
  function getFeedById(feedId: string): CategoryFeedInfo | undefined {
    return feeds.value.find(feed => feed.id === feedId)
  }

  /**
   * 更新RSS源状态
   */
  function updateFeedStatus(feedId: string, status: 'SUCCESS' | 'ERROR' | 'PENDING', errorMessage?: string) {
    const feedIndex = feeds.value.findIndex(feed => feed.id === feedId)
    if (feedIndex !== -1) {
      feeds.value[feedIndex].fetchStatus = status
      feeds.value[feedIndex].errorMessage = errorMessage
      feeds.value[feedIndex].lastFetchedAt = new Date().toISOString()
    }
  }

  return {
    // 状态
    currentCategory: readonly(currentCategory),
    categoryInfo: readonly(categoryInfo),
    feeds: readonly(feeds),
    articles: readonly(articles),
    loading: readonly(loading),
    feedsLoading: readonly(feedsLoading),
    articlesLoading: readonly(articlesLoading),
    error: readonly(error),
    
    // 计算属性
    feedCount,
    activeFeedCount,
    totalArticleCount,
    totalUnreadCount,
    
    // Actions
    setCurrentCategory,
    loadCategoryData,
    loadCategoryFeeds,
    loadCategoryArticles,
    refreshCategoryFeed,
    addFeedToCategory,
    deleteFeed,
    validateFeedUrl,
    clearError,
    resetState,
    getFeedById,
    updateFeedStatus
  }
}) 