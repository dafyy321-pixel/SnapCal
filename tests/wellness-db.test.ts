import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("wellness repositories", async t => {
  const directory = mkdtempSync(join(tmpdir(), "snapcal-wellness-db-"))
  process.env.SNAPCAL_DB_PATH = join(directory, "snapcal.db")
  const { closeDatabase, getDatabase } = await import("../lib/local-db")
  const { wellnessDb } = await import("../lib/wellness-db")

  try {
    const workoutInput = {
      session_date: "2026-09-03",
      session_time: "18:00:00",
      title: "全身训练",
      workout_type: "strength" as const,
      status: "completed" as const,
      source: "manual" as const,
      duration_minutes: 45,
      exercises: [{
        order_index: 0,
        name: "深蹲",
        category: "strength" as const,
        sets: [{ set_index: 0, set_type: "working" as const, reps: 10, weight_kg: 40, completed: true }],
      }],
    }

    await t.test("creates, updates and cascades a nested workout", () => {
      const workout = wellnessDb.createWorkout(workoutInput)
      assert.equal(workout.exercises[0].sets[0].weight_kg, 40)
      assert.equal(wellnessDb.listWorkouts({ date: "2026-09-03" }).length, 1)
      assert.equal(wellnessDb.updateWorkout(workout.id, { title: "更新后的训练" })?.title, "更新后的训练")
      assert.equal(wellnessDb.deleteWorkout(workout.id), true)
      const childCount = getDatabase().prepare("SELECT COUNT(*) AS count FROM workout_exercises").get() as { count: number }
      assert.equal(Number(childCount.count), 0)
    })

    await t.test("protects built-in templates and supports custom templates", () => {
      const builtIn = wellnessDb.listTemplates().find(template => template.is_builtin)!
      assert.equal(builtIn.exercises.length > 0, true)
      assert.equal(wellnessDb.deleteTemplate(builtIn.id), false)
      const custom = wellnessDb.createTemplate({ name: "我的训练", workout_type: "strength", description: "", exercises: workoutInput.exercises })
      assert.equal(custom.is_builtin, false)
      assert.equal(wellnessDb.deleteTemplate(custom.id), true)
    })

    await t.test("upserts one check-in and body metric per date", () => {
      wellnessDb.upsertCheckin("2026-09-03", { energy: 3, hunger: 2, soreness: 4, sleep_hours: 7, sleep_quality: 3, notes: null })
      assert.equal(wellnessDb.upsertCheckin("2026-09-03", { energy: 4, hunger: 2, soreness: 2, sleep_hours: 8, sleep_quality: 4, notes: null }).energy, 4)
      wellnessDb.upsertBodyMetric("2026-09-03", { weight_kg: 70, waist_cm: null, body_fat_percent: null, notes: null })
      assert.equal(wellnessDb.upsertBodyMetric("2026-09-03", { weight_kg: 69.5, waist_cm: 80, body_fat_percent: null, notes: null }).weight_kg, 69.5)
    })

    await t.test("keeps only one active action card per date", () => {
      const candidate = { id: "checkin", kind: "logging" as const, priority: 100, title: "状态打卡", action_text: "完成打卡", rationale_codes: ["missing_checkin"], valid_until: "2026-09-04T00:00:00.000Z", payload: {} }
      const common = { candidate_id: candidate.id, card_date: "2026-09-03", kind: candidate.kind, title: candidate.title, action_text: candidate.action_text, rationale: "需要状态信息", confidence: "high" as const, source: "rules" as const, valid_until: candidate.valid_until, input_snapshot: {}, candidate_snapshot: [candidate], response_reason: null, ai_run_id: null }
      const first = wellnessDb.createAction(common)
      const second = wellnessDb.createAction({ ...common, title: "新的行动" })
      assert.equal(wellnessDb.getActiveAction("2026-09-03")?.id, second.id)
      const old = getDatabase().prepare("SELECT status FROM action_cards WHERE id = ?").get(first.id) as { status: string }
      assert.equal(old.status, "replaced")
    })
  } finally {
    closeDatabase()
    rmSync(directory, { recursive: true, force: true })
  }
})
