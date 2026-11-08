import { GOAL_REACTION_EMOJI, normalizeReactionEmoji } from '../utils/constants';
import { db, appId } from './firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  increment, 
  getDoc, 
  arrayUnion,
  runTransaction 
} from 'firebase/firestore';

export const subscribeToEvents = (seed, onEventsUpdate, onError) => {
  const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
  return onSnapshot(eventsRef, (snapshot) => {
    const cleanSeed = (seed || '').trim().toLowerCase();
    
    const fetchedEvents = snapshot.docs
      // Il document ID è sempre la fonte autorevole per l'ID dell'evento.
      // Nei documenti legacy il Seed può coincidere con il document ID e
      // il campo `seed` può non essere presente.
      .map(docSnap => ({ ...docSnap.data(), id: docSnap.id }))
      .filter(evt => String(evt.seed || evt.id || '').trim().toLowerCase() === cleanSeed);

    fetchedEvents.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (a.status !== 'live' && b.status === 'live') return 1;
      return b.createdAt - a.createdAt;
    });

    onEventsUpdate(fetchedEvents);
  }, onError);
};

export const subscribeToSingleEvent = (eventId, onEventUpdate, onError) => {
  if (!eventId) return () => {};
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  return onSnapshot(eventRef, (docSnap) => {
    if (docSnap.exists()) {
      onEventUpdate({ ...docSnap.data(), id: docSnap.id });
    }
  }, onError);
};

export const createEvent = async ({ user, nickname, seed, title, importId, pastEvents }) => {
  const newEventId = crypto.randomUUID();
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', newEventId);
  const startTime = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  let teams = [
    { id: 't1', name: 'Squadra Rossa', color: '#ef4444', players: [], scoreOffset: 0 },
    { id: 't2', name: 'Squadra Blu', color: '#174195', players: [], scoreOffset: 0 }
  ];

  if (importId && pastEvents) {
    const matchToImport = pastEvents.find(e => e.id === importId);
    if (matchToImport && matchToImport.teams) {
      teams = matchToImport.teams.map(team => ({
        ...team,
        scoreOffset: 0,
        color: team.color || '#ef4444',
        players: (team.players || []).map(player => ({
          ...player,
          goals: 0,
          goalHistory: []
        }))
      }));
    }
  }

  const cleanSeed = (seed || '').trim().toLowerCase();

  const initialPeriodId = 'period-1';

  // Ogni partita parte con il primo tempo e una mappa gol per giocatore.
  teams = teams.map(team => ({
    ...team,
    scoreOffsetsByPeriod: { [initialPeriodId]: 0 },
    players: (team.players || []).map(player => ({
      ...player,
      goals: 0,
      goalsByPeriod: { [initialPeriodId]: 0 }
    }))
  }));

  const newEvent = {
    title: title.trim() || 'Nuova Partita',
    adminId: user.uid,
    adminName: nickname,
    seed: cleanSeed,
    status: 'live',
    statusText: `Partita iniziata alle ${startTime}`,
    startTime: startTime,
    createdAt: Date.now(),
    teams: teams,
    periods: [{
      id: initialPeriodId,
      name: '1',
      number: 1,
      createdAt: Date.now()
    }],
    nextPeriodNumber: 2,
    reactions: {},
    timeline: [{
      id: crypto.randomUUID(),
      type: 'start',
      time: new Date().toLocaleTimeString('it-IT', { hour12: false }),
      timestamp: Date.now()
    }]
  };

  await setDoc(eventRef, newEvent);
  return newEventId;
};

// Tiene traccia delle scritture complete dei dati evento già avviate dal client.
// Prima dello scambio aspettiamo che queste finiscano, così un goal appena registrato
// non può sovrascrivere successivamente l'ordine nuovo delle squadre.
const pendingEventWrites = new Map();

const trackEventWrite = (eventId, writePromise) => {
  const pending = pendingEventWrites.get(eventId) || new Set();
  pending.add(writePromise);
  pendingEventWrites.set(eventId, pending);

  const cleanup = () => {
    pending.delete(writePromise);
    if (pending.size === 0) pendingEventWrites.delete(eventId);
  };

  writePromise.then(cleanup, cleanup);
  return writePromise;
};

const waitForPendingEventWrites = async (eventId) => {
  const pending = [...(pendingEventWrites.get(eventId) || [])];
  if (pending.length) await Promise.allSettled(pending);
};

export const updateEventData = async (eventId, newData) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  const writePromise = updateDoc(eventRef, newData);
  await trackEventWrite(eventId, writePromise);
};

