import * as THREE from 'three'
import { collectModelSurface } from './modelSurface'
import { buildSurfaceFillArrival } from './fillArrival'

function triangle(points: number[]) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  return new THREE.Mesh(geometry)
}

test('CAD faces share one arrival graph across transformed mesh seams', () => {
  const model = new THREE.Group()
  model.add(triangle([0, 0, 0, 10, 0, 0, 0, 10, 0]))
  const second = triangle([0, 0, 0, -10, 0, 0, 0, 10, 0])
  second.position.x = 10
  model.add(second)
  model.position.set(100, 30, -20)
  model.scale.setScalar(4)
  const source = Array.from(second.geometry.getAttribute('position').array)
  const surface = collectModelSurface(model)!
  expect(surface.getAttribute('position').getX(3)).toBeCloseTo(10)
  const field = buildSurfaceFillArrival(surface, new THREE.Vector3(0, 0, 0), { thicknessAvgMm: 2 })!
  expect(field.reachableVertices).toBe(6)
  expect(field.spatialFillArrival[3]).toBeGreaterThan(0)
  expect(field.spatialFillArrival[4]).toBe(0)
  expect(Array.from(second.geometry.getAttribute('position').array)).toEqual(source)
})

test('a disconnected CAD face is not seeded by a gate on another face', () => {
  const model = new THREE.Group()
  model.add(triangle([0, 0, 0, 10, 0, 0, 0, 10, 0]))
  const separate = triangle([100, 0, 0, 110, 0, 0, 100, 10, 0])
  model.add(separate)
  const field = buildSurfaceFillArrival(collectModelSurface(model)!, new THREE.Vector3(), { thicknessAvgMm: 2 })!
  expect(field.reachableVertices).toBe(3)
  expect(Array.from(field.spatialFillArrival).slice(3)).toEqual([2, 2, 2])
})

test('empty model has no surface', () => {
  expect(collectModelSurface(new THREE.Group())).toBeNull()
})
