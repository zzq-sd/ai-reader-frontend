// 模拟延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 导入API客户端
import { apiClient } from './base'

// 暂时移除字符解码工具的导入
// import { processArticleContent, processText } from '@/utils/textDecoder'

// 模拟文章详细内容数据
const mockArticleContents = {
  '1': {
    id: '1',
    title: 'Vue 3.4 正式发布：性能提升与新特性详解',
    subtitle: '深入探索Vue 3.4带来的革命性改进',
    author: 'Vue.js 核心团队',
    publishTime: '2024-12-19T10:30:00Z',
    readTime: 12,
    source: 'Vue.js 官方博客',
    sourceUrl: 'https://blog.vuejs.org',
    tags: ['Vue.js', '前端开发', '框架更新', 'JavaScript'],
    content: `
      <div class="article-content">
        <p class="lead">Vue 3.4 版本的发布标志着Vue.js生态系统的又一次重大飞跃。这个版本不仅带来了显著的性能提升，还引入了多项开发者期待已久的新特性。</p>
        
        <h2>主要性能改进</h2>
        <p>Vue 3.4 在多个方面实现了性能突破：</p>
        
        <ul>
          <li><strong>响应式系统优化</strong>：新的响应式算法减少了30%的内存占用</li>
          <li><strong>编译器增强</strong>：模板编译速度提升了40%</li>
          <li><strong>运行时优化</strong>：组件更新性能提升了25%</li>
        </ul>
        
        <h2>新特性亮点</h2>
        
        <h3>1. 改进的TypeScript支持</h3>
        <p>Vue 3.4 大幅改进了TypeScript集成体验：</p>
        
        <pre><code class="language-typescript">// 新的泛型组件语法
&lt;script setup lang="ts" generic="T"&gt;
interface Props&lt;T&gt; {
  items: T[]
  keyField: keyof T
}

const props = defineProps&lt;Props&lt;T&gt;&gt;()
&lt;/script&gt;</code></pre>
        
        <h3>2. 新的响应式API</h3>
        <p>引入了更强大的响应式工具：</p>
        
        <pre><code class="language-javascript">import { effectScope, onScopeDispose } from 'vue'

// 创建独立的响应式作用域
const scope = effectScope()

scope.run(() => {
  const doubled = computed(() => counter.value * 2)
  
  // 作用域销毁时自动清理
  onScopeDispose(() => {
    console.log('scope disposed')
  })
})

// 手动销毁作用域
scope.stop()</code></pre>
        
        <h3>3. 组合式API增强</h3>
        <p>新增了多个实用的组合式函数：</p>
        
        <blockquote>
          <p>"组合式API的设计哲学是让逻辑复用变得更加直观和灵活。Vue 3.4 在这个方向上又迈进了一大步。"</p>
          <cite>— Evan You, Vue.js 创始人</cite>
        </blockquote>
        
        <h2>迁移指南</h2>
        <p>对于现有项目，升级到Vue 3.4 相对简单：</p>
        
        <ol>
          <li>更新依赖版本</li>
          <li>运行类型检查</li>
          <li>测试关键功能</li>
          <li>享受性能提升</li>
        </ol>
        
        <div class="info-box">
          <h4>💡 升级提示</h4>
          <p>建议在升级前仔细阅读<a href="https://vuejs.org/guide/migration">官方迁移指南</a>，确保项目的平稳过渡。</p>
        </div>
        
        <h2>社区反响</h2>
        <p>Vue 3.4 发布后，社区反响热烈。许多开发者表示新版本的性能提升显著，特别是在大型应用中的表现令人印象深刻。</p>
        
        <p>随着Vue 3.4的发布，Vue.js继续巩固其作为现代前端框架领导者的地位。无论是性能优化还是开发体验的改进，这个版本都为开发者带来了实实在在的价值。</p>
        
        <h2>总结</h2>
        <p>Vue 3.4 是一个里程碑式的版本，它不仅解决了开发者的痛点，还为未来的发展奠定了坚实的基础。如果你还在使用旧版本的Vue，现在是升级的最佳时机。</p>
      </div>
    `,
    wordCount: 1250,
    readStatus: 'unread',
    isFavorited: false,
    readProgress: 0,
    lastReadTime: null,
    relatedArticles: [
      {
        id: '2',
        title: 'React 18 并发特性深度解析',
        excerpt: 'React 18 引入了并发特性，让应用能够更好地处理用户交互和数据更新。',
        imageUrl: 'https://picsum.photos/300/200?random=2',
        source: 'React 技术周刊',
        publishTime: '2024-12-19T09:15:00Z',
        readTime: 15,
        similarity: 0.85
      },
      {
        id: '3',
        title: 'TypeScript 5.3 新特性：Import Attributes 和更多',
        excerpt: 'TypeScript 5.3 版本带来了 Import Attributes、改进的类型推断和更好的性能。',
        imageUrl: 'https://picsum.photos/300/200?random=3',
        source: 'TypeScript 官方',
        publishTime: '2024-12-19T08:45:00Z',
        readTime: 10,
        similarity: 0.78
      },
      {
        id: '4',
        title: 'Vite 5.0 发布：更快的构建速度和更好的开发体验',
        excerpt: 'Vite 5.0 正式发布，带来了更快的构建速度、改进的HMR性能和更好的插件生态系统。',
        imageUrl: 'https://picsum.photos/300/200?random=4',
        source: 'Vite 官方博客',
        publishTime: '2024-12-19T07:20:00Z',
        readTime: 8,
        similarity: 0.72
      }
    ],
    notes: [
      {
        id: 'note-1',
        articleId: '1',
        content: '这个性能提升很显著，值得关注',
        highlightText: '响应式系统优化：新的响应式算法减少了30%的内存占用',
        position: {
          start: 245,
          end: 275,
          selector: 'p:nth-child(3) li:first-child'
        },
        createdAt: '2024-12-19T11:00:00Z',
        updatedAt: '2024-12-19T11:00:00Z'
      }
    ]
  },
  '2': {
    id: '2',
    title: 'React 18 并发特性深度解析',
    subtitle: '探索React 18的并发渲染机制',
    author: 'React 核心团队',
    publishTime: '2024-12-19T09:15:00Z',
    readTime: 15,
    source: 'React 技术周刊',
    sourceUrl: 'https://react.dev',
    tags: ['React', '并发编程', '性能优化', 'JavaScript'],
    content: `
      <div class="article-content">
        <p class="lead">React 18 引入的并发特性代表了React架构的重大演进。这些特性不仅提升了应用性能，还为开发者提供了更好的用户体验控制能力。</p>
        
        <h2>并发渲染的核心概念</h2>
        <p>并发渲染允许React在渲染过程中暂停、恢复或放弃工作，从而保持应用的响应性：</p>
        
        <pre><code class="language-jsx">import { startTransition } from 'react'

function SearchResults() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  
  const handleSearch = (newQuery) => {
    setQuery(newQuery) // 紧急更新
    
    startTransition(() => {
      setResults(searchData(newQuery)) // 非紧急更新
    })
  }
  
  return (
    &lt;div&gt;
      &lt;input onChange={e =&gt; handleSearch(e.target.value)} /&gt;
      &lt;SearchList results={results} /&gt;
    &lt;/div&gt;
  )
}</code></pre>
        
        <h2>Suspense的进化</h2>
        <p>React 18 大幅增强了Suspense的能力，现在它可以处理更复杂的异步场景：</p>
        
        <pre><code class="language-jsx">function App() {
  return (
    &lt;Suspense fallback={&lt;Loading /&gt;}&gt;
      &lt;ProfilePage /&gt;
      &lt;Suspense fallback={&lt;PostsLoading /&gt;}&gt;
        &lt;PostsList /&gt;
      &lt;/Suspense&gt;
    &lt;/Suspense&gt;
  )
}</code></pre>
        
        <h2>自动批处理</h2>
        <p>React 18 自动批处理所有状态更新，包括Promise、setTimeout和原生事件处理器中的更新：</p>
        
        <blockquote>
          <p>"自动批处理让React应用默认就有更好的性能，开发者无需额外配置。"</p>
        </blockquote>
        
        <h2>实际应用场景</h2>
        <p>并发特性在以下场景中特别有用：</p>
        
        <ul>
          <li>大型列表渲染</li>
          <li>复杂的数据可视化</li>
          <li>实时搜索功能</li>
          <li>多步骤表单</li>
        </ul>
        
        <p>通过合理使用这些特性，开发者可以构建出更加流畅和响应的用户界面。</p>
      </div>
    `,
    wordCount: 980,
    readStatus: 'read',
    isFavorited: true,
    readProgress: 100,
    lastReadTime: '2024-12-19T12:00:00Z',
    relatedArticles: [
      {
        id: '1',
        title: 'Vue 3.4 正式发布：性能提升与新特性详解',
        excerpt: 'Vue 3.4 带来了显著的性能提升和多项新特性，包括更好的TypeScript支持。',
        imageUrl: 'https://picsum.photos/300/200?random=1',
        source: 'Vue.js 官方博客',
        publishTime: '2024-12-19T10:30:00Z',
        readTime: 12,
        similarity: 0.85
      }
    ],
    notes: []
  }
}

