import { formatLocalDate, localDateParts, parseLocalDate } from "./date-utils"
import { localDb } from "./local-db"
import { wellnessDb } from "./wellness-db"

export type InsightTimeframe = "7d" | "30d"

function addDays(date: string, amount: number) {
  const value = parseLocalDate(date)
  value.setDate(value.getDate() + amount)
  return formatLocalDate(value)
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) / 10 : null
}

export function buildInsights(timeframe: InsightTimeframe, endDate = localDateParts().date) {
  const days = timeframe === "30d" ? 30 : 7
  const startDate = addDays(endDate, 1 - days)
  const meals = localDb.listMeals({ startDate, endDate }).meals
  const workouts = wellnessDb.listWorkouts({ startDate, endDate })
  const checkins = wellnessDb.listCheckins(startDate, endDate)
  const bodyMetrics = wellnessDb.listBodyMetrics(startDate, endDate)
  const mealDates = new Set(meals.map(meal => meal.meal_date))
  const totals = meals.reduce((sum, meal) => ({
    calories: sum.calories + meal.calories,
    protein: sum.protein + meal.protein,
    carbs: sum.carbs + meal.carbs,
    fats: sum.fats + meal.fats,
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 })
  const completed = workouts.filter(workout => workout.status === "completed")
  const completedSets = completed.flatMap(workout => workout.exercises).flatMap(exercise => exercise.sets).filter(set => set.completed)
  const templateSessions = workouts.filter(workout => workout.template_id)
  const observations: string[] = []
  if (completed.length && checkins.length) {
    observations.push(`本周期有 ${completed.length} 次训练与 ${checkins.length} 次状态记录同期出现；样本较少时只作参考。`)
  }
  if (mealDates.size < days) {
    observations.push(`有 ${mealDates.size}/${days} 天记录饮食，未记录日期没有按零摄入处理。`)
  }
  if (bodyMetrics.length === 1) observations.push("身体指标目前只有一个记录点，暂不判断趋势。")

  return {
    timeframe,
    range: { start_date: startDate, end_date: endDate },
    nutrition: {
      recorded_days: mealDates.size,
      meal_count: meals.length,
      daily_average: mealDates.size ? Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Math.round(value / mealDates.size * 10) / 10])) : null,
      confidence: mealDates.size >= Math.ceil(days * 0.7) ? "high" : mealDates.size >= Math.ceil(days * 0.4) ? "medium" : "low",
    },
    training: {
      completed_sessions: completed.length,
      total_minutes: completed.reduce((sum, workout) => sum + (workout.duration_minutes || 0), 0),
      strength_sets: completedSets.filter(set => set.reps != null || set.weight_kg != null).length,
      volume_kg_reps: Math.round(completedSets.reduce((sum, set) => sum + (set.weight_kg || 0) * (set.reps || 0), 0) * 10) / 10,
      cardio_minutes: Math.round(completed.filter(workout => workout.workout_type === "cardio").reduce((sum, workout) => sum + (workout.duration_minutes || 0), 0) * 10) / 10,
      cardio_distance_meters: completed.filter(workout => workout.workout_type === "cardio").flatMap(workout => workout.exercises).flatMap(exercise => exercise.sets).reduce((sum, set) => sum + (set.distance_meters || 0), 0),
      template_completion_rate: templateSessions.length ? Math.round(templateSessions.filter(workout => workout.status === "completed").length / templateSessions.length * 100) : null,
      average_effort: average(completed.flatMap(workout => workout.perceived_effort == null ? [] : [workout.perceived_effort])),
    },
    status: {
      recorded_days: checkins.length,
      energy: average(checkins.map(item => item.energy)),
      hunger: average(checkins.map(item => item.hunger)),
      soreness: average(checkins.map(item => item.soreness)),
      sleep_hours: average(checkins.flatMap(item => item.sleep_hours == null ? [] : [item.sleep_hours])),
      sleep_quality: average(checkins.flatMap(item => item.sleep_quality == null ? [] : [item.sleep_quality])),
    },
    body_metrics: bodyMetrics.map(item => ({
      date: item.metric_date,
      weight_kg: item.weight_kg,
      waist_cm: item.waist_cm,
      body_fat_percent: item.body_fat_percent,
    })),
    observations,
    completeness: {
      meal_days: mealDates.size,
      completed_workouts: completed.length,
      checkin_days: checkins.length,
    },
  }
}

export function experimentEligibility(endDate = localDateParts().date) {
  const insights = buildInsights("7d", endDate)
  const missing: string[] = []
  if (insights.completeness.meal_days < 4) missing.push(`还需要 ${4 - insights.completeness.meal_days} 天饮食记录`)
  if (insights.completeness.completed_workouts < 2) missing.push(`还需要 ${2 - insights.completeness.completed_workouts} 次完成训练`)
  if (insights.completeness.checkin_days < 3) missing.push(`还需要 ${3 - insights.completeness.checkin_days} 次状态打卡`)
  return { eligible: missing.length === 0, missing, baseline: insights.completeness }
}

export function proposeWeeklyExperiment(startDate = localDateParts().date) {
  const eligibility = experimentEligibility(startDate)
  if (!eligibility.eligible) return { ...eligibility, experiment: null }
  const existing = wellnessDb.listExperiments().find(item => item.status === "active" || (item.status === "proposed" && item.start_date === startDate))
  if (existing) return { ...eligibility, experiment: existing }
  const experiment = wellnessDb.createExperiment({
    start_date: startDate,
    end_date: addDays(startDate, 6),
    title: "给一餐增加蛋白质来源",
    variable_key: "meal_protein_source",
    instruction: "未来 7 天，在最容易准备的一餐增加一种符合饮食限制的蛋白质来源。其他习惯尽量保持不变。",
    hypothesis: "观察这项变化与饥饿感记录是否更常同期出现变化，不作因果结论。",
    status: "proposed",
    baseline_snapshot: eligibility.baseline,
  })
  return { ...eligibility, experiment }
}
