import React, { memo } from 'react';
import { Plus, History } from 'lucide-react';
import EventCard from '../components/EventCard';

const DashboardView = memo(function DashboardView({ events, goToCreate, openEvent }) {
  const liveEvents = events.filter(e => e.status === 'live');
  const pastEvents = events.filter(e => e.status === 'ended');

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <button 
          onClick={goToCreate}
          className="w-full group bg-gradient-to-r from-emerald-600 to-teal-500 p-1 rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-[0.98]"
        >
          <div className="bg-slate-900/40 rounded-xl px-4 py-4 flex items-center justify-between group-hover:bg-transparent transition-all">
            <div className="flex flex-col text-left">
              <span className="text-white font-bold text-lg">Nuova Partita</span>
              <span className="text-emerald-100 text-sm opacity-90">Crea o importa un evento</span>
            </div>
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:rotate-90 transition-transform">
              <Plus className="w-6 h-6 text-white" />
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
              Nessuna partita in corso in questo momento.
            </div>
          ) : (
            <div className="space-y-3">
              {liveEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => openEvent(event.id)} />
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
                <EventCard key={event.id} event={event} onClick={() => openEvent(event.id)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
});

export default DashboardView;