// 首先导入样式变量
import './assets/styles/variables.scss'

// 然后导入基础样式
import './assets/base.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 引入全局样式
import './assets/styles/global.scss'

// 引入图标回退样式
import './assets/styles/icon-fallback.scss'

// 正确引入Font Awesome图标 - 只导入CSS，让Vite处理字体文件
import '@fortawesome/fontawesome-free/css/all.min.css'

// 引入Element Plus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

// 导入全局组件
import AppIcon from './components/common/AppIcon.vue'

// 导入图标调试工具（开发环境）
if (import.meta.env.DEV) {
  import('./utils/iconDebug')
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册全局组件
app.component('AppIcon', AppIcon)

app.mount('#app')
