import { getNearbyGate } from '../defectPointHint'

test('offers only a nearby single gate on the same coordinate scale', () => {
  const gate = { id: 'G1', position: { x: 0, y: 0, z: 0 } }
  const point = { x: 2, y: 0, z: 0 }
  expect(getNearbyGate(point, 40, [gate])).toBe(gate)
  expect(getNearbyGate(point, 10, [gate])).toBeNull()
  expect(getNearbyGate(point, 40, [])).toBeNull()
  expect(getNearbyGate(point, 40, [gate, { ...gate, id: 'G2' }])).toBeNull()
})
