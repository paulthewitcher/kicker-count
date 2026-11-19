# Reazioni V27 — istruzioni Firestore

## 1. Verificare le Rules

Aprire Firebase Console → Firestore Database → Rules. Se le regole pubblicate non contengono un blocco annidato `match /reactionLogs/{reactionId}` sotto la partita, sostituirle con il file `firestore.rules` incluso nello ZIP e premere Publish.

Il file contiene le autorizzazioni per:
- lettura dei documenti partita agli utenti autenticati;
- aggiornamento del solo campo `reactions` da parte degli utenti autenticati;
- creazione partita e modifiche complete riservate all'amministratore;
- lettura e creazione dei log di reazione da parte degli utenti autenticati;
- cancellazione dei log riservata all'amministratore della partita.

Non pubblicare regole che contengono ancora soltanto il blocco generico V24 senza `reactionLogs`.

## 2. Test dopo la pubblicazione

1. Aprire una partita da un dispositivo spettatore.
2. Aprire la modale Emoji e selezionare una reazione.
3. Verificare che il contatore aumenti e che l'animazione parta anche su un secondo dispositivo.
4. Verificare che appaia una voce nella cronologia.
5. Se il contatore aumenta ma compare l'avviso sulla cronologia, controllare le Rules della sottocollection `reactionLogs`.
6. Se il contatore non aumenta e compare l'avviso sul contatore, controllare che le Rules del documento evento consentano l'aggiornamento esclusivo del campo `reactions`.

Non servono Cloud Functions, piano Blaze, nuove collection radice o modifiche manuali ai documenti delle partite.
