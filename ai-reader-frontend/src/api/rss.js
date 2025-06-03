/**
 * RSS管理模块Mock API服务
 * 提供RSS源管理的模拟数据和API接口
 */

// 模拟延迟函数
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// 生成唯一ID
const generateId = () => `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 格式化时间戳
const formatTimestamp = (date = new Date()) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}

// 生成随机数据
const generateRandomStats = () => ({
  articlesCount: Math.floor(Math.random() * 200) + 10,
  unreadCount: Math.floor(Math.random() * 50),
})

// RSS源分类选项
export const feedCategoryOptions = [
  { value: 'tech', label: '技术博客', icon: 'fas fa-laptop-code', color: '#3B82F6' },
  { value: 'news', label: '新闻资讯', icon: 'fas fa-newspaper', color: '#10B981' },
  { value: 'design', label: '设计灵感', icon: 'fas fa-palette', color: '#F59E0B' },
  { value: 'business', label: '商业财经', icon: 'fas fa-chart-line', color: '#8B5CF6' },
  { value: 'lifestyle', label: '生活方式', icon: 'fas fa-heart', color: '#EF4444' },
  { value: 'entertainment', label: '娱乐休闲', icon: 'fas fa-gamepad', color: '#06B6D4' },
  { value: 'science', label: '科学研究', icon: 'fas fa-flask', color: '#84CC16' },
  { value: 'other', label: '其他', icon: 'fas fa-folder', color: '#6B7280' }
]

// 获取分类信息
export const getCategoryInfo = (category) => {
  return feedCategoryOptions.find(opt => opt.value === category) || feedCategoryOptions[feedCategoryOptions.length - 1]
}

// 模拟RSS源数据
let mockFeeds = [
  {
    id: 'feed_1',
    name: 'Vue.js Blog',
    url: 'https://blog.vuejs.org/feed.xml',
    description: 'Official Vue.js blog with latest updates and tutorials',
    category: 'tech',
    favicon: 'https://vuejs.org/images/logo.png',
    status: 'active',
    articlesCount: 142,
    unreadCount: 12,
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
    createdAt: '2024-01-01T00:00:00Z',
    updateFrequency: 24,
    tags: ['Vue.js', '前端', '框架'],
    priority: 'high',
    isEnabled: true,
    homepageUrl: 'https://vuejs.org'
  },
  {
    id: 'feed_2',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    description: 'The latest technology news and information on startups',
    category: 'news',
    favicon: 'https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png',
    status: 'active',
    articlesCount: 1856,
    unreadCount: 45,
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分钟前
    createdAt: '2024-01-02T00:00:00Z',
    updateFrequency: 2,
    tags: ['科技', '新闻', '创业'],
    priority: 'high',
    isEnabled: true,
    homepageUrl: 'https://techcrunch.com'
  },
  {
    id: 'feed_3',
    name: 'Dribbble Blog',
    url: 'https://dribbble.com/stories.rss',
    description: 'Design inspiration and creative stories from Dribbble',
    category: 'design',
    status: 'updating',
    articlesCount: 89,
    unreadCount: 5,
    lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6小时前
    createdAt: '2024-01-03T00:00:00Z',
    updateFrequency: 12,
    tags: ['设计', '灵感', '创意'],
    priority: 'medium',
    isEnabled: true,
    homepageUrl: 'https://dribbble.com'
  },
  {
    id: 'feed_4',
    name: 'React Blog',
    url: 'https://reactjs.org/feed.xml',
    description: 'Official React blog with updates and best practices',
    category: 'tech',
    status: 'error',
    articlesCount: 67,
    unreadCount: 0,
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
    createdAt: '2024-01-04T00:00:00Z',
    updateFrequency: 24,
    lastError: '无法连接到RSS源服务器',
    tags: ['React', '前端', 'JavaScript'],
    priority: 'high',
    isEnabled: true,
    homepageUrl: 'https://reactjs.org'
  },
  {
    id: 'feed_5',
    name: 'CSS-Tricks',
    url: 'https://css-tricks.com/feed/',
    description: 'Tips, tricks, and techniques on using CSS',
    category: 'tech',
    status: 'paused',
    articlesCount: 234,
    unreadCount: 0,
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天前
    createdAt: '2024-01-05T00:00:00Z',
    updateFrequency: 12,
    tags: ['CSS', '前端', '教程'],
    priority: 'medium',
    isEnabled: false,
    homepageUrl: 'https://css-tricks.com'
  },
  {
    id: 'feed_6',
    name: 'A List Apart',
    url: 'https://alistapart.com/main/feed/',
    description: 'Web design, development, and standards',
    category: 'design',
    status: 'active',
    articlesCount: 156,
    unreadCount: 8,
    lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4小时前
    createdAt: '2024-01-06T00:00:00Z',
    updateFrequency: 168, // 一周
    tags: ['设计', 'Web标准', '前端'],
    priority: 'medium',
    isEnabled: true,
    homepageUrl: 'https://alistapart.com'
  }
]

// 获取工作区RSS源列表
export async function fetchWorkspaceFeeds(params = {}) {
  await delay()
  
  try {
    let filteredFeeds = [...mockFeeds]
    
    // 按搜索查询过滤
    if (params.query) {
      const query = params.query.toLowerCase()
      filteredFeeds = filteredFeeds.filter(feed => 
        feed.name.toLowerCase().includes(query) ||
        feed.description?.toLowerCase().includes(query) ||
        feed.url.toLowerCase().includes(query) ||
        feed.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // 按分类过滤
    if (params.category && params.category !== 'all') {
      filteredFeeds = filteredFeeds.filter(feed => feed.category === params.category)
    }
    
    // 按状态过滤
    if (params.status && params.status !== 'all') {
      filteredFeeds = filteredFeeds.filter(feed => feed.status === params.status)
    }
    
    // 按优先级过滤
    if (params.priority && params.priority !== 'all') {
      filteredFeeds = filteredFeeds.filter(feed => feed.priority === params.priority)
    }
    
    // 按启用状态过滤
    if (params.isEnabled !== undefined) {
      filteredFeeds = filteredFeeds.filter(feed => feed.isEnabled === params.isEnabled)
    }
    
    // 按标签过滤
    if (params.tags && params.tags.length > 0) {
      filteredFeeds = filteredFeeds.filter(feed => 
        params.tags.some(tag => feed.tags.includes(tag))
      )
    }
    
    // 排序
    const sortBy = params.sortBy || 'lastUpdated'
    const sortOrder = params.sortOrder || 'desc'
    
    filteredFeeds.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'lastUpdated' || sortBy === 'createdAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    // 分页
    const limit = params.limit || 20
    const offset = params.offset || 0
    const paginatedFeeds = filteredFeeds.slice(offset, offset + limit)
    
    // 格式化时间显示
    const feedsWithFormattedTime = paginatedFeeds.map(feed => ({
      ...feed,
      lastUpdatedFormatted: formatTimestamp(new Date(feed.lastUpdated)),
      createdAtFormatted: formatTimestamp(new Date(feed.createdAt))
    }))
    
    return {
      success: true,
      data: {
        feeds: feedsWithFormattedTime,
        total: filteredFeeds.length,
        hasMore: offset + limit < filteredFeeds.length
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '获取RSS源列表失败'
    }
  }
}

// 添加RSS源
export async function addFeed(feedData) {
  await delay(800) // 模拟较长的检测时间
  
  try {
    // 检查URL是否已存在
    const existingFeed = mockFeeds.find(feed => feed.url === feedData.url)
    if (existingFeed) {
      return {
        success: false,
        error: '该RSS源已存在'
      }
    }
    
    // 模拟RSS源检测和解析
    const { articlesCount, unreadCount } = generateRandomStats()
    
    const newFeed = {
      id: generateId(),
      name: feedData.name || `新RSS源 ${mockFeeds.length + 1}`,
      url: feedData.url,
      description: feedData.description || '',
      category: feedData.category || 'other',
      status: 'active',
      articlesCount,
      unreadCount: articlesCount,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updateFrequency: feedData.updateFrequency || 24,
      tags: feedData.tags || [],
      priority: feedData.priority || 'medium',
      isEnabled: true,
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(feedData.url).hostname}`,
      homepageUrl: `${new URL(feedData.url).protocol}//${new URL(feedData.url).hostname}`
    }
    
    mockFeeds.unshift(newFeed)
    
    return {
      success: true,
      data: newFeed
    }
  } catch (error) {
    return {
      success: false,
      error: 'RSS源URL无效或无法访问'
    }
  }
}

