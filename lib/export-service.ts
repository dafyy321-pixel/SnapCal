import { formatLocalDate, localDateParts, parseLocalDate } from "./date-utils"
import { localDb } from "./local-db"
import { wellnessDb } from "./wellness-db"

export type ExportRange = "week" | "month" | "all"
export type CsvCategory = "meals" | "workouts" | "checkins" | "body_metrics" | "experiments"

export function csvCell(value: unknown): string {
  const text = String(value ?? "")
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

function dateRange(range: ExportRange) {
  if (range === "all") return { startDate: "0001-01-01", endDate: "9999-12-31" }
  const endDate = localDateParts().date
  const start = parseLocalDate(endDate)
  start.setDate(start.getDate() - (range === "week" ? 6 : 29))
  return { startDate: formatLocalDate(start), endDate }
}

export function buildExportBundle(range: ExportRange) {
  const { startDate, endDate } = dateRange(range)
  return {
    schema_version: 1,
    exported_at: new Date().toISOString(),
    range: { start_date: startDate, end_date: endDate },
    profile: localDb.getProfile(),
    meals: localDb.listMeals({ startDate, endDate, sortBy: "meal_date", sortOrder: "asc" }).meals,
    workouts: wellnessDb.listWorkouts({ startDate, endDate }),
    checkins: wellnessDb.listCheckins(startDate, endDate),
    body_metrics: wellnessDb.listBodyMetrics(startDate, endDate),
    action_cards: wellnessDb.listActions(startDate, endDate),
    experiments: wellnessDb.listExperiments().filter(item => item.start_date >= startDate && item.start_date <= endDate),
  }
}

function table(headers: string[], rows: unknown[][]) {
  return "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n")
}

export function buildCategoryCsv(bundle: ReturnType<typeof buildExportBundle>, category: CsvCategory) {
  if (category === "meals") return table(
    ["日期", "时间", "餐次", "食物", "卡路里", "蛋白质(g)", "碳水(g)", "脂肪(g)"],
    bundle.meals.map(item => [item.meal_date, item.meal_time, item.meal_type, item.meal_name, item.calories, item.protein, item.carbs, item.fats]),
  )
  if (category === "workouts") return table(
    ["日期", "时间", "训练", "类型", "状态", "时长(分钟)", "主观强度", "动作", "组序", "组类型", "次数", "重量(kg)", "时长(秒)", "距离(m)", "RPE", "完成"],
    bundle.workouts.flatMap(workout => workout.exercises.length ? workout.exercises.flatMap(exercise => exercise.sets.length ? exercise.sets.map(set => [workout.session_date, workout.session_time, workout.title, workout.workout_type, workout.status, workout.duration_minutes, workout.perceived_effort, exercise.name, set.set_index, set.set_type, set.reps, set.weight_kg, set.duration_seconds, set.distance_meters, set.rpe, set.completed]) : [[workout.session_date, workout.session_time, workout.title, workout.workout_type, workout.status, workout.duration_minutes, workout.perceived_effort, exercise.name]]) : [[workout.session_date, workout.session_time, workout.title, workout.workout_type, workout.status, workout.duration_minutes, workout.perceived_effort]]),
  )
  if (category === "checkins") return table(
    ["日期", "精力", "饥饿", "酸痛", "睡眠时长", "睡眠质量", "备注"],
    bundle.checkins.map(item => [item.checkin_date, item.energy, item.hunger, item.soreness, item.sleep_hours, item.sleep_quality, item.notes]),
  )
  if (category === "body_metrics") return table(
    ["日期", "体重(kg)", "腰围(cm)", "体脂率(%)", "备注"],
    bundle.body_metrics.map(item => [item.metric_date, item.weight_kg, item.waist_cm, item.body_fat_percent, item.notes]),
  )
  return table(
    ["开始日期", "结束日期", "标题", "变量", "执行说明", "观察假设", "状态", "接受时间"],
    bundle.experiments.map(item => [item.start_date, item.end_date, item.title, item.variable_key, item.instruction, item.hypothesis, item.status, item.accepted_at]),
  )
}

export function buildExportFile(format: "json" | "csv", range: ExportRange, category: CsvCategory = "meals") {
  const bundle = buildExportBundle(range)
  const date = localDateParts().date
  if (format === "json") return { filename: `snapcal-${date}.json`, mime: "application/json", content: JSON.stringify(bundle, null, 2), count: bundle.meals.length + bundle.workouts.length + bundle.checkins.length + bundle.body_metrics.length + bundle.action_cards.length + bundle.experiments.length }
  const records = bundle[category]
  return { filename: `snapcal-${category}-${date}.csv`, mime: "text/csv;charset=utf-8", content: buildCategoryCsv(bundle, category), count: records.length }
}
