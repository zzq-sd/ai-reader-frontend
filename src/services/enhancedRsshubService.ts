import { fetchRsshubFeed, buildRsshubUrl } from './rsshubService'
import type { RssFeed, RssFeedItem, RsshubServiceOptions } from './rsshubService'
import axios from 'axios'
import { apiClient } from '../api/base'
import type { ApiResponse } from '../api/types/common'
import type { RssSource } from '../api/types/rss'

// RSSHub参数类型
export interface RsshubParams {
  limit?: number
  filter?: string
  filterTitle?: string
  filterDescription?: string
  filterAuthor?: string
  mode?: 'fulltext' | undefined
  [key: string]: any
}

// RSSHub路由参数
export interface RsshubRouteParams {
  [key: string]: string
}

// 实例健康检查结果
export interface InstanceHealthResult {
  instance: string
  isHealthy: boolean
  responseTime?: number
}

/**
 * 增强版RSSHub服务类
 */
export class EnhancedRsshubService {
  // RSSHub实例列表
  private instances: string[] = [
    'https://rsshub.app', // 默认公共实例
    'https://rss.shab.fun', // 备用实例1
    'https://rsshub.rssforever.com', // 备用实例2
  ]

  // 本地缓存配置
  private cacheDuration = 5 * 60 * 1000 // 5分钟
  private useLocalCache = true
  
  /**
   * 构造函数
   */
  constructor(instances?: string[]) {
    if (instances && instances.length > 0) {
      this.instances = instances
    }
  }
  
  /**
   * 配置多实例
   */
  setInstances(instances: string[]): void {
    this.instances = instances
  }
  
  /**
   * 获取实例列表
   */
  getInstances(): string[] {
    return [...this.instances]
  }
  
  /**
   * 配置缓存
   */
  configureCaching(useCaching: boolean, durationMs?: number): void {
    this.useLocalCache = useCaching
    if (durationMs !== undefined) {
      this.cacheDuration = durationMs
    }
  }
  
  /**
   * 实例健康检查
   */
  async checkInstanceHealth(instance: string): Promise<boolean> {
    try {
      const response = await axios.get(`${instance}/healthz`, { 
        timeout: 3000 // 减少到3秒超时
      })
      return response.status === 200
    } catch {
      return false
    }
  }
  
  /**
   * 批量健康检查（并发执行）
   */
  async checkAllInstances(): Promise<InstanceHealthResult[]> {
    const checkPromises = this.instances.map(async (instance) => {
      const startTime = Date.now()
      try {
        const response = await axios.get(`${instance}/healthz`, { 
          timeout: 2000 // 进一步减少到2秒超时
        })
        const endTime = Date.now()
        return {
          instance,
          isHealthy: response.status === 200,
          responseTime: endTime - startTime
        }
      } catch (error: any) {
        console.debug(`实例 ${instance} 健康检查失败:`, error?.message || error)
        return {
          instance,
          isHealthy: false
        }
      }
    })
    
    // 并发执行所有检查，最多等待5秒
    try {
      return await Promise.all(checkPromises)
    } catch (error) {
      console.warn('批量健康检查失败:', error)
      return this.instances.map(instance => ({
        instance,
        isHealthy: false
      }))
    }
  }
  
  /**
   * 获取健康实例（智能选择）
   */
  async getHealthyInstance(): Promise<string> {
    // 从缓存中获取健康实例
    const cachedInstance = localStorage.getItem('rsshub_healthy_instance')
    if (cachedInstance) {
      const { instance, timestamp } = JSON.parse(cachedInstance)
      if (Date.now() - timestamp < 3 * 60 * 1000) { // 减少到3分钟缓存
        // 快速验证缓存的实例是否仍然健康
        if (await this.checkInstanceHealth(instance)) {
          return instance
        } else {
          // 清除无效缓存
          localStorage.removeItem('rsshub_healthy_instance')
        }
      }
    }
    
    // 并发检查所有实例
    const healthResults = await this.checkAllInstances()
    const healthyInstances = healthResults
      .filter(result => result.isHealthy)
      .sort((a, b) => (a.responseTime || Infinity) - (b.responseTime || Infinity)) // 按响应时间排序
    
    if (healthyInstances.length > 0) {
      const bestInstance = healthyInstances[0].instance
      // 缓存最佳实例
      localStorage.setItem('rsshub_healthy_instance', JSON.stringify({
        instance: bestInstance,
        timestamp: Date.now()
      }))
      return bestInstance
    }
    
    // 如果没有健康实例，返回第一个并记录警告
    console.warn('没有可用的RSSHub实例，使用默认实例')
    return this.instances[0]
  }
  
