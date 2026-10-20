import { resolveDefectCatalogEntry, type CatalogCauseAction, type DefectCatalogEntry } from '@/defects/defectCatalog'

export type OperatorAnswer = 'yes' | 'no' | 'unknown'
export type ContextualDefectCause = CatalogCauseAction
export type ContextualDefectProfile = Pick<DefectCatalogEntry, 'id' | 'nameIt' | 'probableCauses' | 'verificationStatus'>

export function getContextualDefectProfile(defectId?: string | null): ContextualDefectProfile | null {
  const entry = resolveDefectCatalogEntry(defectId)
  if (!entry || entry.probableCauses.length === 0) return null
  return {
    id: entry.id,
    nameIt: entry.nameIt,
    probableCauses: entry.probableCauses,
    verificationStatus: entry.verificationStatus,
  }
}

export interface AnswerConflict {
  causeIds: string[]
  questionIds: string[]
  message: string
  discriminatingCheck: string
}

// Fenomeni distinti possono coesistere sul pezzo, ma non come “Sì” per lo stesso segno: nessuna esclusione automatica.
export function detectAnswerConflicts(defectId: string | null | undefined, answers: Record<string, OperatorAnswer> | undefined): AnswerConflict[] {
  const entry = resolveDefectCatalogEntry(defectId)
  if (!entry || !answers) return []
  const conflicts: AnswerConflict[] = []
  for (const group of entry.distinctPhenomena ?? []) {
    const confirmed = entry.probableCauses.filter((cause) => group.causeIds.includes(cause.id) && answers[cause.questionId] === 'yes')
    if (confirmed.length < 2) continue
    conflicts.push({
      causeIds: confirmed.map((cause) => cause.id),
      questionIds: confirmed.map((cause) => cause.questionId),
      message: `Risposte in contrasto per lo stesso segno: ${confirmed.map((cause) => cause.title).join(' / ')}. Le descrizioni sono incompatibili su un unico segno.`,
      discriminatingCheck: group.discriminatingCheck,
    })
  }
  return conflicts
}
