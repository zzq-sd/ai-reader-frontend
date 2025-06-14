<template>
  <div class="admin-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">
        <AppIcon icon="fas fa-cogs" :size="ICON_SIZES.LG" class="title-icon" />
        系统管理
      </h1>
      <p class="page-subtitle">管理员控制面板 - 监控系统状态与用户数据</p>
    </div>

    <!-- 统计概览卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <AppIcon icon="fas fa-users" :size="ICON_SIZES.LG" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.userCount.toLocaleString() }}</div>
          <div class="stat-label">注册用户</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <AppIcon icon="fas fa-rss" :size="ICON_SIZES.LG" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.rssCount.toLocaleString() }}</div>
          <div class="stat-label">RSS源</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <AppIcon icon="fas fa-newspaper" :size="ICON_SIZES.LG" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.articleCount.toLocaleString() }}</div>
          <div class="stat-label">文章总数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <AppIcon icon="fas fa-project-diagram" :size="ICON_SIZES.LG" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.conceptCount.toLocaleString() }}</div>
          <div class="stat-label">知识概念</div>
        </div>
      </div>
    </div>

    <!-- 管理功能区域 -->
    <div class="management-section">
      <div class="section-header">
        <h2 class="section-title">管理功能</h2>
      </div>

      <div class="tabs-container">
        <div class="tab-buttons">
          <button 
            v-for="tab in tabs" 
            :key="tab.key"
            :class="['tab-button', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            <AppIcon :icon="tab.icon" :size="ICON_SIZES.SM" />
            {{ tab.label }}
          </button>
        </div>

        <div class="tab-content">
          <!-- 用户管理 -->
          <div v-if="activeTab === 'users'" class="tab-panel">
            <div class="panel-header">
              <h3>用户管理</h3>
              <div class="search-box">
                <AppIcon icon="fas fa-search" :size="ICON_SIZES.SM" />
                <input 
                  v-model="userSearchQuery" 
                  type="text" 
                  placeholder="搜索用户..."
                  @input="loadUsers(userSearchQuery)"
                />
              </div>
            </div>
            
            <div class="data-table">
              <div class="loading-indicator" v-if="isLoadingUsers">
                <AppIcon icon="fas fa-spinner fa-spin" :size="ICON_SIZES.LG" />
                <span>加载中...</span>
              </div>
              
              <table v-else>
                <thead>
                  <tr>
                    <th>用户名</th>
                    <th>邮箱</th>
                    <th>角色</th>
                    <th>状态</th>
                    <th>注册时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in filteredUsers" :key="user.id">
                    <td>
                      <div class="user-info">
                        <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
                        <span>{{ user.username }}</span>
                      </div>
                    </td>
                    <td>{{ user.email }}</td>
                    <td>
                      <span class="role-badge" :class="getRoleClass(user.roles)">
                        {{ formatRoles(user.roles) }}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge" :class="{ active: user.enabled, inactive: !user.enabled }">
                        {{ user.enabled ? '正常' : '禁用' }}
                      </span>
                    </td>
                    <td>{{ formatDate(user.createdAt) }}</td>
                    <td>
                      <button 
                        class="status-toggle-btn" 
                        @click="updateUserStatus(user.id, !user.enabled)"
                        :title="user.enabled ? '禁用用户' : '启用用户'"
                      >
                        <AppIcon 
                          :icon="user.enabled ? 'fas fa-ban' : 'fas fa-check'" 
                          :size="ICON_SIZES.SM" 
                        />
                        {{ user.enabled ? '禁用' : '启用' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div class="empty-state" v-if="!isLoadingUsers && filteredUsers.length === 0">
                <AppIcon icon="fas fa-users-slash" :size="ICON_SIZES.LG" />
                <p>没有找到匹配的用户</p>
              </div>
            </div>
          </div>

          <!-- RSS源管理 -->
          <div v-if="activeTab === 'rss'" class="tab-panel">
            <div class="panel-header">
              <h3>RSS源监控</h3>
              <button 
                class="refresh-btn" 
                @click="loadRssSources"
                :disabled="isLoadingRss"
              >
                <AppIcon :icon="isLoadingRss ? 'fas fa-spinner fa-spin' : 'fas fa-sync'" :size="ICON_SIZES.SM" />
                {{ isLoadingRss ? '刷新中...' : '刷新数据' }}
              </button>
            </div>
            
            <div class="data-table">
              <div class="loading-indicator" v-if="isLoadingRss">
                <AppIcon icon="fas fa-spinner fa-spin" :size="ICON_SIZES.LG" />
                <span>加载中...</span>
              </div>
              
              <table v-else>
                <thead>
                  <tr>
                    <th>RSS源</th>
                    <th>状态</th>
                    <th>文章数</th>
                    <th>最后更新</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rss in rssSources" :key="rss.id">
                    <td>
                      <div class="rss-info">
                        <AppIcon icon="fas fa-rss" :size="ICON_SIZES.SM" class="rss-icon" />
                        <div>
                          <div class="rss-title">{{ rss.title }}</div>
                          <div class="rss-url">{{ rss.url }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="status-badge" :class="{ active: rss.active, inactive: !rss.active }">
                        {{ rss.active ? '正常' : '异常' }}
                      </span>
                      <div class="error-message" v-if="!rss.active && rss.errorMessage">
                        {{ rss.errorMessage }}
                      </div>
                    </td>
                    <td>{{ rss.articleCount }}</td>
                    <td>{{ formatRelativeTime(rss.lastUpdate) }}</td>
                  </tr>
                </tbody>
              </table>
              
              <div class="empty-state" v-if="!isLoadingRss && rssSources.length === 0">
                <AppIcon icon="fas fa-rss-square" :size="ICON_SIZES.LG" />
                <p>没有RSS源数据</p>
              </div>
            </div>
          </div>

          <!-- AI配置面板 -->
          <div v-if="activeTab === 'ai-config'" class="tab-panel">
            <div class="panel-header">
              <h3>内容聚合策略配置</h3>
              <p class="panel-description">配置AI模型参数和API设置，用于文章内容聚合、摘要生成和知识图谱构建</p>
            </div>
            
            <div class="config-section">
              <div class="config-group">
                <h4>基础配置</h4>
                
                <div class="form-group">
                  <label>默认模型:</label>
                  <select v-model="aiConfig.defaultModel" class="form-input form-select">
                    <option value="zhipuai">智谱AI (GLM)</option>
                    <option value="deepseek">DeepSeek</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label>模型版本:</label>
                  <select v-model="aiConfig.modelVersion" class="form-input form-select">
                    <option v-if="aiConfig.defaultModel === 'zhipuai'" value="GLM-4">GLM-4</option>
                    <option v-if="aiConfig.defaultModel === 'zhipuai'" value="GLM-4-Flash">GLM-4-Flash</option>
                    <option v-if="aiConfig.defaultModel === 'zhipuai'" value="GLM-3-Turbo">GLM-3-Turbo</option>
                    <option v-if="aiConfig.defaultModel === 'deepseek'" value="deepseek-chat">DeepSeek Chat</option>
                    <option v-if="aiConfig.defaultModel === 'deepseek'" value="deepseek-coder">DeepSeek Coder</option>
                  </select>
                </div>
              </div>
              
              <div class="config-group">
                <h4>API设置</h4>
                
                <div class="form-group">
                  <label>API端点URL:</label>
                  <input 
                    type="text" 
                    v-model="aiConfig.apiUrl" 
                    class="form-input"
                    :placeholder="aiConfig.defaultModel === 'zhipuai' ? 'https://open.bigmodel.cn/api/paas' : 'https://api.deepseek.com'"
                  />
                </div>
                
                <div class="form-group">
                  <label>API密钥:</label>
                  <div class="api-key-field">
                    <input 
                      :type="showApiKey ? 'text' : 'password'" 
                      v-model="aiConfig.apiKey" 
                      class="form-input"
                      placeholder="输入API密钥" 
                    />
                    <button 
                      type="button" 
                      class="visibility-toggle" 
                      @click="showApiKey = !showApiKey"
                    >
                      {{ showApiKey ? '隐藏' : '显示' }}
                    </button>
                  </div>
                </div>
                
                <div class="form-group">
                  <button 
                    type="button" 
                    class="btn btn-primary"
                    @click="testAiConnection"
                    :disabled="testingConnection"
                  >
                    {{ testingConnection ? '测试中...' : '测试连接' }}
                  </button>
                  
                  <div v-if="aiTestResult" class="connection-result" :class="{ 'success': aiTestResult.success, 'error': !aiTestResult.success }">
                    <AppIcon 
                      :icon="aiTestResult.success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'" 
                      :size="ICON_SIZES.SM" 
                    />
                    <span>{{ aiTestResult.message }}</span>
                  </div>
                </div>
              </div>
              
              <div class="config-group">
                <h4>高级选项</h4>
                
                <div class="form-group">
                  <label>请求超时 (秒):</label>
                  <input type="number" v-model.number="aiConfig.timeout" min="1" max="120" class="form-input" />
                </div>
                
                <div class="form-group">
                  <label>最大令牌数:</label>
                  <input type="number" v-model.number="aiConfig.maxTokens" min="100" max="8000" class="form-input" />
                </div>
                
                <div class="form-group">
                  <label>温度参数 (0.0-1.0):</label>
                  <input type="number" v-model.number="aiConfig.temperature" min="0" max="1" step="0.1" class="form-input" />
                </div>
                
                <div class="form-group switch-control">
                  <label>流式响应:</label>
                  <label class="switch">
                    <input type="checkbox" v-model="aiConfig.streamResponse">
                    <span class="slider round"></span>
                  </label>
                  <span class="switch-label">{{ aiConfig.streamResponse ? '开启' : '关闭' }}</span>
                </div>
              </div>
              
              <div class="action-buttons">
                <button type="button" class="btn btn-secondary" @click="resetAiConfig">
                  重置为默认值
                </button>
                <button type="button" class="btn btn-primary" @click="saveAiConfig">
                  保存配置
                </button>
              </div>
            </div>
          </div>

          <!-- 知识关联算法配置面板 -->
          <div v-if="activeTab === 'knowledge-algo'" class="tab-panel">
            <div class="panel-header">
              <p class="panel-description">调整知识图谱和内容关联的算法参数</p>
            </div>
            
            <div class="ai-config-form">
              <div class="config-section">
                <h4 class="section-title">
                  <AppIcon icon="fas fa-book-reader" :size="ICON_SIZES.SM" />
                  AI阅读助手快捷提示词
                </h4>
                
                <div class="form-group">
                  <label>文章阅读页快捷提示词</label>
                  <div class="reader-prompts-list">
                    <div 
                      v-for="(prompt, index) in readerPrompts.quickPrompts" 
                      :key="index"
                      class="prompt-item"
                    >
                      <input 
                        type="text" 
                        v-model="readerPrompts.quickPrompts[index]" 
                        class="form-input"
                        placeholder="输入快捷提示词"
                      />
                      <button 
                        type="button" 
                        class="btn-remove" 
                        @click="removePrompt(index)"
                        aria-label="删除提示词"
                      >
                        <AppIcon icon="fas fa-times" :size="ICON_SIZES.XS" />
                      </button>
                    </div>
                    
                    <button 
                      type="button" 
                      class="btn-add" 
                      @click="addPrompt"
                      v-if="readerPrompts.quickPrompts.length < 8"
                    >
                      <AppIcon icon="fas fa-plus" :size="ICON_SIZES.XS" />
                      添加提示词
                    </button>
                  </div>
                  <div class="form-help">这些提示词将显示在文章阅读页面底部的AI助手快捷按钮中</div>
                </div>
              </div>

              <div class="form-actions">
                <button 
                  type="button" 
                  class="btn btn-secondary"
                  @click="resetConfigs"
                >
                  重置
                </button>
                <button 
                  type="button" 
                  class="btn btn-primary"
                  @click="saveConfigs"
                >
                  保存配置
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ICONS, ICON_SIZES } from '@/constants/icons'
import AppIcon from '@/components/common/AppIcon.vue'
import { ElMessage } from 'element-plus'
import { AdminService } from '@/services/adminService'
import type { AdminUser, RssSourceStatus } from '@/api/types/admin'

// 修改接口定义，使其与后端返回的AdminUser类型兼容
interface User extends AdminUser {
  // 继承AdminUser接口中的所有字段
}

// 响应式数据
const activeTab = ref('users')
const userSearchQuery = ref('')
const isLoadingUsers = ref(false)
const isLoadingRss = ref(false)

const stats = ref({
  userCount: 0,
  rssCount: 0,
  articleCount: 0,
  conceptCount: 0
})

const systemStatus = ref({
  apiResponseTime: 45,
  memoryUsage: 68
})

const aiConfig = ref({
  defaultModel: 'zhipuai',
  modelVersion: 'GLM-4-Flash',
  apiUrl: 'https://open.bigmodel.cn/api/paas',
  apiKey: '',
  timeout: 10,
  maxTokens: 2000,
  streamResponse: true,
  temperature: 0.7
})

const knowledgeConfig = ref({
  extractPrompt: '请从以下内容中抽取重要的知识实体:\n\n{{content}}',
  relationPrompt: '请分析以下实体之间的关联关系:\n\n{{entities}}',
  summaryPrompt: '请对以下内容进行简洁摘要:\n\n{{content}}',
  similarityThreshold: 0.75,
  maxRelatedNodes: 20,
  enableAutoRelation: true
})

const showApiKey = ref(false)
const testingConnection = ref(false)
const aiTestResult = ref<{ success: boolean; message: string } | null>(null)

const users = ref<User[]>([])
const rssSources = ref<RssSourceStatus[]>([])

const readerPrompts = ref({
  quickPrompts: [
    '总结这篇文章的主要内容',
    '提取文章的关键观点',
    '解释文章中的专业术语',
    '分析文章的论证逻辑',
    '这篇文章有什么启发？'
  ]
})

const tabs = [
  { key: 'users', label: '用户管理', icon: 'fas fa-users' },
  { key: 'rss', label: 'RSS源监控', icon: 'fas fa-rss' },
  { key: 'ai-config', label: '内容聚合策略配置', icon: 'fas fa-robot' },
  { key: 'knowledge-algo', label: '知识关联算法配置', icon: 'fas fa-brain' }
]

// 计算属性
const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return users.value
  
  const query = userSearchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.username.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query)
  )
})

