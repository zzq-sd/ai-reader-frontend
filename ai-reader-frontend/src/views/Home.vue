<template>
  <div class="home-page">
    <div class="welcome-section">
      <h1 class="welcome-title">欢迎使用 AI 阅读器</h1>
      <p class="welcome-subtitle">智能阅读，高效学习</p>
      
      <div class="feature-cards">
        <div class="feature-card">
          <i class="fas fa-rss feature-icon"></i>
          <h3>RSS 订阅</h3>
          <p>订阅您喜爱的内容源，获取最新资讯</p>
        </div>
        
        <div class="feature-card">
          <i class="fas fa-brain feature-icon"></i>
          <h3>AI 摘要</h3>
          <p>智能提取文章要点，快速掌握核心内容</p>
        </div>
        
        <div class="feature-card">
          <i class="fas fa-bookmark feature-icon"></i>
          <h3>智能收藏</h3>
          <p>自动分类收藏内容，构建个人知识库</p>
        </div>
      </div>
      
      <!-- 测试样式变量 -->
      <div class="test-section">
        <h2>样式测试</h2>
        <div class="test-colors">
          <div class="color-box bg-primary">主背景</div>
          <div class="color-box bg-secondary">次背景</div>
          <div class="color-box accent-primary">主题色</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  console.log('Home page mounted')
  console.log('CSS变量测试:', {
    bgPrimary: getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary'),
    bgSecondary: getComputedStyle(document.documentElement).getPropertyValue('--color-bg-secondary'),
    textPrimary: getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary'),
    accentPrimary: getComputedStyle(document.documentElement).getPropertyValue('--color-accent-primary')
  })
})
</script>

<style lang="scss" scoped>
.home-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.welcome-subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin-bottom: 3rem;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  transition: all var(--transition-duration) var(--transition-timing);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-accent-primary);
  }

  .feature-icon {
    font-size: 2.5rem;
    color: var(--color-accent-primary);
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 0.75rem;
  }

  p {
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
}

.test-section {
  margin-top: 3rem;
  padding: 2rem;
  background: var(--color-bg-secondary);
  border-radius: 1rem;
  
  h2 {
    color: var(--color-text-primary);
    margin-bottom: 1rem;
  }
}

.test-colors {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.color-box {
  padding: 1rem;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  min-width: 100px;
  text-align: center;
  
  &.bg-primary {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-primary);
  }
  
  &.bg-secondary {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
  }
  
  &.accent-primary {
    background: var(--color-accent-primary);
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 1rem;
  }

  .welcome-title {
    font-size: 2rem;
  }

  .feature-cards {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .feature-card {
    padding: 1.5rem;
  }
  
  .test-colors {
    flex-direction: column;
    align-items: center;
  }
}
</style> 