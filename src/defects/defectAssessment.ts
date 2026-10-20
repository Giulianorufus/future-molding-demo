import type { KnowledgeContext } from '@/engine/knowledge/types'
import type { OperatorAnswer } from '@/engine/knowledge/defectContext'

export type DefectSeverityLevel = 0 | 1 | 2 | 3

export interface DefectMeshPin {
  id: string
  drawingId: string
  drawingVersion: string
  defectId: string
  severity: 1 | 2 | 3
  position: { x: number; y: number; z: number }
  coordinateFrame: 'model-local'
  placement: 'mesh-raycast'
  createdAtISO: string
}

export interface DefectEvaluationEntry {
  id: string
  severityBefore: DefectSeverityLevel
  severityAfter: DefectSeverityLevel
  interventionTried: string
  answers: Record<string, OperatorAnswer>
  legacyAnswers?: Record<string, OperatorAnswer>
  evaluatedAtISO: string
}

export interface DefectEvaluationCase {
  caseId: string
  drawingId: string
  defectId: string
  pinId: string
  reportedSeverity: 1 | 2 | 3
  pinPosition: { x: number; y: number; z: number }
  evaluations: DefectEvaluationEntry[]
}

export function severityToLevel(severity: 'low' | 'medium' | 'high'): 1 | 2 | 3 {
  if (severity === 'low') return 1
  if (severity === 'high') return 3
  return 2
}

export function buildDefectCaseId(drawingId: string, defectId: string, pinId: string): string {
  return `defect:${encodeURIComponent(drawingId)}:${defectId}:${pinId}`
}

export function buildDefectKnowledgeContext(input: {
  drawingId: string
  defectId: string
  severity: 'low' | 'medium' | 'high'
  pin: DefectMeshPin
  answers: Record<string, OperatorAnswer>
  volumeCm3: number | null
  boundingBoxMm: { x: number; y: number; z: number } | null
  rawResult?: Record<string, unknown> | null
  processParameters?: Record<string, number | string>
}): KnowledgeContext {
  return {
    input: {
      volumeCm3: input.volumeCm3,
      projectedAreaCm2: null,
      defectId: input.defectId,
      severity: input.severity,
      processParameters: input.processParameters,
      metadata: {
        drawingId: input.drawingId,
        cadGeometrySource: 'cad-analysis',
        geometryUsedForCauseInference: false,
      },
    },
    output: {
      calculatedAtISO: new Date().toISOString(),
      rawResult: input.rawResult ?? {},
    },
    defectContext: {
      defectId: input.defectId,
      severity: input.severity,
      severityLevel: severityToLevel(input.severity),
      drawingId: input.drawingId,
      pin: {
        id: input.pin.id,
        position: { ...input.pin.position },
        coordinateFrame: input.pin.coordinateFrame,
        placement: input.pin.placement,
        drawingVersion: input.pin.drawingVersion,
      },
      answers: { ...input.answers },
      geometry: {
        volumeCm3: input.volumeCm3,
        boundingBoxMm: input.boundingBoxMm ? { ...input.boundingBoxMm } : null,
        source: 'cad-analysis',
      },
    },
  }
}

export function appendEvaluation(
  existing: DefectEvaluationCase | undefined,
  next: DefectEvaluationCase,
): DefectEvaluationCase {
  if (!existing) return next
  if (
    existing.caseId !== next.caseId ||
    existing.drawingId !== next.drawingId ||
    existing.defectId !== next.defectId ||
    existing.pinId !== next.pinId
  ) return next

  return {
    ...next,
    evaluations: [...existing.evaluations, ...next.evaluations],
  }
}

export function levelToSeverity(level: 1 | 2 | 3): 'low' | 'medium' | 'high' {
  if (level === 1) return 'low'
  if (level === 3) return 'high'
  return 'medium'
}