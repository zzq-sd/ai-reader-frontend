<template>
  <div 
    class="recommendation-item"
    :class="{ 'recommendation-item--read': recommendation.readStatus === 'read' }"
    @click="handleClick"
  >
    <!-- 推荐标识 -->
    <div class="recommendation-badge">
      <i class="fas fa-robot"></i>
      <span>AI推荐</span>
    </div>
    
    <!-- 文章封面图片 -->
    <div class="recommendation-image">
      <img 
        v-if="recommendation.imageUrl" 
        :src="recommendation.imageUrl" 
        :alt="recommendation.title"
        @error="handleImageError"
      />
      <div v-else class="recommendation-image-placeholder">
        <i class="fas fa-newspaper"></i>
      </div>
    </div>
    
    <!-- 文章内容 -->
    <div class="recommendation-content">
      <h4 class="recommendation-title">{{ recommendation.title }}</h4>
      <div class="recommendation-meta">
        <span class="recommendation-source">{{ recommendation.source }}</span>
        <span class="recommendation-separator">•</span>
        <span class="recommendation-time">{{ recommendation.publishTime }}</span>
      </div>
    </div>
    
    <!-- 阅读状态指示器 -->
    <div 
      v-if="recommendation.readStatus === 'unread'" 
      class="unread-indicator"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { ArticlePreview } from '@/stores/dashboard'

interface Props {
  recommendation: ArticlePreview
}

interface Emits {
  (e: 'click', recommendation: ArticlePreview): void
  (e: 'mark-read', recommendationId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const router = useRouter()

// 处理点击事件
function handleClick() {
  emit('click', props.recommendation)
  
  // 如果文章未读，标记为已读
  if (props.recommendation.readStatus === 'unread') {
    emit('mark-read', props.recommendation.id)
  }
  
  // 路由跳转到文章详情页
  if (props.recommendation.url) {
    router.push(props.recommendation.url)
  }
}

// 处理图片加载错误
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  
  // 显示占位符
  const placeholder = img.parentElement?.querySelector('.recommendation-image-placeholder')
  if (placeholder) {
    (placeholder as HTMLElement).style.display = 'flex'
  }
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.recommendation-item {
  display: flex;
  flex-direction: column;
  padding: spacing(4);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  position: relative;
  overflow: hidden;
  
  // 毛玻璃效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 8px 25px rgba(0, 0, 0, 0.1),
      0 4px 10px rgba(0, 0, 0, 0.05);
    border-color: var(--color-accent-primary);
  }
  
  &--read {
    opacity: 0.7;
    
    .recommendation-title {
      color: var(--color-text-secondary);
    }
  }
}

.recommendation-badge {
  display: flex;
  align-items: center;
  gap: spacing(1);
  padding: spacing(1) spacing(2);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: var(--border-radius-s);
  font-size: 11px;
  font-weight: 500;
  margin-bottom: spacing(3);
  align-self: flex-start;
  
  i {
    font-size: 10px;
  }
}

.recommendation-image {
  width: 100%;
  height: 120px;
  border-radius: var(--border-radius-s);
  background-color: var(--color-bg-tertiary);
  margin-bottom: spacing(3);
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

.recommendation-image-placeholder {
  width: 100%;
  height: 100%;
  display: none;
  align-items: center;
  justify-content: center;
  color: var(--color-text-disabled);
  font-size: 24px;
  background-color: var(--color-bg-tertiary);
}

.recommendation-content {
  flex: 1;
}

.recommendation-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 spacing(2) 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color var(--transition-speed-fast);
}

.recommendation-meta {
  font-size: 11px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: spacing(1);
  flex-wrap: wrap;
}

.recommendation-source {
  font-weight: 500;
}

.recommendation-separator {
  color: var(--color-text-disabled);
}

.recommendation-time {
  color: var(--color-text-secondary);
}

.unread-indicator {
  width: 6px;
  height: 6px;
  background-color: var(--color-accent-primary);
  border-radius: 50%;
  position: absolute;
  top: spacing(4);
  right: spacing(4);
}

// 响应式设计
@include tablet {
  .recommendation-item {
    padding: spacing(3);
  }
  
  .recommendation-image {
    height: 100px;
    margin-bottom: spacing(2.5);
  }
  
  .recommendation-title {
    font-size: 13px;
  }
  
  .recommendation-meta {
    font-size: 10px;
  }
}

@include mobile {
  .recommendation-item {
    padding: spacing(3);
  }
  
  .recommendation-image {
    height: 80px;
    margin-bottom: spacing(2);
  }
  
  .recommendation-title {
    font-size: 12px;
  }
  
  .recommendation-meta {
    font-size: 10px;
    gap: spacing(0.5);
  }
  
  .recommendation-badge {
    font-size: 10px;
    padding: spacing(0.5) spacing(1.5);
    margin-bottom: spacing(2);
  }
}

// 加载状态
.recommendation-item--loading {
  pointer-events: none;
  
  .recommendation-title,
  .recommendation-meta {
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
  
  .recommendation-title {
    height: 16px;
    margin-bottom: spacing(2);
  }
  
  .recommendation-meta {
    height: 11px;
    width: 60%;
  }
  
  .recommendation-image {
    background: linear-gradient(90deg, 
      var(--color-bg-tertiary) 25%, 
      var(--color-bg-hover) 50%, 
      var(--color-bg-tertiary) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }
  
  .recommendation-badge {
    background: var(--color-bg-tertiary);
    color: transparent;
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