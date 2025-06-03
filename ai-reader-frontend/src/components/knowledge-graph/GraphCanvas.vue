<template>
  <div class="graph-canvas-container">
    <!-- 图谱可视化区域 -->
    <div class="graph-visualization">
      <KnowledgeGraphD3 ref="d3Component" />
    </div>
    
    <!-- 浮动控制面板 -->
    <div class="floating-controls">
      <KnowledgeGraphControls />
    </div>
    
    <!-- 节点详情面板 -->
    <transition name="slide-left">
      <div v-if="selectedNode" class="node-details-panel">
        <div class="panel-header">
          <h3>{{ selectedNode.name }}</h3>
          <button @click="closeNodeDetails" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="panel-content">
          <div class="node-info">
            <div class="info-item">
              <label>类型</label>
              <span class="node-type" :class="`type-${selectedNode.type}`">
                {{ getNodeTypeLabel(selectedNode.type) }}
              </span>
            </div>
            
            <div class="info-item" v-if="selectedNode.description">
              <label>描述</label>
              <p>{{ selectedNode.description }}</p>
            </div>
            
            <div class="info-item" v-if="selectedNode.properties">
              <label>属性</label>
              <div class="properties">
                <div v-for="(value, key) in selectedNode.properties" :key="key" class="property-item">
                  <span class="property-key">{{ key }}:</span>
                  <span class="property-value">{{ value }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 相关节点 -->
          <div v-if="relatedNodes.length" class="related-nodes">
            <h4>相关节点</h4>
            <div class="related-list">
              <div 
                v-for="node in relatedNodes" 
                :key="node.id"
                class="related-item"
                @click="selectRelatedNode(node)"
              >
                <i :class="getNodeIcon(node.type)"></i>
                <span>{{ node.name }}</span>
              </div>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="panel-actions">
            <button class="action-btn primary" @click="focusOnNode">
              <i class="fas fa-crosshairs"></i>
              聚焦节点
            </button>
            <button class="action-btn" @click="expandNode">
              <i class="fas fa-expand-arrows-alt"></i>
              展开关联
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useKnowledgeGraphStore } from '@/stores/knowledgeGraphStore'
import KnowledgeGraphD3 from './KnowledgeGraphD3.vue'
import KnowledgeGraphControls from './KnowledgeGraphControls.vue'
import type { GraphNode, GraphLink } from '@/api/knowledgeGraph'

const knowledgeGraphStore = useKnowledgeGraphStore()

// 组件引用
const d3Component = ref<InstanceType<typeof KnowledgeGraphD3>>()

// 计算属性
const selectedNode = computed(() => knowledgeGraphStore.selectedNode)
const graphData = computed(() => knowledgeGraphStore.graphData)

// 相关节点
const relatedNodes = computed(() => {
  if (!selectedNode.value || !graphData.value) return []
  
  const selectedId = selectedNode.value.id
  const relatedIds = graphData.value.links
    .filter((link: GraphLink) => link.source === selectedId || link.target === selectedId)
    .map((link: GraphLink) => link.source === selectedId ? link.target : link.source)
  
  return graphData.value.nodes.filter((node: GraphNode) => relatedIds.includes(node.id))
})

// 方法
const closeNodeDetails = () => {
  knowledgeGraphStore.selectNode(null)
}

const selectRelatedNode = (node: GraphNode) => {
  knowledgeGraphStore.selectNode(node.id)
}

const focusOnNode = () => {
  if (selectedNode.value) {
    // 使用store的聚焦方法，会触发动画
    knowledgeGraphStore.focusOnNode(selectedNode.value.id)
  }
}

const expandNode = () => {
  if (selectedNode.value) {
    // 高亮相关节点
    if (d3Component.value) {
      d3Component.value.highlightRelatedNodes(selectedNode.value.id)
    }
    
    // 标记节点为已展开
    knowledgeGraphStore.expandNode(selectedNode.value.id)
    
    console.log('Expand node:', selectedNode.value.id, 'Related nodes highlighted')
  }
}

