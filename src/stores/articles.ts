import { defineStore } from 'pinia'
import { ref, reactive, computed, watch } from 'vue'
import type { Article } from '@/api/types/article'
import type { ApiResponse, PagedResponse } from '@/api/types/common'
import { articleService } from '@/api/services/articleService'
import { rssService } from '@/api/services/rssService'
import type { ArticleListParams } from '@/api/services/articleService'
import type { RssSource } from '@/api/types/rss'

// 本地UI状态类型（不与API类型冲突）
export interface UIArticleFilters {
  search: string
  source: string
  sourceId: string
  status: 'all' | 'read' | 'unread' | 'favorited'
  sortBy: 'publishDate' | 'publishDate_asc' | 'title' | 'source'
  sortOrder: 'asc' | 'desc'
  tags: string[]
  quickFilter: 'all' | 'unread' | 'favorited' | 'today' | 'week'
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export type ViewMode = 'list' | 'grid' | 'compact'

export interface ViewOptions {
  showImages: boolean
  showExcerpt: boolean
  showMeta: boolean
}

// 扩展文章类型以包含UI状态
export interface UIArticle extends Article {
  // 兼容性属性 - 映射后端字段到UI字段
  readStatus: 'read' | 'unread'
  source: string
  sourceId: string
  publishTime: string
  excerpt: string
  tags: string[]
  url: string
}

export const useArticlesStore = defineStore('articles', () => {
  // 状态
  const articles = ref<UIArticle[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const rssSources = ref<RssSource[]>([])
  
  // 筛选和分页
  const filters = ref<UIArticleFilters>({
    search: '',
    source: '',
    sourceId: '',
    status: 'all',
    sortBy: 'publishDate',
    sortOrder: 'desc',
    tags: [],
    quickFilter: 'all'
  })
  
  const pagination = ref<PaginationParams>({
    page: 1,
    pageSize: 100
  })
  
  // 视图设置
  const viewMode = ref<ViewMode>('list')
  const viewOptions = ref<ViewOptions>({
    showImages: true,
    showExcerpt: true,
    showMeta: true
  })
  
  // 计算属性
  const totalPages = computed(() => Math.ceil(total.value / pagination.value.pageSize))
  
  const hasArticles = computed(() => articles.value.length > 0)
  
  const unreadCount = computed(() => 
    articles.value.filter(article => article.readStatus === 'unread').length
  )
  
  const favoritedCount = computed(() => 
    articles.value.filter(article => article.isFavorited).length
  )
  
  const todayCount = computed(() => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return articles.value.filter(article => {
      const publishDate = new Date(article.publishTime)
      return publishDate >= todayStart
    }).length
  })
  
  const weekCount = computed(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    return articles.value.filter(article => {
      const publishDate = new Date(article.publishTime)
      return publishDate >= weekStart
    }).length
  })
  
  const isFirstPage = computed(() => pagination.value.page === 1)
  
  const isLastPage = computed(() => pagination.value.page >= totalPages.value)
  
  const availableTags = computed(() => {
    const tagSet = new Set<string>()
    articles.value.forEach(article => {
      if (article.tags) {
        article.tags.forEach((tag: string) => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  })
  
  const filteredArticlesCount = computed(() => {
    if (!hasActiveFilters.value) {
      return total.value
    }
    return articles.value.length
  })

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = computed(() => {
    const f = filters.value
    return f.search !== '' ||
           f.sourceId !== '' ||
           f.status !== 'all' ||
           f.tags.length > 0 ||
           f.quickFilter !== 'all'
  })

  // 辅助函数：根据快速筛选应用时间范围筛选
  function applyQuickFilter(articles: UIArticle[], quickFilter: string): UIArticle[] {
    if (quickFilter === 'all') return articles
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 7)
    
    switch (quickFilter) {
      case 'today':
        return articles.filter(article => {
          const publishDate = new Date(article.publishTime)
          return publishDate >= today
        })
      case 'week':
        return articles.filter(article => {
          const publishDate = new Date(article.publishTime)
          return publishDate >= weekStart
        })
      case 'unread':
        return articles.filter(article => article.readStatus === 'unread')
      case 'favorited':
        return articles.filter(article => article.isFavorited)
      default:
        return articles
    }
  }

  // 辅助函数：将后端Article转换为UIArticle
  function mapArticleToUI(article: Article): UIArticle {
    return {
      ...article,
      // 映射后端字段到UI期望的字段
      readStatus: (article.isRead === true) ? 'read' : 'unread',
      source: article.rssSourceName || 'Unknown Source',
      sourceId: article.rssSourceId || '',
      publishTime: article.publicationDate,
      excerpt: article.summary || '',
      tags: article.extractedKeywords || [],
      url: article.originalUrl || `/articles/${article.id}`,
      // 保持其他字段
      isFavorited: article.isFavorited || false
    }
  }

  // Actions
  async function loadArticles(resetPage = false) {
    try {
      loading.value = true
      error.value = null
      
      if (resetPage) {
        pagination.value.page = 1
      }

      // 构建请求参数
      const params: ArticleListParams = {
        page: pagination.value.page - 1, // 后端使用0基础分页
        size: pagination.value.pageSize,
        search: filters.value.search || undefined,
        sourceId: filters.value.sourceId || undefined,
        status: filters.value.status === 'all' ? undefined : filters.value.status,
        sortBy: filters.value.sortBy === 'publishDate_asc' ? 'publishDate' : filters.value.sortBy,
        sortOrder: filters.value.sortBy === 'publishDate_asc' ? 'asc' : filters.value.sortOrder
      }

      const response: PagedResponse<Article> = await articleService.getArticles(params)
      
      // 安全检查：确保response和content存在
      if (response && response.content && Array.isArray(response.content)) {
        // 转换文章数据为UI格式
        let mappedArticles = response.content.map(mapArticleToUI)
        
        // 应用快速筛选（前端筛选）
        if (filters.value.quickFilter !== 'all') {
          mappedArticles = applyQuickFilter(mappedArticles, filters.value.quickFilter)
        }
        
        // 应用标签筛选（前端筛选）
        if (filters.value.tags.length > 0) {
          mappedArticles = mappedArticles.filter(article => 
            filters.value.tags.some(tag => article.tags.includes(tag))
          )
        }
        
        articles.value = mappedArticles
        total.value = response.totalElements || 0
        pagination.value.page = (response.number || 0) + 1 // 转换为1基础分页
      } else {
        // 如果数据格式不正确，设置为空
        articles.value = []
        total.value = 0
        pagination.value.page = 1
        console.warn('文章数据格式不正确:', response)
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载文章失败'
      console.error('Failed to load articles:', err)
      // 发生错误时设置为空状态
      articles.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }
  
  async function loadRssSources() {
    try {
      const sources = await rssService.getUserFeeds()
      rssSources.value = sources
    } catch (err) {
      console.error('Failed to load RSS sources:', err)
    }
  }
  
  async function refreshArticles() {
    await loadArticles(true)
  }
  
  async function toggleArticleRead(articleId: string) {
    try {
      const article = articles.value.find(a => a.id === articleId)
      if (!article) return
      
      const newStatus = article.readStatus === 'read' ? 'unread' : 'read'
      
      // 乐观更新
      article.readStatus = newStatus
      article.isRead = newStatus === 'read'
      
      // 检查用户是否已登录，只有登录用户才调用后端API
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
      const hasToken = !!localStorage.getItem('access_token')
      
      if (isLoggedIn && hasToken) {
        // 调用后端API
        if (newStatus === 'read') {
          await articleService.markAsRead(articleId)
        } else {
          await articleService.markAsUnread(articleId)
        }
      } else {
        // 未登录用户：仅更新本地状态，不调用API
        console.log('用户未登录，仅更新本地文章状态')
      }
      
    } catch (err) {
      // 回滚更新
      const article = articles.value.find(a => a.id === articleId)
      if (article) {
        article.readStatus = article.readStatus === 'read' ? 'unread' : 'read'
        article.isRead = !article.isRead
      }
      
      // 检查是否是权限错误，给出友好提示
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      if (errorMessage.includes('权限') || errorMessage.includes('401') || errorMessage.includes('403')) {
        error.value = '需要登录后才能同步阅读状态'
        console.warn('未登录用户尝试同步阅读状态:', err)
      } else {
        error.value = '更新文章状态失败'
        console.error('Failed to update article status:', err)
      }
    }
  }
  
  async function toggleArticleFavoriteStatus(articleId: string) {
    try {
      const article = articles.value.find(a => a.id === articleId)
      if (!article) return
      
      const newFavoriteStatus = !article.isFavorited
      
      // 乐观更新
      article.isFavorited = newFavoriteStatus
      
      await articleService.toggleFavorite(articleId, newFavoriteStatus)
      
    } catch (err) {
      // 回滚更新
      const article = articles.value.find(a => a.id === articleId)
      if (article) {
        article.isFavorited = !article.isFavorited
      }
      
      error.value = '更新收藏状态失败'
      console.error('Failed to toggle article favorite:', err)
    }
  }
  
  function updateFilters(newFilters: Partial<UIArticleFilters>) {
    console.log('更新筛选条件:', newFilters);
    console.log('更新前的筛选状态:', { ...filters.value });
    
    Object.assign(filters.value, newFilters)
    
    console.log('更新后的筛选状态:', { ...filters.value });
    
    loadArticles(true) // 重置到第一页并重新加载
  }
  
  function updateSearch(search: string) {
    console.log('更新搜索条件:', search);
    filters.value.search = search
    loadArticles(true)
  }
  
  function updateSource(sourceId: string) {
    console.log('更新RSS源筛选:', sourceId);
    filters.value.sourceId = sourceId
    // 同时更新source字段（为了向后兼容）
    const source = rssSources.value.find(s => s.id === sourceId)
    filters.value.source = source?.name || ''
    loadArticles(true)
  }
  
  function updateStatus(status: UIArticleFilters['status']) {
    console.log('更新状态筛选:', status);
    filters.value.status = status
    loadArticles(true)
  }
  
  function updateQuickFilter(quickFilter: UIArticleFilters['quickFilter']) {
    console.log('更新快速筛选:', quickFilter);
    filters.value.quickFilter = quickFilter
    loadArticles(true)
  }
  
  function updateSort(sortBy: UIArticleFilters['sortBy'], sortOrder?: UIArticleFilters['sortOrder']) {
    console.log('更新排序:', { sortBy, sortOrder });
    filters.value.sortBy = sortBy
    if (sortOrder) {
      filters.value.sortOrder = sortOrder
    }
    loadArticles(true)
  }
  
  function addFilterTag(tag: string) {
    if (!filters.value.tags.includes(tag)) {
      filters.value.tags.push(tag)
      loadArticles(true)
    }
  }
  
  function removeFilterTag(tag: string) {
    const index = filters.value.tags.indexOf(tag)
    if (index > -1) {
      filters.value.tags.splice(index, 1)
      loadArticles(true)
    }
  }
  
  function clearFilters() {
    filters.value = {
      search: '',
      source: '',
      sourceId: '',
      status: 'all',
      sortBy: 'publishDate',
      sortOrder: 'desc',
      tags: [],
      quickFilter: 'all'
    }
    loadArticles(true)
  }
  
  function changePage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      pagination.value.page = page
      loadArticles()
    }
  }
  
  function changePageSize(pageSize: number) {
    pagination.value.pageSize = pageSize
    pagination.value.page = 1
    // 保存到本地存储
    localStorage.setItem('articles-page-size', pageSize.toString())
    loadArticles()
  }
  
  function nextPage() {
    if (!isLastPage.value) {
      changePage(pagination.value.page + 1)
    }
  }
  
  function prevPage() {
    if (!isFirstPage.value) {
      changePage(pagination.value.page - 1)
    }
  }
  
  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
    // 保存到本地存储
    localStorage.setItem('articles-view-mode', mode)
  }
  
  function updateViewOptions(options: Partial<ViewOptions>) {
    viewOptions.value = { ...viewOptions.value, ...options }
    // 保存到本地存储
    localStorage.setItem('articles-view-options', JSON.stringify(viewOptions.value))
  }
  
  async function markAllAsRead() {
    const unreadArticleIds = articles.value
      .filter(article => article.readStatus === 'unread')
      .map(article => article.id.toString())
    
    if (unreadArticleIds.length === 0) return
    
    try {
      // 乐观更新
      articles.value.forEach(article => {
        if (article.readStatus === 'unread') {
          article.readStatus = 'read'
          article.isRead = true
        }
      })
      
      // 检查用户是否已登录，只有登录用户才调用后端API
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
      const hasToken = !!localStorage.getItem('access_token')
      
      if (isLoggedIn && hasToken) {
        // 调用新的标记所有文章为已读的API
        const result = await articleService.markAllAsRead()
        console.log(`成功标记 ${result.markedCount} 篇文章为已读`)
      } else {
        // 未登录用户：仅更新本地状态，不调用API
        console.log('用户未登录，仅更新本地文章状态')
      }
      
    } catch (err) {
      // 回滚更新
      articles.value.forEach(article => {
        if (unreadArticleIds.includes(article.id.toString())) {
          article.readStatus = 'unread'
          article.isRead = false
        }
      })
      
      // 检查是否是权限错误，给出友好提示
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      if (errorMessage.includes('权限') || errorMessage.includes('401') || errorMessage.includes('403')) {
        error.value = '需要登录后才能同步阅读状态'
        console.warn('未登录用户尝试同步阅读状态:', err)
      } else {
        error.value = '批量标记已读失败'
        console.error('Failed to mark all as read:', err)
      }
    }
  }
  
  function getArticleById(id: string): UIArticle | undefined {
    return articles.value.find(article => article.id === id)
  }
  
  // 初始化
  function initializeStore() {
    // 从本地存储恢复视图设置
    const savedViewMode = localStorage.getItem('articles-view-mode') as ViewMode
    if (savedViewMode && ['list', 'grid', 'compact'].includes(savedViewMode)) {
      viewMode.value = savedViewMode
    }
    
    const savedViewOptions = localStorage.getItem('articles-view-options')
    if (savedViewOptions) {
      try {
        const options = JSON.parse(savedViewOptions)
        viewOptions.value = { ...viewOptions.value, ...options }
      } catch (err) {
        console.warn('Failed to parse saved view options:', err)
      }
    }
    
    // 恢复保存的分页大小
    const savedPageSize = localStorage.getItem('articles-page-size')
    if (savedPageSize) {
      const pageSize = parseInt(savedPageSize, 10)
      if (!isNaN(pageSize) && [10, 20, 50, 100].includes(pageSize)) {
        pagination.value.pageSize = pageSize
      }
    }
    
    // 加载初始数据
    loadRssSources()
    loadArticles()
  }
  
  return {
    // 状态
    articles,
    total,
    loading,
    error,
    rssSources,
    filters,
    pagination,
    viewMode,
    viewOptions,
    
    // 计算属性
    totalPages,
    hasArticles,
    unreadCount,
    favoritedCount,
    todayCount,
    weekCount,
    isFirstPage,
    isLastPage,
    availableTags,
    filteredArticlesCount,
    hasActiveFilters,
    
    // Actions
    loadArticles,
    loadRssSources,
    refreshArticles,
    toggleArticleRead,
    toggleArticleFavoriteStatus,
    updateFilters,
    updateSearch,
    updateSource,
    updateStatus,
    updateSort,
    addFilterTag,
    removeFilterTag,
    clearFilters,
    changePage,
    changePageSize,
    nextPage,
    prevPage,
    setViewMode,
    updateViewOptions,
    markAllAsRead,
    getArticleById,
    initializeStore,
    updateQuickFilter
  }
}) 