// Goal e reazione pallone vengono scritti in UN SOLO update Firestore.
// Il listener realtime riceve così il nuovo conteggio nello stesso snapshot
// del goal, evitando race tra due scritture e mantenendo un unico trigger
// condiviso per amministratore e spettatori.
export const updateEventDataWithGoalReaction = async (eventId, newData) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  const writePromise = updateDoc(eventRef, {
    ...newData,
    [`reactions.${GOAL_REACTION_EMOJI}`]: increment(1)
  });
  await trackEventWrite(eventId, writePromise);
};

// Scambia le due squadre senza ricostruirne i dati. La transazione legge sempre
// la versione più aggiornata dell'evento e verifica nuovamente l'amministratore.
export const swapEventTeams = async (eventId, adminUid) => {
  if (!adminUid) throw new Error('Utente non autenticato.');

  // Completa prima le scritture evento già avviate (es. un goal appena cliccato).
  await waitForPendingEventWrites(eventId);

  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);

  return runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (!eventSnap.exists()) throw new Error('Partita non trovata.');

    const eventData = eventSnap.data();
    if (eventData.adminId !== adminUid) {
      throw new Error('Non sei autorizzato a scambiare le squadre di questa partita.');
    }

    if (!Array.isArray(eventData.teams) || eventData.teams.length !== 2) {
      throw new Error('La partita non contiene esattamente due squadre.');
    }

    const swappedTeams = [...eventData.teams];
    [swappedTeams[0], swappedTeams[1]] = [swappedTeams[1], swappedTeams[0]];

    // I log dei gol raccontano un fatto storico e restano invariati. I log di
    // fine partita esprimono invece il risultato nel verso casa-trasferta: li
    // invertiamo così rimangono coerenti con il nuovo ordine delle squadre.
    const updates = { teams: swappedTeams };
    if (Array.isArray(eventData.timeline)) {
      updates.timeline = eventData.timeline.map((log) => {
        if (log?.type !== 'end' || typeof log.scoreString !== 'string') return log;
        const scoreMatch = log.scoreString.match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
        if (!scoreMatch) return log;
        return { ...log, scoreString: `${scoreMatch[2]}-${scoreMatch[1]}` };
      });
    }

    transaction.update(eventRef, updates);
    return swappedTeams;
  });
};

export const deleteEvent = async (eventId) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  await deleteDoc(eventRef);
};

export const addEmojiReaction = async (eventId, type) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  const canonicalEmoji = normalizeReactionEmoji(type);
  await updateDoc(eventRef, {
    [`reactions.${canonicalEmoji}`]: increment(1)
  });
};

// --- FIX AGGIUNTI PER RIPERDITA / LOG E ELIMINAZIONE VIA PASSWORD ---

// 1. Aggiunge un log di inizio o fine alla timeline dell'evento
export const addMatchLog = async (eventId, logType) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  const now = new Date();
  const timeString = now.toLocaleTimeString('it-IT', { hour12: false });
  
  const newLog = {
    id: crypto.randomUUID(),
    type: logType, // 'start' o 'end'
    time: timeString,
    timestamp: Date.now()
  };

  await updateDoc(eventRef, {
    timeline: arrayUnion(newLog),
    status: logType === 'start' ? 'live' : 'ended',
    statusText: logType === 'start' ? `Partita riaperta alle ${timeString}` : `Partita terminata alle ${timeString}`
  });
};

// 2. Rimuove un log specifico dalla timeline dell'evento
export const deleteMatchLog = async (eventId, logId) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  const eventSnap = await getDoc(eventRef);
  if (eventSnap.exists()) {
    const data = eventSnap.data();
    const updatedTimeline = (data.timeline || []).filter(item => item.id !== logId);
    await updateDoc(eventRef, { timeline: updatedTimeline });
  }
};

// 3. Ascolto in tempo reale per la timeline dei log
export const subscribeToLogs = (eventId, callback) => {
  if (!eventId) return () => {};
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  return onSnapshot(eventRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().timeline || []);
    } else {
      callback([]);
    }
  });
};

