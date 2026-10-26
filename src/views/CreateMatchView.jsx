import React, { useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { createEvent } from '../services/eventService';

export default function CreateMatchView({ user, nickname, pastEvents, goBack, onMatchCreated }) {
  const [title, setTitle] = useState(`Partita di ${nickname}`);
  const [importId, setImportId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsCreating(true);

    try {
      const newEventId = await createEvent({ user, nickname, title, importId, pastEvents });
      onMatchCreated(newEventId);
    } catch (err) {
      console.error("Error creating event:", err);
      setIsCreating(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <button 
        onClick={goBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Annulla
      </button>

      <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Play className="w-5 h-5 text-emerald-400" /> Prepara la Partita
        </h2>

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Nome Evento</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Importa Giocatori (Opzionale)</label>
            <select
              value={importId}
              onChange={(e) => setImportId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
            >
              <option value="">-- Inizia da zero --</option>
              {pastEvents.map(evt => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({new Date(evt.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Selezionando una partita passata, le squadre e i nomi dei giocatori verranno copiati (i punteggi partiranno da 0).
            </p>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isCreating ? 'Creazione in corso...' : 'Avvia Partita Ora'}
          </button>
        </form>
      </div>
    </div>
  );
}