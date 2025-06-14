<template>
  <div class="article-reader" :class="readerClasses">
    <!-- 阅读进度条 -->
    <div class="reading-progress">
      <div 
        class="progress-bar"
        :style="{ width: `${readingProgress}%` }"
      ></div>
    </div>
    
    <!-- 悬浮工具栏 -->
    <div class="reader-toolbar" v-if="readerToolbarVisible">
      <button @click="handleCloseReader" class="toolbar-btn" title="返回">
        <i class="fas fa-arrow-left"></i>
      </button>
      <button @click="handleToggleFavorite" class="toolbar-btn" :class="{ active: article?.isFavorited }" title="收藏">
        <i :class="article?.isFavorited ? 'fas fa-bookmark' : 'far fa-bookmark'"></i>
      </button>
      <button @click="handleShareArticle" class="toolbar-btn" title="分享">
        <i class="fas fa-share-alt"></i>
      </button>
      <button @click="toggleFontSize" class="toolbar-btn" title="字体大小">
        <i class="fas fa-text-height"></i>
      </button>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="reader-container" ref="contentRef">
      <!-- 加载状态 -->
      <div v-if="loading" class="reader-loading">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>正在加载文章...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="reader-error">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button @click="handleRetry" class="retry-button">
          <i class="fas fa-redo"></i>
          重试
        </button>
      </div>
      
      <!-- 文章不存在 -->
      <div v-else-if="!article" class="reader-not-found">
        <div class="not-found-icon">
          <i class="fas fa-file-alt"></i>
        </div>
        <h3>文章不存在</h3>
        <p>您访问的文章可能已被删除或不存在</p>
        <router-link to="/articles" class="back-button">
          <i class="fas fa-arrow-left"></i>
          返回文章列表
        </router-link>
      </div>
      
      <!-- 文章内容 -->
      <div v-else class="reader-main">
        <!-- 文章头部 -->
        <header class="reader-header">
          <h1 class="article-title-main">{{ article.title }}</h1>
          <div class="article-meta-reader">
            <div class="meta-item-reader">
              <i class="fas fa-rss"></i>
              <span class="article-source-reader">{{ article.source }}</span>
            </div>
            <div class="meta-item-reader" v-if="article.author">
              <i class="fas fa-user-edit"></i>
              <span>{{ article.author }}</span>
            </div>
            <div class="meta-item-reader">
              <i class="far fa-calendar-alt"></i>
              <span>{{ formatDate(article.publishTime) }}</span>
            </div>
            <div class="meta-item-reader">
              <i class="far fa-clock"></i>
              <span>阅读时间：{{ article.readTime }}分钟</span>
            </div>
          </div>
        </header>
        
        <!-- 文章正文 -->
        <article class="article-content-main" :style="contentStyles" v-html="processedContent"></article>
        
        <!-- 文章操作按钮已移除 - 使用侧边栏工具栏 -->
        
        <!-- 相关文章 -->
        <section class="related-articles-section" v-if="relatedArticles.length > 0">
          <h2 class="section-title-reader">相关文章</h2>
          
          <div 
            v-for="relatedArticle in relatedArticles" 
            :key="relatedArticle.id"
            class="related-item-reader" 
            @click="handleRelatedArticleClick(relatedArticle)"
          >
            <div class="related-image-reader">
              <img :src="relatedArticle.coverImageUrl || relatedArticle.coverImage || relatedArticle.imageUrl || getDefaultThumbnail()" :alt="relatedArticle.title">
            </div>
            <div class="related-content-reader">
              <h3 class="related-title-reader">{{ relatedArticle.title }}</h3>
              <div class="related-meta-reader">{{ relatedArticle.source }} • {{ formatRelativeTime(relatedArticle.publishTime) }}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
    
    <!-- 笔记高亮弹出框 -->
    <div 
      v-if="showNotePopup && selectedNote"
      class="note-popup"
      :style="notePopupStyle"
    >
      <div class="note-content">{{ selectedNote.content }}</div>
      <div class="note-actions">
        <button @click="editNote(selectedNote)" class="note-btn">编辑</button>
        <button @click="deleteNote(selectedNote.id)" class="note-btn danger">删除</button>
        <button @click="closeNotePopup" class="note-btn">关闭</button>
      </div>
    </div>
    
    <!-- Toast通知 -->
    <Transition name="toast">
      <div v-if="showToastNotification" class="toast-notification" :class="`toast-${toastType}`">
        <div class="toast-content">
          <i :class="toastType === 'success' ? 'fas fa-check-circle' : toastType === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle'"></i>
          <span>{{ toastMessage }}</span>
        </div>
        <button class="toast-close" @click="showToastNotification = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </Transition>

    <!-- 浮动AI助手 - 始终显示 -->
    <FloatingAISummary 
      :visible="true"
      :article-id="articleId"
      :article-content="article?.content"
      @close="handleCloseAISummary"
      @save="handleAISummarySaved"
      @minimize="handleMinimizeAISummary"
    />

    <!-- 浮动笔记编辑器 - 始终显示 -->
    <FloatingNoteEditor 
      :visible="true"
      :article-id="articleId"
      :selected-text="selectedTextForNote"
      :existing-note="existingNoteForArticle"
      @close="handleCloseNoteEditor"
      @save="handleNoteSaved"
      @minimize="handleMinimizeNoteEditor"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { fetchArticleContent, updateReadingProgress, fetchRelatedArticles } from '@/api/reader'
