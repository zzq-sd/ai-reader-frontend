<template>
  <li class="sidebar-item">
    <router-link
      :to="item.route"
      class="sidebar-link"
      :class="{
        'active': isActive,
        'collapsed': collapsed
      }"
      @click="handleClick"
    >
      <!-- 图标 -->
      <div class="item-icon">
        <i :class="item.icon"></i>
      </div>

      <!-- 文本内容 -->
      <div class="item-content" v-show="!collapsed">
        <span class="item-title">{{ item.title }}</span>
        
        <!-- 徽章 -->
        <span 
          v-if="item.badge" 
          class="item-badge"
          :class="getBadgeClass(item.badge)"
        >
          {{ formatBadge(item.badge) }}
        </span>
      </div>

      <!-- 收起状态下的提示 -->
      <div 
        v-if="collapsed && item.badge" 
        class="collapsed-badge"
        :class="getBadgeClass(item.badge)"
      >
        {{ formatBadge(item.badge) }}
      </div>
    </router-link>

    <!-- 子菜单 (如果有) -->
    <transition name="submenu">
      <ul 
        v-if="item.children && item.children.length > 0 && !collapsed && showSubmenu"
        class="submenu"
      >
        <SidebarItem
          v-for="child in item.children"
          :key="child.id"
          :item="child"
          :collapsed="false"
          @click="$emit('click', child)"
        />
      </ul>
    </transition>
  </li>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

// 定义组件属性
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  collapsed: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['click'])

// 获取当前路由
const route = useRoute()

// 子菜单显示状态
const showSubmenu = ref(false)

// 计算是否为激活状态
const isActive = computed(() => {
  return route.path === props.item.route || 
         route.path.startsWith(props.item.route + '/')
})

// 处理点击事件
const handleClick = (event) => {
  // 如果有子菜单，切换显示状态
  if (props.item.children && props.item.children.length > 0 && !props.collapsed) {
    event.preventDefault()
    showSubmenu.value = !showSubmenu.value
    return
  }

  // 触发父组件的点击事件
  emit('click', props.item)
}

// 格式化徽章显示
const formatBadge = (badge) => {
  if (typeof badge === 'number') {
    return badge > 99 ? '99+' : badge.toString()
  }
  return badge
}

// 获取徽章样式类
const getBadgeClass = (badge) => {
  if (typeof badge === 'number') {
    if (badge > 0) return 'badge-count'
    return 'badge-empty'
  }
  
  // 根据徽章内容返回不同样式
  if (badge === 'new' || badge === '新') return 'badge-new'
  if (badge === 'hot' || badge === '热') return 'badge-hot'
  if (badge === 'beta' || badge === '测试') return 'badge-beta'
  
  return 'badge-default'
}
</script>

<style lang="scss" scoped>
.sidebar-item {
  position: relative;
}

.sidebar-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-duration) var(--transition-timing);
  border-radius: 0.5rem;
  margin: 0 0.5rem;
  position: relative;
  cursor: pointer;

  &:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
    transform: translateX(2px);
  }

  &.active {
    background: var(--primary-bg);
    color: var(--primary-color);
    font-weight: 600;

    .item-icon i {
      color: var(--primary-color);
    }

    &::before {
      content: '';
      position: absolute;
      left: -0.5rem;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 1.5rem;
      background: var(--primary-color);
      border-radius: 0 2px 2px 0;
    }
  }

  &.collapsed {
    justify-content: center;
    padding: 0.75rem;
    margin: 0 0.25rem;

    .item-icon {
      margin-right: 0;
    }
  }
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.75rem;
  flex-shrink: 0;

  i {
    font-size: 1rem;
    transition: color var(--transition-duration) var(--transition-timing);
  }
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.item-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.875rem;
}

.item-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  margin-left: 0.5rem;
  flex-shrink: 0;

  &.badge-count {
    background: var(--danger-color);
    color: white;
  }

  &.badge-new {
    background: var(--success-color);
    color: white;
  }

  &.badge-hot {
    background: var(--warning-color);
    color: white;
  }

  &.badge-beta {
    background: var(--info-color);
    color: white;
  }

  &.badge-default {
    background: var(--bg-secondary);
    color: var(--text-secondary);
  }

  &.badge-empty {
    display: none;
  }
}

.collapsed-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  padding: 0.125rem 0.25rem;
  border-radius: 0.5rem;
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1;
  min-width: 1rem;
  text-align: center;

  &.badge-count {
    background: var(--danger-color);
    color: white;
  }

  &.badge-new {
    background: var(--success-color);
    color: white;
  }

  &.badge-hot {
    background: var(--warning-color);
    color: white;
  }

  &.badge-beta {
    background: var(--info-color);
    color: white;
  }

  &.badge-default {
    background: var(--bg-secondary);
    color: var(--text-secondary);
  }
}

// 子菜单样式
.submenu {
  list-style: none;
  padding: 0;
  margin: 0.25rem 0 0 0;
  padding-left: 2.5rem;

  .sidebar-link {
    padding: 0.5rem 1rem;
    margin: 0;
    border-radius: 0.25rem;
    font-size: 0.8125rem;

    .item-icon {
      width: 1rem;
      height: 1rem;
      margin-right: 0.5rem;

      i {
        font-size: 0.875rem;
      }
    }

    &::before {
      display: none;
    }

    &.active {
      background: var(--primary-bg-light);
      
      &::after {
        content: '';
        position: absolute;
        left: -1.5rem;
        top: 50%;
        transform: translateY(-50%);
        width: 2px;
        height: 1rem;
        background: var(--primary-color);
        border-radius: 1px;
      }
    }
  }
}

// 子菜单动画
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 200px;
  transform: translateY(0);
}

// 悬浮效果增强
.sidebar-link {
  &:hover {
    .item-icon i {
      transform: scale(1.1);
    }
  }

  &:active {
    transform: translateX(1px) scale(0.98);
  }
}

// 焦点样式
.sidebar-link:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
</style> 