import React, { useState, memo } from 'react';
import { Trash2, X, Lock } from 'lucide-react';

const DeleteEventModal = memo(function DeleteEventModal({
  isOpen,
  onClose,
  onConfirm,
  eventTitle
}) {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onConfirm(password);
      setPassword('');
      setErrorMsg('');
      onClose();
    } catch (error) {
      setErrorMsg(error.message || 'Impossibile eliminare la partita. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setPassword('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative text-center">
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Elimina Evento</h3>
        <p className="text-xs text-slate-400 mb-4">
          Stai per eliminare <span className="font-bold text-slate-200">&quot;{eventTitle}&quot;</span>. Inserisci la password admin per confermare.
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
              placeholder="Password admin"
              autoComplete="current-password"
              disabled={isSubmitting}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-center text-white text-sm focus:outline-none focus:border-red-500 transition-colors disabled:opacity-60"
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
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Verifica...' : 'Elimina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default DeleteEventModal;
