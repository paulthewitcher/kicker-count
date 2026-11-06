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
  arrayUnion 
} from 'firebase/firestore';

export const subscribeToEvents = (seed, onEventsUpdate, onError) => {
  const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
  return onSnapshot(eventsRef, (snapshot) => {
    const cleanSeed = (seed || '').trim().toLowerCase();
    
    const fetchedEvents = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(evt => (evt.seed || '').trim().toLowerCase() === cleanSeed);

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
      onEventUpdate({ id: docSnap.id, ...docSnap.data() });
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

export const updateEventData = async (eventId, newData) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  await updateDoc(eventRef, newData);
};

export const deleteEvent = async (eventId) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  await deleteDoc(eventRef);
};

export const addEmojiReaction = async (eventId, type) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  await updateDoc(eventRef, {
    [`reactions.${type}`]: increment(1)
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

// 4. Conferma eliminazione: confronta localmente il valore inserito con il seed già presente nell'evento.
// Il valore digitato non viene mai incluso in richieste Firestore.
export const deleteEventWithPassword = async (eventId, inputPassword) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  const eventSnap = await getDoc(eventRef);

  if (!eventSnap.exists()) {
    throw new Error("Evento non trovato.");
  }

  const data = eventSnap.data();
  const expectedPassword = (data.seed || '').trim().toLowerCase();
  const userPassword = (inputPassword || '').trim().toLowerCase();

  if (expectedPassword === userPassword) {
    await deleteDoc(eventRef);
    return true;
  } else {
    throw new Error("Password errata.");
  }
};

// Elimina un tempo dopo aver confrontato localmente la conferma con il seed già presente nell'evento.
// La password digitata non viene inviata a Firestore.
export const deletePeriodWithPassword = async (eventId, periodId, inputPassword) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  const eventSnap = await getDoc(eventRef);

  if (!eventSnap.exists()) {
    throw new Error('Partita non trovata.');
  }

  const data = eventSnap.data();
  const expectedPassword = (data.seed || '').trim().toLowerCase();
  const userPassword = (inputPassword || '').trim().toLowerCase();

  if (!expectedPassword || expectedPassword !== userPassword) {
    throw new Error('Password non corretta.');
  }

  const periods = Array.isArray(data.periods)
    ? data.periods
    : [{ id: 'period-1', name: '1', number: 1 }];

  if (!periods.some(period => period.id === periodId)) {
    throw new Error('Il tempo selezionato non esiste più.');
  }

  const updatedPeriods = periods.filter(period => period.id !== periodId);
  const teams = (data.teams || []).map(team => {
    const players = (team.players || []).map(player => {
      const goalsByPeriod = player.goalsByPeriod
        ? { ...player.goalsByPeriod }
        : { 'period-1': Number(player.goals) || 0 };
      const goalHistory = (player.goalHistory || []).filter(goal => goal.periodId !== periodId);

      delete goalsByPeriod[periodId];

      const goals = Object.values(goalsByPeriod).reduce(
        (total, value) => total + (Number(value) || 0),
        0
      );

      return { ...player, goalsByPeriod, goals, goalHistory };
    });

    const scoreOffsetsByPeriod = team.scoreOffsetsByPeriod
      ? { ...team.scoreOffsetsByPeriod }
      : { 'period-1': Number(team.scoreOffset) || 0 };

    delete scoreOffsetsByPeriod[periodId];

    const scoreOffset = Object.values(scoreOffsetsByPeriod).reduce(
      (total, value) => total + (Number(value) || 0),
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
