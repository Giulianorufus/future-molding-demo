# Future Molding · prova pilota in reparto

## Avvio sul PC

Preparare un checkout del commit candidato su un PC Windows con Node.js 20, npm e un browser Chromium con WebGL abilitato. Da PowerShell, nella cartella del progetto:

```powershell
git rev-parse HEAD
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 8080 --strictPort
```

Aprire <http://127.0.0.1:8080/> e lasciare il terminale aperto durante la prova. L'installazione delle dipendenze richiede accesso al registro npm. Preparare build e dipendenze prima di portare il PC in reparto se la rete è limitata. Questo avvio serve per la prova locale del frontend. Il salvataggio degli esiti via API richiede anche il backend raggiungibile e una sessione autenticata. Usare la scheda di prova qui sotto quando l'API non è disponibile.

## Verifica funzionale

1. Caricare il file STEP di riferimento `public/sample-drawings/Frutto (1).stp` e controllare che il modello 3D si apra e che la conversione termini.
2. Impostare quattro cavità, canale freddo, ARBURG 370 U con vite da 22 mm e PP. Per ripetere il test software, impostare il volume totale dei canali a 2 cm³ e la loro area proiettata a 1 cm². Verificare che dose e commutazione V/P siano espresse in cm³. La dose di **19,307248 cm³** è attesa solo con gli ingressi della prova automatizzata.
3. Selezionare un punto di iniezione sul modello. Avviare, mettere in pausa e ripristinare l'anteprima qualitativa del riempimento.
4. Aprire Difetti, selezionare una scheda e rispondere alle domande. Verificare che gli indizi riordinino le verifiche suggerite.
5. Esportare la ricetta e riaprire il file. Conservare il JSON con il commit e l'identificativo della prova. Annotare eventuali errori del browser o passaggi bloccanti.

## Prova PP su una ricetta già validata

Rilevare prima i dati mentre la pressa opera con una ricetta approvata e il ciclo è stabile. Confrontare la proposta di Future Molding a macchina invariata. Per ogni valore riportare unità, origine e riferimento, per esempio il volume iniettato dalla partenza oppure il volume residuo per V/P. Se i riferimenti differiscono, lasciare il confronto in sospeso fino a quando è possibile documentare la conversione.

| Dato | Ricetta approvata o rilievo | Proposta Future Molding | Scostamento e note |
| --- | --- | --- | --- |
| Dose per ciclo, compreso canale freddo (cm³) | | | |
| Peso pezzo per cavità e peso canale (g) | | | |
| Commutazione V/P (cm³ e riferimento) | | | |
| Portata iniezione per fase (cm³/s) | | | |
| Pressione di iniezione e picco osservato (bar, specificare il riferimento) | | | |
| Forza di chiusura (t) e utilizzo della pressa (%) | | | |
| Temperature cilindro, ugello, stampo (°C) | | | |
| Tempo raffreddamento e ciclo (s) | | | |
| Difetto osservato e cavità interessata | | | |

Associare alla scheda data, commit, revisione CAD, matricola pressa e stampo, vite, numero di cavità attive, geometria canale, grado e lotto PP, eventuale essiccazione e condizioni del processo. Se si pesa la stampata, pesare separatamente pezzi e canale e mantenere distinti massa misurata e volume stimato.

Registrare l'esito come **coerente**, **da approfondire** o **dati mancanti** per ciascun parametro. Per un eventuale intervento autorizzato in reparto, annotare valore precedente, modifica, effetto sul difetto e ripristino. Le modifiche in pressa seguono la procedura di reparto e sono applicate manualmente dal personale autorizzato.
