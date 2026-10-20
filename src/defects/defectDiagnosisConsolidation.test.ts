import { DEFECT_CATALOG, pendingQuestions, resolveDefectCatalogEntry } from './defectCatalog'
import { diagnose } from '../engine/knowledge/diagnosisEngine'
import { recommend } from '../engine/knowledge/recommendationEngine'
import type { KnowledgeContext } from '../engine/knowledge/types'

const contextFor = (defectId: string, answers: Record<string, 'yes' | 'no' | 'unknown'>): KnowledgeContext => ({
  input: { defectId, severity: 'medium', metadata: { volumeCm3: 20, boundingBoxMm: { x: 20, y: 30, z: 10 } } },
  output: { calculatedAtISO: new Date(0).toISOString(), rawResult: {} },
  defectContext: {
    defectId, severity: 'medium', severityLevel: 2, drawingId: 'drawing-a',
    pin: { id: 'pin-1', position: { x: 1, y: 2, z: 3 }, coordinateFrame: 'model-local', placement: 'mesh-raycast', drawingVersion: 'drawing-a' },
    geometry: { volumeCm3: 20, boundingBoxMm: { x: 20, y: 30, z: 10 }, source: 'cad-analysis' },
    answers,
  },
})

describe('pending question IDs', () => {
  test('stay the same when questions are reordered or a new one is inserted', () => {
    const base = [{ id: 'a', text: 'A?' }, { id: 'b', text: 'B?' }]
    const before = Object.fromEntries(pendingQuestions('x', base).map((q) => [q.text, q.id]))
    const reordered = Object.fromEntries(pendingQuestions('x', [...base].reverse()).map((q) => [q.text, q.id]))
    const inserted = Object.fromEntries(pendingQuestions('x', [base[0], { id: 'new', text: 'N?' }, base[1]]).map((q) => [q.text, q.id]))
    expect(reordered).toEqual(before)
    expect(inserted['A?']).toBe(before['A?'])
    expect(inserted['B?']).toBe(before['B?'])
  })

  test('catalog IDs are unique, scoped by entry and not positional', () => {
    const ids = DEFECT_CATALOG.flatMap((entry) => entry.diagnosticQuestions.map((q) => q.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const entry of DEFECT_CATALOG.filter((item) => item.probableCauses.length === 0)) {
      for (const question of entry.diagnosticQuestions) {
        expect(question.id.startsWith(`${entry.id}.`)).toBe(true)
        expect(question.id).not.toMatch(/(^|[-.])q?\d+$/)
      }
    }
  })
})

describe('"Sì" confirms the cause condition, not that a check was performed', () => {
  test('no cause question asks only whether a verification was carried out', () => {
    const checkOnly = /\b(è stat[oa]|sono stat[ie]|stat[oa]) (verificat|misurat|effettuat|controllat|eseguit)/i
    for (const id of ['short_shot', 'burn_mark', 'flash', 'sink']) {
      for (const question of resolveDefectCatalogEntry(id)!.diagnosticQuestions) {
        expect(question.text).not.toMatch(checkOnly)
      }
    }
  })
})

describe('burn: diesel effect vs thermal degradation vs shear', () => {
  const burn = resolveDefectCatalogEntry('burn_mark')!
  const cause = (id: string) => burn.probableCauses.find((item) => item.id === id)!

  test('phenomena are separate causes with distinct questions and actions', () => {
    expect(burn.probableCauses.map((item) => item.id)).toEqual([
      'compressed-air', 'blocked-venting', 'parting-line-air-release', 'thermal-degradation', 'high-shear-streaks',
    ])
    expect(new Set(burn.probableCauses.map((item) => item.questionId)).size).toBe(burn.probableCauses.length)
    expect(cause('compressed-air').question).toMatch(/senza striature/)
    for (const id of ['thermal-degradation', 'high-shear-streaks']) {
      expect(cause(id).action).toMatch(/non applicare i rimedi dell.effetto diesel/)
      expect(cause(id).sourceReference).toContain('§18')
    }
    for (const id of ['compressed-air', 'blocked-venting', 'parting-line-air-release']) expect(cause(id).sourceReference).toContain('§3')
  })

  test('a declared thermal degradation does not declare the diesel causes', async () => {
    const context = contextFor('burn_mark', { 'thermal-damage': 'yes' })
    const diagnosis = await diagnose(context, [])
    const declared = diagnosis.filter((item) => item.metadata?.provenance === 'operator-declared').map((item) => item.id)
    expect(declared).toEqual(['defect-cause:thermal-degradation'])
    const recommendations = await recommend(diagnosis, context, [])
    expect(recommendations.find((item) => item.id === 'defect-action:thermal-degradation')?.reason).toContain('dichiarata')
    expect(recommendations.find((item) => item.id === 'defect-action:compressed-air')?.reason).not.toContain('dichiarata')
  })
})

describe('no universal correction percentages in cause actions', () => {
  test('cause texts contain no percentages', () => {
    for (const id of ['short_shot', 'burn_mark', 'flash', 'sink']) {
      for (const cause of resolveDefectCatalogEntry(id)!.probableCauses) {
        expect(`${cause.title} ${cause.description} ${cause.action}`).not.toMatch(/\d\s?%/)
      }
    }
  })
})
