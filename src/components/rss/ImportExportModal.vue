<template>
  <div class="modal-overlay" v-if="isVisible" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 模态框头部 -->
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-exchange-alt"></i>
          RSS源导入导出
        </h3>
        <button type="button" class="close-btn" @click="handleClose">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 模态框内容 -->
      <div class="modal-body">
        <!-- 标签页切换 -->
        <div class="tab-nav">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'import' }"
            @click="activeTab = 'import'"
          >
            <i class="fas fa-upload"></i>
            导入RSS源
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'export' }"
            @click="activeTab = 'export'"
          >
            <i class="fas fa-download"></i>
            导出RSS源
          </button>
        </div>

        <!-- 导入标签页 -->
        <div v-if="activeTab === 'import'" class="tab-content">
          <div class="import-section">
            <!-- 文件上传区域 -->
            <div class="upload-area" :class="{ 'drag-over': isDragOver }" 
                 @drop="handleFileDrop" 
                 @dragover.prevent="isDragOver = true"
                 @dragleave="isDragOver = false"
                 @click="triggerFileInput">
              <input
                ref="fileInput"
                type="file"
                accept=".opml,.xml"
                @change="handleFileSelect"
                style="display: none"
              >
              <div class="upload-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <h4>拖拽OPML文件到此处或点击选择</h4>
                <p>支持 .opml 和 .xml 格式文件</p>
              </div>
            </div>

            <!-- 文件信息 -->
            <div v-if="selectedFile" class="file-info">
              <div class="file-details">
                <i class="fas fa-file-code"></i>
                <div class="file-meta">
                  <span class="file-name">{{ selectedFile.name }}</span>
                  <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
                </div>
                <button type="button" class="remove-file" @click="removeFile">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <!-- 导入选项 -->
            <div v-if="selectedFile" class="import-options">
              <h5>导入选项</h5>
              
              <div class="option-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="importOptions.skipDuplicates">
                  <span class="checkmark"></span>
                  跳过重复的RSS源
                </label>
              </div>

              <div class="option-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="importOptions.preserveCategories">
                  <span class="checkmark"></span>
                  保留原有分类信息
                </label>
              </div>

              <div class="option-group">
                <label class="form-label">默认分类</label>
                <select v-model="importOptions.defaultCategory" class="form-select">
                  <option value="">选择默认分类</option>
                  <option v-for="category in categories" :key="category.value" :value="category.value">
                    {{ category.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 导入预览 -->
            <div v-if="importPreview.length > 0" class="import-preview">
              <h5>导入预览 ({{ importPreview.length }} 个RSS源)</h5>
              
              <div class="preview-list">
                <div v-for="feed in importPreview" :key="feed.url" class="preview-item">
                  <div class="feed-info">
                    <div class="feed-title">{{ feed.title || feed.url }}</div>
                    <div class="feed-url">{{ feed.url }}</div>
                    <div class="feed-category">
                      <i class="fas fa-folder"></i>
                      {{ getCategoryLabel(feed.category) }}
                    </div>
                  </div>
                  <div class="feed-status">
                    <span v-if="feed.isDuplicate" class="status-badge duplicate">
                      <i class="fas fa-exclamation-triangle"></i>
                      重复
                    </span>
                    <span v-else class="status-badge new">
                      <i class="fas fa-plus"></i>
                      新增
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 导入进度 -->
            <div v-if="isImporting" class="import-progress">
              <div class="progress-header">
                <span>正在导入RSS源...</span>
                <span>{{ importProgress.processed }}/{{ importProgress.total }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: importProgressPercentage + '%' }"></div>
              </div>
              <div class="progress-stats">
                <span class="stat success">成功: {{ importProgress.imported }}</span>
                <span class="stat error">失败: {{ importProgress.failed }}</span>
                <span class="stat warning">冲突: {{ importProgress.conflicts.length }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 导出标签页 -->
        <div v-if="activeTab === 'export'" class="tab-content">
          <div class="export-section">
            <!-- 导出选项 -->
            <div class="export-options">
              <h5>导出选项</h5>
              
              <div class="option-group">
                <label class="form-label">导出范围</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" v-model="exportOptions.scope" value="all">
                    <span class="radio-mark"></span>
                    导出所有RSS源
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="exportOptions.scope" value="selected">
                    <span class="radio-mark"></span>
                    仅导出选中的RSS源
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="exportOptions.scope" value="category">
                    <span class="radio-mark"></span>
                    按分类导出
                  </label>
                </div>
              </div>

              <div v-if="exportOptions.scope === 'category'" class="option-group">
                <label class="form-label">选择分类</label>
                <div class="category-checkboxes">
                  <label v-for="category in categories" :key="category.value" class="checkbox-label">
                    <input 
                      type="checkbox" 
                      :value="category.value"
                      v-model="exportOptions.categories"
                    >
                    <span class="checkmark"></span>
                    <i :class="category.icon" :style="{ color: category.color }"></i>
                    {{ category.label }}
                  </label>
                </div>
              </div>

              <div class="option-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="exportOptions.includeDisabled">
                  <span class="checkmark"></span>
                  包含已禁用的RSS源
                </label>
              </div>

              <div class="option-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="exportOptions.includeMetadata">
                  <span class="checkmark"></span>
                  包含元数据信息
                </label>
              </div>
            </div>

            <!-- 导出预览 -->
            <div class="export-preview">
              <h5>导出预览</h5>
              <div class="export-stats">
                <div class="stat-item">
                  <i class="fas fa-rss"></i>
                  <span>{{ exportStats.totalFeeds }} 个RSS源</span>
                </div>
                <div class="stat-item">
                  <i class="fas fa-folder"></i>
                  <span>{{ exportStats.totalCategories }} 个分类</span>
                </div>
                <div class="stat-item">
                  <i class="fas fa-file-code"></i>
                  <span>预计文件大小: {{ exportStats.estimatedSize }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 模态框底部 -->
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="handleClose">
          取消
        </button>
        
        <button 
          v-if="activeTab === 'import'"
          type="button" 
          class="btn btn-primary"
          @click="handleImport"
          :disabled="!selectedFile || isImporting"
        >
          <i class="fas fa-upload"></i>
          {{ isImporting ? '导入中...' : '开始导入' }}
        </button>
        
        <button 
          v-if="activeTab === 'export'"
          type="button" 
          class="btn btn-primary"
          @click="handleExport"
          :disabled="isExporting || exportStats.totalFeeds === 0"
        >
          <i class="fas fa-download"></i>
          {{ isExporting ? '导出中...' : '开始导出' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { FeedCategory, ImportProgress, ExportOptions, OPMLData } from '../../api/rss.d'

// Props 定义
interface Props {
  isVisible: boolean
  importProgress?: ImportProgress
  isImporting?: boolean
  isExporting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isImporting: false,
  isExporting: false
})

// Emits 定义
interface Emits {
  (e: 'close'): void
  (e: 'import', data: { file: File, options: any }): void
  (e: 'export', options: ExportOptions): void
}

const emit = defineEmits<Emits>()

// 响应式状态
const activeTab = ref<'import' | 'export'>('import')
const selectedFile = ref<File | null>(null)
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement>()

// 导入相关状态
const importOptions = ref({
  skipDuplicates: true,
  preserveCategories: true,
  defaultCategory: 'other' as FeedCategory
})

const importPreview = ref<any[]>([])

// 导出相关状态
const exportOptions = ref<ExportOptions>({
  scope: 'all',
  categories: [],
  includeDisabled: false,
  includeMetadata: true,
  format: 'opml'
})

// 分类选项
const categories = ref([
  { value: 'tech' as FeedCategory, label: '技术博客', icon: 'fas fa-code', color: '#3B82F6' },
  { value: 'news' as FeedCategory, label: '新闻资讯', icon: 'fas fa-newspaper', color: '#EF4444' },
  { value: 'design' as FeedCategory, label: '设计灵感', icon: 'fas fa-palette', color: '#8B5CF6' },
  { value: 'business' as FeedCategory, label: '商业财经', icon: 'fas fa-chart-line', color: '#10B981' },
  { value: 'lifestyle' as FeedCategory, label: '生活方式', icon: 'fas fa-heart', color: '#F59E0B' },
  { value: 'entertainment' as FeedCategory, label: '娱乐资讯', icon: 'fas fa-film', color: '#EC4899' },
  { value: 'science' as FeedCategory, label: '科学研究', icon: 'fas fa-flask', color: '#06B6D4' },
  { value: 'other' as FeedCategory, label: '其他', icon: 'fas fa-folder', color: '#6B7280' }
])

// 计算属性
const importProgressPercentage = computed(() => {
  if (!props.importProgress) return 0
  return Math.round((props.importProgress.processed / props.importProgress.total) * 100)
})

const exportStats = computed(() => {
  // 这里应该根据实际的RSS源数据计算
  // 暂时使用模拟数据
  return {
    totalFeeds: 25,
    totalCategories: 5,
    estimatedSize: '12.5 KB'
  }
})

// 方法
const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  handleClose()
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
    parseOPMLFile(target.files[0])
  }
}

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    selectedFile.value = event.dataTransfer.files[0]
    parseOPMLFile(event.dataTransfer.files[0])
  }
}

const removeFile = () => {
  selectedFile.value = null
  importPreview.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const parseOPMLFile = async (file: File) => {
  try {
    const text = await file.text()
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(text, 'text/xml')
    
    const outlines = xmlDoc.querySelectorAll('outline[xmlUrl]')
    const feeds = Array.from(outlines).map(outline => ({
      title: outline.getAttribute('title') || outline.getAttribute('text') || '',
      url: outline.getAttribute('xmlUrl') || '',
      category: outline.getAttribute('category') || importOptions.value.defaultCategory,
      description: outline.getAttribute('description') || '',
      isDuplicate: Math.random() > 0.7 // 模拟重复检测
    }))
    
    importPreview.value = feeds
  } catch (error) {
    console.error('解析OPML文件失败:', error)
    // 这里应该显示错误提示
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getCategoryLabel = (categoryValue: string): string => {
  const category = categories.value.find(cat => cat.value === categoryValue)
  return category ? category.label : '其他'
}

const handleImport = () => {
  if (selectedFile.value) {
    emit('import', {
      file: selectedFile.value,
      options: importOptions.value
    })
  }
}

const handleExport = () => {
  emit('export', exportOptions.value)
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleClose()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 监听器
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    // 重置状态
    activeTab.value = 'import'
    selectedFile.value = null
    importPreview.value = []
    isDragOver.value = false
  }
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius-l);
  box-shadow: var(--shadow-2xl);
  width: 90vw;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  animation: slideInUp 0.3s ease-out;

  [data-theme="dark"] & {
    background: var(--bg-secondary);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--spacing-unit) * 6);
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);

  i {
    color: var(--primary-color);
  }
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius-s);
  transition: all var(--transition-duration);

  &:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }
}

