/**
 * Forze di chiusura ARBURG riportate in documentazione ufficiale.
 *
 * Il catalogo contiene volutamente solo la forza nominale quando i dati
 * dell'unità d'iniezione non sono disponibili nella stessa fonte. Non vengono
 * introdotti diametri vite, pressioni o volumi stimati.
 */
export type ArburgPressDataStatus = 'complete' | 'clamp-only' | 'reference'

export type VerifiedArburgPress = {
  id: string
  name: string
  clampForceKn: number
  dataStatus: ArburgPressDataStatus
  source: string
  screwDiameterMm?: number
  shotVolumeCm3?: number
  maxPressureBar?: number
  maxInjectionFlowCm3s?: number
  tieBarWidthMm?: number
  tieBarHeightMm?: number
  minMoldHeightMm?: number
  maxMoldHeightMm?: number
  maxOpeningStrokeMm?: number
}

export const ARBURG_VERIFIED_PRESSES: readonly VerifiedArburgPress[] = [
  { id: 'arburg-270-s-350-20', name: 'ARBURG 270 S Compact', clampForceKn: 350, dataStatus: 'complete', screwDiameterMm: 20, shotVolumeCm3: 31, maxPressureBar: 2500, maxInjectionFlowCm3s: 64, tieBarWidthMm: 270, tieBarHeightMm: 270, minMoldHeightMm: 200, maxMoldHeightMm: 550, maxOpeningStrokeMm: 350, source: 'https://www.arburg.com/media/daten/publications/technical_data/hydraulic_machines/allrounder_s/ARBURG_ALLROUNDER_270S_COMPACT_TD_682164_en_GB.pdf' },
  { id: 'arburg-270-s-350-30', name: 'ARBURG 270 S Compact', clampForceKn: 350, dataStatus: 'complete', screwDiameterMm: 30, shotVolumeCm3: 71, maxPressureBar: 1390, maxInjectionFlowCm3s: 146, tieBarWidthMm: 270, tieBarHeightMm: 270, minMoldHeightMm: 200, maxMoldHeightMm: 550, maxOpeningStrokeMm: 350, source: 'https://www.arburg.com/media/daten/publications/technical_data/hydraulic_machines/allrounder_s/ARBURG_ALLROUNDER_270S_COMPACT_TD_682164_en_GB.pdf' },
  { id: 'arburg-trend-500-e-500', name: 'ARBURG 500 e', clampForceKn: 500, dataStatus: 'clamp-only', source: 'ARBURG: ALLROUNDER trend, 500 kN' },
  { id: 'arburg-trend-500-e-600', name: 'ARBURG 500 e', clampForceKn: 600, dataStatus: 'clamp-only', source: 'ARBURG: ALLROUNDER trend, 600 kN' },
  { id: 'arburg-370-a-600', name: 'ARBURG 370 A', clampForceKn: 600, dataStatus: 'clamp-only', source: 'ARBURG: 370 A, 600 kN' },
  { id: 'arburg-370-s-700', name: 'ARBURG 370 S', clampForceKn: 700, dataStatus: 'clamp-only', source: 'ARBURG: 370 S, 700 kN' },
  { id: 'arburg-470-s-800', name: 'ARBURG 470 S', clampForceKn: 800, dataStatus: 'clamp-only', source: 'ARBURG: 470 S, 800 kN' },
  { id: 'arburg-trend-1000-e-1000', name: 'ARBURG 1000 e', clampForceKn: 1000, dataStatus: 'clamp-only', source: 'ARBURG: ALLROUNDER trend, 1000 kN' },
  { id: 'arburg-470-s-1000', name: 'ARBURG 470 S', clampForceKn: 1000, dataStatus: 'clamp-only', source: 'ARBURG: 470 S, 1000 kN' },
  { id: 'arburg-470-s-1100', name: 'ARBURG 470 S', clampForceKn: 1100, dataStatus: 'clamp-only', source: 'ARBURG: 470 S, 1100 kN' },
  { id: 'arburg-trend-1300-e-1300', name: 'ARBURG 1300 e', clampForceKn: 1300, dataStatus: 'clamp-only', source: 'ARBURG: ALLROUNDER trend, 1300 kN' },
  { id: 'arburg-520-s-1600', name: 'ARBURG 520 S', clampForceKn: 1600, dataStatus: 'clamp-only', source: 'ARBURG: 520 S, 1600 kN' },
  { id: 'arburg-570-s-1600', name: 'ARBURG 570 S', clampForceKn: 1600, dataStatus: 'clamp-only', source: 'ARBURG: 570 S, 1600 kN' },
  { id: 'arburg-570-s-2000', name: 'ARBURG 570 S', clampForceKn: 2000, dataStatus: 'clamp-only', source: 'ARBURG: 570 S, 2000 kN' },
  { id: 'arburg-570-s-2200', name: 'ARBURG 570 S', clampForceKn: 2200, dataStatus: 'clamp-only', source: 'ARBURG: 570 S, 2200 kN' },
  { id: 'arburg-630-s-2500', name: 'ARBURG 630 S', clampForceKn: 2500, dataStatus: 'clamp-only', source: 'ARBURG: 630 S, 2500 kN' },
  { id: 'arburg-720-e-2800', name: 'ARBURG 720 E', clampForceKn: 2800, dataStatus: 'clamp-only', source: 'ARBURG: 720 E, 2800 kN' },
  { id: 'arburg-720-s-3200', name: 'ARBURG 720 S', clampForceKn: 3200, dataStatus: 'clamp-only', source: 'ARBURG: 720 S, 3200 kN' },
  { id: 'arburg-820-s-4000', name: 'ARBURG 820 S', clampForceKn: 4000, dataStatus: 'clamp-only', source: 'ARBURG: 820 S, 4000 kN' },
  { id: 'arburg-920-h-4600', name: 'ARBURG 920 H', clampForceKn: 4600, dataStatus: 'clamp-only', source: 'ARBURG: 920 H, 4600 kN' },
  ...buildInjectionVariants('arburg-520-s-1600', 'ARBURG 520 S', 1600, [
    [45, 318, 2470, 530],
    [50, 392, 2000, 656],
    [55, 474, 1650, 792],
  ], 'https://www.arburg.com/media/daten/publications/technical_data/hydraulic_machines/allrounder_s/ARBURG_ALLROUNDER_520S_multi-component_TD_680161_en_GB.pdf'),
  ...buildInjectionVariants('arburg-570-s', 'ARBURG 570 S', 1600, [
    [45, 318, 2470, 530],
    [50, 392, 2000, 656],
    [55, 474, 1650, 792],
  ], 'https://www.arburg.com/media/daten/publications/technical_data/hydraulic_machines/allrounder_s/ARBURG_ALLROUNDER_570S_TD_680126_en_GB.pdf'),
  ...buildInjectionVariants('arburg-570-s', 'ARBURG 570 S', 2000, [
    [45, 318, 2470, 530],
    [50, 392, 2000, 656],
    [55, 474, 1650, 792],
  ], 'https://www.arburg.com/media/daten/publications/technical_data/hydraulic_machines/allrounder_s/ARBURG_ALLROUNDER_570S_TD_680126_en_GB.pdf'),
  ...buildInjectionVariants('arburg-570-s', 'ARBURG 570 S', 2200, [
    [45, 318, 2470, 530],
    [50, 392, 2000, 656],
    [55, 474, 1650, 792],
  ], 'https://www.arburg.com/media/daten/publications/technical_data/hydraulic_machines/allrounder_s/ARBURG_ALLROUNDER_570S_TD_680126_en_GB.pdf'),
]

