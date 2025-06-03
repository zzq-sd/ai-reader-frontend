<template>
  <div class="knowledge-graph-sidebar">
    <!-- 图谱概览 -->
    <div class="sidebar-section">
      <h3 class="section-title">
        <i class="fas fa-chart-pie"></i>
        图谱概览
      </h3>
      <div class="overview-stats">
        <div class="stat-card">
          <div class="stat-icon concept-icon">
            <i class="fas fa-lightbulb"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ graphStats.conceptCount }}</div>
            <div class="stat-label">概念</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon article-icon">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ graphStats.articleCount }}</div>
            <div class="stat-label">文章</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon note-icon">
            <i class="fas fa-sticky-note"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ graphStats.noteCount }}</div>
            <div class="stat-label">笔记</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon relation-icon">
            <i class="fas fa-project-diagram"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ graphStats.relationCount }}</div>
            <div class="stat-label">关系</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 热门概念 -->
    <div class="sidebar-section">
      <h3 class="section-title">
        <i class="fas fa-fire"></i>
        热门概念
      </h3>
      <div class="popular-concepts">
        <div 
          v-for="concept in popularConcepts" 
          :key="concept.id"
          class="concept-item"
          @click="selectConcept(concept.id)"
        >
          <div class="concept-info">
            <div class="concept-name">{{ concept.name }}</div>
            <div class="concept-type">{{ getTypeLabel(concept.type) }}</div>
          </div>
          <div class="concept-frequency">{{ concept.frequency }}</div>
        </div>
      </div>
    </div>
    
    <!-- 最近更新 -->
    <div class="sidebar-section">
      <h3 class="section-title">
        <i class="fas fa-clock"></i>
        最近更新
      </h3>
      <div class="recent-updates">
        <div 
          v-for="update in recentUpdates" 
          :key="update.id"
          class="update-item"
        >
          <div class="update-icon" :class="getUpdateIconClass(update.type)">
            <i :class="getUpdateIcon(update.type)"></i>
          </div>
          <div class="update-content">
            <div class="update-title">{{ update.title }}</div>
            <div class="update-time">{{ formatTime(update.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 快速操作 -->
    <div class="sidebar-section">
      <h3 class="section-title">
        <i class="fas fa-bolt"></i>
        快速操作
      </h3>
      <div class="quick-actions">
        <button class="action-btn" @click="refreshGraph">
          <i class="fas fa-sync-alt"></i>
          刷新图谱
        </button>
        <button class="action-btn" @click="exportGraph">
          <i class="fas fa-download"></i>
          导出数据
        </button>
        <button class="action-btn" @click="resetView">
          <i class="fas fa-home"></i>
          重置视图
        </button>
        <button class="action-btn" @click="toggleFullscreen">
          <i class="fas fa-expand"></i>
          全屏模式
        </button>
      </div>
    </div>
    
    <!-- 图谱设置 -->
    <div class="sidebar-section">
      <h3 class="section-title">
        <i class="fas fa-cog"></i>
        显示设置
      </h3>
      <div class="graph-settings">
                 <div class="setting-item">
           <label class="setting-label">
             <input 
               type="checkbox" 
               v-model="settings.showNodeLabels"
               @change="updateSetting('showNodeLabels', settings.showNodeLabels)"
             />
             <span class="checkmark"></span>
             显示节点标签
           </label>
         </div>
         
         <div class="setting-item">
           <label class="setting-label">
             <input 
               type="checkbox" 
               v-model="settings.showEdgeLabels"
               @change="updateSetting('showEdgeLabels', settings.showEdgeLabels)"
             />
             <span class="checkmark"></span>
             显示连线标签
           </label>
         </div>
         
         <div class="setting-item">
           <label class="setting-label">
             <input 
               type="checkbox" 
               v-model="settings.enablePhysics"
               @change="updateSetting('enablePhysics', settings.enablePhysics)"
             />
             <span class="checkmark"></span>
             启用物理引擎
           </label>
         </div>
         
         <div class="setting-item">
           <label class="setting-label">
             <input 
               type="checkbox" 
               v-model="settings.enableClustering"
               @change="updateSetting('enableClustering', settings.enableClustering)"
             />
             <span class="checkmark"></span>
             启用聚类
           </label>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useKnowledgeGraphStore } from '@/stores/knowledgeGraphStore'

const graphStore = useKnowledgeGraphStore()

// 响应式数据
const settings = ref({
  showNodeLabels: true,
  showEdgeLabels: false,
  enablePhysics: true,
  enableClustering: false
})

// 计算属性
const graphStats = computed(() => {
  const data = graphStore.graphData
  if (!data) {
    return {
      conceptCount: 0,
      articleCount: 0,
      noteCount: 0,
      relationCount: 0
    }
  }
  
  const conceptCount = data.nodes.filter(node => node.type === 'CONCEPT').length
  const articleCount = data.nodes.filter(node => node.type === 'ARTICLE').length
  const noteCount = data.nodes.filter(node => node.type === 'NOTE').length
  const relationCount = data.links.length
  
  return {
    conceptCount,
    articleCount,
    noteCount,
    relationCount
  }
})

const popularConcepts = computed(() => {
  const data = graphStore.graphData
  if (!data) return []
  
  return data.nodes
    .filter(node => node.type === 'CONCEPT')
    .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
    .slice(0, 10)
    .map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      frequency: node.frequency || 0
    }))
})

