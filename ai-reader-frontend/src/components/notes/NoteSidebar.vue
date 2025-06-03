<template>
  <div class="note-sidebar">
    <!-- 搜索栏 -->
    <div class="sidebar-search">
      <div class="search-input-wrapper">
        <i class="fas fa-search"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索笔记..."
          class="search-input"
          @input="handleSearch"
          @keydown.escape="clearSearch"
        />
        <button
          v-if="searchQuery"
          class="search-clear"
          @click="clearSearch"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- 笔记列表 -->
    <div class="sidebar-content">
      <div class="notes-list">
        <!-- 列表头部 -->
        <div class="list-header">
          <span class="list-title">
            {{ searchQuery ? '搜索结果' : '所有笔记' }}
            <span class="note-count">({{ displayNotes.length }})</span>
          </span>
          <button
            class="sort-btn"
            @click="toggleSort"
            :title="sortTooltip"
          >
            <i :class="sortIcon"></i>
          </button>
        </div>

        <!-- 笔记项列表 -->
        <div class="notes-scroll-area">
          <div v-if="loading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>加载中...</span>
          </div>

          <div v-else-if="displayNotes.length === 0" class="empty-state">
            <i class="fas fa-sticky-note"></i>
            <span v-if="searchQuery">未找到匹配的笔记</span>
            <span v-else>暂无笔记</span>
          </div>

          <div v-else class="notes-items">
            <NoteListItem
              v-for="note in displayNotes"
              :key="note.id"
              :note="note"
              :selected="note.id === selectedNoteId"
              @select="selectNote"
              @delete="deleteNote"
            />
          </div>
        </div>
      </div>

      <!-- 标签管理 -->
      <div class="tags-section">
        <div class="section-header">
          <span class="section-title">标签</span>
          <button
            class="expand-btn"
            @click="toggleTagsExpanded"
            :class="{ expanded: tagsExpanded }"
          >
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>

        <div v-if="tagsExpanded" class="tags-content">
          <div v-if="availableTags.length === 0" class="empty-tags">
            <span>暂无标签</span>
          </div>
          <div v-else class="tags-list">
            <button
              v-for="tag in availableTags"
              :key="tag"
              class="tag-item"
              @click="filterByTag(tag)"
              :class="{ active: selectedTag === tag }"
            >
              <span class="tag-name">{{ tag }}</span>
              <span class="tag-count">{{ getTagCount(tag) }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotesStore } from '@/stores/notes'
import NoteListItem from './NoteListItem.vue'

// 状态管理
const notesStore = useNotesStore()
const {
  displayNotes,
  loading,
  selectedNoteId,
  availableTags,
  searchQuery: storeSearchQuery
} = storeToRefs(notesStore)

// 本地状态
const searchQuery = ref('')
const sortOrder = ref<'desc' | 'asc'>('desc')
const tagsExpanded = ref(true)
const selectedTag = ref<string | null>(null)

// 计算属性
const sortIcon = computed(() => {
  return sortOrder.value === 'desc' ? 'fas fa-sort-amount-down' : 'fas fa-sort-amount-up'
})

const sortTooltip = computed(() => {
  return sortOrder.value === 'desc' ? '按时间降序' : '按时间升序'
})

// 方法
const handleSearch = async () => {
  try {
    await notesStore.performSearch(searchQuery.value)
  } catch (error) {
    console.error('搜索失败:', error)
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  notesStore.clearSearch()
  selectedTag.value = null
}

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  // TODO: 实现排序逻辑
}

const selectNote = async (noteId: string) => {
  try {
    await notesStore.selectNote(noteId)
  } catch (error) {
    console.error('选择笔记失败:', error)
  }
}

const deleteNote = async (noteId: string) => {
  const note = displayNotes.value.find(n => n.id === noteId)
  if (!note) return

  const confirmed = confirm(`确定要删除笔记"${note.title}"吗？此操作不可撤销。`)
  if (!confirmed) return

  try {
    await notesStore.deleteCurrentNote(noteId)
  } catch (error) {
    console.error('删除笔记失败:', error)
  }
}

