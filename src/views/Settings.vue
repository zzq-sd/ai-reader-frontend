<template>
  <div class="settings-container">
    <!-- 设置头部 -->
    <div class="settings-header">
      <div class="header-content">
        <h1 class="page-title">
          <AppIcon icon="fas fa-cog" :size="ICON_SIZES.LG" />
          设置
        </h1>
        <div class="header-actions">
          <button 
            class="reset-btn"
            @click="showResetDialog = true"
            title="重置所有设置"
          >
            <AppIcon :icon="ICONS.ACTION.RESET" :size="ICON_SIZES.SM" />
            <span>重置</span>
          </button>
          <button 
            class="save-btn"
            @click="saveAllSettings"
            :disabled="!hasUnsavedChanges"
            title="保存设置"
          >
            <AppIcon :icon="ICONS.ACTION.SAVE" :size="ICON_SIZES.SM" />
            <span>保存</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 设置主体 -->
    <div class="settings-main">
      <!-- 左侧导航 -->
      <div class="settings-sidebar">
        <nav class="settings-nav">
          <div
            v-for="section in settingSections"
            :key="section.id"
            class="nav-item"
            :class="{ active: activeSection === section.id }"
            @click="switchSection(section.id)"
          >
            <div class="nav-icon">
              <AppIcon :icon="section.icon" :size="ICON_SIZES.SM" />
            </div>
            <div class="nav-content">
              <div class="nav-title">{{ section.title }}</div>
              <div class="nav-desc">{{ section.description }}</div>
            </div>
            <div class="nav-arrow">
              <AppIcon icon="fas fa-chevron-right" :size="ICON_SIZES.XS" />
            </div>
          </div>
        </nav>
      </div>

      <!-- 右侧内容区域 -->
      <div class="settings-content">
        <Transition name="fade-slide" mode="out-in">
          <!-- 账户设置 -->
          <div v-if="activeSection === 'account'" key="account" class="content-section">
            <div class="section-header">
              <h2>账户设置</h2>
              <p>管理您的账户信息和安全设置</p>
            </div>
            
            <div class="settings-blocks">
              <!-- 基本信息 -->
              <div class="setting-block">
                <div class="block-header">
                  <h3>基本信息</h3>
                </div>
                <div class="block-content">
                  <div class="form-group">
                    <label>用户名</label>
                    <input 
                      v-model="settings.account.username"
                      type="text"
                      placeholder="请输入用户名"
                      @input="markAsChanged"
                    />
                  </div>
                  <div class="form-group">
                    <label>邮箱地址</label>
                    <input 
                      v-model="settings.account.email"
                      type="email"
                      placeholder="请输入邮箱地址"
                      @input="markAsChanged"
                    />
                  </div>
                  <div class="form-group">
                    <label>个人简介</label>
                    <textarea 
                      v-model="settings.account.bio"
                      placeholder="介绍一下自己..."
                      rows="3"
                      @input="markAsChanged"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- 安全设置 -->
              <div class="setting-block">
                <div class="block-header">
                  <h3>安全设置</h3>
                </div>
                <div class="block-content">
                  <div class="form-group">
                    <label>当前密码</label>
                    <input 
                      v-model="passwordForm.currentPassword"
                      type="password"
                      placeholder="请输入当前密码"
                    />
                  </div>
                  <div class="form-group">
                    <label>新密码</label>
                    <input 
                      v-model="passwordForm.newPassword"
                      type="password"
                      placeholder="请输入新密码"
                    />
                  </div>
                  <div class="form-group">
                    <label>确认新密码</label>
                    <input 
                      v-model="passwordForm.confirmPassword"
                      type="password"
                      placeholder="请再次输入新密码"
                    />
                  </div>
                  <div class="form-actions">
                    <button class="btn-secondary" @click="resetPasswordForm">取消</button>
                    <button class="btn-primary" @click="changePassword">更改密码</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 外观设置 -->
          <div v-else-if="activeSection === 'appearance'" key="appearance" class="content-section">
            <div class="section-header">
              <h2>外观设置</h2>
              <p>自定义界面外观和主题</p>
            </div>
            
            <div class="settings-blocks">
              <!-- 主题设置 -->
              <div class="setting-block">
                <div class="block-header">
                  <h3>主题模式</h3>
                </div>
                <div class="block-content">
                  <div class="theme-options">
                    <div
                      v-for="theme in themeOptions"
                      :key="theme.value"
                      class="theme-option"
                      :class="{ active: settings.appearance.theme === theme.value }"
                      @click="updateTheme(theme.value)"
                    >
                      <div class="theme-preview" :class="`theme-${theme.value}`">
                        <div class="preview-header"></div>
                        <div class="preview-content">
                          <div class="preview-sidebar"></div>
                          <div class="preview-main"></div>
                        </div>
                      </div>
                      <div class="theme-info">
                        <div class="theme-name">{{ theme.label }}</div>
                        <div class="theme-desc">{{ theme.description }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 字体设置 -->
              <div class="setting-block">
                <div class="block-header">
                  <h3>字体设置</h3>
                </div>
                <div class="block-content">
                  <div class="form-group">
                    <label>字体大小</label>
                    <div class="font-size-control">
                      <button 
                        class="size-btn"
                        @click="adjustFontSize(-1)"
                        :disabled="settings.appearance.fontSize <= 12"
                      >
                        <AppIcon icon="fas fa-minus" :size="ICON_SIZES.XS" />
                      </button>
                      <span class="size-display">{{ settings.appearance.fontSize }}px</span>
                      <button 
                        class="size-btn"
                        @click="adjustFontSize(1)"
                        :disabled="settings.appearance.fontSize >= 20"
                      >
                        <AppIcon icon="fas fa-plus" :size="ICON_SIZES.XS" />
                      </button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>字体族</label>
                    <select v-model="settings.appearance.fontFamily" @change="markAsChanged">
                      <option value="system">系统默认</option>
                      <option value="serif">衬线字体</option>
                      <option value="sans-serif">无衬线字体</option>
                      <option value="monospace">等宽字体</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 布局设置 -->
              <div class="setting-block">
                <div class="block-header">
                  <h3>布局设置</h3>
                </div>
                <div class="block-content">
                  <div class="toggle-group">
                    <div class="toggle-item">
                      <div class="toggle-info">
                        <label>紧凑模式</label>
                        <span class="toggle-desc">减少界面间距，显示更多内容</span>
                      </div>
                      <div class="toggle-switch">
                        <input 
                          type="checkbox"
                          v-model="settings.appearance.compactMode"
                          @change="markAsChanged"
                        />
                        <span class="slider"></span>
                      </div>
                    </div>
                    <div class="toggle-item">
                      <div class="toggle-info">
                        <label>显示侧边栏</label>
                        <span class="toggle-desc">在主界面显示导航侧边栏</span>
                      </div>
                      <div class="toggle-switch">
                        <input 
                          type="checkbox"
                          v-model="settings.appearance.showSidebar"
                          @change="markAsChanged"
                        />
                        <span class="slider"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 阅读设置 -->
          <div v-else-if="activeSection === 'reading'" key="reading" class="content-section">
            <div class="section-header">
              <h2>阅读设置</h2>
              <p>优化您的阅读体验</p>
            </div>
            
            <div class="settings-blocks">
              <!-- 阅读偏好 -->
              <div class="setting-block">
                <div class="block-header">
                  <h3>阅读偏好</h3>
                </div>
                <div class="block-content">
                  <div class="form-group">
                    <label>默认阅读模式</label>
                    <select v-model="settings.reading.defaultMode" @change="markAsChanged">
                      <option value="normal">普通模式</option>
                      <option value="focus">专注模式</option>
                      <option value="speed">速读模式</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>阅读速度目标 (字/分钟)</label>
                    <div class="speed-control">
                      <input 
                        type="range"
                        v-model="settings.reading.speedTarget"
                        min="100"
                        max="800"
                        step="50"
                        @input="markAsChanged"
                      />
                      <span class="speed-value">{{ settings.reading.speedTarget }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 自动功能 -->
              <div class="setting-block">
                <div class="block-header">
                  <h3>自动功能</h3>
                </div>
                <div class="block-content">
                  <div class="toggle-group">
                    <div class="toggle-item">
                      <div class="toggle-info">
                        <label>自动保存进度</label>
                        <span class="toggle-desc">自动记录阅读位置和进度</span>
                      </div>
                      <div class="toggle-switch">
                        <input 
                          type="checkbox"
                          v-model="settings.reading.autoSave"
                          @change="markAsChanged"
                        />
                        <span class="slider"></span>
                      </div>
                    </div>
                    <div class="toggle-item">
                      <div class="toggle-info">
                        <label>智能摘要</label>
                        <span class="toggle-desc">自动生成文章摘要和要点</span>
                      </div>
                      <div class="toggle-switch">
                        <input 
                          type="checkbox"
                          v-model="settings.reading.autoSummary"
                          @change="markAsChanged"
                        />
                        <span class="slider"></span>
                      </div>
                    </div>
                    <div class="toggle-item">
                      <div class="toggle-info">
                        <label>护眼模式</label>
                        <span class="toggle-desc">在夜间自动调整屏幕色温</span>
                      </div>
                      <div class="toggle-switch">
                        <input 
                          type="checkbox"
                          v-model="settings.reading.eyeCare"
                          @change="markAsChanged"
                        />
                        <span class="slider"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 通知设置 -->
          <div v-else-if="activeSection === 'notifications'" key="notifications" class="content-section">
            <div class="section-header">
              <h2>通知设置</h2>
              <p>管理通知和提醒偏好</p>
            </div>
            
            <div class="settings-blocks">
              <!-- 通知类型 -->
              <div class="setting-block">
                <div class="block-header">
                  <h3>通知类型</h3>
                </div>
                <div class="block-content">
                  <div class="toggle-group">
                    <div class="toggle-item">
                      <div class="toggle-info">
                        <label>阅读提醒</label>
                        <span class="toggle-desc">定时提醒您进行阅读</span>
                      </div>
                      <div class="toggle-switch">
                        <input 
                          type="checkbox"
                          v-model="settings.notifications.readingReminder"
                          @change="markAsChanged"
                        />
                        <span class="slider"></span>
                      </div>
                    </div>
                    <div class="toggle-item">
                      <div class="toggle-info">
                        <label>新内容通知</label>
                        <span class="toggle-desc">有新文章或更新时通知</span>
                      </div>
                      <div class="toggle-switch">
                        <input 
                          type="checkbox"
                          v-model="settings.notifications.newContent"
                          @change="markAsChanged"
                        />
                        <span class="slider"></span>
                      </div>
                    </div>
                    <div class="toggle-item">
                      <div class="toggle-info">
                        <label>成就通知</label>
                        <span class="toggle-desc">达成阅读成就时通知</span>
                      </div>
                      <div class="toggle-switch">
                        <input 
                          type="checkbox"
                          v-model="settings.notifications.achievements"
                          @change="markAsChanged"
                        />
                        <span class="slider"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 通知方式 -->
              <div class="setting-block">
                <div class="block-header">
                  <h3>通知方式</h3>
                </div>
                <div class="block-content">
                  <div class="form-group">
                    <label>通知声音</label>
                    <select v-model="settings.notifications.sound" @change="markAsChanged">
                      <option value="none">无声音</option>
                      <option value="default">默认提示音</option>
                      <option value="gentle">轻柔提示音</option>
                      <option value="bell">铃声</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>免打扰时间</label>
                    <div class="time-range">
                      <input 
                        type="time"
                        v-model="settings.notifications.quietStart"
                        @change="markAsChanged"
                      />
                      <span>至</span>
                      <input 
                        type="time"
                        v-model="settings.notifications.quietEnd"
                        @change="markAsChanged"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 数据同步 -->
          <div v-else-if="activeSection === 'sync'" key="sync" class="content-section">
            <div class="section-header">
              <h2>数据同步</h2>
              <p>管理数据备份和同步设置</p>
            </div>
            
            <div class="settings-blocks">
              <!-- 同步设置 -->
              <div class="setting-block">
                <div class="block-header">
                  <h3>同步设置</h3>
                </div>
                <div class="block-content">
                  <div class="sync-status">
                    <div class="status-info">
                                        <div class="status-icon" :class="syncStatus.type">
                    <AppIcon :icon="syncStatus.icon.replace(' spinning', '')" :size="ICON_SIZES.MD" :spin="syncStatus.icon.includes('spinning')" />
                  </div>
                      <div class="status-text">
                        <div class="status-title">{{ syncStatus.title }}</div>
                        <div class="status-desc">{{ syncStatus.description }}</div>
                      </div>
                    </div>
                                      <button class="sync-btn" @click="triggerSync" :disabled="isSyncing">
                    <AppIcon icon="fas fa-sync-alt" :size="ICON_SIZES.SM" :spin="isSyncing" />
                    {{ isSyncing ? '同步中...' : '立即同步' }}
                  </button>
                  </div>
                  
                  <div class="toggle-group">
                    <div class="toggle-item">
                      <div class="toggle-info">
                        <label>自动同步</label>
                        <span class="toggle-desc">在有网络时自动同步数据</span>
                      </div>
                      <div class="toggle-switch">
                        <input 
                          type="checkbox"
                          v-model="settings.sync.autoSync"
                          @change="markAsChanged"
                        />
                        <span class="slider"></span>
                      </div>
                    </div>
                    <div class="toggle-item">
                      <div class="toggle-info">
                        <label>仅WiFi同步</label>
                        <span class="toggle-desc">只在WiFi环境下进行同步</span>
                      </div>
                      <div class="toggle-switch">
                        <input 
                          type="checkbox"
                          v-model="settings.sync.wifiOnly"
                          @change="markAsChanged"
                        />
                        <span class="slider"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 数据管理 -->
              <div class="setting-block">
                <div class="block-header">
                  <h3>数据管理</h3>
                </div>
                <div class="block-content">
                  <div class="data-actions">
                                      <button class="action-btn export" @click="exportData">
                    <AppIcon :icon="ICONS.ACTION.DOWNLOAD" :size="ICON_SIZES.MD" />
                    <div class="action-info">
                      <div class="action-title">导出数据</div>
                      <div class="action-desc">下载您的阅读数据备份</div>
                    </div>
                  </button>
                  <button class="action-btn import" @click="importData">
                    <AppIcon :icon="ICONS.ACTION.UPLOAD" :size="ICON_SIZES.MD" />
                    <div class="action-info">
                      <div class="action-title">导入数据</div>
                      <div class="action-desc">从备份文件恢复数据</div>
                    </div>
                  </button>
                  <button class="action-btn clear" @click="showClearDialog = true">
                    <AppIcon icon="fas fa-trash" :size="ICON_SIZES.MD" />
                    <div class="action-info">
                      <div class="action-title">清除数据</div>
                      <div class="action-desc">删除所有本地数据</div>
                    </div>
                  </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 重置确认对话框 -->
    <Transition name="modal">
      <div v-if="showResetDialog" class="modal-overlay" @click="showResetDialog = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>重置设置</h3>
            <button class="modal-close" @click="showResetDialog = false">
              <AppIcon :icon="ICONS.ACTION.CLOSE" :size="ICON_SIZES.SM" />
            </button>
          </div>
          <div class="modal-body">
            <p>确定要重置所有设置到默认值吗？此操作无法撤销。</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showResetDialog = false">取消</button>
            <button class="btn-danger" @click="resetAllSettings">确认重置</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 清除数据确认对话框 -->
    <Transition name="modal">
      <div v-if="showClearDialog" class="modal-overlay" @click="showClearDialog = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>清除数据</h3>
            <button class="modal-close" @click="showClearDialog = false">
              <AppIcon :icon="ICONS.ACTION.CLOSE" :size="ICON_SIZES.SM" />
            </button>
          </div>
          <div class="modal-body">
            <p>确定要清除所有本地数据吗？包括阅读记录、笔记和设置。此操作无法撤销。</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showClearDialog = false">取消</button>
            <button class="btn-danger" @click="clearAllData">确认清除</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 成功提示 -->
    <Transition name="toast">
      <div v-if="showSuccessToast" class="success-toast">
        <AppIcon :icon="ICONS.NOTIFICATION.SUCCESS" :size="ICON_SIZES.SM" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ICONS, ICON_SIZES, ICON_COLORS } from '@/constants/icons'
import AppIcon from '@/components/common/AppIcon.vue'

// 路由
const route = useRoute()

// 响应式数据
const activeSection = ref('account')
const hasUnsavedChanges = ref(false)
const showResetDialog = ref(false)
const showClearDialog = ref(false)
const showSuccessToast = ref(false)
const toastMessage = ref('')
const isSyncing = ref(false)

// 设置数据
const settings = reactive({
  account: {
    username: 'AI阅读者',
    email: 'user@example.com',
    bio: '热爱阅读，追求知识的探索者'
  },
  appearance: {
    theme: 'auto',
    fontSize: 16,
    fontFamily: 'system',
    compactMode: false,
    showSidebar: true
  },
  reading: {
    defaultMode: 'normal',
    speedTarget: 300,
    autoSave: true,
    autoSummary: true,
    eyeCare: false
  },
  notifications: {
    readingReminder: true,
    newContent: true,
    achievements: true,
    sound: 'default',
    quietStart: '22:00',
    quietEnd: '08:00'
  },
  sync: {
    autoSync: true,
    wifiOnly: true
  }
})

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 设置分类
const settingSections = [
  {
    id: 'account',
    title: '账户设置',
    description: '个人信息和安全',
    icon: 'fas fa-user'
  },
  {
    id: 'appearance',
    title: '外观设置',
    description: '主题和界面',
    icon: 'fas fa-palette'
  },
  {
    id: 'reading',
    title: '阅读设置',
    description: '阅读偏好和功能',
    icon: 'fas fa-book-reader'
  },
  {
    id: 'notifications',
    title: '通知设置',
    description: '提醒和通知',
    icon: 'fas fa-bell'
  },
  {
    id: 'sync',
    title: '数据同步',
    description: '备份和同步',
    icon: 'fas fa-cloud'
  }
]

// 主题选项
const themeOptions = [
  {
    value: 'light',
    label: '浅色模式',
    description: '明亮清爽的界面'
  },
  {
    value: 'dark',
    label: '深色模式',
    description: '护眼的深色界面'
  },
  {
    value: 'auto',
    label: '自动模式',
    description: '跟随系统设置'
  }
]

// 同步状态
const syncStatus = computed(() => {
  if (isSyncing.value) {
    return {
      type: 'syncing',
      icon: 'fas fa-sync-alt spinning',
      title: '同步中...',
      description: '正在同步您的数据'
    }
  }
  
  return {
    type: 'success',
    icon: 'fas fa-check-circle',
    title: '同步完成',
    description: '最后同步：2分钟前'
  }
})

// 方法
const switchSection = (sectionId: string) => {
  activeSection.value = sectionId
}

const markAsChanged = () => {
  hasUnsavedChanges.value = true
}

const updateTheme = (theme: string) => {
  settings.appearance.theme = theme
  markAsChanged()
  
  // 应用主题
  document.documentElement.setAttribute('data-theme', theme)
}

const adjustFontSize = (delta: number) => {
  const newSize = settings.appearance.fontSize + delta
  if (newSize >= 12 && newSize <= 20) {
    settings.appearance.fontSize = newSize
    markAsChanged()
  }
}

const saveAllSettings = () => {
  // 模拟保存
  setTimeout(() => {
    hasUnsavedChanges.value = false
    showToast('设置已保存')
  }, 500)
}

const resetAllSettings = () => {
  // 重置到默认值
  Object.assign(settings, {
    account: {
      username: '',
      email: '',
      bio: ''
    },
    appearance: {
      theme: 'auto',
      fontSize: 16,
      fontFamily: 'system',
      compactMode: false,
      showSidebar: true
    },
    reading: {
      defaultMode: 'normal',
      speedTarget: 300,
      autoSave: true,
      autoSummary: false,
      eyeCare: false
    },
    notifications: {
      readingReminder: true,
      newContent: true,
      achievements: true,
      sound: 'default',
      quietStart: '22:00',
      quietEnd: '08:00'
    },
    sync: {
      autoSync: true,
      wifiOnly: true
    }
  })
  
  showResetDialog.value = false
  hasUnsavedChanges.value = true
  showToast('设置已重置')
}

const changePassword = () => {
  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    showToast('请填写完整的密码信息', 'error')
    return
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showToast('两次输入的密码不一致', 'error')
    return
  }
  
  // 模拟密码修改
  setTimeout(() => {
    resetPasswordForm()
    showToast('密码修改成功')
  }, 500)
}

