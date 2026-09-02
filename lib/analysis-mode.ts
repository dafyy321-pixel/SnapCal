export function shouldUseMockAnalysis(requestedMock?: boolean, apiKey = process.env.DOUBAO_API_KEY): boolean {
  return !apiKey || requestedMock === true || process.env.USE_MOCK_ANALYSIS === "true"
}
