import assert from 'node:assert/strict';
import {
  getPlayerTotalGoals,
  getTeamTotalScore,
  toTimestampMs,
  formatDateTimeLocalInput,
  parseDateTimeLocalInput
} from '../src/utils/helpers.js';
import {
  GOAL_REACTION_EMOJI,
  LEGACY_GOAL_REACTION_EMOJI,
  getEmojiReactionCount,
  normalizeReactionEmoji,
  EMOJI_LIST
} from '../src/utils/constants.js';
import { buildPlayerGoalUpdate } from '../src/utils/goalUpdates.js';
import {
  buildPlayerReport,
  buildWhatsAppReportText,
  getMatchStartTimestamp
} from '../src/utils/reportHelpers.js';
import { getEventShareDate } from '../src/utils/eventShareHelpers.js';
import { getReactionPhrase, mergeEventTimeline } from '../src/utils/reactionHelpers.js';

process.env.TZ = 'Europe/Rome';

let generatedId = 0;
const createId = () => `test-id-${++generatedId}`;
const makeDate = (day, hour = 12, minute = 0) => new Date(2026, 10, day, hour, minute, 0);

// Timestamp normalisation covers Firestore Timestamp, serialized Timestamp,
// Date and millisecond-number values.
const knownTimestamp = makeDate(8, 9, 30).getTime();
assert.equal(toTimestampMs(knownTimestamp), knownTimestamp);
assert.equal(toTimestampMs(new Date(knownTimestamp)), knownTimestamp);
assert.equal(toTimestampMs({ seconds: Math.floor(knownTimestamp / 1000), nanoseconds: 0 }), knownTimestamp);
assert.equal(toTimestampMs({ _seconds: Math.floor(knownTimestamp / 1000), _nanoseconds: 0 }), knownTimestamp);
assert.equal(toTimestampMs({ toMillis: () => knownTimestamp }), knownTimestamp);
const localDateTimeValue = formatDateTimeLocalInput(knownTimestamp);
assert.equal(parseDateTimeLocalInput(localDateTimeValue), knownTimestamp);
assert.equal(parseDateTimeLocalInput('not-a-date'), null);

// The goal reaction is canonicalised (⚽ and ⚽️) and old counts remain visible.
assert.equal(normalizeReactionEmoji(LEGACY_GOAL_REACTION_EMOJI), GOAL_REACTION_EMOJI);
assert.equal(getEmojiReactionCount({ [GOAL_REACTION_EMOJI]: 2, [LEGACY_GOAL_REACTION_EMOJI]: 4 }, GOAL_REACTION_EMOJI), 6);
assert.equal(EMOJI_LIST.length, 20);
assert.equal(EMOJI_LIST[0], GOAL_REACTION_EMOJI);

const initialEvent = {
  id: 'event-1',
  adminId: 'admin-1',
  status: 'live',
  createdAt: knownTimestamp,
  title: 'Amichevole',
  adminName: 'Mario',
  seed: 'opera2019',
  periods: [
    { id: 'period-1', name: '1', number: 1 },
    { id: 'period-2', name: '2', number: 2 },
    { id: 'rigori', name: 'Rigori' }
  ],
  teams: [
    {
      id: 't1',
      name: 'Opera',
      color: '#feed00',
      scoreOffsetsByPeriod: { 'period-1': 0, 'period-2': 0, rigori: 0 },
      players: [{
        id: 'p1', name: 'Pippo', jersey: '10', goals: 3,
        goalsByPeriod: { 'period-1': 3, 'period-2': 0, rigori: 0 },
        goalHistory: []
      }]
    },
    {
      id: 't2',
      name: 'Macallesi',
      color: '#174195',
      scoreOffsetsByPeriod: { 'period-1': 0, 'period-2': 0, rigori: 0 },
      players: [{
        id: 'p2', name: 'José', jersey: '7', goals: 1,
        goalsByPeriod: { 'period-1': 1, 'period-2': 0, rigori: 0 },
        goalHistory: []
      }]
    }
  ],
  timeline: [{ id: 'start-1', type: 'start', timestamp: knownTimestamp }],
  reactions: { [LEGACY_GOAL_REACTION_EMOJI]: 4, [GOAL_REACTION_EMOJI]: 2 },
  operaGoalIndex: 0
};

