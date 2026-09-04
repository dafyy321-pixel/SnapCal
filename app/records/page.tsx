"use client"

import { useEffect, useState } from "react"
import { Activity, ClipboardCheck, Ruler, Utensils } from "lucide-react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { FabButton } from "@/components/fab-button"
import { Card } from "@/components/ui/card"
import { requestData } from "@/lib/api-services"

type TimelineItem = { id: string; type: "meal" | "workout" | "checkin" | "body_metric"; date: string; time: string; title: string; detail: string; href: string }
const filters = [["all", "全部"], ["meal", "饮食"], ["workout", "训练"], ["checkin", "状态"], ["body_metric", "身体"]] as const
const icons = { meal: Utensils, workout: Activity, checkin: ClipboardCheck, body_metric: Ruler }

export default function RecordsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<(typeof filters)[number][0]>("all")
  const [items, setItems] = useState<TimelineItem[]>([])
  const [error, setError] = useState("")
  useEffect(() => {
    const query = filter === "all" ? "" : `?type=${filter}`
    requestData<{ items: TimelineItem[] }>(`/api/records${query}`).then(data => setItems(data.items)).catch(cause => setError(cause instanceof Error ? cause.message : "加载失败"))
  }, [filter])
  return <div className="min-h-screen bg-muted/30 pb-28"><header className="border-b bg-background px-4 pb-4 pt-10"><div className="mx-auto max-w-md"><h1 className="text-2xl font-bold">记录</h1><p className="text-sm text-muted-foreground">最近 30 天的饮食、训练与身体状态</p></div></header><main className="mx-auto max-w-md space-y-4 p-4"><div className="flex gap-2 overflow-x-auto pb-1">{filters.map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${filter === key ? "bg-primary text-primary-foreground" : "bg-card"}`}>{label}</button>)}</div>{items.length === 0 && !error && <Card className="p-6 text-center text-sm text-muted-foreground">暂无记录，点击右下角开始添加</Card>}{items.map((item, index) => { const Icon = icons[item.type]; const showDate = item.date !== items[index - 1]?.date; return <div key={`${item.type}-${item.id}`}>{showDate && <h2 className="mb-2 mt-4 text-sm font-semibold text-muted-foreground">{item.date}</h2>}<button className="w-full text-left" onClick={() => router.push(item.href)}><Card className="mb-2 flex-row items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-full bg-primary/10"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.detail}</span></span><span className="text-xs text-muted-foreground">{item.time.slice(0, 5)}</span></Card></button></div>})}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</main><FabButton /><BottomNav /></div>
}