// 更新RSS源
export async function updateFeed(feedId, updateData) {
  await delay()
  
  try {
    const feedIndex = mockFeeds.findIndex(feed => feed.id === feedId)
    
    if (feedIndex === -1) {
      return {
        success: false,
        error: 'RSS源不存在'
      }
    }
    
    // 如果更新URL，检查是否与其他源冲突
    if (updateData.url) {
      const existingFeed = mockFeeds.find(feed => 
        feed.id !== feedId && feed.url === updateData.url
      )
      
      if (existingFeed) {
        return {
          success: false,
          error: '该RSS源URL已存在'
        }
      }
    }
    
    const updatedFeed = {
      ...mockFeeds[feedIndex],
      ...updateData,
      lastUpdated: new Date().toISOString()
    }
    
    mockFeeds[feedIndex] = updatedFeed
    
    return {
      success: true,
      data: updatedFeed
    }
  } catch (error) {
    return {
      success: false,
      error: '更新RSS源失败'
    }
  }
}

// 删除RSS源
export async function deleteFeed(feedId) {
  await delay()
  
  try {
    const feedIndex = mockFeeds.findIndex(feed => feed.id === feedId)
    
    if (feedIndex === -1) {
      return {
        success: false,
        error: 'RSS源不存在'
      }
    }
    
    const deletedFeed = mockFeeds[feedIndex]
    mockFeeds.splice(feedIndex, 1)
    
    return {
      success: true,
      data: { deletedFeedId: feedId, deletedFeed }
    }
  } catch (error) {
    return {
      success: false,
      error: '删除RSS源失败'
    }
  }
}

