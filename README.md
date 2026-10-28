# Event Management & Match Logging (Fix v2 with Firebase)

Questa versione aggiornata del progetto include la correzione per la dicitura all'avvio/riapertura della partita (`log.type === 'start'`) e l'integrazione con Firebase Firestore.

## Novità nella Fix v2:
- Quando viene inserito o letto un log con `log.type === 'start'`, viene mostrato il messaggio:
  `🎬 Mettetevi comodi, allacciate le cinture...comincia la partita!`
- Gestione flussi per "Riapri Partita" e "Termina partita".
- Integrazione completa con la struttura Firestore `artifacts/kicker-app-id/public/data/events`.
- Modale di eliminazione evento riservata agli Admin con verifica password in chiaro (`opera2019`).
