<template>
  <div class="help-feedback-container">
    <!-- 帮助头部 -->
    <div class="help-header">
      <div class="header-content">
        <h1 class="page-title">
          <i class="fas fa-question-circle"></i>
          帮助与反馈
        </h1>
        <div class="header-desc">
          <p>遇到问题？查看常见问题解答或向我们反馈</p>
        </div>
      </div>
    </div>

    <!-- 帮助主体 -->
    <div class="help-main">
      <!-- 搜索框 -->
      <div class="search-section">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="搜索问题或关键词..."
            @input="filterFAQs"
          />
          <button 
            v-if="searchQuery"
            class="clear-search"
            @click="clearSearch"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- 快速导航 -->
      <div class="quick-nav">
        <div class="nav-title">快速导航</div>
        <div class="nav-categories">
          <button
            v-for="category in categories"
            :key="category.id"
            class="category-btn"
            :class="{ active: activeCategory === category.id }"
            @click="filterByCategory(category.id)"
          >
            <i :class="category.icon"></i>
            <span>{{ category.name }}</span>
            <span class="count">{{ category.count }}</span>
          </button>
        </div>
      </div>

      <!-- FAQ 部分 -->
      <div class="faq-section">
        <div class="section-header">
          <h2>常见问题</h2>
          <div class="faq-stats">
            <span>共 {{ filteredFAQs.length }} 个问题</span>
          </div>
        </div>

        <div class="faq-list">
          <div
            v-for="(faq, index) in filteredFAQs"
            :key="faq.id"
            class="faq-item"
            :class="{ expanded: expandedFAQs.includes(faq.id) }"
          >
            <div 
              class="faq-question"
              @click="toggleFAQ(faq.id)"
            >
              <div class="question-content">
                <div class="question-icon">
                  <i :class="faq.icon"></i>
                </div>
                <div class="question-text">
                  <h3>{{ faq.question }}</h3>
                  <div class="question-meta">
                    <span class="category">{{ faq.category }}</span>
                    <span class="views">{{ faq.views }} 次查看</span>
                  </div>
                </div>
              </div>
              <div class="expand-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </div>
            
            <Transition name="faq-expand">
              <div v-if="expandedFAQs.includes(faq.id)" class="faq-answer">
                <div class="answer-content" v-html="faq.answer"></div>
                <div class="answer-actions">
                  <div class="helpful-section">
                    <span>这个回答对您有帮助吗？</span>
                    <div class="helpful-buttons">
                      <button 
                        class="helpful-btn"
                        :class="{ active: faq.userFeedback === 'helpful' }"
                        @click="markHelpful(faq.id, true)"
                      >
                        <i class="fas fa-thumbs-up"></i>
                        <span>有帮助 ({{ faq.helpful }})</span>
                      </button>
                      <button 
                        class="helpful-btn"
                        :class="{ active: faq.userFeedback === 'not-helpful' }"
                        @click="markHelpful(faq.id, false)"
                      >
                        <i class="fas fa-thumbs-down"></i>
                        <span>没帮助 ({{ faq.notHelpful }})</span>
                      </button>
                    </div>
                  </div>
                  <div class="related-links" v-if="faq.relatedLinks?.length">
                    <span>相关链接：</span>
                    <div class="links">
                      <a 
                        v-for="link in faq.relatedLinks"
                        :key="link.id"
                        :href="link.url"
                        class="related-link"
                        target="_blank"
                      >
                        {{ link.title }}
                        <i class="fas fa-external-link-alt"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- 没有找到结果 -->
        <div v-if="filteredFAQs.length === 0" class="no-results">
          <div class="no-results-icon">
            <i class="fas fa-search"></i>
          </div>
          <h3>没有找到相关问题</h3>
          <p>尝试使用不同的关键词搜索，或者直接向我们反馈您的问题</p>
          <button class="btn-primary" @click="scrollToFeedback">
            <i class="fas fa-comment"></i>
            提交反馈
          </button>
        </div>
      </div>

      <!-- 反馈部分 -->
      <div class="feedback-section" ref="feedbackSection">
        <div class="section-header">
          <h2>意见反馈</h2>
          <p>没有找到答案？告诉我们您遇到的问题或建议</p>
        </div>

        <div class="feedback-form">
          <div class="form-row">
            <div class="form-group">
              <label>反馈类型 *</label>
              <select v-model="feedbackForm.type" required>
                <option value="">请选择反馈类型</option>
                <option value="bug">错误报告</option>
                <option value="feature">功能建议</option>
                <option value="improvement">改进建议</option>
                <option value="question">使用问题</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="form-group">
              <label>优先级</label>
              <select v-model="feedbackForm.priority">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>标题 *</label>
            <input 
              v-model="feedbackForm.title"
              type="text"
              placeholder="简要描述您的问题或建议"
              required
            />
          </div>

          <div class="form-group">
            <label>详细描述 *</label>
            <textarea 
              v-model="feedbackForm.description"
              placeholder="请详细描述您遇到的问题、期望的功能或改进建议..."
              rows="6"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>联系方式</label>
            <input 
              v-model="feedbackForm.contact"
              type="text"
              placeholder="邮箱或电话号码（可选）"
            />
          </div>

          <div class="form-group">
            <label>系统信息</label>
            <div class="system-info">
              <div class="info-item">
                <span class="label">浏览器：</span>
                <span class="value">{{ systemInfo.browser }}</span>
              </div>
              <div class="info-item">
                <span class="label">操作系统：</span>
                <span class="value">{{ systemInfo.os }}</span>
              </div>
              <div class="info-item">
                <span class="label">应用版本：</span>
                <span class="value">{{ systemInfo.version }}</span>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button 
              type="button"
              class="btn-secondary"
              @click="resetForm"
            >
              <i class="fas fa-undo"></i>
              重置
            </button>
            <button 
              type="submit"
              class="btn-primary"
              :disabled="!isFormValid || isSubmitting"
              @click="submitFeedback"
            >
              <i class="fas fa-paper-plane" :class="{ 'fa-spin': isSubmitting }"></i>
              {{ isSubmitting ? '提交中...' : '提交反馈' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 联系方式 -->
      <div class="contact-section">
        <div class="section-header">
          <h2>其他联系方式</h2>
          <p>您也可以通过以下方式与我们联系</p>
        </div>

        <div class="contact-methods">
          <div class="contact-item">
            <div class="contact-icon">
              <i class="fas fa-envelope"></i>
            </div>
            <div class="contact-info">
              <h3>邮箱支持</h3>
              <p>发送邮件至 support@aireader.com</p>
              <span class="response-time">通常在24小时内回复</span>
            </div>
          </div>

          <div class="contact-item">
            <div class="contact-icon">
              <i class="fab fa-github"></i>
            </div>
            <div class="contact-info">
              <h3>GitHub Issues</h3>
              <p>在GitHub上报告问题或建议功能</p>
              <a href="https://github.com/aireader/issues" target="_blank" class="external-link">
                访问项目页面
                <i class="fas fa-external-link-alt"></i>
              </a>
            </div>
          </div>

          <div class="contact-item">
            <div class="contact-icon">
              <i class="fab fa-discord"></i>
            </div>
            <div class="contact-info">
              <h3>社区讨论</h3>
              <p>加入我们的Discord社区</p>
              <a href="#" target="_blank" class="external-link">
                加入Discord
                <i class="fas fa-external-link-alt"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 提交成功提示 -->
    <Transition name="toast">
      <div v-if="showSuccessToast" class="success-toast">
        <i class="fas fa-check-circle"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

// 响应式数据
const searchQuery = ref('')
const activeCategory = ref('all')
const expandedFAQs = ref<number[]>([])
const showSuccessToast = ref(false)
const toastMessage = ref('')
const isSubmitting = ref(false)
const feedbackSection = ref<HTMLElement>()

// 反馈表单
const feedbackForm = reactive({
  type: '',
  priority: 'medium',
  title: '',
  description: '',
  contact: ''
})

// 系统信息
const systemInfo = reactive({
  browser: navigator.userAgent.split(' ').pop() || 'Unknown',
  os: navigator.platform || 'Unknown',
  version: '1.0.0'
})

// 分类数据
const categories = ref([
  {
    id: 'all',
    name: '全部',
    icon: 'fas fa-list',
    count: 0
  },
  {
    id: 'basic',
    name: '基础功能',
    icon: 'fas fa-info-circle',
    count: 0
  },
  {
    id: 'reading',
    name: '阅读相关',
    icon: 'fas fa-book-open',
    count: 0
  },
  {
    id: 'account',
    name: '账户设置',
    icon: 'fas fa-user-cog',
    count: 0
  },
  {
    id: 'technical',
    name: '技术问题',
    icon: 'fas fa-tools',
    count: 0
  }
])

// FAQ数据
const faqs = ref([
  {
    id: 1,
    question: '如何添加RSS订阅源？',
    answer: '<p>添加RSS订阅源非常简单：</p><ol><li>点击左侧导航栏的"RSS管理"</li><li>点击"添加新源"按钮</li><li>输入RSS URL或者从推荐列表中选择</li><li>设置分类和更新频率</li><li>点击"保存"即可</li></ol><p><strong>提示：</strong>大部分网站的RSS地址通常是 <code>网站地址/feed</code> 或 <code>网站地址/rss</code></p>',
    category: '基础功能',
    categoryId: 'basic',
    icon: 'fas fa-rss',
    views: 1250,
    helpful: 89,
    notHelpful: 5,
    userFeedback: null,
    relatedLinks: [
      {
        id: 1,
        title: 'RSS订阅管理指南',
        url: '#'
      },
      {
        id: 2,
        title: '推荐RSS源列表',
        url: '#'
      }
    ]
  },
  {
    id: 2,
    question: '如何使用AI摘要功能？',
    answer: '<p>AI摘要功能帮助您快速了解文章要点：</p><ol><li>在文章列表中，点击文章标题进入阅读模式</li><li>在文章页面右侧找到"AI摘要"按钮</li><li>点击后系统会自动生成文章摘要</li><li>摘要包含关键信息和要点总结</li></ol><p><strong>注意：</strong>AI摘要功能需要网络连接，首次生成可能需要几秒钟时间。</p>',
    category: '阅读相关',
    categoryId: 'reading',
    icon: 'fas fa-robot',
    views: 890,
    helpful: 76,
    notHelpful: 8,
    userFeedback: null
  },
  {
    id: 3,
    question: '如何修改主题和外观设置？',
    answer: '<p>自定义外观设置：</p><ol><li>点击右上角的设置图标</li><li>选择"外观设置"选项</li><li>可以修改：<ul><li>主题模式（浅色/深色/自动）</li><li>字体大小和字体族</li><li>布局设置（紧凑模式、侧边栏显示）</li></ul></li><li>所有更改会实时预览并自动保存</li></ol>',
    category: '账户设置',
    categoryId: 'account',
    icon: 'fas fa-palette',
    views: 654,
    helpful: 92,
    notHelpful: 3,
    userFeedback: null
  },
  {
    id: 4,
    question: '为什么某些RSS源无法更新？',
    answer: '<p>RSS源无法更新的常见原因和解决方法：</p><ol><li><strong>URL错误：</strong>检查RSS地址是否正确，尝试在浏览器中直接访问</li><li><strong>网站限制：</strong>某些网站可能限制频繁访问，建议调整更新频率</li><li><strong>网络问题：</strong>检查网络连接是否正常</li><li><strong>格式问题：</strong>确认提供的是有效的RSS/Atom格式</li></ol><p>如果问题持续存在，请联系技术支持并提供具体的RSS地址。</p>',
    category: '技术问题',
    categoryId: 'technical',
    icon: 'fas fa-exclamation-triangle',
    views: 432,
    helpful: 45,
    notHelpful: 12,
    userFeedback: null
  },
  {
    id: 5,
    question: '如何导出我的阅读数据？',
    answer: '<p>导出阅读数据的步骤：</p><ol><li>进入设置页面</li><li>选择"数据同步"选项</li><li>在"数据管理"部分点击"导出数据"</li><li>选择要导出的数据类型：<ul><li>RSS订阅列表</li><li>阅读历史</li><li>收藏夹</li><li>笔记和标注</li></ul></li><li>点击"开始导出"，文件将自动下载</li></ol><p>导出的数据为JSON格式，可以用于备份或迁移到其他设备。</p>',
    category: '账户设置',
    categoryId: 'account',
    icon: 'fas fa-download',
    views: 321,
    helpful: 67,
    notHelpful: 4,
    userFeedback: null
  }
])

// 计算属性
const filteredFAQs = computed(() => {
  let filtered = faqs.value

  // 按分类过滤
  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(faq => faq.categoryId === activeCategory.value)
  }

  // 按搜索词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(faq => 
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query)
    )
  }

  return filtered
})

