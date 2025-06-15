import { apiClient } from './base'

// #region --- Type Definitions ---

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

// #endregion

// #region --- API Functions ---

/**
 * 获取知识图谱数据
 */
export async function getGraphData(params: GraphQueryParams = {}): Promise<GraphData> {
  console.log('🔍 获取知识图谱数据，请求参数:', params);
  try {
    const response = await apiClient.get('knowledge-graph/graph-data', {
      params: {
        nodeType: params.nodeType || 'ALL',
        search: params.search || '',
        limit: params.limit || 150
      }
    });
    console.log('📊 知识图谱API原始响应:', response.data);
    if (!response.data) {
      throw new Error('API响应格式不正确');
    }
    return convertBackendDataToFrontend(response.data);
  } catch (error) {
    console.error('❌ 获取知识图谱数据失败:', error);
    return { nodes: [], links: [] }; // 返回空数据以防UI崩溃
  }
}

/**
 * 获取相关文章
 */
export async function getRelatedArticles(conceptName: string, limit: number = 20): Promise<ArticleGraphDTO[]> {
  const response = await apiClient.get(`knowledge-graph/concepts/${encodeURIComponent(conceptName)}/articles`, {
    params: { limit }
  });
  return response.data?.data || [];
}

/**
 * 获取概念统计信息
 */
export async function getConceptStatistics(conceptName: string): Promise<ConceptStatistics | null> {
  const response = await apiClient.get(`knowledge-graph/concepts/${encodeURIComponent(conceptName)}/statistics`);
  return response.data?.data || null;
}

/**
 * 搜索概念
 */
export async function searchConcepts(query: string, limit: number = 10): Promise<ConceptSearchResultDTO[]> {
  const response = await apiClient.get(`knowledge-graph/concepts/search`, {
    params: { query, limit }
  });
  return response.data?.data || [];
}

/**
 * 获取概念详情
 */
export async function getConceptDetail(conceptName: string): Promise<ConceptDetailDTO | null> {
  const response = await apiClient.get(`knowledge-graph/concepts/${encodeURIComponent(conceptName)}`);
  return response.data?.data || null;
}

/**
 * 手动触发文章重新分析
 */
export async function reanalyzeArticle(articleId: string): Promise<string> {
  const response = await apiClient.post(`knowledge-graph/articles/${articleId}/reanalyze`);
  return response.data?.data || '分析任务已提交';
}

/**
 * 手动触发笔记重新分析
 */
export async function reanalyzeNote(noteId: string): Promise<string> {
  const response = await apiClient.post(`knowledge-graph/notes/${noteId}/reanalyze`);
  return response.data?.data || '分析任务已提交';
}

// #endregion

// #region --- Data Conversion Logic ---

/**
 * 将后端DTO数据转换为前端期望的D3格式
 */
function convertBackendDataToFrontend(apiResponse: any): GraphData {
  const rawData = apiResponse.data; // 从ApiResponse中提取核心数据
  if (!rawData || !Array.isArray(rawData.nodes)) {
    console.warn('⚠️ 传入的原始数据格式不正确或节点为空，返回空图。', apiResponse);
    return { nodes: [], links: [] };
  }

  const nodes: GraphNode[] = (rawData.nodes || []).map((node: any, index: number) => ({
    id: node.id || `node-${index}`,
    name: node.label || node.name || node.title || `未命名节点${index}`,
    type: normalizeNodeType(node.type),
    importance: node.importance || node.size || 0.5,
    description: node.properties?.description || node.description || '无详细信息',
    properties: node.properties || {}
  }));

  const nodeMap: Record<string, GraphNode> = {};
  nodes.forEach(node => {
    nodeMap[node.id] = node;
  });

  const links: GraphLink[] = [];
  const edgesArray = rawData.edges || [];

  edgesArray.forEach((edge: any) => {
    const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
    const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;

    if (nodeMap[sourceId] && nodeMap[targetId]) {
      links.push({
        source: nodeMap[sourceId],
        target: nodeMap[targetId],
        type: normalizeRelationType(edge.type || edge.label),
        strength: edge.weight || edge.strength || 1,
        properties: edge.properties || {}
      });
    } else {
      console.warn(`⚠️ 边引用了不存在的节点，已跳过: ${sourceId} -> ${targetId}`);
    }
  });

  console.log(`✅ 数据转换完成: ${nodes.length} 个节点, ${links.length} 条连线`);
  return { nodes, links };
}

function normalizeNodeType(type: string): 'CONCEPT' | 'ARTICLE' | 'NOTE' {
  const upperType = (type || '').toUpperCase();
  if (upperType.includes('CONCEPT')) return 'CONCEPT';
  if (upperType.includes('ARTICLE')) return 'ARTICLE';
  if (upperType.includes('NOTE')) return 'NOTE';
  return 'CONCEPT'; // 默认
}

function normalizeRelationType(type: string): 'CONTAINS' | 'RELATED_TO' | 'DISCUSSES' {
  const upperType = (type || '').toUpperCase();
  if (upperType.includes('CONTAINS')) return 'CONTAINS';
  if (upperType.includes('RELATED_TO')) return 'RELATED_TO';
  if (upperType.includes('DISCUSSES')) return 'DISCUSSES';
  return 'RELATED_TO'; // 默认
}

// #endregion 