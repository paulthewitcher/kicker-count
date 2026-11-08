import React, { memo } from 'react';
import { Plus, History, BarChart3 } from 'lucide-react';
import EventCard from '../components/EventCard';

const DashboardView = memo(function DashboardView({ events, seed, user, goToCreate, goToReports, openEvent, onRequestDelete }) {
  const liveEvents = events.filter(e => e.status === 'live');
  const pastEvents = events.filter(e => e.status === 'ended');

  return (
    <div className="animate-in fade-in duration-300">
      
      <div className="mb-8 grid grid-cols-2 gap-3">
        <button
          onClick={goToCreate}
          className="group min-w-0 bg-gradient-to-r from-emerald-600 to-teal-500 p-1 rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-[0.98] text-left"
        >
          <div className="h-full min-h-[88px] bg-slate-900/40 rounded-xl px-3 py-3 sm:px-4 sm:py-4 flex items-center justify-between gap-2 group-hover:bg-transparent transition-all">
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold text-base sm:text-lg leading-tight">Nuova Partita</span>
              <span className="text-emerald-100 text-[11px] sm:text-sm opacity-90 mt-1">Crea o importa</span>
            </div>
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:rotate-90 transition-transform shrink-0">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </button>

        <button
          onClick={goToReports}
          className="group min-w-0 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-emerald-500/50 rounded-2xl shadow-lg transition-all active:scale-[0.98] text-left"
        >
          <div className="min-h-[88px] h-full px-3 py-3 sm:px-4 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold text-base sm:text-lg leading-tight">Reports</span>
              <span className="text-slate-400 text-[11px] sm:text-sm mt-1">Marcatori e statistiche</span>
            </div>
            <div className="bg-slate-700 group-hover:bg-emerald-500/15 p-2 rounded-full transition-colors shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 group-hover:text-emerald-400" />
            </div>
          </div>
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Live ({liveEvents.length})
          </h2>
          
          {liveEvents.length === 0 ? (
            <div className="text-center p-6 border border-dashed border-slate-700 rounded-xl text-slate-500 text-sm">
              Nessuna partita in corso per la stanza <span className="font-mono text-emerald-400 font-bold">#{seed}</span>.
            </div>
          ) : (
            <div className="space-y-3">
              {liveEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={() => openEvent(event.id)} 
                  onDeleteClick={onRequestDelete}
                  canDelete={Boolean(user?.uid && event.adminId === user.uid)}
                />
              ))}
            </div>
          )}
        </section>

        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 mt-8 flex items-center gap-2">
              <History className="w-4 h-4" /> Partite Terminate
            </h2>
            <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
              {pastEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={() => openEvent(event.id)} 
                  onDeleteClick={onRequestDelete}
                  canDelete={Boolean(user?.uid && event.adminId === user.uid)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
});

export default DashboardView;
