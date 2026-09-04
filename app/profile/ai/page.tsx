"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Bot, CheckCircle2, ShieldCheck, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { profileService, requestData } from "@/lib/api-services"

interface AiStatus {
  configured: boolean
  provider: string
  models: { vision: string | null; text: string | null }
  capabilities: { vision: boolean; text: boolean }
  consented: boolean
}

export default function AiSettingsPage() {
  const router = useRouter()
  const [status, setStatus] = useState<AiStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setStatus(await requestData<AiStatus>("/api/ai/status"))
    } catch (error) {
      setError(error instanceof Error ? error.message : "加载失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const request = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(request)
  }, [load])

  async function setConsent(consented: boolean) {
    setSaving(true)
    setError("")
    try {
      await profileService.updateProfile({ ai_consent_at: consented ? new Date().toISOString() : null })
      await load()
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  return <div className="min-h-screen bg-background">
    <main className="mx-auto max-w-md space-y-5 px-4 py-6">
      <header className="flex items-center gap-3"><Button aria-label="返回" variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft /></Button><div><h1 className="text-xl font-bold">AI 设置</h1><p className="text-xs text-muted-foreground">OpenAI Chat Completions 兼容接口</p></div></header>
      {error && <Card className="p-4 text-sm text-destructive">{error}</Card>}
      {loading || !status ? <Card className="p-8 text-center text-muted-foreground">加载中…</Card> : <>
        <Card className="p-5"><div className="flex items-center gap-3">{status.configured ? <CheckCircle2 className="size-6 text-green-600" /> : <XCircle className="size-6 text-muted-foreground" />}<div><h2 className="font-semibold">{status.configured ? "接口已配置" : "接口未配置"}</h2><p className="text-xs text-muted-foreground">服务商：{status.provider}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-muted/50 p-3"><span className="text-xs text-muted-foreground">视觉模型</span><p className="mt-1 break-all">{status.models.vision || "未设置"}</p></div><div className="rounded-xl bg-muted/50 p-3"><span className="text-xs text-muted-foreground">文本模型</span><p className="mt-1 break-all">{status.models.text || "未设置"}</p></div></div><p className="mt-3 text-xs text-muted-foreground">接口地址、模型和密钥均从服务端环境变量读取；密钥不会发送到浏览器或写入数据库。</p></Card>

        <Card className="p-5"><h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-5 text-primary" />发送哪些数据</h2><p className="mt-3 text-sm">只有在你主动使用相关功能且同意后，才会发送完成当前任务所需的最少信息：</p><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground"><li>你主动提交的当前图片</li><li>相关日期的营养汇总和最近七天训练聚合</li><li>当前状态分值、已确认的器械和饮食限制</li></ul><p className="mt-4 text-sm">不会发送姓名、生日、头像路径、完整数据库、无关历史、自由文本备注、本地路径或 API Key。</p></Card>

        <Card className="p-5"><div className="flex items-start gap-3"><Bot className="mt-0.5 size-5 text-primary" /><div className="flex-1"><h2 className="font-semibold">外部 AI 数据处理同意</h2><p className="mt-2 text-sm text-muted-foreground">撤回后，服务端立即停止外部 AI 请求。本地记录、统计、行动规则和已有数据仍可使用。</p><Button className="mt-4 w-full" disabled={saving || (!status.configured && !status.consented)} variant={status.consented ? "destructive" : "default"} onClick={() => void setConsent(!status.consented)}>{saving ? "保存中…" : status.consented ? "撤回同意" : "我已了解并同意"}</Button>{!status.configured && <p className="mt-2 text-center text-xs text-muted-foreground">请先在服务端配置接口和模型。</p>}</div></div></Card>
      </>}
    </main>
  </div>
}
