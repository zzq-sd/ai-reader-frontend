<template>
  <div class="filter-section" :class="{ 'filter-section--loading': isLoading }">
    <div class="filters-row">
      <!-- 搜索框 -->
      <div class="filter-group">
        <label class="filter-label">搜索</label>
        <div class="search-input-container">
          <input 
            type="text" 
            class="filter-input search-input"
            placeholder="搜索文章标题或内容..."
            v-model="localFilters.search"
            @input="handleSearchInput"
            @keydown.enter="handleSearchSubmit"
          />
          <button 
            v-if="localFilters.search"
            @click="clearSearch"
            class="search-clear-btn"
            title="清除搜索"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <!-- RSS源选择器 -->
      <div class="filter-group">
        <label class="filter-label">RSS源</label>
        <select 
          class="filter-input filter-select"
          v-model="localFilters.sourceId"
          @change="handleFilterChange"
        >
          <option value="">全部源</option>
          <option 
            v-for="source in sources" 
            :key="source.id" 
            :value="source.id"
          >
            {{ source.name || '未命名源' }}
          </option>
        </select>
      </div>
      
      <!-- 状态选择器 -->
      <div class="filter-group">
        <label class="filter-label">状态</label>
        <select 
          class="filter-input filter-select"
          v-model="localFilters.status"
          @change="handleFilterChange"
        >
          <option value="all">全部状态</option>
          <option value="unread">未读</option>
          <option value="read">已读</option>
          <option value="favorited">已收藏</option>
        </select>
      </div>
      
      <!-- 排序选择器 -->
      <div class="filter-group">
        <label class="filter-label">排序</label>
        <div class="sort-container">
          <select 
            class="filter-input filter-select sort-by"
            v-model="localFilters.sortBy"
            @change="handleSortChange"
          >
            <option value="publishDate">最新发布</option>
            <option value="publishDate_asc">最早发布</option>
            <option value="title">标题排序</option>
            <option value="source">按源排序</option>
          </select>
          <button 
            @click="toggleSortOrder"
            class="sort-order-btn"
            :title="localFilters.sortOrder === 'desc' ? '降序' : '升序'"
          >
            <i :class="localFilters.sortOrder === 'desc' ? 'fas fa-sort-down' : 'fas fa-sort-up'"></i>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 快速筛选标签 -->
    <div class="filters-row filters-row--tags">
      <div class="filter-group">
        <label class="filter-label">快速筛选</label>
        <div class="filter-tags">
          <span 
            v-for="tag in quickFilterTags"
            :key="tag.value"
            class="filter-tag"
            :class="{ active: localFilters.quickFilter === tag.value }"
            @click="handleQuickFilterClick(tag.value)"
          >
            <i :class="tag.icon" v-if="tag.icon"></i>
            {{ tag.label }}
            <span v-if="tag.count !== undefined" class="tag-count">{{ tag.count }}</span>
          </span>
        </div>
      </div>
      
      <!-- 筛选重置按钮 -->
      <div class="filter-actions" v-if="hasActiveFilters">
        <button @click="handleClearFilters" class="clear-filters-btn">
          <i class="fas fa-times"></i>
          清除筛选
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { debounce } from 'lodash-es'

// 类型定义
interface ArticleFilters {
  search: string
  source: string
  sourceId: string
  status: 'all' | 'read' | 'unread' | 'favorited'
  sortBy: 'publishDate' | 'publishDate_asc' | 'title' | 'source' 
  sortOrder: 'asc' | 'desc'
  tags: string[]
  quickFilter: 'all' | 'today' | 'week' | 'unread' | 'favorited'
}

interface Source {
  id: string | number
  name?: string
}

interface QuickFilterTag {
  value: string
  label: string
  icon?: string
  count?: number
}

interface Props {
  filters: ArticleFilters
  sources: Source[]
  isLoading?: boolean
  unreadCount?: number
  favoritedCount?: number
  todayCount?: number
  weekCount?: number
}

interface Emits {
  (e: 'update:filters', filters: ArticleFilters): void
  (e: 'search', query: string): void
  (e: 'clear-filters'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  unreadCount: 0,
  favoritedCount: 0,
  todayCount: 0,
  weekCount: 0
})

const emit = defineEmits<Emits>()

// 本地筛选状态
const localFilters = reactive<ArticleFilters>({ 
  search: props.filters.search || '',
  source: props.filters.source || '',
  sourceId: props.filters.sourceId || '',
  status: props.filters.status || 'all',
  sortBy: props.filters.sortBy || 'publishDate',
  sortOrder: props.filters.sortOrder || 'desc',
  tags: props.filters.tags || [],
  quickFilter: props.filters.quickFilter || 'all'
})