// Password usata per la conferma locale di eliminazioni.
// La configurazione della password si trova nel documento della stanza (ID = Seed),
// mentre i singoli eventi possono avere un ID UUID separato.
// Il valore digitato non viene mai scritto su Firestore.
const getDeletePasswordContext = async (eventData, eventId, roomSeed) => {
  const roomDocumentId = String(roomSeed || eventData?.seed || eventId || '')
    .trim()
    .toLowerCase();

  let roomData = eventData || {};
  if (roomDocumentId && roomDocumentId !== String(eventId)) {
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', roomDocumentId);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) roomData = roomSnap.data();
  }

  // Prima il documento stanza esplicito, poi l'eventuale campo del singolo evento,
  // infine i valori legacy Seed/ID. Non si crea o modifica alcun campo su Firebase.
  const candidates = [
    roomData?.deletePassword,
    eventData?.deletePassword,
    roomData?.seed,
    eventData?.seed,
    roomDocumentId,
    eventId
  ];
  const expectedPassword = String(candidates.find(value => String(value ?? '').trim()) ?? '')
    .trim()
    .toLowerCase();

  return { expectedPassword, roomDocumentId };
};

const assertDeletePassword = async (eventData, eventId, inputPassword, roomSeed) => {
  const { expectedPassword, roomDocumentId } = await getDeletePasswordContext(
    eventData,
    eventId,
    roomSeed
  );
  const userPassword = String(inputPassword ?? '').trim().toLowerCase();

  if (!expectedPassword) {
    throw new Error(`Nel documento della stanza "${roomDocumentId || eventId}" non è configurata una password di eliminazione.`);
  }
  if (expectedPassword !== userPassword) {
    throw new Error(`Password non corretta. Verifica effettuata sul documento della stanza "${roomDocumentId || eventId}".`);
  }
};

// 4. Conferma eliminazione: legge la password dal documento della stanza (ID = Seed).
export const deleteEventWithPassword = async (eventId, inputPassword, roomSeed) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  const eventSnap = await getDoc(eventRef);

  if (!eventSnap.exists()) {
    throw new Error("Evento non trovato.");
  }

  const data = eventSnap.data();
  await assertDeletePassword(data, eventSnap.id, inputPassword, roomSeed);

  await deleteDoc(eventRef);
  return true;
};

// Elimina un tempo dopo aver verificato la password nel documento della stanza (Seed).
// La password digitata non viene scritta su Firestore.
export const deletePeriodWithPassword = async (eventId, periodId, inputPassword, roomSeed) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  const eventSnap = await getDoc(eventRef);

  if (!eventSnap.exists()) {
    throw new Error('Partita non trovata.');
  }

  const data = eventSnap.data();
  await assertDeletePassword(data, eventSnap.id, inputPassword, roomSeed);

  const periods = Array.isArray(data.periods)
    ? data.periods
    : [{ id: 'period-1', name: '1', number: 1 }];

  if (!periods.some(period => period.id === periodId)) {
    throw new Error('Il tempo selezionato non esiste più.');
  }

  const updatedPeriods = periods.filter(period => period.id !== periodId);
  const numericPeriodIds = new Set(
    updatedPeriods
      .filter(period => /^\d+$/.test(String(period?.name ?? '').trim()))
      .map(period => period.id)
  );
  const teams = (data.teams || []).map(team => {
    const players = (team.players || []).map(player => {
      const goalsByPeriod = player.goalsByPeriod
        ? { ...player.goalsByPeriod }
        : { 'period-1': Number(player.goals) || 0 };
      const goalHistory = (player.goalHistory || []).filter(goal => goal.periodId !== periodId);

      delete goalsByPeriod[periodId];

      const goals = [...numericPeriodIds].reduce(
        (total, numericPeriodId) => total + (Number(goalsByPeriod[numericPeriodId]) || 0),
        0
      );

      return { ...player, goalsByPeriod, goals, goalHistory };
    });

    const scoreOffsetsByPeriod = team.scoreOffsetsByPeriod
      ? { ...team.scoreOffsetsByPeriod }
      : { 'period-1': Number(team.scoreOffset) || 0 };

    delete scoreOffsetsByPeriod[periodId];

    const scoreOffset = [...numericPeriodIds].reduce(
      (total, numericPeriodId) => total + (Number(scoreOffsetsByPeriod[numericPeriodId]) || 0),
      0
    );

    return { ...team, players, scoreOffsetsByPeriod, scoreOffset };
  });

  const timeline = (data.timeline || []).filter(log => {
    if (log.periodId) return log.periodId !== periodId;
    // Nei vecchi eventi i log dei gol non avevano ancora un riferimento al tempo.
    if (periodId === 'period-1' && (log.type === 'goal' || log.type === 'undo' || !log.type)) {
      return false;
    }
    return true;
  });

  await updateDoc(eventRef, {
    periods: updatedPeriods,
    teams,
    timeline
  });

  return { periods: updatedPeriods, teams, timeline };
};
