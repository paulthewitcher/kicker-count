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
