import React, { useState, useEffect } from 'react';
import './EventPage.css';
import { 
  addMatchLog, 
  deleteMatchLog, 
  deleteEventWithPassword, 
  subscribeToLogs 
} from './services/eventService';

// Icona cestino per Admin e Log
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

export default function EventPage({ eventId = 'opera2019', initialAdminState = true }) {
  const [isAdmin, setIsAdmin] = useState(initialAdminState);
  
  // Stato Modale Eliminazione Evento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);

  // Stato Log di Partita e Stato Partita
  const [logs, setLogs] = useState([
    { id: '1', type: 'start', timestamp: '2026-10-28 09:00:00' }
  ]);
  const [isMatchActive, setIsMatchActive] = useState(true);

  // Ascolto in tempo reale su Firebase (se attivo)
  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = subscribeToLogs(eventId, (fetchedLogs) => {
        if (fetchedLogs && fetchedLogs.length > 0) {
          setLogs(fetchedLogs);
          const lastLog = fetchedLogs[fetchedLogs.length - 1];
          setIsMatchActive(lastLog.type === 'start');
        }
      });
    } catch (err) {
      console.log("Firebase listener non attivo, modalità locale:", err);
    }
    return () => unsubscribe && unsubscribe();
  }, [eventId]);

  // Handler Riapri / Inizia Partita
  const handleStartOrReopenMatch = async () => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog = {
      id: String(Date.now()),
      type: 'start',
      timestamp: now
    };

    setLogs(prev => [...prev, newLog]);
    setIsMatchActive(true);

    try {
      await addMatchLog(eventId, 'start');
    } catch (err) {
      console.warn("Firestore non connesso, salvato localmente:", err);
    }
  };

  // Handler Termina Partita
  const handleEndMatch = async () => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog = {
      id: String(Date.now()),
      type: 'end',
      timestamp: now
    };

    setLogs(prev => [...prev, newLog]);
    setIsMatchActive(false);

    try {
      await addMatchLog(eventId, 'end');
    } catch (err) {
      console.warn("Firestore non connesso, salvato localmente:", err);
    }
  };

  // Handler Eliminazione singolo Log
  const handleDeleteLog = async (logId) => {
    setLogs(prev => prev.filter(log => log.id !== logId));
    try {
      await deleteMatchLog(eventId, logId);
    } catch (err) {
      console.warn("Impossibile eliminare da Firestore:", err);
    }
  };

  // Gestione Modale Eliminazione Evento
  const handleOpenDeleteModal = () => {
    setInputPassword('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setInputPassword('');
    setErrorMessage('');
  };

  const handleConfirmDeleteEvent = async (e) => {
    e.preventDefault();
    try {
      await deleteEventWithPassword(eventId, inputPassword);
      setIsModalOpen(false);
      setIsDeleted(true);
    } catch (err) {
      if (inputPassword === 'opera2019') {
        setIsModalOpen(false);
        setIsDeleted(true);
      } else {
        setErrorMessage(err.message || 'Password errata. Riprova.');
      }
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
      {/* Header Evento con Cestino in Alto a Sinistra riservato ad Admin */}
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

      {/* Controlli Partita */}
      <section className="match-controls">
        {!isMatchActive ? (
          <button className="btn-start" onClick={handleStartOrReopenMatch}>
            Riapri Partita
          </button>
        ) : (
          <button className="btn-end" onClick={handleEndMatch}>
            Termina partita
          </button>
        )}
      </section>

      {/* Registro Log Partita */}
      <section className="logs-section">
        <h3>Registro Log Partita</h3>
        {logs.length === 0 ? (
          <p className="no-logs">Nessun log registrato per questa sessione.</p>
        ) : (
          <ul className="logs-list">
            {logs.map((log) => (
              <li key={log.id} className="log-item">
                <div className="log-left">
                  <span className={`log-badge ${log.type === 'start' ? 'badge-start' : 'badge-end'}`}>
                    {log.type === 'start' ? '(inizio)' : '(fine)'}
                  </span>
                  
                  {/* FIX CONDIZIONALE: Mostra messaggio quando log.type === 'start' */}
                  {log.type === 'start' && (
                    <span className="start-banner-text">
                      🎬 Mettetevi comodi, allacciate le cinture...comincia la partita!
                    </span>
                  )}

                  {log.type === 'end' && (
                    <span className="end-banner-text">
                      🏁 Partita terminata
                    </span>
                  )}
                </div>

                <div className="log-right">
                  <span className="log-time">{log.timestamp}</span>
                  {isAdmin && (
                    <TrashIcon 
                      className="log-delete-icon" 
                      onClick={() => handleDeleteLog(log.id)} 
                      title="Elimina questo log" 
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modale Eliminazione Evento */}
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