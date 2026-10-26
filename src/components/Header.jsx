import React, { memo } from 'react';
import { Activity, Users } from 'lucide-react';

const Header = memo(function Header({ nickname, view, setView, onOpenLogoutModal }) {
  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20 shadow-md">
      <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 text-emerald-400 font-bold text-xl tracking-tight cursor-pointer active:scale-95 transition-transform" 
          onClick={() => setView('DASHBOARD')}
        >
          <Activity className="w-6 h-6" />
          KickerLive
        </div>
        {nickname && view !== 'LOGIN' && (
          <button 
            onClick={onOpenLogoutModal}
            className="text-sm text-slate-400 bg-slate-700/50 hover:bg-slate-700 transition-colors px-3 py-1 rounded-full flex items-center gap-2 cursor-pointer group"
            title="Disconnetti"
          >
            <Users className="w-4 h-4 group-hover:text-red-400 transition-colors" />
            {nickname}
          </button>
        )}
      </div>
    </header>
  );
});

export default Header;