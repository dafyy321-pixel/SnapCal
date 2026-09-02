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
          <Card className="p-6 text-center"><Image src="/logo.png" alt="SnapCal" width={80} height={80} className="mx-auto mb-3 object-contain" /><h2 className="text-2xl font-bold">SnapCal</h2><p className="text-sm text-muted-foreground mt-2">本地优先的食物营养记录工具</p></Card>
          <Card className="p-5 flex gap-3"><Database className="w-6 h-6 text-primary shrink-0" /><div><h3 className="font-semibold">本地数据</h3><p className="text-sm text-muted-foreground mt-1">使用 SQLite 在本机保存餐食和资料，不需要用户账号。</p></div></Card>
          <Card className="p-5 flex gap-3"><Sparkles className="w-6 h-6 text-primary shrink-0" /><div><h3 className="font-semibold">AI 识别</h3><p className="text-sm text-muted-foreground mt-1">可选接入豆包 API；未配置密钥时使用本地演示模式。AI 结果只供参考，不构成医疗建议。</p></div></Card>
          <Button variant="outline" className="w-full" onClick={() => window.open("https://github.com/dafyy321-pixel/SnapCal", "_blank", "noopener,noreferrer")}><Github className="w-4 h-4 mr-2" />查看 GitHub 仓库</Button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
