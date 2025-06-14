<template>
  <div class="collection-item" :class="{ 'list-view': viewMode === 'list' }">
    <!-- 网格视图内容 -->
    <template v-if="viewMode === 'grid'">
      <div class="item-header">
        <span class="item-type">
          <i :class="item.type === 'article' ? 'fas fa-newspaper' : 'fas fa-sticky-note'"></i>
          {{ item.type === 'article' ? '文章' : '笔记' }}
        </span>
        <div class="item-actions">
          <button 
            class="item-action-btn" 
            @click="$emit('share', item)"
            title="分享"
          >
            <i class="fas fa-share-alt"></i>
          </button>
          <button 
            class="item-action-btn" 
            @click="$emit('edit', item)"
            title="编辑"
          >
            <i class="fas fa-pen"></i>
          </button>
          <button 
            class="item-action-btn" 
            @click="$emit('remove', item)"
            title="移除"
          >
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
      <h3 class="item-title">{{ item.title }}</h3>
      <p class="item-description">{{ item.description }}</p>
      <div class="item-tags" v-if="item.tags.length > 0">
        <span 
          v-for="tag in item.tags" 
          :key="tag"
          class="item-tag"
        >
          {{ tag }}
        </span>
      </div>
      <div class="item-meta">
        <div class="item-source">
          <div 
            class="source-icon" 
            :style="{ backgroundColor: getSourceColor(item.source) }"
          >
            {{ getSourceInitial(item.source) }}
          </div>
          <span>{{ item.source }}</span>
        </div>
        <span>{{ formatDate(item.collectedAt) }}</span>
      </div>
    </template>
    
    <!-- 列表视图内容 -->
    <template v-else>
      <div class="item-thumbnail-list">
        <div 
          class="source-icon" 
          :style="{ backgroundColor: getSourceColor(item.source) }"
        >
          {{ getSourceInitial(item.source) }}
        </div>
      </div>
      <div class="item-content-list">
        <h3 class="item-title">{{ item.title }}</h3>
        <div class="item-source-list">{{ item.source }}</div>
        <div class="item-date-list">{{ formatDate(item.collectedAt) }}</div>
      </div>
      <div class="item-actions-list">
        <button 
          class="item-action-btn" 
          @click="$emit('share', item)"
          title="分享"
        >
          <i class="fas fa-share-alt"></i>
        </button>
        <button 
          class="item-action-btn" 
          @click="$emit('edit', item)"
          title="编辑"
        >
          <i class="fas fa-pen"></i>
        </button>
        <button 
          class="item-action-btn" 
          @click="$emit('remove', item)"
          title="移除"
        >
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CollectionItem } from '@/api/collections.d'

interface Props {
  item: CollectionItem
  viewMode: 'grid' | 'list'
}

defineProps<Props>()

defineEmits<{
  share: [item: CollectionItem]
  edit: [item: CollectionItem]
  remove: [item: CollectionItem]
}>()

// 工具函数
const getSourceColor = (source: string): string => {
  const colors = [
    '#7B61FF', '#3B82F6', '#10B981', '#F59E0B', 
    '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'
  ]
  let hash = 0
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const getSourceInitial = (source: string): string => {
  return source.charAt(0).toUpperCase()
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '今天'
  if (diffDays === 2) return '昨天'
  if (diffDays <= 7) return `${diffDays}天前`
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}周前`
  if (diffDays <= 365) return `${Math.ceil(diffDays / 30)}个月前`
  return `${Math.ceil(diffDays / 365)}年前`
}
</script>

<style lang="scss" scoped>
.collection-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-color: var(--primary-color);
  }
  
  &.list-view {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    
    &:hover {
      transform: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 4px 8px;
  border-radius: 6px;
  
  i {
    font-size: 12px;
  }
}

.item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  .collection-item:hover & {
    opacity: 1;
  }
}

.item-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: var(--bg-hover);
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--primary-color);
    color: white;
  }
  
  i {
    font-size: 12px;
  }
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.item-tag {
  font-size: 11px;
  color: var(--tag-color);
  background: var(--tag-bg);
  border: 1px solid var(--tag-border);
  padding: 2px 6px;
  border-radius: 8px;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

.item-source {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: 600;
}

// 列表视图样式
.item-thumbnail-list {
  flex-shrink: 0;
  
  .source-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    font-size: 16px;
  }
}

.item-content-list {
  flex: 1;
  min-width: 0;
  
  .item-title {
    font-size: 14px;
    margin-bottom: 4px;
    -webkit-line-clamp: 1;
  }
  
  .item-source-list {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 2px;
  }
  
  .item-date-list {
    font-size: 11px;
    color: var(--text-tertiary);
  }
}

.item-actions-list {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .collection-item {
    padding: 16px;
    
    &.list-view {
      padding: 12px 16px;
    }
  }
  
  .item-title {
    font-size: 14px;
  }
  
  .item-description {
    font-size: 13px;
    -webkit-line-clamp: 2;
  }
}
</style> 