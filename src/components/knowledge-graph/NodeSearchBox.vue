<template>
  <div class="node-search-box">
    <!-- 搜索输入框 -->
    <div class="search-input-wrapper">
      <div class="search-input-container">
        <i class="fas fa-search search-icon"></i>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="搜索节点..."
          class="search-input"
          @input="handleSearchInput"
          @keydown.enter="handleSearchEnter"
          @keydown.escape="clearSearch"
          @focus="showSuggestions = true"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="clear-btn"
          title="清除搜索"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- 搜索结果统计 -->
    <div v-if="searchMode && searchQuery" class="search-results-info">
      <span v-if="hasSearchResults" class="results-count">
        找到 {{ searchResults.length }} 个结果
      </span>
      <span v-else class="no-results">
        未找到匹配结果
      </span>
      <button @click="clearSearch" class="clear-results-btn">
        清除搜索
      </button>
    </div>

    <!-- 搜索建议/历史 -->
    <transition name="dropdown">
      <div
        v-if="showSuggestions && (searchSuggestions.length > 0 || searchHistory.length > 0)"
        class="search-dropdown"
      >
        <!-- 搜索建议 -->
        <div v-if="searchSuggestions.length > 0" class="suggestions-section">
          <h6 class="section-title">搜索建议</h6>
          <div
            v-for="suggestion in searchSuggestions"
            :key="suggestion.id"
            class="suggestion-item"
            @click="selectSuggestion(suggestion)"
          >
            <i :class="getNodeIcon(suggestion.type)" class="suggestion-icon"></i>
            <div class="suggestion-content">
              <span class="suggestion-name">{{ suggestion.name }}</span>
              <span class="suggestion-type">{{ getNodeTypeLabel(suggestion.type) }}</span>
            </div>
          </div>
        </div>

        <!-- 搜索历史 -->
        <div v-if="searchHistory.length > 0 && !searchQuery" class="history-section">
          <div class="section-header">
            <h6 class="section-title">搜索历史</h6>
            <button @click="clearSearchHistory" class="clear-history-btn">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <div
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-item"
            @click="selectFromHistory(item)"
          >
            <i class="fas fa-history history-icon"></i>
            <span>{{ item }}</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- 快速搜索按钮 -->
    <div class="quick-search-buttons">
      <button
        v-for="type in nodeTypes"
        :key="type.value"
        class="quick-search-btn"
        :class="{ active: selectedQuickType === type.value }"
        @click="quickSearchByType(type.value)"
        :title="`快速搜索${type.label}`"
      >
        <i :class="type.icon"></i>
        <span>{{ type.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useKnowledgeGraphStore } from '@/stores/knowledgeGraphStore'
import type { GraphNode } from '@/api/knowledgeGraph'

// 状态管理
const knowledgeGraphStore = useKnowledgeGraphStore()

// DOM引用
const searchInput = ref<HTMLInputElement>()

// 本地状态
const searchQuery = ref('')
const showSuggestions = ref(false)
const selectedQuickType = ref<string | null>(null)
const searchHistory = ref<string[]>([])

// 计算属性
const searchMode = computed(() => knowledgeGraphStore.searchMode)
const searchResults = computed(() => knowledgeGraphStore.searchResults)
const hasSearchResults = computed(() => knowledgeGraphStore.hasSearchResults)
const allNodes = computed(() => knowledgeGraphStore.graphData?.nodes || [])

// 搜索建议（基于当前输入的前缀匹配）
const searchSuggestions = computed(() => {
  if (!searchQuery.value.trim()) return []
  
  const query = searchQuery.value.toLowerCase()
  return allNodes.value
    .filter(node => 
      node.name.toLowerCase().includes(query) ||
      node.description?.toLowerCase().includes(query)
    )
    .slice(0, 5) // 最多显示5个建议
})

// 节点类型
const nodeTypes = [
  { value: 'concept', label: '概念', icon: 'fas fa-lightbulb' },
  { value: 'article', label: '文章', icon: 'fas fa-file-alt' },
  { value: 'author', label: '作者', icon: 'fas fa-user' },
  { value: 'tag', label: '标签', icon: 'fas fa-tag' }
]

// 防抖搜索
let searchTimeout: number | null = null

// 方法
const handleSearchInput = () => {
  // 防抖处理
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(() => {
    knowledgeGraphStore.updateSearchQuery(searchQuery.value)
  }, 300)
}

const handleSearchEnter = () => {
  if (searchQuery.value.trim()) {
    // 添加到搜索历史
    addToSearchHistory(searchQuery.value.trim())
    // 立即执行搜索
    knowledgeGraphStore.updateSearchQuery(searchQuery.value)
    // 隐藏建议
    showSuggestions.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  selectedQuickType.value = null
  knowledgeGraphStore.clearHighlight()
  showSuggestions.value = false
}

const selectSuggestion = (node: GraphNode) => {
  searchQuery.value = node.name
  knowledgeGraphStore.updateSearchQuery(node.name)
  knowledgeGraphStore.focusOnNode(node.id)
  showSuggestions.value = false
  addToSearchHistory(node.name)
}

const selectFromHistory = (query: string) => {
  searchQuery.value = query
  knowledgeGraphStore.updateSearchQuery(query)
  showSuggestions.value = false
}

const addToSearchHistory = (query: string) => {
  // 移除重复项
  const filtered = searchHistory.value.filter(item => item !== query)
  // 添加到开头
  searchHistory.value = [query, ...filtered].slice(0, 10) // 保留最近10条
  // 保存到本地存储
  localStorage.setItem('knowledge-graph-search-history', JSON.stringify(searchHistory.value))
}

const clearSearchHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('knowledge-graph-search-history')
}

const quickSearchByType = (type: string) => {
  if (selectedQuickType.value === type) {
    // 取消选择
    selectedQuickType.value = null
    clearSearch()
  } else {
    // 选择类型
    selectedQuickType.value = type
    const typeNodes = allNodes.value.filter(node => node.type === type)
    const nodeIds = typeNodes.map(node => node.id)
    knowledgeGraphStore.highlightNodes(nodeIds)
  }
}

const getNodeIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    concept: 'fas fa-lightbulb',
    article: 'fas fa-file-alt',
    author: 'fas fa-user',
    tag: 'fas fa-tag'
  }
  return iconMap[type] || 'fas fa-circle'
}

