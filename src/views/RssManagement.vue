<template>
  <div class="rss-management-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="title-section">
        <h1 class="page-title">RSS源管理</h1>
        <p class="page-subtitle">使用RSSHub获取更多内容源</p>
      </div>
      
      <div class="header-actions">
        <button class="btn btn-secondary" @click="handleImportExport">
          <AppIcon icon="fas fa-exchange-alt" :size="ICON_SIZES.SM" />
          导入/导出
        </button>
        <button class="btn btn-primary" @click="openAddModal">
          <AppIcon :icon="ICONS.RSS.ADD" :size="ICON_SIZES.SM" />
          添加RSSHub源
        </button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label class="filter-label">搜索RSS源</label>
          <input
            type="text"
            class="filter-input"
            placeholder="搜索标题、描述或URL..."
            v-model="searchQuery"
          />
        </div>
        
        <div class="filter-group">
          <label class="filter-label">分类筛选</label>
          <select v-model="selectedCategory" class="filter-input filter-select">
            <option value="">全部分类</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">状态筛选</label>
          <select v-model="statusFilter" class="filter-input filter-select">
            <option value="">全部状态</option>
            <option value="active">启用中</option>
            <option value="disabled">已禁用</option>
            <option value="error">错误</option>
          </select>
        </div>
        
        <div class="filter-actions">
          <button class="btn btn-secondary" @click="refreshAllFeeds" :disabled="isRefreshing">
            <AppIcon :icon="ICONS.RSS.REFRESH" :size="ICON_SIZES.SM" :spin="isRefreshing" />
            {{ isRefreshing ? '刷新中...' : '全部刷新' }}
          </button>
        </div>
      </div>
    </div>

    <!-- RSS源卡片网格 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载RSS源中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <AppIcon :icon="ICONS.NOTIFICATION.ERROR" :size="ICON_SIZES.XXXL" :color="ICON_COLORS.DANGER" />
      </div>
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadFeeds">
        <AppIcon :icon="ICONS.ACTION.RESET" :size="ICON_SIZES.SM" />
        重试
      </button>
    </div>

    <div v-else-if="filteredFeeds.length === 0" class="empty-state">
      <div class="empty-icon">
        <AppIcon :icon="ICONS.EMPTY.NO_RSS" :size="ICON_SIZES.XXXL" :color="ICON_COLORS.DISABLED" />
      </div>
      <h3>{{ searchQuery ? '未找到匹配的RSS源' : '暂无RSS源' }}</h3>
      <p>{{ searchQuery ? '尝试调整搜索条件' : '点击上方按钮添加您的第一个RSS源' }}</p>
      <button v-if="!searchQuery" class="btn btn-primary" @click="openAddModal">
        <AppIcon :icon="ICONS.RSS.ADD" :size="ICON_SIZES.SM" />
        添加RSS源
      </button>
    </div>

    <div v-else class="feeds-grid">
      <div 
        v-for="feed in filteredFeeds" 
        :key="feed.id"
        class="feed-card"
        :class="{ 'feed-disabled': !feed.isEnabled }"
      >
        <!-- 卡片头部 -->
        <div class="feed-header">
          <div class="feed-icon">
            <img 
              v-if="feed.favicon" 
              :src="feed.favicon" 
              :alt="feed.name"
              @error="handleImageError"
            />
            <AppIcon v-else :icon="ICONS.SIDEBAR.RSS_MANAGEMENT" :size="ICON_SIZES.LG" />
          </div>
          
          <div class="feed-info">
            <h3 class="feed-title">{{ feed.name }}</h3>
            <p class="feed-url">{{ feed.url }}</p>
          </div>
          
          <div class="feed-status">
            <div class="status-indicator" :class="getStatusClass(feed)"></div>
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="feed-content">
          <p v-if="feed.description" class="feed-description">{{ feed.description }}</p>
          
          <div class="feed-stats">
            <div class="stat-item">
              <AppIcon :icon="ICONS.COLLECTIONS.ARTICLE_TYPE" :size="ICON_SIZES.SM" />
              <span>{{ feed.articlesCount || 0 }} 篇文章</span>
            </div>
            <div class="stat-item">
              <AppIcon :icon="ICONS.ARTICLE.TIME" :size="ICON_SIZES.SM" />
              <span>{{ formatLastUpdate(feed.lastUpdated, feed.status) }}</span>
            </div>
          </div>
          
          <div class="feed-tags">
            <span v-if="feed.category" class="tag category-tag">
              {{ getCategoryName(feed.category) }}
            </span>
            <span class="tag priority-tag" :class="`priority-${feed.priority}`">
              {{ getPriorityText(feed.priority) }}
            </span>
            <span 
              v-if="!feed.isEnabled" 
              class="tag status-tag disabled"
            >
              已禁用
            </span>
            <span 
              v-else-if="feed.isEnabled" 
              class="tag status-tag enabled"
            >
              已启用
            </span>
            <span 
              v-if="rssStore.isFeedToggling(feed.id)" 
              class="tag status-tag toggling"
            >
              切换中...
            </span>
          </div>
        </div>

        <!-- 卡片操作 -->
        <div class="feed-actions">
          <button 
            class="action-btn" 
            @click="refreshFeed(feed.id)"
            :disabled="rssStore.isFeedRefreshing(feed.id)"
            title="刷新"
          >
            <AppIcon :icon="ICONS.RSS.REFRESH" :size="ICON_SIZES.SM" :spin="rssStore.isFeedRefreshing(feed.id)" />
          </button>
          
          <button 
            class="action-btn" 
            @click="openEditModal(feed)"
            title="编辑"
          >
            <AppIcon :icon="ICONS.RSS.EDIT" :size="ICON_SIZES.SM" />
          </button>
          
          <button 
            class="action-btn" 
            @click="toggleFeedStatus(feed)"
            :disabled="rssStore.isFeedToggling(feed.id)"
            :title="rssStore.isFeedToggling(feed.id) ? '切换中...' : (feed.isEnabled ? '禁用' : '启用')"
          >
            <AppIcon 
              v-if="rssStore.isFeedToggling(feed.id)" 
              icon="fas fa-spinner" 
              :size="ICON_SIZES.SM" 
              :spin="true" 
            />
            <AppIcon 
              v-else
              :icon="feed.isEnabled ? 'fas fa-pause' : 'fas fa-play'" 
              :size="ICON_SIZES.SM" 
            />
          </button>
          
          <button 
            class="action-btn danger" 
            @click="confirmDeleteFeed(feed)"
            title="删除"
          >
            <AppIcon :icon="ICONS.RSS.DELETE" :size="ICON_SIZES.SM" />
          </button>
        </div>
      </div>
    </div>

    <!-- 添加RSS源模态框 -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            <AppIcon :icon="ICONS.RSS.ADD" :size="ICON_SIZES.SM" />
            添加RSSHub源
          </h3>
          <button class="close-btn" @click="closeAddModal">
            <AppIcon :icon="ICONS.ACTION.CLOSE" :size="ICON_SIZES.SM" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="rsshub-info">
            <p>输入RSSHub路由添加RSS源，处理将在后端完成。</p>
          </div>
          <SimpleRsshubForm @source-added="handleRsshubSourceAdded" />
        </div>
      </div>
    </div>

    <!-- 编辑RSS源模态框 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            <AppIcon :icon="ICONS.RSS.EDIT" :size="ICON_SIZES.SM" />
            编辑RSS源
          </h3>
          <button class="close-btn" @click="closeEditModal">
            <AppIcon :icon="ICONS.ACTION.CLOSE" :size="ICON_SIZES.SM" />
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="handleEditFeed">
            <div class="form-group">
              <label for="edit-feed-url">RSS源URL *</label>
              <input
                id="edit-feed-url"
                type="url"
                v-model="editingFeed.url"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="edit-feed-title">标题</label>
              <input
                id="edit-feed-title"
                type="text"
                v-model="editingFeed.title"
              />
            </div>
            
            <div class="form-group">
              <label for="edit-feed-category">分类</label>
              <select id="edit-feed-category" v-model="editingFeed.category">
                <option value="">选择分类</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="edit-feed-priority">优先级</label>
              <select id="edit-feed-priority" v-model="editingFeed.priority">
                <option value="low">低</option>
                <option value="normal">普通</option>
                <option value="high">高</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="editingFeed.isEnabled">
                <span class="checkmark"></span>
                启用此RSS源
              </label>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeEditModal">
            取消
          </button>
          <button type="button" class="btn btn-primary" @click="handleEditFeed" :disabled="isLoading">
            <AppIcon v-if="isLoading" :icon="ICONS.NOTIFICATION.LOADING" :size="ICON_SIZES.SM" :spin="true" />
            <AppIcon v-else :icon="ICONS.RSS.EDIT" :size="ICON_SIZES.SM" />
            {{ isLoading ? '保存中...' : '保存更改' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 确认删除模态框 -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirmModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title text-danger">
            <AppIcon :icon="ICONS.NOTIFICATION.WARNING" :size="ICON_SIZES.SM" :color="ICON_COLORS.DANGER" />
            确认删除
          </h3>
          <button class="close-btn" @click="closeConfirmModal">
            <AppIcon :icon="ICONS.ACTION.CLOSE" :size="ICON_SIZES.SM" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="confirm-content">
            <div class="confirm-icon icon-danger">
              <AppIcon :icon="ICONS.RSS.DELETE" :size="ICON_SIZES.XL" :color="ICON_COLORS.DANGER" />
            </div>
            <div class="confirm-message">
              <p class="main-message">确定要删除RSS源 "{{ feedToDelete?.name }}" 吗？</p>
              <div class="warning-details">
                <p class="warning-text">⚠️ 此操作将会：</p>
                <ul class="warning-list">
                  <li>永久删除该RSS源</li>
                  <li>删除该源下的所有文章数据</li>
                  <li>删除相关的收藏和笔记</li>
                  <li>此操作无法撤销</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeConfirmModal">
            取消
          </button>
          <button type="button" class="btn btn-danger" @click="handleDeleteFeed" :disabled="isLoading">
            <AppIcon v-if="isLoading" :icon="ICONS.NOTIFICATION.LOADING" :size="ICON_SIZES.SM" :spin="true" />
            <AppIcon v-else :icon="ICONS.RSS.DELETE" :size="ICON_SIZES.SM" />
            {{ isLoading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Toast通知 -->
    <Transition name="toast">
      <div v-if="showToast" class="toast-notification" :class="`toast-${toastType}`">
        <div class="toast-content">
          <AppIcon 
            :icon="toastType === 'success' ? 'fas fa-check-circle' : toastType === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle'" 
            :size="ICON_SIZES.SM"
          />
          <span>{{ toastMessage }}</span>
        </div>
        <button class="toast-close" @click="showToast = false">
          <AppIcon :icon="ICONS.ACTION.CLOSE" :size="ICON_SIZES.XS" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeMount, watch } from 'vue'

import { ICONS, ICON_SIZES, ICON_COLORS } from '@/constants/icons'
import { useRssStore } from '@/stores/rss'
import SimpleRsshubForm from '@/components/rss/SimpleRsshubForm.vue'

// 使用RSS store
const rssStore = useRssStore()

// 使用store中的数据
const feeds = computed(() => rssStore.feeds)
const filteredFeeds = computed(() => rssStore.filteredFeeds)

// 响应式数据 - 使用store中的数据
const searchQuery = computed({
  get: () => rssStore.searchQuery,
  set: (value) => rssStore.setSearchQuery(value)
})

const selectedCategory = computed({
  get: () => rssStore.currentCategory,
  set: (value) => rssStore.setCategory(value as any)
})

const statusFilter = computed({
  get: () => rssStore.currentStatus,
  set: (value) => rssStore.setStatus(value as any)
})

const isLoading = computed(() => rssStore.isLoading)
const isRefreshing = computed(() => rssStore.isRefreshing)
const error = computed(() => rssStore.error)

// 模态框状态
const showAddModal = computed({
  get: () => rssStore.isAddFeedModalVisible,
  set: (value) => value ? rssStore.openAddFeedModal() : rssStore.closeAddFeedModal()
})

const showEditModal = computed({
  get: () => rssStore.isEditFeedModalVisible,
  set: (value) => value ? null : rssStore.closeEditFeedModal()
})

const showConfirmModal = ref(false)
const deleteSourceId = ref<string | null>(null)

// Toast通知状态
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('info')

// 表单数据
const newFeed = reactive({
  url: '',
  title: '',
  category: '',
  priority: 'normal' as const
})

const editingFeed = reactive({
  id: '',
  url: '',
  title: '',
  category: '',
  priority: 'normal' as const,
  isEnabled: true
})

const feedToDelete = ref<any>(null)

// 类型定义
interface Category {
  id: string
  name: string
  color?: string
}

const categories = ref<Category[]>([
  { id: 'tech', name: '技术开发' },
  { id: 'news', name: '新闻资讯' },
  { id: 'design', name: '设计创意' },
  { id: 'business', name: '商业财经' },
  { id: 'lifestyle', name: '生活方式' },
  { id: 'entertainment', name: '娱乐休闲' },
  { id: 'science', name: '科学科技' },
  { id: 'other', name: '其他' }
])

// 添加重试相关状态
const retryCount = ref(0)
const maxRetries = 2 // 最多自动重试2次
const retryDelay = 2000 // 2秒后重试

// 添加watch以检测和响应错误状态变化
watch(() => rssStore.error, (newError) => {
  if (newError) {
    console.log('[RssManagement] 检测到错误状态变化:', newError)
    // 当发生错误时，自动尝试恢复
    setTimeout(() => {
      if (rssStore.error) {
        console.log('[RssManagement] 错误状态自动恢复尝试')
        // 如果是统计数据错误，尝试忽略它并专注于加载主要数据
        if (rssStore.error.includes('统计数据')) {
          rssStore.error = null // 清除错误，因为统计数据不影响主要功能
        } else if (rssStore.feeds.length === 0) {
          // 如果没有加载到任何feeds，则尝试重新加载
          loadFeeds()
        }
      }
    }, 500)
  }
})

// 方法 - 使用store中的方法
const loadFeeds = async () => {
  try {
    console.log('[RssManagement] 尝试加载RSS源数据...')
    await rssStore.loadFeeds()
    
    // 如果loadFeeds成功但出现了与统计数据相关的错误，清除错误
    if (rssStore.error && rssStore.error.includes('统计数据') && rssStore.feeds.length > 0) {
      console.log('[RssManagement] 忽略统计数据错误，因为RSS源已成功加载')
      rssStore.error = null
    }
    
    // 加载成功后重置重试计数
    retryCount.value = 0
  } catch (err) {
    console.error('[RssManagement] RSS源加载失败:', err)
    // 如果加载失败且未超过最大重试次数，则自动重试
    if (retryCount.value < maxRetries) {
      retryCount.value++
      console.log(`[RssManagement] RSS源加载失败，${retryDelay}ms后自动重试(${retryCount.value}/${maxRetries})`)
      
      // 显示加载中的提示
      showToastNotification(`加载失败，正在自动重试(${retryCount.value}/${maxRetries})...`, 'info', retryDelay - 500)
      
      setTimeout(() => {
        loadFeeds() // 递归调用自身进行重试
      }, retryDelay)
    }
  }
}

const refreshAllFeeds = async () => {
  await rssStore.refreshAll()
}

const refreshFeed = async (feedId: string) => {
  const result = await rssStore.refreshSingleFeed(feedId)
  
  if (result && result.success) {
    console.log(`刷新成功: ${result.message}`)
    showToastNotification(result.message || '刷新成功', 'success')
  } else if (result) {
    console.error(`刷新失败: ${result.message || result.error}`)
    showToastNotification(result.message || result.error || '刷新失败', 'error')
  }
}

// Toast通知辅助函数
const showToastNotification = (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  
  // 3秒后自动隐藏
  setTimeout(() => {
    showToast.value = false
  }, duration)
}

const openAddModal = () => {
  // 重置表单
  Object.assign(newFeed, {
    url: '',
    title: '',
    category: '',
    priority: 'normal'
  })
  rssStore.openAddFeedModal()
}

const closeAddModal = () => {
  rssStore.closeAddFeedModal()
}

const handleRsshubSourceAdded = (source: any) => {
  // 关闭添加模态框
  closeAddModal()
  
  // 显示成功提示
  showToastNotification(`成功添加RSSHub源: ${source.name}`, 'success')
  
  // 刷新列表
  loadFeeds()
}

const openEditModal = (feed: any) => {
  Object.assign(editingFeed, {
    id: feed.id,
    url: feed.url,
    title: feed.name,
    category: feed.category || '',
    priority: feed.priority,
    isEnabled: feed.isEnabled
  })
  rssStore.openEditFeedModal(feed)
}

const closeEditModal = () => {
  rssStore.closeEditFeedModal()
}

const handleEditFeed = async () => {
  const result = await rssStore.updateFeedData(editingFeed.id, {
    name: editingFeed.title,
    url: editingFeed.url,
    category: editingFeed.category as any,
    description: '',
    isEnabled: editingFeed.isEnabled
  }, { closeModal: true })
  
  if (result) {
    showToastNotification('RSS源更新成功', 'success')
  } else {
    showToastNotification('RSS源更新失败', 'error')
  }
}

const toggleFeedStatus = async (feed: any) => {
  console.log(`[前端] 准备切换RSS源状态:`, {
    feedId: feed.id,
    feedName: feed.name,
    currentStatus: feed.isEnabled
  })
  
  const result = await rssStore.toggleFeedStatus(feed.id)
  
  console.log(`[前端] RSS源状态切换结果:`, result)
  
  if (result && result.success) {
    console.log(`[前端] 状态切换成功: ${result.message}`)
    showToastNotification(result.message || '状态切换成功', 'success')
  } else if (result) {
    console.error(`[前端] 状态切换失败: ${result.message || result.error}`)
    showToastNotification(result.message || result.error || '状态切换失败', 'error')
  }
}

const confirmDeleteFeed = (feed: any) => {
  feedToDelete.value = feed
  showConfirmModal.value = true
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
  feedToDelete.value = null
}

const handleDeleteFeed = async () => {
  if (!feedToDelete.value) return
  
  try {
    // 显示加载状态
    showToastNotification('正在删除RSS源及其所有文章...', 'info', 5000)
    
    // 调用删除方法
    const success = await rssStore.removeFeed(feedToDelete.value.id)
    
    if (success) {
      showToastNotification(
        `RSS源 "${feedToDelete.value.name}" 及其所有文章已成功删除`, 
        'success'
      )
      
      // 刷新统计数据
      await rssStore.loadStats()
    } else {
      showToastNotification('删除RSS源失败，请稍后重试', 'error')
    }
  } catch (error: any) {
    console.error('删除RSS源时发生错误:', error)
    showToastNotification(
      error.message || '删除RSS源时发生错误，请稍后重试', 
      'error'
    )
  } finally {
    closeConfirmModal()
  }
}

const handleImportExport = () => {
  console.log('导入/导出RSS源')
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// 工具函数
const getStatusClass = (feed: any) => {
  return {
    'status-active': feed.status === 'active',
    'status-disabled': feed.status === 'disabled' || feed.status === 'paused',
    'status-error': feed.status === 'error',
    'status-updating': feed.status === 'updating'
  }
}

const getCategoryName = (categoryId: string) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.name || '未分类'
}

const getPriorityText = (priority: string) => {
  const priorityMap: Record<string, string> = {
    low: '低',
    normal: '普通',
    high: '高'
  }
  return priorityMap[priority] || '普通'
}

const formatLastUpdate = (dateString?: string, status?: string) => {
  if (status === 'updating') return '刷新中...'
  if (!dateString) return '未更新'
  
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    return `${days}天前`
  }
}

// 在组件挂载前重置错误状态
onBeforeMount(() => {
  // 确保在进入页面时不显示先前的错误状态
  rssStore.error = null
  console.log('[RssManagement] 组件挂载前重置错误状态')
})

// 生命周期
onMounted(() => {
  console.log('[RssManagement] 组件挂载，准备初始化RSS数据')
  
  // 修改初始化逻辑，提高稳定性
  rssStore.initializeRss()
    .then(() => {
      console.log('[RssManagement] RSS数据初始化成功')
      retryCount.value = 0 // 确保重置重试计数
    })
    .catch(error => {
      console.error('[RssManagement] RSS初始化失败，错误原因:', error)
      
      // 区分错误类型
      if (error.message && error.message.includes('统计数据')) {
        console.warn('[RssManagement] 仅统计数据加载失败，不影响主要功能')
        // 清除可能的错误状态，因为统计数据不是必需的
        rssStore.error = null
      } else {
        // 如果是其他错误，尝试直接加载feeds数据
        loadFeeds()
      }
    })
  
  // 无论初始化是否成功，都额外调用loadFeeds确保数据加载
  // 这可以解决从其他页面跳转时的加载问题
  setTimeout(() => {
    if (rssStore.error || rssStore.feeds.length === 0) {
      console.log('[RssManagement] 预防性加载RSS数据...')
      loadFeeds()
    }
  }, 100) // 短暂延迟，确保初始化有时间完成
})
</script>

<style lang="scss" scoped>
.rss-management-container {
  min-height: 100vh;
  background: var(--bg-primary);
}

// 页面头部
.page-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: calc(var(--spacing-unit) * 6) 0;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 calc(var(--spacing-unit) * 6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-section {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 calc(var(--spacing-unit) * 2) 0;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);

  i {
    color: var(--primary-color);
  }
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: calc(var(--spacing-unit) * 3);
}

// 主要内容区域
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: calc(var(--spacing-unit) * 6);
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: calc(var(--spacing-unit) * 8);
}

// 侧边栏
.sidebar {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-l);
  padding: calc(var(--spacing-unit) * 6);
  height: fit-content;
  position: sticky;
  top: calc(var(--spacing-unit) * 6);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 calc(var(--spacing-unit) * 4) 0;
}

