<template>
  <div class="articles">
    <!-- 页面头部 -->
    <div class="articles-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">文章列表</h1>
          <p class="page-subtitle">
            管理和阅读您的RSS订阅文章
            <span v-if="!loading && hasArticles" class="article-count">
              （共 {{ total }} 篇文章）
            </span>
          </p>
        </div>
        
        <div class="header-actions">
          <button 
            class="action-btn action-btn--refresh"
            @click="handleRefresh"
            :disabled="loading"
            title="刷新文章"
          >
            <AppIcon :icon="ICONS.RSS.REFRESH" :size="ICON_SIZES.SM" :spin="loading" />
            <span>刷新</span>
          </button>
          
          <button 
            class="action-btn action-btn--mark-all"
            @click="handleMarkAllRead"
            :disabled="loading || unreadCount === 0"
            title="全部标记为已读"
          >
            <AppIcon :icon="ICONS.ARTICLE.READ" :size="ICON_SIZES.SM" />
            <span>全部已读</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 筛选区域 -->
    <FilterSection 
      :filters="filters"
      :sources="rssSources"
      :is-loading="loading"
      :unread-count="unreadCount"
      :favorited-count="favoritedCount"
      :today-count="todayCount"
      :week-count="weekCount"
      @search="handleSearch"
      @update:filters="handleFiltersUpdate"
      @clear-filters="handleClearFilters"
    />
    
    <!-- 工具栏 -->
    <div class="articles-toolbar">
      <div class="toolbar-left">
        <div class="results-info">
          <span v-if="!loading">
            显示 {{ articles.length }} 篇文章
            <span v-if="articles.filter(article => article.readStatus === 'unread').length > 0" class="unread-badge">
              {{ articles.filter(article => article.readStatus === 'unread').length }} 篇未读
            </span>
          </span>
        </div>
      </div>
      
      <div class="toolbar-right">
        <ViewToggle 
          :current-view="viewMode"
          :show-images="viewOptions.showImages"
          :show-excerpt="viewOptions.showExcerpt"
          :show-meta="viewOptions.showMeta"
          @view-change="handleViewChange"
          @option-change="handleViewOptionChange"
        />
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="articles-loading">
      <div class="loading-grid" :class="`loading-grid--${viewMode}`">
        <div 
          v-for="i in pageSize" 
          :key="i" 
          class="loading-card"
        >
          <ArticleCard :article="mockArticle" :is-loading="true" />
        </div>
      </div>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="articles-error">
      <div class="error-content">
        <AppIcon :icon="ICONS.NOTIFICATION.ERROR" :size="ICON_SIZES.XXXL" :color="ICON_COLORS.DANGER" />
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="handleRefresh">
          <AppIcon :icon="ICONS.ACTION.RESET" :size="ICON_SIZES.SM" />
          重试
        </button>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="!hasArticles" class="articles-empty">
      <div class="empty-content">
        <AppIcon :icon="ICONS.EMPTY.NO_ARTICLES" :size="ICON_SIZES.XXXL" :color="ICON_COLORS.DISABLED" />
        <h3>暂无文章</h3>
        <p v-if="hasActiveFilters">
          没有找到符合筛选条件的文章，请尝试调整筛选条件。
        </p>
        <p v-else>
          还没有订阅任何RSS源，请先添加RSS订阅。
        </p>
        <div class="empty-actions">
          <button 
            v-if="hasActiveFilters"
            class="empty-btn"
            @click="handleClearFilters"
          >
            <AppIcon :icon="ICONS.ACTION.FILTER" :size="ICON_SIZES.SM" />
            清除筛选
          </button>
          <button 
            v-else
            class="empty-btn"
            @click="handleGoToFeeds"
          >
            <AppIcon :icon="ICONS.RSS.ADD" :size="ICON_SIZES.SM" />
            添加RSS源
          </button>
        </div>
      </div>
    </div>
    
    <!-- 文章列表 -->
    <div v-else class="articles-content">
      <div class="articles-grid" :class="`articles-grid--${viewMode}`">
        <ArticleCard 
          v-for="(article, index) in articles"
          :key="article.id"
          :article="article"
          :style="{ '--stagger-delay': `${index * 50}ms` }"
          class="article-card--staggered"
          @click="handleArticleClick"
          @toggle-favorite="handleToggleFavorite"
          @toggle-read="handleToggleRead"
          @show-more="handleShowMore"
        />
      </div>
      
      <!-- 分页 -->
      <Pagination 
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="total"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>
  </div>
  
  <!-- Toast通知 -->
  <Transition name="toast">
    <div v-if="showToastNotification" class="toast-notification" :class="`toast-${toastType}`">
      <div class="toast-content">
        <i :class="toastType === 'success' ? 'fas fa-check-circle' : toastType === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle'"></i>
        <span>{{ toastMessage }}</span>
      </div>
      <button class="toast-close" @click="showToastNotification = false">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useArticlesStore, type UIArticle, type UIArticleFilters, type ViewMode, type ViewOptions } from '@/stores/articles'

