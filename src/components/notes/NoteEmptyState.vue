<template>
  <div class="note-empty-state">
    <div class="empty-content">
      <!-- 图标 -->
      <div class="empty-icon">
        <i class="fas fa-sticky-note"></i>
      </div>
      
      <!-- 标题和描述 -->
      <h3 class="empty-title">开始记录你的想法</h3>
      <p class="empty-description">
        创建你的第一个笔记，记录重要的想法、灵感和知识点。
        支持富文本编辑、标签分类和快速搜索。
      </p>
      
      <!-- 操作按钮 -->
      <div class="empty-actions">
        <button 
          class="btn btn-primary btn-large"
          @click="handleCreateNote"
        >
          <i class="fas fa-plus"></i>
          创建第一个笔记
        </button>
      </div>
      
      <!-- 快捷键提示 -->
      <div class="empty-shortcuts">
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>N</kbd>
          <span>新建笔记</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>S</kbd>
          <span>保存笔记</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>B</kbd>
          <span>切换侧边栏</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义事件
const emit = defineEmits<{
  'create-note': []
}>()

// 方法
const handleCreateNote = () => {
  emit('create-note')
}
</script>

<style lang="scss" scoped>
.note-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
  background: var(--bg-primary);
}

.empty-content {
  text-align: center;
  max-width: 480px;
  
  .empty-icon {
    margin-bottom: 24px;
    
    i {
      font-size: 80px;
      color: var(--text-tertiary);
      opacity: 0.6;
    }
  }
  
  .empty-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 12px 0;
  }
  
  .empty-description {
    font-size: 16px;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0 0 32px 0;
  }
  
  .empty-actions {
    margin-bottom: 40px;
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 24px;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      
      &.btn-primary {
        background: var(--primary-color);
        color: white;
        
        &:hover {
          background: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(var(--primary-rgb), 0.3);
        }
        
        &:active {
          transform: translateY(0);
        }
      }
      
      &.btn-large {
        padding: 16px 28px;
        font-size: 16px;
      }
      
      i {
        font-size: 18px;
      }
    }
  }
  
  .empty-shortcuts {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .shortcut-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 14px;
      color: var(--text-tertiary);
      
      kbd {
        display: inline-block;
        padding: 4px 8px;
        font-size: 12px;
        font-family: var(--font-mono);
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        min-width: 24px;
        text-align: center;
      }
      
      span {
        font-size: 13px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .note-empty-state {
    padding: 24px;
  }
  
  .empty-content {
    max-width: 100%;
    
    .empty-icon {
      margin-bottom: 20px;
      
              i {
          font-size: 64px;
        }
    }
    
    .empty-title {
      font-size: 20px;
      margin-bottom: 8px;
    }
    
    .empty-description {
      font-size: 14px;
      margin-bottom: 24px;
    }
    
    .empty-actions {
      margin-bottom: 32px;
      
      .btn.btn-large {
        padding: 12px 20px;
        font-size: 14px;
        
        i {
          font-size: 16px;
        }
      }
    }
    
    .empty-shortcuts {
      gap: 8px;
      
      .shortcut-item {
        font-size: 12px;
        
        kbd {
          padding: 2px 6px;
          font-size: 11px;
          min-width: 20px;
        }
        
        span {
          font-size: 12px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .empty-shortcuts {
    .shortcut-item {
      flex-direction: column;
      gap: 4px;
      
      div {
        display: flex;
        gap: 4px;
      }
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .empty-content {
    .empty-shortcuts {
      .shortcut-item {
        kbd {
          background: var(--bg-tertiary);
          border-color: var(--border-color-dark);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
      }
    }
  }
}
</style> 