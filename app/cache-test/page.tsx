"use client"

import { useState, useEffect } from 'react'
import { useCachedMeals, useCachedAnalytics, useCachedProfile } from '@/hooks/use-cache'
import { useCacheStats, useCacheManager } from '@/hooks/use-cache'
import { CacheMonitor } from '@/components/cache-monitor'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export default function CacheTestPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const stats = useCacheStats()
  const clearCache = useCacheManager().clear

  // 测试不同的缓存数据
  const { data: mealsData, loading: mealsLoading, error: mealsError } = useCachedMeals(format(new Date(), 'yyyy-MM-dd'))
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useCachedAnalytics('本周')
  const { data: profileData, loading: profileLoading, error: profileError } = useCachedProfile()

  const runPerformanceTest = async () => {
    const results = []

    // 测试缓存命中
    const start1 = performance.now()
    const data1 = await fetch('/api/meals?date=' + format(new Date(), 'yyyy-MM-dd')).then(r => r.json())
    const end1 = performance.now()

    results.push({
      name: '第一次请求（缓存未命中）',
      time: (end1 - start1).toFixed(2) + 'ms',
      data: data1 ? '成功' : '失败'
    })

    // 立即再次请求（应该缓存命中）
    const start2 = performance.now()
    const data2 = await fetch('/api/meals?date=' + format(new Date(), 'yyyy-MM-dd')).then(r => r.json())
    const end2 = performance.now()

    results.push({
      name: '第二次请求（缓存命中）',
      time: (end2 - start2).toFixed(2) + 'ms',
      data: data2 ? '成功' : '失败'
    })

    setTestResults(results)
  }

  const clearAllCaches = async () => {
    await clearCache()
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">缓存系统测试页面</h1>

        {/* 缓存统计 */}
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">缓存统计</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.hitRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">命中率</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.hits}</div>
              <div className="text-sm text-gray-500">命中次数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.misses}</div>
              <div className="text-sm text-gray-500">未命中次数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{(stats.totalSize / 1024).toFixed(1)}KB</div>
              <div className="text-sm text-gray-500">缓存大小</div>
            </div>
          </div>
        </Card>

        {/* 控制按钮 */}
        <div className="flex gap-4 mb-6">
          <Button onClick={runPerformanceTest}>运行性能测试</Button>
          <Button variant="outline" onClick={clearAllCaches}>清空所有缓存</Button>
        </div>

        {/* 性能测试结果 */}
        {testResults.length > 0 && (
          <Card className="p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">性能测试结果</h2>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-700">{result.name}</span>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{result.time}</div>
                    <div className="text-xs text-gray-500">{result.data}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 数据加载状态 */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">餐食数据</h3>
            <div className="text-sm space-y-1">
              <div>状态: {mealsLoading ? '加载中...' : mealsError ? '错误' : mealsData ? '已加载' : '未加载'}</div>
              <div>数据: {mealsData ? `${mealsData.meals?.length || 0} 条餐食` : '-'}</div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">分析数据</h3>
            <div className="text-sm space-y-1">
              <div>状态: {analyticsLoading ? '加载中...' : analyticsError ? '错误' : analyticsData ? '已加载' : '未加载'}</div>
              <div>数据: {analyticsData ? `${analyticsData.currentPeriod?.mealCount || 0} 餐` : '-'}</div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">用户资料</h3>
            <div className="text-sm space-y-1">
              <div>状态: {profileLoading ? '加载中...' : profileError ? '错误' : profileData ? '已加载' : '未加载'}</div>
              <div>数据: {profileData ? '已获取' : '-'}</div>
            </div>
          </Card>
        </div>

        {/* 使用说明 */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">缓存效果说明</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• <strong>首次访问</strong>: 需要从服务器获取数据，耗时较长（4-7秒）</p>
            <p>• <strong>再次访问</strong>: 从缓存获取数据，几乎瞬时完成（&lt;100ms）</p>
            <p>• <strong>智能刷新</strong>: 缓存过期时后台自动更新</p>
            <p>• <strong>离线支持</strong>: 网络断开时显示缓存数据</p>
            <p>• <strong>预加载</strong>: 智能预加载可能需要的数据</p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>提示</strong>: 右下角的缓存监控组件可以实时查看缓存状态（仅开发环境可见）
            </p>
          </div>
        </Card>
      </div>

      <CacheMonitor />
    </div>
  )
}