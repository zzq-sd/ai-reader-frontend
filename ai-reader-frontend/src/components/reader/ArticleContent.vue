<template>
  <article class="article-content" :class="contentClasses">
    <!-- 文章头部 -->
    <header class="article-header">
      <div class="article-category" v-if="article.source">
        <span class="category-tag">{{ article.source }}</span>
      </div>
      
      <h1 class="article-title">{{ article.title }}</h1>
      
      <h2 class="article-subtitle" v-if="article.subtitle">
        {{ article.subtitle }}
      </h2>
      
      <div class="article-meta">
        <div class="meta-left">
          <span class="author">{{ article.author }}</span>
          <span class="separator">·</span>
          <time class="publish-time" :datetime="article.publishTime">
            {{ formatDate(article.publishTime) }}
          </time>
          <span class="separator">·</span>
          <span class="read-time">{{ article.readTime }}分钟阅读</span>
          <span class="separator">·</span>
          <span class="word-count">{{ article.wordCount }}字</span>
        </div>
        
        <div class="meta-right">
          <div class="article-tags" v-if="article.tags?.length">
            <span 
              v-for="tag in article.tags.slice(0, 3)"
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </header>
    
    <!-- 文章内容 -->
    <div class="article-body" ref="contentRef">
      <div 
        class="content-html"
        v-html="article.content"
        @mouseup="handleTextSelection"
        @touchend="handleTextSelection"
      ></div>
    </div>
    
    <!-- 文章底部 -->
    <footer class="article-footer">
      <div class="reading-stats">
        <div class="stat-item">
          <i class="fas fa-eye"></i>
          <span>阅读进度: {{ Math.round(readingProgress) }}%</span>
        </div>
        <div class="stat-item">
          <i class="fas fa-clock"></i>
          <span>已读时间: {{ formatReadTime(readingProgress, article.readTime) }}</span>
        </div>
        <div class="stat-item" v-if="article.lastReadTime">
          <i class="fas fa-bookmark"></i>
          <span>上次阅读: {{ formatDate(article.lastReadTime) }}</span>
        </div>
      </div>
      
      <div class="article-actions">
        <button 
          class="action-button"
          @click="handleToggleFavorite"
          :class="{ 'active': article.isFavorited }"
        >
          <i class="fas fa-heart"></i>
          {{ article.isFavorited ? '已收藏' : '收藏' }}
        </button>
        
        <button class="action-button" @click="handleShare">
          <i class="fas fa-share"></i>
          分享
        </button>
        
        <button class="action-button" @click="handlePrint">
          <i class="fas fa-print"></i>
          打印
        </button>
      </div>
    </footer>
    
    <!-- 文本选择工具栏 -->
    <div 
      v-if="showSelectionToolbar"
      class="selection-toolbar"
      :style="selectionToolbarStyle"
    >
      <button 
        class="selection-button"
        @click="handleHighlight"
        title="高亮"
      >
        <i class="fas fa-highlighter"></i>
      </button>
      
      <button 
        class="selection-button"
        @click="handleAddNote"
        title="添加笔记"
      >
        <i class="fas fa-sticky-note"></i>
      </button>
      
      <button 
        class="selection-button"
        @click="handleCopyText"
        title="复制"
      >
        <i class="fas fa-copy"></i>
      </button>
      
      <button 
        class="selection-button"
        @click="handleShare"
        title="分享"
      >
        <i class="fas fa-share"></i>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { ArticleContent, ReadingPreferences, ArticleNote } from '@/api/reader'

// Props
interface Props {
  article: ArticleContent
  readingPreferences: ReadingPreferences
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update-progress': [progress: number]
  'add-note': [note: Omit<ArticleNote, 'id' | 'createdAt' | 'updatedAt'>]
  'update-note': [noteId: string, updates: Partial<ArticleNote>]
  'delete-note': [noteId: string]
}>()

// 响应式数据
const contentRef = ref<HTMLElement>()
const readingProgress = ref(0)
const showSelectionToolbar = ref(false)
const selectedText = ref('')
const selectionRange = ref<Range | null>(null)
const selectionToolbarStyle = ref({})

