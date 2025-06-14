<template>
  <div class="draggable-list" ref="listContainer">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="draggable-item"
      :class="{
        'dragging': dragState.isDragging && dragState.draggedId === item.id,
        'drag-over': dragState.dropTargetId === item.id,
        'drag-placeholder': dragState.isDragging && dragState.draggedId !== item.id
      }"
      :data-id="item.id"
      :data-index="index"
      draggable="true"
      @dragstart="handleDragStart($event, item, index)"
      @dragend="handleDragEnd"
      @dragover="handleDragOver($event, item, index)"
      @dragenter="handleDragEnter($event, item, index)"
      @dragleave="handleDragLeave"
      @drop="handleDrop($event, item, index)"
    >
      <!-- 拖拽手柄 -->
      <div class="drag-handle" @mousedown="handleMouseDown">
        <i class="fas fa-grip-vertical"></i>
      </div>

      <!-- 内容插槽 -->
      <div class="item-content">
        <slot :item="item" :index="index" :isDragging="dragState.isDragging && dragState.draggedId === item.id">
          <!-- 默认内容 -->
          <div class="default-item">
            <div class="item-title">{{ item.title || item.name || item.id }}</div>
            <div class="item-subtitle" v-if="item.subtitle || item.description">
              {{ item.subtitle || item.description }}
            </div>
          </div>
        </slot>
      </div>

      <!-- 拖拽指示器 -->
      <div v-if="dragState.isDragging" class="drop-indicator">
        <div class="drop-line top" v-if="dragState.dropPosition === 'before'"></div>
        <div class="drop-line bottom" v-if="dragState.dropPosition === 'after'"></div>
      </div>
    </div>

    <!-- 拖拽预览 -->
    <div
      v-if="dragState.isDragging"
      class="drag-preview"
      :style="dragPreviewStyle"
      ref="dragPreview"
    >
      <div class="preview-content">
        <i class="fas fa-grip-vertical"></i>
        <span>{{ getDraggedItemTitle() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'

// 拖拽状态接口
interface DragState {
  isDragging: boolean
  draggedId: string | null
  draggedIndex: number | null
  dropTargetId: string | null
  dropTargetIndex: number | null
  dropPosition: 'before' | 'after' | null
  startX: number
  startY: number
  currentX: number
  currentY: number
}

// 可拖拽项目接口
interface DraggableItem {
  id: string
  title?: string
  name?: string
  subtitle?: string
  description?: string
  [key: string]: any
}

// Props 定义
interface Props {
  items: DraggableItem[]
  disabled?: boolean
  animation?: boolean
  ghostClass?: string
  chosenClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  animation: true,
  ghostClass: 'drag-ghost',
  chosenClass: 'drag-chosen'
})

// Emits 定义
interface Emits {
  (e: 'update:items', items: DraggableItem[]): void
  (e: 'change', event: { oldIndex: number, newIndex: number, item: DraggableItem }): void
  (e: 'start', event: { oldIndex: number, item: DraggableItem }): void
  (e: 'end', event: { oldIndex: number, newIndex: number, item: DraggableItem }): void
}

const emit = defineEmits<Emits>()

// 响应式状态
const listContainer = ref<HTMLElement>()
const dragPreview = ref<HTMLElement>()

const dragState = reactive<DragState>({
  isDragging: false,
  draggedId: null,
  draggedIndex: null,
  dropTargetId: null,
  dropTargetIndex: null,
  dropPosition: null,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0
})

// 计算属性
const dragPreviewStyle = computed(() => {
  if (!dragState.isDragging) return { display: 'none' }
  
  return {
    position: 'fixed' as const,
    left: `${dragState.currentX + 10}px`,
    top: `${dragState.currentY + 10}px`,
    zIndex: 1000,
    pointerEvents: 'none' as const
  }
})

// 方法
const handleMouseDown = (event: MouseEvent) => {
  if (props.disabled) return
  
  // 记录鼠标按下位置
  dragState.startX = event.clientX
  dragState.startY = event.clientY
}

const handleDragStart = (event: DragEvent, item: DraggableItem, index: number) => {
  if (props.disabled) return

  dragState.isDragging = true
  dragState.draggedId = item.id
  dragState.draggedIndex = index
  dragState.startX = event.clientX
  dragState.startY = event.clientY
  dragState.currentX = event.clientX
  dragState.currentY = event.clientY

  // 设置拖拽数据
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.id)
    
    // 创建自定义拖拽图像
    const dragImage = createDragImage(item)
    event.dataTransfer.setDragImage(dragImage, 0, 0)
  }

  // 添加拖拽样式
  const draggedElement = event.target as HTMLElement
  draggedElement.classList.add(props.chosenClass)

  emit('start', { oldIndex: index, item })

  // 监听鼠标移动以更新预览位置
  document.addEventListener('dragover', updateDragPreview)
}

