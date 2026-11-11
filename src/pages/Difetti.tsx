import { readRecipeProcessValues } from '@/engine/recipeProcessValues'
import { useEffect, useState } from 'react'
import { getRecipeDrawingKey, useDrawingStore } from '@/stores/drawingStore'
import { useParametriStore } from '@/stores/parametriStore'
import { useDefectsStore } from '@/stores/defectsStore'
import { usePressStore } from '@/stores/pressStore'
import { useMaterialStore } from '@/stores/materialStore'
import ThreeViewer from '@/components/ThreeViewer'
import { getNearbyGate } from '@/engine/knowledge/defectPointHint'
import GuidedDefectDiagnosis from '@/components/GuidedDefectDiagnosis'
import { DEFECT_GUIDES, DEFECT_CATEGORIES, getDefectGuide, searchDefectGuides, type DefectCategory } from '@/engine/knowledge/guidedDiagnosis'

export default function DifettiPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<DefectCategory | ''>('')
  const selectedDefectId = useDefectsStore(s => s.selectedDefectId)
  const selectedSeverity = useDefectsStore(s => s.selectedSeverity)
  const gates = useDrawingStore(s => s.gates)
  const viewerUrl = useDrawingStore(s => s.viewerUrl)
  const drawingKey = useDrawingStore(getRecipeDrawingKey)
  const volumeCm3 = useDrawingStore(s => s.volumeCm3)
  const conversionStatus = useDrawingStore(s => s.conversionStatus)
  const conversionMessage = useDrawingStore(s => s.conversionMessage)
  const pressId = usePressStore(s => s.selectedPressId)
  const screwDiameter = usePressStore(s => s.selectedScrewDiameter_mm)
  const materialId = useMaterialStore(s => s.selectedMaterialId)
  const calculatedResult = useParametriStore(s => s.result)
  const lastInput = useParametriStore(s => s.lastInput)
  const loading = useParametriStore(s => s.loading)
  const error = useParametriStore(s => s.error)
  const result = !loading && !error && conversionStatus !== 'converting' && conversionStatus !== 'error' &&
    volumeCm3 && pressId && materialId && lastInput?.drawingKey === drawingKey &&
    lastInput.press?.id === pressId && lastInput.press.screwDiameterMm === (screwDiameter ?? undefined) &&
    lastInput.material?.id === materialId ? calculatedResult : null
  const coolingTimeSec = result ? readRecipeProcessValues(result).coolingTimeSec : null
  const guide = getDefectGuide(selectedDefectId)
  const visibleGuides = searchDefectGuides(query, category)
  const observationKey = JSON.stringify([selectedDefectId, drawingKey, pressId, screwDiameter, materialId])
  const [point, setPoint] = useState<{ key: string; x: number; y: number; z: number; local: { x: number; y: number; z: number }; span: number } | null>(null)
  const selectedPin = point?.key === observationKey ? point : null
  const nearbyGate = selectedPin && guide?.id === 'burn-mark'
    ? getNearbyGate(selectedPin.local, selectedPin.span, gates)
    : null
  const pointHint = nearbyGate && selectedPin ? JSON.stringify([selectedPin.local, nearbyGate.position]) : undefined
  const [markingKey, setMarkingKey] = useState<string | null>(null)

  useEffect(() => {
    setPoint(null)
    setMarkingKey(null)
  }, [observationKey])

  return <div className="flex min-h-full flex-col gap-4 text-blue-950 lg:flex-row">
    <aside className="fm-card shrink-0 p-4 lg:w-60">
      <h1 className="mb-3 text-xl font-bold">Difetti</h1>
      <label className="block text-sm font-medium">Cerca difetto
        <input type="search" aria-label="Cerca difetto" placeholder="Nome o sinonimo…" className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white p-2" value={query} onChange={event => setQuery(event.target.value)} />
      </label>
      <label className="mt-3 block text-sm font-medium">Categoria
        <select aria-label="Categoria difetto" className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white p-2" value={category} onChange={event => setCategory(event.target.value as DefectCategory | '')}>
          <option value="">Tutte le categorie</option>{DEFECT_CATEGORIES.map(item => <option key={item}>{item}</option>)}
        </select>
      </label>
      <p role="status" className="my-3 text-xs text-slate-600">{visibleGuides.length} di {DEFECT_GUIDES.length} schede</p>
      <div aria-label="Catalogo difetti" className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2 lg:max-h-[55vh] lg:grid-cols-1">
        {visibleGuides.map(defect => <button key={defect.id} aria-pressed={guide?.id === defect.id} className={`rounded-lg border p-3 text-left text-sm ${guide?.id === defect.id ? 'border-blue-700 bg-blue-700 font-semibold text-white' : 'border-slate-200 bg-white hover:bg-blue-50'}`} onClick={() => { setPoint(null); setMarkingKey(null); useDefectsStore.getState().selectForDiagnosis(defect.id) }}>{defect.label}</button>)}
      </div>
      {!visibleGuides.length && <p className="text-sm text-slate-600">Nessun difetto trovato. Prova un sinonimo o cambia categoria.</p>}
      {(query || category) && <button className="mt-2 rounded border border-blue-200 px-3 py-2 text-sm" onClick={() => { setQuery(''); setCategory('') }}>Azzera filtri</button>}
      <p className="mt-4 text-sm text-slate-600">{guide?.description ?? 'Seleziona un difetto per iniziare le verifiche.'}</p>
      {guide && <button className="mt-3 rounded border px-3 py-2 text-sm" onClick={() => {
        setPoint(null)
        setMarkingKey(null)
        useDefectsStore.getState().reset()
      }}>Azzera difetto</button>}
    </aside>
    <div className="min-w-0 flex-1 space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-h-72 min-w-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {viewerUrl ? <div className="w-full">
            {guide && <div className="flex gap-2 p-2 text-sm">
              <button type="button" className="rounded border px-2 py-1" aria-pressed={markingKey === observationKey}
                onClick={() => setMarkingKey(markingKey === observationKey ? null : observationKey)}>
                {markingKey === observationKey ? 'Tocca il punto sul pezzo' : 'Segna il punto sul pezzo'}
              </button>
              {selectedPin && <button type="button" onClick={() => setPoint(null)}>Rimuovi punto</button>}
            </div>}
            <ThreeViewer viewerUrl={viewerUrl} selectedPin={selectedPin}
              onPickPoint={markingKey === observationKey ? (hit, local, span) => {
                setPoint({ ...hit, local, span, key: observationKey })
                setMarkingKey(null)
              } : undefined} />
            {selectedPin && <p className="p-2 text-xs">Punto segnato. Indica anche la zona nelle domande quando disponibile.</p>}
          </div>
            : conversionStatus === 'converting' ? <p role="status" className="p-6 text-blue-700">{conversionMessage || 'Conversione del modello in corso…'}</p>
            : conversionStatus === 'error' ? <p role="alert" className="p-6 text-red-700">{conversionMessage || 'Errore durante la conversione del modello.'}</p>
            : <p className="p-6 text-center text-sm text-slate-500">Carica un disegno per visualizzare il modello.</p>}
        </div>
        <section aria-label="Parametri calcolati" className="fm-card p-4 text-sm">
          <h2 className="mb-3 text-lg font-semibold">Ricetta iniziale</h2>
          {loading && <p role="status">Calcolo in corso…</p>}
          {error && <p role="alert" className="text-red-700">{String(error)}</p>}
          {!loading && result ? <dl className="space-y-2">
            <div><dt className="font-medium">Portata iniezione</dt><dd>{result.injectionFlowCm3s ?? '—'} cm³/s</dd></div>
            <div><dt className="font-medium">Pressione iniezione</dt><dd>{result.pressureBar ?? '—'} bar</dd></div>
            <div><dt className="font-medium">Commutazione V/P</dt><dd>{result.vpSwitchVolumeCm3?.toFixed(2) ?? '—'} cm³ iniettati</dd></div>
            <div><dt className="font-medium">Tempo iniezione</dt><dd>{result.times?.injectionMs ?? '—'} ms</dd></div>
            <div><dt className="font-medium">Raffreddamento</dt><dd>{coolingTimeSec === null ? 'Da determinare' : coolingTimeSec + ' s'}</dd></div>
            <div><dt className="font-medium">Chiusura richiesta</dt><dd>{result.tonnellaggioRequired ?? '—'} t</dd></div>
          </dl> : !loading && <p className="text-slate-500">Completa il Wizard per ottenere la ricetta iniziale.</p>}
        </section>
      </div>
      {selectedDefectId ? <GuidedDefectDiagnosis key={JSON.stringify([observationKey, selectedPin?.local ?? null])} gateHintKey={pointHint} defectId={selectedDefectId} severity={selectedSeverity} result={result} volumeCm3={volumeCm3} pressId={pressId} materialId={materialId} /> : <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">Scegli il difetto: ti guiderò attraverso tre domande per ordinare le cause possibili e le azioni.</p>}
    </div>
  </div>
}
