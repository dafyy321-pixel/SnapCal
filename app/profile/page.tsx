"use client"

import { User, Settings, Target, Bell, HelpCircle, LogOut, Camera, ChevronRight, Award, Star, Trophy, Lock, Flame, Drumstick, Wheat, Droplet } from "lucide-react"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/bottom-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { ResponsiveContainer, AreaChart, Area, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, LabelList } from "recharts"

export default function ProfilePage() {
  const router = useRouter()
  const todayProgress = 65
  const R = 38
  const C = 2 * Math.PI * R
  const offset = C - (todayProgress / 100) * C

  // 今日占位数据（仅展示用）
  const caloriesConsumed = 1230
  const calorieGoal = 1900
  const proteinG = 68
  const carbsG = 220
  const waterMl = 1200

  const trendData = [
    { day: "周一", value: 1 },
    { day: "周二", value: 1 },
    { day: "周三", value: 0 },
    { day: "周四", value: 1 },
    { day: "周五", value: 1 },
    { day: "周六", value: 1 },
    { day: "周日", value: 0 },
  ]
  const completionRate = 71
  const weekCompletion = [
    { day: "一", percent: 80 },
    { day: "二", percent: 92 },
    { day: "三", percent: 40 },
    { day: "四", percent: 75 },
    { day: "五", percent: 88 },
    { day: "六", percent: 95 },
    { day: "日", percent: 60 },
  ]

  const WeekTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const value = payload[0]?.value
    return (
      <div className="bg-card border border-border rounded-md px-3 py-2 text-xs shadow-md">
        <div className="font-medium mb-1">周{label}</div>
        <div>完成度：{value}%</div>
      </div>
    )
  }
  const badges = [
    { name: "早起达人", icon: Trophy, unlocked: true },
    { name: "连续7天", icon: Award, unlocked: true },
    { name: "饮水打卡", icon: Star, unlocked: false },
    { name: "月度坚持", icon: Award, unlocked: false },
    { name: "低糖之星", icon: Star, unlocked: false },
    { name: "能量控制", icon: Trophy, unlocked: false },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <h1 className="text-3xl font-bold">我的</h1>

        {/* Hero 名片 */}
        <Card className="p-0 overflow-hidden shadow-sm">
          <div className="relative p-6 pb-8">
            <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-muted">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-1 right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">用户名</h2>
                <p className="text-sm text-muted-foreground">user@example.com</p>
                <div className="mt-2">
                  <Badge className="bg-primary/10 text-primary border-transparent">连续 7 天</Badge>
                </div>
              </div>
            </div>
          </div>

        </Card>

        {/* 今日进度环 + 行动按钮 */}
        <Card className="p-5 shadow-sm">
          <div className="space-y-4">
            <div className="grid grid-cols-[96px_1fr] items-center gap-4">
              {/* ring */}
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 120 120" className="w-24 h-24">
                  <circle cx="60" cy="60" r={R} stroke="hsl(var(--border))" strokeWidth="10" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r={R}
                    stroke="hsl(var(--primary))"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    style={{ strokeDasharray: C, strokeDashoffset: offset }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold">{todayProgress}%</div>
                  <div className="text-xs text-muted-foreground">今天</div>
                </div>
              </div>

              {/* right metrics */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground"><Flame className="w-4 h-4 text-amber-500" />卡路里</div>
                  <div className="font-semibold">{caloriesConsumed}/{calorieGoal}</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground"><Drumstick className="w-4 h-4" />蛋白质</div>
                  <div className="font-semibold">{proteinG}g</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground"><Droplet className="w-4 h-4" />饮水</div>
                  <div className="font-semibold">{waterMl}ml</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full bg-muted text-xs">记录 3/5</span>
                  <span className="px-2 py-1 rounded-full bg-muted text-xs">剩余 {Math.max(0, 100 - todayProgress)}%</span>
                </div>
              </div>
            </div>
            <Button className="w-full h-10 text-sm">记录今天</Button>
          </div>
        </Card>

        {/* 关键统计（3连） */}
        <Card className="p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card/60 p-3 text-center">
              <div className="text-xl font-bold text-foreground">7</div>
              <div className="text-xs text-muted-foreground">连续</div>
            </div>
            <div className="rounded-lg border bg-card/60 p-3 text-center">
              <div className="text-xl font-bold text-foreground">142</div>
              <div className="text-xs text-muted-foreground">总记录</div>
            </div>
            <button
              onClick={() => router.push("/achievements")}
              className="rounded-lg border bg-card/60 p-3 text-center hover:bg-accent transition-colors group relative"
            >
              <div className="text-xl font-bold text-foreground">5</div>
              <div className="text-xs text-muted-foreground">成就</div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors absolute right-2 top-2" />
            </button>
          </div>
        </Card>

        {/* 本周趋势（Sparkline） */}
        <Card className="p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">本周趋势</h3>
            <span className="text-xs text-muted-foreground">完成率 {completionRate}%</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weekCompletion} margin={{ top: 22, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} hide />
                <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={WeekTooltip as any} />
                <Bar dataKey="percent" barSize={22} fill="hsl(var(--primary))" fillOpacity={0.3} radius={[4,4,0,0]}>
                  <LabelList dataKey="percent" position="top" offset={4} formatter={(v:number)=>`${v}%`} />
                </Bar>
                <Line type="monotone" dataKey="percent" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 目标与进度 */}
        <Card className="p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">目标与进度</h3>
            <button
              onClick={() => router.push("/goals")}
              className="text-xs px-3 py-1 rounded-full border hover:bg-accent transition-colors"
            >
              管理
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">早睡 23:00</span>
                <span className="text-xs text-muted-foreground">65%</span>
              </div>
              <Progress value={65} />
              <p className="text-xs text-muted-foreground mt-1">剩余 12 天</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">每日饮水 2000ml</span>
                <span className="text-xs text-muted-foreground">40%</span>
              </div>
              <Progress value={40} />
              <p className="text-xs text-muted-foreground mt-1">今天已完成 2/5</p>
            </div>
          </div>
        </Card>

        {/* 成就徽章（横滑） */}
        <Card className="p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">成就</h3>
            <button onClick={() => router.push("/achievements")} className="text-xs px-3 py-1 rounded-full border hover:bg-accent transition-colors">全部</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
            {badges.map((b, i) => {
              const Icon = b.icon
              return (
                <div key={i} className="flex-shrink-0 w-16 text-center">
                  <div className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto ${b.unlocked ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {b.unlocked ? <Icon className="w-7 h-7" /> : <Lock className="w-6 h-6" />}
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground line-clamp-1">{b.name}</div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="shadow-sm divide-y divide-border">
          <button
            onClick={() => router.push("/notifications")}
            className="w-full p-4 flex items-center gap-4 hover:bg-accent transition-colors rounded-t-lg"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-foreground">通知</h3>
              <p className="text-xs text-muted-foreground">管理提醒设置</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </button>

          <button
            onClick={() => router.push("/settings")}
            className="w-full p-4 flex items-center gap-4 hover:bg-accent transition-colors rounded-b-lg"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-foreground">设置</h3>
              <p className="text-xs text-muted-foreground">应用偏好设置</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </button>
        </Card>

        <Card className="shadow-sm divide-y divide-border">
          <button
            onClick={() => router.push("/help")}
            className="w-full p-4 flex items-center gap-4 hover:bg-accent transition-colors rounded-t-lg"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-foreground">帮助与支持</h3>
              <p className="text-xs text-muted-foreground">获取帮助</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </button>

          <button
            onClick={() => {
              // Handle logout
              console.log("Logging out...")
            }}
            className="w-full p-4 flex items-center gap-4 hover:bg-destructive/10 transition-colors rounded-b-lg"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-destructive">退出登录</h3>
            </div>
            <ChevronRight className="w-5 h-5 text-destructive/60 flex-shrink-0" />
          </button>
        </Card>

        <div className="text-center pt-4 pb-2">
          <p className="text-xs text-muted-foreground">Version 1.0.1</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
