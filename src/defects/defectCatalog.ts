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
  materialLimit?: string
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

const BASF_SCOPE = 'Scope generale engineering thermoplastics; la legenda p. 70 nomina Ultramid PA6/PA66/PA6/66/PA6/6T e non PP/ABS/PC; nessun valore numerico o percentuale adottato.'

function causeEntry(input: {
  id: string
  legacyIds: string[]
  nameIt: string
  synonymsIt?: string[]
  semanticCautions?: string[]
  description: string
  symptoms: string[]
  contextQuestions: { id: string; text: string }[]
  causes: readonly CatalogCauseAction[]
  sources: DefectCatalogEntry['sources']
  distinctPhenomena?: DefectCatalogEntry['distinctPhenomena']
}): DefectCatalogEntry {
  return {
    id: input.id,
    legacyIds: input.legacyIds,
    nameIt: input.nameIt,
    synonymsIt: input.synonymsIt ?? [],
    semanticCautions: input.semanticCautions,
    description: input.description,
    symptoms: input.symptoms,
    severityCriteria: genericSeverity,
    diagnosticQuestions: [...pendingQuestions(input.id, input.contextQuestions), ...questionsForCauses(input.causes)],
    probableCauses: input.causes,
    orderedActions: input.causes,
    sources: input.sources,
    verificationStatus: 'partial',
    automationStatus: 'disabled',
    correctionId: null,
    distinctPhenomena: input.distinctPhenomena,
  }
}

