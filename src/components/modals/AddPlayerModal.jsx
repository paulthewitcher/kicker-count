import React, { memo } from 'react';
import { X } from 'lucide-react';

const AddPlayerModal = memo(function AddPlayerModal({ isOpen, onClose, onConfirm, newPlayerName, setNewPlayerName, newPlayerJersey, setNewPlayerJersey }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Aggiungi Giocatore</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onConfirm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nome Giocatore *</label>
            <input
              type="text"
              autoFocus
              required
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="Es. Mario"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Numero Maglia (Opzionale)</label>
            <input
              type="number"
              value={newPlayerJersey}
              onChange={(e) => setNewPlayerJersey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="Es. 10"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl py-2 mt-2 transition-colors"
          >
            Conferma
          </button>
        </form>
      </div>
    </div>
  );
});

export default AddPlayerModal;