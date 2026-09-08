"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Save, Trash2, TrendingDown } from "lucide-react"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { requestData } from "@/lib/api-services"
import { localDateParts } from "@/lib/date-utils"
import type { BodyMetricRecord } from "@/lib/wellness-types"

type Form = { weight_kg: number | null; waist_cm: number | null; body_fat_percent: number | null; notes: string }
const blank: Form = { weight_kg: null, waist_cm: null, body_fat_percent: null, notes: "" }

function BodyMetricsContent() {
  const searchParams = useSearchParams()
  const requestedDate = searchParams.get("date")
  const [date, setDate] = useState(/^\d{4}-\d{2}-\d{2}$/.test(requestedDate || "") ? requestedDate! : localDateParts().date)
  const [form, setForm] = useState<Form>(blank)
  const [metrics, setMetrics] = useState<BodyMetricRecord[]>([])
  const [exists, setExists] = useState(false)
  const [message, setMessage] = useState("")
  const [loadedDate, setLoadedDate] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)
  const ready = loadedDate === date && !busy
  const loadHistory = () => requestData<{ metrics: BodyMetricRecord[] }>("/api/body-metrics").then(data => setMetrics(data.metrics.slice(-30).reverse()))
  useEffect(() => { void loadHistory().catch(() => setMessage("历史记录加载失败")) }, [])
  useEffect(() => {
    let cancelled = false
    fetch(`/api/body-metrics/${date}`).then(async response => {
      if (cancelled) return
      if (response.status === 404) { setExists(false); setForm(blank); setLoadedDate(date); return }
      const body = await response.json() as { success: boolean; data?: { metric: BodyMetricRecord }; error?: { message: string } }
      if (!response.ok || !body.data) throw new Error(body.error?.message || "加载失败")
      if (cancelled) return
      setLoadedDate(date)
      const item = body.data.metric
      setExists(true); setForm({ weight_kg: item.weight_kg, waist_cm: item.waist_cm, body_fat_percent: item.body_fat_percent, notes: item.notes || "" })
    }).catch(error => { if (!cancelled) setMessage(error instanceof Error ? error.message : "加载失败") })
    return () => { cancelled = true }
  }, [date, reload])
  const field = (key: keyof Pick<Form, "weight_kg" | "waist_cm" | "body_fat_percent">, label: string, min: number, max: number) => <label className="space-y-1 text-sm font-medium">{label}<Input type="number" min={min} max={max} step="0.1" value={form[key] ?? ""} onChange={event => setForm({ ...form, [key]: event.target.value ? Number(event.target.value) : null })} /></label>
  const save = async () => {
    if (!ready) return
    setMessage("")
    if (form.weight_kg == null && form.waist_cm == null && form.body_fat_percent == null) { setMessage("至少填写一个身体指标"); return }
    setBusy(true)
    try {
      await requestData(`/api/body-metrics/${date}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(form) })
      setExists(true); setMessage("身体指标已保存"); await loadHistory()
    } catch (error) { setMessage(error instanceof Error ? error.message : "保存失败，请重试") }
    finally { setBusy(false) }
  }
  const remove = async () => {
    if (!ready) return
    setMessage(""); setBusy(true)
    try {
      await requestData(`/api/body-metrics/${date}`, { method: "DELETE" })
      setExists(false); setForm(blank); setMessage("记录已删除"); await loadHistory()
    } catch (error) { setMessage(error instanceof Error ? error.message : "删除失败，请重试") }
    finally { setBusy(false) }
  }
  return <div className="min-h-screen bg-muted/30 pb-8"><MobilePageHeader title="身体指标" description="分别查看原始趋势，不合成健康分" /><main className="mx-auto max-w-md space-y-4 p-4">
    <Card className="gap-4 p-4"><label className="space-y-1 text-sm font-medium">日期<Input type="date" disabled={busy} value={date} onChange={event => { setLoadedDate(null); setMessage(""); setDate(event.target.value) }} /></label><div className="grid grid-cols-2 gap-3">{field("weight_kg", "体重 kg", 20, 500)}{field("waist_cm", "腰围 cm", 30, 300)}{field("body_fat_percent", "体脂率 %", 1, 75)}</div><label className="space-y-1 text-sm font-medium">备注<Textarea maxLength={500} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></label><div className="grid grid-cols-2 gap-2">{exists && <Button variant="destructive" disabled={!ready} onClick={remove}><Trash2 />删除</Button>}<Button className={exists ? "" : "col-span-2"} disabled={!ready} onClick={save}><Save />保存指标</Button></div>{loadedDate !== date && <Button variant="outline" onClick={() => { setLoadedDate(null); setMessage(""); setReload(value => value + 1) }}>重新加载</Button>}{message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}</Card>
    <Card className="gap-3 p-4"><h2 className="flex items-center gap-2 font-medium"><TrendingDown className="size-4" />最近趋势</h2>{metrics.length === 0 ? <p className="text-sm text-muted-foreground">暂无记录</p> : <div className="space-y-2">{metrics.map(item => <div key={item.metric_date} className="grid grid-cols-4 gap-2 rounded-lg bg-muted p-2 text-xs"><span>{item.metric_date.slice(5)}</span><span>{item.weight_kg == null ? "—" : `${item.weight_kg} kg`}</span><span>{item.waist_cm == null ? "—" : `${item.waist_cm} cm`}</span><span>{item.body_fat_percent == null ? "—" : `${item.body_fat_percent}%`}</span></div>)}</div>}</Card>
  </main></div>
}

export default function BodyMetricsPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center">加载中…</div>}><BodyMetricsContent /></Suspense>
}