// 刷新RSS源
export async function refreshFeed(feedId) {
  await delay(1000) // 模拟刷新需要更长时间
  
  try {
    const feedIndex = mockFeeds.findIndex(feed => feed.id === feedId)
    
    if (feedIndex === -1) {
      return {
        success: false,
        error: 'RSS源不存在'
      }
    }
    
    const feed = mockFeeds[feedIndex]
    
    // 模拟刷新过程中的状态更新
    mockFeeds[feedIndex] = {
      ...feed,
      status: 'updating'
    }
    
    // 模拟刷新结果
    const isSuccess = Math.random() > 0.1 // 90%成功率
    const articlesAdded = isSuccess ? Math.floor(Math.random() * 10) : 0
    
    if (isSuccess) {
      mockFeeds[feedIndex] = {
        ...feed,
        status: 'active',
        articlesCount: feed.articlesCount + articlesAdded,
        unreadCount: feed.unreadCount + articlesAdded,
        lastUpdated: new Date().toISOString(),
        lastError: undefined
      }
    } else {
      mockFeeds[feedIndex] = {
        ...feed,
        status: 'error',
        lastError: '连接超时或RSS源不可访问'
      }
    }
    
    return {
      success: true,
      data: {
        feed: mockFeeds[feedIndex],
        articlesAdded,
        refreshSuccess: isSuccess
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '刷新RSS源失败'
    }
  }
}

// 刷新所有RSS源
export async function refreshAllFeeds() {
  await delay(2000) // 模拟批量刷新需要更长时间
  
  try {
    const results = []
    let totalSuccess = 0
    let totalFailed = 0
    
    for (const feed of mockFeeds) {
      if (feed.isEnabled) {
        const isSuccess = Math.random() > 0.15 // 85%成功率
        const articlesAdded = isSuccess ? Math.floor(Math.random() * 5) : 0
        
        if (isSuccess) {
          const feedIndex = mockFeeds.findIndex(f => f.id === feed.id)
          mockFeeds[feedIndex] = {
            ...feed,
            status: 'active',
            articlesCount: feed.articlesCount + articlesAdded,
            unreadCount: feed.unreadCount + articlesAdded,
            lastUpdated: new Date().toISOString(),
            lastError: undefined
          }
          totalSuccess++
        } else {
          const feedIndex = mockFeeds.findIndex(f => f.id === feed.id)
          mockFeeds[feedIndex] = {
            ...feed,
            status: 'error',
            lastError: '连接超时或RSS源不可访问'
          }
          totalFailed++
        }
        
        results.push({
          feedId: feed.id,
          success: isSuccess,
          articlesAdded,
          error: isSuccess ? undefined : '连接超时'
        })
      }
    }
    
    return {
      success: true,
      data: {
        results,
        totalSuccess,
        totalFailed
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '批量刷新失败'
    }
  }
}

// 批量删除RSS源
export async function bulkDeleteFeeds(feedIds) {
  await delay()
  
  try {
    const deletedFeeds = []
    
    feedIds.forEach(feedId => {
      const feedIndex = mockFeeds.findIndex(feed => feed.id === feedId)
      if (feedIndex !== -1) {
        deletedFeeds.push(mockFeeds[feedIndex])
        mockFeeds.splice(feedIndex, 1)
      }
    })
    
    return {
      success: true,
      data: {
        deletedCount: deletedFeeds.length,
        deletedFeeds
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '批量删除失败'
    }
  }
}

// 批量更新分类
export async function bulkUpdateCategory(feedIds, category) {
  await delay()
  
  try {
    const updatedFeeds = []
    
    feedIds.forEach(feedId => {
      const feedIndex = mockFeeds.findIndex(feed => feed.id === feedId)
      if (feedIndex !== -1) {
        mockFeeds[feedIndex] = {
          ...mockFeeds[feedIndex],
          category
        }
        updatedFeeds.push(mockFeeds[feedIndex])
      }
    })
    
    return {
      success: true,
      data: {
        updatedCount: updatedFeeds.length,
        updatedFeeds
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '批量更新分类失败'
    }
  }
}

// 获取RSS源统计
export async function getFeedStats() {
  await delay()
  
  try {
    const totalFeeds = mockFeeds.length
    const activeFeeds = mockFeeds.filter(feed => feed.status === 'active').length
    const errorFeeds = mockFeeds.filter(feed => feed.status === 'error').length
    const pausedFeeds = mockFeeds.filter(feed => feed.status === 'paused' || !feed.isEnabled).length
    const totalArticles = mockFeeds.reduce((sum, feed) => sum + feed.articlesCount, 0)
    const unreadArticles = mockFeeds.reduce((sum, feed) => sum + feed.unreadCount, 0)
    
    // 计算分类统计
    const categoriesCount = feedCategoryOptions.reduce((acc, category) => {
      acc[category.value] = mockFeeds.filter(feed => feed.category === category.value).length
      return acc
    }, {})
    
    // 计算平均更新频率
    const averageUpdateFrequency = mockFeeds.reduce((sum, feed) => sum + feed.updateFrequency, 0) / totalFeeds
    
    const lastUpdateTime = mockFeeds.reduce((latest, feed) => {
      return new Date(feed.lastUpdated) > new Date(latest) ? feed.lastUpdated : latest
    }, mockFeeds[0]?.lastUpdated || new Date().toISOString())
    
    return {
      success: true,
      data: {
        totalFeeds,
        activeFeeds,
        errorFeeds,
        pausedFeeds,
        totalArticles,
        unreadArticles,
        lastUpdateTime,
        categoriesCount,
        averageUpdateFrequency: Math.round(averageUpdateFrequency)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '获取统计数据失败'
    }
  }
}

// RSS源URL检测
export async function detectFeedUrl(url) {
  await delay(500)
  
  try {
    // 模拟URL检测
    const isValid = /^https?:\/\/.+/.test(url)
    
    if (!isValid) {
      return {
        success: false,
        error: 'URL格式无效'
      }
    }
    
    // 模拟检测结果
    const domain = new URL(url).hostname
    const mockDetection = {
      isValid: true,
      feedUrl: url,
      title: `${domain} RSS Feed`,
      description: `RSS feed from ${domain}`,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}`,
      homepageUrl: `${new URL(url).protocol}//${domain}`,
      alternativeUrls: [
        `${new URL(url).protocol}//${domain}/feed`,
        `${new URL(url).protocol}//${domain}/rss`,
        `${new URL(url).protocol}//${domain}/atom.xml`
      ]
    }
    
    return {
      success: true,
      data: mockDetection
    }
  } catch (error) {
    return {
      success: false,
      error: 'URL检测失败'
    }
  }
}

// 验证RSS源URL
export async function validateFeedUrl(url) {
  await delay(300)
  
  try {
    const isValid = /^https?:\/\/.+\.(xml|rss|atom|feed)$/i.test(url) || 
                   /^https?:\/\/.+\/(feed|rss|atom)/i.test(url)
    
    return {
      success: true,
      data: {
        isValid,
        normalizedUrl: isValid ? url : undefined,
        error: isValid ? undefined : 'URL不像有效的RSS源地址'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'URL验证失败'
    }
  }
}

// 导出RSS源数据
export async function exportRssData(format = 'json') {
  await delay(1000)
  
  try {
    const stats = await getFeedStats()
    
    const exportData = {
      feeds: mockFeeds,
      stats: stats.data,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
    
    return {
      success: true,
      data: exportData
    }
  } catch (error) {
    return {
      success: false,
      error: '导出数据失败'
    }
  }
} 