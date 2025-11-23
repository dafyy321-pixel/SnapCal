"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/supabase"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * 认证守卫组件
 * 确保只有已登录用户可以访问受保护的内容
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 首先尝试从 authService 获取 session
        let session = await authService.getSession()

        // 如果失败，尝试从 localStorage 手动获取
        if (!session) {
          const tokenStorage = localStorage.getItem('sb-qqpvufallgkrhlbhuvas-auth-token')
          if (tokenStorage) {
            try {
              const tokenData = JSON.parse(tokenStorage)
              const manualSession = tokenData.currentSession || tokenData

              // 检查token是否过期
              if (manualSession.expires_at && manualSession.expires_at > Math.floor(Date.now() / 1000)) {
                session = {
                  user: manualSession.user,
                  access_token: manualSession.access_token,
                  refresh_token: manualSession.refresh_token,
                  expires_at: manualSession.expires_at,
                  expires_in: 3600, // 默认1小时
                  token_type: 'bearer'
                }
                console.log("[AuthGuard] 使用手动 session:", session?.user?.id)
              } else {
                console.warn("[AuthGuard] Token 已过期")
              }
            } catch (e) {
              console.error("[AuthGuard] 解析 token 失败:", e)
            }
          }
        }

        if (!session) {
          // 未登录，跳转到登录页
          console.log("[AuthGuard] 未找到有效 session，跳转到登录页")
          router.push("/auth")
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error("[AuthGuard] 检查登录状态错误:", error)
        router.push("/auth")
      }
    }

    checkAuth()
  }, [router])

  // 认证状态检查中
  if (isAuthenticated === null) {
    return fallback || (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">验证登录状态...</p>
        </div>
      </div>
    )
  }

  // 已认证，显示受保护的内容
  return <>{children}</>
}

/**
 * 高阶组件：为页面组件添加认证守卫
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard>
        <Component {...props} />
      </AuthGuard>
    )
  }
}