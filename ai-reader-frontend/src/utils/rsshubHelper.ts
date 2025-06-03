/**
 * RSSHub 集成辅助工具
 * 提供Radar规则处理、URL转换、实例管理等功能
 */

export interface RadarRule {
  title: string
  docs: string
  source: string[]
  target: string
  script?: string
}

export interface RSSHubInstance {
  url: string
  name: string
  status: 'active' | 'inactive' | 'checking'
  responseTime?: number
}

// 默认RSSHub实例列表
export const DEFAULT_RSSHUB_INSTANCES: RSSHubInstance[] = [
  { url: 'https://rsshub.app', name: '官方实例', status: 'active' },
  { url: 'https://rss.shab.fun', name: 'shab.fun', status: 'active' },
  { url: 'https://rsshub.rssforever.com', name: 'rssforever', status: 'active' }
]

// Radar规则缓存
let radarRulesCache: RadarRule[] | null = null
let radarRulesCacheTime: number = 0
const CACHE_DURATION = 30 * 60 * 1000 // 30分钟

/**
 * 获取RSSHub Radar规则
 */
export async function getRadarRules(): Promise<RadarRule[]> {
  const now = Date.now()
  
  // 检查缓存
  if (radarRulesCache && (now - radarRulesCacheTime) < CACHE_DURATION) {
    return radarRulesCache
  }
  
  try {
    // 尝试从多个实例获取规则
    for (const instance of DEFAULT_RSSHUB_INSTANCES) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(`${instance.url}/api/radar/rules`, {
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const rules = await response.json()
          radarRulesCache = rules
          radarRulesCacheTime = now
          return rules
        }
      } catch (error) {
        console.warn(`Failed to fetch radar rules from ${instance.url}:`, error)
        continue
      }
    }
    
    throw new Error('所有RSSHub实例都无法访问')
  } catch (error) {
    console.error('获取Radar规则失败:', error)
    return []
  }
}

/**
 * 检查URL是否为RSSHub URL
 */
export function isRSSHubUrl(url: string): boolean {
  return DEFAULT_RSSHUB_INSTANCES.some(instance => 
    url.startsWith(instance.url)
  ) || url.includes('rsshub')
}

/**
 * 查找匹配的Radar规则
 */
export function findMatchingRadarRule(url: string, rules: RadarRule[]): RadarRule | null {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname
    
    return rules.find(rule => {
      return rule.source.some(source => {
        // 支持通配符匹配
        const sourcePattern = source.replace(/\*/g, '.*')
        const regex = new RegExp(sourcePattern)
        return regex.test(domain) || regex.test(url)
      })
    }) || null
  } catch (error) {
    console.error('URL解析失败:', error)
    return null
  }
}

/**
 * 构建RSSHub URL
 */
export function constructRSSHubUrl(originalUrl: string, rule: RadarRule, instanceUrl?: string): string {
  const baseUrl = instanceUrl || DEFAULT_RSSHUB_INSTANCES[0].url
  
  try {
    // 基本的URL转换逻辑
    let rsshubPath = rule.target
    
    // 如果规则包含脚本，执行URL转换
    if (rule.script) {
      // 这里可以扩展更复杂的URL转换逻辑
      // 暂时使用简单的字符串替换
      const urlObj = new URL(originalUrl)
      rsshubPath = rsshubPath.replace(':domain', urlObj.hostname)
      rsshubPath = rsshubPath.replace(':path', urlObj.pathname.slice(1))
    }
    
    return `${baseUrl}${rsshubPath}`
  } catch (error) {
    console.error('构建RSSHub URL失败:', error)
    return originalUrl
  }
}

/**
 * 处理RSS URL（转换为RSSHub URL或保持原样）
 */
export async function processRssUrl(inputUrl: string): Promise<{
  url: string
  isRSSHub: boolean
  source: 'original' | 'converted' | 'rsshub'
  rule?: RadarRule
}> {
  // 1. 如果已经是RSSHub URL，直接返回
  if (isRSSHubUrl(inputUrl)) {
    return {
      url: inputUrl,
      isRSSHub: true,
      source: 'rsshub'
    }
  }
  
  // 2. 尝试通过Radar规则转换
  try {
    const rules = await getRadarRules()
    const matchedRule = findMatchingRadarRule(inputUrl, rules)
    
    if (matchedRule) {
      const rsshubUrl = constructRSSHubUrl(inputUrl, matchedRule)
      return {
        url: rsshubUrl,
        isRSSHub: true,
        source: 'converted',
        rule: matchedRule
      }
    }
  } catch (error) {
    console.warn('RSSHub转换失败，使用原始URL:', error)
  }
  
  // 3. 无法转换，返回原始URL
  return {
    url: inputUrl,
    isRSSHub: false,
    source: 'original'
  }
}

/**
 * 检查RSSHub实例健康状态
 */
export async function checkInstanceHealth(instanceUrl: string): Promise<{
  status: 'active' | 'inactive'
  responseTime: number
}> {
  const startTime = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(`${instanceUrl}/`, {
      method: 'GET',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return { status: 'active', responseTime }
    } else {
      return { status: 'inactive', responseTime }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return { status: 'inactive', responseTime }
  }
}

/**
 * 获取最佳RSSHub实例
 */
export async function getBestRSSHubInstance(): Promise<RSSHubInstance> {
  const healthChecks = await Promise.all(
    DEFAULT_RSSHUB_INSTANCES.map(async (instance) => {
      const health = await checkInstanceHealth(instance.url)
      return {
        ...instance,
        status: health.status,
        responseTime: health.responseTime
      }
    })
  )
  
  // 选择响应时间最短的活跃实例
  const activeInstances = healthChecks.filter(instance => instance.status === 'active')
  
  if (activeInstances.length === 0) {
    // 如果所有实例都不可用，返回默认实例
    return DEFAULT_RSSHUB_INSTANCES[0]
  }
  
  return activeInstances.reduce((best, current) => 
    (current.responseTime || Infinity) < (best.responseTime || Infinity) ? current : best
  )
}

/**
 * 生成RSSHub路由建议
 */
export async function suggestRSSHubRoutes(websiteUrl: string): Promise<{
  suggestions: Array<{
    title: string
    url: string
    description: string
    category: string
  }>
}> {
  try {
    const rules = await getRadarRules()
    const matchedRules = rules.filter(rule => 
      findMatchingRadarRule(websiteUrl, [rule])
    )
    
    const suggestions = matchedRules.map(rule => ({
      title: rule.title,
      url: constructRSSHubUrl(websiteUrl, rule),
      description: rule.docs,
      category: extractCategoryFromRule(rule)
    }))
    
    return { suggestions }
  } catch (error) {
    console.error('生成RSSHub路由建议失败:', error)
    return { suggestions: [] }
  }
}

/**
 * 从规则中提取分类
 */
function extractCategoryFromRule(rule: RadarRule): string {
  // 简单的分类逻辑，可以根据需要扩展
  const target = rule.target.toLowerCase()
  
  if (target.includes('github')) return 'tech'
  if (target.includes('weibo') || target.includes('twitter')) return 'social'
  if (target.includes('news') || target.includes('xinwen')) return 'news'
  if (target.includes('bilibili') || target.includes('youtube')) return 'entertainment'
  
  return 'other'
} 