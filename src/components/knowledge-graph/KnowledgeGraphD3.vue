<template>
  <div class="graph-d3-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
        <p>加载图谱数据中...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-overlay">
      <div class="error-content">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button @click="retryLoad" class="retry-btn">重新加载</button>
      </div>
    </div>

    <!-- D3.js 图谱容器 -->
    <div
      ref="graphContainer"
      class="graph-canvas"
      @contextmenu.prevent
    ></div>

    <!-- 图谱控制器 -->
    <KnowledgeGraphControls
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @reset-zoom="handleResetZoom"
      @center-graph="handleCenterGraph"
      @toggle-physics="handleTogglePhysics"
      @toggle-labels="handleToggleLabels"
      @toggle-connections="handleToggleConnections"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as d3 from 'd3'
import { useKnowledgeGraphStore } from '@/stores/knowledgeGraphStore'
import type { GraphNode, GraphLink } from '@/api/knowledgeGraph'
import KnowledgeGraphControls from './KnowledgeGraphControls.vue'

// 状态管理
const knowledgeGraphStore = useKnowledgeGraphStore()

// DOM引用
const graphContainer = ref<HTMLDivElement>()

// 本地状态
const showLabels = ref(true)
const showConnections = ref(true)
const physicsEnabled = ref(true)
const debugMode = ref(true) // 添加调试模式

// D3相关变量
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
let g: d3.Selection<SVGGElement, unknown, null, undefined>
let simulation: d3.Simulation<GraphNode, undefined>
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown>

// 计算属性
const loading = computed(() => knowledgeGraphStore.loading)
const error = computed(() => knowledgeGraphStore.error)
const graphData = computed(() => knowledgeGraphStore.graphData)
const filteredNodes = computed(() => knowledgeGraphStore.filteredNodes)
const visibleLinks = computed(() => knowledgeGraphStore.visibleLinks)
const currentLayout = computed(() => knowledgeGraphStore.currentLayout)
const highlightedNodeIds = computed(() => knowledgeGraphStore.highlightedNodeIds)
const searchMode = computed(() => knowledgeGraphStore.searchMode)
const focusedNodeId = computed(() => knowledgeGraphStore.focusedNodeId)
const selectedNodeId = computed(() => knowledgeGraphStore.selectedNodeId)
const animating = computed(() => knowledgeGraphStore.animating)

// 节点类型颜色映射
const nodeColors = {
  CONCEPT: '#7B61FF',
  ARTICLE: '#10B981',
  NOTE: '#FF9800',
  concept: '#7B61FF',
  article: '#10B981',
  author: '#F59E0B',
  tag: '#EF4444'
}

// 连线强度映射
const linkStrengthMap = {
  weak: 0.3,
  medium: 0.7,
  strong: 1.0
}

// 初始化D3图谱
const initD3Graph = () => {
  if (!graphContainer.value) return

  const container = graphContainer.value
  const rect = container.getBoundingClientRect()
  const width = rect.width
  const height = rect.height
  
  console.log('初始化D3图谱，容器尺寸:', width, 'x', height)

  // 清除之前的SVG
  d3.select(container).selectAll('svg').remove()

  // 创建SVG
  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background-color', 'var(--color-bg-primary)')

  // 创建缩放行为
  zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom)

  // 创建主绘图组
  g = svg.append('g')

  // 初始化力模拟
  initSimulation(width, height)
}

// 初始化力模拟
const initSimulation = (width: number, height: number) => {
  simulation = d3.forceSimulation<GraphNode>()
    .force('link', d3.forceLink<GraphNode, GraphLink>().id(d => d.id).distance(100)) // 增加连线距离
    .force('charge', d3.forceManyBody().strength(-500)) // 增加斥力
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(50)) // 增加碰撞半径
    .velocityDecay(0.4) // 增加阻尼，让布局更稳定
}

