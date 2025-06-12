<template>
  <div class="knowledge-graph-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h1 class="page-title">知识图谱</h1>
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="搜索节点..."
          v-model="searchQuery"
          @input="handleSearch"
          />
        </div>
      </div>
        
      <div class="filters-section">
        <div class="filter-group">
          <div class="filter-label">节点类型</div>
          <div class="filter-options">
            <div class="filter-option">
              <input type="checkbox" id="concept" v-model="filters.concept" @change="updateFilters" />
              <label for="concept">概念</label>
              <span class="filter-count">{{ nodeTypeCounts.concept || 0 }}</span>
            </div>
            <div class="filter-option">
              <input type="checkbox" id="article" v-model="filters.article" @change="updateFilters" />
              <label for="article">文章</label>
              <span class="filter-count">{{ nodeTypeCounts.article || 0 }}</span>
            </div>
            <div class="filter-option">
              <input type="checkbox" id="note" v-model="filters.note" @change="updateFilters" />
              <label for="note">笔记</label>
              <span class="filter-count">{{ nodeTypeCounts.note || 0 }}</span>
            </div>
          </div>
      </div>
      
        <div class="filter-group">
          <div class="filter-label">布局类型</div>
          <div class="layout-options">
            <button class="btn btn-sm" :class="{ active: layoutType === 'force' }" @click="setLayout('force')">
              力导向
            </button>
            <button class="btn btn-sm" :class="{ active: layoutType === 'tree' }" @click="setLayout('tree')">
              树形
            </button>
            <button class="btn btn-sm" :class="{ active: layoutType === 'circle' }" @click="setLayout('circle')">
              环形
            </button>
          </div>
        </div>
        
        <div class="filter-group">
          <div class="filter-label">显示数量</div>
          <div class="limit-options">
            <select v-model="nodeLimit" @change="loadGraphData" class="limit-select">
              <option value="100">100个节点</option>
              <option value="200">200个节点</option>
              <option value="500">500个节点</option>
              <option value="1000">1000个节点</option>
              <option value="2000">2000个节点</option>
            </select>
          </div>
        </div>
        </div>
        
      <div class="nodes-list">
        <div 
          v-for="node in filteredNodes" 
          :key="node.id"
          class="node-item"
          :class="{ active: selectedNodeId === node.id }"
          @click="selectNode(node)"
        >
          <div class="node-icon" :class="node.type.toLowerCase()">
            <i :class="getNodeIcon(node.type)"></i>
          </div>
          <div class="node-info">
            <div class="node-name">{{ node.name }}</div>
            <div class="node-type">{{ getNodeTypeLabel(node.type) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图谱主区域 -->
    <div class="graph-container">
      <div class="graph-header">
        <h2 class="graph-title">知识关系图谱</h2>
        <div class="graph-controls">
          <button 
            class="btn" 
            :class="{ active: layoutType === 'force' }"
            @click="setLayout('force')"
          >
            <i class="fas fa-project-diagram"></i>
            力导向布局
          </button>
          <button 
            class="btn" 
            :class="{ active: layoutType === 'tree' }"
            @click="setLayout('tree')"
          >
            <i class="fas fa-sitemap"></i>
            树形布局
          </button>
          <button 
            class="btn" 
            :class="{ active: layoutType === 'circle' }"
            @click="setLayout('circle')"
          >
            <i class="fas fa-circle-notch"></i>
            环形布局
          </button>
          <button class="btn btn-primary" @click="resetGraph">
            <i class="fas fa-sync-alt"></i>
            刷新图谱
          </button>
        </div>
      </div>
      
      <!-- D3图谱 - 始终渲染 -->
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
      
      <!-- 右侧详情面板 -->
    <div class="details-panel" v-show="selectedNodeId">
      <div class="details-header">
                 <h3 class="details-title">{{ selectedNodeDetails?.name || '选择节点' }}</h3>
         <p class="details-subtitle">{{ selectedNodeDetails ? getNodeTypeLabel(selectedNodeDetails.type) : '' }}</p>
        <button class="close-btn" @click="closeDetails">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="details-content" v-if="selectedNodeDetails">
        <div class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <div class="property-item">
            <span class="property-label">类型</span>
            <span class="property-value">{{ getNodeTypeLabel(selectedNodeDetails.type) }}</span>
          </div>
          <div class="property-item" v-if="selectedNodeDetails.properties?.createdAt">
            <span class="property-label">创建时间</span>
            <span class="property-value">{{ formatDate(selectedNodeDetails.properties.createdAt) }}</span>
          </div>
          <div class="property-item" v-if="selectedNodeDetails.importance">
            <span class="property-label">重要性</span>
            <span class="property-value">{{ Math.round(selectedNodeDetails.importance * 100) }}%</span>
          </div>
          <div class="property-item">
            <span class="property-label">连接数</span>
            <span class="property-value">{{ getNodeConnections(selectedNodeDetails.id) }}</span>
      </div>
    </div>
    
        <div class="detail-section" v-if="selectedNodeDetails.properties?.description">
          <h4 class="section-title">描述</h4>
          <p class="description-text">{{ selectedNodeDetails.properties.description }}</p>
      </div>
        
        <div class="detail-section" v-if="relatedNodes.length > 0">
          <h4 class="section-title">相关节点</h4>
          <div class="related-items">
            <div 
              v-for="related in relatedNodes" 
              :key="related.id"
              class="related-item"
              @click="selectRelatedNode(related.id)"
            >
              <div class="related-icon" :class="related.type.toLowerCase()">
                <i :class="getNodeIcon(related.type)"></i>
              </div>
              <div class="related-info">
                <div class="related-name">{{ related.name }}</div>
                <div class="related-type">{{ getNodeTypeLabel(related.type) }} • {{ getRelationshipType(selectedNodeDetails.id, related.id) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 实时更新通知 -->
    <div v-if="recentUpdates.length > 0" class="update-notifications">
      <transition-group name="notification" tag="div">
        <div 
          v-for="update in recentUpdates" 
          :key="update.id"
          class="update-notification"
          @click="dismissUpdate(update.id)"
        >
          <i :class="getUpdateIcon(update.type)"></i>
          <span>{{ getUpdateMessage(update) }}</span>
          <i class="fas fa-times close-icon"></i>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { getGraphData, type GraphNode, type GraphLink } from '@/api/knowledgeGraph'

// 路由
const router = useRouter()

// 响应式数据
const searchQuery = ref('')
const layoutType = ref('force')
const loading = ref(true)
const error = ref('')
const selectedNodeId = ref<string | null>(null)
const recentUpdates = ref<Array<{id: string, type: string, message: string, timestamp: number}>>([])
const nodeLimit = ref(500)  // 可配置的节点数量限制

// 过滤器状态
const filters = ref({
  concept: true,
  article: true,
  note: true
})

// 图谱数据
const graphData = ref<{nodes: GraphNode[], links: GraphLink[]}>({
  nodes: [],
  links: []
})

// DOM引用
const graphSvg = ref<SVGElement>()

// D3相关变量
let simulation: any = null
let zoom: any = null
let svg: any = null
let nodesG: any = null
let linksG: any = null

// 计算属性
const nodeTypeCounts = computed(() => {
  const counts = { concept: 0, article: 0, note: 0 }
  graphData.value.nodes.forEach(node => {
    if (node.type === 'CONCEPT') counts.concept++
    else if (node.type === 'ARTICLE') counts.article++
    else if (node.type === 'NOTE') counts.note++
  })
  return counts
})

const filteredNodes = computed(() => {
  return graphData.value.nodes.filter(node => {
    // 应用搜索过滤
    if (searchQuery.value && !node.name.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      return false
    }
    
    // 应用类型过滤
    if (node.type === 'CONCEPT' && !filters.value.concept) return false
    if (node.type === 'ARTICLE' && !filters.value.article) return false
    if (node.type === 'NOTE' && !filters.value.note) return false
    
    return true
  })
})

const selectedNodeDetails = computed(() => {
  if (!selectedNodeId.value) return null
  return graphData.value.nodes.find(node => node.id === selectedNodeId.value) || null
})

const relatedNodes = computed(() => {
  if (!selectedNodeId.value) return []
  
  const connectedNodeIds = new Set<string>()
  graphData.value.links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    
    if (sourceId === selectedNodeId.value) {
      connectedNodeIds.add(targetId)
    } else if (targetId === selectedNodeId.value) {
      connectedNodeIds.add(sourceId)
    }
  })
  
  return graphData.value.nodes.filter(node => 
    connectedNodeIds.has(node.id) && node.id !== selectedNodeId.value
  )
})

// 工具函数
const getNodeColor = (type: string) => {
  const colors = {
    CONCEPT: '#7B61FF',
    ARTICLE: '#10B981',
    NOTE: '#F59E0B'
  }
  return colors[type as keyof typeof colors] || '#6B6B70'
}

const getNodeIcon = (type: string) => {
  const icons = {
    CONCEPT: 'fas fa-lightbulb',
    ARTICLE: 'fas fa-file-alt',
    NOTE: 'fas fa-sticky-note'
  }
  return icons[type as keyof typeof icons] || 'fas fa-circle'
}

const getNodeTypeLabel = (type: string) => {
  const labels = {
    CONCEPT: '概念',
    ARTICLE: '文章',
    NOTE: '笔记'
  }
  return labels[type as keyof typeof labels] || type
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getNodeConnections = (nodeId: string) => {
  return graphData.value.links.filter(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    return sourceId === nodeId || targetId === nodeId
  }).length
}

const getRelationshipType = (sourceId: string, targetId: string) => {
  const link = graphData.value.links.find(link => {
    const linkSourceId = typeof link.source === 'string' ? link.source : link.source.id
    const linkTargetId = typeof link.target === 'string' ? link.target : link.target.id
    return (linkSourceId === sourceId && linkTargetId === targetId) ||
           (linkSourceId === targetId && linkTargetId === sourceId)
  })
  return link?.type || '相关'
}

// 数据加载
const loadGraphData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    console.log('🔄 开始加载图谱数据...')
    
    const response = await getGraphData({
      nodeType: 'ALL',
      search: searchQuery.value,
      limit: nodeLimit.value
    })
    
    console.log('📊 获取到图谱数据 - API响应:', response)
    console.log('📊 数据统计:', {
      节点数量: response.data.nodes?.length || 0,
      连线数量: response.data.links?.length || 0,
      原始edges数量: response.data.edges?.length || 0
    })
    
    // 详细检查数据结构
    if (response.data.nodes && response.data.nodes.length > 0) {
      console.log('📊 节点示例结构:', {
        第一个节点: response.data.nodes[0],
        节点字段: Object.keys(response.data.nodes[0] || {}),
        类型分布: response.data.nodes.reduce((acc: any, node: any) => {
          acc[node.type] = (acc[node.type] || 0) + 1;
          return acc;
        }, {})
      })
    } else {
      console.warn('⚠️ 没有获取到节点数据');
    }
    
    if (response.data.links && response.data.links.length > 0) {
      console.log('📊 连线示例结构:', {
        第一个连线: response.data.links[0],
        连线字段: Object.keys(response.data.links[0] || {}),
        连线类型分布: response.data.links.reduce((acc: any, link: any) => {
          acc[link.type] = (acc[link.type] || 0) + 1;
          return acc;
        }, {})
      })
    } else {
      console.warn('⚠️ 没有获取到连线数据');
    }
    
    // 判断数据是否为测试数据
    const hasTestNodes = response.data.nodes?.some((node: GraphNode) => 
      node.id?.includes('测试') || node.name?.includes('测试'))
    if (hasTestNodes) {
      console.warn('⚠️ 检测到测试数据! 这可能表明后端回退到了测试数据')
    }
    
    // 验证数据完整性
    const dataIntegrity = validateLoadedData(response.data);
    console.log('🔍 数据完整性检查:', dataIntegrity);
    
    if (!dataIntegrity.isValid) {
      console.error('❌ 数据完整性验证失败:', dataIntegrity.issues);
      error.value = `数据验证失败: ${dataIntegrity.issues.join(', ')}`;
      return;
    }
    
    // 如果没有任何数据，显示友好的提示
    if (dataIntegrity.nodeCount === 0) {
      console.warn('⚠️ 后端返回空数据，可能需要先分析一些文章或笔记');
      error.value = '暂无图谱数据。请先在RSS阅读器中阅读一些文章，或创建一些笔记，系统会自动生成知识图谱。';
      return;
    }
    
    graphData.value = response.data
    
    // 等待DOM更新后初始化图谱
    await nextTick();
    
    // 确保SVG容器已经渲染，如果没有则等待
    const waitForSvg = () => {
      return new Promise<void>((resolve) => {
        const checkSvg = () => {
          if (graphSvg.value) {
            console.log('✅ SVG容器已就绪，开始初始化图谱');
            resolve();
          } else {
            console.log('⏳ 等待SVG容器渲染...');
            setTimeout(checkSvg, 50);
          }
        };
        checkSvg();
      });
    };
    
    await waitForSvg();
    initD3Graph()
    
    console.log('✅ 图谱数据加载完成，准备渲染...');
    
  } catch (err: any) {
    console.error('❌ 加载图谱数据失败:', err)
    console.error('❌ 错误详情:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      config: err.config
    })
    
    // 提供更详细的错误信息
    if (err.response?.status === 403) {
      error.value = '权限不足，请检查登录状态'
    } else if (err.response?.status === 404) {
      error.value = 'API端点不存在，请检查后端服务是否正常运行'
    } else if (err.response?.status === 500) {
      error.value = '服务器内部错误，请稍后重试或联系管理员'
    } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
      error.value = '网络连接失败，请检查网络状态和后端服务'
    } else if (err.message.includes('timeout')) {
      error.value = '请求超时，请稍后重试'
    } else {
      error.value = err.message || '未知错误，请查看控制台获取更多信息'
    }
  } finally {
    loading.value = false
  }
}

