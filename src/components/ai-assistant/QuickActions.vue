<template>
  <div class="quick-actions">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-title">
        <i class="fas fa-magic"></i>
        <span>快捷指令</span>
      </div>
      <button 
        class="close-btn"
        @click="handleClose"
        title="关闭 (ESC)"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-input-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索指令..."
          @keydown="handleSearchKeyDown"
        />
        <button 
          v-if="searchQuery"
          class="clear-search-btn"
          @click="clearSearch"
          title="清空搜索"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-tab"
        :class="{ active: activeCategory === category.id }"
        @click="setActiveCategory(category.id)"
      >
        <i :class="category.icon"></i>
        <span>{{ category.name }}</span>
        <span class="action-count">{{ getCategoryActionCount(category.id) }}</span>
      </button>
    </div>

    <!-- 指令列表 -->
    <div class="actions-container" ref="actionsContainerRef">
      <div v-if="filteredActions.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-search"></i>
        </div>
        <div class="empty-text">
          {{ searchQuery ? '未找到匹配的指令' : '暂无可用指令' }}
        </div>
      </div>

      <div v-else class="actions-list">
        <div
          v-for="(action, index) in filteredActions"
          :key="action.id"
          class="action-item"
          :class="{ 
            active: selectedIndex === index,
            disabled: !action.enabled
          }"
          @click="handleActionClick(action)"
          @mouseenter="selectedIndex = index"
        >
          <div class="action-icon">
            <i :class="action.icon"></i>
          </div>
          
          <div class="action-content">
            <div class="action-title">{{ action.title }}</div>
            <div class="action-description">{{ action.description }}</div>
          </div>
          
          <div class="action-meta">
            <span v-if="action.shortcut" class="action-shortcut">
              {{ formatShortcut(action.shortcut) }}
            </span>
            <i v-if="action.category === 'recent'" class="fas fa-clock recent-icon"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- 面板底部 -->
    <div class="panel-footer">
      <div class="footer-tips">
        <div class="tip">
          <kbd>↑</kbd><kbd>↓</kbd> 导航
        </div>
        <div class="tip">
          <kbd>Enter</kbd> 选择
        </div>
        <div class="tip">
          <kbd>ESC</kbd> 关闭
        </div>
      </div>
      
      <button 
        class="custom-action-btn"
        @click="showCustomDialog = true"
        title="自定义指令"
      >
        <i class="fas fa-plus"></i>
        <span>自定义</span>
      </button>
    </div>

    <!-- 自定义指令对话框 -->
    <transition name="modal">
      <div v-if="showCustomDialog" class="modal-overlay" @click="closeCustomDialog">
        <div class="custom-dialog" @click.stop>
          <div class="dialog-header">
            <h3>自定义指令</h3>
            <button @click="closeCustomDialog" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="dialog-content">
            <div class="form-group">
              <label>指令标题</label>
              <input
                v-model="customAction.title"
                type="text"
                placeholder="输入指令标题..."
                maxlength="50"
              />
            </div>
            
            <div class="form-group">
              <label>指令描述</label>
              <input
                v-model="customAction.description"
                type="text"
                placeholder="输入指令描述..."
                maxlength="100"
              />
            </div>
            
            <div class="form-group">
              <label>指令内容</label>
              <textarea
                v-model="customAction.content"
                placeholder="输入指令内容或模板..."
                rows="4"
                maxlength="500"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>图标</label>
              <div class="icon-selector">
                <button
                  v-for="icon in commonIcons"
                  :key="icon"
                  class="icon-option"
                  :class="{ selected: customAction.icon === icon }"
                  @click="customAction.icon = icon"
                >
                  <i :class="icon"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div class="dialog-footer">
            <button @click="closeCustomDialog" class="cancel-btn">
              取消
            </button>
            <button 
              @click="saveCustomAction" 
              class="save-btn"
              :disabled="!canSaveCustomAction"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import type { QuickAction } from '@/types/aiAssistant'

