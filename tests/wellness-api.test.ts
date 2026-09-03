import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { NextRequest } from "next/server"

function jsonRequest(url: string, method: string, body: unknown) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function data(response: Response) {
  return response.json() as Promise<{ success: boolean; data?: Record<string, any>; error?: { code: string } }>
}

test("wellness API routes", async t => {
  const directory = mkdtempSync(join(tmpdir(), "snapcal-wellness-api-"))
  process.env.SNAPCAL_DB_PATH = join(directory, "snapcal.db")
  const { closeDatabase } = await import("../lib/local-db")
  const workouts = await import("../app/api/workouts/route")
  const workout = await import("../app/api/workouts/[id]/route")
  const templates = await import("../app/api/workout-templates/route")
  const template = await import("../app/api/workout-templates/[id]/route")
  const checkin = await import("../app/api/checkins/[date]/route")
  const metrics = await import("../app/api/body-metrics/route")
  const metric = await import("../app/api/body-metrics/[date]/route")
  const day = await import("../app/api/day/route")

  const workoutInput = {
    session_date: "2026-09-03",
    session_time: "18:00:00",
    title: "全身训练",
    workout_type: "strength",
    status: "completed",
    source: "manual",
    duration_minutes: 45,
    exercises: [{
      order_index: 0,
      name: "深蹲",
      category: "strength",
      sets: [{ set_index: 0, set_type: "working", reps: 10, weight_kg: 40, completed: true }],
    }],
  }

  try {
    let workoutId = ""
    await t.test("creates, filters and validates workouts", async () => {
      const invalid = await workouts.POST(jsonRequest("http://localhost/api/workouts", "POST", { ...workoutInput, extra: true }))
      assert.equal(invalid.status, 400)

      const created = await workouts.POST(jsonRequest("http://localhost/api/workouts", "POST", workoutInput))
      assert.equal(created.status, 201)
      const createdBody = await data(created)
      workoutId = createdBody.data!.workout.id

      const listed = await workouts.GET(new NextRequest("http://localhost/api/workouts?date=2026-09-03&limit=1"))
      const listedBody = await data(listed)
      assert.equal(listedBody.data!.workouts.length, 1)
      assert.equal(listedBody.data!.pagination.total, 1)
    })

    await t.test("reads, updates and deletes a workout", async () => {
      const context = { params: Promise.resolve({ id: workoutId }) }
      assert.equal((await workout.GET(new Request("http://localhost"), context)).status, 200)
      const updated = await workout.PATCH(jsonRequest("http://localhost", "PATCH", { title: "更新训练" }), context)
      assert.equal((await data(updated)).data!.workout.title, "更新训练")
      assert.equal((await workout.DELETE(new Request("http://localhost"), context)).status, 200)
      assert.equal((await workout.GET(new Request("http://localhost"), context)).status, 404)
    })

    await t.test("protects and copies built-in templates", async () => {
      const listed = await data(await templates.GET())
      const builtIn = listed.data!.templates.find((item: { is_builtin: boolean }) => item.is_builtin)
      const context = { params: Promise.resolve({ id: builtIn.id }) }
      const blocked = await template.DELETE(new Request("http://localhost"), context)
      assert.equal(blocked.status, 409)
      const copied = await template.POST(jsonRequest("http://localhost", "POST", { name: "我的基础模板" }), context)
      assert.equal(copied.status, 201)
      assert.equal((await data(copied)).data!.template.is_builtin, false)
    })

    await t.test("upserts and deletes daily check-ins", async () => {
      const context = { params: Promise.resolve({ date: "2026-09-03" }) }
      const saved = await checkin.PUT(jsonRequest("http://localhost", "PUT", { energy: 4, hunger: 3, soreness: 2 }), context)
      assert.equal(saved.status, 200)
      assert.equal((await data(await checkin.GET(new Request("http://localhost"), context))).data!.checkin.energy, 4)
      assert.equal((await checkin.DELETE(new Request("http://localhost"), context)).status, 200)
      assert.equal((await checkin.GET(new Request("http://localhost"), context)).status, 404)
    })

    await t.test("upserts, lists and validates body metrics", async () => {
      const context = { params: Promise.resolve({ date: "2026-09-03" }) }
      assert.equal((await metric.PUT(jsonRequest("http://localhost", "PUT", { notes: "empty" }), context)).status, 400)
      const saved = await metric.PUT(jsonRequest("http://localhost", "PUT", { weight_kg: 70.2, waist_cm: 82 }), context)
      assert.equal(saved.status, 200)
      const listed = await data(await metrics.GET(new NextRequest("http://localhost/api/body-metrics?start_date=2026-09-01&end_date=2026-09-07")))
      assert.equal(listed.data!.metrics.length, 1)
      assert.equal((await metric.DELETE(new Request("http://localhost"), context)).status, 200)
    })

    await t.test("returns one complete day summary", async () => {
      const created = await workouts.POST(jsonRequest("http://localhost", "POST", workoutInput))
      assert.equal(created.status, 201)
      const context = { params: Promise.resolve({ date: "2026-09-03" }) }
      await checkin.PUT(jsonRequest("http://localhost", "PUT", { energy: 3, hunger: 3, soreness: 3 }), context)
      const response = await day.GET(new NextRequest("http://localhost/api/day?date=2026-09-03"))
      const body = await data(response)
      assert.equal(body.data!.summary.completed_workout_count, 1)
      assert.equal(body.data!.summary.workout_minutes, 45)
      assert.equal(body.data!.checkin.energy, 3)
    })
  } finally {
    closeDatabase()
    rmSync(directory, { recursive: true, force: true })
  }
})
