import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { randomUUID } from "node:crypto"
import { DatabaseSync, type SQLInputValue } from "node:sqlite"

export type MealRecord = {
  id: string
  meal_name: string
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  meal_date: string
  meal_time: string
  calories: number
  protein: number
  carbs: number
  fats: number
  image_url: string | null
  ingredients: string[]
  confidence: number
  fiber: number
  sugar: number
  sodium: number
  calcium: number
  vitamin_c: number
  iron: number
  cholesterol: number
  saturated_fat: number
  trans_fat: number
  potassium: number
  vitamin_a: number
  vitamin_d: number
  vitamin_e: number
  created_at: string
  updated_at: string
}

export type ProfileRecord = {
  id: number
  username: string
  avatar_url: string | null
  birthday: string | null
  gender: "male" | "female" | "other" | null
  height: number | null
  weight: number | null
  target_weight: number | null
  weekly_goal: number
  activity_level: "low" | "moderate" | "high"
  weight_goal: "lose" | "maintain" | "gain"
  daily_calorie_goal: number
  daily_protein_goal: number
  daily_carbs_goal: number
  daily_fats_goal: number
  training_days_goal: number
  training_experience: "beginner" | "intermediate" | "advanced"
  available_equipment: string[]
  dietary_preferences: string[]
  allergies: string[]
  ai_consent_at: string | null
  created_at: string
  updated_at: string
}

export type AnalysisRecord = {
  id: string
  meal_id: string | null
  image_hash: string
  raw_image_url: string | null
  raw_analysis_response: unknown
  food_name: string
  confidence_score: number
  ingredients: string[]
  calories: number
  protein: number
  carbohydrates: number
  fats: number
  fiber: number
  sugar: number
  sodium: number
  calcium: number
  iron: number
  cholesterol: number
  saturated_fat: number
  trans_fat: number
  potassium: number
  vitamin_c: number
  vitamin_a: number
  vitamin_d: number
  vitamin_e: number
  base_calories: number
  base_protein: number
  base_carbohydrates: number
  base_fats: number
  base_fiber: number
  base_sugar: number
  base_sodium: number
  base_calcium: number
  base_iron: number
  base_cholesterol: number
  base_saturated_fat: number
  base_trans_fat: number
  base_potassium: number
  base_vitamin_c: number
  base_vitamin_a: number
  base_vitamin_d: number
  base_vitamin_e: number
  portion_multiplier: number
  analysis_duration: number
  api_version: string
  model_version: string
  analysis_status: string
  file_metadata: unknown
  created_at: string
  updated_at: string
}

export type MealInput = Omit<MealRecord, "id" | "created_at" | "updated_at">
export type AnalysisInput = Omit<
  AnalysisRecord,
  | "id"
  | "meal_id"
  | "base_calories"
  | "base_protein"
  | "base_carbohydrates"
  | "base_fats"
  | "base_fiber"
  | "base_sugar"
  | "base_sodium"
  | "base_calcium"
  | "base_iron"
  | "base_cholesterol"
  | "base_saturated_fat"
  | "base_trans_fat"
  | "base_potassium"
  | "base_vitamin_c"
  | "base_vitamin_a"
  | "base_vitamin_d"
  | "base_vitamin_e"
  | "created_at"
  | "updated_at"
>

const globalDatabase = globalThis as typeof globalThis & {
  snapcalDatabase?: DatabaseSync
}

function jsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback
  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.error("[Database] JSON field is damaged; using a safe default", error instanceof Error ? error.message : "unknown")
    return fallback
  }
}

function jsonValue(value: unknown): string {
  return JSON.stringify(value ?? null)
}

function getDatabasePath(): string {
  return process.env.SNAPCAL_DB_PATH || join(process.cwd(), "data", "snapcal.db")
}

