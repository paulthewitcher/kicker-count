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

## Permessi amministratore e password di eliminazione

- Nella bacheca il cestino di un evento viene mostrato solo quando `event.adminId` coincide con l'UID Firebase dell'utente corrente. Anche l'apertura della modale e l'handler di conferma ripetono il controllo.
- La cancellazione dell'intera partita e quella di un singolo tempo leggono entrambe `deletePassword` dal documento Firestore dell'evento (con fallback al campo `seed` per i documenti più vecchi). Per cambiare la password di una partita esistente, modifica il campo `deletePassword` nel relativo documento. La modifica vale solo per quella partita.
- Le nuove partite continuano inizialmente a usare il Seed come valore di `deletePassword`, finché non viene personalizzato il campo sul documento.

**Importante per la sicurezza:** nascondere il pulsante e verificare la password nel client non sostituisce le Firestore Security Rules. Il progetto non includeva un file di regole Firebase, quindi occorre integrare nel ruleset già pubblicato una regola che consenta `delete` solo al proprietario registrato nel documento e gli aggiornamenti completi solo all'amministratore (mantenendo per gli spettatori il solo aggiornamento di `reactions`). Esempio del blocco da adattare al ruleset esistente:

```text
match /artifacts/{appId}/public/data/events/{eventId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null
                && request.resource.data.adminId == request.auth.uid;
  allow delete: if request.auth != null
                && resource.data.adminId == request.auth.uid;
  allow update: if request.auth != null
                && (resource.data.adminId == request.auth.uid
                    || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reactions']));
}
```

Il campo `deletePassword` si trova nel documento dell'evento e, se le regole permettono a tutti gli utenti autenticati di leggere l'evento, non è un segreto: la vera autorizzazione alla cancellazione deve quindi essere imposta dalle Security Rules sopra, non affidata alla sola password lato browser.
