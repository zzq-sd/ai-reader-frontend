<template>
  <div class="search-container">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-title">
        <h1>
          <i class="fas fa-search"></i>
          全网搜索
        </h1>
        <p>搜索文章、笔记、收藏和RSS源</p>
      </div>
      
      <!-- 主搜索框 -->
      <div class="main-search-box">
        <div class="search-input-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="搜索任何内容..."
            class="search-input"
            @keydown.enter="performSearch"
            @input="handleSearchInput"
          />
          <button
            v-if="searchQuery"
            class="clear-btn"
            @click="clearSearch"
            title="清空搜索"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <button
          class="search-btn"
          @click="performSearch"
          :disabled="!searchQuery.trim()"
        >
          <i class="fas fa-search"></i>
          搜索
        </button>
      </div>
    </div>

    <!-- 搜索筛选器 -->
    <div class="search-filters">
      <div class="filter-tabs">
        <button
          v-for="tab in searchTabs"
          :key="tab.id"
          class="filter-tab"
          :class="{ active: activeTab === tab.id }"
          @click="setActiveTab(tab.id)"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.name }}</span>
          <span v-if="tab.count > 0" class="count">{{ tab.count }}</span>
        </button>
      </div>
      
      <div class="filter-options">
        <select v-model="sortBy" class="sort-select">
          <option value="relevance">相关性</option>
          <option value="date">时间</option>
          <option value="title">标题</option>
        </select>
        
        <select v-model="timeRange" class="time-select">
          <option value="all">全部时间</option>
          <option value="day">过去一天</option>
          <option value="week">过去一周</option>
          <option value="month">过去一月</option>
          <option value="year">过去一年</option>
        </select>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results">
      <!-- 搜索状态 -->
      <div v-if="isSearching" class="search-status">
        <i class="fas fa-spinner fa-spin"></i>
        <span>搜索中...</span>
      </div>
      
      <!-- 搜索统计 -->
      <div v-if="searchResults.length > 0 && !isSearching" class="search-stats">
        <span>找到 {{ totalResults }} 个结果</span>
        <span class="search-time">耗时 {{ searchTime }}ms</span>
      </div>
      
      <!-- 无结果 -->
      <div v-if="searchResults.length === 0 && !isSearching && hasSearched" class="no-results">
        <div class="no-results-icon">
          <i class="fas fa-search"></i>
        </div>
        <h3>未找到相关结果</h3>
        <p>尝试使用不同的关键词或调整筛选条件</p>
        <div class="search-suggestions">
          <h4>搜索建议：</h4>
          <ul>
            <li>检查拼写是否正确</li>
            <li>尝试使用更通用的关键词</li>
            <li>使用较少的关键词</li>
            <li>尝试使用同义词</li>
          </ul>
        </div>
      </div>
      
      <!-- 结果列表 -->
      <div v-if="searchResults.length > 0" class="results-list">
        <div
          v-for="result in paginatedResults"
          :key="result.id"
          class="result-item"
          :class="result.type"
          @click="openResult(result)"
        >
          <div class="result-icon">
            <i :class="getResultIcon(result.type)"></i>
          </div>
          
          <div class="result-content">
            <div class="result-header">
              <h3 class="result-title" v-html="highlightText(result.title)"></h3>
              <span class="result-type">{{ getTypeLabel(result.type) }}</span>
            </div>
            
            <p class="result-excerpt" v-html="highlightText(result.excerpt)"></p>
            
            <div class="result-meta">
              <span class="result-date">{{ formatDate(result.date) }}</span>
              <span v-if="result.author" class="result-author">{{ result.author }}</span>
              <span v-if="result.source" class="result-source">来源: {{ result.source }}</span>
            </div>
          </div>
          
          <div class="result-actions">
            <button
              class="action-btn bookmark-btn"
              :class="{ active: result.bookmarked }"
              @click.stop="toggleBookmark(result)"
              :title="result.bookmarked ? '取消收藏' : '收藏'"
            >
              <i class="fas fa-bookmark"></i>
            </button>
            
            <button
              class="action-btn share-btn"
              @click.stop="shareResult(result)"
              title="分享"
            >
              <i class="fas fa-share"></i>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        
        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 接口定义
