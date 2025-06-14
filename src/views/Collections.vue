<!--
  Collections 收藏管理主页面
  简化版本：只显示收藏内容，移除侧边栏和操作按钮
-->
<template>
  <div class="collections-container">
    <!-- 主内容区域 -->
    <div class="content-area">
      <!-- 内容头部 -->
      <div class="content-header">
        <div>
          <h2 class="content-title-collections">全部收藏</h2>
          <p class="content-subtitle-collections">
            共 {{ currentFolderItemCount }} 项收藏内容
          </p>
        </div>
      </div>
      
      <!-- 搜索和视图控制 -->
      <div class="content-filters">
        <div class="search-box-content">
          <AppIcon :icon="ICONS.NAVIGATION.SEARCH" :size="ICON_SIZES.SM" />
          <input 
            type="text" 
            placeholder="搜索此收藏夹内容..." 
            v-model="searchQuery"
            @input="handleSearch"
          >
        </div>
        
        <div class="view-toggle">
          <button 
            class="view-toggle-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="setViewMode('grid')"
            title="网格视图"
          >
            <AppIcon :icon="ICONS.COLLECTIONS.GRID_VIEW" :size="ICON_SIZES.SM" />
          </button>
          <button 
            class="view-toggle-btn"
            :class="{ active: viewMode === 'list' }"
            @click="setViewMode('list')"
            title="列表视图"
          >
            <AppIcon :icon="ICONS.COLLECTIONS.LIST_VIEW" :size="ICON_SIZES.SM" />
          </button>
        </div>
      </div>
      
      <!-- 主内容区域 -->
      <div class="content-main">
        <!-- 收藏项列表 -->
        <div 
          v-if="filteredItems.length > 0"
          class="items-container"
          :class="{ 'items-grid': viewMode === 'grid', 'items-list': viewMode === 'list' }"
        >
          <div 
            v-for="(item, index) in filteredItems" 
            :key="item.id"
            class="collection-item"
            :class="{ 'list-view': viewMode === 'list', 'loaded': itemsLoaded }"
            :style="{ animationDelay: `${index * 80}ms` }"
            @click="navigateToArticle(item, $event)"
          >
            <!-- 网格视图内容 -->
            <template v-if="viewMode === 'grid'">
              <div class="item-header">
                <span class="item-type">
                  <i :class="getItemType(item) === 'article' ? 'fas fa-newspaper' : 'fas fa-sticky-note'"></i>
                  {{ getItemType(item) === 'article' ? '文章' : '笔记' }}
                </span>
                <div class="item-actions">
                  <button 
                    class="item-action-btn" 
                    @click="shareItem(item)"
                    title="分享"
                  >
                    <i class="fas fa-share-alt"></i>
                  </button>
                  <button 
                    class="item-action-btn" 
                    @click="editItem(item)"
                    title="编辑"
                  >
                    <i class="fas fa-pen"></i>
                  </button>
                  <button 
                    class="item-action-btn" 
                    @click="removeItem(item)"
                    title="移除"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
              <h3 class="item-title-collection">{{ item.title }}</h3>
              <p class="item-description-collection">{{ getItemDescription(item) }}</p>
              <div class="item-tags-collection" v-if="getItemTags(item).length > 0">
                <span 
                  v-for="tag in getItemTags(item)" 
                  :key="tag"
                  class="item-tag-collection"
                >
                  {{ tag }}
                </span>
              </div>
              <div class="item-meta-collection">
                <div class="item-source">
                  <div 
                    class="source-icon" 
                    :style="{ backgroundColor: getSourceColor(getItemSource(item)) }"
                  >
                    {{ getSourceInitial(getItemSource(item)) }}
                  </div>
                  <span>{{ getItemSource(item) }}</span>
                </div>
                <span>{{ formatDate(getItemCollectedAt(item)) }}</span>
              </div>
            </template>
            
            <!-- 列表视图内容 -->
            <template v-else>
              <div class="item-thumbnail-list">
                <div 
                  class="source-icon" 
                  :style="{ backgroundColor: getSourceColor(getItemSource(item)) }"
                >
                  {{ getSourceInitial(getItemSource(item)) }}
                </div>
              </div>
              <div class="item-content-list">
                <h3 class="item-title-collection">{{ item.title }}</h3>
                <div class="item-source-list">{{ getItemSource(item) }}</div>
                <div class="item-date-list">{{ formatDate(getItemCollectedAt(item)) }}</div>
              </div>
            </template>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div 
          v-else-if="!loading.items" 
          class="empty-state-collections"
        >
          <i class="fas fa-folder-open empty-icon-collections"></i>
          <h3 class="empty-title-collections">此收藏夹为空</h3>
          <p class="empty-description-collections">尝试添加一些文章或笔记到这里吧！</p>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="loading.items" class="items-loading">
          <div class="loading-skeleton-item" v-for="i in 6" :key="i"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCollectionsStore } from '@/stores/collections'
