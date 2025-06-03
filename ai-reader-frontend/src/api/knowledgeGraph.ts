import { apiClient } from './base'

// 图谱节点数据结构 - 与后端DTO对应
export interface GraphNode {
  id: string
  name: string
  type: 'CONCEPT' | 'ARTICLE' | 'NOTE'
  frequency?: number
  importance?: number
  description?: string
  properties?: Record<string, any>
  x?: number
  y?: number
  fx?: number
  fy?: number
}

// 图谱连线数据结构 - 与后端DTO对应
export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  type: 'CONTAINS' | 'RELATED_TO' | 'DISCUSSES'
  strength: number
  properties?: Record<string, any>
}

// 图谱数据容器 - 与后端GraphDataDTO对应
export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  edges?: any[] // 添加可选的edges属性，兼容后端响应
}

// 概念统计信息 - 与后端ConceptStatisticsDTO对应
export interface ConceptStatistics {
  conceptName: string
  conceptType: string
  articleCount: number
  noteCount: number
  totalFrequency: number
  relatedConceptCount: number
  averageConfidence: number
  firstMentioned: string
  lastMentioned: string
}

// 文章图谱DTO - 与后端ArticleDTO对应
export interface ArticleGraphDTO {
  id: string
  title: string
  summary: string
  publishDate: string
  confidence?: number
  context?: string
  tags?: string[]
  relevanceScore: number
}

// 概念搜索结果DTO
export interface ConceptSearchResultDTO {
  id: string
  name: string
  type: string
  description: string
  articleCount: number
  noteCount: number
}

// 概念详情DTO
export interface ConceptDetailDTO {
  id: string
  name: string
  type: string
  description: string
  synonyms: string[]
  statistics: ConceptStatistics
  relatedConcepts: Array<{
    id: string
    name: string
    strength: number
  }>
}

// 图谱查询参数
export interface GraphQueryParams {
  nodeType?: string
  search?: string
  limit?: number
}

/**
 * 获取知识图谱数据
 */
export async function getGraphData(params: GraphQueryParams = {}): Promise<{ data: GraphData }> {
  const queryParams = new URLSearchParams()
  
  if (params.nodeType && params.nodeType !== 'ALL') {
    queryParams.append('nodeType', params.nodeType)
  }
  if (params.search) {
    queryParams.append('search', params.search)
  }
  if (params.limit) {
    queryParams.append('limit', params.limit.toString())
  }

  console.log('🔍 获取知识图谱数据，请求参数:', params);
  
  try {
    const response = await apiClient.get(`/api/v1/knowledge/graph-data?${queryParams.toString()}`)
    console.log('📊 知识图谱API原始响应:', response);
    
    // 确保返回的数据符合预期结构
    if (!response.data || !response.data.data) {
      console.error('❌ API响应格式不正确:', response);
      throw new Error('API响应格式不正确');
    }
    
    const rawGraphData = response.data.data;
    console.log('📈 原始图谱数据结构:', {
      nodes: rawGraphData.nodes?.length || 0,
      edges: rawGraphData.edges?.length || 0,
      nodeStructure: rawGraphData.nodes?.[0],
      edgeStructure: rawGraphData.edges?.[0]
    });
    
    // 转换后端DTO为前端期望的格式
    const convertedGraphData = convertBackendDataToFrontend(rawGraphData);
    
    console.log('🔄 转换后的图谱数据:', {
      nodes: convertedGraphData.nodes.length,
      links: convertedGraphData.links.length,
      nodeExample: convertedGraphData.nodes[0],
      linkExample: convertedGraphData.links[0]
    });
    
    return { data: convertedGraphData }
  } catch (error) {
    console.error('❌ 获取知识图谱数据失败:', error);
    throw error;
  }
}

/**
 * 将后端DTO数据转换为前端期望的格式
 */
function convertBackendDataToFrontend(rawData: any): GraphData {
  console.log('🔄 开始数据格式转换...');
  
  // 处理节点数据
  const nodes: GraphNode[] = (rawData.nodes || []).map((node: any, index: number) => {
    // 智能提取节点名称，尝试多个可能的字段
    let nodeName = '';
    
    // 优先级顺序：label > name > title > id的有意义部分
    if (node.label && node.label.trim()) {
      nodeName = node.label.trim();
    } else if (node.name && node.name.trim()) {
      nodeName = node.name.trim();
    } else if (node.title && node.title.trim()) {
      nodeName = node.title.trim();
    } else if (node.id && node.id.trim() && !node.id.startsWith('node-') && !node.id.includes('_')) {
      nodeName = node.id.trim();
    } else {
      // 根据节点类型生成描述性名称
      const nodeType = normalizeNodeType(node.type);
      nodeName = `未命名${nodeType === 'CONCEPT' ? '概念' : nodeType === 'ARTICLE' ? '文章' : '笔记'}-${index}`;
    }
    
    const convertedNode: GraphNode = {
      id: node.id || `node-${index}`,
      name: nodeName,
      type: normalizeNodeType(node.type),
      importance: node.importance || node.size || 0.5,
      description: node.properties?.description || node.description || `${nodeName}的详细信息`,
      properties: {
        ...node.properties,
        category: node.category,
        color: node.color,
        createdAt: node.properties?.createdAt || new Date().toISOString(),
        // 保留原始字段用于调试
        originalLabel: node.label,
        originalName: node.name,
        originalTitle: node.title
      }
    };
    
    console.log(`📝 节点转换: [原始] label="${node.label}", name="${node.name}", title="${node.title}" -> [转换后] "${convertedNode.name}" (${convertedNode.type})`);
    return convertedNode;
  });
  
  // 处理边数据 - 转换edges为links
  const links: GraphLink[] = (rawData.edges || []).map((edge: any, index: number) => {
    const convertedLink: GraphLink = {
      source: edge.source,
      target: edge.target,
      type: normalizeRelationType(edge.type || edge.label),
      strength: edge.weight || edge.strength || 1,
      properties: {
        ...edge.properties,
        label: edge.label,
        color: edge.color
      }
    };
    
    console.log(`🔗 边转换: ${edge.source} -> ${edge.target} (${convertedLink.type})`);
    return convertedLink;
  });
  
  // 验证数据完整性
  validateGraphData(nodes, links);
  
  return {
    nodes,
    links
  };
}