const getNodeTypeLabel = (type: string) => {
  const typeLabels: Record<string, string> = {
    concept: '概念',
    article: '文章',
    author: '作者',
    tag: '标签'
  }
  return typeLabels[type] || type
}

// 点击外部关闭建议
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.node-search-box')) {
    showSuggestions.value = false
  }
}

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+F 聚焦搜索框
  if (event.ctrlKey && event.key === 'f') {
    event.preventDefault()
    searchInput.value?.focus()
  }
}

// 生命周期
onMounted(() => {
  // 加载搜索历史
  const savedHistory = localStorage.getItem('knowledge-graph-search-history')
  if (savedHistory) {
    try {
      searchHistory.value = JSON.parse(savedHistory)
    } catch (e) {
      console.warn('Failed to load search history:', e)
    }
  }

  // 添加事件监听器
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 清理定时器
  if (searchTimeout) clearTimeout(searchTimeout)
  
  // 移除事件监听器
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})

// 监听Store中的搜索查询变化
watch(() => knowledgeGraphStore.searchQuery, (newQuery) => {
  if (newQuery !== searchQuery.value) {
    searchQuery.value = newQuery
  }
})
</script>

<style scoped lang="scss">
.node-search-box {
  position: relative;
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.search-input-wrapper {
  position: relative;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  transition: all var(--transition-speed-fast);

  &:focus-within {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.1);
  }
}

