# Inventario e proposta di catalogo difetti

Stato: inventario tecnico con catalogo eseguibile v1 in `src/defects/defectCatalog.ts`. Non sostituisce le regole in produzione e non certifica completezza. Non aggiunge correzioni automatiche o variazioni percentuali.

Esito documentale aggiornato al 2026-10-20: **0 schede validate integralmente per ciascun materiale target, 13 parziali, 11 senza riscontro codificato**. Il file contiene 24 schede. Quattro PDF OEM erano stati scaricati via HTTP (200, Content-Type PDF, firma `%PDF-`) ed estratti con `pypdf` installato solo in `%TEMP%`; il manuale BASF è stato riletto direttamente il 2026-10-20 con lo stesso metodo, senza aggiungere dipendenze all’app. Le schede parziali hanno fonte leggibile ma scope TPU/hot-runner o trasferibilità non dimostrata a tutti i grade. Le schede senza riscontro codificato non hanno cause o azioni nel catalogo; per alcune il manuale BASF ha un capitolo non ancora estratto (vedi tabella).

## Criteri e stato delle fonti

Una voce presente in un modulo non equivale a una diagnosi validata. Le regole legacy in `src/data/defectRules.ts`, `src/lib/defects.ts`, `src/utils/calcEngine.ts`, `src/ai/defectRules.ts` e negli analyzer locali contengono euristiche e delta non uniformi; non trasferirli al motore canonico senza verifica.

I file Covestro sono stati estratti integralmente e dichiarano TPU. Il manuale BASF è stato estratto integralmente; dichiara “engineering plastics” e la legenda finale elenca Ultramid® = PA6, PA66, PA6/66 e PA6/6T. Non elenca PP, ABS o PC nella legenda e non associa ogni rimedio a uno specifico grade. Le raccomandazioni BASF sono verificate come testo nel campo generale dichiarato, non come setpoint convalidati per ogni materiale/compound. Mold-Masters riguarda hot-runner e non specifica una resina universale.

| ID fonte | Editore e titolo | URL | Revisione/data visibile | Sezione / contenuto effettivamente verificato | Limite |
|---|---|---|---|---|---|
| COV-TPU-DEFECTS | Covestro, *Tips for Defect-Free Injection Molding of TPU* | https://solutions.covestro.com/-/media/covestro/solution-center/brands/downloads/imported/1557310065.pdf?rev=8ca8c46485944b4c8a18e180678d81fc&hash=8B9BABE43E840D772D229998546E4BBE | Edizione 2016, Order-No. COV00080632; metadati PDF creato 08-08-2016, modificato 11-08-2016 | PDF 33 p.; copertina/intro PDF pp. 1–2 dichiara TPU. §1.1 Defects in dimensions: PDF p. 3 / stampate pp. 4–5, short molding e flash con cause/rimedi. | Fonte integrale, specifica TPU; non trasferire ai cinque materiali target. |
| COV-TPU-PROCESS | Covestro, *Processing of TPU by Injection Molding* | https://solutions.covestro.com/-/media/covestro/solution-center/brands/downloads/imported/1557310236.pdf?rev=e83e64d53f8547f081aa8b34384b9b49&hash=63E74D19279864976EE8C513CF9223A9 | Metadati PDF creato 03-08-2016, modificato 11-08-2016; copertina PDF p. 1 | PDF 32 pp.; §3.2.3 PDF/pagina stampata 14: speed, venting e sink/burn TPU; §3.4.5 PDF/pagina stampata 22: venting TPU. | Fonte integrale, scope TPU; non trasferire ai cinque materiali target. |
| MM-HR-TROUBLE | Mold-Masters, *Hot Runner User Manual – Hot Runner Troubleshooting Guide*, Version 1, Original Instructions | https://www.moldmasters.com/sites/default/files/2020-09/Hot%20Runner%20Troubleshooting%20Guide.pdf | Copertina PDF p. 1: Version 1; metadati creato/modificato 11-08-2020; copyright 2020 | PDF 28 pp.; TOC PDF p. 3. §1.6.4 Burn PDF p. 12 / stampata 1-8; §1.6.8 Flash PDF p. 16 / stampata 1-12. | Fonte letta integralmente; ambito hot-runner, materiale non dichiarato. |
| BASF-IM-THERMOPLASTICS | BASF, *Injection-Molding Problems in Engineering Thermoplastics* (titolo metadata); il filename contiene `Brochure_German`, il testo estratto è inglese | https://download.basf.com/p1/8a8082587fd4b608017fd6631d5a24b1/en/Injection-Molding_Problems_in_Engineering_Thermoplastics_-_Causes_and_Solutions_Brochure_German.pdf | PDF 70 pp.; creation metadata 31-07-2009; disclaimer finale “August 2009”; piè pagina 31-07-2009; nessun numero di revisione identificato | Indice PDF p. 2. §3 Diesel PDF pp. 10–11 / stampate 10–11; §5 Sink PDF/stampata p. 14; §9 Flash PDF/stampata p. 28; §22 Short shot PDF/stampata p. 60. Scope engineering thermoplastics PDF/stampata p. 3; legenda famiglie p. 70. | Letto integralmente. Ultramid® elenca PA6/PA66; PP/ABS/PC assenti dalla legenda. Testo verificato nel campo generale dichiarato, non convalidato per ogni grade. |

Non sono state ottenute fonti OEM consultabili integralmente che convalidino tutte le cause/azioni per ciascuno dei cinque materiali e dei relativi gradi. Il manuale BASF è stato letto integralmente, ma non fornisce una matrice di trasferibilità grade→rimedio per PP, ABS, PC e singoli compound PA; la legenda nomina PA6/PA66 tramite Ultramid. Covestro è solo TPU; Mold-Masters solo hot-runner e senza resina dichiarata. Le raccomandazioni BASF sono verificate come contenuto del manuale nel suo ambito generale, non come setpoint validati per i materiali dell’app. Nessuna scheda è validata per ogni materiale/grade richiesto.

### Applicabilità dei materiali target (quattro difetti attivi)

Legenda: “non dimostrata” significa che non è stato verificato nel documento completo che la regola/causa valga per quel materiale; non significa che il fenomeno non si verifichi.

| Fonte/evidenza | PP | ABS | PC | PA6 | PA66 | Stato |
|---|---|---|---|---|---|---|
| Covestro TPU, burn/venting | Fuori ambito | Fuori ambito | Fuori ambito | Fuori ambito | Fuori ambito | Manuale TPU, sezioni lette; non trasferire. |
| Covestro TPU, short/flash/sink | Fuori ambito | Fuori ambito | Fuori ambito | Fuori ambito | Fuori ambito | Manuale TPU, sezioni lette; non trasferire. |
| BASF, engineering thermoplastics | Non indicato nella legenda | Non indicato nella legenda | Non indicato nella legenda | Ultramid PA6 nominato; non ogni grade/compound | Ultramid PA66 nominato; non ogni grade/compound | Scope generale p. 3, legenda p. 70; applicazione specifica dei rimedi per grado non fornita. |
| Mold-Masters, hot-runner | Non definito per polimero | Non definito per polimero | Non definito per polimero | Non definito per polimero | Non definito per polimero | Manuale del sistema hot-runner; non guida di materiale. |

Per le quattro voci attive, la verifica materiale per materiale è quindi la seguente; `NV` = non verificato nella fonte integrale. I frammenti BASF non identificano il polimero/grade, mentre Covestro riguarda TPU e viene escluso dai cinque materiali richiesti.

| Difetto attivo | PP | ABS | PC | PA6 | PA66 |
|---|---|---|---|---|---|
| Mancato riempimento | Non attestato dalla legenda BASF | Non attestato dalla legenda BASF | Non attestato dalla legenda BASF | Famiglia Ultramid PA6 nominata; rimedio non specifico per grade | Famiglia Ultramid PA66 nominata; rimedio non specifico per grade |
| Bava / flash | Non attestato dalla legenda BASF | Non attestato dalla legenda BASF | Non attestato dalla legenda BASF | Campo generale + famiglia PA; grade non associato nel §9 | Campo generale + famiglia PA; grade non associato nel §9 |
| Bruciature | Non attestato dalla legenda BASF | Non attestato dalla legenda BASF | Non attestato dalla legenda BASF | Esempi PA/Ultramid nel manuale; diesel remedy non attribuito a un grade | Ultramid nominato; non tutte le formulazioni PA66 |
| Affossamenti / sink marks | Non attestato dalla legenda BASF | Non attestato dalla legenda BASF | Non attestato dalla legenda BASF | Figura sink in Ultramid rinforzato e famiglia PA6 in legenda; non ogni compound | Famiglia PA66 in legenda; §5 non associa tutti i rimedi al grade |

### Quattro difetti attivi: cause/azioni e stato

Le pagine BASF sotto sono state scaricate ed estratte integralmente con `pypdf` temporaneo. “Pagina PDF” è l’indice fisico del file; “pagina stampata” è il numero/ intervallo visibile nel documento. Le cause/raccomandazioni sono quindi **verificate come testo della guida** nel suo campo dichiarato “engineering thermoplastics”; non equivalgono a validazione di ogni grade. La legenda BASF a p. stampata 70 identifica Ultramid® = PA 6, 66, 6/66, 6/6T. Per PP, ABS, PC e formulazioni/compound specifici non è stata verificata applicabilità individuale.

#### Mancato riempimento / short shot

