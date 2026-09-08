import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { NextRequest } from "next/server"

function upload(context = "general", extra?: [string, string]) {
  const form = new FormData()
  form.append("image", new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "food.png", { type: "image/png" }))
  form.append("context", context)
  if (extra) form.append(...extra)
  return new NextRequest("http://localhost/api/food-assist", { method: "POST", body: form })
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
}

test("food action assistant", async t => {
  const directory = mkdtempSync(join(tmpdir(), "snapcal-food-assist-"))
  process.env.SNAPCAL_DB_PATH = join(directory, "snapcal.db")
  delete process.env.OPENAI_API_KEY
  delete process.env.DOUBAO_API_KEY
  delete process.env.USE_MOCK_ANALYSIS
  const create = await import("../app/api/food-assist/route")
  const sessionRoute = await import("../app/api/food-assist/[id]/route")
  const draftRoute = await import("../app/api/food-assist/[id]/meal-draft/route")
  const mealsRoute = await import("../app/api/meals/route")
  const { closeDatabase, localDb } = await import("../lib/local-db")
  const { deleteImage, imageNameFromUrl } = await import("../lib/local-images")
  let imageUrl: string | null = null

  try {
    await t.test("does not invent food results without AI configuration", async () => {
      const response = await create.POST(upload())
      assert.equal(response.status, 503)
      assert.equal((await response.json() as { error: { code: string } }).error.code, "AI_NOT_CONFIGURED")
    })

    await t.test("strictly validates creation fields", async () => {
      process.env.USE_MOCK_ANALYSIS = "true"
      assert.equal((await create.POST(upload("invalid"))).status, 400)
      assert.equal((await create.POST(upload("general", ["unknown", "value"]))).status, 400)
    })

    let sessionId = ""
    let recognized: Array<{ id: string; name: string; confidence: number; nutrition_known: boolean }> = []
    await t.test("creates only a pending recognition session", async () => {
      const response = await create.POST(upload("post_workout"))
      assert.equal(response.status, 201)
      const body = await response.json() as { data: { session: { id: string; image_url: string; status: string; recognized_items: typeof recognized; confirmed_items: unknown[] } } }
      sessionId = body.data.session.id
      imageUrl = body.data.session.image_url
      recognized = body.data.session.recognized_items
      assert.equal(body.data.session.status, "recognized")
      assert.equal(body.data.session.confirmed_items.length, 0)
      assert.equal(localDb.listMeals().total, 0)
    })

    await t.test("refuses a meal draft before confirmation", async () => {
      const response = await draftRoute.POST(jsonRequest({}), { params: Promise.resolve({ id: sessionId }) })
      assert.equal(response.status, 409)
    })

    await t.test("confirms edited items and generates two local pairings", async () => {
      localDb.updateProfile({ allergies: ["花生"], ai_consent_at: null })
      const confirmed = [
        { ...recognized[0], name: "花生", portion_hint: null },
        { ...recognized[1], name: "香蕉", portion_hint: "一份" },
      ]
      const response = await sessionRoute.PATCH(jsonRequest({ confirmed_items: confirmed }), { params: Promise.resolve({ id: sessionId }) })
      const body = await response.json() as { data: { session: { status: string; primary_suggestion: { item_ids: string[]; cautions: string[] }; alternative_suggestion: unknown } } }
      assert.equal(body.data.session.status, "suggested")
      assert.equal(Boolean(body.data.session.alternative_suggestion), true)
      assert.equal(body.data.session.primary_suggestion.item_ids.includes(confirmed[0].id), false)
      assert.match(body.data.session.primary_suggestion.cautions.join(""), /花生/)
    })

    await t.test("AI cannot reintroduce excluded allergens in either suggestion", async () => {
      const { suggestFoodPairings } = await import("../lib/food-assist-service")
      const { wellnessDb } = await import("../lib/wellness-db")
      const session = wellnessDb.getFoodAssist(sessionId)!
      const originalFetch = globalThis.fetch
      process.env.OPENAI_API_KEY = "test"
      process.env.OPENAI_MODEL = "test"
      localDb.updateProfile({ ai_consent_at: new Date().toISOString() })
      try {
        for (const unsafeSide of ["primary", "alternative"]) {
          globalThis.fetch = async (_url, init) => {
            const sent = JSON.parse(String(init?.body))
            assert.doesNotMatch(sent.messages[0].content, new RegExp(session.confirmed_items[0].id))
            const safe = { title: "搭配", item_ids: [session.confirmed_items[1].id], portion_hints: [], rationale: "按需选择", cautions: [] }
            return Response.json({ choices: [{ message: { content: JSON.stringify({ primary: safe, alternative: safe, [unsafeSide]: { ...safe, item_ids: [session.confirmed_items[0].id] } }) } }] })
          }
          const result = await suggestFoodPairings(session, localDb.getProfile(), { workout: null, today_nutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 } })
          assert.equal(result.ai_run_id, null)
          assert.deepEqual(result.primary.item_ids, [session.confirmed_items[1].id])
          assert.deepEqual(result.alternative.item_ids, [session.confirmed_items[1].id])
        }
      } finally {
        globalThis.fetch = originalFetch
        delete process.env.OPENAI_API_KEY
        delete process.env.OPENAI_MODEL
        localDb.updateProfile({ ai_consent_at: null })
      }
    })

    await t.test("returns the confirmed session", async () => {
      const response = await sessionRoute.GET(new Request("http://localhost"), { params: Promise.resolve({ id: sessionId }) })
      assert.equal(response.status, 200)
      assert.equal((await response.json() as { data: { session: { id: string } } }).data.session.id, sessionId)
    })

    await t.test("creates a nutrition-unconfirmed meal draft without saving it", async () => {
      const response = await draftRoute.POST(jsonRequest({ meal_date: "2099-09-03", meal_type: "dinner" }), { params: Promise.resolve({ id: sessionId }) })
      const body = await response.json() as { data: { draft: { calories: null; meal_type: string; requires_nutrition_confirmation: boolean } } }
      assert.equal(body.data.draft.calories, null)
      assert.equal(body.data.draft.meal_type, "dinner")
      assert.equal(body.data.draft.requires_nutrition_confirmation, true)
      assert.equal(localDb.listMeals().total, 0)
    })

    await t.test("links the session only after a confirmed meal is saved", async () => {
      const mealResponse = await mealsRoute.POST(new NextRequest("http://localhost/api/meals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ meal_name: "香蕉", meal_type: "snack", meal_date: "2099-09-03", meal_time: "12:00:00", calories: 100, protein: 1, carbs: 25, fats: 0 }),
      }))
      const mealId = (await mealResponse.json() as { data: { meal: { id: string } } }).data.meal.id
      const linked = await sessionRoute.PATCH(jsonRequest({ status: "saved", meal_id: mealId }), { params: Promise.resolve({ id: sessionId }) })
      const body = await linked.json() as { data: { session: { status: string; meal_id: string } } }
      assert.equal(body.data.session.status, "saved")
      assert.equal(body.data.session.meal_id, mealId)
    })
  } finally {
    if (imageUrl) {
      const name = imageNameFromUrl(imageUrl)
      if (name) await deleteImage(name)
    }
    delete process.env.USE_MOCK_ANALYSIS
    closeDatabase()
    rmSync(directory, { recursive: true, force: true })
  }
})
