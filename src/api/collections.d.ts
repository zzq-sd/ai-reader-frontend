/**
 * Collections模块类型定义
 * 收藏管理相关的接口和类型
 */

// 收藏文件夹接口
export interface Collection {
  id: string
  name: string
  icon: string
  itemCount: number
  createdAt: string
  updatedAt: string
  description?: string
}

// 收藏项接口
export interface CollectionItem {
  id: string
  type: 'article' | 'note'
  title: string
  description?: string
  source: string
  sourceIcon?: string
  sourceColor?: string
  tags: string[]
  collectedAt: string
  originalId: string // 原始文章或笔记ID
  url?: string // 原始链接（仅文章）
  thumbnail?: string // 缩略图
  folderId: string // 所属文件夹ID
}

// 创建文件夹数据
export interface CreateFolderData {
  name: string
  icon?: string
  description?: string
}

// 更新文件夹数据
export interface UpdateFolderData {
  name?: string
  icon?: string
  description?: string
}

// 添加收藏项数据
export interface AddItemData {
  folderId: string
  originalId: string
  type: 'article' | 'note'
  title: string
  description?: string
  source: string
  sourceIcon?: string
  sourceColor?: string
  tags?: string[]
  url?: string
  thumbnail?: string
}

// 搜索参数
export interface CollectionSearchParams {
  query?: string
  folderId?: string
  type?: 'article' | 'note' | 'all'
  tags?: string[]
  sortBy?: 'collectedAt' | 'title' | 'source'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 视图模式
export type ViewMode = 'grid' | 'list'

// Collections状态接口
export interface CollectionsState {
  // 文件夹相关
  folders: Collection[]
  currentFolderId: string | null
  
  // 收藏项相关
  items: CollectionItem[]
  filteredItems: CollectionItem[]
  
  // UI状态
  viewMode: ViewMode
  searchQuery: string
  selectedTags: string[]
  
  // 加载状态
  isLoadingFolders: boolean
  isLoadingItems: boolean
  
  // 错误状态
  error: string | null
  
  // 模态框状态
  showNewFolderModal: boolean
  showEditFolderModal: boolean
  editingFolder: Collection | null
}

// API响应类型
export interface CollectionsResponse {
  folders: Collection[]
  total: number
}

export interface CollectionItemsResponse {
  items: CollectionItem[]
  total: number
  hasMore: boolean
}

// 文件夹图标选项
export interface FolderIconOption {
  value: string
  label: string
  icon: string
}

// 导出数据格式
export interface ExportData {
  folders: Collection[]
  items: CollectionItem[]
  exportedAt: string
  version: string
}

// 统计数据
export interface CollectionStats {
  totalFolders: number
  totalItems: number
  articleCount: number
  noteCount: number
  recentlyAdded: number
  topTags: Array<{ tag: string; count: number }>
}

// API响应包装类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// API函数声明
export declare function fetchWorkspaceFolders(): Promise<ApiResponse<Collection[]>>
export declare function createFolder(data: CreateFolderData): Promise<ApiResponse<Collection>>
export declare function updateFolder(folderId: string, data: UpdateFolderData): Promise<ApiResponse<Collection>>
export declare function deleteFolder(folderId: string): Promise<ApiResponse<{ deletedFolderId: string }>>
export declare function fetchWorkspaceCollections(folderId: string, params?: CollectionSearchParams): Promise<ApiResponse<CollectionItemsResponse>>
export declare function addCollectionItem(data: AddItemData): Promise<ApiResponse<CollectionItem>>
export declare function removeCollectionItem(itemId: string, folderId: string): Promise<ApiResponse<{ removedItemId: string }>>
export declare function moveItemToFolder(itemId: string, fromFolderId: string, toFolderId: string): Promise<ApiResponse<CollectionItem>>
export declare function searchCollections(query: string, folderId?: string): Promise<ApiResponse<CollectionItem[]>>
export declare function getCollectionStats(): Promise<ApiResponse<CollectionStats>>
export declare function exportCollections(format: 'json' | 'html'): Promise<ApiResponse<ExportData>>

// 文件夹图标选项
export declare const folderIconOptions: FolderIconOption[] 