const resetPasswordForm = () => {
  Object.assign(passwordForm, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
}

const triggerSync = () => {
  isSyncing.value = true
  
  // 模拟同步过程
  setTimeout(() => {
    isSyncing.value = false
    showToast('数据同步完成')
  }, 2000)
}

const exportData = () => {
  // 模拟导出
  showToast('数据导出成功')
}

const importData = () => {
  // 模拟导入
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = () => {
    showToast('数据导入成功')
  }
  input.click()
}

const clearAllData = () => {
  // 模拟清除数据
  setTimeout(() => {
    showClearDialog.value = false
    showToast('数据已清除')
  }, 500)
}

const showToast = (message: string, type: string = 'success') => {
  toastMessage.value = message
  showSuccessToast.value = true
  
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)
}

// 生命周期
onMounted(() => {
  // 应用当前主题
  document.documentElement.setAttribute('data-theme', settings.appearance.theme)
  
  // 处理路由查询参数，自动切换到指定section
  const sectionFromQuery = route.query.section as string
  if (sectionFromQuery && settingSections.some(s => s.id === sectionFromQuery)) {
    activeSection.value = sectionFromQuery
  }
})

// 监听路由变化
watch(() => route.query.section, (newSection) => {
  if (newSection && settingSections.some(s => s.id === newSection)) {
    activeSection.value = newSection as string
  }
})
</script>

