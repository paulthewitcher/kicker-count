# Event Management & Match Logging (Fix & Feature Update)

Questa cartella contiene il codice sorgente completo e la struttura aggiornata per la gestione della cancellazione degli eventi e il tracciamento dei log di inizio/fine partita.

## Requisiti Implementati

1. **Pulsante Eliminazione Evento (Riservato Admin)**:
   - Posizionato nell'angolo superiore a sinistra della schermata dell'evento.
   - Stilizzato con lo stesso elemento grafico (icona cestino SVG) e stile delle singole righe di log.
   - Renderizzato visivamente e cliccabile solo se l'utente corrente è autenticato come Admin (`isAdmin === true`).

2. **Modale di Conferma Eliminazione**:
   - Apertura al click sull'icona del cestino in alto a sinistra.
   - Campo di input password privo di placeholder, testo di aiuto o suggerimenti.
   - Pulsante **"Elimina evento"**: verifica la password inserita (es. `opera2019`). Se corretta elimina l'evento e reindirizza, altrimenti mostra messaggio d'errore mantenendo la modale aperta.
   - Pulsante **"Annulla"**: chiude la modale e ripristina lo stato dell'input.

3. **Log Inizio e Fine Partita**:
   - Pulsante **"Inizia partita"**: genera ed inserisce un log marcato `(inizio)` con timestamp corrente.
   - Pulsante **"Termina partita"**: genera ed inserisce un log marcato `(fine)` con timestamp corrente.
   - Possibilità di eliminare singole righe di log tramite l'icona cestino a fianco di ciascuna riga.

4. **Gestione DB Password**:
   - Script SQL forniti per archiviare la password nel database tramite tabella di configurazione (`system_settings`) o colonna dedicata nella tabella `events`.

---

## Struttura del Progetto

```
evento_app_fix/
├── db/
│   └── schema.sql             # Query SQL per tabelle events e system_settings
├── src/
│   ├── EventPage.jsx          # Componente React completo con fix e modale
│   └── EventPage.css          # Stili CSS per layout, pulsanti e modale
├── server/
│   └── index.js               # Server Node.js / Express con API REST
└── README.md                  # Guida all'uso e documentazione
```

## Installazione e Avvio

### Backend (Node.js & Express)
```bash
cd server
npm install express cors body-parser sqlite3
node index.js
```

### Frontend (React)
Copia i file `EventPage.jsx` e `EventPage.css` all'interno del tuo progetto React (es. Vite o Create React App).
