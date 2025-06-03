<template>
  <!-- RSS源卡片 -->
  <div 
    class="feed-card"
    :class="{ 'is-updating': feed.status === 'updating' }"
    @click="handleCardClick"
  >
    <!-- 状态指示器 -->
    <div 
      class="feed-status" 
      :class="feed.status"
      :title="getStatusText(feed.status)"
    />

    <!-- 卡片操作按钮 -->
    <div class="feed-actions">
      <div class="action-dropdown">
        <button 
          class="action-trigger"
          @click.stop="handleActionsClick"
          :title="'操作菜单'"
        >
          <i class="fas fa-ellipsis-v"></i>
        </button>
        
        <!-- 操作菜单 -->
        <div 
          v-if="showActionsMenu" 
          class="actions-menu"
          @click.stop
        >
          <button 
            class="action-item"
            @click="handleRefresh"
            :disabled="feed.status === 'updating'"
          >
            <i class="fas fa-sync-alt"></i>
            刷新
          </button>
          <button 
            class="action-item"
            @click="handleEdit"
          >
            <i class="fas fa-edit"></i>
            编辑
          </button>
          <button 
            class="action-item danger"
            @click="handleDelete"
          >
            <i class="fas fa-trash-alt"></i>
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="feed-category" :style="{ '--category-color': getCategoryColor(feed.category) }">
      <i :class="getCategoryIcon(feed.category)"></i>
      {{ getCategoryLabel(feed.category) }}
    </div>

    <!-- 源信息头部 -->
    <div class="feed-header">
      <div class="feed-icon">
        <img 
          v-if="feed.favicon" 
          :src="feed.favicon" 
          :alt="feed.name"
          @error="onImageError"
        >
        <i 
          v-else 
          :class="getDefaultIcon(feed.category)"
        ></i>
      </div>
      
      <div class="feed-info">
        <h3 class="feed-name" :title="feed.name">
          {{ feed.name }}
        </h3>
        <p class="feed-url" :title="feed.url">
          {{ feed.url }}
        </p>
        
        <!-- 优先级指示器 -->
        <div class="feed-priority" v-if="feed.priority !== 'medium'">
          <i 
            :class="getPriorityIcon(feed.priority)" 
            :style="{ color: getPriorityColor(feed.priority) }"
          ></i>
          <span>{{ getPriorityText(feed.priority) }}</span>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="feed-stats">
      <div class="stat-item">
        <div class="stat-value">{{ feed.articlesCount }}</div>
        <div class="stat-label">文章</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ feed.unreadCount }}</div>
        <div class="stat-label">未读</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" :title="getLastUpdatedTooltip()">
          {{ getLastUpdatedDisplay() }}
        </div>
        <div class="stat-label">更新</div>
      </div>
    </div>

    <!-- 错误信息（仅在错误状态时显示） -->
    <div v-if="feed.status === 'error' && feed.lastError" class="feed-error">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ feed.lastError }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { RssFeed, FeedStatus, FeedPriority } from '@/api/rss.d'
import { getCategoryInfo } from '@/api/rss.js'

// Props 定义
interface Props {
  feed: RssFeed
}

const props = defineProps<Props>()

// Emits 定义
interface Emits {
  (e: 'refresh', feedId: string): void
  (e: 'edit', feed: RssFeed): void
  (e: 'delete', feedId: string): void
  (e: 'click', feed: RssFeed): void
}

const emit = defineEmits<Emits>()

// 响应式状态
const showActionsMenu = ref(false)

// 计算属性
const getCategoryColor = (category: string) => {
  const categoryInfo = getCategoryInfo(category)
  return categoryInfo.color
}

const getCategoryLabel = (category: string) => {
  const categoryInfo = getCategoryInfo(category)
  return categoryInfo.label
}

const getCategoryIcon = (category: string) => {
  const categoryInfo = getCategoryInfo(category)
  return categoryInfo.icon
}

// 状态相关方法
const getStatusText = (status: FeedStatus) => {
  const statusMap: Record<FeedStatus, string> = {
    active: '正常运行',
    error: '连接错误',
    updating: '更新中',
    paused: '已暂停'
  }
  return statusMap[status] || '未知状态'
}

// 优先级相关方法
const getPriorityIcon = (priority: FeedPriority) => {
  const priorityMap: Record<FeedPriority, string> = {
    high: 'fas fa-arrow-up',
    medium: 'fas fa-minus',
    low: 'fas fa-arrow-down'
  }
  return priorityMap[priority] || 'fas fa-minus'
}

const getPriorityColor = (priority: FeedPriority) => {
  const priorityColors: Record<FeedPriority, string> = {
    high: '#EF4444',
    medium: '#6B7280',
    low: '#10B981'
  }
  return priorityColors[priority] || '#6B7280'
}

const getPriorityText = (priority: FeedPriority) => {
  const priorityTexts: Record<FeedPriority, string> = {
    high: '高优先级',
    medium: '普通',
    low: '低优先级'
  }
  return priorityTexts[priority] || '普通'
}

// 默认图标
const getDefaultIcon = (category: string) => {
  const categoryInfo = getCategoryInfo(category)
  return categoryInfo.icon
}

