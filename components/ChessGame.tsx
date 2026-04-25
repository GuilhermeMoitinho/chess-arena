"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Chess, type Square } from "chess.js";
import { useStockfish, type Evaluation } from "@/lib/useStockfish";
import { capturedFromFen, glyph, pairMoves } from "@/lib/chess-helpers";
import { useI18n } from "@/lib/i18n-context";
import {
  classifyPlayerMove,
  classLabel,
  CLASS_TONE,
  CLASS_TONE_INLINE,
  type MoveClass,
} from "@/lib/coach";
import type { Dict } from "@/lib/i18n";

const Chessboard = dynamic(() => import("react-chessboard").then(m => m.Chessboard), {
  ssr: false,
});

type Side = "white" | "black";

const LEVELS = [
  { skill: 0, movetimeMs: 200, key: "initiate" as const },
  { skill: 3, movetimeMs: 300, key: "casual" as const },
  { skill: 6, movetimeMs: 500, key: "clubLow" as const },
  { skill: 10, movetimeMs: 800, key: "clubMid" as const },
  { skill: 14, movetimeMs: 1200, key: "strong" as const },
  { skill: 20, movetimeMs: 2000, key: "master" as const },
];

const STORAGE_KEY = "chess-arena:settings";
const COACH_MOVETIME_MS = 350;

function statusOf(game: Chess, t: Dict): string {
  if (game.isCheckmate()) {
    return t.checkmate(game.turn() === "w" ? t.blacksWon : t.whitesWon);
  }
  if (game.isStalemate()) return t.stalemate;
  if (game.isThreefoldRepetition()) return t.threefold;
  if (game.isInsufficientMaterial()) return t.insufficient;
  if (game.isDraw()) return t.draw;
  if (game.isCheck()) return t.check(game.turn() === "w" ? t.whitesTurn : t.blacksTurn);
  return t.turn(game.turn() === "w" ? t.whitesTurn : t.blacksTurn);
}

function formatEval(ev: Evaluation | null): string {
  if (!ev) return "—";
  if (ev.type === "mate") {
    const v = ev.value;
    return v > 0 ? `M${v}` : `−M${-v}`;
  }
  const wp = ev.whitePerspective / 100;
  const sign = wp > 0 ? "+" : "";
  return `${sign}${wp.toFixed(2)}`;
}

function evalBarHeight(ev: Evaluation | null): number {
  if (!ev) return 50;
  if (ev.type === "mate") return ev.whitePerspective > 0 ? 100 : 0;
  const cp = ev.whitePerspective;
  const clamped = Math.max(-1000, Math.min(1000, cp));
  return 50 + (clamped / 1000) * 45;
}

function isPlayerMoveIndex(idx: number, side: Side): boolean {
  return side === "white" ? idx % 2 === 0 : idx % 2 === 1;
}