/**
 * 验证加载的数据
 */
const validateLoadedData = (data: any) => {
  const issues: string[] = [];
  
  // 检查基本结构
  if (!data) {
    issues.push('数据为空');
    return { isValid: false, issues, nodeCount: 0, linkCount: 0 };
  }
  
  if (!Array.isArray(data.nodes)) {
    issues.push('节点数据不是数组格式');
  }
  
  if (!Array.isArray(data.links)) {
    issues.push('连线数据不是数组格式');
  }
  
  const nodeCount = data.nodes?.length || 0;
  const linkCount = data.links?.length || 0;
  
  // 检查节点数据
  if (nodeCount > 0) {
    const invalidNodes = data.nodes.filter((node: any) => 
      !node.id || !node.name || !node.type
    );
    
    if (invalidNodes.length > 0) {
      issues.push(`${invalidNodes.length}个节点缺少必要字段 (id/name/type)`);
    }
  }
  
  // 检查连线数据
  if (linkCount > 0) {
    const invalidLinks = data.links.filter((link: any) => 
      !link.source || !link.target
    );
    
    if (invalidLinks.length > 0) {
      issues.push(`${invalidLinks.length}个连线缺少必要字段 (source/target)`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    nodeCount,
    linkCount
  };
}

// 生命周期
onMounted(async () => {
  console.log('🚀 增强知识图谱组件已挂载')
  
  // 加载初始数据
  await loadGraphData()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // 确保DOM完全渲染后再初始化D3
  nextTick(() => {
    if (graphSvg.value) {
      // 初始化图谱并自动进行布局
      initD3Graph();
      
      // 延时刷新以确保连线显示
      setTimeout(() => {
        console.log('🔄 增强图谱显示...');
        
        // 先强制一次布局计算
        if (simulation) {
          // 手动运行一些tick以预热布局
          for (let i = 0; i < 20; i++) {
            simulation.tick();
          }
          
          // 然后重新渲染
          updateD3Graph();
        }
      }, 1000);
    } else {
      console.error('❌ graphSvg引用不可用，无法初始化图谱');
    }
  });
})

onUnmounted(() => {
  console.log('🔌 知识图谱组件已卸载')
  window.removeEventListener('resize', handleResize)
  
  // 清理D3资源
  if (simulation) {
    simulation.stop()
  }
})

// 处理窗口大小变化
const handleResize = () => {
  nextTick(() => {
    if (graphSvg.value) {
      initD3Graph()
    }
  })
}

// 事件处理
const handleSearch = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
  updateD3Graph()
}

const updateFilters = () => {
  updateD3Graph()
}

const setLayout = (layout: string) => {
  layoutType.value = layout
  updateD3Layout()
}

// D3图谱初始化
const initD3Graph = () => {
  if (!graphSvg.value) {
    console.error('❌ SVG容器不存在，无法初始化图谱');
    return;
  }
  
  console.log('🎨 开始初始化D3图谱...');
  
  // 获取容器尺寸
  const containerRect = graphSvg.value.parentElement?.getBoundingClientRect();
  const width = containerRect?.width || 800;
  const height = containerRect?.height || 600;
  
  console.log('📐 图谱容器尺寸:', { width, height });
  
  // 清除现有内容
  d3.select(graphSvg.value).selectAll('*').remove()
  
  svg = d3.select(graphSvg.value)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('background-color', 'var(--color-bg-primary)')
  
  // 创建缩放行为
  zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      svg.select('.graph-group').attr('transform', event.transform)
    })
  
  svg.call(zoom)
  
  // 添加背景点击事件（取消选择）
  svg.on('click', (event: MouseEvent) => {
    if (event.target === svg.node()) {
      closeDetails();
    }
  });
  
  // 添加箭头定义
  svg.append('defs').append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 20)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#999');
  
  // 创建图谱组
  const graphGroup = svg.append('g')
    .attr('class', 'graph-group')
  
  // 创建连线和节点组（连线在下，节点在上）
  linksG = graphGroup.append('g').attr('class', 'links')
  nodesG = graphGroup.append('g').attr('class', 'nodes')
  
  // 初始化力导向模拟 - 优化配置参数
  simulation = d3.forceSimulation()
    .force('link', d3.forceLink()
      .id((d: any) => d.id)
      .distance(d => 100 + Math.random() * 50) // 动态连线距离，增加随机性避免重叠
      .strength(0.7)  // 调整连线强度，平衡图谱布局
    )
    .force('charge', d3.forceManyBody()
      .strength((d: any) => -350 - ((d as any).importance || 0.5) * 200) // 根据节点重要性调整斥力
      .distanceMax(600)  // 增加电荷作用的最大距离
      .distanceMin(20)   // 设置最小距离避免节点过于靠近
    )
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide((d: any) => ((d as any).importance || 0.5) * 25 + 15)) // 根据节点重要性设置碰撞半径
    .force('x', d3.forceX(width / 2).strength(0.03)) // 轻微的X方向引力
    .force('y', d3.forceY(height / 2).strength(0.03)) // 轻微的Y方向引力
    .alphaDecay(0.008) // 减慢衰减速度，让动画更平滑
    .velocityDecay(0.35); // 增加阻尼，减少抖动
  
  console.log('✅ D3图谱初始化完成');
  
  // 初始化后立即更新图谱
  updateD3Graph();
  
  // 执行布局预热，提高初始渲染效果
  if (filteredNodes.value.length > 0 && simulation) {
    console.log('⏱️ 执行布局预热，提高初始渲染效果...');
    // 手动执行多次tick预先计算布局
    for (let i = 0; i < 50; i++) {
      simulation.tick();
    }
    // 更新节点和连线位置
    updateNodeAndLinkPositions();
  }
  
  // 添加额外的延时刷新，确保连线正确显示
  setTimeout(() => {
    console.log('⏱️ 执行延时刷新以确保连线正确显示');
    if (filteredNodes.value.length > 0) {
      // 重新启动模拟
      simulation.alpha(0.3).restart();
    }
  }, 500);
}

