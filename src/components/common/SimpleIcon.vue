<template>
  <!-- FontAwesome图标 -->
  <i 
    v-if="useFontAwesome"
    :class="faClass"
    :style="iconStyle"
    :title="title"
  ></i>
  <!-- Element Plus图标 -->
  <el-icon 
    v-else-if="useElementPlus"
    :size="normalizedSize"
    :style="{ color }"
    :title="title"
  >
    <component :is="elementPlusIcon" />
  </el-icon>
  <!-- Unicode回退 -->
  <span 
    v-else
    :style="fallbackStyle"
    :title="title || `图标: ${icon}`"
  >
    {{ unicodeIcon }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon } from 'element-plus'

interface Props {
  icon: string
  size?: string | number
  color?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 16
})

// 标准化尺寸
const normalizedSize = computed(() => {
  if (typeof props.size === 'number') return props.size
  return parseInt(props.size) || 16
})

// 检查图标类型
const useFontAwesome = computed(() => {
  return props.icon.includes('fa-') || props.icon.includes('fa ')
})

const useElementPlus = computed(() => {
  return !useFontAwesome.value && elementPlusMap.value
})

// FontAwesome类名
const faClass = computed(() => {
  let classes = props.icon
  if (!classes.includes('fa')) {
    classes = `fa ${classes}`
  }
  return classes
})

// Element Plus图标映射
const elementPlusIconMap: Record<string, string> = {
  'home': 'House',
  'user': 'User',
  'setting': 'Setting',
  'search': 'Search',
  'bell': 'Bell',
  'plus': 'Plus',
  'close': 'Close',
  'check': 'Check',
  'arrow-left': 'ArrowLeft',
  'arrow-right': 'ArrowRight',
  'menu': 'Menu',
  'rss': 'Rss',
  'document': 'Document',
  'star': 'Star',
  'memo': 'Memo',
  'cpu': 'Cpu'
}

const elementPlusMap = computed(() => {
  // 提取图标名称（去掉前缀）
  const iconName = props.icon.replace(/^(fas?|far|fab)\s+fa-/, '').replace('fa-', '')
  return elementPlusIconMap[iconName]
})

const elementPlusIcon = computed(() => elementPlusMap.value)

// Unicode回退映射
const unicodeMap: Record<string, string> = {
  'home': '🏠',
  'user': '👤',
  'cog': '⚙️',
  'settings': '⚙️',
  'brain': '🧠',
  'newspaper': '📰',
  'rss': '📡',
  'bookmark': '🔖',
  'sticky-note': '📝',
  'search': '🔍',
  'bell': '🔔',
  'bars': '☰',
  'plus': '+',
  'times': '×',
  'close': '×',
  'check': '✓',
  'arrow-left': '←',
  'arrow-right': '→',
  'chevron-right': '›',
  'code': '💻',
  'palette': '🎨',
  'chart-pie': '📊',
  'project-diagram': '🕸️',
  'robot': '🤖',
  'chart-line': '📈',
  'question-circle': '❓'
}

const unicodeIcon = computed(() => {
  const iconName = props.icon.replace(/^(fas?|far|fab)\s+fa-/, '').replace('fa-', '')
  return unicodeMap[iconName] || '■'
})

// 样式
const iconStyle = computed(() => ({
  fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
  color: props.color || 'currentColor'
}))

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
.fa {
  font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands";
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
</style> 