const recentUpdates = computed(() => {
  // 这里可以从store获取最近的更新记录
  return [
    {
      id: '1',
      type: 'concept_added',
      title: '新增概念: Vue 3',
      timestamp: Date.now() - 1000 * 60 * 5
    },
    {
      id: '2',
      type: 'article_analyzed',
      title: '分析文章: Spring AI 指南',
      timestamp: Date.now() - 1000 * 60 * 15
    },
    {
      id: '3',
      type: 'relation_created',
      title: '建立关系: Vue 3 ↔ Composition API',
      timestamp: Date.now() - 1000 * 60 * 30
    }
  ]
})

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

const getUpdateIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    concept_added: 'fas fa-plus-circle',
    article_analyzed: 'fas fa-file-alt',
    relation_created: 'fas fa-link',
    note_created: 'fas fa-sticky-note',
    concept_merged: 'fas fa-compress-arrows-alt'
  }
  return iconMap[type] || 'fas fa-info-circle'
}

const getUpdateIconClass = (type: string): string => {
  const classMap: Record<string, string> = {
    concept_added: 'success',
    article_analyzed: 'info',
    relation_created: 'warning',
    note_created: 'primary',
    concept_merged: 'secondary'
  }
  return classMap[type] || 'default'
}

const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 1000 * 60) return '刚刚'
  if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}分钟前`
  if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}小时前`
  
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

const selectConcept = (conceptId: string) => {
  graphStore.selectNode(conceptId)
}

const refreshGraph = () => {
  graphStore.loadGraphData()
}

const exportGraph = () => {
  const data = graphStore.graphData
  if (!data) return
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `knowledge-graph-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url)
}

const resetView = () => {
  graphStore.reset()
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const updateSetting = (key: string, value: boolean) => {
  console.log(`设置 ${key} 为 ${value}`)
  // 这里可以触发相应的图谱更新
}

onMounted(() => {
  console.log('知识图谱侧边栏已挂载')
})
</script>

<style scoped lang="scss">
.knowledge-graph-sidebar {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.sidebar-section {
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  
  i {
    color: #7B61FF;
    font-size: 14px;
  }
}

.overview-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  
  &.concept-icon {
    background: rgba(123, 97, 255, 0.1);
    color: #7B61FF;
  }
  
  &.article-icon {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }
  
  &.note-icon {
    background: rgba(255, 152, 0, 0.1);
    color: #ff9800;
  }
  
  &.relation-icon {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
}

.stat-content {
  flex: 1;
  
  .stat-value {
    font-size: 18px;
    font-weight: 700;
    color: #374151;
    line-height: 1;
  }
  
  .stat-label {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }
}

.popular-concepts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.concept-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(123, 97, 255, 0.05);
    border-color: rgba(123, 97, 255, 0.2);
    transform: translateX(4px);
  }
}

.concept-info {
  flex: 1;
  
  .concept-name {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    line-height: 1.2;
  }
  
  .concept-type {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }
}

.concept-frequency {
  font-size: 12px;
  font-weight: 600;
  color: #7B61FF;
  background: rgba(123, 97, 255, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 30px;
  text-align: center;
}

.recent-updates {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.update-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.update-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  
  &.success {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }
  
  &.info {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
  
  &.warning {
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
  }
  
  &.primary {
    background: rgba(123, 97, 255, 0.1);
    color: #7B61FF;
  }
  
  &.secondary {
    background: rgba(156, 163, 175, 0.1);
    color: #9ca3af;
  }
}

.update-content {
  flex: 1;
  
  .update-title {
    font-size: 13px;
    color: #374151;
    line-height: 1.2;
  }
  
  .update-time {
    font-size: 11px;
    color: #6b7280;
    margin-top: 2px;
  }
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(123, 97, 255, 0.05);
    border-color: rgba(123, 97, 255, 0.2);
    color: #7B61FF;
    transform: translateY(-1px);
  }
  
  i {
    font-size: 12px;
  }
}

.graph-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  .setting-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #374151;
    cursor: pointer;
    position: relative;
    
    input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      
      &:checked + .checkmark {
        background: #7B61FF;
        border-color: #7B61FF;
        
        &::after {
          display: block;
        }
      }
    }
    
    .checkmark {
      width: 16px;
      height: 16px;
      background: rgba(255, 255, 255, 0.8);
      border: 2px solid rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      position: relative;
      transition: all 0.2s ease;
      
      &::after {
        content: '';
        position: absolute;
        display: none;
        left: 4px;
        top: 1px;
        width: 4px;
        height: 8px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
    }
  }
}

// 滚动条样式
.knowledge-graph-sidebar::-webkit-scrollbar {
  width: 6px;
}

.knowledge-graph-sidebar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.knowledge-graph-sidebar::-webkit-scrollbar-thumb {
  background: rgba(123, 97, 255, 0.3);
  border-radius: 3px;
  
  &:hover {
    background: rgba(123, 97, 255, 0.5);
  }
}
</style> 