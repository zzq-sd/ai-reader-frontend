/**
 * RSS管理模块类型定义
 * RSS源管理相关的接口和类型
 */

// RSS源状态类型
export type FeedStatus = 'active' | 'error' | 'updating' | 'paused'

// RSS源优先级类型
export type FeedPriority = 'high' | 'medium' | 'low'

// RSS源排序字段类型
export type FeedSortBy = 'name' | 'lastUpdated' | 'articlesCount' | 'createdAt' | 'category'

// 排序方向类型
export type SortOrder = 'asc' | 'desc'

// RSS源分类类型
export type FeedCategory = 'tech' | 'news' | 'design' | 'business' | 'lifestyle' | 'entertainment' | 'science' | 'other'

// RSS源接口
export interface RssFeed {
  id: string
  name: string
  url: string
  description?: string
  category: FeedCategory
  favicon?: string
  status: FeedStatus
  articlesCount: number
  unreadCount: number
  lastUpdated: string
  createdAt: string
  updateFrequency: number // 更新频率（小时）
  lastError?: string
  tags: string[]
  priority: FeedPriority
  isEnabled: boolean
  customIcon?: string
  homepageUrl?: string
}

// 添加RSS源数据
export interface AddFeedData {
  url: string
  name?: string
  category?: FeedCategory
  description?: string
  updateFrequency?: number
  priority?: FeedPriority
  tags?: string[]
}

// 更新RSS源数据
export interface UpdateFeedData {
  name?: string
  url?: string
  category?: FeedCategory
  description?: string
  updateFrequency?: number
  priority?: FeedPriority
  tags?: string[]
  isEnabled?: boolean
}

// RSS源搜索参数
export interface FeedSearchParams {
  query?: string
  category?: FeedCategory | 'all'
  status?: FeedStatus | 'all'
  priority?: FeedPriority | 'all'
  tags?: string[]
  sortBy?: FeedSortBy
  sortOrder?: SortOrder
  limit?: number
  offset?: number
  isEnabled?: boolean
}

// RSS源统计数据
export interface FeedStats {
  totalFeeds: number
  activeFeeds: number
  errorFeeds: number
  pausedFeeds: number
  totalArticles: number
  unreadArticles: number
  lastUpdateTime: string
  categoriesCount: Record<FeedCategory, number>
  averageUpdateFrequency: number
}

// RSS源检测结果
export interface FeedDetectionResult {
  isValid: boolean
  feedUrl?: string
  title?: string
  description?: string
  favicon?: string
  homepageUrl?: string
  error?: string
  alternativeUrls?: string[]
}

// URL验证结果
export interface UrlValidationResult {
  isValid: boolean
  normalizedUrl?: string
  error?: string
}

// RSS源状态管理接口
export interface RssState {
  // RSS源相关
  feeds: RssFeed[]
  filteredFeeds: RssFeed[]
  selectedFeeds: string[]
  
  // 筛选条件
  searchQuery: string
  categoryFilter: FeedCategory | 'all'
  statusFilter: FeedStatus | 'all'
  priorityFilter: FeedPriority | 'all'
  selectedTags: string[]
  
  // 排序条件
  sortBy: FeedSortBy
  sortOrder: SortOrder
  
  // 加载状态
  isLoadingFeeds: boolean
  isAddingFeed: boolean
  isUpdatingFeed: boolean
  isRefreshing: boolean
  
  // 错误状态
  error: string | null
  
  // 弹窗状态
  showAddFeedModal: boolean
  showEditFeedModal: boolean
  editingFeed: RssFeed | null
  
  // 批量操作
  isBulkMode: boolean
  bulkOperation: string | null
  
  // 统计数据
  stats: FeedStats | null
}

// API响应类型
export interface FeedsResponse {
  feeds: RssFeed[]
  total: number
  hasMore: boolean
}

export interface FeedResponse {
  feed: RssFeed
}

export interface StatsResponse {
  stats: FeedStats
}

// 批量操作类型
export interface BulkOperationData {
  feedIds: string[]
  operation: 'delete' | 'updateCategory' | 'refresh' | 'toggle'
  data?: any
}

