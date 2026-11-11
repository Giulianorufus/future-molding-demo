import type { InjectionGate } from '@/types/injectionGate'

type Point = InjectionGate['position']

// Straight-line proximity is a prompt for the operator, not a flow-path calculation.
export function getNearbyGate(point: Point, span: number, gates: readonly InjectionGate[]) {
  if (!Number.isFinite(span) || span <= 0 || gates.length !== 1) return null
  const [gate] = gates
  const distance = Math.hypot(point.x - gate.position.x, point.y - gate.position.y, point.z - gate.position.z)
  return distance <= span * 0.1 ? gate : null
}
