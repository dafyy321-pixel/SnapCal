"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Save, Trash2 } from "lucide-react"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { requestData } from "@/lib/api-services"
import { localDateParts } from "@/lib/date-utils"
import type { CheckinScore, DailyCheckinRecord } from "@/lib/wellness-types"

const labels: Record<string, string[]> = {
  energy: ["很低", "偏低", "一般", "不错", "很好"],
  hunger: ["不饿", "微饿", "一般", "较饿", "很饿"],
  soreness: ["没有", "轻微", "一般", "明显", "较高"],
}

function CheckInContent() {
  const searchParams = useSearchParams()
  const requestedDate = searchParams.get("date")
  const [date, setDate] = useState(/^\d{4}-\d{2}-\d{2}$/.test(requestedDate || "") ? requestedDate! : localDateParts().date)
  const [values, setValues] = useState<{ energy: CheckinScore | null; hunger: CheckinScore | null; soreness: CheckinScore | null; sleep_hours: number | null; sleep_quality: CheckinScore | null; notes: string }>({ energy: null, hunger: null, soreness: null, sleep_hours: null, sleep_quality: null, notes: "" })
  const [exists, setExists] = useState(false)
  const [message, setMessage] = useState("")
  const [loadedDate, setLoadedDate] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)
  const ready = loadedDate === date && !busy
  useEffect(() => {
    let cancelled = false
    fetch(`/api/checkins/${date}`).then(async response => {
      if (cancelled) return
      if (response.status === 404) {
        setLoadedDate(date)
        setExists(false)
        setValues({ energy: null, hunger: null, soreness: null, sleep_hours: null, sleep_quality: null, notes: "" })
        return
      }
      const body = await response.json() as { success: boolean; data?: { checkin: DailyCheckinRecord }; error?: { message: string } }
      if (!response.ok || !body.success || !body.data) throw new Error(body.error?.message || "加载失败")
      if (cancelled) return
      setLoadedDate(date)
      const item = body.data.checkin
      setExists(true)
      setValues({ energy: item.energy, hunger: item.hunger, soreness: item.soreness, sleep_hours: item.sleep_hours, sleep_quality: item.sleep_quality, notes: item.notes || "" })
    }).catch(error => { if (!cancelled) setMessage(error instanceof Error ? error.message : "加载失败") })
    return () => { cancelled = true }
  }, [date, reload])
  const save = async () => {
    if (!ready) return
    setMessage("")
    if (!values.energy || !values.hunger || !values.soreness) { setMessage("请完成精力、饥饿和酸痛三项"); return }
    setBusy(true)
    try {
      await requestData(`/api/checkins/${date}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(values) })
      setExists(true); setMessage("今日状态已保存")
    } catch (error) { setMessage(error instanceof Error ? error.message : "保存失败，请重试") }
    finally { setBusy(false) }
  }
  const remove = async () => {
    if (!ready) return
    setMessage(""); setBusy(true)
    try {
      await requestData(`/api/checkins/${date}`, { method: "DELETE" })
      setExists(false); setValues({ energy: null, hunger: null, soreness: null, sleep_hours: null, sleep_quality: null, notes: "" }); setMessage("记录已删除")
    } catch (error) { setMessage(error instanceof Error ? error.message : "删除失败，请重试") }
    finally { setBusy(false) }
  }
  return <div className="min-h-screen bg-muted/30 pb-8"><MobilePageHeader title="今日状态" description="三次点击即可完成必填项" /><main className="mx-auto max-w-md space-y-4 p-4">
    <label className="block space-y-1 text-sm font-medium">日期<Input type="date" disabled={busy} value={date} onChange={event => { setLoadedDate(null); setMessage(""); setDate(event.target.value) }} /></label>
    {(["energy", "hunger", "soreness"] as const).map(key => <Card key={key} className="gap-3 p-4"><fieldset><legend className="mb-3 font-medium">{{ energy: "精力", hunger: "饥饿", soreness: "酸痛" }[key]} <span className="text-destructive">*</span></legend><div className="grid grid-cols-5 gap-2">{([1, 2, 3, 4, 5] as CheckinScore[]).map(score => <button key={score} type="button" aria-pressed={values[key] === score} onClick={() => setValues({ ...values, [key]: score })} className={`min-h-14 rounded-lg border px-1 text-xs ${values[key] === score ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}><span className="block text-base font-semibold">{score}</span>{labels[key][score - 1]}</button>)}</div></fieldset></Card>)}
    <Card className="gap-4 p-4"><h2 className="font-medium">睡眠（可选）</h2><div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm">时长（小时）<Input type="number" min="0" max="24" step="0.5" value={values.sleep_hours ?? ""} onChange={event => setValues({ ...values, sleep_hours: event.target.value ? Number(event.target.value) : null })} /></label><label className="space-y-1 text-sm">质量 1～5<Input type="number" min="1" max="5" value={values.sleep_quality ?? ""} onChange={event => setValues({ ...values, sleep_quality: event.target.value ? Number(event.target.value) as CheckinScore : null })} /></label></div><label className="space-y-1 text-sm">备注<Textarea maxLength={500} value={values.notes} onChange={event => setValues({ ...values, notes: event.target.value })} /></label></Card>
    {loadedDate !== date && <Button variant="outline" onClick={() => { setLoadedDate(null); setMessage(""); setReload(value => value + 1) }}>重新加载</Button>}{message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    <div className="grid grid-cols-2 gap-2">{exists && <Button variant="destructive" disabled={!ready} onClick={remove}><Trash2 />删除</Button>}<Button className={exists ? "" : "col-span-2"} disabled={!ready} onClick={save}><Save />保存状态</Button></div>
  </main></div>
}

export default function CheckInPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center">加载中…</div>}><CheckInContent /></Suspense>
}