// RSS源分类选项
export interface FeedCategoryOption {
  value: FeedCategory
  label: string
  icon: string
  color: string
}

// RSS源操作类型
export type FeedAction = 'edit' | 'delete' | 'refresh' | 'toggle' | 'view'

// 导出数据格式
export interface RssExportData {
  feeds: RssFeed[]
  stats: FeedStats
  exportedAt: string
  version: string
}

// 导入数据格式  
export interface RssImportData {
  feeds: Partial<RssFeed>[]
  settings?: Record<string, any>
}

// 刷新结果
export interface RefreshResult {
  feedId: string
  success: boolean
  articlesAdded: number
  error?: string
}

// 批量刷新结果
export interface BulkRefreshResult {
  results: RefreshResult[]
  totalSuccess: number
  totalFailed: number
}

// 批量操作相关类型
export interface BulkOperationProgress {
  total: number
  completed: number
  failed: number
  operation: 'delete' | 'update' | 'category' | 'status' | 'priority'
  errors?: string[]
}

export interface BatchUpdateData {
  category?: FeedCategory
  isEnabled?: boolean
  priority?: FeedPriority
  tags?: string[]
}

// 拖拽排序相关类型
export interface DragState {
  isDragging: boolean
  draggedFeedId: string | null
  dropTarget: string | null
  dragType: 'reorder' | 'category'
}

export interface ReorderOperation {
  feedId: string
  fromIndex: number
  toIndex: number
  fromCategory?: FeedCategory
  toCategory?: FeedCategory
}

// 右键菜单相关类型
export interface ContextMenuState {
  isVisible: boolean
  x: number
  y: number
  targetFeedId: string | null
}

export interface ContextMenuItem {
  id: string
  label: string
  icon: string
  action: string
  disabled?: boolean
  divider?: boolean
  shortcut?: string
}

// 导入导出相关类型
export interface ImportProgress {
  total: number
  processed: number
  imported: number
  failed: number
  conflicts: ImportConflict[]
  isCompleted: boolean
}

export interface ImportConflict {
  url: string
  existingFeed: RssFeed
  newFeed: Partial<RssFeed>
  conflictType: 'duplicate' | 'category' | 'name'
  resolution?: 'skip' | 'replace' | 'merge'
}

export interface OPMLData {
  title?: string
  dateCreated?: string
  ownerName?: string
  feeds: OPMLFeed[]
  categories: OPMLCategory[]
}

export interface OPMLFeed {
  title: string
  xmlUrl: string
  htmlUrl?: string
  description?: string
  category?: string
  tags?: string[]
}

export interface OPMLCategory {
  name: string
  feeds: OPMLFeed[]
}

export interface ExportOptions {
  format: 'opml' | 'json'
  includeCategories: boolean
  includeSelected: boolean
  selectedFeeds?: string[]
  categories?: FeedCategory[]
}

// 键盘快捷键类型
export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  action: string
  description: string
}

// 操作结果类型
export interface OperationResult {
  success: boolean
  message: string
  data?: any
  errors?: string[]
}

// API函数声明
export declare function fetchWorkspaceFeeds(): Promise<RssFeed[]>
export declare function addFeed(data: AddFeedData): Promise<RssFeed>
export declare function updateFeed(feedId: string, data: UpdateFeedData): Promise<RssFeed>
export declare function deleteFeed(feedId: string): Promise<void>
export declare function refreshFeed(feedId: string): Promise<RefreshResult>
export declare function refreshAllFeeds(): Promise<BulkRefreshResult>
export declare function bulkDeleteFeeds(feedIds: string[]): Promise<OperationResult>
export declare function bulkUpdateCategory(feedIds: string[], category: FeedCategory): Promise<OperationResult>
export declare function getFeedStats(): Promise<FeedStats>
export declare function detectFeedUrl(url: string): Promise<FeedDetectionResult>
export declare function validateFeedUrl(url: string): Promise<UrlValidationResult>
export declare function exportRssData(options: ExportOptions): Promise<RssExportData>
export declare function getCategoryInfo(): Promise<FeedCategoryOption[]>

// RSS源分类选项数据
export declare const feedCategoryOptions: FeedCategoryOption[] 