import { db, appId } from './firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, increment } from 'firebase/firestore';

export const subscribeToEvents = (onEventsUpdate, onError) => {
  const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
  return onSnapshot(eventsRef, (snapshot) => {
    const fetchedEvents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
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

export const createEvent = async ({ user, nickname, title, importId, pastEvents }) => {
  const newEventId = crypto.randomUUID();
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', newEventId);
  
  let teams = [
    { id: 't1', name: 'Squadra Rossa', color: '#ef4444', players: [], scoreOffset: 0 },
    { id: 't2', name: 'Squadra Blu', color: '#174195', players: [], scoreOffset: 0 }
  ];

  if (importId) {
    const matchToImport = pastEvents.find(e => e.id === importId);
    if (matchToImport && matchToImport.teams) {
      teams = matchToImport.teams.map(team => ({
        ...team,
        scoreOffset: 0,
        color: team.color || '#ef4444',
        players: (team.players || []).map(player => ({
          ...player,
          goals: 0
        }))
      }));
    }
  }

  const newEvent = {
    title: title.trim() || 'Nuova Partita',
    adminId: user.uid,
    adminName: nickname,
    status: 'live',
    createdAt: Date.now(),
    teams: teams,
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

export const addEmojiReaction = async (eventId, type) => {
  const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
  await updateDoc(eventRef, {
    [`reactions.${type}`]: increment(1)
  });
};