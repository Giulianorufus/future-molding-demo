import { DEFECT_CATALOG, findDefectCatalogEntries, resolveDefectCatalogEntry } from './defectCatalog'
import { assessCauseMaterial, DEFAULT_MATERIAL_LIMIT } from '../engine/knowledge/defectContext'
import { diagnose } from '../engine/knowledge/diagnosisEngine'
import { recommend } from '../engine/knowledge/recommendationEngine'
import type { KnowledgeContext } from '../engine/knowledge/types'

type Answers = Record<string, 'yes' | 'no' | 'unknown'>
type Material = { id: string; name: string; family: string | null; gfPct: number | null } | null
const PP: Material = { id: 'pp', name: 'PP (Polipropilene)', family: 'PP', gfPct: 0 }
const ABS: Material = { id: 'abs', name: 'ABS', family: 'ABS', gfPct: 0 }
const PA6: Material = { id: 'pa6', name: 'PA6', family: 'PA6', gfPct: 0 }
const PA6_GF30: Material = { id: 'pa6-gf30', name: 'PA6 GF30', family: 'PA6', gfPct: 30 }

const GROUP = ['voids', 'air_trap', 'cold_slug', 'delamination'] as const
const contextFor = (defectId: string, answers: Answers, material: Material = null): KnowledgeContext => ({
  input: { defectId, severity: 'medium', metadata: {} },
  output: { calculatedAtISO: new Date(0).toISOString(), rawResult: {} },
  defectContext: {
    defectId, severity: 'medium', severityLevel: 2, drawingId: 'drawing-a',
    pin: { id: 'pin-1', position: { x: 1, y: 2, z: 3 }, coordinateFrame: 'model-local', placement: 'mesh-raycast', drawingVersion: 'drawing-a' },
    geometry: null,
    answers,
    material,
  },
})
const reasonOf = async (defectId: string, causeId: string, answers: Answers, material: Material) => {
  const context = contextFor(defectId, answers, material)
  const recommendations = await recommend(await diagnose(context, []), context, [])
  return recommendations.find((item) => item.id === `defect-action:${causeId}`)!
}

