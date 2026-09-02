"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Download, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mealsService, profileService } from "@/lib/api-services"

type Meal = {
  meal_date: string
  meal_time: string
  meal_type: string
  meal_name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  [key: string]: unknown
}

function csvCell(value: unknown): string {
  const text = String(value ?? "")
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export default function ExportPage() {
  const router = useRouter()
  const [format, setFormat] = useState<"json" | "csv">("json")
  const [range, setRange] = useState<"week" | "month" | "all">("all")
  const [meals, setMeals] = useState<Meal[]>([])
  const [profile, setProfile] = useState<Record<string, unknown>>({})
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      mealsService.getAllMeals<Meal>(),
      profileService.getProfile<Record<string, unknown>>(),
    ]).then(([loadedMeals, loadedProfile]) => {
      setMeals(loadedMeals)
      setProfile(loadedProfile)
    }).catch(error => setError(error instanceof Error ? error.message : "加载失败"))
  }, [])

  const filtered = useMemo(() => {
    if (range === "all") return meals
    const cutoff = new Date()
    cutoff.setHours(0, 0, 0, 0)
    cutoff.setDate(cutoff.getDate() - (range === "week" ? 6 : 29))
    return meals.filter(meal => new Date(`${meal.meal_date}T00:00:00`) >= cutoff)
  }, [meals, range])

  function download() {
    const date = new Date().toISOString().slice(0, 10)
    let content: string
    let type: string
    let extension: string
    if (format === "csv") {
      const headers = ["日期", "时间", "餐次", "食物", "卡路里", "蛋白质(g)", "碳水(g)", "脂肪(g)"]
      const rows = filtered.map(meal => [meal.meal_date, meal.meal_time, meal.meal_type, meal.meal_name, meal.calories, meal.protein, meal.carbs, meal.fats])
      content = "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n")
      type = "text/csv;charset=utf-8"
      extension = "csv"
    } else {
      content = JSON.stringify({ exported_at: new Date().toISOString(), profile, meals: filtered }, null, 2)
      type = "application/json"
      extension = "json"
    }
    const url = URL.createObjectURL(new Blob([content], { type }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `snapcal-${date}.${extension}`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="pt-12 pb-6 px-6 border-b flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold">数据导出</h1><div className="w-10" />
        </header>
        <div className="p-6 space-y-5">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Card className="p-6"><div className="flex gap-3 items-center"><FileText className="w-8 h-8 text-primary" /><div><div className="text-2xl font-bold">{filtered.length}</div><div className="text-sm text-muted-foreground">条可导出餐食记录</div></div></div></Card>
          <Card className="p-6 space-y-5">
            <label className="block text-sm font-medium">时间范围<Select value={range} onValueChange={value => setRange(value as typeof range)}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="week">最近7天</SelectItem><SelectItem value="month">最近30天</SelectItem><SelectItem value="all">全部</SelectItem></SelectContent></Select></label>
            <label className="block text-sm font-medium">文件格式<Select value={format} onValueChange={value => setFormat(value as typeof format)}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="json">JSON（含资料和完整字段）</SelectItem><SelectItem value="csv">CSV（餐食表格）</SelectItem></SelectContent></Select></label>
            <Button className="w-full" onClick={download} disabled={Boolean(error)}><Download className="w-4 h-4 mr-2" />下载本地数据</Button>
          </Card>
          <p className="text-xs text-muted-foreground">导出文件由浏览器在本地生成，不会上传到第三方服务。</p>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
