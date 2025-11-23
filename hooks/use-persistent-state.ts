/**
 * 持久化状态管理hooks
 * 提供localStorage自动同步的状态管理解决方案
 */

import { useState, useEffect } from 'react'

/**
 * 通用的持久化状态Hook
 * @param key 存储键名
 * @param initialValue 初始值
 * @returns [state, setState] 元组
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // 获取初始值
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // 同步到localStorage
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const valueToStore = state instanceof Function ? state() : state
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, state])

  return [state, setState]
}

/**
 * 用户配置状态管理
 */
export function useUserProfile() {
  return usePersistentState('snapcal-user-profile', {
    calorieGoal: 1800,
    proteinGoal: 50,
    carbsGoal: 30,
    fatsGoal: 20,
    unit: 'metric' as 'metric' | 'imperial',
    theme: 'system' as 'light' | 'dark' | 'system',
    notifications: {
      mealReminders: true,
      dailyGoals: true,
      achievements: false
    }
  })
}

/**
 * 应用设置状态管理
 */
export function useAppSettings() {
  return usePersistentState('snapcal-app-settings', {
    language: 'zh-CN',
    autoSave: true,
    analytics: true,
    firstVisit: true,
    lastLoginDate: null as string | null,
    onboardingStep: 0,
    sidebarCollapsed: false
  })
}

/**
 * UI偏好状态管理
 */
export function useUIPreferences() {
  return usePersistentState('snapcal-ui-preferences', {
    defaultView: 'grid' as 'grid' | 'list',
    itemsPerPage: 20,
    mealTypeColors: {
      breakfast: '#10b981',
      lunch: '#3b82f6',
      dinner: '#f59e0b',
      snack: '#8b5cf6'
    },
    chartType: 'line' as 'line' | 'bar' | 'area',
    showWeekends: true,
    timeFormat: '24h' as '12h' | '24h'
  })
}

/**
 * 数据缓存状态管理
 */
export function useDataCache() {
  return usePersistentState('snapcal-data-cache', {
    meals: {},
    analytics: {},
    lastSync: null as string | null,
    syncInProgress: false
  })
}

/**
 * 首次加载状态管理（专门用于骨架屏控制）
 */
export function useFirstVisit() {
  const [isFirstVisit, setIsFirstVisit] = usePersistentState('snapcal-first-visit', true)

  const markAsVisited = () => {
    setIsFirstVisit(false)
  }

  return {
    isFirstVisit,
    markAsVisited,
    setIsFirstVisit
  }
}

/**
 * 安全的localStorage操作工具
 */
export const localStorageUtils = {
  /**
   * 安全地获取localStorage值
   */
  get<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') {
      return defaultValue || null
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return defaultValue || null
    }
  },

  /**
   * 安全地设置localStorage值
   */
  set<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
      return false
    }
  },

  /**
   * 删除localStorage键
   */
  remove(key: string): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    try {
      window.localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
      return false
    }
  },

  /**
   * 清除所有应用相关的localStorage
   */
  clear(pattern: string = 'snapcal-'): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const keys = Object.keys(window.localStorage)
      keys.forEach(key => {
        if (key.startsWith(pattern)) {
          window.localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Error clearing localStorage:', error)
    }
  },

  /**
   * 获取存储大小估算（KB）
   */
  getStorageSize(pattern: string = 'snapcal-'): number {
    if (typeof window === 'undefined') {
      return 0
    }

    try {
      let totalSize = 0
      const keys = Object.keys(window.localStorage)

      keys.forEach(key => {
        if (key.startsWith(pattern)) {
          const value = window.localStorage.getItem(key) || ''
          totalSize += (key + value).length
        }
      })

      return Math.round(totalSize / 1024) // 转换为KB
    } catch (error) {
      console.warn('Error calculating localStorage size:', error)
      return 0
    }
  }
}