describe.each(GROUP)('%s: scheda con cause da fonti dei produttori', (id) => {
  const entry = resolveDefectCatalogEntry(id)!

  test('has symptoms, ordered causes, explicit unique question IDs, sources with page and material limit', () => {
    expect(entry.symptoms.length).toBeGreaterThan(0)
    expect(entry.probableCauses.length).toBeGreaterThanOrEqual(3)
    expect(entry.verificationStatus).toBe('partial')
    expect(entry.automationStatus).toBe('disabled')
    expect(entry.correctionId).toBeNull()
    expect(entry.probableCauses.map((cause) => cause.order)).toEqual(entry.probableCauses.map((_, index) => index + 1))
    expect(new Set(entry.probableCauses.map((cause) => cause.questionId)).size).toBe(entry.probableCauses.length)
    expect(entry.semanticCautions?.length ?? 0).toBeGreaterThan(0)
    for (const cause of entry.probableCauses) {
      expect(cause.source).toMatch(/BASF|Mold-Masters/)
      expect(cause.sourceReference).toMatch(/§[\d.]+, PDF(\/stampata)? p\. \d+/)
      expect(cause.materialLimit).toBeTruthy()
      expect(`${cause.title} ${cause.description} ${cause.action}`).not.toMatch(/\d\s?%/)
      expect(cause.question).not.toMatch(/\b(è stat[oa]|sono stat[ie]|stat[oa]) (verificat|misurat|effettuat|controllat|eseguit)/i)
    }
    expect(entry.sources.every((source) => source.limit.length > 0 && source.reference.length > 0)).toBe(true)
  })

  test('context questions have no cause; IDs are scoped and unique in the whole catalog', () => {
    const contextual = entry.diagnosticQuestions.filter((question) => question.causeId === null)
    expect(contextual.length).toBeGreaterThan(0)
    for (const question of contextual) expect(question.id.startsWith(`${id}.`)).toBe(true)
    const all = DEFECT_CATALOG.flatMap((item) => item.diagnosticQuestions.map((question) => question.id))
    expect(new Set(all).size).toBe(all.length)
  })

  test('“Non so” is valid: no cause is declared and the action is only conditional', async () => {
    const context = contextFor(id, {})
    const diagnosis = await diagnose(context, [])
    expect(diagnosis.every((item) => item.metadata?.provenance === 'estimated')).toBe(true)
    const recommendations = await recommend(diagnosis, context, [])
    expect(recommendations.length).toBe(entry.probableCauses.length)
    for (const item of recommendations) {
      expect(item.reason).toContain('Risposta attuale “Non so”')
      expect(item.reason).toContain('Se il controllo conferma questa causa')
      expect(item.metadata?.automaticCorrection).toBe(false)
    }
  })

  test('the pin alone never declares a cause (geometry and pin are not evidence)', async () => {
    const context = contextFor(id, {})
    const diagnosis = await diagnose(context, [])
    expect(diagnosis.every((item) => item.metadata?.geometryUsedForCauseInference === false)).toBe(true)
    expect(diagnosis.some((item) => item.metadata?.provenance === 'operator-declared')).toBe(false)
  })

  test('a declared answer declares only that cause', async () => {
    const target = entry.probableCauses[1]
    const context = contextFor(id, { [target.questionId]: 'yes' })
    const diagnosis = await diagnose(context, [])
    expect(diagnosis.filter((item) => item.metadata?.provenance === 'operator-declared').map((item) => item.id)).toEqual([`defect-cause:${target.id}`])
  })

  test('is searchable by name and by historical alias', () => {
    expect(findDefectCatalogEntries(entry.nameIt).map((item) => item.id)).toContain(id)
    for (const alias of entry.legacyIds) expect(resolveDefectCatalogEntry(alias)?.id).toBe(id)
  })
})

describe('symptoms are distinguished from similar defects', () => {
  test('voids vs sink and bubbles: opposite mold-temperature advice is not transferred', () => {
    const voids = resolveDefectCatalogEntry('voids')!
    expect(voids.semanticCautions?.join(' ')).toMatch(/sink/)
    expect(voids.semanticCautions?.join(' ')).toMatch(/aumentare la temperatura stampo, per i sink di ridurla/)
    expect(voids.probableCauses[0].action).toMatch(/non trasferire l’azione tra le due schede/)
    expect(resolveDefectCatalogEntry('sink-mark')?.id).not.toBe('voids')
  })

  test('air trap vs diesel/voids, cold slug vs jetting/weld line, delamination vs scuff/splay', () => {
    expect(resolveDefectCatalogEntry('air_trap')!.semanticCautions?.join(' ')).toMatch(/effetto diesel/)
    expect(resolveDefectCatalogEntry('cold_slug')!.semanticCautions?.join(' ')).toMatch(/jetting/)
    expect(resolveDefectCatalogEntry('cold_slug')!.semanticCautions?.join(' ')).toMatch(/weld line/)
    expect(resolveDefectCatalogEntry('delamination')!.semanticCautions?.join(' ')).toMatch(/graffi da estrazione/)
  })

  test('cold slug nozzle-temperature advice is conditional on the observed cause', () => {
    const causes = resolveDefectCatalogEntry('cold_slug')!.probableCauses
    expect(causes.find((cause) => cause.id === 'cold-slug-nozzle-too-cold')!.action).toMatch(/scegli in base alla causa/)
    expect(causes.find((cause) => cause.id === 'cold-slug-dripping')!.action).toMatch(/inglobare aria/)
  })
})

