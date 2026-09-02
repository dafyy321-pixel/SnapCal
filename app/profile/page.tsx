"use client"

import { useEffect, useState } from "react"
import { Camera, ChevronRight, Download, HelpCircle, Info, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BottomNav } from "@/components/bottom-nav"
import { Card } from "@/components/ui/card"
import { mealsService, profileService } from "@/lib/api-services"
import { currentStreak } from "@/lib/date-utils"

type Profile = {
  username: string
  avatar_url: string | null
}

type Meal = { meal_date: string; calories: number }

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile>({ username: "本地用户", avatar_url: null })
  const [stats, setStats] = useState({ streak: 0, totalLogs: 0, avgCalories: 0 })

  useEffect(() => {
    async function load() {
      try {
        const [loadedProfile, mealsResponse] = await Promise.all([
          profileService.getProfile<Profile>(),
          mealsService.getAllMeals<Meal>(),
        ])
        setProfile(loadedProfile)
        const meals = mealsResponse
        const byDate = new Map<string, number>()
        for (const meal of meals) byDate.set(meal.meal_date, (byDate.get(meal.meal_date) || 0) + meal.calories)
        const now = new Date()
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
        const streak = currentStreak([...byDate.keys()], today)
        const avgCalories = byDate.size
          ? Math.round([...byDate.values()].reduce((sum, value) => sum + value, 0) / byDate.size)
          : 0
        setStats({ streak, totalLogs: meals.length, avgCalories })
      } catch (error) {
        console.error("加载本地资料失败:", error)
      }
    }
    load()
  }, [])

  const items = [
    { icon: Camera, label: "编辑资料", description: "修改姓名和身体数据", route: "/profile/edit" },
    { icon: Settings, label: "目标设置", description: "设置营养与体重目标", route: "/profile/goals" },
    { icon: Download, label: "数据导出", description: "导出本地餐食和资料", route: "/profile/export" },
    { icon: HelpCircle, label: "帮助中心", description: "查看使用说明", route: "/profile/help" },
    { icon: Info, label: "关于 SnapCal", description: "项目和本地数据说明", route: "/profile/about" },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pt-12 pb-8 px-6 border-b">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
              <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
              <AvatarFallback>{profile.username.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{profile.username}</h2>
              <p className="text-sm text-muted-foreground">数据仅保存在这台设备</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 text-center"><div className="text-2xl font-bold">{stats.streak}</div><div className="text-xs text-muted-foreground">连续记录天数</div></Card>
            <Card className="p-3 text-center"><div className="text-2xl font-bold">{stats.totalLogs}</div><div className="text-xs text-muted-foreground">总记录数</div></Card>
          </div>
        </div>
        <div className="px-6 -mt-4 mb-6">
          <Card className="p-4 shadow-lg flex items-center justify-between">
            <div><div className="text-sm text-muted-foreground">记录日平均摄入</div><div className="text-2xl font-bold">{stats.avgCalories} 卡</div></div>
            <button onClick={() => router.push("/analytics")} className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm">查看分析</button>
          </Card>
        </div>
        <div className="px-6">
          <Card className="overflow-hidden divide-y">
            {items.map(({ icon: Icon, ...item }) => (
              <button key={item.route} onClick={() => router.push(item.route)} className="w-full p-4 flex items-center gap-4 hover:bg-accent/50">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
                <div className="flex-1 text-left"><div className="font-medium">{item.label}</div><div className="text-xs text-muted-foreground">{item.description}</div></div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
