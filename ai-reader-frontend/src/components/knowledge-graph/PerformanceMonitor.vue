<template>
  <div class="performance-monitor">
    <div class="monitor-header">
      <h3>性能监控</h3>
      <button @click="$emit('close')" class="close-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="monitor-content">
      <!-- 渲染性能 -->
      <div class="metric-section">
        <h4>渲染性能</h4>
        <div class="metrics-grid">
          <div class="metric-item">
            <span class="metric-label">渲染时间</span>
            <span class="metric-value">{{ formatTime(metrics.renderTime) }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">节点数量</span>
            <span class="metric-value">{{ metrics.nodeCount }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">连线数量</span>
            <span class="metric-value">{{ metrics.linkCount }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">最后渲染</span>
            <span class="metric-value">{{ formatTimestamp(metrics.lastRenderTime) }}</span>
          </div>
        </div>
      </div>
      
      <!-- WebSocket统计 -->
      <div class="metric-section">
        <h4>实时更新</h4>
        <div class="metrics-grid">
          <div class="metric-item">
            <span class="metric-label">连接状态</span>
            <span class="metric-value" :class="getStatusClass(updateStats.connectionStatus)">
              {{ getStatusText(updateStats.connectionStatus) }}
            </span>
          </div>
          <div class="metric-item">
            <span class="metric-label">更新次数</span>
            <span class="metric-value">{{ updateStats.updateCount }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">队列长度</span>
            <span class="metric-value">{{ updateStats.queueLength }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">最后更新</span>
            <span class="metric-value">{{ formatTimestamp(updateStats.lastUpdateTime) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 性能图表 -->
      <div class="metric-section">
        <h4>性能趋势</h4>
        <div class="performance-chart" ref="chartContainer">
          <canvas ref="chartCanvas" width="300" height="120"></canvas>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="monitor-actions">
        <button @click="clearMetrics" class="action-btn">
          <i class="fas fa-trash"></i>
          清除数据
        </button>
        <button @click="exportMetrics" class="action-btn">
          <i class="fas fa-download"></i>
          导出数据
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface PerformanceMetrics {
  renderTime: number
  updateCount: number
  nodeCount: number
  linkCount: number
  lastRenderTime: number
}

interface UpdateStats {
  queueLength: number
  lastUpdateTime: number | null
  updateCount: number
  connectionStatus: string
}

const props = defineProps<{
  metrics: PerformanceMetrics
  updateStats: UpdateStats
}>()

const emit = defineEmits<{
  close: []
}>()

// DOM引用
const chartContainer = ref<HTMLDivElement>()
const chartCanvas = ref<HTMLCanvasElement>()

// 性能数据历史
const performanceHistory = ref<Array<{timestamp: number, renderTime: number}>>([])
const maxHistoryLength = 50

// 图表上下文
let chartContext: CanvasRenderingContext2D | null = null

onMounted(() => {
  initChart()
  startPerformanceTracking()
})

onUnmounted(() => {
  stopPerformanceTracking()
})

// 初始化图表
const initChart = () => {
  if (!chartCanvas.value) return
  
  chartContext = chartCanvas.value.getContext('2d')
  if (!chartContext) return
  
  // 设置画布样式
  chartContext.strokeStyle = '#7B61FF'
  chartContext.lineWidth = 2
  chartContext.fillStyle = 'rgba(123, 97, 255, 0.1)'
}

// 开始性能追踪
const startPerformanceTracking = () => {
  // 每秒记录一次性能数据
  setInterval(() => {
    recordPerformanceData()
  }, 1000)
}

// 停止性能追踪
const stopPerformanceTracking = () => {
  // 清理定时器会在组件卸载时自动处理
}

// 记录性能数据
const recordPerformanceData = () => {
  const now = Date.now()
  performanceHistory.value.push({
    timestamp: now,
    renderTime: props.metrics.renderTime
  })
  
  // 保持历史记录在限制范围内
  if (performanceHistory.value.length > maxHistoryLength) {
    performanceHistory.value.shift()
  }
  
  // 重绘图表
  drawChart()
}

// 绘制性能图表
const drawChart = () => {
  if (!chartContext || !chartCanvas.value || performanceHistory.value.length < 2) return
  
  const canvas = chartCanvas.value
  const ctx = chartContext
  const width = canvas.width
  const height = canvas.height
  
  // 清除画布
  ctx.clearRect(0, 0, width, height)
  
  // 计算数据范围
  const maxRenderTime = Math.max(...performanceHistory.value.map(d => d.renderTime), 1)
  const minRenderTime = Math.min(...performanceHistory.value.map(d => d.renderTime))
  
  // 绘制网格线
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  
  // 水平网格线
  for (let i = 0; i <= 4; i++) {
    const y = (height / 4) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  
  // 垂直网格线
  for (let i = 0; i <= 10; i++) {
    const x = (width / 10) * i
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  
  // 绘制性能曲线
  ctx.strokeStyle = '#7B61FF'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  performanceHistory.value.forEach((point, index) => {
    const x = (index / (performanceHistory.value.length - 1)) * width
    const y = height - ((point.renderTime - minRenderTime) / (maxRenderTime - minRenderTime)) * height
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
  
  // 填充区域
  ctx.fillStyle = 'rgba(123, 97, 255, 0.1)'
  ctx.lineTo(width, height)
  ctx.lineTo(0, height)
  ctx.closePath()
  ctx.fill()
}

// 格式化时间
const formatTime = (ms: number): string => {
  if (ms < 1) return '< 1ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// 格式化时间戳
const formatTimestamp = (timestamp: number | null): string => {
  if (!timestamp) return '从未'
  
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 1000) return '刚刚'
  if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  
  return new Date(timestamp).toLocaleTimeString()
}

// 获取状态样式类
const getStatusClass = (status: string): string => {
  switch (status) {
    case 'connected': return 'status-connected'
    case 'connecting': return 'status-connecting'
    case 'disconnected': return 'status-disconnected'
    case 'error': return 'status-error'
    default: return ''
  }
}

// 获取状态文本
const getStatusText = (status: string): string => {
  switch (status) {
    case 'connected': return '已连接'
    case 'connecting': return '连接中'
    case 'disconnected': return '未连接'
    case 'error': return '连接错误'
    default: return '未知'
  }
}

// 清除性能数据
const clearMetrics = () => {
  performanceHistory.value = []
  if (chartContext && chartCanvas.value) {
    chartContext.clearRect(0, 0, chartCanvas.value.width, chartCanvas.value.height)
  }
}

// 导出性能数据
const exportMetrics = () => {
  const data = {
    timestamp: Date.now(),
    metrics: props.metrics,
    updateStats: props.updateStats,
    history: performanceHistory.value
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `knowledge-graph-performance-${new Date().toISOString().slice(0, 19)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url)
}

// 监听性能数据变化
watch(() => props.metrics, () => {
  nextTick(() => {
    drawChart()
  })
}, { deep: true })
</script>

<style scoped lang="scss">
.performance-monitor {
  width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(123, 97, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #374151;
    }
  }
}

.monitor-content {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.metric-section {
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding-bottom: 8px;
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  
  .metric-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }
  
  .metric-value {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    
    &.status-connected {
      color: #22c55e;
    }
    
    &.status-connecting {
      color: #fbbf24;
    }
    
    &.status-disconnected {
      color: #9ca3af;
    }
    
    &.status-error {
      color: #ef4444;
    }
  }
}

.performance-chart {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  
  canvas {
    width: 100%;
    height: 120px;
    border-radius: 4px;
  }
}

.monitor-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(123, 97, 255, 0.1);
  border: 1px solid rgba(123, 97, 255, 0.2);
  border-radius: 8px;
  color: #7B61FF;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(123, 97, 255, 0.2);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 滚动条样式
.monitor-content::-webkit-scrollbar {
  width: 6px;
}

.monitor-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.monitor-content::-webkit-scrollbar-thumb {
  background: rgba(123, 97, 255, 0.3);
  border-radius: 3px;
  
  &:hover {
    background: rgba(123, 97, 255, 0.5);
  }
}
</style> 