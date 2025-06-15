<template>
  <div class="knowledge-graph-container">
    <!-- 图谱主区域 -->
    <div class="graph-main-area">
      <div class="graph-header">
        <h2 class="graph-title">知识关系图谱</h2>
        <div class="graph-controls">
          <button class="btn btn-primary" @click="refreshData">
            <i class="fas fa-sync-alt"></i>
            刷新图谱
          </button>
        </div>
      </div>

      <!-- D3图谱 -->
      <svg id="graph-svg" ref="graphSvg"></svg>
      
      <!-- 加载状态覆盖层 -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载知识图谱中...</p>
        </div>
      </div>
      
      <!-- 错误状态覆盖层 -->
      <div v-if="error" class="error-overlay">
        <div class="error-content">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>加载失败</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary" @click="refreshData">重新加载</button>
        </div>
      </div>
        
      <!-- 缩放控制 -->
      <div class="zoom-controls">
        <button class="zoom-btn" @click="zoomIn">
          <i class="fas fa-plus"></i>
        </button>
        <button class="zoom-btn" @click="zoomOut">
          <i class="fas fa-minus"></i>
        </button>
        <button class="zoom-btn" @click="resetZoom">
          <i class="fas fa-expand-arrows-alt"></i>
        </button>
      </div>
        
      <!-- 图例 -->
      <div class="legend">
        <div class="legend-title">节点类型</div>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #7B61FF;"></div>
            <span class="legend-label">概念</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #10B981;"></div>
            <span class="legend-label">文章</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #F59E0B;"></div>
            <span class="legend-label">笔记</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { getGraphData, type GraphNode, type GraphLink } from '@/api/knowledgeGraph'

// 响应式数据
const loading = ref(true)
const error = ref('')
const nodeLimit = ref(500)

// 图谱数据
const allGraphData = ref<{nodes: GraphNode[], links: GraphLink[]}>({
  nodes: [],
  links: []
})

// DOM引用
const graphSvg = ref<SVGSVGElement | null>(null)

// D3相关变量
let simulation: d3.Simulation<GraphNode, GraphLink> | null = null
let zoom: d3.ZoomBehavior<Element, unknown> | null = null
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let linksG: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let nodesG: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let node: any = null; // To hold node selection
let link: any = null; // To hold link selection

// 工具函数
const getNodeColor = (type: string) => {
  const colors: Record<string, string> = {
    CONCEPT: '#7B61FF',
    ARTICLE: '#10B981',
    NOTE: '#F59E0B'
  }
  return colors[type] || '#6B6B70'
}

// 数据加载
const loadGraphData = async () => {
  try {
    loading.value = true
    error.value = ''
    console.log('🔄 开始加载图谱数据...')
    
    const response = await getGraphData({
      nodeType: 'ALL',
      search: '', // 搜索功能已简化，暂不使用
      limit: nodeLimit.value
    })
    
    console.log('📊 获取到图谱数据:', response)
    
    if (!response || !response.nodes || !response.links) {
      throw new Error("返回的数据格式不正确");
    }

    allGraphData.value = {
        nodes: response.nodes,
        links: response.links
    };

    // 等待DOM更新后初始化图谱
    await nextTick()
    
    if (simulation) {
      // 如果已初始化，则仅更新
      updateD3Graph()
    } else {
      // 首次加载时初始化
      initD3Graph()
    }
    
    console.log('✅ 图谱数据加载完成，准备渲染...');
    
  } catch (err: any) {
    console.error('❌ 加载图谱数据失败:', err)
    error.value = err.message || '未知错误，请查看控制台获取更多信息'
  } finally {
    loading.value = false
  }
}

