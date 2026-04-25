const PIECE_GLYPH: Record<string, string> = {
  P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕", K: "♔",
  p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
};

const PIECE_VALUE: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9,
};

export function glyph(piece: string): string {
  return PIECE_GLYPH[piece] ?? piece;
}

export type Captured = { whiteCaptured: string[]; blackCaptured: string[]; materialDiff: number };

export function capturedFromFen(fen: string): Captured {
  const board = fen.split(" ")[0] ?? "";
  const counts: Record<string, number> = {};
  for (const c of board) {
    if (/[PNBRQKpnbrqk]/.test(c)) counts[c] = (counts[c] ?? 0) + 1;
  }
  const initial: Record<string, number> = {
    P: 8, N: 2, B: 2, R: 2, Q: 1,
    p: 8, n: 2, b: 2, r: 2, q: 1,
  };
  const whiteLost: string[] = [];
  const blackLost: string[] = [];
  let diff = 0;
  for (const k of ["P", "N", "B", "R", "Q"] as const) {
    const lost = initial[k] - (counts[k] ?? 0);
    for (let i = 0; i < lost; i++) {
      whiteLost.push(k);
      diff -= PIECE_VALUE[k.toLowerCase()];
    }
  }
  for (const k of ["p", "n", "b", "r", "q"] as const) {
    const lost = initial[k] - (counts[k] ?? 0);
    for (let i = 0; i < lost; i++) {
      blackLost.push(k);
      diff += PIECE_VALUE[k];
    }
  }
  return {
    blackCaptured: whiteLost,
    whiteCaptured: blackLost,
    materialDiff: diff,
  };
}

export function pairMoves(history: string[]): { num: number; white: string; black?: string }[] {
  const out: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    out.push({ num: i / 2 + 1, white: history[i], black: history[i + 1] });
  }
  return out;
}
