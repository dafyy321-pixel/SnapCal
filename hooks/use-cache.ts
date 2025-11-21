/**
 * 缓存相关的React Hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { cacheManager } from '@/lib/cache/cache-manager'
import { CACHE_KEYS } from '@/lib/cache/config'
import { authService } from '@/lib/supabase'

/**
 * 通用的认证fetcher函数
 */
async function authenticatedFetcher(url: string): Promise<Response> {
  const session = await authService.getSession()
  if (!session?.access_token) {
    throw new Error('未登录')
  }

  return fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })
}

/**
 * 通用的数据缓存Hook
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number
    strategy?: 'memory-first' | 'storage-first' | 'memory-only' | 'storage-only'
    enabled?: boolean
    revalidateOnFocus?: boolean
    revalidateOnReconnect?: boolean
    refreshInterval?: number
  } = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5分钟默认TTL
    strategy = 'memory-first',
    enabled = true,
    revalidateOnFocus = false,
    revalidateOnReconnect = false,
    refreshInterval
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const execute = useCallback(async (forceRefresh = false) => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      // 如果不是强制刷新，先尝试从缓存获取
      if (!forceRefresh) {
        try {
          const cachedData = await cacheManager.get<T>(key)
          if (cachedData !== null) {
            setData(cachedData)
            setLastUpdated(new Date())
            setLoading(false)
            return cachedData
          }
        } catch (cacheError) {
          console.warn('[useCachedData] 缓存读取失败:', cacheError)
          // 继续执行网络请求
        }
      }

      // 执行数据获取
      const result = await fetcherRef.current()

      // 缓存结果
      await cacheManager.set(key, result, { ttl, strategy })

      setData(result)
      setLastUpdated(new Date())
      return result

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [key, ttl, strategy, enabled])

  // 手动刷新函数
  const mutate = useCallback(async (newData?: T) => {
    if (newData !== undefined) {
      await cacheManager.set(key, newData, { ttl, strategy })
      setData(newData)
      setLastUpdated(new Date())
      return newData
    }
    return execute(true)
  }, [key, ttl, strategy, execute])

  // 初始化
  useEffect(() => {
    execute()
  }, [execute])

  // 定时刷新
  useEffect(() => {
    if (!refreshInterval || !enabled) return

    const interval = setInterval(() => {
      execute(true)
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, execute, enabled])

  // 窗口焦点刷新
  useEffect(() => {
    if (!revalidateOnFocus || !enabled) return

    const handleFocus = () => execute(true)
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [revalidateOnFocus, execute, enabled])

  // 网络重连刷新
  useEffect(() => {
    if (!revalidateOnReconnect || !enabled) return

    const handleReconnect = () => execute(true)
    window.addEventListener('online', handleReconnect)
    return () => window.removeEventListener('online', handleReconnect)
  }, [revalidateOnReconnect, execute, enabled])

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh: () => execute(true),
    mutate
  }
}

/**
 * 餐食数据的专用缓存Hook
 */
export function useCachedMeals(date: string) {
  return useCachedData(
    CACHE_KEYS.MEALS_BY_DATE(date),
    async () => {
      const response = await authenticatedFetcher(`/api/meals?date=${date}`)
      if (!response.ok) {
        throw new Error(`获取餐食数据失败: ${response.statusText}`)
      }
      return response.json()
    },
    {
      ttl: 5 * 60 * 1000, // 5分钟
      strategy: 'memory-first',
      revalidateOnFocus: true
    }
  )
}

/**
 * 分析数据的专用缓存Hook
 */
export function useCachedAnalytics(timeframe: string = '本周') {
  return useCachedData(
    CACHE_KEYS.ANALYTICS_BY_TIMEFRAME(timeframe),
    async () => {
      const response = await authenticatedFetcher(`/api/analytics?timeframe=${encodeURIComponent(timeframe)}`)
      if (!response.ok) {
        throw new Error(`获取分析数据失败: ${response.statusText}`)
      }
      return response.json()
    },
    {
      ttl: 30 * 60 * 1000, // 30分钟
      strategy: 'memory-first',
      revalidateOnFocus: false
    }
  )
}

/**
 * 用户资料的专用缓存Hook
 */
export function useCachedProfile() {
  return useCachedData(
    'user-profile',
    async () => {
      const response = await authenticatedFetcher('/api/profile')
      if (!response.ok) {
        throw new Error(`获取用户资料失败: ${response.statusText}`)
      }
      return response.json()
    },
    {
      ttl: 60 * 60 * 1000, // 1小时
      strategy: 'storage-first',
      revalidateOnFocus: false
    }
  )
}

/**
 * 失效缓存的Hook
 */
export function useCacheInvalidation() {
  const invalidate = useCallback(async (pattern: string) => {
    await cacheManager.invalidate(pattern)
  }, [])

  const invalidateMeals = useCallback(async (date?: string) => {
    if (date) {
      await cacheManager.invalidate(CACHE_KEYS.MEALS_BY_DATE(date))
    } else {
      await cacheManager.invalidate('meals-')
    }
  }, [])

  const invalidateAnalytics = useCallback(async (timeframe?: string) => {
    if (timeframe) {
      await cacheManager.invalidate(CACHE_KEYS.ANALYTICS_BY_TIMEFRAME(timeframe))
    } else {
      await cacheManager.invalidate('analytics-')
    }
  }, [])

  const invalidateProfile = useCallback(async () => {
    await cacheManager.invalidate('user-')
  }, [])

  const clearAll = useCallback(async () => {
    await cacheManager.clear()
  }, [])

  return {
    invalidate,
    invalidateMeals,
    invalidateAnalytics,
    invalidateProfile,
    clearAll
  }
}

/**
 * 缓存状态监控Hook
 */
export function useCacheStats() {
  const [stats, setStats] = useState(() => cacheManager.getStats())

  useEffect(() => {
    const updateStats = () => setStats(cacheManager.getStats())

    // 监听缓存事件
    cacheManager.on('set', updateStats)
    cacheManager.on('delete', updateStats)
    cacheManager.on('clear', updateStats)

    return () => {
      // 由于 on 方法返回 void，我们无法直接取消订阅
      // 在实际应用中，可以改进事件系统以支持取消订阅
    }
  }, [])

  return stats
}

/**
 * 获取缓存管理器实例的Hook
 */
export function useCacheManager() {
  return cacheManager
}