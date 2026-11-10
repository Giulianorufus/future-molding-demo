import { create } from 'zustand'

export type DefectSeverity = "low" | "medium" | "high"

type DefectsState = {
  selectedDefectId: string | null
  guidedOnly: boolean
  selectForDiagnosis: (id: string) => void
  selectedSeverity: DefectSeverity
  setSelectedDefectId: (id: string | null) => void
  // backward-compat alias used by some UI/components
  setSelectedDefect?: (id: string | null) => void
  setSelectedSeverity: (s: DefectSeverity) => void
  reset: () => void
}

export const useDefectsStore = create<DefectsState>((set) => ({
  selectedDefectId: null,
  guidedOnly: false,
  selectForDiagnosis: (id) => set({ selectedDefectId: id, guidedOnly: true }),
  selectedSeverity: 'medium',
  setSelectedDefectId: (id) => set({ selectedDefectId: id, guidedOnly: false }),
  setSelectedDefect: (id) => set({ selectedDefectId: id, guidedOnly: false }),
  setSelectedSeverity: (s) => set({ selectedSeverity: s }),
  reset: () => set({ selectedDefectId: null, guidedOnly: false, selectedSeverity: 'medium' }),
}))

export default useDefectsStore
