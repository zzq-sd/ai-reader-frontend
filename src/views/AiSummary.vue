<template>
  <div class="ai-summary-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <i class="fas fa-magic"></i>
          AI智能摘要
        </h1>
        <p class="page-subtitle">利用人工智能技术，快速生成文章摘要和深度分析</p>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">
      <div class="input-card">
        <div class="card-header">
          <h3>
            <i class="fas fa-file-text"></i>
            输入文章内容
          </h3>
          <div class="input-actions">
            <button 
              class="action-btn"
              @click="pasteFromClipboard"
              title="从剪贴板粘贴"
            >
              <i class="fas fa-clipboard"></i>
              粘贴
            </button>
            <button 
              class="action-btn"
              @click="clearInput"
              title="清空内容"
            >
              <i class="fas fa-trash"></i>
              清空
            </button>
          </div>
        </div>
        <div class="input-content">
          <textarea
            v-model="inputText"
            class="text-input"
            placeholder="请输入或粘贴需要分析的文章内容..."
            :disabled="isProcessing"
          ></textarea>
          <div class="input-stats">
            <span class="char-count">{{ inputText.length }} 字符</span>
            <span class="word-count">{{ wordCount }} 词</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分析选项 -->
    <div class="options-section">
      <div class="options-card">
        <h3>分析选项</h3>
        <div class="options-grid">
          <label class="option-item">
            <input type="checkbox" v-model="analysisOptions.summary" :disabled="isProcessing">
            <span class="option-icon"><i class="fas fa-compress-alt"></i></span>
            <span class="option-text">智能摘要</span>
          </label>
          <label class="option-item">
            <input type="checkbox" v-model="analysisOptions.keywords" :disabled="isProcessing">
            <span class="option-icon"><i class="fas fa-tags"></i></span>
            <span class="option-text">关键词提取</span>
          </label>
          <label class="option-item">
            <input type="checkbox" v-model="analysisOptions.sentiment" :disabled="isProcessing">
            <span class="option-icon"><i class="fas fa-heart"></i></span>
            <span class="option-text">情感分析</span>
          </label>
          <label class="option-item">
            <input type="checkbox" v-model="analysisOptions.topics" :disabled="isProcessing">
            <span class="option-icon"><i class="fas fa-sitemap"></i></span>
            <span class="option-text">主题分析</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 生成按钮 -->
    <div class="action-section">
      <button 
        class="generate-btn"
        :class="{ 'processing': isProcessing }"
        @click="generateSummary"
        :disabled="!canGenerate"
      >
        <div v-if="isProcessing" class="loading-spinner"></div>
        <i v-else class="fas fa-magic"></i>
        <span>{{ isProcessing ? '分析中...' : '开始分析' }}</span>
      </button>
    </div>

    <!-- 结果展示区域 -->
    <div v-if="hasResults" class="results-section">
      <!-- 智能摘要 -->
      <div v-if="results.summary" class="result-card summary-card">
        <div class="card-header">
          <h3>
            <i class="fas fa-compress-alt"></i>
            智能摘要
          </h3>
          <div class="card-actions">
            <button @click="copyToClipboard(results.summary)" class="copy-btn">
              <i class="fas fa-copy"></i>
              复制
            </button>
          </div>
        </div>
        <div class="card-content">
          <p class="summary-text">{{ results.summary }}</p>
          <div class="summary-stats">
            <span class="stat-item">
              <i class="fas fa-compress"></i>
              压缩率: {{ compressionRatio }}%
            </span>
            <span class="stat-item">
              <i class="fas fa-clock"></i>
              预计阅读: {{ estimatedReadTime }}分钟
            </span>
          </div>
        </div>
      </div>

      <!-- 关键词 -->
      <div v-if="results.keywords" class="result-card keywords-card">
        <div class="card-header">
          <h3>
            <i class="fas fa-tags"></i>
            关键词
          </h3>
        </div>
        <div class="card-content">
          <div class="keywords-list">
            <span
              v-for="(keyword, index) in results.keywords"
              :key="keyword.word"
              class="keyword-tag"
              :style="{ 
                fontSize: `${Math.max(0.8, keyword.weight)}em`,
                animationDelay: `${index * 0.1}s`
              }"
            >
              {{ keyword.word }}
            </span>
          </div>
        </div>
      </div>

      <!-- 情感分析 -->
      <div v-if="results.sentiment" class="result-card sentiment-card">
        <div class="card-header">
          <h3>
            <i class="fas fa-heart"></i>
            情感分析
          </h3>
        </div>
        <div class="card-content">
          <div class="sentiment-overview">
            <div class="sentiment-score" :class="results.sentiment.overall">
              <div class="score-icon">
                <i :class="getSentimentIcon(results.sentiment.overall)"></i>
              </div>
              <div class="score-text">
                <span class="score-label">整体情感</span>
                <span class="score-value">{{ getSentimentLabel(results.sentiment.overall) }}</span>
              </div>
            </div>
          </div>
          <div class="sentiment-details">
            <div class="sentiment-bar">
              <span class="bar-label">积极</span>
              <div class="bar-track">
                <div 
                  class="bar-fill positive"
                  :style="{ width: `${results.sentiment.positive * 100}%` }"
                ></div>
              </div>
              <span class="bar-value">{{ Math.round(results.sentiment.positive * 100) }}%</span>
            </div>
            <div class="sentiment-bar">
              <span class="bar-label">中性</span>
              <div class="bar-track">
                <div 
                  class="bar-fill neutral"
                  :style="{ width: `${results.sentiment.neutral * 100}%` }"
                ></div>
              </div>
              <span class="bar-value">{{ Math.round(results.sentiment.neutral * 100) }}%</span>
            </div>
            <div class="sentiment-bar">
              <span class="bar-label">消极</span>
              <div class="bar-track">
                <div 
                  class="bar-fill negative"
                  :style="{ width: `${results.sentiment.negative * 100}%` }"
                ></div>
              </div>
              <span class="bar-value">{{ Math.round(results.sentiment.negative * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 主题分析 -->
      <div v-if="results.topics" class="result-card topics-card">
        <div class="card-header">
          <h3>
            <i class="fas fa-sitemap"></i>
            主题分析
          </h3>
        </div>
        <div class="card-content">
          <div class="topics-list">
            <div
              v-for="(topic, index) in results.topics"
              :key="topic.name"
              class="topic-item"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="topic-header">
                <span class="topic-name">{{ topic.name }}</span>
                <span class="topic-confidence">{{ Math.round(topic.confidence * 100) }}%</span>
              </div>
              <div class="topic-progress">
                <div 
                  class="progress-fill"
                  :style="{ width: `${topic.confidence * 100}%` }"
                ></div>
              </div>
              <div class="topic-keywords">
                <span
                  v-for="keyword in topic.keywords"
                  :key="keyword"
                  class="topic-keyword"
                >
                  {{ keyword }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div v-if="history.length > 0" class="history-section">
      <div class="history-card">
        <div class="card-header">
          <h3>
            <i class="fas fa-history"></i>
            分析历史
          </h3>
          <button @click="clearHistory" class="clear-btn">
            <i class="fas fa-trash"></i>
            清空历史
          </button>
        </div>
        <div class="card-content">
          <div class="history-list">
            <div
              v-for="(item, index) in history"
              :key="item.id"
              class="history-item"
              @click="loadHistoryItem(item)"
            >
              <div class="history-preview">
                <span class="history-text">{{ item.preview }}</span>
                <span class="history-date">{{ formatDate(item.timestamp) }}</span>
              </div>
              <div class="history-actions">
                <button @click.stop="deleteHistoryItem(index)" class="delete-btn">
                  <i class="fas fa-times"></i>
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
import { ref, computed, reactive, onMounted } from 'vue'

// 响应式数据
const inputText = ref('')
const isProcessing = ref(false)
const hasResults = ref(false)

// 分析选项
const analysisOptions = reactive({
  summary: true,
  keywords: true,
  sentiment: true,
  topics: true
})

// 分析结果
const results = reactive({
  summary: '',
  keywords: [] as Array<{ word: string; weight: number }>,
  sentiment: {
    overall: 'neutral' as 'positive' | 'negative' | 'neutral',
    positive: 0,
    negative: 0,
    neutral: 0
  },
  topics: [] as Array<{
    name: string;
    confidence: number;
    keywords: string[];
  }>
})

// 历史记录
const history = ref<Array<{
  id: string;
  preview: string;
  timestamp: number;
  results: any;
}>>([])

// 计算属性
const wordCount = computed(() => {
  return inputText.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

const canGenerate = computed(() => {
  return inputText.value.trim().length > 10 && !isProcessing.value && 
         Object.values(analysisOptions).some(option => option)
})

const compressionRatio = computed(() => {
  if (!results.summary || !inputText.value) return 0
  return Math.round((1 - results.summary.length / inputText.value.length) * 100)
})

const estimatedReadTime = computed(() => {
  if (!results.summary) return 0
  return Math.ceil(results.summary.length / 200) // 假设每分钟阅读200字
})

// 方法
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
  } catch (err) {
    console.error('无法从剪贴板读取内容:', err)
  }
}

const clearInput = () => {
  inputText.value = ''
  hasResults.value = false
}

const generateSummary = async () => {
  if (!canGenerate.value) return
  
  isProcessing.value = true
  
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 生成模拟结果
    if (analysisOptions.summary) {
      results.summary = generateMockSummary(inputText.value)
    }
    
    if (analysisOptions.keywords) {
      results.keywords = generateMockKeywords(inputText.value)
    }
    
    if (analysisOptions.sentiment) {
      results.sentiment = generateMockSentiment()
    }
    
    if (analysisOptions.topics) {
      results.topics = generateMockTopics()
    }
    
    hasResults.value = true
    
    // 保存到历史记录
    saveToHistory()
    
  } catch (error) {
    console.error('分析失败:', error)
  } finally {
    isProcessing.value = false
  }
}

const generateMockSummary = (text: string): string => {
  const sentences = text.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
  const summaryLength = Math.min(3, Math.ceil(sentences.length * 0.3))
  return sentences.slice(0, summaryLength).join('。') + '。'
}

const generateMockKeywords = (text: string) => {
  const words = ['技术', '创新', '发展', '未来', '智能', '数据', '分析', '系统', '用户', '体验']
  return words.slice(0, 8).map((word, index) => ({
    word,
    weight: 1 - index * 0.1
  }))
}

const generateMockSentiment = () => {
  const positive = Math.random() * 0.6 + 0.2
  const negative = Math.random() * 0.3
  const neutral = 1 - positive - negative
  
  let overall: 'positive' | 'negative' | 'neutral' = 'neutral'
  if (positive > negative && positive > neutral) overall = 'positive'
  else if (negative > positive && negative > neutral) overall = 'negative'
  
  return { overall, positive, negative, neutral }
}

const generateMockTopics = () => {
  return [
    { name: '技术创新', confidence: 0.85, keywords: ['技术', '创新', '发展'] },
    { name: '用户体验', confidence: 0.72, keywords: ['用户', '体验', '界面'] },
    { name: '数据分析', confidence: 0.68, keywords: ['数据', '分析', '统计'] }
  ]
}

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'fas fa-smile'
    case 'negative': return 'fas fa-frown'
    default: return 'fas fa-meh'
  }
}

const getSentimentLabel = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return '积极'
    case 'negative': return '消极'
    default: return '中性'
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // 这里可以添加成功提示
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const saveToHistory = () => {
  const historyItem = {
    id: Date.now().toString(),
    preview: inputText.value.substring(0, 50) + '...',
    timestamp: Date.now(),
    results: { ...results }
  }
  
  history.value.unshift(historyItem)
  
  // 限制历史记录数量
  if (history.value.length > 10) {
    history.value = history.value.slice(0, 10)
  }
}

const loadHistoryItem = (item: any) => {
  inputText.value = item.preview.replace('...', '')
  Object.assign(results, item.results)
  hasResults.value = true
}

const deleteHistoryItem = (index: number) => {
  history.value.splice(index, 1)
}

const clearHistory = () => {
  history.value = []
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  // 页面加载动画
  document.body.classList.add('page-loading')
  setTimeout(() => {
    document.body.classList.remove('page-loading')
  }, 100)
})
</script>

