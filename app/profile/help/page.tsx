"use client"

import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Card } from "@/components/ui/card"

const questions = [
  ["数据保存在哪里？", "餐食、资料和分析结果保存在项目 data/snapcal.db 中，图片保存在 data/uploads 中。"],
  ["谁能访问数据？", "当前版本是本地单用户应用，只监听本机地址；能操作这台电脑的人可以查看本地数据。"],
  ["AI 分析需要网络吗？", "配置 DOUBAO_API_KEY 时会请求豆包 API；未配置时自动使用本地演示结果，便于开发和测试。"],
  ["如何备份？", "可在个人中心的“数据导出”下载 JSON 或 CSV。完整迁移时，请同时备份 data 目录。"],
  ["图片上传有什么限制？", "单张图片不能超过 5MB，支持 JPEG、PNG、WebP 和 GIF，服务端会检查文件内容与声明类型是否一致。"],
] as const

export default function HelpPage() {
  const router = useRouter()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="pt-12 pb-6 px-6 border-b flex items-center justify-between"><button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button><h1 className="text-lg font-semibold">帮助中心</h1><div className="w-10" /></header>
        <div className="p-6"><Card className="divide-y overflow-hidden">{questions.map(([question, answer], index) => <div key={question}><button onClick={() => setOpen(open === index ? null : index)} className="w-full p-4 flex items-center justify-between text-left font-medium">{question}{open === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>{open === index && <p className="px-4 pb-4 text-sm text-muted-foreground leading-6">{answer}</p>}</div>)}</Card></div>
      </div>
      <BottomNav />
    </div>
  )
}
