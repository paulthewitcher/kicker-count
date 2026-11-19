# KickerLive — log delle reazioni Firestore

Percorso: `artifacts/kicker-app-id/public/data/events/{eventId}/reactionLogs/{reactionId}`.

Ogni log contiene `uid`, `nickname`, `emoji`, `timestamp` e `time`. Le reazioni sono mostrate nella cronologia fondendo la sottocollection con la `timeline` ufficiale; non vengono scritte nella `timeline` della partita.

## Flusso V27

1. Il contatore `reactions` viene incrementato con una transazione sul documento partita.
2. Il documento `reactionLogs` viene creato con una seconda scrittura.
3. Se la seconda scrittura viene negata, il contatore e l'animazione realtime non vengono annullati; la UI mostra un avviso che richiede la pubblicazione delle Rules corrette.

Questa separazione evita che una regola mancante sulla sottocollection blocchi anche il contatore. Per visualizzare e registrare le voci della cronologia, le Rules devono comunque autorizzare `get/list` e `create` sulla sottocollection.

Gli utenti autenticati (inclusi quelli con Anonymous Authentication) possono leggere e creare reazioni; la creazione vincola `uid` a `request.auth.uid`, limita il nickname a 15 caratteri e accetta soltanto le 20 emoji configurate. Solo l'amministratore della partita può cancellare i log.
