<template>
  <i 
    :class="iconClass"
    :style="iconStyle"
    :title="title"
    v-if="isValidIcon"
  ></i>
  <!-- Element Plus图标回退 -->
  <el-icon 
    v-else-if="elementIcon"
    :size="size"
    :style="{ color }"
    :title="title"
  >
    <component :is="elementIcon" />
  </el-icon>
  <!-- 最终回退 -->
  <span 
    v-else
    :style="fallbackStyle"
    :title="title || `图标: ${icon}`"
  >
    {{ fallbackText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon } from 'element-plus'

interface Props {
  icon: string
  size?: string | number
  color?: string
  spin?: boolean
  pulse?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  spin: false,
  pulse: false
})

// 检查是否为有效的FontAwesome图标
const isValidIcon = computed(() => {
  return props.icon && (
    props.icon.includes('fa-') || 
    props.icon.includes('fas ') || 
    props.icon.includes('far ') || 
    props.icon.includes('fab ')
  )
})

// Element Plus图标映射
const elementIconMap: Record<string, string> = {
  'fas fa-home': 'House',
  'fas fa-user': 'User',
  'fas fa-cog': 'Setting',
  'fas fa-search': 'Search',
  'fas fa-bell': 'Bell',
  'fas fa-plus': 'Plus',
  'fas fa-times': 'Close',
  'fas fa-check': 'Check',
  'fas fa-arrow-left': 'ArrowLeft',
  'fas fa-arrow-right': 'ArrowRight',
  'fas fa-bars': 'Menu',
  'fas fa-rss': 'Rss',
  'fas fa-newspaper': 'Document',
  'fas fa-bookmark': 'Star',
  'fas fa-sticky-note': 'Memo',
  'fas fa-brain': 'Cpu',
  'fas fa-robot': 'Robot'
}

const elementIcon = computed(() => {
  return elementIconMap[props.icon]
})

// FontAwesome类名处理
const iconClass = computed(() => {
  if (!isValidIcon.value) return ''
  
  let classes = props.icon
  
  // 确保基础Font Awesome样式类存在
  if (!classes.includes('fa')) {
    classes = `fa ${classes}`
  }
  
  // 添加动画类
  if (props.spin) {
    classes += ' fa-spin'
  }
  if (props.pulse) {
    classes += ' fa-pulse'
  }
  
  return classes
})

// 图标样式
const iconStyle = computed(() => ({
  fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
  color: props.color || 'currentColor'
}))

// 回退文本映射
const fallbackTextMap: Record<string, string> = {
  'fas fa-home': '🏠',
  'fas fa-user': '👤',
  'fas fa-cog': '⚙️',
  'fas fa-brain': '🧠',
  'fas fa-newspaper': '📰',
  'fas fa-rss': '📡',
  'fas fa-bookmark': '🔖',
  'fas fa-sticky-note': '📝',
  'fas fa-search': '🔍',
  'fas fa-bell': '🔔',
  'fas fa-bars': '☰',
  'fas fa-plus': '+',
  'fas fa-times': '×',
  'fas fa-check': '✓',
  'fas fa-arrow-left': '←',
  'fas fa-arrow-right': '→'
}

const fallbackText = computed(() => {
  return fallbackTextMap[props.icon] || '■'
})

const fallbackStyle = computed(() => ({
  fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
  color: props.color || 'currentColor',
  display: 'inline-block',
  lineHeight: '1',
  textAlign: 'center' as const,
  minWidth: '1em'
}))
</script>

<style scoped>
/* FontAwesome基础样式 */
.fa {
  font-family: "Font Awesome 6 Free";
  font-weight: 900;
  font-style: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  display: inline-block;
  text-rendering: auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.far {
  font-weight: 400;
}

.fab {
  font-family: "Font Awesome 6 Brands";
  font-weight: 400;
}

/* 动画 */
.fa-spin {
  animation: fa-spin 2s infinite linear;
}

.fa-pulse {
  animation: fa-pulse 1s infinite steps(8);
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fa-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style> 