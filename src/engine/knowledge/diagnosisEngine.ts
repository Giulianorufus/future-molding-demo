import type { KnowledgeContext, Diagnosis, SimilarCase } from './types'
import { getContextualDefectProfile } from './defectContext'

export async function diagnose(
  context: KnowledgeContext,
  similarCases: SimilarCase[]
): Promise<Diagnosis[]> {
  const diagnosis: Diagnosis[] = []

  const hasDefect = typeof context.defectContext?.defectId === 'string' && context.defectContext.defectId.length > 0
  if (hasDefect) {
    const profile = getContextualDefectProfile(context.defectContext?.defectId)
    if (profile) {
      for (const cause of profile.causes) {
        const answer = context.defectContext?.answers?.[cause.questionId] ?? 'unknown'
        if (answer === 'no') continue
        const declared = answer === 'yes'
        diagnosis.push({
          id: `defect-cause:${cause.id}`,
          title: declared ? cause.title : `Da discriminare: ${cause.title}`,
          description: declared
            ? `${cause.description} Riscontro dichiarato dall’operatore; non verificato strumentalmente.`
            : `Ipotesi stimata non discriminata: ${cause.description} Mancano il riscontro dell’operatore o una misura attendibile.`,
          score: declared ? 65 : 35,
          severity: 'medium',
          tags: ['defect', declared ? 'operator-declared' : 'estimated'],
          source: cause.source,
          metadata: {
            provenance: declared ? 'operator-declared' : 'estimated',
            sourceReference: cause.sourceReference,
            questionId: cause.questionId,
            answer,
            drawingId: context.defectContext?.drawingId ?? null,
            drawingVersion: context.defectContext?.pin?.drawingVersion ?? null,
            severityLevel: context.defectContext?.severityLevel ?? null,
            pinId: context.defectContext?.pin?.id ?? null,
            pinPlacement: context.defectContext?.pin?.placement ?? null,
            pinCoordinateFrame: context.defectContext?.pin?.coordinateFrame ?? null,
            geometryUsedForCauseInference: false,
          },
        })
      }
    } else {
      diagnosis.push({
        id: 'defect-report',
        title: 'Segnalazione difetto da verificare',
        description: 'È presente una segnalazione; il catalogo non contiene una diagnosi contestuale per questo ID.',
        score: 20,
        severity: 'low',
        tags: ['defect', 'unverified'],
        source: 'diagnosisEngine',
      })
    }
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
