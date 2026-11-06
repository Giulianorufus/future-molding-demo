import React, { useMemo, useState } from 'react'
import { usePressStore } from '@/stores/pressStore'
import type { PressSpec } from '@/stores/pressStore'

export default function Step2Press({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { catalog, selectedPressId, selectedScrewDiameter_mm, selectPress, selectScrewDiameter } = usePressStore()
  const entries = useMemo(() => Object.values(catalog || {}), [catalog])

  const brands = useMemo(() => {
    const map: Record<string, PressSpec[]> = {}
    for (const e of entries) {
      const brand = String(e.id).split('-')[0]
      map[brand] = map[brand] || []
      map[brand].push(e)
    }
    return map
  }, [entries])

  const [brand, setBrand] = useState<string | null>(null)
  const models = brand ? brands[brand] ?? [] : []

  const selectedPress = catalog[selectedPressId ?? ''] ?? null

  const canNext = !!(selectedPress && selectedPress.screwDiameters && selectedPress.screwDiameters.length > 0)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-blue-800 font-semibold mb-2">Marca</label>
        <select className="border p-2 rounded w-full" value={brand ?? ''} onChange={(e) => setBrand(e.target.value || null)}>
          <option value="">Seleziona marca</option>
          {Object.keys(brands).map((b) => (
            <option key={b} value={b}>{b.toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-blue-800 font-semibold mb-2">Modello</label>
        <select className="border p-2 rounded w-full" value={selectedPressId ?? ''} onChange={(e) => selectPress(e.target.value || null)}>
          <option value="">Seleziona modello</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.name || m.id}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-blue-800 font-semibold mb-2">Diametro vite</label>
        <div>
          {selectedPress?.dataStatus === 'reference' && (
            <div className="mb-2 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
              Configurazione di riferimento: verificare i dati della targa prima di trasferire la ricetta alla pressa.
            </div>
          )}
          {selectedPress && selectedPress.screwDiameters.length > 0 ? (
            <select className="border p-2 rounded w-full" value={selectedScrewDiameter_mm ?? selectedPress.screwDiameters[0] ?? ''} onChange={(e) => {
                const v = e.target.value === '' ? null : Number(e.target.value)
                selectScrewDiameter(v)
              }}>
              {selectedPress.screwDiameters.map((d) => (
                <option key={d} value={d}>{d} mm</option>
              ))}
            </select>
          ) : selectedPress ? (
            <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
              Questa pressa ha la forza di chiusura documentata ({selectedPress.clampForceKn} kN), ma i dati dell’unità d’iniezione non sono ancora caricati.
            </div>
          ) : (
            <div className="text-sm text-gray-500">Seleziona un modello per vedere le opzioni vite.</div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button className="px-4 py-2 border rounded" onClick={() => onBack && onBack()}>Indietro</button>
        <button className={`px-4 py-2 rounded text-white ${canNext ? 'bg-blue-600' : 'bg-yellow-400 text-black'}`} onClick={() => { if (canNext && onNext) onNext() }} disabled={!canNext}>Avanti</button>
      </div>
    </div>
  )
}
