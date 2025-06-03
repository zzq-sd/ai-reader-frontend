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
                />
              </div>
            </div>
            
            <div class="data-table">
              <table>
                <thead>
                  <tr>
                    <th>用户名</th>
                    <th>邮箱</th>
                    <th>角色</th>
                    <th>状态</th>
                    <th>注册时间</th>
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
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- RSS源管理 -->
          <div v-if="activeTab === 'rss'" class="tab-panel">
            <div class="panel-header">
              <h3>RSS源监控</h3>
            </div>
            
            <div class="data-table">
              <table>
                <thead>
                  <tr>
                    <th>RSS源</th>
                    <th>状态</th>
                    <th>文章数</th>
                    <th>最后更新</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rss in mockRssData" :key="rss.id">
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
                    </td>
                    <td>{{ rss.articleCount }}</td>
                    <td>{{ formatRelativeTime(rss.lastUpdate) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- AI配置面板 -->
          <div v-if="activeTab === 'ai-config'" class="tab-panel">
            <div class="panel-header">
              <h3>内容聚合策略配置</h3>
              <p class="panel-description">配置系统如何聚合和展示内容</p>
            </div>
            
            <div class="ai-config-form">
              <div class="config-section">
                <h4 class="section-title">
                  <AppIcon icon="fas fa-sliders-h" :size="ICON_SIZES.SM" />
                  基础配置
                </h4>
                
                <div class="form-group">
                  <label>默认模型</label>
                  <div class="select-wrapper">
                    <select v-model="aiConfig.defaultModel">
                      <option value="glm">智谱GLM</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="zhipu">智谱AI</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>模型版本</label>
                  <div class="select-wrapper">
                    <select v-model="aiConfig.modelVersion">
                      <option value="latest">最新版本</option>
                      <option value="4.0">4.0</option>
                      <option value="3.5">3.5</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="config-section">
                <h4 class="section-title">
                  <AppIcon icon="fas fa-key" :size="ICON_SIZES.SM" />
                  API设置
                </h4>
                
                <div class="form-group">
                  <label>API端点URL</label>
                  <input 
                    type="text" 
                    v-model="aiConfig.apiUrl" 
                    placeholder="例如: https://api.zhipu.ai/v1"
                  />
                </div>
                
                <div class="form-group">
                  <label>API密钥</label>
                  <div class="api-key-input">
                    <input 
                      :type="showApiKey ? 'text' : 'password'" 
                      v-model="aiConfig.apiKey" 
                      placeholder="输入API密钥"
                    />
                    <button 
                      type="button" 
                      class="toggle-visibility" 
                      @click="showApiKey = !showApiKey"
                    >
                      {{ showApiKey ? '隐藏' : '显示' }}
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="config-section">
                <h4 class="section-title">
                  <AppIcon icon="fas fa-cogs" :size="ICON_SIZES.SM" />
                  高级选项
                </h4>
                
                <div class="form-group">
                  <label>请求超时(秒)</label>
                  <input 
                    type="number" 
                    v-model="aiConfig.timeout" 
                    min="5" 
                    max="120"
                  />
                </div>
                
                <div class="form-group">
                  <label>最大令牌数</label>
                  <input 
                    type="number" 
                    v-model="aiConfig.maxTokens" 
                    min="100" 
                    max="4000"
                  />
                </div>
                
                <div class="form-group switch-group">
                  <label>流式响应</label>
                  <div class="switch">
                    <input 
                      type="checkbox" 
                      id="stream-toggle" 
                      v-model="aiConfig.streamResponse"
                    />
                    <label for="stream-toggle"></label>
                  </div>
                </div>
              </div>
              
              <div class="form-actions">
                <button 
                  type="button" 
                  class="btn-secondary"
                  @click="resetAiConfig"
                >
                  重置
                </button>
                <button 
                  type="button" 
                  class="btn-primary"
                  @click="saveAiConfig"
                >
                  保存配置
                </button>
              </div>
            </div>
            
            <div class="config-test">
              <h4 class="section-title">
                <AppIcon icon="fas fa-vial" :size="ICON_SIZES.SM" />
                测试连接
              </h4>
              <p class="section-description">发送测试请求检查AI服务连接状态</p>
              <button 
                type="button" 
                class="btn-test"
                @click="testAiConnection"
                :disabled="testingConnection"
              >
                {{ testingConnection ? '测试中...' : '测试连接' }}
              </button>
              
              <div class="test-result" v-if="aiTestResult">
                <div class="status" :class="aiTestResult.success ? 'success' : 'error'">
                  {{ aiTestResult.success ? '连接成功' : '连接失败' }}
                </div>
                <div class="message">{{ aiTestResult.message }}</div>
              </div>
            </div>
          </div>

          <!-- 知识关联算法配置面板 -->
          <div v-if="activeTab === 'knowledge-algo'" class="tab-panel">
            <div class="panel-header">
              <h3>知识关联算法配置</h3>
              <p class="panel-description">调整知识图谱和内容关联的算法参数</p>
        </div>
            
            <div class="ai-config-form">
              <div class="config-section">
                <h4 class="section-title">
                  <AppIcon icon="fas fa-brain" :size="ICON_SIZES.SM" />
                  AI提示词配置
                </h4>
                
                <div class="form-group">
                  <label>知识抽取提示词</label>
                  <textarea
                    v-model="knowledgeConfig.extractPrompt"
                    rows="4"
                    placeholder="输入用于知识抽取的提示词模板..."
                  ></textarea>
      </div>
                
                <div class="form-group">
                  <label>关系构建提示词</label>
                  <textarea
                    v-model="knowledgeConfig.relationPrompt"
                    rows="4"
                    placeholder="输入用于构建知识关系的提示词模板..."
                  ></textarea>
                </div>
                
                <div class="form-group">
                  <label>摘要生成提示词</label>
                  <textarea
                    v-model="knowledgeConfig.summaryPrompt"
                    rows="4"
                    placeholder="输入用于生成内容摘要的提示词模板..."
                  ></textarea>
                </div>
              </div>

              <div class="config-section">
                <h4 class="section-title">
                  <AppIcon icon="fas fa-cogs" :size="ICON_SIZES.SM" />
                  算法参数
                </h4>
                
                <div class="form-group">
                  <label>相似度阈值</label>
                  <input 
                    type="range" 
                    v-model="knowledgeConfig.similarityThreshold" 
                    min="0" 
                    max="1"
                    step="0.05"
                  />
                  <div class="range-value">{{knowledgeConfig.similarityThreshold}}</div>
                </div>
                
                <div class="form-group">
                  <label>最大关联节点数</label>
                  <input 
                    type="number" 
                    v-model="knowledgeConfig.maxRelatedNodes" 
                    min="1" 
                    max="100"
                  />
                </div>
                
                <div class="form-group switch-group">
                  <label>启用自动关联</label>
                  <div class="switch">
                    <input 
                      type="checkbox" 
                      id="auto-relate-toggle" 
                      v-model="knowledgeConfig.enableAutoRelation"
                    />
                    <label for="auto-relate-toggle"></label>
                  </div>
                </div>
              </div>
              
              <div class="form-actions">
                <button 
                  type="button" 
                  class="btn-secondary"
                  @click="resetKnowledgeConfig"
                >
                  重置
                </button>
                <button 
                  type="button" 
                  class="btn-primary"
                  @click="saveKnowledgeConfig"
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
import AppIcon from '@/components/common/AppIcon.vue'
import { ICONS, ICON_SIZES } from '@/constants/icons'

// 接口定义
interface User {
  id: string
  username: string
  email: string
  roles: string[]
  enabled: boolean
  createdAt: string
}

interface RssSource {
  id: string
  title: string
  url: string
  active: boolean
  articleCount: number
  lastUpdate: Date
}

// 响应式数据
const activeTab = ref('users')
const userSearchQuery = ref('')

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
  defaultModel: 'glm',
  modelVersion: 'latest',
  apiUrl: '',
  apiKey: '',
  timeout: 10,
  maxTokens: 1000,
  streamResponse: true
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

const mockUsers = ref<User[]>([
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    roles: ['ROLE_ADMIN'],
    enabled: true,
    createdAt: '2025-05-28T08:30:00Z'
  },
  {
    id: '2',
    username: 'zzq',
    email: 'zzq@example.com',
    roles: ['ROLE_USER'],
    enabled: true,
    createdAt: '2025-05-28T10:15:00Z'
  }
])

const mockRssData = ref<RssSource[]>([
  {
    id: '1',
    title: 'Tech News',
    url: 'https://example.com/tech-rss',
    active: true,
    articleCount: 156,
    lastUpdate: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    id: '2',
    title: 'Design Blog',
    url: 'https://example.com/design-rss',
    active: true,
    articleCount: 89,
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000)
  }
])