// 方法
const formatRoles = (roles: string[]) => {
  return roles.map(role => {
    switch(role) {
      case 'ROLE_ADMIN': return '管理员'
      case 'ROLE_USER': return '用户'
      case 'ROLE_PREMIUM': return '高级用户'
      default: return role
    }
  }).join(', ')
}

const getRoleClass = (roles: string[]) => {
  if (roles.includes('ROLE_ADMIN')) return 'admin'
  if (roles.includes('ROLE_PREMIUM')) return 'premium'
  return 'user'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatRelativeTime = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (minutes < 24 * 60) {
    const hours = Math.floor(minutes / 60)
    return `${hours}小时前`
  } else {
    const days = Math.floor(minutes / (24 * 60))
    return `${days}天前`
  }
}

/**
 * 重置AI配置
 */
const resetAiConfig = async () => {
  if (confirm('确定要重置为默认配置吗？此操作不可撤销。')) {
    try {
      aiConfig.value = AdminService.getDefaultAiConfig()
      ElMessage.success('AI配置已重置为默认值')
    } catch (error) {
      console.error('重置AI配置失败:', error)
      ElMessage.error('重置AI配置失败')
    }
  }
}

/**
 * 重置知识关联配置
 */
const resetKnowledgeConfig = async () => {
  if (confirm('确定要重置为默认配置吗？此操作不可撤销。')) {
    try {
      // 这里可以使用从后端获取的默认配置，也可以使用本地硬编码的默认值
      knowledgeConfig.value = {
        extractPrompt: '从文本中提取关键概念和实体',
        relationPrompt: '分析两个概念之间的关系',
        summaryPrompt: '生成一个简短的摘要',
        similarityThreshold: 0.5,
        maxRelatedNodes: 5,
        enableAutoRelation: true
      }
      ElMessage.success('知识关联配置已重置为默认值')
    } catch (error) {
      console.error('重置知识关联配置失败:', error)
      ElMessage.error('重置知识关联配置失败')
    }
  }
}

