import { useEffect, useState } from 'react'
import type { CalculationResult } from '@/core/calcEngine'
import { inferKnowledgeRecommendations } from '@/engine/knowledge/knowledgeEngine'
import { getDefectGuide, type DiagnosticAnswers } from '@/engine/knowledge/guidedDiagnosis'
import type { KnowledgeResult } from '@/engine/knowledge/types'

type Props = {
  defectId: string
  severity: string
  result: CalculationResult | null
  volumeCm3: number | null
  pressId: string | null
  materialId: string | null
}

export default function GuidedDefectDiagnosis({ defectId, severity, result, volumeCm3, pressId, materialId }: Props) {
  const guide = getDefectGuide(defectId)
  const [answers, setAnswers] = useState<DiagnosticAnswers>({})
  const [evaluation, setEvaluation] = useState<KnowledgeResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setEvaluation(null)
    void inferKnowledgeRecommendations({
      input: {
        volumeCm3, pressId, materialId, defectId, severity,
        processParameters: result ? {
          pressureBar: result.pressureBar,
          injectionFlowCm3s: result.injectionFlowCm3s,
        } : undefined,
      },
      output: { calculatedAtISO: new Date().toISOString(), rawResult: result ? result as unknown as Record<string, unknown> : {} },
      defectContext: { defectId, severity, observations: answers },
    }, undefined, { persistLearning: false }).then(next => {
      if (!cancelled) setEvaluation(next)
    }).catch(() => {
      if (!cancelled) setError('Diagnosi non disponibile. Modifica una risposta o riavvia le domande per riprovare.')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [defectId, severity, answers, result, volumeCm3, pressId, materialId])

  if (!guide) return <section aria-label="Diagnosi guidata" className="rounded-xl border p-4">Diagnosi guidata non disponibile per questo difetto.</section>
  const report = evaluation?.guidedDiagnosis
  return <section aria-label="Diagnosi guidata" className="space-y-5 rounded-xl border border-blue-200 bg-white p-4 text-blue-950">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold">Diagnosi guidata · {guide.label}</h2>
        <p className="mt-1 text-sm text-slate-600">Rispondi sui pezzi e sui dati osservati in pressa. Prova una modifica alla volta e confronta il risultato.</p>
      </div>
      <button className="rounded-lg border border-blue-200 px-3 py-2 text-sm" onClick={() => setAnswers({})}>Ricomincia le domande</button>
    </div>
    {!result && <p className="rounded-lg bg-blue-50 p-3 text-sm">Puoi iniziare dalle osservazioni. Completa il Wizard per affiancare i parametri calcolati alle verifiche.</p>}
    <div className="grid gap-3 md:grid-cols-3">
      {guide.questions.map((question, index) => <label key={question.id} className="flex min-w-0 flex-col gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
        <span className="font-medium">{index + 1}. {question.label}</span>
        <select aria-label={question.label} className="mt-auto min-w-0 w-full rounded border border-slate-300 bg-white p-2 text-slate-900" value={answers[question.id] ?? ''} onChange={event => setAnswers(previous => ({ ...previous, [question.id]: event.target.value }))}>
          <option value="">Scegli una risposta</option>
          {question.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>)}
    </div>
    {loading && <p role="status" className="text-sm">Aggiornamento delle verifiche…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {report && <>
      <div className="text-sm text-slate-600" role="status">{report.answeredCount} di {guide.questions.length} risposte · {report.observedCount} osservazioni verificate</div>
      <div>
        <h3 className="text-lg font-semibold">Cause possibili e azioni in ordine di verifica</h3>
        <p className="mt-1 text-sm text-slate-600">L’ordine segue gli indizi che hai indicato. Le ipotesi restano da confermare con una prova.</p>
      </div>
      <ol aria-label="Cause possibili" className="space-y-3">
        {report.hypotheses.map((hypothesis, index) => <li key={hypothesis.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">{index + 1}. {hypothesis.title}</h4>
            <span className={`rounded-full px-2 py-1 text-xs ${hypothesis.evidence.length ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-600'}`}>{hypothesis.evidence.length ? 'Indizi presenti' : 'Da verificare'}</span>
          </div>
          <p className="mt-2 text-sm text-slate-700">{hypothesis.explanation}</p>
          {hypothesis.evidence.length > 0 && <ul aria-label={`Indizi per ${hypothesis.title}`} className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-800">{hypothesis.evidence.map(evidence => <li key={evidence}>{evidence}</li>)}</ul>}
          <ol aria-label={`Azioni per ${hypothesis.title}`} className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">{hypothesis.checks.map(check => <li key={check}>{check}</li>)}</ol>
        </li>)}
      </ol>
      {report.pendingQuestions.length > 0 && <details className="rounded-lg bg-slate-50 p-3 text-sm">
        <summary className="cursor-pointer font-medium">Dati ancora da verificare ({report.pendingQuestions.length})</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">{report.pendingQuestions.map(question => <li key={question}>{question}</li>)}</ul>
      </details>}
    </>}
    <details className="border-t border-slate-200 pt-3 text-sm text-slate-600">
      <summary className="cursor-pointer">Riferimento tecnico</summary>
      <p className="mt-2"><a className="text-blue-700 underline" href={guide.source.url} target="_blank" rel="noreferrer">{guide.source.label}</a></p>
      <p className="mt-1">Domande e ordine delle verifiche sono regole qualitative di Future Molding. Le condizioni di prova dipendono dal grado materiale e dai limiti di pressa e stampo.</p>
    </details>
  </section>
}
