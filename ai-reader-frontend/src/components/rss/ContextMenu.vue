<template>
  <div
    v-if="isVisible"
    class="context-menu"
    :style="menuStyle"
    @click.stop
    ref="menuRef"
  >
    <div class="menu-item" v-for="item in menuItems" :key="item.id">
      <!-- 普通菜单项 -->
      <button
        v-if="!item.children"
        type="button"
        class="menu-button"
        :class="{
          'danger': item.danger,
          'disabled': item.disabled
        }"
        @click="handleItemClick(item)"
        :disabled="item.disabled"
      >
        <i :class="item.icon" v-if="item.icon"></i>
        <span class="menu-text">{{ item.label }}</span>
        <span v-if="item.shortcut" class="menu-shortcut">{{ item.shortcut }}</span>
      </button>

      <!-- 子菜单 -->
      <div v-else class="submenu-container">
        <button
          type="button"
          class="menu-button submenu-trigger"
          :class="{ 'disabled': item.disabled }"
          @mouseenter="showSubmenu(item.id)"
          @mouseleave="hideSubmenu"
          :disabled="item.disabled"
        >
          <i :class="item.icon" v-if="item.icon"></i>
          <span class="menu-text">{{ item.label }}</span>
          <i class="fas fa-chevron-right submenu-arrow"></i>
        </button>

        <!-- 子菜单内容 -->
        <div
          v-if="activeSubmenu === item.id"
          class="submenu"
          :style="submenuStyle"
          @mouseenter="keepSubmenuOpen"
          @mouseleave="hideSubmenu"
        >
          <button
            v-for="child in item.children"
            :key="child.id"
            type="button"
            class="menu-button"
            :class="{
              'danger': child.danger,
              'disabled': child.disabled
            }"
            @click="handleItemClick(child)"
            :disabled="child.disabled"
          >
            <i :class="child.icon" v-if="child.icon"></i>
            <span class="menu-text">{{ child.label }}</span>
            <span v-if="child.shortcut" class="menu-shortcut">{{ child.shortcut }}</span>
          </button>
        </div>
      </div>

      <!-- 分隔线 -->
      <div v-if="item.divider" class="menu-divider"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { ContextMenuItem, FeedCategory, FeedPriority } from '../../api/rss.d'

// Props 定义
interface Props {
  isVisible: boolean
  x: number
  y: number
  targetFeedId?: string
  feedData?: {
    id: string
    title: string
    url: string
    category: FeedCategory
    priority: FeedPriority
    enabled: boolean
    isSelected?: boolean
  }
}

const props = withDefaults(defineProps<Props>(), {
  x: 0,
  y: 0
})

// Emits 定义
interface Emits {
  (e: 'close'): void
  (e: 'action', action: string, feedId?: string, data?: any): void
}

const emit = defineEmits<Emits>()

// 响应式状态
const menuRef = ref<HTMLElement>()
const activeSubmenu = ref<string | null>(null)
const submenuTimer = ref<number | null>(null)

