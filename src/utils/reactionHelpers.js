import { REACTION_PHRASES } from './constants.js';


export const getReactionPhrase = ({ nickname, emoji, count = 1 } = {}) => {
  const safeName = String(nickname || 'Spettatore').trim() || 'Spettatore';
  const phrase = REACTION_PHRASES[emoji] || 'ha reagito con';
  const repetition = Number(count) > 1 ? ` (${Number(count)} reazioni)` : '';
  return `${safeName} ${phrase}${repetition} ${emoji || ''}`.trim();
};

const asTimestamp = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  if (value && typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
};

// Fonde la timeline ufficiale con i log di reazione della sottocollection.
// Reazioni consecutive dello stesso utente e della stessa emoji entro 60s
// vengono mostrate come un'unica voce, ma ogni click resta memorizzato.
export const mergeEventTimeline = (timeline = [], reactionLogs = [], windowMs = 60_000) => {
  const entries = [
    ...(Array.isArray(timeline) ? timeline : []).map(log => ({ ...log, source: 'timeline' })),
    ...(Array.isArray(reactionLogs) ? reactionLogs : []).map(log => ({
      ...log,
      type: 'reaction',
      source: 'reaction',
      count: 1,
      reactionIds: [log.id]
    }))
  ].sort((a, b) => asTimestamp(b.timestamp) - asTimestamp(a.timestamp));

  const merged = [];
  entries.forEach(entry => {
    const previous = merged[merged.length - 1];
    const previousOldestTimestamp = previous?.oldestGroupedTimestamp ?? asTimestamp(previous?.timestamp);
    const sameRecentReaction = entry.source === 'reaction'
      && previous?.source === 'reaction'
      && previous.uid === entry.uid
      && previous.emoji === entry.emoji
      && Math.abs(previousOldestTimestamp - asTimestamp(entry.timestamp)) <= windowMs;

    if (sameRecentReaction) {
      previous.count += 1;
      previous.reactionIds.push(entry.id);
      previous.oldestGroupedTimestamp = asTimestamp(entry.timestamp);
      return;
    }

    merged.push({
      ...entry,
      reactionIds: [...(entry.reactionIds || [])],
      ...(entry.source === 'reaction' ? { oldestGroupedTimestamp: asTimestamp(entry.timestamp) } : {})
    });
  });

  return merged;
};
