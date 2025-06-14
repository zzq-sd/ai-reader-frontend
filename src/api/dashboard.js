// AI阅读器 - 仪表盘API服务
// 提供模拟数据，严格按照原型设计

/**
 * Dashboard API 服务
 * 提供仪表盘相关的数据接口
 */

// 模拟网络延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 获取仪表盘数据
 * @returns {Promise<Object>} 仪表盘数据
 */
export async function fetchDashboardData() {
  // 模拟网络延迟
  await delay(800)
  
  return {
    // 统计数据
    stats: {
      articles: {
        type: 'articles',
        value: 1247,
        change: '+12.5%',
        trend: 'positive'
      },
      notes: {
        type: 'notes',
        value: 89,
        change: '+5.2%',
        trend: 'positive'
      },
      feeds: {
        type: 'feeds',
        value: 23,
        change: '+2',
        trend: 'positive'
      },
      collections: {
        type: 'collections',
        value: 156,
        change: '-3.1%',
        trend: 'negative'
      }
    },
    latestArticles: [
      {
        id: '1',
        title: 'Vue 3.4 发布：全新的响应式系统重构',
        source: 'Vue.js Blog',
        publishTime: '2 小时前',
        readStatus: 'unread',
        imageUrl: 'https://source.unsplash.com/60x60?technology',
        url: '/articles/vue-3-4-release'
      },
      {
        id: '2',
        title: '大语言模型在知识图谱构建中的应用研究',
        source: 'AI研究前沿',
        publishTime: '4 小时前',
        readStatus: 'unread',
        imageUrl: 'https://source.unsplash.com/60x60?ai',
        url: '/articles/llm-knowledge-graph'
      },
      {
        id: '3',
        title: '2024年UI设计趋势：从极简到情感化设计',
        source: '设计师日报',
        publishTime: '6 小时前',
        readStatus: 'read',
        imageUrl: 'https://source.unsplash.com/60x60?design',
        url: '/articles/ui-design-trends-2024'
      },
      {
        id: '4',
        title: 'TypeScript 5.0 新特性深度解析',
        source: '开发者周刊',
        publishTime: '8 小时前',
        readStatus: 'read',
        imageUrl: 'https://source.unsplash.com/60x60?programming',
        url: '/articles/typescript-5-features'
      }
    ],
    recentActivities: [
      {
        id: 'activity-1',
        type: 'add_feed',
        description: '添加了新的RSS源 "React Blog"',
        timestamp: '2 小时前',
        icon: 'fas fa-plus'
      },
      {
        id: 'activity-2',
        type: 'create_note',
        description: '创建了笔记 "Vue组件设计模式"',
        timestamp: '4 小时前',
        icon: 'fas fa-edit'
      },
      {
        id: 'activity-3',
        type: 'bookmark',
        description: '收藏了文章 "AI在前端开发中的应用"',
        timestamp: '1 天前',
        icon: 'fas fa-bookmark'
      },
      {
        id: 'activity-4',
        type: 'share',
        description: '分享了知识图谱 "前端技术栈"',
        timestamp: '2 天前',
        icon: 'fas fa-share'
      }
    ],
    recommendations: [
      {
        id: 'rec-1',
        title: '机器学习在推荐系统中的最新进展',
        source: 'AI前沿',
        publishTime: '推荐',
        readStatus: 'unread',
        imageUrl: 'https://source.unsplash.com/60x60?machine-learning',
        url: '/articles/ml-recommendation-systems'
      },
      {
        id: 'rec-2',
        title: '数据可视化的最佳实践指南',
        source: '数据科学',
        publishTime: '推荐',
        readStatus: 'unread',
        imageUrl: 'https://source.unsplash.com/60x60?data',
        url: '/articles/data-visualization-guide'
      }
    ],
    quickActions: [
      {
        id: 'action-1',
        title: '添加RSS源',
        icon: 'fas fa-plus',
        route: '/rss-management'
      },
      {
        id: 'action-2',
        title: '创建笔记',
        icon: 'fas fa-edit',
        route: '/notes'
      },
      {
        id: 'action-3',
        title: '查看知识图谱',
        icon: 'fas fa-project-diagram',
        route: '/knowledge-graph'
      },
      {
        id: 'action-4',
        title: '管理收藏',
        icon: 'fas fa-bookmark',
        route: '/collections'
      }
    ]
  }
}

/**
 * 刷新仪表盘统计数据
 * @returns {Promise<Object>} 更新后的统计数据
 */
export async function refreshDashboardStats() {
  // 模拟网络延迟
  await delay(500)
  
  return {
    articles: {
      type: 'articles',
      value: 1251,
      change: '+13.2%',
      trend: 'positive'
    },
    notes: {
      type: 'notes',
      value: 92,
      change: '+8.1%',
      trend: 'positive'
    },
    feeds: {
      type: 'feeds',
      value: 24,
      change: '+3',
      trend: 'positive'
    },
    collections: {
      type: 'collections',
      value: 158,
      change: '-2.8%',
      trend: 'negative'
    }
  }
} 