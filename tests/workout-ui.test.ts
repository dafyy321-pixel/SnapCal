import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { emptyWorkout, renumberExercises, workoutFromTemplate, workoutInputFromRecord } from "../lib/workout-ui"
import type { WorkoutRecord, WorkoutTemplateRecord } from "../lib/wellness-types"

const template: WorkoutTemplateRecord = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "基础训练",
  workout_type: "strength",
  description: "测试",
  is_builtin: true,
  created_at: "",
  updated_at: "",
  exercises: [{
    order_index: 7,
    name: "深蹲",
    category: "strength",
    sets: [{ set_index: 5, set_type: "working", reps: 10, weight_kg: null, duration_seconds: null, distance_meters: null, rpe: null, completed: true }],
  }],
}

test("workout UI helpers and pages", async t => {
  await t.test("creates an editable blank workout", () => {
    const result = emptyWorkout("2099-09-03", "18:00:00")
    assert.equal(result.status, "completed")
    assert.deepEqual(result.exercises, [])
  })

  await t.test("copies a template without carrying completion state", () => {
    const result = workoutFromTemplate(template, "2099-09-03", "18:00:00")
    assert.equal(result.template_id, template.id)
    assert.equal(result.exercises[0].sets[0].completed, false)
    assert.equal(template.exercises[0].sets[0].completed, true)
  })

  await t.test("renumbers reordered exercises and sets", () => {
    const source = workoutFromTemplate(template, "2099-09-03", "18:00:00")
    source.exercises[0].order_index = 9
    source.exercises[0].sets[0].set_index = 9
    const result = renumberExercises(source.exercises)
    assert.equal(result[0].order_index, 0)
    assert.equal(result[0].sets[0].set_index, 0)
  })

  await t.test("removes persisted IDs when copying a workout", () => {
    const input = workoutFromTemplate(template, "2099-09-03", "18:00:00")
    const record = { ...input, id: "workout", created_at: "", updated_at: "", exercises: input.exercises.map(exercise => ({ ...exercise, id: "exercise", session_id: "workout", sets: exercise.sets.map(set => ({ ...set, id: "set", exercise_id: "exercise" })) })) } as WorkoutRecord
    const copied = workoutInputFromRecord(record, { session_date: "2099-09-04", template_id: null }, true)
    assert.equal(copied.session_date, "2099-09-04")
    assert.equal(copied.template_id, null)
    assert.equal(copied.exercises[0].sets[0].completed, false)
    assert.equal("id" in copied.exercises[0], false)
  })

  await t.test("exposes all required workout entry points", () => {
    const newPage = readFileSync("app/workouts/new/page.tsx", "utf8")
    const detailPage = readFileSync("app/workouts/[id]/page.tsx", "utf8")
    const templatesPage = readFileSync("app/templates/page.tsx", "utf8")
    assert.match(newPage, /空白训练/)
    assert.match(newPage, /复制上次/)
    assert.match(newPage, /训练模板/)
    assert.match(detailPage, /训练后搭配/)
    assert.match(templatesPage, /新建自定义模板/)
  })
})
