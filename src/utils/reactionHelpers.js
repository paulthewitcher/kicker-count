const REACTION_PHRASES = {
  '⚽️': 'ha portato il pallone in campo',
  '⚽': 'ha portato il pallone in campo',
  '👎': 'non è convinto',
  '👍': 'approva',
  '🫶': 'manda un po’ d’amore',
  '👏': 'applaude la giocata',
  '💪': 'carica la squadra',
  '😃': 'sorride',
  '🤣': 'si sta sbellicando',
  '🤩': 'è entusiasta',
  '🥳': 'è già in festa',
  '🥶': 'sente il gelo',
  '🤯': 'è senza parole',
  '😴': 'si sta addormentando',
  '🔥': 'accende la partita',
  '🍻': 'brinda alla partita',
  '🎉': 'festeggia',
  '✨': 'porta un po’ di magia',
  '🌟': 'illumina la serata',
  '⚡️': 'porta una scarica di energia',
  '⚡': 'porta una scarica di energia',
  '🌈': 'porta un arcobaleno di buonumore'
};

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
