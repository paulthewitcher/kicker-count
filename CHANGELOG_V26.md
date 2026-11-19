# KickerLive V26

## Emoji automatica del goal riservata alla squadra Opera

- Il contatore automatico `reactions.⚽️` viene incrementato soltanto se il nome della squadra, normalizzato con trim e confronto case-insensitive, è esattamente `Opera`.
- Le altre squadre registrano normalmente goal, storico e timeline senza attivare l'animazione automatica del pallone.
- Le reazioni manuali degli utenti restano invariate e utilizzabili con tutte le squadre.
- Test aggiunti per `Opera`, varianti di maiuscole/minuscole e squadra diversa.
- Nessuna modifica a Firebase Rules o al database.