// 更新D3图谱
const updateD3Graph = () => {
  if (!simulation || !svg) {
    console.warn('⚠️ D3组件未初始化，跳过更新');
    return;
  }

  console.log('🔄 开始更新D3图谱...', {
    totalNodes: graphData.value.nodes.length,
    totalLinks: graphData.value.links.length,
    filteredNodes: filteredNodes.value.length
  });

  // 转换连线引用 - 确保它们引用实际节点对象而不是字符串ID
  const nodeById: Record<string, GraphNode> = {};
  filteredNodes.value.forEach(node => {
    nodeById[node.id] = node;
  });
  
  console.log(`🔍 节点映射表创建完成，包含 ${Object.keys(nodeById).length} 个节点`);
  
  // 过滤并处理连线
  const filteredLinks = graphData.value.links.filter(link => {
    try {
      // 获取源节点和目标节点ID
      const sourceId = typeof link.source === 'object' && link.source ? link.source.id : 
                      typeof link.source === 'string' ? link.source : null;
      const targetId = typeof link.target === 'object' && link.target ? link.target.id : 
                      typeof link.target === 'string' ? link.target : null;
      
      if (!sourceId || !targetId) {
        console.warn('⚠️ 跳过无效连线 - 无法确定源或目标ID:', link);
        return false;
      }
      
      // 检查源节点和目标节点是否存在于当前过滤的节点列表中
      const sourceExists = filteredNodes.value.some(n => n.id === sourceId);
      const targetExists = filteredNodes.value.some(n => n.id === targetId);
      
      // 只保留源节点和目标节点都存在的连线
      return sourceExists && targetExists;
    } catch (error) {
      console.error('❌ 处理连线时出错:', error, link);
      return false;
    }
  }).map(link => {
    try {
      // 创建一个新的连线对象，确保source和target是对象引用
      const sourceId = typeof link.source === 'object' && link.source ? link.source.id : 
                      typeof link.source === 'string' ? link.source : null;
      const targetId = typeof link.target === 'object' && link.target ? link.target.id : 
                      typeof link.target === 'string' ? link.target : null;
      
      if (!sourceId || !targetId) {
        console.warn('⚠️ 无效的连线ID:', { source: link.source, target: link.target });
        return null;
      }
      
      const sourceNode = nodeById[sourceId];
      const targetNode = nodeById[targetId];
      
      // 只有当我们可以解析源和目标节点时才返回连线
      if (sourceNode && targetNode) {
        return {
          ...link,
          source: sourceNode,  // 确保使用节点对象
          target: targetNode,  // 确保使用节点对象
          // 添加额外的调试信息
          _debugSourceId: sourceId,
          _debugTargetId: targetId
        };
      }
      
      if (!sourceNode) console.warn(`⚠️ 找不到源节点: ${sourceId}`);
      if (!targetNode) console.warn(`⚠️ 找不到目标节点: ${targetId}`);
      
      return null;
    } catch (error) {
      console.error('❌ 转换连线时出错:', error, link);
      return null;
    }
  }).filter(Boolean) as GraphLink[]; // 移除null值

  console.log('🔗 过滤后的连线数:', filteredLinks.length);
  
  // 连线深度调试
  if (filteredLinks.length > 0) {
    console.log('🔍 连线示例:', filteredLinks[0]);
    console.log('🔍 连线源节点类型:', typeof filteredLinks[0].source);
    console.log('🔍 连线目标节点类型:', typeof filteredLinks[0].target);
    
    if (typeof filteredLinks[0].source !== 'object' || typeof filteredLinks[0].target !== 'object') {
      console.error('⚠️ 连线仍然使用字符串引用而不是对象引用!');
    }
    
    // 额外检查连线是否都正确引用节点对象
    const invalidLinks = filteredLinks.filter(link => 
      typeof link.source !== 'object' || typeof link.target !== 'object'
    );
    
    if (invalidLinks.length > 0) {
      console.error(`❌ 发现 ${invalidLinks.length} 条无效连线:`, invalidLinks);
      // 尝试修复无效连线 - 强制转换字符串ID为节点对象
      for (const link of invalidLinks) {
        if (typeof link.source === 'string' && nodeById[link.source]) {
          console.log(`🛠️ 修复连线源节点: ${link.source} -> ${nodeById[link.source].name}`);
          link.source = nodeById[link.source];
        }
        if (typeof link.target === 'string' && nodeById[link.target]) {
          console.log(`🛠️ 修复连线目标节点: ${link.target} -> ${nodeById[link.target].name}`);
          link.target = nodeById[link.target];
        }
      }
    }
  } else {
    console.warn('⚠️ 过滤后没有可用的连线!');
  }

  // 更新连线
  const links = linksG.selectAll('line')
    .data(filteredLinks, (d: any) => {
      // 当source和target是对象时，使用它们的id创建唯一标识
      const sourceId = typeof d.source === 'object' && d.source ? d.source.id : d.source;
      const targetId = typeof d.target === 'object' && d.target ? d.target.id : d.target;
      return `${sourceId}-${targetId}`;
    });

  // 移除不再需要的连线
  links.exit().remove();

  // 添加新连线
  const linksEnter = links.enter().append('line')
    .attr('class', 'link')
    .style('stroke', '#A0A0A5')
    .style('stroke-opacity', 0.8)  // 增加不透明度使连线更明显
    .style('stroke-width', 2.5)    // 增加线宽使连线更明显
    .style('stroke-linecap', 'round'); // 添加圆形线帽，使连线更美观

  // 更新节点
  const nodes = nodesG.selectAll('circle')
    .data(filteredNodes.value, (d: any) => d.id);

  // 移除不再需要的节点
  nodes.exit().remove();

  // 添加新节点
  const nodesEnter = nodes.enter().append('circle')
    .attr('class', 'node')
    .attr('r', (d: any) => {
      // 确保有合理的节点大小
      const size = d.size || d.importance * 10 || 8;
      const minSize = 5;
      const maxSize = 20;
      return Math.max(minSize, Math.min(maxSize, size));
    })
    .style('fill', (d: any) => getNodeColor(d.type))
    .style('stroke', '#fff')
    .style('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))
    .on('click', (event: any, d: any) => {
      event.stopPropagation();
      selectNode(d);
    })
    .on('mouseover', (event: any, d: any) => {
      // 添加鼠标悬停效果
      d3.select(event.target)
        .transition()
        .duration(200)
        .attr('r', (d: any) => {
          const currentR = d3.select(event.target).attr('r');
          return Math.min(25, parseFloat(currentR) * 1.3);
        })
        .style('stroke-width', 3);
    })
    .on('mouseout', (event: any, d: any) => {
      // 恢复原始大小
      d3.select(event.target)
        .transition()
        .duration(200)
        .attr('r', (d: any) => {
          const size = d.size || d.importance * 10 || 8;
          const minSize = 5;
          const maxSize = 20;
          return Math.max(minSize, Math.min(maxSize, size));
        })
        .style('stroke-width', selectedNodeId.value === d.id ? 3 : 1.5);
    });

  // 移除旧标签
  nodesG.selectAll('text').remove();

  // 添加标签
  const labels = nodesG.selectAll('text')
    .data(filteredNodes.value, (d: any) => d.id);

  const labelsEnter = labels.enter().append('text')
    .attr('class', 'node-label')
    .text((d: any) => {
      // 确保标签文本不为空
      const text = d.name || d.label || d.id || '未知节点';
      // 限制标签长度
      return text.length > 12 ? text.substring(0, 12) + '...' : text;
    })
    .style('font-size', '11px')
    .style('fill', '#E0E0E0')
    .style('text-anchor', 'middle')
    .style('pointer-events', 'none')
    .style('user-select', 'none')
    .attr('dy', (d: any) => {
      const radius = d.size || d.importance * 10 || 8;
      return Math.max(15, radius + 8);
    });

  // 更新模拟
  simulation.nodes(filteredNodes.value);
  
  // 确保force有正确的链接数据
  const linkForce = simulation.force('link') as d3.ForceLink<any, any>;
  if (linkForce) {
    linkForce.links(filteredLinks);
  }

  // 定义tick事件处理
  simulation.on('tick', () => {
    // 更新连线位置 - 确保所有连线坐标都有效
    linksG.selectAll('line')
      .attr('x1', (d: any) => {
        return typeof d.source === 'object' && d.source && d.source.x !== undefined ? d.source.x : 0;
      })
      .attr('y1', (d: any) => {
        return typeof d.source === 'object' && d.source && d.source.y !== undefined ? d.source.y : 0;
      })
      .attr('x2', (d: any) => {
        return typeof d.target === 'object' && d.target && d.target.x !== undefined ? d.target.x : 0;
      })
      .attr('y2', (d: any) => {
        return typeof d.target === 'object' && d.target && d.target.y !== undefined ? d.target.y : 0;
      });

    // 更新节点位置
    nodesG.selectAll('circle')
      .attr('cx', (d: any) => d.x || 0)
      .attr('cy', (d: any) => d.y || 0);

    // 更新标签位置
    nodesG.selectAll('text')
      .attr('x', (d: any) => d.x || 0)
      .attr('y', (d: any) => d.y || 0);
  });

  // 重启模拟
  simulation.alpha(1).restart();
  
  console.log('✅ D3图谱更新完成', {
    渲染节点数: filteredNodes.value.length,
    渲染连线数: filteredLinks.length
  });
}

// 辅助函数 - 更新节点和连线位置(用于静态布局和预热)
const updateNodeAndLinkPositions = () => {
  // 验证D3组件已经初始化
  if (!svg || !linksG || !nodesG) return;
  
  // 更新连线位置
  linksG.selectAll('line')
    .attr('x1', (d: any) => {
      return typeof d.source === 'object' && d.source && d.source.x !== undefined ? d.source.x : 0;
    })
    .attr('y1', (d: any) => {
      return typeof d.source === 'object' && d.source && d.source.y !== undefined ? d.source.y : 0;
    })
    .attr('x2', (d: any) => {
      return typeof d.target === 'object' && d.target && d.target.x !== undefined ? d.target.x : 0;
    })
    .attr('y2', (d: any) => {
      return typeof d.target === 'object' && d.target && d.target.y !== undefined ? d.target.y : 0;
    });

  // 更新节点位置
  nodesG.selectAll('circle')
    .attr('cx', (d: any) => d.x || 0)
    .attr('cy', (d: any) => d.y || 0);

  // 更新标签位置
  nodesG.selectAll('text')
    .attr('x', (d: any) => d.x || 0)
    .attr('y', (d: any) => d.y || 0);
}

// 更新布局
const updateD3Layout = () => {
  if (!simulation) return
  
  const width = graphSvg.value?.clientWidth || 800
  const height = graphSvg.value?.clientHeight || 600
  
  switch (layoutType.value) {
    case 'force':
      simulation
        .force('link', d3.forceLink().id((d: any) => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
      break
    case 'circle':
      const radius = Math.min(width, height) / 3
      graphData.value.nodes.forEach((node, i) => {
        const angle = (i / graphData.value.nodes.length) * 2 * Math.PI
        node.fx = width / 2 + radius * Math.cos(angle)
        node.fy = height / 2 + radius * Math.sin(angle)
      })
      break
  }
  
  simulation.alpha(1).restart()
}

// 拖拽事件
const dragstarted = (event: any, d: any) => {
  if (!event.active) simulation.alphaTarget(0.3).restart()
  d.fx = d.x
  d.fy = d.y
}

const dragged = (event: any, d: any) => {
  d.fx = event.x
  d.fy = event.y
}

const dragended = (event: any, d: any) => {
  if (!event.active) simulation.alphaTarget(0)
  d.fx = null
  d.fy = null
}

// 节点选择
const selectNode = (node: GraphNode) => {
  selectedNodeId.value = node.id
  
  // 高亮连接
  if (svg) {
    svg.selectAll('.link')
      .style('stroke-opacity', (d: any) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id
        const targetId = typeof d.target === 'string' ? d.target : d.target.id
        return sourceId === node.id || targetId === node.id ? 0.8 : 0.3
      })
      .style('stroke-width', (d: any) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id
        const targetId = typeof d.target === 'string' ? d.target : d.target.id
        return sourceId === node.id || targetId === node.id ? 2 : 1.5
      })
    
    svg.selectAll('.node')
      .style('stroke', (d: any) => d.id === node.id ? '#7B61FF' : 'none')
      .style('stroke-width', (d: any) => d.id === node.id ? 3 : 0)
  }
}

const selectRelatedNode = (nodeId: string) => {
  const node = graphData.value.nodes.find(n => n.id === nodeId)
  if (node) {
    selectNode(node)
}
}

const closeDetails = () => {
  selectedNodeId.value = null
  
  // 重置高亮
  if (svg) {
    svg.selectAll('.link')
      .style('stroke-opacity', 0.3)
      .style('stroke-width', 1.5)
    
    svg.selectAll('.node')
      .style('stroke', 'none')
      .style('stroke-width', 0)
  }
}

// 缩放控制
const zoomIn = () => {
  if (svg) {
    svg.transition().duration(300).call(
      zoom.scaleBy, 1.5
    )
  }
}

const zoomOut = () => {
  if (svg) {
    svg.transition().duration(300).call(
      zoom.scaleBy, 1 / 1.5
    )
  }
}

const resetZoom = () => {
  if (svg) {
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity
    )
  }
}

