"use client"

import { Flame } from "lucide-react"
import { Card } from "@/components/ui/card"
import { LoadingState } from "@/components/ui/loading-state"
import { cn } from "@/lib/utils"
import { memo } from "react"

interface CalorieCardProps {
  displayCalories: number
  targetCalories: number
  dailyGoal: number
  dataLoading: boolean
  currentEquivalent: number
  foodEquivalents: string[]
  onEquivalentClick: () => void
}

export const CalorieCard = memo<CalorieCardProps>(({
  displayCalories,
  targetCalories,
  dailyGoal,
  dataLoading,
  currentEquivalent,
  foodEquivalents,
  onEquivalentClick
}) => {
  const consumedCalories = dailyGoal - targetCalories
  const consumedPercentage = (consumedCalories / dailyGoal) * 100
  const isLowCalories = targetCalories < dailyGoal * 0.2
  const ringStrokeDashoffset = 251.2 - (251.2 * consumedPercentage) / 100

  if (dataLoading) {
    return (
      <Card className="p-6 shadow-sm">
        <LoadingState type="card" message="计算卡路里中..." />
      </Card>
    )
  }

  return (
    <Card className="p-6 shadow-sm hover-lift slide-up">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-5xl font-bold mb-1 tabular-nums stats-number">{displayCalories}</div>
          <div className="text-sm text-muted-foreground mb-1">剩余卡路里</div>
          <div className="text-xs text-muted-foreground/70 mb-1">目标: {dailyGoal} 大卡</div>
          <button
            onClick={onEquivalentClick}
            className="text-xs text-muted-foreground/70 hover:text-muted-foreground cursor-pointer text-left touch-feedback p-1 rounded"
          >
            约等于: {foodEquivalents[currentEquivalent]}
          </button>
        </div>
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90 progress-ring" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray="251.2"
              strokeDashoffset={ringStrokeDashoffset}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000 ease-out",
                isLowCalories ? "text-amber-500" : "text-foreground",
              )}
              style={{ transitionProperty: "stroke-dashoffset, stroke" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame className="w-8 h-8 text-amber-500 heartbeat" />
          </div>
        </div>
      </div>
    </Card>
  )
})

CalorieCard.displayName = "CalorieCard"