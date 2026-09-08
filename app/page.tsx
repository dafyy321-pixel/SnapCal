"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Activity, BatteryMedium, Check, Flame, Ruler, Sparkles, Trash2, Utensils } from "lucide-react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { FoodImage } from "@/components/optimized-image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { localDateParts } from "@/lib/date-utils"
import { requestData } from "@/lib/api-services"

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

type Workout = { id: string; title: string; status: string; workout_type: string; session_time: string; duration_minutes: number | null }
type Checkin = { energy: number; hunger: number; soreness: number; sleep_hours: number | null }
type BodyMetric = { weight_kg: number | null; waist_cm: number | null; body_fat_percent: number | null }
type ActionCard = {
  id: string
  candidate_id: string
  kind: "fuel" | "workout" | "recovery" | "logging" | "reflection"
  title: string
  action_text: string
  rationale: string
  confidence: "low" | "medium" | "high"
  source: "rules" | "ai_enhanced"
  valid_until: string
  candidate_snapshot: Array<{ id: string; payload: Record<string, unknown> }>
}

type DayData = {
  meals: Meal[]
  workouts: Workout[]
  checkin: Checkin | null
  body_metric: BodyMetric | null
  action_card: ActionCard | null
  summary: { workout_minutes: number; completed_workout_count: number }
}

const mealLabels = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐" }

function todayString() {
  return localDateParts().date
}

