import React, { memo } from 'react';
import { X, Check } from 'lucide-react';
import { TEAM_COLORS } from '../../utils/constants';

const EditTeamModal = memo(function EditTeamModal({ isOpen, onClose, teamModal, setTeamModal, onSave }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Modifica Squadra</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nome Squadra</label>
            <input
              type="text"
              required
              value={teamModal.name}
              onChange={(e) => setTeamModal({ ...teamModal, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-semibold"
              placeholder="Es. Real Madrid"
              maxLength={25}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Colore Squadra</label>
            <div className="grid grid-cols-5 gap-2.5">
              {TEAM_COLORS.map((col) => (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => setTeamModal({ ...teamModal, color: col.hex })}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform hover:scale-110 shadow-md border border-slate-600 relative"
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                >
                  {teamModal.color === col.hex && (
                    <Check className="w-5 h-5 text-black drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
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
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default EditTeamModal;