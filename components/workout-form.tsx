"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { renumberExercises } from "@/lib/workout-ui"
import type { WorkoutInput, WorkoutSetInput, WorkoutType } from "@/lib/wellness-types"

const types: Array<[WorkoutType, string]> = [["strength", "力量"], ["cardio", "有氧"], ["mobility", "拉伸活动"], ["sports", "运动"], ["other", "其他"]]
const numberValue = (value: string) => value === "" ? null : Number(value)

export function WorkoutForm({ initial, onSubmit, submitLabel = "保存训练", busy = false }: {
  initial: WorkoutInput
  onSubmit: (value: WorkoutInput) => Promise<void>
  submitLabel?: string
  busy?: boolean
}) {
  const [value, setValue] = useState(() => ({ ...initial, exercises: initial.exercises.map(exercise => ({ ...exercise, editId: crypto.randomUUID() })) }))
  const [error, setError] = useState("")
  const updateSet = (exerciseIndex: number, setIndex: number, patch: Partial<WorkoutSetInput>) => {
    setValue(previous => ({
      ...previous,
      exercises: previous.exercises.map((exercise, index) => index === exerciseIndex ? {
        ...exercise,
        sets: exercise.sets.map((set, index) => index === setIndex ? { ...set, ...patch } : set),
      } : exercise),
    }))
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    try { await onSubmit({ ...value, exercises: renumberExercises(value.exercises.map(({ editId, ...exercise }) => { void editId; return exercise })) }) } catch (cause) { setError(cause instanceof Error ? cause.message : "保存失败") }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Card className="gap-4 p-4">
        <label className="space-y-1 text-sm font-medium">训练名称<Input required maxLength={100} value={value.title} onChange={event => setValue({ ...value, title: event.target.value })} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm font-medium">日期<Input required type="date" value={value.session_date} onChange={event => setValue({ ...value, session_date: event.target.value })} /></label>
          <label className="space-y-1 text-sm font-medium">时间<Input required type="time" value={value.session_time.slice(0, 5)} onChange={event => setValue({ ...value, session_time: `${event.target.value}:00` })} /></label>
          <label className="space-y-1 text-sm font-medium">类型<select className="h-9 w-full rounded-md border bg-background px-3" value={value.workout_type} onChange={event => setValue({ ...value, workout_type: event.target.value as WorkoutType })}>{types.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="space-y-1 text-sm font-medium">状态<select className="h-9 w-full rounded-md border bg-background px-3" value={value.status} onChange={event => setValue({ ...value, status: event.target.value as WorkoutInput["status"] })}><option value="completed">已完成</option><option value="planned">计划中</option><option value="in_progress">进行中</option><option value="skipped">已跳过</option></select></label>
          <label className="space-y-1 text-sm font-medium">时长（分钟）<Input type="number" min="0" max="1440" value={value.duration_minutes ?? ""} onChange={event => setValue({ ...value, duration_minutes: numberValue(event.target.value) })} /></label>
          <label className="space-y-1 text-sm font-medium">主观强度 RPE<Input type="number" min="1" max="10" step="0.5" value={value.perceived_effort ?? ""} onChange={event => setValue({ ...value, perceived_effort: numberValue(event.target.value) })} /></label>
        </div>
        <label className="space-y-1 text-sm font-medium">备注（可选）<Textarea maxLength={1000} value={value.notes ?? ""} onChange={event => setValue({ ...value, notes: event.target.value || null })} /></label>
      </Card>

      {value.exercises.map((exercise, exerciseIndex) => (
        <Card key={exercise.editId} className="gap-3 p-4">
          <div className="flex items-center gap-2">
            <Input aria-label={`动作 ${exerciseIndex + 1} 名称`} required value={exercise.name} onChange={event => setValue(previous => ({ ...previous, exercises: previous.exercises.map((item, index) => index === exerciseIndex ? { ...item, name: event.target.value } : item) }))} />
            <Button type="button" size="icon" variant="ghost" aria-label="上移动作" disabled={exerciseIndex === 0} onClick={() => setValue(previous => { const next = [...previous.exercises]; [next[exerciseIndex - 1], next[exerciseIndex]] = [next[exerciseIndex], next[exerciseIndex - 1]]; return { ...previous, exercises: next } })}><ArrowUp /></Button>
            <Button type="button" size="icon" variant="ghost" aria-label="下移动作" disabled={exerciseIndex === value.exercises.length - 1} onClick={() => setValue(previous => { const next = [...previous.exercises]; [next[exerciseIndex], next[exerciseIndex + 1]] = [next[exerciseIndex + 1], next[exerciseIndex]]; return { ...previous, exercises: next } })}><ArrowDown /></Button>
            <Button type="button" size="icon" variant="ghost" aria-label="删除动作" onClick={() => setValue(previous => ({ ...previous, exercises: previous.exercises.filter((_, index) => index !== exerciseIndex) }))}><Trash2 /></Button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[560px] space-y-2">
              <div className="grid grid-cols-[36px_repeat(5,1fr)_40px] gap-2 text-xs text-muted-foreground"><span>完成</span><span>次数</span><span>重量 kg</span><span>时长 秒</span><span>距离 m</span><span>RPE</span><span /></div>
              {exercise.sets.map((set, setIndex) => <div key={setIndex} className="grid grid-cols-[36px_repeat(5,1fr)_40px] items-center gap-2">
                <input aria-label={`${exercise.name} 第 ${setIndex + 1} 组完成`} type="checkbox" checked={set.completed} onChange={event => updateSet(exerciseIndex, setIndex, { completed: event.target.checked })} className="size-5" />
                {(["reps", "weight_kg", "duration_seconds", "distance_meters", "rpe"] as const).map(field => <Input key={field} aria-label={`${exercise.name} 第 ${setIndex + 1} 组 ${field}`} type="number" min="0" step={field === "weight_kg" || field === "rpe" ? "0.5" : "1"} value={set[field] ?? ""} onChange={event => updateSet(exerciseIndex, setIndex, { [field]: numberValue(event.target.value) })} />)}
                <Button type="button" variant="ghost" size="icon" aria-label="删除组" onClick={() => setValue(previous => ({ ...previous, exercises: previous.exercises.map((item, index) => index === exerciseIndex ? { ...item, sets: item.sets.filter((_, index) => index !== setIndex) } : item) }))}><Trash2 /></Button>
              </div>)}
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => setValue(previous => ({ ...previous, exercises: previous.exercises.map((item, index) => index === exerciseIndex ? { ...item, sets: [...item.sets, { set_index: item.sets.length, set_type: "working", reps: null, weight_kg: null, duration_seconds: null, distance_meters: null, rpe: null, completed: false }] } : item) }))}><Plus />添加一组</Button>
        </Card>
      ))}
      <Button type="button" variant="outline" className="w-full" onClick={() => setValue(previous => ({ ...previous, exercises: [...previous.exercises, { editId: crypto.randomUUID(), order_index: previous.exercises.length, name: "新动作", category: previous.workout_type, muscle_group: null, notes: null, sets: [{ set_index: 0, set_type: "working", reps: null, weight_kg: null, duration_seconds: null, distance_meters: null, rpe: null, completed: false }] }] }))}><Plus />添加动作</Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy} className="h-12 w-full">{busy ? "保存中…" : submitLabel}</Button>
    </form>
  )
}
