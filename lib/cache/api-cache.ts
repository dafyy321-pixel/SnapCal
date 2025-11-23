/**
 * API缓存中间件 - 自动缓存API响应
 */

import { cacheManager } from './cache-manager'
import { CACHE_KEYS } from './config'
import { CacheEvent } from './types'

// API缓存配置
interface ApiCacheConfig {
  ttl: number
  strategy: 'memory-first' | 'storage-first' | 'memory-only' | 'storage-only'
  keyGenerator: (url: string, options: RequestInit) => string
  shouldCache: (response: Response) => boolean
  maxSize?: number
}

// 默认缓存策略
const DEFAULT_CACHE_CONFIG: Record<string, ApiCacheConfig> = {
  // 餐食数据API
  '/api/meals': {
    ttl: 5 * 60 * 1000, // 5分钟
    strategy: 'memory-first',
    keyGenerator: (url, options) => {
      const searchParams = new URL(url, window.location.origin).searchParams
      const date = searchParams.get('date') || 'today'
      return CACHE_KEYS.MEALS_BY_DATE(date)
    },
    shouldCache: (response) => response.ok,
  },

  // 分析数据API
  '/api/analytics': {
    ttl: 30 * 60 * 1000, // 30分钟
    strategy: 'memory-first',
    keyGenerator: (url, options) => {
      const searchParams = new URL(url, window.location.origin).searchParams
      const timeframe = searchParams.get('timeframe') || '本周'
      return CACHE_KEYS.ANALYTICS_BY_TIMEFRAME(timeframe)
    },
    shouldCache: (response) => response.ok,
  },

  // 用户资料API
  '/api/profile': {
    ttl: 60 * 60 * 1000, // 1小时
    strategy: 'storage-first',
    keyGenerator: () => 'user-profile',
    shouldCache: (response) => response.ok,
  },

  // 用户目标API
  '/api/profile/goals': {
    ttl: 12 * 60 * 60 * 1000, // 12小时
    strategy: 'storage-first',
    keyGenerator: () => 'user-goals',
    shouldCache: (response) => response.ok,
  },
}

// 请求去重管理
const pendingRequests = new Map<string, Promise<Response>>()

/**
 * 缓存式fetch函数
 */
export async function cachedFetch(
  input: RequestInfo | URL,
  init?: RequestInit & {
    cache?: ApiCacheConfig
    skipCache?: boolean
    forceRefresh?: boolean
  }
): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString()
  const options = init || {}

  // 如果明确跳过缓存
  if (options.skipCache) {
    return fetch(input, options)
  }

  // 获取缓存配置
  const cacheConfig = options.cache || getCacheConfigForUrl(url)

  // 如果没有缓存配置，使用普通fetch
  if (!cacheConfig) {
    return fetch(input, options)
  }

  // 生成缓存键
  const cacheKey = cacheConfig.keyGenerator(url, options)

  try {
    // 请求去重 - 如果相同的请求正在进行，返回Promise
    if (!options.forceRefresh && pendingRequests.has(cacheKey)) {
      console.log('[API Cache] 使用去重请求:', cacheKey)
      return pendingRequests.get(cacheKey)!
    }

    // 如果不是强制刷新，尝试从缓存获取
    if (!options.forceRefresh) {
      const cachedResponse = await getCachedResponse(cacheKey)
      if (cachedResponse) {
        console.log('[API Cache] 缓存命中:', cacheKey)
        return cachedResponse
      }
    }

    // 创建新的请求Promise
    const requestPromise = createFetchRequest(input, options, cacheKey, cacheConfig)
    pendingRequests.set(cacheKey, requestPromise)

    try {
      const response = await requestPromise

      // 清理去重记录
      pendingRequests.delete(cacheKey)

      return response

    } catch (error) {
      // 请求失败时，尝试返回缓存数据（降级处理）
      console.warn('[API Cache] 请求失败，尝试缓存降级:', cacheKey, error)
      pendingRequests.delete(cacheKey)

      const fallbackResponse = await getCachedResponse(cacheKey)
      if (fallbackResponse) {
        console.log('[API Cache] 使用缓存降级:', cacheKey)
        return fallbackResponse
      }

      throw error
    }

  } catch (error) {
    console.error('[API Cache] 缓存请求失败:', error)
    throw error
  }
}

/**
 * 从缓存获取响应
 */
