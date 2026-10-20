import { RETIRED_QUESTION_IDS, DEFECT_CATALOG, migrateStoredAnswers, resolveDefectCatalogEntry } from './defectCatalog'
import { migrateDefectsState } from '../stores/defectsStore'
import { detectClarificationRequests } from '../engine/knowledge/defectContext'
import { diagnose } from '../engine/knowledge/diagnosisEngine'
import { recommend } from '../engine/knowledge/recommendationEngine'
import type { KnowledgeContext } from '../engine/knowledge/types'

type Answers = Record<string, 'yes' | 'no' | 'unknown'>
const contextFor = (defectId: string, answers: Answers): KnowledgeContext => ({
  input: { defectId, severity: 'medium', metadata: {} },
  output: { calculatedAtISO: new Date(0).toISOString(), rawResult: {} },
  defectContext: {
    defectId, severity: 'medium', severityLevel: 2, drawingId: 'drawing-a',
    pin: { id: 'pin-1', position: { x: 1, y: 2, z: 3 }, coordinateFrame: 'model-local', placement: 'mesh-raycast', drawingVersion: 'drawing-a' },
    geometry: null,
    answers,
  },
})

describe('stored answers with legacy question IDs', () => {
  test('the explicit historical map converts the scheda-prefixed IDs; unprefixed or unknown keys stay in legacyAnswers', () => {
    const migrated = migrateStoredAnswers('jetting', { 'jetting-q1': 'yes', 'jetting-q2': 'no', 'catalog-question-1': 'no', 'other-key': 'yes' })
    expect(migrated.answers).toEqual({ 'jetting.starts-at-gate': 'yes', 'jetting.first-fill-phase-only': 'no' })
    expect(migrated.legacyAnswers).toEqual({ 'catalog-question-1': 'no', 'other-key': 'yes' })
  })

  test('an ID prefixed with another scheda is not accepted: warpage-q1 is not a Jetting question', () => {
    const migrated = migrateStoredAnswers('jetting', { 'warpage-q1': 'yes' })
    expect(migrated.answers).toEqual({})
    expect(migrated.legacyAnswers).toEqual({ 'warpage-q1': 'yes' })
    expect(migrateStoredAnswers('warpage', { 'warpage-q1': 'yes' }).answers).toEqual({ 'warpage.deviation-measured': 'yes' })
  })

  test('every historical key carries its own scheda prefix and points to a current question of that scheda', () => {
    for (const entry of DEFECT_CATALOG.filter((item) => !['short_shot', 'burn_mark', 'flash', 'sink'].includes(item.id))) {
      const probe = Object.fromEntries([1, 2].map((n) => [`${entry.id}-q${n}`, 'yes' as const]))
      const migrated = migrateStoredAnswers(entry.id, probe)
      const current = new Set(entry.diagnosticQuestions.map((question) => question.id))
      for (const id of Object.keys(migrated.answers)) {
        expect(id.startsWith(`${entry.id}.`)).toBe(true)
        expect(current.has(id)).toBe(true)
      }
      expect(Object.keys(migrated.answers)).toHaveLength(2)
    }
  })

  test('the mapping does not depend on question order: reordering or inserting questions changes nothing', () => {
    const entry = resolveDefectCatalogEntry('jetting')!
    const stored: Answers = { 'jetting-q1': 'yes', 'jetting-q2': 'no' }
    const baseline = migrateStoredAnswers('jetting', stored, entry)
    const reordered = { ...entry, diagnosticQuestions: [...entry.diagnosticQuestions].reverse() }
    const inserted = { ...entry, diagnosticQuestions: [{ id: 'jetting.new-question', text: 'N?', causeId: null }, ...entry.diagnosticQuestions] }
    expect(migrateStoredAnswers('jetting', stored, reordered)).toEqual(baseline)
    expect(migrateStoredAnswers('jetting', stored, inserted)).toEqual(baseline)
  })

  test('if the same question has both an old and a current ID, the current answer wins and the old one is kept aside', () => {
    const migrated = migrateStoredAnswers('jetting', { 'jetting-q1': 'no', 'jetting.starts-at-gate': 'yes' })
    expect(migrated.answers).toEqual({ 'jetting.starts-at-gate': 'yes' })
    expect(migrated.legacyAnswers).toEqual({ 'jetting-q1': 'no' })
  })

  test('the combined thermal-damage answer is not transferred to the thermal or shear causes', async () => {
    const migrated = migrateStoredAnswers('burn_mark', { 'thermal-damage': 'yes', 'localized-end-fill': 'yes' })
    expect(migrated.answers).toEqual({})
    expect(migrated.legacyAnswers).toEqual({ 'thermal-damage': 'yes', 'localized-end-fill': 'yes' })
    const context = contextFor('burn_mark', migrated.answers)
    const diagnosis = await diagnose(context, [])
    expect(diagnosis.some((item) => item.metadata?.provenance === 'operator-declared')).toBe(false)
  })

  test('answers to current question IDs are kept as they are', () => {
    const migrated = migrateStoredAnswers('burn_mark', { 'shear-streaks': 'yes' })
    expect(migrated).toEqual({ answers: { 'shear-streaks': 'yes' }, legacyAnswers: {}, retiredQuestionIds: [] })
  })

  test('retired IDs are never reused by a current question', () => {
    for (const [defectId, retired] of Object.entries(RETIRED_QUESTION_IDS)) {
      const current = resolveDefectCatalogEntry(defectId)!.diagnosticQuestions.map((question) => question.id)
      for (const id of Object.keys(retired)) expect(current).not.toContain(id)
    }
    expect(DEFECT_CATALOG).toHaveLength(24)
  })

  test('the persisted store migration rewrites old evaluations and flags what was not transferred', () => {
    const state = migrateDefectsState({
      evaluations: [{
        caseId: 'c', drawingId: 'd', defectId: 'burn_mark', pinId: 'p', reportedSeverity: 2, pinPosition: { x: 0, y: 0, z: 0 },
        evaluations: [{ id: 'e', severityBefore: 2, severityAfter: 1, interventionTried: 'x', answers: { 'thermal-damage': 'yes', 'blocked-venting-q': 'no', 'venting-obstruction': 'yes' }, evaluatedAtISO: '2026-01-01' }],
      }],
    }, 0) as { evaluations: { evaluations: { answers: Answers; legacyAnswers: Answers }[] }[] }
    const entry = state.evaluations[0].evaluations[0]
    expect(entry.answers).toEqual({ 'venting-obstruction': 'yes' })
    expect(Object.keys(entry.legacyAnswers).sort()).toEqual(['blocked-venting-q', 'thermal-damage'])
  })
})

