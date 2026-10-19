import { resolveDefectIntegration } from './defectAdapter'
import {
  appendEvaluation,
  buildDefectCaseId,
  buildDefectKnowledgeContext,
  severityToLevel,
  type DefectEvaluationCase,
} from './defectAssessment'

describe('contextual defect assessment', () => {
  test.each(['short-shot', 'burn-mark', 'flash', 'sink-mark'])(
    'associates %s with its catalog pin and the exact drawing ID',
    (defectId) => {
      const integration = resolveDefectIntegration(defectId)
      const pinId = integration?.pinId
      expect(integration?.id).toBeTruthy()
      expect(pinId).toBeTruthy()
      const position = { x: 1.25, y: -2.5, z: 3.75 }
      const context = buildDefectKnowledgeContext({
        drawingId: 'cad-upload-17',
        defectId: integration!.id,
        severity: 'high',
        pin: {
          id: 'mesh-pin-1',
          drawingId: 'cad-upload-17',
          drawingVersion: 'cad-upload-17',
          defectId: integration!.id,
          severity: 3,
          position,
          coordinateFrame: 'model-local',
          placement: 'mesh-raycast',
          createdAtISO: new Date(0).toISOString(),
        },
        answers: {},
        volumeCm3: 12,
        boundingBoxMm: { x: 20, y: 30, z: 10 },
      })

      expect(context.defectContext).toMatchObject({
        defectId: integration!.id,
        severityLevel: 3,
        drawingId: 'cad-upload-17',
        pin: { id: 'mesh-pin-1', position, coordinateFrame: 'model-local', placement: 'mesh-raycast', drawingVersion: 'cad-upload-17' },
      })
      expect(context.defectContext?.severityLevel).toBe(3)
      expect(context.input.metadata).toMatchObject({ drawingId: 'cad-upload-17', geometryUsedForCauseInference: false })
    },
  )

  test('a CAD change creates a distinct case and cannot reuse the old case key', () => {
    expect(buildDefectCaseId('cad-a', 'flash', 'flashes'))
      .not.toBe(buildDefectCaseId('cad-b', 'flash', 'flashes'))
  })

  test('appends before/after evaluations to the same case and accepts zero as resolved', () => {
    const first: DefectEvaluationCase = {
      caseId: buildDefectCaseId('cad-a', 'sink', 'sink_marks'),
      drawingId: 'cad-a',
      defectId: 'sink',
      pinId: 'sink_marks',
      reportedSeverity: 2,
      pinPosition: { x: 0, y: -20, z: 0 },
      evaluations: [{
        id: 'evaluation-1',
        severityBefore: severityToLevel('medium'),
        severityAfter: 1,
        interventionTried: 'Misurato gate-open e mantenuto il profilo entro il limite.',
        answers: { 'gate-open-measured': 'yes' },
        evaluatedAtISO: '2026-10-19T00:00:00.000Z',
      }],
    }
    const second = { ...first, evaluations: [{
      ...first.evaluations[0],
      id: 'evaluation-2',
      severityBefore: 1 as const,
      severityAfter: 0 as const,
      interventionTried: 'Verificato il pezzo dopo la prova: segno assente.',
      evaluatedAtISO: '2026-10-20T00:00:00.000Z',
    }] }

    const combined = appendEvaluation(first, second)
    expect(combined.caseId).toBe(first.caseId)
    expect(combined.evaluations.map((item) => [item.severityBefore, item.severityAfter])).toEqual([[2, 1], [1, 0]])
  })
})