const saveAiConfig = async () => {
  try {
    const updatedConfig = await AdminService.updateAiConfig(aiConfig.value)
    aiConfig.value = updatedConfig
    alert('AI配置保存成功')
  } catch (error) {
    console.error('保存AI配置失败:', error)
    alert('保存失败: ' + (error instanceof Error ? error.message : String(error)))
  }
}

const saveKnowledgeConfig = async () => {
  try {
    const updatedConfig = await AdminService.updateKnowledgeConfig(knowledgeConfig.value)
    knowledgeConfig.value = updatedConfig
    alert('知识关联配置保存成功')
  } catch (error) {
    console.error('保存知识关联配置失败:', error)
    alert('保存失败: ' + (error instanceof Error ? error.message : String(error)))
  }
}

const testAiConnection = async () => {
  testingConnection.value = true
  aiTestResult.value = null
  
  try {
    const result = await AdminService.testAiConnection(aiConfig.value)
    aiTestResult.value = {
      success: result.success,
      message: result.message
    }
  } catch (error) {
    aiTestResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '连接测试失败'
    }
  } finally {
    testingConnection.value = false
  }
}

const updateUserStatus = async (userId: string | number, enabled: boolean) => {
  try {
    const success = await AdminService.updateUserStatus(String(userId), enabled)
    if (success) {
      // 更新本地用户数据
      const userIndex = users.value.findIndex(u => String(u.id) === String(userId))
      if (userIndex !== -1) {
        users.value[userIndex].enabled = enabled
      }
    }
  } catch (error) {
    console.error('更新用户状态失败:', error)
  }
}

