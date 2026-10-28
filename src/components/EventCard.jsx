import React, { memo } from 'react';
import { Trash2, Clock } from 'lucide-react';
import { getTeamScore, formatTimestamp } from '../utils/helpers';

const EventCard = memo(function EventCard({ event, onClick, onDeleteClick, canDelete = true }) {
  const isLive = event.status === 'live';

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-slate-800 rounded-xl p-4 border cursor-pointer hover:border-slate-500 transition-all active:scale-[0.99] ${
        isLive ? 'border-slate-600 shadow-lg' : 'border-slate-800/50'
      }`}
    >
      {/* Icona Cestino in Alto a Sinistra (Visibile in hover) */}
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(event);
          }}
          className="absolute top-3 left-3 p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
          title="Elimina evento"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div className="flex justify-between items-start mb-3 pl-7">
        <div>
          <h3 className="font-bold text-white text-lg leading-tight">{event.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{formatTimestamp(event.createdAt)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Host: {event.adminName}</p>
        </div>
        
        {isLive ? (
           <span className="text-xs font-bold bg-red-500/10 text-red-400 px-2 py-1 rounded-md border border-red-500/20 shadow-sm flex items-center gap-1 shrink-0">
             <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> LIVE
           </span>
        ) : (
           <span className="text-xs font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded-md shrink-0">FINE</span>
        )}
      </div>

      {/* Banner Stato / Orario di Inizio o Fine */}
      {event.statusText && (
        <div className={`mb-3 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
          isLive 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{event.statusText}</span>
        </div>
      )}
      
      {/* Risultato Squadre */}
      <div className="flex items-center justify-between bg-slate-900/60 rounded-lg p-3">
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs font-semibold mb-1 truncate w-full text-center" style={{ color: event.teams[0].color || '#ef4444' }}>
            {event.teams[0].name}
          </span>
          <span className="text-2xl font-black text-white">{getTeamScore(event.teams[0])}</span>
        </div>
        <div className="text-slate-600 font-bold px-4">-</div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs font-semibold mb-1 truncate w-full text-center" style={{ color: event.teams[1].color || '#174195' }}>
            {event.teams[1].name}
          </span>
          <span className="text-2xl font-black text-white">{getTeamScore(event.teams[1])}</span>
        </div>
      </div>
    </div>
  );
});

export default EventCard;
