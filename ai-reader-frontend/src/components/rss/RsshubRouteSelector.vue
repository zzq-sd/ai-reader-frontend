<template>
  <div class="rsshub-route-selector">
    <!-- 快捷操作区域 -->
    <div class="quick-actions-bar">
      <button 
        class="action-btn secondary" 
        @click="showPopularRoutes = true"
        title="浏览热门路由"
      >
        <AppIcon :icon="ICONS.RSS.POPULAR" :size="ICON_SIZES.SM" />
        热门路由
      </button>
      <button 
        class="action-btn secondary" 
        @click="checkInstancesHealth"
        :disabled="checkingHealth"
        title="检查实例状态"
      >
        <AppIcon 
          :icon="ICONS.RSS.HEALTH" 
          :size="ICON_SIZES.SM" 
          :spin="checkingHealth"
        />
        {{ checkingHealth ? '检查中...' : '实例状态' }}
      </button>
    </div>

    <!-- 实例选择区域 -->
    <div class="instance-section">
      <div class="section-header">
        <label class="section-label">
          <AppIcon :icon="ICONS.RSS.INSTANCE" :size="ICON_SIZES.SM" />
          RSSHub实例
        </label>
        <div class="instance-status">
          <div 
            v-for="instance in instances" 
            :key="instance.url"
            class="status-indicator"
            :class="{ 
              'status-healthy': instance.isHealthy === true,
              'status-unhealthy': instance.isHealthy === false,
              'status-unknown': instance.isHealthy === undefined
            }"
            :title="`${instance.name}: ${getInstanceStatusText(instance)}`"
          ></div>
        </div>
      </div>
      
      <div class="instance-selector">
        <div 
          v-for="instance in instances" 
          :key="instance.url"
          class="instance-option"
          :class="{ 'selected': selectedInstance === instance.url }"
          @click="selectedInstance = instance.url"
        >
          <div class="instance-info">
            <div class="instance-name">{{ instance.name }}</div>
            <div class="instance-url">{{ instance.url }}</div>
          </div>
          <div class="instance-status-detail">
            <div 
              class="status-dot"
              :class="{ 
                'status-healthy': instance.isHealthy === true,
                'status-unhealthy': instance.isHealthy === false,
                'status-unknown': instance.isHealthy === undefined
              }"
            ></div>
            <span class="status-text">{{ getInstanceStatusText(instance) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 路由输入区域 -->
    <div class="route-section">
      <div class="section-header">
        <label class="section-label">
          <AppIcon :icon="ICONS.RSS.ROUTE" :size="ICON_SIZES.SM" />
          RSSHub路由
        </label>
        <div class="route-actions">
          <button 
            class="action-btn small" 
            @click="showPopularRoutes = true"
            title="从热门路由选择"
          >
            <AppIcon :icon="ICONS.RSS.BROWSE" :size="ICON_SIZES.XS" />
            浏览
          </button>
        </div>
      </div>
      
      <div class="route-input-group">
        <div class="route-input-container">
          <div class="input-prefix">{{ selectedInstance }}</div>
          <input
            v-model="routeInput"
            type="text"
            class="route-input"
            placeholder="/zhihu/daily"
            @input="onRouteInput"
            @blur="validateRoute"
            @keyup.enter="validateRoute"
          />
          <button 
            class="validate-btn"
            @click="validateRoute"
            :disabled="!routeInput || validating"
            :class="{ 
              'validating': validating,
              'valid': routeValidated && routeValid,
              'invalid': routeValidated && !routeValid
            }"
          >
            <AppIcon 
              v-if="validating"
              :icon="ICONS.NOTIFICATION.LOADING" 
              :size="ICON_SIZES.SM" 
              :spin="true"
            />
            <AppIcon 
              v-else-if="routeValidated && routeValid"
              :icon="ICONS.NOTIFICATION.SUCCESS" 
              :size="ICON_SIZES.SM"
              :color="ICON_COLORS.SUCCESS"
            />
            <AppIcon 
              v-else-if="routeValidated && !routeValid"
              :icon="ICONS.NOTIFICATION.ERROR" 
              :size="ICON_SIZES.SM"
              :color="ICON_COLORS.DANGER"
            />
            <AppIcon 
              v-else
              :icon="ICONS.RSS.VALIDATE" 
              :size="ICON_SIZES.SM"
            />
          </button>
        </div>
        
        <!-- 路由验证状态 -->
        <div v-if="routeValidated" class="route-status">
          <div v-if="routeValid" class="status-message success">
            <AppIcon :icon="ICONS.NOTIFICATION.SUCCESS" :size="ICON_SIZES.SM" />
            <span>路由验证成功，可以正常获取RSS内容</span>
          </div>
          <div v-else class="status-message error">
            <AppIcon :icon="ICONS.NOTIFICATION.ERROR" :size="ICON_SIZES.SM" />
            <span>路由验证失败，请检查路由格式或实例状态。如果您能在浏览器直接访问此路由，可以强制添加。</span>
          </div>
        </div>
      </div>
    </div>

    <!-- RSS源配置区域 -->
    <div class="config-section">
      <div class="section-header">
        <label class="section-label">
          <AppIcon :icon="ICONS.RSS.CONFIG" :size="ICON_SIZES.SM" />
          RSS源配置
        </label>
      </div>
      
      <div class="config-grid">
        <div class="config-group">
          <label class="config-label">源名称</label>
          <input
            v-model="name"
            type="text"
            class="config-input"
            placeholder="自动获取或手动输入"
          />
        </div>
        
        <div class="config-group">
          <label class="config-label">分类</label>
          <select v-model="category" class="config-input config-select">
            <option value="">选择分类</option>
            <option value="tech">技术开发</option>
            <option value="news">新闻资讯</option>
            <option value="design">设计创意</option>
            <option value="business">商业财经</option>
            <option value="lifestyle">生活方式</option>
            <option value="entertainment">娱乐休闲</option>
            <option value="science">科学科技</option>
            <option value="other">其他</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 高级参数区域 -->
    <div class="params-section">
      <div class="section-header">
        <label class="section-label">
          <AppIcon :icon="ICONS.RSS.PARAMS" :size="ICON_SIZES.SM" />
          高级参数
        </label>
        <button 
          class="toggle-btn"
          @click="showAdvancedParams = !showAdvancedParams"
          :class="{ 'expanded': showAdvancedParams }"
        >
          <AppIcon :icon="ICONS.ACTION.EXPAND" :size="ICON_SIZES.XS" />
        </button>
      </div>
      
      <Transition name="params-expand">
        <div v-show="showAdvancedParams" class="params-content">
          <div class="params-grid">
            <div class="param-group">
              <div class="param-header">
                <label class="param-label">获取全文</label>
                <div class="param-switch">
                  <input 
                    id="fulltext-switch"
                    v-model="fulltext" 
                    type="checkbox" 
                    class="switch-input"
                  />
                  <label for="fulltext-switch" class="switch-label">
                    <span class="switch-slider"></span>
                  </label>
                </div>
              </div>
              <p class="param-hint">开启后尝试获取文章全文内容</p>
            </div>
            
            <div class="param-group">
              <label class="param-label">条目数量</label>
              <div class="number-input-group">
                <button 
                  class="number-btn"
                  @click="limit = Math.max(1, limit - 1)"
                  :disabled="limit <= 1"
                >
                  <AppIcon :icon="ICONS.ACTION.MINUS" :size="ICON_SIZES.XS" />
                </button>
                <input
                  v-model.number="limit"
                  type="number"
                  class="number-input"
                  min="1"
                  max="100"
                />
                <button 
                  class="number-btn"
                  @click="limit = Math.min(100, limit + 1)"
                  :disabled="limit >= 100"
                >
                  <AppIcon :icon="ICONS.ACTION.PLUS" :size="ICON_SIZES.XS" />
                </button>
              </div>
              <p class="param-hint">每次获取的文章数量 (1-100)</p>
            </div>
            
            <div class="param-group full-width">
              <label class="param-label">标题过滤</label>
              <input
                v-model="filterTitle"
                type="text"
                class="config-input"
                placeholder="筛选标题中包含特定关键词的文章"
              />
              <p class="param-hint">只获取标题包含指定关键词的文章</p>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 操作按钮区域 -->
    <div class="actions-section">
      <button 
        class="btn btn-secondary"
        @click="resetForm"
        :disabled="adding"
      >
        <AppIcon :icon="ICONS.ACTION.RESET" :size="ICON_SIZES.SM" />
        重置
      </button>
      
      <button 
        v-if="!routeValid && routeValidated && routeInput"
        class="btn btn-warning"
        @click="forceAddSource"
        :disabled="adding"
      >
        <AppIcon 
          v-if="adding"
          :icon="ICONS.NOTIFICATION.LOADING" 
          :size="ICON_SIZES.SM" 
          :spin="true"
        />
        <AppIcon 
          v-else
          :icon="ICONS.RSS.ADD" 
          :size="ICON_SIZES.SM"
        />
        强制添加
      </button>
      
      <button 
        class="btn btn-primary"
        @click="addRsshubSource"
        :disabled="!routeValid || adding"
      >
        <AppIcon 
          v-if="adding"
          :icon="ICONS.NOTIFICATION.LOADING" 
          :size="ICON_SIZES.SM" 
          :spin="true"
        />
        <AppIcon 
          v-else
          :icon="ICONS.RSS.ADD" 
          :size="ICON_SIZES.SM"
        />
        {{ adding ? '添加中...' : '添加RSS源' }}
      </button>
    </div>

    <!-- 热门路由选择弹窗 -->
    <div v-if="showPopularRoutes" class="modal-overlay" @click="showPopularRoutes = false">
      <div class="modal-container popular-routes-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            <AppIcon :icon="ICONS.RSS.POPULAR" :size="ICON_SIZES.SM" />
            热门RSSHub路由
          </h3>
          <button class="close-btn" @click="showPopularRoutes = false">
            <AppIcon :icon="ICONS.ACTION.CLOSE" :size="ICON_SIZES.SM" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="route-categories">
            <div class="category-tabs">
              <button
                v-for="category in popularRoutes"
                :key="category.name"
                class="category-tab"
                :class="{ 'active': routeCategory === category.name }"
                @click="routeCategory = category.name"
              >
                {{ category.name }}
              </button>
            </div>
            
            <div class="routes-content">
              <div 
                v-for="category in popularRoutes" 
                :key="category.name"
                v-show="routeCategory === category.name"
                class="route-list"
              >
                <div 
                  v-for="route in category.routes" 
                  :key="route.path"
                  class="route-card"
                  @click="selectRoute(route)"
                >
                  <div class="route-header">
                    <h4 class="route-title">{{ route.title }}</h4>
                    <div class="route-path">{{ route.path }}</div>
                  </div>
                  <p class="route-description">{{ route.description }}</p>
                  <div v-if="route.params" class="route-params">
                    <span class="params-label">需要参数:</span>
                    <span 
                      v-for="param in route.params" 
                      :key="param"
                      class="param-tag"
                    >
                      {{ param }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { ICONS, ICON_SIZES, ICON_COLORS } from '@/constants/icons'
import { enhancedRsshubService } from '@/services/enhancedRsshubService'
import type { RssSource } from '@/api/types/rss'
import AppIcon from '@/components/common/AppIcon.vue'

// 实例列表
const instances = ref([
  { 
    name: 'RSSHub公共实例', 
    url: 'https://rsshub.app',
    isHealthy: undefined as boolean | undefined
  },
  { 
    name: '自建实例', 
    url: 'http://localhost:1200',
    isHealthy: undefined as boolean | undefined
  }
])
const selectedInstance = ref('https://rsshub.app')

// 表单数据
const routeInput = ref('')
const name = ref('')
const category = ref('')
const fulltext = ref(true)
const limit = ref(20)
const filterTitle = ref('')

// 路由验证状态
const validating = ref(false)
const routeValidated = ref(false)
const routeValid = ref(false)

// 添加状态
const adding = ref(false)

// UI状态
const showAdvancedParams = ref(false)
const showPopularRoutes = ref(false)
const routeCategory = ref('社交媒体')
const checkingHealth = ref(false)

// 热门路由
const popularRoutes = ref([
  {
    name: '社交媒体',
    routes: [
      { title: '微博热搜榜', path: '/weibo/search/hot', description: '实时获取微博热搜榜单' },
      { title: '知乎日报', path: '/zhihu/daily', description: '知乎日报文章更新' },
      { title: '知乎热榜', path: '/zhihu/hotlist', description: '实时获取知乎热榜话题' },
      { title: '微博用户', path: '/weibo/user/:uid', description: '获取微博用户最新微博', params: ['uid'] }
    ]
  },
  {
    name: '新闻资讯',
    routes: [
      { title: '36氪快讯', path: '/36kr/newsflashes', description: '36氪快讯最新文章' },
      { title: '财新网', path: '/caixin/latest', description: '财新网最新文章' },
      { title: 'BBC中文网', path: '/bbc/chinese', description: 'BBC中文网最新文章' }
    ]
  },
  {
    name: '科技开发',
    routes: [
      { title: 'Hacker News', path: '/hackernews', description: 'Hacker News最新文章' },
      { title: 'GitHub趋势', path: '/github/trending/:since/:language?', description: 'GitHub趋势榜', params: ['since', 'language'] },
      { title: 'V2EX最新主题', path: '/v2ex/topics/latest', description: 'V2EX最新主题' }
    ]
  }
])

// 计算最终路由
const finalRoute = computed(() => {
  const route = routeInput.value
  
  // 参数对象
  const params: Record<string, string> = {}
  
  // 添加fulltext参数
  if (fulltext.value) {
    params.mode = 'fulltext'
  }
  
  // 添加limit参数
  if (limit.value !== 20) {
    params.limit = String(limit.value)
  }
  
  // 添加filterTitle参数
  if (filterTitle.value) {
    params.filterTitle = filterTitle.value
  }
  
  return { route, params }
})

// 获取实例状态文本
const getInstanceStatusText = (instance: any) => {
  if (instance.isHealthy === true) return '正常'
  if (instance.isHealthy === false) return '异常'
  return '未知'
}

// 路由输入处理
const onRouteInput = () => {
  routeValidated.value = false
  routeValid.value = false
  
  // 自动添加/前缀
  if (routeInput.value && !routeInput.value.startsWith('/')) {
    routeInput.value = '/' + routeInput.value
  }
}

// 验证路由
const validateRoute = async () => {
  if (!routeInput.value) {
    routeValidated.value = false
    return
  }
  
  validating.value = true
  try {
    // 切换实例
    enhancedRsshubService.setInstances([selectedInstance.value])
    
    // 验证路由
    routeValid.value = await enhancedRsshubService.validateRoute(routeInput.value)
    routeValidated.value = true
    
    // 自动生成名称
    if (!name.value && routeValid.value) {
      try {
        const feed = await enhancedRsshubService.fetchFeed(routeInput.value)
        name.value = feed.title
      } catch (e) {
        // 获取Feed失败，不自动设置名称
      }
    }
  } catch (error) {
    console.error('验证RSSHub路由失败:', error)
    routeValid.value = false
    routeValidated.value = true
  } finally {
    validating.value = false
  }
}

// 添加RSSHub源
const addRsshubSource = async () => {
  if (!routeValid.value) {
    return
  }
  
  adding.value = true
  try {
    // 构建路由参数和查询参数
    const routeParams: Record<string, string> = {}
    const queryParams: Record<string, string> = {}
    
    // 添加高级参数
    if (fulltext.value) {
      queryParams.mode = 'fulltext'
    }
    
    if (limit.value !== 20) {
      queryParams.limit = String(limit.value)
    }
    
    if (filterTitle.value) {
      queryParams.filterTitle = filterTitle.value
    }
    
    // 使用高级方法添加源
    const source = await enhancedRsshubService.addAdvancedRsshubSource(
      routeInput.value,
      routeParams,
      queryParams,
      name.value,
      category.value
    )
    
    // 触发事件
    emit('source-added', source)
    
    // 重置表单
    resetForm()
  } catch (error) {
    console.error('添加RSSHub源失败:', error)
  } finally {
    adding.value = false
  }
}

// 重置表单
const resetForm = () => {
  routeInput.value = ''
  name.value = ''
  category.value = ''
  fulltext.value = true
  limit.value = 20
  filterTitle.value = ''
  routeValidated.value = false
  routeValid.value = false
  showAdvancedParams.value = false
}

// 选择路由
const selectRoute = (route: any) => {
  if (route.params) {
    showParamDialog(route)
  } else {
    routeInput.value = route.path
    name.value = route.title
    showPopularRoutes.value = false
    validateRoute()
  }
}

// 参数输入弹窗
const showParamDialog = (route: any) => {
  const params = route.params.map((p: string) => prompt(`请输入参数 ${p}:`))
  
  if (params.every((p: string) => p !== null)) {
    let finalPath = route.path
    route.params.forEach((p: string, i: number) => {
      finalPath = finalPath.replace(`:${p}`, params[i])
    })
    
    routeInput.value = finalPath
    name.value = route.title
    showPopularRoutes.value = false
    validateRoute()
  }
}

// 检查实例健康状态
const checkInstancesHealth = async () => {
  checkingHealth.value = true
  try {
    for (const instance of instances.value) {
      instance.isHealthy = await enhancedRsshubService.checkInstanceHealth(instance.url)
    }
  } catch (error) {
    console.error('检查实例健康状态失败:', error)
  } finally {
    checkingHealth.value = false
  }
}

// 强制添加RSSHub源
const forceAddSource = async () => {
  if (!routeInput.value) {
    return
  }
  
  adding.value = true
  try {
    // 构建路由参数和查询参数
    const routeParams: Record<string, string> = {}
    const queryParams: Record<string, string> = {}
    
    // 添加高级参数
    if (fulltext.value) {
      queryParams.mode = 'fulltext'
    }
    
    if (limit.value !== 20) {
      queryParams.limit = String(limit.value)
    }
    
    if (filterTitle.value) {
      queryParams.filterTitle = filterTitle.value
    }
    
    // 使用高级方法添加源
    const source = await enhancedRsshubService.addAdvancedRsshubSource(
      routeInput.value,
      routeParams,
      queryParams,
      name.value || `RSSHub: ${routeInput.value}`, // 确保有名称
      category.value
    )
    
    // 触发事件
    emit('source-added', source)
    
    // 重置表单
    resetForm()
  } catch (error) {
    console.error('强制添加RSSHub源失败:', error)
  } finally {
    adding.value = false
  }
}

// 定义事件
const emit = defineEmits<{
  (e: 'source-added', source: RssSource): void
}>()

// 组件挂载时检查实例健康状态
onMounted(() => {
  checkInstancesHealth()
})
</script>

<style lang="scss" scoped>
.rsshub-route-selector {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 6);
  padding: calc(var(--spacing-unit) * 6);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-m);
}

