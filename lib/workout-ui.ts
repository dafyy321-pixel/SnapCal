import type { WorkoutInput, WorkoutRecord, WorkoutTemplateRecord } from "./wellness-types"

export function emptyWorkout(date: string, time: string): WorkoutInput {
  return {
    session_date: date,
    session_time: time,
    title: "今天的训练",
    workout_type: "strength",
    status: "completed",
    source: "manual",
    template_id: null,
    duration_minutes: null,
    perceived_effort: null,
    energy_after: null,
    notes: null,
    exercises: [],
  }
}

export function workoutFromTemplate(template: WorkoutTemplateRecord, date: string, time: string): WorkoutInput {
  return {
    ...emptyWorkout(date, time),
    title: template.name,
    workout_type: template.workout_type,
    source: "template",
    template_id: template.id,
    exercises: template.exercises.map((exercise, exerciseIndex) => ({
      ...exercise,
      order_index: exerciseIndex,
      sets: exercise.sets.map((set, setIndex) => ({ ...set, set_index: setIndex, completed: false })),
    })),
  }
}

export function renumberExercises(exercises: WorkoutInput["exercises"]): WorkoutInput["exercises"] {
  return exercises.map((exercise, exerciseIndex) => ({
    ...exercise,
    order_index: exerciseIndex,
    sets: exercise.sets.map((set, setIndex) => ({ ...set, set_index: setIndex })),
  }))
}

export function workoutInputFromRecord(record: WorkoutRecord, overrides: Partial<Pick<WorkoutInput, "session_date" | "session_time" | "source" | "template_id">> = {}, resetSets = false): WorkoutInput {
  return {
    session_date: overrides.session_date || record.session_date,
    session_time: overrides.session_time || record.session_time,
    title: record.title,
    workout_type: record.workout_type,
    status: record.status,
    source: overrides.source || record.source,
    template_id: overrides.template_id === undefined ? record.template_id : overrides.template_id,
    duration_minutes: record.duration_minutes,
    perceived_effort: record.perceived_effort,
    energy_after: record.energy_after,
    notes: record.notes,
    exercises: record.exercises.map(exercise => ({
      order_index: exercise.order_index,
      name: exercise.name,
      category: exercise.category,
      muscle_group: exercise.muscle_group,
      notes: exercise.notes,
      sets: exercise.sets.map(set => ({
        set_index: set.set_index,
        set_type: set.set_type,
        reps: set.reps,
        weight_kg: set.weight_kg,
        duration_seconds: set.duration_seconds,
        distance_meters: set.distance_meters,
        rpe: set.rpe,
        completed: resetSets ? false : set.completed,
      })),
    })),
  }
}
