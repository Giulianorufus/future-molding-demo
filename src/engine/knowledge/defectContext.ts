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

export interface ClarificationRequest {
  causeIds: string[]
  questionIds: string[]
  message: string
  discriminatingCheck: string
}

// Fenomeni distinti possono coesistere (zone o segni diversi): si chiede un chiarimento, nessuna esclusione automatica.
export function detectClarificationRequests(defectId: string | null | undefined, answers: Record<string, OperatorAnswer> | undefined): ClarificationRequest[] {
  const entry = resolveDefectCatalogEntry(defectId)
  if (!entry || !answers) return []
  const conflicts: ClarificationRequest[] = []
  for (const group of entry.distinctPhenomena ?? []) {
    const confirmed = entry.probableCauses.filter((cause) => group.causeIds.includes(cause.id) && answers[cause.questionId] === 'yes')
    if (confirmed.length < 2) continue
    conflicts.push({
      causeIds: confirmed.map((cause) => cause.id),
      questionIds: confirmed.map((cause) => cause.questionId),
      message: `Chiarimento richiesto: hai dichiarato insieme ${confirmed.map((cause) => cause.title).join(' / ')}. I fenomeni possono coesistere: indica se riguardano zone o segni diversi. Entrambe le ipotesi restano aperte.`,
      discriminatingCheck: group.discriminatingCheck,
    })
  }
  return conflicts
}
