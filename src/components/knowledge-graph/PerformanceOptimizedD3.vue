<template>
  <div class="performance-d3-container">
    <!-- 性能状态指示器 -->
    <div class="performance-indicator" v-if="showPerformanceStats">
      <div class="perf-stats">
        <span>FPS: {{ fps }}</span>
        <span>节点: {{ nodeCount }}</span>
        <span>边: {{ linkCount }}</span>
        <span>渲染时间: {{ renderTime }}ms</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
        <p>优化渲染中...</p>
      </div>
    </div>

    <!-- 性能优化的D3.js 图谱容器 -->
    <div
      ref="graphContainer"
      class="optimized-graph-canvas"
      @contextmenu.prevent
    ></div>

    <!-- 性能控制器 -->
    <div class="performance-controls">
      <button @click="toggleLOD" :class="{ active: lodEnabled }">
        <i class="fas fa-layer-group"></i>
        LOD优化
      </button>
      <button @click="toggleBatching" :class="{ active: batchingEnabled }">
        <i class="fas fa-rocket"></i>
        批量渲染
      </button>
      <button @click="toggleOcclusion" :class="{ active: occlusionEnabled }">
        <i class="fas fa-eye-slash"></i>
        视锥裁剪
      </button>
      <button @click="toggleStats" :class="{ active: showPerformanceStats }">
        <i class="fas fa-chart-line"></i>
        性能监控
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as d3 from 'd3'
import { useKnowledgeGraphStore } from '@/stores/knowledgeGraphStore'
import type { GraphNode, GraphLink } from '@/api/knowledgeGraph'

// 性能优化配置
interface PerformanceConfig {
  maxNodes: number
  maxLinks: number
  lodLevels: number[]
  batchSize: number
  frameRate: number
  cullDistance: number
}

const performanceConfig: PerformanceConfig = {
  maxNodes: 1000,          // 最大节点数
  maxLinks: 2000,          // 最大连线数
  lodLevels: [0.5, 1.0, 2.0], // LOD层级
  batchSize: 50,           // 批处理大小
  frameRate: 60,           // 目标帧率
  cullDistance: 2000       // 视锥裁剪距离
}

// 状态管理
const knowledgeGraphStore = useKnowledgeGraphStore()

// DOM引用
const graphContainer = ref<HTMLDivElement>()

// 性能优化状态
const lodEnabled = ref(true)           // LOD级别优化
const batchingEnabled = ref(true)      // 批量渲染
const occlusionEnabled = ref(true)     // 视锥裁剪
const showPerformanceStats = ref(false) // 性能统计显示

// 性能监控
const fps = ref(0)
const nodeCount = ref(0)
const linkCount = ref(0)
const renderTime = ref(0)

// D3相关变量（性能优化版）
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
let g: d3.Selection<SVGGElement, unknown, null, undefined>
let simulation: d3.Simulation<GraphNode, undefined>
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown>

// 性能优化相关变量
let nodePool: d3.Selection<SVGGElement, GraphNode, any, any>[] = []
let linkPool: d3.Selection<SVGLineElement, GraphLink, any, any>[] = []
let visibleNodes: GraphNode[] = []
let visibleLinks: GraphLink[] = []
let lastRenderTime = 0
let frameCounter = 0
let lastFpsUpdate = 0

// 计算属性
const loading = computed(() => knowledgeGraphStore.loading)
const graphData = computed(() => knowledgeGraphStore.graphData)
const filteredNodes = computed(() => knowledgeGraphStore.filteredNodes)
const allLinks = computed(() => knowledgeGraphStore.visibleLinks)

// 性能优化函数

// 1. LOD (Level of Detail) 优化
const applyLOD = (currentZoom: number, nodes: GraphNode[]): GraphNode[] => {
  if (!lodEnabled.value) return nodes
  
  const zoomLevel = Math.min(Math.max(currentZoom, 0.1), 4)
  
  if (zoomLevel < 0.5) {
    // 极远视角：只显示重要节点
    return nodes.filter(node => (node as any).importance > 0.8)
  } else if (zoomLevel < 1.0) {
    // 远视角：显示中等重要性以上的节点
    return nodes.filter(node => (node as any).importance > 0.5)
  } else {
    // 近视角：显示所有节点，但可能简化渲染
    return nodes
  }
}

// 2. 视锥裁剪优化
const applyCulling = (nodes: GraphNode[], viewBox: { x: number, y: number, width: number, height: number }): GraphNode[] => {
  if (!occlusionEnabled.value) return nodes
  
  return nodes.filter(node => {
    if (!node.x || !node.y) return true
    
    // 检查节点是否在可视区域内（包含一定的边界扩展）
    const margin = 100
    return node.x >= viewBox.x - margin &&
           node.x <= viewBox.x + viewBox.width + margin &&
           node.y >= viewBox.y - margin &&
           node.y <= viewBox.y + viewBox.height + margin
  })
}

