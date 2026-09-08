import test from "node:test"
import assert from "node:assert/strict"
import { NextRequest } from "next/server"

test("real meal recognition reports missing configuration without mock results or network calls", async () => {
  process.env.SNAPCAL_DB_PATH = ":memory:"
  for (const key of ["OPENAI_API_KEY", "DOUBAO_API_KEY", "USE_MOCK_ANALYSIS"]) delete process.env[key]
  const { POST } = await import("../app/api/analyze/route")
  const { closeDatabase, localDb } = await import("../lib/local-db")
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error("must not send") }
  try {
    const body = new FormData()
    body.append("image", new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "food.png", { type: "image/png" }))
    const response = await POST(new NextRequest("http://localhost/api/analyze", { method: "POST", body }))
    assert.equal(response.status, 503)
    assert.equal((await response.json()).error.code, "AI_NOT_CONFIGURED")
    assert.equal(localDb.listMeals().total, 0)
  } finally { globalThis.fetch = originalFetch; closeDatabase() }
})