const loadUsers = async (query?: string) => {
  isLoadingUsers.value = true
  try {
    const { users: userList } = await AdminService.getUserList(query)
    users.value = userList
  } catch (error) {
    console.error('加载用户列表失败:', error)
  } finally {
    isLoadingUsers.value = false
  }
}

const loadRssSources = async () => {
  isLoadingRss.value = true
  try {
    const { sources } = await AdminService.getRssSourcesStatus()
    rssSources.value = sources
  } catch (error) {
    console.error('加载RSS源状态失败:', error)
  } finally {
    isLoadingRss.value = false
  }
}

// 加载 AI 配置
const loadAiConfig = async () => {
  try {
    const config = await AdminService.getAiConfig()
    aiConfig.value = config
  } catch (error) {
    console.error('加载AI配置失败:', error)
    // 加载失败时使用默认配置
    resetAiConfig()
  }
}

// 加载知识关联配置
const loadKnowledgeConfig = async () => {
  try {
    const config = await AdminService.getKnowledgeConfig()
    knowledgeConfig.value = config
  } catch (error) {
    console.error('加载知识关联配置失败:', error)
    // 加载失败时使用默认配置
    resetKnowledgeConfig()
  }
}

// 加载阅读助手提示词配置
const loadReaderAssistantPrompts = async () => {
  try {
    const config = await AdminService.getReaderAssistantPrompts()
    readerPrompts.value = config
  } catch (error) {
    console.error('加载阅读助手提示词配置失败:', error)
    // 加载失败时使用默认配置
    readerPrompts.value = AdminService.getDefaultReaderAssistantPrompts()
  }
}