const getNodeTypeLabel = (type: string) => {
  const typeLabels: Record<string, string> = {
    concept: '概念',
    article: '文章',
    author: '作者',
    tag: '标签'
  }
  return typeLabels[type] || type
}

const getNodeIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    concept: 'fas fa-lightbulb',
    article: 'fas fa-file-alt',
    author: 'fas fa-user',
    tag: 'fas fa-tag'
  }
  return iconMap[type] || 'fas fa-circle'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped lang="scss">
.graph-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.graph-visualization {
  width: 100%;
  height: 100%;
}

.floating-controls {
  position: absolute;
  top: calc(var(--spacing-unit) * 4);
  right: calc(var(--spacing-unit) * 4);
  z-index: 10;
}

.node-details-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  height: 100%;
  background-color: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border-primary);
  backdrop-filter: blur(10px);
  z-index: 15;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--spacing-unit) * 4);
  border-bottom: 1px solid var(--color-border-primary);
  background-color: var(--color-bg-primary);
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  
  .close-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: calc(var(--spacing-unit) * 2);
    border-radius: var(--border-radius-s);
    transition: all var(--transition-speed-fast);
    
    &:hover {
      background-color: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--spacing-unit) * 4);
}

.node-info {
  margin-bottom: calc(var(--spacing-unit) * 6);
}

.info-item {
  margin-bottom: calc(var(--spacing-unit) * 4);
  
  label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: calc(var(--spacing-unit) * 1);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  p {
    margin: 0;
    color: var(--color-text-primary);
    line-height: 1.5;
  }
  
  span {
    color: var(--color-text-primary);
  }
}

.node-type {
  display: inline-block;
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius-s);
  font-size: 12px;
  font-weight: 500;
  
  &.type-concept {
    background-color: rgba(255, 193, 7, 0.1);
    color: #ffc107;
  }
  
  &.type-article {
    background-color: rgba(0, 123, 255, 0.1);
    color: #007bff;
  }
  
  &.type-author {
    background-color: rgba(40, 167, 69, 0.1);
    color: #28a745;
  }
  
  &.type-tag {
    background-color: rgba(108, 117, 125, 0.1);
    color: #6c757d;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--spacing-unit) * 1);
}

.tag {
  display: inline-block;
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-s);
  font-size: 12px;
}

.properties {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
}

.property-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .property-key {
    font-weight: 500;
    color: var(--color-text-secondary);
    font-size: 12px;
  }
  
  .property-value {
    color: var(--color-text-primary);
    font-size: 12px;
  }
}

.related-nodes {
  margin-bottom: calc(var(--spacing-unit) * 6);
  
  h4 {
    margin: 0 0 calc(var(--spacing-unit) * 3) 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
}

.related-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius-s);
  cursor: pointer;
  transition: background-color var(--transition-speed-fast);
  
  &:hover {
    background-color: var(--color-bg-hover);
  }
  
  i {
    color: var(--color-text-secondary);
    width: 16px;
  }
  
  span {
    color: var(--color-text-primary);
    font-size: 14px;
  }
}

.panel-actions {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 4);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 14px;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background-color: var(--color-bg-hover);
    border-color: var(--color-border-hover);
  }
  
  &.primary {
    background-color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: white;
    
    &:hover {
      background-color: var(--color-accent-hover);
      border-color: var(--color-accent-hover);
    }
  }
  
  i {
    font-size: 12px;
  }
}

// 动画
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform var(--transition-speed-normal);
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(100%);
}

// 响应式设计
@media (max-width: 768px) {
  .node-details-panel {
    width: 100%;
    max-width: 320px;
  }
  
  .floating-controls {
    top: calc(var(--spacing-unit) * 2);
    right: calc(var(--spacing-unit) * 2);
  }
}
</style> 