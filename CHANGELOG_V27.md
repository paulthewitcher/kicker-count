# KickerLive V27 — ripristino robusto delle reazioni

## Problema corretto

Nella V26 il contatore `reactions` e il documento `reactionLogs` venivano scritti nella stessa transazione. Se Firestore negava la scrittura della sottocollection (ad esempio perché erano ancora attive le Rules V24), la transazione falliva interamente: il contatore non aumentava e quindi non partiva neppure l'animazione realtime.

## Modifiche

- Il contatore `reactions` viene aggiornato per primo con una transazione sul documento partita.
- Il log nella sottocollection `reactionLogs` viene scritto separatamente.
- Se il contatore riesce ma il log viene negato, l'animazione e il conteggio funzionano comunque e la schermata mostra un avviso esplicito.
- Se il listener realtime della sottocollection viene negato, la schermata segnala che le Rules per la cronologia non sono pubblicate.
- Le reazioni manuali continuano a funzionare per tutte le squadre.
- L'emoji automatica ⚽️ generata da un goal resta intenzionalmente riservata alla squadra chiamata Opera (confronto case-insensitive), come richiesto nella V26.

## Firestore Rules richieste

Per vedere anche le frasi nella cronologia è necessario pubblicare `firestore.rules` incluso in questo pacchetto. Le Rules devono autorizzare lettura e creazione di `artifacts/kicker-app-id/public/data/events/{eventId}/reactionLogs/{reactionId}`. Se sono ancora attive le Rules V24, la V27 continuerà a incrementare il contatore e animare le emoji, ma la cronologia delle reazioni verrà rifiutata fino alla pubblicazione delle Rules aggiornate.

Nessuna modifica a schema delle partite, Cloud Functions, piano Firebase o database remoto.
