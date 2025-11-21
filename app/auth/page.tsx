"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Phone, Lock, User, ArrowLeft } from "lucide-react"
import { authService } from "@/lib/supabase"

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isLogin) {
        // 登录
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error?.message || "登录失败")
          return
        }

        // 保存 session 到本地存储
        if (data.success && data.data?.session) {
          console.log('[Auth] 开始保存session:', {
            hasAccessToken: !!data.data.session.access_token,
            hasRefreshToken: !!data.data.session.refresh_token,
            userId: data.data.user?.id
          })

          const result = await authService.setSession(
            data.data.session.access_token,
            data.data.session.refresh_token
          )

          console.log('[Auth] setSession结果:', {
            error: result.error?.message,
            data: !!result.data?.session
          })

          // 额外确保：直接保存session到localStorage格式，确保authManager能读取
          const sessionData = {
            currentSession: {
              user: data.data.session.user,
              access_token: data.data.session.access_token,
              refresh_token: data.data.session.refresh_token,
              expires_at: data.data.session.expires_at,
              expires_in: data.data.session.expires_in,
              token_type: data.data.session.token_type
            }
          }
          localStorage.setItem('supabase.auth.token', JSON.stringify(sessionData))
          console.log('[Auth] 直接保存session到localStorage完成')

          // 保存用户信息到 localStorage
          localStorage.setItem("user", JSON.stringify(data.data.user))

          // 同时设置 token 到 Cookie，供 proxy.ts 中间件使用
          document.cookie = `sb-access-token=${data.data.session.access_token}; path=/; max-age=3600; SameSite=Lax`
        }

        // 登录成功，跳转到首页
        router.push("/")
      } else {
        // 注册
        if (password !== confirmPassword) {
          setError("两次输入的密码不一致")
          return
        }

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password, username }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error?.message || "注册失败")
          return
        }

        // 注册成功，切换到登录模式
        setIsLogin(true)
        setPassword("")
        setConfirmPassword("")
        setError("")
        alert("注册成功！请登录")
      }
    } catch (err) {
      console.error(err)
      setError("网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted/50 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SnapCal" className="w-8 h-8 object-contain" />
            <h1 className="text-2xl font-bold">SnapCal</h1>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center space-y-2 pt-8">
          <h2 className="text-3xl font-bold">
            {isLogin ? "欢迎回来" : "创建账号"}
          </h2>
          <p className="text-muted-foreground">
            {isLogin ? "登录以继续追踪你的健康饮食" : "开始你的健康饮食之旅"}
          </p>
        </div>

        {/* Auth Form Card */}
        <Card className="p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}
            {/* Username Field (Register Only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  用户名
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Phone Field */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                手机号
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  maxLength={11}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Confirm Password Field (Register Only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="请再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Forgot Password (Login Only) */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  忘记密码？
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full h-11" size="lg" disabled={loading}>
              {loading ? "处理中..." : (isLogin ? "登录" : "注册")}
            </Button>
          </form>
        </Card>

        {/* Toggle Between Login/Register */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {isLogin ? "还没有账号？" : "已有账号？"}
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                // 清空表单
                setPhone("")
                setPassword("")
                setUsername("")
                setConfirmPassword("")
              }}
              className="ml-2 text-foreground font-medium hover:underline"
            >
              {isLogin ? "立即注册" : "立即登录"}
            </button>
          </p>
        </div>

        {/* Terms and Privacy */}
        <p className="text-xs text-center text-muted-foreground px-8">
          继续即表示您同意我们的
          <button className="text-foreground hover:underline mx-1">服务条款</button>
          和
          <button className="text-foreground hover:underline mx-1">隐私政策</button>
        </p>
      </div>
    </div>
  )
}
