import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useDrawingStore } from '@/stores/drawingStore'
import { useMaterialStore } from '@/stores/materialStore'
import { materialCatalog } from '@/data/materialCatalog'
import { buildSurfaceFillArrival } from '@/simulation/fillArrival'
import { collectModelSurface } from '@/simulation/modelSurface'

type Props = { viewerUrl: string; durationMs?: number }
type Status = 'loading' | 'ready' | 'error'

export default function FillSimulationViewer({ viewerUrl, durationMs }: Props) {
  const host = useRef<HTMLDivElement | null>(null)
  const progressRef = useRef(0)
  const runningRef = useRef(false)
  const speedRef = useRef(1)
  const selectingGateRef = useRef(false)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [selectingGate, setSelectingGate] = useState(false)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [unreachable, setUnreachable] = useState(false)
  const gates = useDrawingStore(s => s.gates)
  const selectedGateId = useDrawingStore(s => s.selectedGateId)
  const selectedMaterialId = useMaterialStore(s => s.selectedMaterialId)
  const playbackDuration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 3000
  // Slow short shots for observation without changing the recipe time readout.
  const previewDuration = Math.max(3000, playbackDuration)
  const reset = () => {
    runningRef.current = false
    progressRef.current = 0
    setRunning(false)
    setProgress(0)
  }

  useEffect(() => {
    const container = host.current
    if (!container) return
    reset()
    setStatus('loading')
    setError('')
    setUnreachable(false)
    selectingGateRef.current = false
    setSelectingGate(false)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf1f5f9)
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000)
    camera.position.set(90, 66, 138)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
    } catch {
      setStatus('error')
      setError('Visualizzatore 3D non disponibile: impossibile inizializzare WebGL.')
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    container.appendChild(renderer.domElement)
    scene.add(new THREE.AmbientLight(0xffffff, 1.4))
    const light = new THREE.DirectionalLight(0xffffff, 1.2)
    light.position.set(50, 50, 100)
    scene.add(light)
    const resize = () => {
      const width = container.clientWidth || 640
      const height = container.clientHeight || 360
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    const abort = new AbortController()
    let disposed = false
    let frame = 0
    let controls: { enabled: boolean; enableDamping: boolean; target: THREE.Vector3; update: () => void; dispose: () => void } | undefined
    let model: THREE.Group | undefined
    let surface: THREE.BufferGeometry | null = null
    let fill: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> | undefined
    const gateMarkers = new Map<string, THREE.Sprite>()
    const disposeModel = (root: THREE.Object3D) => {
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      root.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        geometries.add(object.geometry)
        const items = Array.isArray(object.material) ? object.material : [object.material]
        items.forEach(material => materials.add(material))
      })
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
    }
    const clearFill = () => {
      if (!fill) return
      fill.removeFromParent()
      fill.geometry.dispose()
      fill.material.dispose()
      fill = undefined
    }
    const clearMarkers = () => {
      gateMarkers.forEach(marker => {
        marker.removeFromParent()
        marker.material.map?.dispose()
        marker.material.dispose()
      })
      gateMarkers.clear()
    }
    const syncMarkers = () => {
      clearMarkers()
      if (!model) return
      const state = useDrawingStore.getState()
      for (const gate of state.gates) {
        const canvas = document.createElement('canvas')
        canvas.width = 96
        canvas.height = 96
        const context = canvas.getContext('2d')!
        context.fillStyle = gate.id === state.selectedGateId ? '#1e40af' : '#0284c7'
        context.beginPath()
        context.arc(48, 48, 34, 0, Math.PI * 2)
        context.fill()
        context.fillStyle = '#ffffff'
        context.font = 'bold 28px sans-serif'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(gate.id, 48, 48)
        const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false }))
        marker.userData.gateId = gate.id
        marker.scale.set(7, 7, 1)
        marker.position.copy(model.localToWorld(new THREE.Vector3(gate.position.x, gate.position.y, gate.position.z)))
        marker.renderOrder = 2
        scene.add(marker)
        gateMarkers.set(gate.id, marker)
      }
    }
    const rebuildFill = () => {
      reset()
      clearFill()
      setUnreachable(false)
      if (!model || !surface) return
      const state = useDrawingStore.getState()
      if (!state.gates.length) return
      const material = materialCatalog.find(item => item.id === selectedMaterialId)
      const field = buildSurfaceFillArrival(surface, state.gates, {
        processContext: material ? { materialId: material.id, materialFlowFactor: material.flowFactor } : undefined,
      })
      if (!field) return
      setUnreachable(field.reachableVertices < field.totalVertices)
      const shader = new THREE.ShaderMaterial({
        uniforms: { uProgress: { value: 0 } },
        vertexShader: `
          attribute float fillArrival;
          varying float vArrival;
          void main() {
            vArrival = fillArrival;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uProgress;
          varying float vArrival;
          void main() {
            if (uProgress <= 0.0 || vArrival > uProgress) discard;
            float front = 1.0 - smoothstep(0.0, 0.035, uProgress - vArrival);
            vec3 color = mix(vec3(0.03, 0.35, 0.8), vec3(0.2, 0.85, 1.0), front);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
      fill = new THREE.Mesh(field.geometry, shader)
      model.add(fill)
    }
    const unsubscribe = useDrawingStore.subscribe((state, previous) => {
      if (state.gates !== previous.gates) rebuildFill()
      if (state.gates !== previous.gates || state.selectedGateId !== previous.selectedGateId) syncMarkers()
    })
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onPointerDown = (event: PointerEvent) => {
      if (!model) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      // In add mode the surface always wins, including underneath existing markers.
      if (!selectingGateRef.current) {
        const marker = raycaster.intersectObjects([...gateMarkers.values()])[0]
        if (marker) useDrawingStore.getState().selectGate(marker.object.userData.gateId)
        return
      }
      const hit = raycaster.intersectObject(model, true).find(item => item.object !== fill)
      if (!hit) return
      const localPoint = model.worldToLocal(hit.point.clone())
      const normal = hit.face?.normal.clone() ?? new THREE.Vector3(0, 0, 1)
      const localTransform = model.matrixWorld.clone().invert().multiply(hit.object.matrixWorld)
      normal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(localTransform)).normalize()
      const ids = new Set(useDrawingStore.getState().gates.map(gate => gate.id))
      let sequence = 1
      while (ids.has(`G${sequence}`)) sequence++
      useDrawingStore.getState().addGate({ id: `G${sequence}`, position: { x: localPoint.x, y: localPoint.y, z: localPoint.z }, normal: { x: normal.x, y: normal.y, z: normal.z } })
      selectingGateRef.current = false
      setSelectingGate(false)
      if (controls) controls.enabled = true
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    // Disable orbit dragging while placing a gate.
    const syncControls = () => { if (controls) controls.enabled = !selectingGateRef.current }
    const load = async () => {
      try {
        const [lm, cm] = await Promise.all([
          import('three/examples/jsm/loaders/GLTFLoader'),
          import('three/examples/jsm/controls/OrbitControls'),
        ])
        if (disposed) return
        controls = new cm.OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        const response = await fetch(viewerUrl, { signal: abort.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const gltf = await new lm.GLTFLoader().parseAsync(await response.arrayBuffer(), '')
        if (disposed) { disposeModel(gltf.scene); return }
        model = new THREE.Group()
        model.add(gltf.scene)
        surface = collectModelSurface(model)
        if (!surface) throw new Error('Il disegno non contiene una superficie triangolata.')
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const scale = 80 / (Math.max(size.x, size.y, size.z) || 1)
        model.scale.setScalar(scale)
        model.position.copy(center).multiplyScalar(-scale)
        const originalMaterials = new Set<THREE.Material>()
        model.traverse(object => {
          if (!(object instanceof THREE.Mesh)) return
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach(material => originalMaterials.add(material))
          object.material = new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide })
        })
        originalMaterials.forEach(material => material.dispose())
        scene.add(model)
        model.updateWorldMatrix(true, true)
        controls.target.set(0, 0, 0)
        controls.update()
        rebuildFill()
        syncMarkers()
        setStatus('ready')
      } catch (cause) {
        if (disposed) return
        setStatus('error')
        setError(`Impossibile caricare il modello 3D: ${cause instanceof Error ? cause.message : 'errore sconosciuto'}`)
      }
    }
    void load()
    let previousTime: number | undefined
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      // Background tabs pause playback rather than completing while invisible.
      const elapsed = previousTime === undefined || document.hidden ? 0 : Math.max(0, now - previousTime)
      previousTime = now
      if (runningRef.current && !document.hidden) {
        const p = Math.min(1, progressRef.current + elapsed * speedRef.current / previewDuration)
        progressRef.current = p
        setProgress(p)
        if (p >= 1) { runningRef.current = false; setRunning(false) }
      }
      if (fill) fill.material.uniforms.uProgress.value = progressRef.current
      syncControls()
      controls?.update()
      renderer.render(scene, camera)
    }
    const onVisibility = () => { previousTime = undefined }
    document.addEventListener('visibilitychange', onVisibility)
    frame = requestAnimationFrame(loop)
    return () => {
      disposed = true
      abort.abort()
      unsubscribe()
      observer.disconnect()
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      clearFill()
      clearMarkers()
      surface?.dispose()
      if (model) disposeModel(model)
      controls?.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [viewerUrl, playbackDuration, previewDuration, selectedMaterialId])

  const canPlay = status === 'ready' && gates.length > 0
  const toggle = () => {
    if (!canPlay) return
    // Match the displayed action even if a final animation frame just completed.
    if (running) {
      runningRef.current = false
      setRunning(false)
      return
    }
    if (progressRef.current >= 1) { progressRef.current = 0; setProgress(0) }
    runningRef.current = true
    setRunning(true)
  }

  return <section aria-label="Simulazione riempimento 3D" className="rounded-lg border bg-white p-3">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <div><div className="font-semibold text-blue-900">Simulazione riempimento 3D</div><div className="text-xs text-gray-500">Anteprima qualitativa sulla superficie. {Number.isFinite(durationMs) && durationMs > 0 ? 'Tempo indicativo dalla ricetta.' : 'Durata anteprima: 3 s; tempo ricetta non disponibile.'}</div></div>
      <output aria-label="Stato avanzamento" className="font-mono text-sm">{Math.round(progress * 100)}% · {(progress * playbackDuration / 1000).toFixed(2)} / {(playbackDuration / 1000).toFixed(2)} s</output>
    </div>
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <button disabled={status !== 'ready'} aria-pressed={selectingGate} className={`rounded px-3 py-2 text-sm disabled:opacity-50 ${selectingGate ? 'bg-blue-700 text-white' : 'border'}`} onClick={() => { selectingGateRef.current = !selectingGateRef.current; setSelectingGate(selectingGateRef.current); runningRef.current = false; setRunning(false) }}>{selectingGate ? 'Clicca sul pezzo…' : 'Aggiungi punto iniezione'}</button>
      {selectedGateId && <button className="rounded border px-3 py-2 text-sm" onClick={() => useDrawingStore.getState().removeGate(selectedGateId)}>Rimuovi punto selezionato</button>}
      {gates.length > 0 && <button className="rounded border px-3 py-2 text-sm" onClick={() => useDrawingStore.getState().clearGates()}>Rimuovi tutti</button>}
      {selectedGateId && <span className="text-xs text-gray-500">{selectedGateId} selezionato</span>}
    </div>
    {status === 'loading' && <p role="status" className="text-sm text-gray-600">Caricamento modello 3D…</p>}
    {status === 'error' && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {status === 'ready' && !gates.length && <p className="text-sm text-blue-800">Aggiungi un punto d’iniezione sul pezzo per avviare il riempimento.</p>}
    {unreachable && <p role="status" className="text-sm text-blue-800">Alcune superfici non sono collegate ai punti d’iniezione: restano vuote nell’anteprima.</p>}
    <div ref={host} aria-label="Modello 3D interattivo" className={`w-full overflow-hidden rounded ${selectingGate ? 'cursor-crosshair' : ''}`} style={{ height: 360 }} />
    <input aria-label="Avanzamento riempimento" disabled={!canPlay} className="mt-3 w-full" type="range" min="0" max="100" value={Math.round(progress * 100)} onChange={event => { runningRef.current = false; setRunning(false); const p = Number(event.target.value) / 100; progressRef.current = p; setProgress(p) }} />
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button disabled={!canPlay} className="rounded bg-blue-800 px-4 py-2 text-white disabled:opacity-50" onClick={toggle}>{running ? 'Pausa' : progress >= 1 ? 'Ripeti' : 'Avvia'}</button>
      <button className="rounded border px-4 py-2" onClick={reset}>Reset</button>
      <label className="ml-auto text-sm">Velocità anteprima <select aria-label="Velocità anteprima" className="rounded border p-2" value={speed} onChange={event => { const value = Number(event.target.value); speedRef.current = value; setSpeed(value) }}><option value={0.25}>0,25×</option><option value={0.5}>0,5×</option><option value={1}>1×</option></select></label>
    </div>
    {previewDuration > playbackDuration && <p className="mt-2 text-xs text-gray-500">Riproduzione rallentata: {(previewDuration / speed / 1000).toFixed(2)} s per osservare il fronte. Il tempo della ricetta resta {(playbackDuration / 1000).toFixed(2)} s.</p>}
  </section>
}
