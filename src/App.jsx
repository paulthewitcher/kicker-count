import React, { useState } from 'react';
import { Trophy, Share2, Plus, Trash2, Edit2, Smile, ArrowLeft, Shield, Check, X } from 'lucide-react';

export default function App() {
  const [matchInfo, setMatchInfo] = useState({
    teamA: "SQUADRA A",
    teamB: "SQUADRA B",
    seed: "seed-1234"
  });

  const [tabs, setTabs] = useState([
    { id: 'TOT', name: 'TOT', isTotal: true },
    { id: '1', name: '1', isTotal: false },
    { id: '2', name: '2', isTotal: false }
  ]);
  const [activeTab, setActiveTab] = useState('1');

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

  const [history, setHistory] = useState([
    { time: '12:34', text: 'Gol di Giocatore 1 (Tab 1) ⚽' },
    { time: '12:40', text: 'Gol di Giocatore 3 (Tab 1) 🔥' },
    { time: '13:02', text: 'Gol di Giocatore 1 (Tab 2) 🚀' }
  ]);

  // Modals & UI states
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [flyingEmoji, setFlyingEmoji] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [password, setPassword] = useState('');
  const [actionToConfirm, setActionToConfirm] = useState(null);

  // Calculate totals for TOT tab
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

  // Get goals for current view
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

  const handleGoalChange = (playerId, delta) => {
    if (activeTab === 'TOT') return; // TOT is read-only sum
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

  const handleAddTab = () => {
    const numericTabs = tabs.filter(t => !t.isTotal);
    const nextNum = numericTabs.length + 1;
    const newId = String(nextNum);
    setTabs(prev => [...prev.filter(t => t.id !== '+'), { id: newId, name: String(nextNum), isTotal: false }]);
    setActiveTab(newId);
    setGoals(prev => ({ ...prev, [newId]: {} }));
  };

  const handleDeleteTabRequest = () => {
    if (activeTab === 'TOT') return;
    setActionToConfirm('deleteTab');
    setShowAdminModal(true);
  };

  const confirmAdminAction = () => {
    if (password === 'admin123' || password === '1234') {
      if (actionToConfirm === 'deleteTab') {
        const remainingTabs = tabs.filter(t => t.id !== activeTab);
        setTabs(remainingTabs);
        setActiveTab('TOT');
      }
      setShowAdminModal(false);
      setPassword('');
      setActionToConfirm(null);
    } else {
      alert('Password errata!');
    }
  };

  const triggerEmoji = (emoji) => {
    setShowEmojiModal(false);
    setFlyingEmoji(emoji);
    setTimeout(() => {
      setFlyingEmoji(null);
    }, 2000);
  };

  // WhatsApp share without room name, keeping all emojis
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
      
      {flyingEmoji && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-bounce">
          <span className="text-8xl drop-shadow-2xl">{flyingEmoji}</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <button className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">kickerLive</span>
            <h1 className="text-sm font-semibold text-slate-300">Seed: {matchInfo.seed}</h1>
          </div>
          <div className="w-10"></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg relative mb-4">
          <button 
            onClick={handleShare}
            className="absolute top-3 right-3 bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition shadow-md"
          >
            <Share2 size={16} /> Condividi
          </button>

          <div className="text-center pt-2">
            <div className="flex justify-between items-center my-3 px-4">
              <span className="font-bold text-lg text-emerald-300">{matchInfo.teamA}</span>
              <span className="text-3xl font-black bg-slate-800 px-4 py-1 rounded-xl border border-slate-700">
                {scoreA} - {scoreB}
              </span>
              <span className="font-bold text-lg text-indigo-300">{matchInfo.teamB}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tab.name}
            </button>
          ))}
          <button
            onClick={handleAddTab}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 p-2 rounded-xl border border-slate-700 flex items-center justify-center"
            title="Aggiungi tempo"
          >
            <Plus size={18} />
          </button>
        </div>

        {activeTab !== 'TOT' && (
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={handleDeleteTabRequest}
              className="text-xs bg-red-950/50 hover:bg-red-900 text-red-400 px-3 py-1.5 rounded-lg border border-red-900/50 flex items-center gap-1 transition"
            >
              <Trash2 size={14} /> Elimina Tab {activeTab}
            </button>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-md">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Marcatori ({activeTab === 'TOT' ? 'Totale' : `Tab ${activeTab}`})</span>
            {activeTab === 'TOT' && <span className="text-emerald-400 text-[10px]">Sola consultazione</span>}
          </h2>

          <div className="space-y-3">
            {players.map(player => {
              const goalCount = currentGoals[player.id] || 0;
              return (
                <div key={player.id} className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="font-semibold text-sm block">{player.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase">Squadra {player.team}</span>
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

      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-xs w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-3 text-red-400">
              <Shield size={20} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Password Amministratore</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Inserisci la password per confermare l'eliminazione del tab.</p>
            <input
              type="password"
              placeholder="Password (es. admin123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-sm mb-4 text-white focus:outline-none focus:border-emerald-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdminModal(false); setPassword(''); }}
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