// 快速筛选标签配置
const quickFilterTags = computed((): QuickFilterTag[] => [
  { 
    value: 'all', 
    label: '全部',
    icon: 'fas fa-list'
  },
  { 
    value: 'today', 
    label: '今天',
    icon: 'fas fa-calendar-day',
    count: props.todayCount
  },
  { 
    value: 'week', 
    label: '本周',
    icon: 'fas fa-calendar-week',
    count: props.weekCount
  },
  { 
    value: 'unread', 
    label: '未读',
    icon: 'fas fa-envelope',
    count: props.unreadCount
  },
  { 
    value: 'favorited', 
    label: '已收藏',
    icon: 'fas fa-bookmark',
    count: props.favoritedCount
  }
])

// 检查是否有活跃的筛选条件
const hasActiveFilters = computed(() => {
  return localFilters.search !== '' ||
         localFilters.sourceId !== '' ||
         localFilters.status !== 'all' ||
         localFilters.tags.length > 0 ||
         localFilters.quickFilter !== 'all'
})

// 防抖搜索处理
const handleSearchInput = debounce((event: Event) => {
  const target = event.target as HTMLInputElement
  emit('search', target.value)
  handleFilterChange()
}, 300)

// 搜索提交处理（回车键）
function handleSearchSubmit() {
  emit('search', localFilters.search)
  handleFilterChange()
}

// 清除搜索
function clearSearch() {
  localFilters.search = ''
  emit('search', '')
  handleFilterChange()
}

// 筛选条件变化处理
function handleFilterChange() {
  emit('update:filters', { ...localFilters })
}

// 快速筛选标签点击处理
function handleQuickFilterClick(value: string) {
  localFilters.quickFilter = value as ArticleFilters['quickFilter']
  handleFilterChange()
}

// 处理排序变化
function handleSortChange() {
  console.log('Sort changed to:', localFilters.sortBy);
  
  if (localFilters.sortBy === 'publishDate_asc') {
    // 特殊情况："最早发布"选项
    localFilters.sortBy = 'publishDate';
    localFilters.sortOrder = 'asc';
  } else if (localFilters.sortBy === 'publishDate') {
    // 正常的"最新发布"选项，使用降序
    localFilters.sortOrder = 'desc';
  } else if (localFilters.sortBy === 'title') {
    // 标题排序默认使用升序
    localFilters.sortOrder = 'asc';
  } else if (localFilters.sortBy === 'source') {
    // 按源排序默认使用升序
    localFilters.sortOrder = 'asc';
  }
  
  console.log('After processing: sortBy=', localFilters.sortBy, 'sortOrder=', localFilters.sortOrder);
  handleFilterChange();
}

// 切换排序顺序
function toggleSortOrder() {
  localFilters.sortOrder = localFilters.sortOrder === 'desc' ? 'asc' : 'desc'
  handleFilterChange()
}

// 清除所有筛选条件
function handleClearFilters() {
  localFilters.search = ''
  localFilters.sourceId = ''
  localFilters.source = ''
  localFilters.status = 'all'
  localFilters.tags = []
  localFilters.quickFilter = 'all'
  localFilters.sortBy = 'publishDate'
  localFilters.sortOrder = 'desc'
  
  emit('clear-filters')
  handleFilterChange()
}

// 监听外部筛选条件变化
watch(() => props.filters, (newFilters) => {
  Object.assign(localFilters, newFilters)
}, { deep: true })
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.filter-section {
  background: rgba(24, 24, 27, 0.8);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  padding: spacing(6);
  margin-bottom: spacing(6);
  
  // 毛玻璃效果
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  
  // 微妙的内阴影增强毛玻璃效果
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 4px 20px rgba(0, 0, 0, 0.1);
  
  position: relative;
  
  // 增强毛玻璃效果的伪元素
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.02) 0%,
      rgba(255, 255, 255, 0.01) 50%,
      rgba(255, 255, 255, 0.02) 100%
    );
    border-radius: var(--border-radius-m);
    pointer-events: none;
  }
}

.filters-row {
  display: flex;
  gap: spacing(4);
  align-items: flex-end;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
  
  &--tags {
    margin-top: spacing(4);
    align-items: flex-start;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 160px;
  flex: 1;
}

.filter-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: spacing(1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-input {
  padding: spacing(2) spacing(3);
  background: rgba(31, 31, 35, 0.8);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  transition: all var(--transition-speed-fast);
  
  // 毛玻璃效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &:focus {
    border-color: var(--color-accent-primary);
    background: rgba(31, 31, 35, 0.9);
    box-shadow: 
      0 0 0 3px rgba(123, 97, 255, 0.1),
      0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &::placeholder {
    color: var(--color-text-disabled);
  }
}

// 搜索输入框增强
.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding-right: spacing(10); // 为清除按钮留出空间
}

.search-clear-btn {
  position: absolute;
  right: spacing(2);
  background: none;
  border: none;
  color: var(--color-text-disabled);
  cursor: pointer;
  padding: spacing(1);
  border-radius: var(--border-radius-s);
  transition: all var(--transition-speed-fast);
  
  &:hover {
    color: var(--color-text-secondary);
    background: rgba(255, 255, 255, 0.1);
  }
}

// 排序容器增强
.sort-container {
  display: flex;
  gap: spacing(1);
  align-items: center;
}

.sort-by {
  flex: 1;
}

.sort-order-btn {
  width: spacing(8);
  height: spacing(8);
  background: rgba(31, 31, 35, 0.8);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed-fast);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &:hover {
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
    background: rgba(123, 97, 255, 0.1);
  }
}