// 3. 批量渲染优化
const batchRender = (renderFunction: Function, items: any[], batchSize: number = performanceConfig.batchSize) => {
  if (!batchingEnabled.value) {
    renderFunction(items)
    return
  }
  
  let index = 0
  const renderBatch = () => {
    const batch = items.slice(index, index + batchSize)
    if (batch.length > 0) {
      renderFunction(batch)
      index += batchSize
      
      if (index < items.length) {
        requestAnimationFrame(renderBatch)
      }
    }
  }
  
  renderBatch()
}

// 4. 对象池优化
const getNodeFromPool = (): d3.Selection<SVGGElement, GraphNode, any, any> => {
  if (nodePool.length > 0) {
    return nodePool.pop()!
  }
  
  // 创建新的节点元素
  const nodeGroup = g.append('g').attr('class', 'optimized-node')
  
  nodeGroup.append('circle')
    .attr('r', 15)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
  
  nodeGroup.append('text')
    .attr('class', 'node-icon')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-family', 'Font Awesome 6 Free')
    .attr('font-weight', 900)
    .attr('font-size', '10px')
    .attr('fill', 'white')
  
  nodeGroup.append('text')
    .attr('class', 'node-label')
    .attr('text-anchor', 'middle')
    .attr('dy', 25)
    .attr('font-size', '10px')
    .attr('fill', '#666')
  
  return nodeGroup as any
}

const returnNodeToPool = (node: d3.Selection<SVGGElement, GraphNode, any, any>) => {
  node.style('display', 'none')
  nodePool.push(node)
}

// 优化的图谱更新函数
const updateOptimizedGraph = () => {
  if (!svg || !g || !simulation) return
  
  const startTime = performance.now()
  
  // 获取当前变换和视口
  const transform = d3.zoomTransform(svg.node()!)
  const container = graphContainer.value!
  const viewBox = {
    x: -transform.x / transform.k,
    y: -transform.y / transform.k,
    width: container.clientWidth / transform.k,
    height: container.clientHeight / transform.k
  }
  
  // 应用性能优化
  let optimizedNodes = [...filteredNodes.value]
  let optimizedLinks = [...allLinks.value]
  
  // 1. 应用LOD优化
  optimizedNodes = applyLOD(transform.k, optimizedNodes)
  
  // 2. 应用视锥裁剪
  optimizedNodes = applyCulling(optimizedNodes, viewBox)
  
  // 3. 限制最大渲染数量
  if (optimizedNodes.length > performanceConfig.maxNodes) {
    optimizedNodes = optimizedNodes
      .sort((a, b) => (b as any).importance - (a as any).importance)
      .slice(0, performanceConfig.maxNodes)
  }
  
  // 4. 过滤相关连线
  const nodeIds = new Set(optimizedNodes.map(n => n.id))
  optimizedLinks = optimizedLinks.filter(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    return nodeIds.has(sourceId) && nodeIds.has(targetId)
  })
  
  if (optimizedLinks.length > performanceConfig.maxLinks) {
    optimizedLinks = optimizedLinks.slice(0, performanceConfig.maxLinks)
  }
  
  // 更新统计
  nodeCount.value = optimizedNodes.length
  linkCount.value = optimizedLinks.length
  
  // 5. 批量渲染连线
  const renderLinks = (links: GraphLink[]) => {
    const linkSelection = g.selectAll('.optimized-link')
      .data(links, (d: any) => `${d.source.id || d.source}-${d.target.id || d.target}`)
    
    linkSelection.exit().remove()
    
    linkSelection.enter()
      .append('line')
      .attr('class', 'optimized-link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1)
  }
  
  // 6. 批量渲染节点
  const renderNodes = (nodes: GraphNode[]) => {
    const nodeSelection = g.selectAll('.optimized-node')
      .data(nodes, (d: any) => d.id)
    
    nodeSelection.exit().remove()
    
    const nodeEnter = nodeSelection.enter()
      .append('g')
      .attr('class', 'optimized-node')
      .style('cursor', 'pointer')
    
    // 简化的节点渲染
    nodeEnter.append('circle')
      .attr('r', (d: GraphNode) => transform.k > 1 ? 15 : 10) // 根据缩放调整大小
      .attr('fill', (d: GraphNode) => getNodeColor(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
    
    // 只在足够的缩放级别显示标签
    if (transform.k > 0.8) {
      nodeEnter.append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('dy', 20)
        .attr('font-size', Math.max(8, 10 * transform.k) + 'px')
        .attr('fill', '#666')
        .text((d: GraphNode) => d.name)
    }
    
    // 事件处理（简化版）
    nodeEnter.on('click', (event: MouseEvent, d: GraphNode) => {
      event.stopPropagation()
      knowledgeGraphStore.selectNode(d.id)
    })
  }
  
  // 应用批量渲染
  batchRender(renderLinks, optimizedLinks)
  batchRender(renderNodes, optimizedNodes)
  
  // 更新力模拟（优化版）
  simulation.nodes(optimizedNodes)
  const linkForce = simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>
  linkForce.links(optimizedLinks)
  
  // 限制模拟迭代次数
  simulation.alpha(0.1).restart()
  
  // 记录渲染时间
  renderTime.value = Math.round(performance.now() - startTime)
}

// 获取节点颜色（简化版）
const getNodeColor = (type: string): string => {
  const colors = {
    CONCEPT: '#7B61FF',
    ARTICLE: '#10B981',
    NOTE: '#FF9800'
  }
  return colors[type as keyof typeof colors] || '#999'
}

// 性能监控
const startPerformanceMonitoring = () => {
  const updateFPS = () => {
    frameCounter++
    const now = performance.now()
    
    if (now - lastFpsUpdate >= 1000) {
      fps.value = Math.round((frameCounter * 1000) / (now - lastFpsUpdate))
      frameCounter = 0
      lastFpsUpdate = now
    }
    
    requestAnimationFrame(updateFPS)
  }
  
  updateFPS()
}

// 初始化优化的D3图谱
const initOptimizedD3Graph = () => {
  if (!graphContainer.value) return
  
  const container = graphContainer.value
  const rect = container.getBoundingClientRect()
  const width = rect.width
  const height = rect.height
  
  // 清除之前的SVG
  d3.select(container).selectAll('svg').remove()
  
  // 创建SVG
  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background-color', 'var(--color-bg-primary)')
  
  // 创建缩放行为（优化版）
  zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
      // 在缩放时触发LOD更新
      if (lodEnabled.value) {
        requestAnimationFrame(() => updateOptimizedGraph())
      }
    })
  
  svg.call(zoom)
  
  // 创建主绘图组
  g = svg.append('g')
  
  // 初始化优化的力模拟
  simulation = d3.forceSimulation<GraphNode>()
    .force('link', d3.forceLink<GraphNode, GraphLink>().id(d => d.id).distance(80))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(30))
    .velocityDecay(0.6) // 更快的收敛
    .alphaDecay(0.05)   // 更快的停止
}

