import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("Asia/Shanghai midnight keeps meals, workouts and actions on the local date", async () => {
  const directory = mkdtempSync(join(tmpdir(), "snapcal-timezone-"))
  process.env.SNAPCAL_DB_PATH = join(directory, "snapcal.db")
  const { localDateParts } = await import("../lib/date-utils")
  const { closeDatabase, localDb } = await import("../lib/local-db")
  const { wellnessDb } = await import("../lib/wellness-db")
  const { buildActionCandidates } = await import("../lib/action-engine")

  try {
    const beforeMidnight = localDateParts(new Date("2026-09-03T15:59:59.000Z"))
    const afterMidnight = localDateParts(new Date("2026-09-03T16:00:00.000Z"))
    assert.deepEqual(beforeMidnight, { date: "2026-09-03", time: "23:59:59" })
    assert.deepEqual(afterMidnight, { date: "2026-09-04", time: "00:00:00" })

    localDb.createMeal({
      meal_date: afterMidnight.date,
      meal_time: afterMidnight.time,
      meal_type: "snack",
      meal_name: "跨日加餐",
      calories: 100,
      protein: 2,
      carbs: 20,
      fats: 1,
      image_url: null,
      ingredients: [],
      confidence: 1,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      calcium: 0,
      vitamin_c: 0,
      iron: 0,
      cholesterol: 0,
      saturated_fat: 0,
      trans_fat: 0,
      potassium: 0,
      vitamin_a: 0,
      vitamin_d: 0,
      vitamin_e: 0,
    })
    wellnessDb.createWorkout({
      session_date: afterMidnight.date,
      session_time: afterMidnight.time,
      title: "跨日训练",
      workout_type: "mobility",
      status: "completed",
      source: "manual",
      duration_minutes: 10,
      exercises: [],
    })
    const action = buildActionCandidates({
      date: afterMidnight.date,
      currentTime: afterMidnight.time,
      meals: [],
      workouts: [],
      weeklyCompletedWorkouts: 0,
      trainingDaysGoal: 3,
      checkin: null,
    })[0]
    wellnessDb.createAction({
      candidate_id: action.id,
      card_date: afterMidnight.date,
      kind: action.kind,
      title: action.title,
      action_text: action.action_text,
      rationale: "跨日测试",
      confidence: "high",
      source: "rules",
      valid_until: action.valid_until,
      input_snapshot: {},
      candidate_snapshot: [action],
      response_reason: null,
      ai_run_id: null,
    })

    assert.equal(localDb.listMeals({ date: "2026-09-03" }).total, 0)
    assert.equal(wellnessDb.listWorkouts({ date: "2026-09-03" }).length, 0)
    assert.equal(wellnessDb.getActiveAction("2026-09-03"), null)
    assert.equal(localDb.listMeals({ date: "2026-09-04" }).total, 1)
    assert.equal(wellnessDb.listWorkouts({ date: "2026-09-04" }).length, 1)
    assert.equal(wellnessDb.getActiveAction("2026-09-04")?.card_date, "2026-09-04")
    assert.equal(action.valid_until, "2026-09-04T15:59:59.000Z")
  } finally {
    closeDatabase()
    rmSync(directory, { recursive: true, force: true })
  }
})
