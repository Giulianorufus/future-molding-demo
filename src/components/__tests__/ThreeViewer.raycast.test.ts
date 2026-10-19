import * as THREE from 'three'
import { isPlacementTap, raycastModelLocalPoint } from '../ThreeViewer'

describe('ThreeViewer mesh pin placement', () => {
  function createTransformedMesh() {
    const root = new THREE.Group()
    root.position.set(4, 0, 0)
    root.scale.setScalar(2)
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
    root.add(mesh)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(4, 0, 10)
    camera.lookAt(4, 0, 0)
    root.updateMatrixWorld(true)
    camera.updateMatrixWorld(true)
    return { root, camera }
  }

  test.each(['desktop click', 'mobile tap'])('%s raycast stores the hit in model-local coordinates', () => {
    const { root, camera } = createTransformedMesh()
    const point = raycastModelLocalPoint(new THREE.Raycaster(), camera, root, { x: 0, y: 0 })

    expect(point).not.toBeNull()
    expect(point?.x).toBeCloseTo(0, 5)
    expect(point?.y).toBeCloseTo(0, 5)
    expect(point?.z).toBeCloseTo(0.5, 5)
  })

  test('returns no pin position when the ray misses the mesh', () => {
    const { root, camera } = createTransformedMesh()
    expect(raycastModelLocalPoint(new THREE.Raycaster(), camera, root, { x: 0.99, y: 0.99 })).toBeNull()
  })

  test('accepts a short tap but classifies a drag/rotation as movement', () => {
    expect(isPlacementTap({ x: 100, y: 100 }, { x: 104, y: 103 })).toBe(true)
    expect(isPlacementTap({ x: 100, y: 100 }, { x: 116, y: 100 })).toBe(false)
  })
})