// 快捷操作区域
.quick-actions-bar {
  display: flex;
  gap: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 4);
  justify-content: flex-end;
}

// 通用区域样式
.instance-section,
.route-section,
.config-section,
.params-section {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  padding: calc(var(--spacing-unit) * 6);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.section-label {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

// 实例选择区域
.instance-status {
  display: flex;
  gap: calc(var(--spacing-unit) * 1);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  
  &.status-healthy {
    background-color: #10B981;
  }
  
  &.status-unhealthy {
    background-color: #EF4444;
  }
  
  &.status-unknown {
    background-color: var(--color-text-disabled);
  }
}

.instance-selector {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
}

.instance-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: calc(var(--spacing-unit) * 4);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    border-color: var(--color-border-secondary);
    background: var(--color-bg-hover);
  }
  
  &.selected {
    border-color: var(--color-accent-primary);
    background: rgba(139, 92, 246, 0.1);
  }
}

.instance-info {
  flex: 1;
}

.instance-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: calc(var(--spacing-unit) * 1);
}

.instance-url {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
}

.instance-status-detail {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  
  &.status-healthy {
    background-color: #10B981;
  }
  
  &.status-unhealthy {
    background-color: #EF4444;
  }
  
  &.status-unknown {
    background-color: var(--color-text-disabled);
  }
}

