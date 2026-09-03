import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { z } from "zod"

const ENV_KEYS = [
  "OPENAI_API_BASE_URL", "OPENAI_API_KEY", "OPENAI_MODEL", "OPENAI_VISION_MODEL",
  "OPENAI_TEXT_MODEL", "AI_REQUEST_TIMEOUT_MS", "DOUBAO_API_KEY", "USE_MOCK_ANALYSIS",
] as const

function clearAiEnv() {
  for (const key of ENV_KEYS) delete process.env[key]
}

function completion(content = '{"answer":"ok"}', status = 200) {
  return new Response(JSON.stringify({
    model: "response-model",
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
  }), { status, headers: { "content-type": "application/json" } })
}

test("OpenAI-compatible client", async t => {
  const directory = mkdtempSync(join(tmpdir(), "snapcal-openai-"))
  const previous = Object.fromEntries(ENV_KEYS.map(key => [key, process.env[key]]))
  process.env.SNAPCAL_DB_PATH = join(directory, "snapcal.db")
  const { getAiConfig } = await import("../lib/ai-config")
  const { AiClientError, createChatCompletion, extractJson } = await import("../lib/openai-client")
  const { closeDatabase, localDb } = await import("../lib/local-db")
  const aiStatus = await import("../app/api/ai/status/route")
  const resultSchema = z.object({ answer: z.string() }).strict()

  const request = (fetchImpl: typeof fetch) => createChatCompletion({
    capability: "vision",
    taskType: "test",
    promptVersion: "test-v1",
    logInput: { aggregate: 1 },
    schema: resultSchema,
    messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: "data:image/png;base64,AA==" } }, { type: "text", text: "识别" }] }],
    fetchImpl,
  })

  try {
    await t.test("prefers generic configuration over legacy Doubao", () => {
      const config = getAiConfig({ OPENAI_API_KEY: "generic", OPENAI_MODEL: "g-model", DOUBAO_API_KEY: "legacy" })
      assert.equal(config.provider, "openai-compatible")
      assert.equal(config.apiKey, "generic")
      assert.equal(config.visionModel, "g-model")
    })

    await t.test("maps legacy Doubao configuration", () => {
      const config = getAiConfig({ DOUBAO_API_KEY: "legacy" })
      assert.equal(config.provider, "doubao")
      assert.match(config.endpoint, /ark\.cn-beijing\.volces\.com\/api\/v3\/chat\/completions$/)
      assert.equal(config.visionModel, "doubao-seed-1-6-flash-250828")
    })

    await t.test("uses capability-specific model overrides", () => {
      const config = getAiConfig({ OPENAI_API_KEY: "key", OPENAI_MODEL: "base", OPENAI_VISION_MODEL: "vision", OPENAI_TEXT_MODEL: "text" })
      assert.equal(config.visionModel, "vision")
      assert.equal(config.textModel, "text")
    })

    await t.test("normalizes endpoint and timeout", () => {
      const low = getAiConfig({ OPENAI_API_BASE_URL: "https://example.test/v1/", AI_REQUEST_TIMEOUT_MS: "3" })
      const high = getAiConfig({ AI_REQUEST_TIMEOUT_MS: "999999" })
      assert.equal(low.endpoint, "https://example.test/v1/chat/completions")
      assert.equal(low.timeoutMs, 1000)
      assert.equal(high.timeoutMs, 120000)
    })

    await t.test("reports unconfigured service without a key and model", () => {
      assert.equal(getAiConfig({}).configured, false)
    })

    await t.test("extracts direct JSON", () => {
      assert.deepEqual(extractJson('{"answer":"ok"}'), { answer: "ok" })
    })

    await t.test("extracts fenced JSON", () => {
      assert.deepEqual(extractJson('```json\n{"answer":"ok"}\n```'), { answer: "ok" })
    })

    await t.test("extracts JSON surrounded by prose", () => {
      assert.deepEqual(extractJson('结果：{"answer":"ok"}。'), { answer: "ok" })
    })

    await t.test("rejects missing configuration", async () => {
      clearAiEnv()
      await assert.rejects(request(async () => completion()) as Promise<unknown>, (error: unknown) => error instanceof AiClientError && error.code === "AI_NOT_CONFIGURED")
    })

    await t.test("sends Chat Completions vision messages", async () => {
      clearAiEnv()
      process.env.OPENAI_API_KEY = "secret-key"
      process.env.OPENAI_MODEL = "vision-model"
      let sentUrl = ""
      let sentBody = ""
      const response = await request((async (url, init) => {
        sentUrl = String(url)
        sentBody = String(init?.body)
        assert.equal((init?.headers as Record<string, string>).authorization, "Bearer secret-key")
        return completion()
      }) as typeof fetch)
      assert.match(sentUrl, /\/chat\/completions$/)
      assert.match(sentBody, /image_url/)
      assert.equal(response.data.answer, "ok")
    })

    await t.test("retries one 429 response", async () => {
      let calls = 0
      const response = await request((async () => ++calls === 1 ? completion("{}", 429) : completion()) as typeof fetch)
      assert.equal(response.data.answer, "ok")
      assert.equal(calls, 2)
    })

    await t.test("retries one server error", async () => {
      let calls = 0
      await request((async () => ++calls === 1 ? completion("{}", 500) : completion()) as typeof fetch)
      assert.equal(calls, 2)
    })

    await t.test("does not retry authentication errors or leak the key", async () => {
      let calls = 0
      await assert.rejects(request((async () => { calls += 1; return completion("{}", 401) }) as typeof fetch), error => {
        assert.equal(calls, 1)
        assert.doesNotMatch(String(error), /secret-key/)
        return true
      })
    })

    await t.test("rejects invalid JSON and schema mismatches", async () => {
      await assert.rejects(request((async () => completion("not json")) as typeof fetch), /有效 JSON/)
      await assert.rejects(request((async () => completion('{"wrong":true}')) as typeof fetch), /未通过校验/)
    })

    await t.test("returns redacted AI status and consent", async () => {
      localDb.updateProfile({ ai_consent_at: "2026-09-03T00:00:00.000Z" })
      const body = await (await aiStatus.GET()).json() as { data: unknown }
      const serialized = JSON.stringify(body)
      assert.match(serialized, /response-model|vision-model/)
      assert.doesNotMatch(serialized, /secret-key/)
      assert.equal((body.data as { consented: boolean }).consented, true)
    })
  } finally {
    closeDatabase()
    clearAiEnv()
    for (const key of ENV_KEYS) if (previous[key] !== undefined) process.env[key] = previous[key]
    rmSync(directory, { recursive: true, force: true })
  }
})
