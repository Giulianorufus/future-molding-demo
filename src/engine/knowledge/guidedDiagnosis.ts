import { EXTENDED_DEFECT_GUIDES } from './extendedDefectGuides'

export const DEFECT_CATEGORIES = ['Riempimento', 'Superficie', 'Materiale', 'Ritiro e dimensioni', 'Estrazione', 'Stabilità di processo', 'Punti d’iniezione'] as const
export type DefectCategory = typeof DEFECT_CATEGORIES[number]

/** Qualitative troubleshooting rules. Evidence counts order checks; they are not probabilities.
 * Sources explain mechanisms; the questionnaire and ordering are Future Molding heuristics.
 */
export type DiagnosticAnswers = Readonly<Record<string, string>>
export type DiagnosticQuestion = {
  id: string
  label: string
  options: ReadonlyArray<{ value: string; label: string }>
}
type EvidenceRule = { question: string; values: readonly string[] }
type CauseRule = {
  id: string
  title: string
  explanation: string
  evidence: readonly EvidenceRule[]
  checks: readonly string[]
  target: string
}
export type DefectGuide = {
  id: string
  label: string
  description: string
  category: DefectCategory
  aliases?: readonly string[]
  questions: readonly DiagnosticQuestion[]
  causes: readonly CauseRule[]
  source: { label: string; url: string }
}
export type GuidedHypothesis = Omit<CauseRule, 'evidence'> & { evidence: string[] }
export type GuidedDiagnosisReport = {
  defectId: string
  answeredCount: number
  observedCount: number
  pendingQuestions: string[]
  hypotheses: GuidedHypothesis[]
}
const options = (...items: Array<[string, string]>) => [
  ...items.map(([value, label]) => ({ value, label })),
  { value: 'unknown', label: 'Non verificato' },
]
const autodesk = (title: string, url: string) => ({ label: `Autodesk Moldflow · ${title}`, url })

