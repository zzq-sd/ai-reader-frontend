<template>
  <div class="reader-toolbar" :class="toolbarClasses">
    <!-- 左侧工具组 -->
    <div class="toolbar-group toolbar-group--left">
      <!-- 返回按钮 -->
      <button 
        class="toolbar-button toolbar-button--back"
        @click="$emit('close-reader')"
        title="返回文章列表"
      >
        <i class="fas fa-arrow-left"></i>
      </button>
      
      <!-- 文章信息 -->
      <div class="article-info" v-if="article">
        <h3 class="article-title">{{ article.title }}</h3>
        <div class="article-meta">
          <span class="author">{{ article.author }}</span>
          <span class="separator">·</span>
          <span class="read-time">{{ article.readTime }}分钟阅读</span>
          <span class="separator">·</span>
          <span class="progress">{{ readingProgress }}%</span>
        </div>
      </div>
    </div>
    
    <!-- 右侧工具组 -->
    <div class="toolbar-group toolbar-group--right">
      <!-- 阅读偏好设置 -->
      <div class="preferences-dropdown" ref="preferencesRef">
        <button 
          class="toolbar-button"
          @click="togglePreferences"
          :class="{ 'active': showPreferences }"
          title="阅读设置"
        >
          <i class="fas fa-font"></i>
        </button>
        
        <!-- 偏好设置面板 -->
        <div v-if="showPreferences" class="preferences-panel">
          <!-- 字体大小 -->
          <div class="preference-group">
            <label class="preference-label">字体大小</label>
            <div class="preference-options">
              <button 
                v-for="size in fontSizes"
                :key="size.value"
                class="preference-option"
                :class="{ 'active': readingPreferences.fontSize === size.value }"
                @click="updatePreference('fontSize', size.value)"
              >
                {{ size.label }}
              </button>
            </div>
          </div>
          
          <!-- 字体族 -->
          <div class="preference-group">
            <label class="preference-label">字体</label>
            <div class="preference-options">
              <button 
                v-for="font in fontFamilies"
                :key="font.value"
                class="preference-option"
                :class="{ 'active': readingPreferences.fontFamily === font.value }"
                @click="updatePreference('fontFamily', font.value)"
              >
                {{ font.label }}
              </button>
            </div>
          </div>
          
          <!-- 行高 -->
          <div class="preference-group">
            <label class="preference-label">行高</label>
            <div class="preference-options">
              <button 
                v-for="height in lineHeights"
                :key="height.value"
                class="preference-option"
                :class="{ 'active': readingPreferences.lineHeight === height.value }"
                @click="updatePreference('lineHeight', height.value)"
              >
                {{ height.label }}
              </button>
            </div>
          </div>
          
          <!-- 内容宽度 -->
          <div class="preference-group">
            <label class="preference-label">页面宽度</label>
            <div class="preference-options">
              <button 
                v-for="width in contentWidths"
                :key="width.value"
                class="preference-option"
                :class="{ 'active': readingPreferences.contentWidth === width.value }"
                @click="updatePreference('contentWidth', width.value)"
              >
                {{ width.label }}
              </button>
            </div>
          </div>
          
          <!-- 主题 -->
          <div class="preference-group">
            <label class="preference-label">主题</label>
            <div class="preference-options">
              <button 
                v-for="theme in themes"
                :key="theme.value"
                class="preference-option"
                :class="{ 'active': readingPreferences.theme === theme.value }"
                @click="updatePreference('theme', theme.value)"
              >
                <span class="theme-preview" :class="`theme-preview--${theme.value}`"></span>
                {{ theme.label }}
              </button>
            </div>
          </div>
          
          <!-- 自动保存 -->
          <div class="preference-group">
            <label class="preference-toggle">
              <input 
                type="checkbox" 
                :checked="readingPreferences.autoSave"
                @change="updatePreference('autoSave', $event.target.checked)"
              >
              <span class="toggle-slider"></span>
              自动保存阅读进度
            </label>
          </div>
        </div>
      </div>
      
      <!-- 收藏按钮 -->
      <button 
        class="toolbar-button"
        @click="$emit('toggle-favorite')"
        :class="{ 'active': article?.isFavorited }"
        title="收藏文章"
      >
        <i class="fas fa-heart"></i>
      </button>
      
      <!-- 分享按钮 -->
      <button 
        class="toolbar-button"
        @click="$emit('share-article')"
        title="分享文章"
      >
        <i class="fas fa-share"></i>
      </button>
      
      <!-- 全屏按钮 -->
      <button 
        class="toolbar-button"
        @click="$emit('toggle-fullscreen')"
        title="全屏阅读"
      >
        <i class="fas fa-expand"></i>
      </button>
      
      <!-- 更多操作 -->
      <div class="more-dropdown" ref="moreRef">
        <button 
          class="toolbar-button"
          @click="toggleMore"
          :class="{ 'active': showMore }"
          title="更多操作"
        >
          <i class="fas fa-ellipsis-v"></i>
        </button>
        
        <!-- 更多操作面板 -->
        <div v-if="showMore" class="more-panel">
          <button class="more-option" @click="handlePrint">
            <i class="fas fa-print"></i>
            打印文章
          </button>
          <button class="more-option" @click="handleDownload">
            <i class="fas fa-download"></i>
            下载PDF
          </button>
          <button class="more-option" @click="handleCopyLink">
            <i class="fas fa-link"></i>
            复制链接
          </button>
          <button class="more-option" @click="handleReport">
            <i class="fas fa-flag"></i>
            举报内容
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ArticleContent, ReadingPreferences } from '@/api/reader'

