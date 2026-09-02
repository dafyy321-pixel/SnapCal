"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Flame, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { FabButton } from "@/components/fab-button"
import { FoodImage } from "@/components/optimized-image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type Meal = {
  id: string
  meal_name: string
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  meal_time: string
  calories: number
  protein: number
  carbs: number
  fats: number
  image_url: string | null
}

type Profile = {
  daily_calorie_goal: number
  daily_protein_goal: number
  daily_carbs_goal: number
  daily_fats_goal: number
}

const mealLabels = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐" }

function todayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export default function HomePage() {
  const router = useRouter()
  const [date, setDate] = useState(todayString)
  const [meals, setMeals] = useState<Meal[]>([])
  const [profile, setProfile] = useState<Profile>({ daily_calorie_goal: 1800, daily_protein_goal: 50, daily_carbs_goal: 250, daily_fats_goal: 65 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/meals?date=${encodeURIComponent(date)}&limit=1000`)
      const body = await response.json()
      if (!response.ok || !body.success) throw new Error(body.error?.message || "加载失败")
      setMeals(body.data.meals || [])
      setProfile(body.data.profile || { daily_calorie_goal: 1800, daily_protein_goal: 50, daily_carbs_goal: 250, daily_fats_goal: 65 })
    } catch (error) {
      setError(error instanceof Error ? error.message : "加载失败")
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/meals?date=${encodeURIComponent(date)}&limit=1000`)
      .then(async response => ({ response, body: await response.json() }))
      .then(({ response, body }) => {
        if (!response.ok || !body.success) throw new Error(body.error?.message || "加载失败")
        if (!cancelled) {
          setMeals(body.data.meals || [])
          setProfile(body.data.profile || { daily_calorie_goal: 1800, daily_protein_goal: 50, daily_carbs_goal: 250, daily_fats_goal: 65 })
        }
      })
      .catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : "加载失败") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [date])

  const totals = useMemo(() => meals.reduce((sum, meal) => ({
    calories: sum.calories + meal.calories,
    protein: sum.protein + meal.protein,
    carbs: sum.carbs + meal.carbs,
    fats: sum.fats + meal.fats,
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 }), [meals])

  const grouped = useMemo(() => Object.entries(mealLabels).map(([type, label]) => ({
    type,
    label,
    meals: meals.filter(meal => meal.meal_type === type),
  })).filter(group => group.meals.length > 0), [meals])

  async function removeMeal(id: string) {
    if (!window.confirm("确定删除这条餐食记录吗？")) return
    const response = await fetch(`/api/meals/${id}`, { method: "DELETE" })
    if (response.ok) await load()
    else setError("删除失败")
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        <header className="flex items-center justify-between"><div className="flex items-center gap-2"><Image src="/logo.png" alt="" width={32} height={32} /><h1 className="text-2xl font-bold">SnapCal</h1></div><input aria-label="选择日期" type="date" max={todayString()} value={date} onChange={event => { setLoading(true); setError(""); setDate(event.target.value) }} className="border rounded-lg px-2 py-1.5 bg-card text-sm" /></header>
        {error && <Card className="p-3 text-sm text-destructive">{error}<Button variant="link" onClick={() => { setLoading(true); setError(""); void load() }}>重试</Button></Card>}
        <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Flame className="w-4 h-4 text-orange-500" />当日摄入</div>
          <div className="text-4xl font-bold mt-2">{Math.round(totals.calories)} <span className="text-base font-normal text-muted-foreground">/ {profile.daily_calorie_goal} kcal</span></div>
          <div className="h-2 bg-white rounded-full mt-4 overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${Math.min(100, totals.calories / profile.daily_calorie_goal * 100)}%` }} /></div>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          {[['蛋白质', totals.protein, profile.daily_protein_goal], ['碳水', totals.carbs, profile.daily_carbs_goal], ['脂肪', totals.fats, profile.daily_fats_goal]].map(([name, value, goal]) => <Card key={String(name)} className="p-3 text-center"><div className="text-xs text-muted-foreground">{name}</div><div className="text-lg font-bold mt-1">{Math.round(Number(value))}g</div><div className="text-xs text-muted-foreground">/ {goal}g</div></Card>)}
        </div>
        {loading ? <Card className="p-8 text-center text-muted-foreground">加载中…</Card> : grouped.length === 0 ? <Card className="p-8 text-center"><p className="font-medium">这天还没有餐食记录</p><p className="text-sm text-muted-foreground mt-2">点击右下角按钮拍照识别</p></Card> : grouped.map(group => <section key={group.type} className="space-y-2"><h2 className="font-semibold">{group.label}</h2>{group.meals.map(meal => <Card key={meal.id} className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/meal/${meal.id}`)}><FoodImage src={meal.image_url || "/placeholder.svg"} alt={meal.meal_name} foodName={meal.meal_name} width={64} height={64} className="w-16 h-16 shrink-0" imageClassName="w-16 h-16 object-cover" /><div className="flex-1 min-w-0"><div className="font-medium truncate">{meal.meal_name}</div><div className="text-xs text-muted-foreground mt-1">{meal.meal_time.slice(0, 5)} · {Math.round(meal.calories)} kcal</div></div><Button aria-label={`删除${meal.meal_name}`} variant="ghost" size="icon" onClick={event => { event.stopPropagation(); removeMeal(meal.id) }}><Trash2 className="w-4 h-4 text-destructive" /></Button></Card>)}</section>)}
      </main>
      <FabButton />
      <BottomNav />
    </div>
  )
}
