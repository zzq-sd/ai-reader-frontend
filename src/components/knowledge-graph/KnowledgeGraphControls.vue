<template>
  <div class="graph-controls">
    <!-- 缩放控制 -->
    <div class="control-group">
      <button 
        @click="$emit('zoom-in')" 
        class="control-btn"
        title="放大"
      >
        <i class="fas fa-plus"></i>
      </button>
      <button 
        @click="$emit('zoom-out')" 
        class="control-btn"
        title="缩小"
      >
        <i class="fas fa-minus"></i>
      </button>
      <button 
        @click="$emit('reset-zoom')" 
        class="control-btn"
        title="重置缩放"
      >
        <i class="fas fa-expand"></i>
      </button>
    </div>
    
    <!-- 视图控制 -->
    <div class="control-group">
      <button 
        @click="$emit('center-graph')" 
        class="control-btn"
        title="居中显示"
      >
        <i class="fas fa-crosshairs"></i>
      </button>
      <button 
        @click="togglePhysics" 
        class="control-btn"
        :class="{ active: physicsEnabled }"
        title="物理引擎"
      >
        <i class="fas fa-atom"></i>
      </button>
    </div>
    
    <!-- 显示控制 -->
    <div class="control-group">
      <button 
        @click="toggleLabels" 
        class="control-btn"
        :class="{ active: labelsVisible }"
        title="显示/隐藏标签"
      >
        <i class="fas fa-tag"></i>
      </button>
      <button 
        @click="toggleConnections" 
        class="control-btn"
        :class="{ active: connectionsVisible }"
        title="显示/隐藏连线"
      >
        <i class="fas fa-project-diagram"></i>
      </button>
    </div>
    
    <!-- 布局控制 -->
    <div class="control-group">
      <div class="layout-selector">
        <select v-model="selectedLayout" @change="handleLayoutChange" class="layout-select">
          <option value="force">力导向</option>
          <option value="circular">环形</option>
          <option value="hierarchical">层次</option>
          <option value="grid">网格</option>
        </select>
      </div>
    </div>
    
    <!-- 高级控制 -->
    <div class="control-group advanced-controls" v-if="showAdvanced">
      <div class="slider-control">
        <label>节点大小</label>
        <input 
          type="range" 
          v-model="nodeSize" 
          min="1" 
          max="20" 
          step="1"
          @input="handleNodeSizeChange"
          class="control-slider"
        />
        <span class="slider-value">{{ nodeSize }}</span>
      </div>
      
      <div class="slider-control">
        <label>连线强度</label>
        <input 
          type="range" 
          v-model="linkStrength" 
          min="0.1" 
          max="2" 
          step="0.1"
          @input="handleLinkStrengthChange"
          class="control-slider"
        />
        <span class="slider-value">{{ linkStrength }}</span>
      </div>
      
      <div class="slider-control">
        <label>排斥力</label>
        <input 
          type="range" 
          v-model="chargeStrength" 
          min="-500" 
          max="-10" 
          step="10"
          @input="handleChargeStrengthChange"
          class="control-slider"
        />
        <span class="slider-value">{{ Math.abs(chargeStrength) }}</span>
      </div>
    </div>
    
    <!-- 切换高级控制 -->
    <div class="control-group">
      <button 
        @click="showAdvanced = !showAdvanced" 
        class="control-btn advanced-toggle"
        :class="{ active: showAdvanced }"
        title="高级控制"
      >
        <i class="fas fa-cog"></i>
      </button>
    </div>
    
    <!-- 新增：调试按钮 -->
    <div class="control-group">
      <button 
        @click="toggleDebug" 
        class="control-btn"
        :class="{ active: showDebug }"
        title="显示调试信息"
      >
        <i class="fas fa-bug"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useKnowledgeGraphStore } from '@/stores/knowledgeGraphStore'

const emit = defineEmits<{
  'zoom-in': []
  'zoom-out': []
  'reset-zoom': []
  'center-graph': []
  'toggle-physics': [enabled: boolean]
  'toggle-labels': [enabled: boolean]
  'toggle-connections': [enabled: boolean]
  'layout-change': [layout: string]
  'node-size-change': [size: number]
  'link-strength-change': [strength: number]
  'charge-strength-change': [strength: number]
}>()

