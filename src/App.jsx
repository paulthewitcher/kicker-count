import React, { useState, useEffect } from 'react';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { subscribeToEvents } from './services/eventService';
import Header from './components/Header';
import LogoutModal from './components/modals/LogoutModal';
import EditSeedModal from './components/modals/EditSeedModal';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import CreateMatchView from './views/CreateMatchView';
import EventView from './views/EventView';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [nickname, setNickname] = useState(localStorage.getItem('kicker_nickname') || '');
  const [seed, setSeed] = useState(localStorage.getItem('kicker_seed') || '');
  
  const [view, setView] = useState((nickname && seed) ? 'DASHBOARD' : 'LOGIN');
  
  const [events, setEvents] = useState([]);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Firebase Auth Error:", e);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Ascolta le partite filtrate per il SEED corrente
  useEffect(() => {
    if (!user || !seed) return;
    const unsubscribe = subscribeToEvents(
      seed,
      (fetchedEvents) => setEvents(fetchedEvents),
      (error) => console.error("Firestore Error:", error)
    );
    return () => unsubscribe();
  }, [user, seed]);

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    const cleanSeed = seed.trim().toLowerCase();
    
    if (cleanNick.length > 0 && cleanSeed.length > 0) {
      setNickname(cleanNick);
      setSeed(cleanSeed);
      localStorage.setItem('kicker_nickname', cleanNick);
      localStorage.setItem('kicker_seed', cleanSeed);
      setView('DASHBOARD');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('kicker_nickname');
    localStorage.removeItem('kicker_seed');
    setNickname('');
    setSeed('');
    setView('LOGIN');
    setShowLogoutConfirm(false);
    await signOut(auth);
  };

  const handleUpdateSeed = (newSeed) => {
    const cleanSeed = newSeed.trim().toLowerCase();
    if (cleanSeed) {
      setSeed(cleanSeed);
      localStorage.setItem('kicker_seed', cleanSeed);
      setShowSeedModal(false);
      setCurrentEventId(null);
      if (view === 'EVENT') {
        setView('DASHBOARD');
      }
    }
  };

  const currentEvent = events.find(e => e.id === currentEventId);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500/30">
      <Header 
        nickname={nickname} 
        seed={seed}
        view={view} 
        setView={setView} 
        onOpenLogoutModal={() => setShowLogoutConfirm(true)} 
        onOpenSeedModal={() => setShowSeedModal(true)}
      />

      <main className="max-w-xl mx-auto p-4 pb-24">
        {view === 'LOGIN' && (
          <LoginView 
            nickname={nickname} 
            setNickname={setNickname} 
            seed={seed}
            setSeed={setSeed}
            handleLogin={handleLogin} 
          />
        )}
        
        {view === 'DASHBOARD' && (
          <DashboardView 
            events={events} 
            seed={seed}
            goToCreate={() => setView('CREATE')} 
            openEvent={(id) => {
              setCurrentEventId(id);
              setView('EVENT');
            }} 
            onOpenSeedModal={() => setShowSeedModal(true)}
          />
        )}

        {view === 'CREATE' && (
          <CreateMatchView 
            user={user}
            nickname={nickname}
            seed={seed}
            pastEvents={events}
            goBack={() => setView('DASHBOARD')}
            onMatchCreated={(id) => {
              setCurrentEventId(id);
              setView('EVENT');
            }}
          />
        )}
        
        {view === 'EVENT' && currentEvent && (
          <EventView 
            event={currentEvent} 
            user={user} 
            goBack={() => setView('DASHBOARD')} 
          />
        )}

        {view === 'EVENT' && !currentEvent && (
          <div className="text-center py-20 animate-in fade-in">
            <h2 className="text-xl text-slate-400 mb-2">Evento non trovato per la stanza #{seed}.</h2>
            <p className="text-sm text-slate-500">Forse è stato cancellato o ti trovi in un altro Seed.</p>
            <button 
              onClick={() => setView('DASHBOARD')}
              className="mt-6 px-6 py-2 bg-emerald-600 rounded-full text-white font-medium hover:bg-emerald-500 transition-colors"
            >
              Torna alla Bacheca
            </button>
          </div>
        )}
      </main>

      <LogoutModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />

      <EditSeedModal 
        isOpen={showSeedModal}
        currentSeed={seed}
        onClose={() => setShowSeedModal(false)}
        onSave={handleUpdateSeed}
      />
    </div>
  );
}