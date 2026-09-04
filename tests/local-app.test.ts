import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const meal = {
  meal_name: "测试餐食",
  meal_type: "lunch" as const,
  meal_date: "2026-09-02",
  meal_time: "12:30:00",
  calories: 500,
  protein: 25,
  carbs: 60,
  fats: 18,
  image_url: null,
  ingredients: ["米饭", "蔬菜"],
  confidence: 90,
  fiber: 4,
  sugar: 3,
  sodium: 500,
  calcium: 80,
  vitamin_c: 12,
  iron: 3,
  cholesterol: 20,
  saturated_fat: 4,
  trans_fat: 0,
  potassium: 400,
  vitamin_a: 30,
  vitamin_d: 2,
  vitamin_e: 5,
}

const analysis = {
  image_hash: "a".repeat(64),
  raw_image_url: "/api/images/00000000-0000-0000-0000-000000000000.jpg",
  raw_analysis_response: { mock: true },
  food_name: "测试分析",
  confidence_score: 90,
  ingredients: ["食材"],
  calories: 200,
  protein: 10,
  carbohydrates: 30,
  fats: 5,
  fiber: 2,
  sugar: 3,
  sodium: 100,
  calcium: 20,
  iron: 1,
  cholesterol: 4,
  saturated_fat: 1,
  trans_fat: 0,
  potassium: 50,
  vitamin_c: 6,
  vitamin_a: 7,
  vitamin_d: 8,
  vitamin_e: 9,
  portion_multiplier: 1,
  analysis_duration: 10,
  api_version: "v1",
  model_version: "test",
  analysis_status: "completed",
  file_metadata: { type: "image/jpeg" },
}

