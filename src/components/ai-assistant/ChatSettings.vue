<template>
  <div class="chat-settings">
    <!-- 设置头部 -->
    <div class="settings-header">
      <div class="header-title">
        <i class="fas fa-cog"></i>
        <span>聊天设置</span>
      </div>
      <button 
        class="close-btn"
        @click="handleClose"
        title="关闭设置"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 外观设置 -->
      <div class="settings-section">
        <div class="section-header">
          <i class="fas fa-palette"></i>
          <h3>外观设置</h3>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>主题模式</span>
            <span class="setting-description">选择您喜欢的界面主题</span>
          </label>
          <div class="theme-selector">
            <button
              v-for="theme in themes"
              :key="theme.value"
              class="theme-option"
              :class="{ active: localSettings.theme === theme.value }"
              @click="updateSetting('theme', theme.value)"
              :title="theme.label"
            >
              <div class="theme-preview" :class="theme.value">
                <div class="theme-bg"></div>
                <div class="theme-accent"></div>
              </div>
              <span>{{ theme.label }}</span>
            </button>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>字体大小</span>
            <span class="setting-description">调整聊天文字的大小</span>
          </label>
          <div class="font-size-control">
            <button 
              class="size-btn"
              @click="decreaseFontSize"
              :disabled="localSettings.fontSize <= 12"
            >
              <i class="fas fa-minus"></i>
            </button>
            <div class="size-display">
              <span class="size-value">{{ localSettings.fontSize }}px</span>
              <div class="size-preview" :style="{ fontSize: localSettings.fontSize + 'px' }">
                示例文字
              </div>
            </div>
            <button 
              class="size-btn"
              @click="increaseFontSize"
              :disabled="localSettings.fontSize >= 20"
            >
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>语言设置</span>
            <span class="setting-description">选择界面显示语言</span>
          </label>
          <select 
            v-model="localSettings.language"
            class="language-select"
            @change="updateSetting('language', ($event.target as HTMLSelectElement).value)"
          >
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
            <option value="en-US">English</option>
            <option value="ja-JP">日本語</option>
            <option value="ko-KR">한국어</option>
          </select>
        </div>
      </div>

      <!-- 聊天行为设置 -->
      <div class="settings-section">
        <div class="section-header">
          <i class="fas fa-comments"></i>
          <h3>聊天行为</h3>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>自动滚动</span>
            <span class="setting-description">新消息时自动滚动到底部</span>
          </label>
          <div class="toggle-switch">
            <input
              id="autoScroll"
              type="checkbox"
              v-model="localSettings.autoScroll"
              @change="updateSetting('autoScroll', ($event.target as HTMLInputElement).checked)"
            />
            <label for="autoScroll" class="switch-label"></label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>Enter键发送</span>
            <span class="setting-description">按Enter键直接发送消息</span>
          </label>
          <div class="toggle-switch">
            <input
              id="sendOnEnter"
              type="checkbox"
              v-model="localSettings.sendOnEnter"
              @change="updateSetting('sendOnEnter', ($event.target as HTMLInputElement).checked)"
            />
            <label for="sendOnEnter" class="switch-label"></label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>显示时间戳</span>
            <span class="setting-description">在消息旁显示发送时间</span>
          </label>
          <div class="toggle-switch">
            <input
              id="showTimestamp"
              type="checkbox"
              v-model="localSettings.showTimestamp"
              @change="updateSetting('showTimestamp', ($event.target as HTMLInputElement).checked)"
            />
            <label for="showTimestamp" class="switch-label"></label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>显示头像</span>
            <span class="setting-description">在消息中显示用户和AI头像</span>
          </label>
          <div class="toggle-switch">
            <input
              id="showAvatar"
              type="checkbox"
              v-model="localSettings.showAvatar"
              @change="updateSetting('showAvatar', ($event.target as HTMLInputElement).checked)"
            />
            <label for="showAvatar" class="switch-label"></label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>输入提示音</span>
            <span class="setting-description">收到新消息时播放提示音</span>
          </label>
          <div class="toggle-switch">
            <input
              id="soundEnabled"
              type="checkbox"
              v-model="localSettings.soundEnabled"
              @change="updateSetting('soundEnabled', ($event.target as HTMLInputElement).checked)"
            />
            <label for="soundEnabled" class="switch-label"></label>
          </div>
        </div>
      </div>

      <!-- 高级设置 -->
      <div class="settings-section">
        <div class="section-header">
          <i class="fas fa-cogs"></i>
          <h3>高级设置</h3>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>消息历史限制</span>
            <span class="setting-description">保留的最大消息数量</span>
          </label>
          <div class="number-input">
            <input
              type="number"
              v-model.number="localSettings.maxMessages"
              min="50"
              max="1000"
              step="50"
              @change="updateSetting('maxMessages', $event.target.value)"
            />
            <span class="input-suffix">条</span>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>自动保存间隔</span>
            <span class="setting-description">自动保存聊天记录的时间间隔</span>
          </label>
          <select 
            v-model="localSettings.autoSaveInterval"
            class="interval-select"
            @change="updateSetting('autoSaveInterval', $event.target.value)"
          >
            <option value="0">关闭自动保存</option>
            <option value="30">30秒</option>
            <option value="60">1分钟</option>
            <option value="300">5分钟</option>
            <option value="600">10分钟</option>
          </select>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>快捷键</span>
            <span class="setting-description">启用键盘快捷键</span>
          </label>
          <div class="toggle-switch">
            <input
              id="enableShortcuts"
              type="checkbox"
              v-model="localSettings.enableShortcuts"
              @change="updateSetting('enableShortcuts', $event.target.checked)"
            />
            <label for="enableShortcuts" class="switch-label"></label>
          </div>
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="settings-section">
        <div class="section-header">
          <i class="fas fa-database"></i>
          <h3>数据管理</h3>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>导出聊天记录</span>
            <span class="setting-description">将聊天记录导出为文件</span>
          </label>
          <div class="action-buttons">
            <button class="action-btn export-btn" @click="exportChatHistory">
              <i class="fas fa-download"></i>
              <span>导出</span>
            </button>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>清空聊天记录</span>
            <span class="setting-description">删除所有聊天消息和历史</span>
          </label>
          <div class="action-buttons">
            <button 
              class="action-btn danger-btn" 
              @click="showClearConfirm = true"
            >
              <i class="fas fa-trash"></i>
              <span>清空</span>
            </button>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>重置设置</span>
            <span class="setting-description">恢复所有设置到默认值</span>
          </label>
          <div class="action-buttons">
            <button 
              class="action-btn danger-btn" 
              @click="showResetConfirm = true"
            >
              <i class="fas fa-undo"></i>
              <span>重置</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置底部 -->
    <div class="settings-footer">
      <div class="footer-info">
        <span class="version-info">AI阅读器 v1.0.0</span>
      </div>
      <div class="footer-actions">
        <button class="cancel-btn" @click="handleCancel">
          取消
        </button>
        <button class="save-btn" @click="handleSave">
          保存设置
        </button>
      </div>
    </div>

    <!-- 确认对话框 -->
    <transition name="modal">
      <div v-if="showClearConfirm || showResetConfirm" class="modal-overlay" @click="closeConfirmDialog">
        <div class="confirm-dialog" @click.stop>
          <div class="dialog-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="dialog-content">
            <h3>{{ showClearConfirm ? '清空聊天记录' : '重置设置' }}</h3>
            <p>
              {{ showClearConfirm 
                ? '此操作将永久删除所有聊天消息和历史记录，无法恢复。' 
                : '此操作将重置所有设置到默认值，当前的个性化配置将丢失。' 
              }}
            </p>
            <p>确定要继续吗？</p>
          </div>
          <div class="dialog-actions">
            <button class="cancel-btn" @click="closeConfirmDialog">
              取消
            </button>
            <button 
              class="confirm-btn" 
              @click="showClearConfirm ? confirmClear() : confirmReset()"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import type { ChatSettings } from '@/types/aiAssistant'