<style scoped lang="scss">
.settings-container {
  padding: 24px;
  background: var(--color-bg-primary);
  min-height: 100vh;
}

/* 设置头部 */
.settings-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  
  i {
    color: var(--color-primary);
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reset-btn,
.save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.reset-btn {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-primary);
  
  &:hover:not(:disabled) {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

.save-btn {
  background: var(--color-primary);
  color: white;
  
  &:hover:not(:disabled) {
    background: var(--color-primary-dark);
    transform: translateY(-1px);
  }
}

/* 设置主体 */
.settings-main {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
  align-items: start;
}

/* 左侧导航 */
.settings-sidebar {
  position: sticky;
  top: 24px;
}

.settings-nav {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
  }
  
  &.active {
    background: var(--color-primary);
    color: white;
    
    .nav-icon,
    .nav-title,
    .nav-desc,
    .nav-arrow {
      color: white;
    }
  }
}

.nav-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(var(--color-primary-rgb), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--color-primary);
  flex-shrink: 0;
  
  .nav-item.active & {
    background: rgba(255, 255, 255, 0.2);
  }
}

.nav-content {
  flex: 1;
}

.nav-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.nav-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.nav-arrow {
  color: var(--color-text-tertiary);
  font-size: 12px;
  transition: transform var(--transition-speed-fast);
  
  .nav-item.active & {
    transform: translateX(2px);
  }
}