import type { ArticleContent, RelatedArticle, ArticleNote, ReadingPreferences } from '@/api/reader'
import type { NoteRequest } from '@/types/note'
import FloatingNoteEditor from '@/components/notes/FloatingNoteEditor.vue'
import FloatingAISummary from '@/components/ai/FloatingAISummary.vue'
// 暂时移除文本解码处理
// import { processText } from '@/utils/textDecoder'

const route = useRoute()
const router = useRouter()
const uiStore = useUIStore()

// 响应式数据
const article = ref<ArticleContent | null>(null)
const relatedArticles = ref<RelatedArticle[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const contentRef = ref<HTMLElement>()

// 笔记相关状态
const showNotePopup = ref(false)
const selectedNote = ref<ArticleNote | null>(null)
const notePopupPosition = ref({ x: 0, y: 0 })

// 浮动笔记编辑器状态
const showFloatingNoteEditor = ref(false)
const selectedTextForNote = ref('')
const existingNoteForArticle = ref<any>(null) // 存储当前文章的已有笔记

// 浮动AI助手状态
const showFloatingAISummary = ref(false)

// 字体大小状态
const currentFontSize = ref(16)
const fontSizes = [14, 16, 18, 20]

// 从store获取状态
const { 
  readingPreferences, 
  readerToolbarVisible, 
  readingProgress,
  isFullscreen 
} = uiStore

// 计算属性
const readerClasses = computed(() => ({
  'reader--fullscreen': isFullscreen,
  'reader--toolbar-hidden': !readerToolbarVisible,
  [`reader--${readingPreferences.theme}`]: readingPreferences.theme === 'dark'
}))

const contentStyles = computed(() => ({
  fontSize: `${currentFontSize.value}px`,
  lineHeight: readingPreferences.lineHeight === 'compact' ? '1.4' : 
              readingPreferences.lineHeight === 'normal' ? '1.6' : '1.8',
  fontFamily: readingPreferences.fontFamily === 'serif' ? 'Georgia, "Times New Roman", serif' :
              readingPreferences.fontFamily === 'sans-serif' ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' :
              '"SF Mono", Monaco, "Cascadia Code", monospace'
}))

const processedArticle = computed(() => {
  if (!article.value) return null
  
  return {
    ...article.value,
    title: article.value.title || '',
    content: article.value.content || '',
    author: article.value.author || '',
    subtitle: article.value.subtitle || '',
    // 处理其他可能需要解码的字段
  }
})

const processedContent = computed(() => {
  if (!processedArticle.value?.content) return ''
  // 这里可以处理笔记高亮等功能
  return processedArticle.value.content
})

const notePopupStyle = computed(() => ({
  left: `${notePopupPosition.value.x}px`,
  top: `${notePopupPosition.value.y}px`
}))

// 获取文章ID
const articleId = computed(() => route.params.id as string)

// 事件处理
async function loadArticle() {
  if (!articleId.value) return
  
  try {
    loading.value = true
    error.value = null
    
    const response = await fetchArticleContent(articleId.value)
    article.value = response.article
    
    // 获取真实的收藏状态
    await loadFavoriteStatus()
    
    // 更新阅读进度
    uiStore.updateReadingProgress(article.value.readProgress || 0)
    
    // 加载相关文章
    loadRelatedArticles()
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载文章失败'
    console.error('Failed to load article:', err)
  } finally {
    loading.value = false
  }
}

// 加载收藏状态
async function loadFavoriteStatus() {
  if (!articleId.value || !article.value) return
  
  try {
    // 使用articleService获取收藏状态
    const { articleService } = await import('@/api/services/articleService')
    const isFavorited = await articleService.getFavoriteStatus(articleId.value)
    article.value.isFavorited = isFavorited
  } catch (error) {
    console.warn('获取收藏状态失败:', error)
    // 如果获取失败，保持原状态不变
  }
}

async function loadRelatedArticles() {
  if (!articleId.value) return
  
  try {
    const articles = await fetchRelatedArticles(articleId.value)
    relatedArticles.value = articles
  } catch (err) {
    console.error('Failed to load related articles:', err)
  }
}

function handleUpdatePreferences(preferences: Partial<ReadingPreferences>) {
  uiStore.updateReadingPreferences(preferences)
}

async function handleUpdateProgress(progress: number) {
  uiStore.updateReadingProgress(progress)
  
  // 保存到服务器
  if (articleId.value && readingPreferences.autoSave) {
    try {
      await updateReadingProgress(articleId.value, progress)
    } catch (err) {
      console.error('Failed to save reading progress:', err)
    }
  }
}

function handleToggleFavorite() {
  if (article.value) {
    const originalStatus = article.value.isFavorited
    const newStatus = !originalStatus
    
    // 乐观更新
    article.value.isFavorited = newStatus
    
    // 调用API更新收藏状态
    import('@/api/services/articleService').then(({ articleService }) => {
      articleService.toggleFavorite(article.value!.id, newStatus).catch((error) => {
        // 如果API调用失败，回滚状态
        article.value!.isFavorited = originalStatus
        console.error('Failed to toggle favorite:', error)
        
        // 显示错误提示
        showToast(
          newStatus ? '收藏失败，请稍后重试' : '取消收藏失败，请稍后重试',
          'error'
        )
      })
    })
    
    // 显示成功提示
    showToast(
      newStatus ? '已添加到收藏' : '已取消收藏',
      'success'
    )
  }
}

function handleShareArticle() {
  if (navigator.share && article.value) {
    navigator.share({ 
      title: article.value.title, 
      url: window.location.href 
    })
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('链接已复制!')
    })
  }
}

