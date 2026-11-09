import { DEFECT_CATEGORIES, DEFECT_GUIDES, buildGuidedDiagnosis, getDefectGuide, normalizeDefectText, searchDefectGuides } from '../guidedDiagnosis'
import { EXTENDED_DEFECT_GUIDES } from '../extendedDefectGuides'
import { DEFECT_RULES } from '@/data/defectRules'
import { inferKnowledgeRecommendations } from '../knowledgeEngine'
import { mapLegacyDefectId } from '@/defects/defectAdapter'

const basfTopics = ['short-shot', 'flash', 'burn-mark', 'sink-mark', 'weld-line', 'delamination', 'black-specks', 'demolding', 'jetting', 'gloss-variation', 'cold-slug', 'air-trap', 'voids', 'dull-spots', 'record-grooves', 'color-streaks', 'moisture-streaks', 'fiber-streaks', 'thermal-streaks', 'tiger-lines', 'stress-cracking', 'unmelted', 'warpage', 'mold-deposit']

test('all BASF reference topics and all legacy catalog names resolve to a diagnostic guide', () => {
  for (const id of basfTopics) expect(getDefectGuide(id)?.id).toBe(id)
  for (const defect of DEFECT_RULES) expect(getDefectGuide(defect.id)).toBeDefined()
})

test('catalog identifiers and normalized synonyms do not resolve to another defect', () => {
  expect(new Set(DEFECT_GUIDES.map(guide => guide.id)).size).toBe(DEFECT_GUIDES.length)
  const ownership = new Map<string, string>()
  for (const guide of DEFECT_GUIDES) {
    expect(DEFECT_CATEGORIES).toContain(guide.category)
    expect(guide.source.url).toMatch(/^https:\/\//)
    for (const name of [guide.id, guide.label, ...(guide.aliases ?? [])]) {
      const key = normalizeDefectText(name)
      expect(ownership.get(key) ?? guide.id).toBe(guide.id)
      ownership.set(key, guide.id)
      expect(getDefectGuide(name)?.id).toBe(guide.id)
    }
  }
})

test('search handles Italian accents, English synonyms, categories and no-match cases', () => {
  expect(searchDefectGuides('umidità').some(guide => guide.id === 'moisture-streaks')).toBe(true)
  expect(searchDefectGuides('glass fibre').map(guide => guide.id)).toContain('fiber-streaks')
  expect(searchDefectGuides('cold_slug').map(guide => guide.id)).toEqual(['cold-slug'])
  expect(searchDefectGuides('satinatura').map(guide => guide.id)).toEqual(['gloss-variation'])
  expect(searchDefectGuides('', 'Estrazione').every(guide => guide.category === 'Estrazione')).toBe(true)
  expect(searchDefectGuides('glass fibre', 'Estrazione')).toHaveLength(0)
  expect(searchDefectGuides('nome inesistente')).toHaveLength(0)
})

test('each guide has valid distinct questions and usable actions without fabricated setpoints', async () => {
  for (const guide of DEFECT_GUIDES) {
    expect(new Set(guide.questions.map(question => question.id)).size).toBe(3)
    for (const cause of guide.causes) {
      expect(cause.checks.length).toBeGreaterThanOrEqual(2)
      expect(cause.checks.every(check => check.trim().length > 20)).toBe(true)
      for (const rule of cause.evidence) {
        const question = guide.questions.find(item => item.id === rule.question)
        expect(question).toBeDefined()
        for (const value of rule.values) {
          expect(question!.options.some(option => option.value === value && value !== 'unknown')).toBe(true)
        }
      }
    }
    const result = await inferKnowledgeRecommendations({ input: { defectId: guide.id }, output: { calculatedAtISO: new Date().toISOString(), rawResult: {} } }, undefined, { persistLearning: false })
    expect(result.recommendations).toHaveLength(guide.causes.length)
    expect(result.recommendations.every(item => item.action === 'investigate' && item.value === undefined)).toBe(true)
    expect(result.confidence.tier).toBe('unknown')
  }
})

test.each(EXTENDED_DEFECT_GUIDES.map(guide => [guide.id, guide] as const))('%s: each observed branch promotes its specific cause', (_id, guide) => {
  for (const cause of guide.causes) {
    const condition = cause.evidence[0]
    const report = buildGuidedDiagnosis(guide.id, { [condition.question]: condition.values[0] })!
    expect(report.hypotheses[0].id).toBe(cause.id)
    expect(report.hypotheses[0].evidence).toHaveLength(1)
  }
})

test('qualitative-only defects never acquire a generic numerical correction', () => {
  for (const guide of DEFECT_GUIDES) {
    if (['short-shot', 'flash', 'sink-mark', 'warpage'].includes(guide.id)) expect(mapLegacyDefectId(guide.id)).not.toBeNull()
    else expect(mapLegacyDefectId(guide.id)).toBeNull()
  }
})