const resetGraph = () => {
  // 先清除选择的节点
  closeDetails();
  
  // 重置搜索和过滤器
  searchQuery.value = '';
  filters.value = {
    concept: true,
    article: true,
    note: true
  };
  
  // 重新加载数据
  loadGraphData();
}

const refreshData = () => {
  loadGraphData()
}

// 实时更新通知
const addRecentUpdate = (message: any) => {
  const update = {
    id: Date.now().toString(),
    type: message.type,
    message: getUpdateMessage(message),
    timestamp: Date.now()
  }
  
  recentUpdates.value.unshift(update)
  
  // 只保留最近5个更新
  if (recentUpdates.value.length > 5) {
    recentUpdates.value = recentUpdates.value.slice(0, 5)
  }
  
  // 5秒后自动移除
  setTimeout(() => {
    dismissUpdate(update.id)
  }, 5000)
}

const dismissUpdate = (updateId: string) => {
  const index = recentUpdates.value.findIndex(u => u.id === updateId)
  if (index !== -1) {
    recentUpdates.value.splice(index, 1)
  }
}

const getUpdateIcon = (type: string) => {
  switch (type) {
    case 'NODE_ADDED': return 'fas fa-plus-circle'
    case 'NODE_UPDATED': return 'fas fa-edit'
    case 'NODE_REMOVED': return 'fas fa-minus-circle'
    case 'RELATIONSHIP_CREATED': return 'fas fa-link'
    case 'CONCEPT_MERGED': return 'fas fa-compress-arrows-alt'
    case 'GRAPH_REBUILT': return 'fas fa-sync-alt'
    default: return 'fas fa-info-circle'
  }
}

