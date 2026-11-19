import React, { memo, useEffect, useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { formatDateTimeLocalInput, parseDateTimeLocalInput } from '../../utils/helpers';

const EditEventDetailsModal = memo(function EditEventDetailsModal({
  isOpen,
  currentTitle,
  currentCreatedAt,
  onClose,
  onSave
}) {
  const [title, setTitle] = useState(currentTitle || '');
  const [dateTime, setDateTime] = useState(formatDateTimeLocalInput(currentCreatedAt));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(currentTitle || '');
    setDateTime(formatDateTimeLocalInput(currentCreatedAt));
    setError('');
    setIsSaving(false);
  }, [isOpen, currentTitle, currentCreatedAt]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Il titolo dell’evento non può essere vuoto.');
      return;
    }

    const createdAt = parseDateTimeLocalInput(dateTime);
    if (createdAt === null) {
      setError('Inserisci una data e un orario validi.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await onSave({ title: cleanTitle, createdAt });
    } catch (saveError) {
      setError(saveError?.message || 'Impossibile salvare le modifiche. Riprova.');
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={() => !isSaving && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <CalendarClock className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-bold text-white">Modifica evento</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-400 transition-colors hover:text-white disabled:opacity-50"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-event-title" className="mb-1 block text-sm font-medium text-slate-400">
              Titolo evento
            </label>
            <input
              id="edit-event-title"
              type="text"
              autoFocus
              required
              maxLength={100}
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="Titolo evento"
            />
          </div>

          <div>
            <label htmlFor="edit-event-created-at" className="mb-1 block text-sm font-medium text-slate-400">
              Data e ora evento
            </label>
            <input
              id="edit-event-created-at"
              type="datetime-local"
              step="1"
              required
              value={dateTime}
              onChange={event => setDateTime(event.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-white [color-scheme:dark] focus:border-emerald-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">Questa data aggiorna la scheda in bacheca e la data dell’export WhatsApp.</p>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-1/2 rounded-xl bg-slate-700 py-2.5 font-medium text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-1/2 rounded-xl bg-emerald-500 py-2.5 font-bold text-slate-900 transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? 'Salvataggio…' : 'Conferma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default EditEventDetailsModal;
