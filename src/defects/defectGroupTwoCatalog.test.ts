import { DEFECT_CATALOG, findDefectCatalogEntries, resolveDefectCatalogEntry } from './defectCatalog'
import { detectClarificationRequests } from '../engine/knowledge/defectContext'
import { diagnose } from '../engine/knowledge/diagnosisEngine'
import { recommend } from '../engine/knowledge/recommendationEngine'
import type { KnowledgeContext } from '../engine/knowledge/types'

const GROUP = ['warpage', 'weld_line', 'jetting', 'splay'] as const
const contextFor = (defectId: string, answers: Record<string, 'yes' | 'no' | 'unknown'>): KnowledgeContext => ({
  input: { defectId, severity: 'medium', metadata: {} },
  output: { calculatedAtISO: new Date(0).toISOString(), rawResult: {} },
  defectContext: {
    defectId, severity: 'medium', severityLevel: 2, drawingId: 'drawing-a',
    pin: { id: 'pin-1', position: { x: 1, y: 2, z: 3 }, coordinateFrame: 'model-local', placement: 'mesh-raycast', drawingVersion: 'drawing-a' },
    geometry: null,
    answers,
  },
})

describe.each(GROUP)('%s: scheda con cause BASF', (id) => {
  const entry = resolveDefectCatalogEntry(id)!

  test('has symptoms, explicit question IDs, ordered causes and BASF references with material limits', () => {
    expect(entry.symptoms.length).toBeGreaterThan(0)
    expect(entry.probableCauses.length).toBeGreaterThan(0)
    expect(entry.verificationStatus).toBe('partial')
    expect(entry.automationStatus).toBe('disabled')
    expect(entry.correctionId).toBeNull()
    expect(entry.probableCauses.map((cause) => cause.order)).toEqual(entry.probableCauses.map((_, index) => index + 1))
    expect(new Set(entry.probableCauses.map((cause) => cause.questionId)).size).toBe(entry.probableCauses.length)
    for (const cause of entry.probableCauses) {
      expect(cause.source).toContain('BASF')
      expect(cause.sourceReference).toMatch(/§\d+, PDF\/stampata p\. \d+/)
      expect(cause.materialLimit).toBeTruthy()
      expect(`${cause.title} ${cause.description} ${cause.action}`).not.toMatch(/\d\s?%/)
      expect(cause.question).not.toMatch(/\b(è stat[oa]|sono stat[ie]|stat[oa]) (verificat|misurat|effettuat|controllat|eseguit)/i)
    }
    expect(entry.sources.some((source) => source.publisher === 'BASF' && /nessun valore numerico/.test(source.limit))).toBe(true)
  })

  test('context questions have no cause; cause questions point to their own cause; IDs are unique in the catalog', () => {
    const contextual = entry.diagnosticQuestions.filter((question) => question.causeId === null)
    expect(contextual.length).toBeGreaterThan(0)
    for (const question of contextual) expect(question.id.startsWith(`${id}.`)).toBe(true)
    for (const cause of entry.probableCauses) {
      expect(entry.diagnosticQuestions.find((question) => question.id === cause.questionId)).toMatchObject({ causeId: cause.id, text: cause.question })
    }
    const all = DEFECT_CATALOG.flatMap((item) => item.diagnosticQuestions.map((question) => question.id))
    expect(new Set(all).size).toBe(all.length)
  })

  test('a declared answer declares only that cause; the others stay estimated', async () => {
    const target = entry.probableCauses[0]
    const context = contextFor(id, { [target.questionId]: 'yes' })
    const diagnosis = await diagnose(context, [])
    const declared = diagnosis.filter((item) => item.metadata?.provenance === 'operator-declared').map((item) => item.id)
    expect(declared).toEqual([`defect-cause:${target.id}`])
    expect(diagnosis).toHaveLength(entry.probableCauses.length)
    const recommendations = await recommend(diagnosis, context, [])
    expect(recommendations.every((item) => item.metadata?.automaticCorrection === false)).toBe(true)
  })

  test('is searchable by name and by historical alias', () => {
    expect(findDefectCatalogEntries(entry.nameIt).map((item) => item.id)).toContain(id)
    for (const alias of entry.legacyIds) expect(resolveDefectCatalogEntry(alias)?.id).toBe(id)
  })
})

describe('material limits stated by the source', () => {
  test('warpage: mold temperature and multi-gating only for unreinforced; fiber orientation only for glass-fiber grades', () => {
    const warpage = resolveDefectCatalogEntry('warpage')!.probableCauses
    const limit = (id: string) => warpage.find((cause) => cause.id === id)!.materialLimit
    expect(limit('uneven-mold-temperature')).toMatch(/non rinforzati/)
    expect(limit('high-pressure-gradient')).toMatch(/non rinforzati/)
    expect(limit('fiber-orientation-variation')).toMatch(/fibra di vetro/)
  })

  test('splay: the moisture limit comes from the product data, not from the app', () => {
    const cause = resolveDefectCatalogEntry('splay')!.probableCauses.find((item) => item.id === 'residual-moisture')!
    expect(cause.materialLimit).toMatch(/dipende dal prodotto/)
    expect(cause.action).toMatch(/limite indicato per il prodotto/)
  })

  test('weld line: an inevitable weld line is not treated as a process error', () => {
    expect(resolveDefectCatalogEntry('weld_line')!.semanticCautions?.join(' ')).toMatch(/spesso inevitabile/)
  })

  test('weld line: speed is raised only without venting problems', () => {
    const weld = resolveDefectCatalogEntry('weld_line')!.probableCauses
    expect(weld.find((cause) => cause.id === 'cold-melt-fronts')!.action).toMatch(/solo senza problemi di sfiato/)
    expect(weld.find((cause) => cause.id === 'weld-venting')!.action).toMatch(/non aumentare la velocità/)
  })
})

describe('splay: moisture and local friction', () => {
  test('both declared: clarification request, both hypotheses kept, no exclusion', async () => {
    const answers = { 'moisture-above-limit': 'yes', 'local-friction-silver-streaks': 'yes' } as const
    const requests = detectClarificationRequests('splay', answers)
    expect(requests).toHaveLength(1)
    expect(requests[0].message).toMatch(/zone o segni diversi/)
    const context = contextFor('splay', answers)
    const diagnosis = await diagnose(context, [])
    expect(diagnosis.filter((item) => item.metadata?.provenance === 'operator-declared').map((item) => item.id)).toEqual(['defect-cause:residual-moisture', 'defect-cause:local-friction'])
  })

  test('moisture-related causes together do not trigger a request', () => {
    expect(detectClarificationRequests('splay', { 'moisture-above-limit': 'yes', 'hopper-zone-too-cold': 'yes' })).toEqual([])
  })
})
