<template>
  <section class="related-articles">
    <div class="section-header">
      <h3 class="section-title">
        <i class="fas fa-lightbulb"></i>
        相关推荐
      </h3>
      <p class="section-subtitle">基于您的阅读兴趣推荐</p>
    </div>
    
    <div class="articles-grid">
      <article 
        v-for="article in articles"
        :key="article.id"
        class="related-article"
        @click="handleArticleClick(article)"
      >
        <div class="article-image" v-if="article.coverImage">
          <img :src="article.coverImage" :alt="article.title" />
          <div class="image-overlay">
            <i class="fas fa-external-link-alt"></i>
          </div>
        </div>
        
        <div class="article-content">
          <div class="article-meta">
            <span class="source">{{ article.source }}</span>
            <span class="separator">·</span>
            <span class="read-time">{{ article.readTime }}分钟</span>
          </div>
          
          <h4 class="article-title">{{ article.title }}</h4>
          
          <p class="article-summary" v-if="article.summary">
            {{ article.summary }}
          </p>
          
          <div class="article-tags" v-if="article.tags?.length">
            <span 
              v-for="tag in article.tags.slice(0, 2)"
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
          
          <div class="article-footer">
            <span class="author">{{ article.author }}</span>
            <span class="publish-time">{{ formatDate(article.publishTime) }}</span>
          </div>
        </div>
      </article>
    </div>
    
    <!-- 加载更多按钮 -->
    <div class="load-more" v-if="articles.length >= 6">
      <button class="load-more-button" @click="handleLoadMore">
        <i class="fas fa-plus"></i>
        加载更多推荐
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { RelatedArticle } from '@/api/reader'

// Props
interface Props {
  articles: RelatedArticle[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'article-click': [article: RelatedArticle]
  'load-more': []
}>()

// 事件处理
function handleArticleClick(article: RelatedArticle) {
  emit('article-click', article)
}

function handleLoadMore() {
  emit('load-more')
}

// 工具函数
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else if (diffDays < 30) {
    return `${Math.ceil(diffDays / 7)}周前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.related-articles {
  margin-top: spacing(12);
  padding: spacing(8) 0;
  border-top: 1px solid var(--color-border-primary);
}

.section-header {
  text-align: center;
  margin-bottom: spacing(8);
  
  .section-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: spacing(2);
    
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 spacing(2) 0;
    
    i {
      color: var(--color-accent-primary);
    }
  }
  
  .section-subtitle {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: spacing(6);
  
  @include tablet {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: spacing(4);
  }
  
  @include mobile {
    grid-template-columns: 1fr;
    gap: spacing(4);
  }
}

.related-article {
  display: flex;
  flex-direction: column;
  
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  overflow: hidden;
  
  cursor: pointer;
  transition: all var(--transition-speed-normal);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-color: var(--color-border-secondary);
    
    .article-image {
      .image-overlay {
        opacity: 1;
      }
      
      img {
        transform: scale(1.05);
      }
    }
    
    .article-title {
      color: var(--color-accent-primary);
    }
  }
}

.article-image {
  position: relative;
  height: 180px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-speed-normal);
  }
  
  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    
    display: flex;
    align-items: center;
    justify-content: center;
    
    background: rgba(0, 0, 0, 0.5);
    color: white;
    font-size: 20px;
    
    opacity: 0;
    transition: opacity var(--transition-speed-fast);
  }
}

.article-content {
  flex: 1;
  padding: spacing(4);
  display: flex;
  flex-direction: column;
  
  .article-meta {
    display: flex;
    align-items: center;
    gap: spacing(1);
    margin-bottom: spacing(2);
    
    font-size: 12px;
    color: var(--color-text-secondary);
    
    .source {
      font-weight: 500;
      color: var(--color-accent-primary);
    }
    
    .separator {
      opacity: 0.5;
    }
  }
  
  .article-title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--color-text-primary);
    margin: 0 0 spacing(3) 0;
    
    transition: color var(--transition-speed-fast);
    
    // 限制显示行数
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .article-summary {
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text-secondary);
    margin: 0 0 spacing(3) 0;
    flex: 1;
    
    // 限制显示行数
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .article-tags {
    display: flex;
    gap: spacing(1);
    margin-bottom: spacing(3);
    
    .tag {
      padding: spacing(0.5) spacing(2);
      
      background: var(--color-bg-primary);
      color: var(--color-text-secondary);
      font-size: 11px;
      border-radius: var(--border-radius-s);
      
      transition: background-color var(--transition-speed-fast);
      
      &:hover {
        background: var(--color-bg-hover);
      }
    }
  }
  
  .article-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    font-size: 12px;
    color: var(--color-text-disabled);
    
    .author {
      font-weight: 500;
    }
  }
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: spacing(8);
  
  .load-more-button {
    display: flex;
    align-items: center;
    gap: spacing(2);
    
    padding: spacing(3) spacing(6);
    
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius-s);
    
    font-size: 14px;
    color: var(--color-text-primary);
    cursor: pointer;
    
    transition: all var(--transition-speed-fast);
    
    &:hover {
      background: var(--color-bg-hover);
      border-color: var(--color-border-secondary);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    i {
      font-size: 12px;
    }
  }
}

// 响应式设计
@include mobile {
  .related-articles {
    margin-top: spacing(8);
    padding: spacing(6) 0;
  }
  
  .section-header {
    margin-bottom: spacing(6);
    
    .section-title {
      font-size: 20px;
    }
  }
  
  .article-image {
    height: 160px;
  }
  
  .article-content {
    padding: spacing(3);
  }
}

// 动画
.related-article {
  animation: articleSlideIn 0.6s ease-out;
}

@keyframes articleSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 为每个文章添加延迟动画
.related-article:nth-child(1) { animation-delay: 0.1s; }
.related-article:nth-child(2) { animation-delay: 0.2s; }
.related-article:nth-child(3) { animation-delay: 0.3s; }
.related-article:nth-child(4) { animation-delay: 0.4s; }
.related-article:nth-child(5) { animation-delay: 0.5s; }
.related-article:nth-child(6) { animation-delay: 0.6s; }
</style> 