const isFormValid = computed(() => {
  return feedbackForm.type && 
         feedbackForm.title.trim() && 
         feedbackForm.description.trim()
})

// 方法
const filterFAQs = () => {
  // 搜索时自动展开相关FAQ
  if (searchQuery.value && filteredFAQs.value.length <= 3) {
    expandedFAQs.value = filteredFAQs.value.map(faq => faq.id)
  } else if (!searchQuery.value) {
    expandedFAQs.value = []
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  expandedFAQs.value = []
}

const filterByCategory = (categoryId: string) => {
  activeCategory.value = categoryId
  expandedFAQs.value = []
}

const toggleFAQ = (faqId: number) => {
  const index = expandedFAQs.value.indexOf(faqId)
  if (index > -1) {
    expandedFAQs.value.splice(index, 1)
  } else {
    expandedFAQs.value.push(faqId)
    
    // 增加查看次数
    const faq = faqs.value.find(f => f.id === faqId)
    if (faq) {
      faq.views++
    }
  }
}

const markHelpful = (faqId: number, isHelpful: boolean) => {
  const faq = faqs.value.find(f => f.id === faqId)
  if (!faq) return

  // 如果之前有反馈，先撤销
  if (faq.userFeedback === 'helpful') {
    faq.helpful--
  } else if (faq.userFeedback === 'not-helpful') {
    faq.notHelpful--
  }

  // 添加新反馈
  if (isHelpful) {
    faq.helpful++
    faq.userFeedback = 'helpful'
  } else {
    faq.notHelpful++
    faq.userFeedback = 'not-helpful'
  }

  showToast('感谢您的反馈！')
}

const scrollToFeedback = () => {
  feedbackSection.value?.scrollIntoView({ 
    behavior: 'smooth',
    block: 'start'
  })
}

const resetForm = () => {
  Object.assign(feedbackForm, {
    type: '',
    priority: 'medium',
    title: '',
    description: '',
    contact: ''
  })
}

const submitFeedback = async () => {
  if (!isFormValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    // 模拟提交API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    showToast('反馈提交成功，我们会尽快处理！')
    resetForm()
  } catch (error) {
    showToast('提交失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

const showToast = (message: string) => {
  toastMessage.value = message
  showSuccessToast.value = true
  
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)
}

// 生命周期
onMounted(() => {
  // 更新分类计数
  categories.value.forEach(category => {
    if (category.id === 'all') {
      category.count = faqs.value.length
    } else {
      category.count = faqs.value.filter(faq => faq.categoryId === category.id).length
    }
  })
})
</script>

<style scoped lang="scss">
.help-feedback-container {
  padding: 24px;
  background: var(--color-bg-primary);
  min-height: 100vh;
}

/* 帮助头部 */
.help-header {
  margin-bottom: 32px;
  text-align: center;
}

.header-content {
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 0 16px;
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  
  i {
    color: var(--color-primary);
  }
}

.header-desc {
  p {
    margin: 0;
    font-size: 16px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }
}

/* 帮助主体 */
.help-main {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 搜索框 */
.search-section {
  .search-box {
    position: relative;
    max-width: 500px;
    margin: 0 auto;
    
    i.fa-search {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-tertiary);
      font-size: 14px;
    }
    
    input {
      width: 100%;
      padding: 12px 16px 12px 44px;
      border: 2px solid var(--color-border-primary);
      border-radius: 24px;
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
    
    .clear-search {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 50%;
      background: var(--color-text-tertiary);
      color: white;
      font-size: 10px;
      cursor: pointer;
      transition: all var(--transition-speed-fast);
      
      &:hover {
        background: var(--color-text-secondary);
      }
    }
  }
}

/* 快速导航 */
.quick-nav {
  .nav-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 16px;
  }
  
  .nav-categories {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .category-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: 1px solid var(--color-border-primary);
    border-radius: 20px;
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    font-size: 14px;
    cursor: pointer;
    transition: all var(--transition-speed-fast);
    
    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
    
    &.active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
    
    .count {
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      
      .category-btn:not(.active) & {
        background: var(--color-bg-tertiary);
        color: var(--color-text-tertiary);
      }
    }
  }
}

/* FAQ部分 */
.faq-section {
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    
    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    
    .faq-stats {
      font-size: 14px;
      color: var(--color-text-secondary);
    }
  }
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.faq-item {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  overflow: hidden;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    border-color: var(--color-primary);
  }
  
  &.expanded {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.1);
  }
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  cursor: pointer;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    background: var(--color-bg-hover);
  }
}