.status-text {
  font-size: 12px;
  color: var(--color-text-secondary);
}

// 路由输入区域
.route-actions {
  display: flex;
  gap: calc(var(--spacing-unit) * 2);
}

.route-input-group {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 3);
}

.route-input-container {
  display: flex;
  align-items: center;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  overflow: hidden;
  transition: border-color var(--transition-speed-fast);
  
  &:focus-within {
    border-color: var(--color-accent-primary);
  }
}

.input-prefix {
  padding: calc(var(--spacing-unit) * 3);
  background: var(--color-bg-hover);
  border-right: 1px solid var(--color-border-primary);
  font-size: 12px;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.route-input {
  flex: 1;
  padding: calc(var(--spacing-unit) * 3);
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 14px;
  font-family: var(--font-mono);
  outline: none;
  
  &::placeholder {
    color: var(--color-text-disabled);
  }
}

.validate-btn {
  padding: calc(var(--spacing-unit) * 3);
  background: var(--color-bg-hover);
  border: none;
  border-left: 1px solid var(--color-border-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover:not(:disabled) {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.validating {
    color: var(--color-accent-primary);
  }
  
  &.valid {
    color: #10B981;
    background: rgba(16, 185, 129, 0.1);
  }
  
  &.invalid {
    color: #EF4444;
    background: rgba(239, 68, 68, 0.1);
  }
}

.route-status {
  margin-top: calc(var(--spacing-unit) * 2);
}

.status-message {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 3);
  border-radius: var(--border-radius-s);
  font-size: 13px;
  
  &.success {
    background: rgba(16, 185, 129, 0.1);
    color: #10B981;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  
  &.error {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
}

// 配置区域
.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(var(--spacing-unit) * 4);
}

.config-group {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
}

.config-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.config-input {
  padding: calc(var(--spacing-unit) * 3);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color var(--transition-speed-fast);
  
  &:focus {
    border-color: var(--color-accent-primary);
  }
  
  &::placeholder {
    color: var(--color-text-disabled);
  }
}

.config-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B6B70' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right calc(var(--spacing-unit) * 2) center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  padding-right: calc(var(--spacing-unit) * 8);
}

// 高级参数区域
.toggle-btn {
  width: 24px;
  height: 24px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-border-secondary);
  }
  
  &.expanded {
    transform: rotate(180deg);
    background: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: white;
  }
}