// Props
interface Props {
  article: ArticleContent | null
  readingProgress: number
  readingPreferences: ReadingPreferences
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update-preferences': [preferences: Partial<ReadingPreferences>]
  'toggle-favorite': []
  'share-article': []
  'toggle-fullscreen': []
  'close-reader': []
}>()

// 响应式数据
const showPreferences = ref(false)
const showMore = ref(false)
const preferencesRef = ref<HTMLElement>()
const moreRef = ref<HTMLElement>()

// 工具栏样式类
const toolbarClasses = computed(() => ({
  'toolbar--preferences-open': showPreferences.value,
  'toolbar--more-open': showMore.value
}))

// 偏好设置选项
const fontSizes = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
  { label: '特大', value: 'extra-large' }
]

const fontFamilies = [
  { label: '无衬线', value: 'sans-serif' },
  { label: '衬线', value: 'serif' },
  { label: '等宽', value: 'monospace' }
]

const lineHeights = [
  { label: '紧凑', value: 'compact' },
  { label: '标准', value: 'normal' },
  { label: '宽松', value: 'relaxed' }
]

const contentWidths = [
  { label: '窄', value: 'narrow' },
  { label: '中', value: 'medium' },
  { label: '宽', value: 'wide' },
  { label: '全宽', value: 'full' }
]

const themes = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '护眼', value: 'sepia' }
]

// 事件处理
function togglePreferences() {
  showPreferences.value = !showPreferences.value
  showMore.value = false
}

function toggleMore() {
  showMore.value = !showMore.value
  showPreferences.value = false
}

function updatePreference(key: keyof ReadingPreferences, value: any) {
  emit('update-preferences', { [key]: value })
}

function handlePrint() {
  window.print()
  showMore.value = false
}

function handleDownload() {
  // TODO: 实现PDF下载功能
  console.log('Download PDF')
  showMore.value = false
}

function handleCopyLink() {
  navigator.clipboard.writeText(window.location.href)
  showMore.value = false
  // TODO: 显示复制成功提示
}

function handleReport() {
  // TODO: 实现举报功能
  console.log('Report content')
  showMore.value = false
}

// 点击外部关闭下拉菜单
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  
  if (preferencesRef.value && !preferencesRef.value.contains(target)) {
    showPreferences.value = false
  }
  
  if (moreRef.value && !moreRef.value.contains(target)) {
    showMore.value = false
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.reader-toolbar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  min-width: 800px;
  max-width: 90vw;
  height: 60px;
  padding: 0 spacing(4);
  
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05);
  
  transition: all var(--transition-speed-normal);
  
  // 深色主题
  @media (prefers-color-scheme: dark) {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  &:hover {
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.15),
      0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: spacing(2);
  
  &--left {
    flex: 1;
    min-width: 0;
  }
  
  &--right {
    flex-shrink: 0;
  }
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  
  width: 40px;
  height: 40px;
  
  background: transparent;
  border: none;
  border-radius: 20px;
  
  color: var(--color-text-secondary);
  font-size: 16px;
  cursor: pointer;
  
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: rgba(123, 97, 255, 0.1);
    color: var(--color-accent-primary);
    transform: scale(1.05);
  }
  
  &.active {
    background: var(--color-accent-primary);
    color: white;
    
    &:hover {
      background: var(--color-accent-secondary);
    }
  }
  
  &--back {
    margin-right: spacing(2);
  }
}