/* 右侧内容区域 */
.settings-content {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  min-height: 600px;
}

.content-section {
  padding: 32px;
}

.section-header {
  margin-bottom: 32px;
  
  h2 {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text-primary);
  }
  
  p {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-secondary);
  }
}

/* 设置块 */
.settings-blocks {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-block {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  overflow: hidden;
}

.block-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-primary);
  background: var(--color-bg-secondary);
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.block-content {
  padding: 24px;
}

/* 表单元素 */
.form-group {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
  }
  
  input,
  textarea,
  select {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid var(--color-border-primary);
    border-radius: 8px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 14px;
    transition: all var(--transition-speed-fast);
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
    }
    
    &::placeholder {
      color: var(--color-text-tertiary);
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 80px;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  
  &:hover {
    background: var(--color-primary-dark);
  }
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-primary);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

/* 主题选项 */
.theme-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.theme-option {
  border: 2px solid var(--color-border-primary);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    border-color: var(--color-primary);
  }
  
  &.active {
    border-color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.05);
  }
}

.theme-preview {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  border: 1px solid var(--color-border-secondary);
  
  &.theme-light {
    background: #ffffff;
    
    .preview-header {
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }
    
    .preview-sidebar {
      background: #f1f3f4;
    }
    
    .preview-main {
      background: #ffffff;
    }
  }
  
  &.theme-dark {
    background: #1a1a1a;
    
    .preview-header {
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
    }
    
    .preview-sidebar {
      background: #262626;
    }
    
    .preview-main {
      background: #1a1a1a;
    }
  }
  
  &.theme-auto {
    background: linear-gradient(45deg, #ffffff 50%, #1a1a1a 50%);
    
    .preview-header {
      background: linear-gradient(45deg, #f8f9fa 50%, #2d2d2d 50%);
    }
    
    .preview-sidebar {
      background: linear-gradient(45deg, #f1f3f4 50%, #262626 50%);
    }
    
    .preview-main {
      background: linear-gradient(45deg, #ffffff 50%, #1a1a1a 50%);
    }
  }
}

.preview-header {
  height: 20px;
}

.preview-content {
  display: flex;
  height: 60px;
}

.preview-sidebar {
  width: 30%;
}

.preview-main {
  flex: 1;
}

.theme-info {
  text-align: center;
}

.theme-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.theme-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* 字体大小控制 */
.font-size-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.size-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover:not(:disabled) {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.size-display {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  min-width: 50px;
  text-align: center;
}

/* 切换开关 */
.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toggle-info {
  flex: 1;
  
  label {
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
  }
}

.toggle-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
    
    &:checked + .slider {
      background: var(--color-primary);
      
      &:before {
        transform: translateX(24px);
      }
    }
  }
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-tertiary);
  border-radius: 24px;
  transition: all var(--transition-speed-fast);
  
  &:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background: white;
    border-radius: 50%;
    transition: all var(--transition-speed-fast);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

/* 速度控制 */
.speed-control {
  display: flex;
  align-items: center;
  gap: 12px;
  
  input[type="range"] {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: var(--color-bg-tertiary);
    outline: none;
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--color-primary);
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--color-primary);
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
}

.speed-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  min-width: 40px;
  text-align: center;
}

/* 时间范围 */
.time-range {
  display: flex;
  align-items: center;
  gap: 12px;
  
  input[type="time"] {
    flex: 1;
  }
  
  span {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
}

/* 同步状态 */
.sync-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  
  &.success {
    background: rgba(var(--color-success-rgb), 0.1);
    color: var(--color-success);
  }
  
  &.syncing {
    background: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
  }
}

.status-text {
  .status-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 2px;
  }
  
  .status-desc {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
}

.sync-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  background: transparent;
  color: var(--color-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover:not(:disabled) {
    background: var(--color-primary);
    color: white;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
}

/* 数据操作 */
.data-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-primary);
  }
  
  i {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  
  &.export i {
    background: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
  }
  
  &.import i {
    background: rgba(var(--color-success-rgb), 0.1);
    color: var(--color-success);
  }
  
  &.clear i {
    background: rgba(var(--color-danger-rgb), 0.1);
    color: var(--color-danger);
  }
}

.action-info {
  flex: 1;
  text-align: left;
}

.action-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.action-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* 模态框 */
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
  z-index: 1000;
}

.modal-content {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-primary);
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

.modal-body {
  padding: 24px;
  
  p {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--color-border-primary);
}

.btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: var(--color-danger);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-danger-dark);
  }
}

/* 成功提示 */
.success-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-success);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
}

/* 动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .settings-main {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .settings-sidebar {
    position: static;
  }
  
  .settings-nav {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .settings-container {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .content-section {
    padding: 20px;
  }
  
  .theme-options {
    grid-template-columns: 1fr;
  }
  
  .toggle-item {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .sync-status {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .data-actions {
    gap: 8px;
  }
  
  .action-btn {
    padding: 12px;
  }
}
</style> 