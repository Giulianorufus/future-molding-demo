import { useState, type FormEvent } from 'react'
import { knowledgeOutcomeSchema, type KnowledgeOutcomeSchema } from '@/engine/knowledge/knowledgeOutcome.schema'

const storageKey = 'fm:defect-outcomes'
const outcomeLogSchema = knowledgeOutcomeSchema.array()
const labels = {
  SUCCESS: 'Risolto',
  PARTIAL_SUCCESS: 'Migliorato',
  FAILED: 'Nessun miglioramento o peggiorato',
  NOT_TESTED: 'Non provato',
} satisfies Record<KnowledgeOutcomeSchema['status'], string>

interface Props {
  defectId: string
  pressId?: string | null
  materialId?: string | null
}

function readOutcomes() {
  return outcomeLogSchema.parse(JSON.parse(localStorage.getItem(storageKey) ?? '[]'))
}

export default function DefectOutcomeLog({ defectId, pressId, materialId }: Props) {
  const [records, setRecords] = useState(() => {
    try {
      return readOutcomes()
    } catch {
      return null
    }
  })
  const [action, setAction] = useState('')
  const [status, setStatus] = useState<KnowledgeOutcomeSchema['status'] | ''>('')
  const [notes, setNotes] = useState('')
  const [restored, setRestored] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!action.trim() || !status) return

    try {
      const record: KnowledgeOutcomeSchema = {
        id: Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-'),
        status,
        notes: notes.trim() || null,
        metadata: {
          action: action.trim(),
          restored,
          defectId,
          pressId,
          materialId,
          createdAtISO: new Date().toISOString(),
        },
      }
      const next = [record, ...readOutcomes()]
      localStorage.setItem(storageKey, JSON.stringify(next))
      setRecords(next)
      setAction('')
      setNotes('')
      setRestored(false)
      setStatus('')
      setError(false)
      setMessage('Esito salvato su questo dispositivo.')
    } catch {
      setError(true)
      setMessage('Impossibile salvare l’esito. Il registro locale potrebbe essere pieno o non disponibile.')
    }
  }

  const matchingRecords = records?.filter(record => record.metadata?.defectId === defectId)

  return (
    <section aria-labelledby="defect-outcome-heading" className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 id="defect-outcome-heading" className="text-lg font-semibold">Registro delle prove</h2>
      <p className="mt-1 text-sm text-slate-600">Annota cosa hai provato in pressa. Il registro è salvato in questo browser.</p>
      <form onSubmit={save} className="mt-3 grid gap-3 text-sm">
        <label className="grid gap-1">Modifica provata
          <input required maxLength={240} className="rounded border border-slate-300 p-2" value={action} onChange={event => setAction(event.target.value)} />
        </label>
        <label className="grid gap-1">Esito in pressa
          <select required className="rounded border border-slate-300 p-2" value={status} onChange={event => setStatus(event.target.value as KnowledgeOutcomeSchema['status'])}>
            <option value="">Seleziona un esito</option>
            <option value="SUCCESS">{labels.SUCCESS}</option>
            <option value="PARTIAL_SUCCESS">{labels.PARTIAL_SUCCESS}</option>
            <option value="FAILED">{labels.FAILED}</option>
          </select>
        </label>
        <label className="grid gap-1">Note sulla prova
          <textarea maxLength={1000} className="rounded border border-slate-300 p-2" value={notes} onChange={event => setNotes(event.target.value)} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={restored} onChange={event => setRestored(event.target.checked)} />
          Ho ripristinato la ricetta precedente in pressa
        </label>
        <button type="submit" disabled={!action.trim() || !status} className="justify-self-start rounded bg-blue-700 px-3 py-2 font-semibold text-white disabled:opacity-50">
          Salva esito
        </button>
      </form>
      {message && <p className="mt-3 text-sm" role={error ? 'alert' : 'status'}>{message}</p>}
      {records === null && <p className="mt-3 text-sm" role="alert">Registro locale non leggibile.</p>}
      {!!matchingRecords?.length && (
        <ul aria-label="Esiti registrati per questo difetto" className="mt-4 max-h-72 space-y-3 overflow-y-auto text-sm">
          {matchingRecords.map(record => (
            <li key={record.id} className="border-t border-slate-200 pt-2">
              <strong>{labels[record.status]}</strong> · {String(record.metadata?.action ?? '')}
              {record.notes && <p>{record.notes}</p>}
              {record.metadata?.restored === true && <p>Ricetta precedente ripristinata in pressa.</p>}
              <p className="text-xs text-slate-600">
                {[typeof record.metadata?.createdAtISO === 'string' ? new Date(record.metadata.createdAtISO).toLocaleString('it-IT') : null, record.metadata?.pressId, record.metadata?.materialId].filter(Boolean).join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
