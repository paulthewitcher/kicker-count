import { memo } from 'react';
import { Activity, Users, Hash, ArrowLeft } from 'lucide-react';

const Header = memo(function Header({
  nickname,
  seed,
  view,
  setView,
  onOpenLogoutModal,
  onOpenSeedModal,
  onBackFromEvent
}) {
  const brand = (
    <button
      type="button"
      className="flex items-center gap-2 text-emerald-400 font-bold text-lg sm:text-xl tracking-tight cursor-pointer active:scale-95 transition-transform min-w-0"
      onClick={() => setView('DASHBOARD')}
      title="KickerLive"
    >
      <Activity className="w-6 h-6 shrink-0" />
      <span>KickerLive</span>
    </button>
  );

  const seedButton = seed && view !== 'LOGIN' ? (
    <button
      onClick={onOpenSeedModal}
      className="text-[10px] sm:text-xs text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 transition-all px-2 py-1 rounded-full flex items-center gap-1 cursor-pointer font-mono font-semibold active:scale-95 min-w-0"
      title="Cambia Seed Stanza"
    >
      <Hash className="w-3 h-3 text-emerald-400 shrink-0" />
      <span className="max-w-[76px] sm:max-w-[100px] truncate">{seed}</span>
    </button>
  ) : null;

  const profileButton = nickname && view !== 'LOGIN' ? (
    <button
      onClick={onOpenLogoutModal}
      className="text-xs sm:text-sm text-slate-400 bg-slate-700/50 hover:bg-slate-700 transition-colors px-2 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer group max-w-[88px] sm:max-w-[120px]"
      title="Disconnetti"
    >
      <Users className="w-4 h-4 group-hover:text-red-400 transition-colors shrink-0" />
      <span className="truncate">{nickname}</span>
    </button>
  ) : null;

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20 shadow-md">
      {view === 'EVENT' ? (
        <div className="max-w-xl mx-auto px-3 h-16 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <button
            onClick={onBackFromEvent}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs sm:text-sm whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" /> Indietro
          </button>

          <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-w-0">
            {brand}
            {seedButton}
          </div>

          <div className="justify-self-end">{profileButton}</div>
        </div>
      ) : (
        <div className={`${view === 'REPORTS' ? 'max-w-6xl' : 'max-w-xl'} mx-auto px-4 h-16 flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3 min-w-0">
            {brand}
            {seedButton}
          </div>
          {profileButton}
        </div>
      )}
    </header>
  );
});

export default Header;
