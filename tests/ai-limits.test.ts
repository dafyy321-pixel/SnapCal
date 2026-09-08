import test from "node:test"
import assert from "node:assert/strict"
import { z } from "zod"

test("all AI tasks share send quota, retry quota, concurrency and in-flight deduplication", async t => {
  process.env.SNAPCAL_DB_PATH = ":memory:"
  process.env.OPENAI_API_KEY = "test"
  process.env.OPENAI_MODEL = "test"
  const { createChatCompletion } = await import("../lib/openai-client")
  const { closeDatabase, localDb } = await import("../lib/local-db")
  localDb.updateProfile({ ai_consent_at: new Date().toISOString() })
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-08T00:00:00Z") })
  const ok = () => Response.json({ choices: [{ message: { content: '{"ok":true}' } }] })
  let sends = 0
  const call = (key: string, fetchImpl: typeof fetch = async () => { sends++; return ok() }) => createChatCompletion({ capability: "text", taskType: key, promptVersion: "test", messages: [{ role: "user", content: key }], schema: z.object({ ok: z.boolean() }), logInput: {}, fetchImpl })
  try {
    const resolves: Array<(value: Response) => void> = []
    const slow: typeof fetch = async () => { sends++; return new Promise(resolve => resolves.push(resolve)) }
    const first = call("food_inventory", slow)
    const duplicate = call("food_inventory", slow)
    assert.equal(first, duplicate)
    const second = call("food_pairing", slow)
    await assert.rejects(call("action_card"), { code: "AI_BUSY" })
    assert.equal(sends, 2)
    resolves.forEach(resolve => resolve(ok()))
    await Promise.all([first, duplicate, second])
    for (let i = 0; i < 17; i++) await call(["food_inventory", "food_pairing", "action_card"][i % 3])
    await assert.rejects(call("retry", async () => { sends++; return new Response("", { status: 429 }) }), { code: "AI_RATE_LIMITED" })
    assert.equal(sends, 20)
    await assert.rejects(call("food_inventory"), { code: "AI_RATE_LIMITED" })
    assert.equal(sends, 20)
    t.mock.timers.tick(60 * 60 * 1000)
    await call("food_inventory")
    assert.equal(sends, 21)
  } finally { closeDatabase(); t.mock.timers.reset() }
})
