'use client'

import { useNetworkStatus } from '@/hooks/use-network-status'
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export function NetworkStatus() {
  const networkStatus = useNetworkStatus()
  const [showDetails, setShowDetails] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // 防止hydration错误 - 确保只在客户端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 服务器端渲染时不显示任何内容，避免hydration不匹配
  if (!isClient) {
    return null
  }

  // 只在离线或有问题时显示
  if (networkStatus.isOnline && !networkStatus.isSlowConnection) {
    return null
  }

  const getStatusColor = () => {
    if (!networkStatus.isOnline) return 'bg-red-500/10 border-red-500/20 text-red-600'
    if (networkStatus.isSlowConnection) return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600'
    return 'bg-blue-500/10 border-blue-500/20 text-blue-600'
  }

  const getStatusIcon = () => {
    if (!networkStatus.isOnline) return <WifiOff className="w-4 h-4" />
    if (networkStatus.isSlowConnection) return <AlertTriangle className="w-4 h-4" />
    return <Wifi className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (!networkStatus.isOnline) {
      return `网络连接已断开 (${networkStatus.retryCount > 0 ? `重试 ${networkStatus.retryCount} 次` : '点击重试'})`
    }
    if (networkStatus.isSlowConnection) {
      return `网络连接较慢 (${networkStatus.connectionType})`
    }
    return '网络连接正常'
  }

  const handleRetry = () => {
    if (!networkStatus.isOnline) {
      networkStatus.retry()
      // 可以添加其他重试逻辑，比如刷新页面数据
      window.location.reload()
    }
  }

  const handleShowDetails = () => {
    setShowDetails(!showDetails)
  }

  return (
    <div className={`fixed top-16 left-0 right-0 z-40 p-3 ${getStatusColor()} border-b slide-up`}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{getStatusText()}</p>
              {!networkStatus.isOnline && (
                <p className="text-xs opacity-75">
                  请检查您的网络连接设置
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!networkStatus.isOnline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="h-8 px-3 touch-feedback"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                重试
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowDetails}
              className="h-8 px-2 touch-feedback"
            >
              {showDetails ? '收起' : '详情'}
            </Button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-current/20 space-y-2 text-xs">
            <div className="flex justify-between">
              <span>连接状态:</span>
              <span className={networkStatus.isOnline ? 'text-green-600' : 'text-red-600'}>
                {networkStatus.isOnline ? '在线' : '离线'}
              </span>
            </div>

            {networkStatus.effectiveType && (
              <div className="flex justify-between">
                <span>网络类型:</span>
                <span>{networkStatus.connectionType}</span>
              </div>
            )}

            {networkStatus.downlink && (
              <div className="flex justify-between">
                <span>下载速度:</span>
                <span>{Math.round(networkStatus.downlink * 10) / 10} Mbps</span>
              </div>
            )}

            {networkStatus.rtt && (
              <div className="flex justify-between">
                <span>延迟:</span>
                <span>{networkStatus.rtt} ms</span>
              </div>
            )}

            {networkStatus.saveData !== undefined && (
              <div className="flex justify-between">
                <span>省流模式:</span>
                <span>{networkStatus.saveData ? '开启' : '关闭'}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>重试次数:</span>
              <span>{networkStatus.retryCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}