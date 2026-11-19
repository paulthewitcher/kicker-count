# KickerLive V25 — Reazioni nella cronologia

## Novità

- Ogni click su una reaction manuale registra un documento in `reactionLogs` nella sottocollection della partita.
- La stessa transazione incrementa il contatore emoji sul documento partita e crea il log, evitando disallineamenti tra numero reazioni e cronologia.
- Il log conserva UID Firebase, nickname visualizzato, emoji, timestamp e ora locale.
- La schermata partita fonde in tempo reale timeline ufficiale e reactionLogs, ordinate cronologicamente.
- Ogni emoji ha una frase sportiva/ironica dedicata.
- Reazioni consecutive dello stesso UID con la stessa emoji, entro 60 secondi, vengono raggruppate in un'unica riga visiva. I documenti originali restano distinti.
- L'amministratore può eliminare una riga di reazione raggruppata; vengono cancellati tutti i singoli record che la compongono.
- Alla cancellazione della partita, i log della sottocollection vengono rimossi prima del documento principale.

## Compatibilità e sicurezza

- Non viene modificata la `timeline` ufficiale, quindi spettatori non possono alterare i log di goal, inizio/fine partita.
- Il nickname è quello scelto nel form di accesso; l'UID è verificato da Firebase Anonymous Authentication, mentre il nickname non è un'identità certificata.
- Se sono già state pubblicate le Firestore Rules restrittive della V24, occorre pubblicare il nuovo `firestore.rules` incluso nel pacchetto: la regola annidata per `reactionLogs` è necessaria perché le regole del documento padre non si applicano automaticamente alle sottocollection.
- Non sono richiesti Cloud Functions, piano Blaze, nuove collection top-level o modifiche al documento partita.
