import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import { getGraphData, getNodeDetails, searchGraph } from '@/api/knowledgeGraph'
import type { GraphData, GraphNode, GraphLink, NodeDetails, GraphQueryParams } from '@/api/knowledgeGraph'
import { ElMessage } from 'element-plus'

export const useKnowledgeGraphStore = defineStore('knowledgeGraph', () => {
  // 状态
  const graphData = ref<GraphData | null>(null)
  const selectedNodeId = ref<string | null>(null)
  const selectedNode = ref<NodeDetails | null>(null)
  const searchQuery = ref('')
  const searchResults = ref<GraphNode[]>([])
  const highlightedNodes = ref<Set<string>>(new Set())
  const selectedNodes = ref<Set<string>>(new Set()) // 多选节点集合
  const multiSelectMode = ref(false) // 是否处于多选模式
  const expandedNodes = ref<Set<string>>(new Set()) // 展开的节点
  const loading = ref(false)
  const error = ref<string | null>(null)
  const nodePositions = ref<Map<string, {x: number, y: number}>>(new Map())
  const currentLayout = ref<'force' | 'tree' | 'circle'>('force')
  const nodeFilters = ref({
    concept: true,
    article: true,
    note: true
  })
  const animating = ref(false) // 是否正在动画中
  const focusedNodeId = ref<string | null>(null) // 当前焦点节点
  
  // 性能指标
  const performanceMetrics = ref({
    lastRenderTime: 0, // 上一次渲染时间
    avgRenderTime: 0, // 平均渲染时间
    renderCount: 0, // 渲染次数
    nodeCount: 0, // 节点数量
    linkCount: 0, // 边数量
    fps: 0, // 帧率
    updateCount: 0, // 更新次数
  })

  // 过滤后的节点
  const filteredNodes = computed(() => {
    if (!graphData.value) return []
    
    let nodes = graphData.value.nodes
    
    // 按类型过滤
    if (nodeFilters.value.concept) {
      nodes = nodes.filter(node => node.type === 'CONCEPT')
    }
    if (nodeFilters.value.article) {
      nodes = nodes.filter(node => node.type === 'ARTICLE')
    }
    if (nodeFilters.value.note) {
      nodes = nodes.filter(node => node.type === 'NOTE')
    }
    
    // 按搜索查询过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      nodes = nodes.filter(node => 
        node.name.toLowerCase().includes(query) ||
        node.description?.toLowerCase().includes(query)
      )
    }
    
    return nodes
  })

  // 当前选中的节点
  const selectedNodeComputed = computed(() => {
    if (!selectedNodeId.value || !graphData.value) return null
    return graphData.value.nodes.find(node => node.id === selectedNodeId.value) || null
  })

  // 可见的连线
  const visibleLinks = computed(() => {
    if (!graphData.value) return []
    
    const visibleNodeIds = new Set(filteredNodes.value.map(node => node.id))
    return graphData.value.links.filter(link => 
      visibleNodeIds.has(link.source as string) && visibleNodeIds.has(link.target as string)
    )
  })

  // 新增：搜索结果节点
  const searchResultNodes = computed(() => {
    if (!graphData.value || searchResults.value.length === 0) return []
    return graphData.value.nodes.filter(node => searchResults.value.includes(node.id))
  })

  // 新增：高亮节点
  const highlightedNodeIds = computed(() => {
    return searchMode.value ? searchResults.value : Array.from(highlightedNodes.value)
  })

  // 新增：是否有搜索结果
  const hasSearchResults = computed(() => {
    return searchResults.value.length > 0
  })

  // 新增：聚焦节点
  const focusedNode = computed(() => {
    if (!focusedNodeId.value || !graphData.value) return null
    return graphData.value.nodes.find(node => node.id === focusedNodeId.value) || null
  })

  // 新增：已选中的节点列表
  const selectedNodesList = computed(() => {
    if (!graphData.value || selectedNodes.value.size === 0) return []
    return graphData.value.nodes.filter(node => selectedNodes.value.has(node.id))
  })

  // 加载图谱数据
  const loadGraphData = async (params: GraphQueryParams = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await getGraphData(params)
      graphData.value = response.data
    } catch (error) {
      error.value = error instanceof Error ? error.message : '加载图谱数据失败'
      console.error('Failed to load graph data:', error)
    } finally {
      loading.value = false
    }
  }

  // 选择节点
  const selectNode = async (nodeId: string | null) => {
    selectedNodeId.value = nodeId
    selectedNode.value = null
    await loadNodeDetails(nodeId)
  }

  // 加载节点详情
  const loadNodeDetails = async (nodeId: string) => {
    try {
      const node = graphData.value?.nodes.find(n => n.id === nodeId)
      if (!node) return
      
      // 只有概念节点才加载详情
      if (node.type === 'CONCEPT') {
        const [detailResponse, articlesResponse, statsResponse] = await Promise.all([
          getNodeDetails(node.name),
          getRelatedArticles(node.name),
          getConceptStatistics(node.name)
        ])
        
        selectedNode.value = detailResponse.data
        relatedArticles.value = articlesResponse.data
        conceptStatistics.value = statsResponse.data
      }
    } catch (error) {
      console.error('Failed to load node details:', error)
      selectedNode.value = null
      relatedArticles.value = []
      conceptStatistics.value = null
    }
  }

  // 设置布局模式
  const setLayout = (layout: 'force' | 'tree' | 'circle') => {
    currentLayout.value = layout
  }

  // 更新筛选器
  const updateFilter = (types: string[]) => {
    nodeFilters.value = {
      concept: types.includes('CONCEPT'),
      article: types.includes('ARTICLE'),
      note: types.includes('NOTE')
    }
    // 重新加载数据以应用过滤器
    loadGraphData({
      nodeType: types.length === 1 ? types[0] : 'ALL',
      search: searchQuery.value
    })
  }

  // 更新搜索查询
  const updateSearchQuery = (query: string) => {
    searchQuery.value = query
    performSearch(query)
  }

  // 新增：执行搜索
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      searchResults.value = []
      searchMode.value = false
      // 重新加载完整数据
      await loadGraphData()
      return
    }

    try {
      // 使用后端搜索API
      const response = await searchGraph(query)
      searchResults.value = response.data.map(concept => concept.id)
      searchMode.value = true

      // 重新加载图谱数据以包含搜索结果
      await loadGraphData({
        search: query,
        nodeType: nodeFilters.value.concept ? 'CONCEPT' : nodeFilters.value.article ? 'ARTICLE' : 'NOTE'
      })

      // 如果只有一个结果，自动聚焦
      if (searchResults.value.length === 1) {
        focusOnNode(searchResults.value[0])
      }
    } catch (error) {
      console.error('Search failed:', error)
      searchResults.value = []
      searchMode.value = false
    }
  }

  // 新增：高亮节点
  const highlightNodes = (nodeIds: string[]) => {
    highlightedNodes.value = new Set(nodeIds)
  }

  // 新增：清除高亮
  const clearHighlight = () => {
    highlightedNodes.value.clear()
    searchMode.value = false
    searchResults.value = []
  }

  // 新增：聚焦节点
  const focusOnNode = (nodeId: string) => {
    focusedNodeId.value = nodeId
    selectNode(nodeId)
  }

  // 新增：清除聚焦
  const clearFocus = () => {
    focusedNodeId.value = null
  }

  // 新增：切换多选模式
  const toggleMultiSelectMode = () => {
    multiSelectMode.value = !multiSelectMode.value
    if (!multiSelectMode.value) {
      clearSelection()
    }
  }

  // 新增：添加到选择
  const addToSelection = (nodeId: string) => {
    if (multiSelectMode.value) {
      selectedNodes.value.add(nodeId)
    }
  }

  // 新增：从选择中移除
  const removeFromSelection = (nodeId: string) => {
    selectedNodes.value.delete(nodeId)
  }

  // 新增：清除选择
  const clearSelection = () => {
    selectedNodes.value.clear()
  }

  // 新增：展开节点
  const expandNode = (nodeId: string) => {
    expandedNodes.value.add(nodeId)
  }

  // 新增：收起节点
  const collapseNode = (nodeId: string) => {
    expandedNodes.value.delete(nodeId)
  }

  // 新增：切换节点展开状态
  const toggleNodeExpansion = (nodeId: string) => {
    if (expandedNodes.value.has(nodeId)) {
      collapseNode(nodeId)
    } else {
      expandNode(nodeId)
    }
  }

  // 新增：保存节点位置
  const saveNodePosition = (nodeId: string, x: number, y: number) => {
    nodePositions.value.set(nodeId, { x, y })
  }

  // 新增：获取节点位置
  const getNodePosition = (nodeId: string): { x: number; y: number } | null => {
    return nodePositions.value.get(nodeId) || null
  }

  // 新增：设置动画状态
  const setAnimating = (animating: boolean) => {
    animating.value = animating
  }

  // 重置状态
  const reset = () => {
    graphData.value = null
    selectedNodeId.value = null
    selectedNode.value = null
    relatedArticles.value = []
    conceptStatistics.value = null
    nodeFilters.value = {
      concept: true,
      article: true,
      note: true
    }
    searchQuery.value = ''
    error.value = null
    highlightedNodes.value.clear()
    focusedNodeId.value = null
    searchResults.value = []
    searchMode.value = false
    expandedNodes.value.clear()
    nodePositions.value.clear()
    selectedNodes.value.clear()
    multiSelectMode.value = false
    animating.value = false
    performanceMetrics.value = {
      lastRenderTime: 0,
      avgRenderTime: 0,
      renderCount: 0,
      nodeCount: 0,
      linkCount: 0,
      fps: 0,
      updateCount: 0,
    }
  }

  return {
    graphData,
    selectedNodeId,
    selectedNode,
    searchQuery,
    searchResults,
    highlightedNodes,
    selectedNodes,
    multiSelectMode,
    expandedNodes,
    loading,
    error,
    nodePositions,
    currentLayout,
    nodeFilters,
    animating,
    focusedNodeId,
    performanceMetrics,
    filteredNodes,
    selectedNodeComputed,
    visibleLinks,
    searchResultNodes,
    highlightedNodeIds,
    hasSearchResults,
    focusedNode,
    selectedNodesList,
    loadGraphData,
    selectNode,
    loadNodeDetails,
    setLayout,
    updateFilter,
    updateSearchQuery,
    performSearch,
    highlightNodes,
    clearHighlight,
    focusOnNode,
    clearFocus,
    toggleMultiSelectMode,
    addToSelection,
    removeFromSelection,
    clearSelection,
    expandNode,
    collapseNode,
    toggleNodeExpansion,
    saveNodePosition,
    getNodePosition,
    setAnimating,
    reset,
    relatedArticles,
    conceptStatistics,
    searchMode,
  }
}) 