// 控制函数
const toggleLOD = () => {
  lodEnabled.value = !lodEnabled.value
  updateOptimizedGraph()
}

const toggleBatching = () => {
  batchingEnabled.value = !batchingEnabled.value
}

const toggleOcclusion = () => {
  occlusionEnabled.value = !occlusionEnabled.value
  updateOptimizedGraph()
}

const toggleStats = () => {
  showPerformanceStats.value = !showPerformanceStats.value
}

// 监听数据变化
watch(
  [() => graphData.value, () => filteredNodes.value],
  () => {
    if (graphData.value && filteredNodes.value.length > 0) {
      nextTick(() => {
        updateOptimizedGraph()
      })
    }
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  initOptimizedD3Graph()
  startPerformanceMonitoring()
  
  // 首次加载数据
  if (!graphData.value) {
    knowledgeGraphStore.loadGraphData()
  } else if (filteredNodes.value.length > 0) {
    nextTick(() => {
      updateOptimizedGraph()
    })
  }
})

onUnmounted(() => {
  if (simulation) {
    simulation.stop()
  }
})
</script>

<style scoped>
.performance-d3-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  overflow: hidden;
}

.performance-indicator {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px 15px;
  border-radius: 8px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  backdrop-filter: blur(10px);
}

.perf-stats {
  display: flex;
  gap: 15px;
}

.perf-stats span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.optimized-graph-canvas {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.optimized-graph-canvas:active {
  cursor: grabbing;
}

.performance-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 1000;
}

.performance-controls button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: #fff;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.performance-controls button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.performance-controls button.active {
  background: rgba(123, 97, 255, 0.8);
  box-shadow: 0 4px 15px rgba(123, 97, 255, 0.4);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  backdrop-filter: blur(5px);
}

.loading-spinner {
  text-align: center;
  color: #fff;
}

.loading-spinner i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #7B61FF;
}

.loading-spinner p {
  font-size: 1.1rem;
  margin: 0;
}

/* 优化的图谱元素样式 */
:deep(.optimized-node) {
  transition: opacity 0.3s ease;
}

:deep(.optimized-link) {
  transition: opacity 0.3s ease;
}

:deep(.optimized-node circle) {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}
</style> 