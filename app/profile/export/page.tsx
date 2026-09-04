"use client"

import { useState } from "react"
import { ArrowLeft, Database, Download, FileJson, Table2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { requestData } from "@/lib/api-services"

type Format = "json" | "csv"
type Range = "week" | "month" | "all"
type Category = "meals" | "workouts" | "checkins" | "body_metrics" | "experiments"
type ExportFile = { filename: string; mime: string; content: string; count: number }

const rangeLabels: Record<Range, string> = { week: "最近 7 天", month: "最近 30 天", all: "全部数据" }
const formatLabels: Record<Format, string> = { json: "JSON（完整备份）", csv: "CSV（分类表格）" }
const categoryLabels: Record<Category, string> = { meals: "餐食", workouts: "训练与组次", checkins: "每日状态", body_metrics: "身体指标", experiments: "周度尝试" }

export default function ExportPage() {
  const router = useRouter()
  const [format, setFormat] = useState<Format>("json")
  const [range, setRange] = useState<Range>("all")
  const [category, setCategory] = useState<Category>("meals")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function download() {
    setBusy(true)
    setError("")
    try {
      const params = new URLSearchParams({ format, range, category })
      const file = await requestData<ExportFile>(`/api/export?${params}`)
      const url = URL.createObjectURL(new Blob([file.content], { type: file.mime }))
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = file.filename
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setError(error instanceof Error ? error.message : "导出失败")
    } finally {
      setBusy(false)
    }
  }

  return <div className="min-h-screen bg-background pb-24">
    <main className="mx-auto max-w-md space-y-5 px-4 py-6">
      <header className="flex items-center gap-3"><Button aria-label="返回" variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft /></Button><div><h1 className="text-xl font-bold">数据导出</h1><p className="text-xs text-muted-foreground">文件在浏览器本地生成，不上传到第三方</p></div></header>
      {error && <Card className="p-4 text-sm text-destructive">{error}</Card>}
      <Card className="p-5"><div className="flex items-start gap-3"><Database className="mt-0.5 size-6 text-primary" /><div><h2 className="font-semibold">JSON 全量导出</h2><p className="mt-1 text-sm text-muted-foreground">包含资料、餐食、训练动作与组次、状态打卡、身体指标、行动卡和周度尝试；不包含 API Key。</p></div></div></Card>
      <Card className="space-y-5 p-5">
        <label className="block text-sm font-medium">时间范围<Select value={range} onValueChange={value => setRange(value as Range)}><SelectTrigger className="mt-2 w-full"><SelectValue>{rangeLabels[range]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="week">最近 7 天</SelectItem><SelectItem value="month">最近 30 天</SelectItem><SelectItem value="all">全部数据</SelectItem></SelectContent></Select></label>
        <label className="block text-sm font-medium">文件格式<Select value={format} onValueChange={value => setFormat(value as Format)}><SelectTrigger className="mt-2 w-full"><SelectValue>{formatLabels[format]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="json">JSON（完整备份）</SelectItem><SelectItem value="csv">CSV（分类表格）</SelectItem></SelectContent></Select></label>
        {format === "csv" && <label className="block text-sm font-medium">CSV 分类<Select value={category} onValueChange={value => setCategory(value as Category)}><SelectTrigger className="mt-2 w-full"><SelectValue>{categoryLabels[category]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="meals">餐食</SelectItem><SelectItem value="workouts">训练与组次</SelectItem><SelectItem value="checkins">每日状态</SelectItem><SelectItem value="body_metrics">身体指标</SelectItem><SelectItem value="experiments">周度尝试</SelectItem></SelectContent></Select></label>}
        <Button className="w-full" disabled={busy} onClick={() => void download()}>{format === "json" ? <FileJson /> : <Table2 />}{busy ? "正在生成…" : "下载导出文件"}<Download /></Button>
      </Card>
      <p className="text-xs text-muted-foreground">CSV 中以 =、+、-、@ 开头的内容会自动转义，避免被表格软件当作公式执行。完整迁移还可以在停止应用后备份整个 data 目录。</p>
    </main>
    <BottomNav />
  </div>
}