// 统计信息
.stats-section {
  margin-bottom: calc(var(--spacing-unit) * 8);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(var(--spacing-unit) * 3);
}

.stat-item {
  text-align: center;
  padding: calc(var(--spacing-unit) * 3);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: calc(var(--spacing-unit) * 1);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// 筛选区域
.filter-section {
  margin-bottom: calc(var(--spacing-unit) * 6);

  &:last-child {
    margin-bottom: 0;
  }
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 1);
}

.filter-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  padding: calc(var(--spacing-unit) * 3);
  background: transparent;
  border: none;
  border-radius: var(--border-radius-m);
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-duration);
  text-align: left;
  width: 100%;

  &:hover {
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  &.active {
    background: var(--primary-color-light);
    color: var(--primary-color);
    font-weight: 500;
  }

  i {
    width: 16px;
    text-align: center;
  }
}

.filter-name {
  flex: 1;
}

.filter-count {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  border-radius: calc(var(--border-radius-s) * 2);
  min-width: 20px;
  text-align: center;

  .filter-item.active & {
    background: var(--primary-color);
    color: white;
  }
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  
  &.status-active {
    background-color: #10B981;
  }
  
  &.status-disabled {
    background-color: #6B6B70;
  }
  
  &.status-error {
    background-color: #EF4444;
  }
  
  &.status-updating {
    background-color: #F59E0B;
    animation: statusPulse 1.5s ease-in-out infinite;
  }
}