.params-content {
  overflow: hidden;
}

.params-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(var(--spacing-unit) * 4);
}

.param-group {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
  
  &.full-width {
    grid-column: 1 / -1;
  }
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.param-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.param-hint {
  font-size: 11px;
  color: var(--color-text-disabled);
  line-height: 1.4;
  margin: 0;
}

// 开关样式
.param-switch {
  position: relative;
}

.switch-input {
  display: none;
}

.switch-label {
  display: block;
  width: 40px;
  height: 20px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 10px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  position: relative;
}

.switch-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  transition: all var(--transition-speed-fast);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.switch-input:checked + .switch-label {
  background: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
}

.switch-input:checked + .switch-label .switch-slider {
  transform: translateX(20px);
}

// 数字输入组
.number-input-group {
  display: flex;
  align-items: center;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  overflow: hidden;
}

.number-btn {
  width: 32px;
  height: 32px;
  background: var(--color-bg-hover);
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:first-child {
    border-right: 1px solid var(--color-border-primary);
  }
  
  &:last-child {
    border-left: 1px solid var(--color-border-primary);
  }
}

.number-input {
  flex: 1;
  padding: calc(var(--spacing-unit) * 2);
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 14px;
  text-align: center;
  outline: none;
  min-width: 60px;
}

// 按钮样式
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  text-decoration: none;
  
  &:hover:not(:disabled) {
    background: var(--color-bg-hover);
    border-color: var(--color-border-secondary);
    color: var(--color-text-primary);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.secondary {
    background: var(--color-bg-secondary);
  }
  
  &.small {
    padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
    font-size: 11px;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing-unit) * 2);
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 4);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--border-radius-s);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  text-decoration: none;
  
  &.btn-primary {
    background: var(--color-accent-primary);
    color: white;
    border-color: var(--color-accent-primary);
    
    &:hover:not(:disabled) {
      background: #6B46C1;
      transform: translateY(-1px);
    }
  }
  
  &.btn-secondary {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border-color: var(--color-border-primary);
    
    &:hover:not(:disabled) {
      background: var(--color-bg-hover);
      border-color: var(--color-border-secondary);
    }
  }
  
  &.btn-warning {
    background: #F59E0B;
    color: white;
    border-color: #F59E0B;
    
    &:hover:not(:disabled) {
      background: #D97706;
      transform: translateY(-1px);
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
}

// 操作区域
.actions-section {
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--spacing-unit) * 3);
  padding-top: calc(var(--spacing-unit) * 4);
  border-top: 1px solid var(--color-border-primary);
}

