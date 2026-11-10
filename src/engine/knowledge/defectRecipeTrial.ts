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
