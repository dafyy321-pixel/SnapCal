import { z } from "zod"
import { getAiConfig } from "./ai-config"
import { formatLocalDate, localDateParts, parseLocalDate } from "./date-utils"
import { localDb, type MealRecord } from "./local-db"
import { createChatCompletion } from "./openai-client"
import { wellnessDb } from "./wellness-db"
import type { ActionCandidate, ConfidenceLevel, DailyCheckinRecord, WorkoutRecord } from "./wellness-types"

type ActionFacts = {
  date: string
  currentTime: string
  meals: Pick<MealRecord, "meal_time">[]
  workouts: WorkoutRecord[]
  weeklyCompletedWorkouts: number
  trainingDaysGoal: number
  checkin: DailyCheckinRecord | null
}

const selectionSchema = z.object({
  candidate_id: z.string().min(1),
  rationale: z.string().trim().min(1).max(200),
  confidence: z.enum(["low", "medium", "high"]),
}).strict()

function minutes(time: string) {
  const [hours, mins] = time.split(":").map(Number)
  return hours * 60 + mins
}

function validUntil(date: string) {
  return new Date(`${date}T23:59:59+08:00`).toISOString()
}

function candidate(input: Omit<ActionCandidate, "valid_until" | "payload"> & { date: string; payload?: Record<string, unknown> }): ActionCandidate {
  const { date, ...rest } = input
  return { ...rest, valid_until: validUntil(date), payload: input.payload || {} }
}

export function buildActionCandidates(facts: ActionFacts): ActionCandidate[] {
  const result: ActionCandidate[] = []
  const nowMinutes = minutes(facts.currentTime)
  const lastMealMinutes = Math.max(-Infinity, ...facts.meals.map(meal => minutes(meal.meal_time)))
  const completed = facts.workouts
    .filter(workout => workout.status === "completed" && nowMinutes - minutes(workout.session_time) >= 0 && nowMinutes - minutes(workout.session_time) <= 120)
    .sort((a, b) => b.session_time.localeCompare(a.session_time))[0]
  const planned = facts.workouts
    .filter(workout => workout.status === "planned" && minutes(workout.session_time) - nowMinutes >= 0 && minutes(workout.session_time) - nowMinutes <= 120)
    .sort((a, b) => a.session_time.localeCompare(b.session_time))[0]

  if (!facts.checkin) {
    result.push(candidate({ id: "complete-checkin", kind: "logging", priority: 100, title: "用 10 秒记录今天状态", action_text: "记录精力、饥饿和酸痛，获得更贴合今天的建议。", rationale_codes: ["missing_checkin"], date: facts.date }))
  }
  if (completed && lastMealMinutes <= minutes(completed.session_time)) {
    result.push(candidate({ id: `post-workout-fuel:${completed.id}`, kind: "fuel", priority: 90, title: "安排训练后这一餐", action_text: "看看现有食物如何搭配主食、蛋白质和补水。", rationale_codes: ["recent_completed_workout", "no_meal_after_workout"], date: facts.date, payload: { workout_id: completed.id, context: "post_workout" } }))
  }
  if (planned && facts.checkin?.hunger && facts.checkin.hunger >= 4 && nowMinutes - lastMealMinutes > 180) {
    result.push(candidate({ id: `pre-workout-fuel:${planned.id}`, kind: "fuel", priority: 80, title: "训练前补充一点食物", action_text: "从手头食物里选一份低负担搭配。", rationale_codes: ["planned_workout_soon", "high_hunger", "long_since_meal"], date: facts.date, payload: { workout_id: planned.id, context: "pre_workout", minutes_until_workout: minutes(planned.session_time) - nowMinutes } }))
  }
  if (planned && facts.checkin && (facts.checkin.energy <= 2 || facts.checkin.soreness >= 4)) {
    result.push(candidate({ id: `adjust-workout:${planned.id}`, kind: "recovery", priority: 75, title: "把今天训练调轻一点", action_text: "可缩短时长、减少组数，或改做 10 分钟活动与拉伸。", rationale_codes: ["planned_workout_soon", facts.checkin.energy <= 2 ? "low_energy" : "higher_soreness"], date: facts.date, payload: { workout_id: planned.id } }))
  }
  if (facts.weeklyCompletedWorkouts < facts.trainingDaysGoal && !facts.workouts.some(workout => workout.status === "completed") && (facts.checkin?.energy || 0) >= 3) {
    result.push(candidate({ id: "short-workout", kind: "workout", priority: 60, title: "今天安排一次短训练", action_text: "从 10～30 分钟模板中选一个，按今天状态完成即可。", rationale_codes: ["below_weekly_goal", "enough_energy"], date: facts.date, payload: { template_duration_range: [10, 30] } }))
  }
  result.push(candidate({ id: "daily-reflection", kind: "reflection", priority: 10, title: "保持今天的节奏", action_text: "回顾已记录内容，按原计划继续即可。", rationale_codes: ["core_records_complete"], date: facts.date }))
  return result.sort((a, b) => b.priority - a.priority)
}