// 组件导入
import FilterSection from '@/components/articles/FilterSection.vue'
import ArticleCard from '@/components/articles/ArticleCard.vue'
import Pagination from '@/components/articles/Pagination.vue'
import ViewToggle from '@/components/articles/ViewToggle.vue'

import { ICONS, ICON_SIZES, ICON_COLORS } from '@/constants/icons'

const router = useRouter()
const articlesStore = useArticlesStore()

// 从store获取状态 - 使用computed来确保响应性
const articles = computed(() => articlesStore.articles)
const total = computed(() => articlesStore.total)
const loading = computed(() => articlesStore.loading)
const error = computed(() => articlesStore.error)
const rssSources = computed(() => articlesStore.rssSources)
const filters = computed(() => articlesStore.filters)
const pagination = computed(() => articlesStore.pagination)
const viewMode = computed(() => articlesStore.viewMode)
const viewOptions = computed(() => articlesStore.viewOptions)
const totalPages = computed(() => articlesStore.totalPages)
const hasArticles = computed(() => articlesStore.hasArticles)
const unreadCount = computed(() => articlesStore.unreadCount)
const favoritedCount = computed(() => articlesStore.favoritedCount)
const todayCount = computed(() => articlesStore.todayCount)
const weekCount = computed(() => articlesStore.weekCount)
const availableTags = computed(() => articlesStore.availableTags)
const filteredArticlesCount = computed(() => articlesStore.filteredArticlesCount)

// 计算属性
const pageSize = computed(() => pagination.value.pageSize)

const hasActiveFilters = computed(() => {
  const f = filters.value
  return f.search !== '' ||
         f.source !== '' ||
         f.status !== 'all' ||
         f.tags.length > 0 ||
         f.quickFilter !== 'all'
})

// 模拟文章数据（用于加载状态）
const mockArticle: UIArticle = {
  id: 'loading',
  title: '加载中的文章标题',
  excerpt: '这是一个加载中的文章摘要，用于显示骨架屏效果。',
  source: '加载中',
  sourceId: 'loading',
  publishTime: new Date().toISOString(),
  readStatus: 'unread',
  isFavorited: false,
  tags: ['加载中'],
  url: '#',
  // 满足后端API类型要求的字段
  publicationDate: new Date().toISOString(),
  originalUrl: '#',
  createdAt: new Date().toISOString(),
  author: '系统',
  summary: '这是一个加载中的文章摘要，用于显示骨架屏效果。',
  // 添加缺失的必需字段
  rssSourceId: 'loading',
  rssSourceName: '加载中'
}

// 事件处理
function handleRefresh() {
  articlesStore.refreshArticles()
}

function handleMarkAllRead() {
  articlesStore.markAllAsRead()
}

function handleSearch(search: string) {
  articlesStore.updateSearch(search)
}

function handleFiltersUpdate(updatedFilters: UIArticleFilters) {
  articlesStore.updateFilters(updatedFilters)
}

function handleViewChange(view: ViewMode) {
  articlesStore.setViewMode(view)
}

