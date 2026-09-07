export type WorkoutType = "strength" | "cardio" | "mobility" | "sports" | "other"
export type WorkoutStatus = "planned" | "in_progress" | "completed" | "skipped"
export type WorkoutSource = "manual" | "template" | "action"
export type CheckinScore = 1 | 2 | 3 | 4 | 5
export type ConfidenceLevel = "low" | "medium" | "high"

export type WorkoutSetInput = {
  set_index: number
  set_type: "warmup" | "working" | "drop" | "failure"
  reps?: number | null
  weight_kg?: number | null
  duration_seconds?: number | null
  distance_meters?: number | null
  rpe?: number | null
  completed: boolean
}

export type WorkoutExerciseInput = {
  order_index: number
  name: string
  category: WorkoutType
  muscle_group?: string | null
  notes?: string | null
  sets: WorkoutSetInput[]
}

export type WorkoutInput = {
  session_date: string
  session_time: string
  title: string
  workout_type: WorkoutType
  status: WorkoutStatus
  source: WorkoutSource
  template_id?: string | null
  duration_minutes?: number | null
  perceived_effort?: number | null
  energy_after?: CheckinScore | null
  notes?: string | null
  exercises: WorkoutExerciseInput[]
}

export type WorkoutSetRecord = WorkoutSetInput & { id: string; exercise_id: string }
export type WorkoutExerciseRecord = Omit<WorkoutExerciseInput, "sets"> & {
  id: string
  session_id: string
  sets: WorkoutSetRecord[]
}
export type WorkoutRecord = Omit<WorkoutInput, "exercises"> & {
  id: string
  exercises: WorkoutExerciseRecord[]
  created_at: string
  updated_at: string
}

export type WorkoutTemplateRecord = {
  id: string
  name: string
  workout_type: WorkoutType
  description: string
  exercises: WorkoutExerciseInput[]
  is_builtin: boolean
  created_at: string
  updated_at: string
}

export type DailyCheckinRecord = {
  checkin_date: string
  energy: CheckinScore
  hunger: CheckinScore
  soreness: CheckinScore
  sleep_hours: number | null
  sleep_quality: CheckinScore | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type BodyMetricRecord = {
  metric_date: string
  weight_kg: number | null
  waist_cm: number | null
  body_fat_percent: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ActionKind = "fuel" | "workout" | "recovery" | "logging" | "reflection"
export type ActionCandidate = {
  id: string
  kind: ActionKind
  priority: number
  title: string
  action_text: string
  rationale_codes: string[]
  valid_until: string
  payload: Record<string, unknown>
}

export type ActionCardRecord = {
  id: string
  candidate_id: string
  card_date: string
  kind: ActionKind
  title: string
  action_text: string
  rationale: string
  confidence: ConfidenceLevel
  source: "rules" | "ai_enhanced"
  valid_until: string
  input_snapshot: Record<string, unknown>
  candidate_snapshot: ActionCandidate[]
  status: "active" | "completed" | "dismissed" | "replaced" | "expired"
  response_reason: string | null
  ai_run_id: string | null
  created_at: string
  updated_at: string
}

export type FoodAssistItem = {
  id: string
  name: string
  confidence: number
  portion_hint: string | null
  nutrition_known: boolean
}

export type FoodSuggestion = {
  title: string
  item_ids: string[]
  portion_hints: string[]
  rationale: string
  cautions: string[]
}

export type FoodAssistRecord = {
  id: string
  context: "pre_workout" | "post_workout" | "general"
  workout_id: string | null
  minutes_until_workout: number | null
  image_url: string
  recognized_items: FoodAssistItem[]
  confirmed_items: FoodAssistItem[]
  uncertainties: string[]
  primary_suggestion: FoodSuggestion | null
  alternative_suggestion: FoodSuggestion | null
  status: "recognized" | "confirmed" | "suggested" | "saved"
  meal_id: string | null
  ai_run_id: string | null
  created_at: string
  updated_at: string
}

export type WeeklyExperimentRecord = {
  id: string
  start_date: string
  end_date: string
  title: string
  variable_key: string
  instruction: string
  hypothesis: string
  status: "proposed" | "active" | "completed" | "skipped" | "cancelled"
  baseline_snapshot: Record<string, unknown>
  result_snapshot: Record<string, unknown>
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export type FoodVisionResult = {
  mode: "meal" | "inventory"
  name: string
  confidence: number
  description?: string
  calories: number
  protein: number
  carbs: number
  fats: number
  ingredients: string[]
  items: Array<{
    id: string
    name: string
    confidence: number
    portionHint: string | null
    nutritionKnown: boolean
  }>
  uncertainties: string[]
  nutrition?: Record<string, number>
}