async function fetchHomeData(date: string): Promise<{ day: DayData; profile: Profile }> {
  const [dayResponse, profileResponse] = await Promise.all([fetch(`/api/day?date=${encodeURIComponent(date)}`), fetch("/api/profile")])
  const [dayBody, profileBody] = await Promise.all([dayResponse.json(), profileResponse.json()])
  if (!dayResponse.ok || !dayBody.success) throw new Error(dayBody.error?.message || "加载当天记录失败")
  if (!profileResponse.ok || !profileBody.success) throw new Error(profileBody.error?.message || "加载目标失败")
  let day = dayBody.data as DayData
  if (date === todayString() && !day.action_card) {
    const actionResponse = await fetch("/api/actions/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ date }) })
    const actionBody = await actionResponse.json()
    if (actionResponse.ok && actionBody.success) day = { ...day, action_card: actionBody.data.action_card }
  }
  return { day, profile: profileBody.data.profile }
}

export default function HomePage() {
  const router = useRouter()
  const [date, setDate] = useState(todayString)
  const [meals, setMeals] = useState<Meal[]>([])
  const [profile, setProfile] = useState<Profile>({ daily_calorie_goal: 1800, daily_protein_goal: 50, daily_carbs_goal: 250, daily_fats_goal: 65 })
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [checkin, setCheckin] = useState<Checkin | null>(null)
  const [bodyMetric, setBodyMetric] = useState<BodyMetric | null>(null)
  const [actionCard, setActionCard] = useState<ActionCard | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [workoutMinutes, setWorkoutMinutes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      const result = await fetchHomeData(date)
      setMeals(result.day.meals || [])
      setWorkouts(result.day.workouts || [])
      setCheckin(result.day.checkin)
      setBodyMetric(result.day.body_metric)
      setActionCard(result.day.action_card)
      setWorkoutMinutes(result.day.summary.workout_minutes)
      setProfile(result.profile)
    } catch (error) {
      setError(error instanceof Error ? error.message : "加载失败")
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    let cancelled = false
    fetchHomeData(date)
      .then(result => {
        if (!cancelled) {
          setMeals(result.day.meals || [])
          setWorkouts(result.day.workouts || [])
          setCheckin(result.day.checkin)
          setBodyMetric(result.day.body_metric)
          setActionCard(result.day.action_card)
          setWorkoutMinutes(result.day.summary.workout_minutes)
          setProfile(result.profile)
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

  const macroGoals = useMemo(() => [
    { name: "蛋白质", value: totals.protein, goal: profile.daily_protein_goal, color: "#ef4444" },
    { name: "碳水", value: totals.carbs, goal: profile.daily_carbs_goal, color: "#f59e0b" },
    { name: "脂肪", value: totals.fats, goal: profile.daily_fats_goal, color: "#8b5cf6" },
  ].map(item => ({
    ...item,
    percentage: item.goal > 0 ? Math.min(100, item.value / item.goal * 100) : 0,
    difference: item.goal - item.value,
  })), [profile, totals])

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

  async function respondToAction(status: "completed" | "dismissed" | "replaced", reason?: string) {
    if (!actionCard || actionBusy || loading) return
    setActionBusy(true)
    setError("")
    try {
      await requestData(`/api/actions/${actionCard.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, reason }) })
      setActionCard(null)
      if (status === "replaced") {
        const data = await requestData<{ action_card: ActionCard }>("/api/actions/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ date, force: true }) })
        setActionCard(data.action_card)
      }
    } catch (error) {
      // A lost response may follow a successful write; retry reloads authoritative state.
      setError(error instanceof TypeError ? "连接本地服务失败，未能确认操作结果。请确认服务已启动后点击重试。" : error instanceof Error ? error.message : "更新行动失败，请重试")
    } finally {
      setActionBusy(false)
    }
  }

  function openAction() {
    if (!actionCard) return
    const payload = actionCard.candidate_snapshot.find(item => item.id === actionCard.candidate_id)?.payload || {}
    if (actionCard.kind === "logging") router.push("/check-in")
    else if (actionCard.kind === "workout") router.push("/workouts/new")
    else if (actionCard.kind === "fuel") router.push(`/scan?mode=inventory&context=${String(payload.context || "general")}${payload.workout_id ? `&workout_id=${String(payload.workout_id)}` : ""}`)
    else if (actionCard.kind === "recovery" && payload.workout_id) router.push(`/workouts/${String(payload.workout_id)}`)
    else router.push("/records")
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        <header className="flex items-center justify-between"><div className="flex items-center gap-2"><Image src="/logo.png" alt="" width={32} height={32} /><h1 className="text-2xl font-bold">SnapCal</h1></div><input aria-label="选择日期" disabled={actionBusy} type="date" max={todayString()} value={date} onChange={event => { setLoading(true); setError(""); setDate(event.target.value) }} className="border rounded-lg px-2 py-1.5 bg-card text-sm" /></header>
        {error && <Card role="alert" className="p-3 text-sm text-destructive">{error}<Button disabled={actionBusy || loading} variant="link" onClick={() => { setLoading(true); setError(""); void load() }}>重试</Button></Card>}
        {actionCard && <Card className="gap-3 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-5"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-medium text-primary"><Sparkles className="size-4" />今日行动</span><span className="text-xs text-muted-foreground">{actionCard.source === "ai_enhanced" ? "AI 增强" : "本地规则"} · {actionCard.confidence === "high" ? "依据较完整" : "数据有限"}</span></div><div><h2 className="text-lg font-semibold">{actionCard.title}</h2><p className="mt-1 text-sm">{actionCard.action_text}</p><p className="mt-2 text-xs text-muted-foreground">依据：{actionCard.rationale}</p><p className="mt-1 text-xs text-muted-foreground">有效至 {new Date(actionCard.valid_until).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</p></div><Button disabled={actionBusy || loading} onClick={openAction}>去完成</Button><div className="grid grid-cols-4 gap-1"><Button size="sm" variant="outline" disabled={actionBusy || loading} onClick={() => respondToAction("completed")}><Check />完成</Button><Button size="sm" variant="ghost" disabled={actionBusy || loading} onClick={() => respondToAction("dismissed", "not_suitable")}>不适合</Button><Button size="sm" variant="ghost" disabled={actionBusy || loading} onClick={() => respondToAction("dismissed", "later")}>稍后</Button><Button size="sm" variant="ghost" disabled={actionBusy || loading} onClick={() => respondToAction("replaced", "another")}>换一个</Button></div></Card>}
        <div className="grid grid-cols-3 gap-2"><Card className="gap-1 p-3"><Activity className="size-4 text-primary" /><span className="text-xs text-muted-foreground">训练</span><strong>{workouts.length} 次</strong><span className="text-[11px] text-muted-foreground">{workoutMinutes} 分钟</span></Card><Card className="gap-1 p-3"><BatteryMedium className="size-4 text-primary" /><span className="text-xs text-muted-foreground">状态</span><strong>{checkin ? `精力 ${checkin.energy}` : "未打卡"}</strong><span className="text-[11px] text-muted-foreground">{checkin ? `饥饿 ${checkin.hunger} · 酸痛 ${checkin.soreness}` : "三次点击完成"}</span></Card><Card className="gap-1 p-3"><Ruler className="size-4 text-primary" /><span className="text-xs text-muted-foreground">身体</span><strong>{bodyMetric?.weight_kg == null ? "未记录" : `${bodyMetric.weight_kg}kg`}</strong><span className="text-[11px] text-muted-foreground">{bodyMetric?.waist_cm == null ? "腰围 —" : `腰围 ${bodyMetric.waist_cm}cm`}</span></Card></div>
        <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Flame className="w-4 h-4 text-orange-500" />当日摄入</div>
          <div className="text-4xl font-bold mt-2">{Math.round(totals.calories)} <span className="text-base font-normal text-muted-foreground">/ {profile.daily_calorie_goal} kcal</span></div>
          <div className="h-2 bg-white rounded-full mt-4 overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${Math.min(100, totals.calories / profile.daily_calorie_goal * 100)}%` }} /></div>
        </Card>
        {workouts.length > 0 && <section className="space-y-2"><h2 className="font-semibold">今日训练</h2>{workouts.map(workout => <button key={workout.id} className="w-full text-left" onClick={() => router.push(`/workouts/${workout.id}`)}><Card className="flex-row items-center gap-3 p-4"><Activity className="size-5 text-primary" /><span className="flex-1"><span className="block font-medium">{workout.title}</span><span className="text-xs text-muted-foreground">{workout.session_time.slice(0, 5)} · {workout.duration_minutes || 0} 分钟</span></span></Card></button>)}</section>}
        <div className="flex items-center justify-between"><h2 className="font-semibold">今日饮食</h2><Button size="sm" variant="ghost" onClick={() => router.push("/meals/new")}><Utensils />手动添加</Button></div>
        <div className="grid grid-cols-3 gap-3" aria-label="每日营养目标完成度">
          {macroGoals.map(item => <Card key={item.name} className="p-3 text-center items-center">
            <div className="relative size-16 rounded-full" style={{ background: `conic-gradient(${item.color} ${item.percentage * 3.6}deg, var(--muted) 0deg)` }}>
              <div className="absolute inset-1.5 rounded-full bg-card flex items-center justify-center text-sm font-bold">{Math.round(item.value)}g</div>
            </div>
            <div className="text-xs font-medium mt-2">{item.name}</div>
            <div className="text-[11px] text-muted-foreground">
              {item.difference > 0 ? `还差 ${Math.round(item.difference)}g` : item.difference < 0 ? `超出 ${Math.round(Math.abs(item.difference))}g` : "已达标"}
            </div>
          </Card>)}
        </div>
        {loading ? <Card className="p-8 text-center text-muted-foreground">加载中…</Card> : grouped.length === 0 ? <Card className="p-8 text-center"><p className="font-medium">这天还没有餐食记录</p><p className="text-sm text-muted-foreground mt-2">点击底部添加按钮拍照识别</p></Card> : grouped.map(group => <section key={group.type} className="space-y-2"><h2 className="font-semibold">{group.label}</h2>{group.meals.map(meal => <Card key={meal.id} className="relative flex cursor-pointer flex-col items-center gap-2 p-3 text-center" onClick={() => router.push(`/meal/${meal.id}`)}><FoodImage src={meal.image_url || "/placeholder.svg"} alt={meal.meal_name} foodName={meal.meal_name} width={64} height={64} className="h-16 w-16 shrink-0" imageClassName="h-16 w-16 object-cover" /><div className="min-w-0"><div className="truncate font-medium">{meal.meal_name}</div><div className="mt-1 text-xs text-muted-foreground">{meal.meal_time.slice(0, 5)} · {Math.round(meal.calories)} kcal</div></div><Button aria-label={`删除${meal.meal_name}`} variant="ghost" size="icon" className="absolute right-3 top-3" onClick={event => { event.stopPropagation(); removeMeal(meal.id) }}><Trash2 className="w-4 h-4 text-destructive" /></Button></Card>)}</section>)}
      </main>
      <BottomNav />
    </div>
  )
}
