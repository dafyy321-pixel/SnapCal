export function canReuseAnalysis(
  existing: { model_version: string } | null,
  forceReanalyze: boolean | undefined,
  modelVersion: string,
): boolean {
  return existing !== null && !forceReanalyze && existing.model_version === modelVersion
}
