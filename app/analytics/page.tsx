"use client"

import { useCallback, useEffect, useState } from "react"
import { Activity, BatteryMedium, CalendarDays, Dumbbell, FlaskConical, Ruler, Utensils } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type Timeframe = "7d" | "30d"
type ExperimentStatus = "proposed" | "active" | "completed" | "skipped" | "cancelled"

interface Insights {
  timeframe: Timeframe
  range: { start_date: string; end_date: string }
  nutrition: {
    recorded_days: number
    meal_count: number
    daily_average: { calories: number; protein: number; carbs: number; fats: number } | null
    confidence: "low" | "medium" | "high"
  }
  training: {
    completed_sessions: number
    total_minutes: number
    strength_sets: number
    volume_kg_reps: number
    cardio_minutes: number
    cardio_distance_meters: number
    template_completion_rate: number | null
    average_effort: number | null
  }
  status: {
    recorded_days: number
    energy: number | null
    hunger: number | null
    soreness: number | null
    sleep_hours: number | null
    sleep_quality: number | null
  }
  body_metrics: Array<{
    date: string
    weight_kg: number | null
    waist_cm: number | null
    body_fat_percent: number | null
  }>
  observations: string[]
  completeness: { meal_days: number; completed_workouts: number; checkin_days: number }
}

interface Experiment {
  id: string
  start_date: string
  end_date: string
  title: string
  instruction: string
  hypothesis: string
  status: ExperimentStatus
}

const confidenceLabels = { low: "数据较少", medium: "数据一般", high: "数据较完整" }
const statusLabels: Record<ExperimentStatus, string> = {
  proposed: "待确认",
  active: "进行中",
  completed: "已完成",
  skipped: "已跳过",
  cancelled: "已取消",
}

