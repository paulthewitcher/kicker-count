import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  Share2, Edit2, Palette, ChevronUp, ChevronDown, Plus,
  Clock, Trash2, Check, RotateCcw, Smile, X, Lock, Pencil,
  Save
} from 'lucide-react';
import { EMOJI_LIST, OPERA_GOAL_TEMPLATES, getTeamColorEmoji } from '../utils/constants';
import {
  getSortedPlayers,
  getEventPeriods,
  getNumericPeriods,
  getPlayerGoalsInPeriod,
  getPlayerTotalGoals,
  getTeamScoreForPeriod,
  getTeamTotalScore
} from '../utils/helpers';
import {
  updateEventData,
  updateEventDataWithGoalReaction,
  addEmojiReaction,
  subscribeToSingleEvent,
  deletePeriodWithPassword
} from '../services/eventService';
import ReactionButton from '../components/ReactionButton';
import ReactionBurst from '../components/ReactionBurst';
import AddPlayerModal from '../components/modals/AddPlayerModal';
import EditTeamModal from '../components/modals/EditTeamModal';
import DeletePlayerModal from '../components/modals/DeletePlayerModal';
import EditPlayerModal from '../components/modals/EditPlayerModal';

const TOTAL_PERIOD_ID = 'total';

const normalizeMatchPeriods = (sourceEvent) => {
  const periods = getEventPeriods(sourceEvent);
  const numericPeriods = getNumericPeriods(periods);
  const firstPeriodId = periods[0]?.id || 'period-1';

  const teams = (sourceEvent.teams || []).map(team => {
    const scoreOffsetsByPeriod = team.scoreOffsetsByPeriod
      ? { ...team.scoreOffsetsByPeriod }
      : (periods.length ? { [firstPeriodId]: Number(team.scoreOffset) || 0 } : {});

    const players = (team.players || []).map(player => {
      const goalsByPeriod = player.goalsByPeriod
        ? { ...player.goalsByPeriod }
        : (periods.length ? { [firstPeriodId]: Number(player.goals) || 0 } : {});

      const goals = numericPeriods.reduce(
        (total, period) => total + (Number(goalsByPeriod[period.id]) || 0),
        0
      );

      return { ...player, goalsByPeriod, goals, goalHistory: Array.isArray(player.goalHistory) ? [...player.goalHistory] : [] };
    });

    const scoreOffset = numericPeriods.reduce(
      (total, period) => total + (Number(scoreOffsetsByPeriod[period.id]) || 0),
      0
    );

    return { ...team, players, scoreOffsetsByPeriod, scoreOffset };
  });

  const highestPeriodNumber = periods.reduce(
    (highest, period) => Math.max(highest, Number(period.number) || Number.parseInt(period.name, 10) || 0),
    0
  );

  return {
    ...sourceEvent,
    periods,
    teams,
    nextPeriodNumber: Math.max(Number(sourceEvent.nextPeriodNumber) || 1, highestPeriodNumber + 1)
  };
};

