<template>
  <div class="performance-monitor" v-if="showMonitor">
    <div class="monitor-header">
      <h3>性能监控</h3>
      <div class="monitor-controls">
        <el-switch 
          v-model="autoRefresh" 
          active-text="自动刷新"
          size="small"
        />
        <el-button @click="refreshMetrics" size="small" icon="Refresh">
          刷新
        </el-button>
        <el-button @click="toggleMonitor" size="small" icon="Close" circle />
      </div>
    </div>

    <div class="metrics-grid">
      <!-- API调用统计 -->
      <div class="metric-card">
        <div class="metric-header">
          <el-icon><DataAnalysis /></el-icon>
          <span>API调用</span>
        </div>
        <div class="metric-value">{{ performanceMetrics.apiCalls }}</div>
        <div class="metric-subtitle">总调用次数</div>
      </div>

      <!-- 缓存命中率 -->
      <div class="metric-card">
        <div class="metric-header">
          <el-icon><Cpu /></el-icon>
          <span>缓存命中率</span>
        </div>
        <div class="metric-value">{{ cacheHitRate.toFixed(1) }}%</div>
        <div class="metric-subtitle">
          命中: {{ performanceMetrics.cacheHits }} / 
          未命中: {{ performanceMetrics.cacheMisses }}
        </div>
        <el-progress 
          :percentage="cacheHitRate" 
          :color="getCacheColor(cacheHitRate)"
          :show-text="false"
          :stroke-width="6"
          class="cache-progress"
        />
      </div>

      <!-- 平均响应时间 -->
      <div class="metric-card">
        <div class="metric-header">
          <el-icon><Timer /></el-icon>
          <span>响应时间</span>
        </div>
        <div class="metric-value">{{ performanceMetrics.averageResponseTime.toFixed(0) }}ms</div>
        <div class="metric-subtitle">平均响应时间</div>
        <div class="response-time-indicator">
          <div 
            class="time-bar" 
            :style="{ width: getResponseTimeWidth() + '%', backgroundColor: getResponseTimeColor() }"
          ></div>
        </div>
      </div>

      <!-- 节点数量 -->
      <div class="metric-card">
        <div class="metric-header">
          <el-icon><Connection /></el-icon>
          <span>图谱规模</span>
        </div>
        <div class="metric-value">{{ nodeCount }}</div>
        <div class="metric-subtitle">{{ linkCount }} 条连接</div>
        <div class="graph-size-info">
          <div class="size-item">
            <span>概念: {{ conceptCount }}</span>
          </div>
          <div class="size-item">
            <span>文章: {{ articleCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细统计 -->
    <div class="detailed-stats">
      <el-collapse v-model="activeCollapse">
        <el-collapse-item title="缓存详情" name="cache">
          <div class="cache-stats">
            <div class="cache-item">
              <span>图谱数据缓存</span>
              <el-tag :type="getCacheTagType('graph_data')" size="small">
                {{ getCacheStatus('graph_data') }}
              </el-tag>
            </div>
            <div class="cache-item">
              <span>概念详情缓存</span>
              <el-tag :type="getCacheTagType('concept_detail')" size="small">
                {{ getCacheStatus('concept_detail') }}
              </el-tag>
            </div>
            <div class="cache-item">
              <span>相关文章缓存</span>
              <el-tag :type="getCacheTagType('related_articles')" size="small">
                {{ getCacheStatus('related_articles') }}
              </el-tag>
            </div>
            <div class="cache-item">
              <span>搜索结果缓存</span>
              <el-tag :type="getCacheTagType('search')" size="small">
                {{ getCacheStatus('search') }}
              </el-tag>
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item title="内存使用" name="memory">
          <div class="memory-stats">
            <div class="memory-item">
              <span>节点位置缓存</span>
              <span>{{ nodePositions.size }} 个节点</span>
              <el-progress 
                :percentage="getMemoryUsagePercentage('positions')" 
                :show-text="false"
                :stroke-width="4"
                size="small"
              />
            </div>
            <div class="memory-item">
              <span>选中节点</span>
              <span>{{ selectedNodes.size }} 个节点</span>
            </div>
            <div class="memory-item">
              <span>展开节点</span>
              <span>{{ expandedNodes.size }} 个节点</span>
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item title="操作历史" name="history">
          <div class="operation-history">
            <div v-for="operation in recentOperations" :key="operation.id" class="operation-item">
              <span class="operation-time">{{ formatTime(operation.timestamp) }}</span>
              <span class="operation-type">{{ operation.type }}</span>
              <span class="operation-duration" :class="getDurationClass(operation.duration)">
                {{ operation.duration }}ms
              </span>
            </div>
            <div v-if="recentOperations.length === 0" class="no-operations">
              暂无操作记录
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item title="系统状态" name="system">
          <div class="system-stats">
            <div class="system-item">
              <span>最后更新</span>
              <span>{{ formatTime(performanceMetrics.lastUpdateTime) }}</span>
            </div>
            <div class="system-item">
              <span>运行状态</span>
              <el-tag :type="getSystemStatusType()" size="small">
                {{ getSystemStatus() }}
              </el-tag>
            </div>
            <div class="system-item">
              <span>数据同步</span>
              <el-tag type="success" size="small" v-if="!loading">
                正常
              </el-tag>
              <el-tag type="warning" size="small" v-else>
                同步中
              </el-tag>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <el-button @click="clearAllCache" size="small" type="warning">
        清空缓存
      </el-button>
      <el-button @click="exportMetrics" size="small" type="primary">
        导出数据
      </el-button>
      <el-button @click="resetMetrics" size="small" type="danger">
        重置统计
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useKnowledgeGraphStore } from '@/stores/knowledgeGraph'
import { DataAnalysis, Cpu, Timer, Connection } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// Props
const props = defineProps<{
  visible?: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Store
const graphStore = useKnowledgeGraphStore()

// 响应式数据
const showMonitor = ref(props.visible ?? false)
const autoRefresh = ref(true)
const activeCollapse = ref(['cache'])
const loading = ref(false)

// 操作历史
const recentOperations = ref<Array<{
  id: string
  type: string
  timestamp: number
  duration: number
}>>([])

// 定时器
let refreshTimer: number | null = null

// 计算属性
const performanceMetrics = computed(() => graphStore.performanceMetrics)
const cacheHitRate = computed(() => graphStore.cacheHitRate)
const nodePositions = computed(() => graphStore.nodePositions)
const selectedNodes = computed(() => graphStore.selectedNodes)
const expandedNodes = computed(() => graphStore.expandedNodes)

const nodeCount = computed(() => {
  return graphStore.graphData?.nodes.length || 0
})

const linkCount = computed(() => {
  return graphStore.graphData?.links.length || 0
})

const conceptCount = computed(() => {
  return graphStore.graphData?.nodes.filter(n => n.type === 'CONCEPT').length || 0
})

const articleCount = computed(() => {
  return graphStore.graphData?.nodes.filter(n => n.type === 'ARTICLE').length || 0
})

// 方法
const toggleMonitor = () => {
  showMonitor.value = !showMonitor.value
  if (!showMonitor.value) {
    emit('close')
  }
}

const refreshMetrics = () => {
  const startTime = Date.now()
  
  // 模拟刷新操作
  setTimeout(() => {
    const duration = Date.now() - startTime
    addOperation('刷新指标', duration)
  }, 100)
}

const getCacheStatus = (cacheType: string): string => {
  const hitRate = cacheHitRate.value
  if (hitRate > 80) return '优秀'
  if (hitRate > 60) return '良好'
  if (hitRate > 40) return '一般'
  return '较差'
}

const getCacheTagType = (cacheType: string): string => {
  const hitRate = cacheHitRate.value
  if (hitRate > 80) return 'success'
  if (hitRate > 60) return 'primary'
  if (hitRate > 40) return 'warning'
  return 'danger'
}

const getCacheColor = (hitRate: number): string => {
  if (hitRate > 80) return '#67c23a'
  if (hitRate > 60) return '#409eff'
  if (hitRate > 40) return '#e6a23c'
  return '#f56c6c'
}

const getResponseTimeWidth = (): number => {
  const time = performanceMetrics.value.averageResponseTime
  // 将响应时间映射到0-100的百分比
  return Math.min((time / 2000) * 100, 100)
}

const getResponseTimeColor = (): string => {
  const time = performanceMetrics.value.averageResponseTime
  if (time < 500) return '#67c23a'
  if (time < 1000) return '#e6a23c'
  return '#f56c6c'
}

const getMemoryUsagePercentage = (type: string): number => {
  switch (type) {
    case 'positions':
      return Math.min((nodePositions.value.size / 1000) * 100, 100)
    default:
      return 0
  }
}

const getDurationClass = (duration: number): string => {
  if (duration < 100) return 'fast'
  if (duration < 500) return 'normal'
  return 'slow'
}

const getSystemStatus = (): string => {
  const time = performanceMetrics.value.averageResponseTime
  const hitRate = cacheHitRate.value
  
  if (time < 500 && hitRate > 80) return '优秀'
  if (time < 1000 && hitRate > 60) return '良好'
  if (time < 2000 && hitRate > 40) return '一般'
  return '需要优化'
}

const getSystemStatusType = (): string => {
  const status = getSystemStatus()
  switch (status) {
    case '优秀': return 'success'
    case '良好': return 'primary'
    case '一般': return 'warning'
    default: return 'danger'
  }
}

const addOperation = (type: string, duration: number) => {
  const operation = {
    id: Date.now().toString(),
    type,
    timestamp: Date.now(),
    duration
  }
  
  recentOperations.value.unshift(operation)
  
  // 只保留最近20条操作
  if (recentOperations.value.length > 20) {
    recentOperations.value = recentOperations.value.slice(0, 20)
  }
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

const clearAllCache = () => {
  graphStore.clearCache()
  ElMessage.success('缓存已清空')
  addOperation('清空缓存', 0)
}

const exportMetrics = () => {
  const data = {
    performanceMetrics: performanceMetrics.value,
    recentOperations: recentOperations.value,
    timestamp: Date.now()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-metrics-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('性能数据已导出')
  addOperation('导出数据', 0)
}

const resetMetrics = () => {
  recentOperations.value = []
  ElMessage.success('统计数据已重置')
  addOperation('重置统计', 0)
}

// 监听store变化
watch(() => graphStore.performanceMetrics.lastUpdateTime, () => {
  // 可以在这里添加实时更新逻辑
})

// 生命周期
onMounted(() => {
  if (autoRefresh.value) {
    refreshTimer = window.setInterval(refreshMetrics, 5000) // 每5秒刷新
  }
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})

// 监听自动刷新开关
watch(autoRefresh, (newValue) => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  
  if (newValue) {
    refreshTimer = window.setInterval(refreshMetrics, 5000)
  }
})
</script>

<style scoped lang="scss">
.performance-monitor {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 450px;
  max-height: 80vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow-y: auto;
  z-index: 1000;
  
  .monitor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .monitor-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 20px;
    
    .metric-card {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid #f0f0f0;
      
      .metric-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: #666;
        font-size: 12px;
        font-weight: 500;
      }
      
      .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #333;
        margin-bottom: 4px;
      }
      
      .metric-subtitle {
        font-size: 11px;
        color: #888;
        margin-bottom: 8px;
      }
      
      .cache-progress {
        margin-top: 8px;
      }
      
      .response-time-indicator {
        height: 6px;
        background: #f0f0f0;
        border-radius: 3px;
        margin-top: 8px;
        overflow: hidden;
        
        .time-bar {
          height: 100%;
          border-radius: 3px;
          transition: all 0.3s ease;
        }
      }
      
      .graph-size-info {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        
        .size-item {
          font-size: 11px;
          color: #666;
        }
      }
    }
  }
  
  .detailed-stats {
    padding: 0 20px 20px;
    
    .cache-stats, .memory-stats, .system-stats {
      .cache-item, .memory-item, .system-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        span:first-child {
          font-size: 13px;
          color: #666;
        }
        
        span:last-child {
          font-size: 12px;
          color: #333;
          font-weight: 500;
        }
      }
    }
    
    .operation-history {
      max-height: 200px;
      overflow-y: auto;
      
      .operation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid #f5f5f5;
        font-size: 12px;
        
        .operation-time {
          color: #888;
          width: 60px;
        }
        
        .operation-type {
          color: #333;
          flex: 1;
          margin: 0 8px;
        }
        
        .operation-duration {
          font-weight: 500;
          width: 50px;
          text-align: right;
          
          &.fast { color: #67c23a; }
          &.normal { color: #409eff; }
          &.slow { color: #f56c6c; }
        }
      }
      
      .no-operations {
        text-align: center;
        color: #999;
        font-size: 12px;
        padding: 20px 0;
      }
    }
  }
  
  .quick-actions {
    padding: 0 20px 20px;
    display: flex;
    gap: 8px;
    
    .el-button {
      flex: 1;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .performance-monitor {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
    
    .metrics-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style> 