- **Fonte letta:** BASF-IM-THERMOPLASTICS, §22 “Short shot”, PDF p. 60 / pagina stampata p. 60; figura PDF p. 61 / stampata pp. 60–61. Guida PDF 70 pp.; indice PDF p. 2.
- **Sintomo descritto:** parte non completamente formata, soprattutto lontano dal gate o in sezioni sottili.
- **Cause riportate:** dose insufficiente; assenza di melt cushion; melt e/o stampo troppo freddi; injection speed insufficiente; venting inadeguato; perdita di pressione in nozzle/runners/gates; parete troppo sottile o flow path troppo lungo; sezione sottile vicino al gate che solidifica durante il riempimento; flowability insufficiente dopo ottimizzazione processo.
- **Raccomandazioni BASF lette:** aumentare metering stroke o verificare non-return valve per dose/cushion; aumentare prima melt temperature e poi eventualmente mold temperature se troppo basse (BASF nota che la temperatura stampo può aumentare il cooling time); aumentare injection speed se essa è insufficiente; controllare/migliorare vents; allargare cross-sections se la perdita di pressione è la causa; modifiche a spessore/gate/runner solo come design intervention. Considerare materiale più fluido soltanto dopo l’ottimizzazione dei parametri.
- **Applicabilità:** scope dichiarato “engineering thermoplastics”, intro PDF/stampata p. 3. La legenda PDF/stampata p. 70 nomina Ultramid PA6/PA66 e copolimeri; nessun riferimento di legenda a PP/ABS/PC. BASF non associa in §22 ciascun rimedio a un grado specifico; grade, filler e finestra vanno verificati sulla relativa scheda tecnica.
- **Condizioni/controindicazioni:** la velocità si aumenta solo se diagnosticata bassa e nel limite di flusso/pressione della pressa; gli altri meccanismi richiedono interventi diversi. L’aumento temperatura stampo può allungare il ciclo; variazioni geometriche non sono azioni automatiche.
- **Stato:** cause e raccomandazioni sono verificati come contenuto della guida BASF; trasferibilità PA6/PA66 è indicativa a livello di famiglia, non grado; PP/ABS/PC restano non documentati da questa guida.

#### Bava / flash

- **Fonte letta:** BASF-IM-THERMOPLASTICS, §9 “Flash”, PDF p. 28 / stampata p. 28; illustrazione PDF p. 29 / stampata pp. 28–29.
- **Sintomo/cause riportate:** film sottile al parting line per penetrazione del melt negli interstizi/giunzioni. Cause elencate separatamente: clamp macchina insufficiente; fit tolerance eccessiva fra metà stampo/splits; superfici di tenuta danneggiate; cavity pressure elevata durante filling/holding; viscosità melt bassa per melt troppo caldo o degradazione (temperatura elevata, residence lungo o materiale umido); stampo che flette sotto pressione.
- **Raccomandazioni BASF lette e condizionate alla causa:** ripristinare clamp/capacità macchina solo se insufficiente; correggere fit e riparare le superfici se danneggiate; se cavity pressure è la causa, anticipare il transfer a holding e ridurre speed in particolare alla fine del fill; se viscosità bassa/degradazione, ridurre melt temperature/residence e asciugare secondo materiale; irrigidire la costruzione se lo stampo flette.
- **Applicabilità:** scope engineering thermoplastics, intro PDF/stampata p. 3; legenda p. 70 identifica PA6/PA66 come Ultramid, ma §9 non dà una tabella per grado. PP/ABS/PC non sono elencati nella legenda: loro applicabilità resta da verificare con il produttore specifico.
- **Condizioni/controindicazioni:** le alternative non sono cumulative: selezionare in base alla causa osservata. Più clamp può superare capacità/istruzioni pressa o mascherare un danno; melt più caldo è proposto solo per cavity pressure elevata in un caso, mentre va ridotto se abbassa viscosità o causa degradazione; ridurre speed è circoscritto alla pressione alta e fine fill e può peggiorare short shot.
- **Stato:** cause/raccomandazioni BASF verificate testualmente nel campo engineering thermoplastics; trasferibilità a grade specifici da verificare; non è una convalida della correzione software `-10%`.

#### Bruciature / burn marks

- **Fonte BASF letta:** §3 “Diesel effect / Burning”, PDF p. 10 / pagina stampata p. 10, figura PDF p. 11 / stampata pp. 10–11. Fonte distinta §18 “Streaks: Burning streaks”, PDF p. 52 / stampata p. 52, figura PDF p. 53 / stampata pp. 52–53. L’indice PDF p. 2 distingue entrambi i capitoli.
- **Diesel effect, sintomo e cause riportate:** discolorazioni nere locali a weld lines/fine flow path/ribs, talvolta incomplete fill, plate-out o corrosione; il melt comprime aria che non fugge da parting line/ejectors/vent inserts e la riscalda. Cause elencate: speed troppo alta, vent contaminati/ostruiti, aria che non sfugge al parting surface, venting insufficiente, fronti multipli che si incontrano.
- **Diesel effect, azioni BASF:** ridurre speed, eventualmente solo a fine fill con profilo graduated; pulire il sistema vent e migliorare gli sfiati; controllare posizione/efficacia canali, aggiungere vent/core pins se necessario; se il burn si trova vicino al parting surface e l’aria non può uscire lì, la guida indica ridurre clamp; rivedere flow pattern/gate/promoters per consentire escape dell’aria.
- **Fenomeno diverso “burning streaks”:** §18 PDF/stampata p. 52 descrive danno termico del polimero, gas e striature da ossidazione/degradazione oppure shear/frizione locale; cause: melt fuori finestra, residence troppo lungo o shear/flow-section. Rimedi: misurare melt rispetto alla finestra del grade, ridurre screw speed/back pressure o residence solo per le cause pertinenti; per shear ottimizzare speed/profile e controllare/allargare sezioni gate/sprue/hot-runner. Non identificare automaticamente questa voce con il diesel effect della sidebar.
- **Applicabilità:** guida BASF engineering thermoplastics, intro PDF/stampata p. 3; Ultramid PA6/PA66 nominato a PDF/stampata p. 70. L’illustrazione burning streaks include esempi Ultramid T e Ultrason, non una validazione universale dei compound PA. Covestro *Processing of TPU*, §3.2.3 PDF/stampata p. 14, è corroborazione solo TPU e resta fuori dai materiali target. PP/ABS/PC non risultano in legenda BASF.
- **Condizioni/controindicazioni:** non abbassare clamp automaticamente; la fonte limita quel rimedio al burn localizzato vicino al parting surface con escape impedito e va rispettato il setup/safety della pressa. Ridurre speed soltanto se eccessiva o secondo profilo causa-specifico: altre condizioni di short shot possono richiedere aumento se la velocità è insufficiente. Cambi melt/back pressure richiedono controllo della finestra del grade. La guida non fornisce percentuali universali.
- **Stato:** cause e rimedi letti integralmente nel campo generale BASF; applicabilità a PA6/PA66 non è grado-specifica, a PP/ABS/PC non documentata. Covestro è solo TPU.

#### Affossamenti / sink marks

- **Fonte letta:** BASF-IM-THERMOPLASTICS, §5 “Sink marks”, PDF p. 14 / pagina stampata p. 14; illustrazioni PDF pp. 15–17 / stampate pp. 14–17.
- **Sintomo/cause riportati:** depressione superficiale soprattutto presso aumento di spessore, nervature, cores, weld lines, throats, hot-runner nozzles o fine flow path; volume shrinkage locale tira la pelle verso l’interno. Può comparire dopo ejection quando il core caldo riscalda lo strato esterno solidificato. Distinzione da void: la sezione §12 “Voids” è separata nell’indice e descrive cavità interne.
- **Azioni BASF per compensazione insufficiente:** aumentare holding pressure; misurare gate-open time via peso o pressione e incrementare holding time finché peso/pressione cavità non variano più, poi tenerla oltre il gate-open time; ridurre melt e mold temperature per questa causa. Per geometria, evitare accumuli/salti di spessore e adattare nervature/sezioni; per cushion/perdita, controllare metering stroke/non-return valve/barrel e ampliare sezioni runner/gating; alimentare la sezione più spessa ove possibile.
- **Applicabilità:** scope generale engineering thermoplastics, intro PDF/stampata p. 3; Ultramid® PA6/PA66 e copolimeri nominati in legenda PDF/stampata p. 70; figura PDF p. 15 mostra sink da ribs in glass-fiber-reinforced Ultramid. Non è indicata la trasferibilità ad ogni grado PA, né PP/ABS/PC in legenda.
- **Condizioni/controindicazioni:** holding pressure/time da stabilire con gate-open e misure, non percentuale fissa. Aumento hold può contribuire a flash o superare pressioni ammesse; ridurre temperature solo entro finestra del grade. Modifiche di sezione/gate/nervature sono interventi di design, non ricalcolo.
- **Stato:** causa e raccomandazioni verificate come testo BASF; evidenza materiale specifica parziale per esempi Ultramid rinforzato/famiglia PA, non validata per tutti i grade PA né documentata per PP/ABS/PC.

#### Supporto delle attuali correzioni di velocità

Le fonti non convalidano quantitativamente gli override esistenti `+10%` Short Shot, `-10%` Burn Mark e `-10%` Flash. BASF supporta solo la direzione condizionata: aumentare speed se diagnosticata insufficiente per short shot; ridurla se eccessiva per diesel effect o se cavity pressure elevata è la causa del flash, in particolare verso fine riempimento. Nessuna fonte consultata propone le percentuali del software o le convalida per tutti i cinque materiali.

