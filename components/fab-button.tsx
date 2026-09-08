"use client"

import { Activity, Camera, Plus, Ruler, Utensils } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function FabButton() {
  const router = useRouter()
  const actions = [
    { icon: Camera, label: "扫描餐食", path: "/scan" },
    { icon: Utensils, label: "手动添加餐食", path: "/meals/new" },
    { icon: Activity, label: "开始或补记训练", path: "/workouts/new" },
    { icon: Plus, label: "今日状态打卡", path: "/check-in" },
    { icon: Ruler, label: "记录身体指标", path: "/body-metrics" },
  ]
  return (
    <Sheet>
      <SheetTrigger asChild><Button aria-label="打开快捷记录" size="icon" className="absolute -top-5 left-1/2 size-[68px] -translate-x-1/2 rounded-full shadow-[0_6px_16px_#10202a24] dark:shadow-[0_6px_16px_#00000070]"><Plus className="size-[30px]" /></Button></SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SheetHeader><SheetTitle>快速记录</SheetTitle><SheetDescription>选择要添加的内容</SheetDescription></SheetHeader>
        <div className="grid gap-2 px-4 pb-4">{actions.map(({ icon: Icon, label, path }) => <SheetClose asChild key={path}><button type="button" onClick={() => router.push(path)} className="flex min-h-12 items-center gap-3 rounded-xl border bg-card px-4 text-left text-sm font-medium"><Icon className="size-5" />{label}</button></SheetClose>)}</div>
      </SheetContent>
    </Sheet>
  )
}
