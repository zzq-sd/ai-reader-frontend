// 模拟延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟文章数据
const mockArticles = [
  {
    id: '1',
    title: 'Vue 3.4 正式发布：性能提升与新特性详解',
    excerpt: 'Vue 3.4 带来了显著的性能提升和多项新特性，包括更好的TypeScript支持、改进的响应式系统以及全新的组合式API功能。本文将详细介绍这些更新内容。',
    content: '完整的文章内容...',
    imageUrl: 'https://picsum.photos/400/250?random=1',
    source: 'Vue.js 官方博客',
    sourceId: 'vue-official',
    publishTime: '2024-12-19T10:30:00Z',
    readStatus: 'unread',
    isFavorited: false,
    tags: ['Vue.js', '前端开发', '框架更新'],
    url: '/articles/1',
    createdAt: '2024-12-19T10:30:00Z',
    updatedAt: '2024-12-19T10:30:00Z'
  },
  {
    id: '2',
    title: 'React 18 并发特性深度解析',
    excerpt: 'React 18 引入了并发特性，让应用能够更好地处理用户交互和数据更新。本文深入探讨了Suspense、并发渲染和自动批处理等核心概念。',
    content: '完整的文章内容...',
    imageUrl: 'https://picsum.photos/400/250?random=2',
    source: 'React 技术周刊',
    sourceId: 'react-weekly',
    publishTime: '2024-12-19T09:15:00Z',
    readStatus: 'read',
    isFavorited: true,
    tags: ['React', '并发编程', '性能优化'],
    url: '/articles/2',
    createdAt: '2024-12-19T09:15:00Z',
    updatedAt: '2024-12-19T09:15:00Z'
  },
  {
    id: '3',
    title: 'TypeScript 5.3 新特性：Import Attributes 和更多',
    excerpt: 'TypeScript 5.3 版本带来了 Import Attributes、改进的类型推断和更好的性能。了解这些新特性如何提升开发体验。',
    content: '完整的文章内容...',
    imageUrl: 'https://picsum.photos/400/250?random=3',
    source: 'TypeScript 官方',
    sourceId: 'typescript-official',
    publishTime: '2024-12-19T08:45:00Z',
    readStatus: 'unread',
    isFavorited: false,
    tags: ['TypeScript', '类型系统', '开发工具'],
    url: '/articles/3',
    createdAt: '2024-12-19T08:45:00Z',
    updatedAt: '2024-12-19T08:45:00Z'
  },
  {
    id: '4',
    title: 'Vite 5.0 发布：更快的构建速度和更好的开发体验',
    excerpt: 'Vite 5.0 正式发布，带来了更快的构建速度、改进的HMR性能和更好的插件生态系统。探索这些改进如何提升前端开发效率。',
    content: '完整的文章内容...',
    imageUrl: 'https://picsum.photos/400/250?random=4',
    source: 'Vite 官方博客',
    sourceId: 'vite-official',
    publishTime: '2024-12-19T07:20:00Z',
    readStatus: 'read',
    isFavorited: true,
    tags: ['Vite', '构建工具', '开发体验'],
    url: '/articles/4',
    createdAt: '2024-12-19T07:20:00Z',
    updatedAt: '2024-12-19T07:20:00Z'
  },
  {
    id: '5',
    title: 'CSS Container Queries：响应式设计的新纪元',
    excerpt: 'CSS Container Queries 让组件能够根据其容器的大小进行响应式调整，而不是依赖于视口大小。这为组件化设计开辟了新的可能性。',
    content: '完整的文章内容...',
    imageUrl: 'https://picsum.photos/400/250?random=5',
    source: 'CSS-Tricks',
    sourceId: 'css-tricks',
    publishTime: '2024-12-19T06:10:00Z',
    readStatus: 'unread',
    isFavorited: false,
    tags: ['CSS', '响应式设计', 'Web标准'],
    url: '/articles/5',
    createdAt: '2024-12-19T06:10:00Z',
    updatedAt: '2024-12-19T06:10:00Z'
  },
  {
    id: '6',
    title: 'Web Components 在现代前端开发中的应用',
    excerpt: 'Web Components 提供了创建可重用自定义元素的标准方法。了解如何在现代前端项目中有效使用 Web Components。',
    content: '完整的文章内容...',
    imageUrl: 'https://picsum.photos/400/250?random=6',
    source: 'MDN Web Docs',
    sourceId: 'mdn-web-docs',
    publishTime: '2024-12-19T05:30:00Z',
    readStatus: 'read',
    isFavorited: false,
    tags: ['Web Components', '标准化', '组件开发'],
    url: '/articles/6',
    createdAt: '2024-12-19T05:30:00Z',
    updatedAt: '2024-12-19T05:30:00Z'
  },
  {
    id: '7',
    title: 'Node.js 21 新特性：内置测试运行器和性能改进',
    excerpt: 'Node.js 21 引入了内置的测试运行器、改进的性能监控工具和更好的ES模块支持。探索这些新特性如何简化后端开发。',
    content: '完整的文章内容...',
    imageUrl: 'https://picsum.photos/400/250?random=7',
    source: 'Node.js 官方博客',
    sourceId: 'nodejs-official',
    publishTime: '2024-12-19T04:15:00Z',
    readStatus: 'unread',
    isFavorited: true,
    tags: ['Node.js', '后端开发', '测试工具'],
    url: '/articles/7',
    createdAt: '2024-12-19T04:15:00Z',
    updatedAt: '2024-12-19T04:15:00Z'
  },
  {
    id: '8',
    title: 'Tailwind CSS 3.4：动态颜色和新的实用工具类',
    excerpt: 'Tailwind CSS 3.4 版本带来了动态颜色支持、新的实用工具类和改进的性能。了解这些更新如何提升样式开发效率。',
    content: '完整的文章内容...',
    imageUrl: 'https://picsum.photos/400/250?random=8',
    source: 'Tailwind CSS 博客',
    sourceId: 'tailwindcss-blog',
    publishTime: '2024-12-19T03:45:00Z',
    readStatus: 'read',
    isFavorited: false,
    tags: ['Tailwind CSS', 'CSS框架', '样式开发'],
    url: '/articles/8',
    createdAt: '2024-12-19T03:45:00Z',
    updatedAt: '2024-12-19T03:45:00Z'
  },
  {
    id: '9',
    title: 'WebAssembly 在前端应用中的实践指南',
    excerpt: 'WebAssembly 为前端应用带来了接近原生的性能。本文介绍如何在实际项目中集成和使用 WebAssembly 模块。',
    content: '完整的文章内容...',
    imageUrl: 'https://picsum.photos/400/250?random=9',
    source: 'WebAssembly 官方',
    sourceId: 'webassembly-official',
    publishTime: '2024-12-19T02:20:00Z',
    readStatus: 'unread',
    isFavorited: false,
    tags: ['WebAssembly', '性能优化', '前端技术'],
    url: '/articles/9',
    createdAt: '2024-12-19T02:20:00Z',
    updatedAt: '2024-12-19T02:20:00Z'
  },
  {
    id: '10',
    title: 'Progressive Web Apps 2024：最新最佳实践',
    excerpt: 'PWA 技术在 2024 年有了新的发展。了解最新的 PWA 最佳实践，包括离线策略、推送通知和应用安装体验。',
    content: '完整的文章内容...',
    imageUrl: 'https://picsum.photos/400/250?random=10',
    source: 'PWA 开发者指南',
    sourceId: 'pwa-guide',
    publishTime: '2024-12-19T01:10:00Z',
    readStatus: 'read',
    isFavorited: true,
    tags: ['PWA', '移动开发', 'Web应用'],
    url: '/articles/10',
    createdAt: '2024-12-19T01:10:00Z',
    updatedAt: '2024-12-19T01:10:00Z'
  }
]

