import type { DefectId } from '@/defects/defectRules'

export type OperatorAnswer = 'yes' | 'no' | 'unknown'

export interface DefectPinContext {
  id: string
  position: { x: number; y: number; z: number }
  coordinateFrame: 'viewer-local'
  placement: 'catalog-estimate'
}

export interface ContextualDefectCause {
  id: string
  title: string
  description: string
  questionId: string
  question: string
  action: string
  source: string
  sourceReference: string
}

export interface ContextualDefectProfile {
  label: string
  causes: readonly ContextualDefectCause[]
}

const BASF = 'BASF, Injection-Molding Problems in Engineering Thermoplastics'

export const CONTEXTUAL_DEFECT_PROFILES: Partial<Record<DefectId, ContextualDefectProfile>> = {
  short_shot: {
    label: 'Mancato riempimento',
    causes: [
      {
        id: 'dose-cushion',
        title: 'Dose o cushion insufficienti/instabili',
        description: 'La causa è coerente con la risposta dell’operatore.',
        questionId: 'dose-cushion',
        question: 'Dose e cushion risultano insufficienti o instabili?',
        action: 'Misura dose e cushion e verifica la valvola di non ritorno prima di cambiare il profilo.',
        source: BASF,
        sourceReference: '§22, pagina PDF/stampata 60',
      },
      {
        id: 'low-injection-speed',
        title: 'Velocità d’iniezione insufficiente',
        description: 'La causa è coerente con la risposta dell’operatore.',
        questionId: 'low-injection-speed',
        question: 'La velocità selezionata è stata verificata come insufficiente, restando nei limiti pressa?',
        action: 'Aumenta la velocità solo se la misura/profilo conferma che è insufficiente e la pressa resta nei limiti.',
        source: BASF,
        sourceReference: '§22, pagina PDF/stampata 60',
      },
      {
        id: 'flow-restriction',
        title: 'Perdita di pressione in gate/canali o sezione sottile',
        description: 'La causa è coerente con il riscontro dichiarato; la geometria non è dedotta dal pin.',
        questionId: 'flow-restriction',
        question: 'È stata osservata una restrizione in gate/canali o una sezione sottile sul percorso?',
        action: 'Verifica gate, canali e perdita di pressione; modifica le sezioni solo dopo aver confermato la restrizione.',
        source: BASF,
        sourceReference: '§22, pagina PDF/stampata 60',
      },
      {
        id: 'inadequate-venting',
        title: 'Venting insufficiente',
        description: 'La causa è coerente con il riscontro dichiarato, non con le sole coordinate del pin.',
        questionId: 'inadequate-venting',
        question: 'Sono stati osservati sfiati ostruiti o insufficienti?',
        action: 'Ispeziona e pulisci gli sfiati; dimensionamento e modifiche vanno verificati con il costruttore stampo.',
        source: BASF,
        sourceReference: '§22, pagina PDF/stampata 60',
      },
    ],
  },
  burn_mark: {
    label: 'Bruciatura / effetto diesel',
    causes: [
      {
        id: 'compressed-air',
        title: 'Aria compressa intrappolata (effetto diesel)',
        description: 'Ipotesi coerente con un annerimento localizzato a fine riempimento o presso fronti confluenti.',
        questionId: 'localized-end-fill',
        question: 'La macchia nera è localizzata a fine riempimento, nervature o fronti confluenti?',
        action: 'Controlla la via di fuga dell’aria e gli sfiati; riduci la velocità solo se risulta eccessiva.',
        source: BASF,
        sourceReference: '§3, pagine PDF 10–11 / stampate 10–11',
      },
      {
        id: 'blocked-venting',
        title: 'Sfiati ostruiti o non efficaci',
        description: 'La causa è coerente con il riscontro dichiarato.',
        questionId: 'venting-obstruction',
        question: 'Sono stati osservati sfiati ostruiti o una via di fuga dell’aria insufficiente?',
        action: 'Pulisci e fai verificare gli sfiati e i canali di evacuazione dell’aria.',
        source: BASF,
        sourceReference: '§3, pagine PDF 10–11 / stampate 10–11',
      },
      {
        id: 'thermal-or-shear-damage',
        title: 'Possibile degradazione termica o da shear (fenomeno distinto)',
        description: 'BASF separa le burning streaks da effetto diesel; il pin non distingue i due fenomeni.',
        questionId: 'thermal-damage',
        question: 'Sono presenti striature diffuse/odore o un’anomalia di temperatura, permanenza o shear rispetto alla scheda del grade?',
        action: 'Confronta melt temperature, permanenza e shear con la finestra del grade; non applicare rimedi diesel automaticamente.',
        source: BASF,
        sourceReference: '§18, pagina PDF/stampata 52; distinto da §3',
      },
      {
        id: 'parting-line-air-release',
        title: 'Escape dell’aria impedito vicino al piano di divisione',
        description: 'Questa ipotesi richiede una conferma esplicita della posizione e dell’escape.',
        questionId: 'parting-line-trap',
        question: 'Il burn è vicino al piano di divisione e l’aria non può uscire da lì?',
        action: 'Fai verificare l’escape dell’aria; BASF cita la riduzione del clamp solo per questo caso specifico e nei limiti macchina/stampo.',
        source: BASF,
        sourceReference: '§3, pagine PDF 10–11 / stampate 10–11',
      },
    ],
  },
  flash: {
    label: 'Bava / flash',
    causes: [
      {
        id: 'parting-gap-or-damage',
        title: 'Gap, fit o superficie di tenuta da verificare',
        description: 'Ipotesi coerente solo se il controllo dell’attrezzatura ha rilevato il difetto.',
        questionId: 'tool-fit',
        question: 'È stato verificato un gap, un fit non corretto o una superficie di tenuta danneggiata?',
        action: 'Fai ripristinare fit e superfici; non compensare un danno aumentando automaticamente il clamp.',
        source: BASF,
        sourceReference: '§9, pagina PDF/stampata 28',
      },
      {
        id: 'high-cavity-pressure',
        title: 'Pressione cavità elevata durante filling/holding',
        description: 'Richiede una misura o un riscontro di processo; non è dedotta dal punto del difetto.',
        questionId: 'high-cavity-pressure',
        question: 'Una misura o un dato macchina indica pressione cavità elevata?',
        action: 'Se la pressione elevata è confermata, valuta V/P anticipato e riduzione della velocità a fine riempimento.',
        source: BASF,
        sourceReference: '§9, pagina PDF/stampata 28',
      },
      {
        id: 'low-melt-viscosity',
        title: 'Viscosità melt ridotta o degradazione',
        description: 'Ipotesi coerente solo con un riscontro di temperatura, permanenza o materiale fuori finestra.',
        questionId: 'melt-condition',
        question: 'Temperatura, permanenza o umidità del materiale risultano fuori finestra per il grade?',
        action: 'Verifica temperatura, permanenza e condizionamento secondo la scheda del grade; modifica solo la variabile fuori finestra.',
        source: BASF,
        sourceReference: '§9, pagina PDF/stampata 28',
      },
      {
        id: 'insufficient-clamp',
        title: 'Forza di chiusura insufficiente',
        description: 'Non assumere clamp insufficiente senza confronto con i limiti della pressa e la condizione stampo.',
        questionId: 'clamp-insufficient',
        question: 'Il calcolo/controllo ha confermato clamp insufficiente rispetto ai limiti macchina?',
        action: 'Verifica il dimensionamento e i limiti macchina; intervenire sul clamp solo se insufficiente e autorizzato.',
        source: BASF,
        sourceReference: '§9, pagina PDF/stampata 28',
      },
    ],
  },
  sink: {
    label: 'Affossamento / sink',
    causes: [
      {
        id: 'thick-section-shrinkage',
        title: 'Accumulo locale di spessore e ritiro',
        description: 'Ipotesi coerente con una depressione osservata in corrispondenza di sezione spessa/nervatura.',
        questionId: 'thick-section',
        question: 'L’affossamento è visibile presso una sezione spessa, una nervatura o un cambio di spessore?',
        action: 'Verifica la geometria locale e il gating; gli interventi geometrici richiedono revisione del pezzo/stampo.',
        source: BASF,
        sourceReference: '§5, pagina PDF/stampata 14; figure 15–17',
      },
      {
        id: 'insufficient-holding',
        title: 'Compensazione holding insufficiente rispetto al gate-open',
        description: 'Richiede misura di peso/pressione o gate-open; non si deduce dal pin.',
        questionId: 'gate-open-measured',
        question: 'Holding e gate-open sono stati verificati con misure di peso o pressione?',
        action: 'Misura il gate-open e confronta peso/pressione prima di variare holding; resta entro i limiti di pressione.',
        source: BASF,
        sourceReference: '§5, pagina PDF/stampata 14',
      },
      {
        id: 'post-ejection-hot-core',
        title: 'Comparsa dopo estrazione per core ancora caldo',
        description: 'Ipotesi da distinguere verificando quando compare il segno.',
        questionId: 'after-ejection',
        question: 'Il segno compare o peggiora solo dopo l’estrazione del pezzo?',
        action: 'Confronta l’aspetto prima e dopo l’estrazione e verifica il raffreddamento della zona.',
        source: BASF,
        sourceReference: '§5, pagina PDF/stampata 14',
      },
    ],
  },
}

export function getContextualDefectProfile(defectId?: string | null): ContextualDefectProfile | null {
  return defectId ? CONTEXTUAL_DEFECT_PROFILES[defectId as DefectId] ?? null : null
}