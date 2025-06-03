<template>
  <div class="category-container">
    <header class="page-header-category">
      <div>
        <h1 class="category-title-main">
          <i :class="categoryConfig.icon"></i>{{ categoryConfig.title }}
        </h1>
        <p class="category-description">{{ categoryConfig.description }}</p>
      </div>
      <div class="header-actions-category">
        <button class="btn-category-action" @click="manageCategoryFeeds">
          <i class="fas fa-rss"></i>管理此分类源
        </button>
        <button class="btn-category-action primary" @click="addFeedToCategory">
          <i class="fas fa-plus"></i>添加新源到此分类
        </button>
      </div>
    </header>

    <section class="feeds-section">
      <h2 class="section-title-category">订阅源列表 ({{ feeds.length }})</h2>
      <div class="feeds-grid-category" ref="feedsGridRef">
        <div 
          v-for="(feed, index) in feeds" 
          :key="feed.id"
          class="feed-card-category"
          :style="{ animationDelay: `${index * 0.07}s` }"
        >
          <div class="feed-actions-category">
            <button class="action-btn-feed" @click="refreshFeed(feed)" title="刷新">
              <i class="fas fa-sync-alt"></i>
            </button>
            <button class="action-btn-feed" @click="configureFeed(feed)" title="设置">
              <i class="fas fa-cog"></i>
            </button>
          </div>
          <div class="feed-header-category">
            <div class="feed-icon-category">
              <img 
                v-if="feed.icon" 
                :src="feed.icon" 
                :alt="feed.name"
                @error="handleImageError"
              >
              <i v-else :class="feed.defaultIcon || 'fas fa-rss'"></i>
            </div>
            <div class="feed-info-category">
              <div class="feed-name-category">
                {{ feed.name }} 
                <span 
                  :class="['feed-status-indicator', feed.status]"
                  :title="getStatusText(feed.status)"
                ></span>
              </div>
              <div class="feed-url-category">{{ feed.url }}</div>
            </div>
          </div>
          <div class="feed-stats-category">
            <div class="stat-item-category">
              <div class="stat-value-category">{{ feed.totalArticles }}</div>
              <div class="stat-label-category">总文章</div>
            </div>
            <div class="stat-item-category">
              <div class="stat-value-category">{{ feed.unreadCount }}</div>
              <div class="stat-label-category">未读</div>
            </div>
            <div class="stat-item-category">
              <div class="stat-value-category">{{ feed.lastUpdate }}</div>
              <div class="stat-label-category">上次更新</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="latest-articles-preview">
      <h2 class="section-title-category">此分类最新文章</h2>
      <div ref="latestArticlesRef">
        <a 
          v-for="(article, index) in latestArticles" 
          :key="article.id"
          href="#" 
          class="article-item-preview"
          :style="{ 
            opacity: 0, 
            transform: 'translateY(10px)',
            transitionDelay: `${0.3 + index * 0.1}s`
          }"
          @click.prevent="openArticle(article)"
        >
          <div class="article-preview-content">
            <h3 class="article-preview-title">{{ article.title }}</h3>
            <div class="article-preview-meta">
              <span class="article-preview-source">{{ article.source }}</span> 
              &bull; 
              <span>{{ article.timeAgo }}</span>
            </div>
          </div>
        </a>
      </div>
    </section>

    <!-- 添加RSS源模态框 -->
    <Transition name="modal">
      <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">添加RSS源到"{{ categoryConfig.title }}"</h2>
            <button class="modal-close" @click="closeAddModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitAddFeed">
              <div class="form-group">
                <label class="form-label" for="feedUrl">RSS源URL *</label>
                <input 
                  type="url" 
                  id="feedUrl" 
                  v-model="newFeed.url"
                  class="form-input" 
                  placeholder="https://example.com/feed.xml"
                  required
                >
              </div>
              <div class="form-group">
                <label class="form-label" for="feedName">自定义名称</label>
                <input 
                  type="text" 
                  id="feedName" 
                  v-model="newFeed.name"
                  class="form-input" 
                  placeholder="可选，默认使用源标题"
                >
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeAddModal">取消</button>
            <button class="btn btn-primary" @click="submitAddFeed" :disabled="isSubmitting">
              <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
              {{ isSubmitting ? '添加中...' : '添加RSS源' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 成功提示 -->
    <Transition name="toast">
      <div v-if="showToast" class="toast-notification">
        <i class="fas fa-check-circle"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

// 类型定义
interface Feed {
  id: string
  name: string
  url: string
  icon?: string
  defaultIcon?: string
  status: 'active' | 'error' | 'updating'
  totalArticles: string
  unreadCount: number
  lastUpdate: string
}

interface Article {
  id: string
  title: string
  source: string
  timeAgo: string
  url: string
}

interface CategoryConfig {
  title: string
  description: string
  icon: string
  accentColor: string
  type: string
}

// Props
const props = defineProps<{
  categoryType: 'tech' | 'news' | 'design' | 'business'
}>()

// Router
const router = useRouter()

// 响应式数据
const showAddModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const isSubmitting = ref(false)
const feedsGridRef = ref<HTMLElement>()
const latestArticlesRef = ref<HTMLElement>()

const newFeed = reactive({
  url: '',
  name: ''
})

// 分类配置
const categoryConfigs: Record<string, CategoryConfig> = {
  tech: {
    title: '技术博客',
    description: '追踪前沿技术动态，学习深度开发技巧。',
    icon: 'fas fa-laptop-code',
    accentColor: '#3B82F6',
    type: 'tech'
  },
  news: {
    title: '新闻资讯',
    description: '获取全球热点、深度报道和即时新闻更新。',
    icon: 'far fa-newspaper',
    accentColor: '#F59E0B',
    type: 'news'
  },
  design: {
    title: '设计灵感',
    description: '发现创意设计、UI/UX趋势和视觉艺术。',
    icon: 'fas fa-palette',
    accentColor: '#EC4899',
    type: 'design'
  },
  business: {
    title: '商业财经',
    description: '洞悉市场动态，把握商业脉搏，获取深度财经解读。',
    icon: 'fas fa-chart-pie',
    accentColor: '#10B981',
    type: 'business'
  }
}

// 计算属性
const categoryConfig = computed(() => categoryConfigs[props.categoryType])

// 模拟数据
const feeds = ref<Feed[]>([])
const latestArticles = ref<Article[]>([])

// 方法
const loadMockData = () => {
  // 根据分类类型加载不同的模拟数据
  const feedsData: Record<string, Feed[]> = {
    tech: [
      {
        id: '1',
        name: 'Vue.js Official Blog',
        url: 'blog.vuejs.org',
        icon: 'https://vuejs.org/images/logo.png',
        status: 'active',
        totalArticles: '128',
        unreadCount: 15,
        lastUpdate: '2h'
      },
      {
        id: '2',
        name: 'React Blog',
        url: 'reactjs.org/blog',
        icon: 'https://reactjs.org/favicon.ico',
        status: 'active',
        totalArticles: '97',
        unreadCount: 8,
        lastUpdate: '5h'
      },
      {
        id: '3',
        name: 'JavaScript Weekly',
        url: 'javascriptweekly.com',
        defaultIcon: 'fab fa-js-square',
        status: 'active',
        totalArticles: '300+',
        unreadCount: 25,
        lastUpdate: '1d'
      }
    ],
    news: [
      {
        id: '1',
        name: '纽约时报',
        url: 'nytimes.com/services/xml/rss/nyt/HomePage.xml',
        icon: 'https://placehold.co/40x40/1A1B1F/A8A8B3?text=NYT&font=inter',
        status: 'active',
        totalArticles: '350+',
        unreadCount: 45,
        lastUpdate: '15m'
      },
      {
        id: '2',
        name: 'BBC News',
        url: 'feeds.bbci.co.uk/news/rss.xml',
        icon: 'https://placehold.co/40x40/1A1B1F/A8A8B3?text=BBC&font=inter',
        status: 'active',
        totalArticles: '400+',
        unreadCount: 60,
        lastUpdate: '10m'
      },
      {
        id: '3',
        name: '路透社',
        url: 'reuters.com/tools/rss',
        defaultIcon: 'fas fa-globe-americas',
        status: 'active',
        totalArticles: '280+',
        unreadCount: 30,
        lastUpdate: '20m'
      }
    ],
    design: [
      {
        id: '1',
        name: 'Dribbble',
        url: 'dribbble.com/shots/popular/feed',
        icon: 'https://placehold.co/40x40/EC4899/FFFFFF?text=Db&font=inter',
        status: 'active',
        totalArticles: '1000+',
        unreadCount: 78,
        lastUpdate: '30m'
      },
      {
        id: '2',
        name: 'Behance Featured',
        url: 'behance.net/feeds/projects',
        icon: 'https://placehold.co/40x40/EC4899/FFFFFF?text=Be&font=inter',
        status: 'active',
        totalArticles: '500+',
        unreadCount: 42,
        lastUpdate: '1h'
      },
      {
        id: '3',
        name: 'Smashing Magazine',
        url: 'smashingmagazine.com/feed',
        defaultIcon: 'fas fa-pencil-ruler',
        status: 'active',
        totalArticles: '150+',
        unreadCount: 10,
        lastUpdate: '6h'
      }
    ],
    business: [
      {
        id: '1',
        name: '华尔街日报',
        url: 'wsj.com/xml/rss/3_7085.xml',
        icon: 'https://placehold.co/40x40/1A1B1F/A8A8B3?text=WSJ&font=inter',
        status: 'active',
        totalArticles: '215',
        unreadCount: 22,
        lastUpdate: '1h'
      },
      {
        id: '2',
        name: 'Bloomberg',
        url: 'bloomberg.com/opinion/authors.rss',
        icon: 'https://placehold.co/40x40/1A1B1F/A8A8B3?text=Bloom&font=inter',
        status: 'active',
        totalArticles: '180',
        unreadCount: 12,
        lastUpdate: '45m'
      },
      {
        id: '3',
        name: '财经杂志',
        url: 'caijing.com.cn/rss',
        defaultIcon: 'fas fa-landmark',
        status: 'active',
        totalArticles: '95',
        unreadCount: 5,
        lastUpdate: '3h'
      }
    ]
  }

  const articlesData: Record<string, Article[]> = {
    tech: [
      {
        id: '1',
        title: '探索 Vue 3.4 的新响应式核心与性能优化',
        source: 'Vue.js Official Blog',
        timeAgo: '30分钟前',
        url: '#'
      },
      {
        id: '2',
        title: 'React Server Components：原理与最佳实践',
        source: 'React Blog',
        timeAgo: '2小时前',
        url: '#'
      },
      {
        id: '3',
        title: 'ECMAScript 2024 新特性前瞻',
        source: 'JavaScript Weekly',
        timeAgo: '5小时前',
        url: '#'
      }
    ],
    news: [
      {
        id: '1',
        title: '国际局势分析：未来一周重点关注',
        source: '纽约时报',
        timeAgo: '5分钟前',
        url: '#'
      },
      {
        id: '2',
        title: '科技股财报前瞻：市场预期与潜在影响',
        source: 'BBC News',
        timeAgo: '25分钟前',
        url: '#'
      },
      {
        id: '3',
        title: '全球供应链调整对经济复苏的影响',
        source: '路透社',
        timeAgo: '45分钟前',
        url: '#'
      }
    ],
    design: [
      {
        id: '1',
        title: '探索玻璃拟态在移动应用中的美学',
        source: 'Dribbble',
        timeAgo: '15分钟前',
        url: '#'
      },
      {
        id: '2',
        title: '年度最佳品牌重塑案例分析',
        source: 'Behance Featured',
        timeAgo: '1小时前',
        url: '#'
      },
      {
        id: '3',
        title: '提升用户体验的10个UI动画技巧',
        source: 'Smashing Magazine',
        timeAgo: '3小时前',
        url: '#'
      }
    ],
    business: [
      {
        id: '1',
        title: '全球市场展望：下半年投资策略分析',
        source: '华尔街日报',
        timeAgo: '15分钟前',
        url: '#'
      },
      {
        id: '2',
        title: '科技巨头财报季：AI投资回报几何？',
        source: 'Bloomberg',
        timeAgo: '1小时前',
        url: '#'
      },
      {
        id: '3',
        title: '专访经济学家：解读当前宏观经济形势',
        source: '财经杂志',
        timeAgo: '3小时前',
        url: '#'
      }
    ]
  }

  feeds.value = feedsData[props.categoryType] || []
  latestArticles.value = articlesData[props.categoryType] || []
}

const manageCategoryFeeds = () => {
  router.push('/rss-management')
}

const addFeedToCategory = () => {
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  newFeed.url = ''
  newFeed.name = ''
}

const submitAddFeed = async () => {
  if (!newFeed.url) return

  isSubmitting.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 添加成功逻辑
    showToast.value = true
    toastMessage.value = 'RSS源添加成功！'
    
    setTimeout(() => {
      showToast.value = false
    }, 3000)
    
    closeAddModal()
  } catch (error) {
    console.error('添加RSS源失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

const refreshFeed = (feed: Feed) => {
  console.log('刷新RSS源:', feed.name)
}

const configureFeed = (feed: Feed) => {
  console.log('配置RSS源:', feed.name)
}

const openArticle = (article: Article) => {
  console.log('打开文章:', article.title)
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const getStatusText = (status: string) => {
  const statusMap = {
    active: '正常',
    error: '错误',
    updating: '更新中'
  }
  return statusMap[status as keyof typeof statusMap] || '未知'
}

const animateElements = async () => {
  await nextTick()
  
  // 动画RSS源卡片
  const feedCards = feedsGridRef.value?.querySelectorAll('.feed-card-category')
  feedCards?.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('loaded')
    }, 50 + index * 70)
  })

  // 动画文章预览
  const articlePreviews = latestArticlesRef.value?.querySelectorAll('.article-item-preview')
  articlePreviews?.forEach((item, index) => {
    const element = item as HTMLElement
    element.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out'
    setTimeout(() => {
      element.style.opacity = '1'
      element.style.transform = 'translateY(0)'
    }, 100)
  })
}

// 生命周期
onMounted(() => {
  loadMockData()
  animateElements()
  
  // 设置CSS变量for主题色
  document.documentElement.style.setProperty('--category-accent-color', categoryConfig.value.accentColor)
})
</script>

<style scoped lang="scss">
.category-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  opacity: 0;
  transform: translateY(15px);
  animation: pageFadeInUp 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

@keyframes pageFadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 页面头部 */
.page-header-category {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #25262B;
}

.category-title-main {
  font-size: 28px;
  font-weight: 700;
  color: #E1E1E6;
  display: flex;
  align-items: center;
  margin: 0;
  
  i {
    margin-right: 12px;
    color: var(--category-accent-color, #7B61FF);
  }
}

.category-description {
  font-size: 15px;
  color: #A8A8B3;
  margin-top: 4px;
}

.header-actions-category {
  display: flex;
  gap: 12px;
}

.btn-category-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid #25262B;
  cursor: pointer;
  transition: all 0.15s ease-out;
  background-color: #131417;
  color: #A8A8B3;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  text-decoration: none;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.07);
    border-color: #36373D;
    color: #E1E1E6;
    transform: translateY(-1px);
  }
  
  &.primary {
    background-color: var(--category-accent-color, #7B61FF);
    border-color: var(--category-accent-color, #7B61FF);
    color: white;
    
    &:hover {
      opacity: 0.9;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }
  }
}

/* 内容区域 */
.section-title-category {
  font-size: 20px;
  font-weight: 600;
  color: #E1E1E6;
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 1px solid #25262B;
}

.feeds-grid-category {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.feed-card-category {
  background-color: #131417;
  border: 1px solid #25262B;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.25s ease-out;
  position: relative;
  box-shadow: 0 2px 5px rgba(0,0,0,0.25);
  opacity: 0;
  transform: translateY(10px);
  
  &.loaded {
    opacity: 1;
    transform: translateY(0);
  }
  
  &:hover {
    border-color: #36373D;
    transform: translateY(-4px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }
}

.feed-actions-category {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}

.feed-card-category:hover .feed-actions-category {
  opacity: 1;
  transform: scale(1);
}

.action-btn-feed {
  background-color: #1A1B1F;
  border: 1px solid #25262B;
  color: #A8A8B3;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease-out;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-left: 4px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.07);
    color: #E1E1E6;
    border-color: #36373D;
    transform: scale(1.1);
  }
}

.feed-header-category {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.feed-icon-category {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background-color: #1A1B1F;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid #25262B;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 4px;
  }
  
  i {
    color: #A8A8B3;
    font-size: 18px;
  }
}

.feed-info-category {
  flex: 1;
  min-width: 0;
}

.feed-name-category {
  font-size: 15px;
  font-weight: 600;
  color: #E1E1E6;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}

.feed-url-category {
  font-size: 12px;
  color: #50505A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feed-status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 8px;
  display: inline-block;
  vertical-align: middle;
  
  &.active {
    background-color: #22C55E;
    box-shadow: 0 0 5px #22C55E;
  }
  
  &.error {
    background-color: #EF4444;
    box-shadow: 0 0 5px #EF4444;
  }
  
  &.updating {
    background-color: #F59E0B;
    box-shadow: 0 0 5px #F59E0B;
  }
}

.feed-stats-category {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #25262B;
}

.stat-item-category {
  text-align: center;
}

.stat-value-category {
  font-size: 16px;
  font-weight: 600;
  color: #E1E1E6;
  margin-bottom: 2px;
}

.stat-label-category {
  font-size: 10px;
  color: #50505A;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 最新文章 */
.latest-articles-preview {
  margin-top: 32px;
}

.article-item-preview {
  display: flex;
  align-items: flex-start;
  padding: 14px 0;
  border-bottom: 1px solid #25262B;
  transition: all 0.15s ease-out;
  cursor: pointer;
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.07);
    padding-left: 8px;
    padding-right: 8px;
  }
}

.article-preview-content {
  flex: 1;
  min-width: 0;
}

.article-preview-title {
  font-size: 14px;
  font-weight: 500;
  color: #E1E1E6;
  margin-bottom: 4px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.article-preview-meta {
  font-size: 12px;
  color: #A8A8B3;
  display: flex;
  align-items: center;
  gap: 8px;
}

.article-preview-source {
  color: var(--category-accent-color, #7B61FF);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: #131417;
  border: 1px solid #25262B;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  margin: 24px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #25262B;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #E1E1E6;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #A8A8B3;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease-out;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.07);
    color: #E1E1E6;
  }
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #E1E1E6;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background-color: #1A1B1F;
  border: 1px solid #25262B;
  border-radius: 4px;
  color: #E1E1E6;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease-out;
  
  &:focus {
    border-color: var(--category-accent-color, #7B61FF);
  }
  
  &::placeholder {
    color: #6B6B70;
  }
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid #25262B;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease-out;
  text-decoration: none;
  gap: 6px;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background-color: var(--category-accent-color, #7B61FF);
  color: white;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
}

.btn-secondary {
  background-color: #131417;
  color: #E1E1E6;
  border-color: #25262B;
  
  &:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.07);
    border-color: #36373D;
  }
}

/* Toast 通知 */
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #22C55E;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
}

/* 动画过渡 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.25s ease;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(-20px);
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

/* 响应式设计 */
@media (max-width: 768px) {
  .category-container {
    padding: 24px 16px;
  }
  
  .page-header-category {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .category-title-main {
    font-size: 24px;
  }
  
  .feeds-grid-category {
    grid-template-columns: 1fr;
  }
}
</style> 