| Difetto | Override attuale (medium) | Riscontro fonte accessibile | Condizioni necessarie non attestate |
|---|---:|---|---|
| Short Shot | +10% | BASF, §22, PDF/stampata p. 60: “increase injection speed” solo se la velocità selezionata è bassa; inoltre diverse altre cause hanno rimedi differenti. Il +10% non compare. | Diagnosi della causa, pressione/portata e limite macchina; velocità più alta non è sempre il rimedio per perdita canali, dose, vent o gate. |
| Burn Mark | -10% | BASF, §3, PDF/stampata pp. 10–11: ridurre speed se troppo alta, eventualmente solo a fine filling. La sottovoce burning streaks §18 PDF/stampata p. 52 è distinta e raccomanda ottimizzare profilo solo per shear elevato. Il -10% non compare. | Localizzazione e causa (air compression vs thermal/shear damage), finestra materiale e limiti macchina; non automatizzare clamp o temperature sulla diagnosi del solo nome. |
| Flash | -10% | BASF, §9, PDF/stampata p. 28: ridurre speed soprattutto alla fine se cavity pressure è troppo alta; altre cause richiedono clamp/tolleranze/riparazione o melt/residence differenti. Il -10% non compare. | Identificare causa specifica; ridurre speed può causare short shot, aumento clamp deve restare nei limiti pressa e non corregge superfici danneggiate. |

Conclusione: le tre percentuali sono **euristiche non validate in produzione**. BASF documenta direzioni condizionate nel proprio campo generale engineering thermoplastics, ma non percentuali; il documento nomina PA6/PA66 attraverso Ultramid, non copre esplicitamente PP/ABS/PC nella legenda e non convalida ogni grade/compound. Covestro è TPU-specifico. Nessuna percentuale è promossa a regola validata e il motore resta invariato.

## Inventario dei moduli

| Fonte | ID/termini osservati | Significato e affidabilità |
|---|---|---|
| Pagina attiva `src/pages/Difetti.tsx` e `DEFECT_PAGE_CATALOG` | `short-shot`, `burn-mark`, `flash`, `sink-mark` | Quattro voci UI; non costituiscono da sole un catalogo tecnico. |
| Adapter centrale `src/defects/defectAdapter.ts` | `short_shot`, `burn_mark`, `flash`, `sink`, `warpage`; alias `SHORT_SHOT`, `BAVE`, `RITIRO`, `DEFORMAZIONE`, `SINK_MARKS` e varianti testuali | Mapping per il flusso della pagina; automazione attuale deliberatamente limitata alle correzioni di velocità collegate. |
| Motore difetti `src/defects/defectRules.ts` | `short_shot`, `burn_mark`, `flash`, `sink`, `warpage` | Funzione di patch; non tutte le sue componenti sono effettivamente usate dal flusso UI. |
| Regole lib legacy `src/lib/defects.ts` e `.js` | `short_shot`, `burn`, `flash`, `sink`, `warpage`, `weld_line`, `splay`, `voids`, `jetting`, `ejection_scuff` | Dieci chiavi con clamp locale su limiti macchina/materiale; schema parametri diverso dal motore attivo, delta da validare. |
| Catalogo legacy `src/data/defectRules.ts` | `short_shot`, `cicca_incompleto`, `linea_giunzione`, `linea_flusso`, `bruciature`, `bolle_aria`, `striature`, `lucido_opaco`, `sink_marks`, `rugosita`, `difetti_brillantezza`, `deformazioni`, `ritiro`, `bave`, `giunzione_stamp`, `sovrariscaldamento`, `materiale_degradato`, `inclusioni`, `peso_non_conforme`, `tolleranza`, `cold_slug`, `sfiato`, `superficie_opaca`, `superficie_lucida` | 24 etichette/regole, incluse callback e campi non dimostrati come supportati dal motore; non promuovere automaticamente. |
| Adapter/calcolo legacy `src/calc/defectRules.ts` | `SHORT_SHOT`, `BAVE`, `RITIRO`, `DEFORMAZIONE` | Quattro ID storici e correzioni su un altro schema di input. |
| Regole core `src/core/defectRules.ts` | `short-shot`, `flash` | Due regole; quella short-shot riduce il volume shot e flash restituisce input invariato, quindi non sono equivalenti al motore canonico. |
| Regole UI/AI `src/ai/defectRules.ts` | Short shot, Cicca/Incompleto, Bave, Bruciatura, Opacità superficie | Trasformano direttamente output e non costituiscono input di ricalcolo validato. |
| Analyzer `src/lib/analyzeDefectsLocal.ts`, `src/lib/adjustParametersLocal.ts` | bave, short shot/mancanza, burn/diesel, aria/air trap, bolle/vuoti/porosità, ritiro/sink, flow lines, warpage, weld/saldatura, delaminazione | Diagnosi e suggerimenti testuali/euristici, alcuni con percentuali arbitrarie; solo supporto esplorativo. |
| Tuning `src/lib/defectClampTuning.ts` | flash/bava, overpack, short shot, burn | Euristica separata di pressione cavità/safety factor; non è il mapping automatico della pagina. |
| Liste legacy `src/pages/Difetti/DefectList.tsx`, `src/components/DefectsList.tsx`, `src/_legacy_js/components/DefectsList.js` | SHORT_SHOT, BAVE, RITIRO, PUNTINATURA, DEFORMAZIONE; linee di flusso, jetting, striature argentate, incompletezza, imbarcamento, adesione da sottovuoto, colature, filamenti in materozza, piegature | UI legacy e pin manuali; termini, non regole di calcolo. |
| Pin legacy `src/data/defectPins.ts` | `short_shot`, `burn_marks`, `flashes`, `warpage`, `sink_marks`, `deformation` | Coordinate illustrative non ancorate; non usarle come posizione osservata. Nella pagina attiva la localizzazione avviene con raycasting Three.js sulla mesh. |
| `src/utils/calcEngine.ts` | Riempimento incompleto, Segni di ritiro, Bave, Bruciature, Jetting, Linea di giunzione, Imbarcamento, Striature umidità, Vuoti/Bolle, Graffi in estrazione | Motore alternativo/euristico con delta propri; inventariato ma fuori dalla pagina attiva. |

### Crosswalk proposto dei termini trovati

Le associazioni qui sotto servono a pianificare revisione e compatibilità; non sono tutte alias intercambiabili e non modificano il mapping eseguibile. I termini “correlato” richiedono una domanda diagnostica per distinguerli.

| Concetto candidato | Termini/ID raccolti da fonti diverse | Decisione richiesta |
|---|---|---|
| Mancato riempimento | `short-shot`, `short_shot`, `SHORT_SHOT`, `Short shot`, `Short Shot`, `Riempimento incompleto`, `Riempimento incompleto`, `Incompletezza`, `Mancanza`, `pezzi mancanti`, `Cicca / Incompleto`, `cicca_incompleto` | Verificare se cicca e short shot sono sinonimi o sottotipi legati a dose/materiale. |
| Bruciatura da aria / burn mark | `burn-mark`, `burn_mark`, `burn`, `bruciature`, `bruciatura`, `diesel`, `Bruciatura`, `Bruciature` | Separare combustione/aria compressa da degradazione termica del polimero. |
| Degradazione/surriscaldamento | `materiale_degradato`, `sovrariscaldamento`, `materiale degradato`, `materiale bruciato` | Non collassare nella voce burn senza evidenza sul materiale e sul luogo del difetto. |
| Bava / flash | `flash`, `bave`, `bava`, `BAVE`, `Bave`, `sbavatura`, `sormonto`, `fuga materiale`, `parting-line flash` | Tenere `giunzione_stamp` come possibile causa/guasto attrezzatura, non sinonimo. |
| Ritiro / sink mark | `sink-mark`, `sink_mark`, `sink_marks`, `sink`, `ritiro`, `RITIRO`, `Segni di ritiro`, `Segni d'affondamento`, `affossamento` | Distinguere sink superficiale da vuoto interno e peso/dimensione fuori target. |
| Imbarcamento | `warpage`, `deformazione`, `deformazioni`, `deformation`, `DEFORMAZIONE`, `Imbarcamento`, `Imbarcamento centrale` | Confermare che deformazione non indichi rottura o difetto geometrico di altro tipo. |
| Linea di giunzione | `weld_line`, `linea_giunzione`, `Linea di giunzione`, `Linea di giunzione debole`, `Linea di saldatura`, `Linea di giunzione` | Valutare separatamente linea estetica e saldatura strutturalmente debole. |
| Linee di flusso | `linea_flusso`, `Linee di flusso`, `flow lines`, `flowline`, `Linee di flusso` | Distinguere da weld line, jetting e striature da umidità. |
| Jetting | Parziale | BASF §7, PDF/stampata p. 22 (figure pp. 23–25): 3 cause (gate, condizioni di riempimento, spessori) con rimedi; nessun valore numerico. |
| Striature/splay | `splay`, `striature`, `Striature`, `Striature argentate`, `Striature (umidità)` | Tenere l’umidità come causa possibile, non assunto diagnostico. |
| Bolle/vuoti/porosità | `voids`, `bolle_aria`, `Bolle d'aria interne`, `Bolle`, `Vuoti`, `Vuoti/Bolle`, `porosità`, `poros` | Distinguere gas, umidità e vuoto da ritiro con esame del pezzo. |
| Intrappolamento aria/sfiato | `sfiato`, `air trap`, `linee aria`, `soffiature`, `difetti da sfiato insufficiente` | Correlazione causale con burn/short shot, non sinonimia automatica. |
| Finitura lucida/opaca | `lucido_opaco`, `difetti_brillantezza`, `superficie_opaca`, `superficie_lucida`, `Opacità superficie`, `Lucido opaco irregolare`, `opacità`, `lucida anomala` | Separare gloss, texture, contaminazione e trasferimento superficie. |
| Rugosità/puntinatura | `rugosita`, `Rugosità anomala`, `PUNTINATURA`, `puntinatura`, `pori superficiali` | Richiede classificazione visiva per non confonderla con porosità o inclusioni. |
| Fuori specifica dimensionale/peso | `peso_non_conforme`, `tolleranza`, `peso non conforme`, `dimensioni fuori tolleranza` | Sono risultati di misura, non una singola causa/difetto di processo. |
| Cold slug | `cold_slug`, `Cold Slug visibile`, `gelo`, `massa fredda al gate` | Confermare posizione e presenza del pozzetto freddo. |
| Inclusioni/contaminazione | `inclusioni`, `contaminazioni`, `Inclusioni / Contaminazioni` | Separare particelle, materiale incompatibile e degradazione. |
| Graffi/estrazione/adesione | `ejection_scuff`, `Graffi in estrazione`, `graffi`, `Adesione da sottovuoto`, `vacuum adhesion` | Adesione e graffio sono esiti distinti, benché possano condividere cause di sformo. |
| Colature e filamenti | `Colature di materiale`, `Formazione di filamenti nella materozza`, `drool`, `stringing` | Distinguere ugello, valvola, hot runner e materiale. |
| Piegature | `Piegature`, `fold marks` | Distinguere da weld line e fronti instabili. |
| Delaminazione | `delaminazione`, `delamin`, `delam`, `strati` | Identificare materiali/strati e compatibilità prima di unire ad altre voci. |
| Giunzione stampo aperta | `giunzione_stamp`, `Giunzione stampo non chiusa correttamente`, `mold mismatch` | Guasto macchina/attrezzatura e potenziale sicurezza; non automatizzare il clamp. |