  /**
   * 构建RSSHub URL
   */
  async buildEnhancedRsshubUrl(
    route: string, 
    routeParams: RsshubRouteParams = {},
    queryParams: RsshubParams = {}
  ): Promise<string> {
    // 获取健康实例
    const instance = await this.getHealthyInstance()
    
    // 确保路由以/开头
    if (!route.startsWith('/')) {
      route = '/' + route
    }
    
    // 替换路由参数
    Object.entries(routeParams).forEach(([key, value]) => {
      route = route.replace(`:${key}`, encodeURIComponent(value))
    })
    
    // 构建查询参数
    const options: RsshubServiceOptions = {
      instanceBaseUrl: instance
    }
    
    // 转换查询参数
    const params: Record<string, string> = {}
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        params[key] = String(value)
      }
    })
    
    return buildRsshubUrl(route, params, options)
  }
  
  /**
   * 从缓存获取Feed
   */
  private getCachedFeed(url: string): RssFeed | null {
    if (!this.useLocalCache) return null
    
    const cachedData = localStorage.getItem(`rssfeed:${url}`)
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData)
      if (Date.now() - timestamp < this.cacheDuration) {
        return data as RssFeed
      }
    }
    return null
  }
  
  /**
   * 缓存Feed
   */
  private cacheFeed(url: string, feed: RssFeed): void {
    if (!this.useLocalCache) return
    
    localStorage.setItem(`rssfeed:${url}`, JSON.stringify({
      data: feed,
      timestamp: Date.now()
    }))
  }
  
  /**
   * 获取Feed
   */
  async fetchFeed(
    route: string, 
    routeParams: RsshubRouteParams = {},
    queryParams: RsshubParams = {}
  ): Promise<RssFeed> {
    const url = await this.buildEnhancedRsshubUrl(route, routeParams, queryParams)
    
    // 检查缓存
    const cachedFeed = this.getCachedFeed(url)
    if (cachedFeed) {
      return cachedFeed
    }
    
    try {
      // 获取Feed
      const feed = await fetchRsshubFeed(route, queryParams, {
        instanceBaseUrl: await this.getHealthyInstance()
      })
      
      // 缓存Feed
      this.cacheFeed(url, feed)
      return feed
    } catch (error) {
      console.error(`从实例获取Feed失败: ${url}`, error)
      
      // 尝试其他实例
      if (this.instances.length > 1) {
        for (const instance of this.instances) {
          try {
            const feed = await fetchRsshubFeed(route, queryParams, {
              instanceBaseUrl: instance
            })
            this.cacheFeed(url, feed)
            return feed
          } catch {}
        }
      }
      throw error
    }
  }
  
  /**
   * 验证RSSHub路由
   */
  async validateRoute(route: string): Promise<boolean> {
    // 先检查是否有健康的实例
    const healthyInstances = await this.checkAllInstances()
    const hasHealthyInstance = healthyInstances.some(instance => instance.isHealthy)
    
    if (!hasHealthyInstance) {
      console.warn('没有可用的RSSHub实例')
      // 尝试使用前端直接验证
      return this.validateRouteDirectly(route)
    }

    try {
      const response = await apiClient.get<ApiResponse<boolean>>('/feeds/rsshub/validate', {
        params: { route },
        timeout: 8000 // 进一步减少超时时间到8秒
      })
      return response.data.data || false
    } catch (error: any) {
      console.warn('路由验证失败:', error?.message || error)
      
      // 如果是超时错误，清除健康实例缓存
      if (error?.message?.includes('timeout')) {
        localStorage.removeItem('rsshub_healthy_instance')
      }
      
      // 后端验证失败，尝试前端直接验证
      return this.validateRouteDirectly(route)
    }
  }
  
  /**
   * 前端直接验证RSSHub路由（当后端验证失败时使用）
   */
  async validateRouteDirectly(route: string): Promise<boolean> {
    try {
      const instance = this.instances[0]
      // 确保路由以/开头
      if (!route.startsWith('/')) {
        route = '/' + route
      }
      
      // 尝试直接从RSSHub获取内容
      const url = `${instance}${route}`
      const response = await axios.get(url, { 
        timeout: 10000,
        responseType: 'text'
      })
      
      // 检查是否包含RSS基本要素
      const content = response.data
      const isValid = content.includes('<rss') || 
                      content.includes('<feed') || 
                      content.includes('<channel') ||
                      content.includes('<?xml')
      
      return isValid
    } catch (error) {
      console.warn('直接验证路由失败:', error)
      return false
    }
  }
  
  /**
   * 添加RSSHub源
   */
  async addRsshubSource(route: string, name?: string, category?: string): Promise<RssSource> {
    try {
      const response = await apiClient.post<ApiResponse<RssSource>>('/feeds/rsshub', {
        route,
        name,
        category
      })
      return response.data.data!
    } catch (error) {
      console.error('添加RSSHub源失败:', error)
      throw error
    }
  }
  
  /**
   * 添加高级RSSHub源（支持参数）
   */
  async addAdvancedRsshubSource(
    route: string, 
    routeParams: RsshubRouteParams = {},
    queryParams: RsshubParams = {},
    name?: string, 
    category?: string
  ): Promise<RssSource> {
    try {
      const response = await apiClient.post<ApiResponse<RssSource>>('/feeds/rsshub/advanced', {
        route,
        routeParams,
        queryParams,
        name,
        category
      })
      return response.data.data!
    } catch (error) {
      console.error('添加高级RSSHub源失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export const enhancedRsshubService = new EnhancedRsshubService()
export default enhancedRsshubService 