import { randomUUID, createHash } from "node:crypto"
import type { SQLInputValue } from "node:sqlite"
import { getDatabase } from "./local-db"
import type {
  ActionCandidate,
  ActionCardRecord,
  BodyMetricRecord,
  DailyCheckinRecord,
  FoodAssistItem,
  FoodAssistRecord,
  FoodSuggestion,
  WeeklyExperimentRecord,
  WorkoutExerciseInput,
  WorkoutInput,
  WorkoutRecord,
  WorkoutTemplateRecord,
} from "./wellness-types"

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

function now() { return new Date().toISOString() }

function normalizeTemplate(row: Record<string, unknown>): WorkoutTemplateRecord {
  const raw = parseJson<Array<Record<string, unknown>>>(row.exercises_json, [])
  const exercises = raw.map((exercise, index) => {
    if (Array.isArray(exercise.sets)) return exercise as unknown as WorkoutExerciseInput
    const count = Math.max(1, Number(exercise.sets) || 1)
    return {
      order_index: index,
      name: String(exercise.name || "未命名动作"),
      category: String(exercise.category || row.workout_type) as WorkoutExerciseInput["category"],
      muscle_group: exercise.muscle_group == null ? null : String(exercise.muscle_group),
      notes: null,
      sets: Array.from({ length: count }, (_, setIndex) => ({
        set_index: setIndex,
        set_type: "working" as const,
        reps: exercise.reps == null ? null : Number(exercise.reps),
        weight_kg: null,
        duration_seconds: exercise.duration_seconds == null ? null : Number(exercise.duration_seconds),
        distance_meters: null,
        rpe: null,
        completed: false,
      })),
    }
  })
  return { ...row, is_builtin: Boolean(row.is_builtin), exercises } as WorkoutTemplateRecord
}

function getWorkout(id: string): WorkoutRecord | null {
  const database = getDatabase()
  const session = database.prepare("SELECT * FROM workout_sessions WHERE id = ?").get(id) as Record<string, unknown> | undefined
  if (!session) return null
  const exercises = database.prepare("SELECT * FROM workout_exercises WHERE session_id = ? ORDER BY order_index").all(id) as Record<string, unknown>[]
  return {
    ...session,
    exercises: exercises.map(exercise => ({
      ...exercise,
      sets: (database.prepare("SELECT * FROM workout_sets WHERE exercise_id = ? ORDER BY set_index").all(exercise.id as string) as Record<string, unknown>[])
        .map(set => ({ ...set, completed: Boolean(set.completed) })),
    })),
  } as WorkoutRecord
}