<style scoped lang="scss">
.ai-summary-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  
  // 页面进入动画
  animation: pageFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
  
  .header-content {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .page-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    margin-bottom: 1rem;
    
    i {
      margin-right: 1rem;
      color: #ffd700;
    }
  }
  
  .page-subtitle {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
  }
}

.input-section,
.options-section,
.action-section,
.results-section,
.history-section {
  max-width: 1200px;
  margin: 0 auto 2rem;
}

.input-card,
.options-card,
.result-card,
.history-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: cardSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.card-header {
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    font-size: 1.2rem;
    font-weight: 600;
    color: #495057;
    margin: 0;
    
    i {
      margin-right: 0.5rem;
      color: #6c757d;
    }
  }
}

.input-actions,
.card-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn,
.copy-btn,
.clear-btn,
.delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: #6c757d;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #5a6268;
    transform: translateY(-1px);
  }
  
  i {
    margin-right: 0.5rem;
  }
}

.input-content {
  padding: 2rem;
}

.text-input {
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
}

.input-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 2rem;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    background: #f8f9ff;
  }
  
  input[type="checkbox"] {
    margin-right: 1rem;
    transform: scale(1.2);
  }
  
  .option-icon {
    margin-right: 0.5rem;
    color: #667eea;
    font-size: 1.1rem;
  }
  
  .option-text {
    font-weight: 500;
    color: #495057;
  }
}

