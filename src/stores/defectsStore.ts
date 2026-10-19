import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DefectEvaluationCase, DefectEvaluationEntry } from '@/defects/defectAssessment'
import { appendEvaluation } from '@/defects/defectAssessment'
import type { DefectMeshPin } from '@/defects/defectAssessment'

export type DefectSeverity = "low" | "medium" | "high"

type DefectsState = {
  selectedDefectId: string | null
  selectedSeverity: DefectSeverity
  evaluations: DefectEvaluationCase[]
  meshPins: DefectMeshPin[]
  setSelectedDefectId: (id: string | null) => void
  // backward-compat alias used by some UI/components
  setSelectedDefect?: (id: string | null) => void
  setSelectedSeverity: (s: DefectSeverity) => void
  recordEvaluation: (record: DefectEvaluationCase) => void
  addMeshPin: (pin: DefectMeshPin) => void
  removeMeshPin: (id: string) => void
  reset: () => void
}

export const useDefectsStore = create<DefectsState>()(persist((set) => ({
  selectedDefectId: null,
  selectedSeverity: 'medium',
  evaluations: [],
  meshPins: [],
  setSelectedDefectId: (id) => set({ selectedDefectId: id }),
  setSelectedDefect: (id) => set({ selectedDefectId: id }),
  setSelectedSeverity: (s) => set({ selectedSeverity: s }),
  recordEvaluation: (record) => set((state) => {
    const existing = state.evaluations.find((item) => item.caseId === record.caseId)
    const next = appendEvaluation(existing, record)
    return {
      evaluations: [next, ...state.evaluations.filter((item) => item.caseId !== record.caseId)].slice(0, 200),
    }
  }),
  addMeshPin: (pin) => set((state) => ({ meshPins: [pin, ...state.meshPins.filter((item) => item.id !== pin.id)].slice(0, 500) })),
  removeMeshPin: (id) => set((state) => ({ meshPins: state.meshPins.filter((pin) => pin.id !== id) })),
  reset: () => set({ selectedDefectId: null, selectedSeverity: 'medium' }),
}), {
  name: 'future-molding-defect-evaluations-v1',
  partialize: (state) => ({ evaluations: state.evaluations, meshPins: state.meshPins }),
}))

export default useDefectsStore
