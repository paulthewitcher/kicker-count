import React, { memo } from 'react';

const LogoutModal = memo(function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
        <h3 className="text-xl font-bold text-white mb-2">Disconnetti</h3>
        <p className="text-sm text-slate-400 mb-6">
          Attenzione: se effettui il logout <span className="font-bold text-red-400">non sarai più in grado di gestire</span> gli eventi creati in passato come admin, ma solo quelli nuovi al prossimo accesso.
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl py-3 transition-colors"
          >
            Resta connesso
          </button>
          <button 
            onClick={onConfirm}
            className="w-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 font-bold rounded-xl py-3 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
});

export default LogoutModal;