.article-info {
  flex: 1;
  min-width: 0;
  margin-right: spacing(4);
  
  .article-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 4px 0;
    
    @include text-ellipsis;
  }
  
  .article-meta {
    display: flex;
    align-items: center;
    gap: spacing(1);
    
    font-size: 12px;
    color: var(--color-text-secondary);
    
    .separator {
      opacity: 0.5;
    }
    
    .progress {
      font-weight: 500;
      color: var(--color-accent-primary);
    }
  }
}

// 偏好设置面板
.preferences-dropdown {
  position: relative;
}

.preferences-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  
  width: 320px;
  padding: spacing(4);
  
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-m);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1);
  
  animation: panelSlideIn 0.2s ease-out;
  
  @media (prefers-color-scheme: dark) {
    background: rgba(30, 30, 30, 0.98);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.preference-group {
  margin-bottom: spacing(4);
  
  &:last-child {
    margin-bottom: 0;
  }
}

.preference-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: spacing(2);
}

.preference-options {
  display: flex;
  gap: spacing(1);
  flex-wrap: wrap;
}

.preference-option {
  display: flex;
  align-items: center;
  gap: spacing(1);
  
  padding: spacing(1) spacing(2);
  
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
  
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-border-secondary);
  }
  
  &.active {
    background: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: white;
  }
}

.theme-preview {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  
  &--light {
    background: #ffffff;
  }
  
  &--dark {
    background: #1a1a1a;
  }
  
  &--sepia {
    background: #f7f3e9;
  }
}

.preference-toggle {
  display: flex;
  align-items: center;
  gap: spacing(2);
  
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
  
  input[type="checkbox"] {
    display: none;
  }
  
  .toggle-slider {
    position: relative;
    width: 40px;
    height: 20px;
    
    background: var(--color-bg-secondary);
    border-radius: 10px;
    
    transition: background-color var(--transition-speed-fast);
    
    &::before {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      
      width: 16px;
      height: 16px;
      
      background: white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      
      transition: transform var(--transition-speed-fast);
    }
  }
  
  input:checked + .toggle-slider {
    background: var(--color-accent-primary);
    
    &::before {
      transform: translateX(20px);
    }
  }
}

// 更多操作面板
.more-dropdown {
  position: relative;
}

.more-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  
  min-width: 160px;
  padding: spacing(2);
  
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-m);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1);
  
  animation: panelSlideIn 0.2s ease-out;
  
  @media (prefers-color-scheme: dark) {
    background: rgba(30, 30, 30, 0.98);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.more-option {
  display: flex;
  align-items: center;
  gap: spacing(2);
  
  width: 100%;
  padding: spacing(2) spacing(3);
  
  background: transparent;
  border: none;
  border-radius: var(--border-radius-s);
  
  font-size: 14px;
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
  
  transition: background-color var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
  }
  
  i {
    width: 16px;
    color: var(--color-text-secondary);
  }
}

// 动画
@keyframes panelSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@include tablet {
  .reader-toolbar {
    min-width: 600px;
    height: 56px;
    padding: 0 spacing(3);
  }
  
  .toolbar-button {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
  
  .article-info {
    .article-title {
      font-size: 14px;
    }
    
    .article-meta {
      font-size: 11px;
    }
  }
  
  .preferences-panel {
    width: 280px;
  }
}

@include mobile {
  .reader-toolbar {
    min-width: 320px;
    height: 52px;
    padding: 0 spacing(2);
    top: 16px;
  }
  
  .toolbar-button {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
  
  .article-info {
    margin-right: spacing(2);
    
    .article-title {
      font-size: 13px;
    }
    
    .article-meta {
      font-size: 10px;
    }
  }
  
  .preferences-panel {
    width: 260px;
    padding: spacing(3);
  }
  
  .more-panel {
    min-width: 140px;
  }
}
</style> 