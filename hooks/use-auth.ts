/**
 * 认证相关的React Hook
 * 提供简单易用的认证状态管理和操作方法
 */

import { useState, useEffect, useCallback } from 'react'
import { User, AppSession } from '@/types'
import { authManager } from '@/lib/auth-manager'

export interface UseAuthState {
  user: User | null
  session: AppSession | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface UseAuthActions {
  refreshSession: () => Promise<AppSession | null>
  signOut: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

export function useAuth(): UseAuthState & UseAuthActions {
  const [state, setState] = useState<UseAuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // 检查认证状态
  const checkAuth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const session = await authManager.getValidSession()
      const isAuthenticated = !!session
      const user = session?.user || null

      setState({
        user,
        session,
        isLoading: false,
        isAuthenticated,
      })

      return isAuthenticated
    } catch (error) {
      console.error('[useAuth] 检查认证状态失败:', error)
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
      })
      return false
    }
  }, [])

  // 刷新session
  const refreshSession = useCallback(async () => {
    try {
      const refreshedSession = await authManager.refreshToken()

      if (refreshedSession) {
        setState(prev => ({
          ...prev,
          session: refreshedSession,
          user: refreshedSession.user,
          isAuthenticated: true,
          isLoading: false,
        }))
      } else {
        setState(prev => ({
          ...prev,
          session: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }))
      }

      return refreshedSession
    } catch (error) {
      console.error('[useAuth] 刷新session失败:', error)
      setState(prev => ({
        ...prev,
        session: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }))
      return null
    }
  }, [])

  // 退出登录
  const signOut = useCallback(async () => {
    try {
      await authManager.clearSession()
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
      })
    } catch (error) {
      console.error('[useAuth] 退出登录失败:', error)
    }
  }, [])

  // 初始化认证状态
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      if (mounted) {
        await checkAuth()
        // 设置定期token刷新检查
        authManager.setupTokenRefreshCheck()
      }
    }

    initializeAuth()

    // 监听认证状态变化
    const unsubscribe = authManager.onAuthStateChange((session) => {
      if (mounted) {
        setState({
          user: session?.user || null,
          session,
          isLoading: false,
          isAuthenticated: !!session,
        })
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [checkAuth])

  return {
    ...state,
    refreshSession,
    signOut,
    checkAuth,
  }
}

/**
 * 简化版的认证Hook，只返回用户信息和认证状态
 */
export function useCurrentUser() {
  const { user, isAuthenticated, isLoading } = useAuth()

  return {
    user,
    isAuthenticated,
    isLoading,
  }
}

/**
 * 用于组件保护，提供认证检查和重定向逻辑
 */
export function useRequireAuth(redirectTo: string = '/auth') {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo
    }
  }, [isAuthenticated, isLoading, redirectTo])

  return { isAuthenticated, isLoading }
}