function handleViewOptionChange(option: string, value: boolean) {
  articlesStore.updateViewOptions({ [option]: value } as Partial<ViewOptions>)
}

function handlePageChange(page: number) {
  articlesStore.changePage(page)
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handlePageSizeChange(pageSize: number) {
  articlesStore.changePageSize(pageSize)
}

function handleArticleClick(article: any) {
  // 跳转到文章详情页
  router.push(`/articles/${article.id}`)
}

function handleToggleFavorite(articleId: string) {
  // 获取文章信息以确定操作类型
  const article = articlesStore.getArticleById(articleId)
  if (!article) return
  
  const willBeFavorited = !article.isFavorited
  
  // 调用store方法
  articlesStore.toggleArticleFavoriteStatus(articleId)
  
  // 显示用户反馈
  showToast(
    willBeFavorited ? '已添加到收藏' : '已取消收藏',
    'success'
  )
}

function handleToggleRead(articleId: string) {
  articlesStore.toggleArticleRead(articleId)
}

function handleShowMore(article: any) {
  // 显示更多操作菜单
  console.log('Show more options for article:', article.id)
  // TODO: 实现更多操作菜单
}

function handleGoToFeeds() {
  router.push('/feeds')
}

function handleClearFilters() {
  articlesStore.clearFilters()
}

// 键盘事件处理
function handleKeydown(event: KeyboardEvent) {
  // ESC键清除筛选
  if (event.key === 'Escape' && hasActiveFilters.value) {
    handleClearFilters()
  }
  // F5或Ctrl+R刷新
  if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
    event.preventDefault()
    handleRefresh()
  }
}

// 生命周期
onMounted(() => {
  // 初始化store
  articlesStore.initializeStore()
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeydown)
})

// Toast通知相关
const showToastNotification = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('info')

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) {
  toastMessage.value = message
  toastType.value = type
  showToastNotification.value = true
  
  // 自动隐藏
  setTimeout(() => {
    showToastNotification.value = false
  }, duration)
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.articles {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: spacing(6) spacing(8);
}

.articles-header {
  margin-bottom: spacing(6);
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: spacing(6);
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 spacing(2) 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.article-count {
  color: var(--color-accent-primary);
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: spacing(3);
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: spacing(2);
  padding: spacing(3) spacing(4);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  // 毛玻璃效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &:hover:not(:disabled) {
    border-color: var(--color-border-secondary);
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  &--refresh {
    &:hover:not(:disabled) {
      border-color: var(--color-accent-primary);
      color: var(--color-accent-primary);
    }
  }
  
  &--mark-all {
    &:hover:not(:disabled) {
      border-color: #10B981;
      color: #10B981;
    }
  }
  
  i {
    font-size: 12px;
  }
}

.articles-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: spacing(4);
  margin-bottom: spacing(6);
  padding: spacing(4) 0;
  border-bottom: 1px solid var(--color-border-primary);
}

.toolbar-left {
  flex: 1;
}

.results-info {
  color: var(--color-text-secondary);
  font-size: 14px;
  
  .unread-badge {
    display: inline-flex;
    align-items: center;
    padding: spacing(1) spacing(2);
    margin-left: spacing(2);
    background-color: var(--color-accent-primary);
    color: white;
    font-size: 12px;
    font-weight: 600;
    border-radius: var(--border-radius-xs);
  }
}

.toolbar-right {
  flex-shrink: 0;
}

// 加载状态
.articles-loading {
  margin-bottom: spacing(6);
}

.loading-grid {
  display: grid;
  gap: spacing(4);
  
  &--list {
    grid-template-columns: 1fr;
  }
  
  &--grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
  
  &--compact {
    grid-template-columns: 1fr;
    gap: spacing(2);
  }
}

.loading-card {
  animation: loadingCardFadeIn 0.6s ease-out both;
}

// 错误状态
.articles-error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  margin-bottom: spacing(6);
}

