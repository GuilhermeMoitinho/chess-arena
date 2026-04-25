export type Locale = "pt" | "en" | "es";

export const LOCALES: Locale[] = ["pt", "en", "es"];

export const LOCALE_LABEL: Record<Locale, string> = {
  pt: "PT",
  en: "EN",
  es: "ES",
};

export const HTML_LANG: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en",
  es: "es",
};

type Side = "white" | "black";

export type Dict = {
  tagline: string;
  github: string;
  state: string;
  difficulty: string;
  moves: string;
  noMoves: string;
  last: string;
  evalShort: string;
  flipTo: (sideLabel: string) => string;
  white: string;
  black: string;
  whitesWon: string;
  blacksWon: string;
  whitesTurn: string;
  blacksTurn: string;
  undo: string;
  reset: string;
  engineLoading: string;
  engineReady: string;
  engineThinking: string;
  engineError: string;
  yourName: string;
  yourNamePlaceholder: string;
  settings: string;
  coachMode: string;
  coachHint: string;
  lastMove: string;
  classBest: string;
  classGood: string;
  classInaccuracy: string;
  classMistake: string;
  classBlunder: string;
  checkmate: (winnerLabel: string) => string;
  stalemate: string;
  threefold: string;
  insufficient: string;
  draw: string;
  check: (turnLabel: string) => string;
  turn: (turnLabel: string) => string;
  skillNote: string;
  level: {
    initiate: string;
    casual: string;
    clubLow: string;
    clubMid: string;
    strong: string;
    master: string;
  };
};

const pt: Dict = {
  tagline: "Stockfish roda no seu navegador. Sem login, sem servidor, sem rastro.",
  github: "GitHub →",
  state: "Estado",
  difficulty: "Dificuldade",
  moves: "Jogadas",
  noMoves: "Sem jogadas ainda.",
  last: "Última",
  evalShort: "Avaliação",
  flipTo: s => `Jogar de ${s}`,
  white: "brancas",
  black: "pretas",
  whitesWon: "brancas venceram",
  blacksWon: "pretas venceram",
  whitesTurn: "brancas",
  blacksTurn: "pretas",
  undo: "Desfazer",
  reset: "Reiniciar",
  engineLoading: "Carregando engine…",
  engineReady: "Engine pronta",
  engineThinking: "Pensando…",
  engineError: "Erro ao carregar engine",
  yourName: "Seu nome",
  yourNamePlaceholder: "Você",
  settings: "Você & Coach",
  coachMode: "Modo Coach",
  coachHint: "Classifica cada jogada sua em tempo real (Stockfish skill 20).",
  lastMove: "Sua última jogada",
  classBest: "Melhor",
  classGood: "Boa",
  classInaccuracy: "Imprecisão",
  classMistake: "Erro",
  classBlunder: "Blunder",
  checkmate: w => `Xeque-mate — ${w}`,
  stalemate: "Empate por afogamento",
  threefold: "Empate por repetição",
  insufficient: "Empate por material insuficiente",
  draw: "Empate",
  check: t => `Xeque — vez das ${t}`,
  turn: t => `Vez das ${t}`,
  skillNote: "Skill 0 erra de propósito. Skill 20 é força total do Stockfish lite.",
  level: {
    initiate: "Iniciante",
    casual: "Casual",
    clubLow: "Clube fraco",
    clubMid: "Clube médio",
    strong: "Forte",
    master: "Mestre",
  },
};

const en: Dict = {
  tagline: "Stockfish runs in your browser. No login, no server, no tracking.",
  github: "GitHub →",
  state: "Status",
  difficulty: "Difficulty",
  moves: "Moves",
  noMoves: "No moves yet.",
  last: "Last",
  evalShort: "Eval",
  flipTo: s => `Play as ${s}`,
  white: "white",
  black: "black",
  whitesWon: "white wins",
  blacksWon: "black wins",
  whitesTurn: "white",
  blacksTurn: "black",
  undo: "Undo",
  reset: "Reset",
  engineLoading: "Loading engine…",
  engineReady: "Engine ready",
  engineThinking: "Thinking…",
  engineError: "Failed to load engine",
  yourName: "Your name",
  yourNamePlaceholder: "You",
  settings: "You & Coach",
  coachMode: "Coach mode",
  coachHint: "Classifies each of your moves in real time (Stockfish skill 20).",
  lastMove: "Your last move",
  classBest: "Best",
  classGood: "Good",
  classInaccuracy: "Inaccuracy",
  classMistake: "Mistake",
  classBlunder: "Blunder",
  checkmate: w => `Checkmate — ${w}`,
  stalemate: "Stalemate",
  threefold: "Draw by repetition",
  insufficient: "Draw by insufficient material",
  draw: "Draw",
  check: t => `Check — ${t} to move`,
  turn: t => `${t} to move`,
  skillNote: "Skill 0 plays randomly. Skill 20 is full Stockfish lite strength.",
  level: {
    initiate: "Beginner",
    casual: "Casual",
    clubLow: "Weak club",
    clubMid: "Mid club",
    strong: "Strong",
    master: "Master",
  },
};

const es: Dict = {
  tagline: "Stockfish corre en tu navegador. Sin login, sin servidor, sin rastreo.",
  github: "GitHub →",
  state: "Estado",
  difficulty: "Dificultad",
  moves: "Jugadas",
  noMoves: "Sin jugadas todavía.",
  last: "Última",
  evalShort: "Evaluación",
  flipTo: s => `Jugar con ${s}`,
  white: "blancas",
  black: "negras",
  whitesWon: "ganan las blancas",
  blacksWon: "ganan las negras",
  whitesTurn: "blancas",
  blacksTurn: "negras",
  undo: "Deshacer",
  reset: "Reiniciar",
  engineLoading: "Cargando motor…",
  engineReady: "Motor listo",
  engineThinking: "Pensando…",
  engineError: "Error al cargar el motor",
  yourName: "Tu nombre",
  yourNamePlaceholder: "Tú",
  settings: "Tú & Coach",
  coachMode: "Modo Coach",
  coachHint: "Clasifica cada jugada tuya en tiempo real (Stockfish skill 20).",
  lastMove: "Tu última jugada",
  classBest: "Mejor",
  classGood: "Buena",
  classInaccuracy: "Imprecisión",
  classMistake: "Error",
  classBlunder: "Blunder",
  checkmate: w => `Jaque mate — ${w}`,
  stalemate: "Tablas por ahogado",
  threefold: "Tablas por repetición",
  insufficient: "Tablas por material insuficiente",
  draw: "Tablas",
  check: t => `Jaque — turno de las ${t}`,
  turn: t => `Turno de las ${t}`,
  skillNote: "Skill 0 juega al azar. Skill 20 es la fuerza máxima de Stockfish lite.",
  level: {
    initiate: "Principiante",
    casual: "Casual",
    clubLow: "Club débil",
    clubMid: "Club medio",
    strong: "Fuerte",
    master: "Maestro",
  },
};

export const DICTS: Record<Locale, Dict> = { pt, en, es };

export function detectLocale(navLang: string | undefined): Locale {
  const l = (navLang ?? "").toLowerCase();
  if (l.startsWith("pt")) return "pt";
  if (l.startsWith("es")) return "es";
  return "en";
}

export function sideLabel(d: Dict, side: Side): string {
  return side === "white" ? d.white : d.black;
}
