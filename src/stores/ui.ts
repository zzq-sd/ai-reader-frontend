import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ReadingPreferences } from '@/api/reader'

export const useUIStore = defineStore('ui', () => {
  // 阅读偏好设置
  const readingPreferences = ref<ReadingPreferences>({
    fontSize: 'medium',
    fontFamily: 'serif',
    lineHeight: 'normal',
    theme: 'light',
    contentWidth: 'medium',
    autoSave: true
  })
  
  // 阅读器界面状态
  const readerToolbarVisible = ref(true)
  const readingProgress = ref(0)
  const isFullscreen = ref(false)
  const sidebarCollapsed = ref(false)
  
  // 通用UI状态
  const loading = ref(false)
  const theme = ref<'light' | 'dark' | 'auto'>('auto')
  const isMobile = ref(false)
  const showUserPopover = ref(false)
  
  // 计算属性
  const currentTheme = computed(() => {
    if (theme.value === 'auto') {
      // 检测系统主题
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme.value
  })
  
  const fontSizeClass = computed(() => {
    const sizeMap = {
      'small': 'text-sm',
      'medium': 'text-base',
      'large': 'text-lg',
      'extra-large': 'text-xl'
    }
    return sizeMap[readingPreferences.value.fontSize]
  })
  
  const fontFamilyClass = computed(() => {
    const familyMap = {
      'serif': 'font-serif',
      'sans-serif': 'font-sans',
      'monospace': 'font-mono'
    }
    return familyMap[readingPreferences.value.fontFamily]
  })
  
  const lineHeightClass = computed(() => {
    const heightMap = {
      'compact': 'leading-tight',
      'normal': 'leading-normal',
      'relaxed': 'leading-relaxed'
    }
    return heightMap[readingPreferences.value.lineHeight]
  })
  
  const contentWidthClass = computed(() => {
    const widthMap = {
      'narrow': 'max-w-2xl',
      'medium': 'max-w-4xl',
      'wide': 'max-w-6xl'
    }
    return widthMap[readingPreferences.value.contentWidth]
  })
  
  // Actions
  function updateReadingPreferences(preferences: Partial<ReadingPreferences>) {
    readingPreferences.value = { ...readingPreferences.value, ...preferences }
    saveReadingPreferences()
  }
  
  function toggleReaderToolbar() {
    readerToolbarVisible.value = !readerToolbarVisible.value
  }
  
  function updateReadingProgress(progress: number) {
    readingProgress.value = Math.max(0, Math.min(100, progress))
  }
  
  function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value
    
    if (isFullscreen.value) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }
  
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    saveSidebarState()
  }
  
  function setTheme(newTheme: 'light' | 'dark' | 'auto') {
    theme.value = newTheme
    applyTheme()
    saveTheme()
  }
  
  function setLoading(isLoading: boolean) {
    loading.value = isLoading
  }
  
  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed
    saveSidebarState()
  }
  
  function toggleUserPopover() {
    showUserPopover.value = !showUserPopover.value
  }
  
  function setUserPopover(show: boolean) {
    showUserPopover.value = show
  }
  
  function checkMobile() {
    isMobile.value = window.innerWidth < 768
  }
  
  // 本地存储相关
  function saveReadingPreferences() {
    try {
      localStorage.setItem('reading-preferences', JSON.stringify(readingPreferences.value))
    } catch (error) {
      console.warn('Failed to save reading preferences:', error)
    }
  }
  
  function loadReadingPreferences() {
    try {
      const saved = localStorage.getItem('reading-preferences')
      if (saved) {
        const preferences = JSON.parse(saved)
        readingPreferences.value = { ...readingPreferences.value, ...preferences }
      }
    } catch (error) {
      console.warn('Failed to load reading preferences:', error)
    }
  }
  
  function saveTheme() {
    try {
      localStorage.setItem('theme', theme.value)
    } catch (error) {
      console.warn('Failed to save theme:', error)
    }
  }
  
  function loadTheme() {
    try {
      const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'auto'
      if (saved) {
        theme.value = saved
      }
    } catch (error) {
      console.warn('Failed to load theme:', error)
    }
  }
  
  function saveSidebarState() {
    try {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed.value))
    } catch (error) {
      console.warn('Failed to save sidebar state:', error)
    }
  }
  
  function loadSidebarState() {
    try {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved) {
        sidebarCollapsed.value = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load sidebar state:', error)
    }
  }
  
  function applyTheme() {
    const root = document.documentElement
    root.setAttribute('data-theme', currentTheme.value)
    
    // 更新meta标签
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', currentTheme.value === 'dark' ? '#1a1a1a' : '#ffffff')
    }
  }
  
  // 重置所有设置
  function resetAllSettings() {
    readingPreferences.value = {
      fontSize: 'medium',
      fontFamily: 'serif',
      lineHeight: 'normal',
      theme: 'light',
      contentWidth: 'medium',
      autoSave: true
    }
    theme.value = 'auto'
    sidebarCollapsed.value = false
    
    // 清除本地存储
    localStorage.removeItem('reading-preferences')
    localStorage.removeItem('theme')
    localStorage.removeItem('sidebar-collapsed')
    
    applyTheme()
  }
  
  // 初始化
  function initializeUI() {
    loadReadingPreferences()
    loadTheme()
    loadSidebarState()
    applyTheme()
    
    // 检测移动端
    checkMobile()
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile)
  }
  
  return {
    // 状态
    readingPreferences,
    readerToolbarVisible,
    readingProgress,
    isFullscreen,
    sidebarCollapsed,
    loading,
    theme,
    isMobile,
    showUserPopover,
    
    // 计算属性
    currentTheme,
    fontSizeClass,
    fontFamilyClass,
    lineHeightClass,
    contentWidthClass,
    
    // Actions
    updateReadingPreferences,
    toggleReaderToolbar,
    updateReadingProgress,
    toggleFullscreen,
    toggleSidebar,
    setTheme,
    setLoading,
    setSidebarCollapsed,
    toggleUserPopover,
    setUserPopover,
    checkMobile,
    resetAllSettings,
    initializeUI
  }
}) 