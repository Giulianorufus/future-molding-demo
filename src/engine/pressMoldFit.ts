import type { PressSpec } from '@/stores/pressStore'

export const USABLE_CLAMP_FRACTION = 0.85
export const MAX_IDEAL_CLAMP_RATIO = 2
const KN_PER_METRIC_TON = 9.80665

export type MoldFitStatus = 'compatible' | 'too-small' | 'overdimensioned' | 'insufficient-data'

export type PressMoldFit = {
  pressId: string
  pressName: string
  status: MoldFitStatus
  nominalClampKn: number
  usableClampKn: number
  requiredClampKn: number
  reasons: string[]
}

export type PressRecommendation = {
  selected: PressMoldFit | null
  ideal: PressMoldFit | null
  candidates: PressMoldFit[]
}

export type PressRecommendationInput = {
  requiredClampTon: number
  shotVolumeCm3: number
  presses: readonly PressSpec[]
  mold?: MoldGeometry
}

export type MoldGeometry = {
  footprintXmm?: number | null
  footprintYmm?: number | null
  heightMm?: number | null
  requiredOpeningMm?: number | null
}

function nominalClampKn(press: PressSpec): number {
  if (typeof press.clampForceKn === 'number' && press.clampForceKn > 0) return press.clampForceKn
  return press.tonnellaggio > 0 ? press.tonnellaggio * KN_PER_METRIC_TON : 0
}

export function evaluatePressMoldFit(requiredClampTon: number, shotVolumeCm3: number, press: PressSpec, mold?: MoldGeometry): PressMoldFit {
  const requiredClampKn = Math.max(0, requiredClampTon) * KN_PER_METRIC_TON
  const nominalKn = nominalClampKn(press)
  const usableKn = nominalKn * USABLE_CLAMP_FRACTION
  const reasons: string[] = []

  if (press.dataStatus === 'reference') reasons.push('Configurazione pressa da verificare su targa')
  if (requiredClampKn <= 0) reasons.push('Forza di chiusura richiesta non disponibile')
  if (nominalKn <= 0) reasons.push('Forza nominale pressa non disponibile')
  if (nominalKn > 0 && usableKn < requiredClampKn) reasons.push('Capacità utilizzabile all’85% insufficiente')

  const shotKnown = press.shotVolumeCm3 > 0
  if (!shotKnown) reasons.push('Volume utile vite non documentato')
  else if (shotVolumeCm3 > press.shotVolumeCm3) reasons.push('Dose totale superiore al volume utile vite')

  if (mold?.footprintXmm && mold.footprintYmm) {
    if (!press.tieBarWidthMm || !press.tieBarHeightMm) reasons.push('Ingombro colonne pressa non documentato')
    else if (mold.footprintXmm > press.tieBarWidthMm || mold.footprintYmm > press.tieBarHeightMm) reasons.push('Impronta stampo superiore al passaggio tra colonne')
  }
  if (mold?.heightMm) {
    if (!press.minMoldHeightMm || !press.maxMoldHeightMm) reasons.push('Altezza stampo ammissibile non documentata')
    else if (mold.heightMm < press.minMoldHeightMm || mold.heightMm > press.maxMoldHeightMm) reasons.push('Altezza stampo fuori dal campo macchina')
  }
  if (mold?.requiredOpeningMm) {
    if (!press.maxOpeningStrokeMm) reasons.push('Corsa apertura non documentata')
    else if (mold.requiredOpeningMm > press.maxOpeningStrokeMm) reasons.push('Apertura richiesta superiore alla corsa pressa')
  }

  if (reasons.some((reason) => reason.includes('insufficiente') || reason.includes('superiore') || reason.includes('fuori dal campo'))) {
    return { pressId: press.id, pressName: press.name, status: 'too-small', nominalClampKn: nominalKn, usableClampKn: usableKn, requiredClampKn, reasons }
  }
  if (reasons.length > 0) {
    return { pressId: press.id, pressName: press.name, status: 'insufficient-data', nominalClampKn: nominalKn, usableClampKn: usableKn, requiredClampKn, reasons }
  }

  const ratio = requiredClampKn > 0 ? nominalKn / requiredClampKn : Number.POSITIVE_INFINITY
  const status: MoldFitStatus = ratio > MAX_IDEAL_CLAMP_RATIO ? 'overdimensioned' : 'compatible'
  if (status === 'overdimensioned') reasons.push('Forza nominale oltre il doppio del requisito')
  return { pressId: press.id, pressName: press.name, status, nominalClampKn: nominalKn, usableClampKn: usableKn, requiredClampKn, reasons }
}

export function recommendPressForMold(input: PressRecommendationInput): PressRecommendation {
  const candidates = input.presses.map((press) => evaluatePressMoldFit(input.requiredClampTon, input.shotVolumeCm3, press, input.mold))
  const complete = candidates.filter((candidate) => (candidate.status === 'compatible' || candidate.status === 'overdimensioned') && input.presses.find((press) => press.id === candidate.pressId)?.dataStatus === 'complete')
  const ideal = [...complete].sort((a, b) => a.nominalClampKn - b.nominalClampKn)[0] ?? null
  return { selected: null, ideal, candidates }
}