// 菜单项配置
const menuItems = computed<ContextMenuItem[]>(() => {
  if (!props.feedData) return []

  const { enabled, isSelected, category, priority } = props.feedData

  return [
    {
      id: 'open',
      label: '打开RSS源',
      icon: 'fas fa-external-link-alt',
      shortcut: 'Enter',
      action: 'open'
    },
    {
      id: 'refresh',
      label: '刷新',
      icon: 'fas fa-sync-alt',
      shortcut: 'F5',
      action: 'refresh'
    },
    {
      id: 'divider1',
      divider: true
    },
    {
      id: 'edit',
      label: '编辑',
      icon: 'fas fa-edit',
      shortcut: 'Ctrl+E',
      action: 'edit'
    },
    {
      id: 'duplicate',
      label: '复制',
      icon: 'fas fa-copy',
      shortcut: 'Ctrl+D',
      action: 'duplicate'
    },
    {
      id: 'divider2',
      divider: true
    },
    {
      id: 'toggle-status',
      label: enabled ? '禁用' : '启用',
      icon: enabled ? 'fas fa-pause' : 'fas fa-play',
      shortcut: 'Space',
      action: 'toggle-status'
    },
    {
      id: 'category',
      label: '更改分类',
      icon: 'fas fa-folder',
      children: [
        {
          id: 'category-tech',
          label: '技术博客',
          icon: 'fas fa-code',
          action: 'change-category',
          data: 'tech',
          disabled: category === 'tech'
        },
        {
          id: 'category-news',
          label: '新闻资讯',
          icon: 'fas fa-newspaper',
          action: 'change-category',
          data: 'news',
          disabled: category === 'news'
        },
        {
          id: 'category-design',
          label: '设计灵感',
          icon: 'fas fa-palette',
          action: 'change-category',
          data: 'design',
          disabled: category === 'design'
        },
        {
          id: 'category-business',
          label: '商业财经',
          icon: 'fas fa-chart-line',
          action: 'change-category',
          data: 'business',
          disabled: category === 'business'
        },
        {
          id: 'category-lifestyle',
          label: '生活方式',
          icon: 'fas fa-heart',
          action: 'change-category',
          data: 'lifestyle',
          disabled: category === 'lifestyle'
        },
        {
          id: 'category-entertainment',
          label: '娱乐资讯',
          icon: 'fas fa-film',
          action: 'change-category',
          data: 'entertainment',
          disabled: category === 'entertainment'
        },
        {
          id: 'category-science',
          label: '科学研究',
          icon: 'fas fa-flask',
          action: 'change-category',
          data: 'science',
          disabled: category === 'science'
        },
        {
          id: 'category-other',
          label: '其他',
          icon: 'fas fa-folder',
          action: 'change-category',
          data: 'other',
          disabled: category === 'other'
        }
      ]
    },
    {
      id: 'priority',
      label: '调整优先级',
      icon: 'fas fa-star',
      children: [
        {
          id: 'priority-high',
          label: '高优先级',
          icon: 'fas fa-arrow-up',
          action: 'change-priority',
          data: 'high',
          disabled: priority === 'high'
        },
        {
          id: 'priority-medium',
          label: '普通',
          icon: 'fas fa-minus',
          action: 'change-priority',
          data: 'medium',
          disabled: priority === 'medium'
        },
        {
          id: 'priority-low',
          label: '低优先级',
          icon: 'fas fa-arrow-down',
          action: 'change-priority',
          data: 'low',
          disabled: priority === 'low'
        }
      ]
    },
    {
      id: 'divider3',
      divider: true
    },
    {
      id: 'select',
      label: isSelected ? '取消选择' : '选择',
      icon: isSelected ? 'fas fa-square' : 'fas fa-check-square',
      shortcut: 'Ctrl+Click',
      action: 'toggle-select'
    },
    {
      id: 'export',
      label: '导出',
      icon: 'fas fa-download',
      action: 'export'
    },
    {
      id: 'divider4',
      divider: true
    },
    {
      id: 'delete',
      label: '删除',
      icon: 'fas fa-trash-alt',
      shortcut: 'Delete',
      action: 'delete',
      danger: true
    }
  ]
})

// 计算菜单位置
const menuStyle = computed(() => {
  if (!props.isVisible) return {}

  const { x, y } = props
  const menuWidth = 220
  const menuHeight = 400 // 估算高度
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = x
  let top = y

  // 防止菜单超出右边界
  if (x + menuWidth > viewportWidth) {
    left = x - menuWidth
  }

  // 防止菜单超出底部边界
  if (y + menuHeight > viewportHeight) {
    top = y - menuHeight
  }

  // 确保菜单不会超出左边界和顶部边界
  left = Math.max(8, left)
  top = Math.max(8, top)

  return {
    left: `${left}px`,
    top: `${top}px`
  }
})

// 子菜单位置
const submenuStyle = computed(() => {
  return {
    left: '100%',
    top: '0'
  }
})

// 方法
const handleItemClick = (item: ContextMenuItem) => {
  if (item.disabled) return

  emit('action', item.action, props.targetFeedId, item.data)
  emit('close')
}

const showSubmenu = (submenuId: string) => {
  if (submenuTimer.value) {
    clearTimeout(submenuTimer.value)
    submenuTimer.value = null
  }
  activeSubmenu.value = submenuId
}

const hideSubmenu = () => {
  submenuTimer.value = window.setTimeout(() => {
    activeSubmenu.value = null
  }, 100)
}

const keepSubmenuOpen = () => {
  if (submenuTimer.value) {
    clearTimeout(submenuTimer.value)
    submenuTimer.value = null
  }
}

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isVisible) return

  switch (event.key) {
    case 'Escape':
      emit('close')
      break
    case 'ArrowDown':
      event.preventDefault()
      focusNextItem()
      break
    case 'ArrowUp':
      event.preventDefault()
      focusPreviousItem()
      break
    case 'ArrowRight':
      event.preventDefault()
      expandSubmenu()
      break
    case 'ArrowLeft':
      event.preventDefault()
      collapseSubmenu()
      break
    case 'Enter':
      event.preventDefault()
      activateCurrentItem()
      break
  }
}

