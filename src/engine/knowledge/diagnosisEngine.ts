import type { KnowledgeContext, Diagnosis, SimilarCase } from './types'
import { getContextualDefectProfile, assessCauseMaterial } from './defectContext'
import { resolveDefectCatalogEntry } from '@/defects/defectCatalog'

export async function diagnose(
  context: KnowledgeContext,
  similarCases: SimilarCase[]
): Promise<Diagnosis[]> {
  const diagnosis: Diagnosis[] = []

  const hasDefect = typeof context.defectContext?.defectId === 'string' && context.defectContext.defectId.length > 0
  if (hasDefect) {
    const profile = getContextualDefectProfile(context.defectContext?.defectId)
    if (profile) {
      for (const cause of profile.probableCauses) {
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
            catalogId: profile.id,
            verificationStatus: profile.verificationStatus,
            evidenceStatus: cause.evidenceStatus,
            sourceReference: cause.sourceReference,
            questionId: cause.questionId,
            answer,
            materialApplicability: assessCauseMaterial(cause, context.defectContext?.material).status,
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
      const catalogEntry = resolveDefectCatalogEntry(context.defectContext?.defectId)
      diagnosis.push({
        id: catalogEntry ? `catalog-status:${catalogEntry.id}` : 'defect-report',
        title: catalogEntry ? `${catalogEntry.nameIt}: scheda ${catalogEntry.verificationStatus === 'partial' ? 'parziale' : 'non verificata'}` : 'Segnalazione difetto da verificare',
        description: catalogEntry
          ? 'Sono disponibili descrizione e verifiche operatore; mancano evidenze tecniche sufficienti per formulare cause o azioni. Le risposte non attivano raccomandazioni automatiche.'
          : 'È presente una segnalazione non riconosciuta dal catalogo.',
        score: 0,
        severity: 'low',
        tags: ['defect', catalogEntry?.verificationStatus ?? 'unverified'],
        source: catalogEntry ? 'defectCatalog' : 'diagnosisEngine',
        metadata: {
          provenance: 'catalog-status',
          catalogId: catalogEntry?.id ?? null,
          verificationStatus: catalogEntry?.verificationStatus ?? 'unverified',
          automationStatus: catalogEntry?.automationStatus ?? 'disabled',
          drawingId: context.defectContext?.drawingId ?? null,
          drawingVersion: context.defectContext?.pin?.drawingVersion ?? null,
          pinId: context.defectContext?.pin?.id ?? null,
          pinPlacement: context.defectContext?.pin?.placement ?? null,
        },
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
