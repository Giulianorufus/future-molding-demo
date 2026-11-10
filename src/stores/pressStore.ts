import { create } from 'zustand'
import arburg from '@/data/pressCatalog/arburg.json'
import engel from '@/data/pressCatalog/engel.json'
import toyo from '@/data/pressCatalog/toyo.json'
import bmb from '@/data/pressCatalog/bmb.json'
import { ARBURG_VERIFIED_PRESSES, KN_PER_METRIC_TON } from '@/data/pressCatalog/arburgVerified'

export type PressSpec = {
  id: string
  name: string
  tonnellaggio: number
  screwDiameters: number[]
  shotVolumeCm3: number
  maxPressureBar: number
  maxSpeedMmPerS: number
  maxInjectionFlowCm3s?: number
  clampForceKn?: number
  dataStatus?: 'complete' | 'clamp-only' | 'reference'
  source?: string
  tieBarWidthMm?: number
  tieBarHeightMm?: number
  minMoldHeightMm?: number
  maxMoldHeightMm?: number
  maxOpeningStrokeMm?: number
}

export type PressState = {
  selectedPressId: string | null
  selectedScrewDiameter_mm: number | null
  catalog: Record<string, PressSpec>
  setCatalog: (catalog: Record<string, PressSpec>) => void
  selectPress: (id: string | null) => void
  selectScrewDiameter: (d: number | null) => void
}

const verifiedArburgEntries: Record<string, PressSpec> = Object.fromEntries(
  ARBURG_VERIFIED_PRESSES.map((press) => [press.id, {
    id: press.id,
    name: `${press.name} · ${press.clampForceKn} kN (${(press.clampForceKn / KN_PER_METRIC_TON).toFixed(1)} t)`,
    tonnellaggio: press.clampForceKn / KN_PER_METRIC_TON,
    screwDiameters: press.screwDiameterMm ? [press.screwDiameterMm] : [],
    shotVolumeCm3: press.shotVolumeCm3 ?? 0,
    maxPressureBar: press.maxPressureBar ?? 0,
    maxSpeedMmPerS: 0,
    maxInjectionFlowCm3s: press.maxInjectionFlowCm3s,
    clampForceKn: press.clampForceKn,
    dataStatus: press.dataStatus,
    source: press.source,
    tieBarWidthMm: press.tieBarWidthMm,
    tieBarHeightMm: press.tieBarHeightMm,
    minMoldHeightMm: press.minMoldHeightMm,
    maxMoldHeightMm: press.maxMoldHeightMm,
    maxOpeningStrokeMm: press.maxOpeningStrokeMm,
  } satisfies PressSpec]),
)

const initialCatalog: Record<string, PressSpec> = {
  [arburg.id]: arburg as PressSpec,
  'arburg-320-c-reference': {
    id: 'arburg-320-c-reference',
    name: 'Arburg ALLROUNDER 320 C · riferimento reparto',
    tonnellaggio: 50,
    clampForceKn: 50 * KN_PER_METRIC_TON,
    screwDiameters: [30],
    shotVolumeCm3: 0,
    maxPressureBar: 0,
    maxSpeedMmPerS: 0,
    dataStatus: 'reference',
    source: 'Scheda fotografata del caso PC 320 C: 50 t e vite Ø30 mm. Limiti unità da verificare su targa.',
  },
  [engel.id]: engel as PressSpec,
  [toyo.id]: toyo as PressSpec,
  [bmb.id]: bmb as PressSpec,
  ...verifiedArburgEntries,
}

export const usePressStore = create<PressState>((set) => ({
  selectedPressId: null,
  selectedScrewDiameter_mm: null,
  catalog: initialCatalog,
  setCatalog(catalog) {
    set({ catalog })
  },
  selectPress(id) {
    // when selecting a press, default screw diameter to the first available option
    set((state) => {
      const spec = id ? (state.catalog[id] ?? null) : null
      const defaultDiam = spec?.screwDiameters?.[0] ?? null
      return { selectedPressId: id, selectedScrewDiameter_mm: defaultDiam }
    })
  },
  selectScrewDiameter(d: number | null) {
    set({ selectedScrewDiameter_mm: d })
  },
}))

export default usePressStore
