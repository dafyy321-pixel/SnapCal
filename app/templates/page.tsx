"use client"

import { useEffect, useState } from "react"
import { Copy, Pencil, Plus, Trash2 } from "lucide-react"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { requestData } from "@/lib/api-services"
import type { WorkoutTemplateRecord, WorkoutType } from "@/lib/wellness-types"

type Draft = Pick<WorkoutTemplateRecord, "name" | "workout_type" | "description" | "exercises"> & { id?: string }
const blank = (): Draft => ({ name: "我的训练模板", workout_type: "strength", description: "", exercises: [{ order_index: 0, name: "新动作", category: "strength", sets: [{ set_index: 0, set_type: "working", reps: 10, weight_kg: null, duration_seconds: null, distance_meters: null, rpe: null, completed: false }] }] })

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<WorkoutTemplateRecord[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState("")
  const load = () => requestData<{ templates: WorkoutTemplateRecord[] }>("/api/workout-templates").then(data => setTemplates(data.templates)).catch(cause => setError(cause instanceof Error ? cause.message : "加载失败"))
  useEffect(() => { void load() }, [])
  const save = async () => {
    if (!draft) return
    const url = draft.id ? `/api/workout-templates/${draft.id}` : "/api/workout-templates"
    const { id: _id, ...body } = draft; void _id
    await requestData(url, { method: draft.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
    setDraft(null); await load()
  }
  return <div className="min-h-screen bg-muted/30 pb-8"><MobilePageHeader title="训练模板" description="内置模板可复制，自定义模板可编辑" /><main className="mx-auto max-w-md space-y-4 p-4">
    <Button className="w-full" onClick={() => setDraft(blank())}><Plus />新建自定义模板</Button>
    {draft && <Card className="gap-3 p-4"><Input aria-label="模板名称" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /><select aria-label="模板类型" className="h-9 rounded-md border bg-background px-3" value={draft.workout_type} onChange={event => setDraft({ ...draft, workout_type: event.target.value as WorkoutType })}><option value="strength">力量</option><option value="cardio">有氧</option><option value="mobility">拉伸活动</option><option value="sports">运动</option><option value="other">其他</option></select><Textarea aria-label="模板说明" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} />
      {draft.exercises.map((exercise, index) => <div key={index} className="grid grid-cols-[1fr_72px_40px] gap-2"><Input aria-label={`动作 ${index + 1}`} value={exercise.name} onChange={event => setDraft({ ...draft, exercises: draft.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} /><Input aria-label={`${exercise.name} 建议组数`} type="number" min="1" max="20" value={exercise.sets.length} onChange={event => { const count = Math.max(1, Number(event.target.value)); setDraft({ ...draft, exercises: draft.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, sets: Array.from({ length: count }, (_, setIndex) => ({ ...(item.sets[setIndex] || item.sets[0]), set_index: setIndex })) } : item) }) }} /><Button size="icon" variant="ghost" aria-label="删除模板动作" onClick={() => setDraft({ ...draft, exercises: draft.exercises.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 /></Button></div>)}
      <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setDraft({ ...draft, exercises: [...draft.exercises, { order_index: draft.exercises.length, name: "新动作", category: draft.workout_type, sets: [{ set_index: 0, set_type: "working", reps: 10, weight_kg: null, duration_seconds: null, distance_meters: null, rpe: null, completed: false }] }] })}>添加动作</Button><Button onClick={save}>保存模板</Button></div>
    </Card>}
    <div className="space-y-2">{templates.map(template => <Card key={template.id} className="gap-3 p-4"><div><h2 className="font-medium">{template.name}</h2><p className="text-xs text-muted-foreground">{template.description} · {template.exercises.length} 个动作</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={async () => { await requestData(`/api/workout-templates/${template.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); await load() }}><Copy />复制</Button>{!template.is_builtin && <><Button size="sm" variant="outline" onClick={() => setDraft({ ...template })}><Pencil />编辑</Button><Button size="sm" variant="destructive" onClick={async () => { if (confirm("删除这个模板？")) { await requestData(`/api/workout-templates/${template.id}`, { method: "DELETE" }); await load() } }}><Trash2 />删除</Button></>}</div></Card>)}</div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </main></div>
}