const formatGoalDateTime = (date) => {
  const pad = value => String(value).padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getPeriodShareName = (period) => {
  const name = String(period.name || '').trim();
  const periodNumber = Number(period.number) || Number.parseInt(name, 10);
  const isDefaultNumberName = /^\d+$/.test(name) && Number(name) === periodNumber;

  if (!isDefaultNumberName || !periodNumber) return name || 'Tempo';

  const ordinalNames = {
    1: 'Primo tempo',
    2: 'Secondo tempo',
    3: 'Terzo tempo',
    4: 'Quarto tempo'
  };

  return ordinalNames[periodNumber] || `${periodNumber}° tempo`;
};

const EventView = memo(function EventView({ event: initialEvent, user }) {
  const [event, setEvent] = useState(initialEvent);

  useEffect(() => {
    const unsubscribe = subscribeToSingleEvent(initialEvent.id, (updatedEvent) => {
      setEvent(updatedEvent);
    }, (err) => console.error('Error syncing single event:', err));

    return () => unsubscribe();
  }, [initialEvent.id]);

  const isAdmin = user && event.adminId === user.uid;
  const isLive = event.status === 'live';

  const [selectedPeriodId, setSelectedPeriodId] = useState(TOTAL_PERIOD_ID);
  const [showTeam0Players, setShowTeam0Players] = useState(true);
  const [showTeam1Players, setShowTeam1Players] = useState(true);

  const [teamModal, setTeamModal] = useState({ isOpen: false, teamIndex: null, name: '', color: '' });
  const [playerModal, setPlayerModal] = useState({ isOpen: false, teamIndex: null });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, teamIndex: null, playerId: null, playerName: '' });
  const [editPlayerModal, setEditPlayerModal] = useState({ isOpen: false, teamIndex: null, playerId: null });
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerJersey, setEditPlayerJersey] = useState('');

  const [editingScore, setEditingScore] = useState({ teamIndex: null, tempScore: '' });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(event.title);

  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [isEditingPeriodName, setIsEditingPeriodName] = useState(false);
  const [draftPeriodName, setDraftPeriodName] = useState('');
  const [isDeletePeriodModalOpen, setIsDeletePeriodModalOpen] = useState(false);
  const [periodDeletePassword, setPeriodDeletePassword] = useState('');
  const [periodDeleteError, setPeriodDeleteError] = useState('');
  const [isDeletingPeriod, setIsDeletingPeriod] = useState(false);

  const periods = useMemo(() => getEventPeriods(event), [event]);
  const selectedPeriod = periods.find(period => period.id === selectedPeriodId);

  useEffect(() => {
    setTempTitle(event.title);
  }, [event.title]);

  useEffect(() => {
    if (selectedPeriodId !== TOTAL_PERIOD_ID && !periods.some(period => period.id === selectedPeriodId)) {
      setSelectedPeriodId(TOTAL_PERIOD_ID);
    }
  }, [periods, selectedPeriodId]);

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
    const scoreA = getTeamTotalScore(event.teams[0], periods);
    const scoreB = getTeamTotalScore(event.teams[1], periods);

    const updates = { status };

    if (status === 'ended') {
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
      newTeams[teamModal.teamIndex] = {
        ...newTeams[teamModal.teamIndex],
        name: cleanName,
        color: teamModal.color
      };
    } else {
      newTeams[teamModal.teamIndex] = {
        ...newTeams[teamModal.teamIndex],
        color: teamModal.color
      };
    }

    updateEventData(event.id, { teams: newTeams });
    setTeamModal({ isOpen: false, teamIndex: null, name: '', color: '' });
  };

  const getDisplayedPlayerGoals = (player) => (
    selectedPeriodId === TOTAL_PERIOD_ID
      ? getPlayerTotalGoals(player, periods)
      : getPlayerGoalsInPeriod(player, selectedPeriodId, periods)
  );

  const getDisplayedTeamScore = (team) => (
    selectedPeriodId === TOTAL_PERIOD_ID
      ? getTeamTotalScore(team, periods)
      : getTeamScoreForPeriod(team, selectedPeriodId, periods)
  );

  const handleScoreSave = (teamIndex) => {
    if (selectedPeriodId === TOTAL_PERIOD_ID || !isAdmin || !isLive) return;

    const normalized = normalizeMatchPeriods(event);
    const team = normalized.teams[teamIndex];
    const baseScore = (team.players || []).reduce(
      (total, player) => total + getPlayerGoalsInPeriod(player, selectedPeriodId, normalized.periods),
      0
    );

    const parsed = Number.parseInt(editingScore.tempScore, 10);
    const newTotal = Number.isNaN(parsed) ? getDisplayedTeamScore(team) : Math.max(0, parsed);
    const offsets = {
      ...(team.scoreOffsetsByPeriod || {}),
      [selectedPeriodId]: newTotal - baseScore
    };

    team.scoreOffsetsByPeriod = offsets;
    team.scoreOffset = getNumericPeriods(normalized.periods).reduce(
      (total, period) => total + (Number(offsets[period.id]) || 0),
      0
    );

    updateEventData(event.id, {
      periods: normalized.periods,
      teams: normalized.teams
    });
    setEditingScore({ teamIndex: null, tempScore: '' });
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

    const normalized = normalizeMatchPeriods(event);
    const newTeams = normalized.teams;
    const newPlayer = {
      id: crypto.randomUUID(),
      name: newPlayerName.trim(),
      jersey: newPlayerJersey.trim(),
      goals: 0,
      goalsByPeriod: Object.fromEntries(normalized.periods.map(period => [period.id, 0])),
      goalHistory: []
    };

    newTeams[playerModal.teamIndex].players = [
      ...(newTeams[playerModal.teamIndex].players || []),
      newPlayer
    ];

    updateEventData(event.id, {
      periods: normalized.periods,
      teams: newTeams
    });
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

  const openEditPlayerModal = (teamIndex, player) => {
    if (!isAdmin || !isLive) return;
    setEditPlayerModal({ isOpen: true, teamIndex, playerId: player.id });
    setEditPlayerName(player.name || '');
    setEditPlayerJersey(player.jersey || '');
  };

  const closeEditPlayerModal = () => {
    setEditPlayerModal({ isOpen: false, teamIndex: null, playerId: null });
    setEditPlayerName('');
    setEditPlayerJersey('');
  };

  const handleEditPlayerSave = (e) => {
    e.preventDefault();
    if (!isAdmin || !isLive || editPlayerModal.teamIndex === null || !editPlayerModal.playerId) return;

    const cleanName = editPlayerName.trim();
    if (!cleanName) return;

    const normalized = normalizeMatchPeriods(event);
    const player = normalized.teams[editPlayerModal.teamIndex]?.players
      .find(item => item.id === editPlayerModal.playerId);
    if (!player) {
      closeEditPlayerModal();
      return;
    }

    player.name = cleanName;
    player.jersey = editPlayerJersey.trim();

    updateEventData(event.id, {
      periods: normalized.periods,
      teams: normalized.teams
    });
    closeEditPlayerModal();
  };

  const handleDeletePlayerFromEdit = () => {
    if (!isAdmin || !isLive || editPlayerModal.teamIndex === null || !editPlayerModal.playerId) return;
    const { teamIndex, playerId } = editPlayerModal;
    const player = event.teams[teamIndex]?.players?.find(item => item.id === playerId);
    closeEditPlayerModal();
    if (player) promptRemovePlayer(teamIndex, player);
  };

  const executeRemovePlayer = () => {
    if (!isAdmin || !isLive) return;
    const { teamIndex, playerId } = deleteConfirmModal;
    if (teamIndex === null || !playerId) return;

    const normalized = normalizeMatchPeriods(event);
    normalized.teams[teamIndex].players = normalized.teams[teamIndex].players
      .filter(player => player.id !== playerId);

    updateEventData(event.id, {
      periods: normalized.periods,
      teams: normalized.teams
    });
    setDeleteConfirmModal({ isOpen: false, teamIndex: null, playerId: null, playerName: '' });
  };

  const updatePlayerGoal = (teamIndex, playerId, delta) => {
    if (!isAdmin || !isLive || selectedPeriodId === TOTAL_PERIOD_ID) return;

    const normalized = normalizeMatchPeriods(event);
    const newTeams = normalized.teams;
    const player = newTeams[teamIndex].players.find(item => item.id === playerId);

    if (!player) return;

    const currentGoals = getPlayerGoalsInPeriod(player, selectedPeriodId, normalized.periods);
    const nextGoals = currentGoals + delta;
    if (nextGoals < 0) return;

    player.goalsByPeriod = {
      ...(player.goalsByPeriod || {}),
      [selectedPeriodId]: nextGoals
    };

    const now = new Date();
    const nowTimestamp = now.getTime();
    const timeString = now.toLocaleTimeString('it-IT', { hour12: false });
    const goalDateTime = formatGoalDateTime(now);
    const selectedPeriodName = normalized.periods.find(period => period.id === selectedPeriodId)?.name || '';
    let goalRecordId = null;
    const goalHistory = Array.isArray(player.goalHistory) ? [...player.goalHistory] : [];

    if (delta > 0) {
      goalRecordId = crypto.randomUUID();
      goalHistory.push({
        id: goalRecordId,
        periodId: selectedPeriodId,
        timestamp: nowTimestamp,
        dateTime: goalDateTime,
        status: 'active'
      });
    } else if (delta < 0) {
      // Conserva lo storico: un gol annullato viene marcato, non cancellato.
      const lastActiveGoalIndex = goalHistory
        .map((goal, index) => ({ goal, index }))
        .filter(({ goal }) => goal.periodId === selectedPeriodId && goal.status !== 'cancelled')
        .sort((a, b) => (Number(b.goal.timestamp) || 0) - (Number(a.goal.timestamp) || 0))[0]?.index;

      if (lastActiveGoalIndex !== undefined) {
        goalRecordId = goalHistory[lastActiveGoalIndex].id;
        goalHistory[lastActiveGoalIndex] = {
          ...goalHistory[lastActiveGoalIndex],
          status: 'cancelled',
          cancelledAt: nowTimestamp,
          cancelledDateTime: goalDateTime
        };
      }
    }

    player.goalHistory = goalHistory;
    player.goals = getPlayerTotalGoals(player, normalized.periods);

    let newTimeline = event.timeline || [];
    const eventUpdates = {
      periods: normalized.periods,
      teams: newTeams
    };

    if (delta > 0) {
      const isOperaTeam = newTeams[teamIndex].name.toLowerCase().includes('opera');
      const currentTeamScore = getTeamTotalScore(newTeams[teamIndex], normalized.periods);
      let customTemplate = null;
      let nextOperaGoalIndex = event.operaGoalIndex || 0;

      // I messaggi speciali continuano a seguire il totale della partita, non il singolo tempo.
      if (isOperaTeam && currentTeamScore >= 4) {
        customTemplate = OPERA_GOAL_TEMPLATES[nextOperaGoalIndex];
        nextOperaGoalIndex = (nextOperaGoalIndex + 1) % OPERA_GOAL_TEMPLATES.length;
        eventUpdates.operaGoalIndex = nextOperaGoalIndex;
      }

      newTimeline = [{
        id: crypto.randomUUID(),
        type: 'goal',
        playerName: player.name,
        teamName: newTeams[teamIndex].name,
        periodId: selectedPeriodId,
        periodName: selectedPeriodName,
        time: timeString,
        timestamp: nowTimestamp,
        dateTime: goalDateTime,
        goalRecordId,
        customTemplate,
        customMessage: customTemplate ? customTemplate.replace(/<giocatore>/g, player.name) : null
      }, ...newTimeline];

    } else if (delta < 0) {
      newTimeline = [{
        id: crypto.randomUUID(),
        type: 'undo',
        playerName: player.name,
        periodId: selectedPeriodId,
        periodName: selectedPeriodName,
        time: timeString,
        timestamp: nowTimestamp,
        dateTime: goalDateTime,
        undoesGoalId: goalRecordId
      }, ...newTimeline];
    }

    eventUpdates.timeline = newTimeline;

    // Il goal e la reazione ⚽ vengono salvati con un'unica scrittura: il listener
    // riceve un solo aggiornamento coerente e ReactionBurst può animare il pallone.
    const savePromise = delta > 0
      ? updateEventDataWithGoalReaction(event.id, eventUpdates)
      : updateEventData(event.id, eventUpdates);
    savePromise.catch(error => {
      console.error('Impossibile aggiornare la partita:', error);
    });
  };

  const deleteLog = (logId) => {
    if (!isAdmin) return;
    const newTimeline = (event.timeline || []).filter(log => log.id !== logId);
    updateEventData(event.id, { timeline: newTimeline });
  };

  const shareOnWhatsApp = () => {
    const currentPeriods = getEventPeriods(event);
    const messageEvent = normalizeMatchPeriods(event);
    const teamA = messageEvent.teams[0];
    const teamB = messageEvent.teams[1];

    let text = `🏆 *${event.title}*\n\n`;
    const teamAIcon = getTeamColorEmoji(teamA.color || '#ef4444');
    const teamBIcon = getTeamColorEmoji(teamB.color || '#174195');

    text += `${teamAIcon} *${teamA.name}* ${getTeamTotalScore(teamA, currentPeriods)} - ${getTeamTotalScore(teamB, currentPeriods)} *${teamB.name}* ${teamBIcon}\n\n`;
    text += `⚽ *Marcatori - Totale partita:*\n`;

    const appendScorers = (team, getGoals, fallbackIcon) => {
      const icon = getTeamColorEmoji(team.color, fallbackIcon);
      const scorers = getSortedPlayers(team.players, getGoals).filter(player => getGoals(player) > 0);

      text += `${icon} *${team.name}:*\n`;
      if (scorers.length === 0) {
        text += '  Nessun gol\n';
      } else {
        scorers.forEach(player => {
          const jersey = player.jersey ? ` [${player.jersey}]` : '';
          text += `  ➔ ${player.name}${jersey}: ${getGoals(player)} gol\n`;
        });
      }
    };

    appendScorers(teamA, player => getPlayerTotalGoals(player, currentPeriods), '🔴');
    appendScorers(teamB, player => getPlayerTotalGoals(player, currentPeriods), '🔵');

    currentPeriods.forEach(period => {
      const periodName = getPeriodShareName(period);
      const scoreA = getTeamScoreForPeriod(teamA, period.id, currentPeriods);
      const scoreB = getTeamScoreForPeriod(teamB, period.id, currentPeriods);

      text += `\n⏱ *${periodName}*\n`;
      text += `${teamAIcon} *${teamA.name}* ${scoreA} - ${scoreB} *${teamB.name}* ${teamBIcon}\n\n`;
      text += '⚽ *Marcatori:*\n';
      appendScorers(teamA, player => getPlayerGoalsInPeriod(player, period.id, currentPeriods), '🔴');
      appendScorers(teamB, player => getPlayerGoalsInPeriod(player, period.id, currentPeriods), '🔵');
    });

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddPeriod = async () => {
    if (!isAdmin) return;

    const normalized = normalizeMatchPeriods(event);
    const maxNumber = normalized.periods.reduce(
      (highest, period) => Math.max(highest, Number(period.number) || Number.parseInt(period.name, 10) || 0),
      0
    );
    const nextNumber = Math.max(Number(event.nextPeriodNumber) || 1, maxNumber + 1);
    const newPeriodId = crypto.randomUUID();
    const newPeriod = {
      id: newPeriodId,
      name: String(nextNumber),
      number: nextNumber,
      createdAt: Date.now()
    };

    const newTeams = normalized.teams.map(team => ({
      ...team,
      scoreOffsetsByPeriod: {
        ...(team.scoreOffsetsByPeriod || {}),
        [newPeriodId]: 0
      },
      players: (team.players || []).map(player => ({
        ...player,
        goalsByPeriod: {
          ...(player.goalsByPeriod || {}),
          [newPeriodId]: 0
        }
      }))
    }));

    const updates = {
      periods: [...normalized.periods, newPeriod],
      nextPeriodNumber: nextNumber + 1,
      teams: newTeams
    };

    try {
      await updateEventData(event.id, updates);
      setEvent(previous => ({ ...previous, ...updates }));
      setSelectedPeriodId(newPeriodId);
      setIsEditingPeriodName(false);
    } catch (error) {
      console.error('Impossibile aggiungere il tempo:', error);
    }
  };

  const startEditingPeriodName = () => {
    if (!isAdmin || !selectedPeriod) return;
    setDraftPeriodName(selectedPeriod.name);
    setIsEditingPeriodName(true);
  };

  const savePeriodName = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedPeriod || !draftPeriodName.trim()) return;

    const updatedPeriods = periods.map(period => (
      period.id === selectedPeriodId
        ? { ...period, name: draftPeriodName.trim() }
        : period
    ));
    const normalizedAfterRename = normalizeMatchPeriods({ ...event, periods: updatedPeriods });

    try {
      await updateEventData(event.id, {
        periods: updatedPeriods,
        teams: normalizedAfterRename.teams
      });
      setEvent(previous => ({
        ...previous,
        periods: updatedPeriods,
        teams: normalizedAfterRename.teams
      }));
      setIsEditingPeriodName(false);
    } catch (error) {
      console.error('Impossibile rinominare il tempo:', error);
    }
  };

  const openDeletePeriodModal = () => {
    if (!isAdmin || !selectedPeriod) return;
    setPeriodDeletePassword('');
    setPeriodDeleteError('');
    setIsDeletePeriodModalOpen(true);
  };

  const closeDeletePeriodModal = () => {
    if (isDeletingPeriod) return;
    setIsDeletePeriodModalOpen(false);
    setPeriodDeletePassword('');
    setPeriodDeleteError('');
  };

  const confirmDeletePeriod = async (e) => {
    e.preventDefault();
    if (!selectedPeriod || !periodDeletePassword.trim()) return;

    setIsDeletingPeriod(true);
    setPeriodDeleteError('');

    try {
      const result = await deletePeriodWithPassword(event.id, selectedPeriod.id, periodDeletePassword, event.seed);
      setEvent(previous => ({
        ...previous,
        periods: result.periods,
        teams: result.teams,
        timeline: result.timeline
      }));
      setSelectedPeriodId(TOTAL_PERIOD_ID);
      setIsEditingPeriodName(false);
      setIsDeletePeriodModalOpen(false);
      setPeriodDeletePassword('');
    } catch (error) {
      setPeriodDeleteError(error.message || 'Impossibile eliminare il tempo. Riprova.');
    } finally {
      setIsDeletingPeriod(false);
    }
  };

  const color0 = event.teams[0].color || '#ef4444';
  const color1 = event.teams[1].color || '#174195';

  const renderTeamPlayers = (teamIndex, expanded, setExpanded, color) => {
    const team = event.teams[teamIndex];
    const players = getSortedPlayers(team.players, getDisplayedPlayerGoals);

    return (
      <div className="bg-slate-900/40 rounded-xl border overflow-hidden shadow-md" style={{ borderColor: `${color}33` }}>
        <div
          onClick={() => setExpanded(!expanded)}
          className="px-4 py-2.5 font-bold text-xs tracking-wider flex justify-between items-center cursor-pointer transition-colors hover:bg-white/5"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: color }}></span>
            <span className="truncate">{team.name.toUpperCase()} ({team.players?.length || 0})</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && isLive && (
              <button
                onClick={(e) => { e.stopPropagation(); openAddPlayerModal(teamIndex); }}
                className="text-xs bg-black/30 hover:bg-black/50 px-2 py-1 rounded text-white flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Aggiungi
              </button>
            )}
            <span className="text-slate-400 text-xs flex items-center gap-1">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </div>
        </div>

        {expanded && (
          <div className="divide-y divide-slate-700/50 px-4 transition-all">
            {(!team.players || team.players.length === 0) ? (
              <div className="py-3 text-xs text-slate-500 italic text-center">Nessun giocatore</div>
            ) : (
              players.map(player => (
                <div key={player.id} className="flex justify-between items-center py-3 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isAdmin && isLive && (
                      <button
                        onClick={() => openEditPlayerModal(teamIndex, player)}
                        className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg bg-slate-950/40 hover:bg-slate-800 transition-colors shrink-0"
                        title="Modifica giocatore"
                        aria-label={`Modifica ${player.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <span className="font-medium text-slate-200 text-sm truncate">
                      {player.name} {player.jersey && <span className="text-slate-500 text-xs ml-1 font-mono font-normal">#{player.jersey}</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isAdmin && isLive && selectedPeriodId !== TOTAL_PERIOD_ID ? (
                      <div className="flex items-center gap-1 bg-slate-950/60 rounded-lg p-0.5 border border-slate-800">
                        <button
                          onClick={() => updatePlayerGoal(teamIndex, player.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-bold active:scale-95 transition-transform"
                          aria-label={`Rimuovi un gol a ${player.name}`}
                        >-</button>
                        <span className="w-6 text-center text-sm font-bold" style={{ color }}>{getDisplayedPlayerGoals(player)}</span>
                        <button
                          onClick={() => updatePlayerGoal(teamIndex, player.id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded text-white text-sm font-bold active:scale-95 transition-transform"
                          style={{ backgroundColor: `${color}50` }}
                          aria-label={`Aggiungi un gol a ${player.name}`}
                        >+</button>
                      </div>
                    ) : (
                      <div className="font-bold text-lg" style={{ color }}>{getDisplayedPlayerGoals(player)}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col min-h-[85vh]">
      <div className="bg-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl border border-slate-700 relative flex-1 flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-emerald-500 to-blue-500 opacity-80 rounded-t-3xl"></div>

        <button
          type="button"
          onClick={() => setShowEmojiModal(true)}
          className="absolute top-4 left-4 z-10 w-9 h-9 flex items-center justify-center bg-slate-900/60 text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-slate-200 transition-colors"
          title="Apri reazioni emoji"
          aria-label="Apri reazioni emoji"
        >
          <Smile className="w-4 h-4" />
        </button>

        <button
          onClick={shareOnWhatsApp}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-slate-900/60 text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-slate-200 transition-colors"
          title="Condividi su WhatsApp"
          aria-label="Condividi su WhatsApp"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <div className="text-center mb-5 mt-5 relative group/title flex flex-col items-center px-12">
          {isAdmin && isEditingTitle ? (
            <input
              autoFocus
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="text-xl sm:text-2xl font-bold bg-slate-900 border border-slate-600 rounded text-center text-white px-2 py-1 mb-1 focus:outline-none focus:border-emerald-500 w-full max-w-xs mx-auto"
            />
          ) : (
            <div className="flex items-center justify-center gap-2 mb-1 max-w-full">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{event.title}</h1>
              {isAdmin && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-slate-500 hover:text-emerald-400 md:opacity-0 md:group-hover/title:opacity-100 transition-opacity shrink-0"
                  title="Modifica nome evento"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center justify-center gap-2 flex-wrap">
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

        {/* Tabellone: nel tab TOT mostra il risultato complessivo, negli altri tab il risultato del singolo tempo. */}
        <div className="w-full space-y-2">
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700">
            <div className="flex justify-between items-center">
              <div className="flex flex-col items-center w-2/5 min-w-0">
                <button
                  onClick={() => openTeamModal(0)}
                  disabled={!isAdmin}
                  className={`font-semibold mb-1 text-xs md:text-sm truncate max-w-full flex items-center gap-1.5 group/col transition-all ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''}`}
                  title={isAdmin ? 'Clicca per modificare nome e colore' : ''}
                >
                  <span className="w-3 h-3 rounded-full inline-block shadow-sm shrink-0" style={{ backgroundColor: color0 }}></span>
                  <span style={{ color: color0 }} className="truncate">{event.teams[0].name}</span>
                  {isAdmin && <Palette className="w-3 h-3 opacity-0 group-hover/col:opacity-100 transition-opacity text-slate-400 shrink-0" />}
                </button>

                {isAdmin && isLive && selectedPeriodId !== TOTAL_PERIOD_ID && editingScore.teamIndex === 0 ? (
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    value={editingScore.tempScore}
                    onChange={(e) => setEditingScore({ ...editingScore, tempScore: e.target.value })}
                    onBlur={() => handleScoreSave(0)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScoreSave(0)}
                    className="w-20 bg-slate-900 border border-slate-600 rounded text-center text-4xl md:text-6xl font-black text-white py-1 focus:outline-none focus:border-emerald-500 mx-auto"
                  />
                ) : (
                  <div
                    onClick={() => {
                      if (isAdmin && isLive && selectedPeriodId !== TOTAL_PERIOD_ID) {
                        setEditingScore({ teamIndex: 0, tempScore: String(getDisplayedTeamScore(event.teams[0])) });
                      }
                    }}
                    className={`text-4xl md:text-6xl font-black text-white flex items-center relative group/score ${isAdmin && isLive && selectedPeriodId !== TOTAL_PERIOD_ID ? 'cursor-pointer' : ''}`}
                    title={isAdmin && isLive && selectedPeriodId !== TOTAL_PERIOD_ID ? 'Modifica punteggio del tempo' : ''}
                  >
                    {getDisplayedTeamScore(event.teams[0])}
                    {isAdmin && isLive && selectedPeriodId !== TOTAL_PERIOD_ID && (
                      <Edit2 className="w-5 h-5 absolute -right-8 text-slate-500 opacity-0 group-hover/score:opacity-100 transition-opacity" />
                    )}
                  </div>
                )}
              </div>

              <div className="text-xl font-bold text-slate-500 shrink-0">VS</div>

              <div className="flex flex-col items-center w-2/5 min-w-0">
                <button
                  onClick={() => openTeamModal(1)}
                  disabled={!isAdmin}
                  className={`font-semibold mb-1 text-xs md:text-sm truncate max-w-full flex items-center gap-1.5 group/col transition-all ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''}`}
                  title={isAdmin ? 'Clicca per modificare nome e colore' : ''}
                >
                  <span className="w-3 h-3 rounded-full inline-block shadow-sm shrink-0" style={{ backgroundColor: color1 }}></span>
                  <span style={{ color: color1 }} className="truncate">{event.teams[1].name}</span>
                  {isAdmin && <Palette className="w-3 h-3 opacity-0 group-hover/col:opacity-100 transition-opacity text-slate-400 shrink-0" />}
                </button>

                {isAdmin && isLive && selectedPeriodId !== TOTAL_PERIOD_ID && editingScore.teamIndex === 1 ? (
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    value={editingScore.tempScore}
                    onChange={(e) => setEditingScore({ ...editingScore, tempScore: e.target.value })}
                    onBlur={() => handleScoreSave(1)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScoreSave(1)}
                    className="w-20 bg-slate-900 border border-slate-600 rounded text-center text-4xl md:text-6xl font-black text-white py-1 focus:outline-none focus:border-emerald-500 mx-auto"
                  />
                ) : (
                  <div
                    onClick={() => {
                      if (isAdmin && isLive && selectedPeriodId !== TOTAL_PERIOD_ID) {
                        setEditingScore({ teamIndex: 1, tempScore: String(getDisplayedTeamScore(event.teams[1])) });
                      }
                    }}
                    className={`text-4xl md:text-6xl font-black text-white flex items-center relative group/score ${isAdmin && isLive && selectedPeriodId !== TOTAL_PERIOD_ID ? 'cursor-pointer' : ''}`}
                    title={isAdmin && isLive && selectedPeriodId !== TOTAL_PERIOD_ID ? 'Modifica punteggio del tempo' : ''}
                  >
                    {getDisplayedTeamScore(event.teams[1])}
                    {isAdmin && isLive && selectedPeriodId !== TOTAL_PERIOD_ID && (
                      <Edit2 className="w-5 h-5 absolute -right-8 text-slate-500 opacity-0 group-hover/score:opacity-100 transition-opacity" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tempi della partita: le azioni del tempo selezionato restano compatte in fondo alla riga. */}
          <div>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin" role="tablist" aria-label="Tempi della partita">
              <button
                type="button"
                role="tab"
                aria-selected={selectedPeriodId === TOTAL_PERIOD_ID}
                onClick={() => {
                  setSelectedPeriodId(TOTAL_PERIOD_ID);
                  setIsEditingPeriodName(false);
                  setEditingScore({ teamIndex: null, tempScore: '' });
                }}
                className={`shrink-0 min-w-[58px] px-3 py-2 rounded-md text-xs font-bold border transition-all ${
                  selectedPeriodId === TOTAL_PERIOD_ID
                    ? 'bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600'
                }`}
              >
                TOT
              </button>

              {periods.map(period => (
                <button
                  type="button"
                  role="tab"
                  key={period.id}
                  aria-selected={selectedPeriodId === period.id}
                  onClick={() => {
                    setSelectedPeriodId(period.id);
                    setIsEditingPeriodName(false);
                    setEditingScore({ teamIndex: null, tempScore: '' });
                  }}
                  className={`shrink-0 min-w-[42px] px-4 py-2 rounded-md text-xs font-bold border transition-all ${
                    selectedPeriodId === period.id
                      ? 'bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  {period.name}
                </button>
              ))}

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleAddPeriod}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-slate-700 border border-slate-600 text-white hover:bg-emerald-600 hover:border-emerald-500 transition-colors"
                  title="Aggiungi un tempo"
                  aria-label="Aggiungi un tempo"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}

              {isAdmin && selectedPeriod && (
                <div className="shrink-0 flex items-center gap-0.5 ml-0.5 pl-1 border-l border-slate-700">
                  {isEditingPeriodName ? (
                    <form onSubmit={savePeriodName} className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={draftPeriodName}
                        onChange={(e) => setDraftPeriodName(e.target.value)}
                        maxLength={32}
                        className="w-24 bg-slate-900 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        aria-label="Nome del tempo"
                      />
                      <button type="submit" className="w-7 h-7 flex items-center justify-center text-emerald-400 hover:text-emerald-300" title="Salva nome" aria-label="Salva nome">
                        <Save className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setIsEditingPeriodName(false)} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white" title="Annulla" aria-label="Annulla">
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={startEditingPeriodName}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors"
                      title="Rinomina il tempo"
                      aria-label="Rinomina il tempo"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={openDeletePeriodModal}
                    className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
                    title="Elimina questo tempo"
                    aria-label="Elimina questo tempo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Lista giocatori condivisa tra tutti i tempi */}
          <div className="space-y-3 transition-all">
            {renderTeamPlayers(0, showTeam0Players, setShowTeam0Players, color0)}
            {renderTeamPlayers(1, showTeam1Players, setShowTeam1Players, color1)}
          </div>
        </div>
      </div>

      {(event.timeline && event.timeline.length > 0) && (
        <div className="mt-3 bg-slate-800/80 rounded-xl p-4 border border-slate-700 max-h-48 overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" /> Cronologia Eventi
          </h3>
          <div className="space-y-2">
            {event.timeline.map(log => {
              const renderGoalLog = () => {
                const template = log.customTemplate;
                if (template) {
                  const parts = template.split('<giocatore>');
                  return (
                    <span>
                      {parts.map((part, index) => (
                        <React.Fragment key={index}>
                          {part}
                          {index < parts.length - 1 && (
                            <span className="font-bold text-white">{log.playerName}</span>
                          )}
                        </React.Fragment>
                      ))} ⚽
                      {log.periodName && <span className="text-slate-500 text-xs"> ({log.periodName})</span>}
                    </span>
                  );
                }

                if (log.customMessage && log.playerName) {
                  const parts = log.customMessage.split(log.playerName);
                  return (
                    <span>
                      {parts.map((part, index) => (
                        <React.Fragment key={index}>
                          {part}
                          {index < parts.length - 1 && (
                            <span className="font-bold text-white">{log.playerName}</span>
                          )}
                        </React.Fragment>
                      ))} ⚽
                      {log.periodName && <span className="text-slate-500 text-xs"> ({log.periodName})</span>}
                    </span>
                  );
                }

                return (
                  <span>
                    <span className="font-bold text-white">{log.playerName}</span> ha segnato per{' '}
                    <span style={{ color: log.teamName === event.teams[0].name ? color0 : color1 }}>{log.teamName}</span> ⚽
                    {log.periodName && <span className="text-slate-500 text-xs"> ({log.periodName})</span>}
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
                      <span>
                        ❌ A <span className="font-bold text-white">{log.playerName}</span> è stato annullato il gol
                        {log.periodName && <span className="text-slate-500 text-xs"> ({log.periodName})</span>}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
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
            <span className="text-slate-400">{isLive ? 'Chiudi quando finito' : 'Correzioni necessarie?'}</span>
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

      <EditPlayerModal
        isOpen={editPlayerModal.isOpen}
        playerName={editPlayerName}
        jersey={editPlayerJersey}
        setPlayerName={setEditPlayerName}
        setJersey={setEditPlayerJersey}
        onClose={closeEditPlayerModal}
        onConfirm={handleEditPlayerSave}
        onDelete={handleDeletePlayerFromEdit}
      />

      <DeletePlayerModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, teamIndex: null, playerId: null, playerName: '' })}
        playerName={deleteConfirmModal.playerName}
        onConfirm={executeRemovePlayer}
      />

      {showEmojiModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setShowEmojiModal(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smile className="w-5 h-5 text-emerald-400" /> Reazioni pubblico
              </h3>
              <button
                type="button"
                onClick={() => setShowEmojiModal(false)}
                className="text-slate-500 hover:text-white"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid w-fit grid-cols-5 gap-x-1.5 gap-y-3 justify-items-center mx-auto">
              {EMOJI_LIST.map((emoji, index) => (
                <ReactionButton
                  key={emoji}
                  emoji={emoji}
                  index={index}
                  count={event.reactions?.[emoji] || 0}
                  animateOnCountChange={false}
                  onClick={() => {
                    addEmojiReaction(event.id, emoji).catch(error => {
                      console.warn('Impossibile registrare la reazione:', error);
                    });
                    setShowEmojiModal(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mantiene attiva l'animazione anche dopo che la modale emoji è stata chiusa. */}
      {EMOJI_LIST.map((emoji, index) => (
        <ReactionBurst
          key={emoji}
          emoji={emoji}
          index={index}
          count={event.reactions?.[emoji] || 0}
        />
      ))}

      {isDeletePeriodModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={closeDeletePeriodModal}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative text-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeDeletePeriodModal}
              disabled={isDeletingPeriod}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors disabled:opacity-40"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Elimina tempo</h3>
            <p className="text-xs text-slate-400 mb-4">
              Stai per eliminare <span className="font-bold text-slate-200">“{selectedPeriod?.name}”</span> e tutti i gol associati.
              Inserisci la password admin per confermare.
            </p>

            <form onSubmit={confirmDeletePeriod} className="space-y-4">
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={periodDeletePassword}
                  onChange={e => {
                    setPeriodDeletePassword(e.target.value);
                    setPeriodDeleteError('');
                  }}
                  placeholder="Password di sistema"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-center text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                  autoFocus
                  required
                />
              </div>

              {periodDeleteError && (
                <p className="text-red-400 text-xs font-semibold animate-in fade-in">{periodDeleteError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDeletePeriodModal}
                  disabled={isDeletingPeriod}
                  className="flex-1 py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isDeletingPeriod || !periodDeletePassword.trim()}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/25 transition-all disabled:opacity-50"
                >
                  {isDeletingPeriod ? 'Eliminazione...' : 'Elimina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

export default EventView;
