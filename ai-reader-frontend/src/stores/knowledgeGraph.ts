import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getGraphData, 
  getRelatedArticles, 
  getConceptStatistics, 
  searchConcepts,
  getConceptDetail,
  type GraphData, 
  type GraphNode, 
  type GraphLink, 
  type ConceptStatistics,
  type ArticleGraphDTO,
  type ConceptDetailDTO,
  type GraphQueryParams
} from '@/api/knowledgeGraph'

// 缓存管理接口
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// 性能监控接口
interface PerformanceMetrics {
  apiCalls: number
  cacheHits: number
  cacheMisses: number
  averageResponseTime: number
  lastUpdateTime: number
}

export const useKnowledgeGraphStore = defineStore('knowledgeGraph', () => {
  // === 核心状态 ===
  const graphData = ref<GraphData | null>(null)
  const selectedNodeId = ref<string | null>(null)
  const currentLayout = ref<'force' | 'circular' | 'hierarchical'>('force')
  const loading = ref(false)
  const error = ref<string | null>(null)

  // === 详情数据 ===
  const selectedNodeDetails = ref<ConceptDetailDTO | null>(null)
  const relatedArticles = ref<ArticleGraphDTO[]>([])
  const conceptStatistics = ref<ConceptStatistics | null>(null)

  // === 交互状态 ===
  const filterTypes = ref<string[]>([])
  const searchQuery = ref('')
  const highlightedNodes = ref<string[]>([])
  const focusedNodeId = ref<string | null>(null)
  const searchResults = ref<string[]>([])
  const searchMode = ref(false)
  const multiSelectMode = ref(false)
  const selectedNodes = ref(new Set<string>())
  const expandedNodes = ref(new Set<string>())
  const animating = ref(false)

  // === 缓存系统 ===
  const cache = ref(new Map<string, CacheEntry<any>>())
  const CACHE_TTL = {
    GRAPH_DATA: 30 * 60 * 1000,      // 30分钟
    CONCEPT_DETAILS: 60 * 60 * 1000,  // 1小时
    RELATED_ARTICLES: 15 * 60 * 1000, // 15分钟
    CONCEPT_STATS: 2 * 60 * 60 * 1000, // 2小时
    SEARCH_RESULTS: 10 * 60 * 1000    // 10分钟
  }

  // === 性能监控 ===
  const performanceMetrics = ref<PerformanceMetrics>({
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    lastUpdateTime: Date.now()
  })

  // === 节点位置缓存 ===
  const nodePositions = ref(new Map<string, { x: number; y: number }>())

  // === 计算属性 ===
  const filteredNodes = computed((): GraphNode[] => {
    if (!graphData.value) return []
    
    let nodes = graphData.value.nodes
    
    // 按类型过滤
    if (filterTypes.value.length > 0) {
      nodes = nodes.filter(node => filterTypes.value.includes(node.type))
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

  const selectedNode = computed((): GraphNode | null => {
    if (!selectedNodeId.value || !graphData.value) return null
    return graphData.value.nodes.find(node => node.id === selectedNodeId.value) || null
  })

  const visibleLinks = computed((): GraphLink[] => {
    if (!graphData.value) return []
    
    const visibleNodeIds = new Set(filteredNodes.value.map(node => node.id))
    return graphData.value.links.filter(link => 
      visibleNodeIds.has(link.source as string) && visibleNodeIds.has(link.target as string)
    )
  })

  const searchResultNodes = computed((): GraphNode[] => {
    if (!graphData.value || searchResults.value.length === 0) return []
    return graphData.value.nodes.filter(node => searchResults.value.includes(node.id))
  })

  const hasSearchResults = computed((): boolean => {
    return searchResults.value.length > 0
  })

  const focusedNode = computed((): GraphNode | null => {
    if (!focusedNodeId.value || !graphData.value) return null
    return graphData.value.nodes.find(node => node.id === focusedNodeId.value) || null
  })

  const selectedNodesList = computed((): GraphNode[] => {
    if (!graphData.value || selectedNodes.value.size === 0) return []
    return graphData.value.nodes.filter(node => selectedNodes.value.has(node.id))
  })

  // 缓存命中率
  const cacheHitRate = computed((): number => {
    const total = performanceMetrics.value.cacheHits + performanceMetrics.value.cacheMisses
    return total > 0 ? (performanceMetrics.value.cacheHits / total) * 100 : 0
  })

  // === 缓存管理方法 ===
  const getCacheKey = (prefix: string, params: any): string => {
    return `${prefix}_${JSON.stringify(params)}`
  }

  const getFromCache = <T>(key: string): T | null => {
    const entry = cache.value.get(key)
    if (!entry) {
      performanceMetrics.value.cacheMisses++
      return null
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      cache.value.delete(key)
      performanceMetrics.value.cacheMisses++
      return null
    }

    performanceMetrics.value.cacheHits++
    return entry.data
  }

  const setCache = <T>(key: string, data: T, ttl: number): void => {
    cache.value.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  const clearCache = (pattern?: string): void => {
    if (pattern) {
      for (const key of cache.value.keys()) {
        if (key.includes(pattern)) {
          cache.value.delete(key)
        }
      }
    } else {
      cache.value.clear()
    }
  }

  // === API调用包装器 ===
  const apiCall = async <T>(
    apiFunction: () => Promise<T>,
    cacheKey?: string,
    ttl?: number
  ): Promise<T> => {
    const startTime = Date.now()
    
    // 尝试从缓存获取
    if (cacheKey) {
      const cached = getFromCache<T>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const result = await apiFunction()
      
      // 更新性能指标
      const responseTime = Date.now() - startTime
      performanceMetrics.value.apiCalls++
      performanceMetrics.value.averageResponseTime = 
        (performanceMetrics.value.averageResponseTime + responseTime) / 2
      performanceMetrics.value.lastUpdateTime = Date.now()

      // 缓存结果
      if (cacheKey && ttl) {
        setCache(cacheKey, result, ttl)
      }

      return result
    } catch (error) {
      console.error('API调用失败:', error)
      throw error
    }
  }

  // === 核心动作方法 ===
  const loadGraphData = async (params: GraphQueryParams = {}): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      const cacheKey = getCacheKey('graph_data', params)
      const response = await apiCall(
        () => getGraphData(params),
        cacheKey,
        CACHE_TTL.GRAPH_DATA
      )
      
      graphData.value = response.data
      
      // 恢复节点位置
      if (graphData.value?.nodes) {
        graphData.value.nodes.forEach(node => {
          const position = nodePositions.value.get(node.id)
          if (position) {
            node.x = position.x
            node.y = position.y
          }
        })
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载图谱数据失败'
      console.error('Failed to load graph data:', err)
    } finally {
      loading.value = false
    }
  }

  const selectNode = async (nodeId: string | null): Promise<void> => {
    selectedNodeId.value = nodeId
    selectedNodeDetails.value = null
    relatedArticles.value = []
    conceptStatistics.value = null
    
    if (nodeId) {
      await loadNodeDetails(nodeId)
    }
  }

  const loadNodeDetails = async (nodeId: string): Promise<void> => {
    try {
      const node = graphData.value?.nodes.find(n => n.id === nodeId)
      if (!node) return
      
      // 只有概念节点才加载详情
      if (node.type === 'CONCEPT') {
        const detailCacheKey = getCacheKey('concept_detail', node.name)
        const articlesCacheKey = getCacheKey('related_articles', node.name)
        const statsCacheKey = getCacheKey('concept_stats', node.name)

        const [detailResponse, articlesResponse, statsResponse] = await Promise.all([
          apiCall(
            () => getConceptDetail(node.name),
            detailCacheKey,
            CACHE_TTL.CONCEPT_DETAILS
          ),
          apiCall(
            () => getRelatedArticles(node.name),
            articlesCacheKey,
            CACHE_TTL.RELATED_ARTICLES
          ),
          apiCall(
            () => getConceptStatistics(node.name),
            statsCacheKey,
            CACHE_TTL.CONCEPT_STATS
          )
        ])
        
        selectedNodeDetails.value = detailResponse.data
        relatedArticles.value = articlesResponse.data
        conceptStatistics.value = statsResponse.data
      }
    } catch (err) {
      console.error('Failed to load node details:', err)
      selectedNodeDetails.value = null
      relatedArticles.value = []
      conceptStatistics.value = null
    }
  }

  const performSearch = async (query: string): Promise<void> => {
    if (!query.trim()) {
      searchResults.value = []
      searchMode.value = false
      await loadGraphData()
      return
    }

    try {
      const cacheKey = getCacheKey('search', query)
      const response = await apiCall(
        () => searchConcepts(query),
        cacheKey,
        CACHE_TTL.SEARCH_RESULTS
      )
      
      searchResults.value = response.data.map(concept => concept.id)
      searchMode.value = true

      // 重新加载图谱数据以包含搜索结果
      await loadGraphData({
        search: query,
        nodeType: filterTypes.value.length === 1 ? filterTypes.value[0] : 'ALL'
      })

      // 如果只有一个结果，自动聚焦
      if (searchResults.value.length === 1) {
        focusOnNode(searchResults.value[0])
      }
    } catch (err) {
      console.error('Search failed:', err)
      searchResults.value = []
      searchMode.value = false
    }
  }

  // === 交互方法 ===
  const setLayout = (layout: 'force' | 'circular' | 'hierarchical'): void => {
    currentLayout.value = layout
  }

  const updateFilter = async (types: string[]): Promise<void> => {
    filterTypes.value = types
    await loadGraphData({
      nodeType: types.length === 1 ? types[0] : 'ALL',
      search: searchQuery.value
    })
  }

  const updateSearchQuery = async (query: string): Promise<void> => {
    searchQuery.value = query
    await performSearch(query)
  }

  const focusOnNode = (nodeId: string): void => {
    focusedNodeId.value = nodeId
    selectNode(nodeId)
  }

  const clearFocus = (): void => {
    focusedNodeId.value = null
  }

  const toggleMultiSelectMode = (): void => {
    multiSelectMode.value = !multiSelectMode.value
    if (!multiSelectMode.value) {
      selectedNodes.value.clear()
    }
  }

  const addToSelection = (nodeId: string): void => {
    if (multiSelectMode.value) {
      selectedNodes.value.add(nodeId)
    }
  }

  const removeFromSelection = (nodeId: string): void => {
    selectedNodes.value.delete(nodeId)
  }

  const clearSelection = (): void => {
    selectedNodes.value.clear()
  }

  const expandNode = (nodeId: string): void => {
    expandedNodes.value.add(nodeId)
  }

  const collapseNode = (nodeId: string): void => {
    expandedNodes.value.delete(nodeId)
  }

  const toggleNodeExpansion = (nodeId: string): void => {
    if (expandedNodes.value.has(nodeId)) {
      collapseNode(nodeId)
    } else {
      expandNode(nodeId)
    }
  }

  const saveNodePosition = (nodeId: string, x: number, y: number): void => {
    nodePositions.value.set(nodeId, { x, y })
  }

  const getNodePosition = (nodeId: string): { x: number; y: number } | null => {
    return nodePositions.value.get(nodeId) || null
  }

  const highlightNodes = (nodeIds: string[]): void => {
    highlightedNodes.value = nodeIds
  }

  const clearHighlight = (): void => {
    highlightedNodes.value = []
  }

  const setAnimating = (isAnimating: boolean): void => {
    animating.value = isAnimating
  }

  // === 批量操作 ===
  const selectMultipleNodes = (nodeIds: string[]): void => {
    nodeIds.forEach(id => selectedNodes.value.add(id))
  }

  const expandMultipleNodes = (nodeIds: string[]): void => {
    nodeIds.forEach(id => expandedNodes.value.add(id))
  }

  const collapseAllNodes = (): void => {
    expandedNodes.value.clear()
  }

  // === 数据导出 ===
  const exportGraphData = (): string => {
    return JSON.stringify({
      graphData: graphData.value,
      nodePositions: Array.from(nodePositions.value.entries()),
      selectedNodes: Array.from(selectedNodes.value),
      expandedNodes: Array.from(expandedNodes.value)
    }, null, 2)
  }

  const importGraphData = (jsonData: string): void => {
    try {
      const data = JSON.parse(jsonData)
      graphData.value = data.graphData
      nodePositions.value = new Map(data.nodePositions || [])
      selectedNodes.value = new Set(data.selectedNodes || [])
      expandedNodes.value = new Set(data.expandedNodes || [])
    } catch (err) {
      console.error('导入数据失败:', err)
    }
  }

  // === 性能优化 ===
  const optimizePerformance = (): void => {
    // 清理过期缓存
    const now = Date.now()
    for (const [key, entry] of cache.value.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cache.value.delete(key)
      }
    }

    // 限制节点位置缓存大小
    if (nodePositions.value.size > 1000) {
      const entries = Array.from(nodePositions.value.entries())
      nodePositions.value = new Map(entries.slice(-500))
    }
  }

  // === 重置方法 ===
  const reset = (): void => {
    graphData.value = null
    selectedNodeId.value = null
    selectedNodeDetails.value = null
    relatedArticles.value = []
    conceptStatistics.value = null
    filterTypes.value = []
    searchQuery.value = ''
    error.value = null
    highlightedNodes.value = []
    focusedNodeId.value = null
    searchResults.value = []
    searchMode.value = false
    expandedNodes.value.clear()
    nodePositions.value.clear()
    selectedNodes.value.clear()
    multiSelectMode.value = false
    animating.value = false
    cache.value.clear()
    
    // 重置性能指标
    performanceMetrics.value = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      lastUpdateTime: Date.now()
    }
  }

  // 定期优化性能
  setInterval(optimizePerformance, 5 * 60 * 1000) // 每5分钟执行一次

  return {
    // 状态
    graphData,
    selectedNodeId,
    currentLayout,
    loading,
    error,
    selectedNodeDetails,
    relatedArticles,
    conceptStatistics,
    filterTypes,
    searchQuery,
    highlightedNodes,
    focusedNodeId,
    searchResults,
    searchMode,
    multiSelectMode,
    selectedNodes,
    expandedNodes,
    animating,
    nodePositions,
    performanceMetrics,

    // 计算属性
    filteredNodes,
    selectedNode,
    visibleLinks,
    searchResultNodes,
    hasSearchResults,
    focusedNode,
    selectedNodesList,
    cacheHitRate,

    // 方法
    loadGraphData,
    selectNode,
    loadNodeDetails,
    performSearch,
    setLayout,
    updateFilter,
    updateSearchQuery,
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
    highlightNodes,
    clearHighlight,
    setAnimating,
    selectMultipleNodes,
    expandMultipleNodes,
    collapseAllNodes,
    exportGraphData,
    importGraphData,
    clearCache,
    optimizePerformance,
    reset
  }
}) 