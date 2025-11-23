/**
 * 缓存管理器 - 核心缓存系统
 */

import {
  CacheItem,
  CacheOptions,
  CacheStats,
  StorageCacheItem,
  CacheEvent,
  PreloadTask
} from './types'
import {
  CACHE_TTL,
  STORAGE_LIMITS,
  CACHE_STRATEGIES,
  CACHE_KEYS,
  CACHE_VERSION,
  CACHE_PREFIX,
  CACHE_ERRORS
} from './config'

export class CacheManager {
  private static instance: CacheManager
  private memoryCache = new Map<string, CacheItem>()
  private eventListeners = new Map<string, Function[]>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    totalSize: 0,
    hitRate: 0,
  }
  private preloadQueue: PreloadTask[] = []
  private isPreloading = false

  private constructor() {
    // 初始化时清理过期缓存
    this.cleanupExpired()
    // 设置定期清理任务
    this.setupPeriodicCleanup()
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * 获取缓存数据
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // 1. 尝试从内存缓存获取
      let cacheItem: CacheItem<T> | null | undefined = this.memoryCache.get(key)

      if (cacheItem && !this.isExpired(cacheItem)) {
        this.updateStats('hits')
        this.emitEvent({ type: 'get', key, timestamp: Date.now(), data: cacheItem.data })
        return cacheItem.data as T
      }

      // 2. 从localStorage获取
      cacheItem = await this.getFromStorage<T>(key)

      if (cacheItem) {
        if (!this.isExpired(cacheItem)) {
          // 恢复到内存缓存
          this.memoryCache.set(key, cacheItem)
          this.updateStats('hits')
          this.emitEvent({ type: 'get', key, timestamp: Date.now(), data: cacheItem.data })
          return cacheItem.data as T
        } else {
          // 清理过期缓存
          this.deleteFromStorage(key)
        }
      }

      this.updateStats('misses')
      this.emitEvent({ type: 'get', key, timestamp: Date.now() })
      return null

    } catch (error) {
      console.error('[CacheManager] 获取缓存失败:', error)
      this.updateStats('errors')
      this.emitEvent({ type: 'error', key, timestamp: Date.now(), error: error as Error })
      return null
    }
  }

  /**
   * 设置缓存数据
   */
  async set<T>(key: string, data: T, options?: CacheOptions): Promise<void> {
    try {
      const strategy = CACHE_STRATEGIES[key] || {
        key,
        ttl: CACHE_TTL.DEFAULT,
        strategy: 'memory-first',
      }

      const ttl = options?.ttl || strategy.ttl || CACHE_TTL.DEFAULT

      // 对餐食数据进行清理以减少大小
      let cacheData = data
      const isMealsData = key.startsWith('meals-')
      if (isMealsData) {
        cacheData = this.sanitizeMealsData(data)
      }

      const cacheItem: CacheItem<T> = {
        data: cacheData,
        timestamp: Date.now(),
        ttl,
        key,
        size: this.calculateSize(cacheData),
      }

      // 检查数据大小 - 餐食数据使用特殊的大小限制
      const maxSize = isMealsData
        ? (strategy.maxSize || STORAGE_LIMITS.MAX_MEALS_ITEM_SIZE)
        : (strategy.maxSize || STORAGE_LIMITS.MAX_ITEM_SIZE)

      if (cacheItem.size && cacheItem.size > maxSize) {
        console.warn(`[CacheManager] 数据过大，跳过缓存: ${key}, 大小: ${cacheItem.size} 字节, 限制: ${maxSize} 字节`)
        // 对于过大的数据，不抛出错误，而是跳过缓存
        return
      }

      // 根据策略决定存储位置
      const storeStrategy = options?.strategy || strategy.strategy

      if (storeStrategy === 'memory-only' || storeStrategy === 'memory-first') {
        this.memoryCache.set(key, cacheItem)
      }

      if (storeStrategy === 'storage-only' || storeStrategy === 'storage-first') {
        await this.setToStorage(key, cacheItem)
      }

      // 确保内存缓存不会过大
      this.enforceMemoryLimit()

      this.updateStats('sets')
      this.updateTotalSize()
      this.emitEvent({ type: 'set', key, timestamp: Date.now(), data })

      // 后台刷新
      if (options?.backgroundRefresh || strategy.backgroundRefresh) {
        this.scheduleBackgroundRefresh(key, ttl)
      }

    } catch (error) {
      console.error('[CacheManager] 设置缓存失败:', error)
      this.updateStats('errors')
      this.emitEvent({ type: 'error', key, timestamp: Date.now(), error: error as Error })
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key)
      await this.deleteFromStorage(key)

      this.updateStats('deletes')
      this.updateTotalSize()
      this.emitEvent({ type: 'delete', key, timestamp: Date.now() })

    } catch (error) {
      console.error('[CacheManager] 删除缓存失败:', error)
      this.updateStats('errors')
      this.emitEvent({ type: 'error', key, timestamp: Date.now(), error: error as Error })
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear()
      await this.clearStorage()

      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
        totalSize: 0,
        hitRate: 0,
      }

      this.emitEvent({ type: 'clear', key: '*', timestamp: Date.now() })

    } catch (error) {
      console.error('[CacheManager] 清空缓存失败:', error)
      this.updateStats('errors')
      this.emitEvent({ type: 'error', key: '*', timestamp: Date.now(), error: error as Error })
    }
  }

  /**
   * 批量删除匹配模式的缓存
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      const regex = new RegExp(pattern.replace('*', '.*'))

      // 删除内存缓存
      for (const [key] of this.memoryCache.entries()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key)
        }
      }

      // 删除存储缓存
      await this.invalidateStorage(regex)

      this.updateTotalSize()
      this.emitEvent({ type: 'delete', key: pattern, timestamp: Date.now() })

    } catch (error) {
      console.error('[CacheManager] 批量删除缓存失败:', error)
      this.updateStats('errors')
      this.emitEvent({ type: 'error', key: pattern, timestamp: Date.now(), error: error as Error })
    }
  }

  /**
   * 预加载数据
   */
  async preload(tasks: PreloadTask[]): Promise<void> {
    this.preloadQueue.push(...tasks)

    if (!this.isPreloading) {
      this.isPreloading = true
      await this.processPreloadQueue()
      this.isPreloading = false
    }
  }

  /**
   * 检查缓存是否存在且有效
   */
  async isValid(key: string): Promise<boolean> {
    try {
      const cacheItem = this.memoryCache.get(key) || await this.getFromStorage(key)
      return cacheItem ? !this.isExpired(cacheItem) : false
    } catch {
      return false
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    this.stats.hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0
    return { ...this.stats }
  }

  /**
   * 事件监听
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  /**
   * 移除事件监听
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // 私有方法

  private async getFromStorage<T>(key: string): Promise<CacheItem<T> | null> {
    if (typeof window === 'undefined') return null

    try {
      const storageKey = CACHE_PREFIX + key
      const stored = localStorage.getItem(storageKey)

      if (!stored) return null

      const storageItem: StorageCacheItem<T> = JSON.parse(stored)

      // 版本检查
      if (storageItem.version !== CACHE_VERSION) {
        localStorage.removeItem(storageKey)
        return null
      }

      return {
        data: storageItem.data,
        timestamp: storageItem.timestamp,
        ttl: storageItem.ttl,
        key: storageItem.key,
        size: storageItem.size,
      }

    } catch (error) {
      console.warn('[CacheManager] 从存储读取缓存失败:', key, error)
      return null
    }
  }

  private async setToStorage<T>(key: string, cacheItem: CacheItem<T>): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const storageKey = CACHE_PREFIX + key
      const storageItem: StorageCacheItem<T> = {
        ...cacheItem,
        version: CACHE_VERSION,
        compressed: false,
      }

      const serialized = JSON.stringify(storageItem)

      // 检查存储空间
      if (serialized.length > STORAGE_LIMITS.STORAGE_CACHE_SIZE * 1024 * 1024) {
        throw new Error(CACHE_ERRORS.STORAGE_FULL)
      }

      localStorage.setItem(storageKey, serialized)

    } catch (error) {
      if ((error as Error).name === 'QuotaExceededError') {
        this.cleanupStorage() // 清理过期数据后重试
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem))
      } else {
        throw error
      }
    }
  }

  private async deleteFromStorage(key: string): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(CACHE_PREFIX + key)
    } catch (error) {
      console.warn('[CacheManager] 从存储删除缓存失败:', key, error)
    }
  }

  private async clearStorage(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('[CacheManager] 清空存储缓存失败:', error)
    }
  }

  private async invalidateStorage(regex: RegExp): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(CACHE_PREFIX)) {
          const cacheKey = key.replace(CACHE_PREFIX, '')
          if (regex.test(cacheKey)) {
            localStorage.removeItem(key)
          }
        }
      }
    } catch (error) {
      console.warn('[CacheManager] 批量删除存储缓存失败:', error)
    }
  }

  private cleanupStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const keys = Object.keys(localStorage)
      const items: { key: string; item: StorageCacheItem; expiresAt: number }[] = []

      for (const key of keys) {
        if (key.startsWith(CACHE_PREFIX)) {
          try {
            const item: StorageCacheItem = JSON.parse(localStorage.getItem(key)!)
            items.push({
              key,
              item,
              expiresAt: item.timestamp + item.ttl,
            })
          } catch {
            // 清理损坏的数据
            localStorage.removeItem(key)
          }
        }
      }

      // 按过期时间排序，删除最旧的30%
      items.sort((a, b) => a.expiresAt - b.expiresAt)
      const deleteCount = Math.ceil(items.length * 0.3)

      for (let i = 0; i < deleteCount; i++) {
        localStorage.removeItem(items[i].key)
      }

    } catch (error) {
      console.warn('[CacheManager] 清理存储空间失败:', error)
    }
  }

  private isExpired(cacheItem: CacheItem): boolean {
    return Date.now() - cacheItem.timestamp > cacheItem.ttl
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2 // 粗略估算
  }

  /**
   * 清理餐食数据，移除或压缩图片数据以减少缓存大小
   */
  private sanitizeMealsData(data: any): any {
    if (!data || typeof data !== 'object') return data

    try {
      const sanitized = JSON.parse(JSON.stringify(data))

      // 如果是餐食数据，清理图片
      if (sanitized.meals && Array.isArray(sanitized.meals)) {
        sanitized.meals = sanitized.meals.map((meal: any) => ({
          ...meal,
          // 保留图片URL但移除base64数据，或者只保留前100个字符用于识别
          image_url: meal.image_url && meal.image_url.startsWith('data:')
            ? meal.image_url.substring(0, 100) + '...' // 截断base64数据
            : meal.image_url
        }))
      }

      return sanitized
    } catch (error) {
      console.warn('[CacheManager] 清理餐食数据失败:', error)
      return data // 如果清理失败，返回原始数据
    }
  }

  private enforceMemoryLimit(): void {
    if (this.memoryCache.size <= STORAGE_LIMITS.MEMORY_CACHE_SIZE) return

    // 按访问时间排序，删除最旧的
    const items = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)

    const deleteCount = this.memoryCache.size - STORAGE_LIMITS.MEMORY_CACHE_SIZE + 1

    for (let i = 0; i < deleteCount; i++) {
      this.memoryCache.delete(items[i][0])
    }
  }

  private cleanupExpired(): void {
    // 清理内存缓存
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key)
      }
    }

    // 清理存储缓存
    if (typeof window !== 'undefined') {
      this.cleanupStorage()
    }
  }

  private setupPeriodicCleanup(): void {
    // 每5分钟清理一次过期缓存
    setInterval(() => {
      this.cleanupExpired()
    }, 5 * 60 * 1000)
  }

  private scheduleBackgroundRefresh(key: string, ttl: number): void {
    // 在TTL的80%时间后刷新
    const refreshTime = ttl * 0.8

    setTimeout(() => {
      this.emitEvent({ type: 'refresh', key, timestamp: Date.now() })
    }, refreshTime)
  }

  private async processPreloadQueue(): Promise<void> {
    if (this.preloadQueue.length === 0) return

    // 按优先级排序
    this.preloadQueue.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 }
      return priority[b.priority] - priority[a.priority]
    })

    const tasks = [...this.preloadQueue]
    this.preloadQueue = []

    for (const task of tasks) {
      try {
        // 如果已存在有效缓存，跳过
        if (await this.isValid(task.key)) continue

        // 执行预加载
        const data = await task.fetcher()
        await this.set(task.key, data, { ttl: CACHE_TTL.DEFAULT })

      } catch (error) {
        console.warn('[CacheManager] 预加载失败:', task.key, error)
      }
    }
  }

  private updateStats(type: 'hits' | 'misses' | 'sets' | 'deletes' | 'errors'): void {
    this.stats[type]++
  }

  private updateTotalSize(): void {
    this.stats.totalSize = Array.from(this.memoryCache.values())
      .reduce((total, item) => total + (item.size || 0), 0)
  }

  private emitEvent(event: CacheEvent): void {
    const listeners = this.eventListeners.get(event.type) || []
    listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('[CacheManager] 事件监听器错误:', error)
      }
    })
  }
}

// 导出单例实例
export const cacheManager = CacheManager.getInstance()