// 更新图谱
const updateGraph = () => {
  if (!svg || !g || !simulation) return

  const nodes = [...filteredNodes.value]
  const links = [...visibleLinks.value]
  
  console.log('更新图谱，节点数:', nodes.length, '连线数:', links.length)
  
  if (debugMode.value) {
    console.log('节点详情:', nodes)
    console.log('连线详情:', links)
  }

  // 更新连线
  const linkSelection = g.selectAll('.link')
    .data(links, (d: any) => `${d.source.id || d.source}-${d.target.id || d.target}`)

  linkSelection.exit().remove()

  const linkEnter = linkSelection.enter()
    .append('line')
    .attr('class', 'link')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', (d: GraphLink) => Math.sqrt(d.strength * 4))

  const linkMerge = linkEnter.merge(linkSelection as any)
  
  // 根据显示设置控制连线可见性
  linkMerge.style('display', showConnections.value ? 'block' : 'none')

  // 更新节点
  const nodeSelection = g.selectAll('.node')
    .data(nodes, (d: any) => d.id)

  nodeSelection.exit().remove()

  const nodeEnter = nodeSelection.enter()
    .append('g')
    .attr('class', 'node')
    .style('cursor', 'pointer')
    .call(d3.drag<SVGGElement, GraphNode>()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded)
    )

  // 添加节点圆圈
  nodeEnter.append('circle')
    .attr('r', 20)
    .attr('fill', (d: GraphNode) => nodeColors[d.type] || '#999')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  // 添加节点图标
  nodeEnter.append('text')
    .attr('class', 'node-icon')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-family', 'Font Awesome 6 Free')
    .attr('font-weight', 900)
    .attr('font-size', '12px')
    .attr('fill', 'white')
    .text((d: GraphNode) => getNodeIcon(d.type))

  // 添加节点标签
  nodeEnter.append('text')
    .attr('class', 'node-label')
    .attr('text-anchor', 'middle')
    .attr('dy', 35)
    .attr('font-size', '12px')
    .attr('fill', 'var(--color-text-primary)')
    .text((d: GraphNode) => d.name)
    .style('display', showLabels.value ? 'block' : 'none') // 根据显示设置控制标签可见性

  const nodeMerge = nodeEnter.merge(nodeSelection as any)

  // 节点点击事件
  nodeMerge.on('click', (event: MouseEvent, d: GraphNode) => {
    event.stopPropagation()
    knowledgeGraphStore.selectNode(d.id)
  })

  // 节点悬停事件
  nodeMerge.on('mouseenter', (event: MouseEvent, d: GraphNode) => {
    // 高亮节点
    d3.select(event.currentTarget as SVGGElement)
      .select('circle')
      .attr('stroke-width', 3)
      .attr('stroke', '#FFD700')
  })
  .on('mouseleave', (event: MouseEvent, d: GraphNode) => {
    // 取消高亮（除非是选中或高亮状态）
    const isSelected = selectedNodeId.value === d.id
    const isHighlighted = highlightedNodeIds.value.includes(d.id)
    const isFocused = focusedNodeId.value === d.id
    
    if (!isSelected && !isHighlighted && !isFocused) {
      d3.select(event.currentTarget as SVGGElement)
        .select('circle')
        .attr('stroke-width', 2)
        .attr('stroke', '#fff')
    }
  })

  // 应用节点状态样式
  nodeMerge.each(function(d: GraphNode) {
    const nodeElement = d3.select(this as SVGGElement)
    const circle = nodeElement.select('circle')
    const label = nodeElement.select('.node-label')
    
    // 重置样式
    circle
      .attr('stroke-width', 2)
      .attr('stroke', '#fff')
      .attr('opacity', 1)
    
    label
      .attr('opacity', 1)
      .style('display', showLabels.value ? 'block' : 'none')
    
    // 选中状态
    if (selectedNodeId.value === d.id) {
      circle
        .attr('stroke-width', 4)
        .attr('stroke', '#FFD700')
    }
    
    // 高亮状态
    if (highlightedNodeIds.value.includes(d.id)) {
      circle
        .attr('stroke-width', 3)
        .attr('stroke', '#FF5722')
    }
    
    // 聚焦状态
    if (focusedNodeId.value === d.id) {
      circle
        .attr('stroke-width', 4)
        .attr('stroke', '#00BCD4')
    }
    
    // 搜索模式下非结果节点
    if (searchMode.value && !highlightedNodeIds.value.includes(d.id)) {
      circle.attr('opacity', 0.3)
      label.attr('opacity', 0.3)
    }
  })

  // 更新力模拟
  simulation.nodes(nodes)
  
  const linkForce = simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>
  linkForce.links(links)
  
  // 如果启用物理引擎，重启模拟
  if (physicsEnabled.value) {
    simulation.alpha(0.3).restart()
  } else {
    simulation.stop()
  }
  
  // 模拟每一帧的更新
  simulation.on('tick', () => {
    // 更新连线位置
    linkMerge
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)
    
    // 更新节点位置
    nodeMerge.attr('transform', (d: GraphNode) => `translate(${d.x},${d.y})`)
  })
  
  // 自动缩放以适应所有节点
  nextTick(() => {
    autoZoomToFit()
  })
}

