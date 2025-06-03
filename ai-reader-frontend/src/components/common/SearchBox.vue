<template>
  <div class="search-box" :class="{ 'is-focused': isFocused }">
    <i class="fas fa-search search-icon" />
    <input
      ref="inputRef"
      v-model="searchQuery"
      type="text"
      :placeholder="placeholder"
      class="search-input"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.enter="handleSearch"
      @keydown.esc="handleClear"
    />
    <IconButton
      v-if="searchQuery"
      icon="fas fa-times"
      size="small"
      class="clear-btn"
      @click="handleClear"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import IconButton from './IconButton.vue'

interface Props {
  placeholder?: string
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search', query: string): void
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '全局搜索...',
  modelValue: ''
})

const emit = defineEmits<Emits>()

// 响应式数据
const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)
const searchQuery = ref(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  searchQuery.value = newValue
})

// 监听内部值变化
watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue)
})

// 事件处理
function handleFocus() {
  isFocused.value = true
}

function handleBlur() {
  isFocused.value = false
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    emit('search', searchQuery.value.trim())
  }
}

function handleClear() {
  searchQuery.value = ''
  emit('clear')
  inputRef.value?.focus()
}

// 暴露方法
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  clear: handleClear
})
</script>

<style lang="scss" scoped>
.search-box {
  display: flex;
  align-items: center;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  padding: spacing(1.5) spacing(2.5);
  width: 220px;
  transition: border-color var(--transition-speed-fast), box-shadow var(--transition-speed-fast);
  
  &.is-focused {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.2);
  }
  
  .search-icon {
    color: var(--color-text-disabled);
    font-size: 13px;
    margin-right: spacing(1.5);
    flex-shrink: 0;
  }
  
  .search-input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-size: 13px;
    width: 100%;
    flex: 1;
    
    &::placeholder {
      color: var(--color-text-disabled);
    }
  }
  
  .clear-btn {
    margin-left: spacing(1);
    flex-shrink: 0;
  }
}
</style> 