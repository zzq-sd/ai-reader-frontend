<template>
  <div class="rsshub-view">
    <div class="header">
      <h2>RSSHub 集成</h2>
      <p class="description">
        通过RSSHub，您可以订阅几乎任何网站的内容更新，即使该网站没有提供RSS源。
      </p>
    </div>
    
    <el-tabs v-model="activeTab" class="main-tabs">
      <el-tab-pane label="添加RSSHub源" name="add">
        <div class="add-source-container">
          <el-row :gutter="20">
            <el-col :span="14">
              <el-card class="form-card">
                <template #header>
                  <div class="card-header">
                    <span>添加RSSHub源</span>
                    <el-button type="primary" size="small" @click="showPopularRoutes">
                      浏览热门路由
                    </el-button>
                  </div>
                </template>
                <RsshubRouteSelector @source-added="handleSourceAdded" />
              </el-card>
            </el-col>
            
            <el-col :span="10">
              <el-card class="info-card">
                <template #header>
                  <div class="card-header">
                    <span>什么是RSSHub?</span>
                  </div>
                </template>
                <div class="rsshub-info">
                  <p>RSSHub 是一个开源、简单易用、易于扩展的 RSS 生成器，可以给任何奇奇怪怪的内容生成 RSS 订阅源。</p>
                  <p>目前已支持数百个网站的内容订阅，包括微博、知乎、B站、36氪等。</p>
                  
                  <h4>RSSHub路由格式</h4>
                  <p>RSSHub路由采用以下格式：<code>/网站名/分类/参数1/参数2/...</code></p>
                  <p>例如：<code>/zhihu/daily</code> 表示订阅知乎日报</p>
                  
                  <h4>常用参数</h4>
                  <ul>
                    <li><code>mode=fulltext</code>：获取全文内容</li>
                    <li><code>limit=10</code>：限制条目数量</li>
                    <li><code>filter=关键词</code>：过滤条目</li>
                  </ul>
                  
                  <p>
                    <a href="https://docs.rsshub.app/" target="_blank">
                      访问RSSHub文档了解更多 →
                    </a>
                  </p>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="我的RSSHub源" name="my">
        <div class="my-sources-container">
          <el-table
            v-loading="loading"
            :data="rsshubSources"
            style="width: 100%"
            row-key="id"
          >
            <el-table-column prop="name" label="名称" min-width="200">
              <template #default="{ row }">
                <div class="source-name">
                  {{ row.name }}
                  <el-tag size="small" type="info" v-if="row.isRsshub">RSSHub</el-tag>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="category" label="分类" width="120">
              <template #default="{ row }">
                <el-tag>{{ row.category || '未分类' }}</el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="url" label="URL" min-width="300">
              <template #default="{ row }">
                <div class="url-container">
                  <span class="url-text">{{ row.url }}</span>
                  <el-button size="small" type="primary" text @click="copyUrl(row.url)">
                    复制
                  </el-button>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="lastFetchedAt" label="最后更新" width="180">
              <template #default="{ row }">
                {{ formatDate(row.lastFetchedAt) }}
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="fetchSource(row.id)">
                  立即抓取
                </el-button>
                <el-button size="small" type="danger" @click="deleteSource(row.id)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import RsshubRouteSelector from '../components/rss/RsshubRouteSelector.vue'
import { rssService } from '../api/services/rssService'
import type { RssSource } from '../api/types/rss'

// 标签页
const activeTab = ref('add')

// 数据加载状态
const loading = ref(false)

// 我的RSS源
const rssSources = ref<RssSource[]>([])

// RSSHub源
const rsshubSources = computed(() => {
  return rssSources.value.filter(source => 
    source.url.includes('rsshub.app') || 
    source.url.includes('localhost:1200')
  )
})

// 显示热门路由
function showPopularRoutes() {
  // 实际实现中调用路由选择器组件的方法
  ElMessage.info('显示热门路由')
}

// 处理添加源
function handleSourceAdded(source: RssSource) {
  ElMessage.success(`成功添加RSS源: ${source.name}`)
  loadRssSources()
  activeTab.value = 'my'
}

// 加载RSS源
async function loadRssSources() {
  loading.value = true
  try {
    rssSources.value = await rssService.getUserFeeds()
  } catch (error) {
    console.error('加载RSS源失败:', error)
    ElMessage.error('加载RSS源失败')
  } finally {
    loading.value = false
  }
}

// 复制URL
function copyUrl(url: string) {
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('URL已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制URL失败')
  })
}

// 抓取源
async function fetchSource(sourceId: string) {
  try {
    const result = await rssService.fetchFeed(sourceId)
    ElMessage.success(`成功抓取${result.count}篇文章`)
    loadRssSources()
  } catch (error) {
    console.error('抓取RSS源失败:', error)
    ElMessage.error('抓取RSS源失败')
  }
}

// 删除源
async function deleteSource(sourceId: string) {
  try {
    await rssService.deleteFeed(sourceId)
    ElMessage.success('删除RSS源成功')
    loadRssSources()
  } catch (error) {
    console.error('删除RSS源失败:', error)
    ElMessage.error('删除RSS源失败')
  }
}

// 格式化日期
function formatDate(dateString?: string) {
  if (!dateString) return '从未更新'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 组件挂载时加载RSS源
onMounted(() => {
  loadRssSources()
})
</script>

<style scoped>
.rsshub-view {
  padding: 1rem;
}

.header {
  margin-bottom: 2rem;
}

.description {
  color: #666;
  max-width: 800px;
}

.main-tabs {
  margin-top: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-card, .info-card {
  margin-bottom: 1rem;
  height: 100%;
}

.rsshub-info {
  font-size: 0.9rem;
  line-height: 1.6;
}

.rsshub-info h4 {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.rsshub-info code {
  background-color: #f8f8f8;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
}

.rsshub-info ul {
  padding-left: 1.5rem;
}

.source-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.url-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.url-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
  display: inline-block;
}
</style> 