<template>
  <div class="bulk-action-bar" :class="{ 'visible': isVisible }">
    <div class="bulk-info">
      <div class="selection-count">
        <i class="fas fa-check-square"></i>
        <span>已选择 {{ selectedCount }} 个RSS源</span>
      </div>
      
      <div class="bulk-actions">
        <!-- 全选/取消全选 -->
        <button
          type="button"
          class="action-btn"
          @click="handleSelectAll"
          :title="isAllSelected ? '取消全选' : '全选'"
        >
          <i :class="isAllSelected ? 'fas fa-square' : 'fas fa-check-square'"></i>
          {{ isAllSelected ? '取消全选' : '全选' }}
        </button>
        
        <!-- 反选 -->
        <button
          type="button"
          class="action-btn"
          @click="handleInvertSelection"
          title="反选"
        >
          <i class="fas fa-exchange-alt"></i>
          反选
        </button>
        
        <div class="action-divider"></div>
        
        <!-- 批量删除 -->
        <button
          type="button"
          class="action-btn danger"
          @click="handleBatchDelete"
          :disabled="selectedCount === 0"
          title="删除选中的RSS源"
        >
          <i class="fas fa-trash-alt"></i>
          删除选中
        </button>
        
        <!-- 批量分类更改 -->
        <div class="dropdown" ref="categoryDropdown">
          <button
            type="button"
            class="action-btn dropdown-toggle"
            @click="toggleCategoryDropdown"
            :disabled="selectedCount === 0"
            title="更改分类"
          >
            <i class="fas fa-folder"></i>
            更改分类
            <i class="fas fa-chevron-down"></i>
          </button>
          
          <div class="dropdown-menu" v-show="showCategoryDropdown">
            <button
              v-for="category in categories"
              :key="category.value"
              type="button"
              class="dropdown-item"
              @click="handleBatchCategoryChange(category.value)"
            >
              <i :class="category.icon" :style="{ color: category.color }"></i>
              {{ category.label }}
            </button>
          </div>
        </div>
        
        <!-- 批量状态切换 -->
        <div class="dropdown" ref="statusDropdown">
          <button
            type="button"
            class="action-btn dropdown-toggle"
            @click="toggleStatusDropdown"
            :disabled="selectedCount === 0"
            title="更改状态"
          >
            <i class="fas fa-power-off"></i>
            更改状态
            <i class="fas fa-chevron-down"></i>
          </button>
          
          <div class="dropdown-menu" v-show="showStatusDropdown">
            <button
              type="button"
              class="dropdown-item"
              @click="handleBatchStatusChange(true)"
            >
              <i class="fas fa-play text-success"></i>
              启用
            </button>
            <button
              type="button"
              class="dropdown-item"
              @click="handleBatchStatusChange(false)"
            >
              <i class="fas fa-pause text-warning"></i>
              禁用
            </button>
          </div>
        </div>
        
        <!-- 批量优先级调整 -->
        <div class="dropdown" ref="priorityDropdown">
          <button
            type="button"
            class="action-btn dropdown-toggle"
            @click="togglePriorityDropdown"
            :disabled="selectedCount === 0"
            title="调整优先级"
          >
            <i class="fas fa-star"></i>
            调整优先级
            <i class="fas fa-chevron-down"></i>
          </button>
          
          <div class="dropdown-menu" v-show="showPriorityDropdown">
            <button
              v-for="priority in priorities"
              :key="priority.value"
              type="button"
              class="dropdown-item"
              @click="handleBatchPriorityChange(priority.value)"
            >
              <i :class="priority.icon" :style="{ color: priority.color }"></i>
              {{ priority.label }}
            </button>
          </div>
        </div>
        
        <div class="action-divider"></div>
        
        <!-- 批量导出 -->
        <button
          type="button"
          class="action-btn"
          @click="handleBatchExport"
          :disabled="selectedCount === 0"
          title="导出选中的RSS源"
        >
          <i class="fas fa-download"></i>
          导出选中
        </button>
      </div>
    </div>
    
    <!-- 关闭批量模式 -->
    <button
      type="button"
      class="close-bulk-mode"
      @click="handleCloseBulkMode"
      title="退出批量模式"
    >
      <i class="fas fa-times"></i>
    </button>
    
    <!-- 操作进度 -->
    <div v-if="isOperating" class="operation-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
      <span class="progress-text">{{ operationText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { FeedCategory, FeedPriority } from '../../api/rss.d'

// Props 定义
interface Props {
  selectedCount: number
  isAllSelected: boolean
  isOperating?: boolean
  operationProgress?: number
  operationText?: string
}

const props = withDefaults(defineProps<Props>(), {
  isOperating: false,
  operationProgress: 0,
  operationText: ''
})

// Emits 定义
interface Emits {
  (e: 'selectAll'): void
  (e: 'invertSelection'): void
  (e: 'batchDelete'): void
  (e: 'batchCategoryChange', category: FeedCategory): void
  (e: 'batchStatusChange', enabled: boolean): void
  (e: 'batchPriorityChange', priority: FeedPriority): void
  (e: 'batchExport'): void
  (e: 'closeBulkMode'): void
}

const emit = defineEmits<Emits>()

// 响应式状态
const showCategoryDropdown = ref(false)
const showStatusDropdown = ref(false)
const showPriorityDropdown = ref(false)

const categoryDropdown = ref<HTMLElement>()
const statusDropdown = ref<HTMLElement>()
const priorityDropdown = ref<HTMLElement>()

// 分类选项
const categories = ref([
  { value: 'tech' as FeedCategory, label: '技术博客', icon: 'fas fa-code', color: '#3B82F6' },
  { value: 'news' as FeedCategory, label: '新闻资讯', icon: 'fas fa-newspaper', color: '#EF4444' },
  { value: 'design' as FeedCategory, label: '设计灵感', icon: 'fas fa-palette', color: '#8B5CF6' },
  { value: 'business' as FeedCategory, label: '商业财经', icon: 'fas fa-chart-line', color: '#10B981' },
  { value: 'lifestyle' as FeedCategory, label: '生活方式', icon: 'fas fa-heart', color: '#F59E0B' },
  { value: 'entertainment' as FeedCategory, label: '娱乐资讯', icon: 'fas fa-film', color: '#EC4899' },
  { value: 'science' as FeedCategory, label: '科学研究', icon: 'fas fa-flask', color: '#06B6D4' },
  { value: 'other' as FeedCategory, label: '其他', icon: 'fas fa-folder', color: '#6B7280' }
])

// 优先级选项
const priorities = ref([
  { value: 'high' as FeedPriority, label: '高优先级', icon: 'fas fa-arrow-up', color: '#EF4444' },
  { value: 'medium' as FeedPriority, label: '普通', icon: 'fas fa-minus', color: '#6B7280' },
  { value: 'low' as FeedPriority, label: '低优先级', icon: 'fas fa-arrow-down', color: '#10B981' }
])

// 计算属性
const isVisible = computed(() => props.selectedCount > 0)

const progressPercentage = computed(() => {
  return Math.round(props.operationProgress)
})

// 方法
const handleSelectAll = () => {
  emit('selectAll')
}

const handleInvertSelection = () => {
  emit('invertSelection')
}

const handleBatchDelete = () => {
  emit('batchDelete')
}

const handleBatchCategoryChange = (category: FeedCategory) => {
  emit('batchCategoryChange', category)
  showCategoryDropdown.value = false
}

const handleBatchStatusChange = (enabled: boolean) => {
  emit('batchStatusChange', enabled)
  showStatusDropdown.value = false
}

const handleBatchPriorityChange = (priority: FeedPriority) => {
  emit('batchPriorityChange', priority)
  showPriorityDropdown.value = false
}

const handleBatchExport = () => {
  emit('batchExport')
}

const handleCloseBulkMode = () => {
  emit('closeBulkMode')
}

// 下拉菜单控制
const toggleCategoryDropdown = () => {
  showCategoryDropdown.value = !showCategoryDropdown.value
  showStatusDropdown.value = false
  showPriorityDropdown.value = false
}

const toggleStatusDropdown = () => {
  showStatusDropdown.value = !showStatusDropdown.value
  showCategoryDropdown.value = false
  showPriorityDropdown.value = false
}

const togglePriorityDropdown = () => {
  showPriorityDropdown.value = !showPriorityDropdown.value
  showCategoryDropdown.value = false
  showStatusDropdown.value = false
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  if (categoryDropdown.value && !categoryDropdown.value.contains(event.target as Node)) {
    showCategoryDropdown.value = false
  }
  if (statusDropdown.value && !statusDropdown.value.contains(event.target as Node)) {
    showStatusDropdown.value = false
  }
  if (priorityDropdown.value && !priorityDropdown.value.contains(event.target as Node)) {
    showPriorityDropdown.value = false
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
.bulk-action-bar {
  position: fixed;
  bottom: calc(var(--spacing-unit) * 6);
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-l);
  box-shadow: var(--shadow-2xl);
  padding: calc(var(--spacing-unit) * 4);
  max-width: 90vw;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-duration) cubic-bezier(0.34, 1.56, 0.64, 1);

  [data-theme="dark"] & {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }

  &.visible {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 6);
  flex-wrap: wrap;
}

.selection-count {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);

  i {
    color: var(--primary-color);
  }
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1);
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-duration);
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: var(--bg-tertiary);
    border-color: var(--border-color-hover);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.danger {
    color: var(--error-color);
    
    &:hover:not(:disabled) {
      background: var(--error-bg);
      border-color: var(--error-border);
    }
  }

  &.dropdown-toggle {
    .fas.fa-chevron-down {
      margin-left: calc(var(--spacing-unit) * 1);
      font-size: 0.6rem;
      opacity: 0.7;
    }
  }
}