function handleToggleFullscreen() {
  uiStore.toggleFullscreen()
}

function handleCloseReader() {
  router.push('/articles')
}

function handleRetry() {
  loadArticle()
}

function handleRelatedArticleClick(relatedArticle: RelatedArticle) {
  router.push(`/articles/${relatedArticle.id}`)
}

// 工具栏功能
function toggleFontSize() {
  const currentIndex = fontSizes.indexOf(currentFontSize.value)
  const nextIndex = (currentIndex + 1) % fontSizes.length
  currentFontSize.value = fontSizes[nextIndex]
}

function toggleTheme() {
  const newTheme = readingPreferences.theme === 'dark' ? 'light' : 'dark'
  uiStore.updateReadingPreferences({ theme: newTheme })
}

// 浮动笔记编辑器相关方法
function handleCloseNoteEditor() {
  selectedTextForNote.value = ''
}

async function handleNoteSaved(note: NoteRequest) {
  showToast('笔记已保存', 'success')
  console.log('Note saved:', note)
}

function handleMinimizeNoteEditor() {
  showToast('笔记编辑器已最小化', 'info')
}

function addToCollection() {
  // TODO: 实现添加到收藏夹
  alert('添加到收藏夹')
}

function viewKnowledgeGraph() {
  // TODO: 实现查看知识图谱
  window.open('/knowledge-graph', '_blank')
}

