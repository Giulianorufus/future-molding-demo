import * as THREE from 'three'

/** Collect CAD faces in model-local millimetres, sharing one arrival graph.
 * Display fitting (position/scale on model) must not change physical distances.
 */
export function collectModelSurface(model: THREE.Object3D): THREE.BufferGeometry | null {
  model.updateWorldMatrix(true, true)
  const inverse = model.matrixWorld.clone().invert()
  const positions: number[] = []
  const indices: number[] = []
  const point = new THREE.Vector3()
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const geometry = object.geometry as THREE.BufferGeometry
    const position = geometry.getAttribute('position')
    if (!position) return
    const offset = positions.length / 3
    const transform = new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld)
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i).applyMatrix4(transform)
      positions.push(point.x, point.y, point.z)
    }
    const index = geometry.getIndex()
    const count = index?.count ?? position.count
    for (let i = 0; i + 2 < count; i += 3) {
      indices.push(offset + (index ? index.getX(i) : i), offset + (index ? index.getX(i + 1) : i + 1), offset + (index ? index.getX(i + 2) : i + 2))
    }
  })
  if (!indices.length) return null
  const surface = new THREE.BufferGeometry()
  surface.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  surface.setIndex(indices)
  surface.computeVertexNormals()
  return surface
}