.modal-body {
  padding: calc(var(--spacing-unit) * 6);
  max-height: 60vh;
  overflow-y: auto;
}

// 标签页
.tab-nav {
  display: flex;
  gap: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 6);
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 4);
  background: none;
  border: none;
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-duration);

  &:hover {
    color: var(--text-primary);
  }

  &.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
  }
}

.tab-content {
  animation: fadeIn 0.3s ease-out;
}

// 文件上传区域
.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-l);
  padding: calc(var(--spacing-unit) * 8);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-duration);
  margin-bottom: calc(var(--spacing-unit) * 6);

  &:hover,
  &.drag-over {
    border-color: var(--primary-color);
    background: var(--primary-bg);
  }
}

.upload-content {
  i {
    font-size: 3rem;
    color: var(--primary-color);
    margin-bottom: calc(var(--spacing-unit) * 4);
  }

  h4 {
    margin: 0 0 calc(var(--spacing-unit) * 2) 0;
    color: var(--text-primary);
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
}

// 文件信息
.file-info {
  margin-bottom: calc(var(--spacing-unit) * 6);
}

.file-details {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  padding: calc(var(--spacing-unit) * 4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-m);
  border: 1px solid var(--border-color);

  i {
    color: var(--primary-color);
    font-size: 1.25rem;
  }
}

.file-meta {
  flex: 1;

  .file-name {
    display: block;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: calc(var(--spacing-unit) * 1);
  }

  .file-size {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
}

.remove-file {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius-s);
  transition: all var(--transition-duration);

  &:hover {
    color: var(--error-color);
    background: var(--error-bg);
  }
}

// 选项组
.import-options,
.export-options {
  margin-bottom: calc(var(--spacing-unit) * 6);

  h5 {
    margin: 0 0 calc(var(--spacing-unit) * 4) 0;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.option-group {
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.form-label {
  display: block;
  margin-bottom: calc(var(--spacing-unit) * 2);
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-select {
  width: 100%;
  padding: calc(var(--spacing-unit) * 3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: border-color var(--transition-duration);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
}

// 复选框和单选框
.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  cursor: pointer;
  margin-bottom: calc(var(--spacing-unit) * 2);
  font-size: 0.875rem;
  color: var(--text-primary);

  input {
    display: none;
  }
}

.checkmark,
.radio-mark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-s);
  position: relative;
  transition: all var(--transition-duration);

  &::after {
    content: '';
    position: absolute;
    display: none;
  }
}

.radio-mark {
  border-radius: 50%;
}

input:checked + .checkmark {
  background: var(--primary-color);
  border-color: var(--primary-color);

  &::after {
    display: block;
    left: 4px;
    top: 1px;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
}

input:checked + .radio-mark {
  background: var(--primary-color);
  border-color: var(--primary-color);

  &::after {
    display: block;
    left: 3px;
    top: 3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: white;
  }
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
}

.category-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: calc(var(--spacing-unit) * 2);
}

// 预览区域
.import-preview,
.export-preview {
  margin-bottom: calc(var(--spacing-unit) * 6);

  h5 {
    margin: 0 0 calc(var(--spacing-unit) * 4) 0;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.preview-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
}

.preview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--spacing-unit) * 4);
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.feed-info {
  flex: 1;

  .feed-title {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: calc(var(--spacing-unit) * 1);
  }

  .feed-url {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-bottom: calc(var(--spacing-unit) * 1);
  }

  .feed-category {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing-unit) * 1);
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
}

.status-badge {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1);
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius-s);
  font-size: 0.75rem;
  font-weight: 500;

  &.new {
    background: var(--success-bg);
    color: var(--success-color);
  }

  &.duplicate {
    background: var(--warning-bg);
    color: var(--warning-color);
  }
}

