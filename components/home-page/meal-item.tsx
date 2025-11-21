"use client"

import { Flame, Drumstick, Wheat, Droplet, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { FoodImage } from "@/components/optimized-image"
import { cn } from "@/lib/utils"
import { memo, useCallback } from "react"

interface MealItem {
  id: string
  name: string
  time: string
  calories: number
  protein: number
  carbs: number
  fats: number
  image: string
}

interface MealItemProps {
  meal: MealItem
  onDelete: (mealId: string, e: React.MouseEvent) => void
  onItemClick: (mealId: string) => void
}

export const MealItem = memo<MealItemProps>(({ meal, onDelete, onItemClick }) => {
  // 使用 useCallback 防止不必要的重渲染
  const handleDelete = useCallback((e: React.MouseEvent) => {
    onDelete(meal.id, e)
  }, [onDelete, meal.id])

  const handleClick = useCallback(() => {
    onItemClick(meal.id)
  }, [onItemClick, meal.id])

  return (
    <Card
      className="p-4 shadow-sm cursor-pointer hover:shadow-md transition-all touch-feedback relative group hover-lift meal-enter"
      onClick={handleClick}
    >
      {/* 删除按钮 - 桌面端悬停显示，移动端始终显示 */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-feedback"
        aria-label="删除"
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </button>

      <div className="flex gap-4">
        <FoodImage
          src={meal.image || "/placeholder.svg"}
          alt={meal.name}
          width={80}
          height={80}
          foodName={meal.name}
          className="rounded-lg object-cover"
          containerClassName="w-20 h-20 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2 pr-6">
            <h3 className="font-semibold text-sm truncate">{meal.name}</h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{meal.time}</span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="font-semibold">{meal.calories} 卡路里</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Drumstick className="w-3.5 h-3.5 text-protein" />
              <span>{meal.protein}g</span>
            </div>
            <div className="flex items-center gap-1">
              <Wheat className="w-3.5 h-3.5 text-carbs" />
              <span>{meal.carbs}g</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 text-fats" />
              <span>{meal.fats}g</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
})

MealItem.displayName = "MealItem"