describe('materialLimit reaches the operator in the recommendations', () => {
  test('every recommendation of every cause-bearing card carries a material note, even without a selected material', async () => {
    for (const entry of DEFECT_CATALOG.filter((item) => item.probableCauses.length > 0)) {
      const context = contextFor(entry.id, {})
      const recommendations = await recommend(await diagnose(context, []), context, [])
      for (const cause of entry.probableCauses) {
        const item = recommendations.find((rec) => rec.id === `defect-action:${cause.id}`)!
        expect(item.reason).toMatch(/Limite per materiale:|Fuori ambito|Applicabilità non dimostrata|seleziona il materiale/)
        expect(item.metadata?.materialLimit).toBe(cause.materialLimit ?? DEFAULT_MATERIAL_LIMIT)
      }
    }
  })

  test('the stated limit text is shown verbatim', async () => {
    const cause = resolveDefectCatalogEntry('cold_slug')!.probableCauses[4]
    const item = await reasonOf('cold_slug', cause.id, { [cause.questionId]: 'yes' }, PP)
    expect(item.reason).toContain(cause.materialLimit!)
    const fallback = await reasonOf('short_shot', 'dose-cushion', {}, PP)
    expect(fallback.reason).toContain(DEFAULT_MATERIAL_LIMIT)
  })

  test('a cause restricted by the source is flagged outside scope for an incompatible material, never presented without reservations', async () => {
    const gradient = await reasonOf('warpage', 'high-pressure-gradient', { 'pressure-gradient-high': 'yes' }, PA6_GF30)
    expect(gradient.reason).toMatch(/^Fuori ambito per PA6 GF30/)
    expect(gradient.reason).toContain('non applicabile senza riserve')
    expect(gradient.metadata?.materialApplicability).toBe('outside-scope')

    const ok = await reasonOf('warpage', 'high-pressure-gradient', { 'pressure-gradient-high': 'yes' }, PP)
    expect(ok.metadata?.materialApplicability).toBe('unrestricted')
    expect(ok.reason).not.toMatch(/Fuori ambito/)
    expect(Number(ok.priority)).toBeGreaterThan(Number(gradient.priority))

    const fiber = await reasonOf('warpage', 'fiber-orientation-variation', { 'fiber-orientation-changes': 'yes' }, PP)
    expect(fiber.reason).toMatch(/^Fuori ambito per PP/)
    const fiberOk = await reasonOf('warpage', 'fiber-orientation-variation', { 'fiber-orientation-changes': 'yes' }, PA6_GF30)
    expect(fiberOk.metadata?.materialApplicability).toBe('unrestricted')
  })

  test('“mainly” statements give a reservation instead of an exclusion, also on the “Non so” path', async () => {
    const mold = await reasonOf('warpage', 'uneven-mold-temperature', {}, PA6_GF30)
    expect(mold.reason).toMatch(/Applicabilità non dimostrata per PA6 GF30/)
    expect(mold.reason).toContain('Risposta attuale “Non so”')

    const skinsPp = await reasonOf('delamination', 'delam-air-metering-skins', { 'delam-skins-air-metering': 'yes' }, PP)
    expect(skinsPp.metadata?.materialApplicability).toBe('unrestricted')
    for (const material of [ABS, PA6_GF30]) {
      const item = await reasonOf('delamination', 'delam-air-metering-skins', { 'delam-skins-air-metering': 'yes' }, material)
      expect(item.metadata?.materialApplicability).toBe('outside-scope')
    }
    const pa6 = await reasonOf('delamination', 'delam-air-metering-skins', {}, PA6)
    expect(pa6.metadata?.materialApplicability).toBe('unrestricted')
  })

  test('without a selected material a restricted action asks to select it', async () => {
    const item = await reasonOf('warpage', 'fiber-orientation-variation', {}, null)
    expect(item.metadata?.materialApplicability).toBe('unknown-material')
    expect(item.reason).toContain('seleziona il materiale')
    expect(assessCauseMaterial({ materialScope: { requires: 'unreinforced', strength: 'only' } }, { name: 'X', family: null, gfPct: null }).status).toBe('unknown-material')
  })
})
