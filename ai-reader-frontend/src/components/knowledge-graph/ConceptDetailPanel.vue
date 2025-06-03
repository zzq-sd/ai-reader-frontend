<template>
  <div class="concept-detail-panel">
    <div class="panel-header">
      <div class="concept-info">
        <h3 class="concept-name">{{ concept?.name || '未选择概念' }}</h3>
        <span class="concept-type" v-if="concept?.type">{{ getTypeLabel(concept.type) }}</span>
      </div>
      <button @click="$emit('close')" class="close-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="panel-content" v-if="concept">
      <!-- 概念描述 -->
      <div class="section" v-if="concept.description">
        <h4 class="section-title">
          <i class="fas fa-info-circle"></i>
          概念描述
        </h4>
        <p class="concept-description">{{ concept.description }}</p>
      </div>
      
      <!-- 同义词 -->
      <div class="section" v-if="concept.synonyms && concept.synonyms.length > 0">
        <h4 class="section-title">
          <i class="fas fa-tags"></i>
          同义词
        </h4>
        <div class="synonyms">
          <span v-for="synonym in concept.synonyms" :key="synonym" class="synonym-tag">
            {{ synonym }}
          </span>
        </div>
    </div>

    <!-- 统计信息 -->
      <div class="section" v-if="statistics">
        <h4 class="section-title">
          <i class="fas fa-chart-bar"></i>
          统计信息
        </h4>
        <div class="statistics-grid">
        <div class="stat-item">
          <span class="stat-label">相关文章</span>
          <span class="stat-value">{{ statistics.articleCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">相关笔记</span>
          <span class="stat-value">{{ statistics.noteCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总频次</span>
          <span class="stat-value">{{ statistics.totalFrequency }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">关联概念</span>
          <span class="stat-value">{{ statistics.relatedConceptCount }}</span>
        </div>
          <div class="stat-item">
          <span class="stat-label">平均置信度</span>
            <span class="stat-value">{{ (statistics.averageConfidence * 100).toFixed(1) }}%</span>
        </div>
          <div class="stat-item">
          <span class="stat-label">首次提及</span>
          <span class="stat-value">{{ formatDate(statistics.firstMentioned) }}</span>
        </div>
        </div>
      </div>

      <!-- 相关文章 -->
      <div class="section" v-if="relatedArticles && relatedArticles.length > 0">
        <h4 class="section-title">
          <i class="fas fa-file-alt"></i>
          相关文章 ({{ relatedArticles.length }})
        </h4>
        <div class="articles-list">
        <div 
          v-for="article in relatedArticles" 
          :key="article.id"
          class="article-item"
            @click="$emit('navigate-to-article', article.id)"
        >
          <div class="article-header">
              <h5 class="article-title">{{ article.title }}</h5>
              <span class="article-date">{{ formatDate(article.publishDate) }}</span>
            </div>
            <p class="article-summary" v-if="article.summary">{{ article.summary }}</p>
            <div class="article-meta">
              <span class="article-source" v-if="article.source">{{ article.source }}</span>
              <span class="article-relevance">相关度: {{ (article.relevanceScore * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="panel-actions">
        <button class="action-btn primary" @click="focusOnConcept">
          <i class="fas fa-crosshairs"></i>
          聚焦概念
        </button>
        <button class="action-btn" @click="expandRelated">
          <i class="fas fa-expand-arrows-alt"></i>
          展开关联
        </button>
        <button class="action-btn" @click="exportData">
          <i class="fas fa-download"></i>
          导出数据
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <i class="fas fa-mouse-pointer"></i>
      <p>点击图谱中的概念节点查看详细信息</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ConceptDetailDTO {
  id: string
  name: string
  type: string
  description?: string
  synonyms?: string[]
  statistics?: {
    conceptName: string
    conceptType: string
    articleCount: number
    noteCount: number
    totalFrequency: number
    relatedConceptCount: number
    averageConfidence: number
    firstMentioned: string
    lastMentioned: string
  }
}

interface ArticleGraphDTO {
  id: string
  title: string
  summary?: string
  publishDate: string
  source?: string
  relevanceScore: number
}

interface ConceptStatistics {
  conceptName: string
  conceptType: string
  articleCount: number
  noteCount: number
  totalFrequency: number
  relatedConceptCount: number
  averageConfidence: number
  firstMentioned: string
  lastMentioned: string
}

const props = defineProps<{
  concept?: ConceptDetailDTO | null
  relatedArticles?: ArticleGraphDTO[]
  statistics?: ConceptStatistics | null
}>()

const emit = defineEmits<{
  close: []
  'navigate-to-article': [articleId: string]
  'navigate-to-note': [noteId: string]
}>()

// 计算属性
const hasData = computed(() => props.concept !== null && props.concept !== undefined)

// 方法
const getTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    CONCEPT: '概念',
    TECHNOLOGY: '技术',
    PERSON: '人物',
    ORGANIZATION: '组织',
    LOCATION: '地点',
    EVENT: '事件',
    PRODUCT: '产品'
  }
  return typeLabels[type] || type
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '未知'
  try {
    return new Date(dateString).toLocaleDateString('zh-CN')
  } catch {
    return dateString
  }
}

const focusOnConcept = () => {
  if (props.concept) {
    // 触发聚焦事件，由父组件处理
    console.log('聚焦概念:', props.concept.name)
  }
}

const expandRelated = () => {
  if (props.concept) {
    // 触发展开相关节点事件
    console.log('展开相关节点:', props.concept.name)
  }
}

const exportData = () => {
  if (!props.concept) return
  
  const data = {
    concept: props.concept,
    statistics: props.statistics,
    relatedArticles: props.relatedArticles,
    exportTime: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `concept-${props.concept.name}-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url)
}
</script>

<style scoped lang="scss">
.concept-detail-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(123, 97, 255, 0.05);
  
  .concept-info {
    flex: 1;
    
    .concept-name {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      line-height: 1.2;
    }
    
    .concept-type {
      display: inline-block;
      padding: 4px 8px;
      background: rgba(123, 97, 255, 0.1);
      color: #7B61FF;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
  }
}

  .close-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 8px;
      border-radius: 6px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #374151;
      }
    }
  }
  
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
      }
      
.section {
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  
  i {
    color: #7B61FF;
    font-size: 12px;
  }
}

.concept-description {
  margin: 0;
  color: #6b7280;
    line-height: 1.6;
  font-size: 14px;
}
  
.synonyms {
    display: flex;
    flex-wrap: wrap;
  gap: 8px;
}
    
    .synonym-tag {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-radius: 12px;
      font-size: 12px;
  font-weight: 500;
}

.statistics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
    display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  
  .stat-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }
  
  .stat-value {
      font-size: 16px;
    font-weight: 600;
    color: #374151;
    }
  }
  
  .articles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

    .article-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
      border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
      cursor: pointer;
  transition: all 0.2s ease;
      
      &:hover {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(123, 97, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
      }
      
      .article-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
  
        .article-title {
    margin: 0;
    font-size: 14px;
          font-weight: 600;
    color: #374151;
    line-height: 1.3;
    flex: 1;
    margin-right: 12px;
  }
          
          .article-date {
            font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
        }
      }
      
      .article-summary {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
        font-size: 12px;
        
  .article-source {
    color: #6b7280;
  }
  
  .article-relevance {
    color: #7B61FF;
          font-weight: 500;
    }
  }
  
.panel-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}
    
.action-btn {
      display: flex;
      align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid rgba(123, 97, 255, 0.2);
  border-radius: 8px;
  background: rgba(123, 97, 255, 0.05);
  color: #7B61FF;
  font-size: 14px;
  font-weight: 500;
      cursor: pointer;
  transition: all 0.2s ease;
      
      &:hover {
    background: rgba(123, 97, 255, 0.1);
    border-color: rgba(123, 97, 255, 0.3);
    transform: translateY(-1px);
  }
  
  &.primary {
    background: #7B61FF;
    color: white;
    border-color: #7B61FF;
    
    &:hover {
      background: #6d4fd6;
      border-color: #6d4fd6;
    }
  }
      }
      
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
  
  i {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
      }
    }

// 滚动条样式
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(123, 97, 255, 0.3);
  border-radius: 3px;
  
  &:hover {
    background: rgba(123, 97, 255, 0.5);
  }
}
</style> 