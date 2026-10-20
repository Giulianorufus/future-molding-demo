import type { DefectId } from './defectRules'

export type DefectEvidenceStatus = 'verified-in-scope' | 'partial' | 'unverified'
export type DefectAutomationStatus = 'proposed' | 'manual' | 'disabled'
export type DefectActionDomain = 'process' | 'material' | 'mold'

export interface CatalogCauseAction {
  id: string
  title: string
  description: string
  questionId: string
  question: string
  action: string
  domain: DefectActionDomain
  order: number
  source: string
  sourceReference: string
  evidenceStatus: 'verified-in-scope'
}

export interface DiagnosticQuestion {
  id: string
  text: string
  causeId: string | null
}

export interface DefectCatalogEntry {
  id: string
  legacyIds: readonly string[]
  nameIt: string
  synonymsIt: readonly string[]
  semanticCautions?: readonly string[]
  description: string
  symptoms: readonly string[]
  severityCriteria: { 1: string; 2: string; 3: string }
  diagnosticQuestions: readonly DiagnosticQuestion[]
  probableCauses: readonly CatalogCauseAction[]
  orderedActions: readonly CatalogCauseAction[]
  sources: readonly { publisher: string; title: string; reference: string; supports: string; limit: string }[]
  verificationStatus: DefectEvidenceStatus
  automationStatus: DefectAutomationStatus
  correctionId: DefectId | null
  distinctPhenomena?: readonly { causeIds: readonly string[]; discriminatingCheck: string }[]
}

const BASF = 'BASF, Injection-Molding Problems in Engineering Thermoplastics'
const genericSeverity = {
  1: 'Lieve: sporadico o solo estetico, senza effetto funzionale osservato.',
  2: 'Medio: ricorrente o con effetto funzionale limitato; misurare e registrare il pezzo.',
  3: 'Grave: pezzo non conforme/funzionalmente compromesso o rischio di processo; contenere e verificare prima di riprendere.',
} as const

// Gli ID sono scritti a mano nel catalogo: non derivano dalla posizione e restano stabili se l'elenco cambia.
export function pendingQuestions(entryId: string, questions: readonly { id: string; text: string }[]): DiagnosticQuestion[] {
  return questions.map((question) => ({ id: `${entryId}.${question.id}`, text: question.text, causeId: null }))
}

function pending(input: {
  id: string
  legacyIds?: string[]
  nameIt: string
  synonymsIt?: string[]
  semanticCautions?: string[]
  description: string
  symptoms: string[]
  diagnosticQuestions: { id: string; text: string }[]
  verificationStatus?: 'partial' | 'unverified'
  sources?: DefectCatalogEntry['sources']
}): DefectCatalogEntry {
  return {
    ...input,
    diagnosticQuestions: pendingQuestions(input.id, input.diagnosticQuestions),
    legacyIds: input.legacyIds ?? [],
    synonymsIt: input.synonymsIt ?? [],
    semanticCautions: input.semanticCautions,
    severityCriteria: genericSeverity,
    probableCauses: [],
    orderedActions: [],
    sources: input.sources ?? [],
    verificationStatus: input.verificationStatus ?? 'unverified',
    automationStatus: 'disabled',
    correctionId: null,
  }
}

function verifiedCause(input: Omit<CatalogCauseAction, 'evidenceStatus'>): CatalogCauseAction {
  return { ...input, evidenceStatus: 'verified-in-scope' }
}

function questionsForCauses(causes: readonly CatalogCauseAction[]): DiagnosticQuestion[] {
  return causes.map((cause) => ({ id: cause.questionId, text: cause.question, causeId: cause.id }))
}

