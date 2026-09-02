/**
 * 全局错误边界组件
 * 捕获并处理React组件树中的错误，提供友好的错误显示
 */

'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RefreshCw, Home, Bug } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; errorId: string; retry: () => void }>
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void
  maxRetries?: number
  showErrorDetails?: boolean
}

/**
 * 错误类型分类
 */
const getErrorType = (error: Error): 'network' | 'data' | 'render' | 'unknown' => {
  const errorMessage = error.message.toLowerCase()

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'network'
  }
  if (errorMessage.includes('data') || errorMessage.includes('parse')) {
    return 'data'
  }
  if (errorMessage.includes('render') || errorMessage.includes('component')) {
    return 'render'
  }

  return 'unknown'
}

/**
 * 生成错误ID
 */
const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 获取错误显示信息
 */
const getErrorDisplayInfo = (error: Error) => {
  const errorType = getErrorType(error)

  const errorInfoMap = {
    network: {
      title: '网络连接错误',
      description: '无法连接到服务器，请检查网络连接后重试',
      icon: '🌐',
      actionText: '重新连接'
    },
    data: {
      title: '数据加载错误',
      description: '数据格式异常或加载失败，请重试',
      icon: '📊',
      actionText: '重新加载'
    },
    render: {
      title: '页面渲染错误',
      description: '页面显示异常，请刷新页面重试',
      icon: '⚠️',
      actionText: '刷新页面'
    },
    unknown: {
      title: '未知错误',
      description: '发生了意外错误，请重试或联系技术支持',
      icon: '❌',
      actionText: '重试'
    }
  }

  return errorInfoMap[errorType]
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // 调用错误回调（用于错误上报）
    this.props.onError?.(error, errorInfo, this.state.errorId)
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props

    if (this.state.retryCount >= maxRetries) {
      // 超过最大重试次数，重置整个页面
      window.location.reload()
      return
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: prevState.retryCount + 1
    }))

    // 延迟重试，避免立即重新渲染
    this.retryTimeoutId = setTimeout(() => {
      // 强制重新渲染
      this.forceUpdate()
    }, 100)
  }

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state

    // 构建错误报告内容
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }

    // 在开发环境打开控制台显示错误详情
    if (process.env.NODE_ENV === 'development') {
      console.group('🐛 错误报告')
      console.table(errorReport)
      console.groupEnd()
    }

    // 复制错误信息到剪贴板
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('错误信息已复制到剪贴板，请发送给技术支持')
      })
      .catch(() => {
        alert('复制失败，请手动截图错误信息')
      })
  }

  render() {
    const { hasError, error, errorId, retryCount } = this.state
    const { children, fallback, showErrorDetails = process.env.NODE_ENV === 'development' } = this.props

    if (hasError && error) {
      // 如果提供了自定义fallback组件，使用它
      if (fallback) {
        const FallbackComponent = fallback
        return <FallbackComponent error={error} errorId={errorId} retry={this.handleRetry} />
      }

      // 默认错误界面
      const errorDisplay = getErrorDisplayInfo(error)
      const canRetry = retryCount < (this.props.maxRetries || 3)

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 shadow-lg border border-border/50">
            {/* 错误图标和标题 */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{errorDisplay.icon}</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {errorDisplay.title}
              </h2>
              <p className="text-muted-foreground">
                {errorDisplay.description}
              </p>
              {retryCount > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  重试次数: {retryCount}/{this.props.maxRetries || 3}
                </p>
              )}
            </div>

            {/* 错误ID (开发环境或调试用) */}
            {(showErrorDetails || process.env.NODE_ENV === 'development') && (
              <div className="mb-6 p-3 bg-muted rounded-lg">
                <p className="text-xs font-mono text-muted-foreground">
                  错误ID: {errorId}
                </p>
                <p className="text-xs font-mono text-muted-foreground mt-1 break-words">
                  {error.message}
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-3">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  className="w-full flex items-center gap-2"
                  disabled={retryCount >= (this.props.maxRetries || 3)}
                >
                  <RefreshCw className="w-4 h-4" />
                  {errorDisplay.actionText}
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                asChild
              >
                <Link href="/"><Home className="w-4 h-4" />返回首页</Link>
              </Button>

              {/* 开发环境或调试选项 */}
              {(showErrorDetails || process.env.NODE_ENV === 'development') && (
                <Button
                  variant="ghost"
                  onClick={this.handleReportError}
                  className="w-full flex items-center gap-2"
                >
                  <Bug className="w-4 h-4" />
                  复制错误信息
                </Button>
              )}
            </div>

            {/* 底部提示 */}
            {retryCount >= (this.props.maxRetries || 3) && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  问题仍然存在？
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  请截图此页面并联系技术支持
                </p>
              </div>
            )}
          </Card>
        </div>
      )
    }

    return children
  }
}

/**
 * 简化版错误边界Hook
 */
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    console.error('Error captured by hook:', error)
    setError(error)
  }, [])

  // 在开发环境暴露全局错误处理
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleError = (event: ErrorEvent) => {
        captureError(event.error || new Error(event.message))
      }

      const handleRejection = (event: PromiseRejectionEvent) => {
        captureError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)))
      }

      window.addEventListener('error', handleError)
      window.addEventListener('unhandledrejection', handleRejection)

      return () => {
        window.removeEventListener('error', handleError)
        window.removeEventListener('unhandledrejection', handleRejection)
      }
    }
  }, [captureError])

  return { error, resetError, captureError }
}

/**
 * 默认错误边界包装器
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