test("SnapCal local data regression suite", async t => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "snapcal-test-"))
  process.env.SNAPCAL_DB_PATH = join(temporaryDirectory, "snapcal.db")
  const { closeDatabase, localDb } = await import("../lib/local-db")
  const { analysisService } = await import("../lib/analysis-service")
  const { createMealSchema, dateSchema, timeSchema } = await import("../lib/validation-schemas")
    const { canReuseAnalysis, shouldUseMockAnalysis } = await import("../lib/analysis-mode")
    const { currentStreak } = await import("../lib/date-utils")
    const { contentSecurityPolicy } = await import("../lib/security-headers")
    const { calculateAnalytics, getDateRange } = await import("../app/api/analytics/route")
  try {
    await t.test("initializes a persistent local profile and meal CRUD", () => {
      assert.equal(localDb.getProfile().daily_calorie_goal, 1800)
      assert.equal(localDb.updateProfile({ username: "本地测试用户" }).username, "本地测试用户")
      const created = localDb.createMeal(meal)
      assert.equal(localDb.getMeal(created.id)?.ingredients[0], "米饭")
      assert.equal(localDb.listMeals({ date: meal.meal_date }).total, 1)
      assert.equal(localDb.updateMeal(created.id, { calories: 520 })?.calories, 520)
      assert.equal(localDb.deleteMeal(created.id), true)
      assert.equal(localDb.getMeal(created.id), null)
    })

    await t.test("rolls back the complete batch when one meal is invalid", () => {
      const before = localDb.listMeals().total
      assert.throws(() => localDb.createMeals([
        meal,
        { ...meal, meal_name: "无效餐食", meal_type: "invalid" as typeof meal.meal_type },
      ]))
      assert.equal(localDb.listMeals().total, before)
    })

    await t.test("does not truncate internal meal queries at 1000 rows", () => {
      localDb.createMeals(Array.from({ length: 1001 }, (_, index) => ({
        ...meal,
        meal_name: `批量餐食 ${index}`,
      })))
      const result = localDb.listMeals()
      assert.equal(result.total, 1001)
      assert.equal(result.meals.length, 1001)
    })

    await t.test("deduplicates by full hash and adjusts every nutrient from immutable base values", async () => {
      const created = await analysisService.createAnalysisResult(analysis)
      assert.equal((await analysisService.findByHash(analysis.image_hash))?.id, created.id)
      const doubled = await analysisService.adjustPortion(created.id, 2)
      assert.equal(doubled.calories, 400)
      assert.equal(doubled.vitamin_e, 18)
      const halved = await analysisService.adjustPortion(created.id, 0.5)
      assert.equal(halved.calories, 100)
      assert.equal(halved.vitamin_e, 4.5)
    })

    await t.test("deletes analyses when their meal is deleted", async () => {
      const linkedMeal = localDb.createMeal(meal)
      const linkedAnalysis = await analysisService.createAnalysisResult({ ...analysis, image_hash: "b".repeat(64) })
      await analysisService.linkToMeal(linkedAnalysis.id, linkedMeal.id)
      assert.equal(localDb.deleteMealWithAnalyses(linkedMeal.id).deleted, true)
      assert.equal(localDb.getAnalysis(linkedAnalysis.id), null)
    })

    await t.test("creates a meal and links its analysis in one transaction", async () => {
      const linkedAnalysis = await analysisService.createAnalysisResult({ ...analysis, image_hash: "c".repeat(64) })
      const linkedMeal = localDb.createMealWithAnalysis(meal, linkedAnalysis.id)
      assert.equal(localDb.getAnalysis(linkedAnalysis.id)?.meal_id, linkedMeal.id)
    })

    await t.test("prunes expired analyses that were never saved as meals", async () => {
      const abandoned = await analysisService.createAnalysisResult({ ...analysis, image_hash: "d".repeat(64) })
      const imageUrls = localDb.pruneUnlinkedAnalyses(new Date(Date.now() + 1000).toISOString())
      assert.ok(imageUrls.includes(analysis.raw_image_url))
      assert.equal(localDb.getAnalysis(abandoned.id), null)
    })

    await t.test("rejects impossible calendar dates and clock times", () => {
      assert.equal(dateSchema.safeParse("2026-02-29").success, false)
      assert.equal(dateSchema.safeParse("2024-02-29").success, true)
      assert.equal(timeSchema.safeParse("25:00").success, false)
      assert.equal(createMealSchema.safeParse({ ...meal, meal_date: "2026-13-10" }).success, false)
      assert.equal(createMealSchema.safeParse({ ...meal, calories: 0 }).success, true)
      assert.equal(createMealSchema.safeParse({ ...meal, id: crypto.randomUUID() }).success, false)
      assert.equal(createMealSchema.safeParse({ ...meal, image_url: "https://example.com/food.jpg" }).success, false)
    })

    await t.test("averages over the complete date range and computes only a current streak", () => {
      const current = localDb.createMeal({ ...meal, meal_date: "2026-09-01", calories: 500 })
      const previous = localDb.createMeal({ ...meal, meal_date: "2026-08-30", calories: 200 })
      const range = {
        startDate: "2026-09-01",
        endDate: "2026-09-02",
        prevStartDate: "2026-08-30",
        prevEndDate: "2026-08-31",
      }
      const result = calculateAnalytics([current], [previous], "本周", 1800, range)
      assert.equal(result.stats.avgCalories, 250)
      assert.equal(result.stats.prevCalories, 100)
      assert.equal(result.recordCount, 1)
      assert.equal(currentStreak(["2026-09-02", "2026-09-01"], "2026-09-02"), 2)
      assert.equal(currentStreak(["2026-08-20", "2026-08-19"], "2026-09-02"), 0)

      const input = new Date(2026, 8, 2, 15)
      getDateRange("本周", input)
      assert.equal(input.getHours(), 15)
    })

    await t.test("uses local analysis automatically when no API key exists", () => {
      delete process.env.USE_MOCK_ANALYSIS
      assert.equal(shouldUseMockAnalysis(false, undefined), true)
      assert.equal(shouldUseMockAnalysis(false, "configured"), false)
      assert.equal(shouldUseMockAnalysis(true, "configured"), true)
    })

    await t.test("does not reuse an analysis from another model or forced request", () => {
      assert.equal(canReuseAnalysis({ model_version: "local-mock-v1" }, false, "configured-model"), false)
      assert.equal(canReuseAnalysis({ model_version: "configured-model" }, false, "configured-model"), true)
      assert.equal(canReuseAnalysis({ model_version: "configured-model" }, true, "configured-model"), false)
    })

    await t.test("allows React development tooling without weakening the production CSP", () => {
      const developmentPolicy = contentSecurityPolicy("development")
      const productionPolicy = contentSecurityPolicy("production")
      assert.match(developmentPolicy, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/)
      assert.match(productionPolicy, /script-src 'self' 'unsafe-inline'/)
      assert.doesNotMatch(productionPolicy, /unsafe-eval|strict-dynamic|nonce-/)
    })
  } finally {
    closeDatabase()
    rmSync(temporaryDirectory, { recursive: true, force: true })
  }
})