export default function ChessGame() {
  const { t } = useI18n();

  const [history, setHistory] = useState<string[]>([]);
  const [classifications, setClassifications] = useState<(MoveClass | null)[]>([]);
  const [side, setSide] = useState<Side>("white");
  const [levelIdx, setLevelIdx] = useState(2);
  const [playerName, setPlayerName] = useState("");
  const [coach, setCoach] = useState(true);
  const [copied, setCopied] = useState<"" | "fen" | "pgn">("");
  const engineMoveLock = useRef(false);
  const evalBeforeRef = useRef<Evaluation | null>(null);

  const { status: engineStatus, evaluation, findMove, analyze, resetEvaluation } = useStockfish();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as {
        side?: Side;
        levelIdx?: number;
        playerName?: string;
        coach?: boolean;
      };
      if (s.side === "white" || s.side === "black") setSide(s.side);
      if (typeof s.levelIdx === "number" && s.levelIdx >= 0 && s.levelIdx < LEVELS.length) {
        setLevelIdx(s.levelIdx);
      }
      if (typeof s.playerName === "string") setPlayerName(s.playerName.slice(0, 40));
      if (typeof s.coach === "boolean") setCoach(s.coach);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ side, levelIdx, playerName, coach })
      );
    } catch { /* ignore */ }
  }, [side, levelIdx, playerName, coach]);

  const engineName = useMemo(() => `Stockfish 18 — ${t.level[LEVELS[levelIdx].key]}`, [levelIdx, t]);

  const game = useMemo(() => {
    const g = new Chess();
    for (const san of history) {
      try { g.move(san); } catch { /* skip invalid replay */ }
    }
    g.setHeader("Event", "Chess Arena");
    g.setHeader("Site", "chess-arena.vercel.app");
    g.setHeader("Date", new Date().toISOString().slice(0, 10).replace(/-/g, "."));
    const me = playerName.trim() || "Player";
    g.setHeader("White", side === "white" ? me : engineName);
    g.setHeader("Black", side === "black" ? me : engineName);
    return g;
  }, [history, playerName, side, engineName]);

  const fen = game.fen();
  const pgn = game.pgn();
  const playerColor = side === "white" ? "w" : "b";
  const isPlayerTurn = game.turn() === playerColor;
  const gameOver = game.isGameOver();

  useEffect(() => {
    if (gameOver) return;
    if (engineStatus === "loading" || engineStatus === "error") return;
    if (engineStatus === "thinking") return;
    if (isPlayerTurn) return;
    if (engineMoveLock.current) return;
    engineMoveLock.current = true;

    const run = async () => {
      try {
        if (coach && history.length > 0) {
          const lastIdx = history.length - 1;
          if (isPlayerMoveIndex(lastIdx, side)) {
            let before = evalBeforeRef.current;
            if (!before) {
              const prev = new Chess();
              for (const san of history.slice(0, -1)) {
                try { prev.move(san); } catch { /* skip */ }
              }
              before = await analyze(prev.fen(), 220);
            }
            const after = await analyze(fen, COACH_MOVETIME_MS);
            if (before && after) {
              const cls = classifyPlayerMove(before, after, side);
              setClassifications(prev => {
                const out = prev.slice();
                out[lastIdx] = cls;
                return out;
              });
            }
            evalBeforeRef.current = null;
          }
        }

        const level = LEVELS[levelIdx];
        const move = await findMove(fen, { skill: level.skill, movetimeMs: level.movetimeMs });
        if (!move) return;
        setHistory(h => {
          const replay = new Chess();
          for (const san of h) {
            try { replay.move(san); } catch { /* skip */ }
          }
          try {
            const m = replay.move({
              from: move.from as Square,
              to: move.to as Square,
              promotion: (move.promotion as "q" | "r" | "b" | "n" | undefined) ?? "q",
            });
            return m ? [...h, m.san] : h;
          } catch {
            return h;
          }
        });
        setClassifications(prev => [...prev, null]);
      } finally {
        engineMoveLock.current = false;
      }
    };
    run();
  }, [fen, isPlayerTurn, engineStatus, gameOver, levelIdx, findMove, analyze, coach, history, side]);

  const onPieceDrop = useCallback(
    (source: string, target: string, piece: string) => {
      if (!isPlayerTurn || gameOver) return false;
      const g = new Chess(game.fen());
      try {
        const move = g.move({
          from: source as Square,
          to: target as Square,
          promotion: piece[1]?.toLowerCase() === "p" ? "q" : undefined,
        });
        if (!move) return false;
        evalBeforeRef.current = evaluation;
        setHistory(h => [...h, move.san]);
        setClassifications(c => [...c, null]);
        return true;
      } catch {
        return false;
      }
    },
    [game, isPlayerTurn, gameOver, evaluation]
  );

  const undo = () => {
    setHistory(h => {
      if (h.length === 0) return h;
      const popN = h.length >= 2 ? 2 : 1;
      return h.slice(0, h.length - popN);
    });
    setClassifications(c => {
      if (c.length === 0) return c;
      const popN = c.length >= 2 ? 2 : 1;
      return c.slice(0, c.length - popN);
    });
    evalBeforeRef.current = null;
  };

  const reset = () => {
    setHistory([]);
    setClassifications([]);
    resetEvaluation();
    evalBeforeRef.current = null;
    engineMoveLock.current = false;
  };

  const flipSide = () => {
    setSide(s => (s === "white" ? "black" : "white"));
    setHistory([]);
    setClassifications([]);
    resetEvaluation();
    evalBeforeRef.current = null;
    engineMoveLock.current = false;
  };

  const copy = async (text: string, kind: "fen" | "pgn") => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(""), 1200);
  };

  const captured = capturedFromFen(fen);
  const moveRows = pairMoves(history);
  const lastMove = history[history.length - 1];
  const lastPlayerClass = useMemo<MoveClass | null>(() => {
    for (let i = classifications.length - 1; i >= 0; i--) {
      if (isPlayerMoveIndex(i, side) && classifications[i]) return classifications[i] as MoveClass;
    }
    return null;
  }, [classifications, side]);

  const status = statusOf(game, t);
  const engineLabel = {
    loading: t.engineLoading,
    ready: t.engineReady,
    thinking: t.engineThinking,
    error: t.engineError,
  }[engineStatus];

  const evalText = formatEval(evaluation);
  const evalPct = evalBarHeight(evaluation);

  return (
    <div className="grid gap-6 md:grid-cols-[auto_minmax(320px,560px)_1fr]">
      <div className="hidden md:flex flex-col items-center justify-start">
        <div className="relative h-[560px] w-6 overflow-hidden rounded-md bg-zinc-700 ring-1 ring-zinc-800">
          <div
            className="absolute inset-x-0 bottom-0 bg-zinc-50 transition-[height] duration-300"
            style={{ height: `${evalPct}%` }}
            aria-label={t.evalShort}
          />
          <div className="absolute inset-x-0 top-1/2 h-px bg-rose-400/60" />
        </div>
        <div className="mt-2 w-12 text-center text-xs font-mono text-zinc-300">{evalText}</div>
      </div>

      <div className="rounded-xl bg-zinc-900/50 p-3 ring-1 ring-zinc-800">
        <div className="mb-2 flex items-center gap-1 text-base">
          {captured.whiteCaptured.map((p, i) => (
            <span key={`wc-${i}`} className="text-zinc-300">{glyph(p)}</span>
          ))}
          {captured.materialDiff > 0 && (
            <span className="ml-2 text-xs text-emerald-400">+{captured.materialDiff}</span>
          )}
        </div>

        <Chessboard
          position={fen}
          onPieceDrop={onPieceDrop}
          boardOrientation={side}
          customBoardStyle={{ borderRadius: 8 }}
          customDarkSquareStyle={{ backgroundColor: "#b58863" }}
          customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
          arePiecesDraggable={isPlayerTurn && !gameOver && engineStatus !== "loading"}
        />

        <div className="mt-2 flex items-center gap-1 text-base">
          {captured.blackCaptured.map((p, i) => (
            <span key={`bc-${i}`} className="text-zinc-300">{glyph(p)}</span>
          ))}
          {captured.materialDiff < 0 && (
            <span className="ml-2 text-xs text-emerald-400">+{-captured.materialDiff}</span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={flipSide}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700"
          >
            {t.flipTo(side === "white" ? t.black : t.white)}
          </button>
          <button
            onClick={undo}
            disabled={history.length === 0 || engineStatus === "thinking"}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700 disabled:opacity-40"
          >
            {t.undo}
          </button>
          <button
            onClick={reset}
            className="rounded-md bg-rose-900/60 px-3 py-1.5 text-sm hover:bg-rose-900"
          >
            {t.reset}
          </button>
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <section className="rounded-xl bg-zinc-900/50 p-4 ring-1 ring-zinc-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm uppercase tracking-wider text-zinc-400">{t.state}</div>
              <div className="mt-1 text-lg font-medium">{status}</div>
              {lastMove && (
                <div className="mt-1 text-sm text-zinc-400">
                  {t.last}: <span className="font-mono text-zinc-200">{lastMove}</span>
                </div>
              )}
            </div>
            <span
              className={
                "shrink-0 rounded-full px-2 py-0.5 text-xs " +
                (engineStatus === "thinking"
                  ? "bg-amber-900/60 text-amber-200"
                  : engineStatus === "ready"
                  ? "bg-emerald-900/60 text-emerald-200"
                  : engineStatus === "error"
                  ? "bg-rose-900/60 text-rose-200"
                  : "bg-zinc-800 text-zinc-300")
              }
            >
              {engineLabel}
            </span>
          </div>
          {coach && lastPlayerClass && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-zinc-400">{t.lastMove}:</span>
              <span className={"rounded-md px-2 py-0.5 font-medium " + CLASS_TONE[lastPlayerClass]}>
                {classLabel(t, lastPlayerClass)}
              </span>
            </div>
          )}
          <div className="mt-3 md:hidden text-xs text-zinc-400">
            {t.evalShort}: <span className="font-mono text-zinc-200">{evalText}</span>
          </div>
        </section>

        <section className="rounded-xl bg-zinc-900/50 p-4 ring-1 ring-zinc-800">
          <div className="text-sm uppercase tracking-wider text-zinc-400">{t.settings}</div>
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="text-xs text-zinc-400">{t.yourName}</span>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value.slice(0, 40))}
                placeholder={t.yourNamePlaceholder}
                maxLength={40}
                className="mt-1 w-full rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 ring-1 ring-zinc-700 outline-none focus:ring-emerald-600"
              />
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={coach}
                onChange={e => setCoach(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-emerald-600"
              />
              <span className="text-sm">
                <span className="font-medium">{t.coachMode}</span>
                <span className="block text-xs text-zinc-400">{t.coachHint}</span>
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-xl bg-zinc-900/50 p-4 ring-1 ring-zinc-800">
          <div className="text-sm uppercase tracking-wider text-zinc-400">{t.difficulty}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {LEVELS.map((l, i) => (
              <button
                key={l.skill}
                onClick={() => setLevelIdx(i)}
                className={
                  "rounded-md px-3 py-1.5 text-xs " +
                  (i === levelIdx
                    ? "bg-emerald-700 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700")
                }
              >
                {t.level[l.key]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">{t.skillNote}</p>
        </section>

        <section className="rounded-xl bg-zinc-900/50 p-4 ring-1 ring-zinc-800">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm uppercase tracking-wider text-zinc-400">{t.moves}</div>
            <div className="flex gap-2">
              <button
                onClick={() => copy(fen, "fen")}
                className="rounded-md bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700"
              >
                {copied === "fen" ? "✓ FEN" : "FEN"}
              </button>
              <button
                onClick={() => copy(pgn, "pgn")}
                disabled={!pgn}
                className="rounded-md bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700 disabled:opacity-40"
              >
                {copied === "pgn" ? "✓ PGN" : "PGN"}
              </button>
            </div>
          </div>
          {moveRows.length === 0 ? (
            <div className="text-xs text-zinc-500">{t.noMoves}</div>
          ) : (
            <ol className="max-h-72 space-y-0.5 overflow-auto font-mono text-sm">
              {moveRows.map(r => {
                const wIdx = (r.num - 1) * 2;
                const bIdx = wIdx + 1;
                const wCls = classifications[wIdx];
                const bCls = classifications[bIdx];
                const wTone = wCls && isPlayerMoveIndex(wIdx, side) ? CLASS_TONE_INLINE[wCls] : "text-zinc-200";
                const bTone = bCls && isPlayerMoveIndex(bIdx, side) ? CLASS_TONE_INLINE[bCls] : "text-zinc-300";
                return (
                  <li key={r.num} className="grid grid-cols-[2rem_1fr_1fr] gap-2 rounded px-1 py-0.5 hover:bg-zinc-800/50">
                    <span className="text-zinc-500">{r.num}.</span>
                    <span className={wTone}>
                      {r.white}
                      {wCls && isPlayerMoveIndex(wIdx, side) && (
                        <span className="ml-1 text-[10px] uppercase opacity-80">· {classLabel(t, wCls)}</span>
                      )}
                    </span>
                    <span className={bTone}>
                      {r.black ?? ""}
                      {bCls && r.black && isPlayerMoveIndex(bIdx, side) && (
                        <span className="ml-1 text-[10px] uppercase opacity-80">· {classLabel(t, bCls)}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </aside>
    </div>
  );
}
