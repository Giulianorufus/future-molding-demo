import type { KnowledgeContext, Diagnosis, SimilarCase } from './types'
import { buildGuidedDiagnosis } from './guidedDiagnosis'

export async function diagnose(
  context: KnowledgeContext,
  similarCases: SimilarCase[]
): Promise<Diagnosis[]> {
  const diagnosis: Diagnosis[] = []

  const guide = buildGuidedDiagnosis(context.defectContext?.defectId ?? context.input.defectId, context.defectContext?.observations)
  for (const hypothesis of guide?.hypotheses ?? []) {
    diagnosis.push({
      id: hypothesis.id,
      title: hypothesis.title,
      description: hypothesis.explanation,
      // Evidence count is an ordering index, never a calibrated probability.
      score: hypothesis.evidence.length,
      severity: 'medium',
      tags: ['defect', 'hypothesis', hypothesis.evidence.length ? 'observed-indication' : 'unverified'],
      source: 'guidedDiagnosis',
    })
  }

  if (similarCases.length > 0) {
    diagnosis.push({
      id: 'case-correlation',
      title: 'Casi simili trovati',
      description: 'Sono disponibili casi di produzione simili per validare le ipotesi e le raccomandazioni.',
      score: 60,
      severity: 'low',
      tags: ['case-based', 'correlation'],
      source: 'diagnosisEngine',
    })
  }

  return diagnosis
}
