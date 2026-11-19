# KickerLive V28 — correzione reactionLogs

## Perché

La V27 restituiva un messaggio generico quando `setDoc()` falliva. Non veniva mostrato il codice effettivo dell'errore. Inoltre le Rules erano più restrittive del necessario su alcune rappresentazioni del testo emoji e sul tipo numerico del timestamp.

## Pubblicazione

1. Aprire Firebase Console → Firestore Database → Rules.
2. Salvare una copia delle Rules correnti.
3. Sostituire le Rules con il file `firestore.rules` incluso nello ZIP (oppure usare `firestore-rules-kickerlive-v28.rules`).
4. Premere Publish.
5. Distribuire la V28 su Vercel.

## Differenze Rules reactionLogs

- Accetta le varianti `⚽️` e `⚽`.
- Accetta le varianti `⚡️` e `⚡`.
- Accetta timestamp `number` sia interi che floating point.
- Aumenta il limite di sicurezza del nickname a 60 unità, coerente con il troncamento client di 15 unità UTF-16 anche in presenza di caratteri Unicode multibyte.
- Mantiene `uid == request.auth.uid`, le chiavi ammesse e il controllo sulla partita padre.

## Diagnostica

Se una reazione viene conteggiata ma il log non viene scritto, la V28 mostra il codice e il messaggio effettivo dell'errore Firestore. Questo distingue `permission-denied`, errori di rete e problemi di validazione dei dati.

Il contatore e il log restano due scritture separate: il fallimento del log non annulla l'incremento del contatore.
