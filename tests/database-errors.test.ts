import test from "node:test"
import assert from "node:assert/strict"
import { NextRequest } from "next/server"
import { errorResponse } from "../lib/error-handler"
import { emptyWorkout } from "../lib/workout-ui"

test("real node:sqlite errors distinguish conflicts, missing references and database faults", async () => {
  process.env.SNAPCAL_DB_PATH = ":memory:"
  const { getDatabase, localDb, closeDatabase } = await import("../lib/local-db")
  const workouts = await import("../app/api/workouts/route")
  const workout = await import("../app/api/workouts/[id]/route")
  const meals = await import("../app/api/meals/route")
  const request = (path: string, body: unknown) => new NextRequest(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  const missing = "00000000-0000-4000-8000-000000000001"
  try {
    const db = getDatabase()
    db.exec("CREATE TABLE error_test (id TEXT PRIMARY KEY, name TEXT UNIQUE); INSERT INTO error_test VALUES ('a', 'first');")
    for (const sql of ["INSERT INTO error_test VALUES ('a', 'second')", "INSERT INTO error_test VALUES ('b', 'first')"]) {
      let caught: unknown
      try { db.exec(sql) } catch (error) { caught = error }
      assert.equal((caught as { code: string }).code, "ERR_SQLITE_ERROR")
      assert.equal(errorResponse(caught).status, 409)
    }
    let fault: unknown
    try { db.exec("SELECT * FROM nonexistent_table") } catch (error) { fault = error }
    assert.equal(errorResponse(fault).status, 500)
    const input = emptyWorkout("2026-09-08", "12:00:00")
    assert.equal((await workouts.POST(request("/api/workouts", { ...input, template_id: missing }))).status, 404)
    const { data: { workout: created } } = await (await workouts.POST(request("/api/workouts", input))).json()
    assert.equal((await workout.PATCH(request(`/api/workouts/${created.id}`, { template_id: missing }), { params: Promise.resolve({ id: created.id }) })).status, 404)
    const response = await meals.POST(request("/api/meals", { analysis_id: missing, meal_name: "午餐", meal_date: "2026-09-08", meal_type: "lunch", calories: 100, protein: 1, carbs: 20, fats: 1 }))
    assert.equal(response.status, 404)
    assert.equal(localDb.listMeals().total, 0)
  } finally { closeDatabase() }
})
