# KickerLive V30

## Centralizzazione delle emoji e delle frasi delle reazioni

- `EMOJI_LIST` resta in `src/utils/constants.js`.
- `REACTION_PHRASES` è stata spostata in `src/utils/constants.js` ed esportata.
- `src/utils/reactionHelpers.js` importa `REACTION_PHRASES` da `constants.js` e mantiene soltanto le funzioni di composizione e aggregazione delle reazioni.
- Nessuna modifica al comportamento Firestore, ai documenti o alle regole di sicurezza.

Verifiche eseguite:
- `npm run test:core`
- Controllo diretto del numero di emoji e delle mappature delle frasi.
