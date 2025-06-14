<template>
  <div class="node-list">
    <div
      v-for="node in filteredNodes"
      :key="node.id"
      class="node-item"
      :class="{ active: isNodeSelected(node.id) }"
      @click="selectNode(node.id)"
    >
      <NodeItem :node="node" />
    </div>
    
    <!-- 空状态 -->
    <div v-if="filteredNodes.length === 0" class="empty-state">
      <i class="fas fa-search"></i>
      <p>没有找到匹配的节点</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NodeItem from './NodeItem.vue'
import { useKnowledgeGraphStore } from '@/stores/knowledgeGraphStore'

// 状态管理
const knowledgeGraphStore = useKnowledgeGraphStore()

// 计算属性 - 过滤后的节点
const filteredNodes = computed(() => {
  return knowledgeGraphStore.filteredNodes || []
})

// 检查节点是否被选中
const isNodeSelected = (nodeId: string) => {
  return knowledgeGraphStore.selectedNodeId === nodeId
}

// 选中节点
const selectNode = (nodeId: string) => {
  knowledgeGraphStore.selectNode(nodeId)
  knowledgeGraphStore.loadNodeDetails(nodeId)
}
</script>

<style scoped lang="scss">
.node-list {
  width: 100%;
  height: 100%;
}

.node-item {
  display: flex;
  align-items: center;
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 6);
  cursor: pointer;
  transition: background-color var(--transition-speed-fast);
  border-left: 3px solid transparent;
  
  &:hover {
    background-color: var(--color-bg-hover);
  }
  
  &.active {
    background-color: var(--color-bg-tertiary);
    border-left-color: var(--color-accent-primary);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(var(--spacing-unit) * 8);
  color: var(--color-text-disabled);
  text-align: center;
  
  i {
    font-size: 32px;
    margin-bottom: calc(var(--spacing-unit) * 4);
    opacity: 0.5;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
}
</style> 