# KickerLive V27 — diagnosi e fix reazioni

## Causa

Nella V26 il contatore `reactions` e il documento `reactionLogs` venivano scritti nella stessa transazione Firestore. Se le Rules attive non consentivano la scrittura o la lettura della sottocollection `reactionLogs` (ad esempio perché era rimasta pubblicata la versione V24), la transazione falliva interamente. Questo annullava anche il contatore, quindi non partiva l'animazione realtime.

## Fix

- Prima viene aggiornato `reactions` con una transazione sul documento evento.
- Dopo il commit viene creato il documento nella sottocollection `reactionLogs`.
- Un errore nella creazione del log non annulla il contatore.
- L'interfaccia mostra un avviso se il contatore è stato aggiornato ma il log è stato negato, o se il listener realtime dei log riceve `permission-denied`.
- Le reazioni manuali restano disponibili per tutte le squadre.
- La reazione automatica del goal ⚽️ resta disattivata per le squadre diverse da Opera, come richiesto nella V26.

## Cosa fare su Firebase

Il contatore funziona con le Rules che consentono l'aggiornamento del solo campo `reactions`. Per registrare e leggere le frasi nella cronologia, le Rules devono includere anche la sottocollection:

`artifacts/kicker-app-id/public/data/events/{eventId}/reactionLogs/{reactionId}`

Il file `firestore.rules` incluso qui è la versione aggiornata. Se in Firebase sono ancora attive le Rules V24 senza `reactionLogs`, pubblicare questo file in Firebase Console → Firestore Database → Rules. Se le Rules V25/V26 con il blocco `reactionLogs` sono già attive, non occorre ripubblicarle.

## Prova di verifica

1. Aprire una partita da uno spettatore autenticato anonimamente.
2. Selezionare una emoji manualmente.
3. Il contatore e l'animazione devono aggiornarsi in realtime.
4. La cronologia deve mostrare il nickname e la frase.
5. Se il contatore sale ma non appare la voce in cronologia, controllare le Rules della sottocollection.
6. Se non sale neppure il contatore, leggere l'avviso nella schermata e verificare il permesso `isReactionOnlyUpdate` sul documento partita.

## Limiti di verifica

I test locali verificano la separazione delle due scritture e la presenza delle regole necessarie. Non è stato possibile collegarsi al progetto Firebase remoto né verificare quali Rules siano attualmente pubblicate.
