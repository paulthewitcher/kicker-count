export const getEventPeriods = (event) => {
  if (Array.isArray(event?.periods)) return event.periods;
  return [{ id: 'period-1', name: '1', number: 1 }];
};

export const getPlayerGoalsInPeriod = (player, periodId, periods = []) => {
  const goalsByPeriod = player?.goalsByPeriod;

  if (goalsByPeriod && Object.prototype.hasOwnProperty.call(goalsByPeriod, periodId)) {
    return Math.max(0, Number(goalsByPeriod[periodId]) || 0);
  }

  // Compatibilità con le partite create prima dell'introduzione dei tempi.
  if (!goalsByPeriod && periodId === periods[0]?.id) {
    return Math.max(0, Number(player?.goals) || 0);
  }

  return 0;
};

export const getPlayerTotalGoals = (player, periods = []) => {
  if (player?.goalsByPeriod) {
    return periods.reduce(
      (total, period) => total + getPlayerGoalsInPeriod(player, period.id, periods),
      0
    );
  }

  return Math.max(0, Number(player?.goals) || 0);
};

export const getTeamScoreForPeriod = (team, periodId, periods = []) => {
  const playerGoals = (team?.players || []).reduce(
    (total, player) => total + getPlayerGoalsInPeriod(player, periodId, periods),
    0
  );

  const offset = team?.scoreOffsetsByPeriod
    ? Number(team.scoreOffsetsByPeriod[periodId]) || 0
    : (periodId === periods[0]?.id ? Number(team?.scoreOffset) || 0 : 0);

  return playerGoals + offset;
};

export const getTeamTotalScore = (team, periods = []) => {
  const playerGoals = (team?.players || []).reduce(
    (total, player) => total + getPlayerTotalGoals(player, periods),
    0
  );

  const offsets = team?.scoreOffsetsByPeriod
    ? periods.reduce(
        (total, period) => total + (Number(team.scoreOffsetsByPeriod[period.id]) || 0),
        0
      )
    : Number(team?.scoreOffset) || 0;

  return playerGoals + offsets;
};

export const getTeamScore = (team) => {
  const baseScore = team?.players
    ? team.players.reduce((acc, player) => acc + (Number(player.goals) || 0), 0)
    : 0;

  const offset = team?.scoreOffsetsByPeriod
    ? Object.values(team.scoreOffsetsByPeriod).reduce((total, value) => total + (Number(value) || 0), 0)
    : (Number(team?.scoreOffset) || 0);

  return baseScore + offset;
};

export const getSortedPlayers = (players, getGoals = (player) => Number(player.goals) || 0) => {
  return [...(players || [])].sort((a, b) => getGoals(b) - getGoals(a));
};

export const formatTimestamp = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