import { useRouter } from 'vue-router'
import type { Article } from '@/api/types/article'
import type { SimpleFolder } from '@/stores/collections'
import AppIcon from '@/components/common/AppIcon.vue'

import { ICONS, ICON_SIZES, ICON_COLORS } from '@/constants/icons'

// 使用状态管理
const collectionsStore = useCollectionsStore()
const router = useRouter()

// 响应式数据
const searchQuery = ref('')
const itemsLoaded = ref(false)

// 计算属性
const folders = computed(() => collectionsStore.folders)
const currentFolderId = computed(() => collectionsStore.currentFolderId)
const currentFolder = computed(() => collectionsStore.currentFolder)
const items = computed(() => collectionsStore.items)
const filteredItems = computed(() => collectionsStore.filteredItems)
const viewMode = computed(() => collectionsStore.viewMode)
const loading = computed(() => collectionsStore.loading)

const currentFolderName = computed(() => {
  if (currentFolderId.value === 'all') return '全部收藏'
  return currentFolder.value?.name || '未知文件夹'
})

const currentFolderItemCount = computed(() => {
  return filteredItems.value.length
})

const totalItemCount = computed(() => {
  if (!folders.value || !Array.isArray(folders.value)) return 0
  return folders.value.reduce((total: number, folder: SimpleFolder) => total + folder.itemCount, 0)
})

// 方法
const setViewMode = (mode: 'grid' | 'list') => {
  collectionsStore.setViewMode(mode)
}

const handleSearch = () => {
  collectionsStore.searchItems(searchQuery.value)
}

const shareItem = (item: Article) => {
  // TODO: 实现分享功能
  console.log('分享收藏项:', item)
}

const editItem = (item: Article) => {
  // TODO: 实现编辑收藏项功能
  console.log('编辑收藏项:', item)
}

const removeItem = async (item: Article) => {
  if (confirm(`确定要从收藏夹中移除"${item.title}"吗？`)) {
    try {
      const result = await collectionsStore.removeCollectionItem(item.id)
      if (result.success) {
        // 显示成功提示
        console.log('移除收藏成功')
      } else {
        alert(result.error || '移除收藏失败')
      }
    } catch (error) {
      console.error('移除收藏项失败:', error)
      alert('移除收藏失败，请稍后重试')
    }
  }
}

const navigateToArticle = (item: Article, event: Event) => {
  // 阻止冒泡，避免触发按钮点击事件
  if ((event.target as HTMLElement).closest('.item-actions')) {
    return
  }
  
  // 导航到文章详情页
  if (item.id && getItemType(item) === 'article') {
    router.push(`/articles/${item.id}`)
  }
}

// 工具函数 - 适配Article数据到显示需求
const getItemType = (item: Article): string => {
  // 文章类型，默认为'article'
  return 'article'
}

const getItemDescription = (item: Article): string => {
  // 使用summary作为描述，如果没有则使用截取的内容
  return item.summary || item.plainTextContent?.substring(0, 150) + '...' || '暂无描述'
}

const getItemTags = (item: Article): string[] => {
  // 处理categories字段 - 后端返回的是string，需要转换为数组
  if (item.categories) {
    if (Array.isArray(item.categories)) {
      return item.categories
    } else if (typeof item.categories === 'string') {
      // 如果是字符串，按逗号分割
      return item.categories.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    }
  }
  
  // 如果没有categories，尝试使用extractedTopics
  if (item.extractedTopics && Array.isArray(item.extractedTopics)) {
    return item.extractedTopics.slice(0, 3) // 最多显示3个主题
  }
  
  return []
}

const getItemSource = (item: Article): string => {
  // 使用RSS源名称作为来源
  return item.rssSourceName || item.author || '未知来源'
}

const getItemCollectedAt = (item: Article): string => {
  // 使用favoritedAt或publicationDate
  return item.favoritedAt || item.publicationDate
}

const getSourceColor = (source: string): string => {
  // 根据来源生成颜色
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
  if (!dateString) return '未知时间'
  
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

// 生命周期
onMounted(async () => {
  // 初始化数据
  await collectionsStore.initializeCollections()
  
  // 触发加载动画
  setTimeout(() => {
    itemsLoaded.value = true
  }, 300)
})

// 监听搜索查询变化
watch(searchQuery, (newQuery) => {
  collectionsStore.searchItems(newQuery)
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

// Collections 页面样式
.collections-container {
  display: flex;
  height: 100vh;
  background: var(--color-bg-primary);
}

.content-area {
  flex: 1;
  width: 100%;
  padding: spacing(6);
  overflow-y: auto;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: spacing(6);
}

.content-title-collections {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 spacing(1) 0;
}

.content-subtitle-collections {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.content-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: spacing(6);
  padding: spacing(4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
}

.search-box-content {
  position: relative;
  flex: 1;
  max-width: 400px;
  
  i {
    position: absolute;
    left: spacing(3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-disabled);
    font-size: 14px;
  }
  
  input {
    width: 100%;
    padding: spacing(3) spacing(3) spacing(3) spacing(10);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius-s);
    color: var(--color-text-primary);
    font-size: 14px;
    transition: border-color var(--transition-speed-fast);
    
    &:focus {
      outline: none;
      border-color: var(--color-accent-primary);
    }
    
    &::placeholder {
      color: var(--color-text-disabled);
    }
  }
}

.view-toggle {
  display: flex;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 0.5);
  border: 1px solid var(--color-border-primary);
}

.view-toggle-btn {
  padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2.5);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-s);
  transition: all var(--transition-speed-fast);
  font-size: 13px;
  
  &:hover {
    color: var(--color-text-primary);
  }
  
  &.active {
    background-color: var(--color-accent-primary);
    color: white;
    box-shadow: var(--shadow-xs);
  }
}

