import React, { useState } from 'react';
import './EventPage.css';

// Icona cestino riutilizzabile sia in alto a sinistra che per i singoli log
const TrashIcon = ({ className = '', onClick, title = 'Elimina' }) => (
  <button 
    className={`trash-btn ${className}`} 
    onClick={onClick} 
    title={title}
    aria-label={title}
  >
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  </button>
);

export default function EventPage({ initialAdminState = true, seedPassword = 'opera2019' }) {
  // Stato Admin
  const [isAdmin, setIsAdmin] = useState(initialAdminState);
  
  // Stato Modale Eliminazione Evento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);

  // Stato Log di Partita
  const [logs, setLogs] = useState([
    { id: 1, type: '(inizio)', timestamp: '2026-10-28 09:00:00' },
    { id: 2, type: '(fine)', timestamp: '2026-10-28 10:15:00' }
  ]);

  // Gestione aggiunta log inizio / fine
  const handleAddLog = (type) => {
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);
    const newLog = {
      id: Date.now(),
      type: type, // '(inizio)' o '(fine)'
      timestamp: formattedDate
    };
    setLogs(prevLogs => [...prevLogs, newLog]);
  };

  // Gestione eliminazione singolo log
  const handleDeleteLog = (id) => {
    setLogs(prevLogs => prevLogs.filter(log => log.id !== id));
  };

  // Gestione apertura modale eliminazione evento
  const handleOpenDeleteModal = () => {
    setInputPassword('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Chiudi modale e resetta input
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setInputPassword('');
    setErrorMessage('');
  };

  // Conferma eliminazione evento
  const handleConfirmDeleteEvent = (e) => {
    e.preventDefault();
    if (inputPassword === seedPassword) {
      setIsModalOpen(false);
      setIsDeleted(true);
    } else {
      setErrorMessage('Password errata. Riprova.');
    }
  };

  if (isDeleted) {
    return (
      <div className="event-deleted-container">
        <h2>Evento Eliminato con successo.</h2>
        <p>L'evento è stato rimosso dal sistema.</p>
        <button onClick={() => setIsDeleted(false)} className="btn-primary">Ripristina Demo</button>
      </div>
    );
  }

  return (
    <div className="event-page-container">
      {/* Header dell'Evento con Icona Cestino in Alto a Sinistra riservata ad Admin */}
      <header className="event-header">
        <div className="header-left">
          {isAdmin && (
            <TrashIcon 
              className="event-delete-icon" 
              onClick={handleOpenDeleteModal} 
              title="Elimina Evento (Admin)" 
            />
          )}
          <h1 className="event-title">Evento Opera 2019</h1>
        </div>

        <div className="admin-toggle">
          <label>
            <input 
              type="checkbox" 
              checked={isAdmin} 
              onChange={(e) => setIsAdmin(e.target.checked)} 
            />
            Modalità Admin Sessione
          </label>
        </div>
      </header>

      {/* Sezione Azioni Partita */}
      <section className="match-controls">
        <button className="btn-start" onClick={() => handleAddLog('(inizio)')}>
          Inizia partita
        </button>
        <button className="btn-end" onClick={() => handleAddLog('(fine)')}>
          Termina partita
        </button>
      </section>

      {/* Tabella / Elenco dei Log */}
      <section className="logs-section">
        <h3>Registro Log Partita</h3>
        {logs.length === 0 ? (
          <p className="no-logs">Nessun log registrato per questa sessione.</p>
        ) : (
          <ul className="logs-list">
            {logs.map((log) => (
              <li key={log.id} className="log-item">
                <span className={`log-badge ${log.type === '(inizio)' ? 'badge-start' : 'badge-end'}`}>
                  {log.type}
                </span>
                <span className="log-time">{log.timestamp}</span>
                <TrashIcon 
                  className="log-delete-icon" 
                  onClick={() => handleDeleteLog(log.id)} 
                  title="Elimina questo log" 
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modale di Conferma Eliminazione Evento */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Conferma Eliminazione Evento</h2>
            <p>Inserisci la password di sicurezza per confermare l'eliminazione dell'evento:</p>
            
            <form onSubmit={handleConfirmDeleteEvent}>
              <div className="form-group">
                <input 
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {errorMessage && <p className="error-text">{errorMessage}</p>}

              <div className="modal-actions">
                <button type="submit" className="btn-danger">
                  Elimina evento
                </button>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
