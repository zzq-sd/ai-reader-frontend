/**
 * 笔记模块 Mock API 服务
 * 模拟后端API，提供完整的笔记CRUD操作
 */

// 模拟笔记数据库 - 使用Map存储完整数据
const notesDataStore = new Map()

// 笔记列表缓存 - 用于快速列表展示
let notesListCache = []

// 标签统计缓存
let tagSuggestionsCache = []

// 模拟延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 生成唯一ID
function generateId() {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 将Quill Delta内容转换为纯文本预览
export function generateNotePreview(content) {
  if (!content || !Array.isArray(content)) return ''
  
  let preview = ''
  content.forEach(op => {
    if (typeof op.insert === 'string') {
      preview += op.insert
    }
  })
  
  // 清理格式，保留前100个字符
  return preview
    .replace(/\n/g, ' ')
    .trim()
    .substring(0, 100)
    .trim() + (preview.length > 100 ? '...' : '')
}

// 格式化时间戳为人性化显示
export function formatNoteTimestamp(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  
  // 超过一周显示具体日期
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 更新笔记列表缓存
function updateNotesListCache() {
  notesListCache = Array.from(notesDataStore.values())
    .map(note => ({
      id: note.id,
      title: note.title,
      preview: note.preview,
      tags: note.tags,
      lastModified: note.lastModified
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

// 更新标签建议缓存
function updateTagSuggestionsCache() {
  const tagCounts = new Map()
  
  notesDataStore.forEach(note => {
    note.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })
  
  tagSuggestionsCache = Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

// 初始化模拟数据
export function initializeMockData() {
  const mockNotes = [
    {
      id: 'note_1',
      title: 'Vue 3.4 学习笔记',
      content: [
        { insert: 'Vue 3.4 响应式系统重构要点\n', attributes: { header: 2 } },
        { insert: '\n新的响应式系统采用了更先进的算法，主要改进包括：\n\n' },
        { insert: '性能优化' }, { insert: '\n', attributes: { list: 'bullet' } },
        { insert: '响应式系统重构，减少30%的内存占用' }, { insert: '\n', attributes: { list: 'bullet' } },
        { insert: '编译器优化，提升20%的构建速度' }, { insert: '\n', attributes: { list: 'bullet' } },
        { insert: '\n开发体验提升：\n' },
        { insert: '更好的TypeScript支持' }, { insert: '\n', attributes: { list: 'ordered' } },
        { insert: '改进的开发工具集成' }, { insert: '\n', attributes: { list: 'ordered' } },
        { insert: '更清晰的错误信息提示' }, { insert: '\n', attributes: { list: 'ordered' } }
      ],
      tags: ['Vue.js', '前端', '学习笔记'],
      createdAt: '2024-12-19T10:00:00Z',
      updatedAt: '2024-12-19T14:30:00Z'
    },
    {
      id: 'note_2',
      title: 'TypeScript最佳实践',
      content: [
        { insert: 'TypeScript最佳实践总结\n', attributes: { header: 2 } },
        { insert: '\n在项目开发中整理的一些TypeScript使用技巧：\n\n' },
        { insert: '1. 使用严格模式 (strict: true)' }, { insert: '\n', attributes: { list: 'ordered' } },
        { insert: '2. 合理使用泛型 (Generics)' }, { insert: '\n', attributes: { list: 'ordered' } },
        { insert: '3. 善用联合类型和交叉类型' }, { insert: '\n', attributes: { list: 'ordered' } },
        { insert: '4. 利用工具类型简化代码' }, { insert: '\n', attributes: { list: 'ordered' } },
        { insert: '\n' },
        { insert: '代码示例', attributes: { header: 3 } },
        { insert: '\n\n' },
        { insert: 'interface User {\n  id: string\n  name: string\n  email?: string\n}', attributes: { 'code-block': true } }
      ],
      tags: ['TypeScript', '前端', '最佳实践'],
      createdAt: '2024-12-18T09:15:00Z',
      updatedAt: '2024-12-18T16:45:00Z'
    },
    {
      id: 'note_3',
      title: 'Pinia状态管理模式',
      content: [
        { insert: 'Pinia vs Vuex 对比分析\n', attributes: { header: 1 } },
        { insert: '\nPinia相比Vuex的优势：\n\n' },
        { insert: '更简洁的API设计' }, { insert: '\n', attributes: { list: 'bullet' } },
        { insert: '更好的TypeScript支持' }, { insert: '\n', attributes: { list: 'bullet' } },
        { insert: '无需mutations，直接修改state' }, { insert: '\n', attributes: { list: 'bullet' } },
        { insert: '支持多个store实例' }, { insert: '\n', attributes: { list: 'bullet' } },
        { insert: '\n建议在新项目中优先使用Pinia。' }
      ],
      tags: ['Pinia', 'Vuex', '状态管理', 'Vue.js'],
      createdAt: '2024-12-17T11:20:00Z',
      updatedAt: '2024-12-17T15:10:00Z'
    }
  ]
  
  // 初始化数据
  mockNotes.forEach(note => {
    note.preview = generateNotePreview(note.content)
    note.lastModified = formatNoteTimestamp(note.updatedAt)
    notesDataStore.set(note.id, note)
  })
  
  updateNotesListCache()
  updateTagSuggestionsCache()
}

// 获取笔记列表
export async function fetchWorkspaceNotes(params = {}) {
  await delay(300) // 模拟网络延迟
  
  const {
    query = '',
    tags = [],
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    limit = 50,
    offset = 0
  } = params
  
  let filteredNotes = [...notesListCache]
  
  // 搜索过滤
  if (query.trim()) {
    const searchTerm = query.toLowerCase()
    filteredNotes = filteredNotes.filter(note =>
      note.title.toLowerCase().includes(searchTerm) ||
      note.preview.toLowerCase().includes(searchTerm) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }
  
  // 标签过滤
  if (tags.length > 0) {
    filteredNotes = filteredNotes.filter(note =>
      tags.some(tag => note.tags.includes(tag))
    )
  }
  
  // 排序
  filteredNotes.sort((a, b) => {
    const aValue = sortBy === 'title' ? a.title : new Date(notesDataStore.get(a.id)[sortBy])
    const bValue = sortBy === 'title' ? b.title : new Date(notesDataStore.get(b.id)[sortBy])
    
    if (sortBy === 'title') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    } else {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    }
  })
  
  // 分页
  const paginatedNotes = filteredNotes.slice(offset, offset + limit)
  
  return {
    notes: paginatedNotes,
    total: filteredNotes.length,
    hasMore: offset + limit < filteredNotes.length
  }
}

// 获取笔记详情
export async function fetchWorkspaceNoteDetail(noteId) {
  await delay(200)
  
  const note = notesDataStore.get(noteId)
  if (!note) {
    throw new Error(`笔记不存在: ${noteId}`)
  }
  
  return { note }
}

// 创建新笔记
export async function createNote(data) {
  await delay(400)
  
  const now = new Date().toISOString()
  const noteId = generateId()
  
  const newNote = {
    id: noteId,
    title: data.title || '无标题笔记',
    content: data.content || [],
    preview: generateNotePreview(data.content),
    tags: data.tags || [],
    createdAt: now,
    updatedAt: now,
    lastModified: '刚刚'
  }
  
  notesDataStore.set(noteId, newNote)
  updateNotesListCache()
  updateTagSuggestionsCache()
  
  return { note: newNote }
}

// 更新笔记
export async function updateNote(data) {
  await delay(350)
  
  const existingNote = notesDataStore.get(data.id)
  if (!existingNote) {
    throw new Error(`笔记不存在: ${data.id}`)
  }
  
  const now = new Date().toISOString()
  const updatedNote = {
    ...existingNote,
    ...data,
    updatedAt: now,
    lastModified: '刚刚'
  }
  
  // 如果内容发生变化，重新生成预览
  if (data.content) {
    updatedNote.preview = generateNotePreview(data.content)
  }
  
  notesDataStore.set(data.id, updatedNote)
  updateNotesListCache()
  updateTagSuggestionsCache()
  
  return { note: updatedNote }
}

// 保存笔记（简化版更新）
export async function saveNote(noteData) {
  try {
    await updateNote(noteData)
    return { success: true }
  } catch (error) {
    console.error('保存笔记失败:', error)
    return { success: false, error: error.message }
  }
}

// 删除笔记
export async function deleteNote(noteId) {
  await delay(250)
  
  const deleted = notesDataStore.delete(noteId)
  if (!deleted) {
    throw new Error(`笔记不存在: ${noteId}`)
  }
  
  updateNotesListCache()
  updateTagSuggestionsCache()
  
  return { success: true }
}

// 搜索笔记
export async function searchNotes(query) {
  return await fetchWorkspaceNotes({ query })
}

// 获取标签建议
export async function fetchTagSuggestions() {
  await delay(150)
  
  return {
    tags: tagSuggestionsCache
  }
}

// 批量操作
export async function batchDeleteNotes(noteIds) {
  await delay(500)
  
  const results = []
  for (const noteId of noteIds) {
    try {
      await deleteNote(noteId)
      results.push({ noteId, success: true })
    } catch (error) {
      results.push({ noteId, success: false, error: error.message })
    }
  }
  
  return { results }
}

// 导出笔记（预留功能）
export async function exportNote(noteId, format = 'markdown') {
  await delay(800)
  
  const note = notesDataStore.get(noteId)
  if (!note) {
    throw new Error(`笔记不存在: ${noteId}`)
  }
  
  // 简单的Markdown导出示例
  if (format === 'markdown') {
    let markdown = `# ${note.title}\n\n`
    
    note.content.forEach(op => {
      if (typeof op.insert === 'string') {
        markdown += op.insert
      }
    })
    
    return {
      content: markdown,
      filename: `${note.title}.md`,
      mimeType: 'text/markdown'
    }
  }
  
  throw new Error(`不支持的导出格式: ${format}`)
}

// 初始化模拟数据（在模块加载时执行）
initializeMockData()

console.log('📝 Notes Mock API 已初始化，包含', notesDataStore.size, '条模拟笔记') 