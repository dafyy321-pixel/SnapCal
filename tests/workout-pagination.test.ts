import test from "node:test"
import assert from "node:assert/strict"
import { NextRequest } from "next/server"
import { emptyWorkout } from "../lib/workout-ui"

test("workout API expands only the SQL page using four queries", async () => {
  process.env.SNAPCAL_DB_PATH = ":memory:"
  const { getDatabase, closeDatabase } = await import("../lib/local-db")
  const { wellnessDb } = await import("../lib/wellness-db")
  const { GET } = await import("../app/api/workouts/route")
  const db = getDatabase()
  const prepare = db.prepare
  try {
    for (let i = 0; i < 1000; i++) wellnessDb.createWorkout({ ...emptyWorkout(i % 2 ? "2026-09-08" : "2026-09-07", "12:00:00"), exercises: [{ order_index: 0, name: `动作 ${i}`, category: "strength", sets: [{ set_index: 0, set_type: "working", reps: 10, completed: true }] }] })
    let queries = 0
    db.prepare = function (...args) { queries++; return prepare.apply(this, args) }
    const response = await GET(new NextRequest("http://localhost/api/workouts?limit=1&offset=1&date=2026-09-08"))
    assert.equal(response.status, 200)
    const { data } = await response.json()
    assert.equal(queries, 4)
    assert.equal(data.workouts.length, 1)
    assert.equal(data.workouts[0].exercises[0].sets[0].completed, true)
    assert.equal(data.pagination.total, 500)
    assert.equal(data.pagination.has_more, true)
    const first = wellnessDb.listWorkouts({ date: "2026-09-08", limit: 1 })[0]
    assert.notEqual(first.id, data.workouts[0].id)
    assert.deepEqual(wellnessDb.listWorkouts({ date: "2026-09-08", limit: 1, offset: 500 }), [])
    assert.equal(wellnessDb.listWorkouts().length, 1000)
  } finally { db.prepare = prepare; closeDatabase() }
})
