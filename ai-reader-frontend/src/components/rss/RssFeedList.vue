<template>
  <div class="rss-feed-list">
    <!-- 加载状态 -->
    <div v-if="isLoading && feeds.length === 0" class="loading-state">
      <div class="loading-grid">
        <div 
          v-for="n in 6" 
          :key="`skeleton-${n}`"
          class="feed-card-skeleton"
        >
          <div class="skeleton-header">
            <div class="skeleton-status"></div>
            <div class="skeleton-icon"></div>
            <div class="skeleton-info">
              <div class="skeleton-title"></div>
              <div class="skeleton-url"></div>
            </div>
          </div>
          <div class="skeleton-stats">
            <div class="skeleton-stat"></div>
            <div class="skeleton-stat"></div>
            <div class="skeleton-stat"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- RSS源列表 -->
    <div v-else-if="feeds.length > 0" class="feeds-grid">
      <RssFeedCard
        v-for="(feed, index) in feeds"
        :key="feed.id"
        :feed="feed"
        :style="{ 
          '--animation-delay': `${index * 0.1}s`,
          'animation-delay': `${index * 0.1}s`
        }"
        class="feed-card-item"
        @refresh="handleRefresh"
        @edit="handleEdit"
        @delete="handleDelete"
        @click="handleCardClick"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-rss"></i>
      </div>
      <h3 class="empty-title">暂无RSS源</h3>
      <p class="empty-description">
        开始添加您感兴趣的RSS源，建立您的个人信息流
      </p>
      <button 
        class="btn btn-primary"
        @click="handleAddFeed"
      >
        <i class="fas fa-plus"></i>
        添加第一个RSS源
      </button>
    </div>

    <!-- 加载更多 -->
    <div 
      v-if="hasMore && feeds.length > 0" 
      class="load-more-section"
    >
      <button 
        v-if="!isLoadingMore"
        class="btn btn-secondary load-more-btn"
        @click="handleLoadMore"
      >
        <i class="fas fa-arrow-down"></i>
        加载更多
      </button>
      
      <div v-else class="loading-more">
        <i class="fas fa-spinner fa-spin"></i>
        <span>加载中...</span>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div 
      v-if="selectedFeeds.size > 0" 
      class="bulk-actions-bar"
    >
      <div class="bulk-info">
        <span>已选择 {{ selectedFeeds.size }} 个RSS源</span>
      </div>
      
      <div class="bulk-buttons">
        <button 
          class="btn btn-secondary"
          @click="handleBulkRefresh"
          :disabled="isBulkOperating"
        >
          <i class="fas fa-sync-alt"></i>
          批量刷新
        </button>
        
        <button 
          class="btn btn-secondary"
          @click="handleBulkEdit"
          :disabled="isBulkOperating"
        >
          <i class="fas fa-edit"></i>
          批量编辑
        </button>
        
        <button 
          class="btn btn-danger"
          @click="handleBulkDelete"
          :disabled="isBulkOperating"
        >
          <i class="fas fa-trash-alt"></i>
          批量删除
        </button>
        
        <button 
          class="btn btn-ghost"
          @click="handleClearSelection"
        >
          <i class="fas fa-times"></i>
          取消选择
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RssFeed } from '@/api/rss.d'
import RssFeedCard from './RssFeedCard.vue'

// Props 定义
interface Props {
  feeds: RssFeed[]
  isLoading?: boolean
  isLoadingMore?: boolean
  isBulkOperating?: boolean
  hasMore?: boolean
  selectedFeeds?: Set<string>
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  isLoadingMore: false,
  isBulkOperating: false,
  hasMore: false,
  selectedFeeds: () => new Set()
})

// Emits 定义
interface Emits {
  (e: 'refresh', feedId: string): void
  (e: 'edit', feed: RssFeed): void
  (e: 'delete', feedId: string): void
  (e: 'click', feed: RssFeed): void
  (e: 'add-feed'): void
  (e: 'load-more'): void
  (e: 'bulk-refresh', feedIds: string[]): void
  (e: 'bulk-edit', feedIds: string[]): void
  (e: 'bulk-delete', feedIds: string[]): void
  (e: 'clear-selection'): void
}

const emit = defineEmits<Emits>()

// 计算属性
const selectedFeedIds = computed(() => Array.from(props.selectedFeeds))

// 事件处理
const handleRefresh = (feedId: string) => {
  emit('refresh', feedId)
}

const handleEdit = (feed: RssFeed) => {
  emit('edit', feed)
}

const handleDelete = (feedId: string) => {
  emit('delete', feedId)
}

const handleCardClick = (feed: RssFeed) => {
  emit('click', feed)
}

const handleAddFeed = () => {
  emit('add-feed')
}

