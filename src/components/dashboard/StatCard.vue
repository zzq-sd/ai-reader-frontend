<template>
  <div 
    class="stat-card"
    :class="[`stat-card--${type}`, { 'stat-card--loading': isLoading }]"
    :style="{ animationDelay: `${animationDelay}ms` }"
  >
    <!-- 图标 -->
    <div class="stat-icon" :class="`stat-icon--${type}`">
      <i :class="icon"></i>
    </div>
    
    <!-- 数值 -->
    <div class="stat-value">
      <template v-if="isLoading">
        <div class="skeleton skeleton--value"></div>
      </template>
      <template v-else>
        {{ formattedValue }}
      </template>
    </div>
    
    <!-- 标签 -->
    <div class="stat-label">
      <template v-if="isLoading">
        <div class="skeleton skeleton--label"></div>
      </template>
      <template v-else>
        {{ label }}
      </template>
    </div>
    
    <!-- 变化趋势 -->
    <div class="stat-change" :class="`stat-change--${trend}`" v-if="!isLoading && change">
      <i :class="trendIcon"></i>
      <span>{{ change }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type: 'articles' | 'notes' | 'feeds' | 'collections'
  icon: string
  value: number
  label: string
  change?: string
  trend?: 'positive' | 'negative' | 'neutral'
  isLoading?: boolean
  animationDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  trend: 'neutral',
  isLoading: false,
  animationDelay: 0
})

// 计算属性
const formattedValue = computed(() => {
  return props.value.toLocaleString()
})

const trendIcon = computed(() => {
  switch (props.trend) {
    case 'positive':
      return 'fas fa-arrow-up'
    case 'negative':
      return 'fas fa-arrow-down'
    default:
      return 'fas fa-minus'
  }
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.stat-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  padding: spacing(6);
  transition: all var(--transition-speed-normal);
  opacity: 0;
  animation: itemFadeInUpAnalytics 0.6s ease-out forwards;
  
  &:hover {
    border-color: var(--color-border-secondary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-m);
  }
  
  &--loading {
    pointer-events: none;
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: spacing(4);
  font-size: 24px;
  
  &--articles {
    background-color: rgba(123, 97, 255, 0.1);
    color: var(--color-accent-primary);
  }
  
  &--notes {
    background-color: rgba(59, 130, 246, 0.1);
    color: var(--color-accent-secondary);
  }
  
  &--feeds {
    background-color: rgba(34, 197, 94, 0.1);
    color: #22C55E;
  }
  
  &--collections {
    background-color: rgba(249, 115, 22, 0.1);
    color: #F97316;
  }
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: spacing(1);
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: spacing(2);
  font-weight: 500;
}

.stat-change {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: spacing(1);
  
  &--positive {
    color: #22C55E;
  }
  
  &--negative {
    color: #EF4444;
  }
  
  &--neutral {
    color: var(--color-text-secondary);
  }
  
  i {
    font-size: 10px;
  }
}

// 卡片交错动画
@keyframes itemFadeInUpAnalytics {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 骨架屏样式
.skeleton {
  background: linear-gradient(90deg, 
    var(--color-bg-tertiary) 25%, 
    var(--color-bg-hover) 50%, 
    var(--color-bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--border-radius-s);
  
  &--value {
    height: 38px;
    width: 80%;
  }
  
  &--label {
    height: 14px;
    width: 60%;
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// 响应式设计
@include mobile {
  .stat-card {
    padding: spacing(5);
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
    margin-bottom: spacing(3);
  }
  
  .stat-value {
    font-size: 28px;
  }
  
  .stat-label {
    font-size: 13px;
  }
}
</style> 