// 新增：自动缩放以适应所有节点
const autoZoomToFit = () => {
  if (!svg || !g) return
  
  // 获取图谱的边界
  const bounds = g.node()?.getBBox()
  if (!bounds) return
  
  console.log('图谱边界:', bounds)
  
  const container = graphContainer.value
  if (!container) return
  
  const width = container.clientWidth
  const height = container.clientHeight
  
  const dx = bounds.width
  const dy = bounds.height
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  
  // 计算适合的缩放比例
  const scale = 0.8 / Math.max(dx / width, dy / height)
  const translate = [width / 2 - scale * x, height / 2 - scale * y]
  
  console.log('自动缩放参数:', {scale, translate})
  
  // 应用缩放变换
  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity
      .translate(translate[0], translate[1])
      .scale(scale))
}

// 拖拽开始
const dragStarted = (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
  if (!event.active) simulation.alphaTarget(0.3).restart()
  d.fx = d.x
  d.fy = d.y
}

// 拖拽中
const dragged = (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
  d.fx = event.x
  d.fy = event.y
}

// 拖拽结束
const dragEnded = (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
  if (!event.active) simulation.alphaTarget(0)
  // 保存节点位置
  knowledgeGraphStore.saveNodePosition(d.id, d.x as number, d.y as number)
  
  // 如果不启用物理引擎，则固定位置
  if (!physicsEnabled.value) {
    d.fx = d.x
    d.fy = d.y
  } else {
    d.fx = undefined
    d.fy = undefined
  }
}

// 缩放处理
const handleZoomIn = () => {
  svg.transition()
    .duration(300)
    .call(zoom.scaleBy, 1.3)
}

const handleZoomOut = () => {
  svg.transition()
    .duration(300)
    .call(zoom.scaleBy, 0.7)
}

const handleResetZoom = () => {
  autoZoomToFit()
}

const handleCenterGraph = () => {
  const container = graphContainer.value
  if (!container) return
  
  const width = container.clientWidth
  const height = container.clientHeight
  
  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(1))
}

// 控制功能
const handleTogglePhysics = () => {
  physicsEnabled.value = !physicsEnabled.value
  if (physicsEnabled.value) {
    simulation.alpha(0.3).restart()
  } else {
    simulation.stop()
    // 固定所有节点位置
    filteredNodes.value.forEach((node) => {
      node.fx = node.x
      node.fy = node.y
    })
  }
}

const handleToggleLabels = () => {
  showLabels.value = !showLabels.value
  // 更新标签显示
  g.selectAll('.node-label')
    .style('display', showLabels.value ? 'block' : 'none')
}

const handleToggleConnections = () => {
  showConnections.value = !showConnections.value
  // 更新连线显示
  g.selectAll('.link')
    .style('display', showConnections.value ? 'block' : 'none')
}

// 获取节点图标
const getNodeIcon = (type: string): string => {
  switch (type.toUpperCase()) {
    case 'CONCEPT':
      return '\uf0eb' // lightbulb
    case 'ARTICLE':
      return '\uf15c' // file-text
    case 'NOTE':
      return '\uf249' // sticky-note
    case 'AUTHOR':
      return '\uf007' // user
    case 'TAG':
      return '\uf02b' // tag
    default:
      return '\uf128' // question
  }
}

