/**
 * Collections模块Mock API服务
 * 提供收藏管理的模拟数据和API接口
 */

// 模拟延迟函数
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// 生成唯一ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

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

// 文件夹图标选项
export const folderIconOptions = [
  { value: 'fas fa-folder', label: '📁 默认文件夹', icon: 'fas fa-folder' },
  { value: 'fas fa-laptop-code', label: '💻 技术相关', icon: 'fas fa-laptop-code' },
  { value: 'fas fa-palette', label: '🎨 设计创意', icon: 'fas fa-palette' },
  { value: 'fas fa-book-open', label: '📚 学习资料', icon: 'fas fa-book-open' },
  { value: 'fas fa-lightbulb', label: '💡 灵感想法', icon: 'fas fa-lightbulb' },
  { value: 'fas fa-star', label: '⭐ 重要收藏', icon: 'fas fa-star' },
  { value: 'fas fa-heart', label: '❤️ 个人喜好', icon: 'fas fa-heart' },
  { value: 'fas fa-briefcase', label: '💼 工作相关', icon: 'fas fa-briefcase' },
  { value: 'fas fa-graduation-cap', label: '🎓 学术研究', icon: 'fas fa-graduation-cap' },
  { value: 'fas fa-rocket', label: '🚀 项目灵感', icon: 'fas fa-rocket' }
]

// 模拟文件夹数据 (不包含"全部收藏"，因为它是固定的特殊项目)
let mockFolders = [
  {
    id: 'tech',
    name: '技术文章',
    icon: 'fas fa-laptop-code',
    itemCount: 89,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-14T15:20:00Z',
    description: '前端、后端、架构等技术相关内容'
  },
  {
    id: 'design',
    name: '设计灵感',
    icon: 'fas fa-palette',
    itemCount: 34,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-13T09:15:00Z',
    description: 'UI/UX设计、视觉创意等内容'
  },
  {
    id: 'learning',
    name: '学习资料',
    icon: 'fas fa-book-open',
    itemCount: 67,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-12T14:45:00Z',
    description: '教程、文档、学习笔记等'
  }
]