function insertExercises(sessionId: string, exercises: WorkoutExerciseInput[]) {
  const database = getDatabase()
  const insertExercise = database.prepare(`
    INSERT INTO workout_exercises (id, session_id, order_index, name, category, muscle_group, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const insertSet = database.prepare(`
    INSERT INTO workout_sets
      (id, exercise_id, set_index, set_type, reps, weight_kg, duration_seconds, distance_meters, rpe, completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const exercise of exercises) {
    const exerciseId = randomUUID()
    insertExercise.run(exerciseId, sessionId, exercise.order_index, exercise.name, exercise.category, exercise.muscle_group ?? null, exercise.notes ?? null)
    for (const set of exercise.sets) {
      insertSet.run(randomUUID(), exerciseId, set.set_index, set.set_type, set.reps ?? null, set.weight_kg ?? null,
        set.duration_seconds ?? null, set.distance_meters ?? null, set.rpe ?? null, set.completed ? 1 : 0)
    }
  }
}

function normalizeAction(row: Record<string, unknown>): ActionCardRecord {
  return {
    ...row,
    input_snapshot: parseJson(row.input_snapshot, {}),
    candidate_snapshot: parseJson(row.candidate_snapshot, []),
  } as unknown as ActionCardRecord
}

function normalizeFoodAssist(row: Record<string, unknown>): FoodAssistRecord {
  return {
    ...row,
    recognized_items: parseJson(row.recognized_items, []),
    confirmed_items: parseJson(row.confirmed_items, []),
    primary_suggestion: parseJson(row.primary_suggestion, null),
    alternative_suggestion: parseJson(row.alternative_suggestion, null),
  } as unknown as FoodAssistRecord
}

function normalizeExperiment(row: Record<string, unknown>): WeeklyExperimentRecord {
  return {
    ...row,
    baseline_snapshot: parseJson(row.baseline_snapshot, {}),
    result_snapshot: parseJson(row.result_snapshot, {}),
  } as WeeklyExperimentRecord
}

export const wellnessDb = {
  listWorkouts(options: { date?: string; startDate?: string; endDate?: string; status?: string; type?: string } = {}) {
    const conditions: string[] = []
    const values: SQLInputValue[] = []
    if (options.date) { conditions.push("session_date = ?"); values.push(options.date) }
    if (options.startDate) { conditions.push("session_date >= ?"); values.push(options.startDate) }
    if (options.endDate) { conditions.push("session_date <= ?"); values.push(options.endDate) }
    if (options.status) { conditions.push("status = ?"); values.push(options.status) }
    if (options.type) { conditions.push("workout_type = ?"); values.push(options.type) }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
    const rows = getDatabase().prepare(`SELECT id FROM workout_sessions ${where} ORDER BY session_date DESC, session_time DESC`).all(...values) as Array<{ id: string }>
    return rows.map(row => getWorkout(row.id)!)
  },

  getWorkout,

  createWorkout(input: WorkoutInput): WorkoutRecord {
    const database = getDatabase()
    const id = randomUUID()
    const timestamp = now()
    database.exec("BEGIN IMMEDIATE")
    try {
      database.prepare(`INSERT INTO workout_sessions
        (id, session_date, session_time, title, workout_type, status, source, template_id, duration_minutes, perceived_effort, energy_after, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, input.session_date, input.session_time, input.title, input.workout_type, input.status, input.source,
          input.template_id ?? null, input.duration_minutes ?? null, input.perceived_effort ?? null,
          input.energy_after ?? null, input.notes ?? null, timestamp, timestamp)
      insertExercises(id, input.exercises)
      database.exec("COMMIT")
      return getWorkout(id)!
    } catch (error) {
      database.exec("ROLLBACK")
      throw error
    }
  },

  updateWorkout(id: string, updates: Partial<WorkoutInput>): WorkoutRecord | null {
    if (!getWorkout(id)) return null
    const database = getDatabase()
    const allowed = new Set(["session_date", "session_time", "title", "workout_type", "status", "source", "template_id", "duration_minutes", "perceived_effort", "energy_after", "notes"])
    const entries = Object.entries(updates).filter(([key, value]) => allowed.has(key) && value !== undefined)
    database.exec("BEGIN IMMEDIATE")
    try {
      if (entries.length) {
        const clause = entries.map(([key]) => `${key} = ?`).join(", ")
        database.prepare(`UPDATE workout_sessions SET ${clause}, updated_at = ? WHERE id = ?`)
          .run(...entries.map(([, value]) => value as SQLInputValue), now(), id)
      }
      if (updates.exercises) {
        database.prepare("DELETE FROM workout_exercises WHERE session_id = ?").run(id)
        insertExercises(id, updates.exercises)
      }
      database.exec("COMMIT")
      return getWorkout(id)
    } catch (error) {
      database.exec("ROLLBACK")
      throw error
    }
  },

  deleteWorkout(id: string) {
    return Number(getDatabase().prepare("DELETE FROM workout_sessions WHERE id = ?").run(id).changes) > 0
  },

  listTemplates(): WorkoutTemplateRecord[] {
    return (getDatabase().prepare("SELECT * FROM workout_templates ORDER BY is_builtin DESC, name").all() as Record<string, unknown>[]).map(normalizeTemplate)
  },

  getTemplate(id: string): WorkoutTemplateRecord | null {
    const row = getDatabase().prepare("SELECT * FROM workout_templates WHERE id = ?").get(id) as Record<string, unknown> | undefined
    return row ? normalizeTemplate(row) : null
  },

  createTemplate(input: Pick<WorkoutTemplateRecord, "name" | "workout_type" | "description" | "exercises">) {
    const id = randomUUID()
    const timestamp = now()
    getDatabase().prepare(`INSERT INTO workout_templates
      (id, name, workout_type, description, exercises_json, is_builtin, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)`)
      .run(id, input.name, input.workout_type, input.description, JSON.stringify(input.exercises), timestamp, timestamp)
    return this.getTemplate(id)!
  },

  updateTemplate(id: string, input: Pick<WorkoutTemplateRecord, "name" | "workout_type" | "description" | "exercises">) {
    const existing = this.getTemplate(id)
    if (!existing || existing.is_builtin) return null
    getDatabase().prepare(`UPDATE workout_templates SET name = ?, workout_type = ?, description = ?, exercises_json = ?, updated_at = ? WHERE id = ?`)
      .run(input.name, input.workout_type, input.description, JSON.stringify(input.exercises), now(), id)
    return this.getTemplate(id)
  },

  deleteTemplate(id: string) {
    const existing = this.getTemplate(id)
    if (!existing || existing.is_builtin) return false
    return Number(getDatabase().prepare("DELETE FROM workout_templates WHERE id = ?").run(id).changes) > 0
  },

  getCheckin(date: string): DailyCheckinRecord | null {
    return (getDatabase().prepare("SELECT * FROM daily_checkins WHERE checkin_date = ?").get(date) as DailyCheckinRecord | undefined) || null
  },

  upsertCheckin(date: string, input: Pick<DailyCheckinRecord, "energy" | "hunger" | "soreness"> & Partial<Pick<DailyCheckinRecord, "sleep_hours" | "sleep_quality" | "notes">>) {
    const timestamp = now()
    getDatabase().prepare(`INSERT INTO daily_checkins
      (checkin_date, energy, hunger, soreness, sleep_hours, sleep_quality, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(checkin_date) DO UPDATE SET energy=excluded.energy, hunger=excluded.hunger, soreness=excluded.soreness,
      sleep_hours=excluded.sleep_hours, sleep_quality=excluded.sleep_quality, notes=excluded.notes, updated_at=excluded.updated_at`)
      .run(date, input.energy, input.hunger, input.soreness, input.sleep_hours ?? null, input.sleep_quality ?? null, input.notes ?? null, timestamp, timestamp)
    return this.getCheckin(date)!
  },

  deleteCheckin(date: string) {
    return Number(getDatabase().prepare("DELETE FROM daily_checkins WHERE checkin_date = ?").run(date).changes) > 0
  },

  listCheckins(startDate: string, endDate: string): DailyCheckinRecord[] {
    return getDatabase().prepare("SELECT * FROM daily_checkins WHERE checkin_date BETWEEN ? AND ? ORDER BY checkin_date").all(startDate, endDate) as DailyCheckinRecord[]
  },

  getBodyMetric(date: string): BodyMetricRecord | null {
    return (getDatabase().prepare("SELECT * FROM body_metrics WHERE metric_date = ?").get(date) as BodyMetricRecord | undefined) || null
  },

  upsertBodyMetric(date: string, input: Partial<Pick<BodyMetricRecord, "weight_kg" | "waist_cm" | "body_fat_percent" | "notes">>) {
    const timestamp = now()
    getDatabase().prepare(`INSERT INTO body_metrics
      (metric_date, weight_kg, waist_cm, body_fat_percent, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(metric_date) DO UPDATE SET weight_kg=excluded.weight_kg, waist_cm=excluded.waist_cm,
      body_fat_percent=excluded.body_fat_percent, notes=excluded.notes, updated_at=excluded.updated_at`)
      .run(date, input.weight_kg ?? null, input.waist_cm ?? null, input.body_fat_percent ?? null, input.notes ?? null, timestamp, timestamp)
    return this.getBodyMetric(date)!
  },

  deleteBodyMetric(date: string) {
    return Number(getDatabase().prepare("DELETE FROM body_metrics WHERE metric_date = ?").run(date).changes) > 0
  },

  listBodyMetrics(startDate: string, endDate: string): BodyMetricRecord[] {
    return getDatabase().prepare("SELECT * FROM body_metrics WHERE metric_date BETWEEN ? AND ? ORDER BY metric_date").all(startDate, endDate) as BodyMetricRecord[]
  },

  getActiveAction(date: string): ActionCardRecord | null {
    const timestamp = now()
    getDatabase().prepare("UPDATE action_cards SET status = 'expired', updated_at = ? WHERE status = 'active' AND valid_until <= ?").run(timestamp, timestamp)
    const row = getDatabase().prepare("SELECT * FROM action_cards WHERE card_date = ? AND status = 'active' LIMIT 1").get(date) as Record<string, unknown> | undefined
    return row ? normalizeAction(row) : null
  },

  createAction(input: Omit<ActionCardRecord, "id" | "created_at" | "updated_at" | "status">) {
    const database = getDatabase()
    const id = randomUUID()
    const timestamp = now()
    database.exec("BEGIN IMMEDIATE")
    try {
      database.prepare("UPDATE action_cards SET status = 'replaced', updated_at = ? WHERE card_date = ? AND status = 'active'").run(timestamp, input.card_date)
      database.prepare(`INSERT INTO action_cards
        (id, candidate_id, card_date, kind, title, action_text, rationale, confidence, source, valid_until,
         input_snapshot, candidate_snapshot, status, response_reason, ai_run_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`)
        .run(id, input.candidate_id, input.card_date, input.kind, input.title, input.action_text, input.rationale,
          input.confidence, input.source, input.valid_until, JSON.stringify(input.input_snapshot),
          JSON.stringify(input.candidate_snapshot), input.response_reason, input.ai_run_id, timestamp, timestamp)
      database.exec("COMMIT")
      return this.getActiveAction(input.card_date)!
    } catch (error) {
      database.exec("ROLLBACK")
      throw error
    }
  },

  updateAction(id: string, status: "completed" | "dismissed" | "replaced", reason: string | null) {
    getDatabase().prepare("UPDATE action_cards SET status = ?, response_reason = ?, updated_at = ? WHERE id = ? AND status = 'active'").run(status, reason, now(), id)
    const row = getDatabase().prepare("SELECT * FROM action_cards WHERE id = ?").get(id) as Record<string, unknown> | undefined
    return row ? normalizeAction(row) : null
  },

  listActions(startDate: string, endDate: string): ActionCardRecord[] {
    return (getDatabase().prepare("SELECT * FROM action_cards WHERE card_date BETWEEN ? AND ? ORDER BY created_at").all(startDate, endDate) as Record<string, unknown>[]).map(normalizeAction)
  },

  createFoodAssist(input: { context: FoodAssistRecord["context"]; workout_id?: string | null; minutes_until_workout?: number | null; image_url: string; recognized_items: FoodAssistItem[]; ai_run_id?: string | null }) {
    const id = randomUUID()
    const timestamp = now()
    getDatabase().prepare(`INSERT INTO food_assist_sessions
      (id, context, workout_id, minutes_until_workout, image_url, recognized_items, confirmed_items, status, ai_run_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, '[]', 'recognized', ?, ?, ?)`)
      .run(id, input.context, input.workout_id ?? null, input.minutes_until_workout ?? null, input.image_url,
        JSON.stringify(input.recognized_items), input.ai_run_id ?? null, timestamp, timestamp)
    return this.getFoodAssist(id)!
  },

  getFoodAssist(id: string): FoodAssistRecord | null {
    const row = getDatabase().prepare("SELECT * FROM food_assist_sessions WHERE id = ?").get(id) as Record<string, unknown> | undefined
    return row ? normalizeFoodAssist(row) : null
  },

  updateFoodAssist(id: string, input: { confirmed_items?: FoodAssistItem[]; primary_suggestion?: FoodSuggestion; alternative_suggestion?: FoodSuggestion; status?: FoodAssistRecord["status"]; meal_id?: string }) {
    const current = this.getFoodAssist(id)
    if (!current) return null
    const confirmed = input.confirmed_items ?? current.confirmed_items
    const primary = input.primary_suggestion ?? current.primary_suggestion
    const alternative = input.alternative_suggestion ?? current.alternative_suggestion
    const status = input.status ?? current.status
    getDatabase().prepare(`UPDATE food_assist_sessions SET confirmed_items = ?, primary_suggestion = ?, alternative_suggestion = ?, status = ?, meal_id = ?, updated_at = ? WHERE id = ?`)
      .run(JSON.stringify(confirmed), primary ? JSON.stringify(primary) : null, alternative ? JSON.stringify(alternative) : null,
        status, input.meal_id ?? current.meal_id, now(), id)
    return this.getFoodAssist(id)
  },

  createExperiment(input: Omit<WeeklyExperimentRecord, "id" | "created_at" | "updated_at" | "accepted_at" | "result_snapshot">) {
    const id = randomUUID()
    const timestamp = now()
    getDatabase().prepare(`INSERT INTO weekly_experiments
      (id, start_date, end_date, title, variable_key, instruction, hypothesis, status, baseline_snapshot, result_snapshot, accepted_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', NULL, ?, ?)`)
      .run(id, input.start_date, input.end_date, input.title, input.variable_key, input.instruction, input.hypothesis,
        input.status, JSON.stringify(input.baseline_snapshot), timestamp, timestamp)
    return this.getExperiment(id)!
  },

  getExperiment(id: string): WeeklyExperimentRecord | null {
    const row = getDatabase().prepare("SELECT * FROM weekly_experiments WHERE id = ?").get(id) as Record<string, unknown> | undefined
    return row ? normalizeExperiment(row) : null
  },

  listExperiments(): WeeklyExperimentRecord[] {
    return (getDatabase().prepare("SELECT * FROM weekly_experiments ORDER BY start_date DESC").all() as Record<string, unknown>[]).map(normalizeExperiment)
  },

  updateExperiment(id: string, updates: { status: WeeklyExperimentRecord["status"]; instruction?: string }) {
    const current = this.getExperiment(id)
    if (!current) return null
    if (updates.status === "active") {
      getDatabase().prepare("UPDATE weekly_experiments SET status = 'cancelled', updated_at = ? WHERE status = 'active' AND id <> ?").run(now(), id)
    }
    getDatabase().prepare("UPDATE weekly_experiments SET status = ?, instruction = ?, accepted_at = ?, updated_at = ? WHERE id = ?")
      .run(updates.status, updates.instruction ?? current.instruction, updates.status === "active" ? now() : current.accepted_at, now(), id)
    return this.getExperiment(id)
  },

  logAiRun(input: { task_type: string; provider: string; model: string; status: "completed" | "failed"; duration_ms: number; input: unknown; error_code?: string | null; prompt_version: string; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }) {
    const id = randomUUID()
    const inputHash = createHash("sha256").update(JSON.stringify(input)).digest("hex")
    getDatabase().prepare(`INSERT INTO ai_runs
      (id, task_type, provider, model, status, duration_ms, input_hash, error_code, prompt_version, prompt_tokens, completion_tokens, total_tokens, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, input.task_type, input.provider, input.model, input.status, input.duration_ms, inputHash, input.error_code ?? null,
        input.prompt_version, input.usage?.prompt_tokens ?? null, input.usage?.completion_tokens ?? null,
        input.usage?.total_tokens ?? null, now())
    return id
  },
}