const handleLoadMore = () => {
  emit('load-more')
}

const handleBulkRefresh = () => {
  emit('bulk-refresh', selectedFeedIds.value)
}

const handleBulkEdit = () => {
  emit('bulk-edit', selectedFeedIds.value)
}

const handleBulkDelete = () => {
  emit('bulk-delete', selectedFeedIds.value)
}

const handleClearSelection = () => {
  emit('clear-selection')
}
</script>

<style lang="scss" scoped>
.rss-feed-list {
  position: relative;
}

// RSS源网格布局
.feeds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: calc(var(--spacing-unit) * 6);
  padding: calc(var(--spacing-unit) * 2) 0;
}

// 卡片动画
.feed-card-item {
  opacity: 0;
  transform: translateY(20px);
  animation: itemFadeInUp 0.6s ease-out forwards;
}

@keyframes itemFadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 加载状态
.loading-state {
  padding: calc(var(--spacing-unit) * 4) 0;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: calc(var(--spacing-unit) * 6);
}

.feed-card-skeleton {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 6);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-header {
  display: flex;
  align-items: flex-start;
  gap: calc(var(--spacing-unit) * 4);
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.skeleton-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--bg-tertiary);
  margin-top: calc(var(--spacing-unit) * 2);
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-s);
  background-color: var(--bg-tertiary);
  flex-shrink: 0;
}

.skeleton-info {
  flex: 1;
}

.skeleton-title {
  height: 20px;
  background-color: var(--bg-tertiary);
  border-radius: var(--border-radius-s);
  margin-bottom: calc(var(--spacing-unit) * 2);
  width: 70%;
}

.skeleton-url {
  height: 14px;
  background-color: var(--bg-tertiary);
  border-radius: var(--border-radius-s);
  width: 90%;
}

.skeleton-stats {
  display: flex;
  justify-content: space-between;
  gap: calc(var(--spacing-unit) * 4);
  padding-top: calc(var(--spacing-unit) * 4);
  border-top: 1px solid var(--border-color);
}

.skeleton-stat {
  text-align: center;
  flex: 1;
  
  &::before {
    content: '';
    display: block;
    height: 24px;
    background-color: var(--bg-tertiary);
    border-radius: var(--border-radius-s);
    margin-bottom: calc(var(--spacing-unit) * 2);
  }
  
  &::after {
    content: '';
    display: block;
    height: 12px;
    background-color: var(--bg-tertiary);
    border-radius: var(--border-radius-s);
    width: 60%;
    margin: 0 auto;
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: calc(var(--spacing-unit) * 16) calc(var(--spacing-unit) * 8);
  color: var(--text-secondary);
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto calc(var(--spacing-unit) * 6);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  i {
    font-size: 2rem;
    color: var(--text-disabled);
  }
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 calc(var(--spacing-unit) * 3) 0;
}

.empty-description {
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 calc(var(--spacing-unit) * 8) 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

// 加载更多
.load-more-section {
  text-align: center;
  padding: calc(var(--spacing-unit) * 8) 0;
}

.load-more-btn {
  min-width: 120px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing-unit) * 2);
  color: var(--text-secondary);
  font-size: 0.875rem;

  i {
    color: var(--primary-color);
  }
}

// 批量操作栏
.bulk-actions-bar {
  position: fixed;
  bottom: calc(var(--spacing-unit) * 6);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: calc(var(--border-radius-l) * 2);
  padding: calc(var(--spacing-unit) * 4) calc(var(--spacing-unit) * 6);
  box-shadow: var(--shadow-xl);
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 6);
  z-index: 50;
  animation: slideUpFromBottom 0.3s ease-out;

  [data-theme="dark"] & {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.bulk-info {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}

.bulk-buttons {
  display: flex;
  gap: calc(var(--spacing-unit) * 2);
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

@keyframes slideUpFromBottom {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .feeds-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: calc(var(--spacing-unit) * 4);
  }
}

@media (max-width: 768px) {
  .feeds-grid {
    grid-template-columns: 1fr;
    gap: calc(var(--spacing-unit) * 4);
  }

  .empty-state {
    padding: calc(var(--spacing-unit) * 12) calc(var(--spacing-unit) * 4);
  }

  .empty-icon {
    width: 60px;
    height: 60px;

    i {
      font-size: 1.5rem;
    }
  }

  .empty-title {
    font-size: 1.25rem;
  }

  .bulk-actions-bar {
    left: calc(var(--spacing-unit) * 4);
    right: calc(var(--spacing-unit) * 4);
    transform: none;
    flex-direction: column;
    gap: calc(var(--spacing-unit) * 3);
    padding: calc(var(--spacing-unit) * 3);
  }

  .bulk-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style> 