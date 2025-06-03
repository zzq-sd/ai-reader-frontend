<template>
  <article 
    class="article-card"
    :class="{ 
      'article-card--unread': article.readStatus === 'unread',
      'article-card--loading': isLoading 
    }"
    @click="handleCardClick"
  >
    <!-- 阅读状态指示器 -->
    <div class="reading-status">
      <div 
        class="status-indicator"
        :class="`status-indicator--${article.readStatus}`"
      ></div>
    </div>
    
    <!-- 悬浮操作按钮 -->
    <div class="article-actions">
      <button 
        class="action-btn"
        :class="{ 'action-btn--favorited': article.isFavorited }"
        @click.stop="handleToggleFavorite"
        :title="article.isFavorited ? '取消收藏' : '收藏'"
      >
        <i :class="article.isFavorited ? 'fas fa-bookmark' : 'far fa-bookmark'"></i>
      </button>
      <button 
        class="action-btn"
        @click.stop="handleToggleRead"
        :title="article.readStatus === 'read' ? '标记未读' : '标记已读'"
      >
        <i :class="article.readStatus === 'read' ? 'fas fa-undo' : 'fas fa-check'"></i>
      </button>
      <button 
        class="action-btn"
        @click.stop="handleShowMore"
        title="更多操作"
      >
        <i class="fas fa-ellipsis-h"></i>
      </button>
    </div>
    
    <!-- 文章头部 -->
    <div class="article-header">
      <!-- 文章图片 - 已隐藏 -->
      
      <!-- 文章内容 -->
      <div class="article-content">
        <h2 class="article-title">{{ article.title }}</h2>
        <p class="article-excerpt" v-if="article.excerpt">
          {{ article.excerpt }}
        </p>
      </div>
    </div>
    
    <!-- 文章元数据 -->
    <div class="article-meta">
      <div class="meta-item">
        <i class="fas fa-rss"></i>
        <span class="article-source">{{ article.source }}</span>
      </div>
      <div class="meta-item">
        <i class="fas fa-clock"></i>
        <span>{{ formatTime(article.publishTime) }}</span>
      </div>
      <div class="meta-item">
        <i class="fas fa-eye"></i>
        <span>{{ article.readStatus === 'read' ? '已读' : '未读' }}</span>
      </div>
      <div class="meta-item" v-if="article.tags && article.tags.length > 0">
        <i class="fas fa-tag"></i>
        <span>{{ article.tags.join(', ') }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// 类型定义 - 与stores/articles.ts的UIArticle类型保持一致
interface Article {
  id: string
  title: string
  excerpt?: string
  content?: string
  imageUrl?: string
  source: string
  sourceId: string
  publishTime: string
  readStatus: 'read' | 'unread'
  isFavorited?: boolean
  tags?: string[]
  url?: string
  // 后端字段
  author?: string
  publicationDate?: string
  originalUrl?: string
  rssSourceId?: string
  rssSourceName?: string
  createdAt?: string
  updatedAt?: string
  summary?: string
  categories?: string[]
  extractedKeywords?: string[]
  extractedEntities?: string[]
  extractedTopics?: string[]
  language?: string
  wordCount?: number
  readingTimeMinutes?: number
  favoritedAt?: string
  isRead?: boolean
  lastReadAt?: string
  relatedArticles?: string[]
  relatedConcepts?: string[]
  htmlContent?: string
  plainTextContent?: string
  aiProcessingStatus?: string
  coverImageUrl?: string
}

interface Props {
  article: Article
  isLoading?: boolean
}

interface Emits {
  (e: 'click', article: Article): void
  (e: 'toggle-favorite', articleId: string): void
  (e: 'toggle-read', articleId: string): void
  (e: 'show-more', article: Article): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()
const router = useRouter()

// 图片加载状态
const imageError = ref(false)
const imageLoading = ref(true)

// 处理卡片点击
function handleCardClick() {
  emit('click', props.article)
  
  // 仅在用户已登录时自动标记未读文章为已读
  // 检查localStorage中的认证状态
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const hasToken = !!localStorage.getItem('access_token')
  
  if (isLoggedIn && hasToken && props.article.readStatus === 'unread') {
    emit('toggle-read', props.article.id)
  }
  
  // 路由跳转到文章阅读页面
  router.push(`/articles/${props.article.id}`)
}

// 处理收藏切换
function handleToggleFavorite() {
  emit('toggle-favorite', props.article.id)
}

// 处理已读状态切换
function handleToggleRead() {
  emit('toggle-read', props.article.id)
}

// 处理更多操作
function handleShowMore() {
  emit('show-more', props.article)
}

// 处理图片加载错误
function handleImageError() {
  imageError.value = true
  imageLoading.value = false
}

// 处理图片加载完成
function handleImageLoad() {
  imageLoading.value = false
}

// 格式化时间
function formatTime(timeString: string): string {
  const now = new Date()
  const time = new Date(timeString)
  const diff = now.getTime() - time.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) {
    return `${minutes} 分钟前`
  } else if (hours < 24) {
    return `${hours} 小时前`
  } else if (days < 7) {
    return `${days} 天前`
  } else {
    return time.toLocaleDateString('zh-CN')
  }
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.article-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  padding: spacing(6);
  transition: all var(--transition-speed-fast);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  // 毛玻璃效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &:hover {
    border-color: var(--color-border-secondary);
    transform: translateY(-2px);
    box-shadow: 
      0 8px 25px rgba(0, 0, 0, 0.15),
      0 4px 10px rgba(0, 0, 0, 0.1);
    
    .article-actions {
      opacity: 1;
      transform: translateY(0);
    }
    
    .article-image img {
      transform: scale(1.05);
    }
  }
  
  &--unread {
    border-left: 3px solid var(--color-accent-primary);
    
    .article-title {
      color: var(--color-text-primary);
      font-weight: 600;
    }
  }
  
  &--loading {
    pointer-events: none;
    
    .article-title,
    .article-excerpt,
    .article-meta {
      background: linear-gradient(90deg, 
        var(--color-bg-tertiary) 25%, 
        var(--color-bg-hover) 50%, 
        var(--color-bg-tertiary) 75%
      );
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: var(--border-radius-s);
      color: transparent;
    }
  }
}

