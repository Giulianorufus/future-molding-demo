import { applyDefectFix } from '../../defects/defectRules'
import { positiveProcessValue } from '../recipeProcessValues'
import type { DiagnosticAnswers } from './guidedDiagnosis'

export function proposeDefectRecipeTrial(
  defectId: string,
  observations: DiagnosticAnswers,
  window: { current: number; minimum: number; maximum: number; pressMaximum?: number },
) {
  // A local flash or unchecked parting surface still needs a mold check.
  if (defectId !== 'flash' || observations.location !== 'distributed' ||
      observations.phase !== 'hold' || observations.mold !== 'no') return null

  const current = positiveProcessValue(window.current)
  const minimum = positiveProcessValue(window.minimum)
  const maximum = positiveProcessValue(window.maximum)
  if (current === null || minimum === null || maximum === null) return null
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