// 首次初始化D3图谱
const initD3Graph = () => {
  if (!graphSvg.value) {
    console.error('SVG element not found for D3 initialization');
    return;
  }

  svg = d3.select(graphSvg.value);
  const width = graphSvg.value.clientWidth;
  const height = graphSvg.value.clientHeight;

  // 设置视口
  svg.attr('viewBox', [-width / 2, -height / 2, width, height]);

  // 创建连线和节点的容器
  linksG = svg.append('g').attr('class', 'links-group');
  nodesG = svg.append('g').attr('class', 'nodes-group');

  // 初始化力模拟
  simulation = d3.forceSimulation<GraphNode>()
    .force('link', d3.forceLink<GraphNode, GraphLink>().id((d: any) => d.id).distance(100).strength(0.5))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(0, 0))
    .force('collide', d3.forceCollide().radius(30));

  // 定义Tick函数 (这是唯一的位置)
  // 这个函数在模拟的每一个"滴答"时被调用，以更新元素的位置
  simulation.on('tick', () => {
    if (link) {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
    }
    if (node) {
      // 关键修复：只移动 <g> 容器，圆和文字相对于容器的位置是固定的
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    }
  });

  // 设置缩放行为
  zoom = d3.zoom().on('zoom', (event) => {
    if (nodesG) nodesG.attr('transform', event.transform);
    if (linksG) linksG.attr('transform', event.transform);
  });

  svg.call(zoom as any);
  
  // 第一次渲染
  updateD3Graph();
}


// 更新D3图谱 (数据绑定和元素创建/删除)
const updateD3Graph = () => {
  if (!simulation || !nodesG || !linksG) {
    console.warn('⚠️ D3组件未初始化，跳过更新');
    return;
  }

  const nodesData = allGraphData.value.nodes;
  const linksData = allGraphData.value.links;
  
  // --- 更新节点 ---
  node = nodesG.selectAll('g.node-group')
    .data(nodesData, (d: any) => d.id)
    .join(
      enter => { // 新进入的节点
        const nodeGroup = enter.append('g').attr('class', 'node-group');

        nodeGroup.append('circle')
          .attr('r', (d: any) => 5 + (d.importance || 0.5) * 15)
          .attr('fill', (d: any) => getNodeColor(d.type))
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer');

        nodeGroup.append('text')
          .text((d: any) => d.name)
          .attr('x', 15) // 固定x偏移
          .attr('y', 5)  // 固定y偏移
          .attr('font-size', '12px')
          .attr('fill', '#E0E0E0')
          .style('pointer-events', 'none'); // 文本不接受鼠标事件

        // 添加交互和过渡
        nodeGroup
          .call(drag(simulation as any) as any)
          .on('mouseover', (event, d) => {
            d3.select(event.currentTarget).select('circle').transition().duration(200).attr('r', (d: any) => 7 + (d.importance || 0.5) * 15);
          })
          .on('mouseout', (event, d) => {
            d3.select(event.currentTarget).select('circle').transition().duration(200).attr('r', (d: any) => 5 + (d.importance || 0.5) * 15);
          });
        
        // 淡入效果
        nodeGroup.attr('opacity', 0).transition().duration(500).attr('opacity', 1);

        return nodeGroup;
      },
      update => update, // 更新的节点 (如果需要改变样式等)
      exit => exit.transition().duration(500).attr('opacity', 0).remove() // 离开的节点
    );

  // --- 更新连线 ---
  link = linksG.selectAll('line.link')
    .data(linksData, (d: any) => `${d.source.id}-${d.target.id}`) // 确保连线有唯一ID
    .join(
      enter => enter.append('line')
        .attr('class', 'link')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0) // 开始时透明
        .attr('stroke-width', 1.5)
        .transition().duration(500)
        .attr('stroke-opacity', 0.6) as any, // 淡入, as any to fix type issue
      update => update,
      exit => exit.transition().duration(500).attr('stroke-opacity', 0).remove()
    );

  // 更新模拟的节点和连线数据
  simulation.nodes(nodesData);
  (simulation.force('link') as d3.ForceLink<any, any>).links(linksData);

  // 重启模拟
  simulation.alpha(0.3).restart();
  console.log(`✅ D3图谱更新完成: ${nodesData.length}个节点, ${linksData.length}条连线`);
}


// 生命周期
onMounted(async () => {
  console.log('🚀 增强知识图谱组件已挂载')
  await loadGraphData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  console.log('🔌 知识图谱组件已卸载')
  window.removeEventListener('resize', handleResize)
  if (simulation) {
    simulation.stop()
  }
})

