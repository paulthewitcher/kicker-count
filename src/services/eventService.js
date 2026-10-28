import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

const EVENTS_COLLECTION_PATH = 'artifacts/kicker-app-id/public/data/events';

// Inserisci log (start o end)
export const addMatchLog = async (eventId, logType) => {
  const logsRef = collection(db, EVENTS_COLLECTION_PATH, eventId, 'logs');
  return await addDoc(logsRef, {
    type: logType, // 'start' oppure 'end'
    timestamp: serverTimestamp()
  });
};

// Elimina singolo log
export const deleteMatchLog = async (eventId, logId) => {
  return await deleteDoc(doc(db, EVENTS_COLLECTION_PATH, eventId, 'logs', logId));
};

// Ascolto log in tempo reale
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

// Elimina evento previa password
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
