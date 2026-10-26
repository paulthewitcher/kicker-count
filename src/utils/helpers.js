export const getTeamScore = (team) => {
  const baseScore = team?.players ? team.players.reduce((acc, p) => acc + (p.goals || 0), 0) : 0;
  return baseScore + (team?.scoreOffset || 0);
};

export const getSortedPlayers = (players) => {
  return [...(players || [])].sort((a, b) => (b.goals || 0) - (a.goals || 0));
};

export const formatTimestamp = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};