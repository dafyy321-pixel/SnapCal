"use client"

import { ArrowLeft, Database, Github, Sparkles } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function AboutPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="pt-12 pb-6 px-6 border-b flex items-center justify-between"><button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button><h1 className="text-lg font-semibold">关于 SnapCal</h1><div className="w-10" /></header>
        <div className="p-6 space-y-5">
          <Card className="p-6 text-center"><Image src="/logo.png" alt="SnapCal" width={80} height={80} className="mx-auto mb-3 object-contain" /><h2 className="text-2xl font-bold">SnapCal</h2><p className="text-sm text-muted-foreground mt-2">饮食、训练与状态放在一起的本地健康助手</p></Card>
          <Card className="p-5 flex gap-3"><Database className="w-6 h-6 text-primary shrink-0" /><div><h3 className="font-semibold">本地优先</h3><p className="text-sm text-muted-foreground mt-1">使用 SQLite 在本机保存饮食、训练、状态和身体指标，不需要用户账号或云同步。能访问本机服务的人也能读取数据，请勿直接暴露到公网。</p></div></Card>
          <Card className="p-5 flex gap-3"><Sparkles className="w-6 h-6 text-primary shrink-0" /><div><h3 className="font-semibold">受约束的可选 AI</h3><p className="text-sm text-muted-foreground mt-1">兼容 OpenAI Chat Completions 风格接口。只有用户同意后才发送当前任务所需的最少数据；无配置时不会伪造识别结果，本地核心功能仍可使用。</p></div></Card>
          <Card className="p-5 text-sm text-muted-foreground">SnapCal 不提供疾病诊断、伤病判断、药物或补剂剂量。行动建议不把运动与饮食互相抵扣，观察性洞察也不代表因果关系。</Card>
          <Button variant="outline" className="w-full" onClick={() => window.open("https://github.com/dafyy321-pixel/SnapCal", "_blank", "noopener,noreferrer")}><Github className="w-4 h-4 mr-2" />查看 GitHub 仓库</Button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
