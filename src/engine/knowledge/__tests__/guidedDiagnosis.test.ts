import { buildGuidedDiagnosis, DEFECT_GUIDES, getDefectGuide } from '../guidedDiagnosis'
import { inferKnowledgeRecommendations } from '../knowledgeEngine'
import { nullKnowledgeRepository } from '../repository'
import type { KnowledgeContext } from '../types'

function context(defectId: string, observations: Record<string, string> = {}): KnowledgeContext {
  return { input: { defectId }, output: { calculatedAtISO: new Date().toISOString(), rawResult: {} }, defectContext: { defectId, observations } }
}

test('no answers and explicitly unknown answers never become supporting evidence', () => {
  for (const guide of DEFECT_GUIDES) {
    const empty = buildGuidedDiagnosis(guide.id)!
    const unknown = buildGuidedDiagnosis(guide.id, Object.fromEntries(guide.questions.map(question => [question.id, 'unknown'])))!
    expect(empty.answeredCount).toBe(0)
    expect(unknown.answeredCount).toBe(3)
    expect(unknown.observedCount).toBe(0)
    expect(unknown.pendingQuestions).toHaveLength(3)
    expect(unknown.hypotheses.every(item => item.evidence.length === 0)).toBe(true)
    expect(unknown.hypotheses.map(item => item.id)).toEqual(empty.hypotheses.map(item => item.id))
  }
})

test('invalid or unrelated observations are ignored', () => {
  const report = buildGuidedDiagnosis('burn-mark', { location: 'thin', vents: 'invented', cushion: 'zero' })!
  expect(report.answeredCount).toBe(0)
  expect(report.observedCount).toBe(0)
  expect(report.hypotheses.every(item => item.evidence.length === 0)).toBe(true)
})

test('burn marks distinguish trapped air, residence degradation and gate shear', () => {
  expect(buildGuidedDiagnosis('burn-mark', { location: 'end', vents: 'yes' })!.hypotheses[0].id).toBe('diesel-effect')
  expect(buildGuidedDiagnosis('burn-mark', { location: 'spread', restart: 'yes' })!.hypotheses[0].id).toBe('thermal-degradation')
  expect(buildGuidedDiagnosis('burn-mark', { location: 'gate' })!.hypotheses[0].id).toBe('shear-heating')
})

test('flash distinguishes local mold damage from a holding-phase problem', () => {
  expect(buildGuidedDiagnosis('flash', { location: 'local', mold: 'yes' })!.hypotheses[0].id).toBe('parting-surface')
  expect(buildGuidedDiagnosis('flash', { phase: 'hold' })!.hypotheses[0].id).toBe('holding-pressure')
})

test('short shot checks delivery for absent cushion and restrictions for pressure-limited thin flow', () => {
  expect(buildGuidedDiagnosis('short-shot', { cushion: 'zero' })!.hypotheses[0].id).toBe('shot-delivery')
  expect(buildGuidedDiagnosis('short-shot', { cushion: 'stable', location: 'thin', pressureLimit: 'yes' })!.hypotheses[0].id).toBe('flow-restriction')
})

test('sink checks cooling when that is the only observed indication', () => {
  expect(buildGuidedDiagnosis('sink-mark', { cooling: 'yes' })!.hypotheses[0].id).toBe('local-cooling')
  expect(buildGuidedDiagnosis('sink-mark', { holdingResponse: 'yes' })!.hypotheses[0].id).toBe('holding-compensation')
})

test('legacy aliases resolve to the same guide; unsupported defects have no invented diagnosis', async () => {
  expect(getDefectGuide('sink_marks')?.id).toBe('sink-mark')
  expect(getDefectGuide('bruciature')?.id).toBe('burn-mark')
  expect(buildGuidedDiagnosis('unmapped')).toBeUndefined()
  const result = await inferKnowledgeRecommendations(context('unmapped'), undefined, { persistLearning: false })
  expect(result.diagnosis).toHaveLength(0)
  expect(result.recommendations).toHaveLength(0)
  expect(result.warnings.map(item => item.code)).toContain('unsupported-defect')
})

test('Knowledge Engine keeps hypotheses, recommendations and next checks in the same order without modifying the recipe', async () => {
  const input = context('burn-mark', { location: 'spread', restart: 'yes', vents: 'no' })
  input.output.rawResult = { injectionFlowCm3s: 45, pressureBar: 700 }
  const before = JSON.stringify(input)
  const saveLearning = jest.fn(async () => undefined)
  const repository = Object.create(nullKnowledgeRepository)
  repository.saveLearning = saveLearning
  const result = await inferKnowledgeRecommendations(input, repository, { persistLearning: false })
  expect(result.diagnosis[0].id).toBe('thermal-degradation')
  expect(result.recommendations[0].metadata?.hypothesisId).toBe('thermal-degradation')
  expect(result.nextActions[0].target).toBe('temperature')
  expect(result.recommendations.every(item => item.action === 'investigate' && item.value === undefined)).toBe(true)
  expect(result.confidence.tier).toBe('unknown')
  expect(JSON.stringify(input)).toBe(before)
  expect(saveLearning).not.toHaveBeenCalled()
})

test('many hypotheses and complete answers do not manufacture calibrated confidence', async () => {
  const result = await inferKnowledgeRecommendations(context('flash', { phase: 'hold', location: 'local', mold: 'yes' }), undefined, { persistLearning: false })
  expect(result.guidedDiagnosis?.observedCount).toBe(3)
  expect(result.diagnosis).toHaveLength(4)
  expect(result.confidence.tier).toBe('unknown')
  expect(result.confidence.value).toBe(0)
})
