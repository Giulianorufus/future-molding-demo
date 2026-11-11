import React from 'react'
import { useParametriStore } from '@/stores/parametriStore'
import { useDrawingStore } from '@/stores/drawingStore'
import FillSimulationViewer from '@/components/FillSimulationViewer'
import { usePressStore } from '@/stores/pressStore'
import { useMaterialStore } from '@/stores/materialStore'
import { recommendPressForMold, evaluatePressMoldFit } from '@/engine/pressMoldFit'
import OperatorRecipePanel from '@/components/OperatorRecipePanel'
import FillingTrialPanel from './FillingTrialPanel'
import { linearScrewSpeedToFlowCm3s } from '@/engine/units/injectionFlow'

export default function Step4Parametri({ onBack }: { onBack?: () => void }) {
  const result = useParametriStore((s) => s.result)
  const loading = useParametriStore((s) => s.loading)
  const data = result
  const viewerUrl = useDrawingStore((s) => s.viewerUrl)
  const pressCatalog = usePressStore((s) => s.catalog)
  const pcSelected = useMaterialStore((s) => s.selectedMaterialId === 'pc')
  const selectedPressId = usePressStore((s) => s.selectedPressId)
  const selectedPress = selectedPressId ? pressCatalog[selectedPressId] : undefined
  const confirmedSingleColdCavity = useDrawingStore((s) =>
    s.cavityCountConfirmed && s.cavityCount === 1 && s.feedSystem === 'cold')
  const footprintXmm = useDrawingStore((s) => s.moldFootprintXmm)
  const footprintYmm = useDrawingStore((s) => s.moldFootprintYmm)
  const heightMm = useDrawingStore((s) => s.moldHeightMm)
  const requiredOpeningMm = useDrawingStore((s) => s.requiredOpeningMm)
  const mold = { footprintXmm, footprintYmm, heightMm, requiredOpeningMm }
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
        <OperatorRecipePanel result={data} compatibility={pressFit && (
            <div className={`rounded border px-3 py-3 text-sm ${pressFit.status === 'too-small' ? 'border-red-300 bg-red-50 text-red-900' : pressFit.status === 'overdimensioned' ? 'border-yellow-300 bg-yellow-50 text-yellow-900' : pressFit.status === 'compatible' ? 'border-green-300 bg-green-50 text-green-900' : 'border-gray-300 bg-gray-50 text-gray-800'}`}>
              <strong>Compatibilità pressa/stampo: </strong>{pressFit.status === 'too-small' ? 'pressa troppo piccola' : pressFit.status === 'overdimensioned' ? 'pressa sovradimensionata' : pressFit.status === 'compatible' ? 'pressa compatibile' : 'dati insufficienti'}.
              {pressFit.reasons.length > 0 && <div className="mt-1">{pressFit.reasons.join(' · ')}</div>}
              {idealPress && <div className="mt-2"><strong>Pressa ideale disponibile:</strong> {idealPress.pressName} ({(idealPress.nominalClampKn / 9.80665).toFixed(1)} t nominali).</div>}
          </div>
        )} />
      )}

      {!loading && data && selectedPress && confirmedSingleColdCavity && (
        <FillingTrialPanel
          pcSelected={pcSelected}
          vpVolumeCm3={data.vpSwitchVolumeCm3}
          maxPressureBar={selectedPress.dataStatus === 'complete' ? selectedPress.maxPressureBar : undefined}
          maxFlowCm3s={selectedPress.dataStatus === 'complete'
            ? selectedPress.maxInjectionFlowCm3s
              ?? linearScrewSpeedToFlowCm3s(selectedPress.maxSpeedMmPerS, data.screwDiameterMm)
            : undefined}
        />
      )}

      {data && viewerUrl && <FillSimulationViewer viewerUrl={viewerUrl} durationMs={data.times?.injectionMs} />}

      <div className="flex justify-start mt-4">
        <button className="px-4 py-2 border rounded" onClick={() => onBack && onBack()}>Indietro</button>
      </div>
    </div>
  )
}
