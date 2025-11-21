"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Flame, Drumstick, Wheat, Droplet, Calendar, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/bottom-nav"
import { AuthGuard } from "@/components/auth-guard"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { analyticsService } from "@/lib/supabase"
import { useCachedAnalytics } from "@/hooks/use-cache"

// 定义数据类型
interface DailyData {
  day: string
  date: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

interface NutritionStats {
  avgCalories: number
  caloriesTrend: number
  prevCalories: number
  avgProtein: number
  proteinTrend: number
  prevProtein: number
  avgCarbs: number
  carbsTrend: number
  prevCarbs: number
  avgFats: number
  fatsTrend: number
  prevFats: number
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"本周" | "上周" | "本月">("本周")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([])
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState(1900)
  const [stats, setStats] = useState<NutritionStats>({
    avgCalories: 0,
    caloriesTrend: 0,
    prevCalories: 0,
    avgProtein: 0,
    proteinTrend: 0,
    prevProtein: 0,
    avgCarbs: 0,
    carbsTrend: 0,
    prevCarbs: 0,
    avgFats: 0,
    fatsTrend: 0,
    prevFats: 0,
  })

  // 使用缓存Hook获取营养分析数据
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useCachedAnalytics(timeframe)

  // 处理缓存数据变化
  useEffect(() => {
    if (analyticsLoading) {
      setLoading(true)
      setError(null)
      return
    }

    if (analyticsError) {
      setLoading(false)
      setError(analyticsError.message)
      return
    }

    if (analyticsData) {
      console.log('Analytics cached response:', analyticsData) // 调试日志

      // 检查响应数据结构
      if (analyticsData && analyticsData.success && analyticsData.data) {
        setStats(analyticsData.data.stats || {
          avgCalories: 0,
          caloriesTrend: 0,
          prevCalories: 0,
          avgProtein: 0,
          proteinTrend: 0,
          prevProtein: 0,
          avgCarbs: 0,
          carbsTrend: 0,
          prevCarbs: 0,
          avgFats: 0,
          fatsTrend: 0,
          prevFats: 0,
        })
        setWeeklyData(analyticsData.data.dailyData || [])
        setDailyCalorieGoal(analyticsData.data.dailyCalorieGoal || 1900)
        setLoading(false)
        setError(null)
      }
    }
  }, [analyticsData, analyticsLoading, analyticsError])

  const totalProtein = weeklyData && Array.isArray(weeklyData) && weeklyData.length > 0
    ? weeklyData.reduce((sum, day) => sum + (day.protein || 0), 0) : 0
  const totalCarbs = weeklyData && Array.isArray(weeklyData) && weeklyData.length > 0
    ? weeklyData.reduce((sum, day) => sum + (day.carbs || 0), 0) : 0
  const totalFats = weeklyData && Array.isArray(weeklyData) && weeklyData.length > 0
    ? weeklyData.reduce((sum, day) => sum + (day.fats || 0), 0) : 0

