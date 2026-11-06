import type { ReactNode } from 'react'
import ExportRecipeButton from './ExportRecipeButton'
import { useDrawingStore } from '../stores/drawingStore'
import { useMaterialStore } from '../stores/materialStore'
import { usePressStore } from '../stores/pressStore'
import type { CalculationResult } from '../core/calcEngine'
import { buildOperatorRecipeView } from './operatorRecipe/buildOperatorRecipeView'

type OperatorRecipePanelProps = {
  result: CalculationResult
  compatibility?: ReactNode
}

const numberFormatter = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 })
const volumeFormatter = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 3, maximumFractionDigits: 6 })

function show(value: number | null, unit: string): string {
  return value === null ? 'Dato non disponibile' : numberFormatter.format(value) + ' ' + unit
}

function Metric({ label, value, source, highlight = false }: { label: string; value: string; source?: string; highlight?: boolean }) {
  return (
    <div className={highlight
      ? 'rounded-xl border border-yellow-400 bg-yellow-50 p-4'
      : 'fm-card p-4'}>
      <dt className="text-sm font-medium text-blue-800">{label}</dt>
      <dd className="mt-1 break-words text-xl font-bold tabular-nums text-blue-950">{value}</dd>
      {source && <dd className="mt-1 text-sm text-slate-600">{source}</dd>}
    </div>
  )
}

export default function OperatorRecipePanel({ result, compatibility }: OperatorRecipePanelProps) {
  const press = usePressStore((s) => s.selectedPressId ? s.catalog[s.selectedPressId]?.name : undefined)
  const material = useMaterialStore((s) => s.selectedMaterialId ? s.catalog[s.selectedMaterialId]?.name : undefined)
  const cavities = useDrawingStore((s) => s.cavityCount)
  const confirmed = useDrawingStore((s) => s.cavityCountConfirmed)
  const feed = useDrawingStore((s) => s.feedSystem)
  const recipe = buildOperatorRecipeView(result)
  const dose = recipe.shotVolumeCm3 === null
    ? 'Dato non disponibile'
    : volumeFormatter.format(recipe.shotVolumeCm3) + ' cm³'
  const vp = recipe.vpVolumeCm3 === null
    ? 'Da confermare: geometria, cavità e canali'
    : volumeFormatter.format(recipe.vpVolumeCm3) + ' cm³ iniettati'

  return (
    <section aria-label="Ricetta iniziale operatore" className="space-y-4 text-blue-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ricetta operatore</h2>
          <p className="mt-1 text-sm text-slate-600">
            {[press, recipe.screwDiameterMm === null ? null : 'Vite Ø ' + show(recipe.screwDiameterMm, 'mm'), material].filter(Boolean).join(' · ')}
          </p>
        </div>
        <ExportRecipeButton />
      </div>

      {recipe.warnings.length > 0 && (
        <section aria-label="Avvisi della ricetta" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950">
          <h3 className="font-semibold">Da verificare prima della prova</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {recipe.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </section>
      )}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Volume dosaggio · dose totale" value={dose} source="Volume pezzo, numero cavità e canali freddi" highlight={recipe.shotVolumeCm3 === null} />
        <Metric label="Commutazione V/P · volume iniettato" value={vp} source="Stima del motore riferita alla dose totale" highlight={recipe.vpVolumeCm3 === null} />
        <Metric label="Chiusura richiesta" value={show(recipe.requiredClampTon, 't')} source="Stima del motore · verificare area proiettata e pressione in cavità" highlight={recipe.requiredClampTon === null} />
      </dl>
      {recipe.vpVolumeCm3 !== null && (
        <p className="text-sm text-blue-800">
          {recipe.vpPercentOfShot !== null && numberFormatter.format(recipe.vpPercentOfShot) + '% della dose'}
          {recipe.vpTimeMs !== null && ' · tempo indicativo ' + numberFormatter.format(recipe.vpTimeMs) + ' ms'}
        </p>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)]">
        <div className="min-w-0 space-y-4">
          <section aria-label="Iniezione" className="fm-card pb-4 [&>dl]:mx-4 [&>div]:mx-4 [&>h4]:mx-4 [&>p]:mx-4">
            <h3 className="fm-panel-title">1. Iniezione</h3>
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Metric label="Portata suggerita" value={show(recipe.injectionFlowCm3s, 'cm³/s')} source="Stima del motore con i limiti pressa disponibili" />
              <Metric label="Pressione stimata" value={show(recipe.injectionPressureBar, 'bar')} />
            </dl>
            <h4 className="mt-4 text-sm font-semibold">Fasi di riempimento</h4>
            {recipe.injectionPhases.length > 0 ? (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[280px] text-left text-sm">
                  <thead><tr className="border-b border-blue-300">
                    <th scope="col" className="p-2">Fase</th>
                    <th scope="col" className="p-2">Portata</th>
                    <th scope="col" className="p-2">Fine fase</th>
                  </tr></thead>
                  <tbody>
                    {recipe.injectionPhases.map((phase) => (
                      <tr key={phase.step} className="border-b border-blue-200">
                        <td className="p-2 font-semibold">{phase.step}</td>
                        <td className="p-2">{numberFormatter.format(phase.flowCm3s)} cm³/s</td>
                        <td className="p-2">{phase.endPercentOfShot === null
                          ? 'Da confermare'
                          : numberFormatter.format(phase.endPercentOfShot) + '% della dose'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="mt-2 text-sm text-blue-800">Profilo non disponibile.</p>}
          </section>

          <div className="space-y-4">
            <section aria-label="Postpressione" className="fm-card pb-4 [&>dl]:mx-4 [&>p]:mx-4">
              <h3 className="fm-panel-title">2. Mantenimento</h3>
              <p className="mt-1 text-xs text-blue-700">Stima complessiva; fasi non disponibili.</p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <Metric label="Pressione" value={show(recipe.holdingPressureBar, 'bar')} />
                <Metric label="Tempo" value={show(recipe.holdingTimeSec, 's')} />
              </dl>
            </section>
            <section aria-label="Dosaggio e decompressione" className="fm-card pb-4 [&>dl]:mx-4 [&>p]:mx-4">
              <h3 className="fm-panel-title">3. Plastificazione e decompressione</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <Metric label="Rotazione vite" value={show(recipe.screwRpm, 'giri/min')} />
                <Metric label="Tempo plastificazione" value={show(recipe.plastificationTimeSec, 's')} />
                <Metric label="Contropressione" value={show(recipe.backPressureBar, 'bar')} />
                <Metric label="Decompressione" value="Da impostare in pressa" />
              </dl>
            </section>
          </div>
          <section className="fm-card">
            <h3 className="fm-panel-title">4. Raffreddamento</h3>
            <dl className="p-3">
              <Metric label="Raffreddamento indicativo" value={show(recipe.coolingTimeMs, 'ms')} source="Stima del motore da verificare sul ciclo reale" />
            </dl>
          </section>
        </div>
        <aside className="fm-card">
          <h3 className="fm-panel-title">Configurazione stampo</h3>
          <div className="space-y-3 p-4 text-sm">
            <dl className="space-y-2">
              <div><dt className="font-semibold">Numero cavità · configurazione stampo</dt><dd>{cavities}{confirmed ? '' : ' · da confermare'}</dd></div>
              <div><dt className="font-semibold">Alimentazione</dt><dd>{feed === 'cold' ? 'Canale freddo' : feed === 'hot' ? 'Canale caldo' : 'Da confermare'}</dd></div>
            </dl>
            {compatibility}
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 font-semibold text-amber-950">
              Verificare i valori suggeriti sulla pressa e sul pezzo.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