function value(value: number | null, suffix = "") {
  return value == null ? "—" : `${value}${suffix}`
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0 rounded-xl bg-muted/50 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-semibold tabular-nums">{children}</div></div>
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("7d")
  const [insights, setInsights] = useState<Insights | null>(null)
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [missing, setMissing] = useState<string[]>([])
  const [instruction, setInstruction] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [insightsResponse, experimentsResponse] = await Promise.all([
        fetch(`/api/insights?timeframe=${timeframe}`),
        fetch("/api/experiments"),
      ])
      const [insightsBody, experimentsBody] = await Promise.all([insightsResponse.json(), experimentsResponse.json()])
      if (!insightsResponse.ok || !insightsBody.success) throw new Error(insightsBody.error?.message || "加载洞察失败")
      if (!experimentsResponse.ok || !experimentsBody.success) throw new Error(experimentsBody.error?.message || "加载周度尝试失败")
      setInsights(insightsBody.data)
      setExperiments(experimentsBody.data.experiments || [])
      const editable = (experimentsBody.data.experiments as Experiment[]).find(item => item.status === "proposed")
      setInstruction(editable?.instruction || "")
    } catch (error) {
      setError(error instanceof Error ? error.message : "加载失败")
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    const request = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(request)
  }, [load])

  async function propose() {
    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/experiments", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })
      const body = await response.json()
      if (!response.ok || !body.success) throw new Error(body.error?.message || "暂时无法提出尝试")
      setMissing(body.data.missing || [])
      if (body.data.experiment) {
        setInstruction(body.data.experiment.instruction)
        await load()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "操作失败")
    } finally {
      setBusy(false)
    }
  }

  async function updateExperiment(experiment: Experiment, status?: ExperimentStatus) {
    setBusy(true)
    setError("")
    try {
      const payload = status ? { status, ...(status === "active" ? { instruction } : {}) } : { instruction }
      const response = await fetch(`/api/experiments/${experiment.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await response.json()
      if (!response.ok || !body.success) throw new Error(body.error?.message || "更新尝试失败")
      await load()
    } catch (error) {
      setError(error instanceof Error ? error.message : "操作失败")
    } finally {
      setBusy(false)
    }
  }

  const currentExperiment = experiments.find(item => item.status === "active" || item.status === "proposed")
  const history = experiments.filter(item => item.status !== "active" && item.status !== "proposed").slice(0, 3)

  return <div className="min-h-screen bg-background pb-24">
    <main className="mx-auto max-w-md space-y-5 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">综合洞察</h1><p className="mt-1 text-xs text-muted-foreground">只展示记录中的同期现象，不作因果判断</p></div>
        <label className="sr-only" htmlFor="insight-timeframe">统计周期</label>
        <select id="insight-timeframe" value={timeframe} onChange={event => setTimeframe(event.target.value as Timeframe)} className="rounded-lg border bg-card px-3 py-2 text-sm">
          <option value="7d">最近 7 天</option><option value="30d">最近 30 天</option>
        </select>
      </header>

      {error && <Card className="p-4 text-sm text-destructive">{error}<Button className="ml-2" size="sm" variant="outline" onClick={() => void load()}>重试</Button></Card>}
      {loading || !insights ? <Card className="p-8 text-center text-muted-foreground">加载中…</Card> : <>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-semibold"><CalendarDays className="size-4 text-primary" />数据完整度</h2><span className="text-xs text-muted-foreground">{insights.range.start_date} 至 {insights.range.end_date}</span></div>
          <div className="mt-4 grid grid-cols-3 gap-2"><Metric label="饮食记录">{insights.completeness.meal_days} 天</Metric><Metric label="完成训练">{insights.completeness.completed_workouts} 次</Metric><Metric label="状态打卡">{insights.completeness.checkin_days} 天</Metric></div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><Utensils className="size-4 text-primary" />营养</h2><span className="text-xs text-muted-foreground">{confidenceLabels[insights.nutrition.confidence]}</span></div>
          {insights.nutrition.daily_average ? <div className="mt-4 grid grid-cols-2 gap-2"><Metric label="日均热量">{Math.round(insights.nutrition.daily_average.calories)} kcal</Metric><Metric label="日均蛋白质">{Math.round(insights.nutrition.daily_average.protein)} g</Metric><Metric label="日均碳水">{Math.round(insights.nutrition.daily_average.carbs)} g</Metric><Metric label="日均脂肪">{Math.round(insights.nutrition.daily_average.fats)} g</Metric></div> : <p className="mt-4 text-sm text-muted-foreground">周期内还没有饮食记录；未记录日期不会按零摄入计算。</p>}
          <p className="mt-3 text-xs text-muted-foreground">共 {insights.nutrition.meal_count} 餐，覆盖 {insights.nutrition.recorded_days} 天。</p>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Dumbbell className="size-4 text-primary" />训练</h2>
          <div className="mt-4 grid grid-cols-2 gap-2"><Metric label="完成 / 总时长">{insights.training.completed_sessions} 次 · {insights.training.total_minutes} 分钟</Metric><Metric label="力量完成组">{insights.training.strength_sets} 组</Metric><Metric label="重量 × 次数">{insights.training.volume_kg_reps} kg·次</Metric><Metric label="主观强度均值">{value(insights.training.average_effort, " / 10")}</Metric><Metric label="有氧">{insights.training.cardio_minutes} 分钟</Metric><Metric label="有氧距离">{insights.training.cardio_distance_meters >= 1000 ? `${Math.round(insights.training.cardio_distance_meters / 100) / 10} km` : `${insights.training.cardio_distance_meters} m`}</Metric></div>
          <p className="mt-3 text-xs text-muted-foreground">模板完成率：{value(insights.training.template_completion_rate, "%")}</p>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold"><BatteryMedium className="size-4 text-primary" />状态</h2>
          <div className="mt-4 grid grid-cols-2 gap-2"><Metric label="精力均值">{value(insights.status.energy, " / 5")}</Metric><Metric label="饥饿均值">{value(insights.status.hunger, " / 5")}</Metric><Metric label="酸痛均值">{value(insights.status.soreness, " / 5")}</Metric><Metric label="睡眠均值">{value(insights.status.sleep_hours, " 小时")}</Metric></div>
          <p className="mt-3 text-xs text-muted-foreground">各指标分别展示，不合成为恢复分或健康分。共 {insights.status.recorded_days} 天记录。</p>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Ruler className="size-4 text-primary" />身体指标</h2>
          {insights.body_metrics.length ? <div className="mt-4 space-y-2">{insights.body_metrics.map(item => <div key={item.date} className="grid grid-cols-4 gap-2 border-b py-2 text-xs last:border-0"><span className="font-medium">{item.date.slice(5)}</span><span>{value(item.weight_kg, " kg")}</span><span>{value(item.waist_cm, " cm")}</span><span>{value(item.body_fat_percent, "%")}</span></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">周期内还没有身体指标记录。</p>}
          <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-muted-foreground"><span>日期</span><span>体重</span><span>腰围</span><span>体脂率</span></div>
          <p className="mt-3 text-xs text-muted-foreground">展示原始记录点；单日变化可能只是测量波动。</p>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Activity className="size-4 text-primary" />观察模式</h2>
          {insights.observations.length ? <ul className="mt-3 space-y-2 text-sm">{insights.observations.map(item => <li key={item} className="rounded-xl bg-muted/50 p-3">{item}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">现有记录还不足以形成观察，继续按平常方式记录即可。</p>}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-semibold"><FlaskConical className="size-4 text-primary" />周度单变量尝试</h2>{currentExperiment && <span className="text-xs text-muted-foreground">{statusLabels[currentExperiment.status]}</span>}</div>
          {currentExperiment ? <div className="mt-4 space-y-3"><div><h3 className="font-medium">{currentExperiment.title}</h3><p className="mt-1 text-xs text-muted-foreground">{currentExperiment.start_date} 至 {currentExperiment.end_date}</p></div><textarea aria-label="尝试说明" disabled={currentExperiment.status !== "proposed" || busy} value={currentExperiment.status === "proposed" ? instruction : currentExperiment.instruction} onChange={event => setInstruction(event.target.value)} className="min-h-24 w-full rounded-xl border bg-background p-3 text-sm disabled:opacity-80" /><p className="text-xs text-muted-foreground">{currentExperiment.hypothesis}</p>{currentExperiment.status === "proposed" ? <div className="flex flex-wrap gap-2"><Button disabled={busy || !instruction.trim()} onClick={() => void updateExperiment(currentExperiment, "active")}>确认开始</Button><Button disabled={busy || !instruction.trim()} variant="outline" onClick={() => void updateExperiment(currentExperiment)}>保存修改</Button><Button disabled={busy} variant="ghost" onClick={() => void updateExperiment(currentExperiment, "skipped")}>跳过</Button></div> : <div className="flex gap-2"><Button disabled={busy} onClick={() => void updateExperiment(currentExperiment, "completed")}>结束并记录</Button><Button disabled={busy} variant="ghost" onClick={() => void updateExperiment(currentExperiment, "cancelled")}>取消</Button></div>}</div> : <div className="mt-4"><p className="text-sm text-muted-foreground">满足 4 天饮食、2 次训练和 3 次状态打卡后，可提出一个需要你确认的七天尝试。</p><Button className="mt-3" disabled={busy} onClick={() => void propose()}>检查并提出尝试</Button>{missing.length > 0 && <ul className="mt-3 space-y-1 text-xs text-muted-foreground">{missing.map(item => <li key={item}>{item}</li>)}</ul>}</div>}
          {history.length > 0 && <div className="mt-5 border-t pt-4"><h3 className="text-sm font-medium">最近历史</h3><div className="mt-2 space-y-2">{history.map(item => <div key={item.id} className="flex items-center justify-between text-xs"><span className="truncate pr-3">{item.title}</span><span className="shrink-0 text-muted-foreground">{statusLabels[item.status]}</span></div>)}</div></div>}
        </Card>
      </>}
    </main>
    <BottomNav />
  </div>
}