// Pure goal-update builder preserves all fields, adds a history record and
// increments the shared ball reaction in the same Firestore update object.
const addGoalUpdate = buildPlayerGoalUpdate(initialEvent, {
  adminUid: 'admin-1', teamId: 't1', teamIndex: 0, expectedTeamName: 'Opera',
  playerId: 'p1', periodId: 'period-1', delta: 1,
  now: makeDate(8, 14, 15), createId
});
assert.equal(addGoalUpdate.teams[0].players[0].goalsByPeriod['period-1'], 4);
assert.equal(addGoalUpdate.teams[0].players[0].goals, 4);
assert.equal(addGoalUpdate.teams[0].players[0].goalHistory.length, 1);
assert.equal(addGoalUpdate.teams[0].players[0].goalHistory[0].status, 'active');
assert.equal(addGoalUpdate.reactions[GOAL_REACTION_EMOJI], 3);
assert.equal(addGoalUpdate.reactions[LEGACY_GOAL_REACTION_EMOJI], 4);
assert.equal(addGoalUpdate.timeline[0].type, 'goal');
assert.equal(addGoalUpdate.timeline[0].teamId, 't1');
assert.equal(typeof addGoalUpdate.operaGoalIndex, 'number');
assert.equal(initialEvent.teams[0].players[0].goals, 3, 'builder must not mutate the source document');
assert.equal(getTeamTotalScore(addGoalUpdate.teams[0], addGoalUpdate.periods), 4);

// The automatic goal-ball reaction is reserved for the exact team name Opera,
// case-insensitively. Other teams still record the goal but do not trigger it.
const upperCaseOperaEvent = {
  ...initialEvent,
  teams: initialEvent.teams.map((team, index) => index === 0 ? { ...team, name: '  oPeRa  ' } : team)
};
const upperCaseOperaGoalUpdate = buildPlayerGoalUpdate(upperCaseOperaEvent, {
  adminUid: 'admin-1', teamId: 't1', playerId: 'p1', periodId: 'period-1', delta: 1,
  now: makeDate(8, 14, 15), createId
});
assert.equal(upperCaseOperaGoalUpdate.reactions[GOAL_REACTION_EMOJI], 3);

const nonOperaEvent = {
  ...initialEvent,
  teams: initialEvent.teams.map((team, index) => index === 0 ? { ...team, name: 'Macallesi' } : team)
};
const nonOperaGoalUpdate = buildPlayerGoalUpdate(nonOperaEvent, {
  adminUid: 'admin-1', teamId: 't1', playerId: 'p1', periodId: 'period-1', delta: 1,
  now: makeDate(8, 14, 15), createId
});
assert.equal(nonOperaGoalUpdate.teams[0].players[0].goalsByPeriod['period-1'], 4);
assert.equal(nonOperaGoalUpdate.reactions, undefined, 'non-Opera goals must not trigger the automatic ball reaction');

// Undo decrements only the selected period, marks the record cancelled and
// does not increment the reaction count again.
const updatedAfterAdd = { ...initialEvent, ...addGoalUpdate };
const undoUpdate = buildPlayerGoalUpdate(updatedAfterAdd, {
  adminUid: 'admin-1', teamId: 't1', teamIndex: 0, expectedTeamName: 'Opera',
  playerId: 'p1', periodId: 'period-1', delta: -1,
  now: makeDate(8, 14, 16), createId
});
assert.equal(undoUpdate.teams[0].players[0].goalsByPeriod['period-1'], 3);
assert.equal(undoUpdate.teams[0].players[0].goalHistory[0].status, 'cancelled');
assert.equal(undoUpdate.timeline[0].type, 'undo');
assert.equal(undoUpdate.timeline[0].undoesGoalId, addGoalUpdate.teams[0].players[0].goalHistory[0].id);
assert.equal(undoUpdate.reactions, undefined);

