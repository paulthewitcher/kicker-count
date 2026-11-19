import { toTimestampMs } from './helpers.js';

export const parseItalianDateTime = (value) => {
  const match = String(value || '').trim().match(/^([0-3]\d)-([01]\d)-(\d{4})(?:\s+([0-2]\d):([0-5]\d):([0-5]\d))?$/);
  if (!match) return null;
  const [, day, month, year, hours = '00', minutes = '00', seconds = '00'] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds));
  if (
    parsed.getFullYear() !== Number(year)
    || parsed.getMonth() !== Number(month) - 1
    || parsed.getDate() !== Number(day)
    || parsed.getHours() !== Number(hours)
    || parsed.getMinutes() !== Number(minutes)
    || parsed.getSeconds() !== Number(seconds)
  ) return null;
  return parsed.getTime();
};

export const formatShareDate = (timestamp) => {
  if (timestamp === null || timestamp === undefined) return '';
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = value => String(value).padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
};

/**
 * The editable event date (createdAt) is the canonical date used in the
 * dashboard and WhatsApp export. For legacy documents without createdAt,
 * fall back to the earliest active goal in goalHistory/timeline.
 */
export const getEventShareDate = (event) => {
  const canonicalCreatedAt = toTimestampMs(event?.createdAt);
  if (canonicalCreatedAt !== null) return formatShareDate(canonicalCreatedAt);

  const timeline = Array.isArray(event?.timeline) ? event.timeline : [];
  const cancelledGoalIds = new Set(
    timeline
      .filter(log => log?.type === 'undo' && log.undoesGoalId)
      .map(log => log.undoesGoalId)
  );
  const goalHistoryById = new Map();

  (event?.teams || []).forEach(team => {
    (team?.players || []).forEach(player => {
      (player?.goalHistory || []).forEach(goal => {
        if (goal?.id) goalHistoryById.set(goal.id, goal);
      });
    });
  });

  // Nei vecchi eventi alcuni log di annullamento non avevano undoesGoalId.
  // Li associamo al goal più recente precedente dello stesso giocatore/tempo.
  const timelineGoals = timeline
    .filter(log => log?.type === 'goal')
    .map(log => ({ log, timestamp: toTimestampMs(log.timestamp) ?? parseItalianDateTime(log.dateTime) }))
    .filter(item => item.timestamp !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
  const legacyUndos = timeline
    .filter(log => log?.type === 'undo' && !log.undoesGoalId)
    .map(log => ({ log, timestamp: toTimestampMs(log.timestamp) ?? parseItalianDateTime(log.dateTime) }))
    .filter(item => item.timestamp !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
  const cancelledTimelineGoalIds = new Set();

  legacyUndos.forEach(({ log: undo, timestamp: undoTimestamp }) => {
    const candidate = timelineGoals
      .filter(({ log: goal, timestamp }) => (
        timestamp <= undoTimestamp
        && !cancelledTimelineGoalIds.has(goal.id)
        && (!undo.playerName || !goal.playerName || undo.playerName === goal.playerName)
        && (!undo.periodId || !goal.periodId || undo.periodId === goal.periodId)
        && (!undo.teamId || !goal.teamId || undo.teamId === goal.teamId)
        && (!undo.teamName || !goal.teamName || undo.teamName === goal.teamName)
      ))
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    if (candidate?.log?.id) cancelledTimelineGoalIds.add(candidate.log.id);
  });

  const goalTimestamps = [];
  (event?.teams || []).forEach(team => {
    (team?.players || []).forEach(player => {
      (player?.goalHistory || []).forEach(goal => {
        if (goal?.status === 'cancelled' || (goal?.id && cancelledGoalIds.has(goal.id))) return;
        const timestamp = toTimestampMs(goal?.timestamp) ?? parseItalianDateTime(goal?.dateTime);
        if (timestamp !== null) goalTimestamps.push(timestamp);
      });
    });
  });

  timeline.forEach(log => {
    if (log?.type !== 'goal' || cancelledTimelineGoalIds.has(log.id)) return;
    const historyRecord = log.goalRecordId ? goalHistoryById.get(log.goalRecordId) : null;
    if (historyRecord?.status === 'cancelled' || (log.goalRecordId && cancelledGoalIds.has(log.goalRecordId))) return;
    const timestamp = toTimestampMs(log.timestamp) ?? parseItalianDateTime(log.dateTime);
    if (timestamp !== null) goalTimestamps.push(timestamp);
  });

  const firstGoalTimestamp = goalTimestamps.length ? Math.min(...goalTimestamps) : null;
  const fallbackTimestamp = toTimestampMs(event?.createdAt);
  return formatShareDate(firstGoalTimestamp ?? fallbackTimestamp);
};
