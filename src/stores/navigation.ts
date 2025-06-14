import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useStatisticsStore } from './statistics'

// 导航项接口
export interface NavigationItem {
  id: string
  title: string
  icon: string
  route: string
  badge?: string | number
  children?: NavigationItem[]
}

// 侧边栏分组接口
export interface SidebarSection {
  title: string
  items: NavigationItem[]
}

export const useNavigationStore = defineStore('navigation', () => {
  // 状态
  const activeRoute = ref('articles')
  const sidebarSections = ref<SidebarSection[]>([])
  
  // 获取统计Store引用（延迟初始化避免循环依赖）
  const getStatisticsStore = () => useStatisticsStore()

  // 计算属性
  const activeNavigationItem = computed(() => {
    for (const section of sidebarSections.value) {
      const item = section.items.find(item => item.route === activeRoute.value)
      if (item) return item
    }
    return null
  })

  // 动态徽章数据计算属性
  const dynamicBadges = computed(() => {
    const statisticsStore = getStatisticsStore()
    return {
      articles: statisticsStore.totalArticles
    }
  })

  // 动作
  function setActiveRoute(route: string) {
    activeRoute.value = route
  }

  function loadNavigationData() {
    // 简化的管理员检查 - 通过用户名或直接设置
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    
    // 简单判断：如果用户名是admin、administrator、123或zzq，就认为是管理员
    const adminUsernames = ['admin', 'administrator', '123', 'zzq']
    const isAdmin = isLoggedIn && adminUsernames.includes(currentUser.username)

    console.log('🔍 Navigation: Loading navigation data')
    console.log('🔍 Navigation: currentUser:', currentUser.username) 
    console.log('🔍 Navigation: isLoggedIn:', isLoggedIn)
    console.log('🔍 Navigation: isAdmin:', isAdmin)

    // 基础导航数据
    const sections: SidebarSection[] = [
      {
        title: '概览',
        items: [
          {
            id: 'articles',
            title: '所有文章',
            icon: 'fas fa-newspaper',
            route: 'articles'
          }
        ]
      },
      {
        title: 'RSS源',
        items: [
          {
            id: 'rss-management',
            title: '源管理',
            icon: 'fas fa-rss',
            route: 'rss-management'
          }
        ]
      },
      {
        title: '智能功能',
        items: [
          {
            id: 'knowledge-graph',
            title: '知识图谱',
            icon: 'fas fa-project-diagram',
            route: 'knowledge-graph'
          },
          {
            id: 'ai-assistant',
            title: 'AI 助手',
            icon: 'fas fa-robot',
            route: 'ai-assistant',
            badge: 'Beta'
          }
        ]
      },
      {
        title: '工具',
        items: [
          {
            id: 'notes',
            title: '笔记',
            icon: 'fas fa-sticky-note',
            route: 'notes'
          },
          {
            id: 'collections',
            title: '收藏',
            icon: 'fas fa-bookmark',
            route: 'collections'
          }
        ]
      }
    ]

    // 如果是管理员，添加管理员分组
    if (isAdmin) {
      console.log('✅ Navigation: Adding admin section')
      sections.push({
        title: '系统管理',
        items: [
          {
            id: 'admin',
            title: '管理面板',
            icon: 'fas fa-cogs',
            route: 'admin'
          }
        ]
      })
    }

    sidebarSections.value = sections
    console.log('🔍 Navigation: Final sections count:', sections.length)
    
    // 强制触发响应式更新
    setTimeout(() => {
      console.log('🔍 Navigation: Forcing reactive update')
      sidebarSections.value = [...sidebarSections.value]
    }, 50)
  }

  // 根据路由查找导航项
  function findNavigationItemByRoute(route: string): NavigationItem | null {
    for (const section of sidebarSections.value) {
      const item = section.items.find(item => item.route === route)
      if (item) return item
    }
    return null
  }

  // 获取导航项的徽章数量
  function getNavigationBadge(route: string): string | number | undefined {
    const item = findNavigationItemByRoute(route)
    return item?.badge
  }

  // 更新导航项徽章
  function updateNavigationBadge(route: string, badge: string | number | undefined) {
    const item = findNavigationItemByRoute(route)
    if (item) {
      item.badge = badge
    }
  }

  // 初始化导航数据
  function initializeNavigation() {
    loadNavigationData()
    // 设置默认激活路由
    setActiveRoute('articles')
  }

  return {
    // 状态
    activeRoute,
    sidebarSections,
    
    // 计算属性
    activeNavigationItem,
    
    // 动作
    setActiveRoute,
    loadNavigationData,
    findNavigationItemByRoute,
    getNavigationBadge,
    updateNavigationBadge,
    initializeNavigation
  }
}) 