const getUpdateMessage = (message: any) => {
  switch (message.type) {
    case 'NODE_ADDED':
      return `新增节点: ${message.node?.name || '未知'}`
    case 'NODE_UPDATED':
      return `更新节点: ${message.node?.name || '未知'}`
    case 'NODE_REMOVED':
      return `删除节点: ${message.node?.name || '未知'}`
    case 'RELATIONSHIP_CREATED':
      return '创建新关系'
    case 'RELATIONSHIP_UPDATED':
      return '更新关系'
    case 'RELATIONSHIP_REMOVED':
      return '删除关系'
    case 'CONCEPT_MERGED':
      return `合并概念: ${message.oldConcept?.name} → ${message.newConcept?.name}`
    case 'GRAPH_REBUILT':
      return '知识图谱重建完成'
    default:
      return '图谱更新'
  }
}

// 监听图谱数据变化
watch(() => graphData.value, async (newData) => {
  if (newData && newData.nodes.length > 0) {
    console.log('📊 图谱数据已更新，节点数:', newData.nodes.length, '连线数:', newData.links.length)
    
    // 确保SVG容器存在后再更新图谱
    await nextTick();
    if (graphSvg.value && svg) {
      updateD3Graph();
    } else if (graphSvg.value && !svg) {
      // 如果SVG容器存在但D3还没初始化，则初始化
      initD3Graph();
    }
  }
})

