import React, { useEffect, useState } from "react";
import { useDrawingStore } from "../stores/drawingStore";
import { useParametriStore } from "../stores/parametriStore";
import { useDefectsStore } from "../stores/defectsStore";
import ThreeViewer from "../components/ThreeViewer";
import { resolveDefectIntegration } from "../defects/defectAdapter";
import { findDefectCatalogEntries, resolveDefectCatalogEntry } from "../defects/defectCatalog";
import { inferKnowledgeRecommendations } from "../engine/knowledge/knowledgeEngine";
import type { KnowledgeResult } from "../engine/knowledge/types";
import { getContextualDefectProfile, detectClarificationRequests, type OperatorAnswer } from "../engine/knowledge/defectContext";
import { buildDefectCaseId, buildDefectKnowledgeContext, levelToSeverity, severityToLevel, type DefectMeshPin } from "../defects/defectAssessment";

const EMPTY_ANSWERS: Record<string, OperatorAnswer> = {};

export default function DifettiPage() {
  // Stato UI (non scrive mai su store)
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [answersByCase, setAnswersByCase] = useState<Record<string, Record<string, OperatorAnswer>>>({});
  const [severityAfter, setSeverityAfter] = useState<string>('2');
  const [interventionTried, setInterventionTried] = useState('');
  const [placementMode, setPlacementMode] = useState(false);
  const [selectedMeshPinId, setSelectedMeshPinId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Severity selection (store)
  const selectedSeverity = useDefectsStore((s) => s.selectedSeverity)
  const setSelectedSeverity = useDefectsStore((s) => s.setSelectedSeverity)
  const setSelectedDefectIdStore = useDefectsStore((s) => s.setSelectedDefectId)
  const evaluations = useDefectsStore((s) => s.evaluations)
  const recordEvaluation = useDefectsStore((s) => s.recordEvaluation)
  const meshPins = useDefectsStore((s) => s.meshPins)
  const addMeshPin = useDefectsStore((s) => s.addMeshPin)
  const removeMeshPin = useDefectsStore((s) => s.removeMeshPin)

  // Dati dal disegno (read-only)
  const drawingId = useDrawingStore((s) => s.drawingId);
  const viewerUrl = useDrawingStore((s) => s.viewerUrl);
  const conversionStatus = useDrawingStore((s) => s.conversionStatus);
  const conversionMessage = useDrawingStore((s) => s.conversionMessage);
  const volumeCm3 = useDrawingStore((s) => s.volumeCm3);
  const boundingBox = useDrawingStore((s) => s.boundingBox);
  const previewUrl = useDrawingStore((s) => s.previewUrl);
  const glbUrl = useDrawingStore((s) => s.glbUrl);
  console.debug('MODEL IN DIFETTI', { viewerUrl, previewUrl, glbUrl, cadAnalysis: { volumeCm3, bbox: boundingBox }, conversionStatus, conversionMessage });

  // Parametri calcolati (read-only)
  const result = useParametriStore((s) => s.result);
  const loading = useParametriStore((s) => s.loading);
  const error = useParametriStore((s) => s.error);
  const lastDefectFix = useParametriStore((s) => s.lastDefectFix);
  const [knowledgeResult, setKnowledgeResult] = useState<KnowledgeResult | null>(null);

  const catalogEntry = resolveDefectCatalogEntry(selectedDefectId);
  const defectIntegration = resolveDefectIntegration(catalogEntry?.id);
  const profile = getContextualDefectProfile(catalogEntry?.id);
  const visibleCatalogEntries = findDefectCatalogEntries(catalogSearch);
  const activeMeshPins = meshPins.filter((pin) => pin.drawingId === drawingId && pin.drawingVersion === drawingId && pin.defectId === catalogEntry?.id);
  const selectedMeshPin = activeMeshPins.find((pin) => pin.id === selectedMeshPinId) ?? activeMeshPins[0] ?? null;
  const caseId = drawingId && catalogEntry && selectedMeshPin
    ? buildDefectCaseId(drawingId, catalogEntry.id, selectedMeshPin.id)
    : null;
  const answers = caseId ? answersByCase[caseId] ?? EMPTY_ANSWERS : EMPTY_ANSWERS;
  const currentCase = evaluations.find((item) => item.caseId === caseId);
  const previousEvaluation = currentCase?.evaluations.at(-1);
  const answerConflicts = detectClarificationRequests(catalogEntry?.id, answers);
  const hasLegacyAnswers = (currentCase?.evaluations ?? []).some((entry) => Object.keys(entry.legacyAnswers ?? {}).length > 0);
  const validVolume = typeof volumeCm3 === 'number' && Number.isFinite(volumeCm3) && volumeCm3 > 0 ? volumeCm3 : null;
  const validBoundingBox = boundingBox && Object.values(boundingBox).every((value) => Number.isFinite(value) && value > 0)
    ? boundingBox
    : null;
  const geometryAvailable = conversionStatus === 'ready' && Boolean(validVolume || validBoundingBox);

  useEffect(() => {
    setPlacementMode(false);
    setSelectedMeshPinId(null);
  }, [drawingId, selectedDefectId]);

  useEffect(() => {
    setInterventionTried('');
    setSeverityAfter(String(previousEvaluation?.severityAfter ?? severityToLevel(selectedSeverity)));
  }, [caseId, previousEvaluation?.severityAfter, selectedSeverity]);

  useEffect(() => {
    if (!selectedDefectId || !catalogEntry || !selectedMeshPin) {
      setKnowledgeResult(null);
      return;
    }

    let cancelled = false;
    if (!drawingId) {
      setKnowledgeResult(null);
      return;
    }

    const context = buildDefectKnowledgeContext({
      drawingId,
      defectId: catalogEntry.id,
      severity: levelToSeverity(selectedMeshPin.severity),
      pin: selectedMeshPin,
      answers,
      volumeCm3: geometryAvailable ? validVolume : null,
      boundingBoxMm: geometryAvailable ? validBoundingBox : null,
      rawResult: (result ?? {}) as unknown as Record<string, unknown>,
      processParameters: result ? {
        pressureBar: result.pressureBar,
        velocityMmPerS: result.screwVelocityMmPerS,
        switchoverMs: result.switchoverMs,
      } : undefined,
    });
    void inferKnowledgeRecommendations(context).then((next) => {
      if (!cancelled) setKnowledgeResult(next);
    }).catch(() => {
      if (!cancelled) setKnowledgeResult(null);
    });

    return () => { cancelled = true };
  }, [answers, boundingBox, catalogEntry?.id, drawingId, geometryAvailable, result, selectedDefectId, selectedMeshPin?.id, selectedSeverity, validBoundingBox, validVolume]);

  const selectedLabel = catalogEntry?.nameIt ?? selectedDefectId;
  const placeMeshPin = (position: { x: number; y: number; z: number }) => {
    if (!drawingId || !catalogEntry) return;
    const pin: DefectMeshPin = {
      id: `pin_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      drawingId,
      drawingVersion: drawingId,
      defectId: catalogEntry.id,
      severity: severityToLevel(selectedSeverity),
      position: { ...position },
      coordinateFrame: 'model-local',
      placement: 'mesh-raycast',
      createdAtISO: new Date().toISOString(),
    };
    addMeshPin(pin);
    setSelectedMeshPinId(pin.id);
    setPlacementMode(false);
  };

  const saveEvaluation = () => {
    if (!caseId || !drawingId || !catalogEntry || !selectedMeshPin) return;
    const parsedAfter = Number(severityAfter) as 0 | 1 | 2 | 3;
    if (![0, 1, 2, 3].includes(parsedAfter) || interventionTried.trim().length < 3) return;
    const parsedBefore = previousEvaluation?.severityAfter ?? selectedMeshPin.severity;
    recordEvaluation({
      caseId,
      drawingId,
      defectId: catalogEntry.id,
      pinId: selectedMeshPin.id,
      reportedSeverity: selectedMeshPin.severity,
      pinPosition: { ...selectedMeshPin.position },
      evaluations: [{
        id: `evaluation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        severityBefore: parsedBefore,
        severityAfter: parsedAfter,
        interventionTried: interventionTried.trim(),
        answers: { ...answers },
        evaluatedAtISO: new Date().toISOString(),
      }],
    });
    setInterventionTried('');
  };

  return (
    <div className="flex min-h-screen flex-col lg:h-full lg:flex-row">
      {/* Sidebar Difetti */}
      <div className="w-full max-h-[45vh] overflow-y-auto border-b border-gray-300 p-4 bg-gray-100 flex-shrink-0 lg:max-h-none lg:w-64 lg:border-b-0 lg:border-r">
        <h2 className="font-bold text-lg mb-3">Difetti</h2>

        <label className="block text-sm font-medium text-slate-700 mt-3">Gravità segnalata</label>

        <select
          aria-label="Gravità segnalata"
          className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value as any)}
        >
          <option value="low">Bassa</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>

        <label className="mt-3 block text-sm font-medium text-slate-700" htmlFor="defect-catalog-search">Cerca nel catalogo</label>
        <input
          id="defect-catalog-search"
          aria-label="Cerca difetti"
          className="mt-1 mb-3 w-full rounded border border-gray-400 bg-white px-3 py-2 text-sm"
          value={catalogSearch}
          onChange={(event) => setCatalogSearch(event.target.value)}
          placeholder="Nome o sinonimo"
        />

        {visibleCatalogEntries.map((def) => (
          <div
            key={def.id}
            className={`p-2 mb-2 rounded cursor-pointer ${
              selectedDefectId === def.id ? "bg-yellow-300 font-semibold" : "bg-white hover:bg-gray-200"
            }`}
            onClick={() => {
              setSelectedDefectId(def.id)
              setSelectedMeshPinId(null)
              try { setSelectedDefectIdStore(def.id) } catch (_) {}
            }}
          >
            <span>{def.nameIt}</span>
            <span className="ml-2 text-[10px] text-gray-500">{def.verificationStatus === 'partial' ? 'parziale' : def.verificationStatus === 'unverified' ? 'senza riscontro' : 'verificata nel campo fonte'}</span>
          </div>
        ))}

        {visibleCatalogEntries.length === 0 && <p className="text-xs text-gray-600">Nessun difetto corrisponde alla ricerca.</p>}

        <div className="mt-6 text-sm text-gray-700">
          {selectedDefectId
            ? catalogEntry?.description
            : "Seleziona un difetto per evidenziare la zona sul modello."}
        </div>

        {catalogEntry && (
          <section className="mt-3 space-y-2 border-t border-gray-300 pt-3 text-xs" aria-label="Scheda catalogo">
            <p><strong>Sinonimi:</strong> {catalogEntry.synonymsIt.join(', ') || 'Nessuno censito'}</p>
            <p><strong>Fonte:</strong> {catalogEntry.verificationStatus}; <strong>automazione:</strong> {catalogEntry.automationStatus === 'proposed' ? 'proposta esistente, non validata' : catalogEntry.automationStatus === 'manual' ? 'manuale' : 'disabilitata'}</p>
            <p><strong>Gravità 1:</strong> {catalogEntry.severityCriteria[1]}</p>
            <p><strong>Gravità 2:</strong> {catalogEntry.severityCriteria[2]}</p>
            <p><strong>Gravità 3:</strong> {catalogEntry.severityCriteria[3]}</p>
            {catalogEntry.semanticCautions?.map((caution) => <p key={caution}><strong>Distinzione:</strong> {caution}</p>)}
            <div>
              <strong>Cause probabili e azioni ordinate</strong>
              {catalogEntry.probableCauses.length > 0 ? (
                <ol className="mt-1 list-decimal pl-5">
                  {catalogEntry.probableCauses.map((cause) => (
                    <li key={cause.id} className="mt-1">{cause.title}: {cause.action} <span className="text-gray-500">({cause.domain}; {cause.sourceReference}{cause.materialLimit ? `; materiale: ${cause.materialLimit}` : ''})</span></li>
                  ))}
                </ol>
              ) : (
                <p className="mt-1 text-amber-800">Non disponibili: nessuna fonte consultata supporta cause e azioni tecniche per questa scheda/materiale.</p>
              )}
            </div>
            {catalogEntry.sources.length > 0
              ? catalogEntry.sources.map((source, index) => <p key={`${source.publisher}-${index}`}><strong>Fonte:</strong> {source.publisher}, {source.title}, {source.reference}. Supporta: {source.supports}. Limite: {source.limit}</p>)
              : <p><strong>Fonti:</strong> nessun riscontro tecnico acquisito per cause/azioni.</p>}
          </section>
        )}

        {selectedDefectId && (
          <button
            type="button"
            className="mt-3 text-sm text-blue-700 underline"
            onClick={() => {
              setSelectedDefectId(null)
              setSelectedDefectIdStore(null)
            }}
          >
            Rimuovi difetto
          </button>
        )}

        {catalogEntry && defectIntegration && (
          <section className="mt-4 border-t border-gray-300 pt-3 text-sm" aria-live="polite">
            <strong>{defectIntegration.automatic ? "Correzione proposta da verificare" : "Verifica manuale"}</strong>
            <p className="mt-1 text-gray-700">
              {defectIntegration.automatic
                ? `${defectIntegration.automaticAction} Verificare il risultato sul pezzo; la selezione avvia il ricalcolo.`
                : "Questo difetto non ha una correzione automatica validata per i limiti attuali."}
            </p>
            <ul className="mt-2 list-disc pl-5 text-gray-700">
              {defectIntegration.manualChecks.map((check) => <li key={check}>{check}</li>)}
            </ul>
          </section>
        )}

        {selectedDefectId && (
          <section className="mt-4 border-t border-gray-300 pt-3 text-sm" aria-label="Contesto diagnostico">
            <strong>Contesto del difetto</strong>
            <p className="mt-1 text-xs text-gray-700">Disegno: {drawingId ?? 'non identificato; seleziona o carica un CAD'}</p>
            <p className="text-xs text-gray-700">Posizione: il pin viene creato solo toccando/cliccando una mesh del modello. Non si inferiscono dettagli dello stampo dalla posizione.</p>
            {geometryAvailable ? (
              <p className="mt-1 text-xs text-gray-700">
                Dati CAD osservati: {validVolume ? `volume ${validVolume} cm³` : 'volume non disponibile'}; {validBoundingBox ? `bounding box ${validBoundingBox.x} × ${validBoundingBox.y} × ${validBoundingBox.z} mm` : 'bounding box non disponibile'}.
              </p>
            ) : (
              <p className="mt-1 text-xs text-amber-800">Geometria CAD attendibile non disponibile; non viene usata per inferire cause.</p>
            )}

            {catalogEntry.symptoms.length > 0 && (
              <div className="mt-3">
                <strong className="block">Sintomi da osservare</strong>
                <ul className="mt-1 list-disc pl-5">{catalogEntry.symptoms.map((symptom) => <li key={symptom}>{symptom}</li>)}</ul>
              </div>
            )}

            {catalogEntry.diagnosticQuestions.length > 0 && (
              <div className="mt-3 space-y-3">
                <strong className="block">Verifiche mirate</strong>
                {catalogEntry.diagnosticQuestions.map((question) => {
                  const questionId = question.id
                  return (
                  <label key={questionId} className="block text-xs text-gray-800">
                    <span>{question.text}</span>
                    <select
                      aria-label={question.text}
                      className="mt-1 w-full rounded border border-gray-400 bg-white px-2 py-1"
                      value={answers[questionId] ?? 'unknown'}
                      onChange={(event) => {
                        if (!caseId) return;
                        setAnswersByCase((current) => ({
                          ...current,
                          [caseId]: { ...(current[caseId] ?? {}), [questionId]: event.target.value as OperatorAnswer },
                        }));
                      }}
                    >
                      <option value="unknown">Non so</option>
                      <option value="yes">Sì, verificato</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  )
                })}
              </div>
            )}

            {hasLegacyAnswers && (
              <p className="mt-2 text-xs text-amber-800" role="status">Alcune risposte salvate in precedenza riguardavano domande sostituite e non sono state trasferite: rispondi alle nuove domande.</p>
            )}
            {answerConflicts.map((conflict) => (
              <p key={conflict.causeIds.join('+')} className="mt-2 text-xs text-amber-800" role="status">{conflict.message} Se riguardano lo stesso segno, controllo discriminante: {conflict.discriminatingCheck}</p>
            ))}

            {catalogEntry.probableCauses.length === 0 && (
              <p className="mt-2 text-xs text-amber-800">Scheda incompleta: le risposte vengono registrate, ma non producono cause o azioni tecniche non verificate.</p>
            )}

            <div className="mt-4 border-t border-gray-200 pt-3">
              <button
                type="button"
                className={`w-full rounded px-3 py-2 text-sm font-semibold ${placementMode ? 'bg-amber-500 text-black' : 'bg-slate-900 text-white'} disabled:opacity-50`}
                disabled={!drawingId || conversionStatus !== 'ready' || !viewerUrl}
                aria-pressed={placementMode}
                onClick={() => setPlacementMode((active) => !active)}
              >
                {placementMode ? 'Annulla posizionamento' : 'Segna difetto'}
              </button>
              {placementMode && <p className="mt-2 text-xs text-amber-900">Tocca la superficie del pezzo. Trascinare ruota il modello; un tocco fuori dalla mesh non crea pin.</p>}
              {activeMeshPins.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {activeMeshPins.map((pin, index) => (
                    <li key={pin.id} className="flex items-center gap-2">
                      <button type="button" className={`min-w-0 flex-1 rounded border px-2 py-2 text-left text-xs ${selectedMeshPin?.id === pin.id ? 'border-blue-700 bg-blue-50' : 'border-gray-300 bg-white'}`} onClick={() => setSelectedMeshPinId(pin.id)}>
                        Pin {index + 1} · gravità {pin.severity} · mesh · model-local ({pin.position.x.toFixed(2)}, {pin.position.y.toFixed(2)}, {pin.position.z.toFixed(2)})
                      </button>
                      <button type="button" className="rounded border border-gray-300 px-2 py-2 text-xs" aria-label={`Rimuovi pin ${index + 1}`} onClick={() => {
                        removeMeshPin(pin.id);
                        if (selectedMeshPinId === pin.id) setSelectedMeshPinId(null);
                      }}>Rimuovi</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Viewer 3D */}
      <div className="min-h-[300px] w-full flex-1 p-4 flex items-center justify-center lg:min-h-0">
        {viewerUrl ? (
          <ThreeViewer
            viewerUrl={viewerUrl}
            meshPins={activeMeshPins}
            placementMode={placementMode}
            onPlacePin={placeMeshPin}
          />
        ) : conversionStatus === 'converting' ? (
          <div className="text-center bg-blue-50 border border-blue-300 rounded-lg p-6">
            <div className="mb-3 text-blue-600 font-semibold">⏳ Conversione in corso...</div>
            <div className="text-blue-700 text-sm">{conversionMessage || 'Conversione GLB non ancora disponibile.'}</div>
          </div>
        ) : conversionStatus === 'error' ? (
          <div className="text-center bg-red-50 border border-red-300 rounded-lg p-6">
            <div className="mb-3 text-red-600 font-semibold">❌ Errore</div>
            <div className="text-red-700 text-sm">{conversionMessage || 'Errore durante la conversione del modello.'}</div>
          </div>
        ) : (
          <div className="text-gray-500">Carica un disegno per visualizzare il modello.</div>
        )}
      </div>

      {/* Pannello Parametri (read-only) */}
      <div className="w-full overflow-y-auto border-t border-gray-300 p-4 bg-gray-50 flex-shrink-0 lg:w-80 lg:border-t-0 lg:border-l">
        <h2 className="font-bold text-lg mb-3">Parametri</h2>

        {/* visualizza ultima correzione applicata */}
        {lastDefectFix && (
          <div className="mt-2 mb-3 rounded-md border border-slate-700 bg-slate-950 p-3">
            <div className="text-xs text-slate-300">
              Correzione: <span className="font-semibold">{lastDefectFix.defectId}</span> / {lastDefectFix.severity}
            </div>
            <ul className="mt-2 list-disc pl-5 text-xs text-slate-200">
              {lastDefectFix.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        {loading && <div className="text-blue-600">Calcolo in corso…</div>}
        {error && <div className="text-red-600">{String(error)}</div>}

        {!loading && result && (
          <div className="text-sm space-y-2">
            <div>
              <strong>Iniezione:</strong>
              <br />
              Portata iniezione: {result.injectionFlowCm3s ?? "--"} cm³/s
              <br />
              Velocità vite: {result.screwVelocityMmPerS ?? "--"} mm/s
              <br />
              Pressione: {result.pressureBar ?? "--"} bar
            </div>

            <div>
              <strong>Commutazione:</strong>
              <br />
              VP: {result.switchoverMs ?? "--"} ms
            </div>

            <div>
              <strong>Tempi:</strong>
              <br />
              Iniezione: {result.times?.injectionMs ?? "--"} ms
              <br />
              Raffreddamento: {result.times?.coolingMs ?? "--"} ms
            </div>

            <div>
              <strong>Tonnellaggio:</strong>
              <br />
              Richiesto: {result.tonnellaggioRequired ?? "--"} kN
            </div>
          </div>
        )}

        {knowledgeResult && (knowledgeResult.diagnosis.length > 0 || knowledgeResult.recommendations.length > 0) && (
          <div className="mt-4 border-t border-gray-200 pt-3 text-sm">
            <strong>Cause probabili e verifiche</strong>
            {knowledgeResult.diagnosis.filter((item) => item.id.startsWith('catalog-status:')).map((item) => (
              <div key={item.id} className="mt-2 border-l-2 border-amber-500 pl-2 text-xs text-amber-900">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            ))}
            {knowledgeResult.diagnosis.filter((item) => item.id.startsWith('defect-cause:')).map((item) => (
              <div key={item.id} className="mt-3 border-t border-gray-200 pt-2">
                <div className="font-medium">{item.title}</div>
                <div className="mt-1 text-xs text-gray-600">{item.description}</div>
                <div className="mt-1 text-[11px] text-gray-500">{String(item.metadata?.provenance ?? 'stimata')} · {item.source} · {String(item.metadata?.sourceReference ?? '')}</div>
                <div className="mt-1 text-sm text-gray-700">{knowledgeResult.recommendations.find((recommendation) => recommendation.id === item.id.replace('defect-cause:', 'defect-action:'))?.reason}</div>
              </div>
            ))}
          </div>
        )}

        {selectedDefectId && !selectedMeshPin && (
          <div className="mt-4 border-t border-gray-200 pt-3 text-sm text-amber-800">Segna il difetto sulla mesh per avviare una diagnosi associata alla posizione reale.</div>
        )}

        {selectedDefectId && caseId && selectedMeshPin && (
          <section className="mt-4 border-t border-gray-200 pt-3 text-sm" aria-label="Valutazione dopo prova">
            <strong>Valutazione dopo prova</strong>
            <p className="mt-1 text-xs text-gray-600">Caso locale: {selectedLabel} · {drawingId} · pin {selectedMeshPin.id}. Gravità segnalata {selectedMeshPin.severity}. Registrazione locale; non è apprendimento automatico.</p>
            <label className="mt-3 block text-xs font-medium">
              Gravità dopo l’intervento
              <select aria-label="Gravità dopo l’intervento" className="mt-1 w-full rounded border border-gray-400 bg-white px-2 py-1" value={severityAfter} onChange={(event) => setSeverityAfter(event.target.value)}>
                <option value="0">0 · Assente / risolto</option>
                <option value="1">1 · Lieve</option>
                <option value="2">2 · Medio</option>
                <option value="3">3 · Grave</option>
              </select>
            </label>
            <label className="mt-2 block text-xs font-medium">
              Intervento effettivamente provato
              <textarea aria-label="Intervento effettivamente provato" className="mt-1 w-full rounded border border-gray-400 bg-white p-2" rows={3} value={interventionTried} onChange={(event) => setInterventionTried(event.target.value)} placeholder="Descrivi cosa è stato provato" />
            </label>
            <button type="button" className="mt-2 rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={!drawingId || !selectedMeshPin || interventionTried.trim().length < 3} onClick={saveEvaluation}>
              Registra valutazione
            </button>
            {currentCase && currentCase.evaluations.length > 0 && (
              <ol className="mt-3 space-y-2 text-xs text-gray-700">
                {currentCase.evaluations.map((evaluation) => (
                  <li key={evaluation.id} className="border-t border-gray-200 pt-2">
                    Gravità {evaluation.severityBefore} → {evaluation.severityAfter}: {evaluation.interventionTried}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {!loading && !result && (
          <div className="text-gray-500 text-sm">I parametri verranno mostrati quando il wizard avrà completato il calcolo.</div>
        )}
      </div>
    </div>
  );
}
