<template>
  <div 
    class="article-item"
    :class="{ 'article-item--read': article.readStatus === 'read' }"
    @click="handleClick"
  >
    <!-- 文章封面图片 -->
    <div class="article-image">
      <img 
        v-if="article.imageUrl" 
        :src="article.imageUrl" 
        :alt="article.title"
        @error="handleImageError"
      />
      <div v-else class="article-image-placeholder">
        <i class="fas fa-newspaper"></i>
      </div>
    </div>
    
    <!-- 文章内容 -->
    <div class="article-content">
      <h3 class="article-title">{{ article.title }}</h3>
      <div class="article-meta">
        <span class="article-source">{{ article.source }}</span>
        <span class="article-separator">•</span>
        <span class="article-time">{{ article.publishTime }}</span>
        <span class="article-separator">•</span>
        <span 
          class="article-status" 
          :class="`article-status--${article.readStatus}`"
        >
          {{ article.readStatus === 'read' ? '已读' : '未读' }}
        </span>
      </div>
    </div>
    
    <!-- 阅读状态指示器 -->
    <div 
      v-if="article.readStatus === 'unread'" 
      class="unread-indicator"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { ArticlePreview } from '@/stores/dashboard'

interface Props {
  article: ArticlePreview
}

interface Emits {
  (e: 'click', article: ArticlePreview): void
  (e: 'mark-read', articleId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const router = useRouter()

// 处理点击事件
function handleClick() {
  emit('click', props.article)
  
  // 如果文章未读，标记为已读
  if (props.article.readStatus === 'unread') {
    emit('mark-read', props.article.id)
  }
  
  // 路由跳转到文章详情页
  if (props.article.url) {
    router.push(props.article.url)
  }
}

// 处理图片加载错误
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  
  // 显示占位符
  const placeholder = img.parentElement?.querySelector('.article-image-placeholder')
  if (placeholder) {
    (placeholder as HTMLElement).style.display = 'flex'
  }
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.article-item {
  display: flex;
  align-items: flex-start;
  padding: spacing(4) 0;
  border-bottom: 1px solid var(--color-border-primary);
  transition: all var(--transition-speed-fast);
  cursor: pointer;
  position: relative;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: var(--color-bg-hover);
    margin: 0 calc(spacing(6) * -1);
    padding-left: spacing(6);
    padding-right: spacing(6);
    border-radius: var(--border-radius-s);
  }
  
  &--read {
    opacity: 0.7;
    
    .article-title {
      color: var(--color-text-secondary);
    }
  }
}

.article-image {
  width: 60px;
  height: 60px;
  border-radius: var(--border-radius-s);
  background-color: var(--color-bg-tertiary);
  margin-right: spacing(4);
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-speed-fast);
  }
  
  &:hover img {
    transform: scale(1.05);
  }
}

.article-image-placeholder {
  width: 100%;
  height: 100%;
  display: none;
  align-items: center;
  justify-content: center;
  color: var(--color-text-disabled);
  font-size: 20px;
  background-color: var(--color-bg-tertiary);
}

.article-content {
  flex: 1;
  min-width: 0;
}

.article-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 spacing(1) 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color var(--transition-speed-fast);
}

.article-meta {
  font-size: 12px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: spacing(1);
  flex-wrap: wrap;
}

.article-source {
  font-weight: 500;
}

.article-separator {
  color: var(--color-text-disabled);
}

.article-time {
  color: var(--color-text-secondary);
}

.article-status {
  font-weight: 500;
  
  &--read {
    color: var(--color-text-disabled);
  }
  
  &--unread {
    color: var(--color-accent-primary);
  }
}

.unread-indicator {
  width: 6px;
  height: 6px;
  background-color: var(--color-accent-primary);
  border-radius: 50%;
  position: absolute;
  top: spacing(5);
  right: 0;
  flex-shrink: 0;
}

// 响应式设计
@include mobile {
  .article-item {
    padding: spacing(3) 0;
    
    &:hover {
      margin: 0 calc(spacing(4) * -1);
      padding-left: spacing(4);
      padding-right: spacing(4);
    }
  }
  
  .article-image {
    width: 50px;
    height: 50px;
    margin-right: spacing(3);
  }
  
  .article-title {
    font-size: 14px;
  }
  
  .article-meta {
    font-size: 11px;
    gap: spacing(0.5);
  }
  
  .unread-indicator {
    top: spacing(4);
  }
}

// 加载状态
.article-item--loading {
  pointer-events: none;
  
  .article-title,
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
  
  .article-title {
    height: 20px;
    margin-bottom: spacing(2);
  }
  
  .article-meta {
    height: 12px;
    width: 60%;
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style> 