// Special periods never enter the numeric TOT score.
const specialGoalUpdate = buildPlayerGoalUpdate(initialEvent, {
  adminUid: 'admin-1', teamId: 't1', teamIndex: 0, expectedTeamName: 'Opera',
  playerId: 'p1', periodId: 'rigori', delta: 1,
  now: makeDate(8, 14, 17), createId
});
assert.equal(specialGoalUpdate.teams[0].players[0].goalsByPeriod.rigori, 1);
assert.equal(getPlayerTotalGoals(specialGoalUpdate.teams[0].players[0], specialGoalUpdate.periods), 3);
assert.throws(() => buildPlayerGoalUpdate(initialEvent, {
  adminUid: 'spectator', teamId: 't1', playerId: 'p1', periodId: 'period-1', delta: 1
}), /amministratore/i);
assert.equal(buildPlayerGoalUpdate(initialEvent, {
  adminUid: 'admin-1', teamId: 't1', playerId: 'p1', periodId: 'period-1', delta: -1,
  now: makeDate(8), createId
}).teams[0].players[0].goalsByPeriod['period-1'], 2);

// Stable team ID still targets the same team after the two team objects swap.
const swappedEvent = { ...initialEvent, teams: [...initialEvent.teams].reverse() };
const swappedGoalUpdate = buildPlayerGoalUpdate(swappedEvent, {
  adminUid: 'admin-1', teamId: 't1', teamIndex: 1, expectedTeamName: 'Opera',
  playerId: 'p1', periodId: 'period-1', delta: 1,
  now: makeDate(8, 14, 18), createId
});
assert.equal(swappedGoalUpdate.teams[1].id, 't1');
assert.equal(swappedGoalUpdate.teams[1].players[0].goalsByPeriod['period-1'], 4);

const reportEvent = {
  ...initialEvent,
  id: 'report-event-1',
  createdAt: { seconds: Math.floor(knownTimestamp / 1000), nanoseconds: 0 },
  timeline: [
    { id: 'later-start', type: 'start', timestamp: knownTimestamp + 5000 },
    { id: 'first-start', type: 'start', timestamp: knownTimestamp }
  ]
};
assert.equal(getMatchStartTimestamp({ ...reportEvent, createdAt: makeDate(7, 18, 0).getTime() }), makeDate(7, 18, 0).getTime(), 'editable createdAt is the canonical report date');
const report = buildPlayerReport([reportEvent], {
  dateFrom: '2026-11-08', dateTo: '2026-11-08',
  player: 'pipp', jersey: '10', team: 'opera', title: 'AMICHEVOLE', host: 'mario',
  status: 'live', period: 'regular', minGoals: '', maxGoals: ''
});
assert.equal(report.matchingEvents.length, 1);
assert.equal(report.rows.length, 1);
assert.equal(report.rows[0].name, 'Pippo');
assert.equal(report.rows[0].selectedGoals, 3);
const accentInsensitiveReport = buildPlayerReport([reportEvent], {
  dateFrom: '', dateTo: '', player: 'JOSE', jersey: '', team: '', title: '', host: '',
  status: 'all', period: 'regular', minGoals: '', maxGoals: ''
});
assert.equal(accentInsensitiveReport.rows.length, 1);
assert.equal(accentInsensitiveReport.rows[0].name, 'José');