// 笔记相关处理
function handleAddNote(note: Omit<ArticleNote, 'id' | 'createdAt' | 'updatedAt'>) {
  // TODO: 实现添加笔记功能
  console.log('Add note:', note)
}

function handleUpdateNote(noteId: string, updates: Partial<ArticleNote>) {
  // TODO: 实现更新笔记功能
  console.log('Update note:', noteId, updates)
}

function handleDeleteNote(noteId: string) {
  // TODO: 实现删除笔记功能
  console.log('Delete note:', noteId)
}

function editNote(note: ArticleNote) {
  // TODO: 实现编辑笔记
  console.log('Edit note:', note)
  closeNotePopup()
}

function deleteNote(noteId: string) {
  // TODO: 实现删除笔记
  console.log('Delete note:', noteId)
  closeNotePopup()
}

function closeNotePopup() {
  showNotePopup.value = false
  selectedNote.value = null
}

// 工具函数
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return '刚刚'
  if (diffInHours < 24) return `${diffInHours}小时前`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}天前`
  return formatDate(dateString)
}

function getDefaultThumbnail() {
  return 'https://source.unsplash.com/80x60?programming,abstract'
}

// 滚动监听，计算阅读进度
function handleScroll() {
  if (!contentRef.value) return
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
  
  if (docHeight > 0) {
    const progress = Math.round((scrollTop / docHeight) * 100)
    handleUpdateProgress(progress)
  }
}

// 键盘快捷键
function handleKeydown(event: KeyboardEvent) {
  // ESC: 退出全屏
  if (event.key === 'Escape' && isFullscreen) {
    uiStore.toggleFullscreen()
  }
  
  // F11: 切换全屏
  if (event.key === 'F11') {
    event.preventDefault()
    uiStore.toggleFullscreen()
  }
  
  // T: 切换工具栏
  if (event.key === 't' || event.key === 'T') {
    uiStore.toggleReaderToolbar()
  }
  
  // 方向键: 滚动
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault()
    const scrollAmount = event.key === 'ArrowUp' ? -100 : 100
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' })
  }
}

// 生命周期
onMounted(() => {
  loadArticle()
  
  // 添加事件监听
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  // 移除事件监听
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', handleScroll)
})

// 监听路由变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    loadArticle()
  }
})

// Toast通知相关
const showToastNotification = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('info')

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) {
  toastMessage.value = message
  toastType.value = type
  showToastNotification.value = true
  
  // 自动隐藏
  setTimeout(() => {
    showToastNotification.value = false
  }, duration)
}

// AI助手相关
function handleCloseAISummary() {
  showFloatingAISummary.value = false
}

async function handleAISummarySaved(summary: string) {
  showToast('AI助手总结已保存', 'success')
  console.log('AI summary saved:', summary)
}

function handleMinimizeAISummary() {
  showFloatingAISummary.value = false
  showToast('AI助手已最小化', 'info')
}
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  /* 默认使用亮色主题 */
  --color-bg-primary: #F9FAFB;
  --color-bg-secondary: #FFFFFF;
  --color-bg-tertiary: #F3F4F6;
  --color-bg-hover: rgba(0, 0, 0, 0.05);
  --color-bg-active: rgba(0, 0, 0, 0.1);
  --color-text-primary: #1F2937;
  --color-text-secondary: #6B7280;
  --color-text-disabled: #9CA3AF;
  --color-accent-primary: #7B61FF;
  --color-accent-primary-hover: #6A52E0;
  --color-accent-secondary: #3B82F6;
  --color-border-primary: #E5E7EB;
  --color-border-secondary: #D1D5DB;
  --color-positive: #22C55E;
  --color-negative: #EF4444;
  --color-warning: #F59E0B;

  --border-radius-s: 4px;
  --border-radius-m: 6px;
  --border-radius-l: 8px;
  --border-radius-xl: 12px;
  --spacing-unit: 4px;
  --transition-speed-fast: 0.15s ease-out;
  --transition-speed-normal: 0.25s ease-out;
  --transition-speed-slow: 0.4s ease-out;

  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-s: 0 2px 5px rgba(0,0,0,0.1);
  --shadow-m: 0 5px 15px rgba(0,0,0,0.1);
  --shadow-l: 0 10px 30px rgba(0,0,0,0.15);

  /* 亮色主题的毛玻璃效果 */
  --color-bg-frosted: rgba(255, 255, 255, 0.8);
  --backdrop-blur-intensity: 12px;
  --frosted-border-color: rgba(0, 0, 0, 0.06);
}

.article-reader {
  position: relative;
  min-height: 100vh;
  height: auto;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  line-height: 1.7;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInSlideUp 0.6s var(--transition-speed-slow) forwards;
  overflow-y: visible;
  
  &.reader--fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    overflow-y: auto;
  }
  
  /* 深色主题 */
  &.reader--dark {
    --color-bg-primary: #0D0D0F;
    --color-bg-secondary: #131417;
    --color-bg-tertiary: #1A1B1F;
    --color-bg-hover: rgba(255, 255, 255, 0.07);
    --color-bg-active: rgba(255, 255, 255, 0.1);
    --color-text-primary: #E1E1E6;
    --color-text-secondary: #A8A8B3;
    --color-text-disabled: #50505A;
    --color-border-primary: #25262B;
    --color-border-secondary: #36373D;
    --color-bg-frosted: rgba(26, 27, 31, 0.7);
    --frosted-border-color: rgba(255, 255, 255, 0.07);
    --shadow-xs: 0 1px 2px rgba(0,0,0,0.2);
    --shadow-s: 0 2px 5px rgba(0,0,0,0.25);
    --shadow-m: 0 5px 15px rgba(0,0,0,0.3);
    --shadow-l: 0 10px 30px rgba(0,0,0,0.35);
  }
}

@keyframes fadeInSlideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: transparent;
  z-index: 1000;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary));
  width: 0%;
  transition: width 0.05s linear;
  border-radius: 0 2px 2px 0;
}

.reader-toolbar {
  position: sticky;
  top: calc(var(--spacing-unit) * 5);
  right: calc(var(--spacing-unit) * 5);
  float: right;
  margin-right: calc(var(--spacing-unit) * 5);
  background-color: var(--color-bg-frosted);
  backdrop-filter: blur(var(--backdrop-blur-intensity)) saturate(150%);
  -webkit-backdrop-filter: blur(var(--backdrop-blur-intensity)) saturate(150%);
  border: 1px solid var(--frosted-border-color);
  border-radius: var(--border-radius-l);
  padding: calc(var(--spacing-unit) * 2);
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 1.5);
  box-shadow: var(--shadow-m);
  z-index: 100;
  opacity: 0;
  transform: translateX(100%);
  animation: slideInFromRight 0.5s var(--transition-speed-slow) forwards;
}

@keyframes slideInFromRight {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toolbar-btn {
  width: 38px;
  height: 38px;
  border-radius: var(--border-radius-m);
  background-color: transparent;
  border: 1px solid transparent;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-speed-normal);
  font-size: 14px;
  
  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
    transform: scale(1.05);
    border-color: var(--color-border-primary);
  }
  
  &.active {
    background-color: var(--color-accent-primary);
    color: white;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 10px rgba(123, 97, 255, 0.3);
  }
}

.reader-container {
  max-width: 800px;
  margin: 0 auto;
  padding: calc(var(--spacing-unit) * 10) calc(var(--spacing-unit) * 6) calc(var(--spacing-unit) * 12);
}

.reader-header {
  margin-bottom: calc(var(--spacing-unit) * 8);
}

.article-title-main {
  font-size: 30px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.3;
  margin-bottom: calc(var(--spacing-unit) * 5);
}

.article-meta-reader {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 5);
  margin-bottom: calc(var(--spacing-unit) * 6);
  padding-bottom: calc(var(--spacing-unit) * 5);
  border-bottom: 1px solid var(--color-border-primary);
}

.meta-item-reader {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1.5);
  font-size: 13px;
  color: var(--color-text-secondary);
  
  i {
    font-size: 12px;
    color: var(--color-text-disabled);
  }
}

.article-source-reader {
  color: var(--color-accent-primary);
  font-weight: 500;
}

.article-content-main {
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text-primary);
  max-width: 100%;
  word-wrap: break-word;
  
  // 标题层级优化
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    color: var(--color-text-primary);
    font-weight: 600;
    margin: calc(var(--spacing-unit) * 8) 0 calc(var(--spacing-unit) * 4) 0;
    line-height: 1.3;
    position: relative;
    
    // 添加左侧装饰线
    &::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: linear-gradient(180deg, var(--color-accent-primary), var(--color-accent-secondary));
      border-radius: 2px;
      opacity: 0.7;
    }
  }
  
  :deep(h1) { 
    font-size: 28px; 
    border-bottom: 2px solid var(--color-border-primary);
    padding-bottom: calc(var(--spacing-unit) * 2);
  }
  :deep(h2) { 
    font-size: 24px; 
    border-bottom: 1px solid var(--color-border-primary);
    padding-bottom: calc(var(--spacing-unit) * 1.5);
  }
  :deep(h3) { font-size: 20px; }
  :deep(h4) { font-size: 18px; }
  :deep(h5) { font-size: 16px; }
  :deep(h6) { font-size: 14px; }
  
  // 段落优化
  :deep(p) {
    margin: calc(var(--spacing-unit) * 6) 0;
    text-align: justify;
    word-break: break-word;
    hyphens: auto;
    
    // 首段特殊样式
    &:first-of-type {
      font-size: 1.1em;
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-bottom: calc(var(--spacing-unit) * 8);
      padding: calc(var(--spacing-unit) * 4);
      border-left: 3px solid var(--color-accent-primary);
      background: linear-gradient(90deg, 
        var(--color-bg-secondary) 0%, 
        transparent 100%);
      border-radius: var(--border-radius-m);
    }
  }
  
  // 链接样式增强
  :deep(a) {
    color: var(--color-accent-secondary);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all var(--transition-speed-fast);
    position: relative;
    font-weight: 500;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--color-accent-secondary), var(--color-accent-primary));
      transition: width var(--transition-speed-normal);
    }
    
    &:hover {
      color: var(--color-accent-primary);
      transform: translateY(-1px);
      
      &::after {
        width: 100%;
      }
    }
  }
  
  // 图片展示优化
  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: var(--border-radius-l);
    margin: calc(var(--spacing-unit) * 10) auto;
    box-shadow: var(--shadow-l);
    display: block;
    transition: transform var(--transition-speed-normal), box-shadow var(--transition-speed-normal);
    
    &:hover {
      transform: scale(1.02);
      box-shadow: var(--shadow-xl);
    }
  }
  
  // 引用块样式增强
  :deep(blockquote) {
    border-left: 4px solid var(--color-accent-primary);
    background: linear-gradient(135deg, 
      var(--color-bg-secondary) 0%, 
      var(--color-bg-tertiary) 100%);
    padding: calc(var(--spacing-unit) * 6) calc(var(--spacing-unit) * 8);
    margin: calc(var(--spacing-unit) * 8) 0;
    border-radius: 0 var(--border-radius-l) var(--border-radius-l) 0;
    font-style: italic;
    position: relative;
    
    &::before {
      content: '"';
      position: absolute;
      top: -10px;
      left: 10px;
      font-size: 60px;
      color: var(--color-accent-primary);
      opacity: 0.3;
      font-family: Georgia, serif;
    }
    
    p {
      margin: calc(var(--spacing-unit) * 2) 0;
      color: var(--color-text-secondary);
      font-size: 1.05em;
    }
    
    cite {
      display: block;
      text-align: right;
      margin-top: calc(var(--spacing-unit) * 4);
      font-size: 0.9em;
      color: var(--color-text-disabled);
      
      &::before {
        content: '— ';
      }
    }
  }
  
  // 代码样式优化
  :deep(code:not(pre code)) {
    background: linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-secondary));
    padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
    border-radius: var(--border-radius-s);
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
    color: var(--color-accent-secondary);
    border: 1px solid var(--color-border-primary);
    font-weight: 500;
  }
  
  :deep(pre) {
    background: linear-gradient(135deg, #1a1b23, #2d2e3a);
    padding: calc(var(--spacing-unit) * 6);
    border-radius: var(--border-radius-l);
    overflow-x: auto;
    margin: calc(var(--spacing-unit) * 8) 0;
    border: 1px solid var(--color-border-secondary);
    box-shadow: var(--shadow-m);
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary));
      border-radius: var(--border-radius-l) var(--border-radius-l) 0 0;
    }
    
    code {
      background: none;
      padding: 0;
      color: #e1e4e8;
      font-size: 0.9em;
      line-height: 1.6;
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    }
  }
  
  // 列表样式优化
  :deep(ul),
  :deep(ol) {
    margin: calc(var(--spacing-unit) * 6) 0;
    padding-left: calc(var(--spacing-unit) * 8);
    
    li {
      margin: calc(var(--spacing-unit) * 3) 0;
      line-height: 1.7;
      position: relative;
      
      &::marker {
        color: var(--color-accent-primary);
        font-weight: bold;
      }
      
      // 嵌套列表
      ul, ol {
        margin: calc(var(--spacing-unit) * 2) 0;
        padding-left: calc(var(--spacing-unit) * 6);
      }
    }
  }
  
  // 无序列表自定义标记
  :deep(ul > li) {
    list-style: none;
    
    &::before {
      content: '▸';
      color: var(--color-accent-primary);
      font-weight: bold;
      position: absolute;
      left: -20px;
      top: 0;
    }
  }
  
  // 强调样式
  :deep(strong) {
    color: var(--color-accent-primary);
    font-weight: 700;
  }
  
  :deep(em) {
    color: var(--color-accent-secondary);
    font-style: italic;
  }
  
  // 水平分割线
  :deep(hr) {
    border: none;
    height: 3px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      var(--color-accent-primary) 50%, 
      transparent 100%);
    margin: calc(var(--spacing-unit) * 12) 0;
    border-radius: 2px;
  }
}

// 文章操作按钮样式已移除

.related-articles-section {
  margin-top: calc(var(--spacing-unit) * 10);
}

.section-title-reader {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: calc(var(--spacing-unit) * 5);
  padding-bottom: calc(var(--spacing-unit) * 2);
  border-bottom: 1px solid var(--color-border-primary);
}

.related-item-reader {
  display: flex;
  align-items: flex-start;
  gap: calc(var(--spacing-unit) * 4);
  padding: calc(var(--spacing-unit) * 4);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-l);
  margin-bottom: calc(var(--spacing-unit) * 4);
  cursor: pointer;
  transition: all var(--transition-speed-normal);
  box-shadow: var(--shadow-xs);
  
  &:hover {
    border-color: var(--color-border-secondary);
    transform: translateY(-3px) scale(1.01);
    box-shadow: var(--shadow-m);
    background-color: var(--color-bg-hover);
  }
}

.related-image-reader {
  width: 80px;
  height: 60px;
  border-radius: var(--border-radius-m);
  background-color: var(--color-bg-tertiary);
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid var(--color-border-primary);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.related-content-reader {
  flex: 1;
  min-width: 0;
}

.related-title-reader {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: calc(var(--spacing-unit) * 1);
  line-height: 1.3;
}

.related-meta-reader {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.note-popup {
  position: fixed;
  background-color: var(--color-bg-frosted);
  backdrop-filter: blur(var(--backdrop-blur-intensity));
  border: 1px solid var(--frosted-border-color);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 3);
  width: 280px;
  box-shadow: var(--shadow-m);
  z-index: 200;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.note-content {
  margin-bottom: calc(var(--spacing-unit) * 3);
}

.note-actions {
  display: flex;
  gap: calc(var(--spacing-unit) * 2);
  justify-content: flex-end;
}

.note-btn {
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  color: var(--color-text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background-color: var(--color-bg-hover);
  }
  
  &.danger {
    background-color: var(--color-negative);
    border-color: var(--color-negative);
    color: white;
    
    &:hover {
      background-color: #dc2626;
    }
  }
}

// 加载和错误状态样式
.reader-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  
  .loading-spinner {
    font-size: 48px;
    color: var(--color-accent-primary);
    margin-bottom: calc(var(--spacing-unit) * 4);
  }
  
  p {
    color: var(--color-text-secondary);
    font-size: 16px;
    margin: 0;
  }
}

.reader-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  
  .error-icon {
    font-size: 64px;
    color: var(--color-negative);
    margin-bottom: calc(var(--spacing-unit) * 4);
  }
  
  h3 {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 calc(var(--spacing-unit) * 2) 0;
  }
  
  p {
    font-size: 16px;
    color: var(--color-text-secondary);
    margin: 0 0 calc(var(--spacing-unit) * 6) 0;
    max-width: 400px;
  }
  
  .retry-button {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing-unit) * 2);
    padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 6);
    background: var(--color-accent-primary);
    color: white;
    border: none;
    border-radius: var(--border-radius-s);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-speed-fast);
    
    &:hover {
      background: var(--color-accent-primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(123, 97, 255, 0.3);
    }
  }
}

.reader-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  
  .not-found-icon {
    font-size: 64px;
    color: var(--color-text-disabled);
    margin-bottom: calc(var(--spacing-unit) * 4);
  }
  
  h3 {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 calc(var(--spacing-unit) * 2) 0;
  }
  
  p {
    font-size: 16px;
    color: var(--color-text-secondary);
    margin: 0 0 calc(var(--spacing-unit) * 6) 0;
    max-width: 400px;
  }
  
  .back-button {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing-unit) * 2);
    padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 6);
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius-s);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: all var(--transition-speed-fast);
    
    &:hover {
      background: var(--color-bg-hover);
      border-color: var(--color-border-secondary);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .reader-container {
    padding: calc(var(--spacing-unit) * 6) calc(var(--spacing-unit) * 4) calc(var(--spacing-unit) * 8);
  }
  
  .article-title-main {
    font-size: 24px;
  }
  
  .article-meta-reader {
    gap: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  }
  
  .reader-toolbar {
    top: calc(var(--spacing-unit) * 3);
    right: calc(var(--spacing-unit) * 3);
    padding: calc(var(--spacing-unit) * 1.5);
  }
  
  .toolbar-btn {
    width: 34px;
    height: 34px;
  }
  
  // 文章操作按钮响应式样式已移除
  
  .related-item-reader {
    flex-direction: column;
    align-items: stretch;
    
    .related-image-reader {
      width: 100%;
      height: 120px;
    }
  }
}

// Toast通知样式
.toast-notification {
  position: fixed;
  top: calc(var(--spacing-unit) * 6);
  right: calc(var(--spacing-unit) * 6);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 4);
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  z-index: 1001;
  min-width: 300px;
  max-width: 400px;
  
  &.toast-success {
    border-left: 4px solid #10B981;
    
    .toast-content i {
      color: #10B981;
    }
  }
  
  &.toast-error {
    border-left: 4px solid #EF4444;
    
    .toast-content i {
      color: #EF4444;
    }
  }
  
  &.toast-info {
    border-left: 4px solid #3B82F6;
    
    .toast-content i {
      color: #3B82F6;
    }
  }
}

.toast-content {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  flex: 1;
  
  span {
    color: var(--color-text-primary);
    font-size: 14px;
    line-height: 1.4;
  }
}

.toast-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: calc(var(--spacing-unit) * 1);
  border-radius: var(--border-radius-s);
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

// Toast动画
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style> 