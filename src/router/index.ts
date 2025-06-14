import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/views/Layout/MainLayout.vue'
import { useRssStore } from '@/stores/rss'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 认证相关路由 - 独立布局
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: {
        title: '登录',
        requiresGuest: true // 仅允许未登录用户访问
      }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue'),
      meta: {
        title: '注册',
        requiresGuest: true
      }
    },
    {
      path: '/',
      component: MainLayout,
      meta: {
        requiresAuth: true // 主应用需要登录
      },
      children: [
        {
          path: '',
          redirect: '/articles'
        },
        {
          path: 'home',
          name: 'home',
          component: () => import('@/views/Home.vue')
        },
        {
          path: 'feeds',
          name: 'feeds',
          component: () => import('@/views/Feeds.vue')
        },
        {
          path: 'rss-management',
          name: 'rss-management',
          component: () => import('@/views/RssManagement.vue'),
          meta: {
            title: 'RSS源管理',
            description: '管理RSS订阅源'
          }
        },
        {
          path: 'rss-management',
          name: 'rss-management',
          component: () => import('@/views/RssManagement.vue'),
          meta: {
            title: 'RSS源管理',
            description: '管理RSS订阅源'
          }
        },
        // RSSHub集成路由 - 重定向到RSS管理页面
        {
          path: 'rsshub',
          redirect: '/rss-management'
        },
        {
          path: 'articles',
          name: 'articles',
          component: () => import('@/views/Articles.vue')
        },
        // RSS 分类路由
        {
          path: 'rss-tech',
          name: 'rss-tech',
          component: () => import('@/views/Articles.vue'),
          meta: {
            title: '技术文章',
            description: '技术相关的RSS文章',
            category: 'tech'
          }
        },
        {
          path: 'rss-news',
          name: 'rss-news',
          component: () => import('@/views/Articles.vue'),
          meta: {
            title: '新闻资讯',
            description: '新闻相关的RSS文章',
            category: 'news'
          }
        },
        {
          path: 'rss-design',
          name: 'rss-design',
          component: () => import('@/views/Articles.vue'),
          meta: {
            title: '设计文章',
            description: '设计相关的RSS文章',
            category: 'design'
          }
        },
        {
          path: 'rss-business',
          name: 'rss-business',
          component: () => import('@/views/Articles.vue'),
          meta: {
            title: '商业资讯',
            description: '商业相关的RSS文章',
            category: 'business'
          }
        },
        {
          path: 'collections',
          name: 'collections',
          component: () => import('@/views/Collections.vue')
        },
        {
          path: 'notes',
          name: 'notes',
          component: () => import('@/views/Notes.vue'),
          meta: {
            title: '笔记',
            description: '管理和编辑笔记'
          }
        },
        {
          path: 'knowledge-graph',
          name: 'knowledge-graph',
          component: () => import('@/views/EnhancedKnowledgeGraph.vue'),
          meta: {
            title: '知识图谱',
            description: '可视化展示知识关联'
          }
        },
        // AI助手路由
        {
          path: 'ai-assistant',
          name: 'ai-assistant',
          component: () => import('@/views/AiAssistant.vue'),
          meta: {
            title: 'AI助手',
            description: '智能AI助手服务'
          }
        },
        {
          path: 'ai-summary',
          name: 'ai-summary',
          component: () => import('@/views/AiSummary.vue')
        },

        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/Settings.vue')
        },
        {
          path: 'help',
          name: 'help',
          component: () => import('@/views/Help.vue')
        },
        {
          path: 'search',
          name: 'search',
          component: () => import('@/views/Search.vue'),
          meta: {
            title: '全网搜索',
            description: '全网搜索功能'
          }
        },
        // 管理员页面
        {
          path: 'admin',
          name: 'admin',
          component: () => import('@/views/Admin.vue'),
          meta: {
            title: '系统管理',
            description: '管理员控制面板',
            requiresAdmin: true
          }
        },

      ]
    },
    // 文章阅读页面 - 独立布局，不使用MainLayout
    {
      path: '/articles/:id',
      name: 'article-reader',
      component: () => import('@/views/ArticleReader.vue'),
      props: true,
      meta: {
        title: '文章阅读',
        hideNavigation: true // 隐藏导航栏，提供沉浸式阅读体验
      }
    }
  ]
})

// 路由守卫 - 认证检查
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  
  console.log('🔍 Router: Navigating to:', to.path, 'from:', from.path)
  console.log('🔍 Router: isLoggedIn:', isLoggedIn)
  console.log('🔍 Router: Route meta:', to.meta)
  
  // 对于管理员路由，需要同时检查登录状态和管理员权限
  if (to.meta.requiresAdmin) {
    console.log('🔍 Router: Route requires admin access')
    
    // 首先检查是否登录
    if (!isLoggedIn) {
      console.log('❌ Router: Admin route requires login, redirecting to /login')
      next('/login')
      return
    }
    
    // 然后检查管理员权限
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const userRoles = currentUser.roles || []
    const hasAdminRole = userRoles.includes('ROLE_ADMIN')
    
    console.log('🔍 Router: Current user:', currentUser)
    console.log('🔍 Router: Current username:', currentUser.username)
    console.log('🔍 Router: User roles:', userRoles)
    console.log('🔍 Router: Has ROLE_ADMIN?', hasAdminRole)
    
    if (!hasAdminRole) {
      console.log('❌ Router: Not admin, redirecting to /articles')
      next('/articles')
      return
    } else {
      console.log('✅ Router: Admin access granted')
    }
  }
  // 对于普通需要登录的页面
  else if (to.meta.requiresAuth && !isLoggedIn) {
    console.log('❌ Router: Requires auth but not logged in, redirecting to /login')
    next('/login')
    return
  }
  
  // 仅允许未登录用户访问的页面（如登录、注册）
  if (to.meta.requiresGuest && isLoggedIn) {
    console.log('❌ Router: Requires guest but logged in, redirecting to /articles')
    next('/articles')
    return
  }
  
  // 当路由到RSS管理页面时
  if (to.name === 'rss-management') {
    const rssStore = useRssStore()
    
    // 确保清除错误状态
    if (rssStore.error) {
      console.log('[Router] 导航到RSS管理页面，重置错误状态')
      rssStore.error = null
    }
  }
  
  console.log('✅ Router: Navigation allowed, proceeding to:', to.path)
  next()
})

export default router
