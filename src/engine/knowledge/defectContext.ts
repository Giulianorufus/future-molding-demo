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

export type MaterialApplicability = 'unrestricted' | 'unknown-material' | 'outside-scope'
export interface CauseMaterialAssessment {
  status: MaterialApplicability
  note: string
}

export const DEFAULT_MATERIAL_LIMIT = 'Ambito della fonte: termoplastici tecnici in generale; PP, ABS e PC non sono nominati e nessun grade è validato.'

// Polimeri del catalogo materiali dell'app classificati come semicristallini.
const SEMI_CRYSTALLINE_FAMILIES = ['PP', 'PA6', 'PA66']

type CauseWithScope = Pick<CatalogCauseAction, 'materialLimit' | 'materialScope'>

export function assessCauseMaterial(cause: CauseWithScope, material: { name: string; family: string | null; gfPct: number | null } | null | undefined): CauseMaterialAssessment {
  const limit = cause.materialLimit ?? DEFAULT_MATERIAL_LIMIT
  const scope = cause.materialScope
  if (!scope) return { status: 'unrestricted', note: `Limite per materiale: ${limit}` }
  const needs = scope.requires === 'glass-fiber' ? 'rinforzati con fibra di vetro' : 'non rinforzati'
  const needsCrystal = scope.semiCrystalline ? ' e semicristallini' : ''
  if (!material || material.gfPct === null || (scope.semiCrystalline && !material.family)) {
    return { status: 'unknown-material', note: `Azione indicata dalla fonte per materiali ${needs}${needsCrystal}: seleziona il materiale per verificarne l’applicabilità. ${limit}` }
  }
  const reinforced = material.gfPct > 0
  const reinforcementOk = scope.requires === 'glass-fiber' ? reinforced : !reinforced
  const crystalOk = !scope.semiCrystalline || SEMI_CRYSTALLINE_FAMILIES.includes(material.family ?? '')
  if (reinforcementOk && crystalOk) return { status: 'unrestricted', note: `Limite per materiale: ${limit}` }
  const lead = scope.strength === 'only'
    ? `Fuori ambito per ${material.name}: la fonte indica questa azione solo per materiali ${needs}${needsCrystal}.`
    : `Applicabilità non dimostrata per ${material.name}: la fonte indica questa azione soprattutto per materiali ${needs}${needsCrystal}.`
  return { status: 'outside-scope', note: `${lead} Non applicarla senza verifica con il produttore del materiale. ${limit}` }
}
