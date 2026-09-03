import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { NextRequest } from "next/server"
import type { DailyCheckinRecord, WorkoutRecord } from "../lib/wellness-types"

const date = "2099-09-03"
const checkin: DailyCheckinRecord = {
  checkin_date: date,
  energy: 3,
  hunger: 3,
  soreness: 2,
  sleep_hours: 7,
  sleep_quality: 3,
  notes: null,
  created_at: "",
  updated_at: "",
}

function workout(status: WorkoutRecord["status"], time: string, id: string = status): WorkoutRecord {
  return {
    id,
    session_date: date,
    session_time: time,
    title: "训练",
    workout_type: "strength",
    status,
    source: "manual",
    template_id: null,
    duration_minutes: 30,
    perceived_effort: 6,
    energy_after: null,
    notes: null,
    exercises: [],
    created_at: "",
    updated_at: "",
  }
}

function request(body: unknown) {
  return new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
}

test("action card engine", async t => {
  const directory = mkdtempSync(join(tmpdir(), "snapcal-actions-"))
  process.env.SNAPCAL_DB_PATH = join(directory, "snapcal.db")
  delete process.env.OPENAI_API_KEY
  delete process.env.DOUBAO_API_KEY
  const { buildActionCandidates, generateActionCard } = await import("../lib/action-engine")
  const { closeDatabase, localDb } = await import("../lib/local-db")
  const actions = await import("../app/api/actions/route")
  const generate = await import("../app/api/actions/generate/route")
  const action = await import("../app/api/actions/[id]/route")

  const facts = {
    date,
    currentTime: "18:00:00",
    meals: [] as Array<{ meal_time: string }>,
    workouts: [] as WorkoutRecord[],
    weeklyCompletedWorkouts: 0,
    trainingDaysGoal: 3,
    checkin,
  }

  try {
    await t.test("prioritizes a missing check-in", () => {
      const candidates = buildActionCandidates({ ...facts, checkin: null })
      assert.equal(candidates[0].id, "complete-checkin")
    })

    await t.test("offers post-workout food help only before a later meal", () => {
      const recent = workout("completed", "17:00:00", "recent")
      assert.match(buildActionCandidates({ ...facts, workouts: [recent] })[0].id, /^post-workout-fuel:/)
      assert.equal(buildActionCandidates({ ...facts, workouts: [recent], meals: [{ meal_time: "17:30:00" }] }).some(item => item.id.startsWith("post-workout-fuel:")), false)
    })

    await t.test("offers pre-workout food help for high hunger", () => {
      const candidates = buildActionCandidates({ ...facts, checkin: { ...checkin, hunger: 5 }, workouts: [workout("planned", "19:00:00", "next")] })
      assert.match(candidates[0].id, /^pre-workout-fuel:/)
    })

    await t.test("offers a lighter workout choice for low energy", () => {
      const candidates = buildActionCandidates({ ...facts, checkin: { ...checkin, energy: 2 }, workouts: [workout("planned", "19:00:00", "next")] })
      assert.equal(candidates.some(item => item.id.startsWith("adjust-workout:")), true)
      assert.doesNotMatch(candidates.map(item => item.action_text).join(" "), /安全|危险/)
    })

    await t.test("offers a short template when below the weekly goal", () => {
      assert.equal(buildActionCandidates(facts)[0].id, "short-workout")
    })

    await t.test("falls back to a low-noise reflection", () => {
      const candidates = buildActionCandidates({ ...facts, weeklyCompletedWorkouts: 3 })
      assert.deepEqual(candidates.map(item => item.id), ["daily-reflection"])
    })

    await t.test("never compensates food for a skipped workout", () => {
      const candidates = buildActionCandidates({ ...facts, workouts: [workout("skipped", "17:00:00")] })
      const text = candidates.map(item => `${item.title} ${item.action_text}`).join(" ")
      assert.doesNotMatch(text, /少吃|抵消|补偿|削减下一餐/)
    })

    await t.test("rejects an unknown AI candidate and uses rule priority", async () => {
      const card = await generateActionCard(date, {
        force: true,
        now: { date, time: "18:00:00" },
        selector: async () => ({ candidate_id: "invented", rationale: "test", confidence: "high" }),
      })
      assert.equal(card.candidate_id, "complete-checkin")
      assert.equal(card.source, "rules")
    })

    await t.test("generates one active card through the API without AI", async () => {
      localDb.updateProfile({ ai_consent_at: null })
      const first = await generate.POST(request({ date, force: true }))
      assert.equal(first.status, 200)
      const firstBody = await first.json() as { data: { action_card: { id: string } } }
      const listed = await actions.GET(new NextRequest(`http://localhost/api/actions?date=${date}`))
      assert.equal((await listed.json() as { data: { action_card: { id: string } } }).data.action_card.id, firstBody.data.action_card.id)
    })

    await t.test("records action feedback and validates status", async () => {
      const active = await (await actions.GET(new NextRequest(`http://localhost/api/actions?date=${date}`))).json() as { data: { action_card: { id: string } } }
      const context = { params: Promise.resolve({ id: active.data.action_card.id }) }
      const invalid = await action.PATCH(request({ status: "edited" }), context)
      assert.equal(invalid.status, 400)
      const completed = await action.PATCH(request({ status: "completed", reason: "已完成" }), context)
      assert.equal(completed.status, 200)
      assert.equal((await completed.json() as { data: { action_card: { status: string } } }).data.action_card.status, "completed")
    })
  } finally {
    closeDatabase()
    rmSync(directory, { recursive: true, force: true })
  }
})
