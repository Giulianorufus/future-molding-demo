import { diagnose } from '../diagnosisEngine'
import { recommend } from '../recommendationEngine'
import { assessConfidence } from '../confidenceEngine'
import type { KnowledgeContext } from '../types'

const baseContext: KnowledgeContext = {
  input: {
    defectId: 'burn_mark',
    severity: 'medium',
    metadata: {
      volumeCm3: 20,
      boundingBoxMm: { x: 20, y: 30, z: 10 },
    },
  },
  output: { calculatedAtISO: new Date(0).toISOString(), rawResult: {} },
  defectContext: {
    defectId: 'burn_mark',
    severity: 'medium',
    severityLevel: 2,
    drawingId: 'drawing-a',
    pin: {
      id: 'burn_marks',
      position: { x: 0, y: 0, z: 20 },
      coordinateFrame: 'viewer-local',
      placement: 'catalog-estimate',
    },
    geometry: { volumeCm3: 20, boundingBoxMm: { x: 20, y: 30, z: 10 }, source: 'cad-analysis' },
    answers: { 'localized-end-fill': 'unknown', 'thermal-damage': 'yes' },
  },
}

describe('contextual defect diagnosis', () => {
  test('carries drawing and pin into estimated and operator-declared causes', async () => {
    const diagnosis = await diagnose(baseContext, [])
    const estimated = diagnosis.find((item) => item.id === 'defect-cause:compressed-air')
    const declared = diagnosis.find((item) => item.id === 'defect-cause:thermal-or-shear-damage')

    expect(estimated).toMatchObject({
      metadata: {
        provenance: 'estimated',
        drawingId: 'drawing-a',
        severityLevel: 2,
        pinId: 'burn_marks',
        pinPlacement: 'catalog-estimate',
        geometryUsedForCauseInference: false,
      },
    })
    expect(declared).toMatchObject({ metadata: { provenance: 'operator-declared', answer: 'yes' } })
  })

  test('does not turn a pin or available CAD dimensions into an observed vent or end-fill condition', async () => {
    const context = {
      ...baseContext,
      defectContext: { ...baseContext.defectContext, answers: {} },
    }
    const diagnosis = await diagnose(context, [])

    expect(diagnosis.every((item) => item.metadata?.provenance === 'estimated')).toBe(true)
    expect(diagnosis.every((item) => item.metadata?.geometryUsedForCauseInference === false)).toBe(true)
    expect(diagnosis.some((item) => item.metadata?.provenance === 'operator-declared')).toBe(false)
  })

  test('missing geometry remains explicit and cannot qualify an estimated cause', async () => {
    const context = {
      ...baseContext,
      input: { ...baseContext.input, volumeCm3: null, metadata: { geometryUsedForCauseInference: false } },
      defectContext: { ...baseContext.defectContext, geometry: null, answers: {} },
    }
    const diagnosis = await diagnose(context, [])
    const recommendation = (await recommend(diagnosis, context, []))[0]

    expect(context.defectContext.geometry).toBeNull()
    expect(diagnosis.every((item) => item.metadata?.provenance === 'estimated')).toBe(true)
    expect(diagnosis.every((item) => item.metadata?.geometryUsedForCauseInference === false)).toBe(true)
    expect(recommendation.reason).toContain('Risposta attuale “Non so”')
    expect(recommendation.metadata?.automaticCorrection).toBe(false)
    expect(assessConfidence(diagnosis, [], []).value).toBe(0)
  })

  test.each(['short_shot', 'burn_mark', 'flash', 'sink'] as const)(
    'offers only diagnostic checks for %s without a declared condition',
    async (defectId) => {
      const context = {
        ...baseContext,
        input: { ...baseContext.input, defectId },
        defectContext: { ...baseContext.defectContext, defectId, answers: {} },
      }
      const diagnosis = await diagnose(context, [])
      const recommendations = await recommend(diagnosis, context, [])

      expect(diagnosis.length).toBeGreaterThan(0)
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.every((item) => item.action === 'investigate')).toBe(true)
      expect(recommendations.every((item) => item.metadata?.automaticCorrection === false)).toBe(true)
    },
  )

  test('a declared negative answer removes the corresponding cause and action', async () => {
    const context = {
      ...baseContext,
      defectContext: { ...baseContext.defectContext, answers: { 'localized-end-fill': 'no' as const } },
    }
    const diagnosis = await diagnose(context, [])
    const recommendations = await recommend(diagnosis, context, [])

    expect(diagnosis.some((item) => item.id === 'defect-cause:compressed-air')).toBe(false)
    expect(recommendations.some((item) => item.id === 'defect-action:compressed-air')).toBe(false)
  })
})
