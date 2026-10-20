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
