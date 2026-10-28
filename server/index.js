const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Simulazione dati Database
let eventData = {
  id: 'evt-001',
  title: 'Opera 2019 Event',
  deletePassword: 'opera2019'
};

let eventLogs = [
  { id: 1, type: '(inizio)', timestamp: '2026-10-28 09:00:00' }
];

// Endpoint: ottieni dettagli evento
app.get('/api/event', (req, res) => {
  res.json({ event: eventData, logs: eventLogs });
});

// Endpoint: aggiungi log (inizio/fine)
app.post('/api/event/log', (req, res) => {
  const { type } = req.body;
  const newLog = {
    id: Date.now(),
    type: type,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  eventLogs.push(newLog);
  res.status(201).json(newLog);
});

// Endpoint: elimina singolo log
app.delete('/api/event/log/:id', (req, res) => {
  const { id } = req.params;
  eventLogs = eventLogs.filter(l => l.id !== parseInt(id, 10));
  res.json({ success: true, id: parseInt(id, 10) });
});

// Endpoint: elimina evento previa verifica password
app.post('/api/event/delete', (req, res) => {
  const { password } = req.body;

  if (password === eventData.deletePassword) {
    eventData = null;
    eventLogs = [];
    return res.json({ success: true, message: 'Evento eliminato correttamente.' });
  }

  return res.status(401).json({ success: false, message: 'Password non valida.' });
});

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