.action-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 calc(var(--spacing-unit) * 1);
}

// 下拉菜单
.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: calc(var(--spacing-unit) * 2);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  box-shadow: var(--shadow-xl);
  min-width: 150px;
  z-index: 10;
  animation: slideInUp 0.2s ease-out;

  [data-theme="dark"] & {
    background: var(--bg-secondary);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  width: 100%;
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--transition-duration);

  &:hover {
    background: var(--bg-tertiary);
  }

  &:first-child {
    border-radius: var(--border-radius-m) var(--border-radius-m) 0 0;
  }

  &:last-child {
    border-radius: 0 0 var(--border-radius-m) var(--border-radius-m);
  }

  i {
    font-size: 0.875rem;
  }

  .text-success {
    color: var(--success-color);
  }

  .text-warning {
    color: var(--warning-color);
  }
}

.close-bulk-mode {
  position: absolute;
  top: calc(var(--spacing-unit) * 2);
  right: calc(var(--spacing-unit) * 2);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: calc(var(--spacing-unit) * 1);
  border-radius: var(--border-radius-s);
  transition: all var(--transition-duration);

  &:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }
}

// 操作进度
.operation-progress {
  position: absolute;
  bottom: calc(var(--spacing-unit) * -2);
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 4);
  background: var(--bg-secondary);
  border-radius: 0 0 var(--border-radius-l) var(--border-radius-l);
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 2px;
  transition: width var(--transition-duration);
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

// 动画
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .bulk-action-bar {
    bottom: calc(var(--spacing-unit) * 4);
    left: calc(var(--spacing-unit) * 2);
    right: calc(var(--spacing-unit) * 2);
    transform: translateY(100px);
    max-width: none;

    &.visible {
      transform: translateY(0);
    }
  }

  .bulk-info {
    flex-direction: column;
    align-items: stretch;
    gap: calc(var(--spacing-unit) * 3);
  }

  .bulk-actions {
    justify-content: center;
  }

  .action-btn {
    flex: 1;
    justify-content: center;
    min-width: 0;
  }

  .action-divider {
    display: none;
  }

  .dropdown-menu {
    left: 50%;
    transform: translateX(-50%);
  }
}

@media (max-width: 480px) {
  .bulk-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-btn {
    width: 100%;
  }
}
</style> 