import React from 'react'
import { useParametriStore } from '@/stores/parametriStore'
import { useDrawingStore } from '@/stores/drawingStore'
import FillSimulationViewer from '@/components/FillSimulationViewer'
import { usePressStore } from '@/stores/pressStore'
import { recommendPressForMold, evaluatePressMoldFit } from '@/engine/pressMoldFit'
import OperatorRecipePanel from '@/components/OperatorRecipePanel'

export default function Step4Parametri({ onBack }: { onBack?: () => void }) {
  const result = useParametriStore((s) => s.result)
  const loading = useParametriStore((s) => s.loading)
  const data = result
  const viewerUrl = useDrawingStore((s) => s.viewerUrl)
  const pressCatalog = usePressStore((s) => s.catalog)
  const selectedPressId = usePressStore((s) => s.selectedPressId)
  const selectedPress = selectedPressId ? pressCatalog[selectedPressId] : undefined
  const mold = useDrawingStore((s) => ({ footprintXmm: s.moldFootprintXmm, footprintYmm: s.moldFootprintYmm, heightMm: s.moldHeightMm, requiredOpeningMm: s.requiredOpeningMm }))
  const pressFit = data && selectedPress ? evaluatePressMoldFit(data.tonnellaggioRequired, data.shotVolumeCm3, selectedPress, mold) : null
  const idealPress = data ? recommendPressForMold({ requiredClampTon: data.tonnellaggioRequired, shotVolumeCm3: data.shotVolumeCm3, presses: Object.values(pressCatalog), mold }).ideal : null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-blue-800 font-semibold">Parametri calcolati</h2>
      {loading ? (
        <div>Calcolo in corso...</div>
      ) : !data ? (
        <div className="text-sm text-gray-500">Nessun risultato disponibile. Assicurati di aver caricato il disegno e selezionato pressa/materiale.</div>
      ) : (
        <OperatorRecipePanel result={data} />
      )}

      {data && <div className="rounded border bg-blue-50 px-3 py-2 text-sm text-blue-900">Dose totale stampata: <strong>{typeof data.shotVolumeCm3 === 'number' ? `${data.shotVolumeCm3.toFixed(2)} cm³` : 'dato non disponibile'}</strong></div>}
      {data && pressFit && (
        <div className={`rounded border px-3 py-3 text-sm ${pressFit.status === 'too-small' ? 'border-red-300 bg-red-50 text-red-900' : pressFit.status === 'overdimensioned' ? 'border-yellow-300 bg-yellow-50 text-yellow-900' : pressFit.status === 'compatible' ? 'border-green-300 bg-green-50 text-green-900' : 'border-gray-300 bg-gray-50 text-gray-800'}`}>
          <strong>Compatibilità pressa/stampo: </strong>{pressFit.status === 'too-small' ? 'pressa troppo piccola' : pressFit.status === 'overdimensioned' ? 'pressa sovradimensionata' : pressFit.status === 'compatible' ? 'pressa compatibile' : 'dati insufficienti'}.
          {pressFit.reasons.length > 0 && <div className="mt-1">{pressFit.reasons.join(' · ')}</div>}
          {idealPress && <div className="mt-2"><strong>Pressa ideale disponibile:</strong> {idealPress.pressName} ({(idealPress.nominalClampKn / 9.80665).toFixed(1)} t nominali).</div>}
        </div>
      )}
      {data && viewerUrl && <FillSimulationViewer viewerUrl={viewerUrl} durationMs={data.times?.injectionMs} />}

      <div className="flex justify-start mt-4">
        <button className="px-4 py-2 border rounded" onClick={() => onBack && onBack()}>Indietro</button>
      </div>
    </div>
  )
}
