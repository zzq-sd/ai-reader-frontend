/**
 * 笔记模块 TypeScript 接口定义
 * 用于Notes页面的所有数据结构和API接口
 */

// 笔记主体数据
export interface Note {
  id: string
  title: string
  content: readonly any[] // Quill Delta 格式
  preview: string // 纯文本预览，用于列表展示
  tags: readonly string[]
  createdAt: string
  updatedAt: string
  lastModified: string // 人性化时间显示
}

// 笔记列表项（轻量级）
export interface NoteListItem {
  id: string
  title: string
  preview: string
  tags: readonly string[]
  lastModified: string
}

// 笔记搜索参数
export interface NoteSearchParams {
  query?: string
  tags?: string[]
  sortBy?: 'updatedAt' | 'createdAt' | 'title'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 笔记创建/更新数据
export interface NoteCreateData {
  title: string
  content: any[]
  tags: string[]
}

export interface NoteUpdateData extends Partial<NoteCreateData> {
  id: string
}

// API 响应格式
export interface NotesResponse {
  notes: NoteListItem[]
  total: number
  hasMore: boolean
}

export interface NoteDetailResponse {
  note: Note
}

// 标签相关
export interface TagSuggestion {
  name: string
  count: number // 使用该标签的笔记数量
}

// Quill编辑器相关
export interface QuillInstance {
  getContents(): any[]
  setContents(contents: any[]): void
  getText(index?: number, length?: number): string
  on(eventName: string, handler: Function): void
  off(eventName: string, handler: Function): void
  focus(): void
  blur(): void
}

// 笔记Store状态接口
export interface NotesState {
  // 笔记列表数据
  notes: NoteListItem[]
  currentNote: Note | null
  selectedNoteId: string | null
  
  // 搜索和过滤
  searchQuery: string
  filteredNotes: NoteListItem[]
  
  // 编辑器状态
  isEditing: boolean
  hasUnsavedChanges: boolean
  autoSaveTimer: number | null
  
  // 标签管理
  availableTags: string[]
  tagSuggestions: TagSuggestion[]
  
  // UI状态
  loading: boolean
  error: string | null
  sidebarCollapsed: boolean
}

// 错误处理相关
export interface NotesError {
  code: string
  message: string
  details?: any
}

// 笔记操作事件类型
export type NoteEventType = 'create' | 'update' | 'delete' | 'select'

export interface NoteEvent {
  type: NoteEventType
  noteId: string
  note?: Note
  timestamp: number
}

// API函数声明
export declare function fetchWorkspaceNotes(params?: NoteSearchParams): Promise<NotesResponse>
export declare function fetchWorkspaceNoteDetail(noteId: string): Promise<NoteDetailResponse>
export declare function createNote(data: NoteCreateData): Promise<Note>
export declare function updateNote(data: NoteUpdateData): Promise<Note>
export declare function saveNote(note: Note): Promise<Note>
export declare function deleteNote(noteId: string): Promise<void>
export declare function searchNotes(params: NoteSearchParams): Promise<NotesResponse>
export declare function fetchTagSuggestions(): Promise<TagSuggestion[]> 