const shortShot = [
  verifiedCause({ id: 'dose-cushion', title: 'Dose o cushion insufficienti/instabili', description: 'Cause nominate nella guida BASF; il dato sul singolo ciclo va verificato.', questionId: 'dose-cushion', question: 'Dose e cushion risultano insufficienti o instabili?', action: 'Misura dose e cushion e verifica la valvola di non ritorno prima di cambiare il profilo.', domain: 'process', order: 1, source: BASF, sourceReference: '§22, PDF/stampata p. 60' }),
  verifiedCause({ id: 'low-injection-speed', title: 'Velocità d’iniezione insufficiente', description: 'La guida indica di aumentare la velocità soltanto se è bassa.', questionId: 'injection-speed-too-low', question: 'Una misura o il confronto con il processo di riferimento indica che la velocità d’iniezione è troppo bassa?', action: 'Aumenta la velocità solo se la misura/profilo conferma che è insufficiente e la pressa resta nei limiti.', domain: 'process', order: 2, source: BASF, sourceReference: '§22, PDF/stampata p. 60' }),
  verifiedCause({ id: 'flow-restriction', title: 'Perdita di pressione in gate/canali o sezione sottile', description: 'Cause di geometria e perdita di pressione riportate dalla fonte; non dedotte dal pin.', questionId: 'flow-restriction', question: 'È stata osservata una restrizione in gate/canali o una sezione sottile sul percorso?', action: 'Verifica gate, canali e perdita di pressione; modifica le sezioni solo dopo aver confermato la restrizione.', domain: 'mold', order: 3, source: BASF, sourceReference: '§22, PDF/stampata p. 60' }),
  verifiedCause({ id: 'low-melt-or-mold-temperature', title: 'Temperatura melt o stampo troppo bassa', description: 'BASF indica melt e/o stampo troppo freddi tra le cause; serve il confronto con la finestra del grade.', questionId: 'low-melt-or-mold-temperature', question: 'La temperatura melt o stampo misurata è inferiore alla finestra indicata per il grade?', action: 'Se confermata, valuta di aumentare prima la temperatura melt (riduce la pressione di riempimento) e solo dopo lo stampo, che può allungare il ciclo; resta nella finestra del grade e verifica l’effetto sul riempimento.', domain: 'process', order: 4, source: BASF, sourceReference: '§22, PDF/stampata p. 60' }),
  verifiedCause({ id: 'inadequate-venting', title: 'Venting insufficiente', description: 'La fonte nomina il venting; l’effettiva condizione dello stampo deve essere ispezionata.', questionId: 'inadequate-venting', question: 'Sono stati osservati sfiati ostruiti o insufficienti?', action: 'Ispeziona e pulisci gli sfiati; dimensionamento e modifiche vanno verificati con il costruttore stampo.', domain: 'mold', order: 5, source: BASF, sourceReference: '§22, PDF/stampata p. 60' }),
]
const burn = [
  verifiedCause({ id: 'compressed-air', title: 'Aria compressa intrappolata (effetto diesel)', description: 'Compatibile con annerimento localizzato a fine riempimento o presso fronti confluenti; la causa non è provata dal pin.', questionId: 'diesel-localized-black-mark', question: 'La macchia è nera e localizzata (fine riempimento, nervature o fronti confluenti), senza striature marroni o argentee estese o attorno al gate?', action: 'Controlla la via di fuga dell’aria e gli sfiati; riduci la velocità solo se risulta eccessiva.', domain: 'process', order: 1, source: BASF, sourceReference: '§3, PDF pp. 10–11 / stampate 10–11' }),
  verifiedCause({ id: 'blocked-venting', title: 'Sfiati ostruiti o non efficaci', description: 'La guida cita sfiati ostruiti come possibile causa; richiede verifica del tool.', questionId: 'venting-obstruction', question: 'Sono stati osservati sfiati ostruiti o una via di fuga dell’aria insufficiente?', action: 'Pulisci e fai verificare gli sfiati e i canali di evacuazione dell’aria.', domain: 'mold', order: 2, source: BASF, sourceReference: '§3, PDF pp. 10–11 / stampate 10–11' }),
  verifiedCause({ id: 'parting-line-air-release', title: 'Escape dell’aria impedito vicino al piano di divisione', description: 'Applicabile solo se posizione ed escape sono verificati dall’operatore.', questionId: 'parting-line-trap', question: 'Il burn è vicino al piano di divisione e l’aria non può uscire da lì?', action: 'Fai verificare l’escape dell’aria; ridurre il clamp è citato solo per questo caso e nei limiti macchina/stampo.', domain: 'mold', order: 3, source: BASF, sourceReference: '§3, PDF pp. 10–11 / stampate 10–11' }),
  verifiedCause({ id: 'thermal-degradation', title: 'Degradazione termica del melt (burning streaks, fenomeno distinto dal diesel)', description: 'BASF §18: striature da marrone chiaro a molto scuro indicano danno termico per ossidazione/degradazione; non è aria compressa.', questionId: 'thermal-degradation-evidence', question: 'Le tracce sono striature da marrone chiaro a molto scuro (non una macchia nera locale) e temperatura melt o permanenza risultano fuori finestra per il grade o c’è stato un fermo macchina?', action: 'Misura la temperatura melt rispetto alla finestra del grade, verifica fermi macchina e permanenza in cilindro/hot runner; non applicare i rimedi dell’effetto diesel.', domain: 'material', order: 4, source: BASF, sourceReference: '§18, PDF/stampata p. 52; distinto da §3' }),
  verifiedCause({ id: 'high-shear-streaks', title: 'Striature da shear/attrito elevato (fenomeno distinto dal diesel)', description: 'BASF §18: le striature argentee derivano di norma da attrito localizzato in sezioni di flusso piccole o attorno a ostacoli.', questionId: 'shear-streaks', question: 'Le striature sono argentee e limitate a punti con sezione di flusso ridotta (gate, sprue, hot runner) o attorno a ostacoli?', action: 'Controlla le sezioni di gate, sprue e hot runner e ottimizza velocità/profilo; non applicare i rimedi dell’effetto diesel.', domain: 'mold', order: 5, source: BASF, sourceReference: '§18, PDF/stampata p. 52; distinto da §3' }),
]
const flash = [
  verifiedCause({ id: 'parting-gap-or-damage', title: 'Gap, fit o superficie di tenuta da verificare', description: 'La guida elenca fit e superfici; serve ispezione effettiva.', questionId: 'parting-gap-found', question: 'È stato riscontrato un gap anomalo, un fit fuori tolleranza o una superficie di tenuta danneggiata?', action: 'Fai ripristinare fit e superfici; non compensare un danno aumentando automaticamente il clamp.', domain: 'mold', order: 1, source: BASF, sourceReference: '§9, PDF/stampata p. 28' }),
  verifiedCause({ id: 'high-cavity-pressure', title: 'Pressione cavità elevata durante filling/holding', description: 'Causa distinta che richiede misura o dato processo; non si deduce dalla localizzazione.', questionId: 'high-cavity-pressure', question: 'Una misura o un dato macchina indica pressione cavità elevata?', action: 'Se la pressione elevata è confermata, valuta V/P anticipato e riduzione velocità a fine riempimento.', domain: 'process', order: 2, source: BASF, sourceReference: '§9, PDF/stampata p. 28' }),
  verifiedCause({ id: 'low-melt-viscosity', title: 'Viscosità melt ridotta o degradazione', description: 'Richiede confronto con la finestra del grado e i dati reali di processo.', questionId: 'melt-condition', question: 'Temperatura, permanenza o umidità risultano fuori finestra per il grade?', action: 'Verifica temperatura, permanenza e condizionamento secondo scheda grade; modifica solo la variabile fuori finestra.', domain: 'material', order: 3, source: BASF, sourceReference: '§9, PDF/stampata p. 28' }),
  verifiedCause({ id: 'mold-deflection', title: 'Stampo che flette sotto la pressione di riempimento', description: 'BASF §9 elenca la deformazione dello stampo; richiede evidenza sullo stampo, non si deduce dal pin.', questionId: 'mold-deflection', question: 'È stata riscontrata flessione o apertura dello stampo sotto pressione di riempimento?', action: 'Fai valutare la rigidità dello stampo; interventi costruttivi solo con il costruttore stampo.', domain: 'mold', order: 4, source: BASF, sourceReference: '§9, PDF/stampata p. 28' }),
  verifiedCause({ id: 'insufficient-clamp', title: 'Forza di chiusura insufficiente', description: 'Non assumere insufficienza senza confronto con limiti pressa e tool.', questionId: 'clamp-insufficient', question: 'Il controllo ha confermato clamp insufficiente rispetto ai limiti macchina?', action: 'Verifica dimensionamento e limiti macchina; intervieni sul clamp solo se insufficiente e autorizzato.', domain: 'process', order: 5, source: BASF, sourceReference: '§9, PDF/stampata p. 28' }),
]
const sink = [
  verifiedCause({ id: 'thick-section-shrinkage', title: 'Accumulo locale di spessore e ritiro', description: 'BASF associa sink a sezioni spesse/nervature; il pin non certifica la geometria.', questionId: 'thick-section', question: 'L’affossamento è presso una sezione spessa, nervatura o cambio di spessore osservato?', action: 'Verifica geometria locale e gating; interventi geometrici richiedono revisione pezzo/stampo.', domain: 'mold', order: 1, source: BASF, sourceReference: '§5, PDF/stampata p. 14; figure PDF pp. 15–17' }),
  verifiedCause({ id: 'insufficient-holding', title: 'Holding più breve del gate-open (possibile compensazione insufficiente)', description: 'Un Sì conferma solo la condizione misurata; non dimostra che sia la causa dell’affossamento, che può dipendere anche da geometria, cushion o perdite di pressione.', questionId: 'holding-shorter-than-gate-open', question: 'La misura di peso o pressione cavità indica che la holding termina prima del gate-open?', action: 'Registra la condizione e valuta se allungare o aumentare la holding restando nei limiti pressione; poi verifica se l’affossamento cambia e, se non cambia, indaga le altre cause (geometria, cushion, perdite di pressione) senza dare per dimostrata questa.', domain: 'process', order: 2, source: BASF, sourceReference: '§5, PDF/stampata p. 14' }),
  verifiedCause({ id: 'post-ejection-hot-core', title: 'Comparsa o peggioramento dopo l’estrazione (possibile calore residuo del centro)', description: 'BASF descrive sink che compaiono dopo l’espulsione; un Sì conferma solo la tempistica, il calore residuo resta ipotesi.', questionId: 'after-ejection', question: 'Il segno compare o peggiora solo dopo l’estrazione?', action: 'Confronta aspetto prima/dopo estrazione e verifica raffreddamento della zona.', domain: 'process', order: 3, source: BASF, sourceReference: '§5, PDF/stampata p. 14' }),
]

