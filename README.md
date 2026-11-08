# KickerLive

Applicazione React + Vite per la gestione di partite, marcatori, cronologia eventi e reazioni del pubblico, con persistenza su Firebase Firestore.

## Avvio in locale

```bash
npm install
npm run dev
```

## Gestione dei tempi

Ogni nuova partita viene creata con il tab `TOT` (vista aggregata) e il primo tempo (`1`).

Il documento Firestore della partita usa questa struttura per i tempi:

```js
{
  periods: [
    { id: 'period-1', name: '1', number: 1, createdAt: 0 },
    { id: 'period-2', name: '2', number: 2, createdAt: 0 }
  ],
  nextPeriodNumber: 3,
  teams: [
    {
      id: 't1',
      players: [
        {
          id: 'player-1',
          name: 'Pippo',
          goals: 6, // totale di compatibilità, aggiornato insieme alla mappa
          goalsByPeriod: {
            'period-1': 2,
            'period-2': 4
          },
          goalHistory: [
            {
              id: 'goal-event-id',
              periodId: 'period-1',
              timestamp: 1793970000000,
              dateTime: '06-11-2026 16:00:00',
              status: 'active'
            }
          ]
        }
      ],
      scoreOffsetsByPeriod: {
        'period-1': 0,
        'period-2': 0
      }
    }
  ]
}
```

- La lista dei giocatori rimane unica e condivisa tra tutti i tempi.
- Ogni gol aggiunge una voce a `players[].goalHistory`, con tempo, timestamp numerico e data/ora locale `dd-mm-yyyy hh:mm:ss`. In caso di annullamento la voce resta nello storico con `status: 'cancelled'` e i dati dell'annullamento.
- `TOT` somma i gol di tutti i tempi ed è una vista riepilogativa: per assegnare o correggere un gol bisogna selezionare un tempo specifico.
- L'amministratore può aggiungere un tempo con `+`, rinominarlo e cancellarlo.
- L'eliminazione richiede una conferma nella modale. La password viene letta dal documento della stanza identificato dal Seed (`artifacts/{appId}/public/data/events/{seed}`); i dati della singola partita possono invece avere un ID UUID. Vengono rimossi anche i gol e i log associati al tempo.
- La condivisione WhatsApp include il titolo (senza Seed/Stanza), il risultato e i marcatori totali, seguiti dal risultato e dai marcatori di ogni tempo.
- Gli eventi precedenti alla nuova struttura rimangono leggibili: i vecchi `players[].goals` vengono interpretati come gol del primo tempo e convertiti nella mappa per tempo al primo aggiornamento che salva i giocatori o i punteggi.

## Reazioni emoji

Le reazioni sono disponibili dalla nuova icona sopra la cronologia. La scelta avviene in una modale; dopo la selezione la modale si chiude e l'animazione della reazione viene mostrata indipendentemente dalla sua chiusura.

> Nota dipendenze: l'archivio ricevuto conteneva un `package-lock.json` riferito a versioni diverse da quelle dichiarate in `package.json` (React/Vite). È stato rimosso per evitare installazioni non riproducibili; `npm install` genererà un lockfile coerente.

## Permessi amministratore e conferma di eliminazione

- Nella bacheca il cestino viene mostrato solo quando `event.adminId` coincide con l'UID Firebase dell'utente corrente. L'apertura della modale e l'handler di conferma ripetono il controllo.
- La modale chiede una conferma. Il valore digitato viene confrontato nel client con `deletePassword` del documento della stanza, il cui ID coincide con il Seed: `artifacts/{appId}/public/data/events/{seed}`.
- I documenti delle singole partite possono avere un ID UUID diverso dal Seed. Per questo il codice legge il documento della partita e, quando il Seed è diverso dall'ID della partita, legge anche il documento della stanza. Se `deletePassword` non è presente, usa il Seed come compatibilità. Il valore digitato **non viene scritto** su Firestore. Non viene eseguita alcuna migrazione automatica dei dati.
- Questa conferma è una protezione contro eliminazioni accidentali, non un'autorizzazione server-side: senza modificare le regole Firestore o introdurre un endpoint server, l'autorizzazione effettiva delle operazioni dipende dalle Security Rules già attive nel progetto Firebase. Non è richiesta alcuna Cloud Function, Secret Manager, attivazione Blaze o modifica di configurazione Firebase per questa versione.

## Deploy Vercel – correzione dipendenze Rollup

Nel repository GitHub il `package-lock.json` presente al commit `ea4b5bf` non era
coerente con `package.json` (lockfile: Firebase 13 / React 19 / Vite 8;
manifest: Firebase 10 / React 18 / Vite 5). Questa versione non include il vecchio
lockfile e contiene `.npmrc` con `include=optional`, necessario per preservare i
pacchetti binari opzionali di Rollup. Dopo aver copiato i file nel repository,
assicurati di eliminare anche da GitHub il vecchio `package-lock.json` e fai un
redeploy Vercel senza cache. Istruzioni in `VERCEL_BUILD_FIX.md`.

