"use client"

import { ArrowDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { memo } from "react"

interface EmptyStateProps {
  title?: string
  description?: string
}

export const EmptyState = memo<EmptyStateProps>(({
  title = "开始记录饮食",
  description = "今天还未记录餐食，点击下方相机开始您的健康饮食之旅！"
}) => {
  return (
    <Card className="p-8 shadow-sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-32 h-32 rounded-full gradient-border flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-50/30 to-orange-50/30 flex items-center justify-center">
            <div className="text-4xl">🍽️</div>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ArrowDown className="w-5 h-5 text-muted-foreground/60 animate-bounce" />
      </div>
    </Card>
  )
})

EmptyState.displayName = "EmptyState"