// 调试方法 - 生成测试数据
const generateTestData = () => {
  console.log('🧪 生成测试数据用于前端渲染验证...');
  
  const testNodes: GraphNode[] = [
    {
      id: 'concept-1',
      name: 'Vue 3',
      type: 'CONCEPT',
      importance: 0.9,
      description: 'Vue.js 3.x 框架'
    },
    {
      id: 'concept-2', 
      name: 'TypeScript',
      type: 'CONCEPT',
      importance: 0.8,
      description: 'TypeScript 语言'
    },
    {
      id: 'article-1',
      name: '前端开发指南',
      type: 'ARTICLE',
      importance: 0.7,
      description: '前端开发最佳实践'
    }
  ];
  
  const testLinks: GraphLink[] = [
    {
      source: 'concept-1',
      target: 'concept-2',
      type: 'RELATED_TO',
      strength: 0.8
    },
    {
      source: 'article-1',
      target: 'concept-1',
      type: 'DISCUSSES',
      strength: 0.9
    }
  ];
  
  graphData.value = {
    nodes: testNodes,
    links: testLinks
  };
  
  nextTick(() => {
    initD3Graph();
    console.log('✅ 测试数据已加载并渲染');
  });
};

// 在开发环境下提供测试方法
if (import.meta.env.DEV) {
  (window as any).__testKnowledgeGraph = generateTestData;
  console.log('🔧 开发模式：可使用 window.__testKnowledgeGraph() 生成测试数据');
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
  grid-template-columns: 320px 1fr 300px;
  height: 100vh;
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  overflow: hidden;
}