describe('diesel, thermal degradation and shear', () => {
  test('a single declared phenomenon raises no clarification request', () => {
    expect(detectClarificationRequests('burn_mark', { 'diesel-localized-black-mark': 'yes', 'venting-obstruction': 'yes' })).toEqual([])
    expect(detectClarificationRequests('burn_mark', { 'thermal-degradation-evidence': 'yes', 'shear-streaks': 'no' })).toEqual([])
  })

  test.each([
    [{ 'diesel-localized-black-mark': 'yes', 'thermal-degradation-evidence': 'yes' }, ['compressed-air', 'thermal-degradation']],
    [{ 'diesel-localized-black-mark': 'yes', 'shear-streaks': 'yes' }, ['compressed-air', 'high-shear-streaks']],
    [{ 'thermal-degradation-evidence': 'yes', 'shear-streaks': 'yes' }, ['thermal-degradation', 'high-shear-streaks']],
  ] as [Answers, string[]][])('contradictory answers %#: flagged with a discriminating check, no cause is excluded', async (answers, causeIds) => {
    const conflicts = detectClarificationRequests('burn_mark', answers)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].causeIds).toEqual(causeIds)
    expect(conflicts[0].discriminatingCheck).toMatch(/BASF §3/)

    const context = contextFor('burn_mark', answers)
    const diagnosis = await diagnose(context, [])
    const declared = diagnosis.filter((item) => item.metadata?.provenance === 'operator-declared').map((item) => item.id.replace('defect-cause:', ''))
    expect(declared).toEqual(causeIds)
    const recommendations = await recommend(diagnosis, context, [])
    const conflictRec = recommendations.find((item) => item.id.startsWith('defect-clarification:'))
    expect(conflictRec?.reason).toContain('indica se riguardano zone o segni diversi')
    expect(conflictRec?.reason).toContain('Entrambe le ipotesi restano aperte')
    expect(conflictRec?.reason).not.toMatch(/incompatibil/i)
    expect(conflictRec?.metadata?.automaticCorrection).toBe(false)
  })
})

describe('actions match what the question confirms', () => {
  test('sink: a holding shorter than gate-open is not presented as the proven cause', async () => {
    const cause = resolveDefectCatalogEntry('sink')!.probableCauses.find((item) => item.id === 'insufficient-holding')!
    expect(cause.questionId).toBe('holding-shorter-than-gate-open')
    expect(cause.title).toMatch(/possibile/)
    expect(cause.description).toMatch(/non dimostra/)
    expect(cause.action).toMatch(/verifica se l.affossamento cambia/)
    expect(cause.action).toMatch(/altre cause/)

    const context = contextFor('sink', { 'holding-shorter-than-gate-open': 'yes' })
    const recommendations = await recommend(await diagnose(context, []), context, [])
    expect(recommendations.find((item) => item.id === 'defect-action:insufficient-holding')?.reason).toMatch(/non dimostra che sia l.unica causa/)
  })
})