const partialSources = {
  tpu: { publisher: 'Covestro', title: 'Tips for Defect-Free Injection Molding of TPU', reference: 'PDF p. 3 / stampate pp. 4–5', supports: 'Indice e categorie difetto nel TPU', limit: 'TPU only; non trasferire a PP/ABS/PC/PA6/PA66' },
  process: { publisher: 'Covestro', title: 'Processing of TPU by Injection Molding', reference: '§3.2.3 PDF/stampata p. 14', supports: 'Burn/venting nel TPU', limit: 'TPU only; non trasferire ai materiali target' },
  hotRunner: { publisher: 'Mold-Masters', title: 'Hot Runner Troubleshooting Guide', reference: '§1.6.4 PDF p. 12; §1.6.8 PDF p. 16', supports: 'Troubleshooting di sistema hot-runner', limit: 'Resina non specificata; non generalizzare a qualsiasi macchina/materiale' },
} as const

export const DEFECT_CATALOG: readonly DefectCatalogEntry[] = [
  {
    id: 'short_shot', legacyIds: ['short-shot', 'SHORT_SHOT', 'short shot', 'Incompletezza', 'Cicca / Incompleto', 'cicca_incompleto', 'Riempimento incompleto', 'Mancanza', 'pezzi mancanti'], nameIt: 'Mancato riempimento / Short Shot', synonymsIt: ['Cicca', 'Incompletezza'], description: 'Cavità o estremità del pezzo non completamente riempita.', symptoms: ['Estremità o zone della cavità incomplete', 'Difetto ripetibile o variabile per cavità'], severityCriteria: genericSeverity, diagnosticQuestions: questionsForCauses(shortShot), probableCauses: shortShot, orderedActions: shortShot, sources: [{ publisher: 'BASF', title: 'Injection-Molding Problems in Engineering Thermoplastics', reference: '§22 PDF/stampata p. 60', supports: 'Cause e rimedi condizionali letti integralmente', limit: 'Scope generale engineering thermoplastics; grade-specific non validato, PA6/PA66 soltanto famiglie in legenda' }], verificationStatus: 'partial', automationStatus: 'proposed', correctionId: 'short_shot',
  },
  {
    id: 'burn_mark', legacyIds: ['burn-mark', 'burn_mark', 'burn', 'burn marks', 'bruciature', 'bruciatura', 'diesel', 'segni di bruciatura'], nameIt: 'Bruciature / Effetto diesel', synonymsIt: ['Burn Mark', 'Burn marks'], semanticCautions: ['Effetto diesel da aria compressa e burning streaks da degradazione/shear sono fenomeni distinti; non assimilare a materiale_degradato.'], description: 'Macchia scura; distinguere aria compressa (diesel effect) da degradazione termica/shear (burning streaks).', symptoms: ['Annerimento localizzato, spesso a fine flusso/fronti confluenti', 'Striature da marrone chiaro a molto scuro o argentee, anche attorno al gate: degradazione o shear, fenomeno distinto'], severityCriteria: genericSeverity, diagnosticQuestions: questionsForCauses(burn), probableCauses: burn, orderedActions: burn, sources: [{ publisher: 'BASF', title: 'Injection-Molding Problems in Engineering Thermoplastics', reference: '§3 PDF pp. 10–11 / stampate 10–11; §18 PDF/stampata p. 52', supports: 'Diesel effect e burning streaks distinti', limit: 'Scope generale; grade-specific da validare, PP/ABS/PC non in legenda' }, partialSources.process], verificationStatus: 'partial', automationStatus: 'proposed', correctionId: 'burn_mark',
    distinctPhenomena: [{ causeIds: ['compressed-air', 'thermal-degradation', 'high-shear-streaks'], discriminatingCheck: 'Ispeziona il segno: nero e localizzato a fine flusso, nervature o fronti confluenti (diesel, BASF §3) oppure striature marroni/scure o argentee anche attorno al gate o in sezioni di flusso ridotte (degradazione o shear, BASF §18). Se coesistono, segna un pin separato per ciascun fenomeno.' }],
  },
  {
    id: 'flash', legacyIds: ['bave', 'bava', 'BAVE', 'sbavatura', 'sormonto', 'fuga materiale', 'parting-line flash'], nameIt: 'Bave / Flash', synonymsIt: ['Bava', 'Sormonto', 'Flash'], semanticCautions: ['giunzione_stamp/mold mismatch è guasto attrezzatura correlato, non sinonimo di flash.'], description: 'Film o eccesso di materiale oltre il piano di chiusura o altre giunzioni.', symptoms: ['Bava al parting line, espulsori o inserti', 'Distribuzione uniforme o localizzata da osservare'], severityCriteria: genericSeverity, diagnosticQuestions: questionsForCauses(flash), probableCauses: flash, orderedActions: flash, sources: [{ publisher: 'BASF', title: 'Injection-Molding Problems in Engineering Thermoplastics', reference: '§9 PDF/stampata p. 28', supports: 'Cause distinte e rimedi condizionati', limit: 'Scope generale; grade-specific da validare, non convalida percentuali software' }, partialSources.hotRunner], verificationStatus: 'partial', automationStatus: 'proposed', correctionId: 'flash',
  },
  {
    id: 'sink', legacyIds: ['sink-mark', 'sink_mark', 'sink_marks', 'ritiro', 'RITIRO', 'affossamento', "segni d'affondamento"], nameIt: 'Affossamenti / Sink marks', synonymsIt: ['Sink', 'Segni di ritiro'], semanticCautions: ['Vuoti/bolle/porosità interni sono schede correlate ma distinte; una depressione superficiale non dimostra una cavità interna.'], description: 'Depressione superficiale da distinguere da vuoto interno e peso fuori specifica.', symptoms: ['Depressione vicino a nervature/sezioni spesse', 'Comparsa immediata o post-ejection da registrare'], severityCriteria: genericSeverity, diagnosticQuestions: questionsForCauses(sink), probableCauses: sink, orderedActions: sink, sources: [{ publisher: 'BASF', title: 'Injection-Molding Problems in Engineering Thermoplastics', reference: '§5 PDF/stampata p. 14; figure PDF pp. 15–17', supports: 'Ritiro locale, holding e casi geometrici', limit: 'Esempi Ultramid rinforzato, non tutti i grade; niente delta pack universale' }], verificationStatus: 'partial', automationStatus: 'manual', correctionId: null,
  },
  pending({ id: 'warpage', legacyIds: ['deformazione', 'deformazioni', 'deformation', 'DEFORMAZIONE', 'imbarcamento', 'imbarcamento centrale'], nameIt: 'Imbarcamento / Warpage', synonymsIt: ['Deformazione'], description: 'Deviazione della forma o dimensione dopo espulsione/condizionamento.', symptoms: ['Deviazione dimensionale misurabile', 'Differenze tra lati o cavità'], diagnosticQuestions: [{ id: 'deviation-measured', text: 'Quale quota/direzione devia e quando è stata misurata?' }, { id: 'side-cavity-difference', text: 'È stata verificata differenza tra lati o cavità?' }], verificationStatus: 'partial', sources: [partialSources.tpu] }),
  pending({ id: 'weld_line', legacyIds: ['linea_giunzione', 'linea di giunzione', 'linea di saldatura', 'weld line', 'linea di giunzione debole'], nameIt: 'Linea di giunzione / Weld line', description: 'Segno o discontinuità dove si incontrano fronti di flusso; distinguere esito estetico e resistenza.', symptoms: ['Linea tra due fronti', 'Eventuale debolezza meccanica da prova separata'], diagnosticQuestions: [{ id: 'strength-measured', text: 'È solo estetica o la resistenza è stata misurata?' }, { id: 'location-vs-gate', text: 'Dove si trova rispetto a gate e ostacoli?' }], semanticCautions: ['Non confondere con giunzione_stamp/mold mismatch, guasto di accoppiamento dello stampo.'] }),
  pending({ id: 'flow_marks', legacyIds: ['linea_flusso', 'linee di flusso', 'flow lines', 'flow marks', 'flowline', 'striature di flusso'], nameIt: 'Linee di flusso / Flow marks', description: 'Bande o differenze superficiali associate al percorso del fronte.', symptoms: ['Bande o variazione di lucentezza lungo il flusso'], diagnosticQuestions: [{ id: 'follows-gate-or-section', text: 'Seguono gate o cambi sezione?' }, { id: 'distinct-from-weld-jetting-splay', text: 'Sono distinte da weld line, jetting e splay?' }] }),
  pending({ id: 'jetting', legacyIds: ['getto', 'serpentina', 'jetting'], nameIt: 'Jetting', description: 'Traccia sinuosa da verificare come possibile getto libero originato al gate.', symptoms: ['Traccia sinuosa presso gate'], diagnosticQuestions: [{ id: 'starts-at-gate', text: 'La traccia nasce al gate?' }, { id: 'first-fill-phase-only', text: 'È limitata alla prima fase di riempimento?' }] }),
  pending({ id: 'splay', legacyIds: ['striature', 'striature argentate', 'striature da umidità', 'silver streaks'], nameIt: 'Striature argentate / Splay', synonymsIt: ['Splay'], description: 'Striature superficiali da distinguere per causa prima di intervenire.', symptoms: ['Filamenti argentati nella direzione del flusso'], diagnosticQuestions: [{ id: 'persists-after-documented-drying', text: 'Persistono dopo essiccazione documentata?' }, { id: 'all-cavities-or-single-point', text: 'Coinvolgono tutte le cavità o un punto?' }] }),
  pending({ id: 'voids', legacyIds: ['voids', 'bolle_aria', 'bolle', 'vuoti', 'porosità', 'poros'], nameIt: 'Vuoti, bolle e porosità', description: 'Cavità interne o bolle; mantenere distinto da sink superficiale.', symptoms: ['Vuoto interno o bolla superficiale'], diagnosticQuestions: [{ id: 'internal-or-surface', text: 'È una cavità interna o una bolla superficiale?' }, { id: 'thick-center-or-gate', text: 'È al centro di una sezione spessa o presso gate?' }] }),
  pending({ id: 'air_trap', legacyIds: ['sfiato', 'sfiati', 'air trap', 'linee aria', 'soffiature', 'aria intrappolata'], nameIt: 'Intrappolamento aria / Sfiato', description: 'Possibile condizione da correlare con burn/short shot, non sinonimo automatico.', symptoms: ['Difetto in fine riempimento o zona chiusa'], diagnosticQuestions: [{ id: 'vent-obstruction-observed', text: 'È stato osservato uno sfiato ostruito?' }, { id: 'air-pocket-verified', text: 'Il difetto coincide con una tasca d’aria verificata?' }], verificationStatus: 'partial', sources: [partialSources.process] }),
  pending({ id: 'contamination', legacyIds: ['inclusioni', 'inclusione', 'contaminazione', 'contaminazioni', 'particelle estranee'], nameIt: 'Contaminazione / Inclusioni', description: 'Particelle o materiale estraneo da distinguere da degradazione e difetto cromatico.', symptoms: ['Particella visibile o variazione cromatica locale'], diagnosticQuestions: [{ id: 'particle-identified', text: 'È stata identificata una particella?' }, { id: 'recurs-with-lot-or-machine', text: 'Ricorre con lotto, tramoggia o macchina?' }] }),
  pending({ id: 'degradation', legacyIds: ['materiale_degradato', 'materiale degradato', 'materiale bruciato', 'sovrariscaldamento materiale', 'sovrariscaldamento'], nameIt: 'Degradazione / Bruciatura del materiale', description: 'Alterazione del polimero da confermare; non assimilare automaticamente a diesel effect.', symptoms: ['Odore, colore o proprietà alterate'], diagnosticQuestions: [{ id: 'diffuse-or-localized', text: 'È diffusa o localizzata?' }, { id: 'after-stop-or-lot', text: 'Segue un arresto prolungato o un lotto specifico?' }] }),
  pending({ id: 'cold_slug', legacyIds: ['cold_slug', 'cold slug', 'gelo', 'massa fredda visibile'], nameIt: 'Cold slug / Materiale freddo al gate', description: 'Inclusione o segno freddo vicino al gate, da confermare sul pezzo.', symptoms: ['Segno/inclusione in prossimità del gate'], diagnosticQuestions: [{ id: 'near-gate', text: 'Il segno è vicino al gate?' }, { id: 'cold-well-checked', text: 'È stato verificato il pozzetto freddo?' }] }),
  pending({ id: 'surface_finish', legacyIds: ['lucido_opaco', 'difetti_brillantezza', 'superficie_opaca', 'superficie_lucida', 'color defects', 'opacità', 'gloss non uniforme'], nameIt: 'Finitura lucida/opaca e brillantezza', description: 'Gloss o trasferimento di finitura da distinguere da texture e contaminazione.', symptoms: ['Gloss basso/alto o non uniforme'], diagnosticQuestions: [{ id: 'gloss-measured', text: 'È stata misurata la brillantezza?' }, { id: 'texture-or-front-coincidence', text: 'Coincide con texture o variazione di fronte?' }] }),
  pending({ id: 'surface_roughness', legacyIds: ['rugosita', 'rugosità', 'puntinatura', 'PUNTINATURA', 'pori superficiali', 'specks', 'dots'], nameIt: 'Rugosità anomala / Puntinatura', description: 'Difetto superficiale da classificare prima di attribuire una causa.', symptoms: ['Difetto puntuale o distribuito'], diagnosticQuestions: [{ id: 'particle-pore-or-texture', text: 'È particella, poro o texture trasferita?' }, { id: 'varies-between-cavities', text: 'Varia tra cavità?' }] }),
  pending({ id: 'weight_out_of_spec', legacyIds: ['peso_non_conforme', 'peso non conforme', 'massa pezzo alta', 'massa pezzo bassa'], nameIt: 'Peso fuori specifica', description: 'Esito metrologico da legare a massa target e procedura di misura.', symptoms: ['Massa media o dispersione fuori tolleranza dichiarata'], diagnosticQuestions: [{ id: 'target-and-tolerance', text: 'Qual è massa target e tolleranza?' }, { id: 'measurement-conditioning', text: 'Misura dopo quale condizionamento?' }] }),
  pending({ id: 'dimensions_out_of_tolerance', legacyIds: ['tolleranza', 'dimensioni fuori tolleranza', 'variazione dimensionale', 'dimensions out of tolerance'], nameIt: 'Dimensioni fuori tolleranza', description: 'Misura dimensionale non conforme da distinguere da deformazione e condizionamento.', symptoms: ['Quota fuori tolleranza dichiarata'], diagnosticQuestions: [{ id: 'dimension-tolerance-datum', text: 'Quale quota, tolleranza e datum?' }, { id: 'measured-when-conditioning', text: 'Quando e dopo quale condizionamento è stata misurata?' }], verificationStatus: 'partial', sources: [partialSources.tpu] }),
  pending({ id: 'ejection_scuff', legacyIds: ['ejection_scuff', 'graffi in estrazione', 'graffi', 'scuff', 'ejector marks'], nameIt: 'Graffi e difetti di estrazione', description: 'Segni da estrazione da distinguere da adesione e impronte espulsori.', symptoms: ['Segni nella direzione di estrazione', 'Possibile adesione a una faccia'], diagnosticQuestions: [{ id: 'adheres-to-face', text: 'Il pezzo aderisce a una faccia?' }, { id: 'ejector-marks-or-drag', text: 'Ci sono impronte espulsori o segni di scorrimento?' }], verificationStatus: 'partial', sources: [partialSources.tpu] }),
  pending({ id: 'delamination', legacyIds: ['delaminazione', 'delamin', 'delam', 'strati', 'separazione superficiale'], nameIt: 'Delaminazione', description: 'Distacco/scagliatura superficiale; causa non stabilita dai frammenti disponibili.', symptoms: ['Strati o scaglie superficiali separabili'], diagnosticQuestions: [{ id: 'layers-separable', text: 'Gli strati sono separabili o è solo una linea superficiale?' }, { id: 'materials-additives-known', text: 'Sono noti materiali/additivi coinvolti?' }], verificationStatus: 'partial', sources: [partialSources.tpu] }),
  pending({ id: 'drool_stringing', legacyIds: ['colature di materiale', 'colature', 'filamenti', 'drooling', 'drool', 'stringing', 'filamenti nella materozza'], nameIt: 'Colature e filamenti in materozza', description: 'Colatura/filamento da caratterizzare in relazione a ugello, valvola o hot runner.', symptoms: ['Colatura da ugello o filamento tra ugello e materozza'], diagnosticQuestions: [{ id: 'during-decompression-or-opening', text: 'Si verifica durante decompressione o apertura?' }, { id: 'hot-runner-or-standard-nozzle', text: 'È hot runner o ugello standard?' }], verificationStatus: 'partial', sources: [partialSources.hotRunner] }),
  pending({ id: 'fold_marks', legacyIds: ['piegature', 'fold marks', 'pieghe del fronte'], nameIt: 'Piegature / Fold marks', description: 'Fronte ripiegato da distinguere da weld line e sovrapposizione di flusso.', symptoms: ['Fronte ripiegato o linea sovrapposta'], diagnosticQuestions: [{ id: 'distinct-from-weld', text: 'È distinguibile da weld line?' }, { id: 'location-vs-gate', text: 'Dove si trova rispetto a gate e ostacoli?' }] }),
  pending({ id: 'vacuum_adhesion', legacyIds: ['adesione da sottovuoto', 'vacuum adhesion'], nameIt: 'Adesione da sottovuoto', description: 'Adesione a una faccia; il meccanismo di vuoto va verificato, non dedotto.', symptoms: ['Distacco difficile da una faccia specifica'], diagnosticQuestions: [{ id: 'retaining-face', text: 'Quale faccia trattiene il pezzo?' }, { id: 'venting-behind-surface-checked', text: 'È stata verificata ventilazione dietro la superficie?' }] }),
  pending({ id: 'mold_mismatch', legacyIds: ['giunzione_stamp', 'linea di divisione aperta', 'mold mismatch', 'giunzione stampo non chiusa', 'Giunzione stampo non chiusa correttamente'], nameIt: 'Giunzione stampo non chiusa', description: 'Possibile guasto attrezzatura/sicurezza; non comandare automaticamente il clamp.', symptoms: ['Gap visibile, bava localizzata o allarme macchina'], diagnosticQuestions: [{ id: 'gap-parallelism-checked', text: 'È stato verificato un gap o parallelismo?' }, { id: 'press-alarm-or-clamp-limit', text: 'La pressa segnala allarme o clamp fuori limite?' }] }),
]