import { defaultChatSettings } from '@/types/aiAssistant'

// Props
interface Props {
  settings: ChatSettings
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  save: [settings: ChatSettings]
  exportHistory: []
  clearHistory: []
  resetSettings: []
}>()

// 本地状态
const localSettings = reactive<ChatSettings>({ ...props.settings })
const showClearConfirm = ref(false)
const showResetConfirm = ref(false)
const hasChanges = ref(false)

// 主题选项
const themes = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'auto', label: '跟随系统' }
]

// 方法
const updateSetting = <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
  localSettings[key] = value
  hasChanges.value = true
}

const increaseFontSize = () => {
  if (localSettings.fontSize < 20) {
    updateSetting('fontSize', localSettings.fontSize + 1)
  }
}

const decreaseFontSize = () => {
  if (localSettings.fontSize > 12) {
    updateSetting('fontSize', localSettings.fontSize - 1)
  }
}

const handleClose = () => {
  if (hasChanges.value) {
    if (confirm('您有未保存的更改，确定要关闭吗？')) {
      emit('close')
    }
  } else {
    emit('close')
  }
}

const handleCancel = () => {
  // 恢复原始设置
  Object.assign(localSettings, props.settings)
  hasChanges.value = false
  emit('close')
}

const handleSave = () => {
  emit('save', { ...localSettings })
  hasChanges.value = false
  emit('close')
}

const exportChatHistory = () => {
  emit('exportHistory')
}

const closeConfirmDialog = () => {
  showClearConfirm.value = false
  showResetConfirm.value = false
}

const confirmClear = () => {
  emit('clearHistory')
  closeConfirmDialog()
}

const confirmReset = () => {
  Object.assign(localSettings, defaultChatSettings)
  hasChanges.value = true
  emit('resetSettings')
  closeConfirmDialog()
}

// 监听设置变化
watch(
  () => props.settings,
  (newSettings) => {
    Object.assign(localSettings, newSettings)
    hasChanges.value = false
  },
  { deep: true }
)

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleClose()
  } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    handleSave()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped lang="scss">
.chat-settings {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border-primary);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 设置头部 */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--color-border-primary);
  background: var(--color-bg-primary);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  
  i {
    color: var(--color-primary);
  }
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

