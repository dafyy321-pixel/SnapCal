"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { requestData } from "@/lib/api-services"
import { localDateParts } from "@/lib/date-utils"

export default function NewMealPage() {
  const router = useRouter()
  const now = localDateParts()
  const [form, setForm] = useState({ meal_name: "", meal_type: "snack", meal_date: now.date, meal_time: now.time, calories: "", protein: "", carbs: "", fats: "" })
  const [error, setError] = useState("")
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const data = await requestData<{ meal: { id: string } }>("/api/meals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, calories: Number(form.calories), protein: Number(form.protein), carbs: Number(form.carbs), fats: Number(form.fats) }) })
      router.replace(`/meal/${data.meal.id}`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "保存失败") }
  }
  return <div className="min-h-screen bg-muted/30"><MobilePageHeader title="手动添加餐食" /><form onSubmit={save} className="mx-auto max-w-md space-y-4 p-4"><Card className="gap-4 p-4"><label className="text-sm font-medium">餐食名称<Input required maxLength={100} value={form.meal_name} onChange={event => setForm({ ...form, meal_name: event.target.value })} /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm">日期<Input type="date" value={form.meal_date} onChange={event => setForm({ ...form, meal_date: event.target.value })} /></label><label className="text-sm">餐别<select className="h-9 w-full rounded-md border bg-background px-3" value={form.meal_type} onChange={event => setForm({ ...form, meal_type: event.target.value })}><option value="breakfast">早餐</option><option value="lunch">午餐</option><option value="dinner">晚餐</option><option value="snack">加餐</option></select></label>{(["calories", "protein", "carbs", "fats"] as const).map(key => <label key={key} className="text-sm">{{ calories: "卡路里 kcal", protein: "蛋白质 g", carbs: "碳水 g", fats: "脂肪 g" }[key]}<Input required type="number" min="0" step="0.1" value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} /></label>)}</div></Card>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" className="h-12 w-full">保存餐食</Button></form></div>
}