// 计算属性
const contentClasses = computed(() => ({
  [`content--${props.readingPreferences.fontSize}`]: true,
  [`content--${props.readingPreferences.fontFamily}`]: true,
  [`content--${props.readingPreferences.lineHeight}`]: true,
  [`content--${props.readingPreferences.contentWidth}`]: true,
  [`content--${props.readingPreferences.theme}`]: true
}))

// 工具函数
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else if (diffDays < 30) {
    return `${Math.ceil(diffDays / 7)}周前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

function formatReadTime(progress: number, totalTime: number): string {
  const readTime = Math.round((progress / 100) * totalTime)
  if (readTime < 1) {
    return '不到1分钟'
  }
  return `${readTime}分钟`
}

// 滚动进度计算
function calculateProgress() {
  if (!contentRef.value) return
  
  const element = contentRef.value
  const scrollTop = element.scrollTop
  const scrollHeight = element.scrollHeight - element.clientHeight
  
  if (scrollHeight > 0) {
    const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100))
    readingProgress.value = progress
    emit('update-progress', progress)
  }
}

// 文本选择处理
function handleTextSelection() {
  const selection = window.getSelection()
  
  if (!selection || selection.rangeCount === 0) {
    hideSelectionToolbar()
    return
  }
  
  const range = selection.getRangeAt(0)
  const text = selection.toString().trim()
  
  if (text.length === 0) {
    hideSelectionToolbar()
    return
  }
  
  selectedText.value = text
  selectionRange.value = range
  showSelectionToolbar.value = true
  
  // 计算工具栏位置
  nextTick(() => {
    positionSelectionToolbar(range)
  })
}

function positionSelectionToolbar(range: Range) {
  const rect = range.getBoundingClientRect()
  const toolbarHeight = 40
  const toolbarWidth = 200
  
  let top = rect.top - toolbarHeight - 10
  let left = rect.left + (rect.width / 2) - (toolbarWidth / 2)
  
  // 确保工具栏在视窗内
  if (top < 10) {
    top = rect.bottom + 10
  }
  
  if (left < 10) {
    left = 10
  } else if (left + toolbarWidth > window.innerWidth - 10) {
    left = window.innerWidth - toolbarWidth - 10
  }
  
  selectionToolbarStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 1002
  }
}

function hideSelectionToolbar() {
  showSelectionToolbar.value = false
  selectedText.value = ''
  selectionRange.value = null
}

// 选择工具栏操作
function handleHighlight() {
  if (!selectionRange.value) return
  
  // TODO: 实现高亮功能
  console.log('Highlight text:', selectedText.value)
  hideSelectionToolbar()
}

function handleAddNote() {
  if (!selectionRange.value || !selectedText.value) return
  
  const note = {
    articleId: props.article.id,
    content: '',
    highlightText: selectedText.value,
    position: {
      start: selectionRange.value.startOffset,
      end: selectionRange.value.endOffset,
      selector: '' // TODO: 实现CSS选择器生成
    }
  }
  
  emit('add-note', note)
  hideSelectionToolbar()
}

function handleCopyText() {
  if (!selectedText.value) return
  
  navigator.clipboard.writeText(selectedText.value).then(() => {
    // TODO: 显示复制成功提示
    console.log('Text copied to clipboard')
  }).catch(err => {
    console.error('Failed to copy text:', err)
  })
  
  hideSelectionToolbar()
}

function handleShare() {
  // TODO: 实现分享功能
  console.log('Share article')
}

function handleToggleFavorite() {
  // TODO: 实现收藏功能
  console.log('Toggle favorite')
}

function handlePrint() {
  window.print()
}

// 点击外部隐藏选择工具栏
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  
  if (!target.closest('.selection-toolbar')) {
    hideSelectionToolbar()
  }
}

// 生命周期
onMounted(() => {
  // 添加滚动监听
  if (contentRef.value) {
    contentRef.value.addEventListener('scroll', calculateProgress)
  }
  
  // 添加点击监听
  document.addEventListener('click', handleClickOutside)
  
  // 初始化进度
  nextTick(() => {
    calculateProgress()
  })
})

onUnmounted(() => {
  // 移除事件监听
  if (contentRef.value) {
    contentRef.value.removeEventListener('scroll', calculateProgress)
  }
  
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.article-content {
  max-width: 800px;
  margin: 0 auto;
  padding: spacing(8) spacing(6);
  
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  
  // 内容宽度变体
  &.content--narrow {
    max-width: 600px;
  }
  
  &.content--medium {
    max-width: 800px;
  }
  
  &.content--wide {
    max-width: 1000px;
  }
  
  &.content--full {
    max-width: none;
    padding-left: spacing(4);
    padding-right: spacing(4);
  }
  
  // 字体大小变体
  &.content--small {
    font-size: 14px;
  }
  
  &.content--medium {
    font-size: 16px;
  }
  
  &.content--large {
    font-size: 18px;
  }
  
  &.content--extra-large {
    font-size: 20px;
  }
  
  // 字体族变体
  &.content--serif {
    font-family: Georgia, 'Times New Roman', serif;
  }
  
  &.content--sans-serif {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  &.content--monospace {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  }
  
  // 行高变体
  &.content--compact {
    line-height: 1.4;
  }
  
  &.content--normal {
    line-height: 1.6;
  }
  
  &.content--relaxed {
    line-height: 1.8;
  }
  
  // 主题变体
  &.content--sepia {
    background: #f7f3e9;
    color: #5c4b37;
  }
  
  &.content--dark {
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }
}

.article-header {
  margin-bottom: spacing(8);
  text-align: center;
  
  .article-category {
    margin-bottom: spacing(4);
    
    .category-tag {
      display: inline-block;
      padding: spacing(1) spacing(3);
      
      background: var(--color-accent-primary);
      color: white;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: var(--border-radius-s);
    }
  }
  
  .article-title {
    font-size: 2.5em;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-text-primary);
    margin: 0 0 spacing(4) 0;
    
    @include tablet {
      font-size: 2em;
    }
    
    @include mobile {
      font-size: 1.75em;
    }
  }
  
  .article-subtitle {
    font-size: 1.25em;
    font-weight: 400;
    line-height: 1.4;
    color: var(--color-text-secondary);
    margin: 0 0 spacing(6) 0;
    
    @include mobile {
      font-size: 1.1em;
    }
  }
  
  .article-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: spacing(4);
    
    font-size: 14px;
    color: var(--color-text-secondary);
    
    @include mobile {
      flex-direction: column;
      gap: spacing(2);
    }
    
    .meta-left {
      display: flex;
      align-items: center;
      gap: spacing(1);
      
      .separator {
        opacity: 0.5;
      }
      
      .author {
        font-weight: 500;
        color: var(--color-text-primary);
      }
    }
    
    .meta-right {
      .article-tags {
        display: flex;
        gap: spacing(1);
        
        .tag {
          padding: spacing(0.5) spacing(2);
          
          background: var(--color-bg-secondary);
          color: var(--color-text-secondary);
          font-size: 12px;
          border-radius: var(--border-radius-s);
          
          &:hover {
            background: var(--color-bg-hover);
          }
        }
      }
    }
  }
}

.article-body {
  margin-bottom: spacing(8);
  
  .content-html {
    // 文章内容样式
    :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
      font-weight: 600;
      line-height: 1.3;
      color: var(--color-text-primary);
      margin: spacing(6) 0 spacing(3) 0;
      
      &:first-child {
        margin-top: 0;
      }
    }
    
    :deep(h1) { font-size: 2em; }
    :deep(h2) { font-size: 1.75em; }
    :deep(h3) { font-size: 1.5em; }
    :deep(h4) { font-size: 1.25em; }
    :deep(h5) { font-size: 1.1em; }
    :deep(h6) { font-size: 1em; }
    
    :deep(p) {
      margin: spacing(4) 0;
      line-height: inherit;
      
      &:first-child {
        margin-top: 0;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    :deep(blockquote) {
      margin: spacing(6) 0;
      padding: spacing(4) spacing(6);
      
      background: var(--color-bg-secondary);
      border-left: 4px solid var(--color-accent-primary);
      border-radius: var(--border-radius-s);
      
      font-style: italic;
      color: var(--color-text-secondary);
      
      p {
        margin: spacing(2) 0;
        
        &:first-child {
          margin-top: 0;
        }
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
    
    :deep(ul), :deep(ol) {
      margin: spacing(4) 0;
      padding-left: spacing(6);
      
      li {
        margin: spacing(2) 0;
        line-height: inherit;
      }
    }
    
    :deep(code) {
      padding: spacing(0.5) spacing(1);
      
      background: var(--color-bg-secondary);
      color: var(--color-accent-primary);
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 0.9em;
      border-radius: var(--border-radius-xs);
    }
    
    :deep(pre) {
      margin: spacing(6) 0;
      padding: spacing(4);
      
      background: var(--color-bg-secondary);
      border-radius: var(--border-radius-s);
      overflow-x: auto;
      
      code {
        padding: 0;
        background: transparent;
        color: var(--color-text-primary);
      }
    }
    
    :deep(img) {
      max-width: 100%;
      height: auto;
      margin: spacing(6) 0;
      border-radius: var(--border-radius-s);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    :deep(a) {
      color: var(--color-accent-primary);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    :deep(table) {
      width: 100%;
      margin: spacing(6) 0;
      border-collapse: collapse;
      
      th, td {
        padding: spacing(2) spacing(3);
        text-align: left;
        border-bottom: 1px solid var(--color-border-primary);
      }
      
      th {
        font-weight: 600;
        background: var(--color-bg-secondary);
      }
    }
  }
}

.article-footer {
  padding-top: spacing(6);
  border-top: 1px solid var(--color-border-primary);
  
  .reading-stats {
    display: flex;
    gap: spacing(6);
    margin-bottom: spacing(6);
    
    @include mobile {
      flex-direction: column;
      gap: spacing(3);
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: spacing(2);
      
      font-size: 14px;
      color: var(--color-text-secondary);
      
      i {
        color: var(--color-accent-primary);
      }
    }
  }
  
  .article-actions {
    display: flex;
    gap: spacing(3);
    
    @include mobile {
      flex-wrap: wrap;
    }
    
    .action-button {
      display: flex;
      align-items: center;
      gap: spacing(2);
      
      padding: spacing(2) spacing(4);
      
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-primary);
      border-radius: var(--border-radius-s);
      
      font-size: 14px;
      color: var(--color-text-primary);
      cursor: pointer;
      
      transition: all var(--transition-speed-fast);
      
      &:hover {
        background: var(--color-bg-hover);
        border-color: var(--color-border-secondary);
        transform: translateY(-1px);
      }
      
      &.active {
        background: var(--color-accent-primary);
        border-color: var(--color-accent-primary);
        color: white;
        
        &:hover {
          background: var(--color-accent-secondary);
        }
      }
      
      i {
        font-size: 12px;
      }
    }
  }
}

// 文本选择工具栏
.selection-toolbar {
  display: flex;
  align-items: center;
  gap: spacing(1);
  
  padding: spacing(2);
  
  background: rgba(0, 0, 0, 0.9);
  border-radius: var(--border-radius-s);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  
  animation: toolbarFadeIn 0.2s ease-out;
  
  .selection-button {
    display: flex;
    align-items: center;
    justify-content: center;
    
    width: 32px;
    height: 32px;
    
    background: transparent;
    border: none;
    border-radius: var(--border-radius-xs);
    
    color: white;
    font-size: 14px;
    cursor: pointer;
    
    transition: background-color var(--transition-speed-fast);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

@keyframes toolbarFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 响应式设计
@include tablet {
  .article-content {
    padding: spacing(6) spacing(4);
  }
}

@include mobile {
  .article-content {
    padding: spacing(4) spacing(3);
    
    &.content--full {
      padding-left: spacing(3);
      padding-right: spacing(3);
    }
  }
}
</style> 