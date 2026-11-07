import React, { memo } from 'react';
import { ArrowLeftRight } from 'lucide-react';

const SwapTeamsModal = memo(function SwapTeamsModal({
  isOpen,
  isBusy = false,
  error = '',
  onClose,
  onConfirm
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={() => !isBusy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-teams-title"
        className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-5 h-5 text-slate-300" />
          </div>
          <h3 id="swap-teams-title" className="text-lg font-bold text-white">
            Scambiare le squadre?
          </h3>
        </div>

        <p className="text-sm text-slate-400 mb-5">
          Le squadre invertiranno posizione. Nomi, colori, giocatori, gol e statistiche resteranno associati alla rispettiva squadra.
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="w-1/2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium rounded-xl py-2.5 transition-colors"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className="w-1/2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold rounded-xl py-2.5 transition-colors flex items-center justify-center gap-2"
          >
            {isBusy && <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />}
            {isBusy ? 'Scambio...' : 'Scambia'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default SwapTeamsModal;