const normalized = (value: string) => value.trim().toLocaleLowerCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
const aliasIndex = new Map<string, DefectCatalogEntry>()
for (const entry of DEFECT_CATALOG) {
  for (const alias of [entry.id, entry.nameIt, ...entry.legacyIds, ...entry.synonymsIt]) {
    const key = normalized(alias)
    const previous = aliasIndex.get(key)
    if (previous && previous.id !== entry.id) throw new Error(`Duplicate defect alias "${alias}" on ${previous.id} and ${entry.id}`)
    aliasIndex.set(key, entry)
  }
}

export function resolveDefectCatalogEntry(id?: string | null): DefectCatalogEntry | null {
  return id ? aliasIndex.get(normalized(id)) ?? null : null
}

export function findDefectCatalogEntries(query: string): DefectCatalogEntry[] {
  const needle = normalized(query)
  if (!needle) return [...DEFECT_CATALOG]
  return DEFECT_CATALOG.filter((entry) => normalized([entry.nameIt, entry.description, ...entry.synonymsIt, ...entry.legacyIds].join(' ')).includes(needle))
}

export function getVerifiedDefectCauses(id?: string | null): readonly CatalogCauseAction[] {
  return resolveDefectCatalogEntry(id)?.probableCauses ?? []
}

// Domande il cui significato è cambiato: le vecchie risposte non vanno mai riusate per le nuove cause.
export const RETIRED_QUESTION_IDS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  short_shot: { 'low-injection-speed': 'Domanda sostituita: ora chiede se la velocità è troppo bassa, senza i limiti pressa.' },
  burn_mark: {
    'localized-end-fill': 'Domanda sostituita: il diesel richiede ora anche l’assenza di striature estese.',
    'thermal-damage': 'Domanda combinata sostituita da due domande distinte: degradazione termica e shear.',
  },
  flash: { 'tool-fit': 'Domanda sostituita: ora chiede se è stata riscontrata un’anomalia, non se è stato fatto un controllo.' },
  sink: { 'gate-open-measured': 'Domanda sostituita: un “Sì” indicava solo la misura eseguita, non la condizione.' },
}