.sidebar {
  background-color: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border-primary);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: calc(var(--spacing-unit) * 6);
  border-bottom: 1px solid var(--color-border-primary);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.search-box {
    display: flex;
    align-items: center;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  transition: border-color var(--transition-speed-fast);
}

.search-box:focus-within {
  border-color: var(--color-accent-primary);
}

.search-box input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text-primary);
  font-size: 14px;
  width: 100%;
  margin-left: calc(var(--spacing-unit) * 2);
    }
    
.search-box input::placeholder {
  color: var(--color-text-disabled);
}

.search-box i {
  color: var(--color-text-disabled);
  font-size: 14px;
}

.filters-section {
  padding: calc(var(--spacing-unit) * 6);
  border-bottom: 1px solid var(--color-border-primary);
    }

.filter-group {
  margin-bottom: calc(var(--spacing-unit) * 6);
  }
  
.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: calc(var(--spacing-unit) * 3);
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
  transition: background-color var(--transition-speed-fast);
}

.filter-option:hover {
  background-color: var(--color-bg-hover);
}

.filter-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent-primary);
}

.filter-option label {
  flex: 1;
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.filter-count {
  font-size: 12px;
  color: var(--color-text-disabled);
  background-color: var(--color-bg-tertiary);
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  border-radius: calc(var(--border-radius-s) * 2);
}

.limit-options {
  display: flex;
  flex-direction: column;
}

.limit-select {
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  color: var(--color-text-primary);
  padding: calc(var(--spacing-unit) * 2);
  font-size: 14px;
  cursor: pointer;
  transition: border-color var(--transition-speed-fast);
}

.limit-select:focus {
  outline: none;
  border-color: var(--color-accent-primary);
}

.limit-select option {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}
    
    .connection-status {
      display: flex;
      align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  border-radius: var(--border-radius-s);
      font-size: 12px;
      font-weight: 500;
  transition: all var(--transition-speed-normal);
}
      
.connection-status.status-connected {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
        border: 1px solid rgba(34, 197, 94, 0.2);
      }
      
.connection-status.status-connecting {
        background: rgba(251, 191, 36, 0.1);
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.2);
      }
      