const tabs = [
  { key: 'users', label: '用户管理', icon: 'fas fa-users' },
  { key: 'rss', label: 'RSS源监控', icon: 'fas fa-rss' },
  { key: 'ai-config', label: '内容聚合策略配置', icon: 'fas fa-robot' },
  { key: 'knowledge-algo', label: '知识关联算法配置', icon: 'fas fa-brain' }
]

// 计算属性
const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return mockUsers.value
  
  const query = userSearchQuery.value.toLowerCase()
  return mockUsers.value.filter(user => 
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

const formatRelativeTime = (date: Date) => {
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

const resetAiConfig = () => {
  aiConfig.value = {
    defaultModel: 'glm',
    modelVersion: 'latest',
    apiUrl: '',
    apiKey: '',
    timeout: 10,
    maxTokens: 1000,
    streamResponse: true
  }
}

const resetKnowledgeConfig = () => {
  knowledgeConfig.value = {
    extractPrompt: '请从以下内容中抽取重要的知识实体:\n\n{{content}}',
    relationPrompt: '请分析以下实体之间的关联关系:\n\n{{entities}}',
    summaryPrompt: '请对以下内容进行简洁摘要:\n\n{{content}}',
    similarityThreshold: 0.75,
    maxRelatedNodes: 20,
    enableAutoRelation: true
  }
}

const saveAiConfig = () => {
  // 实现保存配置的逻辑
}

const saveKnowledgeConfig = () => {
  // 实现保存知识配置的逻辑
}

const testAiConnection = async () => {
  testingConnection.value = true
  try {
    // 实现测试连接的逻辑
    aiTestResult.value = { success: true, message: '连接成功' }
  } catch (error: any) {
    aiTestResult.value = { success: false, message: error.message || '连接失败' }
  } finally {
    testingConnection.value = false
  }
}

// 生命周期
onMounted(() => {
  // 模拟加载统计数据
  stats.value = {
    userCount: 4,
    rssCount: 10,
    articleCount: 197,
    conceptCount: 423
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
  align-items: center;
  justify-content: space-between;
  margin-bottom: calc(var(--spacing-unit) * 6);

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
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

    .api-key-input {
      position: relative;

      input {
        width: 100%;
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--border-radius-m);
        padding: calc(var(--spacing-unit) * 2);
        color: var(--color-text-primary);
      }

      .toggle-visibility {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        color: var(--color-text-secondary);
        cursor: pointer;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: var(--border-radius-s);
        
        &:hover {
          color: var(--color-accent-primary);
          background: rgba(123, 97, 255, 0.1);
          }
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
</style> 