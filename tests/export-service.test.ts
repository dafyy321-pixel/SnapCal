import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { NextRequest } from "next/server"

test("完整 JSON 与分类 CSV 导出", async t => {
  const directory = mkdtempSync(join(tmpdir(), "snapcal-export-"))
  process.env.SNAPCAL_DB_PATH = join(directory, "snapcal.db")
  const { closeDatabase, localDb } = await import("../lib/local-db")
  const { wellnessDb } = await import("../lib/wellness-db")
  const { buildCategoryCsv, buildExportBundle, csvCell } = await import("../lib/export-service")
  const route = await import("../app/api/export/route")
  try {
    localDb.updateProfile({ username: "=测试用户", allergies: ["花生"] })
    localDb.createMeal({ meal_date: "2026-09-04", meal_time: "08:00:00", meal_type: "breakfast", meal_name: "+燕麦", calories: 300, protein: 10, carbs: 50, fats: 6, image_url: null, ingredients: [], confidence: 0.9, fiber: 0, sugar: 0, sodium: 0, calcium: 0, vitamin_c: 0, iron: 0, cholesterol: 0, saturated_fat: 0, trans_fat: 0, potassium: 0, vitamin_a: 0, vitamin_d: 0, vitamin_e: 0 })
    wellnessDb.createWorkout({ session_date: "2026-09-04", session_time: "18:00:00", title: "全身训练", workout_type: "strength", status: "completed", source: "manual", duration_minutes: 30, perceived_effort: 7, energy_after: 4, notes: null, exercises: [{ order_index: 0, name: "深蹲", category: "strength", muscle_group: "腿", notes: null, sets: [{ set_index: 0, set_type: "working", reps: 8, weight_kg: 40, completed: true }] }] })
    wellnessDb.upsertCheckin("2026-09-04", { energy: 4, hunger: 3, soreness: 2 })
    wellnessDb.upsertBodyMetric("2026-09-04", { weight_kg: 70 })

    await t.test("JSON 包含全部核心领域且不包含密钥", () => {
      const bundle = buildExportBundle("all")
      assert.equal(bundle.workouts[0].exercises[0].sets[0].weight_kg, 40)
      assert.equal(bundle.checkins.length, 1)
      assert.equal(bundle.body_metrics.length, 1)
      assert.ok("action_cards" in bundle && "experiments" in bundle)
      assert.doesNotMatch(JSON.stringify(bundle), /OPENAI_API_KEY|DOUBAO_API_KEY/)
    })

    await t.test("CSV 防止公式注入并展开训练组次", () => {
      assert.equal(csvCell("=1+1"), "'=1+1")
      assert.equal(csvCell("@SUM(A1)"), "'@SUM(A1)")
      assert.match(buildCategoryCsv(buildExportBundle("all"), "meals"), /'\+燕麦/)
      assert.match(buildCategoryCsv(buildExportBundle("all"), "workouts"), /深蹲,0,working,8,40/)
    })

    await t.test("导出接口严格校验分类", async () => {
      const invalid = await route.GET(new NextRequest("http://localhost/api/export?format=csv&category=unknown"))
      assert.equal(invalid.status, 400)
      const response = await route.GET(new NextRequest("http://localhost/api/export?format=json"))
      const body = await response.json() as { data: { content: string } }
      assert.equal(response.status, 200)
      assert.match(body.data.content, /"workouts"/)
    })
  } finally {
    closeDatabase()
    rmSync(directory, { recursive: true, force: true })
  }
})