const handleDragEnd = (event: DragEvent) => {
  if (!dragState.isDragging) return

  const draggedElement = event.target as HTMLElement
  draggedElement.classList.remove(props.chosenClass)

  // 如果有有效的放置目标，执行重排序
  if (dragState.dropTargetIndex !== null && dragState.draggedIndex !== null) {
    const newItems = [...props.items]
    const draggedItem = newItems[dragState.draggedIndex]
    
    // 移除原位置的项目
    newItems.splice(dragState.draggedIndex, 1)
    
    // 计算新的插入位置
    let insertIndex = dragState.dropTargetIndex
    if (dragState.dropPosition === 'after') {
      insertIndex += 1
    }
    if (dragState.draggedIndex < dragState.dropTargetIndex) {
      insertIndex -= 1
    }
    
    // 插入到新位置
    newItems.splice(insertIndex, 0, draggedItem)
    
    emit('update:items', newItems)
    emit('change', { 
      oldIndex: dragState.draggedIndex, 
      newIndex: insertIndex, 
      item: draggedItem 
    })
    emit('end', { 
      oldIndex: dragState.draggedIndex, 
      newIndex: insertIndex, 
      item: draggedItem 
    })
  }

  // 重置拖拽状态
  resetDragState()
  
  // 移除事件监听器
  document.removeEventListener('dragover', updateDragPreview)
}

const handleDragOver = (event: DragEvent, item: DraggableItem, index: number) => {
  if (props.disabled || !dragState.isDragging) return
  
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
  
  // 计算放置位置
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const midY = rect.top + rect.height / 2
  const dropPosition = event.clientY < midY ? 'before' : 'after'
  
  dragState.dropTargetId = item.id
  dragState.dropTargetIndex = index
  dragState.dropPosition = dropPosition
}

const handleDragEnter = (event: DragEvent, item: DraggableItem, index: number) => {
  if (props.disabled || !dragState.isDragging) return
  
  event.preventDefault()
  
  const draggedElement = event.currentTarget as HTMLElement
  draggedElement.classList.add('drag-over')
}

const handleDragLeave = (event: DragEvent) => {
  if (props.disabled || !dragState.isDragging) return
  
  const draggedElement = event.currentTarget as HTMLElement
  draggedElement.classList.remove('drag-over')
}

const handleDrop = (event: DragEvent, item: DraggableItem, index: number) => {
  if (props.disabled || !dragState.isDragging) return
  
  event.preventDefault()
  
  const draggedElement = event.currentTarget as HTMLElement
  draggedElement.classList.remove('drag-over')
}

const updateDragPreview = (event: DragEvent) => {
  dragState.currentX = event.clientX
  dragState.currentY = event.clientY
}

const createDragImage = (item: DraggableItem): HTMLElement => {
  const dragImage = document.createElement('div')
  dragImage.className = 'drag-image'
  dragImage.style.cssText = `
    position: absolute;
    top: -1000px;
    left: -1000px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-m);
    padding: 12px;
    box-shadow: var(--shadow-lg);
    font-size: 14px;
    color: var(--text-primary);
    white-space: nowrap;
    z-index: 1000;
  `
  dragImage.innerHTML = `
    <i class="fas fa-grip-vertical" style="margin-right: 8px; opacity: 0.6;"></i>
    ${item.title || item.name || item.id}
  `
  
  document.body.appendChild(dragImage)
  
  // 清理函数
  setTimeout(() => {
    document.body.removeChild(dragImage)
  }, 0)
  
  return dragImage
}

const getDraggedItemTitle = (): string => {
  if (!dragState.draggedId) return ''
  
  const draggedItem = props.items.find(item => item.id === dragState.draggedId)
  return draggedItem?.title || draggedItem?.name || draggedItem?.id || ''
}

const resetDragState = () => {
  dragState.isDragging = false
  dragState.draggedId = null
  dragState.draggedIndex = null
  dragState.dropTargetId = null
  dragState.dropTargetIndex = null
  dragState.dropPosition = null
  dragState.startX = 0
  dragState.startY = 0
  dragState.currentX = 0
  dragState.currentY = 0
}

