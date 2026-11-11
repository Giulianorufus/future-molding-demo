import { useState } from 'react'
import { estimateFillingTrial, type FillingTrialInput } from '@/engine/fillingTrial'

const fields: Array<[keyof FillingTrialInput, string]> = [
  ['flowCm3s', 'Portata effettiva (cm³/s)'],
  ['runnerLengthMm', 'Lunghezza canale (mm)'],
  ['runnerDiameterMm', 'Diametro canale (mm)'],
  ['gateLengthMm', 'Lunghezza attacco (mm)'],
  ['gateDiameterMm', 'Diametro attacco (mm)'],
  ['cavityLengthMm', 'Percorso equivalente in cavità (mm)'],
  ['cavityWidthMm', 'Larghezza equivalente in cavità (mm)'],
  ['cavityThicknessMm', 'Spessore equivalente in cavità (mm)'],
]
const viscosityFields: typeof fields = [
  ['consistencyPaSn', 'Consistenza K (Pa·sⁿ)'],
  ['flowIndex', 'Indice di flusso n (0 < n ≤ 1)'],
]

// Constant trial value chosen within the range reported for Lexan 103 in Fig. 10.
// It is not a measured coefficient for the material used in the workshop.
const pcReference = { consistencyPaSn: 100, flowIndex: 1 } as const
const pcReferenceSource = 'https://doi.org/10.1016/j.ijadhadh.2023.103617'

const number = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 3 })

export default function FillingTrialPanel({
  vpVolumeCm3, maxPressureBar, maxFlowCm3s, pcSelected,
}: {
  pcSelected: boolean
  vpVolumeCm3: number | null
  maxPressureBar?: number
  maxFlowCm3s?: number | null
}) {
  const [values, setValues] = useState<Partial<Record<keyof FillingTrialInput, string>>>({})
  const [useReference, setUseReference] = useState(true)
  const usingPcReference = pcSelected && useReference
  const activeFields = usingPcReference ? fields : [...fields, ...viscosityFields]
  const [processPressureLimit, setProcessPressureLimit] = useState('')
  const processLimit = Number(processPressureLimit)
  const invalidProcessLimit = processPressureLimit !== '' && (!Number.isFinite(processLimit) || processLimit <= 0)
  const pressureLimit = processLimit > 0 && !invalidProcessLimit
    ? maxPressureBar && maxPressureBar > 0 ? Math.min(processLimit, maxPressureBar) : processLimit
    : maxPressureBar
  const complete = activeFields.every(([key]) => Boolean(values[key]))
  const input = {
    ...Object.fromEntries(activeFields.map(([key]) => [key, Number(values[key])])),
    ...(usingPcReference ? pcReference : {}),
  } as FillingTrialInput
  const trial = complete && !invalidProcessLimit
    ? estimateFillingTrial(input, { maxPressureBar: pressureLimit, maxFlowCm3s }, vpVolumeCm3)
    : null

  return (
    <details className="rounded border p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Verifica fisica del riempimento</summary>
      <p className="my-2">
        Inserisci le misure del disegno per un canale e un attacco circolari. La cavità è approssimata
        come una fessura, con larghezza pari ad almeno 10 volte lo spessore.
      </p>
      {pcSelected && (
        <label className="my-2 flex items-center gap-2">
          <input type="checkbox" checked={useReference} onChange={(event) => setUseReference(event.target.checked)} />
          Usa viscosità di riferimento per il PC
        </label>
      )}
      {usingPcReference ? (
        <p className="mb-2 text-amber-800">
          Stima preliminare con viscosità costante di {pcReference.consistencyPaSn} Pa·s. Il valore di prova
          è scelto nell’intervallo pubblicato per il Lexan 103 e può differire dal PC in uso.
          {' '}<a href={pcReferenceSource} className="underline" target="_blank" rel="noreferrer">Fonte, figura 10</a>
        </p>
      ) : (
        <p className="mb-2">Usa K e n ricavati dalla curva del grado in uso alla temperatura del fuso e nel campo di taglio della prova.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activeFields.map(([key, label]) => (
          <label key={key}>
            {label}
            <input type="number" min={0} step="any" value={values[key] ?? ''}
              onChange={(event) => setValues({ ...values, [key]: event.target.value })}
              className="mt-1 block w-full rounded border px-3 py-2" />
          </label>
        ))}
        <label>
          Limite pressione impostato sul ciclo (bar, facoltativo)
          <input type="number" min={0} step="any" value={processPressureLimit}
            onChange={(event) => setProcessPressureLimit(event.target.value)}
            className="mt-1 block w-full rounded border px-3 py-2" />
        </label>
      </div>
      <div aria-live="polite" className="mt-3">
        {!complete && <p>Compila tutti i campi per ottenere la stima.</p>}
        {invalidProcessLimit && <p>Inserisci un limite di pressione positivo.</p>}
        {complete && !invalidProcessLimit && !trial && <p>Controlla valori, indice di flusso e rapporto larghezza/spessore.</p>}
        {trial && (
          <>
            <p><strong>Perdita di pressione stimata nel percorso modellato</strong> {number.format(trial.totalBar)} bar</p>
            <p>Canale {number.format(trial.runnerBar)} bar · Attacco {number.format(trial.gateBar)} bar · Cavità {number.format(trial.cavityBar)} bar</p>
            {trial.vpTimeSec !== null && <p>Tempo teorico alla V/P del Wizard a portata costante {number.format(trial.vpTimeSec)} s</p>}
            {trial.exceedsPressure && <p className="text-red-800">La sola perdita stimata supera il limite di pressione usato nella verifica.</p>}
            {trial.exceedsFlow && <p className="text-red-800">La portata inserita supera il limite disponibile per la pressa selezionata.</p>}
            {(trial.exceedsPressure === null || trial.exceedsFlow === null) &&
              <p>Verifica i limiti mancanti per l’unità d’iniezione selezionata.</p>}
          </>
        )}
      </div>
      <p className="mt-2 text-gray-600">
        Modello a temperatura e portata costanti. Il totale riguarda canale, attacco e cavità equivalenti.
        La lettura SELOGICA può includere altre perdite e transitori. Il risultato richiede verifica in pressa.
      </p>
    </details>
  )
}
