import React, { memo } from 'react';
import { Trophy, ArrowLeft } from 'lucide-react';

const LoginView = memo(function LoginView({ nickname, setNickname, handleLogin }) {
  return (
    <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <Trophy className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">Benvenuto nell'Arena</h1>
        <p className="text-center text-slate-400 mb-8 text-sm">
          Inserisci un nickname per unirti agli eventi o diventarne l'arbitro.
        </p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Il tuo Nickname..."
              maxLength={15}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center text-lg font-medium"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 text-lg"
          >
            Entra <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
});

export default LoginView;