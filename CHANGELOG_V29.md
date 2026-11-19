# KickerLive V29 – Modifica data e ora evento

- L'icona della penna accanto al titolo apre ora la modale **Modifica evento**.
- La modale consente di modificare titolo, data e ora dell'evento.
- Il campo `createdAt` viene salvato come timestamp Unix in millisecondi, nello stesso formato già usato dalla V28.
- La data mostrata nella scheda della bacheca si aggiorna tramite il listener Firestore esistente; l'ordinamento della bacheca segue quindi la nuova data.
- L'export WhatsApp dell'evento usa `createdAt` come data canonica. Per i documenti legacy che ne sono privi, resta il fallback sulla prima rete attiva.
- Anche il filtro date di Reports usa `createdAt` come data canonica e `timeline.start` solo come fallback per eventi legacy senza `createdAt`.
- Nessuna modifica alle Firestore Rules, alle sottocollection o alla configurazione Firebase.

## Verifiche

- `npm run test:core`
- Test di conversione locale `datetime-local` ↔ timestamp
- Test della data canonica per export e Reports
- Controllo sintattico JSX tramite TypeScript transpile parser