const BASE_DEFECT_GUIDES: readonly DefectGuide[] = [
  {
    id: 'short-shot', label: 'Riempimento incompleto', description: 'Manca materiale in una parte del pezzo.',
    category: 'Riempimento', aliases: ['short_shot', 'short shot', 'cicca_incompleto', 'incompleto'],
    source: autodesk('Short shots', 'https://help.autodesk.com/cloudhelp/2015/ENU/MoldflowAdvisor/files/GUID-8E112178-5124-4049-B9BF-C4413A1EC44D.htm'),
    questions: [
      { id: 'cushion', label: 'Come si comporta il cuscino a fine post-pressione?', options: options(['zero', 'Si annulla'], ['variable', 'Varia tra le stampate'], ['stable', 'Resta positivo e stabile']) },
      { id: 'location', label: 'Dove manca il materiale?', options: options(['end', 'A fine percorso o in una tasca'], ['thin', 'Dopo una sezione sottile'], ['general', 'In più zone del pezzo']) },
      { id: 'pressureLimit', label: 'Durante il riempimento viene raggiunto il limite di pressione impostato?', options: options(['yes', 'Sì'], ['no', 'No']) },
    ],
    causes: [
      { id: 'shot-delivery', title: 'Dose o erogazione non ripetibile', explanation: 'Il materiale disponibile o effettivamente iniettato potrebbe essere insufficiente.', target: 'dose', evidence: [{ question: 'cushion', values: ['zero', 'variable'] }, { question: 'location', values: ['general'] }], checks: ['Confronta la dose con pezzi di tutte le cavità e canali freddi; registra cuscino e peso su più stampate.', 'Se il cuscino varia, verifica alimentazione e tenuta della valvola di non ritorno con il tecnico.'] },
      { id: 'flow-restriction', title: 'Resistenza al flusso o solidificazione anticipata', explanation: 'Una strozzatura o una zona fredda può impedire al fronte di raggiungere la fine del pezzo.', target: 'injection', evidence: [{ question: 'location', values: ['thin'] }, { question: 'pressureLimit', values: ['yes'] }], checks: ['Verifica temperature effettive e passaggi di ugello, canali e punto d’iniezione rispetto alla scheda materiale e allo stampo.', 'Solo dopo questi controlli valuta una prova su portata o limite di pressione, entro i limiti di pressa e stampo; controlla comparsa di bave o bruciature.'] },
      { id: 'trapped-air', title: 'Aria intrappolata o sfiati insufficienti', explanation: 'L’aria non evacuata può ostacolare il riempimento delle ultime zone.', target: 'venting', evidence: [{ question: 'location', values: ['end'] }], checks: ['Confronta la zona incompleta con il percorso di riempimento e verifica pulizia ed efficacia degli sfiati.', 'Se serve modificare lo sfiato, coinvolgi l’attrezzista prima di aumentare la pressione.'] },
    ],
  },
  {
    id: 'flash', label: 'Bava / sormonto', description: 'Materiale oltre la chiusura stampo o attorno agli estrattori.',
    category: 'Riempimento', aliases: ['bave', 'flashes', 'flash', 'giunzione_stamp'],
    source: { label: 'Eastman · Flashing, pagina 4 (copoliesteri)', url: 'https://www.eastman.com/content/dam/eastman/corporate/en/literature/p/ppd407.pdf' },
    questions: [
      { id: 'phase', label: 'Quando compare la bava?', options: options(['fill', 'Già nel riempimento'], ['hold', 'Solo con la post-pressione']) },
      { id: 'location', label: 'Dove compare la bava?', options: options(['local', 'Sempre nello stesso punto'], ['distributed', 'Su gran parte della chiusura']) },
      { id: 'mold', label: 'Sono stati riscontrati danni o sporco sulle battute?', options: options(['yes', 'Sì'], ['no', 'No, battute controllate']) },
    ],
    causes: [
      { id: 'parting-surface', title: 'Tenuta locale della chiusura stampo', explanation: 'Una zona danneggiata o sporca può lasciar passare materiale anche con una chiusura adeguata.', target: 'mold', evidence: [{ question: 'location', values: ['local'] }, { question: 'mold', values: ['yes'] }], checks: ['Fai verificare battute, accoppiamenti e profondità degli sfiati all’attrezzista.', 'Risolvi l’eventuale difetto meccanico prima di compensarlo con maggiore forza di chiusura.'] },
      { id: 'fill-pressure', title: 'Picco di pressione durante il riempimento', explanation: 'Il profilo di iniezione o una commutazione tardiva può favorire l’apertura dello stampo.', target: 'injection', evidence: [{ question: 'phase', values: ['fill'] }], checks: ['Confronta curva di pressione, portata e momento della commutazione V/P.', 'Valuta una prova controllata sul tratto finale del riempimento o sulla commutazione; verifica che il pezzo resti completo.'] },
      { id: 'holding-pressure', title: 'Post-pressione eccessiva per lo stampo', explanation: 'La fase di post-pressione può far comparire bava su un pezzo già riempito.', target: 'holding', evidence: [{ question: 'phase', values: ['hold'] }], checks: ['Prova a ridurre un solo livello di post-pressione, entro la finestra di processo validata.', 'Controlla peso, affossamenti e dimensioni prima di confermare la modifica.'] },
      { id: 'clamp-capacity', title: 'Chiusura insufficiente rispetto alla pressione in cavità', explanation: 'La pressione può superare la capacità utile di chiusura o evidenziare un appoggio non uniforme.', target: 'clamp', evidence: [{ question: 'location', values: ['distributed'] }], checks: ['Confronta chiusura richiesta e capacità utile della pressa; fai verificare appoggio e parallelismo.', 'Non superare i limiti di pressa e stampo: se manca capacità utile, valuta una pressa adeguata.'] },
    ],
  },
  {
    id: 'burn-mark', label: 'Bruciature', description: 'Segni scuri da verificare per aria intrappolata, degrado o taglio eccessivo.',
    category: 'Riempimento', aliases: ['bruciature', 'burn_mark', 'burn', 'diesel effect', 'dieseling'],
    source: autodesk('Burn marks', 'https://help.autodesk.com/cloudhelp/2019/ENU/MoldflowComm-Troubleshooting/files/GUID-82F65748-ACC8-46B8-861B-A48FB2FA26DF.htm'),
    questions: [
      { id: 'location', label: 'Dove si vedono i segni scuri?', options: options(['end', 'A fine percorso o in una tasca'], ['gate', 'Vicino al punto d’iniezione'], ['spread', 'Distribuiti sul pezzo']) },
      { id: 'restart', label: 'Il difetto peggiora dopo una sosta?', options: options(['yes', 'Sì'], ['no', 'No']) },
      { id: 'vents', label: 'Sono stati trovati sfiati ostruiti nella zona?', options: options(['yes', 'Sì'], ['no', 'No, sfiati controllati']) },
    ],
    causes: [
      { id: 'diesel-effect', title: 'Compressione dell’aria intrappolata', explanation: 'L’aria compressa nelle ultime zone può surriscaldarsi e lasciare una bruciatura.', target: 'venting', evidence: [{ question: 'location', values: ['end'] }, { question: 'vents', values: ['yes'] }], checks: ['Verifica la via di uscita dell’aria e ripristina gli sfiati con l’attrezzista.', 'Valuta il profilo finale di iniezione con una prova controllata, verificando anche il riempimento.'] },
      { id: 'thermal-degradation', title: 'Degrado per temperatura o permanenza', explanation: 'Il materiale può degradarsi in cilindro, ugello o canali caldi.', target: 'temperature', evidence: [{ question: 'restart', values: ['yes'] }, { question: 'location', values: ['spread'] }], checks: ['Confronta temperature effettive e tempo di permanenza con la scheda dello specifico grado materiale.', 'Verifica punti di ristagno e procedura di arresto/ripartenza con il tecnico; segui la procedura di spurgo prevista per il materiale.'] },
      { id: 'shear-heating', title: 'Riscaldamento da taglio in un passaggio ristretto', explanation: 'Ugello, canali o punto d’iniezione possono produrre taglio eccessivo.', target: 'gate', evidence: [{ question: 'location', values: ['gate'] }], checks: ['Fai controllare restrizioni e geometria dei passaggi vicino al segno.', 'Valuta una riduzione localizzata della portata nel tratto interessato, mantenendo completo il pezzo.'] },
    ],
  },
  {
    id: 'sink-mark', label: 'Affossamenti', description: 'Depressioni superficiali da ritiro locale non compensato.',
    category: 'Ritiro e dimensioni', aliases: ['sink', 'sink_marks', 'sink_mark', 'sink marks', 'risucchi', 'affondamenti'],
    source: autodesk('Sink marks and voids', 'https://help.autodesk.com/cloudhelp/2014/ENU/MoldflowComm/files/GUID-18F57182-6059-4403-9075-398B08B7AD2A.htm'),
    questions: [
      { id: 'location', label: 'L’affossamento è in corrispondenza di nervature o zone spesse?', options: options(['yes', 'Sì'], ['no', 'No']) },
      { id: 'holdingResponse', label: 'Aumentando il tempo di post-pressione, il peso del pezzo aumenta ancora?', options: options(['yes', 'Sì'], ['no', 'No, il peso è stabile']) },
      { id: 'cooling', label: 'Una zona dello stampo risulta più calda o raffreddata male?', options: options(['yes', 'Sì'], ['no', 'No, raffreddamento controllato']) },
    ],
    causes: [
      { id: 'holding-compensation', title: 'Compensazione del ritiro insufficiente', explanation: 'Il materiale ritirato può non essere compensato finché il punto d’iniezione trasmette pressione.', target: 'holding', evidence: [{ question: 'holdingResponse', values: ['yes'] }], checks: ['Confronta peso del pezzo e tempo di post-pressione per individuare la stabilizzazione del peso.', 'Valuta una prova su tempo o pressione di post-pressione, una variabile alla volta, controllando bave e dimensioni.'] },
      { id: 'thick-section', title: 'Accumulo di materiale o alimentazione della zona spessa', explanation: 'Una nervatura o una sezione massiccia può ritirarsi senza ricevere abbastanza materiale dal gate.', target: 'gate', evidence: [{ question: 'location', values: ['yes'] }, { question: 'holdingResponse', values: ['no'] }], checks: ['Verifica con il progettista spessore locale, nervature e percorso di alimentazione.', 'Se prolungare la post-pressione non cambia il peso, verifica la sigillatura del gate prima di prolungarla ancora.'] },
      { id: 'local-cooling', title: 'Raffreddamento locale insufficiente', explanation: 'Una zona calda può continuare a ritirarsi dopo l’estrazione.', target: 'cooling', evidence: [{ question: 'cooling', values: ['yes'] }], checks: ['Controlla portata dei circuiti, temperature effettive e uniformità di raffreddamento.', 'Valuta il tempo di raffreddamento con una prova controllata, confrontando pezzi alla stessa temperatura di misura.'] },
    ],
  },
]

