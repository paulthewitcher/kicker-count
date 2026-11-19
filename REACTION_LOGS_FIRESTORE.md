# KickerLive V25 — regole Firestore per i log delle reazioni

La V25 registra ogni reazione manuale in una sottocollection:

`artifacts/kicker-app-id/public/data/events/{eventId}/reactionLogs/{reactionId}`

Il documento contiene soltanto `uid`, `nickname`, `emoji`, `timestamp` e `time`.

- Gli utenti autenticati (inclusi gli spettatori anonimi) possono leggere e creare reazioni.
- La creazione richiede che `uid` coincida con `request.auth.uid`, nickname massimo 15 caratteri e una delle 20 emoji ammesse.
- Solo l'amministratore del documento partita può eliminare i log.
- I log delle reazioni non vengono aggiunti al campo `timeline`: la UI fonde le due sorgenti per mostrare una cronologia unica.
- La cancellazione della partita elimina prima i documenti della sottocollection, perché Firestore non elimina automaticamente i documenti figli.

## Pubblicazione

Se hai già pubblicato le regole V24, sostituiscile con il file `firestore.rules` aggiornato contenuto in questo pacchetto e premi Publish in Firestore → Rules. Senza questa modifica, le nuove letture/scritture della sottocollection saranno rifiutate dalle regole V24.

Le regole mantengono le autorizzazioni V24: lettura dei documenti evento per gli utenti autenticati, scritture del documento partita riservate all'amministratore salvo il solo campo `reactions`.

Il nickname proviene dal nickname scelto nel form d'ingresso e non è un'identità verificata: Firebase Anonymous Authentication identifica l'UID del dispositivo/sessione, ma non autentica il nome visualizzato.
