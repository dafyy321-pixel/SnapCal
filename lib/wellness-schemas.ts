import { z } from "zod"
import { dateSchema, timeSchema } from "./validation-schemas"
import type { CheckinScore } from "./wellness-types"

export const workoutTypeSchema = z.enum(["strength", "cardio", "mobility", "sports", "other"])
export const workoutStatusSchema = z.enum(["planned", "in_progress", "completed", "skipped"])
const nullableNumber = (max: number) => z.coerce.number().finite().nonnegative().max(max).nullable().optional()
const checkinScoreSchema = z.coerce.number().int().min(1).max(5).transform(value => value as CheckinScore)

export const workoutSetSchema = z.object({
  set_index: z.coerce.number().int().min(0).max(200),
  set_type: z.enum(["warmup", "working", "drop", "failure"]).default("working"),
  reps: nullableNumber(10000),
  weight_kg: nullableNumber(2000),
  duration_seconds: nullableNumber(86400),
  distance_meters: nullableNumber(1_000_000),
  rpe: z.coerce.number().min(1).max(10).nullable().optional(),
  completed: z.boolean().default(true),
}).strict().superRefine((value, context) => {
  if (value.completed && [value.reps, value.weight_kg, value.duration_seconds, value.distance_meters].every(item => item == null)) {
    context.addIssue({ code: "custom", message: "完成组至少需要次数、重量、时长或距离之一" })
  }
})

export const workoutExerciseSchema = z.object({
  order_index: z.coerce.number().int().min(0).max(200),
  name: z.string().trim().min(1).max(100),
  category: workoutTypeSchema,
  muscle_group: z.string().trim().max(50).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  sets: z.array(workoutSetSchema).max(100).default([]),
}).strict()

export const workoutInputSchema = z.object({
  session_date: dateSchema,
  session_time: timeSchema,
  title: z.string().trim().min(1).max(100),
  workout_type: workoutTypeSchema,
  status: workoutStatusSchema.default("completed"),
  source: z.enum(["manual", "template", "action"]).default("manual"),
  template_id: z.string().uuid().nullable().optional(),
  duration_minutes: nullableNumber(1440),
  perceived_effort: z.coerce.number().min(1).max(10).nullable().optional(),
  energy_after: checkinScoreSchema.nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  exercises: z.array(workoutExerciseSchema).max(100).default([]),
}).strict()

export const workoutPatchSchema = workoutInputSchema.partial().strict()

export const workoutQuerySchema = z.object({
  date: dateSchema.optional(),
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
  status: workoutStatusSchema.optional(),
  type: workoutTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
  offset: z.coerce.number().int().min(0).default(0),
}).strict()

export const workoutTemplateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  workout_type: workoutTypeSchema,
  description: z.string().trim().max(500).default(""),
  exercises: z.array(workoutExerciseSchema).min(1).max(50),
}).strict()

export const templateCopySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
}).strict()

export const dateParamSchema = z.object({ date: dateSchema }).strict()
export const idParamSchema = z.object({ id: z.string().uuid() }).strict()

export const bodyMetricQuerySchema = z.object({
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
}).strict()

export const checkinSchema = z.object({
  energy: checkinScoreSchema,
  hunger: checkinScoreSchema,
  soreness: checkinScoreSchema,
  sleep_hours: z.coerce.number().min(0).max(24).nullable().optional(),
  sleep_quality: checkinScoreSchema.nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
}).strict()

export const bodyMetricSchema = z.object({
  weight_kg: z.coerce.number().min(20).max(500).nullable().optional(),
  waist_cm: z.coerce.number().min(30).max(300).nullable().optional(),
  body_fat_percent: z.coerce.number().min(1).max(75).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
}).strict().refine(value => [value.weight_kg, value.waist_cm, value.body_fat_percent].some(item => item != null), {
  message: "至少填写一个身体指标",
})

export const actionGenerateSchema = z.object({
  date: dateSchema,
  force: z.boolean().optional(),
}).strict()

export const actionUpdateSchema = z.object({
  status: z.enum(["completed", "dismissed", "replaced"]),
  reason: z.string().trim().max(300).nullable().optional(),
}).strict()

export const foodAssistConfirmSchema = z.object({
  confirmed_items: z.array(z.object({
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(100),
    confidence: z.coerce.number().min(0).max(100),
    portion_hint: z.string().trim().max(100).nullable().default(null),
    nutrition_known: z.boolean(),
  }).strict()).min(1).max(20),
}).strict()

export const foodAssistSaveSchema = z.object({
  status: z.literal("saved"),
  meal_id: z.string().uuid(),
}).strict()

export const foodAssistCreateSchema = z.object({
  context: z.enum(["pre_workout", "post_workout", "general"]),
  workout_id: z.string().uuid().nullable().optional(),
  minutes_until_workout: z.coerce.number().int().min(0).max(1440).nullable().optional(),
}).strict()

export const mealDraftSchema = z.object({
  meal_date: dateSchema.optional(),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
}).strict()

export const experimentUpdateSchema = z.object({
  status: z.enum(["active", "completed", "skipped", "cancelled"]),
  instruction: z.string().trim().min(1).max(500).optional(),
}).strict()