.question-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.question-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.question-text {
  flex: 1;
  
  h3 {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.4;
  }
  
  .question-meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--color-text-tertiary);
    
    .category {
      background: var(--color-bg-tertiary);
      padding: 2px 8px;
      border-radius: 4px;
    }
  }
}

.expand-icon {
  color: var(--color-text-secondary);
  transition: transform var(--transition-speed-fast);
  
  .faq-item.expanded & {
    transform: rotate(180deg);
  }
}

.faq-answer {
  border-top: 1px solid var(--color-border-primary);
  padding: 24px;
  background: var(--color-bg-primary);
}

.answer-content {
  margin-bottom: 20px;
  line-height: 1.6;
  color: var(--color-text-primary);
  
  :deep(p) {
    margin: 0 0 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  :deep(ol), :deep(ul) {
    margin: 12px 0;
    padding-left: 20px;
    
    li {
      margin-bottom: 8px;
    }
  }
  
  :deep(code) {
    background: var(--color-bg-tertiary);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
  }
  
  :deep(strong) {
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.answer-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.helpful-section {
  display: flex;
  align-items: center;
  gap: 16px;
  
  span {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
  
  .helpful-buttons {
    display: flex;
    gap: 8px;
  }
  
  .helpful-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid var(--color-border-primary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all var(--transition-speed-fast);
    
    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
    
    &.active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
  }
}

.related-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  
  span {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
  
  .links {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .related-link {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: 4px;
    color: var(--color-primary);
    text-decoration: none;
    font-size: 12px;
    transition: all var(--transition-speed-fast);
    
    &:hover {
      background: var(--color-primary);
      color: white;
    }
  }
}

/* 没有结果 */
.no-results {
  text-align: center;
  padding: 48px 24px;
  color: var(--color-text-secondary);
  
  .no-results-icon {
    margin-bottom: 16px;
    
    i {
      font-size: 48px;
      color: var(--color-text-tertiary);
    }
  }
  
  h3 {
    margin: 0 0 8px;
    font-size: 18px;
    color: var(--color-text-primary);
  }
  
  p {
    margin: 0 0 24px;
    line-height: 1.5;
  }
  
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-speed-fast);
    
    &:hover {
      background: var(--color-primary-dark);
      transform: translateY(-1px);
    }
  }
}

/* 反馈部分 */
.feedback-section,
.contact-section {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  padding: 32px;
  
  .section-header {
    margin-bottom: 24px;
    
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
}

.feedback-form {
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }
  
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
      background: var(--color-bg-primary);
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
      min-height: 120px;
      font-family: inherit;
    }
  }
  
  .system-info {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-primary);
    border-radius: 8px;
    padding: 16px;
    
    .info-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .label {
        font-size: 13px;
        color: var(--color-text-secondary);
      }
      
      .value {
        font-size: 13px;
        color: var(--color-text-primary);
        font-family: monospace;
      }
    }
  }
  
  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    
    .btn-secondary,
    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
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
    
    .btn-secondary {
      background: var(--color-bg-primary);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border-primary);
      
      &:hover:not(:disabled) {
        background: var(--color-bg-hover);
        color: var(--color-text-primary);
      }
    }
    
    .btn-primary {
      background: var(--color-primary);
      color: white;
      
      &:hover:not(:disabled) {
        background: var(--color-primary-dark);
        transform: translateY(-1px);
      }
    }
  }
}

/* 联系方式 */
.contact-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.contact-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  transition: all var(--transition-speed-fast);
  
  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.1);
  }
}

.contact-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.contact-info {
  flex: 1;
  
  h3 {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  
  p {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--color-text-secondary);
  }
  
  .response-time {
    font-size: 12px;
    color: var(--color-text-tertiary);
  }
  
  .external-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--color-primary);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: all var(--transition-speed-fast);
    
    &:hover {
      color: var(--color-primary-dark);
    }
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
.faq-expand-enter-active,
.faq-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.faq-expand-enter-from,
.faq-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.faq-expand-enter-to,
.faq-expand-leave-from {
  opacity: 1;
  max-height: 1000px;
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
  .help-feedback-container {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .nav-categories {
    justify-content: flex-start;
  }
  
  .faq-question {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .question-content {
    width: 100%;
  }
  
  .feedback-form .form-row {
    grid-template-columns: 1fr;
  }
  
  .contact-methods {
    grid-template-columns: 1fr;
  }
  
  .helpful-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .related-links {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style> 