@keyframes statusPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

// 内容区域
.content-area {
  min-height: 600px;
}

// 工具栏
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--spacing-unit) * 4);
  margin-bottom: calc(var(--spacing-unit) * 6);
  padding: calc(var(--spacing-unit) * 4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-l);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 4);
  flex: 1;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 4);
}

// 搜索框
.search-box {
  position: relative;
  width: 300px;

  i {
    position: absolute;
    left: calc(var(--spacing-unit) * 3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-disabled);
    font-size: 0.875rem;
  }
}

.search-input {
  width: 100%;
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 10) calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 8);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all var(--transition-duration);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-color-light);
  }

  &::placeholder {
    color: var(--text-disabled);
  }
}

.clear-search {
  position: absolute;
  right: calc(var(--spacing-unit) * 3);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-disabled);
  cursor: pointer;
  padding: calc(var(--spacing-unit) * 1);
  border-radius: var(--border-radius-s);
  transition: all var(--transition-duration);

  &:hover {
    color: var(--text-secondary);
    background: var(--bg-tertiary);
  }
}

// 排序选择
.sort-dropdown {
  padding: calc(var(--spacing-unit) * 3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  min-width: 140px;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
}

// 视图切换
.view-toggle {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  overflow: hidden;
}

.view-btn {
  padding: calc(var(--spacing-unit) * 3);
  background: var(--bg-primary);
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-duration);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  &.active {
    background: var(--primary-color);
    color: white;
  }

  &:not(:last-child) {
    border-right: 1px solid var(--border-color);
  }
}

