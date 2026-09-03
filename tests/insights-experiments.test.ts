import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { NextRequest } from "next/server"
import type { MealInput } from "../lib/local-db"

const endDate = "2099-09-03"

function meal(date: string): MealInput {
  return {
    meal_name: "测试餐",
    meal_type: "lunch",
    meal_date: date,
    meal_time: "12:00:00",
    calories: 400,
    protein: 25,
    carbs: 50,
    fats: 10,
    image_url: null,
    ingredients: [],
    confidence: 100,
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
  }
}

function request(body: unknown) {
  return new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
}

test("insights and weekly experiments", async t => {
  const directory = mkdtempSync(join(tmpdir(), "snapcal-insights-"))
  process.env.SNAPCAL_DB_PATH = join(directory, "snapcal.db")
  const { closeDatabase, localDb } = await import("../lib/local-db")
  const { wellnessDb } = await import("../lib/wellness-db")
  const { buildInsights, experimentEligibility, proposeWeeklyExperiment } = await import("../lib/insights-service")
  const insightsRoute = await import("../app/api/insights/route")
  const experimentsRoute = await import("../app/api/experiments/route")
  const experimentRoute = await import("../app/api/experiments/[id]/route")

  try {
    await t.test("explains missing records before proposing an experiment", () => {
      const result = experimentEligibility(endDate)
      assert.equal(result.eligible, false)
      assert.equal(result.missing.length, 3)
    })

    for (const date of ["2099-08-31", "2099-09-01", "2099-09-02", endDate]) localDb.createMeal(meal(date))
    for (const [index, date] of ["2099-09-01", "2099-09-02"].entries()) {
      wellnessDb.createWorkout({
        session_date: date,
        session_time: "18:00:00",
        title: "力量训练",
        workout_type: "strength",
        status: "completed",
        source: "template",
        template_id: "10000000-0000-4000-8000-000000000001",
        duration_minutes: 40,
        perceived_effort: 6 + index,
        exercises: [{
          order_index: 0,
          name: "深蹲",
          category: "strength",
          sets: [{ set_index: 0, set_type: "working", reps: 10, weight_kg: 20, completed: true }],
        }],
      })
    }
    for (const [index, date] of ["2099-09-01", "2099-09-02", endDate].entries()) {
      wellnessDb.upsertCheckin(date, { energy: (3 + index % 2) as 3 | 4, hunger: 3, soreness: 2, sleep_hours: 7, sleep_quality: 3 })
    }
    wellnessDb.upsertBodyMetric("2099-09-02", { weight_kg: 70 })
    wellnessDb.upsertBodyMetric(endDate, { weight_kg: 69.8, body_fat_percent: 18 })

    await t.test("averages nutrition only across recorded days", () => {
      const result = buildInsights("7d", endDate)
      assert.equal(result.nutrition.recorded_days, 4)
      assert.equal(result.nutrition.daily_average?.calories, 400)
    })

    await t.test("calculates structured training metrics", () => {
      const training = buildInsights("7d", endDate).training
      assert.equal(training.completed_sessions, 2)
      assert.equal(training.total_minutes, 80)
      assert.equal(training.volume_kg_reps, 400)
      assert.equal(training.template_completion_rate, 100)
    })

    await t.test("keeps status dimensions and raw body values separate", () => {
      const result = buildInsights("7d", endDate)
      assert.equal(result.status.energy, 3.3)
      assert.equal(result.body_metrics[0].body_fat_percent, null)
      assert.equal("health_score" in result, false)
    })

    await t.test("uses observational rather than causal wording", () => {
      const text = buildInsights("7d", endDate).observations.join(" ")
      assert.match(text, /同期出现|样本较少/)
      assert.doesNotMatch(text, /导致|证明|一定有效/)
    })

    await t.test("becomes eligible at the locked data thresholds", () => {
      assert.equal(experimentEligibility(endDate).eligible, true)
    })

    let experimentId = ""
    await t.test("proposes but does not activate one safe variable", () => {
      const result = proposeWeeklyExperiment(endDate)
      experimentId = result.experiment!.id
      assert.equal(result.experiment!.status, "proposed")
      assert.equal(result.experiment!.variable_key, "meal_protein_source")
      assert.doesNotMatch(`${result.experiment!.instruction} ${result.experiment!.hypothesis}`, /断食|补剂|抵消|快速减重|导致/)
    })

    await t.test("requires an explicit API action to activate", async () => {
      const context = { params: Promise.resolve({ id: experimentId }) }
      const response = await experimentRoute.PATCH(request({ status: "active" }), context)
      assert.equal(response.status, 200)
      assert.equal((await response.json() as { data: { experiment: { status: string; accepted_at: string } } }).data.experiment.status, "active")
    })

    await t.test("returns 409 when another experiment is active", async () => {
      const second = wellnessDb.createExperiment({
        start_date: "2099-09-10",
        end_date: "2099-09-16",
        title: "短训练",
        variable_key: "short_workout",
        instruction: "替换为较短模板",
        hypothesis: "观察同期记录",
        status: "proposed",
        baseline_snapshot: {},
      })
      const response = await experimentRoute.PATCH(request({ status: "active" }), { params: Promise.resolve({ id: second.id }) })
      assert.equal(response.status, 409)
    })

    await t.test("completes an experiment with a result snapshot", async () => {
      const response = await experimentRoute.PATCH(request({ status: "completed" }), { params: Promise.resolve({ id: experimentId }) })
      const body = await response.json() as { data: { experiment: { status: string; result_snapshot: Record<string, number> } } }
      assert.equal(body.data.experiment.status, "completed")
      assert.equal(body.data.experiment.result_snapshot.meal_days, 1)
    })

    await t.test("validates insights and lists experiment history APIs", async () => {
      assert.equal((await insightsRoute.GET(new NextRequest("http://localhost/api/insights?timeframe=year"))).status, 400)
      assert.equal((await experimentsRoute.POST(request({ start_date: "bad" }))).status, 400)
      const listed = await experimentsRoute.GET(new NextRequest("http://localhost/api/experiments?status=completed"))
      assert.equal((await listed.json() as { data: { experiments: unknown[] } }).data.experiments.length, 1)
    })
  } finally {
    closeDatabase()
    rmSync(directory, { recursive: true, force: true })
  }
})
