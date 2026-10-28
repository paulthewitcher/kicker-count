import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  setDoc,
  deleteDoc, 
  doc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

const EVENTS_COLLECTION_PATH = 'artifacts/kicker-app-id/public/data/events';

// 1. Aggiunta della funzione mancano per la creazione dell'evento
export const createEvent = async (eventData) => {
  // Se eventData ha un ID personalizzato o una password
  if (eventData.id) {
    const eventRef = doc(db, EVENTS_COLLECTION_PATH, eventData.id);
    await setDoc(eventRef, {
      title: eventData.title || 'Nuovo Evento',
      deletePassword: eventData.deletePassword || 'opera2019',
      createdAt: serverTimestamp()
    }, { merge: true });
    return eventData.id;
  }

  // Creazione documento con ID generato automaticamente da Firestore
  const eventsRef = collection(db, EVENTS_COLLECTION_PATH);
  const docRef = await addDoc(eventsRef, {
    ...eventData,
    deletePassword: eventData.deletePassword || 'opera2019',
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

// 2. Inserimento log (start o end)
export const addMatchLog = async (eventId, logType) => {
  const logsRef = collection(db, EVENTS_COLLECTION_PATH, eventId, 'logs');
  return await addDoc(logsRef, {
    type: logType,
    timestamp: serverTimestamp()
  });
};

// 3. Elimina singolo log
export const deleteMatchLog = async (eventId, logId) => {
  return await deleteDoc(doc(db, EVENTS_COLLECTION_PATH, eventId, 'logs', logId));
};

// 4. Ascolto log in tempo reale
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

// 5. Elimina evento previa password
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