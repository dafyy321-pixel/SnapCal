/**
 * 简化的API重试机制
 */

import { ApiResponse } from '@/types'

/**
 * 重试配置选项
 */
export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  onRetry?: (error: any, attempt: number, delay: number) => void
}

/**
 * 默认重试配置
 */
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  onRetry: (error: any, attempt: number, delay: number) => {
    console.warn(`[API Retry] 第${attempt}次重试，延迟${delay}ms:`, error.message)
  }
}

/**
 * 指数退避计算延迟时间
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = baseDelay * Math.pow(2, attempt - 1)
  return Math.min(delay, maxDelay)
}

/**
 * 延迟执行
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 带重试机制的fetch包装器
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<ApiResponse<T>> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions }
  let lastError: any = null

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const response = await fetch(url, {
        ...options,
        headers: {
          'X-Request-ID': requestId,
          'X-Retry-Attempt': attempt.toString(),
          ...options.headers
        }
      })

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
        // 简化：直接设置为普通Error，不扩展属性
        throw error
      }

      let data: any
      try {
        data = await response.json()
      } catch (parseError) {
        const error = new Error('响应JSON解析失败')
        throw error
      }

      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      lastError = error

      if (attempt <= opts.maxRetries) {
        const delayTime = calculateDelay(attempt, opts.baseDelay, opts.maxDelay!)
        opts.onRetry!(error, attempt, delayTime)
        await delay(delayTime)
        continue
      }

      break
    }
  }

  // 所有重试都失败了
  return {
    success: false,
    error: {
      code: 'API_REQUEST_FAILED',
      message: lastError instanceof Error ? lastError.message : '请求失败',
      details: lastError
    },
    timestamp: new Date().toISOString()
  }
}