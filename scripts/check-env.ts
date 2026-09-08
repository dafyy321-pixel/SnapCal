import { loadEnvConfig } from "@next/env"
import { getAiConfig } from "../lib/ai-config"

loadEnvConfig(process.cwd())
const config = getAiConfig()
console.log(`Vision AI: ${config.apiKey && config.visionModel ? "configured" : "not configured; recognition is unavailable"}`)
console.log(`Text AI: ${config.apiKey && config.textModel ? "configured" : "not configured; local rules remain available"}`)
console.log("External AI requests require user consent. Missing configuration never enables mock nutrition.")