/* 设置内容 */
.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-border-secondary);
    border-radius: 3px;
  }
}

.settings-section {
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  
  i {
    color: var(--color-primary);
    font-size: 16px;
  }
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.setting-item {
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.setting-label {
  display: block;
  margin-bottom: 12px;
  
  span:first-child {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }
}

.setting-description {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

/* 主题选择器 */
.theme-selector {
  display: flex;
  gap: 12px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid var(--color-border-primary);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  flex: 1;
  
  &:hover {
    border-color: var(--color-primary);
  }
  
  &.active {
    border-color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.1);
  }
  
  span {
    font-size: 12px;
    color: var(--color-text-secondary);
    font-weight: 500;
  }
}

.theme-preview {
  width: 32px;
  height: 24px;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  
  &.light {
    .theme-bg {
      background: #ffffff;
    }
    .theme-accent {
      background: #007AFF;
    }
  }
  
  &.dark {
    .theme-bg {
      background: #1a1a1a;
    }
    .theme-accent {
      background: #0A84FF;
    }
  }
  
  &.auto {
    .theme-bg {
      background: linear-gradient(45deg, #ffffff 50%, #1a1a1a 50%);
    }
    .theme-accent {
      background: #007AFF;
    }
  }
}

.theme-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.theme-accent {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

/* 字体大小控制 */
.font-size-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.size-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all var(--transition-speed-fast);
  
  &:hover:not(:disabled) {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.size-display {
  flex: 1;
  text-align: center;
}

.size-value {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.size-preview {
  color: var(--color-text-secondary);
  transition: font-size var(--transition-speed-fast);
}

/* 语言选择 */
.language-select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 2px solid var(--color-border-primary);
  border-radius: 8px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
  }
}

/* 开关切换 */
.toggle-switch {
  position: relative;
  display: inline-block;
}

.toggle-switch input[type="checkbox"] {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-label {
  display: block;
  width: 44px;
  height: 24px;
  background: var(--color-border-secondary);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all var(--transition-speed-fast);
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: all var(--transition-speed-fast);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

.toggle-switch input:checked + .switch-label {
  background: var(--color-primary);
  
  &::after {
    transform: translateX(20px);
  }
}

/* 数字输入 */
.number-input {
  position: relative;
  display: flex;
  align-items: center;
  
  input {
    width: 100%;
    height: 40px;
    padding: 0 40px 0 12px;
    border: 2px solid var(--color-border-primary);
    border-radius: 8px;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: 14px;
    outline: none;
    transition: all var(--transition-speed-fast);
    
    &:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
    }
  }
}

.input-suffix {
  position: absolute;
  right: 12px;
  color: var(--color-text-tertiary);
  font-size: 14px;
  pointer-events: none;
}

/* 间隔选择 */
.interval-select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 2px solid var(--color-border-primary);
  border-radius: 8px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
  }
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 12px;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
  
  &.export-btn:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
  
  &.danger-btn:hover {
    background: var(--color-danger);
    color: white;
    border-color: var(--color-danger);
  }
}

/* 设置底部 */
.settings-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-top: 1px solid var(--color-border-primary);
  background: var(--color-bg-primary);
}

.footer-info {
  .version-info {
    font-size: 12px;
    color: var(--color-text-tertiary);
  }
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
}

.cancel-btn {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

.save-btn {
  background: var(--color-primary);
  color: white;
  
  &:hover {
    background: var(--color-primary-dark);
  }
}

/* 确认对话框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.confirm-dialog {
  width: 400px;
  max-width: 90vw;
  background: var(--color-bg-secondary);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  text-align: center;
}

.dialog-icon {
  padding: 24px 24px 0;
  
  i {
    font-size: 48px;
    color: var(--color-warning);
  }
}

.dialog-content {
  padding: 16px 24px 24px;
  
  h3 {
    margin: 0 0 12px;
    font-size: 18px;
    color: var(--color-text-primary);
  }
  
  p {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    
    &:last-child {
      margin-bottom: 0;
      font-weight: 500;
      color: var(--color-text-primary);
    }
  }
}

.dialog-actions {
  display: flex;
  border-top: 1px solid var(--color-border-primary);
  
  button {
    flex: 1;
    padding: 16px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all var(--transition-speed-fast);
    
    &:first-child {
      border-right: 1px solid var(--color-border-primary);
    }
    
    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
    
    &.confirm-btn {
      color: var(--color-danger);
      
      &:hover {
        background: var(--color-danger);
        color: white;
      }
    }
  }
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all var(--transition-speed-normal);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .confirm-dialog,
.modal-leave-to .confirm-dialog {
  transform: scale(0.9) translateY(-20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-settings {
    width: 100vw;
    left: 0;
    right: auto;
  }
  
  .theme-selector {
    flex-direction: column;
  }
  
  .theme-option {
    flex-direction: row;
    justify-content: flex-start;
  }
  
  .font-size-control {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .size-display {
    order: -1;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .footer-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .confirm-dialog {
    width: 100vw;
    height: 100vh;
    max-width: none;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}
</style> 