import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("wellness schema and validation foundation", async t => {
  const directory = mkdtempSync(join(tmpdir(), "snapcal-wellness-"))
  process.env.SNAPCAL_DB_PATH = join(directory, "snapcal.db")
  const { closeDatabase, getDatabase, localDb } = await import("../lib/local-db")
  const { bodyMetricSchema, checkinSchema, workoutInputSchema } = await import("../lib/wellness-schemas")

  try {
    await t.test("migrates the local database and seeds six built-in templates", () => {
      const database = getDatabase()
      const version = database.prepare("PRAGMA user_version").get() as { user_version: number }
      const templates = database.prepare("SELECT COUNT(*) AS count FROM workout_templates WHERE is_builtin = 1").get() as { count: number }
      assert.equal(version.user_version, 1)
      assert.equal(Number(templates.count), 6)
      assert.doesNotThrow(() => database.prepare("SELECT * FROM action_cards LIMIT 1").all())
      assert.doesNotThrow(() => database.prepare("SELECT * FROM weekly_experiments LIMIT 1").all())
    })

    await t.test("round-trips JSON profile settings", () => {
      const profile = localDb.updateProfile({
        training_days_goal: 4,
        available_equipment: ["哑铃", "瑜伽垫"],
        dietary_preferences: ["少乳糖"],
        allergies: ["花生"],
      })
      assert.equal(profile.training_days_goal, 4)
      assert.deepEqual(profile.available_equipment, ["哑铃", "瑜伽垫"])
      assert.deepEqual(profile.allergies, ["花生"])
    })

    await t.test("rejects incomplete workout sets and invalid wellness metrics", () => {
      const baseWorkout = {
        session_date: "2026-09-03",
        session_time: "18:00:00",
        title: "测试训练",
        workout_type: "strength",
        status: "completed",
        source: "manual",
        exercises: [{
          order_index: 0,
          name: "深蹲",
          category: "strength",
          sets: [{ set_index: 0, set_type: "working", completed: true }],
        }],
      }
      assert.equal(workoutInputSchema.safeParse(baseWorkout).success, false)
      assert.equal(checkinSchema.safeParse({ energy: 0, hunger: 3, soreness: 3 }).success, false)
      assert.equal(bodyMetricSchema.safeParse({ notes: "没有指标" }).success, false)
      assert.equal(bodyMetricSchema.safeParse({ weight_kg: 70 }).success, true)
    })
  } finally {
    closeDatabase()
    rmSync(directory, { recursive: true, force: true })
  }
})