// 处理窗口大小变化
const handleResize = () => {
  nextTick(() => {
    if (svg && graphSvg.value) {
        const width = graphSvg.value.clientWidth;
        const height = graphSvg.value.clientHeight;
        svg.attr('viewBox', [-width / 2, -height / 2, width, height]);
        (simulation?.force('center') as d3.ForceCenter<any>).x(0).y(0);
        simulation?.alpha(0.3).restart();
    }
  });
}

// D3拖拽辅助函数
function drag(simulation: d3.Simulation<GraphNode, any>) {
  function dragstarted(event: any, d: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event: any, d: any) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event: any, d: any) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}


// 缩放控制
const zoomIn = () => {
  if (svg && zoom) {
    svg.transition().duration(300).call(zoom.scaleBy as any, 1.5)
  }
}

const zoomOut = () => {
  if (svg && zoom) {
    svg.transition().duration(300).call(zoom.scaleBy as any, 1 / 1.5)
  }
}

const resetZoom = () => {
  if (svg && zoom) {
    svg.transition().duration(750).call(zoom.transform as any, d3.zoomIdentity)
  }
}

const refreshData = () => {
  loadGraphData()
}
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --color-bg-primary: #111111;
  --color-bg-secondary: #18181B;
  --color-bg-tertiary: #1F1F23;
  --color-bg-hover: rgba(255, 255, 255, 0.05);
  --color-text-primary: #E0E0E0;
  --color-text-secondary: #A0A0A5;
  --color-text-disabled: #6B6B70;
  --color-accent-primary: #7B61FF;
  --color-accent-secondary: #3B82F6;
  --color-border-primary: #2D2D33;
  --color-border-secondary: #4A4A52;
  --border-radius-s: 4px;
  --border-radius-m: 6px;
  --border-radius-l: 8px;
  --spacing-unit: 4px;
  --transition-speed-fast: 0.1s ease-out;
  --transition-speed-normal: 0.15s ease-out;
}

.knowledge-graph-container {
  display: grid;
  grid-template-columns: 1fr; /* Only one column */
  height: 100vh;
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  overflow: hidden;
}

.graph-main-area {
  background-color: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.graph-header {
  padding: calc(var(--spacing-unit) * 6);
  border-bottom: 1px solid var(--color-border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.graph-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.graph-controls {
  display: flex;
  gap: calc(var(--spacing-unit) * 2);
}

.btn {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
}

.btn:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.btn.active {
  background-color: var(--color-accent-primary);
  color: white;
  border-color: var(--color-accent-primary);
}

.btn-primary {
  background-color: var(--color-accent-primary);
  color: white;
  border-color: var(--color-accent-primary);
}

.btn-primary:hover {
  background-color: rgba(123, 97, 255, 0.8);
}

#graph-svg {
  flex: 1;
  width: 100%;
  height: 100%;
  background-color: var(--color-bg-primary);
}

.zoom-controls {
  position: absolute;
  top: calc(var(--spacing-unit) * 20);
  right: calc(var(--spacing-unit) * 6);
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
  z-index: 10;
}

.zoom-btn {
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-primary);
  border-radius: 50%;
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed-fast);
}

.zoom-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.legend {
  position: absolute;
  bottom: calc(var(--spacing-unit) * 6);
  left: calc(var(--spacing-unit) * 6);
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-l);
  padding: calc(var(--spacing-unit) * 4);
  z-index: 10;
}

.legend-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: calc(var(--spacing-unit) * 3);
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-label {
  font-size: 12px;
  color: var(--color-text-secondary);
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
  background-color: rgba(17, 17, 17, 0.8);
  backdrop-filter: blur(5px);
  z-index: 10;
}

.loading-content,
.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--spacing-unit) * 4);
  text-align: center;
}

.loading-content i {
  font-size: 32px;
  color: var(--color-accent-primary);
}

.loading-content p {
  font-size: 16px;
  color: var(--color-text-secondary);
}

.error-content i {
  font-size: 32px;
  color: #ef4444;
}

.error-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.error-content p {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}
</style> 