const exportText = buildWhatsAppReportText({
  rows: [{ name: 'Pippo', jerseys: ['10'], selectedGoals: 3 }],
  filters: { period: 'regular', dateFrom: '2026-11-08', dateTo: '2026-11-08' },
  selectedPeriodLabel: 'Gol nei tempi numerici'
});
assert.match(exportText, /🏆 \*Classifica marcatori\*/);
assert.match(exportText, /⚽️ \*Marcatori:\*/);
assert.match(exportText, /1\. Pippo \(#10\): 3 gol/);

// Event export date uses a goal from a text-named period, although that goal
// does not contribute to TOT. Cancelled goals fall back to event creation date.
const eventWithSpecialGoal = {
  createdAt: makeDate(1).getTime(),
  periods: [{ id: 'rigori', name: 'Rigori' }],
  teams: [{ players: [{ goalHistory: [{ id: 'g1', periodId: 'rigori', timestamp: makeDate(8).getTime(), status: 'active' }] }] }],
  timeline: []
};
assert.equal(getEventShareDate(eventWithSpecialGoal), '01-11-2026', 'WhatsApp export uses the editable event creation date');
const eventWithNoActiveGoals = {
  createdAt: makeDate(1).getTime(),
  teams: [{ players: [{ goalHistory: [{ id: 'g1', timestamp: makeDate(8).getTime(), status: 'cancelled' }] }] }],
  timeline: []
};
assert.equal(getEventShareDate(eventWithNoActiveGoals), '01-11-2026');
const legacyZeroZero = {
  createdAt: makeDate(1).getTime(),
  teams: [],
  timeline: [
    { id: 'undo-1', type: 'undo', playerName: 'Pippo', periodId: 'period-1', timestamp: makeDate(8, 11).getTime() },
    { id: 'goal-1', type: 'goal', playerName: 'Pippo', periodId: 'period-1', timestamp: makeDate(8, 10).getTime() }
  ]
};
assert.equal(getEventShareDate(legacyZeroZero), '01-11-2026');
const legacyOneGoalRemains = {
  createdAt: makeDate(1).getTime(),
  teams: [],
  timeline: [
    { id: 'undo-2', type: 'undo', playerName: 'Pippo', periodId: 'period-1', timestamp: makeDate(8, 12).getTime() },
    { id: 'goal-2', type: 'goal', playerName: 'Pippo', periodId: 'period-1', timestamp: makeDate(8, 11).getTime() },
    { id: 'goal-1', type: 'goal', playerName: 'Pippo', periodId: 'period-1', timestamp: makeDate(8, 10).getTime() }
  ]
};
assert.equal(getEventShareDate(legacyOneGoalRemains), '01-11-2026', 'canonical createdAt takes priority over the first goal');
const eventWithoutCreatedAt = {
  teams: [],
  timeline: [{ id: 'legacy-goal', type: 'goal', timestamp: makeDate(8, 10).getTime() }]
};
assert.equal(getEventShareDate(eventWithoutCreatedAt), '08-11-2026', 'legacy events without createdAt retain the first-goal fallback');


// Reaction log phrases and timeline grouping: repeated reactions by the same
// nickname/UID/emoji within one minute collapse into one visual row.
assert.equal(
  getReactionPhrase({ nickname: 'Pippo', emoji: '🔥' }),
  'Pippo accende la partita 🔥'
);
assert.equal(
  getReactionPhrase({ nickname: 'Pippo', emoji: '👏', count: 3 }),
  'Pippo applaude la giocata (3 reazioni) 👏'
);
const groupedReactions = mergeEventTimeline([], [
  { id: 'r2', uid: 'u1', nickname: 'Pippo', emoji: '🔥', timestamp: 20000, time: '12:00:20' },
  { id: 'r1', uid: 'u1', nickname: 'Pippo', emoji: '🔥', timestamp: 10000, time: '12:00:10' }
]);
assert.equal(groupedReactions.length, 1);
assert.equal(groupedReactions[0].count, 2);
assert.deepEqual(new Set(groupedReactions[0].reactionIds), new Set(['r1', 'r2']));
const separateReactions = mergeEventTimeline([], [
  { id: 'r3', uid: 'u1', nickname: 'Pippo', emoji: '👏', timestamp: 30000 },
  { id: 'r2', uid: 'u2', nickname: 'Mario', emoji: '🔥', timestamp: 20000 },
  { id: 'r1', uid: 'u1', nickname: 'Pippo', emoji: '🔥', timestamp: 10000 }
]);
assert.equal(separateReactions.length, 3);
const reactionAndGoalTimeline = mergeEventTimeline(
  [{ id: 'goal-x', type: 'goal', timestamp: 15000 }],
  [
    { id: 'r2', uid: 'u1', nickname: 'Pippo', emoji: '🔥', timestamp: 20000 },
    { id: 'r1', uid: 'u1', nickname: 'Pippo', emoji: '🔥', timestamp: 10000 }
  ]
);
assert.deepEqual(reactionAndGoalTimeline.map(entry => entry.id), ['r2', 'goal-x', 'r1']);

console.log('Core smoke tests passed.');
