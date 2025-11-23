/**
 * 缓存系统配置
 */

import { CacheStrategy } from './types'

// 缓存时间配置（毫秒）
export const CACHE_TTL = {
  // 餐食数据
  MEALS_TODAY: 5 * 60 * 1000,        // 5分钟 - 当日餐食
  MEALS_HISTORY: 60 * 60 * 1000,     // 1小时 - 历史餐食

  // 统计数据
  ANALYTICS_CURRENT: 30 * 60 * 1000, // 30分钟 - 当前统计
  ANALYTICS_HISTORY: 2 * 60 * 60 * 1000, // 2小时 - 历史统计

  // 用户数据
  USER_PROFILE: 60 * 60 * 1000,      // 1小时 - 用户资料
  USER_GOALS: 12 * 60 * 60 * 1000,   // 12小时 - 用户目标
  USER_SETTINGS: 24 * 60 * 60 * 1000, // 24小时 - 用户设置

  // 分析数据
  ANALYSIS_RESULT: 24 * 60 * 60 * 1000, // 24小时 - 分析结果
  ANALYSIS_HISTORY: 7 * 24 * 60 * 60 * 1000, // 7天 - 分析历史

  // 系统数据
  SYSTEM_CONFIG: 24 * 60 * 60 * 1000, // 24小时 - 系统配置

  // 默认缓存时间
  DEFAULT: 10 * 60 * 1000,           // 10分钟 - 默认
}

// 存储限制配置
export const STORAGE_LIMITS = {
  MEMORY_CACHE_SIZE: 50,             // 内存缓存最大条数
  STORAGE_CACHE_SIZE: 5,             // localStorage最大大小(MB)
  MAX_ITEM_SIZE: 1024 * 1024,        // 单个缓存项最大大小(1MB)
  MAX_MEALS_ITEM_SIZE: 5 * 1024 * 1024, // 餐食数据最大大小(5MB)，因为包含图片
}

// 缓存策略配置
export const CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  // 首页数据
  'meals-today': {
    key: 'meals-today',
    ttl: CACHE_TTL.MEALS_TODAY,
    strategy: 'memory-first',
    backgroundRefresh: true,
    preload: true,
    maxSize: STORAGE_LIMITS.MAX_ITEM_SIZE,
  },

  'meals-history': {
    key: 'meals-history',
    ttl: CACHE_TTL.MEALS_HISTORY,
    strategy: 'storage-first',
    maxSize: STORAGE_LIMITS.MAX_ITEM_SIZE * 2,
  },

  // 分析页面数据
  'analytics-week': {
    key: 'analytics-week',
    ttl: CACHE_TTL.ANALYTICS_CURRENT,
    strategy: 'memory-first',
    backgroundRefresh: true,
    preload: true,
  },

  'analytics-month': {
    key: 'analytics-month',
    ttl: CACHE_TTL.ANALYTICS_CURRENT,
    strategy: 'memory-first',
    backgroundRefresh: true,
  },

  'analytics-comparison': {
    key: 'analytics-comparison',
    ttl: CACHE_TTL.ANALYTICS_HISTORY,
    strategy: 'storage-first',
  },

  // 用户数据
  'user-profile': {
    key: 'user-profile',
    ttl: CACHE_TTL.USER_PROFILE,
    strategy: 'storage-first',
    maxSize: 512 * 1024, // 512KB
  },

  'user-goals': {
    key: 'user-goals',
    ttl: CACHE_TTL.USER_GOALS,
    strategy: 'storage-first',
    maxSize: 256 * 1024, // 256KB
  },

  // 分析结果
  'analysis-result': {
    key: 'analysis-result',
    ttl: CACHE_TTL.ANALYSIS_RESULT,
    strategy: 'storage-first',
    maxSize: STORAGE_LIMITS.MAX_ITEM_SIZE,
  },

  'analysis-history': {
    key: 'analysis-history',
    ttl: CACHE_TTL.ANALYSIS_HISTORY,
    strategy: 'storage-only',
    maxSize: STORAGE_LIMITS.MAX_ITEM_SIZE * 5,
  },
}

// 缓存键生成规则
export const CACHE_KEYS = {
  // 餐食数据
  MEALS_BY_DATE: (date: string) => `meals-${date}`,
  MEALS_TODAY: () => `meals-today-${new Date().toDateString()}`,

  // 统计数据
  ANALYTICS_BY_TIMEFRAME: (timeframe: string) => `analytics-${timeframe}`,
  ANALYTICS_COMPARISON: (current: string, previous: string) => `analytics-compare-${current}-${previous}`,

  // 用户数据
  USER_PROFILE: (userId: string) => `user-profile-${userId}`,
  USER_GOALS: (userId: string) => `user-goals-${userId}`,

  // 分析数据
  ANALYSIS_BY_IMAGE: (imageHash: string) => `analysis-image-${imageHash}`,
  ANALYSIS_HISTORY: (userId: string) => `analysis-history-${userId}`,

  // 系统数据
  APP_CONFIG: 'app-config',
  VERSION_INFO: 'app-version',
}

// 缓存版本号
export const CACHE_VERSION = '1.0.0'

// 缓存前缀
export const CACHE_PREFIX = 'snapcal-cache-'

// 错误类型
export const CACHE_ERRORS = {
  STORAGE_FULL: 'STORAGE_FULL',
  INVALID_KEY: 'INVALID_KEY',
  DATA_TOO_LARGE: 'DATA_TOO_LARGE',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  CORRUPTED_DATA: 'CORRUPTED_DATA',
} as const