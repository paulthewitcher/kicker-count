import React, { memo } from 'react';
import { Trash2 } from 'lucide-react';

const EditPlayerModal = memo(function EditPlayerModal({
  isOpen,
  playerName,
  jersey,
  setPlayerName,
  setJersey,
  onClose,
  onConfirm,
  onDelete
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <h3 className="text-lg font-bold text-white">Modifica Giocatore</h3>
          <button
            type="button"
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
            title="Rimuovi giocatore"
            aria-label="Rimuovi giocatore"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onConfirm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1" htmlFor="edit-player-name">
              Nome Giocatore
            </label>
            <input
              id="edit-player-name"
              type="text"
              autoFocus
              required
              maxLength={40}
              value={playerName}
              onChange={event => setPlayerName(event.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="Nome giocatore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1" htmlFor="edit-player-jersey">
              Numero Maglia (Opzionale)
            </label>
            <input
              id="edit-player-jersey"
              type="number"
              min="0"
              max="999"
              value={jersey}
              onChange={event => setJersey(event.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="Numero maglia"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl py-2.5 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="w-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl py-2.5 transition-colors"
            >
              Conferma
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default EditPlayerModal;
