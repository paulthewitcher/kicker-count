export const TEAM_COLORS = [
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

export const EMOJI_LIST = ['⚽️', '👎', '👍', '🫶', '👏', '💪', '😃', '🤣', '🤩', '🥳', '🥶', '🤯', '😴', '🔥', '🍻', '🎉', '✨', '🌟', '⚡️', '🌈'];

// Pallino da usare nell'export WhatsApp in base al colore scelto per la squadra.
// Rosa e celeste utilizzano il cerchio cromaticamente più vicino disponibile.
export const ASSOCIAZIONE_COLORI = {
  '#174195': '🔵', // Blu
  '#feed00': '🟡', // Giallo
  '#ef4444': '🔴', // Rosso
  '#22c55e': '🟢', // Verde
  '#a855f7': '🟣', // Viola
  '#f97316': '🟠', // Arancione
  '#ec4899': '🟣', // Rosa
  '#0ea5e9': '🔵', // Celeste
  '#64748b': '🔘', // Grigio
  '#f8fafc': '⚪️'  // Bianco
};

export const getTeamColorEmoji = (color, fallback = '🔘') => {
  const normalizedColor = String(color || '').trim().toLowerCase();
  return ASSOCIAZIONE_COLORI[normalizedColor] || fallback;
};


export const OPERA_GOAL_TEMPLATES = [
  "Garra e classe pura: sblocca il match <giocatore>!",
  "Tiro... ed è rete! Splendido capolavoro di <giocatore>!",
  "Attenzione a <giocatore>... e c'è il gol! Una perla assoluta!",
  "Segna sempre lui, <giocatore> È una sentenza, niente da fare!",
  "Palla a <giocatore>, tiro, gol! Gol di <giocatore>!",
  "Parte il tiro... Rete! Sciabolata morbida pazzesca di <giocatore>!",
  "Gol di <giocatore>! Il cielo è azzurro sopra Berlino!",
  "Si gonfia la rete! Che gol pazzesco di <giocatore>!",
  "Super <giocatore>! Gol! Sempre lui, l'ha messa dentro!",
  "Mucchio selvaggio in area... sbroglia tutto <giocatore>! Rete!",
  "Ha spento la luce! Una giocata pazzesca di <giocatore>!",
  "Gol di <giocatore> ! Andiamo a Berlino, Beppe! Andiamo a Berlino!",
];