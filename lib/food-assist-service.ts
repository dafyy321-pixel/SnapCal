import { randomUUID } from "node:crypto"
import { z } from "zod"
import { getAiConfig } from "./ai-config"
import { createChatCompletion } from "./openai-client"
import type { FoodAssistItem, FoodAssistRecord, FoodSuggestion } from "./wellness-types"

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
    uncertainties: result.data.uncertainties,
  }
}

function localSuggestions(session: FoodAssistRecord, allergies: string[]): { primary: FoodSuggestion; alternative: FoodSuggestion } {
  const blocked = session.confirmed_items.filter(item => allergies.some(allergy => item.name.includes(allergy)))
  const usable = session.confirmed_items.filter(item => !blocked.includes(item))
  const mainItems = usable.slice(0, 3)
  const alternativeItems = usable.length > 1 ? [...usable].reverse().slice(0, 2) : usable
  const cautions = blocked.length ? [`已记录过敏信息，请避开：${blocked.map(item => item.name).join("、")}`] : []
  const copy = {
    pre_workout: ["训练前轻量搭配", "距训练较近时优先选择自己容易消化的少量食物。"],
    post_workout: ["训练后基础搭配", "从现有食材中组合一餐，并记得补水。"],
    general: ["今天的简单搭配", "优先使用已经确认、容易准备的食材。"],
  }[session.context]
  const build = (title: string, items: FoodAssistItem[], rationale: string): FoodSuggestion => ({
    title,
    item_ids: items.map(item => item.id),
    portion_hints: items.map(item => item.portion_hint || "按实际可用份量"),
    rationale,
    cautions,
  })
  return {
    primary: build(copy[0], mainItems, copy[1]),
    alternative: build("更省事的替代方案", alternativeItems, "如果主方案不方便，可先用更少的食材完成一餐。"),
  }
}

export async function suggestFoodPairings(session: FoodAssistRecord, profile: { dietary_preferences: string[]; allergies: string[]; ai_consent_at: string | null }) {
  const fallback = localSuggestions(session, profile.allergies)
  const config = getAiConfig()
  if (!profile.ai_consent_at || !config.apiKey || !config.textModel) return fallback
  try {
    const result = await createChatCompletion({
      capability: "text",
      taskType: "food_pairing",
      promptVersion: "food-pairing-v1",
      logInput: { context: session.context, item_count: session.confirmed_items.length },
      schema: suggestionSchema,
      messages: [{
        role: "user",
        content: `根据已确认食材生成主方案和替代方案，只能使用给出的 item id；不提供补剂或精确克数。返回 JSON。${JSON.stringify({ context: session.context, items: session.confirmed_items, dietary_preferences: profile.dietary_preferences, allergies: profile.allergies })}`,
      }],
    })
    const ids = new Set(session.confirmed_items.map(item => item.id))
    if ([...result.data.primary.item_ids, ...result.data.alternative.item_ids].some(id => !ids.has(id))) return fallback
    return result.data
  } catch {
    return fallback
  }
}