function initializeDatabase(database: DatabaseSync): void {
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
  `)

  const currentVersion = Number((database.prepare("PRAGMA user_version").get() as { user_version: number }).user_version)
  if (currentVersion >= 5) return

  database.exec("BEGIN IMMEDIATE")
  try {
    if (currentVersion < 1) {
    database.exec(`

    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL DEFAULT '本地用户',
      avatar_url TEXT,
      birthday TEXT,
      gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female', 'other')),
      height REAL,
      weight REAL,
      target_weight REAL,
      weekly_goal REAL NOT NULL DEFAULT 0.5,
      activity_level TEXT NOT NULL DEFAULT 'moderate' CHECK (activity_level IN ('low', 'moderate', 'high')),
      weight_goal TEXT NOT NULL DEFAULT 'maintain' CHECK (weight_goal IN ('lose', 'maintain', 'gain')),
      daily_calorie_goal REAL NOT NULL DEFAULT 1800,
      daily_protein_goal REAL NOT NULL DEFAULT 50,
      daily_carbs_goal REAL NOT NULL DEFAULT 250,
      daily_fats_goal REAL NOT NULL DEFAULT 65,
      training_days_goal INTEGER NOT NULL DEFAULT 3 CHECK (training_days_goal BETWEEN 1 AND 7),
      training_experience TEXT NOT NULL DEFAULT 'beginner' CHECK (training_experience IN ('beginner', 'intermediate', 'advanced')),
      available_equipment TEXT NOT NULL DEFAULT '[]',
      dietary_preferences TEXT NOT NULL DEFAULT '[]',
      allergies TEXT NOT NULL DEFAULT '[]',
      ai_consent_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_meals (
      id TEXT PRIMARY KEY,
      meal_name TEXT NOT NULL,
      meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
      meal_date TEXT NOT NULL,
      meal_time TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fats REAL NOT NULL,
      image_url TEXT,
      ingredients TEXT NOT NULL DEFAULT '[]',
      confidence REAL NOT NULL DEFAULT 0,
      fiber REAL NOT NULL DEFAULT 0,
      sugar REAL NOT NULL DEFAULT 0,
      sodium REAL NOT NULL DEFAULT 0,
      calcium REAL NOT NULL DEFAULT 0,
      vitamin_c REAL NOT NULL DEFAULT 0,
      iron REAL NOT NULL DEFAULT 0,
      cholesterol REAL NOT NULL DEFAULT 0,
      saturated_fat REAL NOT NULL DEFAULT 0,
      trans_fat REAL NOT NULL DEFAULT 0,
      potassium REAL NOT NULL DEFAULT 0,
      vitamin_a REAL NOT NULL DEFAULT 0,
      vitamin_d REAL NOT NULL DEFAULT 0,
      vitamin_e REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_analysis_results (
      id TEXT PRIMARY KEY,
      meal_id TEXT REFERENCES user_meals(id) ON DELETE SET NULL,
      image_hash TEXT NOT NULL UNIQUE,
      raw_image_url TEXT,
      raw_analysis_response TEXT,
      food_name TEXT NOT NULL,
      confidence_score REAL NOT NULL,
      ingredients TEXT NOT NULL DEFAULT '[]',
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbohydrates REAL NOT NULL,
      fats REAL NOT NULL,
      fiber REAL NOT NULL DEFAULT 0,
      sugar REAL NOT NULL DEFAULT 0,
      sodium REAL NOT NULL DEFAULT 0,
      calcium REAL NOT NULL DEFAULT 0,
      iron REAL NOT NULL DEFAULT 0,
      cholesterol REAL NOT NULL DEFAULT 0,
      saturated_fat REAL NOT NULL DEFAULT 0,
      trans_fat REAL NOT NULL DEFAULT 0,
      potassium REAL NOT NULL DEFAULT 0,
      vitamin_c REAL NOT NULL DEFAULT 0,
      vitamin_a REAL NOT NULL DEFAULT 0,
      vitamin_d REAL NOT NULL DEFAULT 0,
      vitamin_e REAL NOT NULL DEFAULT 0,
      base_calories REAL NOT NULL,
      base_protein REAL NOT NULL,
      base_carbohydrates REAL NOT NULL,
      base_fats REAL NOT NULL,
      base_fiber REAL NOT NULL DEFAULT 0,
      base_sugar REAL NOT NULL DEFAULT 0,
      base_sodium REAL NOT NULL DEFAULT 0,
      base_calcium REAL NOT NULL DEFAULT 0,
      base_iron REAL NOT NULL DEFAULT 0,
      base_cholesterol REAL NOT NULL DEFAULT 0,
      base_saturated_fat REAL NOT NULL DEFAULT 0,
      base_trans_fat REAL NOT NULL DEFAULT 0,
      base_potassium REAL NOT NULL DEFAULT 0,
      base_vitamin_c REAL NOT NULL DEFAULT 0,
      base_vitamin_a REAL NOT NULL DEFAULT 0,
      base_vitamin_d REAL NOT NULL DEFAULT 0,
      base_vitamin_e REAL NOT NULL DEFAULT 0,
      portion_multiplier REAL NOT NULL DEFAULT 1,
      analysis_duration INTEGER NOT NULL DEFAULT 0,
      api_version TEXT NOT NULL DEFAULT 'v1',
      model_version TEXT NOT NULL DEFAULT '',
      analysis_status TEXT NOT NULL DEFAULT 'completed',
      file_metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_user_meals_date ON user_meals(meal_date, meal_time DESC);
    CREATE INDEX IF NOT EXISTS idx_user_meals_type ON user_meals(meal_type);
    CREATE INDEX IF NOT EXISTS idx_analysis_created ON meal_analysis_results(created_at DESC);

    CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      workout_type TEXT NOT NULL CHECK (workout_type IN ('strength', 'cardio', 'mobility', 'sports', 'other')),
      description TEXT NOT NULL DEFAULT '',
      exercises_json TEXT NOT NULL DEFAULT '[]',
      is_builtin INTEGER NOT NULL DEFAULT 0 CHECK (is_builtin IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      session_date TEXT NOT NULL,
      session_time TEXT NOT NULL,
      title TEXT NOT NULL,
      workout_type TEXT NOT NULL CHECK (workout_type IN ('strength', 'cardio', 'mobility', 'sports', 'other')),
      status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped')),
      source TEXT NOT NULL CHECK (source IN ('manual', 'template', 'action')),
      template_id TEXT REFERENCES workout_templates(id) ON DELETE SET NULL,
      duration_minutes REAL,
      perceived_effort REAL,
      energy_after INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      order_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('strength', 'cardio', 'mobility', 'sports', 'other')),
      muscle_group TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
      set_index INTEGER NOT NULL,
      set_type TEXT NOT NULL CHECK (set_type IN ('warmup', 'working', 'drop', 'failure')),
      reps REAL,
      weight_kg REAL,
      duration_seconds REAL,
      distance_meters REAL,
      rpe REAL,
      completed INTEGER NOT NULL DEFAULT 1 CHECK (completed IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS daily_checkins (
      checkin_date TEXT PRIMARY KEY,
      energy INTEGER NOT NULL CHECK (energy BETWEEN 1 AND 5),
      hunger INTEGER NOT NULL CHECK (hunger BETWEEN 1 AND 5),
      soreness INTEGER NOT NULL CHECK (soreness BETWEEN 1 AND 5),
      sleep_hours REAL,
      sleep_quality INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS body_metrics (
      metric_date TEXT PRIMARY KEY,
      weight_kg REAL,
      waist_cm REAL,
      body_fat_percent REAL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (weight_kg IS NOT NULL OR waist_cm IS NOT NULL OR body_fat_percent IS NOT NULL)
    );

    CREATE TABLE IF NOT EXISTS ai_runs (
      id TEXT PRIMARY KEY,
      task_type TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
      duration_ms INTEGER NOT NULL,
      input_hash TEXT NOT NULL,
      error_code TEXT,
      prompt_version TEXT NOT NULL,
      prompt_tokens INTEGER,
      completion_tokens INTEGER,
      total_tokens INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS action_cards (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      card_date TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('fuel', 'workout', 'recovery', 'logging', 'reflection')),
      title TEXT NOT NULL,
      action_text TEXT NOT NULL,
      rationale TEXT NOT NULL,
      confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
      source TEXT NOT NULL CHECK (source IN ('rules', 'ai_enhanced')),
      valid_until TEXT NOT NULL,
      input_snapshot TEXT NOT NULL DEFAULT '{}',
      candidate_snapshot TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'dismissed', 'replaced', 'expired')),
      response_reason TEXT,
      ai_run_id TEXT REFERENCES ai_runs(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS food_assist_sessions (
      id TEXT PRIMARY KEY,
      context TEXT NOT NULL CHECK (context IN ('pre_workout', 'post_workout', 'general')),
      workout_id TEXT REFERENCES workout_sessions(id) ON DELETE SET NULL,
      minutes_until_workout INTEGER,
      image_url TEXT NOT NULL,
      recognized_items TEXT NOT NULL DEFAULT '[]',
      confirmed_items TEXT NOT NULL DEFAULT '[]',
      primary_suggestion TEXT,
      alternative_suggestion TEXT,
      status TEXT NOT NULL CHECK (status IN ('recognized', 'confirmed', 'suggested', 'saved')),
      meal_id TEXT REFERENCES user_meals(id) ON DELETE SET NULL,
      ai_run_id TEXT REFERENCES ai_runs(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_experiments (
      id TEXT PRIMARY KEY,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      title TEXT NOT NULL,
      variable_key TEXT NOT NULL,
      instruction TEXT NOT NULL,
      hypothesis TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('proposed', 'active', 'completed', 'skipped', 'cancelled')),
      baseline_snapshot TEXT NOT NULL DEFAULT '{}',
      result_snapshot TEXT NOT NULL DEFAULT '{}',
      accepted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(session_date, session_time DESC);
    CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status, session_date);
    CREATE INDEX IF NOT EXISTS idx_workout_exercises_session ON workout_exercises(session_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id, set_index);
    CREATE INDEX IF NOT EXISTS idx_body_metrics_date ON body_metrics(metric_date DESC);
    CREATE INDEX IF NOT EXISTS idx_action_cards_date ON action_cards(card_date, status);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_action_cards_one_active ON action_cards(card_date) WHERE status = 'active';
    CREATE INDEX IF NOT EXISTS idx_food_assist_created ON food_assist_sessions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_runs_created ON ai_runs(created_at DESC, task_type);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_experiments_one_active ON weekly_experiments(status) WHERE status = 'active';
    `)

  const profileColumns = new Set(
    (database.prepare("PRAGMA table_info(user_profiles)").all() as Array<{ name: string }>).map(column => column.name)
  )
  const profileMigrations = [
    ["birthday", "ALTER TABLE user_profiles ADD COLUMN birthday TEXT"],
    ["gender", "ALTER TABLE user_profiles ADD COLUMN gender TEXT"],
    ["height", "ALTER TABLE user_profiles ADD COLUMN height REAL"],
    ["weight", "ALTER TABLE user_profiles ADD COLUMN weight REAL"],
    ["target_weight", "ALTER TABLE user_profiles ADD COLUMN target_weight REAL"],
    ["weekly_goal", "ALTER TABLE user_profiles ADD COLUMN weekly_goal REAL NOT NULL DEFAULT 0.5"],
    ["activity_level", "ALTER TABLE user_profiles ADD COLUMN activity_level TEXT NOT NULL DEFAULT 'moderate'"],
    ["weight_goal", "ALTER TABLE user_profiles ADD COLUMN weight_goal TEXT NOT NULL DEFAULT 'maintain'"],
    ["training_days_goal", "ALTER TABLE user_profiles ADD COLUMN training_days_goal INTEGER NOT NULL DEFAULT 3"],
    ["training_experience", "ALTER TABLE user_profiles ADD COLUMN training_experience TEXT NOT NULL DEFAULT 'beginner'"],
    ["available_equipment", "ALTER TABLE user_profiles ADD COLUMN available_equipment TEXT NOT NULL DEFAULT '[]'"],
    ["dietary_preferences", "ALTER TABLE user_profiles ADD COLUMN dietary_preferences TEXT NOT NULL DEFAULT '[]'"],
    ["allergies", "ALTER TABLE user_profiles ADD COLUMN allergies TEXT NOT NULL DEFAULT '[]'"],
    ["ai_consent_at", "ALTER TABLE user_profiles ADD COLUMN ai_consent_at TEXT"],
  ] as const
  for (const [column, sql] of profileMigrations) {
    if (!profileColumns.has(column)) database.exec(sql)
  }

  const now = new Date().toISOString()
  database.prepare(`
    INSERT OR IGNORE INTO user_profiles (
      id, username, daily_calorie_goal, daily_protein_goal,
      daily_carbs_goal, daily_fats_goal, created_at, updated_at
    ) VALUES (1, '本地用户', 1800, 50, 250, 65, ?, ?)
  `).run(now, now)

    const builtins = [
      ["10000000-0000-4000-8000-000000000001", "居家全身基础", "strength", "无需器械的全身训练", [{ name: "自重深蹲", category: "strength", muscle_group: "下肢", sets: 3, reps: 10 }, { name: "斜板俯卧撑", category: "strength", muscle_group: "胸部", sets: 3, reps: 8 }, { name: "臀桥", category: "strength", muscle_group: "臀腿", sets: 3, reps: 12 }, { name: "死虫", category: "strength", muscle_group: "核心", sets: 3, reps: 8 }]],
      ["10000000-0000-4000-8000-000000000002", "健身房全身基础", "strength", "器械和自由重量全身训练", [{ name: "高脚杯深蹲", category: "strength", muscle_group: "下肢", sets: 3, reps: 10 }, { name: "器械推胸", category: "strength", muscle_group: "胸部", sets: 3, reps: 10 }, { name: "坐姿划船", category: "strength", muscle_group: "背部", sets: 3, reps: 10 }, { name: "罗马尼亚硬拉", category: "strength", muscle_group: "臀腿", sets: 3, reps: 8 }]],
      ["10000000-0000-4000-8000-000000000003", "上肢基础", "strength", "上肢推拉基础组合", [{ name: "器械推胸", category: "strength", muscle_group: "胸部", sets: 3, reps: 10 }, { name: "高位下拉", category: "strength", muscle_group: "背部", sets: 3, reps: 10 }, { name: "哑铃肩推", category: "strength", muscle_group: "肩部", sets: 3, reps: 10 }, { name: "坐姿划船", category: "strength", muscle_group: "背部", sets: 3, reps: 10 }]],
      ["10000000-0000-4000-8000-000000000004", "下肢基础", "strength", "下肢基础力量训练", [{ name: "腿举", category: "strength", muscle_group: "下肢", sets: 3, reps: 10 }, { name: "罗马尼亚硬拉", category: "strength", muscle_group: "臀腿", sets: 3, reps: 8 }, { name: "反向箭步蹲", category: "strength", muscle_group: "下肢", sets: 3, reps: 8 }, { name: "站姿提踵", category: "strength", muscle_group: "小腿", sets: 3, reps: 12 }]],
      ["10000000-0000-4000-8000-000000000005", "20 分钟稳定有氧", "cardio", "自行车、跑步机或椭圆机", [{ name: "稳定有氧", category: "cardio", muscle_group: null, sets: 1, duration_seconds: 1200 }]],
      ["10000000-0000-4000-8000-000000000006", "10 分钟活动与拉伸", "mobility", "适合低精力或酸痛时的轻量活动", [{ name: "全身动态热身", category: "mobility", muscle_group: null, sets: 1, duration_seconds: 300 }, { name: "轻柔拉伸", category: "mobility", muscle_group: null, sets: 1, duration_seconds: 300 }]],
    ] as const
    const insertTemplate = database.prepare(`
      INSERT OR IGNORE INTO workout_templates
        (id, name, workout_type, description, exercises_json, is_builtin, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `)
    for (const [id, name, type, description, exercises] of builtins) {
      insertTemplate.run(id, name, type, description, JSON.stringify(exercises), now, now)
    }

      database.exec("PRAGMA user_version = 1")
    }

    if (currentVersion < 2) {
      database.exec(`
        DROP INDEX IF EXISTS idx_action_cards_one_active;
        UPDATE action_cards
        SET status = 'replaced', updated_at = '${new Date().toISOString()}'
        WHERE status = 'active'
          AND id <> (SELECT id FROM action_cards WHERE status = 'active' ORDER BY created_at DESC LIMIT 1);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_action_cards_one_active ON action_cards(status) WHERE status = 'active';
        PRAGMA user_version = 2;
      `)
    }

    if (currentVersion < 3) {
      const foodAssistColumns = new Set(
        (database.prepare("PRAGMA table_info(food_assist_sessions)").all() as Array<{ name: string }>).map(column => column.name)
      )
      if (!foodAssistColumns.has("uncertainties")) {
        database.exec("ALTER TABLE food_assist_sessions ADD COLUMN uncertainties TEXT NOT NULL DEFAULT '[]'")
      }
      database.exec("PRAGMA user_version = 3")
    }

    if (currentVersion < 4) {
      // Invalidate cached advice in the same transaction as its source records.
      for (const table of ["user_meals", "daily_checkins", "workout_sessions", "user_profiles"]) {
        for (const operation of ["INSERT", "UPDATE", "DELETE"]) {
          database.exec(`CREATE TRIGGER invalidate_actions_${table}_${operation.toLowerCase()}
            AFTER ${operation} ON ${table} BEGIN
              UPDATE action_cards SET status = 'replaced', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE status = 'active';
            END`)
        }
      }
      database.exec("PRAGMA user_version = 4")
    }

    if (currentVersion < 5) {
      database.exec(`
        DROP INDEX IF EXISTS idx_action_cards_one_active;
        CREATE UNIQUE INDEX idx_action_cards_one_active ON action_cards(card_date) WHERE status = 'active';
        PRAGMA user_version = 5;
      `)
    }

    database.exec("COMMIT")
  } catch (error) {
    database.exec("ROLLBACK")
    throw error
  }
}

export function getDatabase(): DatabaseSync {
  if (!globalDatabase.snapcalDatabase) {
    const databasePath = getDatabasePath()
    mkdirSync(dirname(databasePath), { recursive: true })
    const database = new DatabaseSync(databasePath)
    initializeDatabase(database)
    globalDatabase.snapcalDatabase = database
  }
  return globalDatabase.snapcalDatabase
}

export function closeDatabase(): void {
  globalDatabase.snapcalDatabase?.close()
  delete globalDatabase.snapcalDatabase
}

function normalizeMeal(row: Record<string, unknown>): MealRecord {
  return {
    ...row,
    ingredients: jsonParse<string[]>(row.ingredients, []),
  } as MealRecord
}

function normalizeProfile(row: Record<string, unknown>): ProfileRecord {
  return {
    ...row,
    available_equipment: jsonParse<string[]>(row.available_equipment, []),
    dietary_preferences: jsonParse<string[]>(row.dietary_preferences, []),
    allergies: jsonParse<string[]>(row.allergies, []),
  } as ProfileRecord
}

function normalizeAnalysis(row: Record<string, unknown>): AnalysisRecord {
  return {
    ...row,
    ingredients: jsonParse<string[]>(row.ingredients, []),
    raw_analysis_response: jsonParse(row.raw_analysis_response, null),
    file_metadata: jsonParse(row.file_metadata, null),
  } as AnalysisRecord
}

function insertRecord(table: "user_meals" | "meal_analysis_results", record: Record<string, unknown>): void {
  const columns = Object.keys(record)
  const placeholders = columns.map(() => "?").join(", ")
  const values = Object.values(record).map(value => value === undefined ? null : value) as SQLInputValue[]
  getDatabase().prepare(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`
  ).run(...values)
}

function buildAnalysisRecord(input: AnalysisInput, id: string = randomUUID(), mealId: string | null = null) {
  const now = new Date().toISOString()
  return {
    ...input,
    id,
    meal_id: mealId,
    raw_analysis_response: jsonValue(input.raw_analysis_response),
    ingredients: jsonValue(input.ingredients || []),
    file_metadata: jsonValue(input.file_metadata),
    base_calories: input.calories,
    base_protein: input.protein,
    base_carbohydrates: input.carbohydrates,
    base_fats: input.fats,
    base_fiber: input.fiber,
    base_sugar: input.sugar,
    base_sodium: input.sodium,
    base_calcium: input.calcium,
    base_iron: input.iron,
    base_cholesterol: input.cholesterol,
    base_saturated_fat: input.saturated_fat,
    base_trans_fat: input.trans_fat,
    base_potassium: input.potassium,
    base_vitamin_c: input.vitamin_c,
    base_vitamin_a: input.vitamin_a,
    base_vitamin_d: input.vitamin_d,
    base_vitamin_e: input.vitamin_e,
    created_at: now,
    updated_at: now,
  }
}

export const localDb = {
  getProfile(): ProfileRecord {
    return normalizeProfile(getDatabase().prepare("SELECT * FROM user_profiles WHERE id = 1").get() as Record<string, unknown>)
  },

  updateProfile(updates: Partial<Omit<ProfileRecord, "id" | "created_at" | "updated_at">>): ProfileRecord {
    const allowed = new Set([
      "username", "avatar_url", "birthday", "gender", "height", "weight",
      "target_weight", "weekly_goal", "activity_level", "weight_goal",
      "daily_calorie_goal", "daily_protein_goal", "daily_carbs_goal", "daily_fats_goal",
      "training_days_goal", "training_experience", "available_equipment", "dietary_preferences",
      "allergies", "ai_consent_at",
    ])
    const jsonFields = new Set(["available_equipment", "dietary_preferences", "allergies"])
    const entries = Object.entries(updates)
      .filter(([key, value]) => allowed.has(key) && value !== undefined)
      .map(([key, value]) => [key, jsonFields.has(key) ? jsonValue(value) : value] as const)
    if (entries.length > 0) {
      const setClause = entries.map(([key]) => `${key} = ?`).join(", ")
      const values = entries.map(([, value]) => value) as SQLInputValue[]
      getDatabase().prepare(
        `UPDATE user_profiles SET ${setClause}, updated_at = ? WHERE id = 1`
      ).run(...values, new Date().toISOString())
    }
    return this.getProfile()
  },

  listMeals(options: {
    date?: string
    startDate?: string
    endDate?: string
    mealType?: string
    search?: string
    sortBy?: "meal_date" | "meal_time" | "created_at" | "calories"
    sortOrder?: "asc" | "desc"
    limit?: number
    offset?: number
  } = {}): { meals: MealRecord[]; total: number } {
    const conditions: string[] = []
    const values: SQLInputValue[] = []
    if (options.date) {
      conditions.push("meal_date = ?")
      values.push(options.date)
    }
    if (options.startDate) {
      conditions.push("meal_date >= ?")
      values.push(options.startDate)
    }
    if (options.endDate) {
      conditions.push("meal_date <= ?")
      values.push(options.endDate)
    }
    if (options.mealType) {
      conditions.push("meal_type = ?")
      values.push(options.mealType)
    }
    if (options.search) {
      conditions.push("meal_name LIKE ? ESCAPE '\\'")
      values.push(`%${options.search.replace(/[\\%_]/g, "\\$&")}%`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
    const totalRow = getDatabase().prepare(
      `SELECT COUNT(*) AS count FROM user_meals ${where}`
    ).get(...values) as { count: number }

    const sortBy = options.sortBy || "meal_time"
    const sortOrder = options.sortOrder === "asc" ? "ASC" : "DESC"
    const pagination = options.limit === undefined ? "" : " LIMIT ? OFFSET ?"
    const paginationValues = options.limit === undefined ? [] : [options.limit, options.offset ?? 0]
    const rows = getDatabase().prepare(
      `SELECT * FROM user_meals ${where} ORDER BY ${sortBy} ${sortOrder}${pagination}`
    ).all(...values, ...paginationValues) as Record<string, unknown>[]

    return { meals: rows.map(normalizeMeal), total: Number(totalRow.count) }
  },

  getMeal(id: string): MealRecord | null {
    const row = getDatabase().prepare("SELECT * FROM user_meals WHERE id = ?").get(id) as Record<string, unknown> | undefined
    return row ? normalizeMeal(row) : null
  },

  createMeal(input: MealInput): MealRecord {
    const now = new Date().toISOString()
    const record = {
      ...input,
      id: randomUUID(),
      image_url: input.image_url || null,
      ingredients: jsonValue(input.ingredients || []),
      created_at: now,
      updated_at: now,
    }
    insertRecord("user_meals", record)
    return this.getMeal(record.id)!
  },

  createMealWithAnalysis(input: MealInput, analysisId: string): MealRecord {
    const database = getDatabase()
    database.exec("BEGIN IMMEDIATE")
    try {
      if (!database.prepare("SELECT id FROM meal_analysis_results WHERE id = ?").get(analysisId)) {
        throw new Error("分析结果不存在")
      }
      const meal = this.createMeal(input)
      database.prepare(
        "UPDATE meal_analysis_results SET meal_id = ?, updated_at = ? WHERE id = ?"
      ).run(meal.id, new Date().toISOString(), analysisId)
      database.exec("COMMIT")
      return meal
    } catch (error) {
      database.exec("ROLLBACK")
      throw error
    }
  },

  createMeals(inputs: MealInput[]): MealRecord[] {
    const database = getDatabase()
    database.exec("BEGIN IMMEDIATE")
    try {
      const meals = inputs.map(input => this.createMeal(input))
      database.exec("COMMIT")
      return meals
    } catch (error) {
      database.exec("ROLLBACK")
      throw error
    }
  },

  updateMeal(id: string, updates: Partial<MealInput>): MealRecord | null {
    if (!this.getMeal(id)) return null
    const allowed = new Set([
      "meal_name", "meal_type", "meal_date", "meal_time", "calories", "protein", "carbs", "fats",
      "image_url", "ingredients", "confidence", "fiber", "sugar", "sodium", "calcium", "vitamin_c",
      "iron", "cholesterol", "saturated_fat", "trans_fat", "potassium", "vitamin_a", "vitamin_d", "vitamin_e",
    ])
    const entries = Object.entries(updates)
      .filter(([key, value]) => allowed.has(key) && value !== undefined)
      .map(([key, value]) => [key, key === "ingredients" ? jsonValue(value) : value] as const)
    if (entries.length > 0) {
      const setClause = entries.map(([key]) => `${key} = ?`).join(", ")
      const values = entries.map(([, value]) => value) as SQLInputValue[]
      getDatabase().prepare(
        `UPDATE user_meals SET ${setClause}, updated_at = ? WHERE id = ?`
      ).run(...values, new Date().toISOString(), id)
    }
    return this.getMeal(id)
  },

  deleteMeal(id: string): boolean {
    return Number(getDatabase().prepare("DELETE FROM user_meals WHERE id = ?").run(id).changes) > 0
  },

  deleteMealWithAnalyses(id: string): { deleted: boolean; imageUrls: string[] } {
    const database = getDatabase()
    database.exec("BEGIN IMMEDIATE")
    try {
      const meal = database.prepare("SELECT id FROM user_meals WHERE id = ?").get(id)
      if (!meal) {
        database.exec("ROLLBACK")
        return { deleted: false, imageUrls: [] }
      }
      const analyses = database.prepare(
        "SELECT raw_image_url AS imageUrl FROM meal_analysis_results WHERE meal_id = ?"
      ).all(id) as Array<{ imageUrl: string | null }>
      database.prepare("DELETE FROM meal_analysis_results WHERE meal_id = ?").run(id)
      database.prepare("DELETE FROM user_meals WHERE id = ?").run(id)
      database.exec("COMMIT")
      return { deleted: true, imageUrls: analyses.flatMap(({ imageUrl }) => imageUrl ? [imageUrl] : []) }
    } catch (error) {
      database.exec("ROLLBACK")
      throw error
    }
  },

  getAnalysis(id: string): AnalysisRecord | null {
    const row = getDatabase().prepare("SELECT * FROM meal_analysis_results WHERE id = ?").get(id) as Record<string, unknown> | undefined
    return row ? normalizeAnalysis(row) : null
  },

  findAnalysisByHash(imageHash: string): AnalysisRecord | null {
    const row = getDatabase().prepare(
      "SELECT * FROM meal_analysis_results WHERE image_hash = ? ORDER BY created_at DESC LIMIT 1"
    ).get(imageHash) as Record<string, unknown> | undefined
    return row ? normalizeAnalysis(row) : null
  },

  createAnalysis(input: AnalysisInput): AnalysisRecord {
    const record = buildAnalysisRecord(input)
    insertRecord("meal_analysis_results", record)
    return this.getAnalysis(record.id)!
  },

  replaceAnalysis(id: string, input: AnalysisInput): AnalysisRecord {
    const existing = this.getAnalysis(id)
    if (!existing) return this.createAnalysis(input)
    const database = getDatabase()
    database.exec("BEGIN IMMEDIATE")
    try {
      database.prepare("DELETE FROM meal_analysis_results WHERE id = ?").run(id)
      insertRecord("meal_analysis_results", buildAnalysisRecord(input, id, existing.meal_id))
      database.exec("COMMIT")
      return this.getAnalysis(id)!
    } catch (error) {
      database.exec("ROLLBACK")
      throw error
    }
  },

  updateAnalysis(id: string, updates: Partial<AnalysisRecord>): AnalysisRecord | null {
    if (!this.getAnalysis(id)) return null
    const allowed = new Set([
      "meal_id", "raw_image_url", "raw_analysis_response", "food_name", "confidence_score", "ingredients",
      "calories", "protein", "carbohydrates", "fats", "fiber", "sugar", "sodium", "calcium", "iron",
      "cholesterol", "saturated_fat", "trans_fat", "potassium", "vitamin_c", "vitamin_a", "vitamin_d",
      "vitamin_e", "portion_multiplier", "analysis_duration", "api_version", "model_version",
      "analysis_status", "file_metadata",
    ])
    const entries = Object.entries(updates)
      .filter(([key, value]) => allowed.has(key) && value !== undefined)
      .map(([key, value]) => [
        key,
        key === "ingredients" || key === "raw_analysis_response" || key === "file_metadata" ? jsonValue(value) : value,
      ] as const)
    if (entries.length > 0) {
      const setClause = entries.map(([key]) => `${key} = ?`).join(", ")
      const values = entries.map(([, value]) => value) as SQLInputValue[]
      getDatabase().prepare(
        `UPDATE meal_analysis_results SET ${setClause}, updated_at = ? WHERE id = ?`
      ).run(...values, new Date().toISOString(), id)
    }
    return this.getAnalysis(id)
  },

  deleteAnalysis(id: string): boolean {
    return Number(getDatabase().prepare("DELETE FROM meal_analysis_results WHERE id = ?").run(id).changes) > 0
  },

  pruneUnlinkedAnalyses(before: string): string[] {
    const database = getDatabase()
    database.exec("BEGIN IMMEDIATE")
    try {
      const rows = database.prepare(
        "SELECT raw_image_url AS imageUrl FROM meal_analysis_results WHERE meal_id IS NULL AND created_at < ?"
      ).all(before) as Array<{ imageUrl: string | null }>
      database.prepare(
        "DELETE FROM meal_analysis_results WHERE meal_id IS NULL AND created_at < ?"
      ).run(before)
      database.exec("COMMIT")
      return rows.flatMap(({ imageUrl }) => imageUrl ? [imageUrl] : [])
    } catch (error) {
      database.exec("ROLLBACK")
      throw error
    }
  },
}
