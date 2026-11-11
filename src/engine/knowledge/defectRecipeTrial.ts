import { applyDefectFix } from '../../defects/defectRules'
import { positiveProcessValue } from '../recipeProcessValues'
import type { DiagnosticAnswers } from './guidedDiagnosis'

export function getDefectTrialKind(defectId: string, observations: DiagnosticAnswers) {
  if (defectId === 'flash' && observations.location === 'distributed' &&
      observations.phase === 'hold' && observations.mold === 'no') return 'pressure'
  if (defectId === 'sink-mark' && observations.location === 'yes' &&
      observations.holdingResponse === 'yes' && observations.cooling === 'no') return 'time'
  return null
}

export function getNextDefectTrialCheck(defectId: string, observations: DiagnosticAnswers) {
  if (defectId === 'flash') {
    if (observations.location === 'local') return 'Controlla le battute nel punto in cui compare la bava.'
    if (observations.location !== 'distributed') return 'Verifica se la bava è locale o distribuita.'
    if (observations.mold !== 'no') return 'Controlla e conferma lo stato delle battute.'
    if (observations.phase === 'fill') return 'Verifica la fase di riempimento: la prova di mantenimento richiede una bava che compaia solo dopo la commutazione.'
    if (observations.phase !== 'hold') return 'Verifica se la bava compare già nel riempimento o soltanto in mantenimento.'
  }
  if (defectId === 'sink-mark') {
    if (observations.location !== 'yes') return 'Verifica se il segno coincide con una nervatura o una zona spessa.'
    if (observations.cooling !== 'no') return 'Verifica il raffreddamento nella zona dell’affossamento.'
    if (observations.holdingResponse === 'no') return 'Verifica la sigillatura dell’attacco: il peso risulta già stabile.'
    if (observations.holdingResponse !== 'yes') return 'Verifica se il peso aumenta prolungando il mantenimento entro la finestra validata.'
  }
  return null
}

export function proposeDefectRecipeTrial(
  defectId: string,
  observations: DiagnosticAnswers,
  window: { current: number; minimum: number; maximum: number; pressMaximum?: number },
) {
  const kind = getDefectTrialKind(defectId, observations)
  if (kind === null) return null

  const current = positiveProcessValue(window.current)
  const minimum = positiveProcessValue(window.minimum)
  const maximum = positiveProcessValue(window.maximum)
  if (current === null || minimum === null || maximum === null) return null
  if (kind === 'time') {
    if (minimum > current || current >= maximum) return null
    const adjustment = applyDefectFix('sink', 'low').delta?.packTime_pct ?? 0
    const after = Math.min(maximum, Math.round(current * (1 + adjustment / 100) * 100) / 100)
    if (after <= current) return null
    return {
      before: current,
      after,
      reason: 'L’affossamento è su una zona spessa, il peso risponde al mantenimento e il raffreddamento è stato controllato. Prova ad aumentare solo il tempo di mantenimento nella finestra validata.',
    }
  }

  const ceiling = Math.min(maximum, positiveProcessValue(window.pressMaximum) ?? maximum)
  if (minimum >= current || current > ceiling) return null

  const adjustment = applyDefectFix('flash', 'low').delta?.packPressure_pct ?? 0
  const after = Math.max(minimum, Math.round(current * (1 + adjustment / 100)))
  if (after >= current) return null

  return {
    before: current,
    after,
    reason: 'La bava è distribuita e compare in mantenimento. Con le battute controllate, prova a ridurre solo la pressione di mantenimento nella finestra validata.',
  }
}