const toggleTagsExpanded = () => {
  tagsExpanded.value = !tagsExpanded.value
}

const filterByTag = (tag: string) => {
  if (selectedTag.value === tag) {
    // 取消标签过滤
    selectedTag.value = null
    clearSearch()
  } else {
    // 应用标签过滤
    selectedTag.value = tag
    searchQuery.value = `tag:${tag}`
    handleSearch()
  }
}

const getTagCount = (tag: string) => {
  return displayNotes.value.filter(note => note.tags.includes(tag)).length
}

// 监听搜索查询变化
watch(searchQuery, (newQuery) => {
  if (newQuery !== storeSearchQuery.value) {
    handleSearch()
  }
})

// 同步store中的搜索查询
watch(storeSearchQuery, (newQuery) => {
  if (newQuery !== searchQuery.value) {
    searchQuery.value = newQuery
  }
})
</script>

<style lang="scss" scoped>
.note-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
}

.sidebar-search {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  
  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    
    i.fa-search {
      position: absolute;
      left: 12px;
      font-size: 16px;
      color: var(--text-tertiary);
      z-index: 1;
    }
    
    .search-input {
      width: 100%;
      padding: 10px 12px 10px 36px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: 14px;
      transition: all 0.2s ease;
      
      &::placeholder {
        color: var(--text-tertiary);
      }
      
      &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
      }
    }
    
    .search-clear {
      position: absolute;
      right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--text-tertiary);
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--bg-hover);
        color: var(--text-secondary);
      }
      
      i {
        font-size: 14px;
      }
    }
  }
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notes-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px 8px 16px;
    
    .list-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      
      .note-count {
        font-weight: 400;
        color: var(--text-tertiary);
      }
    }
    
    .sort-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: var(--text-tertiary);
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--bg-hover);
        color: var(--text-secondary);
      }
      
      i {
        width: 16px;
        height: 16px;
      }
    }
  }
  
  .notes-scroll-area {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--scrollbar-thumb);
      border-radius: 3px;
      
      &:hover {
        background: var(--scrollbar-thumb-hover);
      }
    }
  }
  
  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--text-tertiary);
    
    i {
      width: 32px;
      height: 32px;
      margin-bottom: 8px;
    }
    
    span {
      font-size: 14px;
    }
  }
  
  .loading-state {
    /* Font Awesome fa-spin 动画已内置 */
  }
  
  .notes-items {
    padding-bottom: 8px;
  }
}

.tags-section {
  border-top: 1px solid var(--border-color);
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    
    &:hover {
      background: var(--bg-hover);
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .expand-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--text-tertiary);
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--bg-hover);
        color: var(--text-secondary);
      }
      
      &.expanded {
        transform: rotate(180deg);
      }
      
      i {
        font-size: 14px;
      }
    }
  }
  
  .tags-content {
    padding: 0 16px 16px 16px;
    
    .empty-tags {
      text-align: center;
      padding: 20px;
      color: var(--text-tertiary);
      font-size: 14px;
    }
    
    .tags-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      .tag-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s ease;
        text-align: left;
        
        &:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        
        &.active {
          background: var(--primary-color);
          color: white;
          
          .tag-count {
            color: rgba(255, 255, 255, 0.8);
          }
        }
        
        .tag-name {
          font-size: 14px;
          flex: 1;
        }
        
        .tag-count {
          font-size: 12px;
          color: var(--text-tertiary);
          background: var(--bg-tertiary);
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sidebar-search {
    padding: 12px;
  }
  
  .notes-list {
    .list-header {
      padding: 12px 12px 8px 12px;
    }
    
    .notes-scroll-area {
      padding: 0 4px;
    }
  }
  
  .tags-section {
    .section-header {
      padding: 10px 12px;
    }
    
    .tags-content {
      padding: 0 12px 12px 12px;
    }
  }
}
</style> 