const addPrompt = () => {
  if (readerPrompts.value.quickPrompts.length < 8) {
    readerPrompts.value.quickPrompts.push('')
  }
}

const removePrompt = (index: number) => {
  readerPrompts.value.quickPrompts.splice(index, 1)
}

const resetConfigs = () => {
  // 重置知识关联配置
  resetKnowledgeConfig()
  
  // 重置阅读助手提示词配置
  resetReaderAssistantPrompts()
}

const saveConfigs = async () => {
  try {
    // 保存知识关联配置
    const updatedKnowledgeConfig = await AdminService.updateKnowledgeConfig(knowledgeConfig.value)
    knowledgeConfig.value = updatedKnowledgeConfig
    
    // 保存阅读助手提示词配置
    const updatedReaderPrompts = await AdminService.updateReaderAssistantPrompts(readerPrompts.value)
    readerPrompts.value = updatedReaderPrompts
    
    alert('所有配置保存成功')
  } catch (error) {
    console.error('保存配置失败:', error)
    alert('保存失败: ' + (error instanceof Error ? error.message : String(error)))
  }
}

/**
 * 重置AI阅读助手提示词配置
 */
const resetReaderAssistantPrompts = async () => {
  if (confirm('确定要重置为默认配置吗？此操作不可撤销。')) {
    try {
      // 使用硬编码的默认提示词
      readerPrompts.value = AdminService.getDefaultReaderAssistantPrompts()
      ElMessage.success('AI阅读助手提示词已重置为默认值')
    } catch (error) {
      console.error('重置AI阅读助手提示词失败:', error)
      ElMessage.error('重置AI阅读助手提示词失败')
    }
  }
}