.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.processing {
    background: #6c757d;
  }
  
  i {
    margin-right: 0.5rem;
  }
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

.results-section {
  display: grid;
  gap: 2rem;
}

.summary-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #495057;
  margin-bottom: 1rem;
}

.summary-stats {
  display: flex;
  gap: 2rem;
  
  .stat-item {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    color: #6c757d;
    
    i {
      margin-right: 0.5rem;
    }
  }
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem;
}

.keyword-tag {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 20px;
  font-weight: 500;
  animation: keywordFadeIn 0.6s ease forwards;
}

.sentiment-overview {
  margin-bottom: 2rem;
}

.sentiment-score {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  
  &.positive {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
  }
  
  &.negative {
    background: linear-gradient(135deg, #dc3545, #fd7e14);
    color: white;
  }
  
  &.neutral {
    background: linear-gradient(135deg, #6c757d, #adb5bd);
    color: white;
  }
  
  .score-icon {
    font-size: 2rem;
    margin-right: 1rem;
  }
  
  .score-text {
    display: flex;
    flex-direction: column;
    
    .score-label {
      font-size: 0.9rem;
      opacity: 0.8;
    }
    
    .score-value {
      font-size: 1.2rem;
      font-weight: 600;
    }
  }
}

.sentiment-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sentiment-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  
  .bar-label {
    width: 60px;
    font-size: 0.9rem;
    color: #6c757d;
  }
  
  .bar-track {
    flex: 1;
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 1s ease;
    
    &.positive {
      background: #28a745;
    }
    
    &.neutral {
      background: #6c757d;
    }
    
    &.negative {
      background: #dc3545;
    }
  }
  
  .bar-value {
    width: 50px;
    text-align: right;
    font-size: 0.9rem;
    color: #6c757d;
  }
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
}

.topic-item {
  animation: topicSlideIn 0.6s ease forwards;
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  .topic-name {
    font-weight: 600;
    color: #495057;
  }
  
  .topic-confidence {
    font-size: 0.9rem;
    color: #667eea;
    font-weight: 600;
  }
}

.topic-progress {
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 3px;
    transition: width 1s ease;
  }
}

.topic-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.topic-keyword {
  padding: 0.25rem 0.5rem;
  background: #f8f9fa;
  color: #6c757d;
  border-radius: 12px;
  font-size: 0.8rem;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: background 0.3s ease;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.history-preview {
  flex: 1;
  
  .history-text {
    display: block;
    font-size: 0.9rem;
    color: #495057;
    margin-bottom: 0.25rem;
  }
  
  .history-date {
    font-size: 0.8rem;
    color: #6c757d;
  }
}

.history-actions {
  .delete-btn {
    padding: 0.25rem 0.5rem;
    background: #dc3545;
    
    &:hover {
      background: #c82333;
    }
  }
}

// 动画
@keyframes pageFadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes keywordFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes topicSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .ai-summary-page {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .options-grid {
    grid-template-columns: 1fr;
  }
  
  .sentiment-details {
    .sentiment-bar {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
      
      .bar-label,
      .bar-value {
        width: auto;
        text-align: left;
      }
    }
  }
}
</style> 