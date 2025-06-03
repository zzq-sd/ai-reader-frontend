<template>
  <div class="pagination" v-if="totalPages > 0">
    <!-- 分页信息 -->
    <div class="pagination-info">
      <span>
        显示第 {{ startItem }}-{{ endItem }} 项，共 {{ total }} 项
      </span>
    </div>
    
    <!-- 分页大小选择器 (移到上方，更明显) -->
    <div class="pagination-size" style="margin-bottom: 15px; display: block; width: 100%; text-align: center;">
      <label for="page-size" style="margin-right: 10px; font-weight: bold;">每页显示：</label>
      <select 
        id="page-size"
        class="page-size-select"
        :value="pageSize"
        @change="handlePageSizeChange"
        style="min-width: 100px; padding: 8px;"
      >
        <option :value="10" :selected="pageSize === 10">10 条</option>
        <option :value="20" :selected="pageSize === 20">20 条</option>
        <option :value="50" :selected="pageSize === 50">50 条</option>
        <option :value="100" :selected="pageSize === 100">100 条</option>
      </select>
    </div>
    
    <!-- 分页控件 -->
    <div class="pagination-controls" v-if="totalPages > 1">
      <!-- 上一页按钮 -->
      <button 
        class="pagination-btn pagination-btn--prev"
        :disabled="currentPage <= 1"
        @click="handlePrevPage"
        title="上一页"
      >
        <i class="fas fa-chevron-left"></i>
        <span class="btn-text">上一页</span>
      </button>
      
      <!-- 页码列表 -->
      <div class="pagination-pages">
        <!-- 第一页 -->
        <button 
          v-if="showFirstPage"
          class="pagination-btn pagination-btn--page"
          :class="{ 'pagination-btn--active': currentPage === 1 }"
          @click="handlePageChange(1)"
        >
          1
        </button>
        
        <!-- 前省略号 -->
        <span v-if="showStartEllipsis" class="pagination-ellipsis">...</span>
        
        <!-- 中间页码 -->
        <button 
          v-for="page in visiblePages"
          :key="page"
          class="pagination-btn pagination-btn--page"
          :class="{ 'pagination-btn--active': currentPage === page }"
          @click="handlePageChange(page)"
        >
          {{ page }}
        </button>
        
        <!-- 后省略号 -->
        <span v-if="showEndEllipsis" class="pagination-ellipsis">...</span>
        
        <!-- 最后一页 -->
        <button 
          v-if="showLastPage"
          class="pagination-btn pagination-btn--page"
          :class="{ 'pagination-btn--active': currentPage === totalPages }"
          @click="handlePageChange(totalPages)"
        >
          {{ totalPages }}
        </button>
      </div>
      
      <!-- 下一页按钮 -->
      <button 
        class="pagination-btn pagination-btn--next"
        :disabled="currentPage >= totalPages"
        @click="handleNextPage"
        title="下一页"
      >
        <span class="btn-text">下一页</span>
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
    
    <!-- 快速跳转 -->
    <div class="pagination-jump" v-if="totalPages > 1">
      <label for="page-jump">跳转到：</label>
      <input 
        id="page-jump"
        type="number"
        class="page-jump-input"
        :min="1"
        :max="totalPages"
        v-model.number="jumpPage"
        @keyup.enter="handleJumpToPage"
        @blur="handleJumpToPage"
        placeholder="页码"
      />
      <button 
        class="pagination-btn pagination-btn--jump"
        @click="handleJumpToPage"
        :disabled="!isValidJumpPage"
      >
        跳转
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  currentPage: number
  pageSize: number
  total: number
  maxVisiblePages?: number
}

interface Emits {
  (e: 'page-change', page: number): void
  (e: 'page-size-change', pageSize: number): void
}

const props = withDefaults(defineProps<Props>(), {
  maxVisiblePages: 7
})

const emit = defineEmits<Emits>()

// 跳转页码
const jumpPage = ref<number | null>(null)

// 计算属性
const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const startItem = computed(() => {
  if (props.total === 0) return 0
  return (props.currentPage - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  const end = props.currentPage * props.pageSize
  return end > props.total ? props.total : end
})

// 可见页码计算
const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = props.maxVisiblePages
  const current = props.currentPage
  const total = totalPages.value
  
  if (total <= maxVisible) {
    // 总页数小于等于最大可见页数，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 计算显示范围
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, current - half)
    let end = Math.min(total, current + half)
    
    // 调整范围以确保显示足够的页码
    if (end - start + 1 < maxVisible) {
      if (start === 1) {
        end = Math.min(total, start + maxVisible - 1)
      } else {
        start = Math.max(1, end - maxVisible + 1)
      }
    }
    
    // 排除第一页和最后一页（它们单独处理）
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) {
        pages.push(i)
      }
    }
  }
  
  return pages
})

const showFirstPage = computed(() => {
  return totalPages.value > 1 && !visiblePages.value.includes(1)
})

const showLastPage = computed(() => {
  return totalPages.value > 1 && !visiblePages.value.includes(totalPages.value)
})

const showStartEllipsis = computed(() => {
  return showFirstPage.value && visiblePages.value.length > 0 && visiblePages.value[0] > 2
})

const showEndEllipsis = computed(() => {
  return showLastPage.value && 
         visiblePages.value.length > 0 && 
         visiblePages.value[visiblePages.value.length - 1] < totalPages.value - 1
})

const isValidJumpPage = computed(() => {
  return jumpPage.value !== null && 
         jumpPage.value >= 1 && 
         jumpPage.value <= totalPages.value &&
         jumpPage.value !== props.currentPage
})