.reading-status {
  position: absolute;
  top: spacing(4);
  left: spacing(4);
  z-index: 2;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  
  &--unread {
    background-color: var(--color-accent-primary);
    box-shadow: 0 0 8px rgba(123, 97, 255, 0.4);
  }
  
  &--read {
    background-color: var(--color-text-disabled);
  }
}

.article-actions {
  position: absolute;
  top: spacing(4);
  right: spacing(4);
  display: flex;
  gap: spacing(2);
  opacity: 0;
  transform: translateY(-10px);
  transition: all var(--transition-speed-normal);
  z-index: 2;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-s);
  background: rgba(31, 31, 35, 0.9);
  border: 1px solid var(--color-border-primary);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  // 毛玻璃效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(31, 31, 35, 0.95);
    color: var(--color-text-primary);
    border-color: var(--color-border-secondary);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &--favorited {
    color: #F59E0B;
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
    
    &:hover {
      background: rgba(245, 158, 11, 0.2);
      color: #F59E0B;
    }
  }
  
  i {
    font-size: 12px;
  }
}

.article-header {
  display: flex;
  align-items: flex-start;
  gap: spacing(4);
  margin-bottom: spacing(4);
}

.article-image {
  width: 120px;
  height: 80px;
  border-radius: var(--border-radius-s);
  background-color: var(--color-bg-tertiary);
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-speed-normal);
  }
  
  .article-image-background {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, 
      var(--color-bg-tertiary) 0%, 
      var(--color-bg-hover) 100%
    );
  }
}

.article-content {
  flex: 1;
  min-width: 0;
}

.article-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-accent-primary);
  margin: 0 0 spacing(3) 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color var(--transition-speed-fast);
  
  .article-card:not(.article-card--unread) & {
    color: var(--color-text-primary);
    font-weight: 600;
  }
  
  .article-card:hover & {
    text-decoration: underline;
  }
}

.article-excerpt {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: spacing(4);
  font-size: 12px;
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: spacing(1);
  
  i {
    font-size: 10px;
    opacity: 0.7;
  }
}

.article-source {
  color: var(--color-accent-primary);
  font-weight: 500;
}

// 响应式设计
@include tablet {
  .article-card {
    padding: spacing(4);
  }
  
  .article-header {
    gap: spacing(3);
    margin-bottom: spacing(3);
  }
  
  .article-image {
    width: 100px;
    height: 70px;
  }
  
  .article-title {
    font-size: 16px;
  }
  
  .article-excerpt {
    font-size: 13px;
  }
  
  .article-meta {
    gap: spacing(3);
    font-size: 11px;
  }
}

@include mobile {
  .article-card {
    padding: spacing(3);
  }
  
  .article-header {
    flex-direction: column;
    gap: spacing(3);
    margin-bottom: spacing(3);
  }
  
  .article-image {
    width: 100%;
    height: 120px;
  }
  
  .article-actions {
    position: static;
    opacity: 1;
    transform: none;
    justify-content: flex-end;
    margin-top: spacing(3);
    margin-bottom: spacing(-1);
  }
  
  .article-title {
    font-size: 15px;
  }
  
  .article-excerpt {
    font-size: 12px;
  }
  
  .article-meta {
    gap: spacing(2);
    font-size: 10px;
  }
  
  .reading-status {
    top: spacing(3);
    left: spacing(3);
  }
}

// 骨架屏动画
@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// 卡片进入动画
.article-card {
  animation: articleCardFadeIn 0.6s ease-out both;
}

@keyframes articleCardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 交错动画支持
.article-card--staggered {
  animation-delay: var(--stagger-delay, 0ms);
}

// 加载状态特殊处理
.article-card--loading {
  .article-title {
    height: 22px;
    margin-bottom: spacing(2);
  }
  
  .article-excerpt {
    height: 60px;
    margin-bottom: spacing(4);
  }
  
  .article-meta {
    height: 12px;
    width: 70%;
  }
  
  .article-image {
    background: linear-gradient(90deg, 
      var(--color-bg-tertiary) 25%, 
      var(--color-bg-hover) 50%, 
      var(--color-bg-tertiary) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }
}
</style> 