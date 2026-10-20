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

export interface DefectCatalogEntry {
  id: string
  legacyIds: readonly string[]
  nameIt: string
  synonymsIt: readonly string[]
  semanticCautions?: readonly string[]
  description: string
  symptoms: readonly string[]
  severityCriteria: { 1: string; 2: string; 3: string }
  diagnosticQuestions: readonly string[]
  probableCauses: readonly CatalogCauseAction[]
  orderedActions: readonly CatalogCauseAction[]
  sources: readonly { publisher: string; title: string; reference: string; supports: string; limit: string }[]
  verificationStatus: DefectEvidenceStatus
  automationStatus: DefectAutomationStatus
  correctionId: DefectId | null
}

const BASF = 'BASF, Injection-Molding Problems in Engineering Thermoplastics'
const genericSeverity = {
  1: 'Lieve: sporadico o solo estetico, senza effetto funzionale osservato.',
  2: 'Medio: ricorrente o con effetto funzionale limitato; misurare e registrare il pezzo.',
  3: 'Grave: pezzo non conforme/funzionalmente compromesso o rischio di processo; contenere e verificare prima di riprendere.',
} as const

function pending(input: {
  id: string
  legacyIds?: string[]
  nameIt: string
  synonymsIt?: string[]
  semanticCautions?: string[]
  description: string
  symptoms: string[]
  diagnosticQuestions: string[]
  verificationStatus?: 'partial' | 'unverified'
  sources?: DefectCatalogEntry['sources']
}): DefectCatalogEntry {
  return {
    ...input,
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

const shortShot = [
  verifiedCause({ id: 'dose-cushion', title: 'Dose o cushion insufficienti/instabili', description: 'Cause nominate nella guida BASF; il dato sul singolo ciclo va verificato.', questionId: 'dose-cushion', question: 'Dose e cushion risultano insufficienti o instabili?', action: 'Misura dose e cushion e verifica la valvola di non ritorno prima di cambiare il profilo.', domain: 'process', order: 1, source: BASF, sourceReference: '§22, PDF/stampata p. 60' }),
  verifiedCause({ id: 'low-injection-speed', title: 'Velocità d’iniezione insufficiente', description: 'La guida indica di aumentare la velocità soltanto se è bassa.', questionId: 'low-injection-speed', question: 'La velocità selezionata è stata verificata come insufficiente e resta nei limiti pressa?', action: 'Aumenta la velocità solo se la misura/profilo conferma che è insufficiente e la pressa resta nei limiti.', domain: 'process', order: 2, source: BASF, sourceReference: '§22, PDF/stampata p. 60' }),
  verifiedCause({ id: 'flow-restriction', title: 'Perdita di pressione in gate/canali o sezione sottile', description: 'Cause di geometria e perdita di pressione riportate dalla fonte; non dedotte dal pin.', questionId: 'flow-restriction', question: 'È stata osservata una restrizione in gate/canali o una sezione sottile sul percorso?', action: 'Verifica gate, canali e perdita di pressione; modifica le sezioni solo dopo aver confermato la restrizione.', domain: 'mold', order: 3, source: BASF, sourceReference: '§22, PDF/stampata p. 60' }),
  verifiedCause({ id: 'inadequate-venting', title: 'Venting insufficiente', description: 'La fonte nomina il venting; l’effettiva condizione dello stampo deve essere ispezionata.', questionId: 'inadequate-venting', question: 'Sono stati osservati sfiati ostruiti o insufficienti?', action: 'Ispeziona e pulisci gli sfiati; dimensionamento e modifiche vanno verificati con il costruttore stampo.', domain: 'mold', order: 4, source: BASF, sourceReference: '§22, PDF/stampata p. 60' }),
]
const burn = [
  verifiedCause({ id: 'compressed-air', title: 'Aria compressa intrappolata (effetto diesel)', description: 'Compatibile con annerimento localizzato a fine riempimento o presso fronti confluenti; la causa non è provata dal pin.', questionId: 'localized-end-fill', question: 'La macchia nera è localizzata a fine riempimento, nervature o fronti confluenti?', action: 'Controlla la via di fuga dell’aria e gli sfiati; riduci la velocità solo se risulta eccessiva.', domain: 'process', order: 1, source: BASF, sourceReference: '§3, PDF pp. 10–11 / stampate 10–11' }),
  verifiedCause({ id: 'blocked-venting', title: 'Sfiati ostruiti o non efficaci', description: 'La guida cita sfiati ostruiti come possibile causa; richiede verifica del tool.', questionId: 'venting-obstruction', question: 'Sono stati osservati sfiati ostruiti o una via di fuga dell’aria insufficiente?', action: 'Pulisci e fai verificare gli sfiati e i canali di evacuazione dell’aria.', domain: 'mold', order: 2, source: BASF, sourceReference: '§3, PDF pp. 10–11 / stampate 10–11' }),
  verifiedCause({ id: 'thermal-or-shear-damage', title: 'Possibile degradazione termica o da shear (fenomeno distinto)', description: 'BASF separa le burning streaks dall’effetto diesel; la morfologia da sola non basta.', questionId: 'thermal-damage', question: 'Ci sono striature diffuse/odore o un’anomalia termica, di permanenza o shear rispetto al grade?', action: 'Confronta temperatura melt, permanenza e shear con la finestra del grade; non applicare rimedi diesel automaticamente.', domain: 'material', order: 3, source: BASF, sourceReference: '§18, PDF/stampata p. 52; distinto da §3' }),
  verifiedCause({ id: 'parting-line-air-release', title: 'Escape dell’aria impedito vicino al piano di divisione', description: 'Applicabile solo se posizione ed escape sono verificati dall’operatore.', questionId: 'parting-line-trap', question: 'Il burn è vicino al piano di divisione e l’aria non può uscire da lì?', action: 'Fai verificare l’escape dell’aria; ridurre il clamp è citato solo per questo caso e nei limiti macchina/stampo.', domain: 'mold', order: 4, source: BASF, sourceReference: '§3, PDF pp. 10–11 / stampate 10–11' }),
]
const flash = [
  verifiedCause({ id: 'parting-gap-or-damage', title: 'Gap, fit o superficie di tenuta da verificare', description: 'La guida elenca fit e superfici; serve ispezione effettiva.', questionId: 'tool-fit', question: 'È stato verificato un gap, un fit non corretto o una superficie di tenuta danneggiata?', action: 'Fai ripristinare fit e superfici; non compensare un danno aumentando automaticamente il clamp.', domain: 'mold', order: 1, source: BASF, sourceReference: '§9, PDF/stampata p. 28' }),
  verifiedCause({ id: 'high-cavity-pressure', title: 'Pressione cavità elevata durante filling/holding', description: 'Causa distinta che richiede misura o dato processo; non si deduce dalla localizzazione.', questionId: 'high-cavity-pressure', question: 'Una misura o un dato macchina indica pressione cavità elevata?', action: 'Se la pressione elevata è confermata, valuta V/P anticipato e riduzione velocità a fine riempimento.', domain: 'process', order: 2, source: BASF, sourceReference: '§9, PDF/stampata p. 28' }),
  verifiedCause({ id: 'low-melt-viscosity', title: 'Viscosità melt ridotta o degradazione', description: 'Richiede confronto con la finestra del grado e i dati reali di processo.', questionId: 'melt-condition', question: 'Temperatura, permanenza o umidità risultano fuori finestra per il grade?', action: 'Verifica temperatura, permanenza e condizionamento secondo scheda grade; modifica solo la variabile fuori finestra.', domain: 'material', order: 3, source: BASF, sourceReference: '§9, PDF/stampata p. 28' }),
  verifiedCause({ id: 'insufficient-clamp', title: 'Forza di chiusura insufficiente', description: 'Non assumere insufficienza senza confronto con limiti pressa e tool.', questionId: 'clamp-insufficient', question: 'Il controllo ha confermato clamp insufficiente rispetto ai limiti macchina?', action: 'Verifica dimensionamento e limiti macchina; intervieni sul clamp solo se insufficiente e autorizzato.', domain: 'process', order: 4, source: BASF, sourceReference: '§9, PDF/stampata p. 28' }),
]
const sink = [
  verifiedCause({ id: 'thick-section-shrinkage', title: 'Accumulo locale di spessore e ritiro', description: 'BASF associa sink a sezioni spesse/nervature; il pin non certifica la geometria.', questionId: 'thick-section', question: 'L’affossamento è presso una sezione spessa, nervatura o cambio di spessore osservato?', action: 'Verifica geometria locale e gating; interventi geometrici richiedono revisione pezzo/stampo.', domain: 'mold', order: 1, source: BASF, sourceReference: '§5, PDF/stampata p. 14; figure PDF pp. 15–17' }),
  verifiedCause({ id: 'insufficient-holding', title: 'Compensazione holding insufficiente rispetto al gate-open', description: 'Richiede misura di peso/pressione o gate-open.', questionId: 'gate-open-measured', question: 'Holding e gate-open sono stati verificati con misure di peso o pressione?', action: 'Misura gate-open e confronta peso/pressione prima di variare holding; resta entro limiti pressione.', domain: 'process', order: 2, source: BASF, sourceReference: '§5, PDF/stampata p. 14' }),
  verifiedCause({ id: 'post-ejection-hot-core', title: 'Comparsa dopo estrazione per core ancora caldo', description: 'La guida descrive comparsa post-ejection; richiede confronto temporale sul pezzo.', questionId: 'after-ejection', question: 'Il segno compare o peggiora solo dopo l’estrazione?', action: 'Confronta aspetto prima/dopo estrazione e verifica raffreddamento della zona.', domain: 'process', order: 3, source: BASF, sourceReference: '§5, PDF/stampata p. 14' }),
]

const partialSources = {
  tpu: { publisher: 'Covestro', title: 'Tips for Defect-Free Injection Molding of TPU', reference: 'PDF p. 3 / stampate pp. 4–5', supports: 'Indice e categorie difetto nel TPU', limit: 'TPU only; non trasferire a PP/ABS/PC/PA6/PA66' },
  process: { publisher: 'Covestro', title: 'Processing of TPU by Injection Molding', reference: '§3.2.3 PDF/stampata p. 14', supports: 'Burn/venting nel TPU', limit: 'TPU only; non trasferire ai materiali target' },
  hotRunner: { publisher: 'Mold-Masters', title: 'Hot Runner Troubleshooting Guide', reference: '§1.6.4 PDF p. 12; §1.6.8 PDF p. 16', supports: 'Troubleshooting di sistema hot-runner', limit: 'Resina non specificata; non generalizzare a qualsiasi macchina/materiale' },
} as const

export const DEFECT_CATALOG: readonly DefectCatalogEntry[] = [
  {
    id: 'short_shot', legacyIds: ['short-shot', 'SHORT_SHOT', 'short shot', 'Incompletezza', 'Cicca / Incompleto', 'cicca_incompleto', 'Riempimento incompleto', 'Mancanza', 'pezzi mancanti'], nameIt: 'Mancato riempimento / Short Shot', synonymsIt: ['Cicca', 'Incompletezza'], description: 'Cavità o estremità del pezzo non completamente riempita.', symptoms: ['Estremità o zone della cavità incomplete', 'Difetto ripetibile o variabile per cavità'], severityCriteria: genericSeverity, diagnosticQuestions: shortShot.map((cause) => cause.question), probableCauses: shortShot, orderedActions: shortShot, sources: [{ publisher: 'BASF', title: 'Injection-Molding Problems in Engineering Thermoplastics', reference: '§22 PDF/stampata p. 60', supports: 'Cause e rimedi condizionali letti integralmente', limit: 'Scope generale engineering thermoplastics; grade-specific non validato, PA6/PA66 soltanto famiglie in legenda' }], verificationStatus: 'partial', automationStatus: 'proposed', correctionId: 'short_shot',
  },
  {
    id: 'burn_mark', legacyIds: ['burn-mark', 'burn_mark', 'burn', 'burn marks', 'bruciature', 'bruciatura', 'diesel', 'segni di bruciatura'], nameIt: 'Bruciature / Effetto diesel', synonymsIt: ['Burn Mark', 'Burn marks'], semanticCautions: ['Effetto diesel da aria compressa e burning streaks da degradazione/shear sono fenomeni distinti; non assimilare a materiale_degradato.'], description: 'Macchia scura; distinguere aria compressa (diesel effect) da degradazione termica/shear (burning streaks).', symptoms: ['Annerimento localizzato, spesso a fine flusso/fronti confluenti', 'Striature diffuse o odore richiedono diagnosi distinta'], severityCriteria: genericSeverity, diagnosticQuestions: burn.map((cause) => cause.question), probableCauses: burn, orderedActions: burn, sources: [{ publisher: 'BASF', title: 'Injection-Molding Problems in Engineering Thermoplastics', reference: '§3 PDF pp. 10–11 / stampate 10–11; §18 PDF/stampata p. 52', supports: 'Diesel effect e burning streaks distinti', limit: 'Scope generale; grade-specific da validare, PP/ABS/PC non in legenda' }, partialSources.process], verificationStatus: 'partial', automationStatus: 'proposed', correctionId: 'burn_mark',
  },
  {
    id: 'flash', legacyIds: ['bave', 'bava', 'BAVE', 'sbavatura', 'sormonto', 'fuga materiale', 'parting-line flash'], nameIt: 'Bave / Flash', synonymsIt: ['Bava', 'Sormonto', 'Flash'], semanticCautions: ['giunzione_stamp/mold mismatch è guasto attrezzatura correlato, non sinonimo di flash.'], description: 'Film o eccesso di materiale oltre il piano di chiusura o altre giunzioni.', symptoms: ['Bava al parting line, espulsori o inserti', 'Distribuzione uniforme o localizzata da osservare'], severityCriteria: genericSeverity, diagnosticQuestions: flash.map((cause) => cause.question), probableCauses: flash, orderedActions: flash, sources: [{ publisher: 'BASF', title: 'Injection-Molding Problems in Engineering Thermoplastics', reference: '§9 PDF/stampata p. 28', supports: 'Cause distinte e rimedi condizionati', limit: 'Scope generale; grade-specific da validare, non convalida percentuali software' }, partialSources.hotRunner], verificationStatus: 'partial', automationStatus: 'proposed', correctionId: 'flash',
  },
  {
    id: 'sink', legacyIds: ['sink-mark', 'sink_mark', 'sink_marks', 'ritiro', 'RITIRO', 'affossamento', "segni d'affondamento"], nameIt: 'Affossamenti / Sink marks', synonymsIt: ['Sink', 'Segni di ritiro'], semanticCautions: ['Vuoti/bolle/porosità interni sono schede correlate ma distinte; una depressione superficiale non dimostra una cavità interna.'], description: 'Depressione superficiale da distinguere da vuoto interno e peso fuori specifica.', symptoms: ['Depressione vicino a nervature/sezioni spesse', 'Comparsa immediata o post-ejection da registrare'], severityCriteria: genericSeverity, diagnosticQuestions: sink.map((cause) => cause.question), probableCauses: sink, orderedActions: sink, sources: [{ publisher: 'BASF', title: 'Injection-Molding Problems in Engineering Thermoplastics', reference: '§5 PDF/stampata p. 14; figure PDF pp. 15–17', supports: 'Ritiro locale, holding e casi geometrici', limit: 'Esempi Ultramid rinforzato, non tutti i grade; niente delta pack universale' }], verificationStatus: 'partial', automationStatus: 'manual', correctionId: null,
  },
  pending({ id: 'warpage', legacyIds: ['deformazione', 'deformazioni', 'deformation', 'DEFORMAZIONE', 'imbarcamento', 'imbarcamento centrale'], nameIt: 'Imbarcamento / Warpage', synonymsIt: ['Deformazione'], description: 'Deviazione della forma o dimensione dopo espulsione/condizionamento.', symptoms: ['Deviazione dimensionale misurabile', 'Differenze tra lati o cavità'], diagnosticQuestions: ['Quale quota/direzione devia e quando è stata misurata?', 'È stata verificata differenza tra lati o cavità?'], verificationStatus: 'partial', sources: [partialSources.tpu] }),
  pending({ id: 'weld_line', legacyIds: ['linea_giunzione', 'linea di giunzione', 'linea di saldatura', 'weld line', 'linea di giunzione debole'], nameIt: 'Linea di giunzione / Weld line', description: 'Segno o discontinuità dove si incontrano fronti di flusso; distinguere esito estetico e resistenza.', symptoms: ['Linea tra due fronti', 'Eventuale debolezza meccanica da prova separata'], diagnosticQuestions: ['È solo estetica o la resistenza è stata misurata?', 'Dove si trova rispetto a gate e ostacoli?'], semanticCautions: ['Non confondere con giunzione_stamp/mold mismatch, guasto di accoppiamento dello stampo.'] }),
  pending({ id: 'flow_marks', legacyIds: ['linea_flusso', 'linee di flusso', 'flow lines', 'flow marks', 'flowline', 'striature di flusso'], nameIt: 'Linee di flusso / Flow marks', description: 'Bande o differenze superficiali associate al percorso del fronte.', symptoms: ['Bande o variazione di lucentezza lungo il flusso'], diagnosticQuestions: ['Seguono gate o cambi sezione?', 'Sono distinte da weld line, jetting e splay?'] }),
  pending({ id: 'jetting', legacyIds: ['getto', 'serpentina', 'jetting'], nameIt: 'Jetting', description: 'Traccia sinuosa da verificare come possibile getto libero originato al gate.', symptoms: ['Traccia sinuosa presso gate'], diagnosticQuestions: ['La traccia nasce al gate?', 'È limitata alla prima fase di riempimento?'] }),
  pending({ id: 'splay', legacyIds: ['striature', 'striature argentate', 'striature da umidità', 'silver streaks'], nameIt: 'Striature argentate / Splay', synonymsIt: ['Splay'], description: 'Striature superficiali da distinguere per causa prima di intervenire.', symptoms: ['Filamenti argentati nella direzione del flusso'], diagnosticQuestions: ['Persistono dopo essiccazione documentata?', 'Coinvolgono tutte le cavità o un punto?'] }),
  pending({ id: 'voids', legacyIds: ['voids', 'bolle_aria', 'bolle', 'vuoti', 'porosità', 'poros'], nameIt: 'Vuoti, bolle e porosità', description: 'Cavità interne o bolle; mantenere distinto da sink superficiale.', symptoms: ['Vuoto interno o bolla superficiale'], diagnosticQuestions: ['È una cavità interna o una bolla superficiale?', 'È al centro di una sezione spessa o presso gate?'] }),
  pending({ id: 'air_trap', legacyIds: ['sfiato', 'sfiati', 'air trap', 'linee aria', 'soffiature', 'aria intrappolata'], nameIt: 'Intrappolamento aria / Sfiato', description: 'Possibile condizione da correlare con burn/short shot, non sinonimo automatico.', symptoms: ['Difetto in fine riempimento o zona chiusa'], diagnosticQuestions: ['È stato osservato uno sfiato ostruito?', 'Il difetto coincide con una tasca d’aria verificata?'], verificationStatus: 'partial', sources: [partialSources.process] }),
  pending({ id: 'contamination', legacyIds: ['inclusioni', 'inclusione', 'contaminazione', 'contaminazioni', 'particelle estranee'], nameIt: 'Contaminazione / Inclusioni', description: 'Particelle o materiale estraneo da distinguere da degradazione e difetto cromatico.', symptoms: ['Particella visibile o variazione cromatica locale'], diagnosticQuestions: ['È stata identificata una particella?', 'Ricorre con lotto, tramoggia o macchina?'] }),
  pending({ id: 'degradation', legacyIds: ['materiale_degradato', 'materiale degradato', 'materiale bruciato', 'sovrariscaldamento materiale', 'sovrariscaldamento'], nameIt: 'Degradazione / Bruciatura del materiale', description: 'Alterazione del polimero da confermare; non assimilare automaticamente a diesel effect.', symptoms: ['Odore, colore o proprietà alterate'], diagnosticQuestions: ['È diffusa o localizzata?', 'Segue un arresto prolungato o un lotto specifico?'] }),
  pending({ id: 'cold_slug', legacyIds: ['cold_slug', 'cold slug', 'gelo', 'massa fredda visibile'], nameIt: 'Cold slug / Materiale freddo al gate', description: 'Inclusione o segno freddo vicino al gate, da confermare sul pezzo.', symptoms: ['Segno/inclusione in prossimità del gate'], diagnosticQuestions: ['Il segno è vicino al gate?', 'È stato verificato il pozzetto freddo?'] }),
  pending({ id: 'surface_finish', legacyIds: ['lucido_opaco', 'difetti_brillantezza', 'superficie_opaca', 'superficie_lucida', 'color defects', 'opacità', 'gloss non uniforme'], nameIt: 'Finitura lucida/opaca e brillantezza', description: 'Gloss o trasferimento di finitura da distinguere da texture e contaminazione.', symptoms: ['Gloss basso/alto o non uniforme'], diagnosticQuestions: ['È stata misurata la brillantezza?', 'Coincide con texture o variazione di fronte?'] }),
  pending({ id: 'surface_roughness', legacyIds: ['rugosita', 'rugosità', 'puntinatura', 'PUNTINATURA', 'pori superficiali', 'specks', 'dots'], nameIt: 'Rugosità anomala / Puntinatura', description: 'Difetto superficiale da classificare prima di attribuire una causa.', symptoms: ['Difetto puntuale o distribuito'], diagnosticQuestions: ['È particella, poro o texture trasferita?', 'Varia tra cavità?'] }),
  pending({ id: 'weight_out_of_spec', legacyIds: ['peso_non_conforme', 'peso non conforme', 'massa pezzo alta', 'massa pezzo bassa'], nameIt: 'Peso fuori specifica', description: 'Esito metrologico da legare a massa target e procedura di misura.', symptoms: ['Massa media o dispersione fuori tolleranza dichiarata'], diagnosticQuestions: ['Qual è massa target e tolleranza?', 'Misura dopo quale condizionamento?'] }),
  pending({ id: 'dimensions_out_of_tolerance', legacyIds: ['tolleranza', 'dimensioni fuori tolleranza', 'variazione dimensionale', 'dimensions out of tolerance'], nameIt: 'Dimensioni fuori tolleranza', description: 'Misura dimensionale non conforme da distinguere da deformazione e condizionamento.', symptoms: ['Quota fuori tolleranza dichiarata'], diagnosticQuestions: ['Quale quota, tolleranza e datum?', 'Quando e dopo quale condizionamento è stata misurata?'], verificationStatus: 'partial', sources: [partialSources.tpu] }),
  pending({ id: 'ejection_scuff', legacyIds: ['ejection_scuff', 'graffi in estrazione', 'graffi', 'scuff', 'ejector marks'], nameIt: 'Graffi e difetti di estrazione', description: 'Segni da estrazione da distinguere da adesione e impronte espulsori.', symptoms: ['Segni nella direzione di estrazione', 'Possibile adesione a una faccia'], diagnosticQuestions: ['Il pezzo aderisce a una faccia?', 'Ci sono impronte espulsori o segni di scorrimento?'], verificationStatus: 'partial', sources: [partialSources.tpu] }),
  pending({ id: 'delamination', legacyIds: ['delaminazione', 'delamin', 'delam', 'strati', 'separazione superficiale'], nameIt: 'Delaminazione', description: 'Distacco/scagliatura superficiale; causa non stabilita dai frammenti disponibili.', symptoms: ['Strati o scaglie superficiali separabili'], diagnosticQuestions: ['Gli strati sono separabili o è solo una linea superficiale?', 'Sono noti materiali/additivi coinvolti?'], verificationStatus: 'partial', sources: [partialSources.tpu] }),
  pending({ id: 'drool_stringing', legacyIds: ['colature di materiale', 'colature', 'filamenti', 'drooling', 'drool', 'stringing', 'filamenti nella materozza'], nameIt: 'Colature e filamenti in materozza', description: 'Colatura/filamento da caratterizzare in relazione a ugello, valvola o hot runner.', symptoms: ['Colatura da ugello o filamento tra ugello e materozza'], diagnosticQuestions: ['Si verifica durante decompressione o apertura?', 'È hot runner o ugello standard?'], verificationStatus: 'partial', sources: [partialSources.hotRunner] }),
  pending({ id: 'fold_marks', legacyIds: ['piegature', 'fold marks', 'pieghe del fronte'], nameIt: 'Piegature / Fold marks', description: 'Fronte ripiegato da distinguere da weld line e sovrapposizione di flusso.', symptoms: ['Fronte ripiegato o linea sovrapposta'], diagnosticQuestions: ['È distinguibile da weld line?', 'Dove si trova rispetto a gate e ostacoli?'] }),
  pending({ id: 'vacuum_adhesion', legacyIds: ['adesione da sottovuoto', 'vacuum adhesion'], nameIt: 'Adesione da sottovuoto', description: 'Adesione a una faccia; il meccanismo di vuoto va verificato, non dedotto.', symptoms: ['Distacco difficile da una faccia specifica'], diagnosticQuestions: ['Quale faccia trattiene il pezzo?', 'È stata verificata ventilazione dietro la superficie?'] }),
  pending({ id: 'mold_mismatch', legacyIds: ['giunzione_stamp', 'linea di divisione aperta', 'mold mismatch', 'giunzione stampo non chiusa', 'Giunzione stampo non chiusa correttamente'], nameIt: 'Giunzione stampo non chiusa', description: 'Possibile guasto attrezzatura/sicurezza; non comandare automaticamente il clamp.', symptoms: ['Gap visibile, bava localizzata o allarme macchina'], diagnosticQuestions: ['È stato verificato un gap o parallelismo?', 'La pressa segnala allarme o clamp fuori limite?'] }),
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
