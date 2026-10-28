import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  setDoc,
  updateDoc,
  deleteDoc, 
  doc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  arrayUnion 
} from 'firebase/firestore';

const EVENTS_COLLECTION_PATH = 'artifacts/kicker-app-id/public/data/events';

// 1. Creazione Evento (richiesto da CreateMatchView.jsx)
export const createEvent = async (eventData) => {
  if (eventData.id) {
    const eventRef = doc(db, EVENTS_COLLECTION_PATH, eventData.id);
    await setDoc(eventRef, {
      title: eventData.title || 'Nuovo Evento',
      deletePassword: eventData.deletePassword || 'opera2019',
      createdAt: serverTimestamp(),
      ...eventData
    }, { merge: true });
    return eventData.id;
  }

  const eventsRef = collection(db, EVENTS_COLLECTION_PATH);
  const docRef = await addDoc(eventsRef, {
    ...eventData,
    deletePassword: eventData.deletePassword || 'opera2019',
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

// 2. Ascolto Singolo Evento in Tempo Reale (richiesto da EventView.jsx)
export const subscribeToSingleEvent = (eventId, callback) => {
  const eventRef = doc(db, EVENTS_COLLECTION_PATH, eventId);
  return onSnapshot(eventRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Errore subscribeToSingleEvent:", error);
    callback(null);
  });
};

// 3. Aggiornamento Dati Evento (richiesto da EventView.jsx)
export const updateEventData = async (eventId, updateData) => {
  const eventRef = doc(db, EVENTS_COLLECTION_PATH, eventId);
  return await updateDoc(eventRef, {
    ...updateData,
    updatedAt: serverTimestamp()
  });
};

// 4. Aggiunta Reazione Emoji (richiesto da EventView.jsx)
export const addEmojiReaction = async (eventId, reactionData) => {
  const eventRef = doc(db, EVENTS_COLLECTION_PATH, eventId);
  return await updateDoc(eventRef, {
    reactions: arrayUnion(reactionData)
  });
};

// 5. Inserimento Log Partita (start / end)
export const addMatchLog = async (eventId, logType) => {
  const logsRef = collection(db, EVENTS_COLLECTION_PATH, eventId, 'logs');
  return await addDoc(logsRef, {
    type: logType,
    timestamp: serverTimestamp()
  });
};

// 6. Elimina Singolo Log
export const deleteMatchLog = async (eventId, logId) => {
  return await deleteDoc(doc(db, EVENTS_COLLECTION_PATH, eventId, 'logs', logId));
};

// 7. Ascolto Log in Tempo Reale
export const subscribeToLogs = (eventId, callback) => {
  const logsRef = collection(db, EVENTS_COLLECTION_PATH, eventId, 'logs');
  const q = query(logsRef, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
      timestamp: docSnap.data().timestamp?.toDate()?.toISOString().replace('T', ' ').substring(0, 19) || 'Ora'
    }));
    callback(logs);
  });
};

// 8. Elimina Evento previa Verifica Password
export const deleteEventWithPassword = async (eventId, inputPassword) => {
  const eventRef = doc(db, EVENTS_COLLECTION_PATH, eventId);
  const eventSnap = await getDoc(eventRef);

  if (!eventSnap.exists()) {
    throw new Error("Evento non trovato.");
  }

  const data = eventSnap.data();

  if (data.deletePassword === inputPassword) {
    await deleteDoc(eventRef);
    return true;
  } else {
    throw new Error("Password errata.");
  }
};