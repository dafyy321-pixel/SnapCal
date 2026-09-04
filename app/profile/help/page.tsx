"use client"

import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Card } from "@/components/ui/card"

const questions = [
  ["数据保存在哪里？", "资料、餐食、训练、状态、身体指标和功能反馈保存在项目 data/snapcal.db 中，图片保存在 data/uploads 中。"],
  ["谁能访问数据？", "当前版本是本地单用户应用，只监听本机地址；能操作这台电脑的人可以查看本地数据。"],
  ["AI 分析需要网络吗？", "需要。配置 OpenAI 兼容接口并在“AI 设置”同意数据发送后，拍照识别才会请求外部服务。未配置时不会生成虚假营养结果，本地记录、统计和行动规则仍可使用。"],
  ["AI 会发送哪些数据？", "只发送当前任务需要的图片或聚合数值，以及已确认的器械和饮食限制。不会发送姓名、生日、头像路径、完整数据库、无关备注、本地路径或 API Key。撤回同意后会停止外部请求。"],
  ["AI 会替我改计划或抵扣热量吗？", "不会。AI 只能解释本地规则提供的候选动作，不能直接修改记录和训练计划；训练消耗不会抵扣饮食，也不会因为跳过训练建议少吃下一餐。"],
  ["如何备份？", "JSON 可导出核心结构化数据，但不包含图片文件。完整迁移前请停止应用，再复制整个 data 目录；恢复时也要先停止应用。"],
  ["CSV 可以导出什么？", "可以分别导出餐食、训练动作与组次、每日状态、身体指标或周度尝试。以 =、+、-、@ 开头的内容会自动转义。"],
  ["图片上传有什么限制？", "单张图片不能超过 5MB，支持 JPEG、PNG、WebP 和 GIF，服务端会检查文件内容与声明类型是否一致。"],
  ["这些建议是医疗建议吗？", "不是。SnapCal 只用于个人记录和一般性习惯观察，不提供疾病诊断、伤病判断、药物或补剂剂量。身体不适时请咨询合格专业人员。"],
] as const

export default function HelpPage() {
  const router = useRouter()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="pt-12 pb-6 px-6 border-b flex items-center justify-between"><button aria-label="返回" onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button><h1 className="text-lg font-semibold">帮助中心</h1><div className="w-10" /></header>
        <div className="p-6"><Card className="divide-y overflow-hidden">{questions.map(([question, answer], index) => <div key={question}><button onClick={() => setOpen(open === index ? null : index)} className="w-full p-4 flex items-center justify-between text-left font-medium">{question}{open === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>{open === index && <p className="px-4 pb-4 text-sm text-muted-foreground leading-6">{answer}</p>}</div>)}</Card></div>
      </div>
      <BottomNav />
    </div>
  )
}
