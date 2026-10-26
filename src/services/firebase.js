import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyClg1kzzyWAQ-0cwl78pg2sgHHCwMCFQ_w",
  authDomain: "kicker-count.firebaseapp.com",
  projectId: "kicker-count",
  storageBucket: "kicker-count.firebasestorage.app",
  messagingSenderId: "309071174582",
  appId: "1:309071174582:web:514ea389a0b5d47a773f17",
  measurementId: "G-EM053Z19RP"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'kicker-app-id';