"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Chess, type Square } from "chess.js";
import { useStockfish } from "@/lib/useStockfish";
import { capturedFromFen, glyph, pairMoves } from "@/lib/chess-helpers";

const Chessboard = dynamic(() => import("react-chessboard").then(m => m.Chessboard), {
  ssr: false,
});

type Side = "white" | "black";

const LEVELS = [
  { skill: 0, movetimeMs: 200, label: "Iniciante" },
  { skill: 3, movetimeMs: 300, label: "Casual" },
  { skill: 6, movetimeMs: 500, label: "Clube fraco" },
  { skill: 10, movetimeMs: 800, label: "Clube médio" },
  { skill: 14, movetimeMs: 1200, label: "Forte" },
  { skill: 20, movetimeMs: 2000, label: "Mestre" },
];

const STORAGE_KEY = "chess-arena:settings";

function statusOf(game: Chess): string {
  if (game.isCheckmate()) return `Xeque-mate — ${game.turn() === "w" ? "pretas" : "brancas"} venceram`;
  if (game.isStalemate()) return "Empate por afogamento";
  if (game.isThreefoldRepetition()) return "Empate por repetição";
  if (game.isInsufficientMaterial()) return "Empate por material insuficiente";
  if (game.isDraw()) return "Empate";
  if (game.isCheck()) return `Xeque — vez das ${game.turn() === "w" ? "brancas" : "pretas"}`;
  return `Vez das ${game.turn() === "w" ? "brancas" : "pretas"}`;
}

function formatEval(ev: { type: "cp" | "mate"; value: number; whitePerspective: number } | null): string {
  if (!ev) return "—";
  if (ev.type === "mate") {
    const v = ev.value;
    return v > 0 ? `M${v}` : `−M${-v}`;
  }
  const wp = ev.whitePerspective / 100;
  const sign = wp > 0 ? "+" : "";
  return `${sign}${wp.toFixed(2)}`;
}

function evalBarHeight(ev: { type: "cp" | "mate"; value: number; whitePerspective: number } | null): number {
  if (!ev) return 50;
  if (ev.type === "mate") return ev.whitePerspective > 0 ? 100 : 0;
  const cp = ev.whitePerspective;
  const clamped = Math.max(-1000, Math.min(1000, cp));
  return 50 + (clamped / 1000) * 45;
}

export default function ChessGame() {
  const [history, setHistory] = useState<string[]>([]);
  const [side, setSide] = useState<Side>("white");
  const [levelIdx, setLevelIdx] = useState(2);
  const [copied, setCopied] = useState<"" | "fen" | "pgn">("");
  const engineMoveLock = useRef(false);

  const { status: engineStatus, evaluation, findMove, resetEvaluation } = useStockfish();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as { side?: Side; levelIdx?: number };
      if (s.side === "white" || s.side === "black") setSide(s.side);
      if (typeof s.levelIdx === "number" && s.levelIdx >= 0 && s.levelIdx < LEVELS.length) {
        setLevelIdx(s.levelIdx);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ side, levelIdx }));
    } catch { /* ignore */ }
  }, [side, levelIdx]);

  const game = useMemo(() => {
    const g = new Chess();
    for (const san of history) {
      try { g.move(san); } catch { /* skip invalid replay */ }
    }
    return g;
  }, [history]);

  const fen = game.fen();
  const pgn = game.pgn();
  const playerColor = side === "white" ? "w" : "b";
  const isPlayerTurn = game.turn() === playerColor;
  const gameOver = game.isGameOver();

  useEffect(() => {
    if (gameOver) return;
    if (engineStatus !== "ready") return;
    if (isPlayerTurn) return;
    if (engineMoveLock.current) return;
    engineMoveLock.current = true;

    const level = LEVELS[levelIdx];
    findMove(fen, { skill: level.skill, movetimeMs: level.movetimeMs })
      .then(move => {
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
      })
      .finally(() => {
        engineMoveLock.current = false;
      });
  }, [fen, isPlayerTurn, engineStatus, gameOver, levelIdx, findMove]);

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
        setHistory(h => [...h, move.san]);
        return true;
      } catch {
        return false;
      }
    },
    [game, isPlayerTurn, gameOver]
  );

  const undo = () => {
    setHistory(h => {
      if (h.length === 0) return h;
      const popN = h.length >= 2 ? 2 : 1;
      return h.slice(0, h.length - popN);
    });
  };

  const reset = () => {
    setHistory([]);
    resetEvaluation();
    engineMoveLock.current = false;
  };

  const flipSide = () => {
    setSide(s => (s === "white" ? "black" : "white"));
    setHistory([]);
    resetEvaluation();
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

  const status = statusOf(game);
  const engineLabel = {
    loading: "Carregando engine…",
    ready: "Engine pronta",
    thinking: "Pensando…",
    error: "Erro ao carregar engine",
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
            aria-label="Avaliação do engine"
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
            title="Troca de lado e reinicia"
          >
            Jogar de {side === "white" ? "pretas" : "brancas"}
          </button>
          <button
            onClick={undo}
            disabled={history.length === 0 || engineStatus === "thinking"}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700 disabled:opacity-40"
          >
            Desfazer
          </button>
          <button
            onClick={reset}
            className="rounded-md bg-rose-900/60 px-3 py-1.5 text-sm hover:bg-rose-900"
          >
            Reiniciar
          </button>
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <section className="rounded-xl bg-zinc-900/50 p-4 ring-1 ring-zinc-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm uppercase tracking-wider text-zinc-400">Estado</div>
              <div className="mt-1 text-lg font-medium">{status}</div>
              {lastMove && (
                <div className="mt-1 text-sm text-zinc-400">
                  Última: <span className="font-mono text-zinc-200">{lastMove}</span>
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
          <div className="mt-3 md:hidden text-xs text-zinc-400">
            Avaliação: <span className="font-mono text-zinc-200">{evalText}</span>
          </div>
        </section>

        <section className="rounded-xl bg-zinc-900/50 p-4 ring-1 ring-zinc-800">
          <div className="text-sm uppercase tracking-wider text-zinc-400">Dificuldade</div>
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
                {l.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Skill 0 erra de propósito. Skill 20 é força total do Stockfish lite.
          </p>
        </section>

        <section className="rounded-xl bg-zinc-900/50 p-4 ring-1 ring-zinc-800">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm uppercase tracking-wider text-zinc-400">Jogadas</div>
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
            <div className="text-xs text-zinc-500">Sem jogadas ainda.</div>
          ) : (
            <ol className="max-h-72 space-y-0.5 overflow-auto font-mono text-sm">
              {moveRows.map(r => (
                <li key={r.num} className="grid grid-cols-[2rem_1fr_1fr] gap-2 rounded px-1 py-0.5 hover:bg-zinc-800/50">
                  <span className="text-zinc-500">{r.num}.</span>
                  <span className="text-zinc-200">{r.white}</span>
                  <span className="text-zinc-300">{r.black ?? ""}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </aside>
    </div>
  );
}
