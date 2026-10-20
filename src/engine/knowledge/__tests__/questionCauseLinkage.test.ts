import { diagnose } from '../diagnosisEngine'
import { recommend } from '../recommendationEngine'
import { resolveDefectCatalogEntry } from '@/defects/defectCatalog'
import type { KnowledgeContext } from '../types'

const contextWith = (answers: Record<string, 'yes' | 'no' | 'unknown'>): KnowledgeContext => ({
  input: { defectId: 'burn_mark', severity: 'medium', metadata: { volumeCm3: 20, boundingBoxMm: { x: 20, y: 30, z: 10 } } },
  output: { calculatedAtISO: new Date(0).toISOString(), rawResult: {} },
  defectContext: {
    defectId: 'burn_mark', severity: 'medium', severityLevel: 2, drawingId: 'drawing-a',
    pin: { id: 'pin-1', position: { x: 1, y: 2, z: 3 }, coordinateFrame: 'model-local', placement: 'mesh-raycast', drawingVersion: 'drawing-a' },
    geometry: { volumeCm3: 20, boundingBoxMm: { x: 20, y: 30, z: 10 }, source: 'cad-analysis' },
    answers,
  },
})

describe('question-to-cause linkage', () => {
  test('answers keyed by question.id stay tied to the right cause after reordering questions', async () => {
    const entry = resolveDefectCatalogEntry('burn_mark')!
    const reordered = [...entry.diagnosticQuestions].reverse()
    const target = reordered.find((q) => q.causeId === 'high-shear-streaks')!
    expect(reordered.indexOf(target)).not.toBe(entry.diagnosticQuestions.indexOf(target))
    expect(reordered.map((q) => q.causeId)).not.toEqual(entry.diagnosticQuestions.map((q) => q.causeId))

    const answers: Record<string, 'yes' | 'no' | 'unknown'> = {}
    for (const question of reordered) answers[question.id] = question.id === target.id ? 'yes' : 'unknown'

    const context = contextWith(answers)
    const diagnosis = await diagnose(context, [])
    const declared = diagnosis.filter((item) => item.metadata?.provenance === 'operator-declared')
    expect(declared.map((item) => item.id)).toEqual([`defect-cause:${target.causeId}`])

    const recommendations = await recommend(diagnosis, context, [])
    const declaredRec = recommendations.find((item) => item.id === `defect-action:${target.causeId}`)
    expect(declaredRec).toMatchObject({ target: target.id })
    expect(declaredRec?.reason).toContain('dichiarata')
    const others = recommendations.filter((item) => item.id !== declaredRec?.id && item.id.startsWith('defect-action:'))
    expect(others.length).toBeGreaterThan(0)
    for (const rec of others) expect(rec.reason).not.toContain('dichiarata')
  })

  test('every question of cause-bearing entries links to an existing cause; pending ones use null', () => {
    for (const id of ['short_shot', 'burn_mark', 'flash', 'sink']) {
      const entry = resolveDefectCatalogEntry(id)!
      for (const question of entry.diagnosticQuestions) {
        const cause = entry.probableCauses.find((item) => item.id === question.causeId)
        expect(cause?.questionId).toBe(question.id)
        expect(cause?.question).toBe(question.text)
      }
    }
    const pendingEntry = resolveDefectCatalogEntry('fold_marks')!
    expect(pendingEntry.diagnosticQuestions.map((q) => q.id)).toEqual(['fold_marks.distinct-from-weld', 'fold_marks.location-vs-gate'])
    expect(pendingEntry.diagnosticQuestions.every((q) => q.causeId === null)).toBe(true)
  })
})

