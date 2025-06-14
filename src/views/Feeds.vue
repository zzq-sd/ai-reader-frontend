<template>
  <div class="rss-management-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">RSS源管理</h1>
        <p class="page-subtitle">管理您的RSS订阅源</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="refreshAllFeeds" :disabled="isRefreshing">
          <i :class="['fas', isRefreshing ? 'fa-spinner fa-spin' : 'fa-sync-alt']"></i>
          {{ isRefreshing ? '刷新中...' : '刷新全部' }}
        </button>
        <button class="btn btn-primary" @click="openAddFeedModal">
          <i class="fas fa-plus"></i>
          添加RSS源
        </button>
      </div>
    </div>
    
    <!-- 筛选器 -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label class="filter-label">搜索</label>
          <input 
            type="text" 
            class="filter-input" 
            placeholder="搜索RSS源名称或URL..."
            v-model="filters.search"
            @input="applyFilters"
          >
        </div>
        <div class="filter-group">
          <label class="filter-label">分类</label>
          <select class="filter-input filter-select" v-model="filters.category" @change="applyFilters">
            <option value="">全部分类</option>
            <option value="tech">技术博客</option>
            <option value="news">新闻资讯</option>
            <option value="design">设计灵感</option>
            <option value="business">商业财经</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">状态</label>
          <select class="filter-input filter-select" v-model="filters.status" @change="applyFilters">
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="error">错误</option>
            <option value="updating">更新中</option>
          </select>
        </div>
        <div class="filter-group">
          <button class="btn btn-secondary" @click="clearFilters">
            <i class="fas fa-times"></i>
            清除筛选
          </button>
        </div>
      </div>
    </div>
    
    <!-- RSS源列表 -->
    <div class="feeds-grid" ref="feedsGridRef">
      <div 
        v-for="(feed, index) in filteredFeeds" 
        :key="feed.id"
        class="feed-card"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div :class="['feed-status', feed.status]"></div>
        <div class="feed-actions">
          <div class="action-dropdown">
            <button class="action-trigger" @click="toggleFeedActions(feed.id)">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <Transition name="dropdown">
              <div v-if="activeActionId === feed.id" class="action-menu">
                <button @click="refreshSingleFeed(feed)" class="action-item">
                  <i class="fas fa-sync-alt"></i>刷新
                </button>
                <button @click="editFeed(feed)" class="action-item">
                  <i class="fas fa-edit"></i>编辑
                </button>
                <button @click="deleteFeed(feed)" class="action-item danger">
                  <i class="fas fa-trash"></i>删除
                </button>
              </div>
            </Transition>
          </div>
        </div>
        <div class="feed-category">{{ getCategoryName(feed.category) }}</div>
        <div class="feed-header">
          <div class="feed-icon">
            <img 
              v-if="feed.icon" 
              :src="feed.icon" 
              :alt="feed.name"
              @error="handleImageError"
            >
            <i v-else :class="feed.defaultIcon || 'fas fa-rss'"></i>
          </div>
          <div class="feed-info">
            <div class="feed-name">{{ feed.name }}</div>
            <div class="feed-url">{{ feed.url }}</div>
          </div>
        </div>
        <div class="feed-stats">
          <div class="stat-item">
            <div class="stat-value">{{ feed.totalArticles }}</div>
            <div class="stat-label">文章</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ feed.unreadCount }}</div>
            <div class="stat-label">未读</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ feed.lastUpdate }}</div>
            <div class="stat-label">更新</div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredFeeds.length === 0 && !isLoading" class="empty-state">
        <i class="fas fa-rss"></i>
        <h3>{{ hasFilters ? '没有匹配的RSS源' : '还没有RSS源' }}</h3>
        <p>{{ hasFilters ? '尝试调整筛选条件' : '点击上方按钮添加您的第一个RSS源' }}</p>
        <button v-if="hasFilters" class="btn btn-secondary" @click="clearFilters">
          清除筛选
        </button>
        <button v-else class="btn btn-primary" @click="openAddFeedModal">
          <i class="fas fa-plus"></i>添加RSS源
        </button>
      </div>
    </div>
    
    <!-- 添加RSS源模态框 -->
    <Transition name="modal">
      <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">{{ editingFeed ? '编辑RSS源' : '添加RSS源' }}</h2>
            <button class="modal-close" @click="closeAddModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitFeed">
              <div class="form-group">
                <label class="form-label" for="feedUrl">RSS源URL *</label>
                <input 
                  type="url" 
                  id="feedUrl" 
                  v-model="feedForm.url"
                  class="form-input" 
                  placeholder="https://example.com/feed.xml"
                  required
                  :disabled="isSubmitting"
                >
              </div>
              <div class="form-group">
                <label class="form-label" for="feedName">自定义名称</label>
                <input 
                  type="text" 
                  id="feedName" 
                  v-model="feedForm.name"
                  class="form-input" 
                  placeholder="可选，默认使用源标题"
                  :disabled="isSubmitting"
                >
              </div>
              <div class="form-group">
                <label class="form-label" for="feedCategory">分类</label>
                <select 
                  id="feedCategory" 
                  v-model="feedForm.category"
                  class="form-input filter-select"
                  :disabled="isSubmitting"
                >
                  <option value="">选择分类</option>
                  <option value="tech">技术博客</option>
                  <option value="news">新闻资讯</option>
                  <option value="design">设计灵感</option>
                  <option value="business">商业财经</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeAddModal" :disabled="isSubmitting">
              取消
            </button>
            <button class="btn btn-primary" @click="submitFeed" :disabled="isSubmitting || !feedForm.url">
              <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
              {{ isSubmitting ? (editingFeed ? '保存中...' : '添加中...') : (editingFeed ? '保存RSS源' : '添加RSS源') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 删除确认模态框 -->
    <Transition name="modal">
      <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
        <div class="modal modal-small" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">确认删除</h2>
            <button class="modal-close" @click="closeDeleteModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p>确定要删除RSS源 <strong>{{ feedToDelete?.name }}</strong> 吗？</p>
            <p class="warning-text">此操作不可撤销，相关的文章数据也将被删除。</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeDeleteModal" :disabled="isDeleting">
              取消
            </button>
            <button class="btn btn-danger" @click="confirmDelete" :disabled="isDeleting">
              <i v-if="isDeleting" class="fas fa-spinner fa-spin"></i>
              {{ isDeleting ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 成功提示 -->
    <Transition name="toast">
      <div v-if="showToast" class="toast" :class="toastType">
        <i :class="toastIcon"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

// 类型定义
interface RssFeed {
  id: string
  name: string
  url: string
  category: string
  status: 'active' | 'error' | 'updating'
  icon?: string
  defaultIcon?: string
  totalArticles: number
  unreadCount: number
  lastUpdate: string
  description?: string
  updateFrequency?: number
}

interface FeedForm {
  url: string
  name: string
  category: string
}

interface Filters {
  search: string
  category: string
  status: string
}

// 响应式数据
const feeds = ref<RssFeed[]>([])
const filteredFeeds = ref<RssFeed[]>([])
const isLoading = ref(false)
const isRefreshing = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')
const activeActionId = ref<string | null>(null)
const editingFeed = ref<RssFeed | null>(null)
const feedToDelete = ref<RssFeed | null>(null)
const feedsGridRef = ref<HTMLElement>()

// 表单数据
const feedForm = reactive<FeedForm>({
  url: '',
  name: '',
  category: ''
})

// 筛选器
const filters = reactive<Filters>({
  search: '',
  category: '',
  status: ''
})

// 计算属性
const hasFilters = computed(() => {
  return filters.search || filters.category || filters.status
})

const toastIcon = computed(() => {
  switch (toastType.value) {
    case 'success': return 'fas fa-check-circle'
    case 'error': return 'fas fa-exclamation-circle'
    case 'warning': return 'fas fa-exclamation-triangle'
    default: return 'fas fa-info-circle'
  }
})

// 方法
const loadFeeds = async () => {
  isLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    feeds.value = [
      {
        id: '1',
        name: 'Vue.js官方博客',
        url: 'https://blog.vuejs.org/feed.xml',
        category: 'tech',
        status: 'active',
        icon: 'https://vuejs.org/logo.svg',
        totalArticles: 156,
        unreadCount: 12,
        lastUpdate: '2小时前'
      },
      {
        id: '2',
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        category: 'news',
        status: 'active',
        totalArticles: 2341,
        unreadCount: 45,
        lastUpdate: '30分钟前'
      },
      {
        id: '3',
        name: 'Dribbble',
        url: 'https://dribbble.com/shots.rss',
        category: 'design',
        status: 'error',
        totalArticles: 89,
        unreadCount: 0,
        lastUpdate: '2天前'
      }
    ]
    
    applyFilters()
  } catch (error) {
    showToastMessage('加载RSS源失败', 'error')
  } finally {
    isLoading.value = false
  }
}

const applyFilters = () => {
  let filtered = [...feeds.value]
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(feed => 
      feed.name.toLowerCase().includes(searchLower) ||
      feed.url.toLowerCase().includes(searchLower)
    )
  }
  
  if (filters.category) {
    filtered = filtered.filter(feed => feed.category === filters.category)
  }
  
  if (filters.status) {
    filtered = filtered.filter(feed => feed.status === filters.status)
  }
  
  filteredFeeds.value = filtered
}

const clearFilters = () => {
  filters.search = ''
  filters.category = ''
  filters.status = ''
  applyFilters()
}

const getCategoryName = (category: string) => {
  const categoryMap: Record<string, string> = {
    tech: '技术博客',
    news: '新闻资讯',
    design: '设计灵感',
    business: '商业财经'
  }
  return categoryMap[category] || '未分类'
}

const refreshAllFeeds = async () => {
  isRefreshing.value = true
  try {
    // 模拟刷新所有RSS源
    await new Promise(resolve => setTimeout(resolve, 2000))
    showToastMessage('所有RSS源刷新完成', 'success')
    await loadFeeds()
  } catch (error) {
    showToastMessage('刷新失败', 'error')
  } finally {
    isRefreshing.value = false
  }
}

const refreshSingleFeed = async (feed: RssFeed) => {
  feed.status = 'updating'
  try {
    // 模拟刷新单个RSS源
    await new Promise(resolve => setTimeout(resolve, 1000))
    feed.status = 'active'
    feed.lastUpdate = '刚刚'
    showToastMessage(`${feed.name} 刷新完成`, 'success')
  } catch (error) {
    feed.status = 'error'
    showToastMessage(`${feed.name} 刷新失败`, 'error')
  }
  closeActionMenu()
}

const openAddFeedModal = () => {
  editingFeed.value = null
  resetFeedForm()
  showAddModal.value = true
}

const editFeed = (feed: RssFeed) => {
  editingFeed.value = feed
  feedForm.url = feed.url
  feedForm.name = feed.name
  feedForm.category = feed.category
  showAddModal.value = true
  closeActionMenu()
}

const deleteFeed = (feed: RssFeed) => {
  feedToDelete.value = feed
  showDeleteModal.value = true
  closeActionMenu()
}

const closeAddModal = () => {
  showAddModal.value = false
  editingFeed.value = null
  resetFeedForm()
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  feedToDelete.value = null
}

const resetFeedForm = () => {
  feedForm.url = ''
  feedForm.name = ''
  feedForm.category = ''
}

const submitFeed = async () => {
  if (!feedForm.url) return
  
  isSubmitting.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (editingFeed.value) {
      // 编辑现有RSS源
      const index = feeds.value.findIndex(f => f.id === editingFeed.value!.id)
      if (index !== -1) {
        feeds.value[index] = {
          ...feeds.value[index],
          url: feedForm.url,
          name: feedForm.name || feeds.value[index].name,
          category: feedForm.category
        }
      }
      showToastMessage('RSS源更新成功', 'success')
    } else {
      // 添加新RSS源
      const newFeed: RssFeed = {
        id: Date.now().toString(),
        name: feedForm.name || '新RSS源',
        url: feedForm.url,
        category: feedForm.category,
        status: 'active',
        totalArticles: 0,
        unreadCount: 0,
        lastUpdate: '刚刚'
      }
      feeds.value.unshift(newFeed)
      showToastMessage('RSS源添加成功', 'success')
    }
    
    applyFilters()
    closeAddModal()
  } catch (error) {
    showToastMessage(editingFeed.value ? 'RSS源更新失败' : 'RSS源添加失败', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = async () => {
  if (!feedToDelete.value) return
  
  isDeleting.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const index = feeds.value.findIndex(f => f.id === feedToDelete.value!.id)
    if (index !== -1) {
      feeds.value.splice(index, 1)
    }
    
    applyFilters()
    showToastMessage('RSS源删除成功', 'success')
    closeDeleteModal()
  } catch (error) {
    showToastMessage('RSS源删除失败', 'error')
  } finally {
    isDeleting.value = false
  }
}

const toggleFeedActions = (feedId: string) => {
  activeActionId.value = activeActionId.value === feedId ? null : feedId
}

const closeActionMenu = () => {
  activeActionId.value = null
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// 点击外部关闭操作菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.action-dropdown')) {
    closeActionMenu()
  }
}

// 生命周期
onMounted(() => {
  loadFeeds()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="scss">
.rss-management-container {
  padding: 24px;
  background: var(--color-bg-primary);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  
  .page-title {
    margin: 0 0 8px;
    font-size: 32px;
    font-weight: 700;
    color: var(--color-text-primary);
  }
  
  .page-subtitle {
    margin: 0;
    font-size: 16px;
    color: var(--color-text-secondary);
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.filters-section {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.filters-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 16px;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.filter-input {
  padding: 10px 12px;
  border: 2px solid var(--color-border-primary);
  border-radius: 8px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 14px;
  transition: all var(--transition-speed-fast);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
  }
  
  &::placeholder {
    color: var(--color-text-tertiary);
  }
}

.filter-select {
  cursor: pointer;
}

.feeds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.feed-card {
  position: relative;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  padding: 20px;
  transition: all var(--transition-speed-fast);
  animation: fadeInUp 0.6s ease-out both;
  
  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.1);
    transform: translateY(-2px);
  }
}

.feed-status {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  
  &.active {
    background: var(--color-success);
  }
  
  &.error {
    background: var(--color-danger);
  }
  
  &.updating {
    background: var(--color-warning);
    animation: pulse 2s infinite;
  }
}

.feed-actions {
  position: absolute;
  top: 12px;
  right: 12px;
}

.action-dropdown {
  position: relative;
}

.action-trigger {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 120px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: hidden;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: none;
  color: var(--color-text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
  }
  
  &.danger {
    color: var(--color-danger);
    
    &:hover {
      background: rgba(var(--color-danger-rgb), 0.1);
    }
  }
}

.feed-category {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  margin-bottom: 12px;
}

.feed-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.feed-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  img {
    width: 24px;
    height: 24px;
    border-radius: 4px;
  }
  
  i {
    font-size: 18px;
    color: var(--color-text-secondary);
  }
}

.feed-info {
  flex: 1;
  min-width: 0;
}

.feed-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-url {
  font-size: 13px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 8px;
  background: var(--color-bg-primary);
  border-radius: 6px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 48px 24px;
  color: var(--color-text-secondary);
  
  i {
    font-size: 48px;
    color: var(--color-text-tertiary);
    margin-bottom: 16px;
  }
  
  h3 {
    margin: 0 0 8px;
    font-size: 18px;
    color: var(--color-text-primary);
  }
  
  p {
    margin: 0 0 24px;
    line-height: 1.5;
  }
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  text-decoration: none;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.btn-primary {
    background: var(--color-primary);
    color: white;
    
    &:hover:not(:disabled) {
      background: var(--color-primary-dark);
      transform: translateY(-1px);
    }
  }
  
  &.btn-secondary {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-primary);
    
    &:hover:not(:disabled) {
      background: var(--color-bg-hover);
      border-color: var(--color-primary);
    }
  }
  
  &.btn-danger {
    background: var(--color-danger);
    color: white;
    
    &:hover:not(:disabled) {
      background: var(--color-danger-dark);
    }
  }
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--color-bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  
  &.modal-small {
    max-width: 400px;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-primary);
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

.modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid var(--color-border-primary);
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--color-border-primary);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 14px;
  transition: all var(--transition-speed-fast);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
  }
  
  &::placeholder {
    color: var(--color-text-tertiary);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.warning-text {
  color: var(--color-warning);
  font-size: 14px;
  margin: 8px 0 0;
}

/* Toast样式 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  
  &.success {
    background: var(--color-success);
  }
  
  &.error {
    background: var(--color-danger);
  }
  
  &.warning {
    background: var(--color-warning);
  }
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
  transform-origin: top right;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rss-management-container {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: stretch;
    
    .btn {
      flex: 1;
      justify-content: center;
    }
  }
  
  .filters-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .feeds-grid {
    grid-template-columns: 1fr;
  }
  
  .modal {
    margin: 0;
    border-radius: 0;
    max-height: 100vh;
  }
  
  .modal-overlay {
    padding: 0;
  }
}
</style> 