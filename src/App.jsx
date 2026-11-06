import React, { useState } from 'react';
import { Trophy, Share2, Plus, Trash2, Edit2, Smile, ArrowLeft, Shield, Check, X } from 'lucide-react';

export default function App() {
  // Stato info partita (con supporto a nomi e colori personalizzabili per le squadre)
  const [matchInfo, setMatchInfo] = useState({
    teamA: "SQUADRA A",
    teamB: "SQUADRA B",
    colorA: "#10b981", // Smeraldo di default
    colorB: "#6366f1", // Indaco di default
    seed: "seed-1234"
  });

  // Modalità Amministratore (sbloccabile tramite password o pulsante)
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingTeams, setIsEditingTeams] = useState(false);

  // Tab della partita
  const [tabs, setTabs] = useState([
    { id: 'TOT', name: 'TOT', isTotal: true },
    { id: '1', name: '1', isTotal: false },
    { id: '2', name: '2', isTotal: false }
  ]);
  const [activeTab, setActiveTab] = useState('1');

  // Giocatori
  const [players, setPlayers] = useState([
    { id: 'p1', name: 'Giocatore 1', team: 'A' },
    { id: 'p2', name: 'Giocatore 2', team: 'A' },
    { id: 'p3', name: 'Giocatore 3', team: 'B' },
    { id: 'p4', name: 'Giocatore 4', team: 'B' }
  ]);

  // Goals per tab: { tabId: { playerId: count } }
  const [goals, setGoals] = useState({
    '1': { p1: 2, p2: 0, p3: 1, p4: 0 },
    '2': { p1: 1, p2: 1, p3: 2, p4: 1 }
  });

  // Cronologia eventi
  const [history, setHistory] = useState([
    { time: '12:34', text: 'Gol di Giocatore 1 (Tab 1) ⚽' },
    { time: '12:40', text: 'Gol di Giocatore 3 (Tab 1) 🔥' },
    { time: '13:02', text: 'Gol di Giocatore 1 (Tab 2) 🚀' }
  ]);

  // Modali e stati UI
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [flyingEmoji, setFlyingEmoji] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [password, setPassword] = useState('');
  const [actionToConfirm, setActionToConfirm] = useState(null);
  const [targetTabToDelete, setTargetTabToDelete] = useState(null);

  // Calcolo dei totali per il tab TOT
  const getTotals = () => {
    const totals = {};
    players.forEach(p => {
      totals[p.id] = 0;
      Object.keys(goals).forEach(tabId => {
        if (tabId !== 'TOT') {
          totals[p.id] += (goals[tabId]?.[p.id] || 0);
        }
      });
    });
    return totals;
  };

  const totals = getTotals();

  // Gol per la vista corrente
  const getCurrentGoals = () => {
    if (activeTab === 'TOT') return totals;
    return goals[activeTab] || {};
  };

  const currentGoals = getCurrentGoals();

  const getTeamScore = (team) => {
    const teamPlayers = players.filter(p => p.team === team);
    return teamPlayers.reduce((sum, p) => sum + (currentGoals[p.id] || 0), 0);
  };

  const scoreA = getTeamScore('A');
  const scoreB = getTeamScore('B');

  // Gestione modifica gol
  const handleGoalChange = (playerId, delta) => {
    if (activeTab === 'TOT') return;
    setGoals(prev => {
      const tabGoals = { ...(prev[activeTab] || {}) };
      const current = tabGoals[playerId] || 0;
      const updated = Math.max(0, current + delta);
      tabGoals[playerId] = updated;
      return { ...prev, [activeTab]: tabGoals };
    });

    if (delta > 0) {
      const player = players.find(p => p.id === playerId);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setHistory(prev => [
        { time: timeStr, text: `Gol di ${player.name} (Tab ${activeTab}) ⚽` },
        ...prev
      ]);
    }
  };

  // Aggiungi un nuovo Tab
  const handleAddTab = () => {
    const numericTabs = tabs.filter(t => !t.isTotal);
    const nextNum = numericTabs.length + 1;
    const newId = String(nextNum);
    setTabs(prev => [...prev.filter(t => t.id !== '+'), { id: newId, name: String(nextNum), isTotal: false }]);
    setActiveTab(newId);
    setGoals(prev => ({ ...prev, [newId]: {} }));
  };

  // Richiesta di eliminazione tab (Cestino discreto sul tab)
  const handleDeleteTabRequest = (e, tabId) => {
    e.stopPropagation(); // Impedisce la selezione del tab al click sul cestino
    if (tabId === 'TOT') return;

    setTargetTabToDelete(tabId);

    if (isAdmin) {
      executeDeleteTab(tabId);
    } else {
      setActionToConfirm('deleteTab');
      setShowAdminModal(true);
    }
  };

  // Esecuzione effettiva dell'eliminazione tab
  const executeDeleteTab = (tabId) => {
    const idToDelete = tabId || targetTabToDelete || activeTab;
    const remainingTabs = tabs.filter(t => t.id !== idToDelete);
    setTabs(remainingTabs);
    if (activeTab === idToDelete) {
      setActiveTab('TOT');
    }
    setTargetTabToDelete(null);
  };

  // Conferma password amministratore
  const confirmAdminAction = () => {
    if (password === 'admin123' || password === '1234') {
      setIsAdmin(true);
      if (actionToConfirm === 'deleteTab') {
        executeDeleteTab();
      }
      setShowAdminModal(false);
      setPassword('');
      setActionToConfirm(null);
    } else {
      alert('Password errata!');
    }
  };

  // Attivazione animazione Emoji
  const triggerEmoji = (emoji) => {
    setShowEmojiModal(false);
    setFlyingEmoji(emoji);
    setTimeout(() => {
      setFlyingEmoji(null);
    }, 2000);
  };

  // Condivisione WhatsApp mantenendo formattazione ed emoji originali
  const handleShare = () => {
    let text = `${matchInfo.teamA} ${scoreA} - ${scoreB} ${matchInfo.teamB}\n\n`;
    text += `🔥 Marcatori Totali:\n`;
    players.forEach(p => {
      const totGoals = totals[p.id] || 0;
      if (totGoals > 0) {
        text += `- ${p.name}: ${totGoals} goal ⚽\n`;
      }
    });

    tabs.filter(t => !t.isTotal).forEach(t => {
      const tabGoals = goals[t.id] || {};
      const tScoreA = players.filter(p => p.team === 'A').reduce((s, p) => s + (tabGoals[p.id] || 0), 0);
      const tScoreB = players.filter(p => p.team === 'B').reduce((s, p) => s + (tabGoals[p.id] || 0), 0);
      text += `\n⏱️ Tab ${t.name}: ${matchInfo.teamA} ${tScoreA} - ${tScoreB} ${matchInfo.teamB}\n`;
      players.forEach(p => {
        if (tabGoals[p.id] > 0) {
          text += `  - ${p.name}: ${tabGoals[p.id]} goal 🎯\n`;
        }
      });
    });

    text += `\nSegui la partita live! 🚀✨`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 relative overflow-hidden">
      
      {/* Animazione Emoji Volante */}
      {flyingEmoji && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-bounce">
          <span className="text-8xl drop-shadow-2xl">{flyingEmoji}</span>
        </div>
      )}

      <div>
        {/* Header di Navigazione & Controlli Admin */}
        <div className="flex items-center justify-between mb-4">
          <button className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">kickerLive</span>
            <h1 className="text-sm font-semibold text-slate-300">Seed: {matchInfo.seed}</h1>
          </div>
          <button
            onClick={() => {
              if (!isAdmin) {
                setActionToConfirm('toggleAdmin');
                setShowAdminModal(true);
              } else {
                setIsAdmin(false);
                setIsEditingTeams(false);
              }
            }}
            className={`p-2 rounded-xl transition border flex items-center gap-1 text-xs font-bold ${
              isAdmin 
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
            title={isAdmin ? "Modalità Admin Attiva (Clicca per uscire)" : "Accedi come Admin"}
          >
            <Shield size={16} />
            {isAdmin && <span className="text-[10px] hidden sm:inline">ADMIN</span>}
          </button>
        </div>

        {/* Tabellone Segnapunti Principale con Personalizzazione Colori e Nomi */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg relative mb-4">
          <button 
            onClick={handleShare}
            className="absolute top-3 right-3 bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition shadow-md z-10"
          >
            <Share2 size={16} /> Condividi
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsEditingTeams(!isEditingTeams)}
              className="absolute top-3 left-3 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition border border-slate-700"
              title="Modifica nomi e colori squadre"
            >
              <Edit2 size={14} />
            </button>
          )}

          <div className="text-center pt-2">
            <div className="flex justify-between items-center my-3 px-4">
              <span className="font-bold text-lg transition-colors" style={{ color: matchInfo.colorA }}>
                {matchInfo.teamA}
              </span>
              <span className="text-3xl font-black bg-slate-800 px-4 py-1 rounded-xl border border-slate-700">
                {scoreA} - {scoreB}
              </span>
              <span className="font-bold text-lg transition-colors" style={{ color: matchInfo.colorB }}>
                {matchInfo.teamB}
              </span>
            </div>
          </div>

          {/* Pannello Editing Squadre & Colori (Riservato Admin) */}
          {isAdmin && isEditingTeams && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Squadra A</label>
                <input
                  type="text"
                  value={matchInfo.teamA}
                  onChange={e => setMatchInfo({ ...matchInfo, teamA: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white mb-2"
                />
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Colore:</span>
                  <input
                    type="color"
                    value={matchInfo.colorA}
                    onChange={e => setMatchInfo({ ...matchInfo, colorA: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Squadra B</label>
                <input
                  type="text"
                  value={matchInfo.teamB}
                  onChange={e => setMatchInfo({ ...matchInfo, teamB: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white mb-2"
                />
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Colore:</span>
                  <input
                    type="color"
                    value={matchInfo.colorB}
                    onChange={e => setMatchInfo({ ...matchInfo, colorB: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra Tab Dinamici con Cestino Discreto all'interno del div/pulsante */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative px-4 py-2 rounded-xl font-bold text-sm transition whitespace-nowrap cursor-pointer flex items-center gap-2 border select-none ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <span>{tab.name}</span>

              {/* Pulsante di eliminazione discreto (visibile al passaggio del mouse/touch e per Admin) */}
              {!tab.isTotal && (
                <button
                  onClick={(e) => handleDeleteTabRequest(e, tab.id)}
                  className={`transition-all duration-200 p-0.5 rounded-md hover:bg-black/20 ${
                    isAdmin 
                      ? 'opacity-70 hover:opacity-100' 
                      : 'opacity-0 group-hover:opacity-100'
                  } ${activeTab === tab.id ? 'text-slate-950' : 'text-red-400'}`}
                  title={`Elimina Tab ${tab.name}`}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddTab}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 p-2 rounded-xl border border-slate-700 flex items-center justify-center transition"
            title="Aggiungi tempo"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Lista Marcatori */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-md">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Marcatori ({activeTab === 'TOT' ? 'Totale' : `Tab ${activeTab}`})</span>
            {activeTab === 'TOT' && <span className="text-emerald-400 text-[10px]">Sola consultazione</span>}
          </h2>

          <div className="space-y-3">
            {players.map(player => {
              const goalCount = currentGoals[player.id] || 0;
              const teamColor = player.team === 'A' ? matchInfo.colorA : matchInfo.colorB;
              const teamName = player.team === 'A' ? matchInfo.teamA : matchInfo.teamB;

              return (
                <div key={player.id} className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="font-semibold text-sm block">{player.name}</span>
                    <span className="text-[10px] uppercase font-bold" style={{ color: teamColor }}>
                      {teamName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold w-6 text-center">{goalCount}</span>
                    {activeTab !== 'TOT' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleGoalChange(player.id, -1)}
                          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-red-400 flex items-center justify-center transition"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleGoalChange(player.id, 1)}
                          className="w-8 h-8 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-white flex items-center justify-center transition shadow-md shadow-emerald-600/30"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cronologia Partita */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cronologia Partita</h3>
            <button
              onClick={() => setShowEmojiModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-yellow-400 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-bold transition shadow"
            >
              <Smile size={16} /> Emoji ⚽🔥
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {history.map((item, idx) => (
              <div key={idx} className="text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50 flex justify-between items-center">
                <span className="text-slate-300">{item.text}</span>
                <span className="text-slate-500 font-mono">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-600 py-2">
        Kicker Live App • Gestione Dinamica Tab & Replay
      </div>

      {/* Modale Reazioni Emoji */}
      {showEmojiModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-xs w-full shadow-2xl text-center">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-slate-300">Invia Reazione Emoji</h3>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {['⚽', '🔥', '🚀', '👏', '😂', '👑', '💪', '🎉'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => triggerEmoji(emoji)}
                  className="text-3xl p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition transform hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowEmojiModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold transition"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Modale Password Amministratore */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-xs w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-3 text-red-400">
              <Shield size={20} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Password Amministratore</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Inserisci la password per confermare l'operazione riservata agli amministratori.
            </p>
            <input
              type="password"
              placeholder="Password (es. admin123 o 1234)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmAdminAction()}
              className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-sm mb-4 text-white focus:outline-none focus:border-emerald-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdminModal(false); setPassword(''); setActionToConfirm(null); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition"
              >
                Annulla
              </button>
              <button
                onClick={confirmAdminAction}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}