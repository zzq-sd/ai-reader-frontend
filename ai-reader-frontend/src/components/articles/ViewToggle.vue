<template>
  <div class="view-toggle">
    <div class="toggle-group">
      <button 
        class="toggle-btn"
        :class="{ 'toggle-btn--active': currentView === 'list' }"
        @click="handleViewChange('list')"
        title="列表视图"
      >
        <i class="fas fa-list"></i>
        <span class="btn-text">列表</span>
      </button>
      <button 
        class="toggle-btn"
        :class="{ 'toggle-btn--active': currentView === 'grid' }"
        @click="handleViewChange('grid')"
        title="网格视图"
      >
        <i class="fas fa-th-large"></i>
        <span class="btn-text">网格</span>
      </button>
      <button 
        class="toggle-btn"
        :class="{ 'toggle-btn--active': currentView === 'compact' }"
        @click="handleViewChange('compact')"
        title="紧凑视图"
      >
        <i class="fas fa-bars"></i>
        <span class="btn-text">紧凑</span>
      </button>
    </div>
    
    <!-- 视图选项 -->
    <div class="view-options" v-if="showOptions">
      <div class="option-group">
        <label class="option-label">
          <input 
            type="checkbox" 
            v-model="showImages"
            @change="handleOptionChange('showImages', ($event.target as HTMLInputElement).checked)"
          />
          <span class="checkbox-custom"></span>
          显示图片
        </label>
        <label class="option-label">
          <input 
            type="checkbox" 
            v-model="showExcerpt"
            @change="handleOptionChange('showExcerpt', ($event.target as HTMLInputElement).checked)"
          />
          <span class="checkbox-custom"></span>
          显示摘要
        </label>
        <label class="option-label">
          <input 
            type="checkbox" 
            v-model="showMeta"
            @change="handleOptionChange('showMeta', ($event.target as HTMLInputElement).checked)"
          />
          <span class="checkbox-custom"></span>
          显示元数据
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

type ViewMode = 'list' | 'grid' | 'compact'

interface Props {
  currentView: ViewMode
  showImages?: boolean
  showExcerpt?: boolean
  showMeta?: boolean
}

interface Emits {
  (e: 'view-change', view: ViewMode): void
  (e: 'option-change', option: string, value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  showImages: true,
  showExcerpt: true,
  showMeta: true
})

const emit = defineEmits<Emits>()

// 本地状态
const showOptions = ref(false)
const showImages = ref(props.showImages)
const showExcerpt = ref(props.showExcerpt)
const showMeta = ref(props.showMeta)

// 处理视图切换
function handleViewChange(view: ViewMode) {
  if (view !== props.currentView) {
    emit('view-change', view)
  }
}

// 处理选项变化
function handleOptionChange(option: string, value: boolean) {
  emit('option-change', option, value)
}

// 监听props变化，同步本地状态
watch(() => props.showImages, (newVal) => {
  showImages.value = newVal
})

watch(() => props.showExcerpt, (newVal) => {
  showExcerpt.value = newVal
})

watch(() => props.showMeta, (newVal) => {
  showMeta.value = newVal
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.view-toggle {
  display: flex;
  align-items: center;
  gap: spacing(3);
  position: relative;
}

.toggle-group {
  display: flex;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  padding: spacing(1);
  
  // 毛玻璃效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: spacing(2);
  padding: spacing(2) spacing(3);
  border: none;
  border-radius: var(--border-radius-xs);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  position: relative;
  overflow: hidden;
  
  &:hover:not(.toggle-btn--active) {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
    transform: translateY(-1px);
  }
  
  &--active {
    background-color: var(--color-accent-primary);
    color: white;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(123, 97, 255, 0.3);
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.2) 0%, 
        transparent 50%
      );
      pointer-events: none;
    }
  }
  
  i {
    font-size: 12px;
  }
  
  .btn-text {
    font-weight: inherit;
  }
}

.view-options {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: spacing(2);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  padding: spacing(4);
  min-width: 180px;
  z-index: 10;
  
  // 毛玻璃效果
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 4px 16px rgba(0, 0, 0, 0.1);
  
  // 进入动画
  animation: optionsPanelSlideIn 0.2s ease-out both;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: spacing(3);
}

.option-label {
  display: flex;
  align-items: center;
  gap: spacing(2);
  color: var(--color-text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: color var(--transition-speed-fast);
  
  &:hover {
    color: var(--color-accent-primary);
  }
  
  input[type="checkbox"] {
    display: none;
  }
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border-primary);
  border-radius: var(--border-radius-xs);
  background-color: var(--color-bg-tertiary);
  position: relative;
  transition: all var(--transition-speed-fast);
  flex-shrink: 0;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 10px;
    border: 2px solid white;
    border-top: none;
    border-left: none;
    transform: translate(-50%, -60%) rotate(45deg) scale(0);
    transition: transform var(--transition-speed-fast);
  }
  
  input:checked + & {
    background-color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    
    &::after {
      transform: translate(-50%, -60%) rotate(45deg) scale(1);
    }
  }
  
  input:hover + & {
    border-color: var(--color-accent-primary);
    background-color: var(--color-bg-hover);
  }
}

// 响应式设计
@include tablet {
  .view-toggle {
    gap: spacing(2);
  }
  
  .toggle-btn {
    padding: spacing(2);
    
    .btn-text {
      display: none;
    }
  }
  
  .view-options {
    min-width: 160px;
    padding: spacing(3);
  }
  
  .option-label {
    font-size: 13px;
  }
}

@include mobile {
  .view-toggle {
    gap: spacing(2);
  }
  
  .toggle-group {
    padding: spacing(0.5);
  }
  
  .toggle-btn {
    padding: spacing(1.5) spacing(2);
    font-size: 12px;
    
    .btn-text {
      display: none;
    }
    
    i {
      font-size: 11px;
    }
  }
  
  .view-options {
    right: -spacing(2);
    min-width: 140px;
    padding: spacing(3);
  }
  
  .option-label {
    font-size: 12px;
    gap: spacing(1.5);
  }
  
  .checkbox-custom {
    width: 14px;
    height: 14px;
    
    &::after {
      width: 5px;
      height: 8px;
    }
  }
}

// 动画定义
@keyframes optionsPanelSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 按钮点击效果
.toggle-btn {
  &:active {
    transform: scale(0.98);
  }
}

// 视图切换动画
.toggle-btn--active {
  animation: viewToggleActivate 0.3s ease-out both;
}

@keyframes viewToggleActivate {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

// 选项面板箭头指示器
.view-options::before {
  content: '';
  position: absolute;
  top: -6px;
  right: spacing(4);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid var(--color-border-primary);
}

.view-options::after {
  content: '';
  position: absolute;
  top: -5px;
  right: spacing(4);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid var(--color-bg-secondary);
}

// 复选框动画
.checkbox-custom {
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background-color: var(--color-accent-primary);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: all var(--transition-speed-fast);
  }
  
  input:checked + &::before {
    width: 100%;
    height: 100%;
    border-radius: var(--border-radius-xs);
  }
}
</style> 