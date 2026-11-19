# KickerLive V24 – Consolidamento

Questa versione consolida il codice ricevuto nella V23 e aggiunge protezioni/test sui flussi principali.

## Modifiche incluse

- Goal e annullamento calcolati sul documento più recente tramite transazione Firestore.
- Goal, `goalHistory`, `timeline` e reazione canonica `⚽️` salvati nello stesso aggiornamento atomico.
- Reazioni manuali incrementate con transazione sulla mappa `reactions` (compatibilità con vecchio contatore `⚽`).
- Identificazione della squadra tramite ID stabile, così lo scambio casa/trasferta non cambia la destinazione del click.
- Timer di `ReactionBurst` conservati durante gli aggiornamenti successivi e cancellati allo smontaggio.
- Timestamp Firestore normalizzati in un helper condiviso per ordinamento home, date e Reports.
- Documenti stanza/configurazione esclusi dalla lista eventi se non contengono le due squadre.
- Data export evento ricavata dal primo goal attivo in qualunque tempo, con fallback a `createdAt`; inclusa la compatibilità con vecchi log di annullamento senza `undoesGoalId`.
- Eliminazione di un tempo eseguita in transazione dopo il controllo password, per ridurre il rischio di sovrascrivere un goal concorrente.
- Test smoke autonomi, senza framework o dipendenze aggiuntive.

## Verifiche eseguite

```bash
npm run test:core
```

Esito nel workspace: `Core smoke tests passed.`

Sono stati inoltre controllati la sintassi di 30 file JavaScript/JSX/MJS e tutti i percorsi degli import locali.

## Limite della verifica

La build Vite completa e un test end-to-end contro Firebase/Vercel non sono stati eseguiti. Durante il consolidamento, `npm install --include=optional` non ha potuto raggiungere `registry.npmjs.org` (errore DNS `EAI_AGAIN`). Non è stata effettuata alcuna modifica al progetto Firebase remoto.
