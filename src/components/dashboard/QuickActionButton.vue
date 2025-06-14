<template>
  <div 
    class="quick-action"
    :class="{ 'quick-action--loading': isLoading }"
    @click="handleClick"
  >
    <div class="quick-action-icon">
      <i :class="action.icon"></i>
    </div>
    <span class="quick-action-title">{{ action.title }}</span>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { QuickAction } from '@/stores/dashboard'

interface Props {
  action: QuickAction
  isLoading?: boolean
}

interface Emits {
  (e: 'click', action: QuickAction): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()
const router = useRouter()

// 处理点击事件
function handleClick() {
  if (props.isLoading) return
  
  emit('click', props.action)
  
  // 路由跳转
  if (props.action.route) {
    router.push(props.action.route)
  }
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: spacing(6) spacing(4);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  position: relative;
  overflow: hidden;
  min-height: 120px;
  
  // 毛玻璃效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  // 悬浮效果
  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 8px 25px rgba(0, 0, 0, 0.1),
      0 4px 10px rgba(0, 0, 0, 0.05);
    border-color: var(--color-accent-primary);
    
    .quick-action-icon {
      transform: scale(1.1);
      color: var(--color-accent-primary);
    }
    
    .quick-action-title {
      color: var(--color-accent-primary);
    }
  }
  
  // 点击效果
  &:active {
    transform: translateY(0);
    box-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.1),
      0 2px 5px rgba(0, 0, 0, 0.05);
  }
  
  // 加载状态
  &--loading {
    pointer-events: none;
    opacity: 0.6;
    
    .quick-action-icon {
      animation: pulse 1.5s infinite;
    }
  }
}

.quick-action-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-m);
  margin-bottom: spacing(3);
  transition: all var(--transition-speed-fast);
  
  i {
    font-size: 24px;
    color: var(--color-text-primary);
    transition: color var(--transition-speed-fast);
  }
}

.quick-action-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  text-align: center;
  line-height: 1.4;
  transition: color var(--transition-speed-fast);
}

// 响应式设计
@include tablet {
  .quick-action {
    padding: spacing(4) spacing(3);
    min-height: 100px;
  }
  
  .quick-action-icon {
    width: 40px;
    height: 40px;
    margin-bottom: spacing(2);
    
    i {
      font-size: 20px;
    }
  }
  
  .quick-action-title {
    font-size: 13px;
  }
}

@include mobile {
  .quick-action {
    padding: spacing(3) spacing(2);
    min-height: 80px;
  }
  
  .quick-action-icon {
    width: 36px;
    height: 36px;
    margin-bottom: spacing(2);
    
    i {
      font-size: 18px;
    }
  }
  
  .quick-action-title {
    font-size: 12px;
  }
}

// 动画效果
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 特殊主题色彩
.quick-action {
  // 添加RSS源
  &[data-action="add-feed"] {
    &:hover {
      border-color: #ff6b35;
      
      .quick-action-icon {
        color: #ff6b35;
      }
      
      .quick-action-title {
        color: #ff6b35;
      }
    }
  }
  
  // 创建笔记
  &[data-action="create-note"] {
    &:hover {
      border-color: #4ecdc4;
      
      .quick-action-icon {
        color: #4ecdc4;
      }
      
      .quick-action-title {
        color: #4ecdc4;
      }
    }
  }
  
  // 知识图谱
  &[data-action="knowledge-graph"] {
    &:hover {
      border-color: #45b7d1;
      
      .quick-action-icon {
        color: #45b7d1;
      }
      
      .quick-action-title {
        color: #45b7d1;
      }
    }
  }
  
  // 收藏管理
  &[data-action="manage-collections"] {
    &:hover {
      border-color: #f7b731;
      
      .quick-action-icon {
        color: #f7b731;
      }
      
      .quick-action-title {
        color: #f7b731;
      }
    }
  }
}
</style> 