// 响应式状态
const physicsEnabled = ref(true)
const labelsVisible = ref(true)
const connectionsVisible = ref(true)
const selectedLayout = ref('force')
const showAdvanced = ref(false)
const showDebug = ref(false)

// 高级控制参数
const nodeSize = ref(8)
const linkStrength = ref(1)
const chargeStrength = ref(-100)

// 事件处理
const togglePhysics = () => {
  physicsEnabled.value = !physicsEnabled.value
  emit('toggle-physics', physicsEnabled.value)
}

const toggleLabels = () => {
  labelsVisible.value = !labelsVisible.value
  emit('toggle-labels', labelsVisible.value)
}

const toggleConnections = () => {
  connectionsVisible.value = !connectionsVisible.value
  emit('toggle-connections', connectionsVisible.value)
}

const handleLayoutChange = () => {
  emit('layout-change', selectedLayout.value)
}

const handleNodeSizeChange = () => {
  emit('node-size-change', nodeSize.value)
}

const handleLinkStrengthChange = () => {
  emit('link-strength-change', linkStrength.value)
}

const handleChargeStrengthChange = () => {
  emit('charge-strength-change', chargeStrength.value)
}

// 新增：切换调试模式
const toggleDebug = () => {
  showDebug.value = !showDebug.value
  
  if (showDebug.value) {
    const store = useKnowledgeGraphStore()
    console.log('===== 知识图谱调试信息 =====')
    console.log('图谱数据:', store.graphData)
    console.log('过滤后节点:', store.filteredNodes)
    console.log('可见连线:', store.visibleLinks)
    console.log('选中节点:', store.selectedNodeId)
    console.log('==========================')
    
    alert(`已在控制台打印调试信息！
    
节点数量: ${store.graphData?.nodes.length || 0}
连线数量: ${store.graphData?.links.length || 0}
过滤后节点: ${store.filteredNodes.length}
可见连线: ${store.visibleLinks.length}`)
  }
}

// 监听布局变化
watch(selectedLayout, (newLayout) => {
  console.log('布局切换到:', newLayout)
})
</script>

<style scoped lang="scss">
.graph-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 200px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  &:not(:last-child) {
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  
  &:hover {
    background: rgba(123, 97, 255, 0.1);
    border-color: rgba(123, 97, 255, 0.2);
    color: #7B61FF;
    transform: translateY(-1px);
  }
  
  &.active {
    background: #7B61FF;
    border-color: #7B61FF;
    color: white;
    
    &:hover {
      background: #6d4fd6;
      border-color: #6d4fd6;
    }
  }
  
  &.advanced-toggle {
    width: 100%;
    justify-content: flex-start;
    padding: 0 12px;
    
    &::after {
      content: '高级控制';
      margin-left: 8px;
      font-size: 12px;
    }
  }
}

.layout-selector {
  width: 100%;
  
  .layout-select {
    width: 100%;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    color: #374151;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: rgba(123, 97, 255, 0.2);
    }
    
    &:focus {
      outline: none;
      border-color: #7B61FF;
      box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.1);
    }
  }
}

.advanced-controls {
  .slider-control {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    label {
      font-size: 11px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .control-slider {
      width: 100%;
      height: 4px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      
      &::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        background: #7B61FF;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          transform: scale(1.2);
        }
      }
      
      &::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #7B61FF;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          transform: scale(1.2);
        }
      }
    }
    
    .slider-value {
      font-size: 10px;
      color: #7B61FF;
      font-weight: 600;
      text-align: center;
      background: rgba(123, 97, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      min-width: 30px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .graph-controls {
    min-width: 160px;
    padding: 8px;
    
    .control-btn {
      width: 32px;
      height: 32px;
      font-size: 12px;
    }
    
    .layout-select {
      font-size: 11px;
      padding: 6px 8px;
    }
    
    .advanced-controls {
      .slider-control {
        margin-bottom: 8px;
        
        label {
          font-size: 10px;
        }
        
        .slider-value {
          font-size: 9px;
        }
      }
    }
  }
}

// 动画效果
.control-group {
  transition: all 0.3s ease;
}

.advanced-controls {
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 