### Copertura dell'inventario

La pagina attiva contiene quattro ID. Il crosswalk attuale li associa a short shot, burn mark, flash e sink; solo i primi tre hanno una correzione di velocità proposta nel percorso attivo, mentre sink è esplicitamente manuale. I moduli complessivi contengono ulteriori sinonimi e famiglie candidate sotto elencate. Il crosswalk è incompleto per termini quali puntinatura, adesione da sottovuoto, colature, filamenti, piegature, delaminazione e sovrariscaldamento/degradazione, che qui non ricevono ID implementativi nuovi.

La pagina attiva salva i nuovi pin soltanto quando il raycast colpisce una mesh: coordinate `model-local`, `drawingId`/versione CAD, difetto e gravità sono associati allo stesso record. Le coordinate illustrative della mappa legacy non vengono usate per la diagnosi; cambio CAD filtra i pin al nuovo identificativo.

Questo inventario non prova che tutte le cause siano coperte né che i sinonimi siano intercambiabili in ogni contesto. Per esempio “bruciatura da aria intrappolata” e “materiale degradato nel cilindro” possono avere sintomi simili ma richiedono domande diagnostiche diverse.

## Catalogo unico v1

Il catalogo eseguibile è `src/defects/defectCatalog.ts`: contiene 24 ID canonici, nomi, alias legacy, descrizioni, sintomi, criteri gravità 1–3, domande, fonti/limiti e stato di verifica/automazione. La normalizzazione degli alias fallisce esplicitamente in caso di collisione non risolta. La pagina Difetti filtra/mostra tutte le voci; il pin mesh usa l’ID canonico del catalogo.

Copertura attuale: **24 schede selezionabili, 13 parziali, 11 senza riscontro codificato**. Otto schede (short shot, burn/diesel, flash, sink, warpage, weld line, jetting, splay) hanno cause e azioni BASF lette nel relativo campo dichiarato; le azioni sono condizionali e non validate per ogni grade. Cinque schede parziali (air trap, dimensioni, graffi in estrazione, delaminazione, colature) hanno solo fonti di contesto TPU/hot-runner o un capitolo BASF non ancora codificato e non generano cause/azioni. Le restanti 11 non hanno cause codificate. Le schede senza cause verificate restituiscono solo lo stato documentale nel Knowledge Engine e zero raccomandazioni tecniche.

Automazione: le tre proposte legacy `+10%` Short Shot, `-10%` Burn, `-10%` Flash restano le sole correzioni percentuali disponibili; sono euristiche non validate e la gravità non ne moltiplica il valore. Sink resta manuale. Nessuna voce nuova abilita ricalcolo. `validated` continua a richiedere dati specifici di grado, pressa/vite, limiti, geometria e prova pezzo.

## Schede censite e stato documentale

Le 24 schede seguenti documentano il perimetro del catalogo. Causa/azione presente nel catalogo eseguibile soltanto quando è supportata dalle fonti descritte; le altre rimangono assenti e non vengono trasformate in consigli automatici. Le fonti TPU/hot-runner non si estendono oltre il loro ambito dichiarato.

### Stato documentale per scheda

“Parziale” significa che la fonte tecnica è stata letta integralmente e sostiene cause/raccomandazioni nel proprio ambito dichiarato, ma non dimostra l’applicabilità a ogni materiale/grade richiesto né a tutte le condizioni della scheda. Le parti non coperte restano in bozza.

| Scheda presente | Stato | Fonte e proposizione supportata / lacuna |
|---|---|---|
| Mancato riempimento | Parziale | BASF §22, PDF/stampata p. 60: cause e rimedi condizionali letti integralmente nel campo engineering thermoplastics; trasferibilità a materiale/grade specifico non validata. |
| Bruciature / effetto diesel | Parziale | BASF §3, PDF pp. 10–11 / stampate 10–11, letto integralmente; distinto da burning streaks §18, PDF/stampata p. 52. Trasferibilità grade-specifica da verificare. |
| Bave / flash | Parziale | BASF §9, PDF/stampata p. 28, cause e rimedi alternativi letti integralmente; scelta condizionata alla causa, senza validazione quantitativa per grade. |
| Segni di ritiro / sink | Parziale | BASF §5, PDF/stampata p. 14, cause e rimedi letti integralmente; figure includono Ultramid rinforzato, non prova per ogni grade. |
| Imbarcamento / warpage | Parziale | BASF §23, PDF/stampata p. 62 (figura p. 63): 6 cause con rimedi, alcuni indicati solo per non rinforzati o solo per fibra di vetro; trasferibilità a PP/ABS/PC e a grade specifici non dimostrata. COV-TPU-DEFECTS resta solo un indice. |
| Linea di giunzione / weld line | Parziale | BASF §1, PDF/stampata p. 4 (figure pp. 5–7): 3 cause (fronti freddi, sfiati, gate/geometria) con rimedi di processo e stampo; la weld line è spesso inevitabile e l’effetto sulla resistenza non è quantificato. I risultati “welding” di giunzione dei polimeri restano esclusi. |
| Linee di flusso / flow marks | Senza riscontro | Nessuna causa codificata; il manuale BASF ha capitoli affini (§19 Tiger lines, pp. 54–55) non ancora estratti: da non assimilare a flow marks senza lettura. |
| Jetting | Parziale | BASF §7, PDF/stampata p. 22 (figure pp. 23–25): 3 cause (gate, condizioni di riempimento, spessori) con rimedi; nessun valore numerico. |
| Striature argentate / splay | Parziale | BASF §16, PDF/stampata p. 46 (umidità, perdita d’acqua dello stampo, condensa) e §18, p. 52 (attrito localizzato, striature argentee); i limiti di umidità dipendono dal prodotto. |
| Vuoti, bolle e porosità | Senza riscontro | Nessuna causa codificata; il capitolo BASF §12 (pp. 38–39) compare nell’indice del manuale ma non è ancora stato estratto. Mantenuto distinto da sink. |
| Intrappolamento aria / sfiato | Parziale | COV-TPU-PROCESS supporta il ruolo dello sfiato per burn da aria compressa nel TPU; il capitolo BASF §11 Air entrapment (pp. 34–37) compare nell’indice ma non è stato estratto. Nessuna causa codificata. |
| Contaminazione / inclusioni | Senza riscontro | Nessuna causa codificata; il capitolo BASF §4 Black specks (pp. 12–13) compare nell’indice ma non è ancora stato estratto. |
| Degradazione / bruciatura del materiale | Senza riscontro | BASF §18 (p. 52) descrive le burning streaks da degradazione termica e già alimenta due cause della scheda Burn; la scheda dedicata non è ancora codificata. |
| Cold slug / materiale freddo al gate | Senza riscontro | Nessuna causa codificata; il capitolo BASF §10 (pp. 30–33) compare nell’indice ma non è ancora stato estratto. |
| Finitura lucida/opaca e brillantezza | Senza riscontro | Nessuna causa codificata; i capitoli BASF §8 Gloss variations (pp. 26–27) e §13 Dull spots (pp. 40–41) compaiono nell’indice ma non sono stati estratti. L’indice Covestro “Color defects” non prova gloss/opacità. |
| Rugosità anomala / puntinatura | Senza riscontro | L’indice menziona specks/dots in un frammento non verificabile nel contesto del PDF; nessuna causa/rimedio è supportato. |
| Peso fuori specifica | Senza riscontro | Nessuna fonte OEM specifica acquisita. |
| Dimensioni fuori tolleranza | Parziale | COV-TPU-DEFECTS ha sezione “Defects in dimensions” a p. 4 nell’indice; cause e azioni specifiche non verificate. |
| Graffi e difetti di estrazione | Parziale | COV-TPU-DEFECTS contiene “Demolding defects” (p. 9) e menziona ejector marks; il capitolo BASF §6 (pp. 18–21) compare nell’indice ma non è stato estratto. Nessuna causa codificata. |
| Lineamenti da delaminazione | Parziale | BASF §2 (p. 8) descrive la delaminazione come distacco degli strati superficiali per shear eccessivo in melt relativamente freddo con stampo freddo; cause e rimedi non ancora codificati. Un estratto COV-TPU-DEFECTS la definisce come distacco/scagliatura dello strato superficiale. |
| Colature e filamenti in materozza | Parziale | MM-HR-TROUBLE menziona controllo del drooling e contaminazione cavità in un hot-runner troubleshooting guide; non dimostra cause/rimedi generali o filamenti a ugello. |
| Piegature / fold marks | Senza riscontro | Nessuna fonte OEM specifica acquisita. |
| Adesione da sottovuoto | Senza riscontro | La sezione generale demolding non prova il meccanismo specifico del vuoto/venting. |
| Giunzione stampo non chiusa | Senza riscontro | Nessuna fonte OEM specifica acquisita; resta una verifica attrezzatura/sicurezza, non una correzione di processo. |

