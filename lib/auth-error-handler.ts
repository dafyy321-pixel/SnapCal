/**
 * Supabase 认证错误处理工具
 * 统一处理常见的认证错误并提供用户友好的错误信息
 */

export class AuthErrorHandler {
  /**
   * 处理Supabase认证错误
   */
  static handleAuthError(error: any): { message: string; shouldRedirect: boolean; action?: string } {
    if (!error) {
      return {
        message: '未知认证错误',
        shouldRedirect: false
      }
    }

    const errorMessage = error?.message || error.toString()

    // 常见错误映射
    if (errorMessage.includes('Invalid refresh token') || errorMessage.includes('Refresh Token Not Found')) {
      return {
        message: '登录已过期，请重新登录',
        shouldRedirect: true,
        action: 'redirect_to_login'
      }
    }

    if (errorMessage.includes('Invalid login credentials')) {
      return {
        message: '用户名或密码错误',
        shouldRedirect: false
      }
    }

    if (errorMessage.includes('Email not confirmed')) {
      return {
        message: '请先验证邮箱',
        shouldRedirect: false
      }
    }

    if (errorMessage.includes('Too many requests')) {
      return {
        message: '请求过于频繁，请稍后再试',
        shouldRedirect: false
      }
    }

    if (errorMessage.includes('signup_disabled')) {
      return {
        message: '注册功能已禁用',
        shouldRedirect: false
      }
    }

    if (errorMessage.includes('User already registered')) {
      return {
        message: '该用户已注册',
        shouldRedirect: false
      }
    }

    // 网络相关错误
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
      return {
        message: '网络连接异常，请检查网络后重试',
        shouldRedirect: false
      }
    }

    // 默认错误处理
    return {
      message: '认证失败，请重试',
      shouldRedirect: false
    }
  }

  /**
   * 清理无效的认证数据
   */
  static cleanupInvalidAuth(): void {
    if (typeof window === 'undefined') return

    try {
      // 清理Supabase相关的localStorage数据
      const keysToRemove = [
        'supabase.auth.token',
        'supabase.auth.refreshToken',
        'supabase.auth.expiresAt',
        'sb-access-token',
        'sb-refresh-token'
      ]

      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })

      console.log('[Auth] 已清理无效的认证数据')
    } catch (error) {
      console.error('[Auth] 清理认证数据失败:', error)
    }
  }

  /**
   * 检查令牌是否即将过期（5分钟内）
   */
  static isTokenExpiringSoon(session: any): boolean {
    if (!session?.expires_at) return false

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at
    const fiveMinutes = 5 * 60

    return (expiresAt - now) <= fiveMinutes
  }

  /**
   * 获取令牌剩余有效时间（秒）
   */
  static getTokenRemainingTime(session: any): number {
    if (!session?.expires_at) return 0

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at

    return Math.max(0, expiresAt - now)
  }

  /**
   * 格式化剩余时间显示
   */
  static formatRemainingTime(seconds: number): string {
    if (seconds <= 0) return '已过期'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟`
    } else {
      return '不到1分钟'
    }
  }
}

/**
 * 认证状态监控
 */
export class AuthMonitor {
  private static instance: AuthMonitor
  private checkInterval: NodeJS.Timeout | null = null
  private readonly CHECK_INTERVAL = 30000 // 30秒检查一次

  static getInstance(): AuthMonitor {
    if (!AuthMonitor.instance) {
      AuthMonitor.instance = new AuthMonitor()
    }
    return AuthMonitor.instance
  }

  /**
   * 开始监控认证状态
   */
  startMonitoring(): void {
    if (this.checkInterval) return

    this.checkInterval = setInterval(() => {
      this.checkAuthStatus()
    }, this.CHECK_INTERVAL)

    console.log('[Auth Monitor] 开始监控认证状态')
  }

  /**
   * 停止监控认证状态
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('[Auth Monitor] 停止监控认证状态')
    }
  }

  /**
   * 检查认证状态
   */
  private async checkAuthStatus(): Promise<void> {
    try {
      // 这里可以添加具体的认证状态检查逻辑
      // 例如检查令牌有效性、自动重新登录等
    } catch (error) {
      console.warn('[Auth Monitor] 检查认证状态失败:', error)
    }
  }
}

/**
 * 安全的认证操作包装器
 */
export function withAuthSafety<T extends (...args: any[]) => Promise<any>>(
  operation: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await operation(...args)
    } catch (error) {
      const authError = AuthErrorHandler.handleAuthError(error)

      if (authError.shouldRedirect) {
        AuthErrorHandler.cleanupInvalidAuth()

        // 重定向到登录页面
        if (typeof window !== 'undefined') {
          window.location.href = `/auth?reason=session_expired&message=${encodeURIComponent(authError.message)}`
        }
      }

      throw new Error(authError.message)
    }
  }
}