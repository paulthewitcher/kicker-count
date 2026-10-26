import React from 'react';

export default function DeletePlayerModal({ isOpen, onClose, playerName, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        <h3 className="text-lg font-bold text-white mb-2">Rimuovi Giocatore</h3>
        <p className="text-sm text-slate-400 mb-6">
          Vuoi davvero rimuovere <span className="font-bold text-white">{playerName}</span> dalla partita?
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="w-1/2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl py-2.5 transition-colors"
          >
            Annulla
          </button>
          <button 
            onClick={onConfirm}
            className="w-1/2 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl py-2.5 transition-colors"
          >
            Cancella
          </button>
        </div>
      </div>
    </div>
  );
}