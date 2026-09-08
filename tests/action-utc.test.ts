import test from "node:test"
import assert from "node:assert/strict"

test("a new UTC action is active at 17:00Z and expires at the exclusive next midnight", async t => {
  process.env.SNAPCAL_DB_PATH = ":memory:"
  process.env.SNAPCAL_TIME_ZONE = "UTC"
  process.env.NEXT_PUBLIC_SNAPCAL_TIME_ZONE = "UTC"
  delete process.env.OPENAI_API_KEY
  delete process.env.DOUBAO_API_KEY
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-08T17:00:00Z") })
  const { generateActionCard } = await import("../lib/action-engine")
  const { wellnessDb } = await import("../lib/wellness-db")
  const { closeDatabase } = await import("../lib/local-db")
  try {
    const card = await generateActionCard("2026-09-08")
    assert.equal(card.valid_until, "2026-09-09T00:00:00.000Z")
    assert.ok(wellnessDb.getActiveAction("2026-09-08"))
    t.mock.timers.setTime(new Date("2026-09-08T23:59:59.999Z").getTime())
    assert.ok(wellnessDb.getActiveAction("2026-09-08"))
    t.mock.timers.setTime(new Date("2026-09-09T00:00:00Z").getTime())
    wellnessDb.getActiveAction("2026-09-09")
    assert.equal(wellnessDb.listActions("2026-09-08", "2026-09-08")[0].status, "expired")
  } finally { closeDatabase(); t.mock.timers.reset() }
})
