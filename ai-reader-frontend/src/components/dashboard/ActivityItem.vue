<template>
  <div class="activity-item">
    <div class="activity-icon">
      <i :class="activity.icon"></i>
    </div>
    <div class="activity-content">
      <p class="activity-description">{{ activity.description }}</p>
      <span class="activity-time">{{ activity.timestamp }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ActivityItem } from '@/stores/dashboard'

interface Props {
  activity: ActivityItem
}

defineProps<Props>()
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;
@use "@/assets/styles/mixins.scss" as *;

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: spacing(3) 0;
  border-bottom: 1px solid var(--color-border-secondary);
  transition: all var(--transition-speed-fast);
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: var(--color-bg-hover);
    margin: 0 calc(spacing(4) * -1);
    padding-left: spacing(4);
    padding-right: spacing(4);
    border-radius: var(--border-radius-s);
  }
}

.activity-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-s);
  margin-right: spacing(3);
  flex-shrink: 0;
  
  i {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-description {
  font-size: 14px;
  color: var(--color-text-primary);
  margin: 0 0 spacing(1) 0;
  line-height: 1.4;
}

.activity-time {
  font-size: 12px;
  color: var(--color-text-secondary);
}

// 不同活动类型的图标颜色
.activity-item {
  // 添加订阅源
  &[data-type="feed"] {
    .activity-icon {
      background-color: rgba(255, 107, 53, 0.1);
      
      i {
        color: #ff6b35;
      }
    }
  }
  
  // 创建笔记
  &[data-type="note"] {
    .activity-icon {
      background-color: rgba(78, 205, 196, 0.1);
      
      i {
        color: #4ecdc4;
      }
    }
  }
  
  // 收藏文章
  &[data-type="bookmark"] {
    .activity-icon {
      background-color: rgba(247, 183, 49, 0.1);
      
      i {
        color: #f7b731;
      }
    }
  }
  
  // 分享文章
  &[data-type="share"] {
    .activity-icon {
      background-color: rgba(69, 183, 209, 0.1);
      
      i {
        color: #45b7d1;
      }
    }
  }
}

// 响应式设计
@include mobile {
  .activity-item {
    padding: spacing(2.5) 0;
    
    &:hover {
      margin: 0 calc(spacing(3) * -1);
      padding-left: spacing(3);
      padding-right: spacing(3);
    }
  }
  
  .activity-icon {
    width: 28px;
    height: 28px;
    margin-right: spacing(2.5);
    
    i {
      font-size: 12px;
    }
  }
  
  .activity-description {
    font-size: 13px;
  }
  
  .activity-time {
    font-size: 11px;
  }
}

// 加载状态
.activity-item--loading {
  pointer-events: none;
  
  .activity-description,
  .activity-time {
    background: linear-gradient(90deg, 
      var(--color-bg-tertiary) 25%, 
      var(--color-bg-hover) 50%, 
      var(--color-bg-tertiary) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: var(--border-radius-s);
    color: transparent;
  }
  
  .activity-description {
    height: 16px;
    margin-bottom: spacing(1);
  }
  
  .activity-time {
    height: 12px;
    width: 40%;
  }
  
  .activity-icon {
    background-color: var(--color-bg-tertiary);
    
    i {
      color: transparent;
    }
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
</style> 