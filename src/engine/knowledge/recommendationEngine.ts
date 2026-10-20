import type { Diagnosis, KnowledgeContext, Recommendation, SimilarCase } from './types'
import { getContextualDefectProfile, detectAnswerConflicts } from './defectContext'

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
      recommendations.push({
        id: `defect-action:${cause.id}`,
        target: cause.questionId,
        action: 'investigate',
        reason: declared
          ? `${cause.action} Condizione dichiarata dall’operatore; verifica prima di intervenire. Il “Sì” conferma la condizione descritta, non dimostra che sia l’unica causa del difetto: verifica l’effetto dopo l’intervento.`
          : `Risposta attuale “Non so”: ${cause.question} Se il controllo conferma questa causa, valuta solo allora: ${cause.action} Nessuna correzione automatica è applicata.`,
        priority: (declared ? 80 : 50) - cause.order,
        metadata: {
          provenance: declared ? 'operator-declared' : 'estimated',
          catalogId: profile.id,
          verificationStatus: profile.verificationStatus,
          evidenceStatus: cause.evidenceStatus,
          source: cause.source,
          sourceReference: cause.sourceReference,
          questionId: cause.questionId,
          answer,
          automaticCorrection: false,
        },
      })
    }
    detectAnswerConflicts(profile.id, context.defectContext?.answers).forEach((conflict) => {
      recommendations.push({
        id: `defect-conflict:${conflict.causeIds.join('+')}`,
        target: conflict.questionIds[0],
        action: 'investigate',
        reason: `${conflict.message} Controllo discriminante: ${conflict.discriminatingCheck}`,
        priority: 90,
        metadata: { provenance: 'answer-conflict', catalogId: profile.id, questionIds: conflict.questionIds, automaticCorrection: false },
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