## Totale partita e tempi speciali

Il tab `TOT` considera esclusivamente i tempi il cui nome è interamente numerico (`1`, `2`, `3`, ...). I tempi con nome testuale, ad esempio `Rigori` o `Extra time`, mantengono il proprio conteggio ma non contribuiscono al totale complessivo. La stessa regola è usata nella scheda evento e nell'export WhatsApp.

I tab non selezionati usano lo stile antracite con testo bianco, coerente con il pulsante `+`; il tab selezionato usa `emerald-500` (`rgb(16 185 129)`).

## Aggiornamento V13 – animazione goal e modifica giocatori

- Ripristinata l'animazione del pallone ⚽ quando viene assegnato un goal. Il salvataggio del goal e l'incremento della reazione pallone avvengono con un'unica scrittura Firestore; l'animazione resta definita nel CSS globale anche con la modale Emoji chiusa.
- Sostituita l'icona di rimozione accanto a ciascun giocatore con l'icona Modifica.
- Aggiunta la modale di modifica del giocatore con campi Nome e Numero Maglia, azioni Annulla e Conferma e icona cestino.
- Il cestino nella modale apre la conferma esistente “Rimuovi Giocatore”, con Annulla e Cancella.
- La modifica e la rimozione restano disponibili solo all'amministratore della partita in corso.

## Scambio delle squadre (V16)

- Il pulsante con la sola icona `ArrowLeftRight` compare sopra `VS` esclusivamente all'amministratore della partita.
- Dopo la conferma, una transazione Firestore verifica nuovamente `adminId` e scambia integralmente `teams[0]` e `teams[1]`.
- Nomi, colori, giocatori, numeri di maglia, conteggi per tempo, cronologia dei gol e offset di punteggio restano all'interno del rispettivo oggetto squadra. Non è richiesta alcuna migrazione o modifica alla configurazione Firebase.
- Le scritture complete dell'evento già avviate dal client vengono attese prima della transazione di scambio, per evitare che un aggiornamento appena partito (ad esempio un gol) sovrascriva il nuovo ordine.
- I nuovi log di gol includono anche `teamId`, così il colore in cronologia rimane associato alla squadra anche dopo lo scambio. I log precedenti continuano a usare il nome della squadra già registrato.
- I log storici dei gol restano invariati; i risultati nei log di fine partita vengono invertiti nello stesso aggiornamento, così continuano a rappresentare il nuovo ordine casa-trasferta.
- Scheda evento, schermata partita ed export WhatsApp leggono l'ordine corrente dell'array `teams`, quindi mostrano automaticamente la nuova squadra di casa e quella ospite.

## UI refinement (V17)
- The team-swap control keeps its 40x40px touch area but has a transparent background and border, leaving only the swap icon visible on mobile.
- The add-player control is slightly narrower (40x40px instead of 44x44px), and its plus icon is reduced one size step (20px to 16px).

## Correzione animazione goal (V18)
- Il dispositivo dell'amministratore attiva l'animazione ⚽ direttamente dopo la conferma del salvataggio del goal, senza dipendere dalla tempistica del listener `onSnapshot`.
- Gli spettatori continuano a ricevere l'animazione tramite l'incremento condiviso `reactions.⚽` su Firestore.
- La selezione manuale di ⚽ nella modale usa lo stesso trigger locale per l'amministratore; le altre emoji continuano a usare il contatore condiviso.
- `ReactionBurst` viene renderizzato in un React portal su `document.body`: l'overlay non è più influenzato da `transform` o `overflow` dei contenitori della schermata partita.
- Le particelle hanno un punto di partenza esplicito in basso al centro e un'animazione CSS globale con durata e traiettoria variabili.


## Correzione animazione goal (V19)

- L'assegnazione di un goal salva prima i dati della partita e poi incrementa `reactions.⚽` richiamando la stessa funzione `addEmojiReaction` usata dal click manuale sull'emoji nella modale.
- `ReactionBurst` ascolta esclusivamente il contatore Firestore per tutte le persone, amministratore incluso: non esistono più trigger locali separati che possono divergere dal flusso delle reazioni.
- La modale non genera una seconda animazione: il suo contatore resta disabilitato per l'animazione locale e l'overlay globale reagisce al singolo incremento condiviso.
- Goal e reazione sono due scritture sequenziali: se il salvataggio del goal fallisce, la reazione non viene incrementata; se la reazione fallisce, il goal rimane salvato e l'errore viene riportato in console.

## Reports

La schermata Reports aggrega i marcatori delle partite già caricate per il Seed attivo. Non crea documenti Firestore aggiuntivi e non richiede indici o modifiche alle regole Firebase.

Filtri disponibili: data di avvio della partita (da/a, estremi inclusi e interpretati nel fuso orario locale), giocatore, numero maglia, squadra, titolo evento, organizzatore, stato, tipo di tempo/tempo specifico e intervallo di gol.