.filter-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B6B70' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right spacing(2) center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  padding-right: spacing(8);
  cursor: pointer;
  
  &:hover {
    background-color: rgba(31, 31, 35, 0.9);
  }
}

.filter-tags {
  display: flex;
  gap: spacing(2);
  flex-wrap: wrap;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: spacing(1);
  padding: spacing(1.5) spacing(3);
  background: rgba(123, 97, 255, 0.1);
  color: var(--color-accent-primary);
  border-radius: calc(var(--border-radius-s) * 3);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  border: 1px solid transparent;
  
  // 毛玻璃效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  i {
    font-size: 10px;
  }
  
  .tag-count {
    background: rgba(255, 255, 255, 0.2);
    padding: spacing(0.5) spacing(1);
    border-radius: calc(var(--border-radius-s) * 2);
    font-size: 10px;
    font-weight: 600;
    margin-left: spacing(1);
  }
  
  &:hover {
    background: rgba(123, 97, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(123, 97, 255, 0.2);
  }
  
  &.active {
    background: var(--color-accent-primary);
    color: white;
    border-color: var(--color-accent-primary);
    box-shadow: 
      0 2px 8px rgba(123, 97, 255, 0.3),
      0 0 0 1px rgba(123, 97, 255, 0.2);
    
    .tag-count {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

// 筛选操作区域
.filter-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.clear-filters-btn {
  display: flex;
  align-items: center;
  gap: spacing(1.5);
  padding: spacing(1.5) spacing(3);
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-negative);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--border-radius-s);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
  }
}

// 响应式设计
@include tablet {
  .filter-section {
    padding: spacing(4);
  }
  
  .filters-row {
    gap: spacing(3);
    
    &--tags {
      margin-top: spacing(3);
      flex-direction: column;
      align-items: stretch;
    }
  }
  
  .filter-group {
    min-width: 140px;
  }
  
  .filter-actions {
    margin-left: 0;
    margin-top: spacing(2);
  }
  
  .sort-container {
    gap: spacing(0.5);
  }
  
  .sort-order-btn {
    width: spacing(7);
    height: spacing(7);
  }
}

@include mobile {
  .filter-section {
    padding: spacing(3);
  }
  
  .filters-row {
    flex-direction: column;
    align-items: stretch;
    gap: spacing(3);
    
    &--tags {
      margin-top: spacing(3);
      flex-direction: column;
      align-items: stretch;
    }
  }
  
  .filter-group {
    min-width: auto;
    flex: none;
  }
  
  .filter-tags {
    gap: spacing(1.5);
  }
  
  .filter-tag {
    font-size: 11px;
    padding: spacing(1) spacing(2);
    
    .tag-count {
      font-size: 9px;
      padding: spacing(0.25) spacing(0.75);
    }
  }
  
  .search-input {
    padding-right: spacing(9);
  }
  
  .search-clear-btn {
    right: spacing(1.5);
    padding: spacing(0.75);
  }
  
  .clear-filters-btn {
    font-size: 11px;
    padding: spacing(1.25) spacing(2.5);
  }
}

// 加载状态增强
.filter-section--loading {
  pointer-events: none;
  opacity: 0.7;
  
  .filter-input,
  .filter-tag,
  .search-clear-btn,
  .sort-order-btn,
  .clear-filters-btn {
    cursor: not-allowed;
  }
  
  .filter-input {
    background: rgba(31, 31, 35, 0.6);
  }
  
  .filter-tag {
    background: rgba(123, 97, 255, 0.05);
  }
}

// 动画效果增强
.filter-section {
  animation: filterSectionFadeIn 0.6s ease-out;
}

.filter-tag {
  animation: filterTagFadeIn 0.4s ease-out;
}

@keyframes filterSectionFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes filterTagFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 增强毛玻璃效果的额外样式
@supports (backdrop-filter: blur(20px)) {
  .filter-section {
    background: rgba(24, 24, 27, 0.6);
  }
  
  .filter-input {
    background: rgba(31, 31, 35, 0.6);
    
    &:focus {
      background: rgba(31, 31, 35, 0.8);
    }
  }
}

// 不支持backdrop-filter的降级方案
@supports not (backdrop-filter: blur(20px)) {
  .filter-section {
    background: rgba(24, 24, 27, 0.95);
  }
  
  .filter-input {
    background: rgba(31, 31, 35, 0.95);
  }
}
</style> 