interface SearchResult {
  id: string
  type: 'article' | 'note' | 'collection' | 'rss'
  title: string
  excerpt: string
  date: Date
  author?: string
  source?: string
  bookmarked: boolean
  url?: string
}

interface SearchTab {
  id: string
  name: string
  icon: string
  count: number
}

// 路由和状态
const route = useRoute()
const router = useRouter()

// 响应式数据
const searchInputRef = ref<HTMLInputElement>()
const searchQuery = ref('')
const activeTab = ref('all')
const sortBy = ref('relevance')
const timeRange = ref('all')
const isSearching = ref(false)
const hasSearched = ref(false)
const searchResults = ref<SearchResult[]>([])
const totalResults = ref(0)
const searchTime = ref(0)
const currentPage = ref(1)
const resultsPerPage = 10

// 搜索标签页
const searchTabs = ref<SearchTab[]>([
  { id: 'all', name: '全部', icon: 'fas fa-search', count: 0 },
  { id: 'article', name: '文章', icon: 'fas fa-newspaper', count: 0 },
  { id: 'note', name: '笔记', icon: 'fas fa-sticky-note', count: 0 },
  { id: 'collection', name: '收藏', icon: 'fas fa-bookmark', count: 0 },
  { id: 'rss', name: 'RSS源', icon: 'fas fa-rss', count: 0 }
])

// 计算属性
const filteredResults = computed(() => {
  if (activeTab.value === 'all') {
    return searchResults.value
  }
  return searchResults.value.filter(result => result.type === activeTab.value)
})

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * resultsPerPage
  const end = start + resultsPerPage
  return filteredResults.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredResults.value.length / resultsPerPage)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2
  
  let start = Math.max(1, current - delta)
  let end = Math.min(total, current + delta)
  
  if (end - start < delta * 2) {
    if (start === 1) {
      end = Math.min(total, start + delta * 2)
    } else if (end === total) {
      start = Math.max(1, end - delta * 2)
    }
  }
  
  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// 方法
const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  isSearching.value = true
  hasSearched.value = true
  currentPage.value = 1
  
  const startTime = Date.now()
  
  try {
    // 模拟搜索API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟搜索结果
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'article',
        title: 'Vue 3 组合式API深度解析',
        excerpt: '本文详细介绍了Vue 3中组合式API的设计理念和使用方法，包括setup函数、响应式API、生命周期钩子等核心概念...',
        date: new Date('2024-01-15'),
        author: '张三',
        source: '技术博客',
        bookmarked: false,
        url: '/articles/1'
      },
      {
        id: '2',
        type: 'note',
        title: 'TypeScript学习笔记',
        excerpt: '记录了TypeScript的基础语法、高级类型、装饰器等知识点，以及在实际项目中的应用经验...',
        date: new Date('2024-01-10'),
        bookmarked: true
      },
      {
        id: '3',
        type: 'collection',
        title: '前端开发资源收藏',
        excerpt: '收集了各种前端开发相关的工具、库、教程和参考资料，包括Vue、React、Angular等框架资源...',
        date: new Date('2024-01-05'),
        bookmarked: false
      }
    ]
    
    searchResults.value = mockResults
    totalResults.value = mockResults.length
    searchTime.value = Date.now() - startTime
    
    // 更新标签页计数
    updateTabCounts()
    
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    isSearching.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
  updateTabCounts()
}

const handleSearchInput = () => {
  // 可以在这里实现实时搜索建议
}

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
  currentPage.value = 1
}

const updateTabCounts = () => {
  const counts = {
    all: searchResults.value.length,
    article: searchResults.value.filter(r => r.type === 'article').length,
    note: searchResults.value.filter(r => r.type === 'note').length,
    collection: searchResults.value.filter(r => r.type === 'collection').length,
    rss: searchResults.value.filter(r => r.type === 'rss').length
  }
  
  searchTabs.value.forEach(tab => {
    tab.count = counts[tab.id as keyof typeof counts] || 0
  })
}

