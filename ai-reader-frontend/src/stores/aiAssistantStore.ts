import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Message, 
  ChatSettings, 
  ConnectionStatus, 
  ChatSession,
  FileUpload,
  AiAssistantState,
  MessageFilter,
  SearchResult
} from '@/types/aiAssistant'
import { defaultChatSettings, defaultConnectionStatus } from '@/types/aiAssistant'

export const useAiAssistantStore = defineStore('aiAssistant', () => {
  // 状态
  const messages = ref<Message[]>([])
  const isTyping = ref(false)
  const connectionStatus = ref<ConnectionStatus>(defaultConnectionStatus)
  const settings = ref<ChatSettings>(defaultChatSettings)
  const currentSession = ref<ChatSession | null>(null)
  const sessions = ref<ChatSession[]>([])
  const uploadProgress = ref<FileUpload[]>([])
  const searchResults = ref<SearchResult[]>([])
  const isSearchMode = ref(false)

  // 计算属性
  const messageCount = computed(() => messages.value.length)
  const userMessageCount = computed(() => 
    messages.value.filter(m => m.sender === 'user').length
  )
  const aiMessageCount = computed(() => 
    messages.value.filter(m => m.sender === 'ai').length
  )
  const isConnected = computed(() => 
    connectionStatus.value.status === 'connected'
  )
  const hasMessages = computed(() => messages.value.length > 0)
  const lastMessage = computed(() => 
    messages.value[messages.value.length - 1]
  )

  // 消息管理
  const addMessage = (message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    messages.value.push(newMessage)
    
    // 自动滚动到底部
    if (settings.value.autoScroll) {
      scrollToBottom()
    }
    
    // 限制历史记录长度
    if (messages.value.length > settings.value.maxHistoryLength) {
      messages.value.splice(0, messages.value.length - settings.value.maxHistoryLength)
    }
    
    return newMessage
  }

  const sendMessage = async (message: Omit<Message, 'id'>) => {
    const newMessage = addMessage(message)
    
    // 更新会话信息
    if (currentSession.value) {
      currentSession.value.updatedAt = new Date()
      currentSession.value.messageCount = messages.value.length
    }
    
    return newMessage
  }

  const deleteMessage = (messageId: string) => {
    const index = messages.value.findIndex(m => m.id === messageId)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
  }

  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      Object.assign(message, updates)
    }
  }

  const clearMessages = () => {
    messages.value = []
    if (currentSession.value) {
      currentSession.value.messageCount = 0
    }
  }

  const copyMessage = async (messageId: string) => {
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      try {
        await navigator.clipboard.writeText(message.content)
        // 可以添加成功提示
        console.log('消息已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    }
  }

  const regenerateMessage = async (messageId: string) => {
    const messageIndex = messages.value.findIndex(m => m.id === messageId)
    if (messageIndex !== -1) {
      const message = messages.value[messageIndex]
      if (message.sender === 'ai') {
        // 删除原消息
        messages.value.splice(messageIndex, 1)
        
        // 重新生成回复
        const previousUserMessage = messages.value
          .slice(0, messageIndex)
          .reverse()
          .find(m => m.sender === 'user')
        
        if (previousUserMessage) {
          await simulateAiResponse(previousUserMessage.content)
        }
      }
    }
  }

  // 输入状态管理
  const setTyping = (typing: boolean) => {
    isTyping.value = typing
  }

  // 连接状态管理
  const setConnectionStatus = (status: ConnectionStatus) => {
    connectionStatus.value = status
  }

  const connect = async () => {
    setConnectionStatus({ status: 'connecting' })
    
    try {
      // 模拟连接过程
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setConnectionStatus({ 
        status: 'connected',
        lastConnected: new Date()
      })
    } catch (error) {
      setConnectionStatus({ 
        status: 'error',
        errorMessage: '连接失败，请检查网络设置'
      })
    }
  }

  const disconnect = () => {
    setConnectionStatus({ status: 'disconnected' })
  }

  // 设置管理
  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings()
  }

  const resetSettings = () => {
    settings.value = { ...defaultChatSettings }
    saveSettings()
  }

  const saveSettings = () => {
    try {
      localStorage.setItem('ai-assistant-settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('ai-assistant-settings')
      if (saved) {
        const parsedSettings = JSON.parse(saved)
        settings.value = { ...defaultChatSettings, ...parsedSettings }
      }
    } catch (error) {
      console.error('加载设置失败:', error)
      settings.value = { ...defaultChatSettings }
    }
  }

  // 会话管理
  const createSession = (title?: string) => {
    const session: ChatSession = {
      id: Date.now().toString(),
      title: title || `对话 ${sessions.value.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0
    }
    
    sessions.value.push(session)
    currentSession.value = session
    clearMessages()
    
    return session
  }

  const switchSession = (sessionId: string) => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      currentSession.value = session
      // 这里应该加载对应会话的消息
      // 暂时清空消息列表
      clearMessages()
    }
  }

  const deleteSession = (sessionId: string) => {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index !== -1) {
      sessions.value.splice(index, 1)
      
      // 如果删除的是当前会话，切换到其他会话或创建新会话
      if (currentSession.value?.id === sessionId) {
        if (sessions.value.length > 0) {
          switchSession(sessions.value[0].id)
        } else {
          createSession()
        }
      }
    }
  }

  // 文件上传管理
  const addUpload = (file: File) => {
    const upload: FileUpload = {
      file,
      progress: 0,
      status: 'uploading'
    }
    uploadProgress.value.push(upload)
    return upload
  }

  const updateUploadProgress = (file: File, progress: number) => {
    const upload = uploadProgress.value.find(u => u.file === file)
    if (upload) {
      upload.progress = progress
      if (progress >= 100) {
        upload.status = 'completed'
      }
    }
  }

  const removeUpload = (file: File) => {
    const index = uploadProgress.value.findIndex(u => u.file === file)
    if (index !== -1) {
      uploadProgress.value.splice(index, 1)
    }
  }

  // 搜索功能
  const searchMessages = (query: string, filter?: MessageFilter) => {
    if (!query.trim()) {
      searchResults.value = []
      isSearchMode.value = false
      return
    }

    isSearchMode.value = true
    const results: SearchResult[] = []
    
    messages.value.forEach(message => {
      // 应用过滤器
      if (filter) {
        if (filter.sender && filter.sender !== 'all' && message.sender !== filter.sender) {
          return
        }
        if (filter.type && filter.type !== 'all' && message.type !== filter.type) {
          return
        }
        if (filter.dateRange) {
          const messageDate = new Date(message.timestamp)
          if (messageDate < filter.dateRange.start || messageDate > filter.dateRange.end) {
            return
          }
        }
      }

      // 搜索内容
      const content = message.content.toLowerCase()
      const searchQuery = query.toLowerCase()
      
      if (content.includes(searchQuery)) {
        const index = content.indexOf(searchQuery)
        const contextStart = Math.max(0, index - 50)
        const contextEnd = Math.min(content.length, index + searchQuery.length + 50)
        const context = message.content.substring(contextStart, contextEnd)
        
        results.push({
          messageId: message.id,
          content: message.content,
          relevance: calculateRelevance(content, searchQuery),
          context: contextStart > 0 ? '...' + context : context
        })
      }
    })

    // 按相关性排序
    results.sort((a, b) => b.relevance - a.relevance)
    searchResults.value = results
  }

  const clearSearch = () => {
    searchResults.value = []
    isSearchMode.value = false
  }

  // 计算搜索相关性
  const calculateRelevance = (content: string, query: string): number => {
    const occurrences = (content.match(new RegExp(query, 'gi')) || []).length
    const position = content.toLowerCase().indexOf(query.toLowerCase())
    const lengthFactor = query.length / content.length
    
    return occurrences * 10 + (position === 0 ? 5 : 0) + lengthFactor * 100
  }

  // 工具函数
  const scrollToBottom = () => {
    // 这个函数会在组件中实现
    // 这里只是占位符
  }

  // 模拟AI回复（实际项目中应该调用真实的AI API）
  const simulateAiResponse = async (userMessage: string) => {
    setTyping(true)
    
    // 模拟思考时间
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const responses = [
      '我理解您的问题。让我为您分析一下...',
      '这是一个很有趣的话题。根据我的理解...',
      '我可以帮您处理这个请求。以下是我的建议...',
      '感谢您的提问。让我从几个角度来解答...'
    ]
    
    const aiResponse = responses[Math.floor(Math.random() * responses.length)]
    
    await sendMessage({
      content: aiResponse + ' 这里是根据您的问题生成的详细回答内容。',
      type: 'text',
      timestamp: new Date(),
      sender: 'ai',
      status: 'sent'
    })
    
    setTyping(false)
  }

  // 初始化
  const initialize = () => {
    loadSettings()
    
    // 创建默认会话
    if (sessions.value.length === 0) {
      createSession('默认对话')
    }
    
    // 尝试连接
    connect()
  }

  // 清理
  const cleanup = () => {
    disconnect()
    saveSettings()
  }

  // 导出状态和方法
  return {
    // 状态
    messages,
    isTyping,
    connectionStatus,
    settings,
    currentSession,
    sessions,
    uploadProgress,
    searchResults,
    isSearchMode,
    
    // 计算属性
    messageCount,
    userMessageCount,
    aiMessageCount,
    isConnected,
    hasMessages,
    lastMessage,
    
    // 消息管理
    addMessage,
    sendMessage,
    deleteMessage,
    updateMessage,
    clearMessages,
    copyMessage,
    regenerateMessage,
    
    // 输入状态
    setTyping,
    
    // 连接管理
    setConnectionStatus,
    connect,
    disconnect,
    
    // 设置管理
    updateSettings,
    resetSettings,
    saveSettings,
    loadSettings,
    
    // 会话管理
    createSession,
    switchSession,
    deleteSession,
    
    // 文件上传
    addUpload,
    updateUploadProgress,
    removeUpload,
    
    // 搜索功能
    searchMessages,
    clearSearch,
    
    // 工具函数
    scrollToBottom,
    simulateAiResponse,
    
    // 生命周期
    initialize,
    cleanup
  }
}) 