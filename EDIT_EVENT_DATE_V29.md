# V29 – Modificare data e ora evento

1. Apri una partita come amministratore.
2. Premi la matita accanto al titolo.
3. Nella finestra **Modifica evento**, modifica titolo e/o `Data e ora evento`.
4. Premi **Conferma**.

La data viene salvata nel campo `createdAt` del documento della partita, come timestamp in millisecondi.

La data aggiorna: la data/ora mostrata sulla scheda della bacheca, l'ordinamento delle partite nella bacheca e la data riportata nell'export WhatsApp dell'evento. Anche il filtro date di Reports usa questa data come riferimento.

L'orario inserito è interpretato nel fuso orario locale del dispositivo che effettua la modifica, in linea con il modo in cui la bacheca mostra data e ora.

L'operazione aggiorna soltanto `title` e `createdAt`. Non modifica `timeline`, orari dei gol, tempi, punteggi o cronologia.
