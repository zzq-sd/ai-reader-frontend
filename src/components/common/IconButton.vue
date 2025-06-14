<template>
  <button 
    class="icon-btn"
    :class="{ 
      'is-active': active,
      'is-disabled': disabled,
      [`size-${size}`]: size !== 'default'
    }"
    :disabled="disabled"
    @click="handleClick"
    :title="title"
  >
    <i :class="icon" />
    <span v-if="badge" class="badge">{{ badge }}</span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  icon: string
  active?: boolean
  disabled?: boolean
  size?: 'small' | 'default' | 'large'
  title?: string
  badge?: string | number
}

interface Emits {
  (e: 'click', event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  disabled: false,
  size: 'default'
})

const emit = defineEmits<Emits>()

function handleClick(event: MouseEvent) {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--border-radius-m);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  position: relative;
  
  &:hover:not(.is-disabled) {
    color: var(--color-text-primary);
    background-color: var(--color-bg-hover);
  }
  
  &:active:not(.is-disabled) {
    background-color: var(--color-bg-active);
  }
  
  &.is-active {
    color: var(--color-accent-primary);
    background-color: var(--color-bg-active);
  }
  
  &.is-disabled {
    color: var(--color-text-disabled);
    cursor: not-allowed;
  }
  
  // 尺寸变体
  &.size-small {
    width: 24px;
    height: 24px;
    
    i {
      font-size: 12px;
    }
  }
  
  &.size-large {
    width: 40px;
    height: 40px;
    
    i {
      font-size: 16px;
    }
  }
  
  i {
    font-size: 14px;
  }
  
  .badge {
    position: absolute;
    top: -2px;
    right: -2px;
    background-color: var(--color-accent-primary);
    color: white;
    font-size: 9px;
    font-weight: 600;
    padding: 1px 4px;
    border-radius: 8px;
    min-width: 14px;
    line-height: 10px;
    text-align: center;
    border: 1px solid var(--color-bg-secondary);
  }
}
</style> 