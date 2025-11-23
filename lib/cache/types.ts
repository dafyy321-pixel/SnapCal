/**
 * 缓存系统类型定义
 */

// 缓存项数据结构
export interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl: number // 生存时间（毫秒）
  key: string
  size?: number // 数据大小（字节）
}

// 缓存配置选项
export interface CacheOptions {
  ttl?: number // 缓存时间（毫秒）
  strategy?: 'memory-first' | 'storage-first' | 'memory-only' | 'storage-only'
  backgroundRefresh?: boolean // 是否后台刷新
  retryOnError?: boolean // 错误时是否重试
  compress?: boolean // 是否压缩数据
}

// 缓存策略配置
export interface CacheStrategy {
  key: string
  ttl: number
  strategy: CacheOptions['strategy']
  maxSize?: number
  backgroundRefresh?: boolean
  preload?: boolean
}

// 缓存统计信息
export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
  totalSize: number
  hitRate: number
}

// 存储缓存项
export interface StorageCacheItem<T = any> extends CacheItem<T> {
  version: string
  compressed?: boolean
}

// 缓存事件
export interface CacheEvent {
  type: 'set' | 'get' | 'delete' | 'clear' | 'error' | 'refresh'
  key: string
  timestamp: number
  data?: any
  error?: Error
}

// 预加载任务
export interface PreloadTask {
  key: string
  fetcher: () => Promise<any>
  priority: 'high' | 'medium' | 'low'
  dependencies?: string[]
}