# KickerLive V28 — Diagnostica e compatibilità reactionLogs

## Correzioni

- Le Firestore Rules per `reactionLogs` accettano sia `⚽️` sia `⚽`, e sia `⚡️` sia `⚡`: le varianti Unicode legacy non vengono rifiutate.
- Il campo `timestamp` dei log accetta il tipo `number` (intero o floating point), compatibile con la serializzazione dei numeri JavaScript in Firestore.
- La UI mostra il codice e il dettaglio reale dell'errore di creazione del log, anziché suggerire sempre e soltanto di pubblicare le Rules.
- Gli errori del listener realtime vengono mostrati con codice e messaggio, così è possibile distinguere un problema di lettura da un problema di scrittura.

## Cosa non cambia

- L'incremento del contatore emoji rimane separato dalla creazione del log.
- La regola automatica dell'emoji goal riservata alla squadra Opera resta invariata.
- Nessun cambiamento allo schema dei documenti partita o alle altre operazioni di KickerLive.
