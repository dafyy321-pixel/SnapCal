import { NextRequest } from "next/server"
import { z } from "zod"
import { parseInput } from "@/lib/api-validation"
import { formatLocalDate, localDateParts, parseLocalDate } from "@/lib/date-utils"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { localDb } from "@/lib/local-db"
import { wellnessDb } from "@/lib/wellness-db"
import { dateSchema } from "@/lib/validation-schemas"

export const runtime = "nodejs"
const querySchema = z.object({
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
  type: z.enum(["meal", "workout", "checkin", "body_metric"]).optional(),
}).strict()

function daysBefore(date: string, amount: number) {
  const value = parseLocalDate(date)
  value.setDate(value.getDate() - amount)
  return formatLocalDate(value)
}

export async function GET(request: NextRequest) {
  try {
    const query = parseInput(querySchema, Object.fromEntries(request.nextUrl.searchParams))
    const endDate = query.end_date || localDateParts().date
    const startDate = query.start_date || daysBefore(endDate, 29)
    const items = [
      ...localDb.listMeals({ startDate, endDate }).meals.map(meal => ({ id: meal.id, type: "meal" as const, date: meal.meal_date, time: meal.meal_time, title: meal.meal_name, detail: `${Math.round(meal.calories)} kcal · 蛋白质 ${Math.round(meal.protein)}g`, href: `/meal/${meal.id}` })),
      ...wellnessDb.listWorkouts({ startDate, endDate }).map(workout => ({ id: workout.id, type: "workout" as const, date: workout.session_date, time: workout.session_time, title: workout.title, detail: `${workout.duration_minutes || 0} 分钟 · ${workout.status === "completed" ? "已完成" : workout.status === "planned" ? "计划中" : workout.status === "skipped" ? "已跳过" : "进行中"}`, href: `/workouts/${workout.id}` })),
      ...wellnessDb.listCheckins(startDate, endDate).map(item => ({ id: item.checkin_date, type: "checkin" as const, date: item.checkin_date, time: "23:58:00", title: "每日状态", detail: `精力 ${item.energy} · 饥饿 ${item.hunger} · 酸痛 ${item.soreness}`, href: `/check-in?date=${item.checkin_date}` })),
      ...wellnessDb.listBodyMetrics(startDate, endDate).map(item => ({ id: item.metric_date, type: "body_metric" as const, date: item.metric_date, time: "23:57:00", title: "身体指标", detail: [item.weight_kg == null ? null : `${item.weight_kg} kg`, item.waist_cm == null ? null : `腰围 ${item.waist_cm} cm`, item.body_fat_percent == null ? null : `体脂 ${item.body_fat_percent}%`].filter(Boolean).join(" · "), href: `/body-metrics?date=${item.metric_date}` })),
    ].filter(item => !query.type || item.type === query.type).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    return successResponse({ range: { start_date: startDate, end_date: endDate }, items })
  } catch (error) {
    return errorResponse(error)
  }
}