// 批量操作
.bulk-actions {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
}

.selected-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

// 响应式设计
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 240px 1fr;
    gap: calc(var(--spacing-unit) * 6);
  }
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: calc(var(--spacing-unit) * 6);
  }

  .sidebar {
    position: static;
    order: 2;
  }

  .content-area {
    order: 1;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: calc(var(--spacing-unit) * 4);
    text-align: center;
  }

  .header-actions {
    justify-content: center;
  }

  .main-content {
    padding: calc(var(--spacing-unit) * 4);
  }

  .toolbar {
    flex-direction: column;
    gap: calc(var(--spacing-unit) * 4);
  }

  .toolbar-left {
    flex-direction: column;
    width: 100%;
  }

  .search-box {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: calc(var(--spacing-unit) * 2);
  }

  .stat-item {
    padding: calc(var(--spacing-unit) * 2);
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.625rem;
  }
}
.rss-management-container {
  padding: calc(var(--spacing-unit) * 6) calc(var(--spacing-unit) * 8);
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--color-bg-primary);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: calc(var(--spacing-unit) * 8);
}

.title-section {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 calc(var(--spacing-unit) * 1) 0;
}

.page-subtitle {
  color: var(--color-text-secondary);
  font-size: 16px;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: calc(var(--spacing-unit) * 3);
  margin-left: calc(var(--spacing-unit) * 6);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 4);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--border-radius-s);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  text-decoration: none;
  gap: calc(var(--spacing-unit) * 2);
}

