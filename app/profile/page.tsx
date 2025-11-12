"use client"

import { Camera, ChevronRight, Settings, Bell, Shield, HelpCircle, Share2, Award, LogOut } from "lucide-react"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/bottom-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/supabase"
import { useState, useEffect } from "react"

export default function ProfilePage() {
  const router = useRouter()
  const [userData, setUserData] = useState({
    name: "加载中...",
    phone: "",
    streak: 0,
    totalLogs: 0,
    achievements: 0,
    avgCalories: 1650,
  })

  // 加载用户信息
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (user) {
          const storedUser = localStorage.getItem("user")
          if (storedUser) {
            const userInfo = JSON.parse(storedUser)
            setUserData(prev => ({
              ...prev,
              name: userInfo.username || user.user_metadata?.username || "用户",
              phone: userInfo.phone || user.user_metadata?.phone || "",
            }))
          }
        }
      } catch (error) {
        console.error("加载用户信息错误:", error)
      }
    }
    loadUserData()
  }, [])

  // 退出登录
  const handleLogout = async () => {
    try {
      await authService.signOut()
      localStorage.removeItem("user")
      router.push("/auth")
    } catch (error) {
      console.error("退出登录错误:", error)
      alert("退出登录失败")
    }
  }

  // 菜单项配置
  const menuSections = [
    {
      items: [
        {
          icon: Award,
          label: "我的成就",
          description: "查看我的徽章与奖励",
          route: "/achievements",
          iconColor: "text-amber-500",
          iconBg: "bg-amber-50",
        },
        {
          icon: Share2,
          label: "分享给朋友",
          description: "邀请好友一起记录",
          route: "/share",
          iconColor: "text-emerald-500",
          iconBg: "bg-emerald-50",
        },
      ],
    },
    {
      items: [
        {
          icon: Bell,
          label: "通知设置",
          description: "管理提醒偏好",
          route: "/notifications",
          iconColor: "text-blue-500",
          iconBg: "bg-blue-50",
        },
        {
          icon: Shield,
          label: "隐私与安全",
          description: "账号与数据设置",
          route: "/privacy",
          iconColor: "text-purple-500",
          iconBg: "bg-purple-50",
        },
        {
          icon: Settings,
          label: "应用设置",
          description: "个性化你的体验",
          route: "/settings",
          iconColor: "text-gray-500",
          iconBg: "bg-gray-50",
        },
      ],
    },
    {
      items: [
        {
          icon: HelpCircle,
          label: "帮助中心",
          description: "常见问题与支持",
          route: "/help",
          iconColor: "text-cyan-500",
          iconBg: "bg-cyan-50",
        },
      ],
    },
    {
      items: [
        {
          icon: LogOut,
          label: "退出登录",
          description: "退出当前账号",
          action: "logout", // 特殊标记，表示这是退出操作
          iconColor: "text-red-500",
          iconBg: "bg-red-50",
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        {/* 顶部用户信息卡片 */}
        <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pt-12 pb-8 px-6 border-b">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-white text-2xl">👤</AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-foreground rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                <Camera className="w-4 h-4 text-background" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1 text-foreground">{userData.name}</h2>
              <p className="text-sm text-muted-foreground">已连续记录 {userData.streak} 天</p>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border rounded-2xl p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-foreground">{userData.streak}</div>
              <div className="text-xs text-muted-foreground mt-1">连续天数</div>
            </div>
            <div className="bg-card border rounded-2xl p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-foreground">{userData.totalLogs}</div>
              <div className="text-xs text-muted-foreground mt-1">总记录数</div>
            </div>
            <div className="bg-card border rounded-2xl p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-foreground">{userData.achievements}</div>
              <div className="text-xs text-muted-foreground mt-1">获得成就</div>
            </div>
          </div>
        </div>

        {/* 快速操作卡片 - 悬浮在渐变背景上 */}
        <div className="px-6 -mt-6 mb-6">
          <Card className="p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">平均每日摄入</div>
                <div className="text-2xl font-bold">{userData.avgCalories} 卡</div>
              </div>
              <button
                onClick={() => router.push("/analytics")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                查看详情
              </button>
            </div>
          </Card>
        </div>

        {/* 菜单列表 */}
        <div className="px-6 space-y-3">
          {menuSections.map((section, sectionIndex) => (
            <Card key={sectionIndex} className="overflow-hidden shadow-sm">
              <div className="divide-y divide-border">
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={itemIndex}
                      onClick={() => {
                        if (item.action === "logout") {
                          handleLogout()
                        } else if (item.route) {
                          router.push(item.route)
                        }
                      }}
                      className="w-full p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-foreground">{item.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </button>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* 底部版本信息 */}
        <div className="text-center pt-8 pb-4 px-6">
          <p className="text-xs text-muted-foreground">Cal AI v1.0.1</p>
          <p className="text-xs text-muted-foreground/60 mt-1">让健康饮食更简单</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