export interface MigratedAnswers {
  answers: Record<string, 'yes' | 'no' | 'unknown'>
  legacyAnswers: Record<string, 'yes' | 'no' | 'unknown'>
  retiredQuestionIds: string[]
}

// Le risposte per ID pending posizionali sono rimappate alla stessa domanda originale; quelle ritirate non sono trasferite.
export function migrateStoredAnswers(defectId: string, stored: Record<string, 'yes' | 'no' | 'unknown'>): MigratedAnswers {
  const entry = resolveDefectCatalogEntry(defectId)
  const result: MigratedAnswers = { answers: {}, legacyAnswers: {}, retiredQuestionIds: [] }
  if (!entry) return { ...result, legacyAnswers: { ...stored }, retiredQuestionIds: Object.keys(stored) }
  const current = new Set(entry.diagnosticQuestions.map((question) => question.id))
  const pending = entry.probableCauses.length === 0
  for (const [key, value] of Object.entries(stored)) {
    const positional = pending ? /^(?:catalog-question-(\d+)|[a-z_]+-q(\d+))$/.exec(key) : null
    const position = positional ? (positional[1] !== undefined ? Number(positional[1]) : Number(positional[2]) - 1) : -1
    const mapped = entry.diagnosticQuestions[position]?.id
    if (current.has(key)) result.answers[key] = value
    else if (mapped) result.answers[mapped] = value
    else {
      result.legacyAnswers[key] = value
      result.retiredQuestionIds.push(key)
    }
  }
  return result
}