.search-icon {
  position: absolute;
  left: calc(var(--spacing-unit) * 3);
  color: var(--color-text-secondary);
  font-size: 14px;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 10) calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 10);
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text-primary);
  font-size: 14px;

  &::placeholder {
    color: var(--color-text-secondary);
  }
}

.clear-btn {
  position: absolute;
  right: calc(var(--spacing-unit) * 2);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius-s);
  transition: all var(--transition-speed-fast);

  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

/* 搜索结果统计 */
.search-results-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-s);
  margin-top: calc(var(--spacing-unit) * 2);
  font-size: 12px;
}

.results-count {
  color: var(--color-accent-primary);
  font-weight: 500;
}

.no-results {
  color: var(--color-text-secondary);
}

.clear-results-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 11px;
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius-s);
  transition: all var(--transition-speed-fast);

  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

/* 搜索下拉框 */
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  box-shadow: var(--shadow-m);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
  margin-top: calc(var(--spacing-unit) * 1);
}

.suggestions-section,
.history-section {
  padding: calc(var(--spacing-unit) * 2);

  &:not(:last-child) {
    border-bottom: 1px solid var(--color-border-primary);
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: calc(var(--spacing-unit) * 2);
}

.section-title {
  margin: 0 0 calc(var(--spacing-unit) * 2) 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.clear-history-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: calc(var(--spacing-unit) * 1);
  border-radius: var(--border-radius-s);
  transition: all var(--transition-speed-fast);

  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-error);
  }
}

/* 搜索建议项 */
.suggestion-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  border-radius: var(--border-radius-s);
  cursor: pointer;
  transition: all var(--transition-speed-fast);

  &:hover {
    background-color: var(--color-bg-hover);
  }

  &:not(:last-child) {
    margin-bottom: calc(var(--spacing-unit) * 1);
  }
}

.suggestion-icon {
  color: var(--color-accent-primary);
  width: 16px;
  text-align: center;
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-name {
  display: block;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-type {
  display: block;
  color: var(--color-text-secondary);
  font-size: 11px;
  margin-top: calc(var(--spacing-unit) * 0.5);
}

/* 搜索历史项 */
.history-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  border-radius: var(--border-radius-s);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  color: var(--color-text-secondary);
  font-size: 13px;

  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
  }

  &:not(:last-child) {
    margin-bottom: calc(var(--spacing-unit) * 1);
  }
}

.history-icon {
  width: 12px;
  text-align: center;
  opacity: 0.7;
}

/* 快速搜索按钮 */
.quick-search-buttons {
  display: flex;
  gap: calc(var(--spacing-unit) * 1);
  margin-top: calc(var(--spacing-unit) * 3);
  flex-wrap: wrap;
}

.quick-search-btn {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1);
  padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  color: var(--color-text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  white-space: nowrap;

  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
    border-color: var(--color-border-hover);
  }

  &.active {
    background-color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: white;
  }

  i {
    font-size: 10px;
  }
}

/* 动画效果 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--transition-speed-fast);
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-input {
    padding: calc(var(--spacing-unit) * 2.5) calc(var(--spacing-unit) * 8) calc(var(--spacing-unit) * 2.5) calc(var(--spacing-unit) * 8);
    font-size: 13px;
  }

  .quick-search-buttons {
    gap: calc(var(--spacing-unit) * 0.5);
  }

  .quick-search-btn {
    padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 1.5);
    font-size: 10px;

    span {
      display: none;
    }
  }

  .search-dropdown {
    max-height: 250px;
  }
}

/* 滚动条样式 */
.search-dropdown::-webkit-scrollbar {
  width: 4px;
}

.search-dropdown::-webkit-scrollbar-track {
  background: var(--color-bg-tertiary);
  border-radius: 2px;
}

.search-dropdown::-webkit-scrollbar-thumb {
  background: var(--color-border-primary);
  border-radius: 2px;

  &:hover {
    background: var(--color-text-secondary);
  }
}
</style> 