// 时间格式化
const getLastUpdatedDisplay = () => {
  if (props.feed.status === 'updating') {
    return '更新中'
  }
  
  if (props.feed.status === 'error') {
    return '错误'
  }
  
  return formatTimeAgo(props.feed.lastUpdated)
}

const getLastUpdatedTooltip = () => {
  return new Date(props.feed.lastUpdated).toLocaleString('zh-CN')
}

const formatTimeAgo = (timestamp: string) => {
  const now = new Date()
  const date = new Date(timestamp)
  const diff = now.getTime() - date.getTime()
  
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

// 事件处理
const handleCardClick = () => {
  if (!showActionsMenu.value) {
    emit('click', props.feed)
  }
}

const handleActionsClick = () => {
  showActionsMenu.value = !showActionsMenu.value
}

const handleRefresh = () => {
  emit('refresh', props.feed.id)
  showActionsMenu.value = false
}

const handleEdit = () => {
  emit('edit', props.feed)
  showActionsMenu.value = false
}

const handleDelete = () => {
  emit('delete', props.feed.id)
  showActionsMenu.value = false
}

const onImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
  const iconElement = target.nextElementSibling as HTMLElement
  if (iconElement) {
    iconElement.style.display = 'flex'
  }
}

// 点击外部关闭菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.action-dropdown')) {
    showActionsMenu.value = false
  }
}

// 生命周期钩子
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.feed-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 6);
  position: relative;
  cursor: pointer;
  transition: all var(--transition-duration) var(--transition-timing);
  overflow: hidden;

  &:hover {
    border-color: var(--border-color-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);

    .feed-actions {
      opacity: 1;
    }
  }

  &.is-updating {
    .feed-status.updating {
      animation: pulse 2s infinite;
    }
  }
}

// 状态指示器
.feed-status {
  position: absolute;
  top: calc(var(--spacing-unit) * 4);
  left: calc(var(--spacing-unit) * 4);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  z-index: 1;

  &.active {
    background-color: #22C55E;
  }

  &.error {
    background-color: #EF4444;
  }

  &.updating {
    background-color: #F59E0B;
  }

  &.paused {
    background-color: #6B7280;
  }
}

// 操作按钮
.feed-actions {
  position: absolute;
  top: calc(var(--spacing-unit) * 4);
  right: calc(var(--spacing-unit) * 4);
  opacity: 0;
  transition: opacity var(--transition-duration) var(--transition-timing);
  z-index: 10;
}

.action-dropdown {
  position: relative;
}

.action-trigger {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  padding: calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius-s);
  cursor: pointer;
  transition: all var(--transition-duration) var(--transition-timing);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: var(--text-primary);
    transform: scale(1.05);
  }
}

.actions-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: calc(var(--spacing-unit) * 2);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-m);
  box-shadow: var(--shadow-xl);
  min-width: 120px;
  padding: calc(var(--spacing-unit) * 2);
  z-index: 100;

  [data-theme="dark"] & {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.action-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  width: 100%;
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.875rem;
  border-radius: var(--border-radius-s);
  cursor: pointer;
  transition: all var(--transition-duration) var(--transition-timing);
  text-align: left;

  &:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
    transform: translateX(2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.danger {
    color: var(--danger-color);

    &:hover {
      background: var(--danger-bg);
      color: var(--danger-color);
    }
  }

  i {
    width: 14px;
    text-align: center;
  }
}

// 分类标签
.feed-category {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1);
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  background-color: color-mix(in srgb, var(--category-color) 15%, transparent);
  color: var(--category-color);
  border-radius: calc(var(--border-radius-s) * 3);
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: calc(var(--spacing-unit) * 3);
  border: 1px solid color-mix(in srgb, var(--category-color) 30%, transparent);

  i {
    font-size: 0.7rem;
  }
}

// 源信息头部
.feed-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: calc(var(--spacing-unit) * 4);
  gap: calc(var(--spacing-unit) * 4);
}

.feed-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-s);
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  i {
    color: var(--text-secondary);
    font-size: 1.25rem;
  }
}

.feed-info {
  flex: 1;
  min-width: 0;
}

.feed-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 calc(var(--spacing-unit) * 1) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-url {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 calc(var(--spacing-unit) * 2) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-priority {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1);
  font-size: 0.7rem;
  color: var(--text-secondary);

  i {
    font-size: 0.6rem;
  }
}

// 统计信息
.feed-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: calc(var(--spacing-unit) * 4);
  padding-top: calc(var(--spacing-unit) * 4);
  border-top: 1px solid var(--border-color);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: calc(var(--spacing-unit) * 1);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

// 错误信息
.feed-error {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  margin-top: calc(var(--spacing-unit) * 3);
  padding: calc(var(--spacing-unit) * 2);
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  border-radius: var(--border-radius-s);
  font-size: 0.75rem;
  color: var(--danger-color);

  i {
    font-size: 0.7rem;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// 动画
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .feed-card {
    padding: calc(var(--spacing-unit) * 4);
  }

  .feed-header {
    gap: calc(var(--spacing-unit) * 3);
  }

  .feed-icon {
    width: 40px;
    height: 40px;
  }

  .feed-name {
    font-size: 0.9rem;
  }

  .feed-stats {
    padding-top: calc(var(--spacing-unit) * 3);
    margin-top: calc(var(--spacing-unit) * 3);
  }

  .stat-value {
    font-size: 1rem;
  }
}
</style> 