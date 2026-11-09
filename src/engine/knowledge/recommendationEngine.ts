import type { Diagnosis, KnowledgeContext, Recommendation, SimilarCase } from './types'
import { buildGuidedDiagnosis } from './guidedDiagnosis'

export async function recommend(
  diagnosis: Diagnosis[],
  context: KnowledgeContext,
  similarCases: SimilarCase[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = []

  const guide = buildGuidedDiagnosis(context.defectContext?.defectId ?? context.input.defectId, context.defectContext?.observations)
  for (const [index, hypothesis] of (guide?.hypotheses ?? []).entries()) {
    recommendations.push({
      id: `verify-${hypothesis.id}`,
      target: hypothesis.target,
      action: 'investigate',
      reason: hypothesis.checks.join(' '),
      priority: 100 - index,
      metadata: { hypothesisId: hypothesis.id, checks: [...hypothesis.checks], evidence: hypothesis.evidence },
    })
  }

  if (context.recipeFingerprint && similarCases.length > 0) {
    recommendations.push({
      id: 'confirm-similar-case-practice',
      target: 'baseline',
      action: 'validate',
      reason: 'Confronta la ricetta con casi simili per migliorare la coerenza delle decisioni.',
      priority: 50,
    })
  }

  return recommendations
}
