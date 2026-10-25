import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { Trophy, Plus, ArrowLeft, Activity, Users, Flame, Check, Play, RotateCcw, Trash2, History, X, Share2, Clock, Edit2 } from 'lucide-react';

// --- FIREBASE INITIALIZATION ---
// Rule 1, 2 & 3 Compliance
const firebaseConfig = {
  apiKey: "AIzaSyClg1kzzyWAQ-0cwl78pg2sgHHCwMCFQ_w",
  authDomain: "kicker-count.firebaseapp.com",
  projectId: "kicker-count",
  storageBucket: "kicker-count.firebasestorage.app",
  messagingSenderId: "309071174582",
  appId: "1:309071174582:web:514ea389a0b5d47a773f17",
  measurementId: "G-EM053Z19RP"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kicker-app-id';

export default function App() {
  // Application State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [nickname, setNickname] = useState(localStorage.getItem('kicker_nickname') || '');
  const [view, setView] = useState(nickname ? 'DASHBOARD' : 'LOGIN'); // LOGIN, DASHBOARD, CREATE, EVENT
  
  // Data State
  const [events, setEvents] = useState([]);
  const [currentEventId, setCurrentEventId] = useState(null);

  // 1. Auth Setup (Rule 3)
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

  // 2. Data Fetching (Rule 1 & 2)
  useEffect(() => {
    if (!user) return;

    // Strict Path: /artifacts/{appId}/public/data/events
    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    
    // No complex queries, fetch all and sort in memory
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort: Live first, then by date descending
      fetchedEvents.sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (a.status !== 'live' && b.status === 'live') return 1;
        return b.createdAt - a.createdAt;
      });
      
      setEvents(fetchedEvents);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // --- ACTIONS ---

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    if (cleanNick.length > 0) {
      setNickname(cleanNick);
      localStorage.setItem('kicker_nickname', cleanNick);
      setView('DASHBOARD');
    }
  };

  const currentEvent = events.find(e => e.id === currentEventId);

  // --- VIEWS ---

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500/30">
      
      {/* HEADER */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20 shadow-md">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl tracking-tight cursor-pointer" onClick={() => setView('DASHBOARD')}>
            <Activity className="w-6 h-6" />
            KickerLive
          </div>
          {nickname && view !== 'LOGIN' && (
            <div className="text-sm text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full flex items-center gap-2">
              <Users className="w-4 h-4" />
              {nickname}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 pb-24">
        {view === 'LOGIN' && (
          <LoginView 
            nickname={nickname} 
            setNickname={setNickname} 
            handleLogin={handleLogin} 
          />
        )}
        
        {view === 'DASHBOARD' && (
          <DashboardView 
            events={events} 
            goToCreate={() => setView('CREATE')} 
            openEvent={(id) => {
              setCurrentEventId(id);
              setView('EVENT');
            }} 
          />
        )}

        {view === 'CREATE' && (
          <CreateMatchView 
            user={user}
            nickname={nickname}
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
            <h2 className="text-xl text-slate-400 mb-2">Evento non trovato.</h2>
            <p className="text-sm text-slate-500">Forse è stato cancellato o non hai i permessi.</p>
            <button 
              onClick={() => setView('DASHBOARD')}
              className="mt-6 px-6 py-2 bg-emerald-600 rounded-full text-white font-medium hover:bg-emerald-500 transition-colors"
            >
              Torna alla Bacheca
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function LoginView({ nickname, setNickname, handleLogin }) {
  return (
    <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <Trophy className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">Benvenuto nell'Arena</h1>
        <p className="text-center text-slate-400 mb-8 text-sm">
          Inserisci un nickname per unirti agli eventi o diventarne l'arbitro.
        </p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Il tuo Nickname..."
              maxLength={15}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center text-lg font-medium"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 text-lg"
          >
            Entra <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
}

function DashboardView({ events, goToCreate, openEvent }) {
  const liveEvents = events.filter(e => e.status === 'live');
  const pastEvents = events.filter(e => e.status === 'ended');

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* Create Event CTA */}
      <div className="mb-8">
        <button 
          onClick={goToCreate}
          className="w-full group bg-gradient-to-r from-emerald-600 to-teal-500 p-1 rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-[0.98]"
        >
          <div className="bg-slate-900/40 rounded-xl px-4 py-4 flex items-center justify-between group-hover:bg-transparent transition-all">
            <div className="flex flex-col text-left">
              <span className="text-white font-bold text-lg">Nuova Partita</span>
              <span className="text-emerald-100 text-sm opacity-90">Crea o importa un evento</span>
            </div>
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:rotate-90 transition-transform">
              <Plus className="w-6 h-6 text-white" />
            </div>
          </div>
        </button>
      </div>

      <div className="space-y-6">
        {/* LIVE EVENTS */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Live ({liveEvents.length})
          </h2>
          
          {liveEvents.length === 0 ? (
            <div className="text-center p-6 border border-dashed border-slate-700 rounded-xl text-slate-500 text-sm">
              Nessuna partita in corso in questo momento.
            </div>
          ) : (
            <div className="space-y-3">
              {liveEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => openEvent(event.id)} />
              ))}
            </div>
          )}
        </section>

        {/* PAST EVENTS */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 mt-8 flex items-center gap-2">
              <History className="w-4 h-4" /> Partite Terminate
            </h2>
            <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
              {pastEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => openEvent(event.id)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function CreateMatchView({ user, nickname, pastEvents, goBack, onMatchCreated }) {
  const [title, setTitle] = useState(`Partita di ${nickname}`);
  const [importId, setImportId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsCreating(true);
    
    const newEventId = crypto.randomUUID();
    const eventRef = doc(db, 'artifacts', typeof __app_id !== 'undefined' ? __app_id : 'kicker-app-id', 'public', 'data', 'events', newEventId);
    
    let teams = [
      { id: 't1', name: 'Squadra Rossa', players: [], scoreOffset: 0 },
      { id: 't2', name: 'Squadra Blu', players: [], scoreOffset: 0 }
    ];

    if (importId) {
      const matchToImport = pastEvents.find(e => e.id === importId);
      if (matchToImport && matchToImport.teams) {
        teams = matchToImport.teams.map(team => ({
          ...team,
          scoreOffset: 0,
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
      reactions: { fire: 0, clap: 0, shock: 0, ball: 0 },
      timeline: [{
        id: crypto.randomUUID(),
        type: 'start',
        time: new Date().toLocaleTimeString('it-IT', { hour12: false }),
        timestamp: Date.now()
      }]
    };

    try {
      await setDoc(eventRef, newEvent);
      onMatchCreated(newEventId);
    } catch (err) {
      console.error("Error creating event:", err);
      setIsCreating(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <button 
        onClick={goBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Annulla
      </button>

      <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Play className="w-5 h-5 text-emerald-400" /> Prepara la Partita
        </h2>

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Nome Evento</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Importa Giocatori (Opzionale)</label>
            <select
              value={importId}
              onChange={(e) => setImportId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
            >
              <option value="">-- Inizia da zero --</option>
              {pastEvents.map(evt => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({new Date(evt.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Selezionando una partita passata, le squadre e i nomi dei giocatori verranno copiati (i punteggi partiranno da 0).
            </p>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isCreating ? 'Creazione in corso...' : 'Avvia Partita Ora'}
          </button>
        </form>
      </div>
    </div>
  );
}

function EventCard({ event, onClick }) {
  const isLive = event.status === 'live';
  
  const getTeamScore = (team) => {
    const baseScore = team.players ? team.players.reduce((acc, p) => acc + (p.goals || 0), 0) : 0;
    return baseScore + (team.scoreOffset || 0);
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = n => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-slate-800 rounded-xl p-4 border cursor-pointer hover:border-slate-500 transition-all ${isLive ? 'border-slate-600 shadow-lg' : 'border-slate-800/50'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-white text-lg leading-tight">{event.title}</h3>
          <p className="text-xs text-slate-400 mt-1">{formatTimestamp(event.createdAt)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Host: {event.adminName}</p>
        </div>
        {isLive ? (
           <span className="text-xs font-bold bg-red-500/10 text-red-400 px-2 py-1 rounded-md border border-red-500/20 shadow-sm flex items-center gap-1">
             <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> LIVE
           </span>
        ) : (
           <span className="text-xs font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded-md">FINE</span>
        )}
      </div>
      
      <div className="flex items-center justify-between bg-slate-900/60 rounded-lg p-3">
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs font-semibold text-rose-400 mb-1 truncate w-full text-center">{event.teams[0].name}</span>
          <span className="text-2xl font-black text-white">{getTeamScore(event.teams[0])}</span>
        </div>
        <div className="text-slate-600 font-bold px-4">-</div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs font-semibold text-blue-400 mb-1 truncate w-full text-center">{event.teams[1].name}</span>
          <span className="text-2xl font-black text-white">{getTeamScore(event.teams[1])}</span>
        </div>
      </div>
    </div>
  );
}

function EventView({ event, user, goBack }) {
  const isAdmin = user && event.adminId === user.uid;
  const isLive = event.status === 'live';
  
  const [playerModal, setPlayerModal] = useState({ isOpen: false, teamIndex: null });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState('');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(event.title);

  useEffect(() => {
    setTempTitle(event.title);
  }, [event.title]);

  const getTeamScore = (team) => {
    const baseScore = team.players ? team.players.reduce((acc, p) => acc + (p.goals || 0), 0) : 0;
    return baseScore + (team.scoreOffset || 0);
  };

  const updateEventData = async (newData) => {
    const eventRef = doc(db, 'artifacts', typeof __app_id !== 'undefined' ? __app_id : 'kicker-app-id', 'public', 'data', 'events', event.id);
    await updateDoc(eventRef, newData);
  };

  const handleTitleSave = () => {
    if (tempTitle.trim() && tempTitle.trim() !== event.title) {
      updateEventData({ title: tempTitle.trim() });
    } else {
      setTempTitle(event.title);
    }
    setIsEditingTitle(false);
  };

  const setMatchStatus = (status) => {
    if (!isAdmin) return;
    const updates = { status };
    
    if (status === 'ended' && event.status === 'live') {
      const scoreA = getTeamScore(event.teams[0]);
      const scoreB = getTeamScore(event.teams[1]);
      const now = new Date();
      updates.timeline = [{
        id: crypto.randomUUID(),
        type: 'end',
        scoreString: `${scoreA}-${scoreB}`,
        time: now.toLocaleTimeString('it-IT', { hour12: false }),
        timestamp: now.getTime()
      }, ...(event.timeline || [])];
    }
    
    updateEventData(updates);
  };

  const updateTeamName = (teamIndex, newName) => {
    if (!isAdmin || !isLive) return;
    const newTeams = [...event.teams];
    newTeams[teamIndex].name = newName;
    updateEventData({ teams: newTeams });
  };

  const openAddPlayerModal = (teamIndex) => {
    if (!isAdmin || !isLive) return;
    setPlayerModal({ isOpen: true, teamIndex });
    setNewPlayerName('');
    setNewPlayerJersey('');
  };

  const confirmAddPlayer = (e) => {
    e.preventDefault();
    if (!isAdmin || !isLive || !newPlayerName.trim()) return;
    
    const newTeams = [...event.teams];
    const newPlayer = { 
      id: crypto.randomUUID(), 
      name: newPlayerName.trim(), 
      jersey: newPlayerJersey.trim(),
      goals: 0 
    };
    newTeams[playerModal.teamIndex].players = [...(newTeams[playerModal.teamIndex].players || []), newPlayer];
    updateEventData({ teams: newTeams });
    setPlayerModal({ isOpen: false, teamIndex: null });
  };

  const removePlayer = (teamIndex, playerId) => {
    if (!isAdmin || !isLive) return;
    const newTeams = [...event.teams];
    newTeams[teamIndex].players = newTeams[teamIndex].players.filter(p => p.id !== playerId);
    updateEventData({ teams: newTeams });
  };

  const updatePlayerGoal = (teamIndex, playerId, delta) => {
    if (!isAdmin || !isLive) return;
    const newTeams = [...event.teams];
    const player = newTeams[teamIndex].players.find(p => p.id === playerId);
    if (player) {
      const newGoals = player.goals + delta;
      if (newGoals >= 0) {
        player.goals = newGoals;
        
        let newTimeline = event.timeline || [];
        const now = new Date();
        const timeString = now.toLocaleTimeString('it-IT', { hour12: false });
        
        if (delta > 0) {
          newTimeline = [{
            id: crypto.randomUUID(),
            type: 'goal',
            playerName: player.name,
            teamName: newTeams[teamIndex].name,
            time: timeString,
            timestamp: now.getTime()
          }, ...newTimeline];
        } else if (delta < 0) {
          newTimeline = [{
            id: crypto.randomUUID(),
            type: 'undo',
            playerName: player.name,
            time: timeString,
            timestamp: now.getTime()
          }, ...newTimeline];
        }

        updateEventData({ teams: newTeams, timeline: newTimeline });
      }
    }
  };

  const deleteLog = (logId) => {
    if (!isAdmin) return;
    const newTimeline = (event.timeline || []).filter(log => log.id !== logId);
    updateEventData({ timeline: newTimeline });
  };

  const updateTeamOffset = (teamIndex, newOffset) => {
    if (!isAdmin || !isLive) return;
    const newTeams = [...event.teams];
    newTeams[teamIndex].scoreOffset = newOffset;
    updateEventData({ teams: newTeams });
  };

  const addReaction = (type) => {
    const newReactions = { ...event.reactions };
    newReactions[type] = (newReactions[type] || 0) + 1;
    updateEventData({ reactions: newReactions });
  };

  const shareOnWhatsApp = () => {
    const scoreA = getTeamScore(event.teams[0]);
    const scoreB = getTeamScore(event.teams[1]);
    let text = `🏆 *${event.title}*\n\n`;
    text += `🔴 *${event.teams[0].name}* ${scoreA} - ${scoreB} *${event.teams[1].name}* 🔵\n\n`;
    text += `⚽ *Marcatori:*\n`;
    
    event.teams.forEach((team, idx) => {
      const icon = idx === 0 ? '🔴' : '🔵';
      const scorers = (team.players || []).filter(p => p.goals > 0);
      if (scorers.length > 0) {
        text += `${icon} *${team.name}*:\n`;
        scorers.forEach(p => {
          const jersey = p.jersey ? ` [${p.jersey}]` : '';
          text += `  ➔ ${p.name}${jersey}: ${p.goals} gol\n`;
        });
      }
    });
    
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col min-h-[85vh]">
      
      <div className="flex justify-between items-center mb-4 w-full">
        <button 
          onClick={goBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Indietro
        </button>

        <button
          onClick={shareOnWhatsApp}
          className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-500 hover:text-white transition-all"
        >
          <Share2 className="w-4 h-4" /> Condividi
        </button>
      </div>

      <div className="bg-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl border border-slate-700 relative overflow-hidden flex-1 flex flex-col">
        
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-emerald-500 to-blue-500 opacity-80"></div>

        <div className="text-center mb-6 mt-2 relative group/title flex flex-col items-center">
          {isAdmin && isEditingTitle ? (
            <input
              autoFocus
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="text-2xl font-bold bg-slate-900 border border-slate-600 rounded text-center text-white px-2 py-1 mb-1 focus:outline-none focus:border-emerald-500 w-full max-w-xs mx-auto"
            />
          ) : (
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{event.title}</h1>
              {isAdmin && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-slate-500 hover:text-emerald-400 md:opacity-0 md:group-hover/title:opacity-100 transition-opacity"
                  title="Modifica nome evento"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center justify-center gap-2">
            {isLive ? (
              <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded border border-red-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> IN CORSO
              </span>
            ) : (
              <span className="bg-slate-700 text-slate-300 text-xs font-bold px-2 py-1 rounded">TERMINATA</span>
            )}
            <span className="text-xs text-slate-500">Arbitro: {event.adminName}</span>
          </div>
        </div>

        <div className="flex gap-4 md:gap-8 flex-1">
          {event.teams.map((team, index) => (
            <TeamColumn 
              key={team.id}
              team={team}
              index={index}
              teamScore={getTeamScore(team)}
              isAdmin={isAdmin}
              isLive={isLive}
              updateTeamName={updateTeamName}
              openAddPlayerModal={() => openAddPlayerModal(index)}
              removePlayer={removePlayer}
              updatePlayerGoal={updatePlayerGoal}
              updateTeamOffset={updateTeamOffset}
            />
          ))}
        </div>
      </div>

      {(event.timeline && event.timeline.length > 0) && (
        <div className="mt-6 bg-slate-800/80 rounded-xl p-4 border border-slate-700 max-h-48 overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" /> Cronologia Eventi
          </h3>
          <div className="space-y-2">
            {event.timeline.map((log) => (
              <div key={log.id} className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2 group">
                <span className="text-slate-300 flex-1 pr-2">
                  {log.type === 'start' && <span>🎬 Inizia lo spettacolo</span>}
                  {log.type === 'end' && <span>🏁 Finisce qui la partita col risultato di <span className="font-bold text-white">{log.scoreString}</span></span>}
                  {(!log.type || log.type === 'goal') && (
                    <span><span className="font-bold text-white">{log.playerName}</span> ha segnato per <span className={log.teamName === event.teams[0].name ? 'text-rose-400' : 'text-blue-400'}>{log.teamName}</span> ⚽</span>
                  )}
                  {log.type === 'undo' && (
                    <span>❌ A <span className="font-bold text-white">{log.playerName}</span> è stato annullato il goal</span>
                  )}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-mono text-xs">{log.time}</span>
                  {isAdmin && (
                    <button 
                      onClick={() => deleteLog(log.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100"
                      title="Elimina log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className={`mt-4 rounded-xl p-4 flex justify-between items-center border shadow-lg ${isLive ? 'bg-slate-800/80 border-red-500/20' : 'bg-slate-800/80 border-emerald-500/20'}`}>
          <div className="text-sm">
            <span className="font-bold text-white block">Opzioni Admin</span>
            <span className="text-slate-400">{isLive ? "Chiudi quando finito" : "Correzioni necessarie?"}</span>
          </div>
          
          {isLive ? (
            <button 
              onClick={() => setMatchStatus('ended')}
              className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Termina Partita
            </button>
          ) : (
            <button 
              onClick={() => setMatchStatus('live')}
              className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg font-bold hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Riapri Partita
            </button>
          )}
        </div>
      )}

      <div className="mt-8 mb-4">
        <h3 className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Reazioni Pubblico</h3>
        <div className="flex justify-center gap-6">
          <ReactionButton emoji="🔥" count={event.reactions?.fire} onClick={() => addReaction('fire')} />
          <ReactionButton emoji="👏" count={event.reactions?.clap} onClick={() => addReaction('clap')} />
          <ReactionButton emoji="😱" count={event.reactions?.shock} onClick={() => addReaction('shock')} />
          <ReactionButton emoji="⚽" count={event.reactions?.ball} onClick={() => addReaction('ball')} />
        </div>
      </div>

      {playerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Aggiungi Giocatore</h3>
              <button onClick={() => setPlayerModal({ isOpen: false, teamIndex: null })} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={confirmAddPlayer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome Giocatore *</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Es. Mario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Numero Maglia (Opzionale)</label>
                <input
                  type="number"
                  value={newPlayerJersey}
                  onChange={(e) => setNewPlayerJersey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Es. 10"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl py-2 mt-2 transition-colors"
              >
                Conferma
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function TeamColumn({ team, index, teamScore, isAdmin, isLive, updateTeamName, openAddPlayerModal, removePlayer, updatePlayerGoal, updateTeamOffset }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(team.name);
  
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [tempScore, setTempScore] = useState(teamScore);

  useEffect(() => {
    setTempScore(teamScore);
  }, [teamScore]);

  const handleNameSave = () => {
    if (tempName.trim()) {
      updateTeamName(index, tempName);
    } else {
      setTempName(team.name);
    }
    setIsEditingName(false);
  };

  const handleScoreSave = () => {
    const baseScore = team.players ? team.players.reduce((acc, p) => acc + (p.goals || 0), 0) : 0;
    const parsed = parseInt(tempScore, 10);
    const newTotal = isNaN(parsed) ? baseScore : parsed;
    updateTeamOffset(index, newTotal - baseScore);
    setIsEditingScore(false);
  };

  const isLeft = index === 0;
  const theme = isLeft ? {
    color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', buttonHover: 'hover:bg-rose-500/20',
    gradient: 'from-rose-500/5 to-transparent'
  } : {
    color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', buttonHover: 'hover:bg-blue-500/20',
    gradient: 'from-blue-500/5 to-transparent'
  };

  const players = team.players || [];

  return (
    <div className={`flex-1 flex flex-col rounded-2xl border ${theme.border} bg-gradient-to-b ${theme.gradient} overflow-hidden`}>
      
      <div className={`p-4 text-center border-b ${theme.border} ${theme.bg}`}>
        <div className="h-8 flex items-center justify-center mb-1">
          {isAdmin && isLive ? (
            isEditingName ? (
              <input 
                autoFocus
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                className="w-full max-w-[120px] bg-slate-900 border border-slate-600 rounded text-center text-sm font-bold text-white px-1 py-0.5 focus:outline-none focus:border-emerald-500"
              />
            ) : (
              <div 
                onClick={() => setIsEditingName(true)}
                className={`text-sm md:text-base font-bold truncate cursor-pointer border-b border-dashed border-slate-500/50 pb-0.5 ${theme.color} hover:text-white transition-colors`}
                title="Modifica nome squadra"
              >
                {team.name}
              </div>
            )
          ) : (
            <div className={`text-sm md:text-base font-bold truncate ${theme.color}`}>
              {team.name}
            </div>
          )}
        </div>
        
        <div className="flex justify-center items-center gap-2 group/score">
          {isAdmin && isLive && isEditingScore ? (
            <input 
              autoFocus
              type="number"
              value={tempScore}
              onChange={e => setTempScore(e.target.value)}
              onBlur={handleScoreSave}
              onKeyDown={e => e.key === 'Enter' && handleScoreSave()}
              className="w-20 bg-slate-900 border border-slate-600 rounded text-center text-4xl md:text-5xl font-black text-white py-1 focus:outline-none focus:border-emerald-500 mx-auto"
            />
          ) : (
            <div className="text-5xl md:text-6xl font-black text-white drop-shadow-md flex items-center relative justify-center">
              {teamScore}
              {isAdmin && isLive && (
                <button 
                  onClick={() => setIsEditingScore(true)}
                  className="absolute -right-8 text-slate-500 hover:text-emerald-400 opacity-0 group-hover/score:opacity-100 transition-opacity"
                  title="Modifica manualmente il punteggio totale"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-2 md:p-3 overflow-y-auto space-y-2 min-h-[150px]">
        {players.length === 0 ? (
          <div className="text-center text-xs text-slate-500 mt-4 italic">Nessun giocatore</div>
        ) : (
          players.map(player => (
            <div key={player.id} className="bg-slate-900/60 rounded-xl p-2 md:p-3 flex flex-col gap-2 border border-slate-700/50 relative group">
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-200 truncate pr-2 flex-1">
                  {player.name}
                  {player.jersey && <span className="ml-1.5 text-xs text-slate-500 font-mono bg-slate-800 px-1 py-0.5 rounded">#{player.jersey}</span>}
                </span>
                {isAdmin && isLive && (
                  <button 
                    onClick={() => removePlayer(index, player.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                    title="Rimuovi giocatore"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between bg-slate-950/50 rounded-lg p-1">
                {isAdmin && isLive ? (
                  <>
                    <button 
                      onClick={() => updatePlayerGoal(index, player.id, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors active:scale-95"
                    >-</button>
                    <span className={`text-xl font-bold ${theme.color}`}>{player.goals}</span>
                    <button 
                      onClick={() => updatePlayerGoal(index, player.id, 1)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md ${theme.bg} ${theme.color} font-bold ${theme.buttonHover} hover:text-white transition-colors active:scale-95`}
                    >+</button>
                  </>
                ) : (
                  <div className="w-full text-center">
                    <span className="text-xs text-slate-500 mr-2">Gol:</span>
                    <span className={`text-xl font-bold ${theme.color}`}>{player.goals}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isAdmin && isLive && (
        <div className="p-2 md:p-3 border-t border-slate-700/50 bg-slate-900/30">
          <button 
            onClick={openAddPlayerModal}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white ${theme.buttonHover} transition-colors text-sm font-medium`}
          >
            <Plus className="w-4 h-4" /> Aggiungi Giocatore
          </button>
        </div>
      )}
    </div>
  );
}

function ReactionButton({ emoji, count = 0, onClick }) {
  const [animate, setAnimate] = useState(false);

  const handleClick = () => {
    setAnimate(true);
    setTimeout(() => setAnimate(false), 300);
    onClick();
  };

  return (
    <button 
      onClick={handleClick}
      className={`flex flex-col items-center gap-1.5 group transition-transform ${animate ? 'scale-125' : 'hover:-translate-y-1'}`}
    >
      <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-xl md:text-2xl shadow-lg group-hover:border-emerald-500 group-hover:bg-slate-700 transition-all">
        {emoji}
      </div>
      <div className="bg-slate-900/80 px-3 py-0.5 rounded-full text-xs font-bold text-slate-400 border border-slate-800 min-w-[32px] text-center">
        {count}
      </div>
    </button>
  );
}