// 模拟RSS源数据
const mockRssSources = [
  {
    id: 'vue-official',
    name: 'Vue.js 官方博客',
    url: 'https://blog.vuejs.org/feed.xml',
    isActive: true,
    articleCount: 15
  },
  {
    id: 'react-weekly',
    name: 'React 技术周刊',
    url: 'https://react.statuscode.com/rss',
    isActive: true,
    articleCount: 23
  },
  {
    id: 'typescript-official',
    name: 'TypeScript 官方',
    url: 'https://devblogs.microsoft.com/typescript/feed/',
    isActive: true,
    articleCount: 12
  },
  {
    id: 'vite-official',
    name: 'Vite 官方博客',
    url: 'https://vitejs.dev/blog/feed.xml',
    isActive: true,
    articleCount: 8
  },
  {
    id: 'css-tricks',
    name: 'CSS-Tricks',
    url: 'https://css-tricks.com/feed/',
    isActive: true,
    articleCount: 45
  },
  {
    id: 'mdn-web-docs',
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/en-US/blog/rss.xml',
    isActive: false,
    articleCount: 18
  }
]

// 生成更多模拟数据
function generateMoreArticles(count = 52) {
  const additionalArticles = []
  const sources = mockRssSources.map(s => s.name)
  const tags = ['JavaScript', 'CSS', 'HTML', 'React', 'Vue.js', 'Angular', 'Node.js', 'TypeScript', 'WebAssembly', 'PWA']
  
  for (let i = 11; i <= count + 10; i++) {
    const randomSource = sources[Math.floor(Math.random() * sources.length)]
    const randomTags = tags.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1)
    const isRead = Math.random() > 0.6
    const isFavorited = Math.random() > 0.8
    
    additionalArticles.push({
      id: i.toString(),
      title: `技术文章标题 ${i}：深入探讨前端开发的最新趋势`,
      excerpt: `这是第 ${i} 篇文章的摘要。本文将深入探讨前端开发的最新趋势和技术实践，为开发者提供有价值的见解和指导。`,
      content: `完整的文章内容 ${i}...`,
      imageUrl: `https://picsum.photos/400/250?random=${i}`,
      source: randomSource,
      sourceId: mockRssSources.find(s => s.name === randomSource)?.id || 'unknown',
      publishTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      readStatus: isRead ? 'read' : 'unread',
      isFavorited,
      tags: randomTags,
      url: `/articles/${i}`,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
  
  return [...mockArticles, ...additionalArticles]
}

const allArticles = generateMoreArticles(52)

/**
 * 获取文章列表
 * @param {Object} params - 查询参数
 * @param {string} params.search - 搜索关键词
 * @param {string} params.source - RSS源筛选
 * @param {string} params.status - 阅读状态筛选
 * @param {string} params.sortBy - 排序字段
 * @param {string} params.sortOrder - 排序方向
 * @param {Array} params.tags - 标签筛选
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise<Object>} 文章列表响应
 */
export async function fetchArticles(params = {}) {
  await delay(800) // 模拟网络延迟
  
  const {
    search = '',
    source = '',
    status = 'all',
    sortBy = 'publishTime',
    sortOrder = 'desc',
    tags = [],
    page = 1,
    pageSize = 20
  } = params
  
  let filteredArticles = [...allArticles]
  
  // 搜索筛选
  if (search) {
    const searchLower = search.toLowerCase()
    filteredArticles = filteredArticles.filter(article =>
      article.title.toLowerCase().includes(searchLower) ||
      article.excerpt.toLowerCase().includes(searchLower) ||
      article.source.toLowerCase().includes(searchLower)
    )
  }
  
  // RSS源筛选
  if (source) {
    filteredArticles = filteredArticles.filter(article => article.sourceId === source)
  }
  
  // 阅读状态筛选
  if (status !== 'all') {
    filteredArticles = filteredArticles.filter(article => article.readStatus === status)
  }
  
  // 标签筛选
  if (tags.length > 0) {
    filteredArticles = filteredArticles.filter(article =>
      tags.some(tag => article.tags.includes(tag))
    )
  }
  
  // 排序
  filteredArticles.sort((a, b) => {
    let aValue, bValue
    
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'source':
        aValue = a.source.toLowerCase()
        bValue = b.source.toLowerCase()
        break
      case 'publishTime':
      default:
        aValue = new Date(a.publishTime).getTime()
        bValue = new Date(b.publishTime).getTime()
        break
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
  
  // 分页
  const total = filteredArticles.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const articles = filteredArticles.slice(startIndex, endIndex)
  
  return {
    articles,
    total,
    page,
    pageSize,
    totalPages
  }
}

/**
 * 更新文章状态
 * @param {string} articleId - 文章ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新后的文章
 */
export async function updateArticleStatus(articleId, updates) {
  await delay(300) // 模拟网络延迟
  
  const articleIndex = allArticles.findIndex(article => article.id === articleId)
  if (articleIndex === -1) {
    throw new Error('文章不存在')
  }
  
  // 更新文章
  allArticles[articleIndex] = {
    ...allArticles[articleIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  return allArticles[articleIndex]
}

/**
 * 切换文章收藏状态
 * @param {string} articleId - 文章ID
 * @returns {Promise<Object>} 更新后的文章
 */
export async function toggleArticleFavorite(articleId) {
  await delay(300) // 模拟网络延迟
  
  const articleIndex = allArticles.findIndex(article => article.id === articleId)
  if (articleIndex === -1) {
    throw new Error('文章不存在')
  }
  
  // 切换收藏状态
  allArticles[articleIndex].isFavorited = !allArticles[articleIndex].isFavorited
  allArticles[articleIndex].updatedAt = new Date().toISOString()
  
  return allArticles[articleIndex]
}

/**
 * 获取RSS源列表
 * @returns {Promise<Array>} RSS源列表
 */
export async function fetchRssSources() {
  await delay(500) // 模拟网络延迟
  
  return mockRssSources
}

/**
 * 获取单篇文章详情
 * @param {string} articleId - 文章ID
 * @returns {Promise<Object>} 文章详情
 */
export async function fetchArticleById(articleId) {
  await delay(600) // 模拟网络延迟
  
  const article = allArticles.find(article => article.id === articleId)
  if (!article) {
    throw new Error('文章不存在')
  }
  
  return article
}

/**
 * 批量标记文章为已读
 * @param {Array} articleIds - 文章ID数组
 * @returns {Promise<Array>} 更新后的文章列表
 */
export async function markArticlesAsRead(articleIds) {
  await delay(500) // 模拟网络延迟
  
  const updatedArticles = []
  
  articleIds.forEach(articleId => {
    const articleIndex = allArticles.findIndex(article => article.id === articleId)
    if (articleIndex !== -1) {
      allArticles[articleIndex].readStatus = 'read'
      allArticles[articleIndex].updatedAt = new Date().toISOString()
      updatedArticles.push(allArticles[articleIndex])
    }
  })
  
  return updatedArticles
}

/**
 * 获取文章统计信息
 * @returns {Promise<Object>} 统计信息
 */
export async function fetchArticleStats() {
  await delay(400) // 模拟网络延迟
  
  const total = allArticles.length
  const unread = allArticles.filter(article => article.readStatus === 'unread').length
  const favorited = allArticles.filter(article => article.isFavorited).length
  const today = new Date().toDateString()
  const todayArticles = allArticles.filter(article => 
    new Date(article.publishTime).toDateString() === today
  ).length
  
  return {
    total,
    unread,
    read: total - unread,
    favorited,
    todayArticles
  }
}

// 导出额外的函数和数据，供前端直接使用
export { generateMoreArticles, allArticles, mockRssSources } 