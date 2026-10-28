import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "kicker-count.firebaseapp.com",
  projectId: "kicker-count",
  storageBucket: "kicker-count.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
