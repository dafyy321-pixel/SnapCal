"use client"

import { useEffect } from 'react'

export function PerformanceMonitor() {
  useEffect(() => {
    // 仅在开发环境启用
    if (process.env.NODE_ENV !== 'development') return

    // 监控页面加载性能
    const logPerformance = () => {
      if (typeof window === 'undefined') return

      // 等待页面完全加载
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        let totalTime = 0

        if (perfData) {
          console.group('📊 页面性能指标')
          
          // DNS查询时间
          const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart
          console.log(`🌐 DNS查询: ${dnsTime.toFixed(0)}ms`)
          
          // TCP连接时间
          const tcpTime = perfData.connectEnd - perfData.connectStart
          console.log(`🔗 TCP连接: ${tcpTime.toFixed(0)}ms`)
          
          // 请求响应时间
          const requestTime = perfData.responseEnd - perfData.requestStart
          console.log(`📡 请求响应: ${requestTime.toFixed(0)}ms`)
          
          // DOM解析时间
          const domParseTime = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart
          console.log(`📄 DOM解析: ${domParseTime.toFixed(0)}ms`)
          
          // 页面完全加载时间
          const loadTime = perfData.loadEventEnd - perfData.loadEventStart
          console.log(`⚡ 完全加载: ${loadTime.toFixed(0)}ms`)
          
          // 总时间
          totalTime = perfData.loadEventEnd - perfData.fetchStart
          console.log(`🎯 总加载时间: ${totalTime.toFixed(0)}ms`)
          
          console.groupEnd()
        }

        // 监控资源加载
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        
        // 按类型分组
        const resourcesByType: { [key: string]: PerformanceResourceTiming[] } = {}
        resources.forEach(resource => {
          const type = getResourceType(resource.name)
          if (!resourcesByType[type]) {
            resourcesByType[type] = []
          }
          resourcesByType[type].push(resource)
        })

        console.group('📦 资源加载统计')
        
        Object.keys(resourcesByType).forEach(type => {
          const items = resourcesByType[type]
          const totalSize = items.reduce((sum, item) => sum + (item.transferSize || 0), 0)
          const avgTime = items.reduce((sum, item) => sum + item.duration, 0) / items.length
          
          console.log(`${getTypeIcon(type)} ${type}:`)
          console.log(`  数量: ${items.length}`)
          console.log(`  大小: ${(totalSize / 1024).toFixed(2)} KB`)
          console.log(`  平均加载时间: ${avgTime.toFixed(0)}ms`)
        })
        
        console.groupEnd()

        // 找出最慢的资源
        const slowResources = resources
          .filter(r => r.duration > 500)
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5)

        if (slowResources.length > 0) {
          console.group('🐌 加载最慢的资源')
          slowResources.forEach(resource => {
            console.log(`⚠️  ${getFileName(resource.name)}`)
            console.log(`   耗时: ${resource.duration.toFixed(0)}ms`)
            console.log(`   大小: ${((resource.transferSize || 0) / 1024).toFixed(2)} KB`)
          })
          console.groupEnd()
        }

        // 检查API调用
        const apiCalls = resources.filter(r => r.name.includes('/api/'))
        if (apiCalls.length > 0) {
          console.group('🔌 API调用性能')
          apiCalls.forEach(call => {
            const status = call.duration > 1000 ? '❌' : call.duration > 500 ? '⚠️' : '✅'
            console.log(`${status} ${getFileName(call.name)}: ${call.duration.toFixed(0)}ms`)
          })
          console.groupEnd()
        }

        // 性能建议
        const suggestions: string[] = []
        
        if (totalTime > 3000) {
          suggestions.push('页面加载超过3秒，建议优化')
        }
        
        const largeImages = resources.filter(r => 
          r.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) && 
          (r.transferSize || 0) > 500 * 1024
        )
        if (largeImages.length > 0) {
          suggestions.push(`发现 ${largeImages.length} 个大图片 (>500KB)，建议压缩`)
        }

        const slowAPIs = apiCalls.filter(r => r.duration > 1000)
        if (slowAPIs.length > 0) {
          suggestions.push(`${slowAPIs.length} 个API调用超过1秒，建议优化或添加缓存`)
        }

        if (suggestions.length > 0) {
          console.group('💡 优化建议')
          suggestions.forEach(s => console.log(`• ${s}`))
          console.groupEnd()
        } else {
          console.log('✅ 性能良好，无明显优化点')
        }

      }, 2000) // 等待2秒确保所有资源加载完成
    }

    if (document.readyState === 'complete') {
      logPerformance()
    } else {
      window.addEventListener('load', logPerformance)
      return () => window.removeEventListener('load', logPerformance)
    }
  }, [])

  return null
}

// 辅助函数
function getResourceType(url: string): string {
  if (url.includes('/api/')) return 'API'
  if (url.match(/\.(js|mjs)$/i)) return 'JavaScript'
  if (url.match(/\.css$/i)) return 'CSS'
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'Images'
  if (url.match(/\.(woff|woff2|ttf|otf)$/i)) return 'Fonts'
  return 'Other'
}

function getTypeIcon(type: string): string {
  const icons: { [key: string]: string } = {
    'API': '🔌',
    'JavaScript': '📜',
    'CSS': '🎨',
    'Images': '🖼️',
    'Fonts': '🔤',
    'Other': '📄'
  }
  return icons[type] || '📦'
}

function getFileName(url: string): string {
  try {
    const urlObj = new URL(url)
    const parts = urlObj.pathname.split('/')
    return parts[parts.length - 1] || urlObj.pathname
  } catch {
    return url
  }
}