// 模拟收藏项数据
let mockCollectionItems = [
  {
    id: 'item-1',
    type: 'article',
    title: 'Vue 3.4 发布：性能提升与新特性详解',
    description: 'Vue 3.4 带来了显著的性能改进和开发体验提升。新版本重构了响应式系统，减少了30%的内存占用，并引入了新的编译器优化技术...',
    source: 'Vue.js 官方博客',
    sourceIcon: 'V',
    sourceColor: '#42b883',
    tags: ['Vue.js', '前端', '性能优化'],
    collectedAt: '2024-01-13T10:30:00Z',
    originalId: 'article-vue-3-4',
    url: 'https://blog.vuejs.org/posts/vue-3-4.html',
    folderId: 'tech'
  },
  {
    id: 'item-2',
    type: 'note',
    title: 'TypeScript 最佳实践总结',
    description: '整理了在项目开发中遇到的 TypeScript 使用技巧和最佳实践，包括类型定义、泛型使用、装饰器等内容。这些实践能够帮助提升代码质量和开发效率...',
    source: '我的笔记',
    sourceIcon: 'T',
    sourceColor: '#3178c6',
    tags: ['TypeScript', '最佳实践', '开发经验'],
    collectedAt: '2024-01-06T14:20:00Z',
    originalId: 'note-typescript-best-practices',
    folderId: 'tech'
  },
  {
    id: 'item-3',
    type: 'article',
    title: '2024年UI设计趋势：毛玻璃效果的回归',
    description: '毛玻璃效果（Glassmorphism）在2024年重新成为设计趋势。本文深入分析了这一设计语言的特点、实现方法以及在现代界面设计中的应用...',
    source: 'Design Weekly',
    sourceIcon: 'D',
    sourceColor: '#ff6b6b',
    tags: ['UI设计', '设计趋势', '毛玻璃效果'],
    collectedAt: '2024-01-05T09:15:00Z',
    originalId: 'article-glassmorphism-2024',
    url: 'https://designweekly.com/glassmorphism-2024',
    folderId: 'design'
  },
  {
    id: 'item-4',
    type: 'article',
    title: 'React Server Components 深度解析',
    description: 'React Server Components 是 React 18 引入的重要特性，它允许组件在服务器端渲染，减少客户端 JavaScript 包大小...',
    source: 'React 官方文档',
    sourceIcon: 'R',
    sourceColor: '#61dafb',
    tags: ['React', 'SSR', '性能优化'],
    collectedAt: '2024-01-04T16:45:00Z',
    originalId: 'article-react-server-components',
    url: 'https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023',
    folderId: 'tech'
  },
  {
    id: 'item-5',
    type: 'note',
    title: 'CSS Grid 布局学习笔记',
    description: '系统学习 CSS Grid 布局的笔记，包括基本概念、属性详解、实际应用案例等。Grid 布局为复杂的网页布局提供了强大而灵活的解决方案...',
    source: '我的笔记',
    sourceIcon: 'C',
    sourceColor: '#1572b6',
    tags: ['CSS', 'Grid', '布局'],
    collectedAt: '2024-01-03T11:30:00Z',
    originalId: 'note-css-grid-learning',
    folderId: 'learning'
  },
  {
    id: 'item-6',
    type: 'article',
    title: 'Figma 插件开发入门指南',
    description: '详细介绍如何开发 Figma 插件，从环境搭建到发布上架的完整流程。包括 API 使用、UI 构建、数据处理等核心技术点...',
    source: 'Figma 开发者文档',
    sourceIcon: 'F',
    sourceColor: '#f24e1e',
    tags: ['Figma', '插件开发', '设计工具'],
    collectedAt: '2024-01-02T13:20:00Z',
    originalId: 'article-figma-plugin-dev',
    url: 'https://www.figma.com/plugin-docs/',
    folderId: 'design'
  }
]

// 获取工作区文件夹列表
export async function fetchWorkspaceFolders() {
  await delay()
  
  try {
    // 计算每个文件夹的实际项目数量
    const foldersWithCount = mockFolders.map(folder => {
      const itemCount = mockCollectionItems.filter(item => item.folderId === folder.id).length
      return {
        ...folder,
        itemCount
      }
    })
    
    return {
      success: true,
      data: foldersWithCount
    }
  } catch (error) {
    return {
      success: false,
      error: '获取文件夹列表失败'
    }
  }
}

// 创建新文件夹
export async function createFolder(folderData) {
  await delay()
  
  try {
    // 检查文件夹名称是否已存在
    const existingFolder = mockFolders.find(folder => 
      folder.name.toLowerCase() === folderData.name.toLowerCase()
    )
    
    if (existingFolder) {
      return {
        success: false,
        error: '文件夹名称已存在'
      }
    }
    
    const newFolder = {
      id: generateId(),
      name: folderData.name,
      icon: folderData.icon || 'fas fa-folder',
      itemCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: folderData.description || ''
    }
    
    mockFolders.push(newFolder)
    
    return {
      success: true,
      data: newFolder
    }
  } catch (error) {
    return {
      success: false,
      error: '创建文件夹失败'
    }
  }
}

