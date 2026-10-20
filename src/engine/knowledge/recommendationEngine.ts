import type { Diagnosis, KnowledgeContext, Recommendation, SimilarCase } from './types'
import { getContextualDefectProfile, detectClarificationRequests, assessCauseMaterial, DEFAULT_MATERIAL_LIMIT } from './defectContext'

export async function recommend(
  diagnosis: Diagnosis[],
  context: KnowledgeContext,
  similarCases: SimilarCase[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = []

  const profile = getContextualDefectProfile(context.defectContext?.defectId)
  if (profile) {
    for (const cause of profile.probableCauses) {
      const answer = context.defectContext?.answers?.[cause.questionId] ?? 'unknown'
      if (answer === 'no') continue
      const declared = answer === 'yes'
      const material = assessCauseMaterial(cause, context.defectContext?.material)
      const outside = material.status === 'outside-scope'
      const actionText = outside ? `${material.note} Riferimento della fonte, non applicabile senza riserve: ${cause.action}` : cause.action
      const materialSuffix = outside ? '' : ` ${material.note}`
      recommendations.push({
        id: `defect-action:${cause.id}`,
        target: cause.questionId,
        action: 'investigate',
        reason: declared
          ? `${actionText} Condizione dichiarata dall’operatore; verifica prima di intervenire. Il “Sì” conferma la condizione descritta, non dimostra che sia l’unica causa del difetto: verifica l’effetto dopo l’intervento.${materialSuffix}`
          : `Risposta attuale “Non so”: ${cause.question} Se il controllo conferma questa causa, valuta solo allora: ${actionText} Nessuna correzione automatica è applicata.${materialSuffix}`,
        priority: (declared ? 80 : 50) - cause.order - (outside ? 30 : 0),
        metadata: {
          provenance: declared ? 'operator-declared' : 'estimated',
          catalogId: profile.id,
          verificationStatus: profile.verificationStatus,
          evidenceStatus: cause.evidenceStatus,
          source: cause.source,
          sourceReference: cause.sourceReference,
          questionId: cause.questionId,
          answer,
          materialApplicability: material.status,
          materialLimit: cause.materialLimit ?? DEFAULT_MATERIAL_LIMIT,
          corroboration: cause.corroboration ?? null,
          automaticCorrection: false,
        },
      })
    }
    detectClarificationRequests(profile.id, context.defectContext?.answers).forEach((conflict) => {
      recommendations.push({
        id: `defect-clarification:${conflict.causeIds.join('+')}`,
        target: conflict.questionIds[0],
        action: 'investigate',
        reason: `${conflict.message} Se riguardano lo stesso segno, controllo discriminante: ${conflict.discriminatingCheck}`,
        priority: 90,
        metadata: { provenance: 'clarification-request', catalogId: profile.id, questionIds: conflict.questionIds, automaticCorrection: false },
      })
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