// 键盘导航方法
const focusNextItem = () => {
  // 实现向下导航逻辑
  const buttons = menuRef.value?.querySelectorAll('.menu-button:not(:disabled)')
  if (buttons && buttons.length > 0) {
    const currentIndex = Array.from(buttons).findIndex(btn => btn === document.activeElement)
    const nextIndex = (currentIndex + 1) % buttons.length
    ;(buttons[nextIndex] as HTMLElement).focus()
  }
}

const focusPreviousItem = () => {
  // 实现向上导航逻辑
  const buttons = menuRef.value?.querySelectorAll('.menu-button:not(:disabled)')
  if (buttons && buttons.length > 0) {
    const currentIndex = Array.from(buttons).findIndex(btn => btn === document.activeElement)
    const prevIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1
    ;(buttons[prevIndex] as HTMLElement).focus()
  }
}

const expandSubmenu = () => {
  // 实现展开子菜单逻辑
  const currentButton = document.activeElement as HTMLElement
  if (currentButton?.classList.contains('submenu-trigger')) {
    const submenuId = currentButton.closest('.menu-item')?.querySelector('.submenu-trigger')?.getAttribute('data-submenu-id')
    if (submenuId) {
      showSubmenu(submenuId)
    }
  }
}

const collapseSubmenu = () => {
  // 实现收起子菜单逻辑
  activeSubmenu.value = null
}

const activateCurrentItem = () => {
  // 实现激活当前项逻辑
  const currentButton = document.activeElement as HTMLElement
  if (currentButton?.classList.contains('menu-button')) {
    currentButton.click()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
  
  // 自动聚焦第一个菜单项
  nextTick(() => {
    if (props.isVisible && menuRef.value) {
      const firstButton = menuRef.value.querySelector('.menu-button:not(:disabled)') as HTMLElement
      firstButton?.focus()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
  
  if (submenuTimer.value) {
    clearTimeout(submenuTimer.value)
  }
})
</script>

<style lang="scss" scoped>
.context-menu {
  position: fixed;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  box-shadow: var(--shadow-xl);
  min-width: 220px;
  max-width: 280px;
  z-index: 1000;
  animation: contextMenuSlideIn 0.15s ease-out;
  backdrop-filter: blur(20px);

  [data-theme="dark"] & {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.menu-item {
  position: relative;
}

.menu-button {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  width: 100%;
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 4);
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-duration);
  border-radius: 0;

  &:first-child {
    border-radius: var(--border-radius-m) var(--border-radius-m) 0 0;
  }

  &:last-child {
    border-radius: 0 0 var(--border-radius-m) var(--border-radius-m);
  }

  &:hover:not(:disabled) {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  &:focus {
    outline: none;
    background: var(--primary-bg);
    color: var(--primary-color);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.danger {
    color: var(--error-color);

    &:hover:not(:disabled) {
      background: var(--error-bg);
      color: var(--error-color);
    }

    &:focus {
      background: var(--error-bg);
      color: var(--error-color);
    }
  }

  i {
    width: 16px;
    text-align: center;
    font-size: 0.875rem;
    opacity: 0.8;
  }
}

.menu-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-shortcut {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

.submenu-container {
  position: relative;
}

.submenu-trigger {
  position: relative;

  .submenu-arrow {
    margin-left: auto;
    font-size: 0.75rem;
    opacity: 0.6;
    transition: transform var(--transition-duration);
  }

  &:hover .submenu-arrow {
    transform: translateX(2px);
  }
}

.submenu {
  position: absolute;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  box-shadow: var(--shadow-xl);
  min-width: 200px;
  z-index: 1001;
  animation: submenuSlideIn 0.15s ease-out;

  [data-theme="dark"] & {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .menu-button {
    &:first-child {
      border-radius: var(--border-radius-m) var(--border-radius-m) 0 0;
    }

    &:last-child {
      border-radius: 0 0 var(--border-radius-m) var(--border-radius-m);
    }
  }
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: calc(var(--spacing-unit) * 2) 0;
}

// 动画
@keyframes contextMenuSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes submenuSlideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .context-menu {
    min-width: 200px;
    max-width: 250px;
  }

  .menu-button {
    padding: calc(var(--spacing-unit) * 4);
    font-size: 1rem;
  }

  .menu-shortcut {
    display: none; // 在移动设备上隐藏快捷键
  }

  .submenu {
    min-width: 180px;
  }
}

// 高对比度模式支持
@media (prefers-contrast: high) {
  .context-menu {
    border-width: 2px;
  }

  .menu-button {
    &:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }
  }
}

// 减少动画模式支持
@media (prefers-reduced-motion: reduce) {
  .context-menu,
  .submenu {
    animation: none;
  }

  .menu-button,
  .submenu-arrow {
    transition: none;
  }
}
</style> 