.btn-primary {
  background-color: var(--color-accent-primary);
  color: white;
  border-color: var(--color-accent-primary);
}

.btn-primary:hover {
  background-color: #6B46C1;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background-color: var(--color-text-disabled);
  color: white;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-color: var(--color-border-primary);
}

.btn-secondary:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border-secondary);
}

.btn-danger {
  background-color: #DC2626;
  color: white;
  border-color: #DC2626;
}

.btn-danger:hover {
  background-color: #B91C1C;
}

.btn-danger:disabled {
  background-color: var(--color-text-disabled);
  cursor: not-allowed;
}

.filters-section {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 6);
  margin-bottom: calc(var(--spacing-unit) * 6);
}

.filters-row {
  display: flex;
  gap: calc(var(--spacing-unit) * 4);
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 180px;
}

.filter-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: calc(var(--spacing-unit) * 1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-input {
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color var(--transition-speed-fast);
}

.filter-input:focus {
  border-color: var(--color-accent-primary);
}

.filter-input::placeholder {
  color: var(--color-text-disabled);
}

.filter-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B6B70' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right calc(var(--spacing-unit) * 2) center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  padding-right: calc(var(--spacing-unit) * 8);
}

.filter-actions {
  margin-left: auto;
}

// 状态样式
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: calc(var(--spacing-unit) * 12) calc(var(--spacing-unit) * 6);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border-primary);
  border-top: 3px solid var(--color-accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: calc(var(--spacing-unit) * 4);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 48px;
  color: var(--color-text-disabled);
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.error-state h3,
.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 calc(var(--spacing-unit) * 2) 0;
}

