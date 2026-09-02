import { NextRequest } from "next/server"
import { parseInput } from "@/lib/api-validation"
import { formatLocalDate, localDateParts, parseLocalDate } from "@/lib/date-utils"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { localDb, type MealRecord } from "@/lib/local-db"
import { analyticsQuerySchema } from "@/lib/validation-schemas"

export const runtime = "nodejs"

type Timeframe = "本周" | "上周" | "本月"

export async function GET(request: NextRequest) {
  try {
    const { timeframe } = parseInput(
      analyticsQuerySchema,
      Object.fromEntries(request.nextUrl.searchParams)
    )
    const range = getDateRange(timeframe, parseLocalDate(localDateParts().date))
    const currentMeals = localDb.listMeals({ startDate: range.startDate, endDate: range.endDate }).meals
    const previousMeals = localDb.listMeals({ startDate: range.prevStartDate, endDate: range.prevEndDate }).meals
    return successResponse(calculateAnalytics(
      currentMeals,
      previousMeals,
      timeframe,
      localDb.getProfile().daily_calorie_goal,
      range
    ))
  } catch (error) {
    return errorResponse(error)
  }
}

export function getDateRange(timeframe: Timeframe, today: Date) {
  today = new Date(today)
  today.setHours(0, 0, 0, 0)
  let start: Date
  let end: Date
  let previousStart: Date
  let previousEnd: Date

  if (timeframe === "本月") {
    start = new Date(today.getFullYear(), today.getMonth(), 1)
    end = today
    previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    previousEnd = new Date(today.getFullYear(), today.getMonth(), 0)
  } else {
    const mondayOffset = today.getDay() === 0 ? 6 : today.getDay() - 1
    const thisMonday = new Date(today)
    thisMonday.setDate(today.getDate() - mondayOffset)
    if (timeframe === "本周") {
      start = thisMonday
      end = today
      previousStart = new Date(thisMonday)
      previousStart.setDate(thisMonday.getDate() - 7)
      previousEnd = new Date(thisMonday)
      previousEnd.setDate(thisMonday.getDate() - 1)
    } else {
      start = new Date(thisMonday)
      start.setDate(thisMonday.getDate() - 7)
      end = new Date(thisMonday)
      end.setDate(thisMonday.getDate() - 1)
      previousStart = new Date(start)
      previousStart.setDate(start.getDate() - 7)
      previousEnd = new Date(start)
      previousEnd.setDate(start.getDate() - 1)
    }
  }

  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end),
    prevStartDate: formatLocalDate(previousStart),
    prevEndDate: formatLocalDate(previousEnd),
  }
}

function averagePerDay(meals: MealRecord[], startDate: string, endDate: string) {
  const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 }
  for (const meal of meals) {
    totals.calories += meal.calories
    totals.protein += meal.protein
    totals.carbs += meal.carbs
    totals.fats += meal.fats
  }
  let dayCount = 0
  for (let cursor = parseLocalDate(startDate), end = parseLocalDate(endDate); cursor <= end; cursor.setDate(cursor.getDate() + 1)) dayCount += 1
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / dayCount])) as typeof totals
}

function trend(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function calculateAnalytics(
  currentMeals: MealRecord[],
  previousMeals: MealRecord[],
  timeframe: Timeframe,
  dailyCalorieGoal: number,
  range: ReturnType<typeof getDateRange>
) {
  const current = averagePerDay(currentMeals, range.startDate, range.endDate)
  const previous = averagePerDay(previousMeals, range.prevStartDate, range.prevEndDate)
  const byDate = new Map<string, { calories: number; protein: number; carbs: number; fats: number }>()
  for (const meal of currentMeals) {
    const total = byDate.get(meal.meal_date) || { calories: 0, protein: 0, carbs: 0, fats: 0 }
    total.calories += meal.calories
    total.protein += meal.protein
    total.carbs += meal.carbs
    total.fats += meal.fats
    byDate.set(meal.meal_date, total)
  }

  const dailyData = []
  for (let cursor = parseLocalDate(range.startDate), end = parseLocalDate(range.endDate); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = formatLocalDate(cursor)
    const values = byDate.get(date) || { calories: 0, protein: 0, carbs: 0, fats: 0 }
    dailyData.push({
      day: timeframe === "本月" ? `${cursor.getMonth() + 1}/${cursor.getDate()}` : ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][cursor.getDay()],
      date,
      ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Math.round(value)])),
    })
  }

  return {
    stats: {
      avgCalories: Math.round(current.calories),
      caloriesTrend: trend(current.calories, previous.calories),
      prevCalories: Math.round(previous.calories),
      avgProtein: Math.round(current.protein),
      proteinTrend: trend(current.protein, previous.protein),
      prevProtein: Math.round(previous.protein),
      avgCarbs: Math.round(current.carbs),
      carbsTrend: trend(current.carbs, previous.carbs),
      prevCarbs: Math.round(previous.carbs),
      avgFats: Math.round(current.fats),
      fatsTrend: trend(current.fats, previous.fats),
      prevFats: Math.round(previous.fats),
    },
    dailyData,
    dailyCalorieGoal,
    recordCount: currentMeals.length,
  }
}
