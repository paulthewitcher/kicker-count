import React, { memo } from 'react';
import { Activity, Users, Hash } from 'lucide-react';

const Header = memo(function Header({ nickname, seed, view, setView, onOpenLogoutModal, onOpenSeedModal }) {
  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20 shadow-md">
      <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Sinistra: Logo + Bottone Seed Switcher */}
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-2 text-emerald-400 font-bold text-xl tracking-tight cursor-pointer active:scale-95 transition-transform" 
            onClick={() => setView('DASHBOARD')}
          >
            <Activity className="w-6 h-6 shrink-0" />
            <span className="hidden sm:inline">KickerLive</span>
          </div>

          {seed && view !== 'LOGIN' && (
            <button
              onClick={onOpenSeedModal}
              className="text-xs text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 transition-all px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer font-mono font-semibold"
              title="Cambia Seed Stanza"
            >
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              <span className="max-w-[90px] truncate">{seed}</span>
            </button>
          )}
        </div>

        {/* Destra: Profilo Utente */}
        {nickname && view !== 'LOGIN' && (
          <button 
            onClick={onOpenLogoutModal}
            className="text-sm text-slate-400 bg-slate-700/50 hover:bg-slate-700 transition-colors px-3 py-1 rounded-full flex items-center gap-2 cursor-pointer group"
            title="Disconnetti"
          >
            <Users className="w-4 h-4 group-hover:text-red-400 transition-colors shrink-0" />
            <span className="max-w-[100px] truncate">{nickname}</span>
          </button>
        )}
      </div>
    </header>
  );
});

export default Header;