// 生命周期
onMounted(async () => {
  try {
    // 加载系统统计数据
    const systemStats = await AdminService.getSystemStats()
    stats.value = systemStats
    
    // 加载用户列表
    await loadUsers()
    
    // 加载RSS源列表
    await loadRssSources()
    
    // 加载AI配置
    await loadAiConfig()
    
    // 加载知识关联配置
    await loadKnowledgeConfig()
    
    // 加载阅读助手提示词配置
    await loadReaderAssistantPrompts()
    
  } catch (error) {
    console.error('加载数据失败:', error)
    // 加载失败时显示默认值
    stats.value = {
      userCount: 0,
      rssCount: 0,
      articleCount: 0,
      conceptCount: 0
    }
  }
})
</script>

<style lang="scss" scoped>
.admin-page {
  padding: calc(var(--spacing-unit) * 6);
  max-width: 1400px;
  margin: 0 auto;
  background: var(--color-bg-primary);
}

.page-header {
  margin-bottom: calc(var(--spacing-unit) * 8);

  .page-title {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing-unit) * 3);
    font-size: 28px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: calc(var(--spacing-unit) * 2);

    .title-icon {
      color: var(--color-accent-primary);
    }
  }

  .page-subtitle {
    color: var(--color-text-secondary);
    font-size: 14px;
    margin: 0;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--spacing-unit) * 4);
  margin-bottom: calc(var(--spacing-unit) * 8);
}

.stat-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-l);
  padding: calc(var(--spacing-unit) * 5);
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 4);
  transition: all var(--transition-speed-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-l);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    background: var(--color-accent-primary);
    border-radius: var(--border-radius-m);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .stat-content {
    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin-top: calc(var(--spacing-unit) * 1);
    }
  }
}

.management-section {
  .section-header {
    margin-bottom: calc(var(--spacing-unit) * 4);

    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }
  }
}

.tabs-container {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-l);
  overflow: hidden;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid var(--color-border-primary);
  background: var(--color-bg-tertiary);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 4) calc(var(--spacing-unit) * 5);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  border-bottom: 2px solid transparent;

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }

  &.active {
    background: var(--color-bg-secondary);
    color: var(--color-accent-primary);
    border-bottom-color: var(--color-accent-primary);
  }
}

.tab-content {
  .tab-panel {
    padding: calc(var(--spacing-unit) * 6);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: calc(var(--spacing-unit) * 4);
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
}

.search-box {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  min-width: 240px;

  input {
    border: none;
    background: transparent;
    outline: none;
    color: var(--color-text-primary);
    font-size: 14px;
    flex: 1;

    &::placeholder {
      color: var(--color-text-disabled);
    }
  }
}

.data-table {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  overflow: hidden;

  table {
    width: 100%;
    border-collapse: collapse;

    th {
      background: var(--color-bg-tertiary);
      padding: calc(var(--spacing-unit) * 4);
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-secondary);
      border-bottom: 1px solid var(--color-border-primary);
    }

    td {
      padding: calc(var(--spacing-unit) * 4);
      border-bottom: 1px solid var(--color-border-primary);
      font-size: 14px;
      color: var(--color-text-primary);

      &:last-child {
        text-align: right;
      }
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover {
      background: var(--color-bg-hover);
    }
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);

  .user-avatar {
    width: 32px;
    height: 32px;
    background: var(--color-accent-primary);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 500;
  }
}

.rss-info {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);

  .rss-icon {
    color: var(--color-accent-primary);
  }

  .rss-title {
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .rss-url {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-top: 2px;
  }
}

.role-badge, .status-badge {
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  border-radius: calc(var(--border-radius-m) / 2);
  font-size: 12px;
  font-weight: 500;

  &.admin {
    background: rgba(220, 38, 127, 0.1);
    color: #dc267f;
  }

  &.premium {
    background: rgba(255, 193, 7, 0.1);
    color: #ffc107;
  }

  &.user {
    background: rgba(108, 117, 125, 0.1);
    color: #6c757d;
  }

  &.active {
    background: rgba(40, 167, 69, 0.1);
    color: #28a745;
  }

  &.inactive {
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
  }
}

.system-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--spacing-unit) * 4);
}

