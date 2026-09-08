import { randomUUID } from "node:crypto"
import { z } from "zod"
import { getAiConfig } from "./ai-config"
import { createChatCompletion } from "./openai-client"
import type { FoodAssistItem, FoodAssistRecord, FoodSuggestion, WorkoutRecord } from "./wellness-types"

type PairingFacts = {
  workout: Pick<WorkoutRecord, "workout_type" | "perceived_effort" | "duration_minutes"> | null
  today_nutrition: { calories: number; protein: number; carbs: number; fats: number }
}

const visionSchema = z.object({
  items: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    confidence: z.number().min(0).max(100),
    portion_hint: z.string().trim().max(100).nullable(),
    nutrition_known: z.boolean(),
  }).strict()).min(1).max(12),
  uncertainties: z.array(z.string().trim().min(1).max(200)).max(12).default([]),
}).strict()

const suggestionSchema = z.object({
  primary: z.object({
    title: z.string().trim().min(1).max(100),
    item_ids: z.array(z.string()).max(12),
    portion_hints: z.array(z.string().max(100)).max(12),
    rationale: z.string().trim().min(1).max(300),
    cautions: z.array(z.string().max(200)).max(10),
  }).strict(),
  alternative: z.object({
    title: z.string().trim().min(1).max(100),
    item_ids: z.array(z.string()).max(12),
    portion_hints: z.array(z.string().max(100)).max(12),
    rationale: z.string().trim().min(1).max(300),
    cautions: z.array(z.string().max(200)).max(10),
  }).strict(),
}).strict()

export async function recognizeFoodInventory(imageUrl: string, logInput: unknown) {
  const result = await createChatCompletion({
    capability: "vision",
    taskType: "food_inventory",
    promptVersion: "inventory-v1",
    logInput,
    schema: visionSchema,
    messages: [{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: imageUrl } },
        { type: "text", text: "识别图片中 1～12 种可见食材。只按可见内容判断，不猜测精确克数。返回 JSON：items（name、confidence 0-100、portion_hint、nutrition_known）和 uncertainties。" },
      ],
    }],
  })
  return {
    items: result.data.items.map(item => ({ ...item, id: randomUUID() })),
    uncertainties: result.data.uncertainties ?? [],
    ai_run_id: result.runId,
  }
}

function localSuggestions(session: FoodAssistRecord, profile: { dietary_preferences: string[]; allergies: string[] }, facts: PairingFacts): { primary: FoodSuggestion; alternative: FoodSuggestion; ai_run_id: null } {
  const blocked = session.confirmed_items.filter(item => isAllergen(item, profile.allergies))
  const usable = session.confirmed_items.filter(item => !blocked.includes(item))
  const mainItems = usable.slice(0, 3)
  const alternativeItems = usable.length > 1 ? [...usable].reverse().slice(0, 2) : usable
  const cautions = [
    ...(blocked.length ? [`已记录过敏信息，请避开：${blocked.map(item => item.name).join("、")}`] : []),
    ...(profile.dietary_preferences.length ? [`按已记录饮食偏好选择：${profile.dietary_preferences.join("、")}`] : []),
  ]
  if (!usable.length) cautions.push("现有食材与过敏信息冲突，请修改确认项后再选择。")
  const effort = facts.workout?.perceived_effort == null ? "" : `，本次主观强度 ${facts.workout.perceived_effort}/10`
  const copy = {
    pre_workout: ["训练前轻量搭配", `${session.minutes_until_workout == null ? "训练前" : `距训练约 ${session.minutes_until_workout} 分钟`}，优先选择自己容易消化的少量食物。`],
    post_workout: ["训练后基础搭配", `完成${facts.workout?.workout_type === "strength" ? "力量" : facts.workout?.workout_type === "cardio" ? "有氧" : "本次"}训练${effort}，从现有食材组合主食、蛋白质并补水。`],
    general: ["今天的简单搭配", `今天已记录约 ${Math.round(facts.today_nutrition.calories)} kcal、蛋白质 ${Math.round(facts.today_nutrition.protein)} g；优先使用容易准备的食材。`],
  }[session.context]
  const build = (title: string, items: FoodAssistItem[], rationale: string): FoodSuggestion => ({
    title,
    item_ids: items.map(item => item.id),
    portion_hints: items.map(item => item.portion_hint || "按实际可用份量"),
    rationale,
    cautions,
  })
  return {
    primary: build(usable.length ? copy[0] : "需要补充可用食材", mainItems, usable.length ? copy[1] : "信息不足，暂不输出强结论。"),
    alternative: build("更省事的替代方案", alternativeItems, "如果主方案不方便，可先用更少的食材完成一餐。"),
    ai_run_id: null,
  }
}

function isAllergen(item: FoodAssistItem, allergies: string[]) {
  const name = item.name.normalize("NFKC").toLocaleLowerCase()
  return allergies.flatMap(value => value.split(/[,，、]/)).map(value => value.trim().normalize("NFKC").toLocaleLowerCase()).filter(Boolean).some(allergy => name.includes(allergy))
}

export async function suggestFoodPairings(session: FoodAssistRecord, profile: { dietary_preferences: string[]; allergies: string[]; ai_consent_at: string | null }, facts: PairingFacts) {
  const fallback = localSuggestions(session, profile, facts)
  const safeItems = session.confirmed_items.filter(item => !isAllergen(item, profile.allergies))
  const config = getAiConfig()
  if (!safeItems.length || !profile.ai_consent_at || !config.apiKey || !config.textModel) return fallback
  try {
    const result = await createChatCompletion({
      capability: "text",
      taskType: "food_pairing",
      promptVersion: "food-pairing-v1",
      logInput: { context: session.context, item_count: session.confirmed_items.length },
      schema: suggestionSchema,
      messages: [{
        role: "user",
        content: `根据已确认食材生成主方案和替代方案，只能使用给出的 item id；结合距训练时间、训练类型与强度、当天营养汇总和饮食限制；信息不足时明确说明，不提供补剂或精确克数。返回 JSON。${JSON.stringify({ context: session.context, minutes_until_workout: session.minutes_until_workout, workout: facts.workout, today_nutrition: facts.today_nutrition, items: safeItems, dietary_preferences: profile.dietary_preferences, allergies: profile.allergies })}`,
      }],
    })
    const ids = new Set(safeItems.map(item => item.id))
    if ([...result.data.primary.item_ids, ...result.data.alternative.item_ids].some(id => !ids.has(id))) return fallback
    return {
      primary: { ...result.data.primary, cautions: [...new Set([...fallback.primary.cautions, ...result.data.primary.cautions])] },
      alternative: { ...result.data.alternative, cautions: [...new Set([...fallback.alternative.cautions, ...result.data.alternative.cautions])] },
      ai_run_id: result.runId,
    }
  } catch {
    return fallback
  }
}
