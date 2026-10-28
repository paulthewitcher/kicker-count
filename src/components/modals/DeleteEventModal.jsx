import React, { useState, memo } from 'react';
import { Trash2, X, Lock } from 'lucide-react';

const DeleteEventModal = memo(function DeleteEventModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  eventTitle, 
  systemPassword = "opera2019" 
}) {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === systemPassword) {
      onConfirm();
      setPassword('');
      setErrorMsg('');
      onClose();
    } else {
      setErrorMsg('Password non corretta. Riprova.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative text-center">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Elimina Evento</h3>
        <p className="text-xs text-slate-400 mb-4">
          Stai per eliminare <span className="font-bold text-slate-200">"{eventTitle}"</span>. Inserisci la password admin per confermare.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Password di sistema"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-center text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
              autoFocus
            />
          </div>

          {errorMsg && (
            <p className="text-red-400 text-xs font-semibold animate-in fade-in">{errorMsg}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/25 transition-all"
            >
              Elimina
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default DeleteEventModal;
