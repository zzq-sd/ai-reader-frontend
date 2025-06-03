<template>
  <div class="node-item-content">
    <div class="node-icon" :class="node.type">
      <i :class="getNodeIcon(node.type)"></i>
    </div>
    <div class="node-info">
      <div class="node-name">{{ node.name }}</div>
      <div class="node-type">{{ getNodeTypeLabel(node.type) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NodeProps {
  node: {
    id: string
    name: string
    type: 'CONCEPT' | 'ARTICLE' | 'NOTE' | 'concept' | 'article' | 'author' | 'tag'
    description?: string
    properties?: Record<string, string>
  }
}

// Props
defineProps<NodeProps>()

// 获取节点图标
const getNodeIcon = (type: string) => {
  const icons = {
    CONCEPT: 'fas fa-lightbulb',
    ARTICLE: 'fas fa-file-alt',
    NOTE: 'fas fa-sticky-note',
    concept: 'fas fa-lightbulb',
    article: 'fas fa-file-alt',
    author: 'fas fa-user',
    tag: 'fas fa-tag'
  }
  return icons[type as keyof typeof icons] || 'fas fa-circle'
}

// 获取节点类型标签
const getNodeTypeLabel = (type: string) => {
  const labels = {
    CONCEPT: '概念',
    ARTICLE: '文章',
    NOTE: '笔记',
    concept: '概念',
    article: '文章',
    author: '作者',
    tag: '标签'
  }
  return labels[type as keyof typeof labels] || type
}
</script>

<style scoped lang="scss">
.node-item-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.node-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: calc(var(--spacing-unit) * 3);
  font-size: 14px;
  color: white;
  flex-shrink: 0;
  
  &.CONCEPT, &.concept {
    background-color: var(--color-accent-primary);
  }
  
  &.ARTICLE, &.article {
    background-color: #10B981;
  }
  
  &.NOTE {
    background-color: #FF9800;
  }
  
  &.author {
    background-color: #F59E0B;
  }
  
  &.tag {
    background-color: #EF4444;
  }
}

.node-info {
  flex: 1;
  min-width: 0; // 允许文本溢出处理
}

.node-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: calc(var(--spacing-unit) * 1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-type {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style> 