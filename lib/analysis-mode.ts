export function shouldUseMockAnalysis(requestedMock?: boolean, apiKey = process.env.DOUBAO_API_KEY): boolean {
  return !apiKey || requestedMock === true || process.env.USE_MOCK_ANALYSIS === "true"
}

export function canReuseAnalysis(
  existing: { model_version: string } | null,
  forceReanalyze: boolean | undefined,
  modelVersion: string,
): boolean {
  return existing !== null && !forceReanalyze && existing.model_version === modelVersion
}
