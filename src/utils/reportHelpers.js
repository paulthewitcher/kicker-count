import {
  getEventPeriods,
  getPlayerGoalsInPeriod,
  isNumericPeriod
} from './helpers';

export const toTimestampMs = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  if (value && typeof value.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

// La data della partita è il primo avvio registrato nella timeline.
// createdAt è il fallback per gli eventi legacy senza log di avvio.
export const getMatchStartTimestamp = (event) => {
  const startLogs = (event?.timeline || [])
    .filter((log) => log?.type === 'start')
    .map((log) => toTimestampMs(log.timestamp))
    .filter(Number.isFinite);

  if (startLogs.length) return Math.min(...startLogs);
  return toTimestampMs(event?.createdAt);
};

export const getReportableEvents = (events = []) => (events || []).filter((event) => (
  Array.isArray(event?.teams)
  && event.teams.length === 2
  && event.teams.every((team) => team?.players == null || Array.isArray(team.players))
));

// Normalizzazione comune per tutte le ricerche testuali: ignora maiuscole,
// accenti e spazi superflui. La ricerca successiva con includes() equivale a LIKE '%testo%'.
const normalizeText = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('it-IT');

// La chiave di aggregazione del giocatore resta distinta dalla normalizzazione
// di ricerca: non fondiamo automaticamente due nominativi che differiscono solo
// per un accento (es. Jose e José). Le ricerche, invece, ignorano gli accenti.
const normalizePlayerKey = (value) => String(value ?? '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('it-IT');

const getGoalBreakdown = (player, periods) => {
  return periods.reduce((result, period) => {
    const goals = getPlayerGoalsInPeriod(player, period.id, periods);
    if (isNumericPeriod(period)) result.numeric += goals;
    else result.special += goals;
    result.byPeriod[normalizeText(period.name)] = (result.byPeriod[normalizeText(period.name)] || 0) + goals;
    return result;
  }, { numeric: 0, special: 0, byPeriod: {} });
};

const getSelectedGoals = (breakdown, periodFilter) => {
  if (periodFilter === 'regular') return breakdown.numeric;
  if (periodFilter === 'special') return breakdown.special;
  if (periodFilter === 'all') return breakdown.numeric + breakdown.special;
  if (periodFilter.startsWith('name:')) {
    return breakdown.byPeriod[periodFilter.slice(5)] || 0;
  }
  return breakdown.numeric;
};

const dateToStartOfDay = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isFinite(date.getTime()) ? date.getTime() : null;
};

const dateToEndOfDay = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T23:59:59.999`);
  return Number.isFinite(date.getTime()) ? date.getTime() : null;
};

export const buildPlayerReport = (events, filters) => {
  const fromTimestamp = dateToStartOfDay(filters.dateFrom);
  const toTimestamp = dateToEndOfDay(filters.dateTo);
  const titleQuery = normalizeText(filters.title);
  const hostQuery = normalizeText(filters.host);
  const playerQuery = normalizeText(filters.player);
  const jerseyQuery = normalizeText(filters.jersey);
  const selectedTeam = normalizeText(filters.team);

  const matchingEvents = getReportableEvents(events).filter((event) => {
    const matchTimestamp = getMatchStartTimestamp(event);
    if (fromTimestamp !== null && (matchTimestamp === null || matchTimestamp < fromTimestamp)) return false;
    if (toTimestamp !== null && (matchTimestamp === null || matchTimestamp > toTimestamp)) return false;
    if (titleQuery && !normalizeText(event.title).includes(titleQuery)) return false;
    if (hostQuery && !normalizeText(event.adminName).includes(hostQuery)) return false;
    if (filters.status !== 'all' && event.status !== filters.status) return false;
    if (selectedTeam && !(event.teams || []).some((team) => normalizeText(team.name).includes(selectedTeam))) return false;
    return true;
  });

  const playersByName = new Map();

  matchingEvents.forEach((event) => {
    const matchTimestamp = getMatchStartTimestamp(event);
    const periods = getEventPeriods(event);

    event.teams.forEach((team) => {
      if (selectedTeam && !normalizeText(team.name).includes(selectedTeam)) return;

      (team.players || []).forEach((player) => {
        const playerName = String(player?.name || '').trim();
        const nameKey = normalizePlayerKey(playerName);
        if (!nameKey) return;
        if (playerQuery && !normalizeText(playerName).includes(playerQuery)) return;
        if (jerseyQuery && !normalizeText(player.jersey).includes(jerseyQuery)) return;

        const breakdown = getGoalBreakdown(player, periods);
        const selectedGoals = getSelectedGoals(breakdown, filters.period);

        let row = playersByName.get(nameKey);
        if (!row) {
          row = {
            key: nameKey,
            name: playerName,
            jerseys: new Set(),
            teams: new Map(),
            appearances: new Set(),
            scoringMatches: new Set(),
            numericGoals: 0,
            specialGoals: 0,
            selectedGoals: 0,
            matchDetails: []
          };
          playersByName.set(nameKey, row);
        }

        if (player.jersey !== undefined && player.jersey !== null && String(player.jersey).trim()) {
          row.jerseys.add(String(player.jersey).trim());
        }
        row.teams.set(normalizeText(team.name) || String(team.id || ''), {
          name: team.name || 'Squadra',
          color: team.color || '#64748b'
        });
        row.appearances.add(event.id);
        if (selectedGoals > 0) row.scoringMatches.add(event.id);
        row.numericGoals += breakdown.numeric;
        row.specialGoals += breakdown.special;
        row.selectedGoals += selectedGoals;
        row.matchDetails.push({
          eventId: event.id,
          eventTitle: event.title || 'Partita senza titolo',
          matchTimestamp,
          teamName: team.name || 'Squadra',
          teamColor: team.color || '#64748b',
          jersey: player.jersey || '',
          numericGoals: breakdown.numeric,
          specialGoals: breakdown.special,
          selectedGoals
        });
      });
    });
  });

  const minGoals = filters.minGoals === '' ? null : Number(filters.minGoals);
  const maxGoals = filters.maxGoals === '' ? null : Number(filters.maxGoals);

  const rows = [...playersByName.values()]
    .map((row) => ({
      ...row,
      jerseys: [...row.jerseys].sort((a, b) => a.localeCompare(b, 'it', { numeric: true })),
      teams: [...row.teams.values()],
      appearances: row.appearances.size,
      scoringMatches: row.scoringMatches.size,
      matchDetails: row.matchDetails.sort((a, b) => (b.matchTimestamp || 0) - (a.matchTimestamp || 0))
    }))
    .filter((row) => minGoals === null || row.selectedGoals >= minGoals)
    .filter((row) => maxGoals === null || row.selectedGoals <= maxGoals);

  return {
    matchingEvents,
    rows,
    totalGoals: rows.reduce((total, row) => total + row.selectedGoals, 0),
    numericGoals: rows.reduce((total, row) => total + row.numericGoals, 0),
    specialGoals: rows.reduce((total, row) => total + row.specialGoals, 0)
  };
};

export const getAvailableReportTeams = (events) => {
  const names = new Set();
  getReportableEvents(events).forEach((event) => {
    (event.teams || []).forEach((team) => {
      if (team?.name) names.add(String(team.name).trim());
    });
  });
  return [...names].sort((a, b) => a.localeCompare(b, 'it'));
};

export const getAvailableReportPeriods = (events) => {
  const periods = new Map();
  getReportableEvents(events).forEach((event) => {
    getEventPeriods(event).forEach((period) => {
      const name = String(period.name || '').trim();
      const key = normalizeText(name);
      if (key && !periods.has(key)) periods.set(key, name);
    });
  });
  return [...periods.entries()].map(([key, name]) => ({ key, name })).sort((a, b) => a.name.localeCompare(b.name, 'it', { numeric: true }));
};

export const getSelectedPeriodLabel = (periodFilter, specialPeriods = []) => {
  if (periodFilter === 'regular') return 'Gol nei tempi numerici';
  if (periodFilter === 'special') return 'Gol nei tempi speciali';
  if (periodFilter === 'all') return 'Gol in tutti i tempi';
  const selected = specialPeriods.find((period) => `name:${period.key}` === periodFilter);
  return selected ? `Gol: ${selected.name}` : 'Gol nei tempi numerici';
};