  // 如果没有营养数据（都是0），显示均匀分布33.33%
  const macroDistribution = (() => {
    if (totalProtein === 0 && totalCarbs === 0 && totalFats === 0) {
      return [
        {
          name: "蛋白质",
          value: 0,
          color: "#e74c3c",
          percentage: "33.3",
        },
        {
          name: "碳水化合物",
          value: 0,
          color: "#f39c12",
          percentage: "33.3",
        },
        { name: "脂肪", value: 0, color: "#3498db", percentage: "33.4" }, // 33.4 确保总和为100%
      ]
    }

    const totalMacros = totalProtein + totalCarbs + totalFats
    return [
      {
        name: "蛋白质",
        value: totalProtein,
        color: "#e74c3c",
        percentage: ((totalProtein / totalMacros) * 100).toFixed(1),
      },
      {
        name: "碳水化合物",
        value: totalCarbs,
        color: "#f39c12",
        percentage: ((totalCarbs / totalMacros) * 100).toFixed(1),
      },
      { name: "脂肪", value: totalFats, color: "#3498db", percentage: ((totalFats / totalMacros) * 100).toFixed(1) },
    ]
  })()

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{
      name: string
      value: number
      color: string
      dataKey?: string
    }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl p-3.5">
          <p className="text-sm font-semibold mb-2.5 text-foreground">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry, index: number) => {
              const name = entry.name === "calories"
                ? "卡路里"
                : entry.name === "protein"
                  ? "蛋白质"
                  : entry.name === "carbs"
                    ? "碳水化合物"
                    : "脂肪"
              return (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-muted-foreground font-medium">{name}</span>
                  </div>
                  <span className="text-xs font-bold tabular-nums" style={{ color: entry.color }}>
                    {entry.value}{entry.name === "calories" ? "" : "g"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">加载分析数据...</p>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="text-center space-y-4 px-4">
          <div className="text-destructive text-lg font-semibold">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            重试
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">营养分析</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-sm hover:shadow-md transition-shadow">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{timeframe}</span>
                <ChevronRight className="w-3 h-3 rotate-90" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => setTimeframe("本周")} className="cursor-pointer">
                本周
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("上周")} className="cursor-pointer">
                上周
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("本月")} className="cursor-pointer">
                本月
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Weekly Overview Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 shadow-md border-0 hover:shadow-lg transition-all touch-feedback scale-in">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                <Flame className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">平均卡路里</span>
            </div>
            <div className="text-3xl font-bold mb-1.5 tabular-nums">{stats.avgCalories}</div>
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-semibold",
                stats.caloriesTrend > 0 ? "text-red-500" : "text-green-600",
              )}
            >
              {stats.caloriesTrend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{Math.abs(stats.caloriesTrend)}% vs 上周</span>
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">(上周: {stats.prevCalories})</p>
          </Card>

          <Card className="p-4 shadow-md border-0 hover:shadow-lg transition-all touch-feedback scale-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-protein/20 to-protein/10 flex items-center justify-center">
                <Drumstick className="w-4.5 h-4.5 text-protein" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">平均蛋白质</span>
            </div>
            <div className="text-3xl font-bold mb-1.5 tabular-nums">{stats.avgProtein}g</div>
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-semibold",
                stats.proteinTrend > 0 ? "text-green-600" : "text-red-500",
              )}
            >
              {stats.proteinTrend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{Math.abs(stats.proteinTrend)}% vs 上周</span>
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">(上周: {stats.prevProtein}g)</p>
          </Card>

          <Card className="p-4 shadow-md border-0 hover:shadow-lg transition-all touch-feedback scale-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-carbs/20 to-carbs/10 flex items-center justify-center">
                <Wheat className="w-4.5 h-4.5 text-carbs" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">平均碳水</span>
            </div>
            <div className="text-3xl font-bold mb-1.5 tabular-nums">{stats.avgCarbs}g</div>
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-semibold",
                stats.carbsTrend > 0 ? "text-red-500" : "text-green-600",
              )}
            >
              {stats.carbsTrend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{Math.abs(stats.carbsTrend)}% vs 上周</span>
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">(上周: {stats.avgCarbs}g)</p>
          </Card>

          <Card className="p-4 shadow-md border-0 hover:shadow-lg transition-all touch-feedback scale-in" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fats/20 to-fats/10 flex items-center justify-center">
                <Droplet className="w-4.5 h-4.5 text-fats" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">平均脂肪</span>
            </div>
            <div className="text-3xl font-bold mb-1.5 tabular-nums">{stats.avgFats}g</div>
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-semibold",
                stats.fatsTrend > 0 ? "text-red-500" : "text-green-600",
              )}
            >
              {stats.fatsTrend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{Math.abs(stats.fatsTrend)}% vs 上周</span>
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">(上周: {stats.prevFats}g)</p>
          </Card>
        </div>

        {/* Empty State */}
        {weeklyData.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">暂无{timeframe}的饮食记录</p>
            <p className="text-sm text-muted-foreground mt-2">开始记录您的餐食，查看营养分析数据</p>
          </Card>
        )}

        {/* Calorie Trend Chart */}
        {weeklyData.length > 0 && (
        <Card className="p-5 shadow-md border-0 bg-gradient-to-br from-card via-card to-amber-50/30 slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className="font-semibold text-base">卡路里趋势</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-gray-800 to-gray-600"></div>
              <span className="font-medium">实际摄入</span>
              <div className="w-6 border-t-2 border-dashed border-amber-500 ml-2"></div>
              <span className="font-medium text-amber-600">目标</span>
            </div>
          </div>
          <div className="h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#374151" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#374151" stopOpacity={0.02} />
                </linearGradient>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3" />
                </filter>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey="day"
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11
                }}
                axisLine={false}
                tickLine={false}
                dy={10}
                height={60}
                tickFormatter={(value) => {
                  // 在小屏幕上缩短日期显示
                  return value.length > 3 ? value.slice(0, 3) : value
                }}
              />
              <YAxis
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11
                }}
                axisLine={false}
                tickLine={false}
                width={40}
                domain={[0, 'auto']}
                tickFormatter={(value) => value}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#9ca3af", strokeWidth: 1, strokeDasharray: "5 5", opacity: 0.5 }}
              />
              <ReferenceLine
                y={dailyCalorieGoal}
                stroke="#f59e0b"
                strokeDasharray="6 4"
                strokeWidth={2.5}
                label={{
                  value: `${dailyCalorieGoal}`,
                  position: "right",
                  fill: "#d97706",
                  fontSize: 10,
                  fontWeight: 600,
                  offset: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="calories"
                stroke="#1f2937"
                strokeWidth={3}
                fill="url(#calorieGradient)"
                dot={(props: {
                  cx?: number
                  cy?: number
                  payload?: {
                    date: string
                    calories: number
                    protein: number
                    carbs: number
                    fats: number
                  }
                }) => {
                  const { cx, cy, payload } = props
                  const key = `dot-${cx}-${cy}`
                  if (!payload || payload.calories === 0) return <circle key={key} cx={cx} cy={cy} r={0} />
                  return (
                    <circle
                      key={key}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill="#ffffff"
                      stroke="#1f2937"
                      strokeWidth={2.5}
                      filter="url(#shadow)"
                    />
                  )
                }}
                activeDot={{ 
                  r: 7, 
                  strokeWidth: 3,
                  fill: "#ffffff",
                  stroke: "#1f2937"
                }}
                connectNulls
              />
            </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        )}

        {/* Macronutrient Distribution */}
        {weeklyData.length > 0 && (
        <Card className="p-5 shadow-md border-0 bg-gradient-to-br from-card via-card to-orange-50/20 slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="font-semibold mb-4 text-base">营养素分布</h3>
          <div className="h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="proteinGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="carbsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="fatsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey="day"
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11
                }}
                axisLine={false}
                tickLine={false}
                dy={10}
                height={60}
                tickFormatter={(value) => {
                  // 在小屏幕上缩短日期显示
                  return value.length > 3 ? value.slice(0, 3) : value
                }}
              />
              <YAxis
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11
                }}
                axisLine={false}
                tickLine={false}
                width={40}
                domain={[0, 'auto']}
                tickFormatter={(value) => value}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
              />
              <Bar 
                dataKey="protein" 
                stackId="a" 
                fill="url(#proteinGradient)" 
                radius={[0, 0, 0, 0]}
                maxBarSize={40}
              />
              <Bar 
                dataKey="carbs" 
                stackId="a" 
                fill="url(#carbsGradient)" 
                radius={[0, 0, 0, 0]}
                maxBarSize={40}
              />
              <Bar 
                dataKey="fats" 
                stackId="a" 
                fill="url(#fatsGradient)" 
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm shadow-sm" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }} />
              <span className="text-xs text-muted-foreground font-medium">蛋白质</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm shadow-sm" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }} />
              <span className="text-xs text-muted-foreground font-medium">碳水化合物</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm shadow-sm" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }} />
              <span className="text-xs text-muted-foreground font-medium">脂肪</span>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-border">
            <h4 className="font-semibold mb-3 text-sm">本周营养素总览</h4>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <ResponsiveContainer width={120} height={120} className="sm:w-[130px] sm:h-[130px]">
                <PieChart>
                  <Pie
                    data={macroDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={48}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {macroDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 w-full space-y-2 sm:space-y-2.5">
                {macroDistribution.map((macro) => (
                  <div key={macro.name} className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: macro.color }} />
                      <span className="text-xs text-muted-foreground font-medium truncate">{macro.name}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground">{macro.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
        )}

        {/* Insights */}
        {weeklyData.length > 0 && (
        <Card className="p-4 shadow-md border-0">
          <h3 className="font-semibold mb-3 text-base">本周洞察</h3>
          <div className="space-y-2.5">
            <button
              className="w-full flex gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-all border border-green-100 text-left"
              onClick={() => alert("查看蛋白质摄入详情和建议")}
            >
              <div className="w-9 h-9 rounded-xl bg-green-200/50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4.5 h-4.5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">蛋白质摄入稳定</p>
                <p className="text-xs text-muted-foreground">您本周的蛋白质摄入量保持在健康范围内</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
            </button>
            <button
              className="w-full flex gap-3 p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-all border border-red-100 text-left"
              onClick={() => alert("查看优质全谷物食物推荐")}
            >
              <div className="w-9 h-9 rounded-xl bg-red-200/50 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-4.5 h-4.5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">碳水化合物偏高</p>
                <p className="text-xs text-muted-foreground">建议减少精制碳水的摄入，增加全谷物</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
            </button>
          </div>
        </Card>
        )}
        </div>

        <BottomNav />
      </div>
    </AuthGuard>
  )
}