export const DEFECT_GUIDES: readonly DefectGuide[] = [...BASE_DEFECT_GUIDES, ...EXTENDED_DEFECT_GUIDES]

export const normalizeDefectText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export function getDefectGuide(id?: string | null): DefectGuide | undefined {
  const key = normalizeDefectText(id ?? '')
  if (!key) return undefined
  return DEFECT_GUIDES.find(guide => [guide.id, guide.label, ...(guide.aliases ?? [])].some(name => normalizeDefectText(name) === key))
}

export function searchDefectGuides(query = '', category?: DefectCategory | ''): readonly DefectGuide[] {
  const terms = normalizeDefectText(query).split(' ').filter(Boolean)
  return DEFECT_GUIDES.filter(guide => {
    const haystack = normalizeDefectText([guide.id, guide.label, guide.description, guide.category, ...(guide.aliases ?? [])].join(' '))
    return (!category || guide.category === category) && terms.every(term => haystack.includes(term))
  })
}

export function buildGuidedDiagnosis(id?: string | null, answers: DiagnosticAnswers = {}): GuidedDiagnosisReport | undefined {
  const guide = getDefectGuide(id)
  if (!guide) return undefined
  const valid = (question: DiagnosticQuestion) => question.options.find(option => option.value === answers[question.id])
  const observed = guide.questions.filter(question => valid(question) && answers[question.id] !== 'unknown')
  const hypotheses = guide.causes.map(cause => ({
    ...cause,
    evidence: cause.evidence.flatMap(rule => {
      const question = observed.find(item => item.id === rule.question)
      const answer = question && valid(question)
      return answer && rule.values.includes(answer.value) ? [`${question.label} ${answer.label}.`] : []
    }),
  })).sort((a, b) => b.evidence.length - a.evidence.length)
  return {
    defectId: guide.id,
    answeredCount: guide.questions.filter(question => valid(question)).length,
    observedCount: observed.length,
    pendingQuestions: guide.questions.filter(question => !valid(question) || answers[question.id] === 'unknown').map(question => question.label),
    hypotheses,
  }
}