// Props
interface Props {
  actions: QuickAction[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  actionClick: [action: QuickAction]
  close: []
  customAction: [action: Omit<QuickAction, 'id'>]
}>()

// DOM引用
const searchInputRef = ref<HTMLInputElement>()
const actionsContainerRef = ref<HTMLElement>()

// 本地状态
const searchQuery = ref('')
const activeCategory = ref<string>('all')
const selectedIndex = ref(0)
const showCustomDialog = ref(false)

// 自定义指令数据
const customAction = ref({
  title: '',
  description: '',
  content: '',
  icon: 'fas fa-lightbulb'
})

// 常用图标
const commonIcons = [
  'fas fa-lightbulb',
  'fas fa-magic',
  'fas fa-star',
  'fas fa-bookmark',
  'fas fa-tag',
  'fas fa-heart',
  'fas fa-thumbs-up',
  'fas fa-fire',
  'fas fa-bolt',
  'fas fa-gem'
]

// 分类定义
const categories = [
  {
    id: 'all',
    name: '全部',
    icon: 'fas fa-th-large'
  },
  {
    id: 'reading',
    name: '阅读',
    icon: 'fas fa-book-open'
  },
  {
    id: 'learning',
    name: '学习',
    icon: 'fas fa-graduation-cap'
  },
  {
    id: 'tools',
    name: '工具',
    icon: 'fas fa-tools'
  },
  {
    id: 'analysis',
    name: '分析',
    icon: 'fas fa-chart-line'
  },
  {
    id: 'recent',
    name: '最近',
    icon: 'fas fa-clock'
  }
]

// 计算属性
const filteredActions = computed(() => {
  let actions = props.actions

  // 按分类过滤
  if (activeCategory.value !== 'all') {
    actions = actions.filter(action => action.category === activeCategory.value)
  }

  // 按搜索关键词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    actions = actions.filter(action =>
      action.title.toLowerCase().includes(query) ||
      action.description.toLowerCase().includes(query)
    )
  }

  // 只显示启用的指令
  actions = actions.filter(action => action.enabled !== false)

  return actions
})

const getCategoryActionCount = (categoryId: string): number => {
  if (categoryId === 'all') {
    return props.actions.filter(action => action.enabled !== false).length
  }
  return props.actions.filter(action => 
    action.category === categoryId && action.enabled !== false
  ).length
}

const canSaveCustomAction = computed(() => {
  return customAction.value.title.trim() && 
         customAction.value.description.trim() && 
         customAction.value.content.trim()
})

// 方法
const handleActionClick = (action: QuickAction) => {
  if (!action.enabled) return
  emit('actionClick', action)
}

const handleClose = () => {
  emit('close')
}

const setActiveCategory = (categoryId: string) => {
  activeCategory.value = categoryId
  selectedIndex.value = 0
  scrollToSelected()
}

const clearSearch = () => {
  searchQuery.value = ''
  selectedIndex.value = 0
  focusSearchInput()
}

const formatShortcut = (shortcut: string): string => {
  return shortcut
    .replace('Ctrl', 'Ctrl')
    .replace('Cmd', '⌘')
    .replace('Alt', 'Alt')
    .replace('Shift', 'Shift')
}

const handleSearchKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      navigateDown()
      break
    case 'ArrowUp':
      event.preventDefault()
      navigateUp()
      break
    case 'Enter':
      event.preventDefault()
      selectCurrentAction()
      break
    case 'Escape':
      event.preventDefault()
      if (searchQuery.value) {
        clearSearch()
      } else {
        handleClose()
      }
      break
  }
}

const navigateDown = () => {
  if (selectedIndex.value < filteredActions.value.length - 1) {
    selectedIndex.value++
    scrollToSelected()
  }
}

const navigateUp = () => {
  if (selectedIndex.value > 0) {
    selectedIndex.value--
    scrollToSelected()
  }
}

const selectCurrentAction = () => {
  const action = filteredActions.value[selectedIndex.value]
  if (action) {
    handleActionClick(action)
  }
}

const scrollToSelected = () => {
  nextTick(() => {
    if (!actionsContainerRef.value) return
    
    const container = actionsContainerRef.value
    const selectedElement = container.querySelector('.action-item.active')
    
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  })
}

const focusSearchInput = () => {
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

// 自定义指令相关方法
const closeCustomDialog = () => {
  showCustomDialog.value = false
  resetCustomAction()
}

const resetCustomAction = () => {
  customAction.value = {
    title: '',
    description: '',
    content: '',
    icon: 'fas fa-lightbulb'
  }
}

const saveCustomAction = () => {
  if (!canSaveCustomAction.value) return
  
  const newAction: Omit<QuickAction, 'id'> = {
    title: customAction.value.title.trim(),
    description: customAction.value.description.trim(),
    icon: customAction.value.icon,
    category: 'tools',
    enabled: true
  }
  
  emit('customAction', newAction)
  closeCustomDialog()
}

// 键盘事件处理
const handleGlobalKeyDown = (event: KeyboardEvent) => {
  // 如果对话框打开，不处理全局快捷键
  if (showCustomDialog.value) return
  
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      handleClose()
      break
    case 'ArrowDown':
      if (!searchInputRef.value?.matches(':focus')) {
        event.preventDefault()
        navigateDown()
      }
      break
    case 'ArrowUp':
      if (!searchInputRef.value?.matches(':focus')) {
        event.preventDefault()
        navigateUp()
      }
      break
    case 'Enter':
      if (!searchInputRef.value?.matches(':focus')) {
        event.preventDefault()
        selectCurrentAction()
      }
      break
  }
  
  // 数字键快速选择分类
  const num = parseInt(event.key)
  if (num >= 1 && num <= categories.length) {
    event.preventDefault()
    setActiveCategory(categories[num - 1].id)
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeyDown)
  focusSearchInput()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeyDown)
})