const getResultIcon = (type: string) => {
  const icons = {
    article: 'fas fa-newspaper',
    note: 'fas fa-sticky-note',
    collection: 'fas fa-bookmark',
    rss: 'fas fa-rss'
  }
  return icons[type as keyof typeof icons] || 'fas fa-file'
}

const getTypeLabel = (type: string) => {
  const labels = {
    article: '文章',
    note: '笔记',
    collection: '收藏',
    rss: 'RSS源'
  }
  return labels[type as keyof typeof labels] || '未知'
}

const highlightText = (text: string) => {
  if (!searchQuery.value) return text
  
  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const openResult = (result: SearchResult) => {
  if (result.url) {
    router.push(result.url)
  }
}

const toggleBookmark = (result: SearchResult) => {
  result.bookmarked = !result.bookmarked
  // 这里可以调用收藏API
}

const shareResult = (result: SearchResult) => {
  // 实现分享功能
  if (navigator.share) {
    navigator.share({
      title: result.title,
      text: result.excerpt,
      url: window.location.origin + result.url
    })
  } else {
    // 复制到剪贴板
    navigator.clipboard.writeText(window.location.origin + result.url)
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听器
watch(() => route.query.q, (newQuery) => {
  if (newQuery && typeof newQuery === 'string') {
    searchQuery.value = newQuery
    performSearch()
  }
}, { immediate: true })

watch([sortBy, timeRange], () => {
  // 重新排序结果
  if (hasSearched.value) {
    performSearch()
  }
})

// 生命周期
onMounted(() => {
  // 聚焦搜索框
  searchInputRef.value?.focus()
})
</script>

<style lang="scss" scoped>
.search-container {
  padding: calc(var(--spacing-unit) * 6);
  max-width: 1200px;
  margin: 0 auto;
}

.search-header {
  margin-bottom: calc(var(--spacing-unit) * 8);
}

.search-title {
  text-align: center;
  margin-bottom: calc(var(--spacing-unit) * 6);
  
  h1 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: calc(var(--spacing-unit) * 2);
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 calc(var(--spacing-unit) * 2) 0;
    
    i {
      color: var(--color-accent-primary);
    }
  }
  
  p {
    font-size: 16px;
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.main-search-box {
  display: flex;
  gap: calc(var(--spacing-unit) * 3);
  max-width: 600px;
  margin: 0 auto;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: calc(var(--spacing-unit) * 4);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-disabled);
  font-size: 16px;
}

.search-input {
  width: 100%;
  height: 48px;
  padding: 0 calc(var(--spacing-unit) * 12) 0 calc(var(--spacing-unit) * 12);
  border: 2px solid var(--color-border-primary);
  border-radius: calc(var(--border-radius-l) * 2);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 16px;
  transition: all var(--transition-speed-fast);
  
  &:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 4px rgba(var(--color-accent-primary-rgb), 0.1);
  }
  
  &::placeholder {
    color: var(--color-text-disabled);
  }
}

.clear-btn {
  position: absolute;
  right: calc(var(--spacing-unit) * 3);
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: var(--color-text-disabled);
  color: white;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-danger);
  }
}

.search-btn {
  height: 48px;
  padding: 0 calc(var(--spacing-unit) * 6);
  border: none;
  border-radius: calc(var(--border-radius-l) * 2);
  background: var(--color-accent-primary);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  transition: all var(--transition-speed-fast);
  
  &:hover:not(:disabled) {
    background: var(--color-accent-primary-hover);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.search-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: calc(var(--spacing-unit) * 6);
  gap: calc(var(--spacing-unit) * 4);
}

.filter-tabs {
  display: flex;
  gap: calc(var(--spacing-unit) * 1);
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 4);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-l);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
  
  &.active {
    background: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: white;
  }
  
  .count {
    background: rgba(255, 255, 255, 0.2);
    padding: calc(var(--spacing-unit) * 0.5) calc(var(--spacing-unit) * 1.5);
    border-radius: calc(var(--border-radius-s) * 2);
    font-size: 11px;
    font-weight: 600;
  }
  
  &:not(.active) .count {
    background: var(--color-bg-secondary);
    color: var(--color-text-disabled);
  }
}

.filter-options {
  display: flex;
  gap: calc(var(--spacing-unit) * 3);
}