.content-main {
  min-height: 400px;
}

.items-container {
  &.items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: calc(var(--spacing-unit) * 5);
  }
  
  &.items-list {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing-unit) * 3);
  }
}

.collection-item {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-l);
  padding: calc(var(--spacing-unit) * 5);
  transition: all var(--transition-speed-normal);
  cursor: pointer;
  position: relative;
  box-shadow: var(--shadow-s);
  opacity: 0;
  transform: translateY(15px);
  
  &.loaded {
    opacity: 1;
    transform: translateY(0);
  }
  
  &:hover {
    border-color: var(--color-border-secondary);
    transform: translateY(-4px) scale(1.01);
    box-shadow: var(--shadow-l);
  }
  
  &.list-view {
    display: flex;
    align-items: center;
    gap: spacing(4);
    padding: spacing(3) spacing(4);
    
    .item-header {
      margin-bottom: 0;
    }
    
    .item-title-collection {
      margin: 0;
      font-size: 16px;
    }
    
    .item-description-collection {
      margin: 0;
      font-size: 14px;
      max-width: 300px;
    }
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: spacing(3);
}

.item-type {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1.5);
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  background-color: rgba(123, 97, 255, 0.1);
  color: var(--color-accent-primary);
  border-radius: var(--border-radius-m);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  i {
    font-size: 10px;
    color: var(--color-accent-primary);
  }
}

.item-actions {
  display: flex;
  gap: calc(var(--spacing-unit) * 1);
  opacity: 0;
  transform: scale(0.9);
  transition: opacity var(--transition-speed-fast), transform var(--transition-speed-fast);
}

.collection-item:hover .item-actions {
  opacity: 1;
  transform: scale(1);
}

.item-action-btn {
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: var(--border-radius-s);
  transition: all var(--transition-speed-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
    border-color: var(--color-border-secondary);
    transform: scale(1.1);
  }
}

.item-title-collection {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: calc(var(--spacing-unit) * 2);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-description-collection {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: calc(var(--spacing-unit) * 4);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  min-height: calc(1.6em * 3);
}

.item-tags-collection {
  display: flex;
  flex-wrap: wrap;
  gap: spacing(1);
  margin-bottom: spacing(3);
}

.item-tag-collection {
  padding: spacing(1) spacing(2);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-s);
  font-size: 12px;
  font-weight: 500;
}

.item-meta-collection {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--color-text-disabled);
  border-top: 1px solid var(--color-border-primary);
  padding-top: calc(var(--spacing-unit) * 3);
}

.item-source {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1.5);
}

.source-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: white;
  font-weight: 600;
}

// 空状态样式
.empty-state-collections {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(var(--spacing-unit) * 12) calc(var(--spacing-unit) * 6);
  text-align: center;
}

.empty-icon-collections {
  font-size: 48px;
  color: var(--color-text-disabled);
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.empty-title-collections {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 calc(var(--spacing-unit) * 2) 0;
}

.empty-description-collections {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

// 加载状态样式
.items-loading {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 3);
}

.loading-skeleton-item {
  background: linear-gradient(90deg, var(--color-bg-secondary) 25%, var(--color-bg-tertiary) 50%, var(--color-bg-secondary) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: var(--border-radius-m);
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@include tablet {
  .collections-container {
    flex-direction: column;
  }
  
  .content-area {
    padding: spacing(4);
  }
  
  .content-filters {
    flex-direction: column;
    gap: spacing(3);
    align-items: stretch;
  }
  
  .search-box-content {
    max-width: none;
  }
  
  .items-container.items-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: spacing(3);
  }
}

@include mobile {
  .content-header {
    flex-direction: column;
    gap: spacing(3);
    align-items: stretch;
  }
  
  .items-container.items-grid {
    grid-template-columns: 1fr;
  }
  
  .collection-item.list-view {
    flex-direction: column;
    align-items: stretch;
    gap: spacing(2);
    
    .item-description-collection {
      max-width: none;
    }
  }
}
</style> 