<template>
  <div class="knowledge-graph-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <KnowledgeGraphSidebar />
    </div>
    
    <!-- 中间图谱区域 -->
    <div class="graph-container">
      <KnowledgeGraphControls />
      <KnowledgeGraphD3 />
    </div>
    
    <!-- 右侧详情面板 -->
    <div class="details-panel">
      <KnowledgeGraphDetails />
    </div>
  </div>
</template>

<script setup lang="ts">
import KnowledgeGraphSidebar from './KnowledgeGraphSidebar.vue'
import KnowledgeGraphControls from './KnowledgeGraphControls.vue'
import KnowledgeGraphD3 from './KnowledgeGraphD3.vue'
import KnowledgeGraphDetails from './KnowledgeGraphDetails.vue'
</script>

<style scoped lang="scss">
.knowledge-graph-container {
  display: grid;
  grid-template-columns: 320px 1fr 300px;
  height: 100vh;
  background-color: var(--color-bg-primary);
}

.sidebar {
  background-color: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.graph-container {
  background-color: var(--color-bg-primary);
  position: relative;
  overflow: hidden;
}

.details-panel {
  background-color: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 响应式布局
@media (max-width: 1200px) {
  .knowledge-graph-container {
    grid-template-columns: 280px 1fr 280px;
  }
}

@media (max-width: 768px) {
  .knowledge-graph-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
  
  .sidebar,
  .details-panel {
    position: fixed;
    top: 0;
    bottom: 0;
    width: 320px;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform var(--transition-speed-normal);
    
    &.open {
      transform: translateX(0);
    }
  }
  
  .details-panel {
    right: 0;
    transform: translateX(100%);
    
    &.open {
      transform: translateX(0);
    }
  }
}
</style> 