async function getCachedResponse(cacheKey: string): Promise<Response | null> {
  try {
    const cachedData = await cacheManager.get<{
      data: any
      status: number
      statusText: string
      headers: Record<string, string>
    }>(cacheKey)

    if (!cachedData) return null

    // 创建模拟响应
    const response = new Response(JSON.stringify(cachedData.data), {
      status: cachedData.status,
      statusText: cachedData.statusText,
      headers: {
        'Content-Type': 'application/json',
        ...cachedData.headers,
        'X-Cache': 'HIT',
        'X-Cache-Key': cacheKey,
      },
    })

    return response

  } catch (error) {
    console.warn('[API Cache] 获取缓存响应失败:', cacheKey, error)
    return null
  }
}

/**
 * 创建实际请求并缓存响应
 */
async function createFetchRequest(
  input: RequestInfo | URL,
  options: RequestInit,
  cacheKey: string,
  cacheConfig: ApiCacheConfig
): Promise<Response> {
  console.log('[API Cache] 发起新请求:', cacheKey)

  // 添加缓存标识头
  const fetchOptions = {
    ...options,
    headers: {
      ...options.headers,
      'X-Cache': 'MISS',
    },
  }

  const response = await fetch(input, fetchOptions)

  // 如果响应满足缓存条件，缓存响应数据
  if (cacheConfig.shouldCache(response)) {
    try {
      const responseClone = response.clone()
      const data = await responseClone.json()

      const cacheData = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      }

      await cacheManager.set(cacheKey, cacheData, {
        ttl: cacheConfig.ttl,
        strategy: cacheConfig.strategy,
      })

      console.log('[API Cache] 响应已缓存:', cacheKey)

    } catch (error) {
      console.warn('[API Cache] 缓存响应失败:', cacheKey, error)
      // 不抛出错误，不影响正常的响应流程
    }
  }

  return response
}

/**
 * 根据URL获取缓存配置
 */
function getCacheConfigForUrl(url: string): ApiCacheConfig | null {
  for (const [path, config] of Object.entries(DEFAULT_CACHE_CONFIG)) {
    if (url.startsWith(path)) {
      return config
    }
  }
  return null
}

/**
 * 清除相关缓存
 */
export async function invalidateApiCache(pattern: string): Promise<void> {
  await cacheManager.invalidate(pattern)
}

/**
 * 预加载API数据
 */
export async function preloadApiData(
  requests: Array<{
    url: string
    options?: RequestInit
    priority?: 'high' | 'medium' | 'low'
  }>
): Promise<void> {
  const tasks = requests.map(({ url, options, priority = 'medium' }) => {
    const cacheConfig = getCacheConfigForUrl(url)
    const cacheKey = cacheConfig?.keyGenerator(url, options || {}) || url

    const { cache: originalCache, ...restOptions } = options || {}
    const fetchOptions = {
      ...restOptions,
      ...(cacheConfig ? { cache: cacheConfig } : {})
    } as RequestInit & { cache?: ApiCacheConfig }

    return {
      key: cacheKey,
      fetcher: () => cachedFetch(url, fetchOptions),
      priority,
    }
  })

  await cacheManager.preload(tasks)
}

/**
 * 扩展fetch全局函数（可选）
 */
export function setupGlobalCache(): void {
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch

    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      // 只对相同域名的API请求使用缓存
      const url = typeof input === 'string' ? input : input.toString()

      if (url.startsWith('/api/') || url.includes(window.location.origin)) {
        return cachedFetch(input, init as RequestInit & { cache?: ApiCacheConfig; skipCache?: boolean; forceRefresh?: boolean })
      }

      return originalFetch.call(this, input, init)
    }

    console.log('[API Cache] 全局缓存已启用')
  }
}

/**
 * 获取API缓存统计
 */
export function getApiCacheStats() {
  return cacheManager.getStats()
}

/**
 * 清除所有API缓存
 */
export function clearApiCache(): Promise<void> {
  return cacheManager.invalidate('^(meals|analytics|user|api)-')
}

// 监听缓存事件
cacheManager.on('set', (event: CacheEvent) => {
  if (typeof window !== 'undefined') {
    // 发送缓存更新事件，供其他组件监听
    window.dispatchEvent(new CustomEvent('cache-updated', {
      detail: { key: event.key, timestamp: event.timestamp }
    }))
  }
})

// 导出便捷函数
export const apiCache = {
  fetch: cachedFetch,
  invalidate: invalidateApiCache,
  preload: preloadApiData,
  clear: clearApiCache,
  stats: getApiCacheStats,
  setup: setupGlobalCache,
}