// 事件处理
function handlePageChange(page: number) {
  if (page !== props.currentPage && page >= 1 && page <= totalPages.value) {
    emit('page-change', page)
  }
}

function handlePrevPage() {
  if (props.currentPage > 1) {
    handlePageChange(props.currentPage - 1)
  }
}

function handleNextPage() {
  if (props.currentPage < totalPages.value) {
    handlePageChange(props.currentPage + 1)
  }
}

function handlePageSizeChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const newPageSize = parseInt(target.value)
  emit('page-size-change', newPageSize)
}

function handleJumpToPage() {
  if (isValidJumpPage.value && jumpPage.value !== null) {
    handlePageChange(jumpPage.value)
    jumpPage.value = null
  }
}

// 监听当前页变化，清空跳转输入
watch(() => props.currentPage, () => {
  jumpPage.value = null
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: spacing(4);
  padding: spacing(6) 0;
  border-top: 1px solid var(--color-border-primary);
  margin-top: spacing(6);
  flex-wrap: wrap;
}

.pagination-info {
  color: var(--color-text-secondary);
  font-size: 14px;
  white-space: nowrap;
  flex: 1;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: spacing(2);
  flex: 2;
  justify-content: center;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: spacing(1);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 spacing(3);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  user-select: none;
  
  // 毛玻璃效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &:hover:not(:disabled) {
    border-color: var(--color-border-secondary);
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-disabled);
  }
  
  &--active {
    background-color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: white;
    font-weight: 600;
    
    &:hover {
      background-color: var(--color-accent-secondary);
      border-color: var(--color-accent-secondary);
      transform: none;
    }
  }
  
  &--prev,
  &--next {
    gap: spacing(2);
    padding: 0 spacing(4);
    
    .btn-text {
      font-weight: 500;
    }
  }
  
  &--jump {
    padding: 0 spacing(3);
    font-size: 13px;
  }
  
  i {
    font-size: 12px;
  }
}

.pagination-ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--color-text-disabled);
  font-size: 14px;
  user-select: none;
}

.pagination-size, .pagination-jump {
  display: flex;
  align-items: center;
  gap: spacing(2);
  color: var(--color-text-secondary);
  font-size: 14px;
  white-space: nowrap;
  flex: 1;
  
  label {
    font-weight: 500;
  }
}

.pagination-size {
  justify-content: flex-end;
}

.pagination-jump {
  justify-content: flex-end;
}

.page-size-select {
  padding: spacing(2) spacing(3);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  // 毛玻璃效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &:hover {
    border-color: var(--color-border-secondary);
    background-color: var(--color-bg-hover);
  }
  
  &:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.2);
  }
}

.page-jump-input {
  width: 60px;
  padding: spacing(2) spacing(3);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 14px;
  text-align: center;
  transition: all var(--transition-speed-fast);
  
  // 毛玻璃效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &:hover {
    border-color: var(--color-border-secondary);
    background-color: var(--color-bg-hover);
  }
  
  &:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.2);
  }
  
  &::placeholder {
    color: var(--color-text-disabled);
  }
  
  // 隐藏数字输入框的箭头
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &[type=number] {
    -moz-appearance: textfield;
  }
}

// 响应式设计
@include tablet {
  .pagination {
    gap: spacing(3);
    padding: spacing(4) 0;
    margin-top: spacing(4);
  }
  
  .pagination-controls {
    gap: spacing(1);
  }
  
  .pagination-btn {
    min-width: 32px;
    height: 32px;
    font-size: 13px;
    
    &--prev,
    &--next {
      padding: 0 spacing(3);
      
      .btn-text {
        display: none;
      }
    }
  }
  
  .pagination-ellipsis {
    width: 32px;
    height: 32px;
    font-size: 13px;
  }
  
  .pagination-size,
  .pagination-jump {
    font-size: 13px;
  }
  
  .page-size-select,
  .page-jump-input {
    font-size: 13px;
    padding: spacing(1) spacing(2);
  }
  
  .page-jump-input {
    width: 50px;
  }
}

@include mobile {
  .pagination {
    flex-direction: column;
    align-items: stretch;
    gap: spacing(4);
    padding: spacing(4) 0;
  }
  
  .pagination-info {
    text-align: center;
    order: 1;
  }
  
  .pagination-controls {
    justify-content: center;
    order: 2;
    flex-wrap: wrap;
    margin-bottom: spacing(4);
  }
  
  .pagination-size {
    justify-content: center;
    order: 3;
    width: 100%;
    display: flex;
    margin-bottom: spacing(3);
  }
  
  .pagination-jump {
    justify-content: center;
    order: 4;
    width: 100%;
    display: flex;
  }
  
  .pagination-btn {
    min-width: 28px;
    height: 28px;
    font-size: 12px;
    
    &--prev,
    &--next {
      padding: 0 spacing(2);
    }
  }
  
  .pagination-ellipsis {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .pagination-size,
  .pagination-jump {
    font-size: 12px;
  }
  
  .page-size-select,
  .page-jump-input {
    font-size: 12px;
    padding: spacing(1) spacing(2);
  }
  
  .page-jump-input {
    width: 45px;
  }
}

// 分页动画
.pagination-btn {
  animation: paginationFadeIn 0.3s ease-out both;
}

@keyframes paginationFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 页码切换动画
.pagination-btn--page {
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(255, 255, 255, 0.2), 
      transparent
    );
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
}

// 活跃页码特殊效果
.pagination-btn--active {
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background-color: rgba(255, 255, 255, 0.8);
    transform: translateX(-50%);
    animation: activePageIndicator 0.3s ease-out forwards;
  }
}

@keyframes activePageIndicator {
  to {
    width: 80%;
  }
}
</style> 