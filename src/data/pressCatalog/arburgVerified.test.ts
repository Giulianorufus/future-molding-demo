import { ARBURG_MAX_TONNELLAGGIO, ARBURG_VERIFIED_PRESSES, getArburgPressesUpTo, KN_PER_METRIC_TON } from './arburgVerified'
import { evaluateClampCapacity } from '@/lib/clampCapacity'

test('il catalogo ARBURG verificato resta entro 500 tonnellate metriche', () => {
  const presses = getArburgPressesUpTo()
  expect(presses.length).toBe(ARBURG_VERIFIED_PRESSES.length)
  expect(presses.every((press) => press.clampForceKn / KN_PER_METRIC_TON <= ARBURG_MAX_TONNELLAGGIO)).toBe(true)
  expect(Math.max(...presses.map((press) => press.clampForceKn))).toBe(4600)
})

test('le configurazioni parziali non dichiarano dati di iniezione', () => {
  const partial = ARBURG_VERIFIED_PRESSES.filter((press) => press.dataStatus === 'clamp-only')
  expect(partial.length).toBeGreaterThan(0)
  expect(partial.every((press) => press.screwDiameterMm === undefined && press.maxPressureBar === undefined)).toBe(true)
})

test('la 270 S Compact espone solo le due configurazioni documentate', () => {
  const complete = ARBURG_VERIFIED_PRESSES.filter((press) => press.name === 'ARBURG 270 S Compact')
  expect(complete.map((press) => press.screwDiameterMm)).toEqual([20, 30])
  expect(complete.map((press) => press.shotVolumeCm3)).toEqual([31, 71])
})

test('le configurazioni 570 S mantengono identificativi distinti per tonnellaggio', () => {
  const presses = ARBURG_VERIFIED_PRESSES.filter((press) => press.name === 'ARBURG 570 S' && press.dataStatus === 'complete')
  expect(new Set(presses.map((press) => press.id)).size).toBe(9)
  expect(new Set(presses.map((press) => press.clampForceKn)).size).toBe(3)
})

test('la capacità utilizzabile mantiene il margine dell’85%', () => {
  const result = evaluateClampCapacity({ required_kN: 3000, available_kN: 4600 })
  expect(result.usable_kN).toBe(3910)
})

test('ogni configurazione completa ha tutti i limiti macchina documentati', () => {
  const complete = ARBURG_VERIFIED_PRESSES.filter((press) => press.dataStatus === 'complete')
  expect(complete.length).toBeGreaterThan(0)
  for (const press of complete) {
    expect(press.screwDiameterMm).toBeGreaterThan(0)
    expect(press.shotVolumeCm3).toBeGreaterThan(0)
    expect(press.maxPressureBar).toBeGreaterThan(0)
    expect(press.maxInjectionFlowCm3s).toBeGreaterThan(0)
    expect(press.source.startsWith('https://www.arburg.com/')).toBe(true)
  }
})