// 模态框样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-m);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.popular-routes-modal {
  max-width: 1000px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--spacing-unit) * 6);
  border-bottom: 1px solid var(--color-border-primary);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
}

.close-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

.modal-body {
  flex: 1;
  overflow: hidden;
}

// 路由分类
.route-categories {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.category-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border-primary);
  background: var(--color-bg-tertiary);
}

.category-tab {
  padding: calc(var(--spacing-unit) * 4) calc(var(--spacing-unit) * 6);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  border-bottom: 2px solid transparent;
  
  &:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-hover);
  }
  
  &.active {
    color: var(--color-accent-primary);
    border-bottom-color: var(--color-accent-primary);
    background: var(--color-bg-secondary);
  }
}

.routes-content {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--spacing-unit) * 6);
}

.route-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: calc(var(--spacing-unit) * 4);
}

.route-card {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-s);
  padding: calc(var(--spacing-unit) * 4);
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    border-color: var(--color-border-secondary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.route-header {
  margin-bottom: calc(var(--spacing-unit) * 3);
}

.route-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 calc(var(--spacing-unit) * 2) 0;
}

.route-path {
  font-size: 12px;
  color: var(--color-accent-primary);
  font-family: var(--font-mono);
  background: rgba(139, 92, 246, 0.1);
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  border-radius: calc(var(--border-radius-s) / 2);
  display: inline-block;
}

.route-description {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0 0 calc(var(--spacing-unit) * 3) 0;
}

.route-params {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 2);
  flex-wrap: wrap;
}

.params-label {
  font-size: 11px;
  color: var(--color-text-disabled);
}

.param-tag {
  font-size: 10px;
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
  border-radius: calc(var(--border-radius-s) / 2);
  font-family: var(--font-mono);
}

// 动画
.params-expand-enter-active,
.params-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.params-expand-enter-from,
.params-expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.params-expand-enter-to,
.params-expand-leave-from {
  max-height: 300px;
  opacity: 1;
  transform: translateY(0);
}

// 响应式设计
@media (max-width: 768px) {
  .quick-actions-bar {
    justify-content: center;
  }
  
  .config-grid,
  .params-grid {
    grid-template-columns: 1fr;
  }
  
  .param-group.full-width {
    grid-column: 1;
  }
  
  .actions-section {
    flex-direction: column;
  }
  
  .route-list {
    grid-template-columns: 1fr;
  }
  
  .category-tabs {
    flex-wrap: wrap;
  }
  
  .input-prefix {
    max-width: 120px;
    font-size: 10px;
  }
}
</style> 