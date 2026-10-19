import { useDefectsStore } from '../defectsStore'
import { buildDefectCaseId, type DefectEvaluationCase } from '@/defects/defectAssessment'

describe('defect evaluation store', () => {
  beforeEach(() => {
    useDefectsStore.setState({ evaluations: [] })
  })

  test('appends before/after severity and intervention to the same CAD/pin case', () => {
    const caseId = buildDefectCaseId('drawing-1', 'flash', 'flashes')
    const base: DefectEvaluationCase = {
      caseId,
      drawingId: 'drawing-1',
      defectId: 'flash',
      pinId: 'flashes',
      reportedSeverity: 2,
      pinPosition: { x: 20, y: 0, z: 0 },
      evaluations: [{
        id: 'first',
        severityBefore: 2,
        severityAfter: 1,
        interventionTried: 'Regolata condizione dopo verifica pressione.',
        answers: { 'high-cavity-pressure': 'yes' },
        evaluatedAtISO: '2026-10-19T00:00:00.000Z',
      }],
    }
    const followUp = {
      ...base,
      evaluations: [{
        ...base.evaluations[0],
        id: 'second',
        severityBefore: 1 as const,
        severityAfter: 0 as const,
        interventionTried: 'Verificato: bava assente.',
      }],
    }

    useDefectsStore.getState().recordEvaluation(base)
    useDefectsStore.getState().recordEvaluation(followUp)

    const [stored] = useDefectsStore.getState().evaluations
    expect(stored.caseId).toBe(caseId)
    expect(stored.evaluations.map(({ severityBefore, severityAfter, interventionTried }) => ({
      severityBefore,
      severityAfter,
      interventionTried,
    }))).toEqual([
      { severityBefore: 2, severityAfter: 1, interventionTried: 'Regolata condizione dopo verifica pressione.' },
      { severityBefore: 1, severityAfter: 0, interventionTried: 'Verificato: bava assente.' },
    ])
  })
})
