import React, { memo } from 'react';
import { getTeamScore, formatTimestamp } from '../utils/helpers';

const EventCard = memo(function EventCard({ event, onClick }) {
  const isLive = event.status === 'live';

  return (
    <div 
      onClick={onClick}
      className={`bg-slate-800 rounded-xl p-4 border cursor-pointer hover:border-slate-500 transition-all active:scale-[0.99] ${isLive ? 'border-slate-600 shadow-lg' : 'border-slate-800/50'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-white text-lg leading-tight">{event.title}</h3>
          <p className="text-xs text-slate-400 mt-1">{formatTimestamp(event.createdAt)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Host: {event.adminName}</p>
        </div>
        {isLive ? (
           <span className="text-xs font-bold bg-red-500/10 text-red-400 px-2 py-1 rounded-md border border-red-500/20 shadow-sm flex items-center gap-1">
             <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> LIVE
           </span>
        ) : (
           <span className="text-xs font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded-md">FINE</span>
        )}
      </div>
      
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