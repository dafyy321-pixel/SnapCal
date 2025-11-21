/**
 * 认证管理器
 * 负责处理Token自动刷新、认证状态管理和会话持久化
 */

import { createClient } from '@supabase/supabase-js'
import { Session, AppSession } from '@/types'

export class AuthManager {
  private static instance: AuthManager
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  /**
   * 检查Token是否需要刷新
   */
  private shouldRefreshToken(session: AppSession): boolean {
    const now = Math.floor(Date.now() / 1000)
    // 提前5分钟刷新token
    return session.expires_at - now < 300
  }

  /**
   * 刷新Token
   */
  async refreshToken(): Promise<AppSession | null> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession()

      if (error) {
        console.error('[AuthManager] Token刷新失败:', error)
        return null
      }

      if (data.session) {
        const newSession: AppSession = {
          user: data.session.user,
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token!,
          expires_at: data.session.expires_at!,
          expires_in: data.session.expires_in!,
          token_type: data.session.token_type!
        }

        // 保存新session到localStorage
        this.saveSessionToStorage(newSession)
        return newSession
      }

      return null
    } catch (error) {
      console.error('[AuthManager] 刷新Token时发生错误:', error)
      return null
    }
  }

  /**
   * 获取有效的Session，必要时自动刷新
   */
  async getValidSession(): Promise<AppSession | null> {
    console.log('[AuthManager] 开始获取有效Session...')
    const currentSession = this.getSessionFromStorage()

    if (!currentSession) {
      console.log('[AuthManager] 从localStorage未找到Session')
      return null
    }

    console.log('[AuthManager] 找到Session:', {
      userId: currentSession.user?.id,
      hasAccessToken: !!currentSession.access_token,
      expiresAt: currentSession.expires_at ? new Date(currentSession.expires_at * 1000).toLocaleString() : '未知'
    })

    // 检查token是否过期或即将过期
    if (this.shouldRefreshToken(currentSession)) {
      console.log('[AuthManager] Token即将过期，尝试刷新...')
      const refreshedSession = await this.refreshToken()
      return refreshedSession || currentSession
    }

    console.log('[AuthManager] 返回当前有效Session')
    return currentSession
  }

  /**
   * 从localStorage获取Session
   */
  private getSessionFromStorage(): AppSession | null {
    if (typeof window === 'undefined') {
      console.log('[AuthManager] 服务端环境，无法访问localStorage')
      return null
    }

    try {
      console.log('[AuthManager] 开始从localStorage读取Session...')
      const tokenStorage = localStorage.getItem('supabase.auth.token')
      console.log('[AuthManager] localStorage原始数据:', tokenStorage ? '存在' : '不存在')

      if (!tokenStorage) {
        console.log('[AuthManager] localStorage中未找到supabase.auth.token')
        return null
      }

      const tokenData = JSON.parse(tokenStorage)
      console.log('[AuthManager] 解析后的tokenData:', {
        hasCurrentSession: !!tokenData.currentSession,
        keys: Object.keys(tokenData)
      })

      const sessionData = tokenData.currentSession || tokenData

      if (!sessionData || !sessionData.access_token) {
        console.log('[AuthManager] Session数据或access_token为空')
        return null
      }

      const session = {
        user: sessionData.user,
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_at: sessionData.expires_at,
        expires_in: sessionData.expires_in || 3600,
        token_type: sessionData.token_type || 'bearer'
      }

      console.log('[AuthManager] 成功构造Session对象:', {
        userId: session.user?.id,
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token,
        expiresAt: session.expires_at
      })

      return session
    } catch (error) {
      console.error('[AuthManager] 从localStorage获取Session失败:', error)
      return null
    }
  }

  /**
   * 保存Session到localStorage
   */
  private saveSessionToStorage(session: AppSession): void {
    if (typeof window === 'undefined') return

    try {
      const currentData = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}')

      currentData.currentSession = {
        user: session.user,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type
      }

      localStorage.setItem('supabase.auth.token', JSON.stringify(currentData))
    } catch (error) {
      console.error('[AuthManager] 保存Session到localStorage失败:', error)
    }
  }

  /**
   * 公共方法：保存Session到localStorage（供外部调用）
   */
  saveSession(session: AppSession): void {
    this.saveSessionToStorage(session)
    console.log('[AuthManager] Session已通过公共方法保存')
  }

  /**
   * 清除Session
   */
  clearSession(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem('supabase.auth.token')
      console.log('[AuthManager] Session已清除')
    } catch (error) {
      console.error('[AuthManager] 清除Session失败:', error)
    }
  }

  /**
   * 检查用户是否已认证
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getValidSession()
    return !!session
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<AppSession['user'] | null> {
    const session = await this.getValidSession()
    return session?.user || null
  }

  /**
   * 获取有效的Access Token
   */
  async getValidAccessToken(): Promise<string | null> {
    const session = await this.getValidSession()
    return session?.access_token || null
  }

  /**
   * 设置定期Token刷新检查
   */
  setupTokenRefreshCheck(): void {
    if (typeof window === 'undefined') return

    // 每4分钟检查一次token状态
    const checkInterval = setInterval(async () => {
      const session = this.getSessionFromStorage()
      if (session && this.shouldRefreshToken(session)) {
        console.log('[AuthManager] 定期检查发现需要刷新Token')
        await this.refreshToken()
      }
    }, 4 * 60 * 1000) // 4分钟

    // 页面卸载时清除定时器
    window.addEventListener('beforeunload', () => {
      clearInterval(checkInterval)
    })
  }

  /**
   * 监听认证状态变化
   */
  onAuthStateChange(callback: (session: AppSession | null) => void): () => void {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const appSession: AppSession = {
          user: session.user,
          access_token: session.access_token,
          refresh_token: session.refresh_token!,
          expires_at: session.expires_at!,
          expires_in: session.expires_in!,
          token_type: session.token_type!
        }
        callback(appSession)
      } else {
        callback(null)
      }
    })

    return () => subscription.unsubscribe()
  }
}

// 导出单例实例
export const authManager = AuthManager.getInstance()

// 导出便捷方法
export const getValidSession = () => authManager.getValidSession()
export const isAuthenticated = () => authManager.isAuthenticated()
export const getCurrentUser = () => authManager.getCurrentUser()
export const getValidAccessToken = () => authManager.getValidAccessToken()
export const clearSession = () => authManager.clearSession()
export const setupTokenRefreshCheck = () => authManager.setupTokenRefreshCheck()