// 导出统计
.export-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: calc(var(--spacing-unit) * 4);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
  padding: calc(var(--spacing-unit) * 4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-m);
  border: 1px solid var(--border-color);

  i {
    color: var(--primary-color);
    font-size: 1.25rem;
  }

  span {
    font-weight: 500;
    color: var(--text-primary);
  }
}

// 进度条
.import-progress {
  margin-bottom: calc(var(--spacing-unit) * 6);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: calc(var(--spacing-unit) * 2);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.progress-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: calc(var(--spacing-unit) * 3);
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 4px;
  transition: width var(--transition-duration);
}

.progress-stats {
  display: flex;
  gap: calc(var(--spacing-unit) * 4);
  font-size: 0.75rem;

  .stat {
    &.success {
      color: var(--success-color);
    }

    &.error {
      color: var(--error-color);
    }

    &.warning {
      color: var(--warning-color);
    }
  }
}

// 模态框底部
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--spacing-unit) * 3);
  padding: calc(var(--spacing-unit) * 6);
  border-top: 1px solid var(--border-color);
}

.btn {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 6);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-m);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-duration);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.btn-secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);

    &:hover:not(:disabled) {
      background: var(--bg-tertiary);
    }
  }

  &.btn-primary {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);

    &:hover:not(:disabled) {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }
  }
}

// 动画
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .modal-container {
    width: 95vw;
    max-height: 95vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: calc(var(--spacing-unit) * 4);
  }

  .tab-nav {
    flex-direction: column;
  }

  .export-stats {
    grid-template-columns: 1fr;
  }

  .category-checkboxes {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style> 