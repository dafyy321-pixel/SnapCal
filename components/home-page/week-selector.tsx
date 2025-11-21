"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, startOfWeek } from "date-fns"
import { cn } from "@/lib/utils"
import { memo } from "react"

interface WeekDay {
  day: string
  date: Date
  dateNum: number
  active: boolean
  hasLogs: boolean
  isFuture: boolean
}

interface WeekSelectorProps {
  selectedDate: Date
  currentWeekStart: Date
  onDateSelect: (date: Date) => void
  onPreviousWeek: () => void
  onNextWeek: () => void
  isCurrentWeek: boolean
}

export const WeekSelector = memo<WeekSelectorProps>(({
  selectedDate,
  currentWeekStart,
  onDateSelect,
  onPreviousWeek,
  onNextWeek,
  isCurrentWeek
}) => {
  // 使用 useMemo 优化日期计算
  const weekDays = getWeekDays(selectedDate, currentWeekStart)

  return (
    <div className="flex items-center justify-center gap-3">
      {/* 上一周按钮 */}
      <button
        onClick={onPreviousWeek}
        className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-muted/50 flex items-center justify-center touch-feedback"
        aria-label="上一周"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* 中间日期列表，宽度根据内容自适应，整体与箭头一起居中 */}
      <div className="flex items-center justify-between gap-2">
        {weekDays.map((item, index) => (
          <button
            key={index}
            onClick={() => !item.isFuture && onDateSelect(item.date)}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 relative transition-all",
              item.active && "text-success",
              item.isFuture && "opacity-40",
              !item.isFuture && "hover:scale-105 active:scale-95",
            )}
            disabled={item.isFuture}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors",
                item.active
                  ? "border-success bg-success/10"
                  : item.hasLogs && !item.isFuture
                    ? "border-muted-foreground/30 border-solid"
                    : "border-dashed border-muted-foreground/30",
              )}
            >
              {item.day}
            </div>
            <span className="text-xs font-medium">{item.dateNum}</span>
            {item.hasLogs && !item.active && !item.isFuture && (
              <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-success" />
            )}
          </button>
        ))}
      </div>

      {/* 下一周按钮 */}
      <button
        onClick={onNextWeek}
        disabled={isCurrentWeek}
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center touch-feedback",
          isCurrentWeek
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-muted/50"
        )}
        aria-label="下一周"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
})

WeekSelector.displayName = "WeekSelector"

// 提取日期计算函数
function getWeekDays(selectedDate: Date, currentWeekStart: Date): WeekDay[] {
  const today = new Date()
  const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 })
  const days = []
  const dayNames = ["一", "二", "三", "四", "五", "六", "日"]

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i)
    const isFuture = date > today
    const isActive = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")

    days.push({
      day: dayNames[i],
      date: date,
      dateNum: date.getDate(),
      active: isActive,
      hasLogs: !isFuture, // 未来日期没有记录
      isFuture: isFuture,
    })
  }

  return days
}