// 更新文件夹
export async function updateFolder(folderId, updateData) {
  await delay()
  
  try {
    const folderIndex = mockFolders.findIndex(folder => folder.id === folderId)
    
    if (folderIndex === -1) {
      return {
        success: false,
        error: '文件夹不存在'
      }
    }
    
    // 检查新名称是否与其他文件夹冲突
    if (updateData.name) {
      const existingFolder = mockFolders.find(folder => 
        folder.id !== folderId && 
        folder.name.toLowerCase() === updateData.name.toLowerCase()
      )
      
      if (existingFolder) {
        return {
          success: false,
          error: '文件夹名称已存在'
        }
      }
    }
    
    const updatedFolder = {
      ...mockFolders[folderIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    mockFolders[folderIndex] = updatedFolder
    
    return {
      success: true,
      data: updatedFolder
    }
  } catch (error) {
    return {
      success: false,
      error: '更新文件夹失败'
    }
  }
}

// 删除文件夹
export async function deleteFolder(folderId) {
  await delay()
  
  try {
    // 不允许删除"全部收藏"文件夹
    if (folderId === 'all') {
      return {
        success: false,
        error: '无法删除默认文件夹'
      }
    }
    
    const folderIndex = mockFolders.findIndex(folder => folder.id === folderId)
    
    if (folderIndex === -1) {
      return {
        success: false,
        error: '文件夹不存在'
      }
    }
    
    // 删除文件夹中的所有收藏项
    mockCollectionItems = mockCollectionItems.filter(item => item.folderId !== folderId)
    
    // 删除文件夹
    mockFolders.splice(folderIndex, 1)
    
    return {
      success: true,
      data: { deletedFolderId: folderId }
    }
  } catch (error) {
    return {
      success: false,
      error: '删除文件夹失败'
    }
  }
}

// 获取工作区收藏项
export async function fetchWorkspaceCollections(folderId = 'all', params = {}) {
  await delay()
  
  try {
    let filteredItems = mockCollectionItems
    
    // 按文件夹过滤
    if (folderId && folderId !== 'all') {
      filteredItems = filteredItems.filter(item => item.folderId === folderId)
    }
    
    // 按类型过滤
    if (params.type && params.type !== 'all') {
      filteredItems = filteredItems.filter(item => item.type === params.type)
    }
    
    // 按标签过滤
    if (params.tags && params.tags.length > 0) {
      filteredItems = filteredItems.filter(item => 
        params.tags.some(tag => item.tags.includes(tag))
      )
    }
    
    // 搜索过滤
    if (params.query) {
      const query = params.query.toLowerCase()
      filteredItems = filteredItems.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // 排序
    const sortBy = params.sortBy || 'collectedAt'
    const sortOrder = params.sortOrder || 'desc'
    
    filteredItems.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'collectedAt') {
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
    const paginatedItems = filteredItems.slice(offset, offset + limit)
    
    // 格式化时间显示
    const itemsWithFormattedTime = paginatedItems.map(item => ({
      ...item,
      collectedAtFormatted: formatTimestamp(new Date(item.collectedAt))
    }))
    
    return {
      success: true,
      data: {
        items: itemsWithFormattedTime,
        total: filteredItems.length,
        hasMore: offset + limit < filteredItems.length
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '获取收藏项失败'
    }
  }
}

// 添加收藏项
export async function addCollectionItem(itemData) {
  await delay()
  
  try {
    // 检查是否已经收藏过
    const existingItem = mockCollectionItems.find(item => 
      item.originalId === itemData.originalId && item.folderId === itemData.folderId
    )
    
    if (existingItem) {
      return {
        success: false,
        error: '该项目已在此文件夹中'
      }
    }
    
    const newItem = {
      id: generateId(),
      type: itemData.type,
      title: itemData.title,
      description: itemData.description || '',
      source: itemData.source,
      sourceIcon: itemData.sourceIcon || itemData.source.charAt(0).toUpperCase(),
      sourceColor: itemData.sourceColor || '#666',
      tags: itemData.tags || [],
      collectedAt: new Date().toISOString(),
      originalId: itemData.originalId,
      url: itemData.url,
      thumbnail: itemData.thumbnail,
      folderId: itemData.folderId
    }
    
    mockCollectionItems.push(newItem)
    
    // 更新文件夹项目数量
    const folder = mockFolders.find(f => f.id === itemData.folderId)
    if (folder) {
      folder.itemCount += 1
      folder.updatedAt = new Date().toISOString()
    }
    
    return {
      success: true,
      data: newItem
    }
  } catch (error) {
    return {
      success: false,
      error: '添加收藏项失败'
    }
  }
}

// 移除收藏项
export async function removeCollectionItem(itemId, folderId) {
  await delay()
  
  try {
    const itemIndex = mockCollectionItems.findIndex(item => item.id === itemId)
    
    if (itemIndex === -1) {
      return {
        success: false,
        error: '收藏项不存在'
      }
    }
    
    const removedItem = mockCollectionItems[itemIndex]
    mockCollectionItems.splice(itemIndex, 1)
    
    // 更新文件夹项目数量
    const folder = mockFolders.find(f => f.id === folderId)
    if (folder && folder.itemCount > 0) {
      folder.itemCount -= 1
      folder.updatedAt = new Date().toISOString()
    }
    
    return {
      success: true,
      data: { removedItemId: itemId }
    }
  } catch (error) {
    return {
      success: false,
      error: '移除收藏项失败'
    }
  }
}

// 移动收藏项到其他文件夹
export async function moveItemToFolder(itemId, fromFolderId, toFolderId) {
  await delay()
  
  try {
    const itemIndex = mockCollectionItems.findIndex(item => item.id === itemId)
    
    if (itemIndex === -1) {
      return {
        success: false,
        error: '收藏项不存在'
      }
    }
    
    const item = mockCollectionItems[itemIndex]
    
    // 检查目标文件夹是否已有相同项目
    const existingItem = mockCollectionItems.find(existingItem => 
      existingItem.originalId === item.originalId && 
      existingItem.folderId === toFolderId &&
      existingItem.id !== itemId
    )
    
    if (existingItem) {
      return {
        success: false,
        error: '目标文件夹已包含此项目'
      }
    }
    
    // 更新项目的文件夹ID
    mockCollectionItems[itemIndex] = {
      ...item,
      folderId: toFolderId,
      collectedAt: new Date().toISOString() // 更新收藏时间
    }
    
    // 更新源文件夹项目数量
    const fromFolder = mockFolders.find(f => f.id === fromFolderId)
    if (fromFolder && fromFolder.itemCount > 0) {
      fromFolder.itemCount -= 1
      fromFolder.updatedAt = new Date().toISOString()
    }
    
    // 更新目标文件夹项目数量
    const toFolder = mockFolders.find(f => f.id === toFolderId)
    if (toFolder) {
      toFolder.itemCount += 1
      toFolder.updatedAt = new Date().toISOString()
    }
    
    return {
      success: true,
      data: mockCollectionItems[itemIndex]
    }
  } catch (error) {
    return {
      success: false,
      error: '移动收藏项失败'
    }
  }
}

// 搜索收藏项
export async function searchCollections(query, folderId = null) {
  await delay()
  
  try {
    return await fetchWorkspaceCollections(folderId || 'all', { query })
  } catch (error) {
    return {
      success: false,
      error: '搜索失败'
    }
  }
}

// 获取收藏统计
export async function getCollectionStats() {
  await delay()
  
  try {
    const totalFolders = mockFolders.filter(f => f.id !== 'all').length
    const totalItems = mockCollectionItems.length
    const articleCount = mockCollectionItems.filter(item => item.type === 'article').length
    const noteCount = mockCollectionItems.filter(item => item.type === 'note').length
    
    // 计算最近7天添加的项目数量
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentlyAdded = mockCollectionItems.filter(item => 
      new Date(item.collectedAt) > sevenDaysAgo
    ).length
    
    // 统计标签使用频率
    const tagCounts = {}
    mockCollectionItems.forEach(item => {
      item.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return {
      success: true,
      data: {
        totalFolders,
        totalItems,
        articleCount,
        noteCount,
        recentlyAdded,
        topTags
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '获取统计数据失败'
    }
  }
}

// 导出收藏数据
export async function exportCollections(format = 'json') {
  await delay(1000) // 导出需要更长时间
  
  try {
    const exportData = {
      folders: mockFolders,
      items: mockCollectionItems,
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