// 键盘支持
const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return
  
  const focusedElement = document.activeElement as HTMLElement
  if (!focusedElement || !listContainer.value?.contains(focusedElement)) return
  
  const currentItem = focusedElement.closest('.draggable-item') as HTMLElement
  if (!currentItem) return
  
  const currentIndex = parseInt(currentItem.dataset.index || '0')
  
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+Up: 向上移动项目
        moveItem(currentIndex, currentIndex - 1)
      } else {
        // 普通Up: 聚焦上一个项目
        focusItem(currentIndex - 1)
      }
      break
      
    case 'ArrowDown':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+Down: 向下移动项目
        moveItem(currentIndex, currentIndex + 1)
      } else {
        // 普通Down: 聚焦下一个项目
        focusItem(currentIndex + 1)
      }
      break
      
    case 'Home':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+Home: 移动到顶部
        moveItem(currentIndex, 0)
      } else {
        // 普通Home: 聚焦第一个项目
        focusItem(0)
      }
      break
      
    case 'End':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+End: 移动到底部
        moveItem(currentIndex, props.items.length - 1)
      } else {
        // 普通End: 聚焦最后一个项目
        focusItem(props.items.length - 1)
      }
      break
  }
}

const moveItem = (fromIndex: number, toIndex: number) => {
  if (toIndex < 0 || toIndex >= props.items.length || fromIndex === toIndex) return
  
  const newItems = [...props.items]
  const item = newItems[fromIndex]
  
  newItems.splice(fromIndex, 1)
  newItems.splice(toIndex, 0, item)
  
  emit('update:items', newItems)
  emit('change', { oldIndex: fromIndex, newIndex: toIndex, item })
  
  // 保持焦点在移动后的项目上
  nextTick(() => {
    focusItem(toIndex)
  })
}

const focusItem = (index: number) => {
  if (index < 0 || index >= props.items.length) return
  
  const items = listContainer.value?.querySelectorAll('.draggable-item')
  if (items && items[index]) {
    const itemElement = items[index] as HTMLElement
    itemElement.focus()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('dragover', updateDragPreview)
})
</script>

<style lang="scss" scoped>
.draggable-list {
  position: relative;
}

.draggable-item {
  display: flex;
  align-items: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  margin-bottom: calc(var(--spacing-unit) * 2);
  transition: all var(--transition-duration);
  cursor: grab;
  position: relative;
  
  &:hover {
    border-color: var(--border-color-hover);
    box-shadow: var(--shadow-sm);
  }
  
  &:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  
  &.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
    cursor: grabbing;
    z-index: 100;
  }
  
  &.drag-over {
    border-color: var(--primary-color);
    background: var(--primary-bg);
  }
  
  &.drag-placeholder {
    opacity: 0.3;
  }
  
  &.drag-chosen {
    background: var(--primary-bg);
    border-color: var(--primary-color);
  }
  
  &.drag-ghost {
    opacity: 0.4;
  }
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 100%;
  color: var(--text-secondary);
  cursor: grab;
  transition: color var(--transition-duration);
  
  &:hover {
    color: var(--text-primary);
  }
  
  &:active {
    cursor: grabbing;
  }
  
  i {
    font-size: 1rem;
  }
}

.item-content {
  flex: 1;
  padding: calc(var(--spacing-unit) * 4);
  min-height: 60px;
  display: flex;
  align-items: center;
}

.default-item {
  .item-title {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: calc(var(--spacing-unit) * 1);
  }
  
  .item-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
}

// 拖拽指示器
.drop-indicator {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 10;
}

.drop-line {
  height: 2px;
  background: var(--primary-color);
  border-radius: 1px;
  
  &.top {
    position: absolute;
    top: -1px;
    left: 0;
    right: 0;
  }
  
  &.bottom {
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
  }
}

// 拖拽预览
.drag-preview {
  background: var(--bg-primary);
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-m);
  box-shadow: var(--shadow-xl);
  padding: calc(var(--spacing-unit) * 3);
  backdrop-filter: blur(10px);
  
  [data-theme="dark"] & {
    background: rgba(30, 30, 30, 0.9);
  }
}

.preview-content {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  
  i {
    color: var(--text-secondary);
    opacity: 0.6;
  }
}

// 动画
@media (prefers-reduced-motion: no-preference) {
  .draggable-item {
    transition: all 0.2s ease;
  }
  
  .draggable-item:not(.dragging) {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .drag-handle {
    width: 32px;
  }
  
  .item-content {
    padding: calc(var(--spacing-unit) * 3);
  }
  
  .draggable-item {
    margin-bottom: calc(var(--spacing-unit) * 1);
  }
}

// 触摸设备优化
@media (hover: none) and (pointer: coarse) {
  .drag-handle {
    width: 48px;
  }
  
  .draggable-item {
    &:hover {
      border-color: var(--border-color);
      box-shadow: none;
    }
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .draggable-item {
    border-width: 2px;
    
    &.drag-over {
      border-width: 3px;
    }
  }
  
  .drop-line {
    height: 3px;
  }
}

// 减少动画模式
@media (prefers-reduced-motion: reduce) {
  .draggable-item,
  .drag-handle,
  .drop-line {
    transition: none;
  }
  
  .draggable-item.dragging {
    transform: none;
  }
}
</style> 