La data della partita è ricavata dal primo elemento `start` della `timeline`; per gli eventi precedenti che non hanno tale log viene usato `createdAt`. I conteggi vengono letti dalle mappe `goalsByPeriod`, con la compatibilità legacy già prevista dagli helper. Per impostazione iniziale vengono selezionati i tempi numerici, in coerenza con il tab `Totale`; i tempi testuali (ad esempio `Rigori` o `Extra time`) sono separati e possono essere inclusi o selezionati singolarmente.

I risultati sono raggruppati per nome giocatore normalizzato (maiuscole/minuscole e spazi ignorati). Se nella stessa stanza esistono due persone diverse con lo stesso nome, il report le accorpa: per distinguerle in modo definitivo servirebbe in futuro un archivio anagrafico con un identificativo globale del giocatore. Il dettaglio espanso mostra le singole partite che contribuiscono al conteggio.

I documenti di configurazione della stanza vengono esclusi dal report: sono analizzati soltanto i documenti che contengono esattamente due squadre con le rispettive liste giocatori. Campi tecnici come `deletePassword`, UID e ID interni non vengono mostrati né usati come filtri.


## Reports — comportamento della ricerca (V21)

I campi testuali liberi (giocatore, squadra, titolo evento, organizzatore e numero maglia) usano una ricerca parziale equivalente a `LIKE '%testo%'`, senza distinzione tra maiuscole/minuscole o lettere accentate. Gli spazi iniziali/finali vengono ignorati e gli spazi multipli vengono normalizzati. Il filtro Squadra è un campo di testo, non più una selezione esatta. Stato e tipo di tempo restano selettori perché rappresentano categorie predefinite.

La normalizzazione usata per cercare non cambia automaticamente l'identità aggregata dei giocatori: due nomi che differiscono solo per un accento restano righe distinte. I nomi uguali ignorando maiuscole/minuscole e spazi continuano invece a essere raggruppati, come nella versione precedente.

### Assunzioni dei dati Reports

- La sottoscrizione carica i documenti della collection `artifacts/{appId}/public/data/events` e seleziona in memoria quelli con `seed` corrispondente (oppure, per i documenti legacy, ID documento corrispondente).
- Un documento è considerato partita se contiene esattamente due squadre; il documento della stanza/Seed, privo di `teams`, viene escluso.
- La data della partita è il timestamp del primo log `timeline` di tipo `start`; in mancanza, viene usato `createdAt`. Sono supportati millisecondi numerici, Date, Firestore Timestamp e stringhe data parsabili.
- I gol sono conteggiati da `goalsByPeriod`; per i documenti legacy senza questa mappa viene usato `goals` nel primo periodo. `goalHistory` non viene sommato per evitare doppi conteggi.
- I marcatori sono aggregati per nome normalizzato (maiuscole/minuscole e spazi), perché non esiste un ID giocatore globale condiviso tra partite diverse. Due persone omonime possono quindi essere raggruppate.

La struttura è verificata rispetto al codice applicativo; non è stata eseguita una lettura diretta del database Firebase remoto. Per certificare i dati storici è necessario confrontare un export anonimizzato di alcune partite reali, includendo una partita recente e una legacy. Non includere `deletePassword` o altri segreti nell'export.


## Export classifica marcatori su WhatsApp

Nella testata della sezione **Classifica marcatori** di Reports è disponibile un pulsante discreto di condivisione. L'export usa gli stessi filtri applicati alla ricerca e include un riepilogo dei filtri attivi (intervallo date, giocatore, maglia, squadra, evento, organizzatore, stato, periodo e intervallo gol).

Il testo condiviso è ordinato sempre per gol selezionati in ordine decrescente, indipendentemente dall'ordinamento temporaneo scelto nella tabella. Il numero di maglia viene mostrato tra parentesi quando disponibile. La condivisione apre WhatsApp tramite `https://wa.me/` e non scrive dati aggiuntivi su Firestore.

## Correzioni V23 – animazione goal, emoji e date export

- L'emoji pallone usa ora un'unica chiave canonica (`⚽️`, con variation selector) sia per il click manuale sia per l'assegnazione di un goal.
- Il salvataggio dei dati del goal e l'incremento di `reactions.⚽️` avvengono con un'unica scrittura Firestore. Il listener realtime riceve quindi il nuovo contatore nello stesso snapshot e `ReactionBurst` attiva l'animazione per amministratore e spettatori.
- La lettura dei contatori somma anche il vecchio campo `reactions.⚽` (senza variation selector), così i conteggi esistenti non vengono persi e non serve migrare Firestore.
- La lista emoji è stata aggiornata alle 20 voci richieste, inclusa 😴.
- L'export WhatsApp della partita aggiunge sotto il titolo la data del primo goal registrato (`dd-mm-yyyy`); se il risultato complessivo è ancora 0-0, usa `createdAt`.
- Per la data del primo goal vengono controllati `goalHistory` e `timeline`, con esclusione dei goal annullati quando l'annullamento è tracciato.
- L'export WhatsApp Reports mostra ora `⚽️ *Marcatori:*` prima della classifica.
- Nessuna migrazione o modifica ai documenti Firebase è richiesta.
