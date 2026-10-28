import React, { useState, useEffect, memo } from 'react';
import { ArrowLeft, Share2, Edit2, Palette, ChevronUp, ChevronDown, Plus, UserMinus, Clock, Trash2, Check, RotateCcw, Hash } from 'lucide-react';
import { EMOJI_LIST, OPERA_GOAL_TEMPLATES } from '../utils/constants';
import { getTeamScore, getSortedPlayers } from '../utils/helpers';
import { updateEventData, addEmojiReaction, subscribeToSingleEvent } from '../services/eventService';
import ReactionButton from '../components/ReactionButton';
import AddPlayerModal from '../components/modals/AddPlayerModal';
import EditTeamModal from '../components/modals/EditTeamModal';
import DeletePlayerModal from '../components/modals/DeletePlayerModal';

const EventView = memo(function EventView({ event: initialEvent, user, goBack }) {
  const [event, setEvent] = useState(initialEvent);

  useEffect(() => {
    const unsubscribe = subscribeToSingleEvent(initialEvent.id, (updatedEvent) => {
      setEvent(updatedEvent);
    }, (err) => console.error("Error syncing single event:", err));

    return () => unsubscribe();
  }, [initialEvent.id]);

  const isAdmin = user && event.adminId === user.uid;
  const isLive = event.status === 'live';
  
  const [showTeam0Players, setShowTeam0Players] = useState(true);
  const [showTeam1Players, setShowTeam1Players] = useState(true);

  const [teamModal, setTeamModal] = useState({ isOpen: false, teamIndex: null, name: '', color: '' });
  const [playerModal, setPlayerModal] = useState({ isOpen: false, teamIndex: null });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, teamIndex: null, playerId: null, playerName: '' });

  const [editingScore, setEditingScore] = useState({ teamIndex: null, tempScore: '' });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(event.title);

  useEffect(() => {
    setTempTitle(event.title);
  }, [event.title]);

  const handleTitleSave = () => {
    if (tempTitle.trim() && tempTitle.trim() !== event.title) {
      updateEventData(event.id, { title: tempTitle.trim() });
    } else {
      setTempTitle(event.title);
    }
    setIsEditingTitle(false);
  };

  const setMatchStatus = (status) => {
    if (!isAdmin) return;
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    
    let updates = { status };

    if (status === 'ended') {
      const scoreA = getTeamScore(event.teams[0]);
      const scoreB = getTeamScore(event.teams[1]);
      updates.statusText = `Partita terminata alle ${timeFormatted}`;
      updates.endTime = timeFormatted;
      updates.timeline = [{
        id: crypto.randomUUID(),
        type: 'end',
        scoreString: `${scoreA}-${scoreB}`,
        time: now.toLocaleTimeString('it-IT', { hour12: false }),
        timestamp: now.getTime()
      }, ...(event.timeline || [])];
    } else if (status === 'live') {
      updates.statusText = `Partita iniziata alle ${timeFormatted}`;
      updates.timeline = [{
        id: crypto.randomUUID(),
        type: 'start',
        time: now.toLocaleTimeString('it-IT', { hour12: false }),
        timestamp: now.getTime()
      }, ...(event.timeline || [])];
    }
    
    updateEventData(event.id, updates);
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
    
    updateEventData(event.id, { teams: newTeams });
    setTeamModal({ isOpen: false, teamIndex: null, name: '', color: '' });
  };

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
    updateEventData(event.id, { teams: newTeams });
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
    updateEventData(event.id, { teams: newTeams });
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
    updateEventData(event.id, { teams: newTeams });
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
          const isOperaTeam = newTeams[teamIndex].name.toLowerCase().includes('opera');
          const currentTeamScore = getTeamScore(newTeams[teamIndex]);
          let customTemplate = null;

          if (isOperaTeam && currentTeamScore >= 4) {
            const randomIndex = Math.floor(Math.random() * OPERA_GOAL_TEMPLATES.length);
            customTemplate = OPERA_GOAL_TEMPLATES[randomIndex];
          }

          newTimeline = [{
            id: crypto.randomUUID(),
            type: 'goal',
            playerName: player.name,
            teamName: newTeams[teamIndex].name,
            time: timeString,
            timestamp: now.getTime(),
            customTemplate: customTemplate,
            customMessage: customTemplate ? customTemplate.replace(/<giocatore>/g, player.name) : null
          }, ...newTimeline];

          addEmojiReaction(event.id, '⚽');
        } else if (delta < 0) {
          newTimeline = [{
            id: crypto.randomUUID(),
            type: 'undo',
            playerName: player.name,
            time: timeString,
            timestamp: now.getTime()
          }, ...newTimeline];
        }

        updateEventData(event.id, { teams: newTeams, timeline: newTimeline });
      }
    }
  };

  const deleteLog = (logId) => {
    if (!isAdmin) return;
    const newTimeline = (event.timeline || []).filter(log => log.id !== logId);
    updateEventData(event.id, { timeline: newTimeline });
  };

  const shareOnWhatsApp = () => {
    const scoreA = getTeamScore(event.teams[0]);
    const scoreB = getTeamScore(event.teams[1]);
    let text = `🏆 *${event.title}* (Stanza #${event.seed || 'default'})\n\n`;
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

      <div className="bg-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl border border-slate-700 relative flex-1 flex flex-col">
        
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-emerald-500 to-blue-500 opacity-80 rounded-t-3xl"></div>

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
            <span className="text-xs font-mono font-semibold text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <Hash className="w-3 h-3" /> {event.seed || 'default'}
            </span>
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

          {/* LISTA FORMAZIONI */}
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
                                className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-bold active:scale-95 transition-transform"
                              >-</button>
                              <span className="w-6 text-center text-sm font-bold" style={{ color: color0 }}>{player.goals}</span>
                              <button 
                                onClick={() => updatePlayerGoal(0, player.id, 1)}
                                className="w-7 h-7 flex items-center justify-center rounded text-white text-sm font-bold active:scale-95 transition-transform"
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
                            {player.name} {player.jersey && <span className="text-slate-500 text-xs ml-1 font-mono font-normal">#{player.jersey}</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {isAdmin && isLive ? (
                            <div className="flex items-center gap-1 bg-slate-950/60 rounded-lg p-0.5 border border-slate-800">
                              <button 
                                onClick={() => updatePlayerGoal(1, player.id, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-bold active:scale-95 transition-transform"
                              >-</button>
                              <span className="w-6 text-center text-sm font-bold" style={{ color: color1 }}>{player.goals}</span>
                              <button 
                                onClick={() => updatePlayerGoal(1, player.id, 1)}
                                className="w-7 h-7 flex items-center justify-center rounded text-white text-sm font-bold active:scale-95 transition-transform"
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
            {event.timeline.map((log) => {
              const renderGoalLog = () => {
                const template = log.customTemplate;
                if (template) {
                  const parts = template.split('<giocatore>');
                  return (
                    <span>
                      {parts.map((part, i) => (
                        <React.Fragment key={i}>
                          {part}
                          {i < parts.length - 1 && (
                            <span className="font-bold text-white">{log.playerName}</span>
                          )}
                        </React.Fragment>
                      ))} ⚽
                    </span>
                  );
                }

                if (log.customMessage && log.playerName) {
                  const parts = log.customMessage.split(log.playerName);
                  return (
                    <span>
                      {parts.map((part, i) => (
                        <React.Fragment key={i}>
                          {part}
                          {i < parts.length - 1 && (
                            <span className="font-bold text-white">{log.playerName}</span>
                          )}
                        </React.Fragment>
                      ))} ⚽
                    </span>
                  );
                }

                return (
                  <span>
                    <span className="font-bold text-white">{log.playerName}</span> ha segnato per <span style={{ color: log.teamName === event.teams[0].name ? color0 : color1 }}>{log.teamName}</span> ⚽
                  </span>
                );
              };

              return (
                <div key={log.id} className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2 group">
                  <span className="text-slate-300 flex-1 pr-2">
                    {log.type === 'start' && <span>🎬 Mettetevi comodi, allacciate le cinture...comincia la partita!</span>}
                    {log.type === 'end' && <span>🏁 Finisce qui la partita! Col risultato di <span className="font-bold text-white">{log.scoreString}</span></span>}
                    {(!log.type || log.type === 'goal') && renderGoalLog()}
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
              );
            })}
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
        <div className="grid grid-cols-4 gap-3 md:gap-4 justify-items-center max-w-sm mx-auto">
          {EMOJI_LIST.map((emoji, idx) => (
             <ReactionButton 
                key={emoji} 
                emoji={emoji} 
                index={idx}
                count={event.reactions?.[emoji] || 0} 
                onClick={() => addEmojiReaction(event.id, emoji)} 
             />
          ))}
        </div>
      </div>

      <AddPlayerModal 
        isOpen={playerModal.isOpen}
        onClose={() => setPlayerModal({ isOpen: false, teamIndex: null })}
        onConfirm={confirmAddPlayer}
        newPlayerName={newPlayerName}
        setNewPlayerName={setNewPlayerName}
        newPlayerJersey={newPlayerJersey}
        setNewPlayerJersey={setNewPlayerJersey}
      />

      <EditTeamModal 
        isOpen={teamModal.isOpen}
        onClose={() => setTeamModal({ isOpen: false, teamIndex: null, name: '', color: '' })}
        teamModal={teamModal}
        setTeamModal={setTeamModal}
        onSave={handleSaveTeamDetails}
      />

      <DeletePlayerModal 
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, teamIndex: null, playerId: null, playerName: '' })}
        playerName={deleteConfirmModal.playerName}
        onConfirm={executeRemovePlayer}
      />

    </div>
  );
});

export default EventView;
