import { GOAL_REACTION_EMOJI, OPERA_GOAL_TEMPLATES } from './constants.js';
import {
  getEventPeriods,
  getPlayerGoalsInPeriod,
  getPlayerTotalGoals,
  getTeamTotalScore
} from './helpers.js';

const formatGoalDateTime = (date) => {
  const pad = value => String(value).padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

/**
 * Pure builder for a single goal/undo operation.
 * The caller must execute the returned update in a Firestore transaction so
 * concurrent clicks are applied to the latest event document, not a stale UI snapshot.
 */
export const buildPlayerGoalUpdate = (eventData, {
  adminUid,
  teamId,
  teamIndex,
  expectedTeamName,
  playerId,
  periodId,
  delta,
  now = new Date(),
  createId = () => crypto.randomUUID()
}) => {
  if (!adminUid || eventData?.adminId !== adminUid) {
    throw new Error('Solo l’amministratore può registrare i gol.');
  }
  if (eventData?.status !== 'live') {
    throw new Error('È possibile modificare i gol soltanto durante una partita in corso.');
  }
  if (![1, -1].includes(Number(delta))) {
    throw new Error('Operazione goal non valida.');
  }

  const periods = getEventPeriods(eventData).map(period => ({ ...period }));
  if (!periods.some(period => period.id === periodId)) {
    throw new Error('Il tempo selezionato non esiste più.');
  }

  const sourceTeams = Array.isArray(eventData.teams) ? eventData.teams : [];
  let resolvedTeamIndex = teamId
    ? sourceTeams.findIndex(team => String(team?.id ?? '') === String(teamId))
    : -1;

  // Legacy fallback: some very old teams may not have a stable ID. In that
  // case we only use the old position if its name still matches the UI value.
  if (resolvedTeamIndex < 0 && Number.isInteger(teamIndex) && teamIndex >= 0 && teamIndex < sourceTeams.length) {
    const candidate = sourceTeams[teamIndex];
    if (!candidate?.id && (!expectedTeamName || candidate?.name === expectedTeamName)) {
      resolvedTeamIndex = teamIndex;
    }
  }
  if (resolvedTeamIndex < 0) {
    throw new Error('La squadra selezionata non è più disponibile. Aggiorna la partita e riprova.');
  }

  const sourceTeam = sourceTeams[resolvedTeamIndex];
  const playerIndex = (sourceTeam.players || []).findIndex(player => String(player?.id ?? '') === String(playerId ?? ''));
  if (playerIndex < 0) {
    throw new Error('Il giocatore selezionato non è più disponibile. Aggiorna la partita e riprova.');
  }

  const teams = sourceTeams.map((team, index) => {
    if (index !== resolvedTeamIndex) return team;
    const players = (team.players || []).map((player, indexInTeam) => {
      if (indexInTeam !== playerIndex) return player;

      const goalsByPeriod = player.goalsByPeriod
        ? { ...player.goalsByPeriod }
        : (periods.length ? { [periods[0].id]: Number(player.goals) || 0 } : {});
      const currentGoals = getPlayerGoalsInPeriod({ ...player, goalsByPeriod }, periodId, periods);
      const nextGoals = currentGoals + Number(delta);
      if (nextGoals < 0) return player;

      goalsByPeriod[periodId] = nextGoals;
      const nextPlayer = {
        ...player,
        goalsByPeriod,
        goalHistory: Array.isArray(player.goalHistory) ? [...player.goalHistory] : []
      };

      return nextPlayer;
    });
    return { ...team, players };
  });

  const targetPlayer = teams[resolvedTeamIndex].players[playerIndex];
  const sourcePlayer = sourceTeam.players[playerIndex];
  const currentGoals = getPlayerGoalsInPeriod(
    {
      ...sourcePlayer,
      goalsByPeriod: sourcePlayer.goalsByPeriod
        ? { ...sourcePlayer.goalsByPeriod }
        : (periods.length ? { [periods[0].id]: Number(sourcePlayer.goals) || 0 } : {})
    },
    periodId,
    periods
  );
  if (currentGoals + Number(delta) < 0) return null;

  const nowDate = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(nowDate.getTime())) throw new Error('Data del goal non valida.');
  const nowTimestamp = nowDate.getTime();
  const timeString = nowDate.toLocaleTimeString('it-IT', { hour12: false });
  const goalDateTime = formatGoalDateTime(nowDate);
  const selectedPeriodName = periods.find(period => period.id === periodId)?.name || '';
  let goalRecordId = null;

  const targetPlayerWithHistory = {
    ...targetPlayer,
    goalHistory: Array.isArray(targetPlayer.goalHistory) ? [...targetPlayer.goalHistory] : []
  };

  if (Number(delta) > 0) {
    goalRecordId = createId();
    targetPlayerWithHistory.goalHistory.push({
      id: goalRecordId,
      periodId,
      timestamp: nowTimestamp,
      dateTime: goalDateTime,
      status: 'active'
    });
  } else {
    const latestActiveGoal = targetPlayerWithHistory.goalHistory
      .map((goal, index) => ({ goal, index }))
      .filter(({ goal }) => goal.periodId === periodId && goal.status !== 'cancelled')
      .sort((a, b) => (Number(b.goal.timestamp) || 0) - (Number(a.goal.timestamp) || 0))[0];

    if (latestActiveGoal) {
      goalRecordId = latestActiveGoal.goal.id || null;
      targetPlayerWithHistory.goalHistory[latestActiveGoal.index] = {
        ...latestActiveGoal.goal,
        status: 'cancelled',
        cancelledAt: nowTimestamp,
        cancelledDateTime: goalDateTime
      };
    }
  }

  targetPlayerWithHistory.goals = getPlayerTotalGoals(targetPlayerWithHistory, periods);
  teams[resolvedTeamIndex].players[playerIndex] = targetPlayerWithHistory;

  const team = teams[resolvedTeamIndex];
  let operaGoalIndex = Number(eventData.operaGoalIndex) || 0;
  const timeline = Array.isArray(eventData.timeline) ? [...eventData.timeline] : [];

  if (Number(delta) > 0) {
    let customTemplate = null;
    const currentTeamScore = getTeamTotalScore(team, periods);
    if (String(team.name || '').toLocaleLowerCase('it-IT').includes('opera') && currentTeamScore >= 4) {
      customTemplate = OPERA_GOAL_TEMPLATES[operaGoalIndex % OPERA_GOAL_TEMPLATES.length];
      operaGoalIndex = (operaGoalIndex + 1) % OPERA_GOAL_TEMPLATES.length;
    }
    timeline.unshift({
      id: createId(),
      type: 'goal',
      playerName: targetPlayerWithHistory.name,
      teamId: team.id || null,
      teamName: team.name,
      periodId,
      periodName: selectedPeriodName,
      time: timeString,
      timestamp: nowTimestamp,
      dateTime: goalDateTime,
      goalRecordId,
      customTemplate,
      customMessage: customTemplate ? customTemplate.replace(/<giocatore>/g, targetPlayerWithHistory.name) : null
    });
  } else {
    timeline.unshift({
      id: createId(),
      type: 'undo',
      playerName: targetPlayerWithHistory.name,
      teamId: team.id || null,
      teamName: team.name,
      periodId,
      periodName: selectedPeriodName,
      time: timeString,
      timestamp: nowTimestamp,
      dateTime: goalDateTime,
      ...(goalRecordId ? { undoesGoalId: goalRecordId } : {})
    });
  }

  const update = { periods, teams, timeline };
  const isOperaTeam = String(team.name || '')
    .normalize('NFC')
    .trim()
    .toLocaleLowerCase('it-IT') === 'opera';

  if (Number(delta) > 0) {
    // The automatic ball reaction is a special celebration reserved for the
    // Opera team. Manual emoji reactions remain available to every user/team.
    // Write the complete reactions map in the same transaction as the goal
    // to avoid special-character field-path issues with emoji map keys.
    if (isOperaTeam) {
      update.reactions = {
        ...(eventData.reactions || {}),
        [GOAL_REACTION_EMOJI]: (Number(eventData.reactions?.[GOAL_REACTION_EMOJI]) || 0) + 1
      };
    }
    if (operaGoalIndex !== (Number(eventData.operaGoalIndex) || 0)) {
      update.operaGoalIndex = operaGoalIndex;
    }
  }

  return update;
};