.error-content {
  text-align: center;
  max-width: 400px;
  
  i {
    font-size: 48px;
    color: #EF4444;
    margin-bottom: spacing(4);
  }
  
  h3 {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 spacing(2) 0;
  }
  
  p {
    font-size: 16px;
    color: var(--color-text-secondary);
    margin: 0 0 spacing(6) 0;
    line-height: 1.5;
  }
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: spacing(2);
  padding: spacing(3) spacing(6);
  background-color: var(--color-accent-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-s);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background-color: var(--color-accent-secondary);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(123, 97, 255, 0.3);
  }
}

// 空状态
.articles-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  margin-bottom: spacing(6);
}

.empty-content {
  text-align: center;
  max-width: 400px;
  
  i {
    font-size: 48px;
    color: var(--color-text-disabled);
    margin-bottom: spacing(4);
  }
  
  h3 {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 spacing(2) 0;
  }
  
  p {
    font-size: 16px;
    color: var(--color-text-secondary);
    margin: 0 0 spacing(6) 0;
    line-height: 1.5;
  }
}

.empty-actions {
  display: flex;
  gap: spacing(3);
  justify-content: center;
}

.empty-btn {
  display: inline-flex;
  align-items: center;
  gap: spacing(2);
  padding: spacing(3) spacing(4);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    border-color: var(--color-accent-primary);
    background-color: var(--color-accent-primary);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(123, 97, 255, 0.3);
  }
}

// 文章网格
.articles-content {
  margin-bottom: spacing(6);
}

.articles-grid {
  display: grid;
  gap: spacing(4);
  margin-bottom: spacing(8);
  
  &--list {
    grid-template-columns: 1fr;
  }
  
  &--grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: spacing(6);
  }
  
  &--compact {
    grid-template-columns: 1fr;
    gap: spacing(2);
  }
}

// 响应式设计
@include tablet {
  .articles {
    padding: spacing(4) spacing(6);
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: spacing(4);
  }
  
  .header-actions {
    justify-content: flex-start;
  }
  
  .action-btn {
    padding: spacing(2) spacing(3);
    font-size: 13px;
    
    span {
      display: none;
    }
  }
  
  .articles-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: spacing(3);
  }
  
  .toolbar-left,
  .toolbar-right {
    flex: none;
  }
  
  .articles-grid {
    &--grid {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: spacing(4);
    }
  }
}

@include mobile {
  .articles {
    padding: spacing(4);
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .page-subtitle {
    font-size: 14px;
  }
  
  .header-actions {
    gap: spacing(2);
  }
  
  .action-btn {
    padding: spacing(2);
    min-width: 40px;
    justify-content: center;
    
    span {
      display: none;
    }
  }
  
  .articles-grid {
    gap: spacing(3);
    
    &--grid {
      grid-template-columns: 1fr;
    }
  }
  
  .empty-content,
  .error-content {
    padding: 0 spacing(4);
    
    i {
      font-size: 36px;
    }
    
    h3 {
      font-size: 20px;
    }
    
    p {
      font-size: 14px;
    }
  }
}

// 动画
@keyframes loadingCardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 页面进入动画
.articles {
  animation: articlesPageFadeIn 0.6s ease-out both;
}

@keyframes articlesPageFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Toast通知样式
.toast-notification {
  position: fixed;
  top: calc(var(--spacing-unit) * 6);
  right: calc(var(--spacing-unit) * 6);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 4);
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  z-index: 1001;
  min-width: 300px;
  max-width: 400px;
  
  &.toast-success {
    border-left: 4px solid #10B981;
    
    .toast-content i {
      color: #10B981;
    }
  }
  
  &.toast-error {
    border-left: 4px solid #EF4444;
    
    .toast-content i {
      color: #EF4444;
    }
  }
  
  &.toast-info {
    border-left: 4px solid #3B82F6;
    
    .toast-content i {
      color: #3B82F6;
    }
  }
}

.toast-content {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  flex: 1;
  
  span {
    color: var(--color-text-primary);
    font-size: 14px;
    line-height: 1.4;
  }
}

.toast-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: calc(var(--spacing-unit) * 1);
  border-radius: var(--border-radius-s);
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

// Toast动画
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style> 