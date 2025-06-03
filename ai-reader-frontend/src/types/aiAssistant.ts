// AI助手相关类型定义

export interface Message {
  id: string
  content: string
  type: 'text' | 'file' | 'image' | 'code'
  timestamp: Date
  sender: 'user' | 'ai'
  status?: 'sending' | 'sent' | 'error' | 'typing'
  metadata?: {
    fileName?: string
    fileSize?: number
    fileType?: string
    codeLanguage?: string
    [key: string]: any
  }
}

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  category: 'reading' | 'learning' | 'tools' | 'analysis'
  shortcut?: string
  enabled?: boolean
}

export interface ChatSettings {
  theme: 'light' | 'dark' | 'auto'
  fontSize: number
  language: 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR'
  autoScroll: boolean
  sendOnEnter: boolean
  showTimestamp: boolean
  showAvatar: boolean
  soundEnabled: boolean
  typingIndicator: boolean
  messageGrouping: boolean
  maxMessages: number
  autoSaveInterval: number
  enableShortcuts: boolean
  maxHistoryLength: number
  aiModel: 'gpt-3.5' | 'gpt-4' | 'claude' | 'local'
  temperature: number
  maxTokens: number
}

export interface ConnectionStatus {
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  lastConnected?: Date
  errorMessage?: string
}

export interface TypingIndicator {
  isTyping: boolean
  startTime?: Date
  estimatedDuration?: number
}

export interface MessageAction {
  type: 'copy' | 'regenerate' | 'delete' | 'edit' | 'share'
  label: string
  icon: string
  enabled: boolean
}

export interface ChatSession {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
  tags?: string[]
}

export interface FileUpload {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  errorMessage?: string
}

// AI助手状态接口
export interface AiAssistantState {
  messages: Message[]
  isTyping: boolean
  connectionStatus: ConnectionStatus
  settings: ChatSettings
  currentSession: ChatSession | null
  sessions: ChatSession[]
  uploadProgress: FileUpload[]
}

// 事件类型
export interface MessageEvent {
  type: 'message' | 'typing' | 'error' | 'connection'
  data: any
  timestamp: Date
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: number
}

export interface AiResponse {
  content: string
  type: 'text' | 'markdown' | 'code'
  confidence?: number
  sources?: string[]
  suggestions?: string[]
}

// 搜索和过滤
export interface MessageFilter {
  sender?: 'user' | 'ai' | 'all'
  type?: Message['type'] | 'all'
  dateRange?: {
    start: Date
    end: Date
  }
  keyword?: string
}

export interface SearchResult {
  messageId: string
  content: string
  relevance: number
  context: string
}

// 导出和导入
export interface ExportOptions {
  format: 'json' | 'markdown' | 'txt' | 'pdf'
  includeMetadata: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ImportData {
  messages: Message[]
  settings?: Partial<ChatSettings>
  metadata?: {
    version: string
    exportDate: Date
    source: string
  }
}

// 插件和扩展
export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  enabled: boolean
  config?: Record<string, any>
}

// 统计数据
export interface ChatStatistics {
  totalMessages: number
  userMessages: number
  aiMessages: number
  averageResponseTime: number
  mostUsedActions: QuickAction[]
  dailyActivity: {
    date: string
    messageCount: number
  }[]
  topTopics: {
    topic: string
    count: number
  }[]
}

// 默认设置
export const defaultChatSettings: ChatSettings = {
  theme: 'auto',
  fontSize: 16,
  language: 'zh-CN',
  autoScroll: true,
  sendOnEnter: true,
  showTimestamp: true,
  showAvatar: true,
  soundEnabled: false,
  typingIndicator: true,
  messageGrouping: true,
  maxMessages: 100,
  autoSaveInterval: 5,
  enableShortcuts: true,
  maxHistoryLength: 1000,
  aiModel: 'gpt-3.5',
  temperature: 0.7,
  maxTokens: 2048
}

// 默认连接状态
export const defaultConnectionStatus: ConnectionStatus = {
  status: 'disconnected'
} 