Conteggio sulle 24 schede effettivamente presenti: **0 verificate integralmente, 13 parziali, 11 senza riscontro codificato**.

### Tracciabilità delle cause e azioni

Questa matrice specifica cosa è effettivamente sostenuto dalle fonti. Per le prime quattro voci attive sono state lette integralmente le sezioni BASF citate; le cause e azioni non coperte da quelle sezioni o non applicabili con certezza al grado restano ipotesi. Per le altre schede i riferimenti possono essere indici o estratti e sono indicati come tali.

| Scheda | Causa supportata dalla fonte | Azione supportata dalla fonte | Cause/azioni della scheda ancora non supportate |
|---|---|---|---|
| Mancato riempimento | BASF-IM-THERMOPLASTICS §22, PDF/stampata p. 60: dose/cushion, velocità bassa, restrizioni di flusso, temperatura melt/stampo, sfiati (5 cause codificate). | Verifiche e azioni condizionate alla causa: misura prima di agire, melt prima dello stampo, velocità solo se confermata bassa e nei limiti pressa. | Non codificate: parete sottile o percorso lungo, zona sottile che congela vicino al gate, flowability insufficiente; applicabilità a PP/ABS/PC e a grade PA. |
| Bruciature / effetto diesel | BASF §3, pp. 10–11 (diesel: aria compressa, sfiati, piano di divisione) e §18, p. 52 (degradazione termica e shear): fenomeni distinti con domande separate. | Controlli sfiati/aria per il diesel; temperatura melt, permanenza e sezioni di flusso per §18; clamp solo vicino al piano di divisione con aria che non esce. Risposte su più fenomeni generano una richiesta di chiarimento, non un’esclusione. | Velocità troppo alta e fronti multipli compaiono solo nelle azioni, senza causa dedicata; applicabilità ai materiali target e range macchina. |
| Bave / flash | BASF §9, p. 28: gap/superfici di tenuta, flessione stampo, clamp, pressione cavità, viscosità (5 cause codificate). | La guida associa rimedi diversi alla causa; le alternative non sono cumulative. | Trasferibilità al grade e alla pressa; ridurre la velocità può causare short shot. |
| Segni di ritiro / sink | BASF §5, p. 14: spessore/ritiro locale, holding più breve del gate-open (condizione misurata, non dimostrata come causa), comparsa dopo estrazione. | Misura di gate-open, poi verifica se il sink cambia; interventi geometrici solo con revisione pezzo/stampo. | Non codificate: assenza di melt cushion, perdita di pressione, gate in parete sottile, temperature melt/stampo; nessuna percentuale di pack fornita. |
| Imbarcamento / warpage | BASF §23, p. 62: temperature stampo, spessori, gradiente di pressione, estrazione a caldo, materiale, orientamento fibre (6 cause). | Rimedi condizionati e spesso limitati a non rinforzati o a fibra di vetro; interventi di design/stampo non automatici. | Valori di temperatura e tempo non indicati; quali grade siano a bassa deformazione non indicato. COV-TPU-DEFECTS non fornisce cause. |
| Linea di giunzione / weld line | BASF §1, p. 4 (figure pp. 5–6): fronti freddi, sfiati, gate/geometria (3 cause). | Temperatura melt, commutazione a holding, velocità (solo senza problemi di sfiato), pulizia sfiati; spostamento gate solo dopo studio moldflow. | Effetto sulla resistenza non quantificato; la BASF indica una soglia di commutazione numerica che non è stata adottata come parametro. |
| Linee di flusso / flow marks | Nessuna causa verificata in fonte OEM acquisita. | Nessuna azione verificata. | Fronte, temperatura, velocità, gate e finitura restano ipotesi. |
| Jetting | BASF §7, p. 22: gate non adatto, condizioni di riempimento, salti di spessore (3 cause). | Gate che faccia urtare il melt contro un ostacolo, sezione e raccordo del gate, velocità/temperatura melt, spessori. | Nessun valore per velocità/temperatura; applicabilità per materiale non indicata. |
| Striature argentate / splay | BASF §16, p. 46 (umidità, perdita d’acqua, condensa) e §18, p. 52 (attrito localizzato). | Misura e essiccazione sotto il limite del prodotto, riparazione perdite, temperatura sotto la tramoggia, sezioni di gate/sprue/hot runner. | Limite di umidità e finestra di temperatura dipendono dal prodotto e non sono indicati; umidità e attrito possono coesistere (richiesta di chiarimento). |
| Vuoti, bolle e porosità | Nessuna causa verificata in fonte OEM acquisita. | Nessuna azione verificata. | Ritiro, gas, umidità, pack e venting restano ipotesi; non sono stati assimilati a sink. |
| Intrappolamento aria / sfiato | [COV-TPU-PROCESS](https://solutions.covestro.com/-/media/covestro/solution-center/brands/downloads/imported/1557310236.pdf?rev=e83e64d53f8547f081aa8b34384b9b49&hash=63E74D19279864976EE8C513CF9223A9) supporta soltanto il nesso tra aria compressa e burn mark in TPU. | La fonte dà supporto qualitativo al ruolo dello sfiato per quel caso TPU; non specifica dimensionamento/manutenzione dello sfiato. | Altri air trap, sfiati ostruiti, linee di saldatura e interventi sullo stampo non sono dimostrati. |
| Contaminazione / inclusioni | Nessuna causa verificata in fonte OEM acquisita. | Nessuna azione verificata. | Lotto, riciclo, pulizia e filtrazione restano ipotesi. |
| Degradazione / bruciatura del materiale | BASF §18, p. 52 descrive la degradazione termica del melt (usata nella scheda Burn); scheda dedicata non ancora codificata. | Nessuna azione codificata su questa scheda. | Temperatura, residence, idrolisi, purga e contaminazione restano senza codifica per grade. |
| Cold slug / materiale freddo al gate | Nessuna causa verificata in fonte OEM acquisita. | Nessuna azione verificata. | Gate, pozzetto freddo, canale e temperature restano ipotesi. |
| Finitura lucida/opaca e brillantezza | L’indice COV-TPU-DEFECTS ha una categoria generale “Color defects” (p. 16); non equivale a gloss/opacità. Nessuna causa specifica è supportata. | Nessuna azione verificata. | Texture, temperatura, contaminazione, venting e gloss restano senza riscontro specifico. |
| Rugosità anomala / puntinatura | Nessun supporto sufficiente. Un estratto su “specks and dots” non è stato ottenuto con contesto verificabile; non viene usato come citazione. | Nessuna azione verificata. | Morfologia, particelle, pori e finitura restano ipotesi. |
| Peso fuori specifica | Nessuna causa verificata in fonte OEM acquisita. | Nessuna azione verificata. | Dose, cushion, pack, gate freeze e densità restano ipotesi. |
| Dimensioni fuori tolleranza | COV-TPU-DEFECTS contiene nell’indice la sezione “Defects in dimensions” (p. 4); il titolo prova l’ambito, non una causa specifica. | Nessuna azione verificata dall’indice. | Ritiro, condizionamento, pack, misura e usura non sono collegati a un passaggio leggibile. |
| Graffi e difetti di estrazione | COV-TPU-DEFECTS contiene nell’indice “Demolding defects” (p. 9) e un risultato indicizzato descrive ejector marks; causa specifica non verificata. | Nessuna azione verificata. | Draft, vuoto, temperatura, raffreddamento ed espulsori non sono ancora collegati a una sezione leggibile. |
| Lineamenti da delaminazione | COV-TPU-DEFECTS include in un estratto una descrizione: distacco/scagliatura dello strato superficiale, anche in aree estese o localizzate. | Nessuna azione verificata. | Incompatibilità, contaminazione, umidità, degradazione e shear non sono supportati dall’estratto disponibile. |
| Colature e filamenti in materozza | [MM-HR-TROUBLE](https://www.moldmasters.com/sites/default/files/2020-09/Hot%20Runner%20Troubleshooting%20Guide.pdf) tratta il controllo del drooling nel contesto hot-runner; il manuale risulta di 28 pagine e il risultato riporta copyright 2020. | L’estratto supporta il controllo “check for drooling” e un controllo di contaminazione cavità; non fornisce causa/rimedio completo nel frammento. | Non generalizzare a ugelli non hot-runner, stringing, decompressione o cause materiali senza la sezione integrale. |
| Piegature / fold marks | Nessuna causa verificata in fonte OEM acquisita. | Nessuna azione verificata. | Fronti, gate, ostacoli e sovrapposizione con weld line restano ipotesi. |
| Adesione da sottovuoto | La categoria generale demolding di COV-TPU-DEFECTS non dimostra specificamente un meccanismo di vuoto. | Nessuna azione verificata. | Vacuum, venting, draft e ritiro restano ipotesi distinte non coperte dalla fonte accessibile. |
| Giunzione stampo non chiusa | Nessuna causa verificata in fonte OEM acquisita. | Nessuna azione verificata. | Setup/clamp/usura/sicurezza restano da supportare con manuale della pressa e documentazione del toolmaker. |

### Cause eseguibili attuali delle otto schede con cause (`src/defects/defectCatalog.ts`)

Fonte per tutte le righe: BASF, *Injection-Molding Problems in Engineering Thermoplastics* (31.07.2009), riletta direttamente il 2026-10-20; PDF = pagina stampata. Ambito dichiarato: engineering thermoplastics. La legenda a p. 70 nomina Ultramid (PA6/PA66/PA6/66/PA6/6T) e non PP/ABS/PC; la guida non associa i rimedi a singoli grade e non fornisce valori utilizzabili come correzione automatica. Un “Sì” conferma solo la condizione scritta nella domanda; non dimostra che sia l’unica causa e ogni azione resta una verifica o una valutazione, mai una correzione automatica. Il campo `materialLimit` di ogni causa riporta il limite per materiale dichiarato dalla fonte (es. “solo non rinforzati”) o l’assenza di limiti indicati.

| Scheda | ID causa | ID domanda | Condizione che il “Sì” conferma | Sezione BASF | Limiti di applicabilità |
|---|---|---|---|---|---|
| Short shot | `dose-cushion` | `dose-cushion` | Dose o cushion insufficienti/instabili | §22, p. 60 | Misura sul ciclo reale; nessun valore universale. |
| Short shot | `low-injection-speed` | `injection-speed-too-low` | Velocità d’iniezione troppo bassa, per misura o confronto con il processo di riferimento | §22, p. 60 | Aumento solo se confermata e entro i limiti pressa/portata. |
| Short shot | `flow-restriction` | `flow-restriction` | Restrizione in gate/canali o sezione sottile osservata | §22, p. 60 | Modifiche di sezione solo dopo conferma; non dedotte dal pin. |
| Short shot | `low-melt-or-mold-temperature` | `low-melt-or-mold-temperature` | Temperatura melt o stampo misurata sotto la finestra del grade | §22, p. 60 | Prima melt, poi stampo (può allungare il ciclo); finestra del grade richiesta. |
| Short shot | `inadequate-venting` | `inadequate-venting` | Sfiati ostruiti o insufficienti osservati | §22, p. 60 | Dimensionamento dello sfiato con il costruttore stampo. |
| Burn | `compressed-air` (diesel) | `diesel-localized-black-mark` | Macchia nera localizzata (fine riempimento, nervature, fronti confluenti) senza striature marroni o argentee estese o attorno al gate | §3, pp. 10–11 | Compatibile con diesel, non provato dal pin. |
| Burn | `blocked-venting` (diesel) | `venting-obstruction` | Sfiati ostruiti o via di fuga dell’aria insufficiente | §3, pp. 10–11 | Verifica sullo stampo. |
| Burn | `parting-line-air-release` (diesel) | `parting-line-trap` | Burn vicino al piano di divisione con aria che non può uscire | §3, pp. 10–11 | La riduzione del clamp è citata solo per questo caso, entro limiti macchina/stampo. |
| Burn | `thermal-degradation` | `thermal-degradation-evidence` | Striature da marrone chiaro a molto scuro e temperatura melt o permanenza fuori finestra (o fermo macchina) | §18, p. 52 | Fenomeno distinto dal diesel; la domanda combina aspetto e dato di processo. |
| Burn | `high-shear-streaks` | `shear-streaks` | Striature argentee limitate a sezioni di flusso ridotte o a ostacoli | §18, p. 52 | Fenomeno distinto dal diesel; sezioni da confrontare con il progetto. |
| Flash | `parting-gap-or-damage` | `parting-gap-found` | Gap anomalo, fit fuori tolleranza o superficie di tenuta danneggiata riscontrati | §9, p. 28 | Non compensare un danno aumentando il clamp. |
| Flash | `high-cavity-pressure` | `high-cavity-pressure` | Misura o dato macchina che indica pressione cavità elevata | §9, p. 28 | Le alternative BASF non sono cumulative; ridurre la velocità può causare short shot. |
| Flash | `low-melt-viscosity` | `melt-condition` | Temperatura, permanenza o umidità fuori finestra per il grade | §9, p. 28 | Agire solo sulla variabile fuori finestra. |
| Flash | `mold-deflection` | `mold-deflection` | Flessione o apertura dello stampo sotto pressione riscontrata | §9, p. 28 | Interventi costruttivi solo con il costruttore stampo. |
| Flash | `insufficient-clamp` | `clamp-insufficient` | Clamp insufficiente confermato rispetto ai limiti macchina | §9, p. 28 | Intervento solo se autorizzato e nei limiti pressa. |
| Sink | `thick-section-shrinkage` | `thick-section` | Affossamento presso sezione spessa, nervatura o cambio di spessore osservato | §5, p. 14 | Interventi geometrici richiedono revisione pezzo/stampo. |
| Sink | `insufficient-holding` | `holding-shorter-than-gate-open` | Misura di peso o pressione cavità che indica holding più breve del gate-open | §5, p. 14 | Non dimostra la causa dell’affossamento: l’azione chiede di verificare se il sink cambia e di indagare le altre cause (geometria, cushion, perdite di pressione). |
| Sink | `post-ejection-hot-core` | `after-ejection` | Segno che compare o peggiora dopo l’estrazione | §5, p. 14 | Conferma solo la tempistica; il calore residuo resta ipotesi. |
| Warpage | `uneven-mold-temperature` | `mold-half-temperature-unfavorable` | Temperature stampo impostate o misurate su metà e nuclei sfavorevoli o non uniformi rispetto al riferimento | §23, p. 62 | BASF: soluzione spesso utile solo per non rinforzati; nessun valore. |
| Warpage | `wall-thickness-differences` | `wall-thickness-variation` | Spessori diversi o salti di spessore nella zona deformata | §23, p. 62 | Intervento di design, non automatico. |
| Warpage | `high-pressure-gradient` | `pressure-gradient-high` | Gradiente di pressione elevato per dato di processo o simulazione | §23, p. 62 | Iniezione in più punti indicata solo per non rinforzati. |
| Warpage | `demolded-too-hot` | `demolded-too-hot` | Pezzo estratto troppo caldo e deformazione che compare o aumenta dopo l’estrazione | §23, p. 62 | Verificare anche trattenimento/controsformo; nessun tempo di raffreddamento indicato. |
| Warpage | `warpage-prone-material` | `material-warpage-tendency` | Scheda tecnica con differenza marcata tra ritiro longitudinale e trasversale | §23, p. 62 | La fonte non dice quali grade siano a bassa deformazione. |
| Warpage | `fiber-orientation-variation` | `fiber-orientation-changes` | Materiale con fibra di vetro e orientamento variabile secondo simulazione/analisi del flusso | §23, p. 62 | Solo termoplastici rinforzati con fibra di vetro. |
| Weld line | `cold-melt-fronts` | `weld-cold-fronts` | Misura o dato di processo che indica temperatura o pressione troppo basse dove i fronti si incontrano | §1, p. 4 | Più evidente in parti scure/trasparenti lucide, con fibra di vetro o pigmenti effetto; velocità da aumentare solo senza problemi di sfiato. |
| Weld line | `weld-venting` | `weld-venting-problem` | Sfiati nella zona della weld line ostruiti o insufficienti | §1, p. 4 | Con problemi di sfiato la fonte indica di ridurre, non aumentare, la velocità. |
| Weld line | `weld-gate-or-geometry` | `weld-geometry-cause` | Weld line in corrispondenza di foro, più punti di iniezione, alimentazione opposta o cambio di spessore | §1, p. 4; figure pp. 5–6 | Spostare la linea richiede modifiche di stampo, prima studio moldflow; la weld line è spesso inevitabile. |
| Jetting | `jetting-gate-design` | `jetting-gate-design` | Melt che esce in cavità libera senza ostacolo vicino o con transizione gate-pezzo non raccordata | §7, p. 22; figure pp. 23–25 | Modifiche di gate con il costruttore stampo. |
| Jetting | `jetting-fill-conditions` | `jetting-process-conditions` | Riempimento iniziale troppo veloce o melt troppo freddo rispetto al riferimento | §7, p. 22 | Nessun valore o percentuale; finestra del grade da verificare. |
| Jetting | `jetting-thickness-jump` | `jetting-thickness-jump` | Cambi bruschi di spessore lungo il percorso dopo il gate | §7, p. 22 | Intervento di design. |
| Splay | `residual-moisture` | `moisture-above-limit` | Umidità misurata sopra il limite del prodotto o essiccatore non funzionante | §16, p. 46 | Il limite dipende dal prodotto e non è indicato per PP, ABS, PC, PA6, PA66. |
| Splay | `mold-water-leak` | `mold-coolant-leak-found` | Perdita d’acqua del circuito di temperatura verso la cavità riscontrata | §16, p. 46 | Depressione sui regolatori solo come soluzione temporanea. |
| Splay | `hopper-zone-condensation` | `hopper-zone-too-cold` | Zona sotto la tramoggia troppo fredda con condensa visibile | §16, p. 46 | Finestra di temperatura del materiale non indicata. |
| Splay | `local-friction` | `local-friction-silver-streaks` | Striature argentee limitate a sezioni di flusso ridotte o a ostacoli | §18, p. 52 | Fenomeno distinto dall’umidità. |

Le quattro schede Warpage, Weld line, Jetting e Splay hanno inoltre domande di contesto senza causa (`causeId: null`) con ID espliciti: `warpage.deviation-measured`, `warpage.side-cavity-difference`, `weld_line.strength-measured`, `weld_line.location-vs-gate`, `jetting.starts-at-gate`, `jetting.first-fill-phase-only`, `splay.persists-after-documented-drying`, `splay.all-cavities-or-single-point`, `splay.parabolic-streaks-flow-direction`. Non producono cause né azioni.

**Fenomeni che possono coesistere (Burn: diesel, degradazione termica, shear; Splay: umidità e attrito).** Nessuna risposta ne esclude un’altra e le cause dichiarate restano tutte diagnosticate. Se per lo stesso pin sono dichiarati “Sì” due dei fenomeni del gruppo, la pagina mostra una richiesta di chiarimento (`role="status"`) e il motore aggiunge la raccomandazione `defect-clarification:*`: chiede se i fenomeni riguardano zone o segni diversi (in tal caso un pin per ciascuno) e, solo se riguardano lo stesso segno, propone il controllo discriminante su aspetto e posizione secondo BASF §3, §16 e §18. Non si conclude che siano incompatibili.

**Risposte salvate e ID ritirati.** Le risposte correnti vivono solo nello stato della pagina; in `localStorage` (`future-molding-defect-evaluations-v1`, versione 1) restano come storico nelle valutazioni e non rientrano nella diagnosi. La migrazione v1 usa solo la mappa storica esplicita e immutabile `LEGACY_QUESTION_ID_MAP` (vecchio ID `<scheda>-qN` → ID attuale della stessa domanda), valida soltanto per la scheda con quel prefisso: `warpage-q1` non è accettato come domanda di Jetting. Ogni ID non riconosciuto, compreso `catalog-question-N` perché privo di prefisso, resta in `legacyAnswers`. Se esistono sia il vecchio sia l’attuale ID, prevale la risposta dell’ID attuale e la vecchia resta in `legacyAnswers`. Riordinare o inserire domande nel catalogo non cambia la conversione. Non sono trasferite le risposte alle domande il cui significato è cambiato: `low-injection-speed`, `localized-end-fill`, `thermal-damage` (domanda combinata, non assegnata alle nuove cause termica e shear), `tool-fit`, `gate-open-measured` (un “Sì” indicava solo la misura eseguita). La pagina chiede di rispondere alle nuove domande.

### Mancato riempimento
- ID/sinonimi: `short-shot`, `short_shot`, `SHORT_SHOT`, `short shot`, `Incompletezza`, `Cicca / Incompleto`, `cicca_incompleto`, `Riempimento incompleto`, `Mancanza`, `pezzi mancanti`.
- Stato: scheda con 5 cause BASF §22 (p. 60), domande con ID espliciti e azioni ordinate; vedi la tabella delle cause eseguibili. Verifica documentale parziale.
- Automazione: solo la proposta legacy `+10%` sulla velocità, euristica non validata e non derivata da BASF; la gravità non la moltiplica.
- Lacune: parete sottile o percorso lungo, zona sottile che congela vicino al gate e flowability insufficiente (BASF §22) non sono codificate; nessuna validazione per PP/ABS/PC o grade PA.

### Bruciature / effetto diesel
- ID/sinonimi: `burn-mark`, `burn_mark`, `burn`, `bruciature`, `bruciatura`, `diesel`, segni di bruciatura.
- Stato: 5 cause BASF in due fenomeni distinti: diesel (§3, 3 cause) e degradazione termica/shear (§18, 2 cause), con domande e azioni separate. Possono coesistere: due fenomeni dichiarati insieme producono una richiesta di chiarimento sulle zone o i segni, senza esclusioni.
- Automazione: solo la proposta legacy `-10%` sulla velocità, euristica non validata; temperatura e contropressione non sono mai modificate in automatico.
- Lacune: velocità troppo alta e fronti multipli compaiono solo nelle azioni; la scheda “Degradazione / bruciatura del materiale” non è ancora codificata.

### Bave / flash
- ID/sinonimi: `flash`, `bave`, `bava`, `BAVE`, sbavatura, sormonto, fuga materiale, parting-line flash; `giunzione_stamp` è correlato, non sinonimo.
- Stato: 5 cause BASF §9 (p. 28): gap/superfici di tenuta, pressione cavità, viscosità, flessione stampo, clamp. Alternative non cumulative.
- Automazione: solo la proposta legacy `-10%` sulla velocità, euristica non validata; il clamp non viene aumentato in automatico.
- Lacune: trasferibilità a grade e pressa non dimostrata.

### Segni di ritiro / sink
- ID/sinonimi: `sink-mark`, `sink_mark`, `sink_marks`, `sink`, `ritiro`, `RITIRO`, affossamento, segni d’affondamento.
- Stato: 3 cause BASF §5 (p. 14). La condizione “holding più breve del gate-open” è misurata ma non è dimostrata come causa: l’azione chiede di verificare se il sink cambia e di indagare le altre cause.
- Automazione: manuale; nessun delta automatico di pack o temperatura.
- Lacune: assenza di melt cushion, perdita di pressione, gate in parete sottile e temperature non sono codificati; nessun valore di holding fornito dalla fonte.

### Imbarcamento / warpage
- ID/sinonimi: `warpage`, `deformazione`, `deformazioni`, `deformation`, `DEFORMAZIONE`, imbarcamento, imbarcamento centrale.
- Stato: 6 cause BASF §23 (p. 62), sintomi, 2 domande di contesto e 6 domande di causa con ID espliciti. Verifica documentale parziale.
- Limiti per materiale: temperature differenziate e iniezione in più punti solo per non rinforzati; orientamento delle fibre solo per rinforzati con fibra di vetro; la fonte non indica grade a bassa deformazione.
- Automazione: nessuna; nessuna equalizzazione automatica di temperature.
- Lacune: nessun valore di temperatura o tempo di raffreddamento; l’indice Covestro TPU resta solo contesto.

### Linea di giunzione / weld line
- ID/sinonimi: `weld_line`, linea di giunzione, linea di saldatura, `linea_giunzione`, linea di giunzione debole.
- Stato: 3 cause BASF §1 (p. 4; figure pp. 5–7): fronti freddi, sfiati, gate/geometria; la weld line è spesso inevitabile e la scheda lo dichiara.
- Limiti per materiale: più evidente in parti scure o trasparenti lucide, con fibra di vetro o pigmenti effetto; l’effetto sulla resistenza non è quantificato.
- Automazione: nessuna; la soglia numerica di commutazione citata dalla fonte non è stata adottata come parametro.
- Lacune: nessun valore per melt e velocità; effetto sulla resistenza da provare separatamente.

### Linee di flusso / flow marks
- ID/sinonimi: `linea_flusso`, linee di flusso, flow lines, flowline, striature di flusso.
- Sintomi/domande: bande o variazione di lucentezza lungo il fronte? Seguono gate o cambi sezione? Appaiono solo su una cavità?
- Cause probabili: raffreddamento/fronte instabile, variazioni di velocità o temperatura, gate/sezione, superficie stampo.
- Azioni ordinate: processo: correlare difetto a fasi e trend; materiale: confermare grade e finestra termica; stampo: gate, finitura e raffreddamento.
- Ricalcolo: escluso finché non è distinto da weld line, jetting o silver streak.
- Fonte OEM richiesta: guida resina su estetica/fronti e finitura; costruttore stampo su gate/superficie. Stato: pending.

### Jetting
- ID/sinonimi: `jetting`, getto, serpentina.
- Stato: 3 cause BASF §7 (p. 22; figure pp. 23–25): gate, condizioni di riempimento, salti di spessore. 2 domande di contesto e 3 di causa.
- Limiti per materiale: la fonte non indica limiti per materiale né valori.
- Automazione: nessuna; l’engine espone solo un override aggregato di velocità, non un profilo multistadio.
- Lacune: nessun valore per velocità e temperatura; applicabilità a PP/ABS/PC non dimostrata.

### Striature argentate / splay
- ID/sinonimi: `splay`, striature, striature argentate, striature da umidità, silver streaks.
- Stato: 4 cause BASF: umidità, perdita d’acqua e condensa (§16, p. 46), attrito localizzato (§18, p. 52). 3 domande di contesto e 4 di causa.
- Limiti per materiale: il limite di umidità dipende dal prodotto e la fonte non lo indica per PP, ABS, PC, PA6, PA66; finestra di temperatura sotto la tramoggia non indicata.
- Automazione: nessuna; nessun valore di essiccazione o temperatura.
- Lacune: umidità e attrito possono coesistere: la pagina chiede il chiarimento su zone o segni diversi.

### Vuoti, bolle e porosità
- ID/sinonimi: `voids`, `bolle_aria`, bolle, vuoti, porosità, `materiale_degradato` (da distinguere).
- Sintomi/domande: cavità interne o bolla superficiale? Posizione al centro di sezioni spesse o presso gate? Gas/umidità o vuoto da ritiro?
- Cause probabili: ritiro non compensato, umidità/volatili, degradazione, aria intrappolata.
- Azioni ordinate: processo: correlare con pack/gate freeze; materiale: essiccazione e contaminazione; stampo: sfiati, gate, spessori e raffreddamento.
- Ricalcolo: manuale finché il tipo di vuoto non è identificato; non aumentare pack automaticamente senza limite pressione e prova sul pezzo.
- Fonte OEM richiesta: resina (drying, volatili, shrinkage) e stampo (venting/gate). Stato: pending.

### Intrappolamento aria / sfiato
- ID/sinonimi: `sfiato`, air trap, linee aria, soffiature, aria intrappolata.
- Sintomi/domande: difetto in fine riempimento o punto cieco? Presenza di bruciatura, bolla o mancato riempimento nella stessa zona?
- Cause probabili: sfiati assenti/ostruiti, fronti che chiudono una tasca, velocità locale.
- Azioni ordinate: processo: osservare sequenza di riempimento; materiale: distinguere volatili; stampo: ispezione e progettazione sfiato da parte del toolmaker.
- Ricalcolo: escluso come correzione automatica del setpoint; è primariamente verifica/manutenzione stampo.
- Fonte OEM richiesta: manuale stampo e guida pressa sul profilo; fonte produttore materiale se vi sono gas/volatili. Stato: pending.

### Contaminazione / inclusioni
- ID/sinonimi: `inclusioni`, inclusioni, contaminazioni, particelle estranee.
- Sintomi/domande: particella visibile o difetto cromatico? Ricorre per lotto, tramoggia o macchina? Presente in tutte le cavità?
- Cause probabili: materiale estraneo, riciclo, pulizia o degradazione.
- Azioni ordinate: processo: isolare lotto e purga; materiale: tracciabilità/grade; macchina: pulizia e controllo filtrazione/alimentazione.
- Ricalcolo: escluso; non compensare contaminazione con setpoint.
- Fonte OEM richiesta: specifica resina/handling e procedura macchina di cambio materiale. Stato: pending.

### Degradazione / bruciatura del materiale
- ID/sinonimi: `materiale_degradato`, materiale degradato, materiale bruciato, sovrariscaldamento materiale.
- Sintomi/domande: degradazione diffusa, odore, colore o proprietà alterate? Il difetto segue un lungo arresto o un lotto specifico?
- Cause probabili: temperatura o permanenza fuori specifica, umidità per polimeri sensibili, contaminazione.
- Azioni ordinate: processo: controllare temperature effettive e residence; materiale: consultare finestra, drying e compatibilità; macchina: purga e verifica zone.
- Ricalcolo: escluso finché non sono noti grade e temperature reali; le temperature attuali dell’engine non sono clampate al range materiale.
- Fonte OEM richiesta: guida specifica del polimero e grade, sezione drying/degradation/residence. Stato: pending.

### Cold slug / materiale freddo al gate
- ID/sinonimi: `cold_slug`, cold slug, gelo, massa fredda visibile.
- Sintomi/domande: inclusione/segno vicino al gate? Il pozzetto freddo è presente e dimensionato? Ricorre a ogni ciclo?
- Cause probabili: pozzo freddo/gate, canale o ugello sotto finestra, purge/start-up.
- Azioni ordinate: processo: registrare avviamento e temperature; materiale: verificare finestra; stampo: pozzetto freddo e alimentazione.
- Ricalcolo: manuale; non aumentare melt automaticamente senza range del grade e misura temperatura.
- Fonte OEM richiesta: guida resina e costruttore stampo su cold slug well/gate. Stato: pending.

### Finitura lucida/opaca e brillantezza
- ID/sinonimi: `lucido_opaco`, `difetti_brillantezza`, `superficie_opaca`, `superficie_lucida`, opacità, gloss non uniforme.
- Sintomi/domande: gloss basso/alto o variazione localizzata? Coincide con variazione di texture, temperatura o fronte? Stessa finitura su tutte le cavità?
- Cause probabili: trasferimento superficie/temperatura, materiale, contaminazione, venting o shear.
- Azioni ordinate: processo: confrontare ciclo e setpoint reali; materiale: grade/colorante/additivi; stampo: texture, lucidatura e temperatura uniforme.
- Ricalcolo: escluso senza target gloss e range materiale/stampo misurati.
- Fonte OEM richiesta: guida di stampaggio e scheda grade/colorante, più specifica di finitura del toolmaker. Stato: pending.

### Rugosità anomala / puntinatura
- ID/sinonimi: `rugosita`, rugosità, puntinatura, pori superficiali.
- Sintomi/domande: difetto distribuito o puntuale? È particella, poro o texture trasferita? Cambia tra cavità?
- Cause probabili: superficie stampo, contaminazione/volatili, riempimento o materiale.
- Azioni ordinate: processo: documentare posizione e ciclo; materiale: verificare pulizia e grade; stampo: esaminare lucidatura, coating e sfiati.
- Ricalcolo: escluso finché la morfologia non è classificata.
- Fonte OEM richiesta: specifica finitura stampo e guida handling resina. Stato: pending.

### Peso fuori specifica
- ID/sinonimi: `peso_non_conforme`, peso non conforme, massa pezzo alta/bassa.
- Sintomi/domande: massa media, dispersione e cavità? Misura a quale condizionamento? Cushion stabile?
- Cause probabili: dose, commutazione, pack/gate freeze, densità o misurazione.
- Azioni ordinate: processo: trendare peso, dose e cushion; materiale: densità/lotto; stampo: bilanciamento gate/cavità.
- Ricalcolo: solo con misure di peso e massa target; non dedurre automaticamente la correzione dal solo difetto visivo.
- Fonte OEM richiesta: manuale pressa su dosaggio/cushion e datasheet resina su densità/ritiro. Stato: pending.

### Dimensioni fuori tolleranza
- ID/sinonimi: `tolleranza`, dimensioni fuori tolleranza, variazione dimensionale.
- Sintomi/domande: quota, tolleranza, direzione, tempo dopo stampaggio e condizionamento? Tutte le cavità?
- Cause probabili: ritiro, temperatura, pack, deformazione, misura/condizionamento o usura stampo.
- Azioni ordinate: processo: raccogliere capability e trend; materiale: ritiro/condizionamento; stampo: datum, contrazione e usura.
- Ricalcolo: escluso senza quota misurata, obiettivo e piano di misura.
- Fonte OEM richiesta: datasheet ritiro e linee guida dimensionali del grade; specifica prodotto/toolmaker. Stato: pending.

### Graffi e difetti di estrazione
- ID/sinonimi: `ejection_scuff`, `graffi in estrazione`, graffi/scuff, `adesione da sottovuoto` (possibile causa distinta).
- Sintomi/domande: segni nella direzione di estrazione? Pezzo aderisce al maschio/femmina? Espulsori lasciano impronte?
- Cause probabili: draft/sottosquadri, superficie/venting, temperatura o tempo di raffreddamento, espulsione sbilanciata.
- Azioni ordinate: processo: verificare temperatura e sequenza; materiale: ritiro/adesione del grade; stampo: draft, lucidatura, espulsori e ventilazione.
- Ricalcolo: non automatico senza misure di espulsione e geometria; la correzione primaria può richiedere modifica stampo.
- Fonte OEM richiesta: manuale stampo e guida resina su shrinkage/ejection. Stato: pending.

### Lineamenti da delaminazione
- ID/sinonimi: `delaminazione`, `delamin`, `delam`, strati, separazione superficiale.
- Sintomi/domande: strati separabili o solo linea superficiale? Compare con materiale riciclato/additivi? Resistenza ridotta?
- Cause probabili: incompatibilità/contaminazione, umidità, degradazione, shear o condizioni di processo.
- Azioni ordinate: processo: verificare history e pulizia; materiale: compatibilità e lotto; macchina/stampo: contaminazione e ristagni.
- Ricalcolo: escluso senza identificazione materiale e analisi causa.
- Fonte OEM richiesta: compatibilità/handling specifici dei produttori dei polimeri coinvolti. Stato: pending.

### Colature e filamenti in materozza
- ID/sinonimi: colature di materiale, drool, filamenti/stringing, filamenti nella materozza.
- Sintomi/domande: colatura da ugello durante decompressione o apertura? Il filamento è materiale freddo o fuso? Temperatura e shut-off?
- Cause probabili: ugello/valvola, decompressione, temperatura/viscosità o design hot runner.
- Azioni ordinate: processo: registrare decompressione e sequenza; materiale: finestra e viscosità; macchina/stampo: ugello, shut-off e hot runner.
- Ricalcolo: manuale, richiede dati specifici di unità e sistema d’alimentazione; non applicare correzioni generiche di velocità.
- Fonte OEM richiesta: manuale pressa/ugello e hot-runner supplier; guida della resina. Stato: pending.

### Piegature / fold marks
- ID/sinonimi: piegature, fold marks, pieghe del fronte.
- Sintomi/domande: fronte ripiegato, linea sovrapposta o weld line? Posizione rispetto a gate e ostacoli?
- Cause probabili: fronti che si ricongiungono, riempimento sequenziale, ostacoli o geometria.
- Azioni ordinate: processo: mappare sequenza dei fronti; materiale: viscosità/range; stampo: gate e geometria.
- Ricalcolo: escluso senza localizzazione e modello di riempimento; non assimilare a weld line in automatico.
- Fonte OEM richiesta: guida progettazione gate/riempimento del toolmaker e dati reologici del produttore resina. Stato: pending.

### Adesione da sottovuoto
- ID/sinonimi: adesione da sottovuoto, vacuum adhesion.
- Sintomi/domande: distacco difficile da una faccia specifica? Esiste venting dietro la superficie? Segni da depressione?
- Cause probabili: vuoto tra pezzo e superficie, draft insufficiente, venting o ritiro.
- Azioni ordinate: processo: verificare sequenza; materiale: ritiro; stampo: venting, draft e texture.
- Ricalcolo: non automatico; richiede verifica geometrica/meccanica del tool.
- Fonte OEM richiesta: documentazione stampo e linee guida di progettazione del produttore resina. Stato: pending.

### Giunzione stampo non chiusa
- ID/sinonimi: `giunzione_stamp`, linea di divisione aperta, mold mismatch.
- Sintomi/domande: gap visibile, bava localizzata, parallelismo? Pressa in allarme o forza di chiusura reale?
- Cause probabili: clamp/setup, ostacolo, usura o deformazione stampo; non dedurre da solo il setpoint di forza.
- Azioni ordinate: processo/macchina: fermare e controllare setup e limiti; materiale: nessuna azione primaria; stampo: ispezione piani e sicurezza.
- Ricalcolo: escluso; non comandare aumento clamp automatico. Escalation manutenzione/sicurezza.
- Fonte OEM richiesta: manuale pressa e documentazione sicurezza/toolmaker. Stato: pending.

## Regole di migrazione e copertura

1. Conservare ogni stringa esistente come alias nel crosswalk; nessun consumer deve perdere ID durante la migrazione.
2. Distinguere sinonimi veri da condizioni/cause correlate: per esempio burn mark vs degradazione, void vs gas bubble, sink vs peso basso.
3. Portare prima il catalogo descrittivo e le domande, non le correzioni legacy.
4. Valutare ogni azione in un secondo passaggio con fonte OEM puntuale, campi supportati dal calcolo, limiti macchina/materiale e test.
5. La copertura si può dichiarare soltanto con una tabella di tutti gli ID rintracciati (inventari sopra), alias assegnati o motivazione di esclusione, fonti OEM verificate e test di compatibilità.

Nessuna regola di calcolo è stata modificata per preparare questo documento.
