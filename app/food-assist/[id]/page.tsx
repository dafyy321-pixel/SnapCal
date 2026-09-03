"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Check, Save, Sparkles } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { requestData } from "@/lib/api-services"
import type { FoodAssistItem, FoodAssistRecord } from "@/lib/wellness-types"

type MealDraft = {
  meal_name: string
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  meal_date: string
  meal_time: string
  image_url: string
  ingredients: string[]
  confidence: number
  calories: number | null
  protein: number | null
  carbs: number | null
  fats: number | null
  requires_nutrition_confirmation: boolean
}

export default function FoodAssistPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<FoodAssistRecord | null>(null)
  const [items, setItems] = useState<FoodAssistItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [draft, setDraft] = useState<MealDraft | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    requestData<{ session: FoodAssistRecord }>(`/api/food-assist/${id}`).then(data => {
      setSession(data.session)
      const initial = data.session.confirmed_items.length ? data.session.confirmed_items : data.session.recognized_items
      setItems(initial); setSelected(initial.map(item => item.id))
    }).catch(cause => setError(cause instanceof Error ? cause.message : "加载失败"))
  }, [id])
  const confirmItems = async () => {
    const confirmedItems = items.filter(item => selected.includes(item.id))
    const data = await requestData<{ session: FoodAssistRecord }>(`/api/food-assist/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmed_items: confirmedItems }) })
    setSession(data.session)
  }
  const createDraft = async () => {
    const data = await requestData<{ draft: MealDraft }>(`/api/food-assist/${id}/meal-draft`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })
    setDraft(data.draft)
  }
  const saveMeal = async () => {
    if (!draft || [draft.calories, draft.protein, draft.carbs, draft.fats].some(value => value == null)) { setError("请先确认卡路里和三项宏量营养数据"); return }
    const meal = await requestData<{ meal: { id: string } }>("/api/meals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) })
    await requestData(`/api/food-assist/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "saved", meal_id: meal.meal.id }) })
    router.replace(`/meal/${meal.meal.id}`)
  }
  if (!session) return <div className="min-h-screen"><MobilePageHeader title="食物助手" /><p className="p-6 text-center text-muted-foreground">{error || "加载中…"}</p></div>
  return <div className="min-h-screen bg-muted/30 pb-8"><MobilePageHeader title="食物搭配助手" description="先确认识别结果，再决定是否记录" /><main className="mx-auto max-w-md space-y-4 p-4">
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black"><Image src={session.image_url} alt="待确认的食物" fill sizes="448px" className="object-contain" /></div>
    <Card className="gap-3 p-4"><div><h2 className="font-medium">确认可用食材</h2><p className="text-xs text-muted-foreground">可以取消、改名；照片无法确认精确克数。</p></div>{items.map((item, index) => <label key={item.id} className="grid grid-cols-[24px_1fr_auto] items-center gap-2 rounded-lg border p-2"><input type="checkbox" checked={selected.includes(item.id)} onChange={event => setSelected(previous => event.target.checked ? [...previous, item.id] : previous.filter(id => id !== item.id))} className="size-5" /><Input aria-label={`食材 ${index + 1} 名称`} value={item.name} onChange={event => setItems(previous => previous.map(current => current.id === item.id ? { ...current, name: event.target.value } : current))} /><span className="text-xs text-muted-foreground">{Math.round(item.confidence)}%</span></label>)}<Button onClick={confirmItems} disabled={!selected.length}><Check />确认并生成搭配</Button></Card>
    {session.primary_suggestion && <><Card className="gap-2 border-primary/30 p-4"><span className="text-xs font-medium text-primary">主方案</span><h2 className="font-semibold">{session.primary_suggestion.title}</h2><p className="text-sm text-muted-foreground">{session.primary_suggestion.rationale}</p>{session.primary_suggestion.cautions.map(item => <p key={item} className="text-xs text-amber-700">{item}</p>)}</Card><Card className="gap-2 p-4"><span className="text-xs text-muted-foreground">替代方案</span><h2 className="font-semibold">{session.alternative_suggestion?.title}</h2><p className="text-sm text-muted-foreground">{session.alternative_suggestion?.rationale}</p></Card><Button className="w-full" onClick={createDraft}><Sparkles />记录已吃</Button></>}
    {draft && <Card className="gap-4 p-4"><div><h2 className="font-semibold">确认餐食草稿</h2><p className="text-xs text-muted-foreground">营养值不会仅凭库存照片自动确定，请确认后保存。</p></div><Input aria-label="餐食名称" value={draft.meal_name} onChange={event => setDraft({ ...draft, meal_name: event.target.value })} /><div className="grid grid-cols-2 gap-3"><label className="text-sm">日期<Input type="date" value={draft.meal_date} onChange={event => setDraft({ ...draft, meal_date: event.target.value })} /></label><label className="text-sm">餐别<select className="h-9 w-full rounded-md border bg-background px-3" value={draft.meal_type} onChange={event => setDraft({ ...draft, meal_type: event.target.value as MealDraft["meal_type"] })}><option value="breakfast">早餐</option><option value="lunch">午餐</option><option value="dinner">晚餐</option><option value="snack">加餐</option></select></label>{(["calories", "protein", "carbs", "fats"] as const).map(key => <label key={key} className="text-sm">{{ calories: "卡路里 kcal", protein: "蛋白质 g", carbs: "碳水 g", fats: "脂肪 g" }[key]}<Input required type="number" min="0" step="0.1" value={draft[key] ?? ""} onChange={event => setDraft({ ...draft, [key]: event.target.value ? Number(event.target.value) : null })} /></label>)}</div><Button onClick={saveMeal}><Save />确认保存餐食</Button></Card>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </main></div>
}
