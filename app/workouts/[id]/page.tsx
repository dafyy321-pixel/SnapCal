"use client"

import { useEffect, useState } from "react"
import { Trash2, Utensils } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { WorkoutForm } from "@/components/workout-form"
import { Button } from "@/components/ui/button"
import { requestData } from "@/lib/api-services"
import { workoutInputFromRecord } from "@/lib/workout-ui"
import type { WorkoutInput, WorkoutRecord } from "@/lib/wellness-types"

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [workout, setWorkout] = useState<WorkoutRecord | null>(null)
  const [error, setError] = useState("")
  useEffect(() => { requestData<{ workout: WorkoutRecord }>(`/api/workouts/${id}`).then(data => setWorkout(data.workout)).catch(cause => setError(cause instanceof Error ? cause.message : "加载失败")) }, [id])
  const save = async (input: WorkoutInput) => {
    const data = await requestData<{ workout: WorkoutRecord }>(`/api/workouts/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) })
    setWorkout(data.workout)
  }
  const remove = async () => {
    if (!confirm("确定删除这次训练吗？")) return
    await requestData(`/api/workouts/${id}`, { method: "DELETE" })
    router.replace("/records")
  }
  if (error) return <div className="min-h-screen"><MobilePageHeader title="训练详情" /><p role="alert" className="p-6 text-center text-destructive">{error}</p></div>
  if (!workout) return <div className="min-h-screen"><MobilePageHeader title="训练详情" /><p className="p-6 text-center text-muted-foreground">加载中…</p></div>
  const initial = workoutInputFromRecord(workout)
  return <div className="min-h-screen bg-muted/30 pb-8"><MobilePageHeader title="训练详情" description={workout.session_date} /><main className="mx-auto max-w-md space-y-4 p-4"><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => router.push(`/scan?mode=inventory&context=post_workout&workout_id=${id}`)}><Utensils />训练后搭配</Button><Button variant="destructive" onClick={remove}><Trash2 />删除训练</Button></div><WorkoutForm key={workout.updated_at} initial={initial} onSubmit={save} submitLabel="更新训练" /></main></div>
}