// 监听搜索变化
watch(searchQuery, () => {
  selectedIndex.value = 0
  scrollToSelected()
})

// 监听分类变化
watch(activeCategory, () => {
  selectedIndex.value = 0
  scrollToSelected()
})

// 监听过滤结果变化
watch(filteredActions, () => {
  if (selectedIndex.value >= filteredActions.value.length) {
    selectedIndex.value = Math.max(0, filteredActions.value.length - 1)
  }
  scrollToSelected()
})
</script>

<style scoped lang="scss">
.quick-actions {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 12px;
  width: 480px;
  max-width: 90vw;
  max-height: 600px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(20px);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-primary);
  background: rgba(var(--color-bg-tertiary-rgb), 0.5);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  
  i {
    color: var(--color-primary);
  }
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

/* 搜索栏 */
.search-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-primary);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-tertiary);
  font-size: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 40px 0 36px;
  border: 2px solid var(--color-border-primary);
  border-radius: 10px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  transition: all var(--transition-speed-fast);
  
  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
  }
  
  &::placeholder {
    color: var(--color-text-tertiary);
  }
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-danger);
    color: white;
  }
}

/* 分类标签 */
.category-tabs {
  display: flex;
  overflow-x: auto;
  padding: 12px 20px;
  gap: 8px;
  border-bottom: 1px solid var(--color-border-primary);
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
  
  &.active {
    background: var(--color-primary);
    color: white;
  }
  
  i {
    font-size: 10px;
  }
}

.action-count {
  background: rgba(255, 255, 255, 0.2);
  color: inherit;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  
  .category-tab:not(.active) & {
    background: var(--color-bg-tertiary);
    color: var(--color-text-tertiary);
  }
}

/* 指令列表 */
.actions-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-border-secondary);
    border-radius: 3px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  
  i {
    font-size: 20px;
    color: var(--color-text-tertiary);
  }
}

.empty-text {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.actions-list {
  padding: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
  }
  
  &.active {
    background: var(--color-primary);
    color: white;
    
    .action-description {
      color: rgba(255, 255, 255, 0.8);
    }
    
    .action-shortcut {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
    
    .recent-icon {
      color: rgba(255, 255, 255, 0.8);
    }
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background: transparent;
    }
  }
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 16px;
  flex-shrink: 0;
  
  .action-item.active & {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
}

.action-content {
  flex: 1;
  min-width: 0;
}

.action-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
  
  .action-item.active & {
    color: white;
  }
}

.action-description {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-shortcut {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.recent-icon {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

/* 面板底部 */
.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid var(--color-border-primary);
  background: rgba(var(--color-bg-tertiary-rgb), 0.3);
}

.footer-tips {
  display: flex;
  gap: 12px;
}

.tip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

kbd {
  display: inline-block;
  padding: 2px 4px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: 3px;
  font-size: 9px;
  font-family: inherit;
  color: var(--color-text-secondary);
}

.custom-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 12px;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
}

/* 自定义指令对话框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.custom-dialog {
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  background: var(--color-bg-secondary);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--color-border-primary);
  
  h3 {
    margin: 0;
    font-size: 18px;
    color: var(--color-text-primary);
  }
}

.dialog-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
  }
  
  input,
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid var(--color-border-primary);
    border-radius: 8px;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: 14px;
    outline: none;
    transition: all var(--transition-speed-fast);
    
    &:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
    }
    
    &::placeholder {
      color: var(--color-text-tertiary);
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 80px;
  }
}

.icon-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
}

.icon-option {
  width: 40px;
  height: 40px;
  border: 2px solid var(--color-border-primary);
  border-radius: 8px;
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
  
  &.selected {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: white;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--color-border-primary);
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
}

.cancel-btn {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

.save-btn {
  background: var(--color-primary);
  color: white;
  
  &:hover {
    background: var(--color-primary-dark);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background: var(--color-primary);
    }
  }
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all var(--transition-speed-normal);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .custom-dialog,
.modal-leave-to .custom-dialog {
  transform: scale(0.9) translateY(-20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quick-actions {
    width: 100vw;
    max-width: none;
    max-height: 80vh;
    left: 0;
    transform: none;
    margin: 0;
    border-radius: 16px 16px 0 0;
  }
  
  .panel-header,
  .search-section,
  .panel-footer {
    padding: 12px 16px;
  }
  
  .category-tabs {
    padding: 8px 16px;
  }
  
  .actions-list {
    padding: 8px 16px;
  }
  
  .custom-dialog {
    width: 100vw;
    max-width: none;
    height: 100vh;
    max-height: none;
    border-radius: 0;
  }
  
  .footer-tips {
    display: none;
  }
}
</style> 