.sort-select, .time-select {
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: var(--color-accent-primary);
  }
}

.search-results {
  min-height: 400px;
}

.search-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing-unit) * 3);
  padding: calc(var(--spacing-unit) * 10);
  color: var(--color-text-secondary);
  font-size: 16px;
}

.search-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: calc(var(--spacing-unit) * 4);
  padding: calc(var(--spacing-unit) * 3) 0;
  border-bottom: 1px solid var(--color-border-primary);
  color: var(--color-text-secondary);
  font-size: 14px;
}

.search-time {
  color: var(--color-text-disabled);
}

.no-results {
  text-align: center;
  padding: calc(var(--spacing-unit) * 10) calc(var(--spacing-unit) * 4);
  
  .no-results-icon {
    font-size: 48px;
    color: var(--color-text-disabled);
    margin-bottom: calc(var(--spacing-unit) * 4);
  }
  
  h3 {
    font-size: 20px;
    color: var(--color-text-primary);
    margin: 0 0 calc(var(--spacing-unit) * 2) 0;
  }
  
  p {
    color: var(--color-text-secondary);
    margin: 0 0 calc(var(--spacing-unit) * 6) 0;
  }
}

.search-suggestions {
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
  
  h4 {
    font-size: 14px;
    color: var(--color-text-primary);
    margin: 0 0 calc(var(--spacing-unit) * 2) 0;
  }
  
  ul {
    margin: 0;
    padding-left: calc(var(--spacing-unit) * 5);
    color: var(--color-text-secondary);
    font-size: 13px;
    
    li {
      margin-bottom: calc(var(--spacing-unit) * 1);
    }
  }
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 4);
}

.result-item {
  display: flex;
  gap: calc(var(--spacing-unit) * 4);
  padding: calc(var(--spacing-unit) * 5);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-l);
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-accent-primary);
    transform: translateY(-1px);
  }
}

.result-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-l);
  background: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent-primary);
  font-size: 18px;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: calc(var(--spacing-unit) * 3);
  margin-bottom: calc(var(--spacing-unit) * 2);
}

.result-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.4;
  
  :deep(mark) {
    background: var(--color-accent-primary);
    color: white;
    padding: 0 calc(var(--spacing-unit) * 0.5);
    border-radius: calc(var(--border-radius-s) / 2);
  }
}

.result-type {
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--border-radius-s);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.result-excerpt {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 calc(var(--spacing-unit) * 3) 0;
  
  :deep(mark) {
    background: rgba(var(--color-accent-primary-rgb), 0.2);
    color: var(--color-accent-primary);
    padding: 0 calc(var(--spacing-unit) * 0.5);
    border-radius: calc(var(--border-radius-s) / 2);
  }
}

.result-meta {
  display: flex;
  gap: calc(var(--spacing-unit) * 4);
  font-size: 12px;
  color: var(--color-text-disabled);
}

.result-actions {
  display: flex;
  gap: calc(var(--spacing-unit) * 2);
  align-items: flex-start;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--border-radius-m);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
  
  &.bookmark-btn.active {
    background: var(--color-accent-primary);
    color: white;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  margin-top: calc(var(--spacing-unit) * 8);
  padding: calc(var(--spacing-unit) * 4) 0;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all var(--transition-speed-fast);
  
  &:hover:not(:disabled) {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
  
  &.active {
    background: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: white;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-numbers {
  display: flex;
  gap: calc(var(--spacing-unit) * 1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-container {
    padding: calc(var(--spacing-unit) * 4);
  }
  
  .main-search-box {
    flex-direction: column;
  }
  
  .search-filters {
    flex-direction: column;
    align-items: stretch;
    gap: calc(var(--spacing-unit) * 3);
  }
  
  .filter-tabs {
    overflow-x: auto;
    padding-bottom: calc(var(--spacing-unit) * 2);
  }
  
  .result-item {
    flex-direction: column;
    gap: calc(var(--spacing-unit) * 3);
  }
  
  .result-header {
    flex-direction: column;
    gap: calc(var(--spacing-unit) * 2);
  }
  
  .result-actions {
    align-self: flex-end;
  }
}
</style> 