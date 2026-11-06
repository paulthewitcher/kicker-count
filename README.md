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
- L'eliminazione richiede la password salvata sul documento Firestore (`deletePassword`, con fallback sul seed della partita). Vengono rimossi anche i gol e i log associati al tempo.
- La condivisione WhatsApp include il titolo (senza Seed/Stanza), il risultato e i marcatori totali, seguiti dal risultato e dai marcatori di ogni tempo.
- Gli eventi precedenti alla nuova struttura rimangono leggibili: i vecchi `players[].goals` vengono interpretati come gol del primo tempo e convertiti nella mappa per tempo al primo aggiornamento che salva i giocatori o i punteggi.

## Reazioni emoji

Le reazioni sono disponibili dalla nuova icona sopra la cronologia. La scelta avviene in una modale; dopo la selezione la modale si chiude e l'animazione della reazione viene mostrata indipendentemente dalla sua chiusura.

> Nota dipendenze: l'archivio ricevuto conteneva un `package-lock.json` riferito a versioni diverse da quelle dichiarate in `package.json` (React/Vite). È stato rimosso per evitare installazioni non riproducibili; `npm install` genererà un lockfile coerente.
