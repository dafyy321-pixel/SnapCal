import test from "node:test"
import assert from "node:assert/strict"

test("day boundaries follow configured timezone and DST", async () => {
  const { nextLocalDayStart } = await import("../lib/date-utils")
  assert.equal(nextLocalDayStart("2026-09-08", "UTC"), "2026-09-09T00:00:00.000Z")
  assert.equal(nextLocalDayStart("2026-09-08", "Asia/Shanghai"), "2026-09-08T16:00:00.000Z")
  assert.equal(nextLocalDayStart("2026-03-08", "America/New_York"), "2026-03-09T04:00:00.000Z")
  assert.equal(nextLocalDayStart("2026-11-01", "America/New_York"), "2026-11-02T05:00:00.000Z")
})
