import React, { useState, useEffect, memo } from 'react';
import { X, Hash } from 'lucide-react';

const EditSeedModal = memo(function EditSeedModal({ isOpen, currentSeed, onClose, onSave }) {
  const [tempSeed, setTempSeed] = useState(currentSeed || '');

  useEffect(() => {
    setTempSeed(currentSeed || '');
  }, [currentSeed, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tempSeed.trim()) {
      onSave(tempSeed.trim().toLowerCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 font-mono">
              <Hash className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-white">Cambia Stanza (Seed)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Inserisci il nome del **Seed** per collegarti a un'altra stanza. Vedrai solo le partite associate a questo codice.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Codice Seed</label>
            <input
              type="text"
              autoFocus
              required
              value={tempSeed}
              onChange={(e) => setTempSeed(e.target.value)}
              placeholder="Es. opera2019"
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono text-center text-lg uppercase"
            />
          </div>

          <div className="flex gap-2 pt-2">
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
              Entra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default EditSeedModal;