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
  } catch {
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
    return getDatabase().prepare("SELECT * FROM user_profiles WHERE id = 1").get() as ProfileRecord
  },

  updateProfile(updates: Partial<Omit<ProfileRecord, "id" | "created_at" | "updated_at">>): ProfileRecord {
    const allowed = new Set([
      "username", "avatar_url", "birthday", "gender", "height", "weight",
      "target_weight", "weekly_goal", "activity_level", "weight_goal",
      "daily_calorie_goal", "daily_protein_goal", "daily_carbs_goal", "daily_fats_goal",
    ])
    const entries = Object.entries(updates).filter(([key, value]) => allowed.has(key) && value !== undefined)
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
}
