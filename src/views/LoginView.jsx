import React, { memo } from 'react';
import { Trophy, ArrowLeft, Hash, User } from 'lucide-react';

const LoginView = memo(function LoginView({ nickname, setNickname, seed, setSeed, handleLogin }) {
  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <Trophy className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">Benvenuto nell'Arena</h1>
        <p className="text-center text-slate-400 mb-6 text-sm">
          Inserisci il tuo Nickname e il Seed della tua Stanza per accedere agli eventi.
        </p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" /> Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Es. Mario"
              maxLength={15}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-400" /> Seed Stanza / Gruppo
            </label>
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Es. opera2019"
              maxLength={20}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono font-semibold uppercase"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Solo gli utenti che usano lo stesso Seed condivideranno le medesime partite.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 text-lg mt-2"
          >
            Entra <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
});

export default LoginView;