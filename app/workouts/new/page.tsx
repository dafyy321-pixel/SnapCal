"use client"

import { useEffect, useState } from "react"
import { Copy, Dumbbell, FilePlus2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { WorkoutForm } from "@/components/workout-form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requestData } from "@/lib/api-services"
import { localDateParts } from "@/lib/date-utils"
import { emptyWorkout, workoutFromTemplate, workoutInputFromRecord } from "@/lib/workout-ui"
import type { WorkoutInput, WorkoutRecord, WorkoutTemplateRecord } from "@/lib/wellness-types"

export default function NewWorkoutPage() {
  const router = useRouter()
  const now = localDateParts()
  const [templates, setTemplates] = useState<WorkoutTemplateRecord[]>([])
  const [lastWorkout, setLastWorkout] = useState<WorkoutRecord | null>(null)
  const [draft, setDraft] = useState<WorkoutInput | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    Promise.all([
      requestData<{ templates: WorkoutTemplateRecord[] }>("/api/workout-templates"),
      requestData<{ workouts: WorkoutRecord[] }>("/api/workouts?limit=1"),
    ]).then(([templateData, workoutData]) => { setTemplates(templateData.templates); setLastWorkout(workoutData.workouts[0] || null) }).catch(cause => setError(cause instanceof Error ? cause.message : "加载失败"))
  }, [])
  const copyLast = () => {
    if (!lastWorkout) return
    setDraft(workoutInputFromRecord(lastWorkout, { session_date: now.date, session_time: now.time, source: "manual", template_id: null }, true))
  }
  const save = async (input: WorkoutInput) => {
    setBusy(true)
    try {
      const data = await requestData<{ workout: WorkoutRecord }>("/api/workouts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) })
      router.replace(`/workouts/${data.workout.id}`)
    } finally { setBusy(false) }
  }
  return <div className="min-h-screen bg-muted/30 pb-8"><MobilePageHeader title="记录训练" description="空白、模板或复制上次" /><main className="mx-auto max-w-md space-y-4 p-4">
    {!draft && <>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-auto justify-start p-4" onClick={() => setDraft(emptyWorkout(now.date, now.time))}><FilePlus2 />空白训练</Button>
        <Button variant="outline" className="h-auto justify-start p-4" disabled={!lastWorkout} onClick={copyLast}><Copy />复制上次</Button>
      </div>
      <section><h2 className="mb-2 font-semibold">训练模板</h2><div className="space-y-2">{templates.map(template => <Card key={template.id} className="flex-row items-center gap-3 p-4"><Dumbbell className="size-5" /><button className="flex-1 text-left" onClick={() => setDraft(workoutFromTemplate(template, now.date, now.time))}><span className="block font-medium">{template.name}</span><span className="text-xs text-muted-foreground">{template.description}</span></button></Card>)}</div></section>
      <Button variant="link" onClick={() => router.push("/templates")}>管理自定义模板</Button>
    </>}
    {draft && <WorkoutForm key={`${draft.source}-${draft.template_id || "blank"}`} initial={draft} onSubmit={save} busy={busy} submitLabel="保存训练" />}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </main></div>
}
