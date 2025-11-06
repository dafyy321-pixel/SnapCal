"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Flame, Drumstick, Wheat, Droplet, Calendar, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/bottom-nav"
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

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"本周" | "上周" | "本月">("本周")

  const weeklyData = [
    { day: "周一", calories: 1800, protein: 85, carbs: 200, fats: 60 },
    { day: "周二", calories: 2100, protein: 95, carbs: 220, fats: 70 },
    { day: "周三", calories: 1950, protein: 90, carbs: 210, fats: 65 },
    { day: "周四", calories: 2200, protein: 100, carbs: 240, fats: 75 },
    { day: "周五", calories: 1850, protein: 88, carbs: 195, fats: 62 },
    { day: "周六", calories: 2300, protein: 105, carbs: 250, fats: 80 },
    { day: "周日", calories: 2000, protein: 92, carbs: 215, fats: 68 },
  ]

  const dailyCalorieGoal = 1900

  const stats = {
    avgCalories: 2029,
    caloriesTrend: 5.2,
    prevCalories: 1928,
    avgProtein: 93,
    proteinTrend: -2.1,
    prevProtein: 95,
    avgCarbs: 219,
    carbsTrend: 8.3,
    prevCarbs: 202,
    avgFats: 69,
    fatsTrend: 3.5,
    prevFats: 67,
  }

  const totalProtein = weeklyData.reduce((sum, day) => sum + day.protein, 0)
  const totalCarbs = weeklyData.reduce((sum, day) => sum + day.carbs, 0)
  const totalFats = weeklyData.reduce((sum, day) => sum + day.fats, 0)
  const totalMacros = totalProtein + totalCarbs + totalFats

  const macroDistribution = [
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl shadow-lg p-3">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name === "calories"
                ? "卡路里"
                : entry.name === "protein"
                  ? "蛋白质"
                  : entry.name === "carbs"
                    ? "碳水"
                    : "脂肪"}
              : {entry.value}
              {entry.name === "calories" ? "" : "g"}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
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
          <Card className="p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-xs text-muted-foreground">平均卡路里</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.avgCalories}</div>
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                stats.caloriesTrend > 0 ? "text-destructive" : "text-success",
              )}
            >
              {stats.caloriesTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(stats.caloriesTrend)}% vs 上周</span>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1">(上周: {stats.prevCalories})</p>
          </Card>

          <Card className="p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-protein/10 flex items-center justify-center">
                <Drumstick className="w-4 h-4 text-protein" />
              </div>
              <span className="text-xs text-muted-foreground">平均蛋白质</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.avgProtein}g</div>
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                stats.proteinTrend > 0 ? "text-success" : "text-destructive",
              )}
            >
              {stats.proteinTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(stats.proteinTrend)}% vs 上周</span>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1">(上周: {stats.prevProtein}g)</p>
          </Card>

          <Card className="p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-carbs/10 flex items-center justify-center">
                <Wheat className="w-4 h-4 text-carbs" />
              </div>
              <span className="text-xs text-muted-foreground">平均碳水</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.avgCarbs}g</div>
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                stats.carbsTrend > 0 ? "text-destructive" : "text-success",
              )}
            >
              {stats.carbsTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(stats.carbsTrend)}% vs 上周</span>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1">(上周: {stats.prevCarbs}g)</p>
          </Card>

          <Card className="p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-fats/10 flex items-center justify-center">
                <Droplet className="w-4 h-4 text-fats" />
              </div>
              <span className="text-xs text-muted-foreground">平均脂肪</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.avgFats}g</div>
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                stats.fatsTrend > 0 ? "text-destructive" : "text-success",
              )}
            >
              {stats.fatsTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(stats.fatsTrend)}% vs 上周</span>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1">(上周: {stats.prevFats}g)</p>
          </Card>
        </div>

        {/* Calorie Trend Chart */}
        <Card className="p-5 shadow-sm">
          <h3 className="font-semibold mb-4 text-base">卡路里趋势</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a1a1a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#1a1a1a", strokeWidth: 1, strokeDasharray: "5 5" }}
              />
              <ReferenceLine
                y={dailyCalorieGoal}
                stroke="#f39c12"
                strokeDasharray="8 4"
                strokeWidth={2}
                label={{
                  value: `目标: ${dailyCalorieGoal}`,
                  position: "right",
                  fill: "#f39c12",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />
              <Area
                type="monotone"
                dataKey="calories"
                stroke="#1a1a1a"
                strokeWidth={4}
                fill="url(#calorieGradient)"
                dot={{ fill: "#1a1a1a", strokeWidth: 3, r: 6, stroke: "#ffffff" }}
                activeDot={{ r: 8, strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Macronutrient Distribution */}
        <Card className="p-5 shadow-sm">
          <h3 className="font-semibold mb-4 text-base">营养素分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="protein" stackId="a" fill="#e74c3c" radius={[0, 0, 0, 0]} />
              <Bar dataKey="carbs" stackId="a" fill="#f39c12" radius={[0, 0, 0, 0]} />
              <Bar dataKey="fats" stackId="a" fill="#3498db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#e74c3c" }} />
              <span className="text-xs text-muted-foreground">蛋白质</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f39c12" }} />
              <span className="text-xs text-muted-foreground">碳水化合物</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3498db" }} />
              <span className="text-xs text-muted-foreground">脂肪</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-medium mb-4 text-sm">本周营养素总览</h4>
            <div className="flex items-center justify-between gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={macroDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {macroDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {macroDistribution.map((macro) => (
                  <div key={macro.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
                      <span className="text-xs text-muted-foreground">{macro.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{macro.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Insights */}
        <Card className="p-4 shadow-sm">
          <h3 className="font-semibold mb-4">本周洞察</h3>
          <div className="space-y-3">
            <button
              className="w-full flex gap-3 p-3 bg-success/10 rounded-lg hover:bg-success/15 transition-colors text-left"
              onClick={() => alert("查看蛋白质摄入详情和建议")}
            >
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">蛋白质摄入稳定</p>
                <p className="text-xs text-muted-foreground">您本周的蛋白质摄入量保持在健康范围内</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
            </button>
            <button
              className="w-full flex gap-3 p-3 bg-destructive/10 rounded-lg hover:bg-destructive/15 transition-colors text-left"
              onClick={() => alert("查看优质全谷物食物推荐")}
            >
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">碳水化合物偏高</p>
                <p className="text-xs text-muted-foreground">建议减少精制碳水的摄入，增加全谷物</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
            </button>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}
