<template>
  <div class="node-filters">
    <div class="filter-group">
      <div class="filter-label">节点类型</div>
      <div class="filter-options">
        <div
          v-for="filterType in nodeTypes"
          :key="filterType.type"
          class="filter-option"
          @click="toggleFilter(filterType.type)"
        >
          <input
            :id="filterType.type"
            type="checkbox"
            :checked="isTypeSelected(filterType.type)"
            @change="toggleFilter(filterType.type)"
          />
          <label :for="filterType.type">{{ filterType.label }}</label>
          <span class="filter-count">{{ getTypeCount(filterType.type) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKnowledgeGraphStore } from '@/stores/knowledgeGraphStore'

// 状态管理
const knowledgeGraphStore = useKnowledgeGraphStore()

// 节点类型定义
const nodeTypes = [
  { type: 'concept', label: '概念', color: '#7B61FF' },
  { type: 'article', label: '文章', color: '#10B981' },
  { type: 'author', label: '作者', color: '#F59E0B' },
  { type: 'tag', label: '标签', color: '#EF4444' }
]

// 计算属性
const selectedTypes = computed(() => knowledgeGraphStore.filterTypes)

// 检查类型是否被选中
const isTypeSelected = (type: string) => {
  return selectedTypes.value.includes(type)
}

// 获取指定类型的节点数量
const getTypeCount = (type: string) => {
  if (!knowledgeGraphStore.graphData) return 0
  return knowledgeGraphStore.graphData.nodes.filter(node => node.type === type).length
}

// 切换筛选器状态
const toggleFilter = (type: string) => {
  const currentTypes = [...selectedTypes.value]
  const index = currentTypes.indexOf(type)
  
  if (index > -1) {
    // 如果已选中，则移除（但至少保留一个类型）
    if (currentTypes.length > 1) {
      currentTypes.splice(index, 1)
    }
  } else {
    // 如果未选中，则添加
    currentTypes.push(type)
  }
  
  knowledgeGraphStore.updateFilter(currentTypes)
}
</script>

<style scoped lang="scss">
.node-filters {
  width: 100%;
}

.filter-group {
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.filter-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: calc(var(--spacing-unit) * 2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
}

.filter-option {
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
}

input[type="checkbox"] {
  accent-color: var(--color-accent-primary);
  cursor: pointer;
}

label {
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
  flex: 1;
  user-select: none;
}

.filter-count {
  font-size: 12px;
  color: var(--color-text-disabled);
  background-color: var(--color-bg-tertiary);
  padding: calc(var(--spacing-unit) * 0.5) calc(var(--spacing-unit) * 1.5);
  border-radius: calc(var(--border-radius-s) * 2);
  min-width: 20px;
  text-align: center;
}
</style> 