const warpage = [
  verifiedCause({ id: 'uneven-mold-temperature', title: 'Temperature stampo sfavorevoli tra metà e nuclei', description: 'BASF §23: il ritiro differenziale dipende anche dalle temperature stampo scelte; la fonte non dà valori.', questionId: 'mold-half-temperature-unfavorable', question: 'Le temperature stampo impostate o misurate su metà e nuclei risultano sfavorevoli o non uniformi rispetto al riferimento di processo?', action: 'Valuta temperature diverse tra metà stampo e nuclei mobili, verificando l’effetto sulla deformazione. Nessun valore automatico.', domain: 'process', order: 1, source: BASF, sourceReference: '§23, PDF/stampata p. 62; figura p. 63', materialLimit: 'BASF: soluzione spesso utile solo per termoplastici non rinforzati.' }),
  verifiedCause({ id: 'wall-thickness-differences', title: 'Spessori di parete diversi o salti di spessore', description: 'BASF §23: pressioni di impaccamento e orientamenti diversi nelle zone generano ritiro differenziale; il pin non certifica la geometria.', questionId: 'wall-thickness-variation', question: 'Nella zona deformata il pezzo ha spessori diversi o salti di spessore?', action: 'Valuta con il progettista di ridurre le differenze di sezione: è un intervento di design, non automatico.', domain: 'mold', order: 2, source: BASF, sourceReference: '§23, PDF/stampata p. 62', materialLimit: 'Nessun limite per materiale indicato dalla fonte.' }),
  verifiedCause({ id: 'high-pressure-gradient', title: 'Gradiente di pressione elevato lungo il percorso di flusso', description: 'BASF §23: richiede un dato di processo o di simulazione; non si deduce dal pin.', questionId: 'pressure-gradient-high', question: 'Un dato di processo o di simulazione indica un gradiente di pressione elevato lungo il percorso di flusso?', action: 'Valuta con il costruttore stampo l’iniezione in più punti; la fonte la indica solo per termoplastici non rinforzati. Nessuna modifica automatica.', domain: 'mold', order: 3, source: BASF, sourceReference: '§23, PDF/stampata p. 62', materialLimit: 'BASF: iniezione in più punti consigliata solo per termoplastici non rinforzati.' }),
  verifiedCause({ id: 'demolded-too-hot', title: 'Estrazione a temperatura troppo alta (raffreddamento breve)', description: 'BASF §23: il pezzo si deforma dopo l’estrazione se raffreddamento troppo breve; da verificare anche trattenimento o controsformo.', questionId: 'demolded-too-hot', question: 'Il pezzo viene estratto ancora troppo caldo rispetto al riferimento di processo e la deformazione compare o aumenta dopo l’estrazione?', action: 'Valuta un tempo di raffreddamento più lungo e verifica che il pezzo non sia trattenuto o in controsformo (negative draft).', domain: 'process', order: 4, source: BASF, sourceReference: '§23, PDF/stampata p. 62', materialLimit: 'Nessun limite per materiale indicato dalla fonte; tempo di raffreddamento senza valori.' }),
  verifiedCause({ id: 'warpage-prone-material', title: 'Materiale con forte tendenza alla deformazione', description: 'BASF §23: materiali con minore differenza di ritiro longitudinale/trasversale (es. blend con fase amorfa) deformano meno.', questionId: 'material-warpage-tendency', question: 'La scheda tecnica del grade in uso indica una differenza marcata tra ritiro longitudinale e trasversale?', action: 'Confronta il grade con la sua scheda tecnica; la fonte cita materiali a bassa deformazione come alternativa. La scelta del materiale resta una decisione da validare.', domain: 'material', order: 5, source: BASF, sourceReference: '§23, PDF/stampata p. 62', materialLimit: 'BASF non indica quali grade siano a bassa deformazione tra i materiali dell’app.' }),
  verifiedCause({ id: 'fiber-orientation-variation', title: 'Orientamento delle fibre di vetro variabile tra le zone', description: 'BASF §23: per termoplastici rinforzati, deviazioni del flusso, fine flusso, weld line e gate cambiano l’orientamento.', questionId: 'fiber-orientation-changes', question: 'Il materiale è rinforzato con fibra di vetro e una simulazione o analisi del flusso indica orientamento variabile tra le zone?', action: 'Valuta con simulazione le regole BASF di gating: direzione di flusso uniforme, gate nel senso della lunghezza, niente nervature perpendicolari al flusso, fine flusso in angolo. Modifiche allo stampo non automatiche.', domain: 'mold', order: 6, source: BASF, sourceReference: '§23, PDF/stampata p. 62', materialLimit: 'BASF: solo termoplastici rinforzati con fibra di vetro.' }),
]
const weld = [
  verifiedCause({ id: 'cold-melt-fronts', title: 'Fronti di flusso troppo freddi nella zona di giunzione', description: 'BASF §1: con temperatura e pressione troppo basse la pelle più fredda non aderisce alla parete e forma una tacca; può peggiorare le proprietà meccaniche.', questionId: 'weld-cold-fronts', question: 'Una misura o un dato di processo indica temperatura o pressione troppo basse dove i fronti si incontrano?', action: 'Valuta, una variabile alla volta e verificando l’effetto: temperatura melt, commutazione a holding poco prima del riempimento volumetrico, velocità d’iniezione (solo senza problemi di sfiato nella zona).', domain: 'process', order: 1, source: BASF, sourceReference: '§1, PDF/stampata p. 4', materialLimit: 'BASF: più evidente in parti scure o trasparenti lucide, con fibra di vetro o pigmenti effetto; nessun valore per grade.' }),
  verifiedCause({ id: 'weld-venting', title: 'Sfiati insufficienti o ostruiti nella zona di giunzione', description: 'BASF §1: con problemi di sfiato nella zona la velocità va ridotta e gli sfiati puliti o migliorati.', questionId: 'weld-venting-problem', question: 'Gli sfiati nella zona della weld line risultano ostruiti o insufficienti?', action: 'Pulisci o migliora gli sfiati nella zona; con problemi di sfiato non aumentare la velocità d’iniezione (BASF la indica da ridurre).', domain: 'mold', order: 2, source: BASF, sourceReference: '§1, PDF/stampata p. 4', materialLimit: 'Nessun limite per materiale indicato dalla fonte.' }),
  verifiedCause({ id: 'weld-gate-or-geometry', title: 'Gate o geometria che generano la giunzione', description: 'BASF §1 (figure pp. 5–6): più punti di iniezione, lunghezze di flusso diverse, alimentazione da lati opposti, cambi di spessore e fori; una weld line è spesso inevitabile.', questionId: 'weld-geometry-cause', question: 'La weld line coincide con un foro, più punti di iniezione, alimentazione da lati opposti o un cambio di spessore?', action: 'Spostare la linea richiede modifiche di gate o spessori: la fonte indica prima uno studio moldflow, con il costruttore stampo. Nessuna modifica automatica.', domain: 'mold', order: 3, source: BASF, sourceReference: '§1, PDF/stampata p. 4; figure pp. 5–6', materialLimit: 'Nessun limite per materiale indicato dalla fonte.' }),
]
const jetting = [
  verifiedCause({ id: 'jetting-gate-design', title: 'Posizione o forma del gate non adatte', description: 'BASF §7: il melt a velocità elevata entra in una sezione ampia senza ostacoli e forma un getto che aderisce male al melt successivo.', questionId: 'jetting-gate-design', question: 'Il melt esce dal gate in una cavità libera, senza ostacolo vicino al gate o con transizione gate-pezzo non raccordata?', action: 'Valuta con il costruttore stampo: gate che faccia urtare il melt contro un ostacolo, sezione del gate più grande, raccordo arrotondato gate-pezzo.', domain: 'mold', order: 1, source: BASF, sourceReference: '§7, PDF/stampata p. 22; figure pp. 23–25', materialLimit: 'Nessun limite per materiale indicato dalla fonte.' }),
  verifiedCause({ id: 'jetting-fill-conditions', title: 'Condizioni di riempimento iniziale sfavorevoli', description: 'BASF §7: la fonte cita velocità e temperatura melt, senza valori.', questionId: 'jetting-process-conditions', question: 'Il riempimento iniziale risulta troppo veloce o il melt troppo freddo rispetto al riferimento di processo?', action: 'Valuta di ridurre la velocità d’iniezione e/o aumentare la temperatura melt, verificando l’effetto. Nessuna percentuale o correzione automatica.', domain: 'process', order: 2, source: BASF, sourceReference: '§7, PDF/stampata p. 22', materialLimit: 'Nessun limite per materiale indicato dalla fonte; finestra del grade da verificare.' }),
  verifiedCause({ id: 'jetting-thickness-jump', title: 'Cambi bruschi di spessore lungo il percorso di flusso', description: 'BASF §7: progetto del pezzo non adatto, ad esempio salti di spessore.', questionId: 'jetting-thickness-jump', question: 'Lungo il percorso dopo il gate ci sono cambi bruschi di spessore?', action: 'Valuta con il progettista di evitare i salti di spessore: intervento di design, non automatico.', domain: 'mold', order: 3, source: BASF, sourceReference: '§7, PDF/stampata p. 22', materialLimit: 'Nessun limite per materiale indicato dalla fonte.' }),
]
const splay = [
  verifiedCause({ id: 'residual-moisture', title: 'Umidità residua del granulo', description: 'BASF §16: il vapore forma bolle che scoppiano nel riempimento e restano in superficie; striature paraboliche con la punta nel senso del flusso.', questionId: 'moisture-above-limit', question: 'L’umidità misurata del granulo supera il limite del prodotto o l’essiccatore risulta non funzionante?', action: 'Misura l’umidità, essica sotto il limite indicato per il prodotto e verifica l’essiccatore. Il limite viene dalla scheda del grade, non dall’app.', domain: 'material', order: 1, source: BASF, sourceReference: '§16, PDF/stampata p. 46', materialLimit: 'Il limite di umidità dipende dal prodotto: non indicato dalla fonte per PP, ABS, PC, PA6, PA66.' }),
  verifiedCause({ id: 'mold-water-leak', title: 'Perdita d’acqua del circuito di temperatura nella cavità', description: 'BASF §16: stampo termoregolato ad acqua con perdita nella cavità.', questionId: 'mold-coolant-leak-found', question: 'È stata riscontrata una perdita d’acqua del circuito di temperatura verso la cavità?', action: 'Fai riparare tutte le perdite; la depressione sui regolatori di temperatura è indicata solo come soluzione temporanea.', domain: 'mold', order: 2, source: BASF, sourceReference: '§16, PDF/stampata p. 46', materialLimit: 'Nessun limite per materiale indicato dalla fonte.' }),
  verifiedCause({ id: 'hopper-zone-condensation', title: 'Condensa per zona sotto la tramoggia troppo fredda', description: 'BASF §16: la temperatura nella zona di alimentazione è troppo bassa e si forma condensa.', questionId: 'hopper-zone-too-cold', question: 'La temperatura della zona sotto la tramoggia risulta troppo bassa, con condensa visibile?', action: 'Valuta di aumentare la temperatura del cilindro sotto la tramoggia, entro la finestra del materiale.', domain: 'process', order: 3, source: BASF, sourceReference: '§16, PDF/stampata p. 46', materialLimit: 'Finestra di temperatura del materiale non indicata dalla fonte.' }),
  verifiedCause({ id: 'local-friction', title: 'Attrito localizzato in sezioni di flusso ridotte (striature argentee)', description: 'BASF §18: le striature argentee derivano di norma da attrito localizzato in sezioni ridotte o attorno a ostacoli; distinte dall’umidità (§16).', questionId: 'local-friction-silver-streaks', question: 'Le striature argentee sono limitate a punti con sezione di flusso ridotta o attorno a ostacoli?', action: 'Controlla le sezioni di gate, sprue e hot runner e ottimizza velocità e profilo di iniezione; non applicare i rimedi dell’umidità.', domain: 'mold', order: 4, source: BASF, sourceReference: '§18, PDF/stampata p. 52', materialLimit: 'Nessun limite per materiale indicato dalla fonte.' }),
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
  causeEntry({ id: 'warpage', legacyIds: ['deformazione', 'deformazioni', 'deformation', 'DEFORMAZIONE', 'imbarcamento', 'imbarcamento centrale'], nameIt: 'Imbarcamento / Warpage', synonymsIt: ['Deformazione'], description: 'Il pezzo si discosta dalla forma voluta (torsione, ondulazione, deviazione angolare) per ritiro differenziale tra zone.', symptoms: ['Deviazione dimensionale misurabile', 'Differenze tra lati o cavità'], contextQuestions: [{ id: 'deviation-measured', text: 'Quale quota/direzione devia e quando è stata misurata?' }, { id: 'side-cavity-difference', text: 'È stata verificata differenza tra lati o cavità?' }], causes: warpage, sources: [{ publisher: 'BASF', title: 'Injection-Molding Problems in Engineering Thermoplastics', reference: '§23 PDF/stampata p. 62; figura p. 63', supports: 'Cause e rimedi del warpage: temperature stampo, spessori, gradiente di pressione, raffreddamento, materiale, orientamento fibre', limit: `${BASF_SCOPE} Alcuni rimedi sono indicati solo per non rinforzati o solo per fibra di vetro.` }, partialSources.tpu] }),
  causeEntry({ id: 'weld_line', legacyIds: ['linea_giunzione', 'linea di giunzione', 'linea di saldatura', 'weld line', 'linea di giunzione debole'], nameIt: 'Linea di giunzione / Weld line', description: 'Linea simile a graffio o tacca dove si incontrano due fronti di flusso; distinguere esito estetico e resistenza.', symptoms: ['Linea tra due fronti', 'Eventuale debolezza meccanica da prova separata'], semanticCautions: ['Non confondere con giunzione_stamp/mold mismatch, guasto di accoppiamento dello stampo.', 'Una weld line è spesso inevitabile (BASF §1): la presenza da sola non indica un errore di processo.'], contextQuestions: [{ id: 'strength-measured', text: 'È solo estetica o la resistenza è stata misurata?' }, { id: 'location-vs-gate', text: 'Dove si trova rispetto a gate e ostacoli?' }], causes: weld, sources: [{ publisher: 'BASF', title: 'Injection-Molding Problems in Engineering Thermoplastics', reference: '§1 PDF/stampata p. 4; figure pp. 5–7', supports: 'Descrizione, cause geometriche e rimedi di processo/stampo', limit: `${BASF_SCOPE} Effetto sulla resistenza non quantificato.` }] }),
  pending({ id: 'flow_marks', legacyIds: ['linea_flusso', 'linee di flusso', 'flow lines', 'flow marks', 'flowline', 'striature di flusso'], nameIt: 'Linee di flusso / Flow marks', description: 'Bande o differenze superficiali associate al percorso del fronte.', symptoms: ['Bande o variazione di lucentezza lungo il flusso'], diagnosticQuestions: [{ id: 'follows-gate-or-section', text: 'Seguono gate o cambi sezione?' }, { id: 'distinct-from-weld-jetting-splay', text: 'Sono distinte da weld line, jetting e splay?' }] }),
  causeEntry({ id: 'jetting', legacyIds: ['getto', 'serpentina', 'jetting'], nameIt: 'Jetting', description: 'Traccia sinuosa, spesso ruvida o opaca, che parte dal gate: getto di melt in una cavità libera.', symptoms: ['Traccia sinuosa presso gate', 'Possibile adesione debole al melt successivo e riduzione di resistenza'], contextQuestions: [{ id: 'starts-at-gate', text: 'La traccia nasce al gate?' }, { id: 'first-fill-phase-only', text: 'È limitata alla prima fase di riempimento?' }], causes: jetting, sources: [{ publisher: 'BASF', title: 'Injection-Molding Problems in Engineering Thermoplastics', reference: '§7 PDF/stampata p. 22; figure pp. 23–25', supports: 'Descrizione, cause e rimedi di gate, processo e progetto', limit: `${BASF_SCOPE} Velocità e temperatura senza valori.` }] }),
  causeEntry({ id: 'splay', legacyIds: ['striature', 'striature argentate', 'striature da umidità', 'silver streaks'], nameIt: 'Striature argentate / Splay', synonymsIt: ['Splay'], semanticCautions: ['Striature da umidità (BASF §16) e da attrito localizzato (§18) sono fenomeni distinti; possono coesistere su zone o segni diversi.'], description: 'Striature superficiali argentee: distinguere umidità da attrito localizzato prima di intervenire.', symptoms: ['Filamenti argentati nella direzione del flusso', 'Striature paraboliche con la punta nel senso del flusso (umidità)'], contextQuestions: [{ id: 'persists-after-documented-drying', text: 'Persistono dopo essiccazione documentata?' }, { id: 'all-cavities-or-single-point', text: 'Coinvolgono tutte le cavità o un punto?' }, { id: 'parabolic-streaks-flow-direction', text: 'Le striature sono allungate, paraboliche, con la punta nel senso del flusso?' }], causes: splay, distinctPhenomena: [{ causeIds: ['residual-moisture', 'local-friction'], discriminatingCheck: 'Osserva forma e posizione: striature paraboliche con la punta nel senso del flusso su più zone (umidità, BASF §16) oppure argentee limitate a sezioni di flusso ridotte o a ostacoli (attrito, BASF §18). Se riguardano zone o segni diversi, segna un pin per ciascuno.' }], sources: [{ publisher: 'BASF', title: 'Injection-Molding Problems in Engineering Thermoplastics', reference: '§16 PDF/stampata p. 46; §18 PDF/stampata p. 52', supports: 'Moisture streaks (umidità, perdite stampo, condensa) e silver streaks da attrito', limit: `${BASF_SCOPE} Limiti di umidità dipendono dal prodotto.` }] }),
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

// Mappa storica esplicita e immutabile: ID vecchio (prefisso della scheda) → ID attuale della stessa domanda.
const LEGACY_QUESTION_ID_MAP: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({
  warpage: Object.freeze({ 'warpage-q1': 'warpage.deviation-measured', 'warpage-q2': 'warpage.side-cavity-difference' }),
  weld_line: Object.freeze({ 'weld_line-q1': 'weld_line.strength-measured', 'weld_line-q2': 'weld_line.location-vs-gate' }),
  flow_marks: Object.freeze({ 'flow_marks-q1': 'flow_marks.follows-gate-or-section', 'flow_marks-q2': 'flow_marks.distinct-from-weld-jetting-splay' }),
  jetting: Object.freeze({ 'jetting-q1': 'jetting.starts-at-gate', 'jetting-q2': 'jetting.first-fill-phase-only' }),
  splay: Object.freeze({ 'splay-q1': 'splay.persists-after-documented-drying', 'splay-q2': 'splay.all-cavities-or-single-point' }),
  voids: Object.freeze({ 'voids-q1': 'voids.internal-or-surface', 'voids-q2': 'voids.thick-center-or-gate' }),
  air_trap: Object.freeze({ 'air_trap-q1': 'air_trap.vent-obstruction-observed', 'air_trap-q2': 'air_trap.air-pocket-verified' }),
  contamination: Object.freeze({ 'contamination-q1': 'contamination.particle-identified', 'contamination-q2': 'contamination.recurs-with-lot-or-machine' }),
  degradation: Object.freeze({ 'degradation-q1': 'degradation.diffuse-or-localized', 'degradation-q2': 'degradation.after-stop-or-lot' }),
  cold_slug: Object.freeze({ 'cold_slug-q1': 'cold_slug.near-gate', 'cold_slug-q2': 'cold_slug.cold-well-checked' }),
  surface_finish: Object.freeze({ 'surface_finish-q1': 'surface_finish.gloss-measured', 'surface_finish-q2': 'surface_finish.texture-or-front-coincidence' }),
  surface_roughness: Object.freeze({ 'surface_roughness-q1': 'surface_roughness.particle-pore-or-texture', 'surface_roughness-q2': 'surface_roughness.varies-between-cavities' }),
  weight_out_of_spec: Object.freeze({ 'weight_out_of_spec-q1': 'weight_out_of_spec.target-and-tolerance', 'weight_out_of_spec-q2': 'weight_out_of_spec.measurement-conditioning' }),
  dimensions_out_of_tolerance: Object.freeze({ 'dimensions_out_of_tolerance-q1': 'dimensions_out_of_tolerance.dimension-tolerance-datum', 'dimensions_out_of_tolerance-q2': 'dimensions_out_of_tolerance.measured-when-conditioning' }),
  ejection_scuff: Object.freeze({ 'ejection_scuff-q1': 'ejection_scuff.adheres-to-face', 'ejection_scuff-q2': 'ejection_scuff.ejector-marks-or-drag' }),
  delamination: Object.freeze({ 'delamination-q1': 'delamination.layers-separable', 'delamination-q2': 'delamination.materials-additives-known' }),
  drool_stringing: Object.freeze({ 'drool_stringing-q1': 'drool_stringing.during-decompression-or-opening', 'drool_stringing-q2': 'drool_stringing.hot-runner-or-standard-nozzle' }),
  fold_marks: Object.freeze({ 'fold_marks-q1': 'fold_marks.distinct-from-weld', 'fold_marks-q2': 'fold_marks.location-vs-gate' }),
  vacuum_adhesion: Object.freeze({ 'vacuum_adhesion-q1': 'vacuum_adhesion.retaining-face', 'vacuum_adhesion-q2': 'vacuum_adhesion.venting-behind-surface-checked' }),
  mold_mismatch: Object.freeze({ 'mold_mismatch-q1': 'mold_mismatch.gap-parallelism-checked', 'mold_mismatch-q2': 'mold_mismatch.press-alarm-or-clamp-limit' }),
})

export interface MigratedAnswers {
  answers: Record<string, 'yes' | 'no' | 'unknown'>
  legacyAnswers: Record<string, 'yes' | 'no' | 'unknown'>
  retiredQuestionIds: string[]
}

// Solo la mappa storica esplicita converte i vecchi ID; ogni altro ID non riconosciuto resta in legacyAnswers.
export function migrateStoredAnswers(
  defectId: string,
  stored: Record<string, 'yes' | 'no' | 'unknown'>,
  entry: DefectCatalogEntry | null = resolveDefectCatalogEntry(defectId),
): MigratedAnswers {
  const result: MigratedAnswers = { answers: {}, legacyAnswers: {}, retiredQuestionIds: [] }
  if (!entry) return { ...result, legacyAnswers: { ...stored }, retiredQuestionIds: Object.keys(stored) }
  const current = new Set(entry.diagnosticQuestions.map((question) => question.id))
  const table = LEGACY_QUESTION_ID_MAP[entry.id] ?? {}
  // Le risposte con ID attuale prevalgono su quelle storiche della stessa domanda.
  for (const [key, value] of Object.entries(stored)) if (current.has(key)) result.answers[key] = value
  for (const [key, value] of Object.entries(stored)) {
    if (current.has(key)) continue
    const mapped = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined
    if (mapped && current.has(mapped) && !(mapped in result.answers)) result.answers[mapped] = value
    else {
      result.legacyAnswers[key] = value
      result.retiredQuestionIds.push(key)
    }
  }
  return result
}
