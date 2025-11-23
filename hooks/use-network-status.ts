'use client'

import { useState, useEffect } from 'react'

export interface NetworkStatus {
  online: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

export interface UseNetworkStatusReturn extends NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
  connectionType: string
  isOffline: boolean
  retryCount: number
  retry: () => void
  resetRetry: () => void
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: true, // 默认在线，避免hydration错误
    effectiveType: undefined,
    downlink: undefined,
    rtt: undefined,
    saveData: undefined,
  })

  const [retryCount, setRetryCount] = useState(0)
  const [isClient, setIsClient] = useState(false)

  const isOnline = networkStatus.online
  const isSlowConnection = networkStatus.effectiveType === 'slow-2g' ||
                          networkStatus.effectiveType === '2g' ||
                          networkStatus.effectiveType === '3g'
  const connectionType = networkStatus.effectiveType || 'unknown'
  const isOffline = !networkStatus.online

  const retry = () => {
    setRetryCount(prev => prev + 1)
  }

  const resetRetry = () => {
    setRetryCount(0)
  }

  // 初始化网络状态和设置客户端渲染
  useEffect(() => {
    setIsClient(true)

    // 获取初始网络状态
    const getInitialNetworkStatus = (): NetworkStatus => {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return {
          online: true,
          effectiveType: undefined,
          downlink: undefined,
          rtt: undefined,
          saveData: undefined,
        }
      }

      return {
        online: navigator.onLine,
        effectiveType: (navigator as any).connection?.effectiveType,
        downlink: (navigator as any).connection?.downlink,
        rtt: (navigator as any).connection?.rtt,
        saveData: (navigator as any).connection?.saveData,
      }
    }

    // 设置初始网络状态
    setNetworkStatus(getInitialNetworkStatus())

    // 监听网络状态变化
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, online: true }))
    }

    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, online: false }))
    }

    const handleConnectionChange = () => {
      const connection = (navigator as any).connection
      if (connection) {
        setNetworkStatus(prev => ({
          ...prev,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        }))
      }
    }

    // 添加事件监听器
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    // 清理事件监听器
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [])

  // 定期检查网络状态 (仅在客户端)
  useEffect(() => {
    if (!isClient) return

    const checkConnection = () => {
      if (typeof navigator !== 'undefined' && navigator.onLine !== networkStatus.online) {
        setNetworkStatus(prev => ({ ...prev, online: navigator.onLine }))
      }
    }

    const interval = setInterval(checkConnection, 5000) // 每5秒检查一次
    return () => clearInterval(interval)
  }, [networkStatus.online, isClient])

  return {
    ...networkStatus,
    isOnline,
    isSlowConnection,
    connectionType,
    isOffline,
    retryCount,
    retry,
    resetRetry,
  }
}