/**
 * 获取文章详细内容
 * @param {string} articleId - 文章ID
 * @returns {Promise<Object>} 包含文章详细信息的对象
 */
export async function fetchArticleContent(articleId) {
  console.log(`开始获取文章内容: ${articleId}`)
  
  try {
    // 使用apiClient调用后端API获取文章内容 - 修复API路径和调用方式
    const response = await apiClient.get(`/articles/${articleId}/content`)
    
    console.log('后端API响应:', response.data)
    
    if (response.data.success && response.data.data) {
      const backendData = response.data.data
      
      // 暂时移除字符编码处理，直接使用后端返回的原始数据
      // const processedBackendData = processArticleContent(backendData)
      
      // 转换后端数据格式为前端需要的格式
      const article = {
        id: backendData.articleId,
        title: backendData.title || `文章 ${articleId}`,
        subtitle: '', // 后端暂时没有subtitle字段
        author: backendData.author || '未知作者',
        publishTime: backendData.publicationDate || new Date().toISOString(),
        readTime: backendData.readingTimeMinutes || 5,
        source: '来源', // 需要从文章详情中获取
        sourceUrl: backendData.originalUrl || '#',
        tags: [], // 需要从后端获取标签信息
        content: backendData.content || '暂无内容',
        wordCount: backendData.wordCount || 0,
        readStatus: 'unread', // 需要从用户状态中获取
        isFavorited: false, // 需要从用户状态中获取
        readProgress: 0,
        lastReadTime: null,
        relatedArticles: [], // 需要单独获取相关文章
        notes: []
      }
      
      // 如果内容是纯文本，包装为HTML
      if (article.content && !article.content.includes('<')) {
        article.content = `<div class="article-content"><p>${article.content.replace(/\n/g, '</p><p>')}</p></div>`
      }
      
      console.log('转换后的文章数据（保持原始编码）:', article)
      return { article, success: true }
    } else {
      throw new Error(response.data.message || '获取文章内容失败')
    }
    
  } catch (error) {
    console.error(`获取文章内容失败:`, error)
    
    // 如果后端API失败，返回错误信息而不是降级到模拟数据
    throw new Error(`无法获取文章内容: ${error.message}`)
  }
}