.connection-status.status-disconnected {
        background: rgba(156, 163, 175, 0.1);
        color: #9ca3af;
        border: 1px solid rgba(156, 163, 175, 0.2);
      }
      
.connection-status.status-error {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.2);
      }

.nodes-list {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--spacing-unit) * 4);
}

.node-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  padding: calc(var(--spacing-unit) * 3);
  border-radius: var(--border-radius-m);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  margin-bottom: calc(var(--spacing-unit) * 2);
}

.node-item:hover {
  background-color: var(--color-bg-hover);
}

.node-item.active {
  background-color: rgba(123, 97, 255, 0.1);
  border: 1px solid rgba(123, 97, 255, 0.3);
}

.node-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.node-icon.concept {
  background-color: rgba(123, 97, 255, 0.2);
  color: #7B61FF;
}

.node-icon.article {
  background-color: rgba(16, 185, 129, 0.2);
  color: #10B981;
}

.node-icon.note {
  background-color: rgba(245, 158, 11, 0.2);
  color: #F59E0B;
}

.node-info {
  flex: 1;
}

.node-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: calc(var(--spacing-unit) * 1);
}

.node-type {
  font-size: 12px;
  color: var(--color-text-disabled);
}

.graph-container {
  background-color: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border-primary);
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

.details-panel {
  background-color: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.details-header {
  padding: calc(var(--spacing-unit) * 6);
  border-bottom: 1px solid var(--color-border-primary);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.details-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: calc(var(--spacing-unit) * 1);
}

.details-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.close-btn {
  width: 32px;
  height: 32px;
  background-color: transparent;
  border: none;
  border-radius: 50%;
  color: var(--color-text-disabled);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed-fast);
}

.close-btn:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.details-content {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--spacing-unit) * 6);
}

.detail-section {
  margin-bottom: calc(var(--spacing-unit) * 8);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.property-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: calc(var(--spacing-unit) * 3) 0;
  border-bottom: 1px solid var(--color-border-primary);
}

.property-item:last-child {
  border-bottom: none;
}

.property-label {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.property-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.description-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.related-items {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
}

.related-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  padding: calc(var(--spacing-unit) * 3);
  border-radius: var(--border-radius-m);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
}

.related-item:hover {
  background-color: var(--color-bg-hover);
}

.related-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.related-icon.concept {
  background-color: rgba(123, 97, 255, 0.2);
  color: #7B61FF;
}

.related-icon.article {
  background-color: rgba(16, 185, 129, 0.2);
  color: #10B981;
}

.related-icon.note {
  background-color: rgba(245, 158, 11, 0.2);
  color: #F59E0B;
}

.related-info {
  flex: 1;
}

.related-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: calc(var(--spacing-unit) * 1);
}

.related-type {
  font-size: 12px;
  color: var(--color-text-disabled);
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

.floating-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 20;
}

.graph-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 20;
  
  .legend-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
  }
  
  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      
      &.concept-color {
        background: #7B61FF;
      }
      
      &.article-color {
        background: #10B981;
      }
      
      &.note-color {
        background: #FF9800;
      }
    }
    
    .legend-label {
      font-size: 12px;
      color: #6b7280;
    }
  }
}

.performance-monitor {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.update-notifications {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 300px;
}

.update-notification {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #7B61FF;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(-4px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  }
  
  .close-icon {
    margin-left: auto;
    opacity: 0.5;
    transition: opacity 0.2s ease;
    
    &:hover {
      opacity: 1;
    }
  }
}

// 动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

// 响应式设计
@media (max-width: 1200px) {
  .graph-sidebar {
    width: 280px;
  }
  
  .detail-panel {
    width: 350px;
  }
}

@media (max-width: 768px) {
  .graph-toolbar {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
    
    .toolbar-left,
    .toolbar-right {
      width: 100%;
      justify-content: center;
    }
  }
  
  .graph-sidebar,
  .detail-panel {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 50;
    transform: translateX(-100%);
    
    &.show {
      transform: translateX(0);
    }
  }
  
  .detail-panel {
    right: 0;
    transform: translateX(100%);
    
    &.show {
      transform: translateX(0);
    }
  }
}
</style> 