import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, setDoc, updateDoc, increment } from 'firebase/firestore';
import { Trophy, Plus, ArrowLeft, Activity, Users, Flame, Check, Play, RotateCcw, Trash2, History, X, Share2, Clock, Edit2, ChevronDown, ChevronUp, Palette, UserMinus } from 'lucide-react';

// --- FIREBASE INITIALIZATION ---
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

// Palette colori predefinita
const TEAM_COLORS = [
  { name: 'Blu', hex: '#174195' },
  { name: 'Giallo', hex: '#feed00' },
  { name: 'Rosso', hex: '#ef4444' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Viola', hex: '#a855f7' },
  { name: 'Arancione', hex: '#f97316' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Celeste', hex: '#0ea5e9' },
  { name: 'Grigio', hex: '#64748b' },
  { name: 'Bianco', hex: '#f8fafc' }
];

const EMOJI_LIST = ['👎', '👍', '🫶', '👏', '💪', '😃', '🤣', '🤩', '😈', '🫣', '😱', '😡'];

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [nickname, setNickname] = useState(localStorage.getItem('kicker_nickname') || '');
  const [view, setView] = useState(nickname ? 'DASHBOARD' : 'LOGIN');
  
  const [events, setEvents] = useState([]);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  useEffect(() => {
    if (!user) return;

    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
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

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    if (cleanNick.length > 0) {
      setNickname(cleanNick);
      localStorage.setItem('kicker_nickname', cleanNick);
      setView('DASHBOARD');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('kicker_nickname');
    setNickname('');
    setView('LOGIN');
    setShowLogoutConfirm(false);
    await signOut(auth);
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
      
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20 shadow-md">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl tracking-tight cursor-pointer" onClick={() => setView('DASHBOARD')}>
            <Activity className="w-6 h-6" />
            KickerLive
          </div>
          {nickname && view !== 'LOGIN' && (
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="text-sm text-slate-400 bg-slate-700/50 hover:bg-slate-700 transition-colors px-3 py-1 rounded-full flex items-center gap-2 cursor-pointer group"
              title="Disconnetti"
            >
              <Users className="w-4 h-4 group-hover:text-red-400 transition-colors" />
              {nickname}
            </button>
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

      {/* Modal di Conferma Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <h3 className="text-xl font-bold text-white mb-2">Disconnetti</h3>
            <p className="text-sm text-slate-400 mb-6">
              Attenzione: se effettui il logout <span className="font-bold text-red-400">non sarai più in grado di gestire</span> gli eventi creati in passato come admin, ma solo quelli nuovi al prossimo accesso.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl py-3 transition-colors"
              >
                Resta connesso
              </button>
              <button 
                onClick={handleLogout}
                className="w-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 font-bold rounded-xl py-3 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

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
          <span className="text-xs font-semibold mb-1 truncate w-full text-center" style={{ color: event.teams[0].color || '#ef4444' }}>
            {event.teams[0].name}
          </span>
          <span className="text-2xl font-black text-white">{getTeamScore(event.teams[0])}</span>
        </div>
        <div className="text-slate-600 font-bold px-4">-</div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs font-semibold mb-1 truncate w-full text-center" style={{ color: event.teams[1].color || '#174195' }}>
            {event.teams[1].name}
          </span>
          <span className="text-2xl font-black text-white">{getTeamScore(event.teams[1])}</span>
        </div>
      </div>
    </div>
  );
}

function EventView({ event, user, goBack }) {
  const isAdmin = user && event.adminId === user.uid;
  const isLive = event.status === 'live';
  
  const [showTeam0Players, setShowTeam0Players] = useState(true);
  const [showTeam1Players, setShowTeam1Players] = useState(true);

  const [teamModal, setTeamModal] = useState({ isOpen: false, teamIndex: null, name: '', color: '' });
  const [playerModal, setPlayerModal] = useState({ isOpen: false, teamIndex: null });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, teamIndex: null, playerId: null, playerName: '' });

  // Stato per edit punteggio al volo
  const [editingScore, setEditingScore] = useState({ teamIndex: null, tempScore: '' });

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(event.title);

  useEffect(() => {
    setTempTitle(event.title);
  }, [event.title]);

  const getTeamScore = (team) => {
    const baseScore = team.players ? team.players.reduce((acc, p) => acc + (p.goals || 0), 0) : 0;
    return baseScore + (team.scoreOffset || 0);
  };

  // Funzione per ordinare i giocatori (Fix 4: ordine decrescente)
  const getSortedPlayers = (players) => {
    return [...(players || [])].sort((a, b) => b.goals - a.goals);
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

  const openTeamModal = (teamIndex) => {
    if (!isAdmin) return;
    setTeamModal({
      isOpen: true,
      teamIndex,
      name: event.teams[teamIndex].name,
      color: event.teams[teamIndex].color || (teamIndex === 0 ? '#ef4444' : '#174195')
    });
  };

  const handleSaveTeamDetails = (e) => {
    e.preventDefault();
    if (!isAdmin || teamModal.teamIndex === null) return;
    
    const newTeams = [...event.teams];
    const cleanName = teamModal.name.trim();
    if (cleanName) {
      newTeams[teamModal.teamIndex].name = cleanName;
    }
    newTeams[teamModal.teamIndex].color = teamModal.color;
    
    updateEventData({ teams: newTeams });
    setTeamModal({ isOpen: false, teamIndex: null, name: '', color: '' });
  };

  // Funzioni gestione Punteggio Rapido (Fix 1)
  const handleScoreSave = (teamIndex) => {
    const team = event.teams[teamIndex];
    const baseScore = team.players ? team.players.reduce((acc, p) => acc + (p.goals || 0), 0) : 0;
    const parsed = parseInt(editingScore.tempScore, 10);
    const newTotal = isNaN(parsed) ? getTeamScore(team) : parsed;
    updateTeamOffset(teamIndex, newTotal - baseScore);
    setEditingScore({ teamIndex: null, tempScore: '' });
  };

  const updateTeamOffset = (teamIndex, newOffset) => {
    if (!isAdmin || !isLive) return;
    const newTeams = [...event.teams];
    newTeams[teamIndex].scoreOffset = newOffset;
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

  const promptRemovePlayer = (teamIndex, player) => {
    if (!isAdmin || !isLive) return;
    setDeleteConfirmModal({
      isOpen: true,
      teamIndex,
      playerId: player.id,
      playerName: player.name
    });
  };

  const executeRemovePlayer = () => {
    const { teamIndex, playerId } = deleteConfirmModal;
    if (teamIndex === null || !playerId) return;

    const newTeams = [...event.teams];
    newTeams[teamIndex].players = newTeams[teamIndex].players.filter(p => p.id !== playerId);
    updateEventData({ teams: newTeams });
    setDeleteConfirmModal({ isOpen: false, teamIndex: null, playerId: null, playerName: '' });
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

  // Fix: Utilizzo di increment() per evitare accavallamenti tra utenti contemporanei
  const addReaction = (type) => {
    const eventRef = doc(db, 'artifacts', typeof __app_id !== 'undefined' ? __app_id : 'kicker-app-id', 'public', 'data', 'events', event.id);
    updateDoc(eventRef, {
      [`reactions.${type}`]: increment(1)
    });
  };

  const shareOnWhatsApp = () => {
    const scoreA = getTeamScore(event.teams[0]);
    const scoreB = getTeamScore(event.teams[1]);
    let text = `🏆 *${event.title}*\n\n`;
    text += `🔴 *${event.teams[0].name}* ${scoreA} - ${scoreB} *${event.teams[1].name}* 🔵\n\n`;
    text += `⚽ *Marcatori:*\n`;
    
    event.teams.forEach((team, idx) => {
      const icon = idx === 0 ? '🔴' : '🔵';
      const scorers = getSortedPlayers(team.players).filter(p => p.goals > 0);
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

  const color0 = event.teams[0].color || '#ef4444';
  const color1 = event.teams[1].color || '#174195';

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

        {/* Tabellone Punteggio */}
        <div className="w-full space-y-4">
          
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700">
            <div className="flex justify-between items-center">
              
              {/* SQUADRA 0 */}
              <div className="flex flex-col items-center w-2/5">
                 <button 
                  onClick={() => openTeamModal(0)}
                  disabled={!isAdmin}
                  className={`font-semibold mb-1 text-xs md:text-sm truncate max-w-full flex items-center gap-1.5 group/col transition-all ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''}`}
                  title={isAdmin ? "Clicca per modificare nome e colore" : ""}
                 >
                   <span className="w-3 h-3 rounded-full inline-block shadow-sm shrink-0" style={{ backgroundColor: color0 }}></span>
                   <span style={{ color: color0 }}>{event.teams[0].name}</span>
                   {isAdmin && <Palette className="w-3 h-3 opacity-0 group-hover/col:opacity-100 transition-opacity text-slate-400" />}
                 </button>
                 
                 {isAdmin && isLive && editingScore.teamIndex === 0 ? (
                   <input
                     autoFocus
                     type="number"
                     value={editingScore.tempScore}
                     onChange={(e) => setEditingScore({ ...editingScore, tempScore: e.target.value })}
                     onBlur={() => handleScoreSave(0)}
                     onKeyDown={(e) => e.key === 'Enter' && handleScoreSave(0)}
                     className="w-20 bg-slate-900 border border-slate-600 rounded text-center text-4xl md:text-6xl font-black text-white py-1 focus:outline-none focus:border-emerald-500 mx-auto"
                   />
                 ) : (
                   <div 
                     onClick={() => isAdmin && isLive && setEditingScore({ teamIndex: 0, tempScore: getTeamScore(event.teams[0]) })}
                     className={`text-4xl md:text-6xl font-black text-white flex items-center relative group/score ${isAdmin && isLive ? 'cursor-pointer' : ''}`}
                     title={isAdmin && isLive ? "Modifica punteggio" : ""}
                   >
                     {getTeamScore(event.teams[0])}
                     {isAdmin && isLive && (
                        <Edit2 className="w-5 h-5 absolute -right-8 text-slate-500 opacity-0 group-hover/score:opacity-100 transition-opacity" />
                     )}
                   </div>
                 )}
              </div>

              <div className="text-xl font-bold text-slate-500">VS</div>

              {/* SQUADRA 1 */}
              <div className="flex flex-col items-center w-2/5">
                 <button 
                  onClick={() => openTeamModal(1)}
                  disabled={!isAdmin}
                  className={`font-semibold mb-1 text-xs md:text-sm truncate max-w-full flex items-center gap-1.5 group/col transition-all ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''}`}
                  title={isAdmin ? "Clicca per modificare nome e colore" : ""}
                 >
                   <span className="w-3 h-3 rounded-full inline-block shadow-sm shrink-0" style={{ backgroundColor: color1 }}></span>
                   <span style={{ color: color1 }}>{event.teams[1].name}</span>
                   {isAdmin && <Palette className="w-3 h-3 opacity-0 group-hover/col:opacity-100 transition-opacity text-slate-400" />}
                 </button>

                 {isAdmin && isLive && editingScore.teamIndex === 1 ? (
                   <input
                     autoFocus
                     type="number"
                     value={editingScore.tempScore}
                     onChange={(e) => setEditingScore({ ...editingScore, tempScore: e.target.value })}
                     onBlur={() => handleScoreSave(1)}
                     onKeyDown={(e) => e.key === 'Enter' && handleScoreSave(1)}
                     className="w-20 bg-slate-900 border border-slate-600 rounded text-center text-4xl md:text-6xl font-black text-white py-1 focus:outline-none focus:border-emerald-500 mx-auto"
                   />
                 ) : (
                   <div 
                     onClick={() => isAdmin && isLive && setEditingScore({ teamIndex: 1, tempScore: getTeamScore(event.teams[1]) })}
                     className={`text-4xl md:text-6xl font-black text-white flex items-center relative group/score ${isAdmin && isLive ? 'cursor-pointer' : ''}`}
                     title={isAdmin && isLive ? "Modifica punteggio" : ""}
                   >
                     {getTeamScore(event.teams[1])}
                     {isAdmin && isLive && (
                        <Edit2 className="w-5 h-5 absolute -right-8 text-slate-500 opacity-0 group-hover/score:opacity-100 transition-opacity" />
                     )}
                   </div>
                 )}
              </div>

            </div>
          </div>

          {/* LISTA FORMAZIONI CON TOGGLE SEPARATI E ORDINE DECRESCENTE */}
          <div className="space-y-4 transition-all">
            
            {/* Blocco Squadra 0 */}
            <div className="bg-slate-900/40 rounded-xl border overflow-hidden shadow-md" style={{ borderColor: `${color0}33` }}>
              <div 
                onClick={() => setShowTeam0Players(!showTeam0Players)}
                className="px-4 py-2.5 font-bold text-xs tracking-wider flex justify-between items-center cursor-pointer transition-colors hover:bg-white/5"
                style={{ backgroundColor: `${color0}15`, color: color0 }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color0 }}></span>
                  <span>{event.teams[0].name.toUpperCase()} ({event.teams[0].players?.length || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && isLive && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openAddPlayerModal(0); }} 
                      className="text-xs bg-black/30 hover:bg-black/50 px-2 py-1 rounded text-white flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Aggiungi
                    </button>
                  )}
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    {showTeam0Players ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>
              </div>

              {showTeam0Players && (
                <div className="divide-y divide-slate-700/50 px-4 transition-all">
                  {(!event.teams[0].players || event.teams[0].players.length === 0) ? (
                    <div className="py-3 text-xs text-slate-500 italic text-center">Nessun giocatore</div>
                  ) : (
                    getSortedPlayers(event.teams[0].players).map(player => (
                      <div key={player.id} className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-2">
                          {isAdmin && isLive && (
                            <button 
                              onClick={() => promptRemovePlayer(0, player)}
                              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg bg-slate-950/40 hover:bg-red-500/10 transition-colors"
                              title="Rimuovi giocatore"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                          <span className="font-medium text-slate-200 text-sm">
                            {player.name} {player.jersey && <span className="text-slate-500 text-xs ml-1 font-mono">#{player.jersey}</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {isAdmin && isLive ? (
                            <div className="flex items-center gap-1 bg-slate-950/60 rounded-lg p-0.5 border border-slate-800">
                              <button 
                                onClick={() => updatePlayerGoal(0, player.id, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-bold"
                              >-</button>
                              <span className="w-6 text-center text-sm font-bold" style={{ color: color0 }}>{player.goals}</span>
                              <button 
                                onClick={() => updatePlayerGoal(0, player.id, 1)}
                                className="w-7 h-7 flex items-center justify-center rounded text-white text-sm font-bold"
                                style={{ backgroundColor: `${color0}50` }}
                              >+</button>
                            </div>
                          ) : (
                            <div className="font-bold text-lg" style={{ color: color0 }}>{player.goals}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Blocco Squadra 1 */}
            <div className="bg-slate-900/40 rounded-xl border overflow-hidden shadow-md" style={{ borderColor: `${color1}33` }}>
              <div 
                onClick={() => setShowTeam1Players(!showTeam1Players)}
                className="px-4 py-2.5 font-bold text-xs tracking-wider flex justify-between items-center cursor-pointer transition-colors hover:bg-white/5"
                style={{ backgroundColor: `${color1}15`, color: color1 }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color1 }}></span>
                  <span>{event.teams[1].name.toUpperCase()} ({event.teams[1].players?.length || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && isLive && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openAddPlayerModal(1); }} 
                      className="text-xs bg-black/30 hover:bg-black/50 px-2 py-1 rounded text-white flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Aggiungi
                    </button>
                  )}
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    {showTeam1Players ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>
              </div>

              {showTeam1Players && (
                <div className="divide-y divide-slate-700/50 px-4 transition-all">
                  {(!event.teams[1].players || event.teams[1].players.length === 0) ? (
                    <div className="py-3 text-xs text-slate-500 italic text-center">Nessun giocatore</div>
                  ) : (
                    getSortedPlayers(event.teams[1].players).map(player => (
                      <div key={player.id} className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-2">
                          {isAdmin && isLive && (
                            <button 
                              onClick={() => promptRemovePlayer(1, player)}
                              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg bg-slate-950/40 hover:bg-red-500/10 transition-colors"
                              title="Rimuovi giocatore"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                          <span className="font-medium text-slate-200 text-sm">
                            {player.name} {player.jersey && <span className="text-slate-500 text-xs ml-1 font-mono">#{player.jersey}</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {isAdmin && isLive ? (
                            <div className="flex items-center gap-1 bg-slate-950/60 rounded-lg p-0.5 border border-slate-800">
                              <button 
                                onClick={() => updatePlayerGoal(1, player.id, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-bold"
                              >-</button>
                              <span className="w-6 text-center text-sm font-bold" style={{ color: color1 }}>{player.goals}</span>
                              <button 
                                onClick={() => updatePlayerGoal(1, player.id, 1)}
                                className="w-7 h-7 flex items-center justify-center rounded text-white text-sm font-bold"
                                style={{ backgroundColor: `${color1}50` }}
                              >+</button>
                            </div>
                          ) : (
                            <div className="font-bold text-lg" style={{ color: color1 }}>{player.goals}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>
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
                    <span><span className="font-bold text-white">{log.playerName}</span> ha segnato per <span style={{ color: log.teamName === event.teams[0].name ? color0 : color1 }}>{log.teamName}</span> ⚽</span>
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
        <h3 className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Reazioni Pubblico</h3>
        {/* Griglia 3 righe x 4 colonne (Fix 2) */}
        <div className="grid grid-cols-4 gap-3 md:gap-4 justify-items-center max-w-sm mx-auto">
          {EMOJI_LIST.map((emoji) => (
             <ReactionButton 
                key={emoji} 
                emoji={emoji} 
                count={event.reactions?.[emoji] || 0} 
                onClick={() => addReaction(emoji)} 
             />
          ))}
        </div>
      </div>

      {/* Modal Aggiungi Giocatore */}
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

      {/* Modal Modifica Nome & Colore Squadra */}
      {teamModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Modifica Squadra</h3>
              <button onClick={() => setTeamModal({ isOpen: false, teamIndex: null, name: '', color: '' })} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeamDetails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome Squadra</label>
                <input
                  type="text"
                  required
                  value={teamModal.name}
                  onChange={(e) => setTeamModal({ ...teamModal, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  placeholder="Es. Real Madrid"
                  maxLength={25}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Colore Squadra</label>
                <div className="grid grid-cols-5 gap-2.5">
                  {TEAM_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setTeamModal({ ...teamModal, color: col.hex })}
                      className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform hover:scale-110 shadow-md border border-slate-600 relative"
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    >
                      {teamModal.color === col.hex && (
                        <Check className="w-5 h-5 text-black drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setTeamModal({ isOpen: false, teamIndex: null, name: '', color: '' })}
                  className="w-1/2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl py-2.5 transition-colors"
                >
                  Annulla
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl py-2.5 transition-colors"
                >
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup Conferma Eliminazione Giocatore */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <h3 className="text-lg font-bold text-white mb-2">Rimuovi Giocatore</h3>
            <p className="text-sm text-slate-400 mb-6">
              Vuoi davvero rimuovere <span className="font-bold text-white">{deleteConfirmModal.playerName}</span> dalla partita?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmModal({ isOpen: false, teamIndex: null, playerId: null, playerName: '' })}
                className="w-1/2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl py-2.5 transition-colors"
              >
                Annulla
              </button>
              <button 
                onClick={executeRemovePlayer}
                className="w-1/2 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl py-2.5 transition-colors"
              >
                Cancella
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ReactionButton({ emoji, count = 0, onClick }) {
  const [animate, setAnimate] = useState(false);
  const [particles, setParticles] = useState([]);
  
  // Utilizziamo useRef per tracciare il conteggio precedente e reagire solo agli incrementi
  const prevCountRef = useRef(count);

  useEffect(() => {
    // Se il count attuale è MAGGIORE del precedente significa che qualcuno nel mondo ha cliccato
    if (count > prevCountRef.current) {
      const diff = count - prevCountRef.current;
      // Per non affollare lo schermo, limitiamo i burst simultanei se il count salta tanto di botto
      const bursts = Math.min(diff, 3); 

      for (let j = 0; j < bursts; j++) {
        setTimeout(() => {
          const id = Date.now() + Math.random();
          const newParticles = Array.from({ length: 8 }).map((_, i) => ({
            id: `${id}-${i}`,
            xOffset: (Math.random() - 0.5) * 120,
            scale: 0.8 + Math.random() * 0.8,
            duration: 1.2 + Math.random() * 0.8,
            rotation: (Math.random() - 0.5) * 45
          }));

          setParticles(prev => [...prev, ...newParticles]);

          setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
          }, 2000);
        }, j * 150); // piccolo ritardo tra burst multipli
      }
    }
    
    // Aggiorna il reference per il prossimo render
    prevCountRef.current = count;
  }, [count, emoji]);

  const handleClick = () => {
    // Animazione bottone premuto locale
    setAnimate(true);
    setTimeout(() => setAnimate(false), 300);
    // Avvisa Firebase (questo scatenerà il count > prevCountRef in TUTTI i client compreso questo)
    onClick();
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-none overflow-visible z-30 w-0 h-0">
        {particles.map(p => (
          <span
            key={p.id}
            className="absolute text-2xl select-none animate-instagram-float"
            style={{
              left: `${p.xOffset}px`,
              '--tw-scale-x': p.scale,
              '--tw-scale-y': p.scale,
              transform: `scale(${p.scale}) rotate(${p.rotation}deg)`,
              animationDuration: `${p.duration}s`
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <button 
        onClick={handleClick}
        className={`flex flex-col items-center gap-1.5 group transition-transform ${animate ? 'scale-125' : 'hover:-translate-y-1'}`}
      >
        <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-xl md:text-2xl shadow-lg group-hover:border-emerald-500 group-hover:bg-slate-700 transition-all">
          {emoji}
        </div>
        {count > 0 && (
          <div className="bg-slate-900/80 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold text-slate-400 border border-slate-800 min-w-[28px] text-center">
            {count}
          </div>
        )}
      </button>

      <style>{`
        @keyframes instagramFloat {
          0% {
            opacity: 1;
            transform: translateY(0px) scale(0.6) rotate(0deg);
          }
          50% {
            opacity: 0.9;
            transform: translateY(-120px) scale(1.2) rotate(10deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-240px) scale(1) rotate(-10deg);
          }
        }
        .animate-instagram-float {
          animation: instagramFloat linear forwards;
        }
      `}</style>
    </div>
  );
}