/**
 * 更新阅读进度
 * @param {string} articleId - 文章ID
 * @param {number} progress - 阅读进度 (0-100)
 * @returns {Promise<void>}
 */
export async function updateReadingProgress(articleId, progress) {
  await delay(200) // 模拟网络延迟
  
  if (mockArticleContents[articleId]) {
    mockArticleContents[articleId].readProgress = progress
    mockArticleContents[articleId].lastReadTime = new Date().toISOString()
    
    // 如果阅读进度超过80%，自动标记为已读
    if (progress >= 80) {
      mockArticleContents[articleId].readStatus = 'read'
    }
  }
}

/**
 * 获取相关文章
 * @param {string} articleId - 文章ID
 * @returns {Promise<Array>} 相关文章列表
 */
export async function fetchRelatedArticles(articleId) {
  await delay(600) // 模拟网络延迟
  
  const article = mockArticleContents[articleId]
  if (!article) {
    return []
  }
  
  return article.relatedArticles
}

/**
 * 添加文章笔记
 * @param {Object} note - 笔记对象
 * @returns {Promise<Object>} 创建的笔记
 */
export async function addArticleNote(note) {
  await delay(400) // 模拟网络延迟
  
  const newNote = {
    ...note,
    id: `note-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  if (mockArticleContents[note.articleId]) {
    mockArticleContents[note.articleId].notes.push(newNote)
  }
  
  return newNote
}

/**
 * 更新文章笔记
 * @param {string} noteId - 笔记ID
 * @param {Object} updates - 更新内容
 * @returns {Promise<Object>} 更新后的笔记
 */
export async function updateArticleNote(noteId, updates) {
  await delay(300) // 模拟网络延迟
  
  for (const articleId in mockArticleContents) {
    const article = mockArticleContents[articleId]
    const noteIndex = article.notes.findIndex(note => note.id === noteId)
    
    if (noteIndex !== -1) {
      article.notes[noteIndex] = {
        ...article.notes[noteIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      return article.notes[noteIndex]
    }
  }
  
  throw new Error('笔记不存在')
}

/**
 * 删除文章笔记
 * @param {string} noteId - 笔记ID
 * @returns {Promise<void>}
 */
export async function deleteArticleNote(noteId) {
  await delay(300) // 模拟网络延迟
  
  for (const articleId in mockArticleContents) {
    const article = mockArticleContents[articleId]
    const noteIndex = article.notes.findIndex(note => note.id === noteId)
    
    if (noteIndex !== -1) {
      article.notes.splice(noteIndex, 1)
      return
    }
  }
  
  throw new Error('笔记不存在')
}

/**
 * 获取文章笔记列表
 * @param {string} articleId - 文章ID
 * @returns {Promise<Array>} 笔记列表
 */
export async function fetchArticleNotes(articleId) {
  await delay(400) // 模拟网络延迟
  
  const article = mockArticleContents[articleId]
  if (!article) {
    return []
  }
  
  return article.notes
}

/**
 * 切换文章收藏状态
 * @param {string} articleId - 文章ID
 * @returns {Promise<boolean>} 新的收藏状态
 */
export async function toggleArticleFavoriteStatus(articleId) {
  await delay(300) // 模拟网络延迟
  
  const article = mockArticleContents[articleId]
  if (!article) {
    throw new Error('文章不存在')
  }
  
  article.isFavorited = !article.isFavorited
  return article.isFavorited
} 