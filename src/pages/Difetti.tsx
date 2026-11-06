import { useState } from 'react'
import { useDrawingStore } from '@/stores/drawingStore'
import { useParametriStore } from '@/stores/parametriStore'
import { useDefectsStore } from '@/stores/defectsStore'
import { usePressStore } from '@/stores/pressStore'
import { useMaterialStore } from '@/stores/materialStore'
import ThreeViewer from '@/components/ThreeViewer'
import GuidedDefectDiagnosis from '@/components/GuidedDefectDiagnosis'
import { DEFECT_PINS } from '@/data/defectPins'
import { DEFECT_GUIDES, DEFECT_CATEGORIES, getDefectGuide, searchDefectGuides, type DefectCategory } from '@/engine/knowledge/guidedDiagnosis'
import { mapLegacyDefectId } from '@/defects/defectAdapter'

export default function DifettiPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<DefectCategory | ''>('')
  const selectedDefectId = useDefectsStore(s => s.selectedDefectId)
  const selectedSeverity = useDefectsStore(s => s.selectedSeverity)
  const viewerUrl = useDrawingStore(s => s.viewerUrl)
  const volumeCm3 = useDrawingStore(s => s.volumeCm3)
  const conversionStatus = useDrawingStore(s => s.conversionStatus)
  const conversionMessage = useDrawingStore(s => s.conversionMessage)
  const pressId = usePressStore(s => s.selectedPressId)
  const materialId = useMaterialStore(s => s.selectedMaterialId)
  const result = useParametriStore(s => s.result)
  const loading = useParametriStore(s => s.loading)
  const error = useParametriStore(s => s.error)
  const lastDefectFix = useParametriStore(s => s.lastDefectFix)
  const guide = getDefectGuide(selectedDefectId)
  const visibleGuides = searchDefectGuides(query, category)
  const automaticCorrection = guide && mapLegacyDefectId(guide.id)
  const normalizedId = guide?.id.replace(/-/g, '_')
  const selectedPin = normalizedId ? DEFECT_PINS[normalizedId as keyof typeof DEFECT_PINS] ?? null : null

  return <div className="flex min-h-full flex-col text-blue-950 lg:flex-row">
    <aside className="shrink-0 border-b border-slate-200 bg-slate-50 p-4 lg:w-60 lg:border-b-0 lg:border-r">
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
        {visibleGuides.map(defect => <button key={defect.id} aria-pressed={guide?.id === defect.id} className={`rounded-lg border p-3 text-left text-sm ${guide?.id === defect.id ? 'border-blue-700 bg-blue-700 font-semibold text-white' : 'border-slate-200 bg-white hover:bg-blue-50'}`} onClick={() => useDefectsStore.getState().setSelectedDefectId(defect.id)}>{defect.label}</button>)}
      </div>
      {!visibleGuides.length && <p className="text-sm text-slate-600">Nessun difetto trovato. Prova un sinonimo o cambia categoria.</p>}
      {(query || category) && <button className="mt-2 rounded border border-blue-200 px-3 py-2 text-sm" onClick={() => { setQuery(''); setCategory('') }}>Azzera filtri</button>}
      {automaticCorrection && <label className="mt-5 block text-sm font-medium">Severità correzione
        <select aria-label="Severità correzione" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={selectedSeverity} onChange={event => useDefectsStore.getState().setSelectedSeverity(event.target.value as 'low' | 'medium' | 'high')}>
          <option value="low">Bassa</option><option value="medium">Media</option><option value="high">Alta</option>
        </select>
      </label>}
      <p className="mt-4 text-sm text-slate-600">{guide?.description ?? 'Seleziona un difetto per iniziare le verifiche.'}</p>
      {guide && <p className="mt-4 text-xs text-slate-500">{automaticCorrection ? 'Questo difetto dispone anche del ricalcolo della ricetta nei limiti disponibili.' : 'Per questo difetto sono disponibili verifiche e prove guidate da valutare in pressa.'}</p>}
    </aside>
    <div className="min-w-0 flex-1 space-y-4 p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-h-72 min-w-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {viewerUrl ? <ThreeViewer viewerUrl={viewerUrl} selectedPin={selectedPin} />
            : conversionStatus === 'converting' ? <p role="status" className="p-6 text-blue-700">{conversionMessage || 'Conversione del modello in corso…'}</p>
            : conversionStatus === 'error' ? <p role="alert" className="p-6 text-red-700">{conversionMessage || 'Errore durante la conversione del modello.'}</p>
            : <p className="p-6 text-center text-sm text-slate-500">Carica un disegno per visualizzare il modello.</p>}
        </div>
        <section aria-label="Parametri calcolati" className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-3 text-lg font-semibold">Parametri</h2>
          {loading && <p role="status">Calcolo in corso…</p>}
          {error && <p role="alert" className="text-red-700">{String(error)}</p>}
          {!loading && result ? <dl className="space-y-2">
            <div><dt className="font-medium">Portata iniezione</dt><dd>{result.injectionFlowCm3s ?? '—'} cm³/s</dd></div>
            <div><dt className="font-medium">Pressione iniezione</dt><dd>{result.pressureBar ?? '—'} bar</dd></div>
            <div><dt className="font-medium">Commutazione V/P</dt><dd>{result.vpSwitchVolumeCm3?.toFixed(2) ?? '—'} cm³ iniettati</dd></div>
            <div><dt className="font-medium">Tempo iniezione</dt><dd>{result.times?.injectionMs ?? '—'} ms</dd></div>
            <div><dt className="font-medium">Raffreddamento</dt><dd>{result.times?.coolingMs ?? '—'} ms</dd></div>
            <div><dt className="font-medium">Chiusura richiesta</dt><dd>{result.tonnellaggioRequired ?? '—'} t</dd></div>
          </dl> : !loading && <p className="text-slate-500">Completa il Wizard per ottenere la ricetta iniziale.</p>}
          {lastDefectFix && automaticCorrection && mapLegacyDefectId(lastDefectFix.defectId) === automaticCorrection && <div className="mt-4 border-t border-slate-200 pt-3">
            <h3 className="font-medium">Ultimo ricalcolo per difetto</h3>
            <p className="mt-1 text-slate-600">{getDefectGuide(lastDefectFix.defectId)?.label ?? lastDefectFix.defectId} · {lastDefectFix.severity === 'high' ? 'Alta' : lastDefectFix.severity === 'low' ? 'Bassa' : 'Media'}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">{lastDefectFix.notes.map((note, index) => <li key={index}>{note}</li>)}</ul>
          </div>}
        </section>
      </div>
      {selectedDefectId ? <GuidedDefectDiagnosis key={`${selectedDefectId}:${viewerUrl}:${pressId}:${materialId}`} defectId={selectedDefectId} severity={selectedSeverity} result={result} volumeCm3={volumeCm3} pressId={pressId} materialId={materialId} /> : <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">Scegli il difetto: ti guiderò attraverso tre domande per ordinare le cause possibili e le azioni.</p>}
    </div>
  </div>
}
