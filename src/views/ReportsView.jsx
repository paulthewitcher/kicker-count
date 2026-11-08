import React, { memo, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpDown,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FilterX,
  Search,
  Share2,
  Trophy
} from 'lucide-react';
import {
  buildPlayerReport,
  getAvailableReportPeriods,
  getReportableEvents,
  getSelectedPeriodLabel,
  buildWhatsAppReportText
} from '../utils/reportHelpers';

const INITIAL_FILTERS = {
  dateFrom: '',
  dateTo: '',
  player: '',
  jersey: '',
  team: '',
  title: '',
  host: '',
  status: 'all',
  period: 'regular',
  minGoals: '',
  maxGoals: ''
};

const SORT_OPTIONS = [
  { value: 'selectedGoals', label: 'Gol selezionati' },
  { value: 'numericGoals', label: 'Gol tempi numerici' },
  { value: 'specialGoals', label: 'Gol tempi speciali' },
  { value: 'appearances', label: 'Partite' },
  { value: 'scoringMatches', label: 'Partite a segno' },
  { value: 'jersey', label: 'Numero maglia' },
  { value: 'teams', label: 'Squadra/e' },
  { value: 'name', label: 'Giocatore' }
];

const formatDate = (timestamp) => {
  if (!timestamp) return 'Data non disponibile';
  return new Date(timestamp).toLocaleDateString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const formatSortValue = (row, key) => {
  if (key === 'name') return row.name;
  if (key === 'teams') return row.teams.map((team) => team.name).join(', ');
  if (key === 'jersey') return row.jerseys.join(', ');
  return Number(row[key]) || 0;
};

const ReportsView = memo(function ReportsView({ events, seed, goBack }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sort, setSort] = useState({ key: 'selectedGoals', direction: 'desc' });
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  const reportableEvents = useMemo(() => getReportableEvents(events), [events]);
  const specialPeriods = useMemo(() => getAvailableReportPeriods(reportableEvents), [reportableEvents]);
  const report = useMemo(() => buildPlayerReport(reportableEvents, filters), [reportableEvents, filters]);
  const selectedPeriodLabel = getSelectedPeriodLabel(filters.period, specialPeriods);

  const sortedRows = useMemo(() => [...report.rows].sort((a, b) => {
    const first = formatSortValue(a, sort.key);
    const second = formatSortValue(b, sort.key);
    const comparison = typeof first === 'number' && typeof second === 'number'
      ? first - second
      : String(first).localeCompare(String(second), 'it', { sensitivity: 'base', numeric: true });
    if (comparison !== 0) return sort.direction === 'asc' ? comparison : -comparison;
    return a.name.localeCompare(b.name, 'it');
  }), [report.rows, sort]);

  // L'export resta una classifica marcatori: ordina sempre per gol decrescenti,
  // anche se nella tabella l'utente ha scelto un ordinamento diverso.
  const exportRows = useMemo(() => [...report.rows].sort((a, b) => (
    (Number(b.selectedGoals) || 0) - (Number(a.selectedGoals) || 0)
      || a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
  )), [report.rows]);

  const shareReportOnWhatsApp = () => {
    const text = buildWhatsAppReportText({ rows: exportRows, filters, selectedPeriodLabel });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSort({ key: 'selectedGoals', direction: 'desc' });
    setExpandedPlayer(null);
  };

  const toggleSort = (key) => {
    setSort((current) => current.key === key
      ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: key === 'name' || key === 'teams' || key === 'jersey' ? 'asc' : 'desc' });
  };

  const renderSortButton = (label, key, align = 'left') => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className={`inline-flex items-center gap-1.5 font-semibold hover:text-emerald-300 transition-colors ${align === 'right' ? 'justify-end w-full' : ''}`}
      aria-label={`Ordina per ${label}`}
    >
      {label}
      {sort.key === key ? (
        sort.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
      ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
    </button>
  );

  const renderPlayerDetails = (row) => (
    <div className="mt-3 rounded-lg bg-slate-950/70 border border-slate-700/70 p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">Dettaglio partite</div>
      {row.matchDetails.map((detail, index) => (
        <div key={`${detail.eventId}-${detail.teamName}-${index}`} className="flex items-start justify-between gap-3 text-xs border-b border-slate-800 last:border-0 pb-2 last:pb-0">
          <div className="min-w-0">
            <div className="text-slate-200 font-semibold truncate">{detail.eventTitle}</div>
            <div className="text-slate-500 mt-0.5">{formatDate(detail.matchTimestamp)} · <span style={{ color: detail.teamColor }}>{detail.teamName}</span>{detail.jersey ? ` · #${detail.jersey}` : ''}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-white font-bold tabular-nums">{detail.selectedGoals} gol</div>
            <div className="text-slate-500 tabular-nums">{detail.numericGoals} reg. · {detail.specialGoals} spec.</div>
          </div>
        </div>
      ))}
    </div>
  );

  const togglePlayerDetails = (key) => setExpandedPlayer((current) => current === key ? null : key);

  return (
    <div className="animate-in fade-in duration-300 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Bacheca
        </button>
        <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/50 border border-emerald-500/20 rounded-full px-2.5 py-1">#{seed}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Reports</h1>
          <p className="text-xs text-slate-400">Classifica marcatori e statistiche delle partite</p>
        </div>
      </div>

      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Search className="w-4 h-4 text-emerald-400" /> Filtri di ricerca
          </div>
          <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <FilterX className="w-3.5 h-3.5" /> Azzera
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <label className="min-w-0">
            <span className="block text-[11px] text-slate-400 mb-1">Data partita da</span>
            <span className="relative block">
              <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={(e) => updateFilter('dateFrom', e.target.value)} className="w-full min-w-0 bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]" />
            </span>
          </label>
          <label className="min-w-0">
            <span className="block text-[11px] text-slate-400 mb-1">Data partita a</span>
            <span className="relative block">
              <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={(e) => updateFilter('dateTo', e.target.value)} className="w-full min-w-0 bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]" />
            </span>
          </label>
        </div>
        <p className="text-[10px] text-slate-500 -mt-1">Intervallo inclusivo, basato sul primo avvio della partita (ora locale).</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label>
            <span className="block text-[11px] text-slate-400 mb-1">Giocatore</span>
            <input value={filters.player} onChange={(e) => updateFilter('player', e.target.value)} placeholder="Cerca per nome" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500" />
          </label>
          <label>
            <span className="block text-[11px] text-slate-400 mb-1">Numero maglia</span>
            <input value={filters.jersey} onChange={(e) => updateFilter('jersey', e.target.value)} placeholder="Es. 10" inputMode="numeric" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500" />
          </label>
          <label>
            <span className="block text-[11px] text-slate-400 mb-1">Squadra</span>
            <input value={filters.team} onChange={(e) => updateFilter('team', e.target.value)} placeholder="Cerca squadra (anche parziale)" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500" />
          </label>
          <label>
            <span className="block text-[11px] text-slate-400 mb-1">Evento</span>
            <input value={filters.title} onChange={(e) => updateFilter('title', e.target.value)} placeholder="Nome partita" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500" />
          </label>
          <label>
            <span className="block text-[11px] text-slate-400 mb-1">Organizzatore</span>
            <input value={filters.host} onChange={(e) => updateFilter('host', e.target.value)} placeholder="Nome host" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500" />
          </label>
          <label>
            <span className="block text-[11px] text-slate-400 mb-1">Stato partita</span>
            <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="all">Tutte</option>
              <option value="ended">Terminate</option>
              <option value="live">In corso</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <label>
            <span className="block text-[11px] text-slate-400 mb-1">Tipo di tempo</span>
            <select value={filters.period} onChange={(e) => updateFilter('period', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="regular">Tempi numerici (Totale)</option>
              <option value="special">Tempi speciali</option>
              <option value="all">Tutti i tempi</option>
              {specialPeriods.map((period) => <option key={period.key} value={`name:${period.key}`}>Solo: {period.name}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="block text-[11px] text-slate-400 mb-1">Gol min.</span>
              <input type="number" min="0" value={filters.minGoals} onChange={(e) => updateFilter('minGoals', e.target.value)} placeholder="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500" />
            </label>
            <label>
              <span className="block text-[11px] text-slate-400 mb-1">Gol max.</span>
              <input type="number" min="0" value={filters.maxGoals} onChange={(e) => updateFilter('maxGoals', e.target.value)} placeholder="∞" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500" />
            </label>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 min-w-0">
          <div className="text-[10px] sm:text-xs text-slate-400">Partite</div>
          <div className="text-xl sm:text-2xl font-black text-white tabular-nums">{report.matchingEvents.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 min-w-0">
          <div className="text-[10px] sm:text-xs text-slate-400">Giocatori</div>
          <div className="text-xl sm:text-2xl font-black text-white tabular-nums">{report.rows.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 min-w-0">
          <div className="text-[10px] sm:text-xs text-slate-400 truncate">{selectedPeriodLabel.replace('Gol ', '')}</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">{report.totalGoals}</div>
          <div className="text-[9px] text-slate-500 mt-0.5 truncate">{report.numericGoals} reg. · {report.specialGoals} spec.</div>
        </div>
      </section>

      <section className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-slate-700 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Classifica marcatori</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{selectedPeriodLabel} · Tocca un giocatore per il dettaglio</p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <label className="text-[10px] text-slate-400">
              <span className="sr-only">Ordina per</span>
              <select value={sort.key} onChange={(e) => setSort({ key: e.target.value, direction: ['name', 'teams', 'jersey'].includes(e.target.value) ? 'asc' : 'desc' })} className="max-w-[132px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] text-white sm:hidden">
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={shareReportOnWhatsApp}
              className="w-9 h-9 shrink-0 flex items-center justify-center bg-slate-900/60 text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-slate-200 transition-colors"
              title="Condividi classifica su WhatsApp"
              aria-label="Condividi classifica su WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {sortedRows.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {reportableEvents.length === 0 ? 'Non ci sono ancora partite con dati disponibili per questa stanza.' : report.matchingEvents.length === 0 ? 'Nessuna partita corrisponde ai filtri selezionati.' : 'Nessun giocatore corrisponde ai filtri selezionati.'}
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm min-w-[850px]">
                <thead className="bg-slate-900/70 text-[11px] text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-3">{renderSortButton('Giocatore', 'name')}</th>
                    <th className="text-left px-3 py-3">{renderSortButton('Maglia', 'jersey')}</th>
                    <th className="text-left px-3 py-3">{renderSortButton('Squadra/e', 'teams')}</th>
                    <th className="text-right px-3 py-3">{renderSortButton('Partite', 'appearances', 'right')}</th>
                    <th className="text-right px-3 py-3">{renderSortButton('A segno', 'scoringMatches', 'right')}</th>
                    <th className="text-right px-3 py-3">{renderSortButton('Gol reg.', 'numericGoals', 'right')}</th>
                    <th className="text-right px-3 py-3">{renderSortButton('Gol spec.', 'specialGoals', 'right')}</th>
                    <th className="text-right px-4 py-3">{renderSortButton('Gol filtro', 'selectedGoals', 'right')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/70">
                  {sortedRows.map((row, index) => (
                    <React.Fragment key={row.key}>
                      <tr onClick={() => togglePlayerDetails(row.key)} className="cursor-pointer hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-white font-semibold">{index + 1}. {row.name}</td>
                        <td className="px-3 py-3 text-slate-400 font-mono">{row.jerseys.length ? row.jerseys.map((jersey) => `#${jersey}`).join(', ') : '—'}</td>
                        <td className="px-3 py-3"><div className="flex flex-wrap gap-1.5">{row.teams.map((team) => <span key={`${row.key}-${team.name}`} className="inline-flex items-center gap-1 text-xs text-slate-300"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />{team.name}</span>)}</div></td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{row.appearances}</td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{row.scoringMatches}</td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{row.numericGoals}</td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{row.specialGoals}</td>
                        <td className="px-4 py-3 text-right text-emerald-400 font-black text-base tabular-nums">{row.selectedGoals}</td>
                      </tr>
                      {expandedPlayer === row.key && <tr><td colSpan={8} className="px-4 pb-4">{renderPlayerDetails(row)}</td></tr>}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-slate-700/70">
              {sortedRows.map((row, index) => (
                <div key={row.key} className="p-3">
                  <button type="button" onClick={() => togglePlayerDetails(row.key)} className="w-full text-left">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-bold truncate">{index + 1}. {row.name}</div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-slate-400">
                          {row.jerseys.length > 0 && <span>#{row.jerseys.join(', #')}</span>}
                          {row.teams.map((team) => <span key={`${row.key}-${team.name}`} className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: team.color }} />{team.name}</span>)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl text-emerald-400 font-black tabular-nums">{row.selectedGoals}</div>
                        <div className="text-[9px] text-slate-500 uppercase">gol</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-500">
                      <span>{row.appearances} partite</span>
                      <span>{row.scoringMatches} a segno</span>
                      <span>{row.numericGoals} reg.</span>
                      <span>{row.specialGoals} spec.</span>
                    </div>
                  </button>
                  {expandedPlayer === row.key && renderPlayerDetails(row)}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="text-[10px] leading-relaxed text-slate-500 px-1">
        Il report considera soltanto i documenti partita con due squadre, escludendo i documenti tecnici della stanza. I giocatori con lo stesso nome vengono raggruppati; i gol sono ricavati dai conteggi salvati per tempo. I tempi numerici sono selezionati di default, mentre Rigori ed Extra time restano separati.
      </div>
    </div>
  );
});

export default ReportsView;
