import { diagnose } from '../diagnosisEngine'
import { recommend } from '../recommendationEngine'
import { buildDefectKnowledgeContext } from '@/defects/defectAssessment'
import type { DefectMeshPin } from '@/defects/defectAssessment'

describe('incomplete defect catalog entries', () => {
  test.each(['voids', 'cold_slug', 'flow_marks', 'surface_roughness'])(
    '%s is selectable/diagnosable as catalog status but emits no technical recommendation',
    async (defectId) => {
      const pin: DefectMeshPin = {
        id: `pin-${defectId}`,
        drawingId: 'cad-demo-v1',
        drawingVersion: 'cad-demo-v1',
        defectId,
        severity: 2,
        position: { x: 1, y: 2, z: 3 },
        coordinateFrame: 'model-local',
        placement: 'mesh-raycast',
        createdAtISO: new Date(0).toISOString(),
      }
      const context = buildDefectKnowledgeContext({
        drawingId: 'cad-demo-v1',
        defectId,
        severity: 'medium',
        pin,
        answers: { [`${defectId}.any-question`]: 'unknown' },
        volumeCm3: null,
        boundingBoxMm: null,
      })
      const diagnosis = await diagnose(context, [])
      const recommendations = await recommend(diagnosis, context, [])

      expect(diagnosis).toHaveLength(1)
      expect(diagnosis[0]).toMatchObject({
        id: `catalog-status:${defectId}`,
        metadata: {
          provenance: 'catalog-status',
          verificationStatus: 'unverified',
          drawingId: 'cad-demo-v1',
          pinId: `pin-${defectId}`,
          pinPlacement: 'mesh-raycast',
        },
      })
      expect(recommendations).toEqual([])
    },
  )
})