function weekStart(date: string) {
  const value = parseLocalDate(date)
  const offset = value.getDay() === 0 ? 6 : value.getDay() - 1
  value.setDate(value.getDate() - offset)
  return formatLocalDate(value)
}

type Selector = (candidates: ActionCandidate[], snapshot: Record<string, unknown>) => Promise<unknown>

async function aiSelector(candidates: ActionCandidate[], snapshot: Record<string, unknown>) {
  const result = await createChatCompletion({
    capability: "text",
    taskType: "action_card",
    promptVersion: "action-v1",
    logInput: snapshot,
    schema: selectionSchema,
    messages: [{
      role: "user",
      content: `只能从候选中选择一个行动，不得创造新行动。用 JSON 返回 candidate_id、rationale、confidence。\n${JSON.stringify({ snapshot, candidates })}`,
    }],
  })
  return { selection: result.data, runId: result.runId }
}

export async function generateActionCard(date: string, options: { force?: boolean; now?: { date: string; time: string }; selector?: Selector } = {}) {
  const active = wellnessDb.getActiveAction(date)
  if (active && !options.force) return active
  const now = options.now || localDateParts()
  const profile = localDb.getProfile()
  const workouts = wellnessDb.listWorkouts({ date })
  const candidates = buildActionCandidates({
    date,
    currentTime: now.date === date ? now.time : "12:00:00",
    meals: localDb.listMeals({ date }).meals,
    workouts,
    weeklyCompletedWorkouts: wellnessDb.listWorkouts({ startDate: weekStart(date), endDate: date, status: "completed" }).length,
    trainingDaysGoal: profile.training_days_goal,
    checkin: wellnessDb.getCheckin(date),
  })
  const snapshot = {
    date,
    meal_count: localDb.listMeals({ date }).total,
    workout_count: workouts.length,
    weekly_completed_workouts: wellnessDb.listWorkouts({ startDate: weekStart(date), endDate: date, status: "completed" }).length,
    training_days_goal: profile.training_days_goal,
    checkin: wellnessDb.getCheckin(date) ? {
      energy: wellnessDb.getCheckin(date)!.energy,
      hunger: wellnessDb.getCheckin(date)!.hunger,
      soreness: wellnessDb.getCheckin(date)!.soreness,
      sleep_hours: wellnessDb.getCheckin(date)!.sleep_hours,
    } : null,
    data_completeness: {
      meal: localDb.listMeals({ date }).total > 0,
      workout: workouts.length > 0,
      checkin: Boolean(wellnessDb.getCheckin(date)),
      score: [localDb.listMeals({ date }).total > 0, workouts.length > 0, Boolean(wellnessDb.getCheckin(date))].filter(Boolean).length,
      total: 3,
    },
  }
  let selected = candidates[0]
  let rationale = selected.rationale_codes.map(code => ({
    missing_checkin: "今天还没有状态记录",
    recent_completed_workout: "刚完成训练且尚未记录之后的一餐",
    planned_workout_soon: "两小时内有计划训练",
    below_weekly_goal: "本周完成次数仍低于目标",
    core_records_complete: "主要记录已经完成",
  }[code] || code)).join("；")
  let confidence: ConfidenceLevel = selected.id === "daily-reflection" ? "medium" : "high"
  let source: "rules" | "ai_enhanced" = "rules"
  let aiRunId: string | null = null
  const canUseAi = options.selector || (profile.ai_consent_at && getAiConfig().textModel && getAiConfig().apiKey)
  if (canUseAi) {
    try {
      const response = options.selector
        ? { selection: await options.selector(candidates, snapshot), runId: null }
        : await aiSelector(candidates, snapshot)
      const parsed = selectionSchema.safeParse(response.selection)
      const matched = parsed.success ? candidates.find(item => item.id === parsed.data.candidate_id) : null
      if (matched && parsed.success) {
        selected = matched
        rationale = parsed.data.rationale
        confidence = parsed.data.confidence
        source = "ai_enhanced"
        aiRunId = response.runId
      }
    } catch {
      // 本地规则回退是正常路径，不阻断行动卡。
    }
  }
  return wellnessDb.createAction({
    candidate_id: selected.id,
    card_date: date,
    kind: selected.kind,
    title: selected.title,
    action_text: selected.action_text,
    rationale,
    confidence,
    source,
    valid_until: selected.valid_until,
    input_snapshot: snapshot,
    candidate_snapshot: candidates,
    response_reason: null,
    ai_run_id: aiRunId,
  })
}
