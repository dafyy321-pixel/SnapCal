import test from "node:test"
import assert from "node:assert/strict"
import { NextRequest } from "next/server"
import { proxy } from "../proxy"
import { POST } from "../app/api/actions/generate/route"

test("write requests require the complete origin and the endpoint content type", async () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    for (const origin of ["http://localhost:3001", "https://localhost:3000", "http://127.0.0.1:3000", "null"]) {
      const response = proxy(new NextRequest("http://localhost:3000/api/actions/generate", { method, headers: { origin, "content-type": "application/json", purpose: "prefetch" } }))
      assert.equal(response.status, 403)
    }
    assert.equal(proxy(new NextRequest("http://localhost:3000/api/actions/generate", { method, headers: { origin: "http://localhost:3000", "content-type": "application/json" } })).status, 200)
  }
  assert.equal(proxy(new NextRequest("http://localhost:3000/api/actions/generate", { method: "POST", headers: { "content-type": "text/plain" } })).status, 415)
  assert.equal(proxy(new NextRequest("http://localhost:3000/api/meals/123", { method: "DELETE", headers: { "sec-fetch-site": "same-site" } })).status, 403)
  assert.equal(proxy(new NextRequest("http://localhost:3000/api/food-assist", { method: "POST", body: new FormData(), headers: { origin: "http://localhost:3000" } })).status, 200)
  assert.equal(proxy(new NextRequest("http://localhost:3000/api/day?date=2026-09-08")).status, 200)
  // The actual JSON handler also rejects before any database or AI work.
  const response = await POST(new Request("http://localhost:3000/api/actions/generate", { method: "POST", body: "{}", headers: { origin: "http://localhost:3001", "content-type": "text/plain" } }))
  assert.equal(response.status, 403)
  assert.equal((await POST(new Request("http://localhost:3000/api/actions/generate", { method: "POST", body: "{}" }))).status, 415)
})