.status-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 4);

  .status-header {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing-unit) * 2);
    margin-bottom: calc(var(--spacing-unit) * 3);
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .status-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);

    &.success {
      color: #28a745;
    }
  }
}

.ai-config-form {
  .config-section {
    margin-bottom: calc(var(--spacing-unit) * 6);

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: calc(var(--spacing-unit) * 2);
    }

    textarea {
      width: 100%;
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border-primary);
      border-radius: var(--border-radius-m);
      padding: calc(var(--spacing-unit) * 2);
      color: var(--color-text-primary);
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      min-height: 100px;
      transition: all var(--transition-speed-fast);

      &:focus {
        outline: none;
        border-color: var(--color-accent-primary);
        box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.2);
      }

      &::placeholder {
        color: var(--color-text-disabled);
      }
    }
  }

  .form-group {
    margin-bottom: calc(var(--spacing-unit) * 4);

    label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: calc(var(--spacing-unit) * 1);
    }

    input[type="text"],
    input[type="password"],
    input[type="number"],
    select {
      width: 100%;
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border-primary);
      border-radius: var(--border-radius-m);
      padding: calc(var(--spacing-unit) * 2);
      color: var(--color-text-primary);
      font-size: 14px;
      transition: all var(--transition-speed-fast);

      &:focus {
        outline: none;
        border-color: var(--color-accent-primary);
        box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.2);
      }

      &::placeholder {
        color: var(--color-text-disabled);
      }
    }

    .select-wrapper {
      width: 100%;
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border-primary);
      border-radius: var(--border-radius-m);
      padding: calc(var(--spacing-unit) * 2);
      
      select {
        width: 100%;
        background: transparent;
        border: none;
        padding: 0;
        
        option {
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
        }
      }
    }

    .api-key-field {
      position: relative;
      width: 100%;
      
      input {
        width: 100%;
        padding-right: 60px;
      }
      
      .visibility-toggle {
        position: absolute;
        right: 2px;
        top: 50%;
        transform: translateY(-50%);
        padding: 5px 10px;
        background: transparent;
        border: none;
        color: var(--color-text-secondary);
        cursor: pointer;
        font-size: 12px;
        
        &:hover {
          color: var(--color-accent-primary);
        }
      }
    }
  }

  .form-actions {
    margin-top: calc(var(--spacing-unit) * 6);
    display: flex;
    justify-content: flex-end;
    gap: calc(var(--spacing-unit) * 4);

    .btn-secondary, .btn-primary {
      padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 4);
      border: none;
      border-radius: var(--border-radius-m);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-speed-fast);

      &:hover {
        background: var(--color-bg-hover);
      }
    }

    .btn-secondary {
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    .btn-primary {
      background: var(--color-accent-primary);
      color: white;
    }
  }
}

.config-test {
  margin-top: calc(var(--spacing-unit) * 6);

  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: calc(var(--spacing-unit) * 2);
  }

  .section-description {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin-bottom: calc(var(--spacing-unit) * 4);
  }

  .btn-test {
    padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 4);
    background: var(--color-accent-primary);
    color: white;
    border: none;
    border-radius: var(--border-radius-m);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-speed-fast);

    &:hover {
      background: var(--color-bg-hover);
    }

    &:disabled {
      background: var(--color-bg-disabled);
      cursor: not-allowed;
    }
  }

  .test-result {
    margin-top: calc(var(--spacing-unit) * 4);
    padding: calc(var(--spacing-unit) * 4);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius-m);

    .status {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: calc(var(--spacing-unit) * 2);

      &.success {
        color: #28a745;
      }

      &.error {
        color: #dc3545;
      }
    }

    .message {
      font-size: 14px;
      color: var(--color-text-secondary);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .admin-page {
    padding: calc(var(--spacing-unit) * 4);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .tab-buttons {
    flex-direction: column;
  }

  .panel-header {
    flex-direction: column;
    align-items: stretch;
    gap: calc(var(--spacing-unit) * 4);
  }

  .data-table {
    overflow-x: auto;
  }
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(var(--spacing-unit) * 8) 0;
  color: var(--color-text-secondary);
  gap: calc(var(--spacing-unit) * 3);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(var(--spacing-unit) * 8) 0;
  color: var(--color-text-secondary);
  gap: calc(var(--spacing-unit) * 3);
}

.status-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 3);
  border-radius: var(--border-radius-s);
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
}

