"use client"

import { Drumstick, Wheat, Droplet, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { StatsSkeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { memo } from "react"

interface Macro {
  name: string
  value: number
  goal: number
  status: "剩余" | "超过"
  progress: number
  icon: any
  baseColor: string
  ringColor: string
}

interface MacronutrientCardsProps {
  macros: Macro[]
  dataLoading: boolean
}

export const MacronutrientCards = memo<MacronutrientCardsProps>(({ macros, dataLoading }) => {
  if (dataLoading) {
    return <StatsSkeleton cards={3} animate={true} />
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {macros.map((macro, index) => {
        const Icon = macro.icon
        const animationClass =
          index === 0 ? 'protein-enter' :
          index === 1 ? 'carbs-enter' : 'fats-enter'

        return (
          <MacroCard
            key={index}
            macro={macro}
            Icon={Icon}
            animationClass={animationClass}
          />
        )
      })}
    </div>
  )
})

MacronutrientCards.displayName = "MacronutrientCards"

// 单独的营养卡片组件
interface MacroCardProps {
  macro: Macro
  Icon: any
  animationClass?: string
}

const MacroCard = memo<MacroCardProps>(({ macro, Icon, animationClass }) => (
  <Card className={cn("p-4 shadow-sm relative hover-lift", animationClass)}>
    {macro.status === "超过" && (
      <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
        <AlertCircle className="w-3.5 h-3.5 text-white fill-white" />
      </div>
    )}

    <div className={cn("text-2xl font-bold mb-1 transition-colors duration-300", macro.baseColor)}>
      {macro.value}g
    </div>
    <div className="text-xs text-muted-foreground mb-3">
      {macro.name} {macro.status}
    </div>
    <div className="relative w-16 h-16 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/20"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeDasharray="251.2"
          strokeDashoffset={251.2 - (251.2 * macro.progress) / 100}
          strokeLinecap="round"
          className={cn(macro.ringColor, "transition-all duration-700 ease-out")}
          style={{ transitionProperty: "stroke-dashoffset, stroke" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className={cn("w-5 h-5 transition-colors duration-300", macro.baseColor)} />
      </div>
    </div>
  </Card>
))

MacroCard.displayName = "MacroCard"