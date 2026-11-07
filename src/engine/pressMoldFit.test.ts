import { evaluatePressMoldFit, recommendPressForMold } from './pressMoldFit'
import type { PressSpec } from '@/stores/pressStore'

const press = (overrides: Partial<PressSpec>): PressSpec => ({
  id: 'press', name: 'Pressa', tonnellaggio: 100, screwDiameters: [30], shotVolumeCm3: 100, maxPressureBar: 2000, maxSpeedMmPerS: 100, dataStatus: 'complete', ...overrides,
})

test('rifiuta una pressa con capacità utilizzabile insufficiente', () => {
  const result = evaluatePressMoldFit(100, 50, press({ tonnellaggio: 100 }))
  expect(result.status).toBe('too-small')
})

test('segnala una pressa sovradimensionata con criterio esplicito', () => {
  const result = evaluatePressMoldFit(20, 50, press({ tonnellaggio: 100 }))
  expect(result.status).toBe('overdimensioned')
})

test('sceglie la più piccola pressa completa compatibile', () => {
  const result = recommendPressForMold({ requiredClampTon: 25, shotVolumeCm3: 20, presses: [press({ id: 'large', tonnellaggio: 200, shotVolumeCm3: 200 }), press({ id: 'ideal', tonnellaggio: 50, shotVolumeCm3: 50 })] })
  expect(result.ideal?.pressId).toBe('ideal')
})

test('propone la più piccola pressa anche quando tutte sono sovradimensionate', () => {
  const result = recommendPressForMold({ requiredClampTon: 25, shotVolumeCm3: 20, presses: [press({ id: 'large', tonnellaggio: 200, shotVolumeCm3: 200 }), press({ id: 'oversized', tonnellaggio: 100, shotVolumeCm3: 100 })] })
  expect(result.ideal?.pressId).toBe('oversized')
  expect(result.ideal?.status).toBe('overdimensioned')
})

test('segnala uno stampo oltre il passaggio tra colonne', () => {
  const result = evaluatePressMoldFit(20, 20, press({ tieBarWidthMm: 270, tieBarHeightMm: 270 }), { footprintXmm: 300, footprintYmm: 250 })
  expect(result.status).toBe('too-small')
})

test('segnala dati geometrici insufficienti se la pressa non documenta le colonne', () => {
  const result = evaluatePressMoldFit(20, 20, press({}), { footprintXmm: 200, footprintYmm: 200 })
  expect(result.status).toBe('insufficient-data')
})