.status-toggle-btn:hover {
  background: var(--color-bg-hover);
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 4);
  border-radius: var(--border-radius-m);
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: calc(var(--spacing-unit) * 1);
  font-size: 12px;
  color: var(--color-text-danger);
}

.reader-prompts-list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
  width: 100%;
  
  .prompt-item {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing-unit) * 2);
    
    .form-input {
      flex: 1;
    }
    
    .btn-remove {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 24px;
      height: 24px;
      background: rgba(220, 53, 69, 0.1);
      color: #dc3545;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(220, 53, 69, 0.2);
      }
    }
  }
  
  .btn-add {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: calc(var(--spacing-unit) * 2);
    padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 4);
    margin-top: calc(var(--spacing-unit) * 2);
    background: var(--color-bg-tertiary);
    border: 1px dashed var(--color-border-primary);
    border-radius: var(--border-radius-m);
    color: var(--color-text-secondary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    align-self: flex-start;
    
    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
  }
}

.form-help {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: calc(var(--spacing-unit) * 1);
}

.connection-result {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: var(--border-radius-m);
  font-size: 14px;
  
  &.success {
    background: rgba(40, 167, 69, 0.1);
    color: #28a745;
  }
  
  &.error {
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
  }
}

.form-input {
  width: 100%;
  padding: calc(var(--spacing-unit) * 2.5) calc(var(--spacing-unit) * 3.5);
  font-size: 14px;
  color: var(--color-text-primary);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  transition: border-color var(--transition-speed-fast), box-shadow var(--transition-speed-fast), background-color var(--transition-speed-fast);
  outline: none;

  &:focus {
    border-color: var(--color-accent-primary);
    background-color: var(--color-bg-tertiary);
    box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.1);
  }

  &::placeholder {
    color: var(--color-text-disabled);
  }
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23A8A8B3' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right calc(var(--spacing-unit) * 2.5) center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  padding-right: calc(var(--spacing-unit) * 8);
}

.api-key-field {
  display: flex;
  align-items: center;
  width: 100%;

  .form-input {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: none;
  }

  .visibility-toggle {
    height: 100%;
    padding: calc(var(--spacing-unit) * 2.5) calc(var(--spacing-unit) * 3.5);
    background-color: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-primary);
    border-left: none;
    color: var(--color-text-secondary);
    font-size: 14px;
    cursor: pointer;
    border-top-right-radius: var(--border-radius-m);
    border-bottom-right-radius: var(--border-radius-m);
    transition: all var(--transition-speed-fast);

    &:hover {
      background-color: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--spacing-unit) * 2.5) calc(var(--spacing-unit) * 5);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--border-radius-m);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  border: none;
  
  &.btn-primary {
    background-color: var(--color-accent-primary);
    color: white;
    
    &:hover:not(:disabled) {
      background-color: var(--color-accent-primary-hover);
    }
  }
  
  &.btn-secondary {
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-primary);
    
    &:hover:not(:disabled) {
      background-color: var(--color-bg-hover);
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--spacing-unit) * 4);
  margin-top: calc(var(--spacing-unit) * 6);
}

.form-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: 3px;
  outline: none;
  border: none;
  box-shadow: none;
  cursor: pointer;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: var(--color-accent-primary);
    border-radius: 50%;
    cursor: pointer;
    transition: all var(--transition-speed-fast);
    
    &:hover {
      background: var(--color-accent-primary-hover);
      transform: scale(1.1);
    }
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: var(--color-accent-primary);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all var(--transition-speed-fast);
    
    &:hover {
      background: var(--color-accent-primary-hover);
      transform: scale(1.1);
    }
  }
}

.form-textarea {
  width: 100%;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  padding: calc(var(--spacing-unit) * 3);
  
  &:focus {
    border-color: var(--color-accent-primary);
    outline: none;
    box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.1);
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--spacing-unit) * 4);
  margin-top: calc(var(--spacing-unit) * 6);
}
</style> 