// 重试加载
const retryLoad = () => {
  knowledgeGraphStore.loadGraphData()
}

// 监听数据变化
watch(
  [() => graphData.value, () => filteredNodes.value, () => visibleLinks.value],
  () => {
    if (graphData.value && filteredNodes.value.length > 0) {
      nextTick(() => {
        updateGraph()
      })
    }
  },
  { deep: true }
)

// 监听布局变化
watch(
  () => currentLayout.value,
  (newLayout) => {
    if (!simulation || !filteredNodes.value.length) return
    
    const container = graphContainer.value
    if (!container) return
    
    const width = container.clientWidth
    const height = container.clientHeight
    
    switch (newLayout) {
      case 'force':
        // 重置力模拟
        simulation.alpha(1).restart()
        // 释放固定位置
        filteredNodes.value.forEach((node) => {
          node.fx = undefined
          node.fy = undefined
        })
        break
      
      case 'circular':
        // 圆形布局
        const radius = Math.min(width, height) / 2 - 100
        const angleStep = (2 * Math.PI) / filteredNodes.value.length
        
        filteredNodes.value.forEach((node, i) => {
          const angle = i * angleStep
          node.x = width / 2 + radius * Math.cos(angle)
          node.y = height / 2 + radius * Math.sin(angle)
          node.fx = node.x
          node.fy = node.y
        })
        
        simulation.alpha(0.3).restart()
        break
      
      case 'hierarchical':
        // 简化的分层布局实现（不使用d3.tree）
        // 按节点类型分组
        const nodeTypes = Array.from(new Set(filteredNodes.value.map(node => node.type)));
        const rowHeight = height / (nodeTypes.length + 1);
        
        // 为每种类型的节点安排一行
        nodeTypes.forEach((type, typeIndex) => {
          // 筛选此类型的节点
          const typeNodes = filteredNodes.value.filter(node => node.type === type);
          const rowWidth = width / (typeNodes.length + 1);
          
          // 水平排列此类型的节点
          typeNodes.forEach((node, nodeIndex) => {
            node.x = rowWidth * (nodeIndex + 1);
            node.y = rowHeight * (typeIndex + 1);
            node.fx = node.x;
            node.fy = node.y;
          });
        });
        
        simulation.alpha(0.3).restart();
        break
    }
  }
)

// 生命周期钩子
onMounted(() => {
  const container = graphContainer.value
  if (!container) return
  
  const { width, height } = container.getBoundingClientRect()
  
  console.log('组件挂载，容器尺寸:', width, 'x', height)
  
  // 初始化D3图谱
  initD3Graph()
  
  // 首次加载数据
  if (!graphData.value) {
    knowledgeGraphStore.loadGraphData()
  } else if (filteredNodes.value.length > 0) {
    // 如果已有数据，更新图谱
    nextTick(() => {
      updateGraph()
    })
  }
  
  // 监听窗口大小变化
  const handleResize = () => {
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    if (svg) {
      svg.attr('width', rect.width).attr('height', rect.height)
    }
    
    // 更新力模拟中心点
    if (simulation) {
      const centerForce = simulation.force('center') as d3.ForceCenter<GraphNode>
      centerForce.x(rect.width / 2).y(rect.height / 2)
      
      // 如果有节点，重新开始模拟
      if (filteredNodes.value.length > 0) {
        simulation.alpha(0.3).restart()
      }
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    // 停止模拟
    if (simulation) {
      simulation.stop()
    }
  })
})
</script>

<style scoped>
.graph-d3-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.graph-canvas {
  width: 100%;
  height: 100%;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--color-bg-primary-rgb), 0.9);
  z-index: 10;
}

.loading-spinner {
  text-align: center;
}

.loading-spinner i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.error-content {
  text-align: center;
  padding: 2rem;
  max-width: 80%;
}

.error-content i {
  font-size: 2rem;
  color: var(--color-danger);
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background-color: var(--color-primary-dark);
}
</style> 