.error-state p,
.empty-state p,
.loading-state p {
  color: var(--color-text-secondary);
  margin: 0 0 calc(var(--spacing-unit) * 4) 0;
}

// RSS源卡片网格
.feeds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: calc(var(--spacing-unit) * 6);
}

.feed-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 6);
  transition: all var(--transition-speed-fast);
  position: relative;
}

.feed-card:hover {
  border-color: var(--color-border-secondary);
  transform: translateY(-2px);
}

.feed-card.feed-disabled {
  opacity: 0.6;
}

.feed-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.feed-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-s);
  background-color: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: calc(var(--spacing-unit) * 4);
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  i {
    color: var(--color-accent-primary);
    font-size: 20px;
  }
}

.feed-info {
  flex: 1;
  min-width: 0;
}

.feed-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 calc(var(--spacing-unit) * 1) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-url {
  font-size: 12px;
  color: var(--color-text-disabled);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-status {
  display: flex;
  align-items: center;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  
  &.status-active {
    background-color: #10B981;
  }
  
  &.status-disabled {
    background-color: #6B6B70;
  }
  
  &.status-error {
    background-color: #EF4444;
  }
  
  &.status-updating {
    background-color: #F59E0B;
    animation: statusPulse 1.5s ease-in-out infinite;
  }
}

@keyframes statusPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.feed-content {
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.feed-description {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0 0 calc(var(--spacing-unit) * 4) 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feed-stats {
  display: flex;
  gap: calc(var(--spacing-unit) * 4);
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1);
  font-size: 11px;
  color: var(--color-text-disabled);
  
  i {
    width: 12px;
    text-align: center;
  }
}

.feed-tags {
  display: flex;
  gap: calc(var(--spacing-unit) * 2);
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  font-size: 10px;
  font-weight: 500;
  border-radius: calc(var(--border-radius-s) * 2);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.category-tag {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
}

.priority-tag {
  &.priority-high {
    background-color: rgba(239, 68, 68, 0.1);
    color: #EF4444;
  }
  
  &.priority-normal {
    background-color: rgba(16, 185, 129, 0.1);
    color: #10B981;
  }
  
  &.priority-low {
    background-color: rgba(107, 107, 112, 0.1);
    color: var(--color-text-disabled);
  }
}

.status-tag {
  &.disabled {
    background-color: rgba(107, 107, 112, 0.1);
    color: var(--color-text-disabled);
  }
  
  &.enabled {
    background-color: rgba(16, 185, 129, 0.1);
    color: #10B981;
  }
  
  &.toggling {
    background-color: rgba(245, 158, 11, 0.1);
    color: #F59E0B;
    animation: tagPulse 1.2s ease-in-out infinite;
  }
}

@keyframes tagPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.feed-actions {
  display: flex;
  gap: calc(var(--spacing-unit) * 2);
  justify-content: flex-end;
}

.action-btn {
  width: 32px;
  height: 32px;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  color: var(--color-text-secondary);
  
  &:hover {
    background-color: var(--color-bg-hover);
    border-color: var(--color-border-secondary);
    color: var(--color-text-primary);
  }
  
  &.danger {
    &:hover {
      background-color: rgba(239, 68, 68, 0.1);
      border-color: #EF4444;
      color: #EF4444;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// 模态框样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--spacing-unit) * 6);
  border-bottom: 1px solid var(--color-border-primary);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  
  &.text-danger {
    color: #EF4444;
  }
}

.close-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

.modal-body {
  padding: 0 calc(var(--spacing-unit) * 5) calc(var(--spacing-unit) * 5) calc(var(--spacing-unit) * 5);
  flex: 1;
  overflow-y: auto;
}

.rsshub-info {
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 3);
  margin-bottom: calc(var(--spacing-unit) * 4);
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.form-group {
  margin-bottom: calc(var(--spacing-unit) * 4);
  
  label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: calc(var(--spacing-unit) * 1);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  input,
  select {
    width: 100%;
    padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
    background-color: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius-s);
    color: var(--color-text-primary);
    font-size: 14px;
    outline: none;
    transition: border-color var(--transition-speed-fast);
    
    &:focus {
      border-color: var(--color-accent-primary);
    }
    
    &::placeholder {
      color: var(--color-text-disabled);
    }
  }
  
  select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B6B70' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right calc(var(--spacing-unit) * 2) center;
    background-repeat: no-repeat;
    background-size: 16px 12px;
    padding-right: calc(var(--spacing-unit) * 8);
  }
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  cursor: pointer;
  text-transform: none !important;
  letter-spacing: normal !important;
  font-size: 14px !important;
  margin-bottom: 0 !important;
  
  input[type="checkbox"] {
    width: auto !important;
    margin: 0 !important;
  }
}

.modal-footer {
  display: flex;
  gap: calc(var(--spacing-unit) * 3);
  justify-content: flex-end;
  padding: calc(var(--spacing-unit) * 6);
  border-top: 1px solid var(--color-border-primary);
}

// 确认模态框特殊样式
.confirm-content {
  display: flex;
  gap: calc(var(--spacing-unit) * 4);
  align-items: flex-start;
}

.confirm-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &.icon-danger {
    background-color: rgba(239, 68, 68, 0.1);
    color: #EF4444;
  }
  
  i {
    font-size: 20px;
  }
}

.confirm-message {
  flex: 1;
  
  .main-message {
    margin: 0 0 calc(var(--spacing-unit) * 4) 0;
    color: var(--color-text-primary);
    font-size: 16px;
    font-weight: 500;
  }
  
  .warning-details {
    background: rgba(239, 68, 68, 0.05);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: var(--border-radius-m);
    padding: calc(var(--spacing-unit) * 4);
    
    .warning-text {
      margin: 0 0 calc(var(--spacing-unit) * 3) 0;
      color: #EF4444;
      font-size: 14px;
      font-weight: 500;
    }
    
    .warning-list {
      margin: 0;
      padding-left: calc(var(--spacing-unit) * 5);
      list-style: none;
      
      li {
        position: relative;
        margin-bottom: calc(var(--spacing-unit) * 2);
        color: var(--color-text-secondary);
        font-size: 13px;
        line-height: 1.4;
        
        &:before {
          content: '•';
          position: absolute;
          left: calc(var(--spacing-unit) * -4);
          color: #EF4444;
          font-weight: bold;
        }
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
  
  p {
    margin: 0 0 calc(var(--spacing-unit) * 2) 0;
    color: var(--color-text-primary);
    
    &.warning-text {
      color: var(--color-text-secondary);
      font-size: 13px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .rss-management-container {
    padding: calc(var(--spacing-unit) * 4);
  }
  
  .page-header {
    flex-direction: column;
    gap: calc(var(--spacing-unit) * 4);
    align-items: stretch;
  }
  
  .header-actions {
    margin-left: 0;
    justify-content: center;
  }
  
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    min-width: auto;
  }
  
  .filter-actions {
    margin-left: 0;
  }
  
  .feeds-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-container {
    width: 95%;
    margin: calc(var(--spacing-unit) * 4);
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