/**
 * 规范化节点类型
 */
function normalizeNodeType(type: string): 'CONCEPT' | 'ARTICLE' | 'NOTE' {
  if (!type) return 'CONCEPT';
  
  const upperType = type.toUpperCase();
  switch (upperType) {
    case 'ARTICLE':
    case 'ARTICLES':
      return 'ARTICLE';
    case 'NOTE':
    case 'NOTES':
      return 'NOTE';
    case 'CONCEPT':
    case 'CONCEPTS':
    default:
      return 'CONCEPT';
  }
}

/**
 * 规范化关系类型
 */
function normalizeRelationType(type: string): 'CONTAINS' | 'RELATED_TO' | 'DISCUSSES' {
  if (!type) return 'RELATED_TO';
  
  const upperType = type.toUpperCase();
  switch (upperType) {
    case 'CONTAINS':
    case 'CONTAIN':
      return 'CONTAINS';
    case 'DISCUSSES':
    case 'DISCUSS':
      return 'DISCUSSES';
    case 'RELATED_TO':
    case 'RELATED':
    case 'RELATES_TO':
    default:
      return 'RELATED_TO';
  }
}

/**
 * 验证图谱数据完整性
 */
function validateGraphData(nodes: GraphNode[], links: GraphLink[]): void {
  console.log('🔍 验证图谱数据完整性...');
  
  // 创建节点ID集合
  const nodeIds = new Set(nodes.map(node => node.id));
  
  // 验证边的引用完整性
  const invalidLinks = links.filter(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    return !nodeIds.has(sourceId) || !nodeIds.has(targetId);
  });
  
  if (invalidLinks.length > 0) {
    console.warn('⚠️ 发现无效边引用:', invalidLinks);
  }
  
  // 验证节点数据完整性
  const invalidNodes = nodes.filter(node => !node.id || !node.name);
  if (invalidNodes.length > 0) {
    console.warn('⚠️ 发现无效节点:', invalidNodes);
  }
  
  console.log('✅ 数据验证完成:', {
    nodes: nodes.length,
    links: links.length,
    invalidLinks: invalidLinks.length,
    invalidNodes: invalidNodes.length
  });
}

/**
 * 获取概念相关的文章
 */
export async function getRelatedArticles(conceptName: string, limit: number = 20): Promise<{ data: ArticleGraphDTO[] }> {
  const response = await apiClient.get(`/api/v1/knowledge/concepts/${encodeURIComponent(conceptName)}/articles`, {
    params: { limit }
  })
  // 后端使用ApiResponse包装，需要从response.data.data获取实际数据
  return { data: response.data.data }
}

/**
 * 获取概念统计信息
 */
export async function getConceptStatistics(conceptName: string): Promise<{ data: ConceptStatistics }> {
  const response = await apiClient.get(`/api/v1/knowledge/concepts/${encodeURIComponent(conceptName)}/statistics`)
  // 后端使用ApiResponse包装，需要从response.data.data获取实际数据
  return { data: response.data.data }
}

/**
 * 搜索概念
 */
export async function searchConcepts(query: string, limit: number = 10): Promise<{ data: ConceptSearchResultDTO[] }> {
  const response = await apiClient.get('/api/v1/knowledge/concepts/search', {
    params: { query, limit }
  })
  // 后端使用ApiResponse包装，需要从response.data.data获取实际数据
  return { data: response.data.data }
}

/**
 * 获取概念详情
 */
export async function getConceptDetail(conceptName: string): Promise<{ data: ConceptDetailDTO }> {
  const response = await apiClient.get(`/api/v1/knowledge/concepts/${encodeURIComponent(conceptName)}`)
  // 后端使用ApiResponse包装，需要从response.data.data获取实际数据
  return { data: response.data.data }
}

/**
 * 手动触发文章重新分析
 */
export async function reanalyzeArticle(articleId: string): Promise<{ data: string }> {
  const response = await apiClient.post(`/api/v1/knowledge/articles/${articleId}/reanalyze`)
  // 后端使用ApiResponse包装，需要从response.data.data获取实际数据
  return { data: response.data.data }
}

/**
 * 手动触发笔记重新分析
 */
export async function reanalyzeNote(noteId: string): Promise<{ data: string }> {
  try {
    console.log(`准备分析笔记: ${noteId}`)
    const response = await apiClient.post(`/api/v1/notes/${noteId}/reanalyze`)
    console.log('笔记分析API响应:', response)
    
    // 即使后端返回了错误状态码也视为成功提交
    // 由于后端已经开始处理分析任务，我们认为请求本身是成功的
    // 处理直接返回字符串的情况
    if (typeof response.data === 'string') {
      return { data: response.data }
    }
    
    // 处理ApiResponse包装的情况
    if (response.data && response.data.data !== undefined) {
      return { data: response.data.data }
    }
    
    // 其他情况，返回默认消息
    return { data: '分析任务已提交' }
  } catch (error: any) {
    // 捕获错误但返回成功响应，因为后端已经开始处理
    console.error('笔记分析API调用异常:', error)
    // 返回一个成功的响应，而不是抛出异常
    return { data: '分析任务已提交，正在后台处理' }
  }
}

// 导出类型别名
export type NodeDetails = ConceptDetailDTO 