export const ARBURG_MAX_TONNELLAGGIO = 500
export const KN_PER_METRIC_TON = 9.80665

type InjectionVariantRow = readonly [screwDiameterMm: number, shotVolumeCm3: number, maxPressureBar: number, maxInjectionFlowCm3s: number]

function buildInjectionVariants(
  idPrefix: string,
  name: string,
  clampForceKn: number,
  rows: readonly InjectionVariantRow[],
  source: string,
): VerifiedArburgPress[] {
  return rows.map(([screwDiameterMm, shotVolumeCm3, maxPressureBar, maxInjectionFlowCm3s]) => ({
    id: `${idPrefix}-${clampForceKn}-${screwDiameterMm}`,
    name,
    clampForceKn,
    dataStatus: 'complete',
    screwDiameterMm,
    shotVolumeCm3,
    maxPressureBar,
    maxInjectionFlowCm3s,
    source,
  }))
}

export function isWithinArburgTonnageLimit(press: VerifiedArburgPress, maxTonnaggio = ARBURG_MAX_TONNELLAGGIO): boolean {
  return press.clampForceKn / KN_PER_METRIC_TON <= maxTonnaggio
}

export function getArburgPressesUpTo(maxTonnaggio = ARBURG_MAX_TONNELLAGGIO): readonly VerifiedArburgPress[] {
  return ARBURG_VERIFIED_PRESSES.filter((press) => isWithinArburgTonnageLimit(press, maxTonnaggio))
}
