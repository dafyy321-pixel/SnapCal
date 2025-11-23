/**
 * 缓存状态监控组件 - 用于开发时查看缓存效果
 */

"use client"

import { useState, useEffect } from 'react'
import { useCacheStats, useCacheManager } from '@/hooks/use-cache'
import { Card } from '@/components/ui/card'

export function CacheMonitor() {
  const stats = useCacheStats()
  const clearCache = useCacheManager().clear
  const [isVisible, setIsVisible] = useState(false)

  // 只在开发环境显示
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    return null
  }

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-20 right-4 z-50 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-50 hover:opacity-100"
      >
        缓存
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
      <Card className="p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-900">缓存状态</h3>
          <button
            onClick={toggleVisibility}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">命中率:</span>
            <span className={`font-medium ${stats.hitRate > 70 ? 'text-green-600' : 'text-yellow-600'}`}>
              {stats.hitRate.toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">命中/未命中:</span>
            <span className="font-medium text-gray-900">
              {stats.hits}/{stats.misses}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">设置次数:</span>
            <span className="font-medium text-gray-900">{stats.sets}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">缓存大小:</span>
            <span className="font-medium text-gray-900">
              {(stats.totalSize / 1024).toFixed(1)}KB
            </span>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => clearCache()}
              className="w-full bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
            >
              清空缓存
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}